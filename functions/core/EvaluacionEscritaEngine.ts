import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { inferRangoEtario, isGenericOrWeak, mentionsTopic } from './pedagogicalUtils';
import { getExpertContext, getExpertEvaluationContext } from './ExpertKnowledge';
import {
  EvaluacionEscritaAISchema,
  type EvaluacionEscritaAI,
  type EvaluacionEscritaQuestionAI,
} from '../_lib/ai/schemas/evaluacionEscritaSchema';

export type EvaluacionEscritaTipo = 'formativa' | 'sumativa' | 'diagnostica' | 'simce';

export interface EvaluacionEscritaEngineInput {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  topic: string;
  indicators: string[];
  tipo: EvaluacionEscritaTipo;
  questionCount?: number;
}

export interface EvaluacionEscritaQuestion {
  number: number;
  type: 'alternativa' | 'verdadero_falso' | 'desarrollo';
  text: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  score: number;
  indicator: string;
  skill?: string;
  answer?: 'V' | 'F';
  justification_if_false?: string;
  teacher_rubric?: {
    criteria: string[];
    sample_answer: string;
    scoring_guide: string;
  };
}

export interface EvaluacionEscritaResult {
  title: string;
  instructions: string;
  questions: EvaluacionEscritaQuestion[];
  totalPoints: number;
  usedFallback: boolean;
}

// ─── Capa 2: fallback determinista ───
// Reemplaza a buildEvaluation() (materials/evaluation.ts), que era 100%
// texto fijo interpolado ("Alternativa correcta"/"Pregunta de selección
// múltiple sobre X" para cualquier tema, sin llamar nunca a IA). Se
// mantiene como red de seguridad — mismo criterio que el resto de los
// engines endurecidos hoy: solo se usa si la IA falla o el schema no valida.
function buildFallback(input: EvaluacionEscritaEngineInput): EvaluacionEscritaResult {
  const count = Math.min(Math.max(input.questionCount || 8, 3), 20);
  const tema = input.topic || input.objectiveCode;
  const types: EvaluacionEscritaQuestion['type'][] = ['alternativa', 'verdadero_falso', 'desarrollo'];
  const questions: EvaluacionEscritaQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const indicator = input.indicators[i % Math.max(input.indicators.length, 1)] || 'Comprensión del objetivo de aprendizaje';

    if (type === 'alternativa') {
      questions.push({
        number: i + 1,
        type,
        text: `Pregunta de selección múltiple sobre ${tema}.`,
        options: [
          { text: 'Alternativa correcta', isCorrect: true },
          { text: 'Alternativa incorrecta plausible', isCorrect: false },
          { text: 'Alternativa incorrecta plausible', isCorrect: false },
          { text: 'Alternativa incorrecta plausible', isCorrect: false },
        ],
        score: 2,
        indicator,
      });
    } else if (type === 'verdadero_falso') {
      questions.push({
        number: i + 1,
        type,
        text: `Afirmación sobre ${tema} para evaluar como verdadera o falsa.`,
        answer: 'V',
        score: 2,
        indicator,
      });
    } else {
      questions.push({
        number: i + 1,
        type,
        text: `Explica con tus propias palabras: ${tema}.`,
        score: 4,
        indicator,
        teacher_rubric: {
          criteria: ['Comprensión del concepto', 'Uso correcto del vocabulario'],
          sample_answer: `Respuesta modelo sobre ${tema}.`,
          scoring_guide: '1 punto por cada criterio satisfactoriamente cumplido.',
        },
      });
    }
  }

  return {
    title: `Evaluación: ${input.objectiveCode}`,
    instructions: 'Lee atentamente cada pregunta. En las de selección múltiple, marca solo una alternativa. En las de verdadero o falso, indica V o F. En las de desarrollo, escribe tu respuesta de forma clara y ordenada.',
    questions,
    totalPoints: questions.reduce((sum, q) => sum + q.score, 0),
    usedFallback: true,
  };
}

// ─── Prompt ───

const TIPO_INSTRUCCIONES: Record<EvaluacionEscritaTipo, string> = {
  formativa: 'Es una evaluación FORMATIVA: prioriza preguntas que permitan detectar a tiempo errores de comprensión, con progresión de dificultad de Recordar/Comprender a Aplicar.',
  diagnostica: 'Es una evaluación DIAGNÓSTICA: enfócate en verificar conocimientos previos y prerrequisitos, sin exigir aún el dominio completo del OA.',
  sumativa: 'Es una evaluación SUMATIVA: cubre el OA completo con preguntas que exigen aplicación real del contenido, no solo memorización.',
  simce: 'Es una evaluación TIPO SIMCE: usa SOLO preguntas de alternativas con 4 opciones (A-D), distractores plausibles (errores típicos reales, no absurdos) y evita por completo preguntas de desarrollo.',
};

function buildSystemPrompt(level: string, tipo: EvaluacionEscritaTipo): string {
  const rangoEtario = inferRangoEtario(level);

  return `Eres un EXPERTO en evaluación educativa, psicometría escolar y currículo chileno MINEDUC. Diseñas instrumentos evaluativos que miden con precisión el logro de un objetivo de aprendizaje específico, nunca preguntas de cultura general.
${getExpertContext()}
${getExpertEvaluationContext()}

TIPO DE EVALUACIÓN: ${TIPO_INSTRUCCIONES[tipo]}

ADAPTACION POR EDAD (usa exactamente este rango, no otro):
${rangoEtario}

REGLAS OBLIGATORIAS:
1. Cada pregunta debe evaluar directamente el objetivo de aprendizaje y el tema de la clase — nunca una pregunta genérica que serviría para cualquier tema.
2. NUNCA copies el texto del OA de forma literal como enunciado de pregunta — transforma el contenido en una situación o ejemplo concreto.
3. Las alternativas incorrectas (distractores) deben ser errores plausibles y específicos al tema, nunca "Alternativa incorrecta" genérica.
4. Las preguntas de desarrollo deben pedir algo concreto (explicar un caso, resolver un problema, comparar dos elementos), nunca "explica lo que aprendiste".
5. CONTEXTO CHILENO: cuando una pregunta necesite un ejemplo, persona o lugar, usa nombres chilenos (Sofía, Mateo, Javiera) y lugares reconocibles (el Mercado Central, la Cordillera de los Andes, una feria del barrio) en vez de ejemplos genéricos internacionales.
6. Distribuye las preguntas entre los tipos permitidos por el tipo de evaluación indicado arriba.
7. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones antes o después del JSON.

ESTRUCTURA JSON OBLIGATORIA:
{
  "title": "Título específico al tema real de la clase (no genérico)",
  "instructions": "Instrucciones claras para el estudiante",
  "questions": [
    {
      "type": "alternativa",
      "text": "Enunciado concreto ligado al tema",
      "options": [
        { "text": "Alternativa correcta específica al tema", "isCorrect": true },
        { "text": "Distractor plausible 1", "isCorrect": false },
        { "text": "Distractor plausible 2", "isCorrect": false },
        { "text": "Distractor plausible 3", "isCorrect": false }
      ]
    },
    {
      "type": "verdadero_falso",
      "text": "Afirmación concreta ligada al tema",
      "answer": "V",
      "justification_if_false": "Solo si answer es F: por qué es falsa"
    },
    {
      "type": "desarrollo",
      "text": "Consigna concreta que pide aplicar/explicar/resolver algo específico",
      "sample_answer": "Respuesta modelo breve y específica",
      "criteria": ["Criterio observable 1", "Criterio observable 2"]
    }
  ]
}`;
}

function buildUserPrompt(input: EvaluacionEscritaEngineInput): string {
  return JSON.stringify(
    {
      nivel: input.level,
      asignatura: input.subject,
      oa: input.objectiveCode,
      objetivo: input.objectiveText,
      indicadores: input.indicators,
      tema: input.topic,
      cantidad_preguntas: Math.min(Math.max(input.questionCount || 8, 3), 20),
    },
    null,
    2,
  );
}

// ─── Capa 3: enrich — reemplaza cada pregunta débil/genérica por la del
// fallback en la misma posición, asigna puntaje/indicador y numera. ───

function isWeakQuestion(text: string, topic: string): boolean {
  if (!text || text.trim().length < 10) return true;
  if (isGenericOrWeak(text)) return true;
  if (topic && !mentionsTopic(text, topic)) return true;
  return false;
}

function toEnginQuestion(
  ai: EvaluacionEscritaQuestionAI,
  fallback: EvaluacionEscritaQuestion,
  topic: string,
  indicator: string,
  number: number,
): EvaluacionEscritaQuestion {
  const useAi = !isWeakQuestion(ai.text, topic) && ai.type === fallback.type;
  const text = useAi ? ai.text : fallback.text;

  if (fallback.type === 'alternativa') {
    const options = useAi && ai.options && ai.options.length >= 3 && ai.options.some((o) => o.isCorrect)
      ? ai.options
      : fallback.options!;
    return { number, type: 'alternativa', text, options, score: 2, indicator };
  }
  if (fallback.type === 'verdadero_falso') {
    const answer = useAi && ai.answer ? ai.answer : (fallback.answer as 'V' | 'F');
    const justification = answer === 'F' ? (ai.justification_if_false || fallback.justification_if_false) : undefined;
    return { number, type: 'verdadero_falso', text, answer, justification_if_false: justification, score: 2, indicator };
  }
  const sampleAnswer = useAi && ai.sample_answer && ai.sample_answer.trim().length > 5 ? ai.sample_answer : fallback.teacher_rubric!.sample_answer;
  const criteria = useAi && ai.criteria && ai.criteria.length >= 2 ? ai.criteria : fallback.teacher_rubric!.criteria;
  return {
    number,
    type: 'desarrollo',
    text,
    score: 4,
    indicator,
    teacher_rubric: { criteria, sample_answer: sampleAnswer, scoring_guide: fallback.teacher_rubric!.scoring_guide },
  };
}

function enrich(ai: EvaluacionEscritaAI, fallback: EvaluacionEscritaResult, input: EvaluacionEscritaEngineInput): EvaluacionEscritaResult {
  const fallbackByType: Record<EvaluacionEscritaQuestion['type'], EvaluacionEscritaQuestion[]> = {
    alternativa: fallback.questions.filter((q) => q.type === 'alternativa'),
    verdadero_falso: fallback.questions.filter((q) => q.type === 'verdadero_falso'),
    desarrollo: fallback.questions.filter((q) => q.type === 'desarrollo'),
  };
  const usedByType: Record<EvaluacionEscritaQuestion['type'], number> = { alternativa: 0, verdadero_falso: 0, desarrollo: 0 };

  const questions = (ai.questions.length >= 3 ? ai.questions : fallback.questions.map((q) => ({ ...q } as unknown as EvaluacionEscritaQuestionAI)))
    .map((aiQ, i) => {
      const type = ['alternativa', 'verdadero_falso', 'desarrollo'].includes(aiQ.type) ? aiQ.type : 'alternativa';
      const pool = fallbackByType[type].length ? fallbackByType[type] : fallback.questions;
      const idx = usedByType[type] % pool.length;
      usedByType[type] += 1;
      const fallbackQ = { ...pool[idx], type } as EvaluacionEscritaQuestion;
      const indicator = input.indicators[i % Math.max(input.indicators.length, 1)] || fallbackQ.indicator;
      return toEnginQuestion(aiQ, fallbackQ, input.topic, indicator, i + 1);
    });

  return {
    title: ai.title && ai.title.trim().length > 5 ? ai.title : fallback.title,
    instructions: ai.instructions && ai.instructions.trim().length > 10 ? ai.instructions : fallback.instructions,
    questions,
    totalPoints: questions.reduce((sum, q) => sum + q.score, 0),
    usedFallback: false,
  };
}

// ─── Punto de entrada único ───

export async function generateEvaluacionEscrita(
  env: AIEngineEnv,
  input: EvaluacionEscritaEngineInput,
): Promise<EvaluacionEscritaResult> {
  const fallback = buildFallback(input);

  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(input.level, input.tipo),
      buildUserPrompt(input),
      EvaluacionEscritaAISchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', maxTokens: 4000 },
    );
    return enrich(data, fallback, input);
  } catch (error) {
    console.error('[EvaluacionEscritaEngine] generateEvaluacionEscrita error:', error);
    return fallback;
  }
}
