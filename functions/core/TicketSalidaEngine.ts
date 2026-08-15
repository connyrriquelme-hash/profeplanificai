import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { inferRangoEtario } from './pedagogicalUtils';
import {
  TicketSalidaAISchema,
  type TicketSalidaAI,
} from '../_lib/ai/schemas/ticketSalidaSchema';

// TicketSalidaQuestion duplicado localmente (no TicketContent de
// src/components/products/types.ts) por el mismo límite documentado en
// GuiaEngine.ts: functions/ no importa de src/ en ningún otro lugar del
// repo. El consumidor final (TicketRenderer.tsx / FormativeEvaluationPreview
// / exportEvaluationWord.ts) solo lee .question (y .type/.options para la
// pregunta de autoevaluación), así que esta forma es compatible sin normalizer.
export interface TicketSalidaQuestion {
  number: number;
  question: string;
  type: 'open' | 'traffic_light';
  options?: string[];
}

export interface TicketSalidaEngineInput {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  topic: string;
  indicators: string[];
}

export interface TicketSalidaResult {
  title: string;
  objective: string;
  instructions: string;
  questions: TicketSalidaQuestion[];
  teacherNotes: string;
}

// La pregunta de autoevaluación (semáforo) es un mecanismo de UI fijo, igual
// en todo ticket — no depende del tema de la clase, así que no se le pide a
// la IA que la genere (evita que la "reinvente" con opciones inconsistentes
// que TicketRenderer/exportEvaluationWord no sepan interpretar).
const SELF_ASSESSMENT_QUESTION: Omit<TicketSalidaQuestion, 'number'> = {
  question: '¿Cómo te sientes con lo aprendido hoy?',
  type: 'traffic_light',
  options: ['🟢 Lo entendí bien', '🟡 Algunas dudas', '🔴 No lo entendí'],
};

function composeQuestions(openQuestions: string[]): TicketSalidaQuestion[] {
  const open: TicketSalidaQuestion[] = openQuestions.map((question, i) => ({
    number: i + 1,
    question,
    type: 'open',
  }));
  return [...open, { ...SELF_ASSESSMENT_QUESTION, number: open.length + 1 }];
}

// ─── Capa 2: fallback determinista ───
// Reemplaza a buildExitTicket (evaluation/formative/index.ts) pero ya
// reshapeado a TicketSalidaResult, para que el caller nunca tenga que
// distinguir "vino de la IA" vs "vino del fallback".

function buildFallback(input: TicketSalidaEngineInput): TicketSalidaResult {
  const tema = input.topic || input.objectiveText;
  return {
    title: `Ticket de Salida: ${input.objectiveCode}`,
    objective: input.objectiveText,
    instructions: 'Completa antes de salir de clase. Responde con honestidad.',
    questions: composeQuestions([
      `¿Cuál fue lo más importante que aprendiste hoy sobre ${tema}?`,
      `Da un ejemplo de ${tema} que hayas visto o trabajado en la actividad de hoy.`,
      '¿Qué duda te quedó sin resolver?',
    ]),
    teacherNotes: 'Recolectar al final de la clase. Revisar respuestas para ajustar la siguiente sesión.',
  };
}

// ─── Prompt ───

function buildSystemPrompt(level: string): string {
  const rangoEtario = inferRangoEtario(level);

  return `Eres un profesor o profesora chilena que diseña el ticket de salida de su propia clase: la evaluación breve que cada estudiante responde antes de irse, para verificar si logró el objetivo de la clase de hoy.

ADAPTACIÓN POR EDAD (usa exactamente este rango, no otro):
${rangoEtario}

REGLAS OBLIGATORIAS:
1. Cada pregunta debe evaluar directamente si el estudiante logró el objetivo de la clase (el OA/tema entregado en el contexto) — nunca preguntes algo genérico como "¿qué aprendiste hoy?" sin ligarlo al contenido específico de la clase.
2. Cada pregunta debe ser concreta y accionable: algo puntual que el estudiante puede responder en 1-2 frases (explicar, dar un ejemplo, aplicar, comparar, identificar, resolver) — nunca una pregunta abstracta o de reflexión vaga.
3. NUNCA inventes indicadores oficiales ni copies el texto curricular del OA de forma literal en las preguntas — redáctalas en lenguaje que un estudiante del curso indicado pueda entender, respetando el rango etario.
4. Genera entre 3 y 5 preguntas con progresión de comprensión a aplicación: empieza verificando el concepto central y termina pidiendo aplicarlo o ejemplificarlo con algo específico de la clase de hoy.
5. El título debe nombrar el tema real de la clase, no puede ser genérico ("Ticket de Salida" a secas no es aceptable).
6. No agregues preguntas de autoevaluación tipo semáforo ni de "cómo te sentiste" — esas las agrega el sistema por separado.
7. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones antes o después del JSON.

ESTRUCTURA JSON OBLIGATORIA:
{
  "title": "Título ligado al tema real de la clase (no genérico)",
  "questions": [
    { "question": "Pregunta concreta 1, ligada al objetivo, verifica el concepto central" },
    { "question": "Pregunta concreta 2" },
    { "question": "Pregunta concreta 3, de aplicación o ejemplo específico de la clase de hoy" }
  ]
}

El array "questions" debe tener entre 3 y 5 preguntas.`;
}

function buildUserPrompt(input: TicketSalidaEngineInput): string {
  return JSON.stringify(
    {
      nivel: input.level,
      asignatura: input.subject,
      oa: input.objectiveCode,
      objetivo: input.objectiveText,
      indicadores: input.indicators,
      tema: input.topic,
    },
    null,
    2,
  );
}

// ─── Capa 3: enrich — si la IA devolvió algo débil, se completa con el fallback ───

function enrich(ai: TicketSalidaAI, fallback: TicketSalidaResult): TicketSalidaResult {
  const aiQuestions = ai.questions?.length >= 3 && ai.questions.length <= 5
    ? composeQuestions(ai.questions.map((q) => q.question))
    : fallback.questions;

  return {
    title: ai.title || fallback.title,
    objective: fallback.objective,
    instructions: fallback.instructions,
    questions: aiQuestions,
    teacherNotes: fallback.teacherNotes,
  };
}

// ─── Punto de entrada único ───
// Mismo patrón que generateGuia (GuiaEngine.ts): fallback determinista
// primero, intento IA con el modelo 70B, enrich si tiene éxito, catch →
// fallback completo.

export async function generateTicketSalida(
  env: AIEngineEnv,
  input: TicketSalidaEngineInput,
): Promise<TicketSalidaResult> {
  const fallback = buildFallback(input);

  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(input.level),
      buildUserPrompt(input),
      TicketSalidaAISchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' },
    );
    return enrich(data, fallback);
  } catch (error) {
    console.error('[TicketSalidaEngine] generateTicketSalida error:', error);
    return fallback;
  }
}
