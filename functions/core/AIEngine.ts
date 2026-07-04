import type { AIEngineEnv, DuaGuide, LessonContent, PedagogicalPlan } from './types';

const MODEL = '@cf/meta/llama-3.2-3b-instruct';

const SYSTEM_PROMPT_DUA =
  "Eres un especialista en Inclusión Educativa y diseño DUA, experto en el currículo nacional chileno. Tu tarea es tomar un plan pedagógico y diseñar una Guía de Aprendizaje Multinivel que siga los principios DUA. Debes responder ÚNICAMENTE con un objeto JSON válido que respete esta estructura: { titulo_guia, contexto_motivacional, nivel_apoyo, nivel_estandar, nivel_desafio }. No incluyas explicaciones, saludos, ni texto adicional. Es esencial que la guía incluya especificaciones de accesibilidad y apoyo diferenciado para estudiantes diversos.";

const SYSTEM_PROMPT_LESSON =
  "Eres un profesor experto en el currículo nacional chileno. Recibirás un plan pedagógico y debes generar el contenido completo de la clase. Responde ÚNICAMENTE con un objeto JSON válido con esta estructura: { titulo, curso, asignatura, objetivoAprendizaje, habilidadBloom, inicio, desarrollo, cierre, recursos, evaluacionFormativa, adecuacionesDUA }. 'inicio', 'desarrollo' y 'cierre' deben ser strings con la descripción detallada de cada fase. 'recursos' debe ser un arreglo de strings. No incluyas explicaciones ni texto adicional.";

export function extractJsonFromText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let candidate = raw.trim();

  const mdMatch = candidate.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (mdMatch?.[1]) {
    candidate = mdMatch[1].trim();
  }

  const jsonStart = candidate.indexOf('{');
  const jsonEnd = candidate.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    candidate = candidate.substring(jsonStart, jsonEnd + 1);
  }

  return candidate;
}

function ensureStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`El campo ${fieldName} debe ser un arreglo de strings.`);
  }

  const normalized = value.map((item) => String(item).trim()).filter(Boolean);
  if (normalized.length === 0) {
    throw new Error(`El campo ${fieldName} no puede estar vacío.`);
  }

  return normalized;
}

function validateDuaGuide(value: unknown): DuaGuide {
  if (!value || typeof value !== 'object') {
    throw new Error('La respuesta de IA no es un objeto.');
  }

  const record = value as Record<string, unknown>;
  const tituloGuia = String(record.titulo_guia || '').trim();

  if (!tituloGuia) {
    throw new Error('El campo titulo_guia es obligatorio.');
  }

  return {
    titulo_guia: tituloGuia,
    contexto_motivacional: String(record.contexto_motivacional || '').trim(),
    nivel_apoyo: ensureStringArray(record.nivel_apoyo, 'nivel_apoyo'),
    nivel_estandar: ensureStringArray(record.nivel_estandar, 'nivel_estandar'),
    nivel_desafio: ensureStringArray(record.nivel_desafio, 'nivel_desafio'),
  };
}

function validateLessonContent(value: unknown): LessonContent {
  if (!value || typeof value !== 'object') {
    throw new Error('La respuesta de IA no es un objeto.');
  }

  const record = value as Record<string, unknown>;
  const titulo = String(record.titulo || '').trim();
  if (!titulo) throw new Error('El campo titulo es obligatorio.');

  return {
    titulo,
    curso: String(record.curso || '').trim(),
    asignatura: String(record.asignatura || '').trim(),
    objetivoAprendizaje: String(record.objetivoAprendizaje || '').trim(),
    habilidadBloom: String(record.habilidadBloom || '').trim(),
    inicio: String(record.inicio || '').trim(),
    desarrollo: String(record.desarrollo || '').trim(),
    cierre: String(record.cierre || '').trim(),
    recursos: ensureStringArray(record.recursos, 'recursos'),
    evaluacionFormativa: String(record.evaluacionFormativa || '').trim(),
    adecuacionesDUA: String(record.adecuacionesDUA || '').trim(),
  };
}

function buildFallbackDuaGuide(plan: PedagogicalPlan): DuaGuide {
  return {
    titulo_guia: `Guía Multinivel: ${plan.tema}`,
    contexto_motivacional: `Conectar el tema "${plan.tema}" con la vida real de los estudiantes para despertar su interés y relevancia.`,
    nivel_apoyo: [
      `Fichas paso a paso con vocabulario clave y ejemplos concretos para resolver actividades básicas.`,
      `Esquemas visuales y organizadores gráficos para entender el tema principal.`,
      `Temporizador visible y apoyos físicos (tarjetas, paletas) para indicar el paso a paso.`,
    ],
    nivel_estandar: [
      `Realizar una explicación guiada del tema con imágenes y analogías relevantes.`,
      `Actividad colaborativa de intercambio de ideas y retroalimentación entre pares.`,
      `Discusión grupal y escritura reflexiva sobre el tema en contexto.`,
    ],
    nivel_desafio: [
      `Análisis crítico del tema con propuestas de solución para desafíos reales.`,
      `Generar un producto de creación construyendo algo que muestre comprensión profunda y originalidad.`,
      `Presentar un debate o simulación de roles mostrando aplicación a contextos alternativos.`,
    ],
  };
}

function buildFallbackLessonContent(plan: PedagogicalPlan): LessonContent {
  return {
    titulo: plan.tema,
    curso: plan.curso,
    asignatura: plan.asignatura,
    objetivoAprendizaje: plan.objetivo_aprendizaje,
    habilidadBloom: plan.taxonomia_bloom_sugerida,
    inicio: plan.estructura_clase.inicio.descripcion,
    desarrollo: plan.estructura_clase.desarrollo.descripcion,
    cierre: plan.estructura_clase.cierre.descripcion,
    recursos: ['Pizarra o proyector', 'Material de la asignatura', 'Cuaderno del estudiante'],
    evaluacionFormativa: 'Pregunta de verificación al cierre de la clase para comprobar comprensión del objetivo.',
    adecuacionesDUA: 'Ofrecer opciones de representación (visual, auditiva, kinestésica) y flexibilidad en la presentación de evidencias.',
  };
}

async function callAI(
  env: AIEngineEnv,
  systemPrompt: string,
  plan: PedagogicalPlan,
): Promise<string> {
  if (!env.AI) {
    throw new Error('AI no está configurado en el entorno.');
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: JSON.stringify(plan, null, 2) },
  ];

  const response = await env.AI.run(MODEL, {
    messages,
    temperature: 0.2,
    max_tokens: 1500,
  });

  const responseText =
    typeof response === 'string'
      ? response
      : typeof response === 'object' && response !== null
        ? JSON.stringify((response as Record<string, unknown>).response ?? response)
        : String(response);

  return responseText;
}

export class AIEngine {
  static async generateDuaGuide(env: AIEngineEnv, plan: PedagogicalPlan): Promise<DuaGuide> {
    try {
      const raw = await callAI(env, SYSTEM_PROMPT_DUA, plan);
      const parsed = extractJsonFromText(raw);
      if (!parsed) {
        console.warn('[AIEngine] generateDuaGuide: respuesta vacía, usando fallback');
        return buildFallbackDuaGuide(plan);
      }

      const parsedJson = JSON.parse(parsed) as unknown;
      return validateDuaGuide(parsedJson);
    } catch (error) {
      console.error('[AIEngine] generateDuaGuide error:', error);
      return buildFallbackDuaGuide(plan);
    }
  }

  static async generateLessonContent(
    env: AIEngineEnv,
    plan: PedagogicalPlan,
  ): Promise<LessonContent> {
    try {
      const raw = await callAI(env, SYSTEM_PROMPT_LESSON, plan);
      const parsed = extractJsonFromText(raw);
      if (!parsed) {
        console.warn('[AIEngine] generateLessonContent: respuesta vacía, usando fallback');
        return buildFallbackLessonContent(plan);
      }

      const parsedJson = JSON.parse(parsed) as unknown;
      return validateLessonContent(parsedJson);
    } catch (error) {
      console.error('[AIEngine] generateLessonContent error:', error);
      return buildFallbackLessonContent(plan);
    }
  }
}

export function generateDuaGuide(env: AIEngineEnv, plan: PedagogicalPlan): Promise<DuaGuide> {
  return AIEngine.generateDuaGuide(env, plan);
}

export function generateLessonContent(
  env: AIEngineEnv,
  plan: PedagogicalPlan,
): Promise<LessonContent> {
  return AIEngine.generateLessonContent(env, plan);
}
