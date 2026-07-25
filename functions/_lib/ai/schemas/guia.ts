import { z } from 'zod';

/**
 * Contrato pedagógico estricto para Guías de Aprendizaje.
 *
 * Incluye:
 *  - GuiaEstandarSchema: Guía estándar con secciones de clase
 *  - GuiaDuaSchema: Guía con los 3 principios DUA en cada actividad
 */

// ─── Metadata compartida ───

const GuideMetadataSchema = z.object({
  course: z.string()
    .min(3, 'El curso es requerido')
    .max(50, 'Máximo 50 caracteres')
    .describe('Curso al que va dirigida la guía (ej: "3° Básico")'),
  subject: z.string()
    .min(3, 'La asignatura es requerida')
    .max(50, 'Máximo 50 caracteres')
    .describe('Asignatura de la guía'),
  unit: z.string()
    .min(3, 'La unidad es requerida')
    .max(100, 'Máximo 100 caracteres')
    .describe('Nombre de la unidad didáctica'),
  oa: z.string()
    .min(5, 'El OA es requerido')
    .max(200, 'Máximo 200 caracteres')
    .describe('Objetivo de aprendizaje (código MINEDUC)'),
});

// ─── Actividad estándar ───

const StandardActivitySchema = z.object({
  title: z.string()
    .min(5, 'El título es requerido')
    .max(200, 'Máximo 200 caracteres')
    .describe('Nombre de la actividad'),
  instructions: z.string()
    .min(10, 'Las instrucciones deben tener al menos 10 caracteres')
    .max(500, 'Máximo 500 caracteres')
    .describe('Instrucciones paso a paso para el estudiante'),
  materials_needed: z.array(z.string().min(1))
    .optional()
    .describe('Materiales específicos para esta actividad'),
  estimated_time: z.string()
    .optional()
    .describe('Tiempo estimado (ej: "15 minutos")'),
});

// ─── Actividad DUA ───

const DUAActivitySchema = z.object({
  title: z.string()
    .min(5, 'El título es requerido')
    .max(200, 'Máximo 200 caracteres')
    .describe('Nombre de la actividad'),
  instructions: z.string()
    .min(10, 'Las instrucciones deben tener al menos 10 caracteres')
    .max(500, 'Máximo 500 caracteres')
    .describe('Instrucciones paso a paso para el estudiante'),
  materials_needed: z.array(z.string().min(1))
    .optional()
    .describe('Materiales específicos para esta actividad'),
  estimated_time: z.string()
    .optional()
    .describe('Tiempo estimado (ej: "15 minutos")'),

  // Los 3 principios DUA son OBLIGATORIOS en cada actividad
  representation: z.string()
    .min(10, 'La representación debe tener al menos 10 caracteres')
    .max(300, 'Máximo 300 caracteres')
    .describe('Cómo presentar esta información de forma múltiple (ej: apoyo visual, lectura en voz alta, diagrama)'),
  expression: z.string()
    .min(10, 'La expresión debe tener al menos 10 caracteres')
    .max(300, 'Máximo 300 caracteres')
    .describe('Opciones para que el estudiante demuestre el aprendizaje (ej: dibujar, escribir, grabar audio, construir)'),
  engagement: z.string()
    .min(10, 'El engagement debe tener al menos 10 caracteres')
    .max(300, 'Máximo 300 caracteres')
    .describe('Estrategia explícita para captar el interés o dar autonomía en esta actividad'),
});

// ─── Sección de la guía (Inicio, Desarrollo, Cierre) ───

const GuideSectionSchema = z.object({
  title: z.string()
    .min(3, 'El título de la sección es requerido')
    .max(100, 'Máximo 100 caracteres')
    .describe('Nombre de la sección (Inicio, Desarrollo, Cierre)'),
  theory_content: z.string()
    .min(10, 'El contenido teórico debe tener al menos 10 caracteres')
    .max(2000, 'Máximo 2000 caracteres')
    .describe('Texto explicativo para el estudiante'),
  activities: z.array(StandardActivitySchema)
    .min(1, 'Debe haber al menos 1 actividad por sección')
    .max(5, 'Máximo 5 actividades por sección')
    .describe('Actividades de esta sección'),
  key_question: z.string()
    .min(5, 'La pregunta clave es requerida')
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .describe('Pregunta reflexiva para cerrar la sección'),
});

// ─── Sección DUA ───

const DUAGuideSectionSchema = z.object({
  title: z.string()
    .min(3, 'El título de la sección es requerido')
    .max(100, 'Máximo 100 caracteres')
    .describe('Nombre de la sección (Inicio, Desarrollo, Cierre)'),
  theory_content: z.string()
    .min(10, 'El contenido teórico debe tener al menos 10 caracteres')
    .max(2000, 'Máximo 2000 caracteres')
    .describe('Texto explicativo para el estudiante'),
  activities: z.array(DUAActivitySchema)
    .min(1, 'Debe haber al menos 1 actividad por sección')
    .max(5, 'Máximo 5 actividades por sección')
    .describe('Actividades DUA de esta sección'),
  key_question: z.string()
    .min(5, 'La pregunta clave es requerida')
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .describe('Pregunta reflexiva para cerrar la sección'),
});

// ─── Schema principal: Guía Estándar ───

export const GuiaEstandarSchema = z.object({
  metadata: GuideMetadataSchema
    .describe('Metadata completa de la guía'),

  title: z.string()
    .min(5, 'El título es requerido')
    .max(200, 'Máximo 200 caracteres')
    .describe('Título descriptivo de la guía'),

  student_objective: z.string()
    .min(10, 'El objetivo debe tener al menos 10 caracteres')
    .max(300, 'Máximo 300 caracteres')
    .describe('Objetivo redactado en lenguaje amigable para el estudiante'),

  sections: z.array(GuideSectionSchema)
    .length(3, 'Debe haber exactamente 3 secciones: Inicio, Desarrollo, Cierre')
    .describe('Momentos de la clase'),

  vocabulary: z.array(z.object({
    term: z.string().min(1).max(100),
    definition: z.string().min(5).max(300),
  }))
    .optional()
    .describe('Glosario de términos clave'),

  selfAssessment: z.array(z.string().min(5))
    .min(2, 'Debe haber al menos 2 preguntas de autoevaluación')
    .max(5, 'Máximo 5 preguntas')
    .optional()
    .describe('Preguntas de reflexión para el estudiante'),

  instructions: z.string()
    .min(10, 'Las instrucciones deben tener al menos 10 caracteres')
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .describe('Instrucciones generales para el estudiante'),

  // Extras visuales (opcionales para premium)
  callouts: z.array(z.object({
    tipo: z.enum(['docente', 'familia', 'importante', 'dua', 'evaluacion']),
    titulo: z.string().min(1),
    texto: z.string().min(5),
  })).optional(),

  checklist: z.array(z.string().min(5)).optional(),

  // Imágenes educativas generadas
  images: z.array(z.object({
    url: z.string().url('La URL de la imagen es inválida'),
    alt: z.string().min(5).max(200),
    source: z.string().optional(),
    attribution: z.string().optional(),
  })).optional().describe('Imágenes educativas generadas para acompañar la guía'),
});

// ─── Schema principal: Guía DUA ───

export const GuiaDuaSchema = z.object({
  metadata: GuideMetadataSchema
    .describe('Metadata completa de la guía'),

  title: z.string()
    .min(5, 'El título es requerido')
    .max(200, 'Máximo 200 caracteres')
    .describe('Título descriptivo de la guía'),

  student_objective: z.string()
    .min(10, 'El objetivo debe tener al menos 10 caracteres')
    .max(300, 'Máximo 300 caracteres')
    .describe('Objetivo redactado en lenguaje amigable para el estudiante'),

  sections: z.array(DUAGuideSectionSchema)
    .length(3, 'Debe haber exactamente 3 secciones: Inicio, Desarrollo, Cierre')
    .describe('Momentos de la clase con principios DUA'),

  vocabulary: z.array(z.object({
    term: z.string().min(1).max(100),
    definition: z.string().min(5).max(300),
  }))
    .optional()
    .describe('Glosario de términos clave'),

  selfAssessment: z.array(z.string().min(5))
    .min(2, 'Debe haber al menos 2 preguntas de autoevaluación')
    .max(5, 'Máximo 5 preguntas')
    .optional()
    .describe('Preguntas de reflexión para el estudiante'),

  instructions: z.string()
    .min(10, 'Las instrucciones deben tener al menos 10 caracteres')
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .describe('Instrucciones generales para el estudiante'),

  dua_summary: z.object({
    representation: z.string()
      .min(10, 'La representación general es requerida')
      .max(500, 'Máximo 500 caracteres')
      .describe('Resumen de estrategias de representación aplicadas en toda la guía'),
    expression: z.string()
      .min(10, 'La expresión general es requerida')
      .max(500, 'Máximo 500 caracteres')
      .describe('Resumen de opciones de expresión aplicadas en toda la guía'),
    engagement: z.string()
      .min(10, 'El engagement general es requerido')
      .max(500, 'Máximo 500 caracteres')
      .describe('Resumen de estrategias de compromiso aplicadas en toda la guía'),
  }).describe('Resumen de los 3 principios DUA aplicados en la guía'),

  // Extras visuales (opcionales para premium)
  callouts: z.array(z.object({
    tipo: z.enum(['docente', 'familia', 'importante', 'dua', 'evaluacion']),
    titulo: z.string().min(1),
    texto: z.string().min(5),
  })).optional(),

  checklist: z.array(z.string().min(5)).optional(),

  // Imágenes educativas generadas
  images: z.array(z.object({
    url: z.string().url('La URL de la imagen es inválida'),
    alt: z.string().min(5).max(200),
    source: z.string().optional(),
    attribution: z.string().optional(),
  })).optional().describe('Imágenes educativas generadas para acompañar la guía DUA'),
});

// ─── Tipos TypeScript inferidos ───

export type GuiaEstandar = z.infer<typeof GuiaEstandarSchema>;
export type GuiaDua = z.infer<typeof GuiaDuaSchema>;
export type GuideMetadata = z.infer<typeof GuideMetadataSchema>;
export type GuideSection = z.infer<typeof GuideSectionSchema>;
export type DUAGuideSection = z.infer<typeof DUAGuideSectionSchema>;
export type StandardActivity = z.infer<typeof StandardActivitySchema>;
export type DUAActivity = z.infer<typeof DUAActivitySchema>;

// ─── Resultado de validación tipado ───

export type ValidationResult =
  | { success: true; data: GuiaEstandar | GuiaDua; warnings: string[] }
  | { success: false; errors: string[]; formatted: string };

// ─── Validación de Guía Estándar ───

export function validateGuiaEstandar(data: unknown): ValidationResult {
  const result = GuiaEstandarSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((e) => {
      const path = e.path.length > 0 ? e.path.join('.') : 'raíz';
      return `[${path}] ${e.message}`;
    });

    return {
      success: false,
      errors,
      formatted: `Errores de validación en Guía Estándar:\n${errors.map((e) => `  • ${e}`).join('\n')}`,
    };
  }

  const warnings: string[] = [];
  const validated = result.data;

  // 1. Verificar títulos de secciones
  const expectedTitles = ['Inicio', 'Desarrollo', 'Cierre'];
  const actualTitles = validated.sections.map((s) => s.title.toLowerCase());
  for (const expected of expectedTitles) {
    if (!actualTitles.some((t) => t.includes(expected.toLowerCase()))) {
      warnings.push(`Sección "${expected}" no encontrada en los títulos`);
    }
  }

  // 2. Verificar que haya actividades en cada sección
  for (const section of validated.sections) {
    if (section.activities.length === 0) {
      warnings.push(`Sección "${section.title}" no tiene actividades`);
    }
  }

  // 3. Verificar coherencia de tiempo
  const totalActivities = validated.sections.reduce((sum, s) => sum + s.activities.length, 0);
  if (totalActivities > 15) {
    warnings.push(`Demasiadas actividades (${totalActivities}) — considere reducir para no exceder el tiempo de clase`);
  }

  return { success: true, data: validated, warnings };
}

// ─── Validación de Guía DUA ───

export function validateGuiaDua(data: unknown): ValidationResult {
  const result = GuiaDuaSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((e) => {
      const path = e.path.length > 0 ? e.path.join('.') : 'raíz';
      return `[${path}] ${e.message}`;
    });

    return {
      success: false,
      errors,
      formatted: `Errores de validación en Guía DUA:\n${errors.map((e) => `  • ${e}`).join('\n')}`,
    };
  }

  const warnings: string[] = [];
  const validated = result.data;

  // 1. Verificar títulos de secciones
  const expectedTitles = ['Inicio', 'Desarrollo', 'Cierre'];
  const actualTitles = validated.sections.map((s) => s.title.toLowerCase());
  for (const expected of expectedTitles) {
    if (!actualTitles.some((t) => t.includes(expected.toLowerCase()))) {
      warnings.push(`Sección "${expected}" no encontrada en los títulos`);
    }
  }

  // 2. Verificar que TODAS las actividades tengan los 3 principios DUA
  for (const section of validated.sections) {
    for (const activity of section.activities) {
      if (!activity.representation || activity.representation.length < 10) {
        warnings.push(`Actividad "${activity.title}" en "${section.title}" necesita mejor representación DUA`);
      }
      if (!activity.expression || activity.expression.length < 10) {
        warnings.push(`Actividad "${activity.title}" en "${section.title}" necesita mejor expresión DUA`);
      }
      if (!activity.engagement || activity.engagement.length < 10) {
        warnings.push(`Actividad "${activity.title}" en "${section.title}" necesita mejor compromiso DUA`);
      }
    }
  }

  // 3. Verificar que dua_summary tenga contenido sustancial
  if (validated.dua_summary) {
    const summaryLength = validated.dua_summary.representation.length
      + validated.dua_summary.expression.length
      + validated.dua_summary.engagement.length;
    if (summaryLength < 100) {
      warnings.push('El resumen DUA es muy breve — expanda las estrategias aplicadas');
    }
  }

  // 4. Verificar coherencia de tiempo
  const totalActivities = validated.sections.reduce((sum, s) => sum + s.activities.length, 0);
  if (totalActivities > 15) {
    warnings.push(`Demasiadas actividades (${totalActivities}) — considere reducir para no exceder el tiempo de clase`);
  }

  return { success: true, data: validated, warnings };
}
