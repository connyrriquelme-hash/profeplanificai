import { z } from 'zod';
import { GuideSectionSchema } from './guiaSchema';

/**
 * Contrato de IA para la edición puntual de una sección de guía
 * (GuiaEditEngine). A diferencia de GuiaEstudianteAISchema/GuiaDocenteAISchema
 * (guiaSchema.ts), esto no valida una guía completa: la IA solo devuelve UNA
 * sección modificada + su índice, así que reusa GuideSectionSchema tal cual
 * (sin los superRefine posicionales de "debe ser exactamente Introducción",
 * etc.) porque la sección editada puede ser cualquiera de las que ya existen
 * en la guía, no una nueva con un rol fijo.
 */

export const GuiaEditResponseSchema = z.object({
  seccionModificada: z.number().int().min(0, 'El índice de sección debe ser 0 o mayor'),
  seccionNueva: GuideSectionSchema,
  explicacion: z.string()
    .min(10, 'La explicación debe tener al menos 10 caracteres')
    .max(400, 'Máximo 400 caracteres (1-2 oraciones)'),
});

export type GuiaEditResponse = z.infer<typeof GuiaEditResponseSchema>;
