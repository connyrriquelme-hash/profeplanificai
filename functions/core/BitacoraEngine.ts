import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { inferRangoEtario } from './pedagogicalUtils';
import {
  BitacoraAISchema,
  type BitacoraAI,
} from '../_lib/ai/schemas/bitacoraSchema';

export interface BitacoraEngineInput {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  topic: string;
  indicators: string[];
}

export interface BitacoraResult {
  hipotesis: string;
  observaciones: string;
  resultados: string;
  conclusion: string;
}

// ─── Capa 2: fallback determinista ───

function buildFallback(input: BitacoraEngineInput): BitacoraResult {
  const tema = input.topic || input.objectiveText;
  return {
    hipotesis: `Antes de empezar, escribe qué crees que va a pasar con ${tema} y por qué lo piensas.`,
    observaciones: `Durante la actividad, registra lo que observas sobre ${tema}: qué ves, qué cambia, qué mides.`,
    resultados: `Organiza lo que observaste sobre ${tema} en una tabla, dibujo o lista de datos.`,
    conclusion: `Responde: ¿qué aprendiste sobre ${tema}? ¿Se cumplió tu hipótesis? ¿Por qué?`,
  };
}

// ─── Prompt ───

function buildSystemPrompt(level: string): string {
  const rangoEtario = inferRangoEtario(level);

  return `Eres un profesor o profesora chilena que diseña las consignas de la bitácora científica de su propia clase: las instrucciones que guían a cada estudiante a registrar SU PROPIO proceso de indagación científica sobre el experimento o actividad de hoy.

ADAPTACIÓN POR EDAD (usa exactamente este rango, no otro):
${rangoEtario}

REGLAS OBLIGATORIAS:
1. Cada consigna es una INSTRUCCIÓN o PREGUNTA que el estudiante lee antes de escribir su propio registro — NUNCA generes tú la hipótesis, observación, resultado o conclusión del estudiante. Nunca inventes datos de un experimento que no ocurrió.
2. Cada consigna debe estar ligada directamente al tema y al objetivo del experimento de la clase de hoy — nunca genérica como "escribe tu hipótesis" sin mencionar el tema.
3. NUNCA inventes indicadores oficiales ni copies el texto curricular del OA de forma literal — redacta en lenguaje que un estudiante del curso indicado pueda entender, según el rango etario.
4. "hipotesis" invita a predecir y justificar antes de la actividad; "observaciones" invita a registrar qué ve/mide/cambia durante la actividad; "resultados" invita a organizar lo observado (tabla, dibujo, lista, medición); "conclusion" invita a responder si se cumplió la hipótesis y qué aprendió, con evidencia.
5. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones antes o después del JSON.

ESTRUCTURA JSON OBLIGATORIA:
{
  "hipotesis": "Consigna específica al tema para formular la hipótesis",
  "observaciones": "Consigna específica al tema para registrar observaciones durante la actividad",
  "resultados": "Consigna específica al tema para organizar y registrar los resultados",
  "conclusion": "Consigna específica al tema para redactar la conclusión, con evidencia"
}`;
}

function buildUserPrompt(input: BitacoraEngineInput): string {
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

function enrich(ai: BitacoraAI, fallback: BitacoraResult): BitacoraResult {
  return {
    hipotesis: ai.hipotesis || fallback.hipotesis,
    observaciones: ai.observaciones || fallback.observaciones,
    resultados: ai.resultados || fallback.resultados,
    conclusion: ai.conclusion || fallback.conclusion,
  };
}

// ─── Punto de entrada único ───
// Mismo patrón que generateGuia / generateTicketSalida / generateFormato321
// / generateListaCotejo / generateSemaforo: fallback determinista primero,
// intento IA con el modelo 70B, enrich si tiene éxito, catch → fallback
// completo.

export async function generateBitacora(
  env: AIEngineEnv,
  input: BitacoraEngineInput,
): Promise<BitacoraResult> {
  const fallback = buildFallback(input);

  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(input.level),
      buildUserPrompt(input),
      BitacoraAISchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' },
    );
    return enrich(data, fallback);
  } catch (error) {
    console.error('[BitacoraEngine] generateBitacora error:', error);
    return fallback;
  }
}
