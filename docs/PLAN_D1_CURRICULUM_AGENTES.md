# PLAN — D1 Curriculum Agentes Pedagógicos

**Objetivo:** Implementar una arquitectura de agentes especializados en el currículum chileno que aprovecha la nueva base de datos D1 (migración 007) con las 20+ nuevas tablas.

---

## 1. ARQUITECTURA DE AGENTES

### 1.1 Patrón de diseño General

```
┌─────────────────────────────────────────────────────┐
│              DocenteChilenoOrchestrator              │
│  • Coordina todas las actividades docentes          │
│  • Mantiene estado de sesión y contexto            │
│  • Orquesta agentes especializados                  │
└──────────────────────┬──────────────────────────────┘
                        │
┌──────────────────────▼──────────────────────────────┐
│                     Agentes especializados            │
│  • CurriculumChileAgent      → OA, indicadores, habilidades  │
│  • MethodologyAgent         → Metodologías pedagógicas    │
│  • PlanningAgent            → Planificaciones clase a clase│
│  • BibliotecaAgent          → Recursos y presentaciones   │
│  • SlideAgent              → Slides y visualizaciones     │
│  • DocenteAgent            → Gestión de cursos y alumnos  │
│  • SearchAgent             → Búsqueda unificada                 │
└─────────────────────────────────────────────────────┘
```

### 1.2 Clasificación de Agentes

| Agente | Misión | Base de datos D1 principal | Líneas de producto |
|--------|---------|-------------------------|-------------------|
| **CurriculumChileAgent** | Acceso y procesamiento del currículum oficial chileno | `education_levels`, `subjects`, `curriculum_axes`, `learning_objectives`, `evaluation_indicators`, `curricular_skills`, `curricular_attitudes` | `api/curriculum/levels`, `api/curriculum/subjects`, `api/curriculum/objectives`, `api/curriculum/context` |
| **MethodologyAgent** | Gestión de metodologías pedagógicas y adecuación tema-asignatura | `methodologies`, `methodology_strategies`, `methodology_subject_fit` | `api/methodologies`, `api/materials/guide` (con metodología) |
| **PlanningAgent** | Planificaciones clase a clase con contexto D1 | `generated_resources`, `resource_templates`, `methodologies` | `api/materials/planning`, `api/materials/presentation` |
| **BibliotecaAgent** | Biblioteca creativa (slides, recursos, presentaciones) | `generated_resources`, `generated_presentations`, `resource_templates` | `api/materials/presentation`, `api/materials/guide`, `api/materials/rubric` |
| **SlideAgent** | Slides y visualizaciones pedagógicas | `generated_resources`, `resource_templates`, `curricular_skills` | `api/materials/presentation`, `api/images/generate-slide-image` |
| **DocenteAgent** | Gestión de cursos, alumnos y progreso docente | `usuarios`, `drive_items`, `agent_runs` | `api/courses`, `api/subjects`, `api/docente/*` |
| **SearchAgent** | Búsqueda unificada en todo el currículum | `search_documents`, `learning_objectives`, `evaluation_indicators` | `api/curriculum/search`, `api/curriculum/search-indices` |

---

## 2. AGENTE CURRICULUM CHILE

### 2.1 Responsabilidades Principales

- **Consulta de niveles educativos**: Obtener todos los niveles (Educación Parvularia, Básica, Media)
- **Consulta de asignaturas por nivel**: Filtrar asignaturas según nivel educativo
- **Consulta de ejes por asignatura**: Obtener ejes para asignatura específica
- **Consulta y análisis de OA**: Recuperar objetivos de aprendizaje completos con todos sus indicadores, habilidades y actitudes asociados
- **Generación de contexto enriquecido**: Construir contexto pedagógico completo para cada OA
- **Búsqueda y filtraje de currículum**: Permitir búsqueda por código OA, nivel, asignatura, eje

### 2.2 Contexto Clave D1 Recuperado

```typescript
// Ejemplo: Para OA específico, recuperar todo el contexto
current_context = {
  oa: {
    id: 'objective-123',
    code: 'OA-M-LL-01',
    description: 'Leer obras literarias...',
    type: 'OA',
    // Campos enriquecidos desde D1:
    subject_name: 'Lengua y Literatura',
    course_name: '1° medio',
    axis_name: 'Lectura',
    level: 'Educación Media',
    indicators: [
      { id: 'ind-1', code: 'IND-1', description: 'Identifican temas central...' },
      { id: 'ind-2', code: 'IND-2', description: 'Interpretan símbolos...' }
    ],
    skills: [
      { id: 'skill-1', code: 'HAB-1', description: 'Analizar obras...' }
    ],
    attitudes: [
      { id: 'att-1', code: 'ACT-1', description: 'Valorar diversidad...' }
    ]
  }
}
```

### 2.3 Líneas de Producto

- **GET /api/curriculum/levels** → Todos los niveles educativos con metadatos
- **GET /api/curriculum/subjects** → Asignaturas filtradas por nivel
- **GET /api/curriculum/objectives** → OA con contexto completo (ya existe, enriquecido)
- **GET /api/curriculum/context** → Contexto enriquecido para OA/specificaciones
- **POST /api/curriculum/analyze-objective** → Análisis profundo con D1

---

## 3. AGENTE METHODOLOGY

### 3.1 Responsabilidades Principales

- **Busqueda de metodologías**: Filtrar metodologías por nivel, asignatura o enfoque pedagógico
- **Evaluación de adecuación**: Calcular nivel de adecuación método-asignatura (`excellent`, `good`, `adequate`, `poor`, `unsuitable`)
- **Obtener estrategias**: Recuperar estrategias metodológicas asociadas
- **Generación de sugerencias**: Sugerir metodologías con contexto D1 completo
- **Mapeo bidireccional**: Recorrer ambas relaciones `methodology_subject_fit` y `methodology_strategies`

### 3.2 Consultas D1 Requeridas

```sql
-- Adecuación método-asignatura
SELECT m.*, ms.fit_level, ms.adaptation_notes
FROM methodologies m
JOIN methodology_subject_fit ms ON ms.methodology_id = m.id
WHERE ms.subject_id = ? AND ms.fit_level IN ('excellent', 'good')

-- Estrategias de metodología
SELECT * FROM methodology_strategies
WHERE methodology_id = ?
ORDER BY created_at
```

### 3.3 Líneas de Producto

- **GET /api/methodologies** → Todas las metodologías con niveles adecuados
- **GET /api/methodologies/subject/:subjectId** → Metodologías adecuadas para asignatura
- **POST /api/materials/guide** → Generar guía con metodología seleccionada
- **POST /api/materials/presentation** → Crear presentación con metodología

---

## 4. AGENTE PLANNING

### 4.1 Responsabilidades Principales

- **Recuperación de plantillas**: Obtener templates de planificación desde `resource_templates`
- **Ejecución de planificación**: Generar planificación clase a clase con contexto OA completo
- **Aplicación de metodología**: Integrar metodología apropiada al planning
- **Coordinación de recursos**: Asociar recursos y actividades al planning generado

### 4.2 Contexto Clave D1

```typescript
// Planning con metodología enriquecida
planning_data = {
  oa_context: {...}, // Del CurriculumChileAgent
  methodology: {
    id: 'method-abp',
    name: 'Aprendizaje Basado en Proyectos',
    strategies: ['Plantear pregunta desafiante...', 'Formar equipos colaborativos...'],
    adaptation_notes: 'Excelente para Lengua y Literatura'
  },
  templates: {
    guide: 'Plantilla guía ABP',
    evaluation: 'Rúbrica de evaluación',
    activities: ['Actividad 1: ...', 'Actividad 2: ...']
  }
}
```

### 4.3 Líneas de Producto

- **POST /api/materials/planning** → Generar planificación clase a clase
- **POST /api/materials/guide** → Generar guía con metodología
- **POST /api/materials/presentation** → Crear presentación de planificación

---

## 5. AGENTE BIBLIOTECA

### 5.1 Responsabilidades Principales

- **Recuperación de templates**: Obtener templates de recursos y presentaciones
- **Generación de recursos**: Crear recursos pedagógicos con metadatos completos del currículum
- **Gestión de presentaciones**: Generar presentaciones tipo PPT con contexto D1 enriquecido
- **Control de versiones**: Guardar recursos generados con contexto curricular completo

### 5.2 Contexto Clave D1

```typescript
// Resource con metadatos enriquecidos
resource_data = {
  id: 'resource-abc123',
  user_id: 'user-xyz',
  objective_id: 'objective-123',
  resource_type: 'presentation' | 'guide' | 'evaluation' | 'rubric',
  // Metadatos contextuales:
  level: 'Educación Media',
  subject: 'Lengua y Literatura',
  course: '1° medio',
  oa_code: 'OA-M-LL-01',
  methodology: {...}, // Del MethodologyAgent
  indicators: [...], // Del CurriculumChileAgent
  skills: [...], // Del CurriculumChileAgent
  attitudes: [...], // Del CurriculumChileAgent
  template: {
    id: 'template-guide-001',
    format: 'ppt-with-slides',
    sections: ['Propósito', 'Desarrollo', 'Evaluación']
  }
}
```

### 5.3 Líneas de Producto

- **GET /api/library/resources** → Todos los recursos con metadatos D1
- **POST /api/materials/presentation** → Generar presentación desde template
- **POST /api/materials/guide** → Generar guía desde template
- **GET /api/library/reports** → Reportes con contextos de recursos

---

## 6. COORDINADOR DE AGENTES: DOCENTE CHILENO

### 6.1 Responsabilidades Principales

- **Validación de sesión**: Verificar autenticación de usuario y contexto de sesión
- **Coordinación de agentes**: Modularizar carga de trabajo entre agentes especializados
- **Persistencia de contexto**: Guardar contexto multi-agente en `agent_runs`
- **Asignación de recursos**: Distriburar tareas entre agentes según especialización
- **Monitoreo de ejecución**: Real-time tracking de ejecuciones de agentes con logs completos

### 6.2 Gestión de Estado

```typescript
interface DocenteChilenoContext {
  userSession: UserSession;
  curriculumAgent: CurriculumChileAgent;
  methodologyAgent: MethodologyAgent;
  planningAgent: PlanningAgent;
  libraryAgent: BibliotecaAgent;
  currentTask?: AgentTask;
  previousExecutions: AgentExecution[];
  curriculumEnrichment: CurriculumContextEnrichment;
}

interface AgentExecution {
  id: string;
  agent_name: string; // 'curriculum', 'methodology', 'planning', 'library'
  task_type: string;
  input: any;
  output: any;
  duration_ms: number;
  tokens_used: number;
  status: 'completed' | 'failed' | 'cancelled';
  curriculum_context_json: string; // Enriched OA, indicators, skills, etc.
  created_at: string;
}
```

### 6.3 Líneas de Producto

- **POST /api/agents/generate** → Endpoint unificado para cualquier generación de material con contexto D1
- **GET /api/agents/executions** → Historial de ejecuciones con contextos enriquecidos
- **GET /api/agents/status** → Estado en vivo de todos los agentes
- **DELETE /api/agents/execution/:id** → Limpiar ejecución antigua (respetar datos D1)

---

## 7. AGENTE DE BÚSQUEDA

### 7.1 Responsabilidades Principales

- **Indexación unificada**: Indexar todos los elementos del currículum en `search_documents`
- **Búsqueda full-text**: Búsqueda en título, contenido y tags_json usando SQL LIKE + search_vector
- **Búsqueda contextual**: Filtrar por nivel, asignatura, eje, código OA
- **Búsqueda semántica**: Usar search_vector de SQLite para similitud vectorial

### 7.2 Consultas Clave D1

```sql
-- Búsqueda unificada
SELECT sd.*, 
       CASE sd.doc_type 
         WHEN 'objective' THEN lo.description
         WHEN 'indicator' THEN ei.description  
         WHEN 'skill' THEN cs.description
         WHEN 'attitude' THEN ca.description
         WHEN 'methodology' THEN m.name
         WHEN 'template' THEN rt.name
         WHEN 'resource' THEN gr.title
       END AS content_snippet,
       lo.code AS objective_code,
       s.name AS subject_name,
       a.name AS axis_name,
       el.name AS level_name
FROM search_documents sd
LEFT JOIN learning_objectives lo ON sd.ref_id = lo.id AND sd.doc_type = 'objective'
LEFT JOIN evaluation_indicators ei ON sd.ref_id = ei.id AND sd.doc_type = 'indicator'
LEFT JOIN curricular_skills cs ON sd.ref_id = cs.id AND sd.doc_type = 'skill'
LEFT JOIN curricular_attitudes ca ON sd.ref_id = ca.id AND sd.doc_type = 'attitude'
LEFT JOIN methodologies m ON sd.ref_id = m.id AND sd.doc_type = 'methodology'
LEFT JOIN resource_templates rt ON sd.ref_id = rt.id AND sd.doc_type = 'template'
LEFT JOIN generated_resources gr ON sd.ref_id = gr.id AND sd.doc_type = 'resource'
LEFT JOIN subjects s ON lo.subject_id = s.id
LEFT JOIN curriculum_axes a ON lo.axis_id = a.id
LEFT JOIN education_levels el ON s.education_level_id = el.id
WHERE sd.title LIKE ? OR sd.content LIKE ?
ORDER BY sd.created_at DESC
```

### 7.3 Líneas de Producto

- **GET /api/curriculum/search** → Búsqueda unificada con filtros
- **GET /api/curriculum/search-indices** → Construir/organizar índices de búsqueda
- **POST /api/curriculum/index** → Indexar nuevo recurso/curriculum
- **GET /api/search/suggestions** → Sugerencias de búsqueda basadas en patrones de uso

---

## 8. COHESIÓN DEL CONTEXTO CURRICULAR

### 8.1 Módulo de enriquecimiento de contexto

```typescript
interface CurriculumContextEnrichment {
  // Jerarquía principal
  levels: EducationLevel[];
  subjects: Subject[];
  curriculumAxes: CurriculumAxis[];
  // Objetivo y asociaciones
  learningObjectives: LearningObjective[];
  // Competencias transversales
  evaluationIndicators: EvaluationIndicator[];
  curricularSkills: CurricularSkill[];
  curricularAttitudes: CurricularAttitude[];
  
  // Relaciones enriquecidas
  indicatorsByObjective: Map<string, EvaluationIndicator[]>;
  skillsByObjective: Map<string, CurricularSkill[]>;
  attitudesByObjective: Map<string, CurricularAttitude[]>;
  
  // Metadatos contextuales
  methodologiesBySubject: Map<string, MethodologyWithFit[]>;
  strategiesByMethodology: Map<string, MethodologyStrategy[]>;
  
  // Para enriquecer cualquier generación
  getFullContextForOA(oaId: string): {
    oa: LearningObjective;
    indicators: EvaluationIndicator[];
    skills: CurricularSkill[];
    attitudes: CurricularAttitude[];
    subjectInfo: Subject;
    axisInfo: CurriculumAxis;
    levelInfo: EducationLevel;
    suitableMethodologies: MethodologyWithFit[];
  }
}
```

### 8.2 Flujo de enriquecimiento

1. **Solicitar contexto**: `getFullContextForOA(oaId)` → Recuperar jerarquía completa
2. **Añadir metodologías**: `getSuitableMethodologies(subjectId)` → Filtrar por adecuación
3. **Completar habilidades transversales**: Incluir todas las habilidades/atitudes asociadas
4. **Exportar para agentes**: Convertir a JSON para uso por agentes secundarios

---

## 9. NOTAS DE IMPLEMENTACIÓN

### 9.1 Entorno D1 Esperado

Después de la migración 007_curriculum_core.sql, las tablas disponibles son:

- `education_levels` (niveles educativos)
- `subjects` (asignaturas)  
- `curriculum_axes` (ejes)
- `learning_objectives` (objetivos de aprendizaje)
- `evaluation_indicators` (indicadores de evaluación)
- `curricular_skills` (habilidades curriculares)
- `curricular_attitudes` (actitudes curriculares)
- `methodologies` (metodologías pedagógicas)
- `methodology_strategies` (estrategias metodológicas)
- `methodology_subject_fit` (adecuación método-asignatura)
- `resource_templates` (templates de recursos)
- `generated_resources` (recursos creados)
- `generated_presentations` (presentaciones creadas)
- `curriculum_sources` (fuentes curriculares)
- `objective_indicators` (relación objetivo-indicador)
- `objective_skills` (relación objetivo-habilidad)
- `objective_attitudes` (relación objetivo-actitud)
- `search_documents` (documentos de búsqueda)
- `agent_runs` (ejecuciones de agentes)

### 9.2 Archivos a Crear/Modificar

#### Nuevos archivos:

- `functions/_lib/agents/curriculum-chile-agent.ts` (CurriculumChileAgent)
- `functions/_lib/agents/methodology-agent.ts` (MethodologyAgent)
- `functions/_lib/agents/planning-agent.ts` (PlanningAgent)
- `functions/_lib/agents/biblioteca-agent.ts` (BibliotecaAgent)
- `functions/_lib/agents/slide-agent.ts` (SlideAgent)
- `functions/_lib/agents/docente-agent.ts` (DocenteAgent)
- `functions/_lib/agents/search-agent.ts` (SearchAgent)
- `functions/_lib/orchestrator/docente-chileno-orchestrator.ts` (DocenteChilenoOrchestrator)

#### Servicios existentes a enriquecer:

- `src/services/curricularSearchService.ts` (generar índices de búsqueda)
- `src/services/curriculumImportService.ts` (enriquecer importaciones con contexto)

#### Enpoints API nuevos:

- `functions/api/curriculum/levels.ts` (GET /api/curriculum/levels)
- `functions/api/curriculum/methodologies.ts` (GET /api/methodologies)
- `functions/api/curriculum/search.ts` (GET /api/curriculum/search)
- `functions/api/materials/guide.ts` (POST /api/materials/guide - con metodología)
- `functions/api/materials/planning.ts` (POST /api/materials/planning)
- `functions/api/materials/presentation.ts` (POST /api/materials/presentation con metodología)
- `functions/api/materials/rubric.ts` (POST /api/materials/rubric con contexto completo)
- `functions/api/materials/ticket.ts` (POST /api/materials/ticket con contexto completo)
- `functions/api/agents/generate.ts` (POST /api/agents/generate unificado)

---

## 10. RUTA DE EJECUCIÓN DE LA FASE

1. **Completar migración D1**: Ejecutar `007_curriculum_core.sql`
2. **Probar tablas**: Verificar inserción de datos de seed en `methods/seed-methodologies.mjs`
3. **Implementar agente de currículum**: `CurriculumChileAgent` con todas las consultas D1
4. **Implementar agente de metodología**: `MethodologyAgent` con adecuación tema-asignatura
5. **Implementar enriquecimiento de contexto**: Módulo unificado para recuperar jerarquía completa
6. **Implementar orquestador**: `DocenteChilenoOrchestrator` que coordina todos los agentes
7. **Probar líneas de producto**: Cada endpoint API con contexto D1 enriquecido
8. **Validar flujo completo**: Generar material con contexto curricular completo

---

## 11. VALIDACIÓN Y MONITOREO

### 11.1 Métricas Clave

- **Contexto enriquecido**: % de generaciones con contexto curricular completo
- **Precisión de metodologías**: % de recomendaciones de metodología con adecuación `excellent` o `good`
- **Índices de búsqueda**: Velocidad y precisión de búsquedas unificadas
- **Rendimiento de agentes**: Tiempo de respuesta de cada agente especializado
- **Precisión semántica**: Puntuación de relevancia de búsqueda vectorial

### 11.2 Monitoreo de agent_runs

```sql
INSERT INTO agent_runs (
  id, agent_name, user_id, input_json, 
  context_json, output_json, duration_ms, tokens_used,
  status, curriculum_context_json, ai_provider, ai_model,
  created_at
) VALUES (
  ?, 'curriculum-chile-orchestrator', ?,
  json_input, json_context, json_output,
  ?, ?, 'completed', json_enriched_context,
  ?, ?, datetime('now')
)
```

---

Esta arquitectura de agentes especializados aprovecha toda la nueva estructura de la base de datos D1 para generar materiales pedagógicos verdaderamente contextualizados y enriquecidos. Cada agente puede ser desarrollado, probado e implementado independientemente, mientras que el orquestador garantiza una experiencia de generación de materiales fluida y contextualizada.

El resultado es una plataforma que no solo genera materiales pedagógicos, sino que los enriquece con el contexto curricular completo del currículum nacional chileno, proporcionando a los docentes recursos que verdaderamente reflejan el marco educativo oficial que están enseñando.
