# Datos curriculares enriquecidos — PlanificaIA Chile

## Tablas nuevas (migración 005)

| Tabla | Propósito | Origen de datos |
|-------|-----------|----------------|
| `objective_indicators` | Indicadores de evaluación por OA | Derivados por IA o importados de fuente oficial |
| `textbook_references` | Referencias a textos escolares MINEDUC | Metadatos curriculares (pendiente validación) |
| `teacher_guide_references` | Sugerencias de guías docentes | Derivadas por IA o importadas de fuente oficial |
| `curricular_resource_links` | Enlaces a recursos pedagógicos asociados | Mixto: oficiales o derivados |
| `lesson_sequence_recommendations` | Recomendaciones de secuencia didáctica | Derivadas por heurística pedagógica |

## Columnas de metadata de origen

Las tablas incluyen columnas `source_type` y `source_name` (agregadas en migración 006) para identificar el origen:

| `source_type` | Significado |
|---------------|-------------|
| `official` | Dato proveniente de fuente oficial MINEDUC (Currículum Nacional, textos escolares, guías docentes oficiales) |
| `derived` | Dato generado por IA o algoritmo pedagógico, no revisado por MINEDUC |
| `metadata` | Referencia estructural, no contiene transcripción de contenido protegido |

## Cómo aplicar migraciones

```powershell
# 1. Crear tablas + columnas de metadata
wrangler d1 execute planificaia-db --file=migrations/005_curricular_enrichment.sql --remote
wrangler d1 execute planificaia-db --file=migrations/006_curricular_source_metadata.sql --remote

# 2. Poblar datos derivados (seed inicial)
wrangler d1 execute planificaia-db --file=migrations/seed_curricular_enrichment.sql --remote

# 3. Validar
wrangler d1 execute planificaia-db --remote --command "SELECT 'objective_indicators' AS tabla, COUNT(*) AS total FROM objective_indicators UNION ALL SELECT 'textbook_references', COUNT(*) FROM textbook_references UNION ALL SELECT 'teacher_guide_references', COUNT(*) FROM teacher_guide_references UNION ALL SELECT 'curricular_resource_links', COUNT(*) FROM curricular_resource_links UNION ALL SELECT 'lesson_sequence_recommendations', COUNT(*) FROM lesson_sequence_recommendations;"
```

## Jerarquía de datos

### 1. Dato oficial (source_type = 'official')
- Proviene de MINEDUC vía Currículum Nacional (curriculumnacional.cl)
- Incluye OA, habilidades, actitudes, textos escolares, guías docentes
- **Se puede** citar con atribución y enlace
- **No se puede** copiar íntegramente por derechos de autor

### 2. Referencia metadata (source_type = 'metadata')
- Contiene solo metadatos estructurales (título, unidad, resumen breve)
- No transcribe contenido de libros ni guías
- Útil para que el docente sepa qué buscar

### 3. Dato derivado por IA (source_type = 'derived')
- Indicadores de evaluación generados por IA
- Sugerencias de actividades y orientaciones pedagógicas
- Recomendaciones de secuencia basadas en heurística
- Siempre etiquetado como "Derivado por IA" en la UI

## Cómo agregar datos oficiales validados en el futuro

```sql
-- Insertar indicador oficial
INSERT INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
VALUES ('ind-oficial-xxx', (SELECT id FROM objectives WHERE code = 'LE02 OA 05'), 'Indicador validado', 1,
  'https://www.curriculumnacional.cl/...', 'official', 'Currículum Nacional — MINEDUC Chile');
```

Para importación masiva, usar scripts o el endpoint de importación. Cada lote debe registrarse en `import_logs`.

## Lo que NO se debe hacer

- ❌ Copiar textos completos de libros de texto (derechos de autor)
- ❌ Copiar guías docentes completas (derechos de autor)
- ❌ Marcar como "oficial" un dato que proviene de IA
- ❌ Afirmar páginas reales de textos escolares sin verificar
- ❌ Hacer scraping automático sin autorización

## Validación de conteos

Después del seed, verificar:

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT source_type, COUNT(*) AS total FROM objective_indicators GROUP BY source_type;"
```

Los indicadores derivados deben mostrar `source_type = 'derived'`. Cuando se agreguen datos oficiales, aparecerán con `source_type = 'official'`.

## Esquema de source_url

- Datos oficiales: URL directa al recurso en curriculumnacional.cl
- Datos metadata: misma URL del OA asociado (no hay URL específica)
- Datos derivados: misma URL del OA asociado (para trazabilidad)

Cuando se valide una referencia real, actualizar `source_url` con el enlace correcto.
