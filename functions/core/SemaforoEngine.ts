import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { inferRangoEtario, isGenericOrWeak } from './pedagogicalUtils';
import {
  SemaforoAISchema,
  type SemaforoAI,
} from '../_lib/ai/schemas/semaforoSchema';

// SemaforoAspect / SemaforoColor duplicados localmente por el mismo límite
// documentado en GuiaEngine.ts / TicketSalidaEngine.ts: functions/ no
// importa de src/. El consumidor final (FormativeEvaluationPreview.tsx /
// exportEvaluationWord.ts) solo lee aspects[].number/.description/.indicator
// y colors[].color/.meaning/.action, así que esta forma es compatible sin
// normalizer.
export interface SemaforoAspect {
  number: number;
  description: string;
  indicator: string;
}

export interface SemaforoColor {
  color: string;
  meaning: string;
  action: string;
}

export interface SemaforoEngineInput {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  topic: string;
  indicators: string[];
}

export interface SemaforoResult {
  title: string;
  objective: string;
  instructions: string;
  aspects: SemaforoAspect[];
  colors: SemaforoColor[];
  teacherNotes: string;
}

// El selector 🟢🟡🔴 (ícono + significado + acción) es UI fija, compartida
// por todos los aspectos — el renderer no soporta un colors[] distinto por
// aspecto, así que no depende del tema y no requiere IA.
const FIXED_COLORS: SemaforoColor[] = [
  { color: '🟢 Verde', meaning: 'Lo entiendo bien, puedo explicarlo', action: 'Ayudar a otros' },
  { color: '🟡 Amarillo', meaning: 'Tengo algunas dudas, necesito repasar', action: 'Preguntar al docente o compañero' },
  { color: '🔴 Rojo', meaning: 'No lo entiendo, necesito ayuda urgente', action: 'Solicitar apoyo docente' },
];

function composeAspects(items: Array<{ description: string; levels: string }>): SemaforoAspect[] {
  return items.map((item, i) => ({ number: i + 1, description: item.description, indicator: item.levels }));
}

// ─── Capa 2: fallback determinista ───
// Reemplaza a buildTrafficLight (evaluation/formative/index.ts) pero ya
// reshapeado a SemaforoResult, para que el caller nunca tenga que
// distinguir "vino de la IA" vs "vino del fallback".

function buildFallback(input: SemaforoEngineInput): SemaforoResult {
  const tema = input.topic || input.objectiveText;
  return {
    title: `Semáforo de Comprensión: ${input.objectiveCode}`,
    objective: input.objectiveText,
    instructions: 'Marca el color que representa tu nivel de comprensión para cada aspecto.',
    aspects: composeAspects([
      {
        description: `Entiendo el concepto principal de ${tema}`,
        levels: '🔴 No logro reconocer el concepto — 🟡 Lo reconozco con apoyo — 🟢 Lo reconozco y explico sin apoyo',
      },
      {
        description: `Puedo explicar ${tema} con mis propias palabras`,
        levels: '🔴 No puedo explicarlo — 🟡 Explico con ayuda de imágenes o ejemplos — 🟢 Explico con mis propias palabras sin ayuda',
      },
      {
        description: `Puedo resolver ejercicios relacionados con ${tema}`,
        levels: '🔴 No logro resolverlos — 🟡 Los resuelvo con apoyo — 🟢 Los resuelvo solo/a correctamente',
      },
      {
        description: 'Puedo explicárselo a un compañero',
        levels: '🔴 No me siento capaz de explicarlo — 🟡 Puedo explicar parte de lo aprendido — 🟢 Puedo explicarlo completo a un compañero',
      },
    ]),
    colors: FIXED_COLORS,
    teacherNotes: 'Recolectar semáforos al final. Agrupar estudiantes por color para apoyos diferenciados.',
  };
}

// ─── Prompt ───

function buildSystemPrompt(level: string): string {
  const rangoEtario = inferRangoEtario(level);

  return `Eres un profesor o profesora chilena que diseña el semáforo de comprensión de su propia clase: cada indicador es un logro concreto del objetivo de hoy, y para cada uno el estudiante marca 🟢 (lo entiendo bien), 🟡 (dudas) o 🔴 (no lo entiendo).

ADAPTACIÓN POR EDAD (usa exactamente este rango, no otro):
${rangoEtario}

REGLAS OBLIGATORIAS:
1. Cada indicador ("description") debe ser un logro observable y concreto ligado directamente al OA/tema de la clase de hoy — NUNCA genérico como "participa en clase" o "presta atención".
2. Para cada indicador, "levels" describe los 3 niveles (🔴/🟡/🟢) de forma concreta y observable, específica a ESE indicador — nunca una descripción abstracta como "comprende poco / algo / mucho". Describe qué hace o dice el estudiante en cada nivel. Formato: "🔴 [descripción concreta] — 🟡 [descripción concreta] — 🟢 [descripción concreta]", en una sola línea.
3. NUNCA inventes indicadores oficiales ni copies el texto curricular del OA de forma literal — redacta en lenguaje que un estudiante del curso indicado pueda entender, según el rango etario.
4. Genera entre 3 y 5 indicadores, con progresión de comprensión a aplicación (empieza verificando el concepto central, termina con aplicación o transferencia).
5. El título debe nombrar el tema real de la clase, no puede ser genérico.
6. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones antes o después del JSON.

ESTRUCTURA JSON OBLIGATORIA:
{
  "title": "Título ligado al tema real de la clase",
  "aspects": [
    { "description": "Indicador concreto 1, ligado al tema", "levels": "🔴 ... — 🟡 ... — 🟢 ..." },
    { "description": "Indicador concreto 2", "levels": "🔴 ... — 🟡 ... — 🟢 ..." },
    { "description": "Indicador concreto 3, de aplicación o transferencia", "levels": "🔴 ... — 🟡 ... — 🟢 ..." }
  ]
}

El array "aspects" debe tener entre 3 y 5 elementos.`;
}

function buildUserPrompt(input: SemaforoEngineInput): string {
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

// ─── Capa 3: enrich — valida que cada aspecto tenga los 3 niveles
// 🔴🟡🟢, descripción suficientemente larga y no sea genérica.

function isValidAspect(aspect: { description: string; indicator: string }): boolean {
  if (!aspect.description || !aspect.indicator) return false;
  if (aspect.description.trim().length < 20) return false;
  if (isGenericOrWeak(aspect.description)) return false;
  if (!aspect.indicator.includes('🔴') || !aspect.indicator.includes('🟡') || !aspect.indicator.includes('🟢')) return false;
  if (aspect.indicator.trim().length < 30) return false;
  return true;
}

function enrich(ai: SemaforoAI, fallback: SemaforoResult): SemaforoResult {
  const aspects = ai.aspects?.length >= 3 && ai.aspects.length <= 5
    ? composeAspects(ai.aspects.map((a) => ({ description: a.description, levels: a.levels })))
    : fallback.aspects;

  const validAspects = aspects.filter(isValidAspect);

  return {
    title: ai.title && ai.title.trim().length > 10 ? ai.title : fallback.title,
    objective: fallback.objective,
    instructions: fallback.instructions,
    aspects: validAspects.length >= 3 ? validAspects : fallback.aspects,
    colors: fallback.colors,
    teacherNotes: fallback.teacherNotes,
  };
}

// ─── Punto de entrada único ───
// Mismo patrón que generateGuia / generateTicketSalida / generateFormato321
// / generateListaCotejo: fallback determinista primero, intento IA con el
// modelo 70B, enrich si tiene éxito, catch → fallback completo.

export async function generateSemaforo(
  env: AIEngineEnv,
  input: SemaforoEngineInput,
): Promise<SemaforoResult> {
  const fallback = buildFallback(input);

  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(input.level),
      buildUserPrompt(input),
      SemaforoAISchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' },
    );
    return enrich(data, fallback);
  } catch (error) {
    console.error('[SemaforoEngine] generateSemaforo error:', error);
    return fallback;
  }
}
