import { z } from 'zod';

/**
 * Contrato de IA para Format321AI — Format321Engine.
 *
 * El Formato 3-2-1 es una rutina de metacognición de cierre de clase: el
 * estudiante escribe 3 cosas que aprendió, 2 que le interesaron y 1 pregunta
 * que le queda, en líneas en blanco bajo cada consigna. La IA NO genera las
 * respuestas del estudiante (no tendría sentido pedagógico pre-llenar lo que
 * "aprendió") — genera las 3 consignas, específicas al tema de la clase de
 * hoy en vez de la instrucción genérica de la plantilla anterior. El
 * consumidor (FormativeEvaluationPreview.tsx, exportEvaluationWord.ts) solo
 * lee sections[].description como el texto de la consigna.
 */

export const Format321AISchema = z.object({
  title: z.string().min(5, 'El título es requerido').max(120, 'Máximo 120 caracteres'),
  learned: z.string()
    .min(15, 'La consigna debe tener contenido suficiente (mín. 15 caracteres)')
    .max(300, 'Máximo 300 caracteres')
    .describe('Consigna específica al tema para "3 cosas que aprendí"'),
  interesting: z.string()
    .min(15, 'La consigna debe tener contenido suficiente (mín. 15 caracteres)')
    .max(300, 'Máximo 300 caracteres')
    .describe('Consigna específica al tema para "2 cosas que me interesaron"'),
  question: z.string()
    .min(15, 'La consigna debe tener contenido suficiente (mín. 15 caracteres)')
    .max(300, 'Máximo 300 caracteres')
    .describe('Consigna específica al tema invitando a escribir 1 pregunta'),
});

export type Format321AI = z.infer<typeof Format321AISchema>;
