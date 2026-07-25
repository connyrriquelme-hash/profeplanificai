import { z } from 'zod';

/**
 * Contrato pedagógico estricto para Planificación (Unidad Didáctica).
 *
 * Estructura UDD/PUC: PAI, anticipación de errores, protagonismo del estudiante,
 * momentos de clase con acciones cognitivas, mediación docente, verificación.
 */

// ─── Materiales realistas para escuelas chilenas ───

const MATERIALES_CHILENOS = [
  'cuaderno', 'cuaderno de', 'lápiz', 'lápices', 'cuaderno rayado',
  'cuaderno cuadriculado', 'pizarrón', 'pizarra', 'goma de borrar',
  'tijeras', 'pegamento', 'hojas', 'hojas blancas', 'hojas de block',
  'fichas', 'ficha de trabajo', 'ficha de', 'marcadores', 'colores',
  'plumones', 'retroproyector', 'proyector', 'computador', 'pantalla',
  'internet', 'libro de', 'texto', 'atlas', 'mapa', 'globos',
  'material concreto', 'regla', 'compás', 'transportador',
  'calculadora', 'navaja', 'bandeja', 'semilla', 'tierra',
  'reciclaje', 'papel bond', 'cartulina', 'tinta', 'pinceles',
  'arpa', 'guitarra', 'flauta', 'pandero', 'instrumentos',
  'balón', 'pelota', 'cuerda', 'aro', 'conos', 'sillas',
  'mesa', 'papelógrafo', 'afiche', 'marcador de pizarra',
  'tiza', 'gises', 'borrador de pizarra', 'timer', 'cronómetro',
  'alarma', 'celular', 'tablet', 'cuaderno de actas',
];

// ─── Sub-schemas para momentos de clase ───

const RecursoMomentoSchema = z.object({
  nombre: z.string().min(3, 'El nombre del recurso es requerido'),
  tipo: z.enum(['material_fisico', 'digital', 'humano', 'ambiental']).describe('Tipo de recurso'),
  descripcion: z.string().min(5).optional().describe('Descripción breve del recurso'),
  imagePrompt: z.string().min(10).optional()
    .describe('Instrucción visual en inglés para generar imagen del recurso. Sin emojis, sin texto incrustado.'),
});

const MomentoClaseSchema = z.object({
  nombre: z.string()
    .min(3, 'El nombre del momento es requerido')
    .max(60)
    .describe('Nombre del momento (ej: "Activación de conocimientos previos")'),

  accionesEstudiante: z.string()
    .min(30, 'Las acciones del estudiante deben ser descriptivas (mín. 30 caracteres)')
    .max(2000)
    .describe('Qué hará cognitivamente el alumno. NUNCA respuestas pasivas. Ejemplo: "Los estudiantes comparan dos muestras de suelo..."'),

  estrategiasMediacion: z.string()
    .min(20, 'Las estrategias de mediación deben ser concretas (mín. 20 caracteres)')
    .max(2000)
    .describe('Qué hará el docente para andamiar ese aprendizaje: preguntas guía, modelamiento, retroalimentación formativa'),

  tiempoEsperado: z.string()
    .regex(/^\d+\s*(minutos?|min|m)$/i, 'Formato inválido. Ejemplo: "15 min"')
    .refine((val) => {
      const mins = parseInt(val.match(/\d+/)?.[0] || '0');
      return mins >= 3 && mins <= 90;
    }, 'El tiempo debe ser entre 3 y 90 minutos')
    .describe('Estimación en minutos'),

  recursos: z.array(RecursoMomentoSchema)
    .min(1, 'Debe incluir al menos 1 recurso')
    .max(8)
    .describe('Materiales necesarios para este momento'),

  medioVerificacion: z.string()
    .min(15, 'El medio de verificación debe ser específico (mín. 15 caracteres)')
    .max(1000)
    .describe('Cómo se evidenciará el aprendizaje en ese momento específico (evidencias/indicadores observables)'),

  imagePrompt: z.string().min(15).optional()
    .describe('Prompt visual en inglés para ilustrar este momento de la clase. Sin emojis, estilo ilustración educativa limpia.'),
});

// ─── Prácticas pedagógicas ───

const PracticasPedagogicasSchema = z.object({
  practicasAltoImpacto: z.array(z.string().min(10))
    .min(1, 'Debe incluir al menos 1 Práctica de Alto Impacto (PAI)')
    .max(5)
    .describe('PAI seleccionadas: evaluación formativa, retroalimentación específica, comprensión profunda, organización del aula, etc.'),

  practicasEticas: z.array(z.string().min(10))
    .min(1, 'Debe incluir al menos 1 práctica ética')
    .max(5)
    .describe('Prácticas éticas: respeto a la diversidad, igualdad de oportunidades, formación en valores'),

  justificacion: z.string()
    .min(20, 'Justifique por qué estas PAI son apropiadas para esta clase')
    .max(500)
    .optional()
    .describe('Breve justificación de la selección de PAI para el contexto específico'),
});

// ─── Anticipación de errores ───

const AnticipacionErroresSchema = z.object({
  posiblesDificultades: z.array(z.object({
    dificultad: z.string().min(10).max(200)
      .describe('Dificultad conceptual o procedimental esperada'),
    tipo: z.enum(['conceptual', 'procedimental', 'actitudinal', 'linguistico'])
      .describe('Tipo de dificultad'),
    probabilidad: z.enum(['alta', 'media', 'baja'])
      .describe('Probabilidad de que ocurra'),
  }))
    .min(1, 'Debe anticipar al menos 1 dificultad')
    .max(6)
    .describe('Errores conceptuales o procedimentales esperados según el contenido'),

  estrategiaAbordaje: z.string()
    .min(30, 'La estrategia de abordaje debe ser concreta (mín. 30 caracteres)')
    .max(1500)
    .describe('Cómo el docente usará el error como oportunidad de aprendizaje: diagnóstico, andamiaje, reenseñanza'),
});

// ─── Preguntas clave ───

const PreguntasClaveSchema = z.array(z.object({
  pregunta: z.string().min(15).max(300)
    .describe('Pregunta abierta, analítica o reflexiva (NUNCA de sí/no)'),
  tipo: z.enum(['activacion', 'comprension', 'analisis', 'sintesis', 'evaluacion', 'metacognitiva'])
    .describe('Nivel cognitivo de la pregunta (taxonomía de Bloom)'),
  momento: z.string().min(3).max(60)
    .describe('Momento de la clase donde se formula'),
}))
  .min(3, 'Debe incluir al menos 3 preguntas clave')
  .max(10)
  .describe('Preguntas diseñadas para hacer visible el pensamiento del estudiante');

// ─── Clase individual dentro de la planificación ───

export const PlanificationClassSchema = z.object({
  number: z.number()
    .int('El número de clase debe ser entero')
    .positive('El número debe ser positivo'),

  objective: z.string()
    .min(15, 'El objetivo debe ser descriptivo (mín. 15 caracteres)')
    .max(300, 'El objetivo es demasiado largo')
    .describe('Objetivo de aprendizaje específico alineado al OA proporcionado'),

  // Momentos de clase estructurados (nueva estructura UDD/PUC)
  momentosClase: z.object({
    inicio: MomentoClaseSchema
      .describe('Momento de activación: conexión con conocimientos previos, motivación, exploración inicial'),
    desarrollo: MomentoClaseSchema
      .describe('Momento de construcción: modelamiento, práctica guiada, trabajo colaborativo, profundización'),
    cierre: MomentoClaseSchema
      .describe('Momento de síntesis: metacognición, ticket de salida, retroalimentación, conexión con próxima clase'),
  })
    .describe('Estructura estricta de los 3 momentos de la clase'),

  // Prácticas de alto impacto
  practicasPedagogicas: PracticasPedagogicasSchema
    .describe('PAI y prácticas éticas aplicadas en esta clase'),

  // Anticipación de errores
  anticipacionErrores: AnticipacionErroresSchema
    .describe('Dificultades esperadas y estrategia de abordaje'),

  // Preguntas clave
  preguntasClave: PreguntasClaveSchema
    .describe('Preguntas para hacer visible el pensamiento del estudiante'),

  // Evaluación
  assessment: z.string()
    .min(15, 'La evaluación debe ser descriptiva (mín. 15 caracteres)')
    .max(500, 'La evaluación es demasiado larga')
    .describe('Criterio de logro observable y evidencia esperada del estudiante'),

  // DUA
  duaAccommodations: z.array(z.string().min(10))
    .optional()
    .describe('Ajustes DUA: representación, acción/expresión, implicación'),

  // Backward compatibility: campos de texto plano (opcionales)
  opening: z.string().optional()
    .describe('[Legacy] Texto del momento de inicio'),
  development: z.string().optional()
    .describe('[Legacy] Texto del momento de desarrollo'),
  closure: z.string().optional()
    .describe('[Legacy] Texto del momento de cierre'),

  duration: z.string()
    .regex(/^\d+\s*(minutos?|min|m)$/i, 'Formato inválido. Ejemplo: "90 min"')
    .refine((val) => {
      const mins = parseInt(val.match(/\d+/)?.[0] || '0');
      return mins >= 20 && mins <= 150;
    }, 'La duración debe ser entre 20 y 150 minutos')
    .describe('Duración total de la clase'),

  materials: z.array(z.string().min(3, 'Cada material debe tener nombre'))
    .min(2, 'Debe incluir al menos 2 materiales')
    .max(12, 'Máximo 12 materiales por clase')
    .describe('Materiales realistas disponibles en escuelas chilenas'),
});

// ─── Esquema principal de Planificación ───

export const PlanificationSchema = z.object({
  unit: z.string()
    .min(5, 'El nombre de la unidad es requerido')
    .max(120, 'Máximo 120 caracteres para el nombre de la unidad')
    .describe('Nombre descriptivo de la unidad didáctica'),

  classes: z.array(PlanificationClassSchema)
    .min(3, 'Debe haber al menos 3 clases en la unidad')
    .max(10, 'Máximo 10 clases por unidad')
    .describe('Lista de clases progresivas de la unidad'),

  methodology: z.string()
    .min(5, 'La metodología es requerida')
    .max(200, 'Máximo 200 caracteres para la metodología')
    .describe('Metodología principal: ABP, Aprendizaje Activo, Investigación, etc.'),

  totalDuration: z.string()
    .optional()
    .describe('Duración total estimada de la unidad'),

  dua: z.array(z.string().min(10))
    .optional()
    .describe('Adaptaciones DUA generales para la unidad'),

  evaluation: z.string()
    .min(10, 'Tipo de evaluación requerido')
    .max(500, 'La evaluación es demasiado larga')
    .describe('Tipo de evaluación: formativa, sumativa, diagnóstica, mixta'),

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

  // Imágenes generadas (pobladas post-generación por _lib/images.ts)
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().min(5),
    source: z.string(),
    attribution: z.string().optional(),
  })).optional()
    .describe('Imágenes generadas automáticamente a partir de imagePrompt en momentosClase'),
});

// ─── Tipos TypeScript inferidos ───

export type Planification = z.infer<typeof PlanificationSchema>;
export type PlanificationClass = z.infer<typeof PlanificationClassSchema>;
export type MomentoClase = z.infer<typeof MomentoClaseSchema>;
export type PracticasPedagogicas = z.infer<typeof PracticasPedagogicasSchema>;
export type AnticipacionErrores = z.infer<typeof AnticipacionErroresSchema>;

// ─── Resultado de validación tipado ───

export type ValidationResult =
  | { success: true; data: Planification; warnings: string[] }
  | { success: false; errors: string[]; formatted: string };

// ─── Función de validación con validaciones de negocio ───

export function validatePlanification(data: unknown): ValidationResult {
  const result = PlanificationSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((e) => {
      const path = e.path.length > 0 ? e.path.join('.') : 'raíz';
      return `[${path}] ${e.message}`;
    });

    return {
      success: false,
      errors,
      formatted: `Errores de validación en Planificación:\n${errors.map((e) => `  • ${e}`).join('\n')}`,
    };
  }

  // ── Validaciones de negocio adicionales ──
  const warnings: string[] = [];
  const validated = result.data;

  // 1. Coherencia de tiempos por clase
  let totalMinutes = 0;
  for (const cls of validated.classes) {
    const mins = parseInt(cls.duration.match(/\d+/)?.[0] || '0');
    totalMinutes += mins;

    if (mins < 30) {
      warnings.push(`Clase ${cls.number}: duración corta (${mins} min) — considere 40+ min para desarrollo profundo`);
    }
    if (mins > 120) {
      warnings.push(`Clase ${cls.number}: duración excesiva (${mins} min) — considere dividir en dos sesiones`);
    }

    // Verificar que momentos tengan tiempo coherente
    const mInicio = parseInt(cls.momentosClase.inicio.tiempoEsperado.match(/\d+/)?.[0] || '0');
    const mDesarrollo = parseInt(cls.momentosClase.desarrollo.tiempoEsperado.match(/\d+/)?.[0] || '0');
    const mCierre = parseInt(cls.momentosClase.cierre.tiempoEsperado.match(/\d+/)?.[0] || '0');
    const sumaMomentos = mInicio + mDesarrollo + mCierre;

    if (Math.abs(sumaMomentos - mins) > mins * 0.3) {
      warnings.push(`Clase ${cls.number}: suma de momentos (${sumaMomentos} min) no coincide con duración total (${mins} min)`);
    }

    // Verificar que haya imagePrompt en al menos 2 momentos
    const conImage = [cls.momentosClase.inicio, cls.momentosClase.desarrollo, cls.momentosClase.cierre]
      .filter(m => m.imagePrompt && m.imagePrompt.length > 10).length;
    if (conImage < 1) {
      warnings.push(`Clase ${cls.number}: considere agregar imagePrompt en al menos 1 momento para enriquecer visualmente`);
    }
  }

  // 2. Verificar progresión lógica (objetivos distintos)
  const objectives = validated.classes.map((c) => c.objective.toLowerCase().slice(0, 50));
  const uniqueObjectives = new Set(objectives);
  if (uniqueObjectives.size < objectives.length * 0.7) {
    warnings.push('Algunas clases tienen objetivos muy similares — verifique la progresión de aprendizaje');
  }

  // 3. Materiales realistas para Chile
  for (const cls of validated.classes) {
    for (const mat of cls.materials) {
      const matLower = mat.toLowerCase();
      const isRealistic = MATERIALES_CHILENOS.some((m) => matLower.includes(m));
      if (!isRealistic && matLower.length > 3) {
        warnings.push(`Clase ${cls.number}: material "${mat}" podría no estar disponible en todas las escuelas chilenas`);
      }
    }
  }

  // 4. TotalDuration coherente
  if (validated.totalDuration) {
    const stated = parseInt(validated.totalDuration.match(/\d+/)?.[0] || '0');
    if (stated > 0 && Math.abs(stated - totalMinutes) > totalMinutes * 0.3) {
      warnings.push(
        `Duración total declarada (${validated.totalDuration}) no coincide con la suma de clases (${totalMinutes} min)`,
      );
    }
  }

  // 5. Verificar que cada clase tenga PAI
  for (const cls of validated.classes) {
    if (cls.practicasPedagogicas.practicasAltoImpacto.length === 0) {
      warnings.push(`Clase ${cls.number}: no tiene Prácticas de Alto Impacto (PAI) definidas`);
    }
    if (cls.anticipacionErrores.posiblesDificultades.length === 0) {
      warnings.push(`Clase ${cls.number}: no tiene anticipación de errores — el error es una oportunidad de aprendizaje`);
    }
    if (cls.preguntasClave.length < 2) {
      warnings.push(`Clase ${cls.number}: tiene menos de 2 preguntas clave — agregue más para hacer visible el pensamiento`);
    }
  }

  return { success: true, data: validated, warnings };
}
