# AI Integration Audit — Libro de Clases Digital

**Fecha:** 2026-07-12
**Rama:** feature/libro-clases-digital
**Commit:** 4944a4b
**Estado:** Auditoría completa, sin modificaciones

---

## 1. Proveedores IA

| Proveedor | Binding/Key | Modelos | Prioridad |
|-----------|------------|---------|-----------|
| **Cloudflare Workers AI** | `env.AI` (wrangler.toml) | `@cf/meta/llama-3.2-3b-instruct`, `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, `@cf/baai/bge-base-en-v1.5` (embeddings) | 2° |
| **Google Gemini** | `GEMINI_API_KEY` | `gemini-2.5-flash` (default) | 1° (más alta) |
| **OpenRouter** | `OPENROUTER_API_KEY` | `openrouter/auto`, `meta-llama/llama-3.3-70b-instruct:free` | 3° |
| **HuggingFace** | `HUGGINGFACE_API_KEY` | `meta-llama/Llama-3.1-8B-Instruct`, `meta-llama/Llama-3.3-70B-Instruct` | 4° |
| **Local (determinístico)** | Ninguno | Generación basada en plantillas | 5° (siempre disponible) |

---

## 2. Endpoints IA

### 2.1 Endpoints con llamada IA real

| Endpoint | Propósito | Binding IA | Motor |
|----------|-----------|-----------|-------|
| `functions/api/ai/generate.ts` | Generación unificada | `env.AI` vía `orchestrate()` | Orchestrator → cadena de proveedores |
| `functions/api/ai/[provider].ts` | Proxy multi-proveedor | HTTP directo a Gemini/OpenRouter/HuggingFace | Sin motor propio |
| `functions/api/ai/mutate-json.ts` | Mutación JSON de presentaciones | Gemini (preferido) → OpenRouter | Prompt inline |
| `functions/api/planificar.ts` | Planificador RAG | `env.AI` (embeddings + LLM) | Embeddings + Vectorize + LLM directo |
| `functions/api/generate-activity.ts` | Generar actividad pedagógica | Gemini → Workers AI | `generateActivityWithAI()` |
| `functions/api/generate-project.ts` | Generar proyecto + guía DUA | `env.AI` vía `AIEngine` | `PedagogicalEngine` + `AIEngine` + `PlanningAgent` (opcional) |

### 2.2 Endpoints determinísticos (sin IA)

| Endpoint | Propósito |
|----------|-----------|
| `functions/api/materials/generate.ts` | Genera prompts (devuelve al cliente) |
| `functions/api/materials/evaluation.ts` | Evaluaciones basadas en plantillas |
| `functions/api/materials/rubric.ts` | Rúbricas premium por asignatura |
| `functions/api/materials/presentation.ts` | Estructura de diapositivas |
| `functions/api/materials/guide.ts` | Guías estudiante/docente |
| `functions/api/materials/bitacora-cientifica.ts` | Bitácora científica por nivel |
| `functions/api/agents/generate.ts` | Stub con plantillas hardcodeadas |

---

## 3. Agentes Server-Side

### 3.1 Agentes con IA (`functions/core/`)

| Agente | Clase | Extiende | Modelo | Propósito |
|--------|-------|----------|--------|-----------|
| `BaseAgent.ts` | `BaseAgent<T>` | — | `@cf/meta/llama-3.2-3b-instruct` | Clase abstracta base |
| `PlanningAgent.ts` | `PlanningAgent` | `BaseAgent<PlanningOutput>` | `@cf/meta/llama-3.2-3b-instruct` | Planificación completa con fases DUA |
| `AIEngine.ts` | `AIEngine` (estático) | — | `@cf/meta/llama-3.2-3b-instruct` | Guías DUA + contenido de lección |
| `PedagogicalEngine.ts` | `PedagogicalEngine` (estático) | — | Ninguno (solo D1) | Construye plan desde datos curriculares |
| `ContextEngine.ts` | `ContextEngine` | — | Ninguno (solo D1) | **STUB** — define estructura pero no consulta D1 |
| `promptLoader.ts` | — | — | — | Mapea 10 agentes a prompts |
| `types.ts` | — | — | — | Tipos: PedagogicalPlan, LessonContent, DuaGuide |

### 3.2 Agentes de datos (`functions/_lib/agents/`)

| Agente | Clase | IA | Propósito |
|--------|-------|-----|-----------|
| `planning-agent.ts` | `PlanningAgent` | ❌ | Generación basada en plantillas |
| `docente-agent.ts` | `DocenteAgent` | ❌ | Gestión cursos/estudiantes/evaluaciones |
| `slide-agent.ts` | `SlideAgent` | ❌ | Estructura de diapositivas |
| `biblioteca-agent.ts` | `BibliotecaAgent` | ❌ | CRUD biblioteca de recursos |
| `curriculum-chile-agent.ts` | `CurriculumChileAgent` | ❌ | Enriquecimiento curricular |
| `methodology-agent.ts` | `MethodologyAgent` | ❌ | Gestión metodologías |
| `search-agent.ts` | `SearchAgent` | ❌ | Búsqueda full-text FTS5 |

### 3.3 Orquestador

| Archivo | Clase | IA | Propósito |
|---------|-------|-----|-----------|
| `functions/_lib/ai/orchestrator.ts` | — | ✅ | Cadena de proveedores con fallback |
| `functions/_lib/orchestrator/docente-chileno-orchestrator.ts` | `DocenteChilenoOrchestrator` | ❌ | Orquestación multi-tarea vía fetch interno |

---

## 4. Agentes Client-Side

| Archivo | Clase | Estado | Propósito |
|---------|-------|--------|-----------|
| `src/core/BaseAgent.ts` | `BaseAgent<T>` | ✅ Implementado | Mirror del server-side |
| `src/core/ContextEngine.ts` | `ContextEngine` | ⚠️ Stub | Estructura definida |
| `src/core/promptLoader.ts` | — | ✅ Implementado | Mismo map de prompts |
| `src/core/agents/PlanningAgent.ts` | `PlanningAgent` | ✅ Implementado | Planificación completa |
| `src/core/agents/AIReviewAgent.ts` | `AIReviewAgent` | ⚠️ Stub | "not yet implemented" |
| `src/core/agents/PresentationAgent.ts` | `PresentationAgent` | ⚠️ Stub | "not yet implemented" |

---

## 5. Prompts

| Archivo | Agente | Propósito |
|---------|--------|-----------|
| `src/prompts/planning_agent.md` | planning_agent | Planificación pedagógica chilena con DUA, neurodiversidad, Bloom |
| `src/prompts/evaluation_agent.md` | evaluation_agent | Evaluaciones formativas/sumativas, rúbricas, SIMCE, tickets |
| `src/prompts/dua_agent.md` | dua_agent | UDL: 3 principios, 3 niveles, estrategias concretas por barrera |
| `src/prompts/presentation_agent.md` | presentation_agent | Diseño de presentaciones (estilo Gamma/Canva) |
| `src/prompts/ai_review_agent.md` | ai_review_agent | Revisión de calidad: profundidad, claridad, alineación, DUA, Bloom |
| `src/prompts/project_agent.md` | project_agent | Proyectos ABP/PBL: 5 fases, preguntas detonadoras, habilidades XXI |
| `src/prompts/resource_agent.md` | resource_agent | Curación de recursos: 17+ tipos, metadatos, DUA |
| `src/prompts/rubric_agent.md` | rubric_agent | Rúbricas analíticas/holísticas, 3-4 niveles, descriptores observables |
| `src/prompts/bitacora_agent.md` | bitacora_agent | Bitácora científica: 4 niveles (prebásica→media) |
| `src/prompts/scientific_agent.md` | scientific_agent | Investigación científica (variante de bitacora) |
| `src/prompts/simce_agent.md` | simce_agent | Preparación SIMCE: formato oficial, 4 alternativas, claves |

**Nota:** Los `.md` son copias de referencia. Los prompts reales están en `functions/core/promptLoader.ts` (PROMPT_MAP) y `functions/_lib/ai/prompts.ts`.

---

## 6. Context Engine — Flujo Activo

### 6.1 ContextEngine (STUB — no activo)
- `functions/core/ContextEngine.ts` y `src/core/ContextEngine.ts`
- Define `PedagogicalContext` pero todos los `fetch*` retornan arrays vacíos

### 6.2 Contexto real (`functions/_lib/ai/context.ts`)
- **Este es el sistema activo** de enriquecimiento de contexto
- Fuentes: D1 (objectives, indicators, skills, attitudes, methodologies, strategies, templates, search_documents) + Vectorize (búsqueda semántica `REPO_PEDAGOGICO`)
- Modelo de embeddings: `@cf/baai/bge-base-en-v1.5`
- Output: `pedagogicalContext` string (hasta 8000 chars) añadido al request IA

---

## 7. Feature Flags

| Flag | Ubicación | Default | Propósito |
|------|-----------|---------|-----------|
| `ENABLE_PREMIUM_PLANNING_AGENT` | `functions/api/generate-project.ts` | `false` | Activa PlanningAgent premium para generación de proyectos |
| `ENABLE_IMAGE_AI` | `functions/_lib/images.ts`, `functions/api/images/generate.ts` | `false` | Activa imágenes IA (Cloudflare AI / HuggingFace) |
| `AI_DEFAULT_MODEL_GEMINI` | `functions/_lib/ai/providers.ts` | `gemini-2.5-flash` | Permite sobreescribir modelo Gemini |
| `DEBUG` | Varios | `false` | Logging verbose |
| `NODE_ENV` | Varios | — | Modo desarrollo |

---

## 8. Fallbacks

| Ubicación | Tipo de Fallback | Descripción |
|-----------|-----------------|-------------|
| `functions/_lib/ai/orchestrator.ts` | **Cadena de proveedores** | gemini → workers-ai → openrouter → huggingface → local |
| `functions/_lib/ai/orchestrator.ts` | **`localFallback()`** | Genera contenido pedagógico completo determinísticamente |
| `functions/_lib/ai.ts` | **`mockActivity()`** | Sin proveedor configurado → estructura con warning |
| `functions/core/AIEngine.ts` | **`buildFallbackDuaGuide()`** | Guía DUA completa sin IA (500+ líneas) |
| `functions/core/AIEngine.ts` | **`buildFallbackLessonContent()`** | Contenido básico de lección |
| `functions/api/ai/mutate-json.ts` | **Gemini → OpenRouter** | Gemini primero; si falta key, OpenRouter |
| `functions/api/generate-project.ts` | **PlanningAgent fallback** | Si premium falla, usa plan + DUA estándar |
| `functions/_lib/images.ts` | **Cadena de imágenes** | wikimedia → cloudflare-ai → pollinations → huggingface → SVG |
| `functions/_lib/ai/providers.ts` | **`local` provider** | Siempre `available: true` con `fallback-pedagogico` |

---

## 9. Integración IA por Feature

### 9.1 Mis Clases

```
MisClases.tsx
  → misClasesService.ts
    → /api/lessons/[id]/generate-actividades-clase
      → orchestrate() → cadena proveedores
    → /api/lessons/[id]/generate-evaluation
      → orchestrate()
    → /api/lessons/[id]/generate-resource
      → orchestrate()
    → /api/lessons/[id]/generate-presentation
      → materials/presentation.ts (determinístico)
```

### 9.2 Evaluaciones

```
EvaluacionesView.tsx
  → evaluationGeneratorService.ts
    → /api/ai/generate (agentType: 'evaluador')
      → orchestrate()
    → /api/ai/generate (agentType: 'simce')
      → orchestrate()
    → /api/ai/generate (agentType: 'rubrica')
      → orchestrate()
```

### 9.3 DUA

```
DuaGuideGenerator.tsx
  → /api/generate-project
    → PedagogicalEngine.buildPlan() (D1, sin IA)
    → AIEngine.generateDuaGuide() (Workers AI)
    → Fallback: buildFallbackDuaGuide() (determinístico)
```

### 9.4 Presentaciones

```
FlujoDocenteView.tsx
  → materialGeneratorService.ts
    → /api/materials/presentation (determinístico)
    → buildPremiumPptModel() (client-side)
    → generatePremiumPptx() (client-side)
  → SlideAssistant.tsx
    → /api/ai/mutate-json (Gemini → OpenRouter)
```

### 9.5 Proyecto/ABP

```
ProjectCopilot.tsx
  → /api/generate-project
    → PedagogicalEngine + AIEngine
    → PlanningAgent (si flag activo)
    → Fallback: plan + DUA estándar
```

---

## 10. Cadena de Orquestación

```
Cliente → /api/ai/generate
  → orchestrate(env, req, teacherId)
    → enrichAIRequestWithPedagogicalContext()  ← D1 + Vectorize
    → validateRequest()                        ← validación
    → scanForSecrets()                         ← seguridad
    → buildSystemPrompt()                      ← prompt del agente
    → providerChain:
        1. Gemini (si GEMINI_API_KEY existe)
        2. Workers AI (si env.AI existe)
        3. OpenRouter (si OPENROUTER_API_KEY existe)
        4. HuggingFace (si HUGGINGFACE_API_KEY existe)
        5. localFallback() (siempre disponible)
    → parseResponse()
    → validateOutput()
    → return GenerationResult<T>
```

---

## 11. Observaciones Clave

1. **Tres patrones de integración IA:** orquestador (flexible), motor (Cloudflare), proveedor directo (HTTP)
2. **La mayoría de materials son determinísticos** — evaluation, rubric, presentation, guide, bitacora NO llaman IA
3. **ContextEngine es un stub** — el contexto real lo maneja `functions/_lib/ai/context.ts`
4. **Agentes client-side son stubs** — solo PlanningAgent está implementado
5. **Fallback robusto** — toda llamada IA tiene al menos un nivel de respaldo
6. **Feature flags mínimos** — solo 2 flags controlan comportamiento IA

---

## 12. Reutilización para Libro de Clases

### ✅ Reutilizar directamente

| Componente | Uso en Libro |
|-----------|-------------|
| `orchestrate()` | Generación de contenido diario, resúmenes, observaciones |
| `PlanningAgent` | Generación de planificación anual y unidades |
| `AIEngine.generateDuaGuide()` | Adaptaciones DUA por sesión |
| `ContextEngine` (completar) | Enriquecimiento de contexto pedagógico |
| `enrichAIRequestWithPedagogicalContext()` | Contexto para IA del Libro |
| `buildFallbackDuaGuide()` | Fallback DUA |
| `pedagogicalProductProfiles` | Perfiles de material |
| `promptLoader` + prompts existentes | Mismos prompts para planificación |

### ⚠️ Reutilizar con extensión

| Componente | Extensión necesaria |
|-----------|-------------------|
| `PedagogicalEngine` | Agregar consulta de academic_years, terms |
| `ContextEngine` | Completar stubs con queries reales |
| `agent_runs` | Registrar ejecuciones del Libro |

### ⚪ No reutilizar

| Componente | Razón |
|-----------|-------|
| Client-side agents (stubs) | No implementados |
| `SlideAgent`, `BibliotecaAgent`, etc. | No relevantes para Libro |
| `DocenteChilenoOrchestrator` | Temprano, no probado |

---

## 13. Riesgos de IA para Libro de Clases

| Riesgo | Nivel | Mitigación |
|--------|-------|-----------|
| AI no disponible | ALTO | Fallback determinístico obligatorio |
| Contexto incompleto | MEDIO | Completar ContextEngine antes de usar |
| Tokens excesivos | MEDIO | Limitar contexto a 8000 chars |
| Respuesta inválida | ALTO | Validación estricta post-generación |
| Costo Gemini | BAJO | Cadena de fallback reduce dependencia |
