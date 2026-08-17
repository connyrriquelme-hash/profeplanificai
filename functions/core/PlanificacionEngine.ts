import { PlanificacionSchema, type Planificacion, type PlanificacionClase } from '../../schemas/PlanificacionSchema';
import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';

export interface PlanificacionOptions {
  level: string;
  subject: string;
  objectiveText: string;
  topic?: string;
  methodology?: string;
  indicators?: string[];
}

export interface PlanificacionResult {
  planificacion: Planificacion;
  usedFallback: boolean;
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1).trimEnd();
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}

// CAMINO DE EMERGENCIA: se usa solo cuando la IA no responde, responde JSON
// inválido o no cumple PlanificacionSchema. No es una planificación diseñada
// pedagógicamente — es una estructura mínima siempre válida (nunca vacía)
// para que el flujo no se rompa. El resultado esperado normal es el generado
// por la IA a partir del prompt de buildMaterialPrompt (generate.ts).
export function buildFallbackPlanificacion(opciones: PlanificacionOptions): Planificacion {
  const tema = opciones.topic || opciones.objectiveText || opciones.subject;
  const metodologia = opciones.methodology || 'Metodología activa';
  const indicadores = (opciones.indicators || []).slice(0, 3);

  const classes = [
    {
      number: 1,
      objective: truncate(`Activar conocimientos previos sobre ${tema} y presentar el objetivo de la clase.`, 400),
      opening: `Presentación del tema "${truncate(tema, 150)}" y activación de conocimientos previos mediante preguntas guía.`,
      development: `Exploración inicial de ${truncate(tema, 150)} con apoyo del docente, aplicando ${metodologia}.`,
      closure: 'Síntesis breve de lo observado y anticipación de la siguiente clase.',
      duration: '45 min',
      materials: ['Pizarra o proyector', 'Material de la asignatura', 'Cuaderno del estudiante'],
      assessment: 'Observación directa de la participación y comprensión inicial.',
    },
    {
      number: 2,
      objective: truncate(`Profundizar en ${tema} mediante actividades guiadas alineadas al objetivo de aprendizaje.`, 400),
      opening: 'Recapitulación breve de la clase anterior.',
      development: `Desarrollo de actividades prácticas sobre ${truncate(tema, 150)}, aplicando ${metodologia} en grupos o de forma individual.`,
      closure: 'Puesta en común de resultados y retroalimentación docente.',
      duration: '45 min',
      materials: ['Guía de trabajo', 'Material concreto o digital'],
      assessment: indicadores.length
        ? truncate(`Verificación de: ${indicadores.join('; ')}`, 500)
        : 'Revisión de evidencias de trabajo elaboradas durante la clase.',
    },
    {
      number: 3,
      objective: truncate(`Aplicar y consolidar lo aprendido sobre ${tema} en una tarea final.`, 400),
      opening: 'Repaso de los aprendizajes clave de las clases anteriores.',
      development: `Aplicación integrada de ${truncate(tema, 150)} en una tarea o producto final, con retroalimentación formativa.`,
      closure: 'Cierre metacognitivo: reflexión sobre lo aprendido y su utilidad.',
      duration: '45 min',
      materials: ['Material de evaluación', 'Rúbrica o pauta de cotejo'],
      assessment: 'Evaluación formativa del producto final elaborado por los estudiantes.',
    },
  ];

  return {
    unit: truncate(`Planificación: ${tema} — ${opciones.subject}`, 200),
    classes,
    methodology: truncate(metodologia, 200),
    dua: [
      'Ofrecer múltiples formas de representar la información (visual, oral, escrita).',
      'Permitir distintas formas de expresión del aprendizaje (oral, escrita, gráfica).',
      'Vincular las actividades con intereses y contexto real de los estudiantes.',
    ],
    evaluation: 'Evaluación formativa a lo largo de las clases y evaluación sumativa al cierre de la unidad.',
  };
}

// ─── System prompt — reglas de calidad, mismo nivel de exigencia que
// GuiaEngine.ts (buildSystemPromptEstudiante/Docente). El "prompt" que
// recibe generatePlanificacion (armado en buildMaterialPrompt,
// functions/api/materials/generate.ts) sigue siendo el userPrompt: trae el
// contexto real (OA, indicadores, tema, metodología) y el shape JSON
// exacto. Este system prompt solo agrega las reglas de calidad por campo,
// separado del contexto — mismo split que ya usa GuiaEngine entre
// buildSystemPromptEstudiante() (reglas) y buildUserPrompt() (contexto).
function buildSystemPromptPlanificacion(): string {
  return `Eres un profesor o profesora chilena con experiencia real en aula, diseñando una planificación clase a clase para un colega docente. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones antes o después del JSON, siguiendo exactamente la estructura que se te pide en el mensaje del usuario.

REGLAS OBLIGATORIAS POR CAMPO:
1. INICIO: El campo "opening" de cada clase debe describir UNA estrategia concreta de activación de conocimientos previos específica al tema — escribe exactamente qué pregunta hacer, qué mostrar o qué situación plantear. NUNCA uses solo un título ("Introducción al tema") sin describirla.
2. DESARROLLO: El campo "development" debe describir la secuencia de actividades con al menos 3 pasos concretos y ordenados que el profesor puede ejecutar. Incluye la progresión modelado explícito → práctica guiada → práctica independiente aplicada al contenido específico.
3. CIERRE: El campo "closure" debe incluir la pregunta exacta o instrucción concreta del ticket de salida o síntesis — no solo "discusión sobre X". El cierre debe referenciar algo producido o trabajado en el desarrollo de esa misma clase.
4. PROGRESIÓN: Las clases deben tener una progresión real de dificultad y habilidad: Clase 1 introduce y modela, Clase 2 practica con apoyo, Clase 3 aplica con más autonomía, y así sucesivamente. Los objetivos de cada clase deben ser distintos y progresivos — nunca repitas el mismo objetivo en dos clases.
5. MATERIALES: Los materiales deben ser específicos y nombrados, no genéricos. No uses "[tipo] sobre X" — di exactamente qué tipo de texto, imagen o recurso (ej: "texto informativo de 150 palabras sobre el ciclo de vida del caracol", no "textos sobre el caracol").
6. DUA: El campo "dua" debe incluir AL MENOS una adecuación específica para dificultades (reducir complejidad del texto, apoyo visual, más tiempo) Y una extensión para avanzados (texto más complejo, producción escrita propia), ambas ligadas al contenido concreto de la clase.`;
}

// ─── Enrich parcial — mismo principio que enrichEstudiante/enrichDocente
// en GuiaEngine.ts: si la IA ya pasó el schema pero algún campo salió
// débil (prompt-following imperfecto), se reemplaza SOLO ese campo con el
// del fallback determinista en vez de descartar toda la planificación. La
// prioridad (inicio, desarrollo, progresión de objetivos) es la que pidió
// la tarea — closure/materiales/dua dependen solo del prompt, no se tocan
// acá porque no hay una heurística confiable para detectarlos "débiles"
// sin falsos positivos.

const MIN_OPENING_LEN = 30; // mismo umbral pedido explícitamente para "inicio"
const MIN_DEVELOPMENT_LEN = 60; // ~3 pasos concretos reales no caben en menos de esto

function isWeakOpening(opening: string): boolean {
  return opening.trim().length < MIN_OPENING_LEN;
}

function isWeakDevelopment(development: string): boolean {
  return development.trim().length < MIN_DEVELOPMENT_LEN;
}

// Detecta clases cuyo objective es idéntico (normalizado) a uno anterior —
// devuelve el índice de cada ocurrencia repetida (nunca la primera vez que
// aparece ese objetivo, esa se deja intacta).
function findDuplicateObjectiveIndices(classes: PlanificacionClase[]): Set<number> {
  const seen = new Set<string>();
  const duplicates = new Set<number>();
  classes.forEach((clase, index) => {
    const key = clase.objective.trim().toLowerCase();
    if (seen.has(key)) {
      duplicates.add(index);
    } else {
      seen.add(key);
    }
  });
  return duplicates;
}

function enrichPlanificacion(ai: Planificacion, fallback: Planificacion): Planificacion {
  const duplicateObjectiveIndices = findDuplicateObjectiveIndices(ai.classes);

  const classes = ai.classes.map((clase, index) => {
    // El fallback determinista solo trae 3 clases — si la IA generó 4 o 5
    // (dentro del 3-5 que permite el schema), las clases sin equivalente
    // en el fallback quedan tal cual vinieron de la IA: no hay con qué
    // enriquecerlas sin inventar contenido nuevo acá.
    const fallbackClase = fallback.classes[index];
    if (!fallbackClase) return clase;

    return {
      ...clase,
      opening: isWeakOpening(clase.opening) ? fallbackClase.opening : clase.opening,
      development: isWeakDevelopment(clase.development) ? fallbackClase.development : clase.development,
      objective: duplicateObjectiveIndices.has(index) ? fallbackClase.objective : clase.objective,
    };
  });

  return { ...ai, classes };
}

export async function generatePlanificacion(
  env: AIEngineEnv,
  prompt: string,
  opciones: PlanificacionOptions,
): Promise<PlanificacionResult> {
  const fallback = buildFallbackPlanificacion(opciones);

  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPromptPlanificacion(),
      prompt,
      PlanificacionSchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', maxTokens: 3000 },
    );
    return { planificacion: enrichPlanificacion(data, fallback), usedFallback: false };
  } catch (error) {
    console.error('[PlanificacionEngine] error:', error);
    return { planificacion: fallback, usedFallback: true };
  }
}
