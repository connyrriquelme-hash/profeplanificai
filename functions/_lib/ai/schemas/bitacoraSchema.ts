import { z } from 'zod';

/**
 * Contrato de IA para BitacoraAI — BitacoraEngine.
 *
 * La bitácora científica ya trae una estructura fija por tramo etario
 * (Prebásica / 1°-6° / 7°-8° / Media) con secciones y campos de formulario
 * — eso es scaffold de la app, no contenido, y no requiere IA (igual que
 * responseOptions en ListaCotejoEngine o colors en SemaforoEngine). Lo que
 * la IA aporta son las 4 consignas del proceso científico (hipótesis,
 * observaciones, resultados, conclusión), específicas al OA/tema de la
 * clase de hoy — consignas que el estudiante lee antes de registrar SU
 * PROPIO proceso, nunca respuestas pre-llenadas.
 */

export const BitacoraAISchema = z.object({
  hipotesis: z.string()
    .min(15, 'La consigna debe tener contenido suficiente (mín. 15 caracteres)')
    .max(300, 'Máximo 300 caracteres')
    .describe('Consigna específica al tema para formular la hipótesis'),
  observaciones: z.string()
    .min(15, 'La consigna debe tener contenido suficiente (mín. 15 caracteres)')
    .max(300, 'Máximo 300 caracteres')
    .describe('Consigna específica al tema para registrar observaciones durante el experimento'),
  resultados: z.string()
    .min(15, 'La consigna debe tener contenido suficiente (mín. 15 caracteres)')
    .max(300, 'Máximo 300 caracteres')
    .describe('Consigna específica al tema para organizar y registrar los resultados'),
  conclusion: z.string()
    .min(15, 'La consigna debe tener contenido suficiente (mín. 15 caracteres)')
    .max(300, 'Máximo 300 caracteres')
    .describe('Consigna específica al tema para redactar la conclusión'),
});

export type BitacoraAI = z.infer<typeof BitacoraAISchema>;
