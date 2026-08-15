import { z } from 'zod';

/**
 * Contrato de IA para ListaCotejoAI — ListaCotejoEngine.
 *
 * La lista de cotejo es una autoevaluación de cierre: el estudiante marca
 * Sí / En proceso / No frente a cada criterio (esa marca es UI fija, ver
 * ListaCotejoEngine.ts:composeCriteria). La IA solo genera título + los 5-8
 * criterios, cada uno un logro observable y concreto ligado al OA/tema —
 * nunca genérico como "participa en clase".
 */

export const ListaCotejoCriterionSchema = z.object({
  description: z.string()
    .min(10, 'El criterio debe tener contenido suficiente (mín. 10 caracteres)')
    .max(200, 'Máximo 200 caracteres'),
});

export type ListaCotejoCriterionAI = z.infer<typeof ListaCotejoCriterionSchema>;

export const ListaCotejoAISchema = z.object({
  title: z.string().min(5, 'El título es requerido').max(120, 'Máximo 120 caracteres'),
  criteria: z.array(ListaCotejoCriterionSchema)
    .min(5, 'Debe haber entre 5 y 8 criterios')
    .max(8, 'Debe haber entre 5 y 8 criterios'),
});

export type ListaCotejoAI = z.infer<typeof ListaCotejoAISchema>;
