import type { AIEngineEnv, ClassContent, PedagogicalPlan } from './types';

type WorkersAITextResponse = {
  response?: string;
  result?: string;
  text?: string;
};

const MODEL = '@cf/meta/llama-3-8b-instruct';

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

function getResponseText(response: unknown): string {
  if (typeof response === 'string') return response;

  if (response && typeof response === 'object') {
    const typed = response as WorkersAITextResponse;
    return String(typed.response || typed.result || typed.text || '').trim();
  }

  return '';
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
      temperature: 0.4,
      max_tokens: 1200,
    });

    const rawText = getResponseText(response);
    if (!rawText) {
      throw new Error('La IA devolvió una respuesta vacía.');
    }

    const jsonText = extractJsonObject(rawText);
    const parsed = JSON.parse(jsonText) as unknown;

    return validateClassContent(parsed);
  }
}

export function generateClassContent(env: AIEngineEnv, plan: PedagogicalPlan): Promise<ClassContent> {
  return AIEngine.generateClassContent(env, plan);
}
