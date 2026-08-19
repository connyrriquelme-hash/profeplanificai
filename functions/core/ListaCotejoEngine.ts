import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { inferRangoEtario, isGenericOrWeak } from './pedagogicalUtils';
import {
  ListaCotejoAISchema,
  type ListaCotejoAI,
} from '../_lib/ai/schemas/listaCotejoSchema';
import { getExpertContext, getExpertEvaluationContext } from './ExpertKnowledge';

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

  return `Eres un EXPERTO en pedagogía, psicología cognitiva, neurociencias del aprendizaje y currículo chileno MINEDUC que diseña la lista de cotejo de autoevaluación de su propia clase: cada criterio es un logro concreto que el estudiante marca como Sí / En proceso / No, para verificar si logró el objetivo de la clase de hoy.
${getExpertContext()}
${getExpertEvaluationContext()}

REGLAS DE VARIEDAD PARA LISTA DE COTEJO:
1. CRITERIOS VARIDOS: los items deben evaluar diferentes niveles cognitivos:
   - 30% Recordar/Comprender (nombrar, explicar, definir)
   - 40% Aplicar/Analizar (resolver, usar, comparar, identificar)
   - 20% Evaluar (justificar, argumentar, valorar)
   - 10% Crear (disenar, proponer, construir)

2. TIPOS DE EVIDENCIA: los criterios deben pedir evidencias OBSERVABLES y variadas:
   - Producto escrito (respuesta, texto, tabla)
   - Producto visual (dibujo, diagrama, maqueta)
   - Demonstracion oral (explicar, ensenar, presentar)
   - Demonstracion practica (hacer, manipular, resolver)
   - Trabajo colaborativo (participar, escuchar, aportar)

3. NEURODIVERSIDAD: incluye criterios que valoren diferentes formas de demostrar:
   - "Puede explicar el concepto con sus propias palabras" (verbal)
   - "Puede representar el concepto visualmente" (visual)
   - "Puede aplicar el concepto en un problema nuevo" (aplicacion)
   - "Puede identificar errores en un ejemplo" (analisis)

4. ESCALA CLARA: 3 niveles maximo:
   - Logrado (cumple el criterio)
   - En proceso (cumple parcialmente, necesita apoyo)
   - Inicio (no cumple aun, necesita intervencion)

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

// ─── Capa 3: enrich — valida que cada criterio esté en primera persona,
// tenga largo mínimo y no sea genérico. Un criterio débil se reemplaza
// con el del fallback en vez de devolver algo que el docente no pueda
// usar como evidencia observable.

const MIN_CRITERION_LEN = 25;

function isWeakCriterion(c: string): boolean {
  if (!c || c.trim().length < MIN_CRITERION_LEN) return true;
  if (isGenericOrWeak(c)) return true;
  return false;
}

function enrich(ai: ListaCotejoAI, fallback: ListaCotejoResult): ListaCotejoResult {
  const validCriteria = (ai.criteria && ai.criteria.length >= 5 && ai.criteria.length <= 8)
    ? composeCriteria(ai.criteria.map((c) => c.description).map((c) => isWeakCriterion(c) ? fallback.criteria[0]?.description || c : c))
    : fallback.criteria;

  return {
    title: ai.title && ai.title.trim().length > 5 ? ai.title : fallback.title,
    objective: fallback.objective,
    instructions: fallback.instructions,
    criteria: validCriteria,
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
