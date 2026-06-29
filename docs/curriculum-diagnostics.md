# Diagnóstico curricular D1

## Comandos rápidos de validación

### Conteo general de tablas enriquecidas

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT 'objective_indicators' AS tabla, COUNT(*) AS total FROM objective_indicators UNION ALL SELECT 'textbook_references', COUNT(*) FROM textbook_references UNION ALL SELECT 'teacher_guide_references', COUNT(*) FROM teacher_guide_references UNION ALL SELECT 'curricular_resource_links', COUNT(*) FROM curricular_resource_links UNION ALL SELECT 'lesson_sequence_recommendations', COUNT(*) FROM lesson_sequence_recommendations;"
```

### Total de OA

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT COUNT(*) AS total FROM objectives WHERE type='OA';"
```

### OA por curso

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT c.code AS course_code, c.name AS course_name, COUNT(*) AS total FROM objectives o JOIN courses c ON c.id = o.course_id WHERE o.type='OA' GROUP BY c.code ORDER BY c.sort_order;"
```

### OA por asignatura

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT s.normalized_name AS subject, COUNT(*) AS total FROM objectives o JOIN subjects s ON s.id = o.subject_id WHERE o.type='OA' GROUP BY s.normalized_name ORDER BY s.normalized_name;"
```

### OA por curso + asignatura

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT c.code AS course, s.normalized_name AS subject, COUNT(*) AS total FROM objectives o JOIN courses c ON c.id = o.course_id JOIN subjects s ON s.id = o.subject_id WHERE o.type='OA' GROUP BY c.code, s.normalized_name ORDER BY c.sort_order, s.normalized_name;"
```

### OA con bloom_level

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT bloom_level, COUNT(*) AS total FROM objectives WHERE type='OA' AND bloom_level IS NOT NULL AND bloom_level != '' GROUP BY bloom_level ORDER BY total DESC;"
```

### OAs con indicadores

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT COUNT(DISTINCT objective_id) AS total FROM objective_indicators;"
```

### Indicadores por OA (top 5)

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT o.code, COUNT(i.id) AS total FROM objectives o JOIN objective_indicators i ON i.objective_id = o.id GROUP BY o.code ORDER BY total DESC LIMIT 5;"
```

### Indicadores derivados vs oficiales

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT COALESCE(source_type, 'official') AS source_type, COUNT(*) AS total FROM objective_indicators GROUP BY COALESCE(source_type, 'official');"
```

### Recomendaciones por complejidad

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT complexity, COUNT(*) AS total FROM lesson_sequence_recommendations GROUP BY complexity ORDER BY total DESC;"
```

### Verificar datos corruptos

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT COUNT(*) AS total FROM lesson_sequence_recommendations WHERE recommended_lessons < 1 OR recommended_lessons > 5;"
```

## Uso del script automatizado

```powershell
node scripts/curriculum/check-curricular-data.mjs
```

Esto imprime todos los comandos `wrangler` listos para copiar y ejecutar.

Para generar un archivo SQL con todas las consultas:

```powershell
node scripts/curriculum/check-curricular-data.mjs --sql
```

Luego ejecutar el diagnóstico completo:

```powershell
wrangler d1 execute planificaia-db --remote --file=scripts/curriculum/diagnostic.sql
```

## Verificación de contexto curricular

Para probar el endpoint con un código OA real existente:

```powershell
wrangler d1 execute planificaia-db --remote --command "SELECT code, id FROM objectives WHERE type='OA' LIMIT 10;"
```

Luego usar el resultado en:

```
GET /api/curriculum/context?level=1°%20Básico&subject=Tecnología&objectiveCode=TE01%20OA%2001
```

O desde la terminal:

```powershell
$code = "TE01 OA 01"
$encoded = [System.Uri]::EscapeDataString($code)
curl "https://tudominio.com/api/curriculum/context?level=1°%20Básico&subject=Tecnología&objectiveCode=$encoded"
```
