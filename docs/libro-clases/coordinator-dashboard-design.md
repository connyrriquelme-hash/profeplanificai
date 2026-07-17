# Panel del Coordinador Académico — Diseño FASE 6.8

> Documento de auditoría y diseño para implementar el panel funcional del coordinador académico en el Libro de Clases Digital.

---

## 1. Datos Ya Disponibles

### Tablas de Base de Datos (D1)

| Tabla | Columnas Clave | Usada por |
|-------|----------------|-----------|
| `coordinator_scopes` | `user_id`, `institution_id`, `course_ids_json`, `subject_ids_json`, `level_ids_json`, `academic_year_id`, `is_active` | Scope del coordinador |
| `class_sessions` | `id`, `institution_id`, `academic_year_id`, `course_id`, `subject_id`, `teacher_id`, `date`, `status`, `version`, `taught_content`, `objective_ids_json`, `lesson_plan_id` | Sesiones, métricas, cobertura |
| `attendance_records` | `id`, `institution_id`, `class_session_id`, `student_id`, `status`, `recorded_by` | Asistencia |
| `planning_reviews` | `id`, `institution_id`, `planning_id`, `reviewer_id`, `status`, `comments`, `created_at` | Revisiones |
| `signature_events` | `id`, `institution_id`, `class_session_id`, `user_id`, `signed_version`, `result`, `signed_at` | Firmas |
| `student_observations` | `id`, `institution_id`, `academic_year_id`, `course_id`, `student_id`, `category`, `visibility`, `follow_up_date`, `created_by`, `archived_at` | Observaciones |
| `course_subject_assignments` | `id`, `institution_id`, `academic_year_id`, `course_id`, `subject_id`, `teacher_id`, `coordinator_id`, `is_active` | Asignaciones |
| `lesson_plan_curriculum` | `lesson_plan_id`, `objective_id`, `indicator_ids_json`, `skill_ids_json`, `attitude_ids_json` | OA por planificación |
| `lesson_plans` | `id`, `institution_id`, `academic_year_id`, `course_id`, `subject_id`, `teacher_id` | Planes de clase |
| `teacher_classes` | `id`, `institution_id`, `name`, `subject_id`, `teacher_id`, `is_active` | Cursos |
| `subjects` | `id`, `name`, `code` | Asignaturas |
| `users` / `usuarios` | `id`, `email`, `nombre`, `rol`, `active` | Usuarios |
| `institution_members` | `user_id`, `institution_id`, `role`, `status` | Membresía institucional |

### Servicios Backend Existentes

- `CoordinatorDashboardService` (946 líneas) — **Completo** con 8 métodos:
  - `getDashboardSummary()` — KPIs consolidados
  - `getTeachersSummary()` — Cumplimiento por docente
  - `getCoursesSummary()` — Cobertura por curso
  - `getSessionsSummary()` — Listado de sesiones
  - `getPendingReviews()` — Revisiones pendientes
  - `getPendingSignatures()` — Firmas pendientes
  - `getCoverage()` — Cobertura curricular OA
  - `getAlerts()` — Alertas operativas (9 tipos)

- `ClassSessionService`, `AttendanceService`, `PlanningReviewService`, `SignaturesService`, `ObservationService` — CRUD base

### Endpoints API Existentes (`/api/classbook/coordinator/`)

| Endpoint | Método | Permiso | Servicio |
|----------|--------|---------|----------|
| `/dashboard` | GET | `report:scope` | `getDashboardSummary` |
| `/teachers` | GET | `report:scope` | `getTeachersSummary` |
| `/courses` | GET | `report:scope` | `getCoursesSummary` |
| `/sessions` | GET | `classbook:read` | `getSessionsSummary` |
| `/planning-reviews` | GET | `classbook:review` | `getPendingReviews` |
| `/signatures` | GET | `classbook:read` | `getPendingSignatures` |
| `/coverage` | GET | `report:scope` | `getCoverage` |
| `/alerts` | GET | `report:scope` | `getAlerts` |

### Tipos TypeScript (Backend + Frontend Idénticos)

- `CoordinatorDashboardFilters` — 9 filtros
- `CoordinatorDashboardSummary` — 13 métricas
- `CoordinatorTeacherSummary` — 10 campos
- `CoordinatorCourseSummary` — 10 campos
- `CoordinatorSessionSummary` — 9 campos
- `CoordinatorPlanningSummary` — 8 campos
- `CoordinatorSignatureSummary` — 9 campos
- `CoordinatorCoverageSummary` — 8 campos
- `CoordinatorAlert` — 11 campos + 9 tipos + 3 severidades

### Componentes Frontend Existentes (`src/components/classbook/coordinator/`)

| Componente | Props | Función |
|------------|-------|---------|
| `CoordinatorDashboardHeader` | `academicYearName`, `termName` | Encabezado |
| `CoordinatorSummaryCards` | `summary` | 8 tarjetas KPI |
| `CoordinatorFilters` | `filters`, `onFilterChange`, lists | Filtros 8 campos |
| `TeacherComplianceTable` | `teachers[]` | Tabla ordenada por % cumplimiento |
| `CourseCoverageTable` | `courses[]` | Tabla con badges color |
| `PendingReviewsPanel` | `reviews[]` | Lista revisiones con badge |
| `PendingSignaturesPanel` | `signatures[]` | Lista firmas pendientes |
| `CoordinatorAlertsPanel` | `alerts[]` | Alertas con severidad |
| `CurriculumCoverageChart` | `coverage[]` | Gráfico barras horizontal CSS |
| `SessionStatusChart` | `summary` | Barras apiladas CSS |

### Servicios Frontend

- `classbookService` — 8 métodos coordinador:
  - `getCoordinatorDashboard()`, `getCoordinatorTeachers()`, `getCoordinatorCourses()`
  - `getCoordinatorSessions()`, `getCoordinatorPlanningReviews()`, `getCoordinatorPendingSignatures()`
  - `getCoordinatorCoverage()`, `getCoordinatorAlerts()`

### Permisos Frontend (`classbookPermissions.ts`)

```typescript
canViewCoordinatorDashboard(user)  // coordinator, institution_admin, super_admin, report:scope
canApproveReview(user)              // plan:approve
canObserveReview(user)              // plan:observe
canReturnReview(user)               // plan:review
```

### Autorización Backend (`authorization.ts`)

- `requireCoordinatorScope(context, courseId, subjectId, env)` — Valida scope por curso/asignatura
- `requirePermission(context, 'report:scope')` — Permiso base dashboard
- Jerarquía roles: `super_admin` (4) > `institution_admin` (3) > `coordinator` (2) > `teacher` (1) > `student` (0)

---

## 2. Datos Faltantes / Brechas

| Área | Qué Falta | Impacto |
|------|-----------|---------|
| **Vista Principal** | `CoordinatorDashboardView.tsx` (página/route) | No hay punto de entrada |
| **Rutas** | `/libro-clases/coordinacion` en router | Inaccesible |
| **Navegación** | Link en Sidebar / ClassbookSidebar | No descubrible |
| **Filtros Dinámicos** | Carga de `academicYears`, `terms`, `courses`, `subjects`, `teachers` para `<select>` | `CoordinatorFilters` recibe props vacíos |
| **Acciones en Revisiones** | Botones Aprobar / Observar / Devolver en `PendingReviewsPanel` | Solo lectura |
| **Acciones en Firmas** | Link a sesión / ver detalle en `PendingSignaturesPanel` | Solo lectura |
| **Alertas Accionables** | Link a recurso en `CoordinatorAlertsPanel` | Solo informativas |
| **Gráficos Avanzados** | `CurriculumCoverageChart` y `SessionStatusChart` solo CSS básico | Sin interacción / tooltip |
| **Tests** | 6 archivos de test requeridos | Sin cobertura |
| **Permiso Extra** | `classbook:sign_pending` usado en backend, no en frontend | Inconsistencia |

---

## 3. Métricas Posibles (Sin IA)

Todas calculadas con SQL puro en `CoordinatorDashboardService`:

| Métrica | Fuente | Descripción |
|---------|--------|-------------|
| **Cursos supervisados** | `class_sessions` + scope | `COUNT(DISTINCT course_id)` |
| **Docentes supervisados** | `class_sessions` + scope | `COUNT(DISTINCT teacher_id)` |
| **Sesiones programadas** | `class_sessions` | `status = 'scheduled'` |
| **Sesiones completadas** | `class_sessions` | `status = 'completed'` |
| **Sesiones pendientes** | `class_sessions` | `status IN ('open','pending_signature')` |
| **Sesiones sin contenido** | `class_sessions` | `completed` + `taught_content IS NULL/empty` |
| **Sesiones sin asistencia** | `class_sessions` + `attendance_records` | `completed` + NOT IN attendance |
| **Sesiones pendientes de firma** | `class_sessions` | `status = 'pending_signature'` |
| **Revisiones pendientes** | `planning_reviews` | `status = 'pending'` |
| **Revisiones observadas** | `planning_reviews` | `status = 'observed'` |
| **Asistencia promedio** | `attendance_records` | `present / total * 100` |
| **Observaciones abiertas** | `student_observations` | `archived_at IS NULL` |
| **Cobertura OA estimada** | `lesson_plan_curriculum` + `objective_ids_json` | `worked_oa / total_oa * 100` |
| **% Cumplimiento docente** | `class_sessions` por teacher | `completed / total * 100` |
| **Cobertura por curso** | `lesson_plan_curriculum` + `class_sessions` | Por curso/asignatura |

---

## 4. Reglas de Scope

El coordinador **solo ve datos dentro de su scope** (`coordinator_scopes`):

| Dimensión | Origen | Aplicación |
|-----------|--------|------------|
| `institutionId` | `institution_members` + token | Todas las queries |
| `courseIds[]` | `coordinator_scopes.course_ids_json` | Filtro `cs.course_id IN (...)` |
| `subjectIds[]` | `coordinator_scopes.subject_ids_json` | Filtro `cs.subject_id IN (...)` |
| `levelIds[]` | `coordinator_scopes.level_ids_json` | Validación en asignación (no en queries directas) |
| `academicYearIds[]` | `coordinator_scopes.academic_year_id` | Filtro `cs.academic_year_id IN (...)` |

**Reglas de acceso por rol:**

| Rol | Scope Aplicado |
|-----|----------------|
| `super_admin` | **Global** — sin filtro de scope |
| `institution_admin` | **Institución completa** — solo `institution_id` |
| `coordinator` | **Scope asignado** — cursos/asignaturas/años de `coordinator_scopes` |
| `teacher` | **Denegado** — 403 en dashboard |
| `student` | **Denegado** — 403 en dashboard |

**Validación:** Todos los endpoints usan `requirePermissionContext(env, 'report:scope')` + scope automático en service.

---

## 5. Vistas Necesarias

| Vista / Pestaña | Componente Principal | Datos | Acciones |
|-----------------|---------------------|-------|----------|
| **Resumen** | `CoordinatorSummaryCards` + `SessionStatusChart` + `CurriculumCoverageChart` + `PendingReviewsPanel` + `PendingSignaturesPanel` + `CoordinatorAlertsPanel` | `DashboardSummary`, `Coverage[]`, `PlanningSummary[]`, `SignatureSummary[]`, `Alert[]` | Navegar a pestañas |
| **Docentes** | `TeacherComplianceTable` | `TeacherSummary[]` | Ordenar, filtrar, ver detalle |
| **Cursos** | `CourseCoverageTable` | `CourseSummary[]` | Filtrar, ver detalle cobertura |
| **Sesiones** | Tabla sessions (existente en `ClassSessionList` adaptada) | `SessionSummary[]` | Filtrar por estado/fecha/docente/curso |
| **Revisiones** | `PendingReviewsPanel` + **botones acción** | `PlanningSummary[]` | **Aprobar / Observar / Devolver** |
| **Firmas** | `PendingSignaturesPanel` + **link a sesión** | `SignatureSummary[]` | Ver detalle sesión |
| **Cobertura** | `CurriculumCoverageChart` + `CourseCoverageTable` | `CoverageSummary[]` | Filtrar por curso/asignatura |
| **Alertas** | `CoordinatorAlertsPanel` + **link a recurso** | `Alert[]` | Navegar a recurso origen |

---

## 6. Endpoints Propuestos (Ya Implementados)

| Endpoint | Método | Permiso | Filtros | Respuesta |
|----------|--------|---------|---------|-----------|
| `/api/classbook/coordinator/dashboard` | GET | `report:scope` | 8 filtros | `CoordinatorDashboardSummary` |
| `/api/classbook/coordinator/teachers` | GET | `report:scope` | 4 filtros | `CoordinatorTeacherSummary[]` |
| `/api/classbook/coordinator/courses` | GET | `report:scope` | 3 filtros | `CoordinatorCourseSummary[]` |
| `/api/classbook/coordinator/sessions` | GET | `classbook:read` | 8 filtros | `CoordinatorSessionSummary[]` |
| `/api/classbook/coordinator/planning-reviews` | GET | `classbook:review` | 1 filtro | `CoordinatorPlanningSummary[]` |
| `/api/classbook/coordinator/signatures` | GET | `classbook:read` | 3 filtros | `CoordinatorSignatureSummary[]` |
| `/api/classbook/coordinator/coverage` | GET | `report:scope` | 3 filtros | `CoordinatorCoverageSummary[]` |
| `/api/classbook/coordinator/alerts` | GET | `report:scope` | 1 filtro | `CoordinatorAlert[]` |

**Escritura existente (reutilizar):**
- `PATCH /api/classbook/planning-reviews/[id]` — Aprobar / Observar / Devolver (permiso `plan:approve` / `plan:observe` / `plan:review`)

---

## 7. Componentes Frontend Propuestos

### Ya Creados (10/10)
- ✅ `CoordinatorDashboardHeader`
- ✅ `CoordinatorSummaryCards`
- ✅ `CoordinatorFilters`
- ✅ `TeacherComplianceTable`
- ✅ `CourseCoverageTable`
- ✅ `PendingReviewsPanel`
- ✅ `PendingSignaturesPanel`
- ✅ `CoordinatorAlertsPanel`
- ✅ `CurriculumCoverageChart`
- ✅ `SessionStatusChart`

### Por Crear / Completar (5)

| Componente | Descripción |
|------------|-------------|
| `CoordinatorDashboardView.tsx` | Página principal con tabs, fetch paralelo, estado loading/error/empty |
| `PendingReviewsPanel` — **acciones** | Botones Aprobar / Observar / Devolver con `onAction` callback |
| `PendingSignaturesPanel` — **link** | Link a `/libro-clases/{sessionId}` |
| `CoordinatorAlertsPanel` — **link** | Link a recurso (`resourceType` + `resourceId`) |
| `CoordinatorFilters` — **data fetch** | Cargar options de años, términos, cursos, asignaturas, docentes |

---

## 8. Riesgos de Privacidad

| Riesgo | Mitigación |
|--------|------------|
| **Fuga cross-institution** | `requireInstitutionMatch` + scope en todas las queries |
| **Coordinador ve cursos ajenos** | `requireCoordinatorScope` valida `courseIds` y `subjectIds` |
| **Teacher ve dashboard** | `canViewCoordinatorDashboard` + `requirePermission('report:scope')` → 403 |
| **Student ve dashboard** | Mismo que teacher |
| **Datos personales estudiantes** | Solo nombres en observaciones/asistencia; scope limita a cursos asignados |
| **Filtros frontend amplían scope** | Backend **siempre** re-valida scope; frontend no puede bypass |

---

## 9. Matriz de Acceso

| Acción | super_admin | institution_admin | coordinator | teacher | student |
|--------|-------------|-------------------|-------------|---------|---------|
| Ver dashboard (`/coordinacion`) | ✅ Global | ✅ Institución | ✅ Scope | ❌ 403 | ❌ 403 |
| Ver resumen KPIs | ✅ | ✅ | ✅ Scope | ❌ | ❌ |
| Ver tabla docentes | ✅ | ✅ | ✅ Scope | ❌ | ❌ |
| Ver tabla cursos | ✅ | ✅ | ✅ Scope | ❌ | ❌ |
| Ver sesiones | ✅ | ✅ | ✅ Scope | ❌ | ❌ |
| Ver revisiones pendientes | ✅ | ✅ | ✅ Scope | ❌ | ❌ |
| **Aprobar revisión** | ✅ | ✅ | ✅ `plan:approve` | ❌ | ❌ |
| **Observar revisión** | ✅ | ✅ | ✅ `plan:observe` | ❌ | ❌ |
| **Devolver revisión** | ✅ | ✅ | ✅ `plan:review` | ❌ | ❌ |
| Ver firmas pendientes | ✅ | ✅ | ✅ Scope | ❌ | ❌ |
| Ver cobertura curricular | ✅ | ✅ | ✅ Scope | ❌ | ❌ |
| Ver alertas | ✅ | ✅ | ✅ Scope | ❌ | ❌ |
| Filtrar por año/período/curso | ✅ | ✅ | ✅ Scope | ❌ | ❌ |

---

## 10. Plan de Implementación por Bloques

### Bloque A — Página y Rutas (30 min)
1. Crear `src/pages/CoordinatorDashboardView.tsx` con:
   - Tabs: Resumen | Docentes | Cursos | Sesiones | Revisiones | Firmas | Cobertura | Alertas
   - `useEffect` con `Promise.all` para 8 fetches paralelos
   - Estados: loading, error, empty
   - Integración componentes existentes
2. Agregar route `/libro-clases/coordinacion` en `App.tsx` / router`
3. Agregar link en `Sidebar` (sección "Gestión Escolar") visible para coordinator+
4. Agregar tab en `ClassbookSidebar` (opcional)

### Bloque B — Datos para Filtros (20 min)
1. En `CoordinatorDashboardView`: fetch `academicYears`, `terms`, `courses`, `subjects`, `teachers` al montar
2. Pasar a `CoordinatorFilters` como props
2. Filtrar `courses`/`subjects`/`teachers` por `selectedYear` si aplica

### Bloque C — Acciones Revisiones (30 min)
1. Extender `PendingReviewsPanel` con props `onApprove`, `onObserve`, `onReturn`
2. En `CoordinatorDashboardView`: handlers que llaman `PATCH /api/classbook/planning-reviews/[id]`
3. Optimistic UI + toast + refresh

### Bloque D — Navegación Firmas y Alertas (15 min)
1. `PendingSignaturesPanel`: link a `/libro-clases/{sessionId}` 
2. `CoordinatorAlertsPanel`: link según `resourceType`:
   - `class_session` → `/libro-clases/{resourceId}`
   - `planning_review` → tab revisiones
   - `student_observation` → tab observaciones

### Bloque D — Gráficos Avanzados (opcional, 20 min)
1. `CurriculumCoverageChart`: tooltip al hover, click filtra tabla cursos
2. `SessionStatusChart`: click filtra pestaña sesiones por estado

### Bloque E — Tests (60 min)
| Archivo | Casos Mínimos |
|---------|---------------|
| `test/coordinatorDashboardService.test.ts` | 10 casos (vacío, filtros scope, métricas, alertas) |
| `test/coordinatorDashboardEndpoints.test.ts` | 4 casos (auth, permisos, filtros, respuesta ok/data) |
| `test/coordinatorDashboardAuthorization.test.ts` | 8 casos (roles matrix) |
| `test/coordinatorDashboardView.test.tsx` | 11 casos (loading, error, empty, tabs, permisos) |
| `test/coordinatorCoverage.test.ts` | 4 casos (cálculo OA, vacío, scope) |
| `test/coordinatorAlerts.test.ts` | 4 casos (9 tipos, severidad, scope) |

### Bloque F — Validación Final (10 min)
```bash
npx.cmd tsc --noEmit           # 0 errores
npm.cmd run test               # 1306+ tests pass
npm.cmd run build              # OK
npx.cmd wrangler pages functions build  # OK
```

---

## Resumen de Estado Actual

| Categoría | Estado | Completitud |
|-----------|--------|-------------|
| **Backend Service** | ✅ Completo | 946 líneas, 8 métodos |
| **API Endpoints** | ✅ 8/8 | Todos con auth + scope |
| **Types (TS)** | ✅ Idénticos FE/BE | 123 líneas |
| **Componentes UI** | ✅ 10/10 | Todos con a11y, badges, empty states |
| **Servicio Frontend** | ✅ 8 métodos | Tipado completo |
| **Permisos FE** | ✅ 4 funciones | `canViewCoordinatorDashboard`, etc. |
| **Permisos BE** | ✅ | `requireCoordinatorScope`, `report:scope` |
| **Página/Vista** | ❌ Falta | `CoordinatorDashboardView.tsx` |
| **Routing** | ❌ Falta | Route + Sidebar link |
| **Datos Filtros** | ❌ Falta | Fetch options para selects |
| **Acciones Revisiones** | ⚠️ Parcial | Solo lectura, falta Aprobar/Observar/Devolver |
| **Navegación Firmas/Alertas** | ⚠️ Parcial | Solo lectura, falta links |
| **Tests** | ❌ Falta | 6 archivos requeridos |

---

## Próximos Pasos Inmediatos

1. **Crear `CoordinatorDashboardView.tsx`** — Punto de entrada principal
2. **Registrar ruta** `/libro-clases/coordinacion` + protección auth
3. **Agregar a Sidebar** — Item "Coordinación Académica" (icono `LayoutDashboard`)
4. **Conectar filtros dinámicos** — Fetch years/terms/courses/subjects/teachers
5. **Implementar acciones revisiones** — Botones en `PendingReviewsPanel`
6. **Tests críticos** — Al menos service + endpoints + auth matrix