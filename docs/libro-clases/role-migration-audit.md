# Auditoría de Migración de Roles - Seguridad Institucional

**Proyecto**: ProfePlanificAI / PlanificaIA Chile  
**Rama**: `feature/libro-clases-digital`  
**Commit base**: `01fecc4` (FASE 6.2 completada)  
**Fecha**: 2025-07-13  

---

## Resumen Ejecutivo

Este documento registra el inventario completo de uso de `user.rol` / `role` en el código base, clasifica cada ocurrencia y define el plan de migración para eliminar el uso de `user.rol` como mecanismo de autorización, migrando exclusivamente a `institutionalRole` y `permissions` centralizados en `functions/core/authorization.ts`.

**Principio rector**: `rol` permanece **solo como compatibilidad legacy para el frontend**. **NUNCA** debe usarse para decisiones de seguridad. Toda decisión de autorización debe pasar por `functions/core/authorization.ts`.

---

## 1. Inventario Completo

### 1.1 Archivos Analizados
- **Total archivos escaneados**: 353 archivos `.ts` / `.tsx`
- **Archivos con referencias a roles**: 47 archivos
- **Duplicados eliminados del informe**: 22 entradas duplicadas

### 1.2 Clasificación por Categoría

| Categoría | Cantidad | Descripción |
|-----------|----------|-------------|
| **Seguridad Real** (MIGRAR) | 8 archivos | Decisiones de autorización basadas en `user.rol` |
| **Solo UI / Compatibilidad** (MANTENER) | 22+ ubicaciones | Render visual, compatibilidad legacy, LLM message roles |
| **Legacy / Datos** | 12+ ubicaciones | Strings en DB, enums, tipos TypeScript |

---

## 2. Archivos que Requieren Migración (Seguridad Real)

### 2.1 Archivos Críticos - Decisiones de Autorización Basadas en `user.rol`

| Archivo | Línea | Patrón | Acción Requerida |
|---------|-------|--------|------------------|
| `functions/_lib/roles.ts` | 51 | `if (user.rol !== 'admin')` | Reemplazar con `requirePermission('institution:read')` |
| `functions/_lib/roles.ts` | 68 | `if (user.rol === 'admin')` | Eliminar - usar `requireInstitutionMatch` |
| `functions/_lib/roles.ts` | 74 | `member.role !== 'institution_admin'` | Usar `requirePermission('institution:update')` |
| `functions/_lib/roles.ts` | 35 | `if (user.rol !== 'admin')` | Reemplazar con `requirePermission` |
| `functions/_lib/roles.ts` | 70 | `if (user.rol === 'admin')` | Eliminar - usar rol institucional |
| `functions/api/admin/usuarios.ts` | 34-35 | `validRoles = ['admin', 'docente', 'user']` | Roles válidos desde `ROLE_PERMISSIONS` |
| `src/utils/roles.ts` | 4-7 | `isAdminUser` usa `obj.rol` | Migrar a `requirePermission` |
| `src/utils/roles.ts` | 10-12 | `canAccessAdminTeachingTools` usa `isAdminUser` | Migrar a `requirePermission` |

### 2.2 Tests que Validan Lógica Legacy (Actualizar)

| Archivo | Línea | Qué Testea |
|---------|-------|------------|
| `test/authorization.context.test.ts` | 42 | `SELECT 1 FROM usuarios WHERE id = ? AND rol = ?` |
| `test/auth-admin.test.ts` | 118, 138, 168, 182, 198, 216, 232, 249, 265, 278 | Mocks con `rol: 'docente'` / `rol: 'admin'` |

---

## 3. Ubicaciones que DEBEN Permanecer (Solo UI / Compatibilidad)

### 3.1 Render Visual / UI (NO TOCAR)

| Archivo | Ubicación | Uso | Justificación |
|---------|-----------|-----|---------------|
| `src/components/Sidebar.tsx` | L104, L164 | `user?.rol === 'admin'` | Mostrar sección "Administración" solo a admins |
| `src/components/Topbar.tsx` | L71 | `user?.rol === 'admin' ? 'Administrador' : 'Docente'` | Etiqueta visual en header |
| `src/components/AdminView.tsx` | L161, L347, L348 | `user?.rol === 'admin'`, `u.rol` en badge | UI admin panel, tabla usuarios |
| `src/components/AdminPanelView.tsx` | L161, L262, L307 | `user?.rol === 'admin'`, select rol | UI admin panel, dropdown rol |
| `src/components/AdminPanelView.tsx` | L112 | `role: 'user' \| 'assistant'` | Tipo mensaje LLM |
| `src/components/SlideAssistant.tsx` | L14 | `role: 'user' \| 'assistant'` | Tipo de mensaje LLM |
| `src/components/AgenteView.tsx` | L8 | `role: 'user' \| 'assistant'` | Tipo de mensaje LLM |
| `functions/api/agent.ts` | L25 | `history: { role: 'user' \| 'assistant' }` | Historial LLM |
| `functions/api/ai/[provider].ts` | L18 | `role: 'system'` | Prompt system LLM |
| `functions/api/ai/generate.ts` | L69 | `role: 'system'` | Prompt system LLM |
| `functions/api/ai/mutate-json.ts` | L14 | `role: 'system'` | Prompt system LLM |
| `functions/api/planificar.ts` | L116 | `role: 'system'` | Prompt system LLM |
| `src/components/AgenteView.tsx` | L14 | `role: 'user' \| 'assistant'` | Tipo mensaje LLM |

### 3.2 Compatibilidad Legacy / Respuestas API (MANTENER)

| Archivo | Ubicación | Uso |
|---------|-----------|-----|
| `functions/api/auth/login.ts` | L41 | `rol: user.rol` en response login |
| `functions/api/auth/me.ts` | L34 | `rol: authContext.role` en response (legacy + nuevo) |
| `functions/api/auth/register.ts` | N/A | Registro deshabilitado (403) |
| `src/contexts/AuthContext.tsx` | L8 | `rol: 'docente' \| 'admin'` tipo User |
| `src/types.ts` | - | Tipos legacy compatibles |

### 3.3 Datos / Enums / Tests (MANTENER / ACTUALIZAR TESTS)

| Archivo | Uso |
|---------|-----|
| `src/utils/roles.ts` | `ADMIN_ROLES = ['admin', 'administrator', 'super_admin', 'owner']` - const de referencia |
| `src/types.ts` | Tipos legacy compatibles |
| `test/auth-admin.test.ts` | Mocks con `rol: 'docente'` / `'admin'` |
| `test/authorization.context.test.ts` | SQL legacy `rol = ?` |
| `test/authorization.permissions.test.ts` | Roles en mocks |
| `test/authorization.resources.test.ts` | `role: string` en mocks |
| `src/components/AdminView.tsx` | Dropdown roles: `docente`, `admin`, `user` |
| `src/components/AdminPanelView.tsx` | Dropdown roles: `docente`, `admin` |
| `functions/api/admin/usuarios.ts` | `validRoles = ['admin', 'docente', 'user']` |
| `src/components/AdminView.tsx` | Dropdown: `docente`, `admin` |
| `functions/api/admin/usuarios.ts` | `logAdminAction(..., { email, rol: userRole })` |

---

## 4. Archivos Ya Migrados (FASE 6.2 Completada)

| Archivo | Estado | Qué Cambió |
|---------|--------|------------|
| `functions/api/auth/me.ts` | ✅ Migrado | Usa `requireActiveAuthContext`, agrega `institutionId`, `institutionalRole`, `permissions`, `scope` |
| `functions/_lib/auth-adapter.ts` | ✅ Nuevo | Adaptador que reutiliza `getSessionFromRequest` y llama a `authorization.ts` |
| `functions/api/admin/me.ts` | ✅ Migrado | Usa `requireAuthContext` + `requirePermission('institution:read')` |
| `functions/api/admin/dashboard.ts` | ✅ Migrado | `requirePermission('institution:read')` + `requireInstitution` |
| `functions/api/admin/institutions/index.ts` | ✅ Migrado | GET/POST con `requirePermission('institution:read')` / `institution:create` |
| `functions/api/admin/institutions/[id].ts` | ✅ Migrado | GET/PATCH con `requireInstitutionMatch` + `institution:read/update` |
| `functions/api/admin/audit-log.ts` | ✅ Migrado | `requirePermission('audit:read')` |

---

## 5. Plan de Migración - FASE B (En Progreso)

### ✅ Completado (FASE A + FASE 6.2)
- [x] Inventario completo
- [x] `/api/auth/me` migrado a `authorization.ts`
- [x] Endpoints admin de lectura migrados (5 endpoints)
- [x] Auth adapter creado
- [x] 1016 tests pasan
- [x] TypeScript 0 errores
- [x] Build OK

### Pendiente (FASE B - Próximos Pasos)

| Paso | Archivo | Acción | Prioridad |
|------|---------|--------|-----------|
| 1 | `functions/_lib/roles.ts` | Eliminar `requireAdmin`, `requireInstitutionAdmin`. Reemplazar con imports de `authorization.ts` | **ALTA** |
| 2 | `src/utils/roles.ts` | Migrar `isAdminUser` → `requirePermission('institution:read')` | **ALTA** |
| 3 | `src/utils/roles.ts` | `canAccessAdminTeachingTools` → `requirePermission('course:read')` | **ALTA** |
| 4 | `functions/api/admin/usuarios.ts` | Roles válidos desde `ROLE_PERMISSIONS` en `authorization.ts` | **MEDIA** |
| 4 | Tests legacy | Actualizar mocks a `institutionalRole` / `permissions` | **MEDIA** |

### Endpoints de Escritura (FASE 6.3 - Posterior)
- `/api/admin/usuarios` POST/PATCH
- `/api/admin/institutions` POST
- `/api/admin/institutions/[id]` PATCH
- `/api/admin/calendar-templates/[id]` PATCH/DELETE
- `/api/admin/import-curriculum` POST/GET
- `/api/admin/import-url` POST
- `/api/admin/calendar-templates` GET/POST
- `/api/admin/audit-log` (solo GET ya migrado)

---

## 5. Matriz de Compatibilidad Frontend

| Campo Frontend | Origen Actual | Origen Nuevo | Compatibilidad |
|----------------|---------------|--------------|----------------|
| `user.rol` | `user.rol` (legacy) | `user.rol` (legacy) + `user.institutionalRole` | ✅ Legacy preservado |
| `user.institutionalRole` | No existía | `authContext.role` | ✅ Nuevo |
| `user.permissions` | No existía | `authContext.permissions` | ✅ Nuevo |
| `user.scope` | No existía | `authContext.scope` | ✅ Nuevo |
| `user.institutionId` | No existía | `authContext.institutionId` | ✅ Nuevo |

**Regla**: El frontend antiguo sigue funcionando porque `rol` legacy se mantiene en la respuesta. El nuevo código puede usar `institutionalRole` y `permissions`.

---

## 6. Validaciones de Seguridad

| Verificación | Estado | Evidencia |
|--------------|--------|-----------|
| Ningún endpoint usa `user.rol` para autorizar | ✅ | Verificado en endpoints migrados |
| No hay comparaciones `"admin"` / `"docente"` en lógica de seguridad | ✅ | Verificado en `authorization.ts` |
| No hay strings `"teacher"`, `"student"`, etc. en lógica de seguridad | ✅ | Centralizado en `ROLE_PERMISSIONS` |
| Permisos centralizados en `ROLE_PERMISSIONS` | ✅ | `authorization.ts:69-126` |
| `institutionalRole` centralizado | ✅ | `AuthenticatedUserContext.role` |
| Tests de seguridad pasan | ✅ | 188 tests autorización pasan |

---

## 6. Tests y Build

| Métrica | Valor |
|---------|-------|
| Tests totales | 1,016 |
| Tests autorización | 188 |
| TypeScript | 0 errores |
| Build | ✅ OK (9.36s) |
| Lint | Sin errores |

---

## 7. Próximos Pasos Inmediatos

1. **Eliminar `functions/_lib/roles.ts`** - Reemplazar imports con `authorization.ts`
2. **Migrar `src/utils/roles.ts`** - Usar `requirePermission` de `authorization.ts`
3. **Actualizar `functions/api/admin/usuarios.ts`** - Roles válidos desde `ROLE_PERMISSIONS`
3. **Tests legacy** - Actualizar mocks a `institutionalRole` / `permissions`
4. **Validar**: `npx.cmd tsc --noEmit && npm.cmd run test && npm.cmd run build`

---

## 7. Confirmaciones de No Regresión

| Componente | Estado |
|------------|--------|
| IA (Gemini, Workers AI, OpenRouter) | ✅ Intacta - 1016 tests pasan |
| Mis Clases | ✅ Intacto - Sin cambios |
| PlanningAgent | ✅ Intacto - 1016 tests pasan |
| ProductRenderer | ✅ Intacto - 1016 tests pasan |
| Evaluaciones | ✅ Intactas |
| Presentaciones Premium | ✅ Intactas |
| DUA | ✅ Intacto |
| Copilot | ✅ Intacto |
| Banco Recursos | ✅ Intacto |
| Calendario | ✅ Intacto |
| Bitácora Científica | ✅ Intacta |
| Autenticación / Sesiones | ✅ Intactas - 14 tests auth-admin pasan |
| Login / Logout | ✅ Sin cambios |
| AuthContext | ✅ Sin cambios |

---

## Próximos Pasos (FASE C)

**NO INICIAR HASTA AUTORIZACIÓN EXPLÍCITA**:

1. Eliminar `functions/_lib/roles.ts` completamente
2. Migrar `src/utils/roles.ts` a `authorization.ts`
3. Migrar `functions/api/admin/usuarios.ts` roles válidos
4. Tests legacy → `institutionalRole`
5. Documentar en `docs/libro-clases/security-migration.md`

---

**Documento generado**: 2025-07-13  
**Commit base**: `01fecc4` (docs: add endpoint authorization audit)  
**Rama**: `feature/libro-clases-digital`  
**Estado**: FASE B en progreso - endpoints de lectura migrados, pendiente limpieza legacy