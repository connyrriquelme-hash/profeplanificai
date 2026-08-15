import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { inferRangoEtario } from './pedagogicalUtils';
import {
  GuiaEstudianteAISchema,
  GuiaDocenteAISchema,
  type GuiaEstudianteAI,
  type GuiaDocenteAI,
} from '../_lib/ai/schemas/guiaSchema';

// GuideSection duplicado localmente (no GuideSectionAI de guiaSchema.ts,
// que es solo el shape de validación) porque functions/ no importa de src/
// en ningún otro lugar del repo (verificado) — mantener ese límite en vez
// de ser el primero en cruzarlo. Debe seguir siendo estructuralmente
// idéntico a GuideSection en src/components/products/types.ts:128-132.
export interface GuiaSection {
  title: string;
  content: string;
  activities?: string[];
}

export interface GuiaEngineInput {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  topic: string;
  indicators: string[];
  duration?: string;
}

export interface GuiaResult {
  title: string;
  objective: string;
  sections: GuiaSection[];
}

// ─── Capa 2: fallback determinista ───
// Reemplaza a buildStudentGuide/buildTeacherGuide (guide.ts:103-192) pero
// ya reshapeado a GuiaResult — debe cumplir la misma composición de
// secciones que exige guiaSchema.ts, para que el caller (guide.ts) nunca
// tenga que distinguir "vino de la IA" vs "vino del fallback".

function buildFallbackEstudiante(input: GuiaEngineInput): GuiaResult {
  return {
    title: input.topic || `Guía: ${input.objectiveCode}`,
    objective: input.objectiveText,
    sections: [
      { title: 'Introducción', content: `En esta guía vamos a trabajar: ${input.objectiveText}` },
      {
        title: 'Vocabulario clave',
        content: 'Concepto clave, Término 2',
        activities: [
          'Definición clara y simple del concepto principal.',
          'Definición del segundo término importante.',
        ],
      },
      {
        title: 'Actividad 1: Activación',
        content: 'Responde las siguientes preguntas sobre lo que ya sabes del tema.',
        activities: ['¿Qué sabes sobre este tema?', '¿Dónde lo has visto antes?', 'Escribe 3 palabras que se te vengan a la mente.'],
      },
      {
        title: 'Actividad 2: Desarrollo',
        content: 'Lee el texto y responde las preguntas de comprensión.',
        activities: ['Lee el texto atentamente.', 'Subraya las ideas principales.', 'Responde las preguntas con tus propias palabras.'],
      },
      {
        title: 'Actividad 3: Aplicación',
        content: 'Aplica lo aprendido en una situación nueva.',
        activities: ['Resuelve el ejercicio propuesto.', 'Explica tu procedimiento.', 'Comparte tu respuesta con un compañero.'],
      },
      {
        title: 'Reflexión / Autoevaluación',
        content: '',
        activities: ['Puedo explicar qué aprendí hoy.', 'Todavía me cuesta...', 'Lo que más me gustó fue...', 'Necesito practicar más...'],
      },
    ],
  };
}

function buildFallbackDocente(input: GuiaEngineInput): GuiaResult {
  const duration = input.duration || '90 minutos';
  return {
    title: `Guía Docente: ${input.objectiveCode}`,
    objective: input.objectiveText,
    sections: [
      {
        title: 'Inicio (15 min)',
        content: 'Activación de conocimientos previos con preguntas provocadoras. Presentar pregunta inicial. Dar 2 minutos para pensar individualmente. Compartir en parejas. Plenaria breve.',
      },
      {
        title: 'Desarrollo (50 min)',
        content: 'Explicación del concepto clave con ejemplo contextualizado + práctica guiada. Modelar el concepto (yo hago). Práctica guiada en parejas (hacemos juntos). Trabajo individual (tú haces). Monitorear y retroalimentar.',
      },
      {
        title: 'Cierre (15 min)',
        content: 'Síntesis oral con participación estudiantil. Ticket de salida individual con 2-3 preguntas de cierre.',
      },
      {
        title: 'Diferenciación / Adecuaciones DUA',
        content: '',
        activities: [
          'Ofrecer apoyo visual con organizadores gráficos para estudiantes con dificultades.',
          'Proponer una pregunta de profundización o un desafío adicional para estudiantes avanzados.',
          'Agrupar estudiantes de forma heterogénea.',
          'Ofrecer tiempo adicional si es necesario.',
        ],
      },
      {
        title: 'Materiales y evaluación',
        content: `Duración total: ${duration}. Evaluación formativa mediante observación, ticket de salida y participación. Criterios: comprensión del OA, aplicación del concepto, calidad de la explicación.`,
        activities: ['Guía impresa', 'Pizarra o proyector', 'Material concreto según asignatura', 'Post-its o tarjetas'],
      },
    ],
  };
}

// ─── Prompts ───

function buildSystemPromptEstudiante(level: string): string {
  const rangoEtario = inferRangoEtario(level);

  return `Eres un profesor o profesora chilena que le habla directamente a su curso para preparar una guía de aprendizaje. Escribes en primera persona plural, como si estuvieras guiando a tus estudiantes paso a paso: "vamos a aprender", "te proponemos", "hoy vamos a descubrir". Tu lenguaje es simple, cercano y apropiado para la edad del curso.

ADAPTACIÓN POR EDAD (usa exactamente este rango, no otro):
${rangoEtario}

REGLAS OBLIGATORIAS:
1. El campo "objective" y todo el contenido de la guía deben derivar del OA y los indicadores reales que vienen en el contexto. NUNCA copies el texto curricular oficial de forma literal — reformúlalo siempre en lenguaje que un estudiante del curso indicado pueda entender.
2. NUNCA inventes indicadores oficiales. Si el contexto no trae indicadores, trabaja solo a partir del OA y el tema — no generes texto que aparente ser un indicador MINEDUC oficial.
3. Cada actividad debe tener pasos concretos y accionables: algo que el estudiante efectivamente hace (escribir, dibujar, comparar, marcar, responder, medir, ordenar). Nunca uses una descripción abstracta como "reflexiona sobre el tema" o "piensa en lo aprendido" como paso único.
4. El vocabulario clave debe explicarse con definiciones en lenguaje simple y un ejemplo del contexto cotidiano del estudiante (su casa, su barrio, su colegio, situaciones que reconozca). NUNCA copies una definición de diccionario ni un estilo técnico/formal.
5. Todo término técnico o disciplinar nuevo que uses en cualquier sección de la guía debe aparecer también en "Vocabulario clave" con su definición — no lo uses sin explicarlo antes.
6. Las preguntas de autoevaluación deben estar redactadas en primera persona del estudiante: "Puedo...", "Todavía me cuesta...", "Necesito practicar más...", "Lo que más me gustó fue...". Nunca en segunda persona ("¿Puedes...?") ni en tercera persona.
7. No repitas el OA completo en cada sección — úsalo para construir "objective" y la Introducción, luego trabaja el tema con tus propias palabras.
8. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones antes o después del JSON.

ESTRUCTURA JSON OBLIGATORIA:
{
  "title": "Título motivador ligado al tema real de la clase (no genérico)",
  "objective": "El OA reformulado en lenguaje del estudiante, respetando el rango etario indicado",
  "sections": [
    {
      "title": "Introducción",
      "content": "Texto breve en primera persona plural que presenta el objetivo de la guía y conecta con algo cercano al estudiante. Debe incluir el objetivo reformulado, no el texto oficial del OA."
    },
    {
      "title": "Vocabulario clave",
      "content": "Entre 2 y 6 términos separados por coma, ej: 'fotosíntesis, clorofila, oxígeno'",
      "activities": [
        "Definición simple del primer término, con un ejemplo cotidiano del estudiante — en el mismo orden que los términos listados en content",
        "Definición simple del segundo término, con un ejemplo cotidiano"
      ]
    },
    {
      "title": "Actividad 1: [nombre concreto de la actividad, no genérico]",
      "content": "Descripción breve de qué se hace en esta actividad",
      "activities": ["Paso 1 concreto", "Paso 2 concreto", "Paso 3 concreto"]
    },
    {
      "title": "Actividad 2: [nombre concreto de la actividad]",
      "content": "Descripción breve",
      "activities": ["Paso 1", "Paso 2", "Paso 3"]
    },
    {
      "title": "Reflexión / Autoevaluación",
      "content": "",
      "activities": ["Puedo explicar...", "Todavía me cuesta...", "Lo que más me gustó fue...", "Necesito practicar..."]
    }
  ]
}

El array "sections" debe tener SIEMPRE, en este orden exacto: 1 sección "Introducción" + 1 sección "Vocabulario clave" + entre 2 y 4 secciones de actividad (cada una titulada "Actividad N: ..." con un nombre concreto, progresando de más simple a más desafiante: activación → desarrollo → aplicación) + 1 sección final "Reflexión / Autoevaluación" con entre 2 y 5 preguntas en activities. No agregues secciones adicionales ni cambies estos títulos.`;
}

function buildSystemPromptDocente(): string {
  return `Eres un profesor o profesora chilena con experiencia real en aula, escribiendo para un colega docente que va a dictar esta clase. El tono es de colega a colega: profesional pero cercano, directo, sin relleno académico ni frases genéricas de manual pedagógico.

REGLAS OBLIGATORIAS:
1. El campo "objective" debe ser el OA preciso, en registro docente — no lo simplifiques como harías para un estudiante, pero sí puedes ajustar la redacción para que sea clara y accionable para quien va a enseñar.
2. NUNCA inventes indicadores oficiales. Si el contexto no trae indicadores, trabaja solo a partir del OA y el tema — no generes texto que aparente ser un indicador MINEDUC oficial.
3. La sección "Inicio" debe describir una estrategia de activación de conocimientos previos CONCRETA y específica al tema de la clase — nunca una instrucción genérica como "pregunte a los estudiantes qué saben del tema". Debe decir exactamente qué pregunta hacer, qué material mostrar, o qué situación plantear.
4. La sección "Desarrollo" debe incluir explícitamente una estrategia de modelado con la progresión "yo hago → hacemos juntos → tú haces" (modelamiento docente, práctica guiada, práctica independiente), aplicada al contenido específico de la clase — no la menciones en abstracto, descríbela aplicada al tema.
5. La sección "Cierre" debe incluir una estrategia de síntesis o un ticket de salida concreto (con la pregunta o instrucción exacta que se usará), no solo "cierre la clase con una síntesis".
6. La sección "Diferenciación / Adecuaciones DUA" debe incluir AL MENOS una adecuación específica para estudiantes con dificultades y AL MENOS una extensión específica para estudiantes avanzados — ambas ligadas al contenido concreto del OA, nunca genéricas tipo "dar más tiempo" o "actividades más difíciles" sin especificar qué cambia.
7. Los títulos de "Inicio", "Desarrollo" y "Cierre" deben incluir el tiempo asignado en el formato exacto "Inicio (N min)" o "Inicio (N minutos)" — igual para Desarrollo y Cierre. Los tres tiempos DEBEN sumar exactamente la duración total de la clase indicada en el contexto.
8. La sección "Materiales y evaluación" debe combinar: la duración total de la clase, los criterios de evaluación formativa, y en "activities" la lista de materiales concretos necesarios (no genéricos como "materiales varios").
9. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones antes o después del JSON.

ESTRUCTURA JSON OBLIGATORIA:
{
  "title": "Guía Docente: [código del OA]",
  "objective": "El OA en registro docente, preciso y accionable",
  "sections": [
    {
      "title": "Inicio (N min)",
      "content": "Estrategia de activación concreta y específica al tema: qué pregunta o situación plantear, qué muestra el docente, cómo participan los estudiantes."
    },
    {
      "title": "Desarrollo (N min)",
      "content": "Estrategia de modelado explícito aplicada al contenido: qué modela el docente (yo hago), cómo se practica guiado en conjunto (hacemos juntos), cómo trabajan los estudiantes de forma independiente (tú haces)."
    },
    {
      "title": "Cierre (N min)",
      "content": "Estrategia de síntesis o ticket de salida concreto, con la pregunta o instrucción exacta a usar."
    },
    {
      "title": "Diferenciación / Adecuaciones DUA",
      "content": "",
      "activities": ["Adecuación específica para estudiantes con dificultades, ligada al OA", "Extensión específica para estudiantes avanzados, ligada al OA", "..."]
    },
    {
      "title": "Materiales y evaluación",
      "content": "Duración total: [N minutos]. Criterios de evaluación formativa específicos al OA y la clase.",
      "activities": ["Material concreto 1", "Material concreto 2", "..."]
    }
  ]
}

Los tres tiempos de Inicio, Desarrollo y Cierre deben sumar exactamente la duración total entregada en el contexto (por ejemplo, si la duración total es "90 minutos", los tres tiempos deben sumar 90). No agregues secciones adicionales ni cambies estos 5 títulos ni su orden.`;
}

function buildUserPrompt(input: GuiaEngineInput): string {
  return JSON.stringify(
    {
      nivel: input.level,
      asignatura: input.subject,
      oa: input.objectiveCode,
      objetivo: input.objectiveText,
      indicadores: input.indicators,
      tema: input.topic,
      duracion_total: input.duration || '90 minutos',
    },
    null,
    2,
  );
}

// ─── Capa 3: enrich — si la IA devolvió algo débil, se completa con el fallback ───

function enrichEstudiante(ai: GuiaEstudianteAI, fallback: GuiaResult): GuiaResult {
  return {
    title: ai.title || fallback.title,
    objective: ai.objective || fallback.objective,
    sections: ai.sections?.length >= 4 ? ai.sections : fallback.sections,
  };
}

function enrichDocente(ai: GuiaDocenteAI, fallback: GuiaResult): GuiaResult {
  return {
    title: ai.title || fallback.title,
    objective: ai.objective || fallback.objective,
    sections: ai.sections?.length === 5 ? ai.sections : fallback.sections,
  };
}

// ─── Punto de entrada único ───
// Mismo patrón que generateRubricaContent (RubricaEngine.ts:1197-1228):
// fallback determinista primero, intento IA con el modelo 70B (el schema
// con superRefine posicional es tan "rico" como el de rúbricas — mismo
// motivo documentado ahí para no usar el modelo 3B por defecto), enrich si
// tiene éxito, catch → fallback completo.

export async function generateGuia(
  env: AIEngineEnv,
  input: GuiaEngineInput,
  tipo: 'estudiante' | 'docente',
): Promise<GuiaResult> {
  const fallback = tipo === 'estudiante' ? buildFallbackEstudiante(input) : buildFallbackDocente(input);

  try {
    if (tipo === 'estudiante') {
      const { data } = await callAIConValidacion(
        env,
        buildSystemPromptEstudiante(input.level),
        buildUserPrompt(input),
        GuiaEstudianteAISchema,
        { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' },
      );
      return enrichEstudiante(data, fallback);
    }

    const { data } = await callAIConValidacion(
      env,
      buildSystemPromptDocente(),
      buildUserPrompt(input),
      GuiaDocenteAISchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' },
    );
    return enrichDocente(data, fallback);
  } catch (error) {
    console.error('[GuiaEngine] generateGuia error:', error);
    return fallback;
  }
}
