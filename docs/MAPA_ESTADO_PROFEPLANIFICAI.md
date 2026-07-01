# MAPA DE ESTADO — ProfePlanificAI / PlanificaIA Chile

> Fecha: 2026-07-01
> Commit base: 792844a (main)
> Producción: https://profeplanificai.cl
> Tag producción: v1.2-produccion-presentaciones-premium

---

## 1. ARQUITECTURA ACTUAL

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                   │
│  Vite 6 + React 19 + TypeScript 5.8 + Tailwind 4    │
│  src/main.tsx → src/App.tsx → Views/Components      │
└──────────────────────┬──────────────────────────────┘
                       │ fetch /api/*
┌──────────────────────▼──────────────────────────────┐
│           Cloudflare Pages Functions                 │
│  functions/_middleware.ts → routing                  │
│  functions/api/* → endpoints (48 archivos)           │
│  functions/_lib/* → módulos reutilizables (9)        │
└──────────────────────┬──────────────────────────────┘
                       │ context.env.DB
┌──────────────────────▼──────────────────────────────┐
│              Cloudflare D1 (SQLite)                  │
│  planificaia-db (5 migraciones)                     │
│  ~22 cursos, ~114 asignaturas, ~2000+ OA            │
└─────────────────────────────────────────────────────┘
```

**Stack:**
- Frontend: React 19, TypeScript 5.8, Vite 6, Tailwind 4
- Backend: Cloudflare Pages Functions (48 endpoints)
- DB: Cloudflare D1 (SQLite)
- AI: Google Gemini, Workers AI, mock fallback
- Export: PptxGenJS, jsPDF, html2canvas
- Editor: TipTap (rich text)
- Icons: Lucide React
- Animations: Motion

---

## 2. ENDPOINTS ACTUALES

| Ruta | Método | Función |
|------|--------|---------|
| `/api/courses` | GET | Lista cursos con conteo de OA |
| `/api/subjects` | GET | Lista asignaturas |
| `/api/objectives` | GET | Lista OA con filtros |
| `/api/objectives/:code` | GET | OA específico |
| `/api/curriculum/indicators` | GET | Indicadores curriculares |
| `/api/curriculum/skills` | GET | Habilidades curriculares |
| `/api/curriculum/context` | GET | Contexto curricular |
| `/api/curriculum/analyze-objective` | POST | Analizar OA |
| `/api/curriculum/generate-indicators` | POST | Generar indicadores |
| `/api/curriculum/generate-from-indicator` | POST | Generar desde indicador |
| `/api/curriculum/diagnostics` | GET | Diagnósticos curriculares |
| `/api/agent` | POST | Agente IA genérico |
| `/api/ai/:provider` | POST | IA por proveedor |
| `/api/ai/mutate-json` | POST | Mutación JSON IA |
| `/api/auth/login` | POST | Login |
| `/api/auth/register` | POST | Registro |
| `/api/auth/me` | GET | Sesión actual |
| `/api/resources` | POST/GET | Recursos guardados |
| `/api/data/plans` | GET/POST | Planificaciones |
| `/api/data/recursos` | GET/POST | Recursos |
| `/api/data/evals` | GET/POST | Evaluaciones |
| `/api/data/cursos` | GET/POST | Cursos |
| `/api/data/drive` | GET/POST | Drive |
| `/api/data/collab` | GET/POST | Colaboración |
| `/api/data/shared-documents` | GET/POST | Documentos compartidos |
| `/api/activities` | GET/POST | Actividades |
| `/api/activities/:id` | GET/PUT/DELETE | Actividad específica |
| `/api/generate-activity` | POST | Generar actividad |
| `/api/images/generate` | POST | Generar imagen |
| `/api/images/generate-slide-image` | POST | Imagen para slide |
| `/api/creative-image` | POST | Imagen creativa |
| `/api/reports/generate-parent-feedback` | POST | Informe apoderados |
| `/api/library/save-report` | POST | Guardar informe |
| `/api/share/email` | POST | Compartir por email |
| `/api/admin/dashboard` | GET | Dashboard admin |
| `/api/admin/import-curriculum` | POST | Importar currículo |
| `/api/admin/import-url` | POST | Importar URL |
| `/api/admin/usuarios` | GET/POST | Usuarios |
| `/api/evaluation-resources/search` | GET | Buscar recursos eval |
| `/api/evaluation-resources/link` | POST | Linkear recurso |
| `/api/evaluation-resources/sources` | GET | Fuentes |
| `/api/health` | GET | Health check |

---

## 3. TABLAS D1 ACTUALES

### Migración 001 — Core app
- `usuarios` — Usuarios del sistema
- `sessions` — Sesiones JWT
- `planes` — Planificaciones guardadas
- `recursos` — Recursos guardados
- `evaluaciones` — Evaluaciones guardadas
- `drive_items` — Items de drive
- `drive_folders` — Carpetas drive
- `cursos` — Cursos del docente
- `estudiantes` — Estudiantes por curso
- `colaboracion_posts` — Posts colaboración
- `colaboracion_comentarios` — Comentarios
- `oa_favoritos` — OA favoritos

### Migración 002 — Currículo MINEDUC
- `courses` — Cursos/niveles (22 seeded)
- `subjects` — Asignaturas
- `axes` — Ejes curriculares
- `units` — Unidades
- `objectives` — OA (~2000+)
- `skills` — Habilidades
- `attitudes` — Actitudes
- `objective_skills` — Relación OA-habilidades
- `objective_attitudes` — Relación OA-actitudes
- `resources` — Recursos por OA
- `questions` — Preguntas por OA
- `generated_activities` — Actividades generadas
- `generation_logs` — Logs de generación
- `import_logs` — Logs de importación

### Migración 003 — Imágenes
- `image_cache` — Cache de imágenes

### Migración 004 — Esquema MINEDUC alternativo
- `niveles` — Niveles educativos
- `asignaturas` — Asignaturas
- `nivel_asignatura` — Relación nivel-asignatura
- `objetivos_aprendizaje` — OA simplificado
- `indicadores_evaluacion` — Indicadores
- `habilidades` — Habilidades

### Migración 005 — Indicadores curriculares
- `curriculum_indicators` — Indicadores detallados
- `curriculum_import_batches` — Auditoría importaciones

---

## 4. COMPONENTES PRINCIPALES

| Componente | Función |
|------------|---------|
| `App.tsx` | Router principal |
| `Sidebar.tsx` | Navegación lateral |
| `Topbar.tsx` | Barra superior |
| `AgenteView.tsx` | Agente IA con selectores D1 |
| `PlanificadorView.tsx` | Planificación con D1 |
| `DocenteView.tsx` | Vista docente con D1 |
| `ColaboracionView.tsx` | Colaboración con D1 |
| `DriveView.tsx` | Drive con D1 |
| `LibraryView.tsx` | Biblioteca creativa (presentaciones) |
| `SlideLessonPreview.tsx` | Preview presentaciones |
| `SlideAssistant.tsx` | Asistente IA para slides |
| `GeneratedResourcePanel.tsx` | Panel de resultado |
| `BancoRecursosView.tsx` | Banco de recursos guardados |
| `EvaluacionesView.tsx` | Generador evaluaciones |
| `CurriculumCloudView.tsx` | Nube curricular D1 |
| `ParentReportPanel.tsx` | Informe apoderados |
| `AdaptarPanel.tsx` | Adaptaciones DUA |
| `AdminView.tsx` | Panel admin |
| `LoginView.tsx` | Login |
| `ConfigView.tsx` | Configuración |
| `ReportesView.tsx` | Reportes |
| `DashboardView.tsx` | Dashboard |

---

## 5. FLUJO ACTUAL DE GENERACIÓN

```
LibraryView → seleccionar nivel/asignatura/OA
           → generateSlideLesson(req) [libraryGenerationService]
           → generarConIA() [aiService] → POST /api/agent o fallback local
           → parseSlideJson() → SlideLesson
           → normalizeLessonSlidesToVisualDeck() [presentationAdapter]
           → enhanceDeckWithVisualPrompts() [slideVisualPromptService]
           → VisualLessonDeck con imagePrompt por slide
           → SlideLessonPreview renderiza
           → Guardar: slideSaveService.ts → POST /api/resources
           → Exportar: pptxExportService.ts → .pptx descargable
```

---

## 6. BRECHAS DETECTADAS

### FASE 1 — Núcleo curricular D1
- [ ] Faltan tablas: `methodologies`, `methodology_strategies`, `methodology_subject_fit`
- [ ] Faltan tablas: `resource_templates`, `generated_presentations`
- [ ] Faltan tablas: `curriculum_sources`, `search_documents`, `agent_runs`
- [ ] Faltan tablas: `evaluation_indicators`, `curricular_skills`, `curricular_attitudes`
- [ ] Faltan relaciones: `objective_indicators` (tabla puente)

### FASE 2 — Importador y semillas
- [ ] `scripts/import-curriculum.mjs` existe pero necesita mejorar idempotencia
- [ ] Falta `scripts/seed-methodologies.mjs`
- [ ] Faltan scripts en package.json para import local/remote

### FASE 3 — API curricular
- [ ] Falta `GET /api/curriculum/levels`
- [ ] Falta `GET /api/curriculum/search`
- [ ] Falta `GET /api/methodologies`
- [ ] Falta `POST /api/agents/generate` (agente estructurado)
- [ ] Falta `POST /api/materials/*` (guide, presentation, evaluation, rubric)

### FASE 4 — Motor de búsqueda
- [ ] No existe `src/services/curricularSearchService.ts`
- [ ] No existe endpoint de búsqueda curricular unificada

### FASE 5 — Agentes IA
- [ ] No existe arquitectura de agentes pedagógicos
- [ ] No existe `DocenteChilenoOrchestrator`
- [ ] No existen agentes especializados (CurriculumChile, Methodology, Planning, etc.)
- [ ] Las generaciones actuales no recuperan contexto D1 antes de generar

### FASE 6 — Generador de materiales
- [ ] PPTX existe pero no guarda metadatos en D1
- [ ] Falta generador de guía estudiante/docente
- [ ] Falta generador de planificación clase a clase
- [ ] Falta generador de rúbrica
- [ ] Falta generador de ticket de salida

### FASE 7 — UI Flujo Docente
- [ ] No existe vista unificada "Flujo Docente"
- [ ] LibraryView es el más cercano pero no sugiere metodologías
- [ ] No hay flujo paso a paso integrado

### FASE 8 — Validación
- [ ] npm test: ✅ 36 passed
- [ ] npm run build: ✅ ~8s
- [ ] wrangler pages functions build: ⚠️ no probado recientemente

---

## 7. PLAN DE IMPLEMENTACIÓN POR FASES

| Fase | Descripción | Archivos estimados | Riesgo |
|------|-------------|-------------------|--------|
| **1** | Migración D1 completa | 1 SQL migration | Bajo |
| **2** | Importador + semillas | 2 scripts + package.json | Bajo |
| **3** | API curricular | ~10 functions | Medio |
| **4** | Motor de búsqueda | 1 service + 1 endpoint | Medio |
| **5** | Agentes IA | ~10 archivos _lib/agents | Alto |
| **6** | Generador materiales | ~5 services | Medio |
| **7** | UI Flujo Docente | 1-2 componentes | Medio |
| **8** | Validación completa | Tests + docs | Bajo |

---

## 8. DEPENDENCIAS ACTUALES

### Producción
- React 19, TypeScript 5.8, Vite 6, Tailwind 4
- PptxGenJS, jsPDF, html2canvas
- Lucide React, Motion, TipTap
- Google GenAI SDK

### Dev
- Vitest, Testing Library
- Wrangler 4
- tsx, concurrently

### Sin dependencias nuevas necesarias para Fases 1-4

---

## 9. COMANDOS DISPONIBLES

| Comando | Función |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run local:setup` | Apply D1 migrations local |
| `npm run local:dev` | Build + wrangler pages dev |
| `npm run local:check` | Test + build + functions build |
| `npm run build` | tsc + vite build |
| `npm run test` | Vitest run |
| `npm run import:curriculum` | Import curriculum script |

### Comandos a agregar
- `import:curriculum:local`
- `import:curriculum:remote`
- `seed:methodologies:local`
- `seed:methodologies:remote`
