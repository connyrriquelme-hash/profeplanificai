import type { AIEngineEnv, ClassContent, PedagogicalPlan } from './types';

type WorkersAITextResponse = {
  response?: unknown;
  result?: string;
  text?: string;
};

const MODEL = '@cf/meta/llama-3.2-3b-instruct';

const SYSTEM_PROMPT =
  'Eres un profesor experto en diseño instruccional. Tu tarea es tomar un plan pedagógico y redactar las actividades de la clase. Debes responder ÚNICAMENTE con un objeto JSON válido que siga esta estructura: { titulo_clase, actividades_inicio, actividades_desarrollo, actividades_cierre, materiales_sugeridos }. No incluyas saludos ni explicaciones, solo el JSON.';

function extractJsonObject(rawText: string): string {
  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('La IA no devolvió un objeto JSON válido.');
  }

  return rawText.slice(start, end + 1);
}

function ensureStringArray(value: unknown, fieldName: keyof ClassContent): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`El campo ${fieldName} debe ser un arreglo de strings.`);
  }

  const normalized = value.map((item) => String(item).trim()).filter(Boolean);
  if (normalized.length === 0) {
    throw new Error(`El campo ${fieldName} no puede estar vacío.`);
  }

  return normalized;
}

function validateClassContent(value: unknown): ClassContent {
  if (!value || typeof value !== 'object') {
    throw new Error('La respuesta de IA no es un objeto.');
  }

  const record = value as Record<string, unknown>;
  const tituloClase = String(record.titulo_clase || '').trim();

  if (!tituloClase) {
    throw new Error('El campo titulo_clase es obligatorio.');
  }

  return {
    titulo_clase: tituloClase,
    actividades_inicio: ensureStringArray(record.actividades_inicio, 'actividades_inicio'),
    actividades_desarrollo: ensureStringArray(record.actividades_desarrollo, 'actividades_desarrollo'),
    actividades_cierre: ensureStringArray(record.actividades_cierre, 'actividades_cierre'),
    materiales_sugeridos: ensureStringArray(record.materiales_sugeridos, 'materiales_sugeridos'),
  };
}

function buildFallbackClassContent(plan: PedagogicalPlan): ClassContent {
  return {
    titulo_clase: `Clase: ${plan.tema}`,
    actividades_inicio: [
      `Presentar el tema "${plan.tema}" y levantar conocimientos previos mediante preguntas breves.`,
      `Relacionar las respuestas de los estudiantes con el objetivo de aprendizaje: ${plan.objetivo_aprendizaje}.`,
      `Explicar el propósito de la clase y los criterios simples de logro.`,
    ],
    actividades_desarrollo: [
      `Desarrollar una explicación guiada del tema usando ejemplos concretos, vocabulario clave y apoyo visual.`,
      `Organizar una actividad colaborativa donde los estudiantes observen, comparen y registren evidencias relacionadas con ${plan.tema}.`,
      `Realizar una puesta en común para analizar hallazgos y conectar con las habilidades: ${plan.habilidades}.`,
    ],
    actividades_cierre: [
      'Sintetizar las ideas centrales en conjunto con el curso.',
      'Aplicar un ticket de salida con una pregunta de comprensión y una pregunta de metacognición.',
      'Indicar una acción de refuerzo o extensión según el nivel de logro observado.',
    ],
    materiales_sugeridos: [
      'Pizarra o proyector',
      'Guía breve de trabajo',
      'Imágenes o esquemas del tema',
      'Cuaderno del estudiante',
      'Ticket de salida',
    ],
  };
}

function getResponseText(response: unknown): string {
  if (typeof response === 'string') return response;

  if (response && typeof response === 'object') {
    const typed = response as WorkersAITextResponse;
    if (typeof typed.response === 'string') return typed.response.trim();
    return String(typed.result || typed.text || '').trim();
  }

  return '';
}

function getStructuredResponse(response: unknown): unknown {
  if (!response || typeof response !== 'object') return null;
  const typed = response as WorkersAITextResponse;
  if (typed.response && typeof typed.response === 'object') return typed.response;
  return response;
}

export class AIEngine {
  static async generateClassContent(env: AIEngineEnv, plan: PedagogicalPlan): Promise<ClassContent> {
    if (!env.AI) {
      throw new Error('AI no está configurado en el entorno.');
    }

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: JSON.stringify(plan, null, 2) },
    ];

    const response = await env.AI.run(MODEL, {
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1200,
    });

    const structuredResponse = getStructuredResponse(response);
    if (structuredResponse) {
      try {
        return validateClassContent(structuredResponse);
      } catch {
        // Si no cumple el contrato final, cae al parser de texto.
      }
    }

    const rawText = getResponseText(response);
    if (!rawText) {
      return buildFallbackClassContent(plan);
    }

    try {
      const jsonText = extractJsonObject(rawText);
      const parsed = JSON.parse(jsonText) as unknown;
      return validateClassContent(parsed);
    } catch {
      return buildFallbackClassContent(plan);
    }
  }
}

export function generateClassContent(env: AIEngineEnv, plan: PedagogicalPlan): Promise<ClassContent> {
  return AIEngine.generateClassContent(env, plan);
}
