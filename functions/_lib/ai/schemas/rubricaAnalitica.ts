import { z } from 'zod';

// Schema separado de `./rubrica.ts` (RubricaSchema) a propósito: ese schema
// pertenece al pipeline de "Mis Clases" (orchestrator.ts, SCHEMA_REGISTRY) y
// tiene una forma incompatible (descriptions: string[] planos vs. el
// indicators[] rico por nivel que consume PremiumRubricPreview.tsx). Este
// schema modela exactamente lo que la IA debe producir para RubricaEngine.ts
// (Paso 5 / functions/api/materials/rubric.ts).

export const RUBRIC_LEVEL_IDS = ['avanzado', 'adecuado', 'en_desarrollo', 'inicial'] as const;

const RubricIndicatorAISchema = z.object({
  levelId: z.enum(RUBRIC_LEVEL_IDS)
    .describe('Debe ser EXACTAMENTE uno de estos 4 valores, sin variaciones: avanzado, adecuado, en_desarrollo, inicial. El frontend hace match exacto por string; cualquier otro valor hace que el indicador no se muestre.'),
  descriptor: z.string().min(20, 'El descriptor debe ser específico y observable, no genérico').max(400)
    .describe('Descripción observable y medible del desempeño en este nivel, específica al criterio y al OA (no una frase genérica tipo "cumple parcialmente")'),
  evidence: z.string().min(8).max(250)
    .describe('Evidencia concreta que el docente puede observar para verificar este nivel (ej: tipo de producto, registro, respuesta esperada)'),
  feedbackSuggestion: z.string().min(8).max(250)
    .describe('Frase de retroalimentación formativa sugerida para el docente, en segunda persona, orientada al estudiante'),
});

const RubricCriterionAISchema = z.object({
  id: z.string().min(1).max(20).describe('Identificador corto del criterio, ej: c1, c2'),
  name: z.string().min(5, 'El nombre del criterio no puede ser genérico').max(120)
    .describe('Nombre de la dimensión evaluada, específica al OA y tema (no "Criterio 1" ni "Comprensión general")'),
  description: z.string().min(10).max(300)
    .describe('Qué evalúa este criterio en relación directa al OA y tema de la clase'),
  weight: z.number().positive().max(100).describe('Peso relativo del criterio dentro de la rúbrica'),
  indicators: z.array(RubricIndicatorAISchema)
    .length(4, 'Cada criterio debe tener EXACTAMENTE 4 indicadores, uno por nivel de desempeño')
    .describe('Un indicador por cada uno de los 4 niveles fijos (avanzado, adecuado, en_desarrollo, inicial), sin repetir levelId'),
}).refine(
  (c) => new Set(c.indicators.map((i) => i.levelId)).size === 4,
  { message: 'Los 4 indicators deben cubrir los 4 levelId distintos, sin duplicados ni omisiones' },
);

export const RubricaAnaliticaAISchema = z.object({
  learningGoal: z.string().min(15).max(300)
    .describe('Meta de aprendizaje reformulada para el docente, ligada al OA real, nunca copiada literalmente del texto oficial'),
  studentFriendlyGoal: z.string().min(10).max(250)
    .describe('La misma meta reformulada en lenguaje simple dirigido al estudiante'),
  criteria: z.array(RubricCriterionAISchema)
    .min(2, 'Debe haber al menos 2 criterios')
    .max(10, 'Máximo 10 criterios'),
  usageInstructions: z.array(z.string().min(10)).min(3).max(8)
    .describe('Pasos concretos para que el docente use la rúbrica'),
  inclusiveAdjustments: z.array(z.string().min(10)).min(3).max(8)
    .describe('Adecuaciones de acceso/DUA concretas, no genéricas, pertinentes al nivel y asignatura'),
  studentSelfAssessment: z.object({
    title: z.string().min(3).max(80),
    prompts: z.array(z.string().min(5)).min(3).max(8),
  }),
});

export type RubricaAnaliticaAI = z.infer<typeof RubricaAnaliticaAISchema>;
export type RubricCriterionAI = z.infer<typeof RubricCriterionAISchema>;
export type RubricIndicatorAI = z.infer<typeof RubricIndicatorAISchema>;
