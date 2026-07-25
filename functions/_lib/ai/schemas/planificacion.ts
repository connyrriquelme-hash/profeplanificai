import { z } from 'zod';

/**
 * Contrato pedagógico estricto para Planificación (Unidad Didáctica).
 *
 * Obliga a que el LLM devuelva una estructura coherente:
 *  - 3-10 clases con inicio/desarrollo/cierre obligatorios
 *  - Tiempos realistas (30-120 min por clase)
 *  - Materiales que existan en escuelas chilenas
 *  - Objetivos alineados al OA proporcionado
 */

// ─── Clase individual dentro de la planificación ───

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

export const PlanificationClassSchema = z.object({
  number: z.number()
    .int('El número de clase debe ser entero')
    .positive('El número debe ser positivo'),

  objective: z.string()
    .min(15, 'El objetivo debe ser descriptivo (mín. 15 caracteres)')
    .max(300, 'El objetivo es demasiado largo')
    .describe('Objetivo de aprendizaje específico alineado al OA proporcionado'),

  opening: z.string()
    .min(30, 'El inicio debe tener al menos 30 caracteres con instrucciones concretas')
    .max(2000, 'El inicio es demasiado largo')
    .describe('Momento de activación: pregunta motivadora, contexto chileno, consigna exacta del docente'),

  development: z.string()
    .min(50, 'El desarrollo debe ser detallado (mín. 50 caracteres)')
    .max(5000, 'El desarrollo es demasiado largo')
    .describe('Construcción: modelamiento docente, práctica guiada, trabajo individual, andamiajes DUA'),

  closure: z.string()
    .min(25, 'El cierre debe incluir síntesis y metacognición (mín. 25 caracteres)')
    .max(2000, 'El cierre es demasiado largo')
    .describe('Síntesis guiada, ticket de salida, criterio de logro observable'),

  duration: z.string()
    .regex(/^\d+\s*(minutos?|min|m)$/i, 'Formato inválido. Ejemplo: "45 min"')
    .refine((val) => {
      const mins = parseInt(val.match(/\d+/)?.[0] || '0');
      return mins >= 20 && mins <= 150;
    }, 'La duración debe ser entre 20 y 150 minutos')
    .describe('Duración de la clase'),

  materials: z.array(z.string().min(3, 'Cada material debe tener nombre'))
    .min(2, 'Debe incluir al menos 2 materiales')
    .max(12, 'Máximo 12 materiales por clase')
    .describe('Materiales realistas disponibles en escuelas chilenas'),

  assessment: z.string()
    .min(15, 'La evaluación debe ser descriptiva (mín. 15 caracteres)')
    .max(500, 'La evaluación es demasiado larga')
    .describe('Criterio de logro observable y evidencia esperada del estudiante'),

  duaAccommodations: z.array(z.string().min(10))
    .optional()
    .describe('Ajustes DUA: representación, acción/expresión, implicación'),
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
});

// ─── Tipos TypeScript inferidos ───

export type Planification = z.infer<typeof PlanificationSchema>;
export type PlanificationClass = z.infer<typeof PlanificationClassSchema>;

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

  return { success: true, data: validated, warnings };
}
