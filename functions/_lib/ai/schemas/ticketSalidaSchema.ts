import { z } from 'zod';

/**
 * Contrato de IA para TicketSalidaAI — TicketSalidaEngine.
 *
 * El ticket de salida es la evaluación breve de cierre de clase: cada
 * pregunta debe verificar si el estudiante logró el objetivo de la clase de
 * hoy, no ser una reflexión genérica. La IA solo genera título + preguntas
 * de contenido (tipo "open"); la pregunta final de autoevaluación
 * (semáforo 🟢🟡🔴) es un mecanismo de UI fijo que compone el engine, no
 * requiere IA — ver TicketSalidaEngine.ts:composeQuestions.
 */

export const TicketSalidaQuestionSchema = z.object({
  question: z.string()
    .min(10, 'La pregunta debe tener contenido suficiente (mín. 10 caracteres)')
    .max(200, 'Máximo 200 caracteres'),
});

export type TicketSalidaQuestionAI = z.infer<typeof TicketSalidaQuestionSchema>;

export const TicketSalidaAISchema = z.object({
  title: z.string().min(5, 'El título es requerido').max(120, 'Máximo 120 caracteres'),
  questions: z.array(TicketSalidaQuestionSchema)
    .min(3, 'Debe haber entre 3 y 5 preguntas')
    .max(5, 'Debe haber entre 3 y 5 preguntas'),
});

export type TicketSalidaAI = z.infer<typeof TicketSalidaAISchema>;
