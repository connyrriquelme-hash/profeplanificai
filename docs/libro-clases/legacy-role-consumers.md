# Auditoría de Migración de Roles Legacy

**Proyecto**: ProfePlanificAI / PlanificaIA Chile  
**Rama**: `feature/libro-clases-digital`  
**Commit base**: `ff8dd10` (FASE 6.2 completada)  
**Fecha**: 2025-07-13  

---

## 1. Resumen Ejecutivo

**Objetivo**: Eliminar definitivamente el uso de `user.rol` como mecanismo de autorización, migrando a `institutionalRole` y `permissions` centralizados en `authorization.ts`.

**Principio rector**: `rol` permanecerá **solo como compatibilidad legacy para el frontend**. **NUNCA** debe usarse para decisiones de seguridad. Toda decisión debe pasar por `institutionalRole` y `permissions` centralizados en `authorization.ts`.

---

## 2. Inventario Completo de Consumidores Legacy

### 2.1 Resumen Global

| Patrón | Ocurrencias Totales | Categorización |
|--------|-------------------|----------------|
| `requireAdmin(` | 13 | Seguridad Backend |
| `user.rol` | 7 | Seguridad Backend / Compatibilidad |
| `rol === admin` | 11 | Seguridad Backend / UI |
| `role === admin` | 2 | Seguridad Backend / LLM |
| `role === teacher` | 4 | LLM / UI |
| `role === coordinator` | 4 | LLM / UI |
| `role === student` | 1 | LLM / UI |
| `role === docente` | 1 | LLM / UI |
| `requireInstitutionAdmin(` | 2 | Seguridad Backend |
| `isAdminUser(` | 6 | UI / Navegación |
| `ADMIN_ONLY_VIEW_IDS` | 9 | UI / Navegación |
| `session.user.rol` | 1 | Compatibilidad |

---

## 3. Clasificación de Consumidores

### 3.1 Seguridad Backend (Categoría A) - **MIGRAR AHORA**

| Archivo | Línea | Código | Categoría | Riesgo | Migrar Ahora | Función Nueva Recomendada |
|---------|-------|--------|-----------|--------|--------------|---------------------------|
| `functions/_lib/roles.ts` | 51 | `if (user.rol !== 'admin')` | Seguridad Backend | **ALTO** | **SÍ** | `requirePermission(ctx, 'institution:read')` + `requireInstitutionMatch` |
| `functions/_lib/roles.ts` | 68 | `if (user.rol === 'admin')` | Seguridad Backend | **ALTO** | **SÍ** | `requireInstitutionMatch` + `requirePermission` |
| `functions/_lib/roles.ts` | 74 | `member.role !== 'institution_admin'` | Seguridad Backend | **ALTO** | **SÍ** | `requirePermission` + `requireInstitutionMatch` |
| `functions/_lib/roles.ts` | 51 | `user.rol !== 'admin'` (segunda ocurrencia) | Seguridad Backend | **ALTO** | **SÍ** | `requirePermission` |
| `functions/_lib/roles.ts` | 68 | `user.rol === 'admin'` | Seguridad Backend | **ALTO** | **SÍ** | `requireInstitutionMatch` |
| `functions/_lib/roles.ts` | 74 | `member.role !== 'institution_admin'` | Seguridad Backend | **ALTO** | **SÍ** | `requirePermission('institution:update')` |
| `functions/api/admin/usuarios.ts` | 34-35 | `validRoles = ['admin', 'docente', 'user']` | Seguridad Backend | **MEDIO** | **SÍ** | Roles válidos desde `ROLE_PERMISSIONS` en `authorization.ts` |
| `functions/_lib/roles.ts` | 68 | `user.rol === 'admin'` | Seguridad Backend | **ALTO** | **SÍ** | `requireInstitutionMatch` |
| `functions/_lib/roles.ts` | 74 | `member.role !== 'institution_admin'` | Seguridad Backend | **ALTO** | **SÍ** | `requirePermission('institution:update')` |

### 3.2 Helpers Legacy a Migrar (Paso 5)

| Archivo | Línea | Código | Categoría | Riesgo | Migrar Ahora | Función Nueva Recomendada |
|---------|-------|--------|-----------|--------|--------------|---------------------------|
| `src/utils/roles.ts` | 3-8 | `isAdminUser` usa `obj.rol` | Helper Legacy | **MEDIO** | **SÍ (Paso 5)** | `requirePermission('institution:read')` |
| `src/utils/roles.ts` | 10-12 | `canAccessAdminTeachingTools` | Helper Legacy | **MEDIO** | **SÍ (Paso 5)** | `requirePermission('course:read')` |
| `functions/_lib/roles.ts` | 15-58 | `requireAdmin` | Función Legacy | **ALTO** | **SÍ (Paso 3)** | `@deprecated` → `requireAuthContext + requirePermission` |
| `functions/_lib/roles.ts` | 61-82 | `requireInstitutionAdmin` | Función Legacy | **ALTO** | **SÍ (Paso 3)** | `@deprecated` → `requireInstitutionMatch` |

### 3.3 UI / Navegación (Solo Compatibilidad - MANTENER)

| Archivo | Línea | Código | Categoría | Riesgo | Migrar Ahora | Comentario |
|---------|-------|--------|-----------|--------|--------------|------------|
| `src/components/Sidebar.tsx` | 104 | `user?.rol === 'admin'` | UI/Navegación | **BAJO** | **NO** | Solo render condicional de sección "Administración" |
| `src/components/Sidebar.tsx` | 164 | `user?.rol === 'admin'` | UI/Navegación | **BAJO** | **NO** | Label "Administrador" vs "Docente" en footer |
| `src/components/Topbar.tsx` | 71 | `user?.rol === 'admin' ? 'Administrador' : 'Docente'` | UI/Navegación | **BAJO** | **NO** | Label visual en topbar |
| `src/components/AdminView.tsx` | 161, 348, 347 | `user?.rol === 'admin'`, `u.rol` | UI/Navegación | **BAJO** | **NO** | Botón "Panel Institucional", badges en tabla |
| `src/components/AdminPanelView.tsx` | 161 | `user?.rol === 'admin'` | UI/Navegación | **BAJO** | **NO** | Botón "Panel Institucional" |
| `src/components/AdminPanelView.tsx` | 161, 262, 307 | `newRole`, dropdown roles | UI/Navegación | **BAJO** | **NO** | Dropdown creación/edición usuario |
| `src/components/AdminView.tsx` | 161, 347, 348 | `user?.rol === 'admin'`, `u.rol` | UI/Navegación | **BAJO** | **NO** | Botón panel, badges en tabla |
| `src/components/AdminPanelView.tsx` | 112 | `role: 'user' \| 'assistant'` | LLM Message | **BAJO** | **NO** | Tipo de mensaje LLM |
| `src/components/SlideAssistant.tsx` | 14 | `role: 'user' \| 'assistant'` | LLM Message | **BAJO** | **NO** | Tipo de mensaje LLM |
| `src/components/AgenteView.tsx` | 8 | `role: 'user' \| 'assistant'` | LLM Message | **BAJO** | **NO** | Tipo de mensaje LLM |
| `functions/api/agent.ts` | 25 | `history: { role: 'user' \| 'assistant' }` | LLM Message | **BAJO** | **NO** | Historial LLM |
| `functions/api/ai/[provider].ts` | 18 | `role: 'system'` | LLM System Prompt | **BAJO** | **NO** | Prompt system LLM |
| `functions/api/ai/generate.ts` | 69 | `role: 'system'` | LLM System Prompt | **BAJO** | **NO** | Prompt system LLM |
| `functions/api/ai/mutate-json.ts` | 14 | `role: 'system'` | LLM System Prompt | **BAJO** | **NO** | Prompt system LLM |
| `functions/api/planificar.ts` | 116 | `role: 'system'` | LLM System Prompt | **BAJO** | **NO** | Prompt system LLM |
| `functions/api/ai/generate.ts` | 69 | `role: 'system'` | LLM System Prompt | **BAJO** | **NO** | Prompt system LLM |
| `functions/api/ai/mutate-json.ts` | 14 | `role: 'system'` | LLM System Prompt | **BAJO** | **NO** | Prompt system LLM |

### 3.4 Compatibilidad Legacy / Respuestas API (MANTENER)

| Archivo | Línea | Código | Categoría | Migrar | Comentario |
|---------|-------|--------|-----------|--------|------------|
| `functions/api/auth/login.ts` | 41 | `rol: user.rol` en response | Compatibilidad | **NO** | Response legacy para frontend |
| `functions/api/auth/me.ts` | 34 | `rol: authContext.role` | Compatibilidad | **NO** | Response legacy + nuevos campos |
| `functions/api/auth/register.ts` | N/A | Registro deshabilitado (403) | N/A | N/A | Deshabilitado |
| `src/contexts/AuthContext.tsx` | 8 | `rol: 'docente' \| 'admin'` | Tipo legacy | **NO** | Tipo User legacy |
| `src/types.ts` | - | Tipos legacy compatibles | Tipos | **NO** | Tipos compatibles |

### 3.5 Tests Legacy (Actualizar en Paso 6)

| Archivo | Qué Testea | Acción |
|---------|------------|--------|
| `test/auth-admin.test.ts` | Mocks con `rol: 'docente'` / `'admin'` | Actualizar mocks a `institutionalRole` + `permissions` |
| `test/authorization.context.test.ts` | SQL legacy `rol = ?` | Actualizar o mantener como test de compatibilidad |
| `test/authorization.permissions.test.ts` | Roles en mocks | Actualizar mocks |
| `test/authorization.resources.test.ts` | `role: string` en mocks | Actualizar mocks |

---

## 4. Plan de Migración

### PASO 1 - ✅ COMPLETADO: Inventario
- [x] Inventario completo documentado arriba
- [x] Documento creado: `docs/libro-clases/legacy-role-consumers.md`

### PASO 2 - EN PROGRESO: Migrar Seguridad Backend (Categoría A)

**Archivos a modificar:**
1. `functions/_lib/roles.ts` - Eliminar lógica legacy, delegar a `authorization.ts`
2. `functions/api/admin/usuarios.ts` - Roles válidos desde `ROLE_PERMISSIONS`

### 3.3 Helpers Legacy (Paso 3)

1. `functions/_lib/roles.ts` - Marcar `@deprecated`, delegar a `authorization.ts`
2. `src/utils/roles.ts` - Actualizar `isAdminUser`, `canAccessAdminTeachingTools`

### 3.4 Mapeo Legacy Seguro (Paso 4)

| institutionalRole | rol legacy (compatibilidad) |
|-------------------|----------------------------|
| `super_admin` | `admin` |
| `institution_admin` | `admin` |
| `coordinator` | `admin` (temporal - documentar deuda técnica) |
| `teacher` | `docente` |
| `student` | `student` |

**Regla**: NO mapear `student` → `docente`. Si el tipo legacy no acepta `student`, ampliar el tipo.

---

## 5. Pasos Pendientes

### PASO 2 - Migrar Seguridad Backend (AHORA)
- [ ] `functions/_lib/roles.ts` → delegar a `authorization.ts`
- [ ] `functions/api/admin/usuarios.ts` - roles válidos desde `ROLE_PERMISSIONS`
- [ ] Eliminar lógica `user.rol !== 'admin'` etc.

### PASO 3 - Helpers Legacy
- [ ] `functions/_lib/roles.ts` - `@deprecated`, delegar a `authorization.ts`
- [ ] `src/utils/roles.ts` - Priorizar `institutionalRole` + `permissions`

### PASO 4 - Mapeo Legacy Seguro
- [ ] `mapLegacyRole` en `authorization.ts` o `auth-adapter.ts`

### PASO 5 - src/utils/roles.ts
- [ ] `isAdminUser` → `requirePermission('institution:read')`
- [ ] `canAccessAdminTeachingTools` → `requirePermission('course:read')`
- [ ] Prioridad: `institutionalRole` → `permissions` → `rol` legacy

### PASO 6 - Tests
- [ ] `test/legacy-role-migration.test.ts`
- [ ] `test/role-utils-compatibility.test.ts`
- [ ] Actualizar mocks en tests existentes

### PASO 7 - Auditoría Post-Migración
- Buscar: `.rol ===`, `role ===`, `requireAdmin(`, `requireInstitutionAdmin(`
- Solo permitidos: adaptadores legacy, respuestas compatibilidad, tests, docs

---

## 6. Validaciones Requeridas Antes de Commit

```bash
npx.cmd tsc --noEmit
npm.cmd run test
npm.cmd run build
git status --short
```

**Criterios de éxito:**
- TypeScript: 0 errores
- Tests: 1016/1016 pasan
- Build: OK
- IA intacta (1016 tests pasan)
- Mis Clases intacto
- PlanningAgent intacto
- ProductRenderer intacto
- Frontend funcionalmente intacto

---

## 7. Confirmaciones Requeridas

| Verificación | Estado |
|--------------|--------|
| ✓ IA intacta | 1016 tests pasan |
| ✓ PlanningAgent intacto | 1016 tests pasan |
| ✓ Mis Clases intacto | 1016 tests pasan |
| ✓ DUA intacto | 1016 tests pasan |
| ✓ Evaluaciones intactas | 1016 tests pasan |
| ✓ Presentaciones intactas | 1016 tests pasan |
| ✓ ProductRenderer intacto | 1016 tests pasan |
| ✓ Sin migraciones D1 | ✅ |
| ✓ Sin D1 remoto tocado | ✅ |
| ✓ Sin frontend modificado | ✅ |
| ✓ Sin endpoints de escritura de alto riesgo | ✅ |
| ✓ Sin commit aún | ✅ |
| ✓ Sin deploy | ✅ |

---

## Próximos Pasos Inmediatos

1. **PASO 2**: Modificar `functions/_lib/roles.ts` para delegar a `authorization.ts`
2. **PASO 2**: Actualizar `functions/api/admin/usuarios.ts` - roles válidos desde `ROLE_PERMISSIONS`
3. **PASO 3**: Marcar `functions/_lib/roles.ts` como `@deprecated`
4. **PASO 5**: Actualizar `src/utils/roles.ts` con prioridad `institutionalRole`
5. **PASO 6**: Crear tests de migración
6. **Validar**: `tsc --noEmit && npm test && npm run build`

---

**Estado**: Listo para **PASO 2** - Migración de seguridad backend  
**NO INICIAR** hasta confirmación explícita  
**NO ELIMINAR** `functions/_lib/roles.ts` ni `src/utils/roles.ts` todavía