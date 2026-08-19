import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { inferRangoEtario, isGenericOrWeak, mentionsTopic } from './pedagogicalUtils';
import { getExpertContext, getExpertEvaluationContext } from './ExpertKnowledge';
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

  return `Eres un EXPERTO en psicologia cognitiva, neurociencias del aprendizaje y curriculo chileno MINEDUC. Disenas tickets de salida que implementan RETRIEVAL PRACTICE (pratica de recuperacion activa), una de las estrategias mas efectivas segun la ciencia del aprendizaje (Roediger & Butler, 2011).
${getExpertContext()}
${getExpertEvaluationContext()}

REGLAS DE VARIEDAD PARA TICKET DE SALIDA:
1. DIVERSIDAD DE PREGUNTAS: en cada ticket incluye al menos 3 tipos distintos de los siguientes:
   - Recordar: "Nombrа 2 cosas que aprendiste hoy"
   - Comprender: "Explica con tus palabras el concepto de..."
   - Aplicar: "En tu vida real, cuando usarias esto?"
   - Analizar: "Que tiene en comun X e Y?"
   - Evaluar: "Que parte fue la mas importante? Por que?"
   - Crear: "Si tuvieras que ensenar esto a alguien, como lo harias?"

2. FORMATOS VARIDOS: alterna entre:
   - Respuesta escrita breve (1-2 oraciones)
   - Completar oracion: "Hoy aprendi que..."
   - Dibujar: "Dibuja el concepto clave"
   - Verdadero/Falso con justificacion
   - Opcion multiple con reflexion

3. ADAPTACIONES: al final del ticket incluye una nota:
   "Si necesitas apoyo: puedes responderoralmente al docente, dibujar tu respuesta,
   o usar material de apoyo. No hay respuesta incorrecta en la reflexion."

4. METACOGNICION: incluye siempre:
   - "Como te sentiste aprendiendo esto?" (con iconos de caritas)
   - "Que necesitas para aprender mejor?"

ADAPTACION POR EDAD (usa exactamente este rango, no otro):
${rangoEtario}

REGLAS OBLIGATORIAS:
1. Cada pregunta debe evaluar directamente si el estudiante logro el objetivo de la clase — nunca preguntes algo generico sin ligarlo al contenido especifico.
2. Cada pregunta debe ser CONCRETA y ACCIONABLE: algo puntual que el estudiante puede responder en 1-2 frases (explicar, dar un ejemplo, aplicar, comparar, identificar, resolver).
3. NUNCA inventes indicadores oficiales ni copies el texto curricular del OA de forma literal — redactalas en lenguaje que un estudiante del curso indicado pueda entender.
4. Genera entre 3 y 5 preguntas con PROGRESION DE BLOOM: empieza verificando Recordar/Comprender y termina pidiendo Aplicar/Analizar.
5. El titulo debe nombrar el tema real de la clase.
6. No agregues preguntas de autoevaluacion tipo semaforo ni de "como te sentiste".
7. Responde UNICAMENTE con JSON valido, sin markdown, sin explicaciones antes o despues del JSON.

ESTRUCTURA JSON OBLIGATORIA:
{
  "title": "Titulo ligado al tema real de la clase (no generico)",
  "questions": [
    { "question": "Pregunta concreta 1: nivel Recordar/Comprender, verifica el concepto central" },
    { "question": "Pregunta concreta 2: nivel Comprender" },
    { "question": "Pregunta concreta 3: nivel Aplicar, pide ejemplo concreto de la clase" }
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

// ─── Capa 3: enrich — valida que las preguntas no sean genéricas,
// tengan largo mínimo, mencionen el tema y que la última sea de
// aplicación/transferencia (más larga que las anteriores).

const MIN_QUESTION_LEN = 20;

function isWeakQuestion(q: string, topic: string): boolean {
  if (!q || q.trim().length < MIN_QUESTION_LEN) return true;
  if (isGenericOrWeak(q)) return true;
  if (topic && !mentionsTopic(q, topic)) return true;
  return false;
}

function enrich(ai: TicketSalidaAI, fallback: TicketSalidaResult, topic: string): TicketSalidaResult {
  const validQuestions = (ai.questions && ai.questions.length >= 3 && ai.questions.length <= 5)
    ? composeQuestions(ai.questions.map((q) => q.question).map((q, i, arr) => {
        if (isWeakQuestion(q, topic)) return fallback.questions[i]?.question || q;
        const isLast = i === arr.length - 1;
        if (isLast && q.trim().length < 40) return `${q} ¿Cómo podrías aplicar esto en tu vida cotidiana o en otra asignatura?`;
        return q;
      }))
    : fallback.questions;

  return {
    title: ai.title && ai.title.trim().length > 5 ? ai.title : fallback.title,
    objective: fallback.objective,
    instructions: fallback.instructions,
    questions: validQuestions,
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
    return enrich(data, fallback, input.topic);
  } catch (error) {
    console.error('[TicketSalidaEngine] generateTicketSalida error:', error);
    return fallback;
  }
}
