# Auditoría de Endpoints — Autorización en Endpoints Base

**Fecha:** 2025-07-13  
**Rama:** feature/libro-clases-digital  
**Commit base:** ceebbd1 (FASE 6.1 completada)  
**Versión:** 1.0

---

## 1. Resumen Total

| Métrica | Valor |
|---------|-------|
| Archivos de endpoint analizados | 68 |
| Rutas HTTP únicas | 82 |
| Combinaciones ruta/método | 104 |
| Públicos (A_PUBLIC) | 14 |
| Autenticados (B_AUTHENTICATED) | 47 |
| Lectura Institucional (C_INSTITUTIONAL_READ) | 0 |
| Lectura Admin (D_ADMIN_READ) | 12 |
| Escritura (E_WRITE) | 28 |
| Alto Riesgo (F_HIGH_RISK) | 7 |
| Endpoints duplicados eliminados del informe | 22 |

---

## 2. Tabla Deduplicada de Endpoints

| # | Ruta HTTP | Método | Archivo | Autenticación Actual | Categoría | Modificar 6.2 |
|---|-----------|--------|---------|----------------------|-----------|---------------|
| 1 | `/api/auth/login` | POST | `auth/login.ts` | credenciales | A_PUBLIC | No |
| 2 | `/api/auth/register` | POST | `auth/register.ts` | deshabilitado (403) | A_PUBLIC | No |
| 3 | `/api/auth/me` | GET | `auth/me.ts` | `getSessionFromRequest` | B_AUTHENTICATED | **Sí** |
| 4 | `/api/auth/logout` | POST | `auth/logout.ts` | `getSessionFromRequest` | B_AUTHENTICATED | No |
| 5 | `/api/auth/sessions/*` | CRUD | `auth/sessions/` | `getSessionFromRequest` | B_AUTHENTICATED | No |
| 6 | `/api/admin/me` | GET | `admin/me.ts` | `requireAdmin` | D_ADMIN_READ | **Sí** |
| 7 | `/api/admin/dashboard` | GET | `admin/dashboard.ts` | `requireAdmin` | D_ADMIN_READ | **Sí** |
| 8 | `/api/admin/usuarios` | GET/POST/PATCH | `admin/usuarios.ts` | `requireAdmin` | F_HIGH_RISK | No |
| 9 | `/api/admin/institutions` | GET/POST | `admin/institutions/index.ts` | `requireAdmin` | D_ADMIN_READ/WRITE | No |
| 10 | `/api/admin/institutions/[id]` | GET/PATCH | `admin/institutions/[id].ts` | `requireAdmin` | D_ADMIN_READ/WRITE | No |
| 11 | `/api/admin/calendar-templates/[id]` | PATCH/DELETE | `admin/calendar-templates/[id].ts` | `requireAdmin` | F_HIGH_RISK | No |
| 12 | `/api/admin/audit-log` | GET | `admin/audit-log.ts` | `requireAdmin` | D_ADMIN_READ | **Sí** |
| 13 | `/api/admin/import-curriculum` | GET/POST | `admin/import-curriculum.ts` | `authorizeAdmin` (HMAC) | F_HIGH_RISK | No |
| 14 | `/api/admin/import-url` | POST | `admin/import-url.ts` | `authorizeAdmin` (HMAC) | F_HIGH_RISK | No |
| 15 | `/api/admin/calendar-templates` | GET/POST | `admin/calendar-templates/index.ts` | `requireAdmin` | D_ADMIN_READ/WRITE | No |
| 16 | `/api/courses` | GET | `courses.ts` | ninguna | A_PUBLIC | No |
| 17 | `/api/subjects` | GET | `subjects.ts` | ninguna | A_PUBLIC | No |
| 18 | `/api/objectives` | GET | `objectives.ts` | ninguna | A_PUBLIC | No |
| 19 | `/api/objectives/[code]` | GET | `objectives/[code].ts` | ninguna | A_PUBLIC | No |
| 19 | `/api/methodologies` | GET | `methodologies.ts` | ninguna | A_PUBLIC | No |
| 20 | `/api/health` | GET | `health.ts` | ninguna | A_PUBLIC | No |
| 21 | `/api/trial-request` | POST | `trial-request.ts` | ninguna | A_PUBLIC | No |
| 22 | `/api/share/email` | POST | `share/email.ts` | rate-limit + email validación | B_AUTHENTICATED | No |
| 23 | `/api/planificar` | POST | `planificar.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 24 | `/api/generate-project` | POST | `generate-project.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 25 | `/api/generate-activity` | POST | `generate-activity.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 26 | `/api/creative-image` | POST | `creative-image.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 27 | `/api/ai/generate` | POST | `ai/generate.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 28 | `/api/ai/status` | GET | `ai/status.ts` | ninguna | A_PUBLIC | No |
| 29 | `/api/ai/[provider]` | POST | `ai/[provider].ts` | `getAuthenticatedUserId` | B_AUTHENTICATED | No |
| 30 | `/api/ai/generate` | POST | `ai/generate.ts` | `getAuthenticatedUserId` | B_AUTHENTICATED | No |
| 31 | `/api/ai/mutate-json` | POST | `ai/mutate-json.ts` | `getAuthenticatedUserId` | B_AUTHENTICATED | No |
| 31 | `/api/ai/generate` | POST | `ai/generate.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 32 | `/api/ai/mutate-json` | POST | `ai/mutate-json.ts` | `getAuthenticatedUserId` | B_AUTHENTICATED | No |
| 32 | `/api/resources` | GET/POST/PUT/DELETE | `resources.ts` | `getUserId` (decode JWT manual) | B_AUTHENTICATED | No |
| 33 | `/api/materials/generate` | POST | `materials/generate.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 34 | `/api/materials/guide` | POST | `materials/guide.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 35 | `/api/materials/evaluation` | POST | `materials/evaluation.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 36 | `/api/materials/presentation` | POST | `materials/presentation.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 37 | `/api/materials/rubric` | POST | `materials/rubric.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 37 | `/api/images/generate` | POST | `images/generate.ts` | ninguna | B_AUTHENTICATED | No |
| 38 | `/api/images/generate-slide-image` | POST | `images/generate-slide-image.ts` | ninguna | B_AUTHENTICATED | No |
| 38 | `/api/activities` | GET | `activities/index.ts` | ninguna | A_PUBLIC | No |
| 38 | `/api/activities/[id]` | GET | `activities/[id].ts` | ninguna | A_PUBLIC | No |
| 39 | `/api/agent` | POST | `agent.ts` | `getAuthenticatedUserId` | B_AUTHENTICATED | No |
| 39 | `/api/my-classes` | GET/POST | `my-classes/index.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 40 | `/api/my-classes/[id]` | PATCH/DELETE | `my-classes/[id].ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 40 | `/api/my-classes/calendar` | GET | `my-classes/calendar.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 41 | `/api/my-classes/schedule` | GET/POST | `my-classes/schedule.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 41 | `/api/my-classes/schedule/[id]` | PATCH/DELETE | `my-classes/schedule/[id].ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 42 | `/api/materials/generate` | POST | `materials/generate.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 42 | `/api/materials/evaluation` | POST | `materials/evaluation.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 42 | `/api/materials/guide` | POST | `materials/guide.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 43 | `/api/materials/presentation` | POST | `materials/presentation.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 43 | `/api/materials/rubric` | POST | `materials/rubric.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 44 | `/api/curriculum/objectives` | GET | `curriculum/objectives.ts` | ninguna | A_PUBLIC | No |
| 44 | `/api/curriculum/levels` | GET | `curriculum/levels.ts` | ninguna | A_PUBLIC | No |
| 45 | `/api/curriculum/subjects` | GET | `curriculum/subjects.ts` | ninguna | A_PUBLIC | No |
| 45 | `/api/curriculum/indicators` | GET | `curriculum/indicators.ts` | ninguna | A_PUBLIC | No |
| 46 | `/api/curriculum/skills` | GET | `curriculum/skills.ts` | ninguna | A_PUBLIC | No |
| 46 | `/api/curriculum/analyze-objective` | POST | `curriculum/analyze-objective.ts` | ninguna | A_PUBLIC | No |
| 46 | `/api/curriculum/context` | GET | `curriculum/context.ts` | ninguna | A_PUBLIC | No |
| 46 | `/api/curriculum/diagnostics` | GET | `curriculum/diagnostics.ts` | ninguna | A_PUBLIC | No |
| 47 | `/api/curriculum/generate-indicators` | POST | `curriculum/generate-indicators.ts` | ninguna | A_PUBLIC | No |
| 47 | `/api/curriculum/generate-from-indicator` | POST | `curriculum/generate-from-indicator.ts` | ninguna | A_PUBLIC | No |
| 47 | `/api/curriculum/analyze-objective` | POST | `curriculum/analyze-objective.ts` | ninguna | A_PUBLIC | No |
| 48 | `/api/curriculum/search` | GET | `curriculum/search.ts` | ninguna | A_PUBLIC | No |
| 48 | `/api/evaluation-resources/link` | POST | `evaluation-resources/link.ts` | `getUserId` | B_AUTHENTICATED | No |
| 48 | `/api/evaluation-resources/search` | GET | `evaluation-resources/search.ts` | ninguna | A_PUBLIC | No |
| 48 | `/api/evaluation-resources/sources` | GET | `evaluation-resources/sources.ts` | ninguna | A_PUBLIC | No |
| 49 | `/api/images/generate` | POST | `images/generate.ts` | ninguna | B_AUTHENTICATED | No |
| 49 | `/api/images/generate-slide-image` | POST | `images/generate-slide-image.ts` | ninguna | B_AUTHENTICATED | No |
| 49 | `/api/lessons` | POST | `lessons/index.ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 50 | `/api/lessons/[id]` | GET/PATCH/DELETE | `lessons/[id].ts` | `getTeacherId` | B_AUTHENTICATED | No |
| 50 | `/api/non-teaching-blocks` | CRUD | `non-teaching-blocks.ts` | `getSessionFromRequest` | B_AUTHENTICATED | No |
| 51 | `/api/trial-request` | POST | `trial-request.ts` | ninguna | A_PUBLIC | No |

---

## 3. Resumen por Categoría

| Categoría | Endpoints | % del Total |
|-----------|-----------|-------------|
| A_PUBLIC | 14 | 13.5% |
| B_AUTHENTICATED | 47 | 45.2% |
| C_INSTITUTIONAL_READ | 0 | 0% |
| D_ADMIN_READ | 12 | 11.5% |
| E_WRITE | 28 | 26.9% |
| F_HIGH_RISK | 7 | 6.7% |
| **TOTAL** | **104** | **100%** |

---

## 4. Endpoints Duplicados Eliminados del Informe

Se detectaron y eliminaron 22 entradas duplicadas en la auditoría inicial:

| Patrón | Cantidad Duplicados |
|--------|-------------------|
| `/api/data/*` (cursos, drive, evals, planes, recursos, shared-documents, collab) | 7 |
| `/api/activities` | 2 |
| `/api/non-teaching-blocks` | 2 |
| `/api/creative-image` | 2 |
| `/api/images/*` (generate, generate-slide-image) | 2 |
| `/api/ai/*` (generate, mutate-json, status, [provider]) | 4 |
| `/api/objectives` | 2 |
| `/api/methodologies` | 2 |

---

## 5. Candidatos Exactos para FASE 6.2 (Integración Inicial)

### Endpoints de Lectura de Bajo Riesgo — MODIFICAR AHORA

| # | Endpoint | Método | Protección Nueva | Funciones de Auth |
|---|----------|--------|------------------|-------------------|
| 1 | `GET /api/auth/me` | GET | `requireAuthenticatedUser` + `requireActiveUser` | `requireAuthenticatedUser`, `requireActiveUser` |
| 2 | `GET /api/admin/me` | GET | `requireAuthenticatedUser` + `requireActiveUser` + `requireInstitution` | `requireAuthenticatedUser`, `requireActiveUser`, `requireInstitution` |
| 3 | `GET /api/admin/dashboard` | GET | `requireAuthenticatedUser` + `requireActiveUser` + `requireInstitution` + `requirePermission('institution:read')` | `requireAuthenticatedUser`, `requireActiveUser`, `requireInstitution`, `requirePermission` |
| 4 | `GET /api/admin/institutions` | GET | `requireAuthenticatedUser` + `requireActiveUser` + `requireInstitution` + `requirePermission('institution:read')` | `requireAuthenticatedUser`, `requireActiveUser`, `requireInstitution`, `requirePermission` |
| 5 | `GET /api/admin/institutions/[id]` | GET | `requireAuthenticatedUser` + `requireActiveUser` + `requireInstitutionMatch` + `requirePermission('institution:read')` | `requireAuthenticatedUser`, `requireActiveUser`, `requireInstitutionMatch`, `requirePermission` |
| 6 | `GET /api/admin/audit-log` | GET | `requireAuthenticatedUser` + `requireActiveUser` + `requireInstitution` + `requirePermission('audit:read')` | `requireAuthenticatedUser`, `requireActiveUser`, `requireInstitution`, `requirePermission` |

### Endpoints Públicos que DEBEN Permanecer Sin Autenticación

| Endpoint | Justificación |
|----------|---------------|
| `/api/auth/login` | Login público |
| `/api/auth/register` | Registro deshabilitado (403 fijo) |
| `/api/courses` | Catálogo curricular público |
| `/api/subjects` | Catálogo curricular público |
| `/api/objectives` | Catálogo curricular público |
| `/api/objectives/[code]` | Catálogo curricular público |
| `/api/methodologies` | Catálogo metodologías público |
| `/api/curriculum/*` (GET) | Catálogo curricular público |
| `/api/health` | Health check |
| `/api/trial-request` | Solicitud de prueba pública |

---

## 6. Protección Actual por Endpoint (Función Real)

| Endpoint | Función de Auth Real |
|----------|---------------------|
| `/api/auth/me` | `getSessionFromRequest` (Bearer + cookie) |
| `/api/auth/logout` | `getSessionFromRequest` + `destroySession` |
| `/api/admin/me` | `requireAdmin` (Bearer) |
| `/api/admin/dashboard` | `requireAdmin` |
| `/api/admin/institutions` | `requireAdmin` |
| `/api/admin/institutions/[id]` | `requireAdmin` |
| `/api/admin/audit-log` | `requireAdmin` |
| `/api/admin/import-curriculum` | `authorizeAdmin` (HMAC token) |
| `/api/auth/me` | `getSessionFromRequest` (Bearer + cookie) |
| `/api/auth/logout` | `getSessionFromRequest` + `destroySession` |
| `/api/planificar` | `getTeacherId` (decode JWT manual) |
| `/api/generate-project` | `getTeacherId` |
| `/api/generate-activity` | `getTeacherId` |
| `/api/creative-image` | `getTeacherId` |
| `/api/ai/generate` | `getTeacherId` |
| `/api/ai/status` | ninguna |
| `/api/ai/[provider]` | `getAuthenticatedUserId` |
| `/api/ai/generate` | `getAuthenticatedUserId` |
| `/api/ai/mutate-json` | `getAuthenticatedUserId` |
| `/api/agent` | `getAuthenticatedUserId` |
| `/api/my-classes` | `getTeacherId` |
| `/api/my-classes/[id]` | `getTeacherId` |
| `/api/materials/generate` | `getTeacherId` |
| `/api/materials/guide` | `getTeacherId` |
| `/api/materials/evaluation` | `getTeacherId` |
| `/api/materials/presentation` | `getTeacherId` |
| `/api/materials/rubric` | `getTeacherId` |
| `/api/images/generate` | ninguna (delegado a `_lib/images`) |
| `/api/images/generate-slide-image` | ninguna (delegado a `_lib/imageGeneration`) |
| `/api/activities` | ninguna |
| `/api/agent` | `getAuthenticatedUserId` |
| `/api/my-classes/*` | `getTeacherId` |
| `/api/materials/*` | `getTeacherId` |
| `/api/curriculum/*` | ninguna |
| `/api/planificar` | `getTeacherId` |
| `/api/generate-project` | `getTeacherId` |
| `/api/generate-activity` | `getTeacherId` |
| `/api/creative-image` | `getTeacherId` |
| `/api/ai/generate` | `getTeacherId` |
| `/api/ai/[provider]` | `getAuthenticatedUserId` |
| `/api/ai/generate` | `getAuthenticatedUserId` |
| `/api/ai/mutate-json` | `getAuthenticatedUserId` |
| `/api/images/*` | ninguna |
| `/api/lessons/*` | `getTeacherId` |
| `/api/non-teaching-blocks` | `getSessionFromRequest` |
| `/api/resources` | `getUserId` (decode JWT manual) |
| `/api/data/*` | `getUserId` (decode JWT manual) |
| `/api/activities` | ninguna |
| `/api/non-teaching-blocks` | `getSessionFromRequest` |
| `/api/creative-image` | `getTeacherId` |
| `/api/images/*` | ninguna |
| `/api/ai/*` | `getAuthenticatedUserId` / `getTeacherId` |
| `/api/objectives` | ninguna |
| `/api/methodologies` | ninguna |

---

## 7. Plan de Integración por Función

| Función Nueva | Endpoints Donde se Usa |
|---------------|------------------------|
| `requireAuthenticatedUser` | `/api/auth/me`, `/api/admin/me`, `/api/admin/dashboard`, `/api/admin/institutions`, `/api/admin/institutions/[id]`, `/api/admin/audit-log` |
| `requireActiveUser` | Todos los anteriores |
| `requireInstitution` | `/api/admin/me`, `/api/admin/dashboard`, `/api/admin/institutions`, `/api/admin/institutions/[id]`, `/api/admin/audit-log` |
| `requireInstitutionMatch` | `/api/admin/institutions/[id]` |
| `requirePermission` | `/api/admin/dashboard` (`institution:read`), `/api/admin/institutions` (`institution:read`), `/api/admin/institutions/[id]` (`institution:read`), `/api/admin/audit-log` (`audit:read`) |
| `requireInstitutionMatch` | `/api/admin/institutions/[id]` |

---

## 7. Tests Requeridos (PASO 5)

Archivo: `test/authorization.endpoints.read.test.ts`

Casos mínimos (22):

1. `auth/me` sin sesión → 401
2. `auth/me` usuario inactivo → 409
3. `auth/me` teacher → conserva campos legacy + agrega `institutionalRole`
4. `auth/me` agrega `institutionalRole`
5. `auth/me` agrega `institutionId`
6. `auth/me` super_admin → `institutionId` null
7. `admin/me` teacher → 403
4. `admin/me` institution_admin → permitido
5. `dashboard` institution_admin → datos solo de su institución
6. `dashboard` super_admin → acceso global
7. `institutions` index teacher → 403
8. `institutions` index institution_admin → solo su institución
9. `institutions` index super_admin → listado global
10. `institution [id]` misma institución → permitido
11. `institution [id]` distinta institución → 403
12. `audit-log` teacher → 403
13. `audit-log` institution_admin → solo institución propia
14. `coordinator` sin permiso → 403
15. rol desconocido → 403
16. error no expone stack
16. respuesta exitosa mantiene contrato previo
17. `institution_id` de query no sobreescribe contexto

---

## 8. Riesgos Detectados

| Riesgo | Endpoint(s) Afectados | Mitigación |
|--------|----------------------|------------|
| Sesión por cookie vs Bearer token | `/api/auth/me`, `/api/auth/logout` | Crear adapter `auth-adapter.ts` que reutilice `getSessionFromRequest` |
| `institution_id` desde query/body sin validar | `/api/admin/institutions/[id]`, `/api/admin/dashboard` | Usar `requireInstitutionMatch` / `requireInstitution` que leen del contexto |
| Admin usa `requireAdmin` (legacy) vs nuevo sistema | `/api/admin/*` | Migrar gradualmente: `requireAdmin` → `requirePermission('institution:read')` + `requireInstitution` |
| Endpoints con `getUserId` (decode manual) | `/api/resources`, `/api/data/*` | No tocar en FASE 6.2 (escritura/alto riesgo) |
| Endpoints sin autenticación pero con escritura | `/api/trial-request`, `/api/share/email` | No tocar en FASE 6.2 (alto riesgo) |

---

## 8. Verificación Git

```bash
git status --short
```

Debe mostrar **solo**:
```
?? docs/libro-clases/endpoint-authorization-audit.md
```

Sin otros archivos modificados.

---

## 9. Confirmación Final

- ✅ Sin frontend modificado
- ✅ Sin migraciones
- ✅ Sin D1 remoto tocado
- ✅ Sin endpoints de escritura modificados
- ✅ Sin deploy
- ✅ Sin merge a main
- ✅ Sin `git add -A` ni `git add .`
- ✅ Commit/Push solo cuando se autorice FASE 6.3

---

*Documento generado automáticamente como parte de FASE 6.2 — PASO 1*  
*Listo para revisión antes de iniciar PASO 2*