import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { inferRangoEtario, isGenericOrWeak } from './pedagogicalUtils';
import {
  Format321AISchema,
  type Format321AI,
} from '../_lib/ai/schemas/format321Schema';
import { getExpertContext, getExpertEvaluationContext } from './ExpertKnowledge';

// Format321Section duplicado localmente por el mismo límite documentado en
// GuiaEngine.ts / TicketSalidaEngine.ts: functions/ no importa de src/. El
// consumidor final (FormativeEvaluationPreview.tsx / exportEvaluationWord.ts)
// solo lee .number/.title/.description/.lines, así que esta forma es
// compatible sin normalizer.
export interface Format321Section {
  number: 3 | 2 | 1;
  title: string;
  description: string;
  lines: number;
}

export interface Format321EngineInput {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  topic: string;
  indicators: string[];
}

export interface Format321Result {
  title: string;
  objective: string;
  instructions: string;
  sections: Format321Section[];
  teacherNotes: string;
}

// Los títulos y el conteo de líneas son estructura fija del formato 3-2-1
// (no dependen del tema) — solo la consigna ("description") de cada bloque
// viene de la IA o del fallback.
function composeSections(learned: string, interesting: string, question: string): Format321Section[] {
  return [
    { number: 3, title: '3 cosas que aprendí', description: learned, lines: 3 },
    { number: 2, title: '2 cosas que me interesan / quiero saber más', description: interesting, lines: 2 },
    { number: 1, title: '1 duda o pregunta', description: question, lines: 1 },
  ];
}

// ─── Capa 2: fallback determinista ───
// Reemplaza a build321Format (evaluation/formative/index.ts) pero ya
// reshapeado a Format321Result, para que el caller nunca tenga que
// distinguir "vino de la IA" vs "vino del fallback".

function buildFallback(input: Format321EngineInput): Format321Result {
  const tema = input.topic || input.objectiveText;
  return {
    title: `Formato 3-2-1: ${input.objectiveCode}`,
    objective: input.objectiveText,
    instructions: 'Completa cada sección con tus propias palabras.',
    sections: composeSections(
      `Escribe tres cosas que aprendiste hoy sobre ${tema}.`,
      `Escribe dos cosas sobre ${tema} que te parecieron interesantes o que te gustaría profundizar.`,
      `Escribe una pregunta que todavía tengas sobre ${tema}.`,
    ),
    teacherNotes: 'Recolectar al final de la clase. Usar para planificar la siguiente sesión y responder dudas.',
  };
}

// ─── Prompt ───

function buildSystemPrompt(level: string): string {
  const rangoEtario = inferRangoEtario(level);

  return `Eres un EXPERTO en metacognición, pedagogía, psicología cognitiva, neurociencias del aprendizaje y currículo chileno MINEDUC que diseña el cierre "Formato 3-2-1" de su propia clase: una rutina de metacognición donde cada estudiante escribe 3 cosas que aprendió, 2 cosas que le parecieron interesantes y 1 pregunta que todavía tiene — sobre el tema específico de la clase de hoy, no en abstracto.
${getExpertContext()}
${getExpertEvaluationContext()}
ADAPTACIÓN POR EDAD (usa exactamente este rango, no otro):
${rangoEtario}

REGLAS OBLIGATORIAS:
1. Cada uno de los tres textos que generes ("learned", "interesting", "question") es la CONSIGNA que el estudiante va a leer antes de escribir sus propias respuestas en líneas en blanco — NUNCA generes tú las respuestas del estudiante, genera solo la instrucción que dispara la reflexión.
2. Cada consigna debe estar ligada directamente al tema y al objetivo de la clase de hoy — nunca genérica como "escribe tres cosas que aprendiste hoy" sin mencionar el tema.
3. NUNCA inventes indicadores oficiales ni copies el texto curricular del OA de forma literal — redacta en lenguaje que un estudiante del curso indicado pueda entender, según el rango etario.
4. "learned" debe pedir explícitamente 3 aprendizajes ligados al tema; "interesting" debe pedir explícitamente 2 ideas que le llamaron la atención o quiere profundizar, ligadas al tema; "question" debe invitar a escribir 1 sola pregunta abierta sobre lo que aún no le queda claro del tema.
5. El título debe nombrar el tema real de la clase, no puede ser genérico ("Formato 3-2-1" a secas no es aceptable).
6. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones antes o después del JSON.

ESTRUCTURA JSON OBLIGATORIA:
{
  "title": "Título ligado al tema real de la clase",
  "learned": "Consigna específica al tema para las 3 cosas que aprendió",
  "interesting": "Consigna específica al tema para las 2 cosas que le interesaron",
  "question": "Consigna específica al tema invitando a escribir 1 pregunta"
}`;
}

function buildUserPrompt(input: Format321EngineInput): string {
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

// ─── Capa 3: enrich — valida la estructura 3-2-1:
// - "learned" debe tener 3 elementos (array o texto con 3 puntos)
// - "interesting" debe tener 2 elementos
// - "question" debe tener 1 elemento
// - Cada elemento no puede ser genérico ni estar vacío

function parseItems(text: string, expectedCount: number): string[] {
  if (!text) return [];
  const lines = text.split(/\n/).map((l) => l.replace(/^[\s\-\*•\d.]+/, '').trim()).filter(Boolean);
  if (lines.length === expectedCount) return lines;
  if (lines.length > 0) return lines;
  return text.split(',').map((s) => s.trim()).filter(Boolean);
}

function isWeakSection(text: string, minItems: number): boolean {
  if (!text || text.trim().length < 10) return true;
  const items = parseItems(text, minItems);
  if (items.length < minItems) return true;
  if (items.every((item) => isGenericOrWeak(item))) return true;
  return false;
}

function enrich(ai: Format321AI, fallback: Format321Result): Format321Result {
  const learned = isWeakSection(ai.learned, 3) ? fallback.sections[0].description : ai.learned;
  const interesting = isWeakSection(ai.interesting, 2) ? fallback.sections[1].description : ai.interesting;
  const question = isWeakSection(ai.question, 1) ? fallback.sections[2].description : ai.question;

  return {
    title: ai.title && ai.title.trim().length > 5 ? ai.title : fallback.title,
    objective: fallback.objective,
    instructions: fallback.instructions,
    sections: composeSections(learned, interesting, question),
    teacherNotes: fallback.teacherNotes,
  };
}

// ─── Punto de entrada único ───
// Mismo patrón que generateGuia / generateTicketSalida: fallback
// determinista primero, intento IA con el modelo 70B, enrich si tiene
// éxito, catch → fallback completo.

export async function generateFormato321(
  env: AIEngineEnv,
  input: Format321EngineInput,
): Promise<Format321Result> {
  const fallback = buildFallback(input);

  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(input.level),
      buildUserPrompt(input),
      Format321AISchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' },
    );
    return enrich(data, fallback);
  } catch (error) {
    console.error('[Format321Engine] generateFormato321 error:', error);
    return fallback;
  }
}
