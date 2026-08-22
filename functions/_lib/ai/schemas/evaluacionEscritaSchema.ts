import { z } from 'zod';

/**
 * Contrato de IA para EvaluacionEscritaAI — EvaluacionEscritaEngine.
 *
 * Cubre las evaluaciones escritas de pregunta-y-pauta: formativa, sumativa,
 * diagnóstica y tipo SIMCE (materials/evaluation.ts + EvaluacionesView.tsx,
 * tipos "sumativa"/"diagnostica"/"simce"/"banco_preguntas"). Antes ninguno de
 * estos caminos llamaba a IA real (buildEvaluation() en materials/evaluation.ts
 * era 100% texto fijo: "Alternativa correcta", "Pregunta de selección
 * múltiple sobre X" para cualquier tema).
 *
 * Esquema deliberadamente NO discriminado por `type` (a diferencia de
 * PptDeckSchema) porque el modelo mezcla los 3 tipos de pregunta en una
 * misma evaluación y algunos campos son opcionales según el tipo; el engine
 * valida por-pregunta en enrich() en vez de rechazar toda la respuesta si
 * un campo opcional falta.
 */

export const EvaluacionEscritaQuestionSchema = z.object({
  type: z.enum(['alternativa', 'verdadero_falso', 'desarrollo']),
  text: z.string().min(10, 'La pregunta debe tener contenido suficiente (mín. 10 caracteres)').max(500),
  // Solo "alternativa"
  options: z.array(z.object({
    text: z.string().min(1).max(200),
    isCorrect: z.boolean(),
  })).min(3).max(5).optional(),
  // Solo "verdadero_falso"
  answer: z.enum(['V', 'F']).optional(),
  justification_if_false: z.string().max(300).optional(),
  // Solo "desarrollo"
  sample_answer: z.string().max(500).optional(),
  criteria: z.array(z.string().max(200)).max(4).optional(),
});

export type EvaluacionEscritaQuestionAI = z.infer<typeof EvaluacionEscritaQuestionSchema>;

export const EvaluacionEscritaAISchema = z.object({
  title: z.string().min(5, 'El título es requerido').max(150),
  instructions: z.string().min(10, 'Las instrucciones son requeridas').max(500),
  questions: z.array(EvaluacionEscritaQuestionSchema).min(3).max(20),
});

export type EvaluacionEscritaAI = z.infer<typeof EvaluacionEscritaAISchema>;
