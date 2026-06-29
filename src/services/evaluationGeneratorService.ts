import { generarConIA } from './aiService';
import { generateEvalAvanzado } from './localGenerator';

const TYPE_PROMPT_KEY: Record<string, string> = {
  formativa: 'formativa',
  sumativa: 'prueba_escrita',
  rubrica: 'rubrica',
  ticket: 'ticket',
  simce: 'simce',
  cotejo: 'cotejo',
  diagnostica: 'formativa',
  holistica: 'rubrica',
  escala: 'rubrica',
  simce_breve: 'simce',
  banco_preguntas: 'prueba_escrita',
};

const TYPE_DISPLAY: Record<string, string> = {
  formativa: 'Evaluacion formativa',
  sumativa: 'Prueba escrita',
  rubrica: 'Rubrica',
  ticket: 'Ticket de salida',
  simce: 'Evaluacion tipo SIMCE',
  cotejo: 'Lista de cotejo',
  diagnostica: 'Evaluacion diagnostica',
  holistica: 'Rubrica holistica',
  escala: 'Escala de apreciacion',
  simce_breve: 'Evaluacion tipo SIMCE',
  banco_preguntas: 'Banco de preguntas',
};

export function buildEvaluationPrompt(params: {
  evaluationType: string;
  course: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  selectedIndicators: string[];
  skill: string;
  difficulty: string;
  numberOfQuestions?: number;
  includeAnswerKey?: boolean;
  includeRubric?: boolean;
  includeDUA?: boolean;
  baseText?: string;
}): string {
  const typeKey = TYPE_PROMPT_KEY[params.evaluationType] || 'formativa';
  const displayType = TYPE_DISPLAY[params.evaluationType] || 'Evaluacion';
  const hasIndicators = params.selectedIndicators.length > 0;

  const sections: string[] = [
    'Eres una docente chilena experta en evaluacion educativa, curriculo nacional y pedagogia. Genera un instrumento evaluativo de alta calidad.',
    '',
    `Tipo: ${displayType}`,
    `Curso: ${params.course}`,
    `Asignatura: ${params.subject}`,
    `OA: ${params.objectiveCode} — ${params.objectiveText}`,
    `Habilidad principal: ${params.skill}`,
    `Dificultad: ${params.difficulty}`,
    '',
  ];

  if (hasIndicators) {
    sections.push('Indicadores a evaluar:');
    params.selectedIndicators.forEach(ind => sections.push(`- ${ind}`));
    sections.push('');
  } else {
    sections.push('Nota: no hay indicadores especificos. Usa el OA como base para estructurar la evaluacion.');
    sections.push('');
  }

  if (params.baseText) {
    sections.push(`Texto o estimulo base: ${params.baseText}`);
    sections.push('');
  }

  if (typeKey === 'formativa') {
    sections.push('Genera una Evaluacion formativa con:');
    sections.push('- Proposito de la evaluacion');
    sections.push('- 4 a 6 actividades breves y variadas');
    sections.push('- Criterios de observacion por actividad');
    sections.push('- Retroalimentacion sugerida para cada nivel de logro');
    sections.push('- Evidencia de aprendizaje esperada');
    if (hasIndicators) sections.push('- Cada actividad debe vincularse al indicador que evalua');
    sections.push('');
    sections.push('Incluye adecuaciones DUA al final.');
  } else if (typeKey === 'prueba_escrita') {
    const nq = params.numberOfQuestions || 8;
    sections.push('Genera una Prueba escrita con:');
    sections.push('- Instrucciones claras para el estudiante');
    sections.push(`- ${Math.ceil(nq * 0.6)} preguntas de seleccion multiple (4 alternativas A-D)`);
    sections.push(`- ${Math.floor(nq * 0.4)} preguntas de desarrollo`);
    sections.push('- Pauta de correccion detallada con puntaje sugerido por pregunta');
    if (hasIndicators) sections.push('- Cada pregunta debe indicar que indicador evalua');
    if (params.includeAnswerKey !== false) sections.push('- Clave de respuestas correctas');
    if (params.includeRubric) sections.push('- Rubrica analitica para preguntas de desarrollo');
    sections.push('');
    sections.push('Incluye adecuaciones DUA al final.');
  } else if (typeKey === 'rubrica') {
    sections.push('Genera una Rubrica con:');
    sections.push('- Criterios de evaluacion basados en el OA y los indicadores');
    sections.push('- 4 niveles de logro: Destacado, Logrado, En desarrollo, No logrado');
    sections.push('- Descriptores claros y observables por cada nivel');
    sections.push('- Puntaje sugerido por criterio');
    sections.push('- Recomendaciones de uso para el docente');
    if (hasIndicators) sections.push('- Cada criterio debe vincularse a un indicador especifico');
    sections.push('');
    sections.push('Incluye adecuaciones DUA al final.');
  } else if (typeKey === 'ticket') {
    sections.push('Genera un Ticket de salida con:');
    sections.push('- 3 preguntas breves sobre el OA trabajado');
    sections.push('- 1 pregunta metacognitiva (que aprendi, como lo aprendi, que me costo)');
    sections.push('- Criterio de revision rapida para el docente');
    if (hasIndicators) sections.push('- Cada pregunta debe vincularse al indicador que evalua');
    sections.push('');
    sections.push('Incluye adecuaciones DUA al final.');
  } else if (typeKey === 'simce') {
    const nq = params.numberOfQuestions || 10;
    sections.push('Genera una Evaluacion tipo SIMCE con:');
    if (params.baseText) sections.push('- Texto o estimulo base para las preguntas');
    sections.push(`- ${nq} preguntas de alternativas (A, B, C, D)`);
    sections.push('- Distractores plausibles y una respuesta correcta');
    sections.push('- Cada pregunta debe indicar: habilidad evaluada, indicador asociado, dificultad');
    sections.push('- Clave correcta con explicacion de la respuesta');
    sections.push('- Tabla de especificaciones al final');
    sections.push('- Pauta de correccion');
    if (hasIndicators) sections.push('- Cada pregunta debe vincularse a un indicador especifico');
    sections.push('');
    sections.push('Importante: usa el nombre "tipo SIMCE". No uses "SIMCE oficial". No afirmes que es una prueba oficial.');
  } else if (typeKey === 'cotejo') {
    sections.push('Genera una Lista de cotejo con:');
    sections.push('- Indicadores observables derivados del OA');
    sections.push('- Columnas: Si / No / En proceso');
    sections.push('- Espacio para observaciones por indicador');
    sections.push('- Criterio de logro claro');
    if (hasIndicators) sections.push('- Cada indicador observable debe basarse en los indicadores seleccionados');
    sections.push('');
    sections.push('Incluye adecuaciones DUA al final.');
  }

  sections.push('');
  sections.push('Reglas de formato:');
  sections.push('- NO USES Markdown. No uses asteriscos ni **negritas**.');
  sections.push('- No uses numerales ## para titulos.');
  sections.push('- Usa titulos limpios seguidos de dos puntos, ejemplo:');
  sections.push('  "Instrucciones:" en vez de "## Instrucciones".');
  sections.push('- Usa guiones "-" para listas, NO asteriscos "*".');
  sections.push('- Usa numeros para preguntas (1., 2., 3., etc.).');
  sections.push('- Lenguaje claro y aplicable al aula chilena.');
  sections.push('- Extension suficiente para cubrir todos los elementos solicitados.');
  sections.push('- No dejes secciones vacias. Si no hay datos para una seccion, omitela.');

  return sections.join('\n');
}

export function cleanEvaluationText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^[ \t]*\*[ \t]+/gm, '- ')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function generateEvaluation(params: {
  evaluationType: string;
  course: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  selectedIndicators: string[];
  skill: string;
  difficulty: string;
  numberOfQuestions?: number;
  includeAnswerKey?: boolean;
  includeRubric?: boolean;
  includeDUA?: boolean;
  baseText?: string;
  onStatus?: (msg: string, type?: string) => void;
}): Promise<string> {
  const onStatus = params.onStatus || (() => {});

  const prompt = buildEvaluationPrompt(params);

  try {
    const result = await generarConIA({
      tipo: 'evaluacion',
      nivel: params.course,
      asignatura: params.subject,
      oa: `${params.objectiveCode} — ${params.objectiveText}`,
      promptExt: prompt,
      onStatus,
    });

    if (result.ok && result.texto) {
      return cleanEvaluationText(result.texto);
    }

    onStatus('Generando en modo local...', '');
    return cleanEvaluationText(generateEvalAvanzado({
      tipo: params.evaluationType,
      nivel: params.course,
      asignatura: params.subject,
      oa: `${params.objectiveCode} — ${params.objectiveText}`,
      habilidad: params.skill,
      indicadores: params.selectedIndicators,
      dificultad: params.difficulty,
      texto: params.baseText || '',
    }));
  } catch {
    onStatus('Generando en modo local (fallback)...', '');
    return cleanEvaluationText(generateEvalAvanzado({
      tipo: params.evaluationType,
      nivel: params.course,
      asignatura: params.subject,
      oa: `${params.objectiveCode} — ${params.objectiveText}`,
      habilidad: params.skill,
      indicadores: params.selectedIndicators,
      dificultad: params.difficulty,
      texto: params.baseText || '',
    }));
  }
}
