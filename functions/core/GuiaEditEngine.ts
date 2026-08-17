import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import type { GuiaResult } from './GuiaEngine';
import { GuiaEditResponseSchema } from '../_lib/ai/schemas/guiaEditSchema';

export interface GuiaEditOptions {
  guia: GuiaResult;
  instruccion: string;
  seccionIndex?: number;
  level: string;
  subject: string;
}

export interface GuiaEditResult {
  guia: GuiaResult;
  // -1 cuando no se pudo aplicar el cambio (fallback) — nunca un índice
  // real de sección, para que el caller distinga "no cambió nada" de
  // "cambió la sección 0" sin tener que comparar el contenido.
  seccionModificada: number;
  explicacion: string;
}

const FALLBACK_EXPLICACION = 'No pude aplicar el cambio — intenta con una instrucción más específica.';

function buildSystemPrompt(): string {
  return `Eres un asistente pedagógico. El profesor te da una instrucción para modificar esta guía. Modifica SOLO la sección más relevante, preservando el estilo y nivel del resto. Devuelve solo la sección modificada con su índice.

REGLAS OBLIGATORIAS:
1. No modifiques ninguna otra sección: tu respuesta contiene únicamente la sección editada, no la guía completa.
2. Conserva el tono, el registro y el nivel de dificultad del resto de la guía — la sección editada debe sentirse escrita por la misma persona.
3. Si el profesor pide algo que no corresponde a ninguna sección existente, elige la sección más cercana a su intención en vez de inventar una nueva.
4. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones antes o después del JSON.

ESTRUCTURA JSON OBLIGATORIA:
{
  "seccionModificada": 0,
  "seccionNueva": {
    "title": "Título de la sección (mantenlo igual salvo que la instrucción pida cambiarlo)",
    "content": "Contenido actualizado de la sección",
    "activities": ["Paso o ítem 1", "Paso o ítem 2"]
  },
  "explicacion": "1-2 oraciones explicando qué cambiaste y por qué"
}

"activities" es opcional: solo inclúyelo si la sección original ya lo traía o si la instrucción pide agregar pasos/ítems.`;
}

function buildUserPrompt(opciones: GuiaEditOptions): string {
  const payload: Record<string, unknown> = {
    nivel: opciones.level,
    asignatura: opciones.subject,
    guia: {
      title: opciones.guia.title,
      objective: opciones.guia.objective,
      sections: opciones.guia.sections.map((section, index) => ({ index, ...section })),
    },
    instruccion_profesor: opciones.instruccion,
  };

  if (opciones.seccionIndex !== undefined) {
    payload.nota = `Debes modificar EXCLUSIVAMENTE la sección de índice ${opciones.seccionIndex}. Tu respuesta debe traer "seccionModificada": ${opciones.seccionIndex}.`;
  }

  return JSON.stringify(payload, null, 2);
}

// ─── Punto de entrada único ───
// Mismo patrón try/catch → fallback que generateGuia (GuiaEngine.ts) y
// generateFichasDua (FichasDuaEngine.ts), pero el "fallback" acá no es una
// guía determinista alternativa: es simplemente devolver la guía sin
// cambios + una explicación clara de que no se pudo aplicar la edición,
// porque no existe una heurística razonable para "adivinar" qué quiso
// pedir el profesor sin la IA.
export async function editSeccionGuia(env: AIEngineEnv, opciones: GuiaEditOptions): Promise<GuiaEditResult> {
  const totalSecciones = opciones.guia.sections.length;

  if (opciones.seccionIndex !== undefined && (opciones.seccionIndex < 0 || opciones.seccionIndex >= totalSecciones)) {
    return { guia: opciones.guia, seccionModificada: -1, explicacion: FALLBACK_EXPLICACION };
  }

  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(),
      buildUserPrompt(opciones),
      GuiaEditResponseSchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', maxTokens: 1500 },
    );

    // seccionIndex explícito manda siempre sobre lo que la IA haya
    // decidido devolver en data.seccionModificada — si el profesor ya
    // eligió la sección desde la UI, no dejamos que la IA la reinterprete.
    const index = opciones.seccionIndex ?? data.seccionModificada;
    if (index < 0 || index >= totalSecciones) {
      return { guia: opciones.guia, seccionModificada: -1, explicacion: FALLBACK_EXPLICACION };
    }

    const sections = opciones.guia.sections.map((section, i) => (i === index ? data.seccionNueva : section));

    return {
      guia: { ...opciones.guia, sections },
      seccionModificada: index,
      explicacion: data.explicacion,
    };
  } catch (error) {
    console.error('[GuiaEditEngine] editSeccionGuia error:', error);
    return { guia: opciones.guia, seccionModificada: -1, explicacion: FALLBACK_EXPLICACION };
  }
}
