import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { inferRangoEtario } from './pedagogicalUtils';
import {
  ListaCotejoAISchema,
  type ListaCotejoAI,
} from '../_lib/ai/schemas/listaCotejoSchema';

// ListaCotejoCriterion duplicado localmente por el mismo límite documentado
// en GuiaEngine.ts / TicketSalidaEngine.ts: functions/ no importa de src/.
// El consumidor final (FormativeEvaluationPreview.tsx / exportEvaluationWord.ts
// / normalizeChecklist) solo lee .number/.description, así que esta forma es
// compatible sin normalizer.
export interface ListaCotejoCriterion {
  number: number;
  description: string;
}

export interface ListaCotejoEngineInput {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  topic: string;
  indicators: string[];
}

export interface ListaCotejoResult {
  title: string;
  objective: string;
  instructions: string;
  criteria: ListaCotejoCriterion[];
  teacherNotes: string;
}

function composeCriteria(descriptions: string[]): ListaCotejoCriterion[] {
  return descriptions.map((description, i) => ({ number: i + 1, description }));
}

// ─── Capa 2: fallback determinista ───
// Reemplaza a buildChecklist (evaluation/formative/index.ts) pero ya
// reshapeado a ListaCotejoResult, para que el caller nunca tenga que
// distinguir "vino de la IA" vs "vino del fallback".

function buildFallback(input: ListaCotejoEngineInput): ListaCotejoResult {
  const tema = input.topic || input.objectiveText;
  return {
    title: `Lista de Cotejo / Autoevaluación: ${input.objectiveCode}`,
    objective: input.objectiveText,
    instructions: 'Marca cada criterio según tu desempeño: Sí / No / En proceso',
    criteria: composeCriteria([
      `Comprendo el concepto principal de ${tema}.`,
      `Puedo explicar ${tema} con mis propias palabras.`,
      `Identifiqué un ejemplo de ${tema} en la vida real.`,
      `Resolví correctamente una actividad relacionada con ${tema}.`,
      `Puedo explicarle a un compañero lo que aprendí sobre ${tema}.`,
    ]),
    teacherNotes: 'Entregar a estudiantes para autoevaluación. Revisar los que marquen "En proceso" o "No".',
  };
}

// ─── Prompt ───

function buildSystemPrompt(level: string): string {
  const rangoEtario = inferRangoEtario(level);

  return `Eres un profesor o profesora chilena que diseña la lista de cotejo de autoevaluación de su propia clase: cada criterio es un logro concreto que el estudiante marca como Sí / En proceso / No, para verificar si logró el objetivo de la clase de hoy.

ADAPTACIÓN POR EDAD (usa exactamente este rango, no otro):
${rangoEtario}

REGLAS OBLIGATORIAS:
1. Cada criterio debe describir un logro observable y concreto ligado directamente al OA/tema de la clase de hoy — NUNCA un criterio genérico como "participa en clase", "presta atención" o "se esfuerza", que no depende del contenido de la clase.
2. Cada criterio debe estar redactado en primera persona del estudiante ("Comprendo...", "Puedo explicar...", "Identifiqué...", "Resolví...") — nunca en segunda ni tercera persona.
3. NUNCA inventes indicadores oficiales ni copies el texto curricular del OA de forma literal — redacta en lenguaje que un estudiante del curso indicado pueda entender, según el rango etario.
4. Genera entre 5 y 8 criterios con progresión de comprensión a aplicación: empieza verificando el concepto central y termina con criterios de aplicación o transferencia (dar un ejemplo, resolver un ejercicio, explicarle a otro).
5. El título debe nombrar el tema real de la clase, no puede ser genérico.
6. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones antes o después del JSON.

ESTRUCTURA JSON OBLIGATORIA:
{
  "title": "Título ligado al tema real de la clase",
  "criteria": [
    { "description": "Criterio concreto 1, en primera persona, ligado al tema" },
    { "description": "Criterio concreto 2" },
    { "description": "Criterio concreto 3, de aplicación o transferencia" }
  ]
}

El array "criteria" debe tener entre 5 y 8 elementos.`;
}

function buildUserPrompt(input: ListaCotejoEngineInput): string {
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

function enrich(ai: ListaCotejoAI, fallback: ListaCotejoResult): ListaCotejoResult {
  const criteria = ai.criteria?.length >= 5 && ai.criteria.length <= 8
    ? composeCriteria(ai.criteria.map((c) => c.description))
    : fallback.criteria;

  return {
    title: ai.title || fallback.title,
    objective: fallback.objective,
    instructions: fallback.instructions,
    criteria,
    teacherNotes: fallback.teacherNotes,
  };
}

// ─── Punto de entrada único ───
// Mismo patrón que generateGuia / generateTicketSalida / generateFormato321:
// fallback determinista primero, intento IA con el modelo 70B, enrich si
// tiene éxito, catch → fallback completo.

export async function generateListaCotejo(
  env: AIEngineEnv,
  input: ListaCotejoEngineInput,
): Promise<ListaCotejoResult> {
  const fallback = buildFallback(input);

  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(input.level),
      buildUserPrompt(input),
      ListaCotejoAISchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' },
    );
    return enrich(data, fallback);
  } catch (error) {
    console.error('[ListaCotejoEngine] generateListaCotejo error:', error);
    return fallback;
  }
}
