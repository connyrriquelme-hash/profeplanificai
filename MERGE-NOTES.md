# Merge Notes: feature/libro-clases-digital → main

## RESUELTO: `functions/api/methodologies.ts` — adoptar nuestra versión tal cual

**Decisión:** al mergear, quedarse con la versión de `feature/libro-clases-digital`
sin modificarla. Descartar la de `main`.

**Evidencia (2026-07-27, solo lectura contra D1 remoto real):**

- `npx wrangler d1 execute planificaia-db --remote --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='methodologies'"`
  confirma que el esquema efectivamente aplicado en producción tiene
  `short_name, when_to_use, steps_json, advantages_json, risks_json,
  dua_accommodations_json, suggested_evaluations_json,
  classroom_examples_json, source_type, source_url` — exactamente lo que
  consulta nuestra versión de `methodologies.ts`.
- La tabla de bookkeeping de wrangler (`SELECT * FROM d1_migrations`) muestra
  que `006_pedagogical_core.sql` se aplicó a las 16:06:53 del 2026-07-01 y
  `007_curriculum_core.sql` un segundo después, a las 16:06:54. Ambos
  migration files (idénticos en ambas ramas) declaran
  `CREATE TABLE IF NOT EXISTS methodologies` con esquemas incompatibles
  entre sí (006: el nuevo; 007: `code/educational_focus/target_levels/...`).
  Como 006 corrió primero, el `CREATE TABLE IF NOT EXISTS` de 007 fue un
  **no-op silencioso** — nunca se aplicó, sin error visible en ningún lado.
- El endpoint de `main` consulta columnas de la migración 007 (`m.code`,
  `m.educational_focus`, `ms.fit_level`, `ms.adaptation_notes`, y hace JOIN
  a `education_levels` vía `s.education_level_id`) que **no existen** en el
  esquema real de producción — confirmado columna por columna contra
  `sqlite_master`. Si se desplegara tal cual, el `try/catch` de main
  atraparía el error SQL y devolvería `{data: [], count: 0}` con HTTP 200
  silenciosamente, sin romper la build ni el request, pero sin devolver
  datos nunca.
- Dos archivos más, **idénticos en ambas ramas**, ya asumen el esquema
  nuevo: `src/services/agents/MethodologyAgent.ts` (usa `m.when_to_use`,
  `m.steps_json`, `m.dua_accommodations_json`) y
  `scripts/seed-methodologies.mjs` (siembra filas con `short_name`,
  `when_to_use`, etc.). O sea: main ya está internamente desincronizado
  entre su propio endpoint y su propio agente/seed script — no es un
  problema que el merge introduce, ya existe en main hoy.

**Conclusión:** el endpoint de `methodologies.ts` en `main` nunca funcionó
contra datos reales — asumía columnas de la migración 007, que fue un
no-op silencioso por orden de aplicación. Nuestra versión coincide
exactamente con el esquema efectivamente aplicado (migración 006). No se
requiere ALTER TABLE ni migración de datos: la tabla está vacía (0 filas)
en producción.

**Pendiente, fuera de este merge (bajo riesgo, para después):** limpiar el
código muerto de `migrations/007_curriculum_core.sql` (sus
`CREATE TABLE IF NOT EXISTS` para `methodologies`, `methodology_strategies`
y `methodology_subject_fit` nunca se ejecutan mientras 006 exista primero).
No tocar el archivo ya aplicado — mejor codificar el esquema vigente en una
migración nueva más adelante.

## Incompatibilidad de `signToken` entre ramas

- **feature/libro-clases-digital** (`test/helpers/mockD1.ts:526`):
  `signToken(sub: string, email: string, secret: string): Promise<string>`
  — 3 argumentos posicionales
- **main** (`test/helpers/mockD1.ts:892`):
  `signToken({ sub, email, role, institutionId }, secret)`
  — primer argumento objeto con 4 propiedades

Los tests de cada rama llaman a `signToken` según la firma de su propia rama.
Antes de mergear, elegir UNA firma canónica y actualizar TODOS los call sites
de la rama que se descarte, o el merge dejará tests rotos en runtime sin que
git reporte conflicto (el código compila pero los argumentos se mapean mal).
