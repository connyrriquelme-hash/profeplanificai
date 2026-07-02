import type { AgentType, TaskType, AIRequest } from './types';

const BASE_CONTEXT = `Eres un asistente pedagogico experto en el Curriculo Nacional de Chile y practicas docentes efectivas.
Reglas generales:
- Usa espanol chileno claro y aplicable al aula.
- Enfoque practico: todo lo que generes debe ser utilisable manana en clases.
- Evaluacion formativa: siempre incluye formas de verificar el aprendizaje.
- DUA: considera representacion, accion/expresion e implicacion.
- Apoyo a estudiantes descendidos: instrucciones claras, ejemplos concretos, vocabulario clave.
- Si hay OA, usalo para alinear. Si no hay OA, indica suavemente que el docente debe seleccionarlo.
- Nunca inventes codigos OA. Si no hay, di "OA pendiente".
- RESPUESTA: Responde SOLO con JSON valido. Sin markdown, sin explicaciones, sin texto antes ni despues del JSON.`;

function oaBlock(req: AIRequest): string {
  if (!req.oaCode) return 'OA: No especificado. El docente debe seleccionar un OA del Curriculo Nacional.';
  return `OA: ${req.oaCode} — ${req.oaText || 'Texto no disponible'}
Habilidades: ${req.skills?.join('; ') || 'No especificadas'}
Indicadores: ${req.indicators?.join('; ') || 'No especificados'}`;
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

TAREA: Genera actividades de clase completas.

${classBlock(req)}
${oaBlock(req)}

INSTRUCCIONES ADICIONALES: ${req.instructions || 'Ninguna'}

Campos obligatorios (todos en texto plano, sin saltos de linea excesivos):
- objetivoEspecifico: 1-2 oraciones con el objetivo concreto.
- proposito: 1 oracion con el proposito pedagogico.
- inicio: 2-4 oraciones con la actividad de activacion (10-15 min).
- desarrollo: 3-5 oraciones con la actividad principal (25-35 min).
- cierre: 2-3 oraciones con la reflexion (10-15 min).
- evaluacionFormativa: 2-3 oraciones con formas de evaluar.
- ticketSalida: 3 preguntas breves separadas por salto de linea.
- recursosMateriales: lista de 3-5 materiales.
- adecuacionesDUA: 2-3 oraciones.
- apoyoEstudiantesDescendidos: 2-3 oraciones.
- extensionAvanzados: 2-3 oraciones.

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
TAREA: Genera recurso didactico.
${classBlock(req)}
${oaBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}
JSON: {"titulo":"","tipo":"","contenido":"","materiales":[],"instruccionesDocente":"","instruccionesEstudiantes":""}`,
    mejorar: (req) => `${BASE_CONTEXT}
TAREA: Mejora recurso existente.
${classBlock(req)}
CONTENIDO: ${req.existingContent || ''}
INSTRUCCIONES: ${req.instructions || ''}
JSON: con el recurso mejorado.`,
    adaptar: (req) => `${BASE_CONTEXT}
TAREA: Adapta recurso.
${classBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}
JSON: con el recurso adaptado.`,
    evaluar: (req) => `${BASE_CONTEXT}
TAREA: Evalua recurso didactico.
CONTENIDO: ${req.existingContent || ''}
JSON: {"puntuacion":0,"fortalezas":[],"mejoras":[]}`,
    crear_guia: (req) => `${BASE_CONTEXT}
TAREA: Crea guia de uso del recurso.
${classBlock(req)}
JSON: {"titulo":"","pasos":[],"notas":""}`,
    crear_rubrica: (req) => `${BASE_CONTEXT}
TAREA: Crea rubrica para evaluar el recurso.
${classBlock(req)}
JSON: {"titulo":"","criterios":[]}`,
    crear_ticket_salida: (req) => `${BASE_CONTEXT}
TAREA: Crea ticket de salida basado en el recurso.
${classBlock(req)}
JSON: {"titulo":"","preguntas":[]}`,
    crear_ppt: (req) => `${BASE_CONTEXT}
TAREA: Crea presentacion del recurso.
${classBlock(req)}
JSON: {"titulo":"","diapositivas":[]}`,
    crear_reporte: (req) => `${BASE_CONTEXT}
TAREA: Reporte del recurso.
JSON: {"titulo":"","resumen":""}`,
  },

  evaluador: {
    generar: (req) => `${BASE_CONTEXT}
TAREA: Genera evaluacion.
${classBlock(req)}
${oaBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}
JSON: {"titulo":"","tipo":"","preguntas":[{"enunciado":"","alternativas":[],"respuesta":"","puntaje":0}],"ronda":"","instrucciones":"","tiempoEstimado":""}`,
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
TAREA: Crea rubrica de evaluacion.
${classBlock(req)}
${oaBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}
JSON: {"titulo":"","descripcion":"","criterios":[{"nombre":"","ponderacion":0,"niveles":[{"nivel":"Logrado","puntaje":4,"descripcion":""},{"nivel":"En desarrollo","puntaje":3,"descripcion":""},{"nivel":"Por reforzar","puntaje":2,"descripcion":""},{"nivel":"No logrado","puntaje":1,"descripcion":""}]}]}`,
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
TAREA: Genera ajustes DUA para la clase.
${classBlock(req)}
${oaBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}
JSON: {"representacion":[""],"accionExpresion":[""],"implicacion":[""],"principios":[""],"recursosAdicionales":[""]}`,
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
TAREA: Crea estructura de presentacion para clase.
${classBlock(req)}
${oaBlock(req)}
INSTRUCCIONES: ${req.instructions || ''}
JSON: {"titulo":"","diapositivas":[{"numero":1,"titulo":"","contenido":"","notasDocente":"","imagenSugerida":""}],"tiempoTotalMin":45}`,
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
  const agentPrompts = PROMPTS[agentType];
  if (!agentPrompts) return `Tarea no soportada: ${agentType}/${taskType}`;
  const taskFn = agentPrompts[taskType];
  if (!taskFn) return `Tarea no soportada: ${agentType}/${taskType}`;
  return taskFn(req);
}
