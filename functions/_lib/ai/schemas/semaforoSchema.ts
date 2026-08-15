import { z } from 'zod';

/**
 * Contrato de IA para SemaforoAI — SemaforoEngine.
 *
 * El semáforo de comprensión evalúa 3-5 indicadores de logro del OA; para
 * cada uno el estudiante marca 🟢/🟡/🔴. El selector de colores (ícono +
 * significado + acción genéricos) es UI fija compartida por todos los
 * aspectos — ver SemaforoEngine.ts:FIXED_COLORS — porque el renderer
 * (FormativeEvaluationPreview.tsx / exportEvaluationWord.ts) solo soporta
 * un colors[] global, no niveles distintos por aspecto. Para cumplir con
 * "3 niveles concretos y observables por indicador" sin romper ese
 * contrato, la IA describe los 3 niveles (rojo/amarillo/verde) de CADA
 * aspecto en un solo texto compacto ("levels"), que el engine mapea al
 * campo aspects[].indicator ya soportado por el renderer.
 */

export const SemaforoAspectSchema = z.object({
  description: z.string()
    .min(10, 'El indicador debe tener contenido suficiente (mín. 10 caracteres)')
    .max(150, 'Máximo 150 caracteres')
    .describe('El indicador de logro, concreto y ligado al OA/tema'),
  levels: z.string()
    .min(20, 'La descripción de niveles debe tener contenido suficiente (mín. 20 caracteres)')
    .max(350, 'Máximo 350 caracteres')
    .describe('Descripción concreta y observable de los 3 niveles (🔴/🟡/🟢) para este indicador, en una sola línea'),
});

export type SemaforoAspectAI = z.infer<typeof SemaforoAspectSchema>;

export const SemaforoAISchema = z.object({
  title: z.string().min(5, 'El título es requerido').max(120, 'Máximo 120 caracteres'),
  aspects: z.array(SemaforoAspectSchema)
    .min(3, 'Debe haber entre 3 y 5 indicadores')
    .max(5, 'Debe haber entre 3 y 5 indicadores'),
});

export type SemaforoAI = z.infer<typeof SemaforoAISchema>;
