import { z } from 'zod';

/**
 * Contrato de IA para FichasDuaEngine — fichas de trabajo diferenciadas por
 * nivel (apoyo/estándar/desafío), generadas a partir de un DuaGuide YA
 * EXISTENTE (functions/core/types.ts:45-72). No reemplaza a DuaGuide: lo
 * enriquece con vocabulario, actividades reformuladas en 2da persona y
 * autoevaluación específica por nivel, pensado para imprimir una ficha por
 * estudiante en vez del documento DUA completo.
 */

const VocabularioTerminoSchema = z.object({
  termino: z.string().min(2, 'El término debe tener al menos 2 caracteres').max(60, 'Máximo 60 caracteres'),
  definicion: z.string().min(5, 'La definición debe tener al menos 5 caracteres').max(300, 'Máximo 300 caracteres'),
});

export type VocabularioTermino = z.infer<typeof VocabularioTerminoSchema>;

const ActividadFichaSchema = z.object({
  instruccion: z.string().min(5, 'La instrucción debe tener al menos 5 caracteres').max(400, 'Máximo 400 caracteres'),
  espacioRespuesta: z.boolean(),
});

export type ActividadFicha = z.infer<typeof ActividadFichaSchema>;

const BaseFichaSchema = z.object({
  titulo: z.string().min(5, 'El título es requerido').max(150, 'Máximo 150 caracteres'),
  objetivo: z.string()
    .min(10, 'El objetivo debe tener al menos 10 caracteres')
    .max(400, 'Máximo 400 caracteres')
    .describe('OA reformulado en lenguaje apropiado para este nivel específico'),
  vocabularioClave: z.array(VocabularioTerminoSchema)
    .min(2, 'Debe haber al menos 2 términos de vocabulario')
    .max(4, 'Máximo 4 términos de vocabulario'),
  actividades: z.array(ActividadFichaSchema)
    .min(2, 'Debe haber al menos 2 actividades')
    .max(6, 'Máximo 6 actividades'),
  autoevaluacion: z.array(
    z.string().min(5, 'La pregunta debe tener al menos 5 caracteres').max(150, 'Máximo 150 caracteres'),
  )
    .min(2, 'Debe haber al menos 2 preguntas de autoevaluación')
    .max(3, 'Máximo 3 preguntas de autoevaluación')
    .describe('Preguntas en primera persona del estudiante: "Puedo...", "Todavía me cuesta..."'),
});

export const FichaDiferenciadaSchema = BaseFichaSchema.extend({
  nivel: z.enum(['apoyo', 'estandar', 'desafio']),
});

export type FichaDiferenciada = z.infer<typeof FichaDiferenciadaSchema>;

// El nivel de cada ficha se fija por literal en vez de validarse con
// superRefine porque, a diferencia de guiaSchema.ts (secciones posicionales
// dentro de un array), aquí cada nivel ya vive en su propia clave de objeto
// (apoyo/estandar/desafio) — el literal por clave es suficiente para
// garantizar que la IA no mezcle el campo "nivel" entre fichas.
export const FichasDuaSchema = z.object({
  apoyo: BaseFichaSchema.extend({ nivel: z.literal('apoyo') }),
  estandar: BaseFichaSchema.extend({ nivel: z.literal('estandar') }),
  desafio: BaseFichaSchema.extend({ nivel: z.literal('desafio') }),
});

export type FichasDua = z.infer<typeof FichasDuaSchema>;
