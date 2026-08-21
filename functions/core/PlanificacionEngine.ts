import { PlanificacionSchema, type Planificacion, type PlanificacionClase } from '../../schemas/PlanificacionSchema';
import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { inferRangoEtario } from './pedagogicalUtils';

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
  const chars = Array.from(trimmed);
  if (chars.length <= max) return trimmed;
  const cut = chars.slice(0, max - 1).join('').trimEnd();
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

// ─── System prompt — compacto a propósito (objetivo: <8KB). Antes incluía
// el contexto completo de ExpertKnowledge.ts (~43KB, ~822 líneas) más este
// bloque de reglas — ese prompt gigante empujaba al modelo a producir
// campos que superaban los límites de PlanificacionSchema (CLASS_STAGE_MAX
// era 800) y el schema.safeParse() fallaba en los 3 reintentos de
// callAIConValidacion, cayendo siempre al fallback determinista. Fix
// coordinado: los límites del schema subieron (CLASS_STAGE_MAX=2000,
// DUA_ITEM_MAX=1500, CLASS_MATERIAL_MAX=500) y este prompt ahora pide
// explícitamente ese volumen de contenido por campo — nunca más de lo que
// el campo puede contener.
function buildSystemPromptPlanificacion(level: string): string {
  const rangoEtario = inferRangoEtario(level);

  return `Eres un experto en pedagogia chilena (curriculo MINEDUC) y ciencia del aprendizaje. Disenas planificaciones clase a clase concretas, listas para usar en aula real — nunca genericas.

NUNCA COPIES EL OA LITERAL: el objetivo de aprendizaje es tu punto de partida para DERIVAR contenido pedagogico, no un texto para repetir. Si el OA dice "Identificar caracteristicas de los seres vivos", no escribas "en esta clase identificaremos caracteristicas de los seres vivos" — escribe QUE caracteristicas especificas, CON QUE actividad concreta las identificaran los estudiantes.

CONTENIDO REAL, NO GENERICO: todo lo que escribas debe nombrar el contenido especifico del OA (personajes, fechas, procesos, lugares, conceptos). Si el OA menciona hechos historicos, geograficos o cientificos concretos, citalos por su nombre exacto. Nunca escribas "el tema" o "el contenido" en lugar del contenido real.

CONTEXTO CHILENO REAL: cuando uses ejemplos o situaciones para ilustrar el contenido, ancla en el contexto cotidiano chileno — nombres chilenos (Sofia, Mateo, Javiera), lugares reconocibles (el Mercado Central, la Cordillera de los Andes, una feria del barrio), situaciones reales de una sala de clases chilena. Nunca uses ejemplos genericos internacionales cuando hay un equivalente chileno igual de valido.

VOCABULARIO POR EDAD: ${rangoEtario}

ACTIVIDADES CONCRETAS Y EJECUTABLES: cada actividad que describas debe ser algo que el estudiante HACE fisicamente — escribe, dibuja, marca, ordena, compara, mide, construye. Nunca uses frases abstractas como "reflexiona sobre", "analiza el concepto de" o "comprende la importancia de" como la instruccion completa de una actividad; si aparecen, deben ir seguidas de la accion concreta que las hace verificables.

VARIEDAD Y PROGRESION:
- Cada clase tiene una estructura distinta — no repitas la misma secuencia inicio-desarrollo-cierre.
- Objetivos distintos y progresivos por clase, siguiendo Bloom: Clase 1 Recordar/Comprender, Clase 2 Aplicar, Clase 3+ Analizar/Evaluar. Nunca repitas el mismo objetivo entre clases.
- Al menos 4 modalidades de actividad distintas por clase: expositiva breve, guiada, practica independiente, cooperativa, juego pedagogico, investigacion, produccion, evaluacion formativa.

REGLAS POR CAMPO (respeta los limites de caracteres — son el limite duro del schema, no una sugerencia):

opening (maximo 2000 caracteres): Describe el inicio con:
- La pregunta o situacion de activacion EXACTA (copia la pregunta que harias, no describas que haras una pregunta)
- Como conecta con el OA y con la experiencia previa del estudiante
- La dinamica (individual, parejas, plenaria) y su duracion
- Que se espera que el estudiante diga o haga para confirmar que esta activado

development (maximo 2000 caracteres): Describe el desarrollo con:
- Que modelas explicitamente como docente (yo hago): cita el ejemplo concreto que usaras
- Que practican juntos (hacemos juntos): describe la actividad exacta con instrucciones que el estudiante recibiria
- Que hacen de forma independiente (tu haces): describe la tarea individual y como la monitoreas
Todo aplicado al contenido especifico del OA, con ejemplos reales del tema — nunca generico.

closure (maximo 2000 caracteres): Describe el cierre con:
- La pregunta exacta del ticket de salida (escribela completa)
- Como procesas las respuestas para saber si el OA fue logrado
- Una sintesis de los conceptos clave de la clase

materials (cada item maximo 500 caracteres, minimo 1 por clase): lista especifica y nombrada — nunca "material concreto segun asignatura". Ejemplo correcto: "mapa politico de Chile 1830-1900", "linea de tiempo impresa del siglo XIX". Cada item debe poder comprarse o fabricarse tal cual esta descrito.

dua (cada item maximo 1500 caracteres, minimo 1 en total para toda la planificacion): describe adecuaciones especificas:
- Al menos 2 adecuaciones para estudiantes con dificultades, ligadas al contenido concreto del OA (no genericas)
- Al menos 1 extension para estudiantes avanzados, ligada al OA
- Una adecuacion de acceso (visual, auditiva o motora)

methodology (maximo 500 caracteres): metodologia APLICADA, no descriptiva — explica que hara el docente concretamente, no solo el nombre del metodo (ejemplo incorrecto: "se aplicara ABP").

assessment (maximo 500 caracteres por clase): evidencia OBSERVABLE del aprendizaje (producto escrito, respuesta oral concreta, demostracion). Nunca "evaluacion general del desempeno".

evaluation (maximo 900 caracteres): como se evalua la unidad completa (formativa y sumativa), ligada a los OA trabajados en las clases.`;
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
      buildSystemPromptPlanificacion(opciones.level),
      prompt,
      PlanificacionSchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', maxTokens: 5000 },
    );
    return { planificacion: enrichPlanificacion(data, fallback), usedFallback: false };
  } catch (error) {
    console.error('[PlanificacionEngine] error:', error);
    return { planificacion: fallback, usedFallback: true };
  }
}
