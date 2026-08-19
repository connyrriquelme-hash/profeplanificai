import { generatePlanificacion } from '../../core/PlanificacionEngine';
import { getProfePlanificAIContext, getExpertContext, getExpertEvaluationContext, getExpertDUAContext } from '../../core/ExpertKnowledge';
import type { AIEngineEnv } from '../../core/types';

interface Env { DB: D1Database; AI?: Ai; GEMINI_API_KEY?: string }

interface GenerateRequest {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  attitudes?: string[];
  methodology?: string;
  topic: string;
  additionalContext?: string;
  designStyle?: string;
  duration?: string;
  studentCount?: number;
}

function getContextFromD1(db: D1Database, req: GenerateRequest): Promise<any> {
  return Promise.all([
    db.prepare(`SELECT o.*, c.name as course_name, s.name as subject_name, a.name as axis_name
      FROM objectives o LEFT JOIN courses c ON o.course_id = c.id LEFT JOIN subjects s ON o.subject_id = s.id LEFT JOIN axes a ON a.id = o.axis_id
      WHERE o.code = ?`).bind(req.objectiveCode).first(),
    db.prepare(`SELECT ci.indicator_text FROM curriculum_indicators ci WHERE ci.oa_code = ? LIMIT 10`).bind(req.objectiveCode).all(),
    db.prepare(`SELECT m.name, m.description, m.steps_json FROM methodologies m WHERE m.name LIKE ? LIMIT 3`).bind(`%${req.methodology || ''}%`).all(),
  ]);
}

function buildMaterialPrompt(type: string, req: GenerateRequest, context: any): string {
  const [objective, indicators, methodologies] = context;
  const obj = objective as any || {};
  const indList = (indicators as any)?.results?.map((i: any) => i.indicator_text).filter(Boolean) || [];
  const methList = (methodologies as any)?.results || [];

  const baseContext = [
    `Nivel: ${req.level}`,
    `Asignatura: ${req.subject}`,
    `OA: ${req.objectiveCode} — ${req.objectiveText}`,
    obj.course_name ? `Curso: ${obj.course_name}` : '',
    obj.subject_name ? `Asignatura oficial: ${obj.subject_name}` : '',
    obj.axis_name ? `Eje: ${obj.axis_name}` : '',
    indList.length > 0 ? `Indicadores: ${indList.join('; ')}` : '',
    methList.length > 0 ? `Metodología sugerida: ${methList.map((m: any) => m.name).join(', ')}` : '',
    req.topic ? `Tema: ${req.topic}` : '',
    req.additionalContext ? `Contexto adicional del docente: ${req.additionalContext}` : '',
    req.duration ? `Duración disponible: ${req.duration}` : '',
    req.studentCount ? `Estudiantes: ${req.studentCount}` : '',
  ].filter(Boolean).join('\n');

  // Contexto experto completo inyectado en TODOS los productos
  const expertBlock = `
${getProfePlanificAIContext()}

${getExpertContext()}

${getExpertEvaluationContext()}

${getExpertDUAContext()}
`;

  const prompts: Record<string, string> = {
    guia_estudiante: `${expertBlock}

CONTEXTO DEL PRODUCTO A GENERAR:
${baseContext}

TAREA: Genera una GUIA DE ESTUDIANTE en formato JSON que sea un PRODUCTO CONCRETO que los estudiantes FABRICARAN, no una guia para rellenar.

ESTRUCTURA JSON REQUERIDA:
{
  "title": "Titulo atractivo que refleje el producto a crear",
  "objective": "Que aprenderan los estudiantes (NO copiar el OA literal, reformular en lenguaje simple)",
  "productType": "Tipo de producto tangible a fabricar (pasaporte, prototipo, poster, podcast, maqueta, etc.)",
  "instructions": "Instrucciones paso a paso para crear el producto",
  "activities": [
    {
      "name": "Nombre de la actividad",
      "type": "tipo (exploracion/creacion/evaluacion/investigacion)",
      "description": "Descripcion concreta con QUE hara el estudiante, COMO se agrupara, y QUE producto observable producira",
      "steps": ["Paso 1 con accion concreta", "Paso 2...", "Paso 3..."],
      "time": "minutos estimados",
      "materials": ["materiales necesarios (priorizar reciclados/bajo costo)"],
      "bloomLevel": "nivel de Bloom que evalua"
    }
  ],
  "vocabulary": ["termino: definicion simple"],
  "selfAssessment": [
    {"question": "pregunta de metacognicion", "type": "reflexion"},
    {"question": "pregunta de aplicacion", "type": "aplicacion"}
  ],
  "adaptations": {
    "tea": "adaptacion concreta para TEA",
    "tdah": "adaptacion concreta para TDAH",
    "discalculia": "adaptacion si aplica",
    "disgrafia": "adaptacion si aplica"
  },
  "techTools": ["herramienta digital sugerida (Canva, Scratch, Google Forms, etc.)"],
  "techAlternative": "alternativa no digital para colegios sin connectivity"
}

REGLAS OBLIGATORIAS:
1. El producto debe ser ALGO QUE LOS ESTUDIANTES CREEN (no solo preguntas para responder)
2. Minimo 3 actividades con TIPO y NIVEL DE BLOOM distintos
3. Cada actividad con TIEMPO ESTIMADO y MATERIALES concretos
4. Minimo 5 TIPOS DE PREGUNTAS distintos en toda la guia (Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear)
5. Al menos 1 adaptacion concreta por perfil neurodiverso (TEA, TDAH, discalculia, disgrafia)
6. Materiales prioritariamente reciclados o de bajo costo
7. Ejemplos del contexto chileno (geografia, cultura, calendario escolar)
8. Herramienta digital sugerida + alternativa no digital
9. Lenguaje accesible para el rango etario de ${req.level}
10. Cada paso de instruccion debe ser ACCIONABLE y CONCRETO (nunca "dialogar", "comentar", "reflexionar" sin especificar QUE exactamente haran)`,

    guia_docente: `${expertBlock}

CONTEXTO DEL PRODUCTO A GENERAR:
${baseContext}

TAREA: Genera una GUIA DOCENTE en formato JSON que sea una RUTA DE APRENDIZAJE DINAMICA, no una planificacion estatica.

ESTRUCTURA JSON REQUERIDA:
{
  "title": "Titulo de la ruta de aprendizaje",
  "objective": "OA reformulado en lenguaje docente (NO copiar literal)",
  "duration": "tiempo total estimado",
  "materials": ["materiales necesarios (reciclados/bajo costo)"],
  "digitalTools": ["herramientas digitales sugeridas"],
  "digitalAlternative": "alternativa no digital",
  "phases": [
    {
      "name": "Fase del metodo (Empatizar/Definir/Idear/Prototipar/Testear o similar)",
      "activity": "Descripcion concreta de la actividad",
      "time": "minutos",
      "grouping": "como se agrupan (individual/pareja/grupo/estacion)",
      "bloomLevel": "nivel de Bloom",
      "product": "que producto observable producen los estudiantes"
    }
  ],
  "opening": {"activity": "...", "time": "min", "retrieval": "pregunta de recuperacion activa"},
  "development": {"activity": "...", "time": "min", "movement": "momento de movimiento si aplica"},
  "closure": {"activity": "...", "time": "min", "metacognition": "pregunta metacognitiva"},
  "differentiation": {
    "apoyo": "estrategia para tier 1 (apoyo maximo)",
    "estandar": "estrategia para tier 2",
    "desafio": "estrategia para tier 3 (extension)"
  },
  "neurodiversity": {
    "tea": "adaptacion concreta (agenda visual, instrucciones literales, etc.)",
    "tdah": "adaptacion concreta (chunks, movimiento, cronometro, etc.)",
    "otras": "otras adaptaciones relevantes"
  },
  "assessment": {
    "type": "formativa o sumativa (Decreto 67)",
    "methods": ["metodos de evaluacion variados"],
    "rubric": "criterios de evaluacion observables"
  },
  "peAlignment": "como se conecta con PEI/PME del establecimiento",
  "communityExtension": "posible extension a la comunidad"
}

REGLAS OBLIGATORIAS:
1. Estructura DINAMICA: no repetir "inicio-desarrollo-cierre" identico. Varia por clase.
2. Cada fase debe tener: tiempo, agrupacion, nivel Bloom, producto observable
3. Minimo 3 MODALIDADES distintas (visual, auditiva, kinestesica, lecto-escritura, digital, social)
4. Minimo 5 TIPOS DE PREGUNTAS distintos
5. Al menos 1 momento de MOVIMIENTO FISICO por clase
6. Al menos 1 adaptacion neurodiversidad por fase
7. Retrieval practice al inicio, metacognicion al cierre
8. Materiales reciclados/bajo costo
9. Herramientas digitales + alternativa no digital
10. Coherencia con Decreto 67 (evaluacion formativa) y Decreto 83 (DUA)
11. Contexto chileno real (geografia, cultura, calendario)
12. OA reformulado, NUNCA copiado literal`,

    planificacion: `${expertBlock}

CONTEXTO DEL PRODUCTO A GENERAR:
${baseContext}

TAREA: Genera una PLANIFICACION CLASE A CLASE en formato JSON que sea una RUTA DE APRENDIZAJE DINAMICA con productos concretos.

ESTRUCTURA JSON REQUERIDA:
{
  "unit": "Nombre de la unidad (creativo, no generico)",
  "classes": [
    {
      "number": 1,
      "objective": "OA reformulado en lenguaje simple (NUNCA copiar literal)",
      "methodology": "metodo utilizado (ABP, Indagacion, Design Thinking, etc.)",
      "phases": [
        {
          "name": "Fase del metodo",
          "activity": "Descripcion concreta",
          "time": "min",
          "grouping": "como se agrupan",
          "product": "que crean los estudiantes"
        }
      ],
      "opening": {"activity": "...", "time": "min"},
      "development": {"activity": "...", "time": "min"},
      "closure": {"activity": "...", "time": "min", "product": "producto tangible de la clase"},
      "duration": "min total",
      "materials": ["materiales (reciclados/bajo costo)"],
      "digitalTools": ["herramientas digitales"],
      "assessment": {"type": "formativa", "method": "metodo especifico"},
      "differentiation": {"apoyo": "...", "desafio": "..."},
      "neurodiversity": {"tea": "...", "tdah": "..."},
      "movement": "momento de movimiento fisico",
      "bloom": ["niveles de Bloom utilizados"]
    }
  ],
  "methodology": "metodologia principal de la unidad",
  "productType": "tipo de producto tangible que crearan al final",
  "dua": {"representation": "...", "action": "...", "engagement": "..."},
  "evaluation": {
    "formativa": "estrategias formativas por clase",
    "sumativa": "producto final evaluado",
    "rubric": "criterios de la rúbrica"
  },
  "peAlignment": "conexion con PEI/PME",
  "communityExtension": "extension a la comunidad"
}

REGLAS OBLIGATORIAS:
1. REGLA MAS IMPORTANTE: el OA es el objetivo curricular formal — NUNCA lo copies
   literalmente en "objective". Reformulo SIEMPRE con propias palabras.
2. Cada clase debe tener ESTRUCTURA DIFERENTE (no repetir secuencia identica)
3. Cada clase con PRODUCTO TANGIBLE que los estudiantes creen
4. Minimo 3 MODALIDADES distintas por clase
5. Minimo 5 TIPOS DE PREGUNTAS distintos en toda la planificacion
6. Al menos 1 momento de MOVIMIENTO FISICO por clase
7. Al menos 1 adaptacion neurodiversidad por clase
8. Retrieval practice al inicio de cada clase, metacognicion al cierre
9. Materiales reciclados/bajo costo
10. Herramientas digitales + alternativa no digital
11. Tiempos REALES (45-90 min por clase)
12. Progresion logica entre clases
13. Coherencia con Decreto 67 y Decreto 83
14. Contexto chileno real`,

    evaluacion: `${expertBlock}

CONTEXTO DEL PRODUCTO A GENERAR:
${baseContext}

TAREA: Genera una EVALUACION AUTENTICA en formato JSON que evalua COMPETENCIAS reales, no solo memoria.

ESTRUCTURA JSON REQUERIDA:
{
  "title": "Titulo de la evaluacion",
  "objective": "OA evaluado (reformulado)",
  "type": "formativa|sumativa|diagnostica",
  "productType": "tipo de producto que evalua",
  "questions": [
    {
      "number": 1,
      "type": "multiple_choice|open|matching|drawing|oral|project",
      "question": "Pregunta con contexto real chileno",
      "options": ["A)", "B)", "C)", "D)"],
      "correct": "respuesta correcta",
      "bloomLevel": "Recordar|Comprender|Aplicar|Analizar|Evaluar|Crear",
      "skill": "habilidad evaluada",
      "time": "minutos estimados",
      "adaptation": "adaptacion para neurodiversidad si aplica"
    }
  ],
  "rubric": {
    "criteria": [
      {
        "name": "Criterio",
        "description": "Que se evalua",
        "levels": [
          {"level": "Logrado", "score": 4, "description": "Descriptor claro y observable"},
          {"level": "En proceso", "score": 2, "description": "Descriptor"},
          {"level": "Inicio", "score": 1, "description": "Descriptor"}
        ]
      }
    ]
  },
  "answerKey": "pauta de correccion con retroalimentacion sugerida",
  "timeTotal": "tiempo total estimado",
  "differentiation": {
    "timeExtension": "tiempo extra para necesidades",
    "formatAlternative": "formato alternativo (oral, dibujo, etc.)",
    "simplification": "simplificacion si aplica"
  }
}

REGLAS OBLIGATORIAS:
1. Preguntas variadas: minimo 4 TIPOS DISTINTOS de las siguientes:
   Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear
2. Formatos variados: no todo opcion multiple. Incluir:
   respuesta abierta, completar, matching, dibujo, oral, proyecto
3. Contexto CHILENO real en cada pregunta
4. Progresion de dificultad (facil -> dificil)
5. Al menos 1 pregunta de nivel ANALIZAR o superior
6. Rúbrica con descriptores OBSERVABLES (no subjetivos)
7. Retroalimentacion sugerida para cada pregunta
8. Adaptaciones para neurodiversidad (tiempo extra, formato alternativo)
9. Tiempo total realista
10. Coherencia con Decreto 67 (formativa vs sumativa)`,

    rubrica: `${expertBlock}

CONTEXTO DEL PRODUCTO A GENERAR:
${baseContext}

TAREA: Genera una RUBRICA DE DESEMPENO en formato JSON con descriptores OBSERVABLES y MEDIBLES.

ESTRUCTURA JSON REQUERIDA:
{
  "title": "Titulo de la rubrica",
  "objective": "OA evaluado (reformulado)",
  "productType": "tipo de producto que evalua",
  "criteria": [
    {
      "name": "Criterio 1",
      "description": "Que se evalua especificamente",
      "bloomLevel": "nivel de Bloom que evalua",
      "levels": [
        {"level": "Logrado", "score": 4, "description": "Descriptor observable y medible"},
        {"level": "En proceso", "score": 2, "description": "Descriptor"},
        {"level": "Inicio", "score": 1, "description": "Descriptor"}
      ]
    }
  ],
  "scoring": {
    "scale": "escala de puntaje",
    "passing": "puntaje minimo para logro",
    "distribution": "distribucion de puntajes sugerida"
  },
  "feedback": {
    "teacherNotes": "espacio para retroalimentacion del docente",
    "studentSelfAssessment": "criterios para autoevaluacion"
  },
  "differentiation": {
    "apoyo": "criterios simplificados para tier 1",
    "desafio": "criterios extendidos para tier 3"
  }
}

REGLAS OBLIGATORIAS:
1. Minimo 4 CRITERIOS evaluados
2. Cada criterio debe evaluar un nivel BLOOM DISTINTO
3. Descriptores OBSERVABLES y MEDIBLES (nunca "participa activamente")
4. 3 o 4 niveles de logro maximo
5. Incluir al menos 1 criterio de PRODUCTO TANGIBLE
6. Incluir al menos 1 criterio de TRABAJO COLABORATIVO
7. Rango de puntaje claro
8. Criterios de autoevaluacion para el estudiante
9. Adaptaciones para neurodiversidad en la evaluacion
10. Coherencia con el tipo de producto generado`,

    ticket_salida: `${expertBlock}

CONTEXTO DEL PRODUCTO A GENERAR:
${baseContext}

TAREA: Genera un TICKET DE SALIDA en formato JSON con preguntas VARIADAS y METACOGNITIVAS.

ESTRUCTURA JSON REQUERIDA:
{
  "title": "Titulo del ticket",
  "objective": "OA de la clase (reformulado)",
  "questions": [
    {
      "question": "Pregunta concreta",
      "type": "recordar|comprender|aplicar|analizar|evaluar|crear|metacognicion",
      "format": "written|drawing|oral|matching|oral_or_written",
      "time": "minutos",
      "adaptation": "adaptacion para neurodiversidad"
    }
  ],
  "selfAssessment": {
    "question": "pregunta metacognitiva",
    "options": ["caritas o escala visual"]
  },
  "teacherNotes": "notas para el docente: que observar, que ajustar"
}

REGLAS OBLIGATORIAS:
1. Minimo 3 PREGUNTAS con TIPOS DISTINTOS (no repetir el mismo tipo)
2. Al menos 1 pregunta de NIVEL ALTO Bloom (Analizar/Evaluar/Crear)
3. Al menos 1 pregunta METACOGNITIVA
4. Formatos variados: no todo escrito. Incluir dibujo, oral, matching
5. Contexto chileno real
6. Tiempo total: maximo 5 minutos
7. Adaptaciones: ofrecer opciones (oral, dibujo) para disgrafia/TDAH
8. Incluir "para mi ritmo": opciones de simplificacion
9. Teacher notes: que buscar en las respuestas, que ajustar manana
10. RETRIEVAL PRACTICE: al menos 1 pregunta que recupere contenido anterior`,

    actividad_dua: `${expertBlock}

CONTEXTO DEL PRODUCTO A GENERAR:
${baseContext}

TAREA: Genera una ACTIVIDAD DUA en formato JSON con los 3 principios CAST explícitos y adaptaciones por perfil.

ESTRUCTURA JSON REQUERIDA:
{
  "title": "Titulo de la actividad",
  "objective": "OA (reformulado)",
  "representation": [
    {"method": "metodo de representacion", "description": "como se presenta el contenido", "tool": "herramienta si aplica"}
  ],
  "action": [
    {"method": "metodo de accion/expression", "description": "como demuestra el estudiante", "tool": "herramienta si aplica"}
  ],
  "engagement": [
    {"method": "metodo de implicacion", "description": "como se motiva y conecta", "tool": "herramienta si aplica"}
  ],
  "activity": {
    "description": "descripcion concreta de la actividad",
    "product": "producto tangible que crean los estudiantes",
    "steps": ["paso 1 con accion concreta", "paso 2...", "paso 3..."],
    "time": "minutos totales",
    "materials": ["materiales (reciclados/bajo costo)"]
  },
  "tierApoyo": {
    "textReduction": "reduccion de texto (50-70%)",
    "visualSupport": "apoyo visual especifico",
    "timeExtension": "tiempo extendido (1.5x-2x)",
    "simplification": "simplificacion de la tarea",
    "alternativeProduct": "producto alternativo mas accesible"
  },
  "tierDesafio": {
    "extension": "actividad de extension",
    "complexity": "complejidad adicional",
    "autonomy": "proyecto autonomo"
  },
  "neurodiversity": {
    "tea": "adaptacion concreta (agenda visual, instrucciones literales, espacio calmado)",
    "tdah": "adaptacion concreta (chunks, movimiento, cronometro, listas)",
    "discalculia": "adaptacion si aplica (material concreto, linea numerica)",
    "disgrafia": "adaptacion si aplica (oral, dibujo, dictado)",
    "tdl": "adaptacion si aplica (multimodal, tiempo procesamiento)"
  },
  "assessment": {
    "type": "formativa",
    "methods": ["metodos variados"],
    "criteria": "criterios observables"
  }
}

REGLAS OBLIGATORIAS:
1. Los 3 principios DUA deben tener MINIMO 3 estrategias cada uno
2. Al menos 3 MODALIDADES distintas de representacion
3. Al menos 3 OPCIONES de accion/expression
4. Tier Apoyo con 5 estrategias CONCRETAS (no solo "simplificar")
5. Tier Desafio con actividades de extension
6. Adaptaciones neurodiversidad ESPECIFICAS para cada perfil
7. Producto TANGIBLE que los estudiantes creen
8. Materiales reciclados/bajo costo
9. Herramientas digitales + alternativa no digital
10. Evaluacion formativa con metodos variados`,
  };

  return prompts[type] || prompts.guia_estudiante;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type') || 'guia_estudiante';
    const body = await context.request.json() as GenerateRequest;

    if (!body.level || !body.subject || !body.objectiveCode) {
      return Response.json({ error: 'level, subject y objectiveCode son requeridos' }, { status: 400 });
    }

    const db = context.env.DB;
    const ctx = await getContextFromD1(db, body);
    const prompt = buildMaterialPrompt(type, body, ctx);
    const resourceId = `res_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    if (type === 'planificacion') {
      const { planificacion, usedFallback } = await generatePlanificacion(
        { AI: context.env.AI, GEMINI_API_KEY: context.env.GEMINI_API_KEY } as AIEngineEnv,
        prompt,
        {
          level: body.level,
          subject: body.subject,
          objectiveText: body.objectiveText,
          topic: body.topic,
          methodology: body.methodology,
          indicators: body.indicators,
        },
      );

      await db.prepare(`INSERT OR IGNORE INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, indicators_used_json, skills_used_json, prompt_used, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
        .bind(
          resourceId,
          `${type} — ${body.objectiveCode}`,
          type,
          JSON.stringify(planificacion),
          JSON.stringify(planificacion),
          body.level,
          body.subject,
          body.objectiveCode,
          JSON.stringify(body.indicators || []),
          JSON.stringify(body.skills || []),
          prompt.substring(0, 2000)
        ).run();

      return Response.json({
        ok: true,
        resourceId,
        planificacion,
        usedFallback,
        context: {
          objective: ctx[0],
          indicators: (ctx[1] as any)?.results || [],
          methodologies: (ctx[2] as any)?.results || [],
        }
      });
    }

    // Save to generated_resources
    await db.prepare(`INSERT OR IGNORE INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, indicators_used_json, skills_used_json, prompt_used, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
      .bind(
        resourceId,
        `${type} — ${body.objectiveCode}`,
        type,
        prompt,
        JSON.stringify({ status: 'generating' }),
        body.level,
        body.subject,
        body.objectiveCode,
        JSON.stringify(body.indicators || []),
        JSON.stringify(body.skills || []),
        prompt.substring(0, 2000)
      ).run();

    return Response.json({
      ok: true,
      resourceId,
      prompt,
      context: {
        objective: ctx[0],
        indicators: (ctx[1] as any)?.results || [],
        methodologies: (ctx[2] as any)?.results || [],
      }
    });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar material', details: err.message }, { status: 500 });
  }
}
