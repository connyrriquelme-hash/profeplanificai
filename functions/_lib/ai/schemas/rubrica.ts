import { z } from 'zod';

/**
 * Contrato pedagógico estricto para Rúbricas.
 *
 * Obliga a que el LLM devuelva rúbricas con:
 *  - 4 niveles de desempeño ordenados de mayor a menor
 *  - Cada criterio con exactamente 4 descripciones (una por nivel)
 *  - Coherencia entre puntaje total de niveles y puntaje declarado
 */

// ─── Nivel de desempeño ───

const RubricLevelSchema = z.object({
  name: z.string()
    .min(2, 'El nombre del nivel es requerido')
    .max(50, 'Máximo 50 caracteres')
    .describe('Nombre del nivel de desempeño (ej: Excelente, Bueno, Suficiente, Por mejorar)'),
  score: z.number()
    .int('El puntaje debe ser entero')
    .min(1, 'Mínimo 1 punto')
    .max(10, 'Máximo 10 puntos por nivel')
    .describe('Puntaje o peso del nivel (mayor = mejor desempeño)'),
  color: z.string()
    .optional()
    .describe('Color hexadecimal para representación visual (ej: #10B981)'),
});

// ─── Criterio de evaluación ───

const RubricCriterionSchema = z.object({
  name: z.string()
    .min(3, 'El nombre del criterio es requerido')
    .max(100, 'Máximo 100 caracteres')
    .describe('Dimensión a evaluar (ej: Contenido, Ortografía, Trabajo en equipo)'),
  weight: z.number()
    .positive('El peso debe ser positivo')
    .max(10, 'Máximo 10')
    .optional()
    .describe('Peso relativo del criterio (opcional)'),
  descriptions: z.array(z.string()
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(300, 'Máximo 300 caracteres por descripción'),
  )
    .length(4, 'Debe haber exactamente 4 descripciones (una por nivel)')
    .describe('Descripción del desempeño esperado para cada nivel, de mayor a menor'),
});

// ─── Metadata de la rúbrica ───

const RubricMetadataSchema = z.object({
  course: z.string()
    .min(3, 'El curso es requerido')
    .max(50, 'Máximo 50 caracteres')
    .describe('Curso al que va dirigida la rúbrica (ej: "3° Básico")'),
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
});

// ─── Schema principal de Rúbrica ───

export const RubricaSchema = z.object({
  metadata: RubricMetadataSchema
    .describe('Metadata completa de la rúbrica'),

  title: z.string()
    .min(5, 'El título es requerido')
    .max(200, 'Máximo 200 caracteres')
    .describe('Título descriptivo de la rúbrica'),

  levels: z.array(RubricLevelSchema)
    .length(4, 'Debe haber exactamente 4 niveles de desempeño')
    .describe('Niveles ordenados de mayor a menor desempeño'),

  criteria: z.array(RubricCriterionSchema)
    .min(2, 'Debe haber al menos 2 criterios de evaluación')
    .max(10, 'Máximo 10 criterios')
    .describe('Dimensiones a evaluar'),

  instructions: z.string()
    .min(10, 'Las instrucciones deben tener al menos 10 caracteres')
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .describe('Instrucciones para el docente sobre cómo usar la rúbrica'),

  // Extras visuales (opcionales para premium)
  callouts: z.array(z.object({
    tipo: z.enum(['docente', 'familia', 'importante', 'dua', 'evaluacion']),
    titulo: z.string().min(1),
    texto: z.string().min(5),
  })).optional(),

  checklist: z.array(z.string().min(5)).optional(),
});

// ─── Tipos TypeScript inferidos ───

export type Rubrica = z.infer<typeof RubricaSchema>;
export type RubricLevel = z.infer<typeof RubricLevelSchema>;
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;
export type RubricMetadata = z.infer<typeof RubricMetadataSchema>;

// ─── Resultado de validación tipado ───

export type ValidationResult =
  | { success: true; data: Rubrica; warnings: string[] }
  | { success: false; errors: string[]; formatted: string };

// ─── Función de validación con validaciones de negocio ───

export function validateRubrica(data: unknown): ValidationResult {
  const result = RubricaSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((e) => {
      const path = e.path.length > 0 ? e.path.join('.') : 'raíz';
      return `[${path}] ${e.message}`;
    });

    return {
      success: false,
      errors,
      formatted: `Errores de validación en Rúbrica:\n${errors.map((e) => `  • ${e}`).join('\n')}`,
    };
  }

  // ── Validaciones de negocio adicionales ──
  const warnings: string[] = [];
  const validated = result.data;

  // 1. Orden de niveles: scores deben ser decrecientes
  for (let i = 1; i < validated.levels.length; i++) {
    if (validated.levels[i].score >= validated.levels[i - 1].score) {
      warnings.push(
        `Los niveles deben estar ordenados de mayor a menor. Nivel "${validated.levels[i].name}" (${validated.levels[i].score}) no es menor que "${validated.levels[i - 1].name}" (${validated.levels[i - 1].score})`,
      );
    }
  }

  // 2. Cada criterio debe tener exactamente 4 descripciones
  for (const criterion of validated.criteria) {
    if (criterion.descriptions.length !== 4) {
      warnings.push(
        `Criterio "${criterion.name}" tiene ${criterion.descriptions.length} descripciones, se esperan 4`,
      );
    }
  }

  // 3. Verificar que las descripciones no estén vacías o genéricas
  for (const criterion of validated.criteria) {
    const emptyDescriptions = criterion.descriptions.filter(
      (d) => d.length < 10 || d === criterion.descriptions[0],
    );
    if (emptyDescriptions.length > 0) {
      warnings.push(
        `Criterio "${criterion.name}" tiene descripciones muy similares o muy cortas`,
      );
    }
  }

  // 4. Coherencia de puntaje total
  const maxScore = validated.levels.reduce((max, l) => Math.max(max, l.score), 0);
  const totalCriteriaScore = validated.criteria.length * maxScore;
  if (totalCriteriaScore > 100) {
    warnings.push(
      `Puntaje potencial máximo (${totalCriteriaScore}) es muy alto. Considere reducir puntajes de niveles o criterios`,
    );
  }

  return { success: true, data: validated, warnings };
}
