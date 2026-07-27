# Merge Notes: feature/libro-clases-digital → main

## RESUELTO: `functions/api/materials/generate.ts` — adoptar nuestra versión tal cual

**Decisión:** al mergear, quedarse con la versión de `feature/libro-clases-digital`
sin modificarla. Descartar la de `main`.

**Evidencia (2026-07-27):**

- El `generate.ts` de `main` (`e56b135`) **nunca llama a IA**: arma un prompt,
  hace `INSERT OR IGNORE INTO generated_resources` con
  `content_json: '{"status":"generating"}'`, y devuelve
  `{ok, resourceId, prompt, context}` al cliente — sin `content` ni
  `structured`. `grep` de `"generating"`/`resourceId` en todo `main` no
  encontró ningún consumidor que complete ese placeholder después: es un
  callejón sin salida, no un paso 1-de-2 de un flujo async.
- Es compatible con el esquema real de `generated_resources` en producción
  (columnas verificadas contra `sqlite_master` — a diferencia de
  `methodologies.ts`, aquí no hay error de columnas), pero eso solo confirma
  que el `INSERT` no rompe, no que el endpoint genere contenido real.
- En `FlujoDocenteView.tsx` (idéntico en ambas ramas), `generateMaterial()` →
  `generate.ts` es el branch `default:` del switch de productos — cualquier
  tipo sin endpoint dedicado cae ahí. Como la respuesta no trae
  `guide/evaluation/rubric/slides`, `setResult(res.guide || res.evaluation ||
  res.rubric || res.slides || res)` termina asignando el objeto crudo
  completo (incluyendo el prompt de texto plano) como si fuera el contenido
  pedagógico final.
- Nuestra versión (`generate.ts` → `PlanificacionEngine.generatePlanificacion`
  → `callAIConValidacion`) sí llama a IA real. Corrida en vivo hoy contra el
  binding de producción (`getPlatformProxy`, sin escribir en D1 real —
  invocación aislada del engine, no del endpoint completo):
  ```
  usedFallback: false (3833ms)
  unit: 5° Básico
  classes: 3
  ```

**Conclusión:** el `generate.ts` de main jamás produjo contenido pedagógico
real contra datos reales — es un endpoint incompleto, no una implementación
alternativa funcional. Nuestra versión sí genera contenido real hoy, con
retry+validación Zod (ver `callAIConValidacion` en `AIEngine.ts`).

## RESUELTO: `functions/api/materials/presentation.ts` — adoptar nuestra versión tal cual

**Decisión:** al mergear, quedarse con la versión de `feature/libro-clases-digital`
sin modificarla. Descartar la de `main`.

**Evidencia (2026-07-27):**

- El `presentation.ts` de `main` (`e56b135`) llama a IA directo con
  `env.AI.run('@cf/meta/llama-3.1-8b-instruct', ...)` — sin pasar por ningún
  orchestrator, con su propia extracción ad-hoc de la respuesta. Invocando su
  `onRequestPost` real HOY contra el binding de IA real de producción (D1
  mockeada para no escribir nada, `getPlatformProxy`):
  ```
  [presentation] AI generation failed, using defaults: Error: 5028: This
  model was deprecated on 2026-05-30. Please use an alternative model.
  HTTP status: 200
  ok: true
  ¿Parecen los slides de buildDefaultSlides (fallback), no de IA?: true
  ```
  El modelo `@cf/meta/llama-3.1-8b-instruct` está deprecado por Cloudflare
  desde el 30 de mayo — ~2 meses antes de esta verificación. Cualquier
  llamada real a este endpoint falla garantizadamente en el paso de IA, cae
  a `buildDefaultSlides()` (plantilla estática genérica) y responde
  `HTTP 200 {ok:true}` — indistinguible de un éxito real para el frontend.
  Hoy, este endpoint SIEMPRE devuelve contenido fabricado sin que nada lo
  delate.
- Esquema D1 (`generated_resources` y `generated_presentations`) sí es
  compatible con producción — el problema es exclusivamente el modelo
  muerto, no la base de datos.
- **Chequeo explícito de si NOSOTROS usamos el mismo modelo deprecado:**
  `grep "MODEL\s*=" functions/core/*.ts` confirma que las 4 engines
  (`AIEngine`, `PptContentEngine`, `PlanificacionEngine`,
  `UnidadDidacticaEngine` — las 3 últimas ya migradas a
  `callAIConValidacion()`, que centraliza el modelo en `AIEngine.ts`) usan
  **`@cf/meta/llama-3.2-3b-instruct`** — un modelo distinto, NO deprecado.
  Confirmado con corrida en vivo hoy (`PptContentEngine.generateDeckContent`,
  vía `getPlatformProxy`, invocación aislada del engine sin tocar D1 real):
  ```
  usedFallback (heurística): false (6492ms)
  slideCount: 6
  slides[0]: {"layout":"title","title":"La Propagación del Sonido", ...}
  ```
  Nuestro modelo funciona hoy — no heredamos el problema de main.

**Conclusión:** el `presentation.ts` de main está roto en producción hoy por
un modelo deprecado, silenciosamente enmascarado por su propio try/catch.
Nuestra versión usa un modelo distinto y funcional, confirmado con una
llamada real.

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
