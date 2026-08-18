import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { InteractiveLessonSchema, type InteractiveLessonModel } from '../../schemas/interactiveLessonSchema';

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_TOKENS = 3000;

export interface InteractiveLessonParams {
  subject: string;
  grade: string;
  oa: string;
}

function buildSystemPrompt(): string {
  return `Eres un experto en diseño instruccional del Currículum Nacional de Chile.
Genera una lección interactiva lúdica para niños de enseñanza básica.
Debes responder ÚNICAMENTE con un JSON válido que cumpla estrictamente el esquema requerido.

ESTRUCTURA EXACTA DE 6 DIPOSITIVAS (en este orden):
1. Portada (type: "title") — Título atractivo de la lección + subtítulo motivador
2. Activación (type: "bullets") — 2 a 4 preguntas o puntos de activación
3. Contenido Central (type: "imageText") — Explicación adaptada a niños + imagePrompt en inglés
4. Comparación (type: "comparison") — Dos elementos con sus características
5. Gamificación (type: "quiz") — Pregunta de opción múltiple con 3 opciones
6. Ticket de Salida (type: "closing") — Pregunta de reflexión final

REGLAS ESTRICTAS:
- Títulos máximo 80 caracteres, tono amigable e inclusivo
- El imagePrompt debe estar en inglés y ser específico para generación de imágenes
- El quiz debe tener exactamente 3 opciones y 1 respuesta correcta (índice 0, 1 o 2)
- El feedback del quiz debe ser corto y didáctico
- El reflectionPrompt del closing debe ser una pregunta abierta para el estudiante
- Nunca copies texto literal del OA, adapta el lenguaje al nivel
- Responde SOLO con el JSON, sin markdown, sin explicaciones`;
}

function buildUserPrompt(params: InteractiveLessonParams): string {
  return `Asignatura: ${params.subject}
Nivel: ${params.grade}
Objetivo de Aprendizaje (OA): ${params.oa}

Genera el JSON exacto con las 6 diapositivas en el orden especificado.`;
}

function buildFallbackInteractiveLesson(params: InteractiveLessonParams): InteractiveLessonModel {
  return {
    slides: [
      {
        type: 'title',
        title: `Explorando: ${params.oa}`.slice(0, 80),
        subtitle: `${params.subject} — ${params.grade}`.slice(0, 120),
      },
      {
        type: 'bullets',
        title: '¿Qué sabemos de este tema?',
        items: [
          '¿Qué recuerdas sobre este tema?',
          '¿Dónde has visto algo parecido antes?',
        ],
      },
      {
        type: 'imageText',
        title: 'Aprendiendo juntos',
        content: `Hoy exploraremos el objetivo: ${params.oa}`.slice(0, 300),
        imagePrompt: 'children learning together in a classroom, educational illustration',
      },
      {
        type: 'comparison',
        title: 'Comparemos ideas',
        element1: { name: 'Antes', characteristics: ['Lo que ya sabíamos'] },
        element2: { name: 'Ahora', characteristics: ['Lo que aprendimos hoy'] },
      },
      {
        type: 'quiz',
        title: '¡Pongamos a prueba lo aprendido!',
        options: ['Opción A', 'Opción B', 'Opción C'],
        correctIndex: 0,
        feedback: '¡Bien hecho! Sigamos repasando juntos.',
      },
      {
        type: 'closing',
        title: 'Para reflexionar',
        reflectionPrompt: '¿Qué fue lo más interesante que aprendiste hoy?',
      },
    ],
  };
}

export async function generateInteractiveLesson(
  env: AIEngineEnv,
  params: InteractiveLessonParams,
): Promise<InteractiveLessonModel> {
  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(),
      buildUserPrompt(params),
      InteractiveLessonSchema,
      { model: MODEL, maxTokens: MAX_TOKENS, maxReintentos: 2 },
    );
    return data;
  } catch (error) {
    console.error('[InteractiveLessonEngine] generateInteractiveLesson error:', error);
    return buildFallbackInteractiveLesson(params);
  }
}
