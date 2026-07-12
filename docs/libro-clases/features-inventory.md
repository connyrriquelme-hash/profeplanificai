# Features Inventory — Libro de Clases Digital

**Fecha:** 2026-07-12
**Rama:** feature/libro-clases-digital
**Commit:** 4944a4b
**Estado:** Auditoría completa, sin modificaciones

---

## 1. Usuarios / Auth

**Archivos:** `src/components/LoginView.tsx`, `src/contexts/AuthContext.tsx`, `src/utils/roles.ts`

### Login
- Email + password (mínimo 6 caracteres)
- Token en `localStorage` (`planificaia_token`)
- Verificación automática al cargar (`/api/auth/me`)
- Formulario de solicitud de prueba (`TrialRequestForm`)

### Roles
- `docente` (default), `admin`
- Función `isAdminUser()` detecta: `admin`, `administrator`, `super_admin`, `owner`
- Views restringidas: `mis-clases`, `unidades-didacticas`

### Sesiones
- Listar, revocar individual, revocar todas las demás
- Multi-sesión con userAgent y expiración

---

## 2. Mis Clases

**Archivo:** `src/components/MisClases.tsx` (939 líneas)

### Panels
- **Izquierdo:** Configurar clase (tipo bloque, fecha, hora, currículo, metodología)
- **Derecho:** 6 tabs

### Tabs
| Tab | Contenido |
|-----|-----------|
| Semana | Calendario lun-vie, estadísticas semanales |
| Clase | Detalle de lección: OA, Inicio, Desarrollo, Cierre, Metodología, Comentarios |
| Curriculo | Alineación curricular de la lección |
| Recursos IA | Generación IA de recursos |
| Evaluacion | Generación IA de evaluaciones |
| Bloques no lectivos | Gestión de NTBs |

### Ciclo de Vida de Lección
```
planificada → en_preparacion → realizada
                                pendiente
```

### Datos del LessonBundle
- lesson (instancia), plan (planificación), curriculum, methodologies, resources, evaluations, comments, attachments

---

## 3. Workspace

**Archivos:** `src/components/WorkspaceView.tsx`, `src/components/Workspace.tsx` (924 líneas)

- Selección curricular desde D1
- Indicadores, habilidades, actitudes
- Asistente IA con contexto pedagógico
- Campos: indicadores, estructura de clase, recursos, evaluación
- Guardar en biblioteca local y nube
- Compartir vía documentos compartidos
- Exportar/imprimir

---

## 4. Flujo Docente

**Archivo:** `src/components/FlujoDocenteView.tsx` (695 líneas)

### 11 Tipos de Producto
| ID | Producto |
|----|----------|
| `guia_estudiante` | Guía Estudiante |
| `guia_docente` | Guía Docente |
| `planificacion` | Planificación |
| `evaluation_exit_ticket` | Ticket de Salida |
| `evaluation_321` | Formato 3-2-1 |
| `evaluation_checklist` | Lista de Cotejo |
| `evaluation_formative_rubric` | Rúbrica Analítica |
| `evaluation_traffic_light` | Semáforo |
| `bitacora_cientifica` | Bitácora Científica IA |
| `rubrica` | Rúbrica Premium |
| `presentacion` | Presentación PPT |

### Pipeline
- Formularios → endpoints de materiales → `ProductRenderer` → guardar en banco
- Presentaciones con imágenes IA opcionales

---

## 5. Calendario

**Dentro de:** `MisClases.tsx` (tab "Semana")

- Grilla 5 días (lun-vie)
- Bloques de enseñanza (coloreados) + bloques no lectivos (borde ámbar)
- Estadísticas: horas totales, enseñanza, no lectivas, porcentaje
- Navegación: anterior, hoy, siguiente
- AdminPanelView: plantillas de calendario institucional

---

## 6. Unidades Didácticas

**Archivo:** `src/components/UnidadesDidacticasView.tsx` (483 líneas)

- Solo admin
- 5 metodologías: Tradicional, ABP, Gamificación, Aula Invertida, Design Thinking
- Multi-OA across subjects
- Genera clases estructuradas por fases metodológicas
- Vista Generador + Organizador

---

## 7. Lecciones

### Estados
`planificada` → `en_preparacion` → `realizada` | `pendiente`

### Estructura
- objective_text, purpose_text, beginning_text, development_text, closure_text
- challenge_question, abp_project_text, resources_text, evaluation_text
- instruments_text, dua_adjustments_text, teacher_observations

### Endpoints
- CRUD: POST/GET/PATCH/DELETE `/api/lessons`
- Autosave: POST `/api/lessons/:id/autosave`
- IA: generate-actividades-clase, generate-resource, generate-evaluation, generate-presentation

---

## 8. Currículo

**Archivo:** `src/components/CurriculumCloudView.tsx` (306 líneas)

- Navegación: Cursos → Asignaturas → OA
- Búsqueda con debounce
- Detalle OA: texto oficial, habilidades, actitudes, recursos, preguntas
- Copiar código + texto al portapapeles

---

## 9. Banco de Recursos

**Archivo:** `src/components/BancoRecursosView.tsx` (592 líneas)

### Tabs
| Tab | Contenido |
|-----|-----------|
| Mis Planificaciones | Planes de clase (nube + local) |
| Mis Recursos | Todos los recursos guardados |
| Mis Evaluaciones | Evaluaciones, rúbricas, tickets, SIMCE |

### Tipos
guia_aprendizaje, ficha_trabajo, actividad, recurso_dua, reforzamiento, extension, material_apoderados, banco_preguntas, ticket, rubrica, evaluacion, pauta, prueba, simce, retroalimentacion, planificacion, presentacion

---

## 10. Evaluaciones

**Archivo:** `src/components/EvaluacionesView.tsx` (1168 líneas)

### 12 Tipos
diagnostica, sumativa, simce, simce_breve, banco_preguntas, rubrica, holistica, exit_ticket, 3-2-1, checklist, formative_rubric, traffic_light

### Configuración
- Dificultad: Progresiva, Básica, Intermedia, Avanzada
- Habilidades cognitivas (11)
- Opciones: alternativas, desarrollo, pauta, retroalimentación, tabla, DUA

### Generación
- Prompt build → `/api/ai/generate` → orchestrator → resultado
- Exportar: Word (DOCX), HTML, PDF, portapapeles

---

## 11. Reportes

**Archivo:** `src/components/ReportesView.tsx` (642 líneas)

- "Informe Final Formativo" alineado a MINEDUC
- Configuración: nombre escuela, profesor, fecha, puntaje máximo, nota mínima, porcentaje requerido
- Grilla de calificaciones por estudiante × indicador
- Escala chilena 1-7
- Niveles: Adecuado (≥90%), Elemental (≥60%), Insuficiente (<60%), No evaluado
- Exportar: PDF individual, PDF resumen clase

---

## 12. Administración

### AdminView (459 líneas)
- Dashboard: estadísticas del sistema
- Usuarios: CRUD, activar/desactivar
- Sesiones: listar, revocar

### AdminPanelView (487 líneas)
- Instituciones: CRUD
- Calendario: plantillas institucionales
- Usuarios: miembros por institución
- Soporte
- Auditoría: log de acciones admin
- Onboarding: checklist de configuración

---

## 13. Guía DUA

**Archivo:** `src/pages/DuaGuideGenerator.tsx` (470 líneas)

- Generador multinivel
- Instrucción diferenciada por niveles de apoyo
- CurriculumSelector para OA
- Guardar en banco

---

## 14. Project Copilot

**Archivo:** `src/components/ProjectCopilot.tsx` (614 líneas)

- Planificación de proyectos ABP con IA
- Tema + selección curricular → proyecto completo
- Guardar en banco

---

## 15. Panel Compartido

**Archivo:** `src/components/SharedPanelView.tsx` (399 líneas)

- Compartir documentos con permisos (owner/editor/viewer/commenter)
- Link de compartir con token
- Comentarios
- Vista pública vía `?shared={token}`

---

## 16. Navegación (App.tsx)

### 16 Views
| View ID | Componente |
|---------|-----------|
| dashboard | DashboardView |
| workspace | WorkspaceView |
| mis-clases | MisClases |
| flujo-docente | FlujoDocenteView |
| evaluaciones | EvaluacionesView |
| banco | CurriculumCloudView |
| banco-recursos | BancoRecursosView |
| panel-compartido | SharedPanelView |
| unidades-didacticas | UnidadesDidacticasView |
| reportes | ReportesView |
| dua-guide | DuaGuideGenerator |
| project-copilot | ProjectCopilot |
| admin | AdminView |
| admin-panel | AdminPanelView |

### Sidebar
- HERRAMIENTAS IA: Inicio, Flujo Docente, Mis Clases, Espacio de Trabajo, Unidades Didácticas, Evaluaciones, Guía DUA, Project Copilot, Reportes
- GESTIÓN ESCOLAR: Banco de Recursos, Panel Compartido

---

## 17. Resumen para Libro de Clases

### ✅ Reutilizable directamente

| Feature | Uso en Libro |
|---------|-------------|
| Auth/Roles | Autenticación y permisos por rol |
| Mis Clases | Base para sesiones diarias |
| Calendario | Vista semanal del Libro |
| Lecciones | Ciclo de vida de sesiones |
| Currículo | Selección OA e indicadores |
| Evaluaciones | Evaluaciones vinculadas a sesiones |
| Banco de Recursos | Recursos por sesión |
| Reportes | Informes de progreso |
| Guía DUA | Adaptaciones por sesión |
| AdminPanel | Configuración institucional |

### ⚠️ Reutilizable con extensión

| Feature | Extensión |
|---------|-----------|
| Mis Clases | Agregar asistencia, firma, versionado |
| Evaluaciones | Vincular a student_profiles |
| Reportes | Agregar progreso individual por estudiante |
| AdminPanel | Agregar gestión de cursos, importación |

### ⚪ No reutilizar

| Feature | Razón |
|---------|-------|
| Workspace | Espacio de trabajo libre, no aplica |
| Unidades Didácticas | Solo admin, funcionalidad separada |
| Panel Compartido | No relevante para Libro |
