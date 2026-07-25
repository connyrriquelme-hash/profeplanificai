import { z } from 'zod';

/**
 * Contrato pedagógico estricto para Evaluaciones.
 *
 * Obliga a que el LLM devuelva evaluaciones con:
 *  - Metadata completa y coherente
 *  - Preguntas variadas con tipos restringidos
 *  - 4 alternativas exactas para selección múltiple (solo 1 correcta)
 *  - Distractores plausibles
 *  - Justificación obligatoria para V/F cuando la respuesta es F
 *  - Rúbrica de corrección para preguntas de desarrollo
 *  - Pauta de corrección consolidada
 */

// ─── Opción de alternativa ───

const AlternativeOptionSchema = z.object({
  text: z.string()
    .min(5, 'El texto de la alternativa debe tener al menos 5 caracteres')
    .max(300, 'Máximo 300 caracteres por alternativa')
    .describe('Texto de la alternativa'),

  isCorrect: z.boolean()
    .describe('true SOLO para la respuesta correcta'),
});

// ─── Pregunta de tipo alternativa ───

const AlternativaQuestionSchema = z.object({
  number: z.number().int().positive(),
  type: z.literal('alternativa'),
  text: z.string()
    .min(10, 'El enunciado debe tener al menos 10 caracteres')
    .max(500, 'Máximo 500 caracteres por enunciado')
    .describe('Enunciado claro y sin ambigüedades'),
  options: z.array(AlternativeOptionSchema)
    .length(4, 'Debe haber exactamente 4 alternativas (A, B, C, D)')
    .describe('4 alternativas con exactamente 1 correcta'),
  score: z.number()
    .positive('El puntaje debe ser positivo')
    .max(20, 'Máximo 20 puntos por pregunta')
    .describe('Puntaje de la pregunta'),
  indicator: z.string()
    .min(3, 'El indicador es requerido')
    .max(200, 'Máximo 200 caracteres')
    .describe('Indicador de aprendizaje evaluado'),
  skill: z.string()
    .min(3, 'La habilidad es requerida')
    .max(100, 'Máximo 100 caracteres')
    .describe('Habilidad evaluada'),
}).refine(
  (data) => {
    const correctCount = data.options.filter((o) => o.isCorrect).length;
    return correctCount === 1;
  },
  { message: 'Debe haber exactamente 1 alternativa correcta (isCorrect: true)' },
);

// ─── Pregunta de tipo verdadero/falso ───

const VFQuestionSchema = z.object({
  number: z.number().int().positive(),
  type: z.literal('verdadero_falso'),
  text: z.string()
    .min(10, 'El enunciado debe tener al least 10 caracteres')
    .max(500, 'Máximo 500 caracteres por enunciado')
    .describe('Afirmación para evaluar si es verdadera o falsa'),
  answer: z.enum(['V', 'F'], {
    errorMap: () => ({ message: 'La respuesta debe ser "V" (verdadero) o "F" (falso)' }),
  }),
  justification_if_false: z.string()
    .min(15, 'Si la respuesta es F, la justificación debe tener al menos 15 caracteres')
    .max(400, 'Máximo 400 caracteres para la justificación')
    .describe('Justificación que el estudiante debe dar si marca Falso')
    .optional(),
  score: z.number()
    .positive('El puntaje debe ser positivo')
    .max(20, 'Máximo 20 puntos por pregunta')
    .describe('Puntaje de la pregunta'),
  indicator: z.string()
    .min(3, 'El indicador es requerido')
    .max(200)
    .describe('Indicador de aprendizaje evaluado'),
  skill: z.string()
    .min(3, 'La habilidad es requerida')
    .max(100)
    .describe('Habilidad evaluada'),
}).refine(
  (data) => {
    if (data.answer === 'F') {
      return data.justification_if_false !== undefined && data.justification_if_false.length >= 15;
    }
    return true;
  },
  { message: 'Si la respuesta es "F", justification_if_false es obligatoria (mín. 15 caracteres)' },
);

// ─── Pregunta de tipo desarrollo ───

const DesarrolloQuestionSchema = z.object({
  number: z.number().int().positive(),
  type: z.literal('desarrollo'),
  text: z.string()
    .min(15, 'El enunciado debe tener al menos 15 caracteres')
    .max(500, 'Máximo 500 caracteres por enunciado')
    .describe('Pregunta abierta que requiere respuesta escrita'),
  score: z.number()
    .positive('El puntaje debe ser positivo')
    .max(20, 'Máximo 20 puntos por pregunta')
    .describe('Puntaje de la pregunta'),
  indicator: z.string()
    .min(3, 'El indicador es requerido')
    .max(200)
    .describe('Indicador de aprendizaje evaluado'),
  skill: z.string()
    .min(3, 'La habilidad es requerida')
    .max(100)
    .describe('Habilidad evaluada'),
  teacher_rubric: z.object({
    criteria: z.array(z.string().min(10))
      .min(2, 'Debe haber al menos 2 criterios de corrección')
      .max(5, 'Máximo 5 criterios por pregunta')
      .describe('Criterios específicos para que el docente evalúe la respuesta'),
    sample_answer: z.string()
      .min(20, 'La respuesta modelo debe tener al menos 20 caracteres')
      .max(1000, 'Máximo 1000 caracteres')
      .describe('Respuesta modelo orientativa para el docente'),
    scoring_guide: z.string()
      .min(10, 'La guía de puntaje es requerida')
      .max(300, 'Máximo 300 caracteres')
      .describe('Cómo distribuir el puntaje según calidad de respuesta'),
  }).describe('Rúbrica de corrección para el docente'),
});

// ─── Unión discriminada de preguntas ───

const QuestionSchema = z.discriminatedUnion('type', [
  AlternativaQuestionSchema,
  VFQuestionSchema,
  DesarrolloQuestionSchema,
]);

// ─── Metadata de la evaluación ───

const EvaluationMetadataSchema = z.object({
  course: z.string()
    .min(3, 'El curso es requerido')
    .max(50, 'Máximo 50 caracteres')
    .describe('Curso al que va dirigida la evaluación (ej: "3° Básico")'),
  subject: z.string()
    .min(3, 'La asignatura es requerida')
    .max(50, 'Máximo 50 caracteres')
    .describe('Asignatura evaluada'),
  unit: z.string()
    .min(3, 'La unidad es requerida')
    .max(100, 'Máximo 100 caracteres')
    .describe('Nombre de la unidad didáctica'),
  oa: z.string()
    .min(5, 'El OA es requerido')
    .max(200, 'Máximo 200 caracteres')
    .describe('Objetivo de aprendizaje evaluado (código MINEDUC)'),
  total_score: z.number()
    .positive('El puntaje total debe ser positivo')
    .max(100, 'Máximo 100 puntos')
    .describe('Puntaje total de la evaluación'),
  type: z.enum(['formativa', 'sumativa', 'diagnostica'], {
    errorMap: () => ({ message: 'Tipo debe ser: formativa, sumativa o diagnostica' }),
  }),
  time_limit: z.string()
    .optional()
    .describe('Tiempo límite sugerido (ej: "45 minutos")'),
});

// ─── Pauta de corrección consolidada ───

const AnswerKeySchema = z.object({
  summary: z.string()
    .min(20, 'El resumen de la pauta debe tener al menos 20 caracteres')
    .max(1000, 'Máximo 1000 caracteres')
    .describe('Resumen consolidado de la pauta para el docente'),
  question_answers: z.array(z.object({
    number: z.number().int().positive(),
    correct_answer: z.string().min(1, 'La respuesta correcta es requerida'),
    explanation: z.string().min(10, 'La explicación debe tener al menos 10 caracteres'),
  }))
    .min(1, 'Debe haber al menos 1 respuesta en la pauta')
    .describe('Respuestas correctas pregunta por pregunta'),
  total_points: z.number()
    .positive('El puntaje total debe ser positivo')
    .describe('Total de puntos de la evaluación'),
});

// ─── Schema principal de Evaluación ───

export const EvaluacionSchema = z.object({
  metadata: EvaluationMetadataSchema
    .describe('Metadata completa de la evaluación'),

  instructions: z.string()
    .min(20, 'Las instrucciones deben tener al menos 20 caracteres')
    .max(800, 'Máximo 800 caracteres para instrucciones')
    .describe('Instrucciones claras para el estudiante, adaptadas a la edad'),

  questions: z.array(QuestionSchema)
    .min(3, 'Debe haber al least 3 preguntas')
    .max(20, 'Máximo 20 preguntas por evaluación')
    .describe('Lista de preguntas variadas'),

  answerKey: AnswerKeySchema
    .describe('Pauta de corrección consolidada para el docente'),

  // Extras visuales (opcionales para premium)
  tablas: z.array(z.object({
    titulo: z.string().min(1),
    columnas: z.array(z.string().min(1)).min(2),
    filas: z.array(z.array(z.string())).min(1),
  })).optional(),

  callouts: z.array(z.object({
    tipo: z.enum(['docente', 'familia', 'importante', 'dua', 'evaluacion']),
    titulo: z.string().min(1),
    texto: z.string().min(5),
  })).optional(),

  checklist: z.array(z.string().min(5)).optional(),
});

// ─── Tipos TypeScript inferidos ───

export type Evaluacion = z.infer<typeof EvaluacionSchema>;
export type EvaluacionMetadata = z.infer<typeof EvaluationMetadataSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type AlternativaQuestion = z.infer<typeof AlternativaQuestionSchema>;
export type VFQuestion = z.infer<typeof VFQuestionSchema>;
export type DesarrolloQuestion = z.infer<typeof DesarrolloQuestionSchema>;
export type AnswerKey = z.infer<typeof AnswerKeySchema>;

// ─── Resultado de validación tipado ───

export type ValidationResult =
  | { success: true; data: Evaluacion; warnings: string[] }
  | { success: false; errors: string[]; formatted: string };

// ─── Función de validación con validaciones de negocio ───

export function validateEvaluacion(data: unknown): ValidationResult {
  const result = EvaluacionSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((e) => {
      const path = e.path.length > 0 ? e.path.join('.') : 'raíz';
      return `[${path}] ${e.message}`;
    });

    return {
      success: false,
      errors,
      formatted: `Errores de validación en Evaluación:\n${errors.map((e) => `  • ${e}`).join('\n')}`,
    };
  }

  // ── Validaciones de negocio adicionales ──
  const warnings: string[] = [];
  const validated = result.data;

  // 1. Coherencia de puntaje total
  const questionsTotal = validated.questions.reduce((sum, q) => sum + q.score, 0);
  if (Math.abs(questionsTotal - validated.metadata.total_score) > 1) {
    warnings.push(
      `Puntaje total declarado (${validated.metadata.total_score}) no coincide con la suma de preguntas (${questionsTotal})`,
    );
  }

  // 2. Distribución de tipos de pregunta
  const typeCounts = validated.questions.reduce(
    (acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const total = validated.questions.length;
  if (total >= 5) {
    const altCount = typeCounts['alternativa'] || 0;
    if (altCount === total) {
      warnings.push('Todas las preguntas son de selección múltiple — considere mezclar con desarrollo o V/F');
    }
    const dessCount = typeCounts['desarrollo'] || 0;
    if (dessCount > total * 0.6) {
      warnings.push('Más del 60% son preguntas de desarrollo — esto puede dificultar la corrección automática');
    }
  }

  // 3. Verificar que la pauta tenga las mismas preguntas
  if (validated.answerKey.question_answers.length !== validated.questions.length) {
    warnings.push(
      `La pauta tiene ${validated.answerKey.question_answers.length} respuestas pero hay ${validated.questions.length} preguntas`,
    );
  }

  // 4. Puntaje total de pauta coherente
  if (validated.answerKey.total_points !== validated.metadata.total_score) {
    warnings.push(
      `Puntaje en pauta (${validated.answerKey.total_points}) difiere del total en metadata (${validated.metadata.total_score})`,
    );
  }

  // 5. Instrucciones adaptadas a edad (verificación básica)
  const instruccionesLower = validated.instructions.toLowerCase();
  if (instruccionesLower.includes('tú') && validated.metadata.course.includes('Básico')) {
    const grade = parseInt(validated.metadata.course.match(/\d+/)?.[0] || '0');
    if (grade <= 2) {
      warnings.push('Para 1°-2° Básico, considere usar "usted" o lenguaje más simple en instrucciones');
    }
  }

  return { success: true, data: validated, warnings };
}
