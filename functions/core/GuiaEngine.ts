import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { inferRangoEtario } from './pedagogicalUtils';
import { getExpertContext, getExpertEvaluationContext, getExpertDUAContext } from './ExpertKnowledge';
import {
  GuiaEstudianteAISchema,
  GuiaDocenteAISchema,
  type GuiaEstudianteAI,
  type GuiaDocenteAI,
} from '../_lib/ai/schemas/guiaSchema';

// Umbral desde el cual additionalContext se considera "largo/complejo" y
// se le pide a la IA que lo resuma en vez de copiarlo tal cual — el mismo
// límite superior que TextoLecturaSchema.cuerpo acepta (800 caracteres).
const TEXTO_PROFESOR_MAX_DIRECTO = 800;

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

// Debe seguir siendo estructuralmente idéntico a GuideTextoLectura en
// src/components/products/types.ts — mismo motivo que GuiaSection arriba.
export interface GuiaTextoLectura {
  titulo: string;
  cuerpo: string;
  fuente: 'generado_ia' | 'proporcionado_profesor';
}

export interface GuiaEngineInput {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  topic: string;
  indicators: string[];
  duration?: string;
  // Texto que el profesor ya trae (pegado en el wizard). Si viene, la IA
  // debe adaptarlo/resumirlo como textoLectura en vez de inventar uno
  // nuevo — ver buildSystemPromptEstudiante y enrichEstudiante.
  additionalContext?: string;
}

export interface GuiaResult {
  title: string;
  objective: string;
  // Solo aplica a la guía estudiante: la guía docente no tiene un texto de
  // lectura para el curso, así que buildFallbackDocente/enrichDocente
  // nunca lo setean.
  textoLectura?: GuiaTextoLectura;
  sections: GuiaSection[];
}

// ─── Capa 2: fallback determinista ───
// Reemplaza a buildStudentGuide/buildTeacherGuide (guide.ts:103-192) pero
// ya reshapeado a GuiaResult — debe cumplir la misma composición de
// secciones que exige guiaSchema.ts, para que el caller (guide.ts) nunca
// tenga que distinguir "vino de la IA" vs "vino del fallback".

// Genérico a propósito (no usa additionalContext aunque exista): el
// fallback solo se activa cuando la IA falló tras todos los reintentos, y
// su único trabajo acá es cumplir el contrato del schema (textoLectura
// siempre presente), no producir un texto de calidad — ver GuiaEditEngine
// para el mismo criterio de fallback "limpio" en vez de "inventado".
function buildFallbackTextoLectura(input: GuiaEngineInput): GuiaTextoLectura {
  const tema = input.topic || 'este tema';
  return {
    titulo: input.topic || 'Texto de lectura',
    cuerpo: `Hoy vamos a leer sobre ${tema}. Este texto breve te va a dar la información que necesitas para las actividades de esta guía. Léelo con calma, de principio a fin. Si encuentras una palabra que no conoces, revisa el vocabulario clave de más arriba. Cuando termines, vuelve a leerlo una segunda vez para asegurarte de que entendiste bien. Luego vas a responder algunas preguntas sobre lo que leíste.`,
    fuente: 'generado_ia',
  };
}

function buildFallbackEstudiante(input: GuiaEngineInput): GuiaResult {
  return {
    title: input.topic || `Guía: ${input.objectiveCode}`,
    objective: input.objectiveText,
    textoLectura: buildFallbackTextoLectura(input),
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
        title: 'Actividad 1: Comprensión del texto',
        content: 'Responde estas preguntas sobre el texto de lectura que acabas de leer.',
        activities: ['¿De qué trata el texto que leíste?', 'Completa la oración: "Hoy vamos a leer sobre ___".', 'Escribe una idea del texto con tus propias palabras.'],
      },
      {
        title: 'Actividad 2: Desarrollo',
        content: 'Profundiza en lo que leíste con una actividad práctica.',
        activities: ['Subraya las ideas principales del texto.', 'Dibuja algo relacionado con lo que leíste.', 'Comenta tu dibujo con un compañero.'],
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

  return `Eres un EXPERTO en pedagogia, psicologia cognitiva, neurociencias del aprendizaje y curriculo chileno MINEDUC. Le hablas directamente a estudiantes para preparar una guia de aprendizaje. Escribes en primera persona plural: "vamos a aprender", "te proponemos", "hoy vamos a descubrir".
${getExpertContext()}
${getExpertDUAContext()}

REGLAS DE VARIEDAD PARA GUIA DEL ESTUDIANTE:
1. DIVERSIDAD DE PREGUNTAS: en la guia incluye al menos 5 tipos distintos de preguntas:
   - "Nombrа/Lista/Ordena" (Recordar)
   - "Explica con tus palabras/Dibuja/Resume" (Comprender)
   - "Usa para resolver/Dame un ejemplo real/Que pasaria si" (Aplicar)
   - "Que tienen en comun/Por que/Que relacion hay" (Analizar)
   - "Cual es mejor/Que opinas/Que cambiarias" (Evaluar)
   - "Disena/Crea/Propone/Inventa" (Crear)

2. FORMATOS VARIDOS: no todo es "escribe tu respuesta". Incluye:
   - Completar oraciones con huecos
   - Verdadero/Falso con justificacion
   - Opcion multiple (3-4 opciones)
   - Unir con flechas / Matching
   - Dibujar / Esquema / Mapa conceptual
   - Dramatizar / Explicar a un companero
   - Investigar un dato
   - Reflexion personal (primera persona)

3. ADAPTACIONES VISUALES: toda la guia debe ser visualmente atractiva:
   - Iconos por cada seccion
   - Espacio entre actividades (no bloque de texto)
   - Cajas destacadas para instrucciones clave
   - Linea numerica pegada si es de matematicas
   - Espacio para dibujar cuando se pida

4. INCLUSION: al final de la guia, incluye una seccion "Para mi ritmo" con opciones:
   - "Si necesitas mas tiempo, haz solo las actividades 1, 2 y 3"
   - "Si quieres un desafio extra, investiga: [pregunta abierta]"
   - "Si aprendes mejor escuchando, pide a alguien que te lea la guia"

ADAPTACION POR EDAD (usa exactamente este rango, no otro):
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

REGLA CRÍTICA — TEXTO DE LECTURA:
- El texto debe ser factualmente correcto. Si no tienes certeza sobre un dato específico (cifra, nombre científico, proceso biológico), usa una descripción funcional general en vez de un dato concreto que pueda ser inexacto.
- NUNCA uses metáforas o analogías que produzcan información incorrecta (ej: "las antenas son como ojos" si las antenas no son órganos visuales).
- El texto debe ser coherente con las actividades: las preguntas de comprensión y los espacios para completar DEBEN referirse a información que aparece en el texto de lectura.
- Longitud: 5-8 oraciones, vocabulario apropiado para la edad del curso (usa el rango etario indicado arriba).
- El texto va ANTES de las actividades en el schema: es "textoLectura", un campo propio, no una sección más.
- Si el contexto trae "texto_proporcionado_por_profesor": ese es el texto real que el profesor ya trae a la clase. Debes usarlo como base de "textoLectura.cuerpo" (resumido o adaptado al rango etario si es muy largo o muy complejo, pero sin inventar información que no esté en él) y responder "fuente": "proporcionado_profesor". Si no viene ese campo, genera tú el texto informativo completo y responde "fuente": "generado_ia".
- La primera actividad (Actividad 1) SIEMPRE debe ser de comprensión del texto de lectura: preguntas sobre lo que dice el texto, completar oraciones tomadas del texto, u ordenar información que aparece en el texto — nunca una instrucción genérica como "lee el texto" sin pedir nada más. Cada pregunta de comprensión debe tener una respuesta que efectivamente aparece en "textoLectura.cuerpo".
- Cada pregunta de comprensión de la Actividad 1 debe tener su respuesta EXPLÍCITA en el texto de lectura — no preguntes por causas, razones o inferencias que el texto no explica. Si el texto dice "el caracol es lento" pero no explica POR QUÉ, la pregunta correcta es "¿Cómo es el caracol?" (respuesta en el texto) y NO "¿Por qué es lento el caracol?" (respuesta no está en el texto).
- El texto informativo NO debe incluir personificación ni antropomorfización (no digas que el animal "tiene amigos", "le gusta", "piensa", "siente" en sentido humano). El texto debe ser informativo y factual.

ESTRUCTURA JSON OBLIGATORIA:
{
  "title": "Título motivador ligado al tema real de la clase (no genérico)",
  "objective": "El OA reformulado en lenguaje del estudiante, respetando el rango etario indicado",
  "textoLectura": {
    "titulo": "Título breve del texto de lectura (no repitas el título de la guía)",
    "cuerpo": "Texto informativo de 5-8 oraciones, factualmente correcto, sobre el tema específico de la clase — ver REGLA CRÍTICA arriba",
    "fuente": "generado_ia o proporcionado_profesor, según corresponda"
  },
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
      "title": "Actividad 1: [nombre concreto ligado a comprensión de lectura, ej: 'Actividad 1: ¿Qué dice el texto?']",
      "content": "Descripción breve: se responde sobre el texto de lectura de arriba",
      "activities": ["Pregunta de comprensión cuya respuesta aparece en textoLectura.cuerpo", "Otra pregunta o instrucción de comprensión (completar, ordenar)", "Paso 3 concreto"]
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

El array "sections" debe tener SIEMPRE, en este orden exacto: 1 sección "Introducción" + 1 sección "Vocabulario clave" + entre 2 y 4 secciones de actividad (la primera SIEMPRE de comprensión del texto de lectura, las siguientes progresando de más simple a más desafiante: desarrollo → aplicación) + 1 sección final "Reflexión / Autoevaluación" con entre 2 y 5 preguntas en activities. No agregues secciones adicionales ni cambies estos títulos.`;
}

function buildSystemPromptDocente(): string {
  return `Eres un EXPERTO en pedagogia, psicologia cognitiva, neurociencias del aprendizaje y curriculo chileno MINEDUC. Escribes una guia docente para un colega que va a dictar esta clase. El tono es de colega a colega: profesional pero cercano, directo.
${getExpertContext()}
${getExpertEvaluationContext()}
${getExpertDUAContext()}

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
  const payload: Record<string, unknown> = {
    nivel: input.level,
    asignatura: input.subject,
    oa: input.objectiveCode,
    objetivo: input.objectiveText,
    indicadores: input.indicators,
    tema: input.topic,
    duracion_total: input.duration || '90 minutos',
  };

  const textoProfesor = (input.additionalContext || '').trim();
  if (textoProfesor) {
    payload.texto_proporcionado_por_profesor = textoProfesor;
    if (textoProfesor.length > TEXTO_PROFESOR_MAX_DIRECTO) {
      payload.nota_texto_profesor = `El texto tiene ${textoProfesor.length} caracteres, más de lo que "textoLectura.cuerpo" acepta (máx. 800) — resúmelo o adáptalo al rango etario en vez de copiarlo completo.`;
    }
  }

  return JSON.stringify(payload, null, 2);
}

// ─── Capa 3: enrich — si la IA devolvió algo débil, se completa con el fallback ───

function enrichEstudiante(ai: GuiaEstudianteAI, fallback: GuiaResult, input: GuiaEngineInput): GuiaResult {
  // fuente se fuerza de forma determinista según si el profesor mandó
  // additionalContext, en vez de confiar en que la IA haya marcado bien el
  // campo "fuente" que le pedimos en el prompt.
  const textoLectura = ai.textoLectura
    ? { ...ai.textoLectura, fuente: (textoProfesorPresente(input) ? 'proporcionado_profesor' : 'generado_ia') as GuiaTextoLectura['fuente'] }
    : fallback.textoLectura;

  return {
    title: ai.title || fallback.title,
    objective: ai.objective || fallback.objective,
    textoLectura,
    sections: ai.sections?.length >= 4 ? ai.sections : fallback.sections,
  };
}

function textoProfesorPresente(input: GuiaEngineInput): boolean {
  return (input.additionalContext || '').trim().length > 0;
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
      return enrichEstudiante(data, fallback, input);
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
