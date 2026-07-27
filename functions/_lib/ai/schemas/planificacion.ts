import { z } from 'zod';

/**
 * Contrato pedagógico resiliente para Planificación (Unidad Didáctica).
 *
 * Estructura UDD/PUC: PAI, anticipación de errores, protagonismo del estudiante,
 * momentos de clase con acciones cognitivas, mediación docente, verificación.
 *
 * DISEÑO ELÁSTICO: Usa .catch() y .default() en nodos frágiles para que
 * imperfecciones del LLM no rompan toda la generación. Si un campo anidado
 * falla, se devuelve un valor por defecto razonable en vez de rechazar el JSON.
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

// ─── Helpers para normalizar strings del LLM ───

function safeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function safeTrim(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

// ─── Sub-schemas para momentos de clase (ELÁSTICOS) ───

const RecursoMomentoSchema = z.object({
  nombre: z.string().min(1).max(100).catch('Material de aula'),
  tipo: z.enum(['material_fisico', 'digital', 'humano', 'ambiental']).catch('material_fisico'),
  descripcion: z.string().max(200).optional(),
  imagePrompt: z.string().max(300).optional(),
});

const MomentoClaseSchema = z.object({
  nombre: z.string().max(80).catch('Momento de la clase'),

  accionesEstudiante: z.string().max(2000)
    .describe('Qué hará cognitivamente el alumno. NUNCA respuestas pasivas.'),

  estrategiasMediacion: z.string().max(2000)
    .describe('Qué hará el docente para andamiar ese aprendizaje'),

  tiempoEsperado: z.string().max(20).catch('15 min')
    .describe('Estimación en minutos'),

  recursos: z.array(RecursoMomentoSchema).max(8).default([
    { nombre: 'Cuaderno del estudiante', tipo: 'material_fisico' },
  ]),

  medioVerificacion: z.string().max(500).catch('Participación oral y escrita en cuaderno'),

  imagePrompt: z.string().max(300).optional(),
});

// ─── Prácticas pedagógicas (ELÁSTICO) ───

const PracticasPedagogicasSchema = z.object({
  practicasAltoImpacto: z.array(z.string().min(1).max(200)).min(1).max(5)
    .catch(['Evaluación formativa mediante observación directa']),

  practicasEticas: z.array(z.string().min(1).max(200)).min(1).max(5)
    .catch(['Respeto a los ritmos de aprendizaje de cada estudiante']),

  justificacion: z.string().max(500).optional(),
});

// ─── Anticipación de errores (ELÁSTICO) ───

const DificultadSchema = z.object({
  dificultad: z.string().max(200).catch('Dificultad conceptual por complejidad del tema'),
  tipo: z.enum(['conceptual', 'procedimental', 'actitudinal', 'linguistico']).catch('conceptual'),
  probabilidad: z.enum(['alta', 'media', 'baja']).catch('media'),
});

const AnticipacionErroresSchema = z.object({
  posiblesDificultades: z.array(DificultadSchema).min(1).max(6)
    .catch([{ dificultad: 'Dificultad conceptual por complejidad del tema', tipo: 'conceptual', probabilidad: 'media' }]),

  estrategiaAbordaje: z.string().max(1500)
    .catch('El docente anticipa dificultades usando ejemplos concretos del entorno del estudiante, contrastando conceptos y usando organizadores gráficos para hacer visible la diferencia.'),
});

// ─── Preguntas clave (ELÁSTICO) ───

const PreguntaClaveSchema = z.object({
  pregunta: z.string().max(300)
    .catch('¿Qué observan en esta situación y por qué creen que ocurre?'),
  tipo: z.enum(['activacion', 'comprension', 'analisis', 'sintesis', 'evaluacion', 'metacognitiva']).catch('analisis'),
  momento: z.string().max(60).catch('Desarrollo'),
});

const PreguntasClaveSchema = z.array(PreguntaClaveSchema).max(10)
  .default([
    { pregunta: '¿Qué saben sobre este tema y cómo lo aprendieron?', tipo: 'activacion', momento: 'Inicio' },
    { pregunta: '¿Qué diferencias o semejanzas encuentran en esta situación?', tipo: 'analisis', momento: 'Desarrollo' },
    { pregunta: '¿Cómo explicarían lo aprendido a alguien que no estuvo en clase?', tipo: 'sintesis', momento: 'Cierre' },
  ]);

// ─── Clase individual dentro de la planificación ───

export const PlanificationClassSchema = z.object({
  number: z.number().int().positive().catch(1),

  objective: z.string().max(300)
    .catch('Objetivo de aprendizaje alineado al OA'),

  // Momentos de clase estructurados
  momentosClase: z.object({
    inicio: MomentoClaseSchema.catch({
      nombre: 'Activación de conocimientos previos',
      accionesEstudiante: 'Los estudiantes exploran una situación del entorno local que conecta con el tema de la clase.',
      estrategiasMediacion: 'El docente presenta una imagen o situación motivadora, formula una pregunta abierta y escucha las primeras ideas.',
      tiempoEsperado: '15 min',
      recursos: [{ nombre: 'Pizarrón', tipo: 'material_fisico' }],
      medioVerificacion: 'Participación oral y escritura inicial en cuaderno',
    }),
    desarrollo: MomentoClaseSchema.catch({
      nombre: 'Construcción con andamiaje',
      accionesEstudiante: 'Los estudiantes trabajan en parejas o pequeños grupos para resolver una tarea guiada relacionada con el OA.',
      estrategiasMediacion: 'El docente modela la tarea con un ejemplo, libera la práctica en parejas y retroalimenta circulando.',
      tiempoEsperado: '50 min',
      recursos: [{ nombre: 'Fichas de trabajo', tipo: 'material_fisico' }],
      medioVerificacion: 'Producto grupal y observación directa del trabajo en equipo',
    }),
    cierre: MomentoClaseSchema.catch({
      nombre: 'Síntesis y metacognición',
      accionesEstudiante: 'Los estudiantes escriben un ticket de salida reflexionando sobre lo aprendido.',
      estrategiasMediacion: 'El docente recoge los tickets, destaca 2-3 ejemplos y cierra conectando con la próxima clase.',
      tiempoEsperado: '15 min',
      recursos: [{ nombre: 'Fichas de ticket de salida', tipo: 'material_fisico' }],
      medioVerificacion: 'Tickets de salida escritos',
    }),
  }),

  // Prácticas de alto impacto
  practicasPedagogicas: PracticasPedagogicasSchema,

  // Anticipación de errores
  anticipacionErrores: AnticipacionErroresSchema,

  // Preguntas clave
  preguntasClave: PreguntasClaveSchema,

  // Evaluación
  assessment: z.string().max(500)
    .catch('Criterio de logro observable alineado al OA'),

  // DUA
  duaAccommodations: z.array(z.string().max(200)).optional(),

  // Backward compatibility: campos de texto plano (opcionales)
  opening: z.string().optional(),
  development: z.string().optional(),
  closure: z.string().optional(),

  duration: z.string().max(20).catch('90 min'),

  materials: z.array(z.string().min(1).max(100)).min(1).max(12)
    .catch(['Cuaderno del estudiante', 'Pizarrón y tiza']),
});

// ─── Esquema principal de Planificación (ELÁSTICO) ───

export const PlanificationSchema = z.object({
  unit: z.string().max(120)
    .catch('Unidad Didáctica'),

  classes: z.array(PlanificationClassSchema)
    .min(1, 'Debe haber al menos 1 clase')
    .max(10)
    .catch([]),

  methodology: z.string().max(200)
    .catch('Metodología activa'),

  totalDuration: z.string().optional(),

  dua: z.array(z.string().max(200)).optional(),

  evaluation: z.string().max(500)
    .catch('Evaluación formativa'),

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
  })).optional(),
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

  // ── Validaciones de negocio (solo warnings, no bloquea) ──
  const warnings: string[] = [];
  const validated = result.data;

  // 1. Coherencia de tiempos por clase
  let totalMinutes = 0;
  for (const cls of validated.classes) {
    const mins = parseInt(cls.duration.match(/\d+/)?.[0] || '0');
    totalMinutes += mins;

    if (mins < 30) {
      warnings.push(`Clase ${cls.number}: duración corta (${mins} min) — considere 40+ min`);
    }
    if (mins > 120) {
      warnings.push(`Clase ${cls.number}: duración excesiva (${mins} min) — considere dividir`);
    }

    // Verificar que momentos tengan tiempo coherente
    const mInicio = parseInt(cls.momentosClase.inicio.tiempoEsperado.match(/\d+/)?.[0] || '0');
    const mDesarrollo = parseInt(cls.momentosClase.desarrollo.tiempoEsperado.match(/\d+/)?.[0] || '0');
    const mCierre = parseInt(cls.momentosClase.cierre.tiempoEsperado.match(/\d+/)?.[0] || '0');
    const sumaMomentos = mInicio + mDesarrollo + mCierre;

    if (mins > 0 && Math.abs(sumaMomentos - mins) > mins * 0.4) {
      warnings.push(`Clase ${cls.number}: suma de momentos (${sumaMomentos} min) no coincide con duración total (${mins} min)`);
    }

    // imagePrompt como warning
    const conImage = [cls.momentosClase.inicio, cls.momentosClase.desarrollo, cls.momentosClase.cierre]
      .filter(m => m.imagePrompt && m.imagePrompt.length > 10).length;
    if (conImage < 1) {
      warnings.push(`Clase ${cls.number}: considere agregar imagePrompt en al menos 1 momento`);
    }
  }

  // 2. Progresión lógica (objetivos distintos)
  if (validated.classes.length > 1) {
    const objectives = validated.classes.map((c) => c.objective.toLowerCase().slice(0, 50));
    const uniqueObjectives = new Set(objectives);
    if (uniqueObjectives.size < objectives.length * 0.6) {
      warnings.push('Algunas clases tienen objetivos muy similares — verifique la progresión');
    }
  }

  // 3. Materiales realistas para Chile
  for (const cls of validated.classes) {
    for (const mat of cls.materials) {
      const matLower = mat.toLowerCase();
      const isRealistic = MATERIALES_CHILENOS.some((m) => matLower.includes(m));
      if (!isRealistic && matLower.length > 3) {
        warnings.push(`Clase ${cls.number}: material "${mat}" podría no estar en escuelas chilenas`);
      }
    }
  }

  // 4. PAI mínimo
  for (const cls of validated.classes) {
    if (cls.practicasPedagogicas.practicasAltoImpacto.length === 0) {
      warnings.push(`Clase ${cls.number}: sin PAI definidas`);
    }
    if (cls.preguntasClave.length < 2) {
      warnings.push(`Clase ${cls.number}: menos de 2 preguntas clave`);
    }
  }

  return { success: true, data: validated, warnings };
}
