interface Env { DB: D1Database; AI?: any }

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
    req.additionalContext ? `Contexto: ${req.additionalContext}` : '',
    req.duration ? `Duración: ${req.duration}` : '',
    req.studentCount ? `Estudiantes: ${req.studentCount}` : '',
  ].filter(Boolean).join('\n');

  const prompts: Record<string, string> = {
    guia_estudiante: `Genera una guía de estudiante en formato JSON válido que cumpla ESTRICTAMENTE con esta estructura:

{
  "metadata": {
    "course": "Curso (ej: 3° Básico)",
    "subject": "Asignatura",
    "unit": "Nombre de la unidad",
    "oa": "Código MINEDUC del OA"
  },
  "title": "Título atractivo para el estudiante",
  "student_objective": "Objetivo redactado en lenguaje amigable (ej: 'Aprenderemos a...')",
  "sections": [
    {
      "title": "Inicio",
      "theory_content": "Texto explicativo breve para activar conocimientos previos",
      "activities": [
        {
          "title": "Nombre de la actividad",
          "instructions": "Instrucciones paso a paso claras",
          "materials_needed": ["material 1"],
          "estimated_time": "10 minutos"
        }
      ],
      "key_question": "Pregunta reflexiva para cerrar la sección (opcional)"
    },
    {
      "title": "Desarrollo",
      "theory_content": "Contenido teórico principal explicado de forma simple",
      "activities": [
        {
          "title": "Actividad de práctica",
          "instructions": "Instrucciones detalladas",
          "estimated_time": "25 minutos"
        }
      ]
    },
    {
      "title": "Cierre",
      "theory_content": "Síntesis de lo aprendido",
      "activities": [
        {
          "title": "Actividad de cierre",
          "instructions": "Instrucciones para cerrar la clase",
          "estimated_time": "10 minutos"
        }
      ]
    }
  ],
  "vocabulary": [{"term": "Término", "definition": "Definición clara"}],
  "selfAssessment": ["¿Qué aprendí hoy?", "¿Qué me resultó fácil?", "¿Qué puedo mejorar?"],
  "instructions": "Instrucciones generales para la guía",
  "callouts": [{"tipo": "docente", "titulo": "Título", "texto": "Contenido"}],
  "checklist": ["Elemento 1"]
}

Contexto: ${baseContext}
REGLAS OBLIGATORIAS:
- EXACTAMENTE 3 secciones: Inicio, Desarrollo, Cierre.
- Cada sección DEBE tener theory_content y al menos 1 activity.
- Lenguaje accesible para el nivel del estudiante.
- Contexto chileno: usa referencias geográficas, culturales e históricas de Chile.`,

    guia_docente: `Genera una guía docente en formato JSON válido que cumpla ESTRICTAMENTE con esta estructura:

{
  "metadata": {
    "course": "Curso (ej: 3° Básico)",
    "subject": "Asignatura",
    "unit": "Nombre de la unidad",
    "oa": "Código MINEDUC del OA"
  },
  "title": "Guía Docente: Título descriptivo",
  "student_objective": "Objetivo del estudiante en lenguaje amigable",
  "sections": [
    {
      "title": "Inicio",
      "theory_content": "Contenido para activar conocimientos previos + metodología sugerida",
      "activities": [
        {
          "title": "Activación de conocimientos",
          "instructions": "Instrucciones para el docente sobre cómo iniciar la clase",
          "estimated_time": "15 minutos"
        }
      ],
      "key_question": "Pregunta provocadora para iniciar"
    },
    {
      "title": "Desarrollo",
      "theory_content": "Contenido teórico principal + metodología de enseñanza",
      "activities": [
        {
          "title": "Explicación y práctica",
          "instructions": "Instrucciones detalladas para el docente",
          "estimated_time": "50 minutos"
        }
      ]
    },
    {
      "title": "Cierre",
      "theory_content": "Síntesis y evaluación formativa",
      "activities": [
        {
          "title": "Síntesis y ticket de salida",
          "instructions": "Instrucciones para cerrar la clase",
          "estimated_time": "15 minutos"
        }
      ]
    }
  ],
  "vocabulary": [{"term": "Término clave", "definition": "Definición para el docente"}],
  "instructions": "Instrucciones generales para el docente",
  "callouts": [{"tipo": "docente", "titulo": "Título", "texto": "Contenido"}],
  "checklist": ["Elemento 1"]
}

Contexto: ${baseContext}
REGLAS OBLIGATORIAS:
- EXACTAMENTE 3 secciones: Inicio, Desarrollo, Cierre.
- Cada sección DEBE tener theory_content con metodología y al menos 1 activity.
- Incluir tiempos realistas para cada sección.
- Contexto chileno: usa referencias geográficas, culturales e históricas de Chile.`,

    planificacion: `Genera una planificación de unidad didáctica en formato JSON válido que cumpla ESTRICTAMENTE con esta estructura. Respetas la arquitectura pedagógica UDD/PUC:

{
  "unit": "Nombre descriptivo de la unidad didáctica",
  "classes": [
    {
      "number": 1,
      "objective": "Objetivo de aprendizaje específico alineado al OA proporcionado",
      "duration": "90 min",
      "materials": ["Cuaderno del estudiante", "Pizarrón y tiza", "Fichas de trabajo impresas"],
      "assessment": "Criterio de logro observable y evidencia esperada del estudiante",
      "momentosClase": {
        "inicio": {
          "nombre": "Activación de conocimientos previos",
          "accionesEstudiante": "Los estudiantes observan una imagen del entorno local y escriben en su cuaderno lo que recuerdan sobre el tema. Luego, conversan con un compañero sobre sus ideas.",
          "estrategiasMediacion": "El docente proyecta una imagen del barrio, formula una pregunta abierta, circula entre las mesas escuchando respuestas y realiza preguntas socráticas para profundizar.",
          "tiempoEsperado": "15 min",
          "recursos": [
            {"nombre": "Proyector", "tipo": "material_fisico", "imagePrompt": "Classroom projector screen showing a Chilean neighborhood landscape, clean educational illustration, no text no watermark"},
            {"nombre": "Cuaderno rayado", "tipo": "material_fisico"}
          ],
          "medioVerificacion": "Observación directa: participación oral y escritura en cuaderno",
          "imagePrompt": "Chilean classroom teacher projecting an image on screen while elementary students write in notebooks, warm educational illustration style, clean composition no text no watermark"
        },
        "desarrollo": {
          "nombre": "Construcción con andamiaje",
          "accionesEstudiante": "Los estudiantes leen un texto breve en parejas, subrayan ideas clave y elaboran un organizador gráfico en papelógrafo compartido.",
          "estrategiasMediacion": "El docente modela la lectura guiada con un ejemplo, luego libera la práctica en parejas. Retroalimenta formativamente circulando y preguntando: ¿por qué creen que eso es importante?",
          "tiempoEsperado": "50 min",
          "recursos": [
            {"nombre": "Textos impresos", "tipo": "material_fisico"},
            {"nombre": "Papelógrafo", "tipo": "material_fisico"},
            {"nombre": "Marcadores de colores", "tipo": "material_fisico"}
          ],
          "medioVerificacion": "Producto grupal: organizador gráfico con ideas clave del texto",
          "imagePrompt": "Elementary students working in pairs at desks with printed texts and colorful markers making a graphic organizer on poster paper, Chilean classroom setting, warm educational illustration, clean no text no watermark"
        },
        "cierre": {
          "nombre": "Síntesis y metacognición",
          "accionesEstudiante": "Los estudiantes escriben un ticket de salida respondiendo: ¿Qué aprendí hoy? ¿Qué me falta por entender? ¿Qué haré diferente la próxima vez?",
          "estrategiasMediacion": "El docente recoge los tickets, lee 2-3 ejemplos en voz alta y cierra conectando con la próxima clase.",
          "tiempoEsperado": "15 min",
          "recursos": [
            {"nombre": "Fichas de ticket de salida", "tipo": "material_fisico"}
          ],
          "medioVerificacion": "Tickets de salida escritos por el estudiante",
          "imagePrompt": "Close-up of student hands writing on a small exit ticket card at a classroom desk, Chilean elementary school setting, warm educational illustration, clean no text no watermark"
        }
      },
      "practicasPedagogicas": {
        "practicasAltoImpacto": ["Evaluación formativa mediante observación directa y retroalimentación en el momento"],
        "practicasEticas": ["Respeto a los ritmos de aprendizaje de cada estudiante"],
        "justificacion": "La evaluación formativa permite ajustar la enseñanza en tiempo real"
      },
      "anticipacionErrores": {
        "posiblesDificultades": [
          {"dificultad": "Confundir conceptos clave del texto", "tipo": "conceptual", "probabilidad": "alta"}
        ],
        "estrategiaAbordaje": "El docente anticipa la confusión usando un ejemplo concreto del entorno del estudiante, contrastando el concepto nuevo con el conocimiento previo, y usando un organizador gráfico para hacer visible la diferencia."
      },
      "preguntasClave": [
        {"pregunta": "¿Por qué creen ustedes que es importante este tema para nuestra comunidad?", "tipo": "activacion", "momento": "Inicio"},
        {"pregunta": "¿Qué diferencias encontraron entre las dos ideas del texto?", "tipo": "analisis", "momento": "Desarrollo"},
        {"pregunta": "Si tuvieran que explicarle a alguien que no estuvo en clase, ¿cómo lo harían?", "tipo": "sintesis", "momento": "Cierre"}
      ]
    }
  ],
  "methodology": "Metodología principal: ABP, Aprendizaje Activo, Investigación, etc.",
  "totalDuration": "270 min",
  "dua": ["Ajuste de representación: textos con imágenes y organizadores gráficos"],
  "evaluation": "Tipo de evaluación: formativa, sumativa, diagnóstica o mixta"
}

═══ REGLAS PEDAGÓGICAS ESTRICTAS (UDD/PUC) ═══

1. EXTRACCIÓN: Separa EXPLÍCITAMENTE la habilidad del contenido.
   - HABILIDAD: qué saber hacer (ej: "Comparar fuentes primarias y secundarias")
   - CONTENIDO: qué saber (ej: "La independencia de Chile y sus causas")
   - El objetivo DEBE reflejar AMBOS: "Comparar fuentes primarias y secundarias sobre la independencia de Chile"

2. PROTAGONISMO DEL ESTUDIANTE:
   - accionesEstudiante: NUNCA incluir acciones del docente. El protagonista es el estudiante.
   - Escrito en tercera persona plural: "Los estudiantes...", "Los alumnos...", "El grupo..."
   - Verbos cognitivos de alto nivel: analizar, comparar, evaluar, crear, resolver, argumentar, diseñar, proponer
   - NUNCA verbos pasivos: "escuchar", "observar", "copiar", "leer" (sin análisis)

3. ANTEPCIÓN DE ERRORES:
   - anticipacionErrores: DEBE incluir al menos 1 dificultad conceptual, procedimental o actitudinal
   - tipo: "conceptual" | "procedimental" | "actitudinal" | "linguistico"
   - probabilidad: "alta" | "media" | "baja"
   - estrategiaAbordaje: Cómo el docente usará el error como oportunidad de aprendizaje

4. PREGUNTAS CLAVE:
   - Cada clase DEBE tener al menos 3 preguntas clave
   - Niveles cognitivos: activacion, comprension, analisis, sintesis, evaluacion, metacognitiva
   - NUNCA preguntas de sí/no. Siempre abiertas, analíticas, reflexivas
   - Cada pregunta DEBE tener un "momento" indicando cuándo se formula

5. MOMENTOS DE CLASE (estructura estricta):
   - 3 momentos obligatorios: inicio, desarrollo, cierre
   - Cada momento DEBE tener: nombre, accionesEstudiante, estrategiasMediacion, tiempoEsperado, recursos, medioVerificacion
   - tiempoEsperado en formato "X min" (mínimo 5 min, máximo 90 min)
   - La suma de tiempos DEBE ser coherente con la duración total de la clase
   - recursos: al menos 1 recurso por momento, con tipo (material_fisico, digital, humano, ambiental)
   - medioVerificación: evidencias observables del aprendizaje en ese momento

6. IMAGEPROMPT (obligatorio para visualización premium):
   - Cada momento DEBE tener un imagePrompt descriptivo
   - En INGLÉS, estilo ilustración educativa limpia
   - Sin emojis, sin texto incrustado, sin marcas de agua
   - Describe la escena: qué, dónde, cómo, estilo visual
   - Ejemplo: "Chilean classroom teacher projecting an image on screen while elementary students write in notebooks, warm educational illustration style, clean composition no text no watermark"

7. PRÁCTICAS DE ALTO IMPACTO (PAI):
   - Cada clase DEBE tener al menos 1 PAI
   - PAI comunes: evaluación formativa, retroalimentación específica, comprensión profunda, organización del aula, instrucción efectiva, tutoría entre pares
   - DEBE incluir prácticas éticas (respeto a diversidad, igualdad de oportunidades, formación en valores)

8. MATERIALES REALISTAS PARA CHILE:
   - SOLO materiales que existan en escuelas chilenas
   - Permitidos: cuaderno, pizarrón, tiza, fichas, marcadores, colores, lápiz, goma, tijeras, pegamento, hojas, papel bond, cartulina, atlas, mapa, globo terráqueo, calculadora, regla, compás, bandejita de semillas, tierra
   - PROHIBIDOS: tablets, computadores (a menos que sean del laboratorio de la escuela), materiales costosos

9. PROGRESIÓN LÓGICA:
   - Clase 1: Activación y exploración inicial
   - Clases 2-N-1: Construcción progresiva con andamiaje decreciente
   - Clase N: Síntesis, aplicación autónoma y evaluación sumativa
   - Cada clase DEBE avanzar sobre la anterior

10. VALIDACIÓN DE ESTRUCTURA:
    - unit: string obligatorio
    - classes: array mínimo 3, máximo 10
    - Cada clase DEBE tener: number, objective, duration, materials, assessment, momentosClase, practicasPedagogicas, anticipacionErrores, preguntasClave
    - duration en formato "X min" (mínimo 20, máximo 150)
    - materials: array mínimo 2, máximo 12

Contexto: ${baseContext}`,

    evaluacion: `Genera una evaluación en formato JSON válido que cumpla ESTRICTAMENTE con esta estructura:

{
  "metadata": {
    "course": "Curso (ej: 3° Básico)",
    "subject": "Asignatura",
    "unit": "Nombre de la unidad",
    "oa": "Código MINEDUC del OA evaluado",
    "total_score": 20,
    "type": "formativa|sumativa|diagnostica",
    "time_limit": "45 minutos (opcional)"
  },
  "instructions": "Instrucciones claras para el estudiante, adaptadas al nivel. Ej: 'Lee atentamente cada pregunta. Marca solo una alternativa en las de selección múltiple.'",
  "questions": [
    {
      "number": 1,
      "type": "alternativa",
      "text": "Enunciado claro de la pregunta",
      "options": [
        {"text": "Alternativa 1", "isCorrect": false},
        {"text": "Alternativa 2", "isCorrect": true},
        {"text": "Alternativa 3", "isCorrect": false},
        {"text": "Alternativa 4", "isCorrect": false}
      ],
      "score": 2,
      "indicator": "Indicador evaluado",
      "skill": "Habilidad evaluada"
    },
    {
      "number": 2,
      "type": "verdadero_falso",
      "text": "Afirmación para evaluar",
      "answer": "V|F",
      "justification_if_false": "Si es F, justificación que el estudiante debe dar (obligatorio si answer es F)",
      "score": 2,
      "indicator": "Indicador",
      "skill": "Habilidad"
    },
    {
      "number": 3,
      "type": "desarrollo",
      "text": "Pregunta abierta que requiere respuesta escrita",
      "score": 5,
      "indicator": "Indicador",
      "skill": "Habilidad",
      "teacher_rubric": {
        "criteria": ["Criterio 1 para evaluar", "Criterio 2"],
        "sample_answer": "Respuesta modelo orientativa para el docente",
        "scoring_guide": "Cómo distribuir el puntaje"
      }
    }
  ],
  "answerKey": {
    "summary": "Resumen consolidado de la pauta para el docente",
    "question_answers": [
      {"number": 1, "correct_answer": "B", "explication": "Explicación de por qué es correcta"},
      {"number": 2, "correct_answer": "V", "explication": "Explicación"},
      {"number": 3, "correct_answer": "Respuesta modelo breve", "explication": "Puntos clave a buscar"}
    ],
    "total_points": 20
  },
  "tablas": [{"titulo": "Nombre", "columnas": ["col1", "col2"], "filas": [["val1", "val2"]]}],
  "callouts": [{"tipo": "docente|familia|importante|dua|evaluacion", "titulo": "Título", "texto": "Contenido"}],
  "checklist": ["Elemento 1 del checklist"]
}

Contexto: ${baseContext}
REGLAS OBLIGATORIAS:
- OPCIÓN A: 4 alternativas EXACTAS (A, B, C, D), solo 1 correcta (isCorrect: true). Distractores plausibles.
- V/F: Si answer es "F", justification_if_false ES OBLIGATORIA (mín. 15 caracteres).
- DESARROLLO: teacher_rubric CON OBLIGATORIO: array criteria (mín. 2), sample_answer, scoring_guide.
- PAUTA: answerKey DEBE tener question_answers con el MISMO número de preguntas.
- PUNTAJE: total_score en metadata DEBE coincidir con la suma de scores de questions y con answerKey.total_points.
- Mínimo 3 preguntas, máximo 20. Mezclar tipos (alternativa + V/F + desarrollo).
- Contexto chileno: usa referencias geográficas, culturales e históricas de Chile.
- Progresión de dificultad: de menor a mayor complejidad.`,

    rubrica: `Genera una rúbrica en formato JSON válido que cumpla ESTRICTAMENTE con esta estructura:

{
  "metadata": {
    "course": "Curso (ej: 3° Básico)",
    "subject": "Asignatura",
    "unit": "Nombre de la unidad",
    "oa": "Código MINEDUC del OA evaluado"
  },
  "title": "Título descriptivo de la rúbrica",
  "levels": [
    {"name": "Excelente", "score": 4, "color": "#10B981"},
    {"name": "Bueno", "score": 3, "color": "#3B82F6"},
    {"name": "Suficiente", "score": 2, "color": "#F59E0B"},
    {"name": "Por mejorar", "score": 1, "color": "#EF4444"}
  ],
  "criteria": [
    {
      "name": "Dimensión a evaluar (ej: Contenido, Ortografía, Creatividad)",
      "weight": 1,
      "descriptions": [
        "Descripción del nivel Excelente para esta dimensión",
        "Descripción del nivel Bueno para esta dimensión",
        "Descripción del nivel Suficiente para esta dimensión",
        "Descripción del nivel Por mejorar para esta dimensión"
      ]
    }
  ],
  "instructions": "Instrucciones para el docente sobre cómo usar la rúbrica (opcional)",
  "callouts": [{"tipo": "docente", "titulo": "Título", "texto": "Contenido"}],
  "checklist": ["Elemento 1 del checklist"]
}

Contexto: ${baseContext}
REGLAS OBLIGATORIAS:
- EXACTAMENTE 4 niveles ordenados de mayor a menor (score decreciente).
- Cada criterio DEBE tener exactamente 4 descripciones (una por nivel).
- Mínimo 2 criterios, máximo 10. Ejemplos: Contenido, Ortografía, Creatividad, Trabajo en equipo, Presentación.
- Las descripciones deben ser específicas y observables, no genéricas.
- Contexto chileno: usa vocabulario y situaciones del contexto escolar chileno.`,

    ticket_salida: `Genera un ticket de salida en formato JSON con:
{
  "title": "Ticket de salida",
  "objective": "OA de la clase",
  "questions": [
    {"question": "Pregunta de comprensión", "type": "open"},
    {"question": "Ejemplo aplicado", "type": "open"},
    {"question": "Metacognición", "type": "open"}
  ],
  "selfAssessment": "¿Cómo te fue hoy? 😊 😐 😞",
  "teacherNotes": "notas para el docente"
}
Contexto: ${baseContext}
Requisitos: máximo 3 preguntas, breves, alineadas al OA, contexto chileno.`,

    actividad_dua: `Genera una actividad DUA en formato JSON con:
{
  "title": "Título de actividad",
  "objective": "OA",
  "representation": ["múltiples formas de presentar contenido"],
  "action": ["múltiples formas de acción y expresión"],
  "engagement": ["múltiples formas de motivación"],
  "activity": {"description": "...", "steps": ["..."], "materials": ["..."]},
  "adaptations": ["adaptaciones específicas"],
  "assessment": "criterios flexibles"
}
Contexto: ${baseContext}
Requisitos: 3 principios DUA explícitos, accesible para todos, contexto chileno.`,

    guia_dua: `Genera una guía DUA en formato JSON válido que cumpla ESTRICTAMENTE con esta estructura:

{
  "metadata": {
    "course": "Curso (ej: 3° Básico)",
    "subject": "Asignatura",
    "unit": "Nombre de la unidad",
    "oa": "Código MINEDUC del OA"
  },
  "title": "Guía DUA: Título descriptivo",
  "student_objective": "Objetivo del estudiante en lenguaje amigable",
  "sections": [
    {
      "title": "Inicio",
      "theory_content": "Contenido para activar conocimientos previos",
      "activities": [
        {
          "title": "Actividad de inicio",
          "instructions": "Instrucciones paso a paso",
          "representation": "Cómo presentar esta información de forma múltiple (ej: apoyo visual, lectura en voz alta, diagrama)",
          "expression": "Opciones para que el estudiante demuestre el aprendizaje (ej: dibujar, escribir, grabar audio, construir)",
          "engagement": "Estrategia explícita para captar el interés o dar autonomía"
        }
      ],
      "key_question": "Pregunta reflexiva para cerrar la sección"
    },
    {
      "title": "Desarrollo",
      "theory_content": "Contenido teórico principal",
      "activities": [
        {
          "title": "Actividad de desarrollo",
          "instructions": "Instrucciones detalladas",
          "representation": "Estrategia DUA de representación",
          "expression": "Estrategia DUA de expresión",
          "engagement": "Estrategia DUA de compromiso"
        }
      ]
    },
    {
      "title": "Cierre",
      "theory_content": "Síntesis de lo aprendido",
      "activities": [
        {
          "title": "Actividad de cierre",
          "instructions": "Instrucciones para cerrar la clase",
          "representation": "Estrategia DUA de representación",
          "expression": "Estrategia DUA de expresión",
          "engagement": "Estrategia DUA de compromiso"
        }
      ]
    }
  ],
  "vocabulary": [{"term": "Término", "definition": "Definición clara"}],
  "selfAssessment": ["¿Qué aprendí hoy?", "¿Qué me resultó fácil?", "¿Qué puedo mejorar?"],
  "instructions": "Instrucciones generales para la guía",
  "dua_summary": {
    "representation": "Resumen de estrategias de representación aplicadas en toda la guía",
    "expression": "Resumen de opciones de expresión aplicadas en toda la guía",
    "engagement": "Resumen de estrategias de compromiso aplicadas en toda la guía"
  },
  "callouts": [{"tipo": "dua", "titulo": "Título", "texto": "Contenido"}],
  "checklist": ["Elemento 1"]
}

Contexto: ${baseContext}
REGLAS OBLIGATORIAS:
- CADA actividad DEBE tener los 3 principios DUA: representation, expression, engagement.
- Los principios DUA deben ser ESPECÍFICOS y OBSERVABLES, no genéricos.
- EXACTAMENTE 3 secciones: Inicio, Desarrollo, Cierre.
- Cada sección DEBE tener theory_content y al menos 1 activity.
- dua_summary DEBE resumir las estrategias DUA de toda la guía.
- Contexto chileno: usa referencias geográficas, culturales e históricas de Chile.`,

    presentacion: `Genera una presentación educativa completa en formato JSON válido que cumpla ESTRICTAMENTE con esta estructura:

REGLAS CRÍTICAS:
1. SEPARACIÓN HABILIDAD/CONTENIDO: Si el OA dice "Observar mediante la exploración los animales invertebrados", el TEMA CENTRAL son "Los animales invertebrados", NO "la exploración". Las habilidades (observar, explorar) son ACCIONES, no contenido.
2. PROFUNDIDAD: Cada slide DEBE tener contenido explicativo REAL (mínimo 2-3 oraciones). PROHIBIDO frases genéricas.
3. IMAGEPROMPT: DEBE ser en INGLÉS y describir la escena visual de forma específica. PROHIBIDO placeholders con emojis.
4. NUNCA TRUNCAR: Prohibido usar "..." para cortar oraciones. Escribe oraciones completas.

{
  "titulo": "Título específico de la clase",
  "metadata": {
    "course": "Curso",
    "subject": "Asignatura",
    "oa": "Código OA"
  },
  "diapositivas": [
    {
      "numero": 1,
      "layout": "cover",
      "titulo": "Título atractivo de la clase",
      "contenido": "Subtítulo con el tema específico de la clase",
      "notasDocente": "Instrucciones para presentar la clase",
      "imagePrompt": "Educational presentation cover, [tema específico], Chilean context, professional colorful design, no text",
      "ejemplosClave": [],
      "actividadOral": ""
    },
    {
      "numero": 2,
      "layout": "hook",
      "titulo": "Activación de conocimientos previos",
      "contenido": "Pregunta motivadora concreta. Ejemplo real y específico al tema.",
      "notasDocente": "Tiempo y estrategia de activación",
      "imagePrompt": "Engaging motivational image of [tema], educational, thought-provoking, no text",
      "ejemplosClave": ["Pregunta específica 1", "Pregunta específica 2"],
      "actividadOral": "Pregunta oral específica"
    },
    {
      "numero": 3,
      "layout": "objective",
      "titulo": "Objetivo de aprendizaje",
      "contenido": "Objetivo en lenguaje estudiantil. Por qué es importante. Mínimo 2 oraciones.",
      "notasDocente": "Cómo presentar el objetivo",
      "imagePrompt": "Objective illustration, [concepto], educational, no text",
      "ejemplosClave": [],
      "actividadOral": "Hoy aprenderemos sobre [tema]. Es importante porque [razón]."
    },
    {
      "numero": 4,
      "layout": "concept_cards",
      "titulo": "Conceptos clave",
      "contenido": "2-4 conceptos con definición clara y ejemplo concreto cada uno.",
      "notasDocente": "Cómo explicar cada concepto",
      "imagePrompt": "Concept cards infographic, [conceptos], educational design, no text",
      "ejemplosClave": ["Concepto 1: definición + ejemplo", "Concepto 2: definición + ejemplo"],
      "actividadOral": "¿Pueden dar un ejemplo de [concepto]?"
    },
    {
      "numero": 5,
      "layout": "visual_explanation",
      "titulo": "Desarrollo del contenido",
      "contenido": "Explicación detallada del contenido principal. Mínimo 3-4 oraciones con información científica/humanista específica.",
      "notasDocente": "Estrategia de explicación visual",
      "imagePrompt": "Detailed educational diagram of [contenido], infographic, professional, no text",
      "ejemplosClave": ["Ejemplo 1 concreto", "Ejemplo 2 concreto"],
      "actividadOral": "¿Qué observan? ¿Cómo se relaciona con [concepto]?"
    },
    {
      "numero": 6,
      "layout": "guided_activity",
      "titulo": "Actividad guiada",
      "contenido": "Instrucciones paso a paso. Materiales. Tiempo. Producto esperado.",
      "notasDocente": "Cómo modelar la actividad",
      "imagePrompt": "Students hands-on activity with teacher, [tema], Chilean classroom, no text",
      "ejemplosClave": ["Paso 1: instrucción", "Paso 2: instrucción"],
      "actividadOral": "Vamos a hacer: paso 1 [instrucción]."
    },
    {
      "numero": 7,
      "layout": "collaborative_activity",
      "titulo": "Actividad colaborativa",
      "contenido": "Actividad grupal. Roles. Producto esperado. Tiempo.",
      "notasDocente": "Cómo organizar los grupos",
      "imagePrompt": "Students teamwork, [tema], collaborative learning, classroom, no text",
      "ejemplosClave": ["Rol 1", "Rol 2"],
      "actividadOral": "Trabajen en grupo. Cada uno tiene un rol."
    },
    {
      "numero": 8,
      "layout": "dua_supports",
      "titulo": "Apoyos DUA",
      "contenido": "Estrategias DUA específicas para este tema: representación, acción, implicación.",
      "notasDocente": "Cómo implementar los apoyos DUA",
      "imagePrompt": "Universal Design for Learning, inclusive classroom, [tema], no text",
      "ejemplosClave": ["Representación: [estrategia]", "Acción: [estrategia]", "Implicación: [estrategia]"],
      "actividadOral": ""
    },
    {
      "numero": 9,
      "layout": "formative_assessment",
      "titulo": "Evaluación formativa",
      "contenido": "Preguntas específicas al OA. Criterios de éxito. Instrumento de evaluación.",
      "notasDocente": "Cómo aplicar la evaluación",
      "imagePrompt": "Formative assessment, students reflecting, educational evaluation, no text",
      "ejemplosClave": ["Pregunta 1 específica", "Pregunta 2 específica"],
      "actividadOral": "Responde: ¿Qué aprendiste hoy sobre [tema]?"
    },
    {
      "numero": 10,
      "layout": "closure",
      "titulo": "Cierre de la clase",
      "contenido": "Síntesis de aprendizajes. Conexión con próxima clase. Pregunta metacognitiva.",
      "notasDocente": "Cómo cerrar la clase",
      "imagePrompt": "Reflection summary, [tema], educational achievement, inspiring, no text",
      "ejemplosClave": ["Aprendizaje 1", "Aprendizaje 2"],
      "actividadOral": "¿Qué fue lo más interesante? ¿Cómo usarás esto fuera de la escuela?"
    }
  ],
  "tiempoTotalMin": 45
}

Contexto: ${baseContext}
REGLAS OBLIGATORIAS:
- EXACTAMENTE 10 diapositivas con los layouts indicados.
- Cada slide DEBE tener contenido real desarrollado (mín. 50 palabras).
- imagePrompt DEBE estar en INGLÉS y ser descriptivo (sin emojis, sin placeholders).
- NUNCA usar "..." para truncar. Escribe oraciones completas.
- Separar habilidades (acciones) del contenido (conceptos).
- Contexto chileno: usa referencias geográficas, culturales e históricas de Chile.
- Prohibido frases genéricas como "Contenido breve" o "Título del slide".`
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

    // Save to generated_resources
    const resourceId = `res_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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
