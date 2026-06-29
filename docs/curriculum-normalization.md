# Normalizacion Curricular — PlanificaIA Chile

## Diferencia entre codigo visual corto y codigo real D1

- **Codigo visual corto**: "OA 8", "OA 3", "OA 1". Usado solo para mostrar en UI.
- **Codigo real D1**: "LE02 OA 08", "CN04 OA 03", "TE01 OA 01". Usado para consultas a backend.

La funcion `extractShortObjectiveCode(code)` convierte "LE02 OA 08" -> "OA 8".
La funcion `resolveObjectiveRealCode(obj)` devuelve el codigo completo para backend.

## Como se mapean cursos

`curriculumMappingService.ts` contiene el mapa estatico:

| Label visible       | ID D1             |
|---------------------|-------------------|
| 1° basico           | course-1b         |
| 2° basico           | course-2b         |
| 3° basico           | course-3b         |
| 4° basico           | course-4b         |
| 5° basico           | course-5b         |
| 6° basico           | course-6b         |
| 7° basico           | course-7b         |
| 8° basico           | course-8b         |
| 1° medio            | course-1m         |
| 2° medio            | course-2m         |
| 3° medio            | course-3m         |
| 4° medio            | course-4m         |
| Sala Cuna           | course-sala-cuna  |
| Medio Menor         | course-medio-menor|
| Medio Mayor         | course-medio-mayor|
| Prekinder / NT1     | course-prekinder  |
| Kinder / NT2        | course-kinder     |

El endpoint `/api/objectives` tambien acepta busqueda flexible por nombre visible.

## Como se mapean asignaturas

El mapa en `curriculumMappingService.ts` asocia nombres visibles a IDs D1:

| ID D1                                  | Nombres visibles                          |
|----------------------------------------|-------------------------------------------|
| subject-lenguaje-y-comunicacion        | Lenguaje y Comunicacion                   |
| subject-matematica                     | Matematica                                |
| subject-ciencias-naturales             | Ciencias Naturales                        |
| subject-historia-geografia-y-...       | Historia, Geografia y Ciencias Sociales   |
| subject-tecnologia                     | Tecnologia                                |
| subject-artes-visuales                 | Artes Visuales                            |
| subject-musica                         | Musica                                    |
| subject-educacion-fisica-y-salud       | Educacion Fisica y Salud                  |
| subject-orientacion                    | Orientacion                               |
| subject-ingles-propuesta               | Ingles                                    |

La funcion `normalizeName()` normaliza acentos y mayusculas para match flexible.

## Como se cargan OA

1. El componente carga cursos desde `fetchCourses()` (D1)
2. El usuario selecciona nivel, curso, asignatura
3. Se llama `fetchObjectives({ course, subject })` que consulta `/api/objectives`
4. Los resultados se mezclan con `getOAs()` (datos locales de Prebasica)
5. Cada OA de D1 incluye campos: `id`, `code`, `official_text`, `course_id`, `subject_id`, `source_url`
6. El estado `selectedOA` es de tipo `RichCurriculumItem = CurriculumItem & D1CurriculumFields`

## Como se generan indicadores derivados

Endpoint: `POST /api/curriculum/generate-indicators`

Cuando un OA no tiene filas en `objective_indicators`:
1. Se muestra boton "Generar indicadores sugeridos"
2. Se llama al endpoint con `{ objectiveId, objectiveCode, objectiveText, course, subject, skill }`
3. El endpoint busca el OA en D1 (por id -> code -> codigo normalizado)
4. Si el OA existe: genera 3-5 indicadores via Gemini o deterministico, los persiste en D1
5. Si el OA no existe pero se envio `objectiveText`: genera indicadores temporales (`persisted: false`)
6. Los indicadores tienen `source_type = "derived"` y `source_name = "Indicador pedagogico derivado"`

## Como se evita afirmar que son oficiales

- `source_type` siempre es `"derived"` para indicadores auto-generados
- `source_name` siempre es `"Indicador pedagogico derivado"`
- El prompt de Gemini explicitamente dice "No mencionar que son oficiales"
- En UI se muestra badge "Derivado por IA"

## Como validar por PowerShell / CLI

```powershell
# Total OA por curso y asignatura
wrangler d1 execute planificaia-db --remote --command "SELECT course_id, subject_id, COUNT(*) FROM objectives GROUP BY course_id, subject_id;"

# OA con menos indicadores
wrangler d1 execute planificaia-db --remote --command "SELECT o.code, COUNT(i.id) FROM objectives o LEFT JOIN objective_indicators i ON i.objective_id = o.id GROUP BY o.code ORDER BY COUNT(i.id) ASC LIMIT 30;"

# Diagnostic endpoint
curl https://planificaia-chile.pages.dev/api/curriculum/diagnostics
```

## Arquitectura de archivos

```
src/services/curriculumMappingService.ts   # Mapeo estatico cursos/asignaturas
src/services/objectiveService.ts           # fetchObjectives, normalizeRow
src/services/curricularPlanningService.ts  # getCurricularContext, generateIndicators
functions/api/objectives.ts                # GET /api/objectives
functions/api/curriculum/context.ts        # GET /api/curriculum/context
functions/api/curriculum/generate-indicators.ts  # POST /api/curriculum/generate-indicators
functions/api/curriculum/diagnostics.ts    # GET /api/curriculum/diagnostics
scripts/curriculum/audit-curricular-coverage.mjs  # CLI audit script
```
