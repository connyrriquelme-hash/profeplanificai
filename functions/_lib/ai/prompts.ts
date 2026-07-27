import type { AgentType, TaskType, AIRequest } from './types';
import { buildEvaluationPrompt } from './evaluationPrompts';

const BASE_CONTEXT = `Eres un asistente pedagógico experto en el Currículum Nacional de Chile (MINEDUC) y prácticas docentes efectivas en contextos escolares chilenos.

REGLAS GENERALES OBLIGATORIAS:
- Usa español chileno claro y aplicable al aula.
- Enfoque práctico: todo lo que generes debe ser usable mañana en clases.
- Evaluación formativa: siempre incluye formas de verificar el aprendizaje.
- DUA: considera representación, acción/expresión e implicación.
- Apoyo a estudiantes con necesidades: instrucciones claras, ejemplos concretos, vocabulario clave.
- Si hay OA, úsalo para alinear. Si no hay OA, indica suavemente que el docente debe seleccionarlo.
- Nunca inventes códigos OA. Si no hay, di "OA pendiente".
- Calidad premium: entrega productos listos para usar e imprimir, con consignas exactas, criterios claros, lenguaje docente profesional y pasos accionables.
- Contexto chileno: usa referencias culturales, geográficas e históricas de Chile (Cordillera de los Andes, Pacífico, Pampas, fiestas patrias, escuelas municipales, liceos, CPEIP, MINEDUC).
- Materiales realistas: solo incluye materiales que existan en escuelas chilenas (cuaderno, pizarrón, fichas, tiza, marcadores, calculadora básica, etc.).
- Niveles chilenos: usa la nomenclatura oficial: Prekínder, Kínder, 1° a 8° Básico, 1° a 4° Medio.
- Asignaturas del currículum: Lenguaje y Comunicación, Matemática, Ciencias Naturales, Historia, Geografía y Ciencias Sociales, Inglés, Artes Visuales, Música, Educación Física, Orientación, Formación Ciudadana, Tecnología.
- Calendario escolar: considera el año escolar chileno (marzo a diciembre), vacaciones de invierno (julio), semestre 1 (marzo-julio), semestre 2 (agosto-diciembre).
- Cuando el producto lo permita, agrega campos estructurados opcionales: "tablas", "callouts", "graficos" y "checklist" para enriquecer la salida visual.
- NO incluir metadata técnica (provider, model, warnings, aiGenerated, tokens, etc.).
- RESPUESTA: Responde SOLO con JSON válido. Sin markdown, sin explicaciones, sin texto antes ni después del JSON.`;

function oaBlock(req: AIRequest): string {
  if (!req.oaCode) return 'OA: No especificado. El docente debe seleccionar un OA del Curriculo Nacional.';
  const criteria = (req as any).criteria;
  const criteriaText = Array.isArray(criteria) && criteria.length > 0
    ? `\nCriterios de aprendizaje:\n${criteria.map((c: string) => `- ${c}`).join('\n')}`
    : '';
  const curricularSkills = req.curricularSkills;
  const curricularText = Array.isArray(curricularSkills) && curricularSkills.length > 0
    ? `\nHabilidades curriculares (a desarrollar transversalmente):\n${curricularSkills.map((s: string) => `- ${s}`).join('\n')}`
    : '';
  return `OA: ${req.oaCode} — ${req.oaText || 'Texto no disponible'}
Habilidades: ${req.skills?.join('; ') || 'No especificadas'}
Indicadores: ${req.indicators?.join('; ') || 'No especificados'}${criteriaText}${curricularText}`;
}

function classBlock(req: AIRequest): string {
  return `Curso: ${req.course || 'No especificado'}
Asignatura: ${req.subject || 'No especificada'}
Grado: ${req.grade || 'No especificado'}
Clase: ${req.lessonId || 'Sin nombre'}${req.pedagogicalContext ? `\n\n${req.pedagogicalContext}` : ''}`;
}

const PROMPTS: Record<AgentType, Record<TaskType, (req: AIRequest) => string>> = {
  actividades_clase: {
    generar: (req) => `${BASE_CONTEXT}

TAREA: Genera actividades de clase completas y detalladas.

${classBlock(req)}
${oaBlock(req)}

INSTRUCCIONES ADICIONALES: ${req.instructions || 'Ninguna'}

INSTRUCCIONES CRITICAS:
- Cada momento debe ser ESPECIFICO al OA, no generico.
- Incluye ejemplos concretos de actividades, no frases vagas.
- Menciona el OA explicitamente en inicio, desarrollo y cierre.
- Usa lenguaje accionable: que hace el docente, que hacen los estudiantes.
- Duracion total: 90 min (10-15 inicio, 55-65 desarrollo, 10-15 cierre).

Campos obligatorios:
- objetivoEspecifico: 1-2 oraciones con el objetivo concreto alineado al OA.
- proposito: 1 oracion con el proposito pedagogico al OA.
- inicio: Parrafo detallado (10-15 min). Incluye: pregunta motivadora, situacion concreta, conexion con contexto chileno, consigna exacta del docente.
- desarrollo: Parrafo detallado (55-65 min). Incluye: modelamiento docente, practica guiada, trabajo individual, revision entre pares. Andamiajes DUA.
- cierre: Parrafo detallado (10-15 min). Incluye: sintesis guiada, pregunta metacognitiva, ticket de salida, criterio de logro, decision pedagogica.
- evaluacionFormativa: 3-4 formas concretas de evaluar durante la clase.
- ticketSalida: 3 preguntas especificas al OA.
- recursosMateriales: 4-5 materiales concretos y especificos.
- adecuacionesDUA: 3 oraciones con representacion, accion/expresion e implicacion.
- apoyoEstudiantesDescendidos: 3 estrategias concretas.
- extensionAvanzados: 2-3 actividades de profundizacion.

Responde SOLO este JSON (sin markdown, sin explicaciones):
{"objetivoEspecifico":"","proposito":"","inicio":"","desarrollo":"","cierre":"","evaluacionFormativa":"","ticketSalida":"","recursosMateriales":[],"adecuacionesDUA":"","apoyoEstudiantesDescendidos":"","extensionAvanzados":""}`,

    mejorar: (req) => `${BASE_CONTEXT}

TAREA: Mejora las actividades de clase existentes.

${classBlock(req)}
${oaBlock(req)}

CONTENIDO EXISTENTE:
${req.existingContent || 'Sin contenido previo'}

INSTRUCCIONES: ${req.instructions || 'Mejora general'}

Mejora: claridad, tiempos, evaluacion, DUA. Responde en el mismo formato JSON.`,
    adaptar: (req) => `${BASE_CONTEXT}

TAREA: Adapta actividades para contextos especificos.

${classBlock(req)}
${oaBlock(req)}

INSTRUCCIONES: ${req.instructions || 'Adapta para curso heterogeneo'}

Responde en formato JSON con las actividades adaptadas.`,
    evaluar: (req) => `${BASE_CONTEXT}
TAREA: Evalua la calidad pedagogica de actividades.
${classBlock(req)}
${oaBlock(req)}
CONTENIDO: ${req.existingContent || 'Sin contenido'}
Califica: alineacion OA, tiempos, evaluacion, DUA, claridad. JSON: {"puntuacion":0,"fortalezas":[],"mejoras":[],"recomendaciones":[]}`,
    crear_guia: (req) => `${BASE_CONTEXT}
TAREA: Crea guia de aprendizaje.
${classBlock(req)}
${oaBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}
JSON: {"titulo":"","objetivos":"","actividades":[{"nombre":"","instrucciones":"","tiempo":""}],"materiales":[],"evaluacion":""}`,
    crear_rubrica: (req) => `${BASE_CONTEXT}
TAREA: Crea rubrica de evaluacion.
${classBlock(req)}
${oaBlock(req)}
JSON: {"titulo":"","criterios":[{"nombre":"","niveles":[{"nivel":"","puntaje":0,"descripcion":""}]}]}`,
    crear_ticket_salida: (req) => `${BASE_CONTEXT}
TAREA: Crea ticket de salida.
${classBlock(req)}
${oaBlock(req)}
JSON: {"titulo":"","preguntas":[{"enunciado":"","tipo":"abierta/cerrada/multiple"}],"tiempoEstimado":"5 min"}`,
    crear_ppt: (req) => `${BASE_CONTEXT}
TAREA: Crea estructura de presentacion.
${classBlock(req)}
${oaBlock(req)}
JSON: {"titulo":"","diapositivas":[{"numero":1,"titulo":"","contenido":"","notas":""}]}`,
    crear_reporte: (req) => `${BASE_CONTEXT}
TAREA: Crea reporte de avance.
${classBlock(req)}
${oaBlock(req)}
JSON: {"titulo":"","resumen":"","avance":"","proximoPaso":"","observaciones":""}`,
  },

  generador_recursos: {
    generar: (req) => `${BASE_CONTEXT}
TAREA: Genera recurso didactico con estructura visual completa.
${classBlock(req)}
${oaBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}
El recurso debe ser especifico al OA y los indicadores. Incluye ejemplos concretos, no genericos.

OBLIGATORIO: El recurso DEBE incluir:
- Al menos 1 tabla con datos pedagogicos relevantes.
- Al menos 1 callout (docente, familia, importante, dua o evaluacion).
- Al menos 1 grafico o proceso visual (bar, timeline, process).
- Checklist de verificacion cuando corresponda.
- NO incluir provider, model, warnings, aiGenerated ni metadata tecnica.

JSON con esta estructura EXACTA:
{
  "titulo": "...",
  "proposito": "...",
  "secciones": [
    {"titulo": "...", "contenido": "...", "tipo": "explicacion|actividad|evaluacion|apoyo|cierre"}
  ],
  "tablas": [
    {"titulo": "...", "columnas": ["...", "..."], "filas": [["...", "..."]]}
  ],
  "graficos": [
    {"tipo": "bar|timeline|process", "titulo": "...", "datos": [{"label": "...", "value": 25}]}
  ],
  "callouts": [
    {"tipo": "docente|familia|importante|dua|evaluacion", "titulo": "...", "texto": "..."}
  ],
  "checklist": ["...", "..."],
  "materiales": [],
  "instruccionesDocente": "",
  "instruccionesEstudiantes": ""
}`,
    mejorar: (req) => `${BASE_CONTEXT}
TAREA: Mejora recurso didactico existente.
${classBlock(req)}
${oaBlock(req)}
CONTENIDO: ${req.existingContent || ''}
INSTRUCCIONES: ${req.instructions || ''}
Mejora: claridad, alineacion OA, ejemplos concretos, diferenciacion. Responde en formato JSON.`,
    adaptar: (req) => `${BASE_CONTEXT}
TAREA: Adapta recurso didactico.
${classBlock(req)}
${oaBlock(req)}
INSTRUCCIONES: ${req.instructions || 'Adapta para curso heterogeneo'}
Responde en formato JSON con el recurso adaptado.`,
    evaluar: (req) => `${BASE_CONTEXT}
TAREA: Evalua recurso didactico.
CONTENIDO: ${req.existingContent || ''}
Califica: alineacion OA, claridad, viabilidad, diferenciacion, tiempo estimado.
JSON: {"puntuacion":0,"fortalezas":[],"mejoras":[],"recomendaciones":[]}`,
    crear_guia: (req) => `${BASE_CONTEXT}
TAREA: Crea guia de aprendizaje para los estudiantes con estructura visual.
${classBlock(req)}
${oaBlock(req)}
La guia debe ser uso directo del estudiante. Incluye: proposito, actividades graduadas, ejercicios con ejemplos, espacio para respuestas, autoevaluacion.

OBLIGATORIO: Incluir al menos 1 tabla, 1 callout, 1 grafico y checklist.

JSON:
{
  "titulo": "...",
  "proposito": "...",
  "secciones": [
    {"titulo": "...", "contenido": "...", "tipo": "explicacion|actividad|evaluacion|apoyo|cierre"}
  ],
  "tablas": [
    {"titulo": "...", "columnas": ["...", "..."], "filas": [["...", "..."]]}
  ],
  "graficos": [
    {"tipo": "bar|timeline|process", "titulo": "...", "datos": [{"label": "...", "value": 25}]}
  ],
  "callouts": [
    {"tipo": "docente|familia|importante|dua|evaluacion", "titulo": "...", "texto": "..."}
  ],
  "checklist": ["...", "..."],
  "autoevaluacion": "..."
}`,
    crear_rubrica: (req) => `${BASE_CONTEXT}
TAREA: Crea rubrica de evaluacion con tabla visual.
${classBlock(req)}
${oaBlock(req)}
Los criterios deben ser especificos al OA y medibles.

OBLIGATORIO: Incluir tabla de criterios y niveles, checklist de revision, callout docente.

JSON:
{
  "titulo": "...",
  "descripcion": "...",
  "tablas": [
    {"titulo": "Rubrica de Evaluacion", "columnas": ["Criterio", "Inicial", "En desarrollo", "Logrado", "Destacado"], "filas": [["...", "...", "...", "...", "..."]]}
  ],
  "callouts": [
    {"tipo": "docente", "titulo": "Instrucciones", "texto": "..."}
  ],
  "checklist": ["Revisar coherencia con OA", "Verificar claridad de criterios", "..."],
  "criterios": [{"nombre": "", "ponderacion": 0, "niveles": [{"nivel": "Logrado", "puntaje": 4, "descripcion": ""}]}]
}`,
    crear_ticket_salida: (req) => `${BASE_CONTEXT}
TAREA: Crea ticket de salida con estructura visual.
${classBlock(req)}
${oaBlock(req)}
Preguntas especificas al OA. Incluye metacognicion.

OBLIGATORIO: Incluir tabla con pregunta, criterio y nivel esperado, checklist breve, callout de decision pedagogica.

JSON:
{
  "titulo": "...",
  "tablas": [
    {"titulo": "Ticket de Salida", "columnas": ["Pregunta", "Criterio de logro", "Nivel esperado"], "filas": [["...", "...", "..."]]}
  ],
  "callouts": [
    {"tipo": "docente", "titulo": "Decision pedagogica", "texto": "..."}
  ],
  "checklist": ["Revisar respuestas", "Identificar estudiantes que necesitan apoyo", "..."],
  "preguntas": [{"enunciado": "", "tipo": "abierta/cerrada/multiple", "respuestaEsperada": ""}],
  "tiempoEstimado": "5 min",
  "criterioLogro": ""
}`,
    crear_ppt: (req) => `${BASE_CONTEXT}
TAREA: Crea estructura de presentacion para la clase.
${classBlock(req)}
${oaBlock(req)}
Cada diapositiva con titulo, contenido breve, sugerencia visual, actividad oral.
JSON: {"titulo":"","diapositivas":[{"numero":1,"titulo":"","contenido":"","notasDocente":"","imagenSugerida":"","actividadOral":""}],"tiempoTotalMin":45}`,
    crear_reporte: (req) => `${BASE_CONTEXT}
TAREA: Crea reporte de avance del recurso.
JSON: {"titulo":"","resumen":"","avance":"","proximoPaso":"","observaciones":""}`,
  },

  evaluador: {
    generar: (req) => `${BASE_CONTEXT}
TAREA: Genera evaluacion con estructura visual completa.
${classBlock(req)}
${oaBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}

OBLIGATORIO: La evaluacion DEBE incluir:
- Tabla de especificaciones o de items.
- Callout de instrucciones.
- Grafico de habilidades cuando corresponda.
- NO incluir provider, model, warnings ni metadata tecnica.

JSON:
{
  "titulo": "...",
  "tipo": "...",
  "proposito": "...",
  "tablas": [
    {"titulo": "Especificaciones", "columnas": ["Item", "Puntaje", "Indicador", "Respuesta esperada"], "filas": [["1", "4", "...", "..."]]}
  ],
  "callouts": [
    {"tipo": "evaluacion", "titulo": "Instrucciones", "texto": "..."}
  ],
  "graficos": [
    {"tipo": "bar", "titulo": "Habilidades evaluadas", "datos": [{"label": "Comprension", "value": 40}, {"label": "Aplicacion", "value": 40}, {"label": "Analisis", "value": 20}]}
  ],
  "checklist": ["Revisar alineacion con OA", "Verificar claridad de preguntas", "..."],
  "preguntas": [{"enunciado": "", "alternativas": [], "respuesta": "", "puntaje": 0}],
  "instrucciones": "",
  "tiempoEstimado": ""
}`,
    mejorar: (req) => `${BASE_CONTEXT}
TAREA: Mejora evaluacion existente.
CONTENIDO: ${req.existingContent || ''}
JSON: con la evaluacion mejorada.`,
    adaptar: (req) => `${BASE_CONTEXT}
TAREA: Adapta evaluacion.
INSTRUCCIONES: ${req.instructions || ''}
JSON: con la evaluacion adaptada.`,
    evaluar: (req) => `${BASE_CONTEXT}
TAREA: Evalua calidad de la evaluacion.
CONTENIDO: ${req.existingContent || ''}
JSON: {"puntuacion":0,"fortalezas":[],"mejoras":[]}`,
    crear_guia: (req) => `${BASE_CONTEXT}
TAREA: Crea guia de aplicacion de evaluacion.
${classBlock(req)}
JSON: {"titulo":"","pasos":[],"notas":[]}`,
    crear_rubrica: (req) => `${BASE_CONTEXT}
TAREA: Crea rubrica para la evaluacion.
${classBlock(req)}
JSON: {"titulo":"","criterios":[]}`,
    crear_ticket_salida: (req) => `${BASE_CONTEXT}
TAREA: Crea ticket de salida.
${classBlock(req)}
JSON: {"titulo":"","preguntas":[]}`,
    crear_ppt: (req) => `${BASE_CONTEXT}
TAREA: Presentacion de la evaluacion.
${classBlock(req)}
JSON: {"titulo":"","diapositivas":[]}`,
    crear_reporte: (req) => `${BASE_CONTEXT}
TAREA: Reporte de resultados.
JSON: {"titulo":"","resumen":""}`,
  },

  simce: {
    generar: (req) => `${BASE_CONTEXT}
TAREA: Genera item estilo SIMCE.
${classBlock(req)}
${oaBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}
El item debe: tener enunciado claro, 4 alternativas (1 correcta), distractor plausibles, nivel de complejidad medio.
JSON: {"titulo":"","tipoItem":"","enunciado":"","alternativas":[{"texto":"","esCorrecta":false}],"nivelComplejidad":"","OA":"","justificacion":"","tiempoEstimado":""}`,
    mejorar: (req) => `${BASE_CONTEXT}
TAREA: Mejora item SIMCE.
CONTENIDO: ${req.existingContent || ''}
JSON: con el item mejorado.`,
    adaptar: (req) => `${BASE_CONTEXT}
TAREA: Adapta item SIMCE.
INSTRUCCIONES: ${req.instructions || ''}
JSON: con el item adaptado.`,
    evaluar: (req) => `${BASE_CONTEXT}
TAREA: Evalua calidad SIMCE del item.
CONTENIDO: ${req.existingContent || ''}
JSON: {"puntuacion":0,"fortalezas":[],"mejoras":[]}`,
    crear_guia: (req) => `${BASE_CONTEXT}
TAREA: Crea guia de aplicacion SIMCE.
${classBlock(req)}
JSON: {"titulo":"","pasos":[]}`,
    crear_rubrica: (req) => `${BASE_CONTEXT}
TAREA: Rubrica para item SIMCE.
JSON: {"titulo":"","criterios":[]}`,
    crear_ticket_salida: (req) => `${BASE_CONTEXT}
TAREA: Ticket de salida SIMCE.
JSON: {"titulo":"","preguntas":[]}`,
    crear_ppt: (req) => `${BASE_CONTEXT}
TAREA: Presentacion de practica SIMCE.
JSON: {"titulo":"","diapositivas":[]}`,
    crear_reporte: (req) => `${BASE_CONTEXT}
TAREA: Reporte de desempeno SIMCE.
JSON: {"titulo":"","resumen":""}`,
  },

  rubrica: {
    generar: (req) => `${BASE_CONTEXT}
TAREA: Crea rubrica de evaluacion con estructura visual.
${classBlock(req)}
${oaBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}

OBLIGATORIO: Incluir tabla de criterios y niveles, checklist de revision, callout docente.

JSON:
{
  "titulo": "...",
  "descripcion": "...",
  "tablas": [
    {"titulo": "Rubrica de Evaluacion", "columnas": ["Criterio", "Inicial", "En desarrollo", "Logrado", "Destacado"], "filas": [["...", "...", "...", "...", "..."]]}
  ],
  "callouts": [
    {"tipo": "docente", "titulo": "Instrucciones de uso", "texto": "..."}
  ],
  "checklist": ["Verificar coherencia con OA", "Asegurar claridad de niveles", "..."],
  "criterios": [{"nombre": "", "ponderacion": 0, "niveles": [{"nivel": "Logrado", "puntaje": 4, "descripcion": ""}]}]
}`,
    mejorar: (req) => `${BASE_CONTEXT}
TAREA: Mejora rubrica.
CONTENIDO: ${req.existingContent || ''}
JSON: con la rubrica mejorada.`,
    adaptar: (req) => `${BASE_CONTEXT}
TAREA: Adapta rubrica.
INSTRUCCIONES: ${req.instructions || ''}
JSON: con la rubrica adaptada.`,
    evaluar: (req) => `${BASE_CONTEXT}
TAREA: Evalua rubrica.
CONTENIDO: ${req.existingContent || ''}
JSON: {"puntuacion":0,"fortalezas":[],"mejoras":[]}`,
    crear_guia: (req) => `${BASE_CONTEXT}
TAREA: Guia de uso de rubrica.
JSON: {"titulo":"","pasos":[]}`,
    crear_rubrica: (req) => `${BASE_CONTEXT}
TAREA: Rubrica derivada.
JSON: {"titulo":"","criterios":[]}`,
    crear_ticket_salida: (req) => `${BASE_CONTEXT}
TAREA: Ticket de salida.
JSON: {"titulo":"","preguntas":[]}`,
    crear_ppt: (req) => `${BASE_CONTEXT}
TAREA: Presentacion de rubrica.
JSON: {"titulo":"","diapositivas":[]}`,
    crear_reporte: (req) => `${BASE_CONTEXT}
TAREA: Reporte de evaluacion con rubrica.
JSON: {"titulo":"","resumen":""}`,
  },

  dua: {
    generar: (req) => `${BASE_CONTEXT}
TAREA: Genera ajustes DUA detallados para la clase.
${classBlock(req)}
${oaBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}
Cada ajuste debe ser especifico al OA y a la actividad. No generico.
JSON: {"representacion":["Estrategia concreta 1","Estrategia concreta 2"],"accionExpresion":["Estrategia concreta 1","Estrategia concreta 2"],"implicacion":["Estrategia concreta 1","Estrategia concreta 2"],"principios":["Principio 1"],"recursosAdicionales":["Recurso 1"],"apoyoDescendidos":["Especifica 1"],"extensionAvanzados":["Especifica 1"]}`,
    mejorar: (req) => `${BASE_CONTEXT}
TAREA: Mejora ajustes DUA.
CONTENIDO: ${req.existingContent || ''}
JSON: con los ajustes DUA mejorados.`,
    adaptar: (req) => `${BASE_CONTEXT}
TAREA: Adapta DUA para necesidades especificas.
INSTRUCCIONES: ${req.instructions || ''}
JSON: con los ajustes adaptados.`,
    evaluar: (req) => `${BASE_CONTEXT}
TAREA: Evalua calidad DUA.
CONTENIDO: ${req.existingContent || ''}
JSON: {"puntuacion":0,"fortalezas":[],"mejoras":[]}`,
    crear_guia: (req) => `${BASE_CONTEXT}
TAREA: Guia DUA para docente.
JSON: {"titulo":"","pasos":[]}`,
    crear_rubrica: (req) => `${BASE_CONTEXT}
TAREA: Rubrica DUA.
JSON: {"titulo":"","criterios":[]}`,
    crear_ticket_salida: (req) => `${BASE_CONTEXT}
TAREA: Ticket DUA.
JSON: {"titulo":"","preguntas":[]}`,
    crear_ppt: (req) => `${BASE_CONTEXT}
TAREA: Presentacion DUA.
JSON: {"titulo":"","diapositivas":[]}`,
    crear_reporte: (req) => `${BASE_CONTEXT}
TAREA: Reporte DUA.
JSON: {"titulo":"","resumen":""}`,
  },

  presentacion: {
    generar: (req) => `${BASE_CONTEXT}

TAREA: Genera una presentación educativa completa y pedagógicamente profunda para una clase.

${classBlock(req)}
${oaBlock(req)}

INSTRUCCIONES ADICIONALES: ${req.instructions || 'Ninguna'}

REGLAS CRÍTICAS — LEE CON CUIDADO:

1. SEPARACIÓN HABILIDAD/CONTENIDO:
   - Si el OA dice "Observar mediante la exploración los animales invertebrados", el TEMA CENTRAL son "Los animales invertebrados", NO "la exploración" ni "observar".
   - Las habilidades (observar, explorar, analizar, comparar) son ACCIONES PEDAGÓGICAS, no contenido temático.
   - El contenido son los CONCEPTOS CIENTÍFICOS/HUMANISTAS: animales invertebrados, células, Revolución Francesa, fracciones, etc.

2. PROFUNDIDAD CONTENIDO:
   - Cada slide DEBE tener contenido explicativo REAL y desarrollado (mínimo 2-3 oraciones por slide).
   - PROHIBIDO usar frases genéricas como "Contenido breve", "Título del slide", "Conceptos clave".
   - Desarrolla el contenido científico/humanista apropiado para el nivel del estudiante.
   - Ejemplo para Ciencias Naturales 1° Básico sobre invertebrados: "Los animales invertebrados son aquellos que NO tienen columna vertebral. Ejemplos: insectos (mariposas, hormigas), arácnidos (arañas), moluscos (caracoles). Se diferencian de los vertebrados porque su cuerpo es más pequeño y flexible."

3. ESTRUCTURA DEL JSON — EXACTAMENTE 10 DIAPOSITIVAS:
   - slide 1: cover (portada con título de la clase)
   - slide 2: hook (activación de conocimientos previos con pregunta motivadora)
   - slide 3: objective (objetivo de aprendizaje alineado al OA)
   - slide 4: concept_cards (2-4 conceptos clave desarrollados)
   - slide 5: visual_explanation (explicación detallada del contenido principal)
   - slide 6: guided_activity (actividad guiada paso a paso)
   - slide 7: collaborative_activity (actividad colaborativa)
   - slide 8: dua_supports (adaptaciones DUA)
   - slide 9: formative_assessment (evaluación formativa)
   - slide 10: closure (cierre y metacognición)

4. PARA CADA DIAPOSITIVA, INCLUYE:
   - "titulo": Título descriptivo específico al contenido (nunca genérico)
   - "contenido": Texto explicativo desarrollado (mínimo 50 palabras por slide de contenido)
   - "notasDocente": Guía específica para el docente sobre qué decir y cómo explicar
   - "imagePrompt": Instrucción visual descriptiva EN INGLÉS para generar imagen (estilo editorial educativo, sin texto, sin personas realistas)
   - "ejemplosClave": 2-3 ejemplos concretos y específicos al tema
   - "actividadOral": Pregunta o consigna oral específica

5. IMAGEPROMPT — REGLAS ESTRICTAS:
   - DEBE ser en INGLÉS
   - DEBE describir la escena visual de forma específica (no genérica)
   - PROHIBIDO usar placeholders como "🎨exploración" o "Contenido visual premium"
   - Ejemplo bueno: "Colorful educational illustration of a butterfly, ant, and snail on a green leaf, Chilean classroom context, flat design, no text, child-friendly"
   - Ejemplo malo: "🎨 exploración, características"

6. NUNCA TRUNCAR TEXTO:
   - PROHIBIDO usar puntos suspensivos "..." para cortar oraciones
   - Escribe oraciones completas y coherentes
   - Si un texto es largo, desarrolla el contenido en el slide apropiado

JSON EXACTO:
{
  "titulo": "Título de la clase específico al tema",
  "diapositivas": [
    {
      "numero": 1,
      "layout": "cover",
      "titulo": "Título atractivo de la clase",
      "contenido": "Subtítulo con el tema específico",
      "notasDocente": "Instrucciones específicas para presentar la clase",
      "imagePrompt": "Educational presentation cover illustration, [tema específico], Chilean classroom context, professional colorful design, no text",
      "ejemplosClave": [],
      "actividadOral": ""
    },
    {
      "numero": 2,
      "layout": "hook",
      "titulo": "Activación de conocimientos previos",
      "contenido": "Pregunta motivadora concreta relacionada con el tema. Ejemplo: '¿Alguna vez han visto una mariposa en el jardín de la escuela? ¿Cómo creen que se mueven sin huesos?'",
      "notasDocente": "Dar 2 minutos para pensar individualmente. Luego compartir en parejas.",
      "imagePrompt": "Engaging motivational image of [tema], educational context, thought-provoking composition, no text",
      "ejemplosClave": ["Pregunta 1 específica", "Pregunta 2 específica", "Pregunta 3 específica"],
      "actividadOral": "Pregunta oral específica para activar conocimientos previos"
    },
    {
      "numero": 3,
      "layout": "objective",
      "titulo": "Objetivo de aprendizaje",
      "contenido": "Objetivo escrito en lenguaje comprensible para el estudiante. Mínimo 2 oraciones explicando qué aprenderán y por qué es importante.",
      "notasDocente": "Leer el OA en voz alta. Explicar con palabras simples qué van a aprender.",
      "imagePrompt": "Objective slide illustration, [concepto principal], educational infographic style, no text",
      "ejemplosClave": [],
      "actividadOral": "Hoy vamos a aprender sobre [tema específico]. Es importante porque [razón concreta]."
    },
    {
      "numero": 4,
      "layout": "concept_cards",
      "titulo": "Conceptos clave: [tema específico]",
      "contenido": "Desarrollo de 2-4 conceptos fundamentales. Cada concepto debe tener definición clara y ejemplo concreto.",
      "notasDocente": "Explicar cada concepto con ejemplos visuales y conexiones con la vida diaria.",
      "imagePrompt": "Visual concept map of [conceptos clave], educational infographic, clean design, Chilean context, no text",
      "ejemplosClave": ["Concepto 1: definición + ejemplo", "Concepto 2: definición + ejemplo"],
      "actividadOral": "¿Pueden nombrar un ejemplo de [concepto]?"
    },
    {
      "numero": 5,
      "layout": "visual_explanation",
      "titulo": "Desarrollo del contenido",
      "contenido": "Explicación detallada del contenido principal del OA. Mínimo 3-4 oraciones desarrollando el tema científico/humanista.",
      "notasDocente": "Usar pizarra o pantalla para reforzar visualmente. Hacer preguntas de comprensión.",
      "imagePrompt": "Detailed educational diagram of [contenido específico], infographic style with labels, professional illustration, no text",
      "ejemplosClave": ["Ejemplo 1 concreto", "Ejemplo 2 concreto", "Ejemplo 3 concreto"],
      "actividadOral": "¿Qué observan en esta imagen? ¿Cómo se relaciona con [concepto]?"
    },
    {
      "numero": 6,
      "layout": "guided_activity",
      "titulo": "Actividad guiada: [nombre específico]",
      "contenido": "Instrucciones paso a paso para la actividad. Materiales necesarios. Tiempo estimado.",
      "notasDocente": "Modelar el procedimiento primero. Luego guiar a los estudiantes paso a paso.",
      "imagePrompt": "Students hands-on activity with teacher guidance, [tema específico], Chilean classroom, collaborative learning, no text",
      "ejemplosClave": ["Paso 1: instrucción específica", "Paso 2: instrucción específica", "Paso 3: instrucción específica"],
      "actividadOral": "Vamos a hacer juntos: primer paso, [instrucción]. Segundo paso, [instrucción]."
    },
    {
      "numero": 7,
      "layout": "collaborative_activity",
      "titulo": "Actividad colaborativa: [nombre específico]",
      "contenido": "Actividad en parejas o grupos pequeños. Rol de cada integrante. Producto esperado.",
      "notasDocente": "Formar grupos de 3-4. Monitorear y hacer preguntas de profundización.",
      "imagePrompt": "Students teamwork activity, [tema específico], collaborative learning, classroom setting, no text",
      "ejemplosClave": ["Instrucción para grupo 1", "Instrucción para grupo 2"],
      "actividadOral": "Trabajen en grupo. Cada uno tiene un rol: [describir roles]."
    },
    {
      "numero": 8,
      "layout": "dua_supports",
      "titulo": "Apoyos DUA para esta clase",
      "contenido": "Estrategias de representación, acción/expresión e implicación específicas para el tema.",
      "notasDocente": "Recordar que todo estudiante puede acceder al contenido de múltiples formas.",
      "imagePrompt": "Universal Design for Learning inclusive classroom, diverse learners, [tema], Chilean educational context, no text",
      "ejemplosClave": ["Representación: [estrategia específica]", "Acción: [estrategia específica]", "Implicación: [estrategia específica]"],
      "actividadOral": ""
    },
    {
      "numero": 9,
      "layout": "formative_assessment",
      "titulo": "Evaluación formativa",
      "contenido": "Preguntas o actividades para verificar comprensión. Criterios de éxito observables.",
      "notasDocente": "Aplicar durante la actividad o al final. Revisar individualmente.",
      "imagePrompt": "Formative assessment illustration, students reflecting on learning, educational evaluation, no text",
      "ejemplosClave": ["Pregunta 1 para evaluar", "Pregunta 2 para evaluar", "Pregunta 3 para evaluar"],
      "actividadOral": "Antes de terminar, responde: ¿Qué aprendiste hoy sobre [tema]?"
    },
    {
      "numero": 10,
      "layout": "closure",
      "titulo": "Cierre de la clase",
      "contenido": "Síntesis de aprendizajes clave. Conexión con la próxima clase. Pregunta metacognitiva.",
      "notasDocente": "Dar tiempo para que 2-3 estudiantes compartan. Cerrar con entusiasmo.",
      "imagePrompt": "Reflection learning summary illustration, [tema], educational achievement, inspiring, no text",
      "ejemplosClave": ["Aprendizaje clave 1", "Aprendizaje clave 2"],
      "actividadOral": "¿Qué fue lo más interesante que aprendiste hoy? ¿Cómo puedes usar esto fuera de la escuela?"
    }
  ],
  "tiempoTotalMin": 45
}

RECUERDA: Responde SOLO con JSON válido. Sin markdown, sin explicaciones.`,
    mejorar: (req) => `${BASE_CONTEXT}
TAREA: Mejora presentacion.
CONTENIDO: ${req.existingContent || ''}
JSON: con la presentacion mejorada.`,
    adaptar: (req) => `${BASE_CONTEXT}
TAREA: Adapta presentacion.
INSTRUCCIONES: ${req.instructions || ''}
JSON: con la presentacion adaptada.`,
    evaluar: (req) => `${BASE_CONTEXT}
TAREA: Evalua presentacion.
CONTENIDO: ${req.existingContent || ''}
JSON: {"puntuacion":0,"fortalezas":[],"mejoras":[]}`,
    crear_guia: (req) => `${BASE_CONTEXT}
TAREA: Guia de uso de presentacion.
JSON: {"titulo":"","pasos":[]}`,
    crear_rubrica: (req) => `${BASE_CONTEXT}
TAREA: Rubrica para evaluar presentacion.
JSON: {"titulo":"","criterios":[]}`,
    crear_ticket_salida: (req) => `${BASE_CONTEXT}
TAREA: Ticket de salida.
JSON: {"titulo":"","preguntas":[]}`,
    crear_ppt: (req) => `${BASE_CONTEXT}
TAREA: Exporta presentacion.
JSON: {"titulo":"","diapositivas":[]}`,
    crear_reporte: (req) => `${BASE_CONTEXT}
TAREA: Reporte de presentacion.
JSON: {"titulo":"","resumen":""}`,
  },

  retroalimentacion: {
    generar: (req) => `${BASE_CONTEXT}
TAREA: Genera retroalimentacion pedagogica.
${classBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}
CONTENIDO: ${req.existingContent || ''}
JSON: {"fortalezas":[""],"sugerencias":[""],"proximoPaso":"","reflexionDocente":""}`,
    mejorar: (req) => `${BASE_CONTEXT}
TAREA: Mejora retroalimentacion.
CONTENIDO: ${req.existingContent || ''}
JSON: con la retroalimentacion mejorada.`,
    adaptar: (req) => `${BASE_CONTEXT}
TAREA: Adapta retroalimentacion.
INSTRUCCIONES: ${req.instructions || ''}
JSON: con la retroalimentacion adaptada.`,
    evaluar: (req) => `${BASE_CONTEXT}
TAREA: Evalua retroalimentacion.
CONTENIDO: ${req.existingContent || ''}
JSON: {"puntuacion":0,"fortalezas":[],"mejoras":[]}`,
    crear_guia: (req) => `${BASE_CONTEXT}
TAREA: Guia de retroalimentacion.
JSON: {"titulo":"","pasos":[]}`,
    crear_rubrica: (req) => `${BASE_CONTEXT}
TAREA: Rubrica de retroalimentacion.
JSON: {"titulo":"","criterios":[]}`,
    crear_ticket_salida: (req) => `${BASE_CONTEXT}
TAREA: Ticket retroalimentacion.
JSON: {"titulo":"","preguntas":[]}`,
    crear_ppt: (req) => `${BASE_CONTEXT}
TAREA: Presentacion de retroalimentacion.
JSON: {"titulo":"","diapositivas":[]}`,
    crear_reporte: (req) => `${BASE_CONTEXT}
TAREA: Reporte de retroalimentacion.
JSON: {"titulo":"","resumen":""}`,
  },

  curricular_checker: {
    generar: (req) => `${BASE_CONTEXT}
TAREA: Verifica alineacion curricular.
${classBlock(req)}
${oaBlock(req)}
CONTENIDO: ${req.existingContent || ''}
Verifica: coherencia con OA, indicadores, progresion, evaluacion.
JSON: {"alineado":true,"coherencia":0,"observaciones":[""],"ajustesRecomendados":[""]}`,
    mejorar: (req) => `${BASE_CONTEXT}
TAREA: Mejora alineacion curricular.
CONTENIDO: ${req.existingContent || ''}
JSON: con la verificacion mejorada.`,
    adaptar: (req) => `${BASE_CONTEXT}
TAREA: Adapta verificacion curricular.
JSON: con la verificacion adaptada.`,
    evaluar: (req) => `${BASE_CONTEXT}
TAREA: Evalua verificacion curricular.
CONTENIDO: ${req.existingContent || ''}
JSON: {"puntuacion":0,"fortalezas":[],"mejoras":[]}`,
    crear_guia: (req) => `${BASE_CONTEXT}
TAREA: Guia de verificacion curricular.
JSON: {"titulo":"","pasos":[]}`,
    crear_rubrica: (req) => `${BASE_CONTEXT}
TAREA: Rubrica curricular.
JSON: {"titulo":"","criterios":[]}`,
    crear_ticket_salida: (req) => `${BASE_CONTEXT}
TAREA: Ticket curricular.
JSON: {"titulo":"","preguntas":[]}`,
    crear_ppt: (req) => `${BASE_CONTEXT}
TAREA: Presentacion curricular.
JSON: {"titulo":"","diapositivas":[]}`,
    crear_reporte: (req) => `${BASE_CONTEXT}
TAREA: Reporte curricular.
JSON: {"titulo":"","resumen":""}`,
  },
};

export function buildPrompt(agentType: AgentType, taskType: TaskType, req: AIRequest): string {
  const evaluationPrompt = buildEvaluationPrompt(agentType, taskType, req);
  if (evaluationPrompt) return evaluationPrompt;

  const agentPrompts = PROMPTS[agentType];
  if (!agentPrompts) return `Tarea no soportada: ${agentType}/${taskType}`;
  const taskFn = agentPrompts[taskType];
  if (!taskFn) return `Tarea no soportada: ${agentType}/${taskType}`;
  return taskFn(req);
}
