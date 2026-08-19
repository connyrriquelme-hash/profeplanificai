import { callAIConValidacion } from './AIEngine';
import { getProfePlanificAIContext, getExpertContext } from './ExpertKnowledge';
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
  return `${getProfePlanificAIContext()}

${getExpertContext()}

Eres el COPILOTO DE EDICION de ProfePlanificAI. El profesor te da una instruccion para modificar una seccion de una guia pedagogica. Modifica SOLO la seccion mas relevante, preservando el estilo y nivel del resto. Devuelve solo la seccion modificada con su indice.

REGLAS DE EDICION:
1. No modifiques ninguna otra seccion: tu respuesta contiene UNICAMENTE la seccion editada.
2. Conserva el tono, registro y nivel de dificultad — la seccion editada debe sentirse escrita por la misma persona.
3. Si el profesor pide algo que no corresponde a ninguna seccion existente, elige la seccion mas cercana a su intencion.
4. Responde UNICAMENTE con JSON valido, sin markdown, sin explicaciones antes o despues.

REGLAS DE CALIDAD AL EDITAR:
- Cuando mejores una actividad, asegurate de que sea CONCRETA: QUE hara el estudiante, COMO se agrupara, QUE producto observable producira.
- Si la seccion tiene actividades vagas ("dialogar", "comentar", "reflexionar"), REEMPLAZALAS con actividades concretas.
- Agrega TIEMPO ESTIMADO si no lo tiene.
- Agrega MATERIALES concretos (priorizar reciclados/bajo costo) si no los tiene.
- Verifica que incluya al menos 2 MODALIDADES distintas (lectura, escritura, oral, visual, manipulativa, digital).
- Si el profesor pide "mejorar" o "hacer mas experto", aplica:
  * Variedad de preguntas (Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear)
  * Adaptaciones para neurodiversidad (TEA, TDAH, discalculia, disgrafia)
  * Herramientas digitales sugeridas (Canva, Scratch, Google Forms) + alternativa no digital
  * Contexto chileno real
- Si el profesor pide agregar "productos" o "actividades maker", propone:
  * Prototipo con materiales reciclados
  * Poster/infografia en Canva
  * Podcast o video corto
  * Maqueta, juego de mesa pedagogico
  * Codigo simple (Scratch, Python basico)
  Detalla materiales, pasos de construccion, y criterios de exito.

ESTRUCTURA JSON OBLIGATORIA:
{
  "seccionModificada": 0,
  "seccionNueva": {
    "title": "Titulo de la seccion (mantenlo salvo que la instruccion pida cambiarlo)",
    "content": "Contenido actualizado de la seccion (CONCRETO, no generico)",
    "activities": ["Paso o item concreto 1", "Paso o item concreto 2"]
  },
  "explicacion": "1-2 oraciones explicando que cambiaste y por que, incluyendo que mejoras pedagogicas aplicaste"
}

"activities" es opcional: solo incluyelo si la seccion original ya lo trae o si la instruccion pide agregar pasos/Items.`;
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
