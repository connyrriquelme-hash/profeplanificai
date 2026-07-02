import type { AgentType, AIRequest, TaskType } from './types';

const BASE = `Eres especialista en evaluación educativa chilena, currículum MINEDUC, DUA, PIE y retroalimentación formativa.
Responde SOLO JSON válido, sin markdown ni texto adicional.`;

function context(req: AIRequest): string {
  return `Curso: ${req.course || req.grade || 'No especificado'}
Asignatura: ${req.subject || 'No especificada'}
OA: ${req.oaCode ? `${req.oaCode} — ${req.oaText || 'Texto no disponible'}` : 'OA opcional/no especificado'}
Indicadores: ${req.indicators?.join('; ') || 'No especificados'}
Habilidades: ${req.skills?.join('; ') || 'No especificadas'}
Actitudes: ${req.attitudes?.join('; ') || 'No especificadas'}
Instrucciones: ${req.instructions || 'Ninguna'}
${req.pedagogicalContext || ''}`;
}

export function buildEvaluationPrompt(agentType: AgentType, taskType: TaskType, req: AIRequest): string | null {
  if (agentType === 'evaluador' && taskType === 'crear_evaluacion') {
    return `${BASE}
TAREA: Crea una evaluación completa alineada al curso/asignatura/OA si existe.
${context(req)}
JSON: {"titulo":"","instrucciones":"","tiempoEstimado":"","preguntas":[{"tipo":"","enunciado":"","alternativas":[],"respuestaEsperada":"","puntaje":0,"indicadorAsociado":""}],"pautaCorreccion":[],"adecuacionesDUA":[]}`;
  }

  if (agentType === 'evaluador' && taskType === 'crear_ticket_salida') {
    return `${BASE}
TAREA: Crea un ticket de salida breve para verificar aprendizaje al cierre.
${context(req)}
JSON: {"titulo":"","tiempoEstimado":"5-10 min","preguntas":[{"enunciado":"","proposito":"","respuestaEsperada":""}],"criteriosRapidos":[],"adecuacionesDUA":[]}`;
  }

  if (agentType === 'simce' && taskType === 'generar') {
    return `${BASE}
TAREA: Crea ítems estilo SIMCE con distractores plausibles y justificación pedagógica.
${context(req)}
JSON: {"titulo":"","items":[{"enunciado":"","alternativas":[{"letra":"A","texto":""},{"letra":"B","texto":""},{"letra":"C","texto":""},{"letra":"D","texto":""}],"respuestaCorrecta":"","habilidadEvaluada":"","justificacion":""}],"pauta":[]}`;
  }

  if (agentType === 'rubrica' && taskType === 'crear_rubrica') {
    return `${BASE}
TAREA: Crea una rúbrica/lista de cotejo/escala según la instrucción docente.
${context(req)}
JSON: {"titulo":"","tipoInstrumento":"","criterios":[{"criterio":"","niveles":[{"nivel":"","descripcion":"","puntaje":0}]}],"usoDocente":"","adecuacionesDUA":[]}`;
  }

  if (agentType === 'retroalimentacion' && taskType === 'crear_retroalimentacion') {
    return `${BASE}
TAREA: Crea retroalimentación formativa clara, respetuosa y accionable.
${context(req)}
JSON: {"fortalezas":[],"aspectosPorMejorar":[],"proximoPaso":"","mensajeParaEstudiante":"","mensajeParaApoderado":"","sugerenciasDocente":[]}`;
  }

  return null;
}
