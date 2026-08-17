import { z } from 'zod';

/**
 * Contrato de IA para GuiaEstudianteAI / GuiaDocenteAI — GuiaEngine.
 *
 * A diferencia de GuiaEstandarSchema (./guia.ts), este schema no inventa un
 * shape propio: calca exactamente GuideSection
 * (src/components/products/types.ts:128-132), que es lo único que
 * GuideRenderer.tsx ya sabe renderizar. Si la IA generara algo más rico,
 * no pasaría el schema — no hay campos opcionales "extra" que el normalizer
 * tendría que aplanar después.
 *
 * Composición de secciones (fija, verificada en superRefine porque Zod no
 * tiene un combinador nativo para "N elementos variables entre dos fijos"):
 *   Estudiante: Introducción, Vocabulario clave, 2-4 Actividades, Reflexión / Autoevaluación
 *   Docente:    Inicio (N min), Desarrollo (N min), Cierre (N min),
 *               Diferenciación / Adecuaciones DUA, Materiales y evaluación
 */

// ─── Sección base = GuideSection exacto ───
// Exportado además de usarse localmente: GuiaEditSchema.ts (edición puntual
// de una sección vía chat) reusa este mismo shape para "seccionNueva" en vez
// de duplicarlo — una sección editada individualmente no tiene por qué
// cumplir los superRefine de tipo (Introducción/Vocabulario/Actividad N/...)
// que sí aplican a la guía completa generada desde cero.

export const GuideSectionSchema = z.object({
  title: z.string()
    .min(3, 'El título de la sección es requerido')
    .max(100, 'Máximo 100 caracteres'),
  content: z.string()
    .max(1500, 'Máximo 1500 caracteres'), // sin mínimo: Vocabulario clave y Reflexión / Autoevaluación llevan todo su contenido en "activities" y dejan content como ''
  activities: z.array(z.string().min(2, 'Cada ítem debe tener contenido').max(300, 'Máximo 300 caracteres'))
    .max(8, 'Máximo 8 ítems')
    .optional(),
});

export type GuideSectionAI = z.infer<typeof GuideSectionSchema>;

// ─── Texto de lectura (Guía Estudiante) ───
// Hace que la Guía Estudiante sea autocontenida: antes, "Actividad 1: Lee
// el texto..." referenciaba un texto que el profesor tenía que conseguir e
// imprimir aparte. Ahora el texto va incluido en la guía y las actividades
// de comprensión se construyen sobre él (ver REGLA CRÍTICA en el prompt).

export const TextoLecturaSchema = z.object({
  titulo: z.string().min(3, 'El título del texto es requerido').max(80, 'Máximo 80 caracteres'),
  cuerpo: z.string()
    .min(100, 'El texto debe tener al menos 100 caracteres (aprox. 5-8 oraciones)')
    .max(800, 'Máximo 800 caracteres'),
  fuente: z.enum(['generado_ia', 'proporcionado_profesor']),
});

export type TextoLecturaAI = z.infer<typeof TextoLecturaSchema>;

// ─── Guía Estudiante ───

const IntroSectionSchema = GuideSectionSchema.extend({
  title: z.literal('Introducción'),
  content: z.string()
    .min(20, 'La introducción debe presentar el objetivo con al menos 20 caracteres')
    .max(500, 'Máximo 500 caracteres'),
});

const VocabularySectionSchema = GuideSectionSchema.extend({
  title: z.literal('Vocabulario clave'),
  content: z.string()
    .min(3, 'Debe listar al menos 1 término')
    .describe('Términos separados por coma, ej: "fotosíntesis, clorofila, oxígeno"'),
  activities: z.array(z.string().min(5, 'La definición debe tener al menos 5 caracteres').max(300, 'Máximo 300 caracteres'))
    .min(1, 'Debe haber al menos 1 definición')
    .max(6, 'Máximo 6 términos')
    .describe('Definiciones en lenguaje simple con ejemplo cotidiano, en el mismo orden que los términos de content'),
});

const ActivitySectionSchema = GuideSectionSchema.extend({
  title: z.string()
    .regex(/^Actividad \d+:\s*.+/, 'El título debe tener el formato "Actividad N: nombre concreto"')
    .max(100, 'Máximo 100 caracteres'),
  activities: z.array(z.string().min(3, 'Cada paso debe tener contenido').max(300, 'Máximo 300 caracteres'))
    .min(1, 'Debe haber al menos 1 paso')
    .max(6, 'Máximo 6 pasos'),
});

const ReflectionSectionSchema = GuideSectionSchema.extend({
  title: z.literal('Reflexión / Autoevaluación'),
  activities: z.array(z.string().min(5, 'La pregunta debe tener al menos 5 caracteres').max(150, 'Máximo 150 caracteres'))
    .min(2, 'Debe haber al menos 2 preguntas de autoevaluación')
    .max(5, 'Máximo 5 preguntas'),
});

export const GuiaEstudianteAISchema = z.object({
  title: z.string().min(5, 'El título es requerido').max(150, 'Máximo 150 caracteres'),
  objective: z.string()
    .min(10, 'El objetivo debe tener al menos 10 caracteres')
    .max(400, 'Máximo 400 caracteres')
    .describe('OA reformulado en lenguaje accesible para el estudiante'),
  textoLectura: TextoLecturaSchema,
  sections: z.array(GuideSectionSchema)
    .min(4, 'Mínimo 4 secciones: Introducción, Vocabulario clave, al menos 1 Actividad, Reflexión')
    .max(8, 'Máximo 8 secciones (Introducción + Vocabulario + hasta 4 Actividades + Reflexión)'),
}).superRefine((val, ctx) => {
  const sections = val.sections;
  const intro = sections[0];
  const vocab = sections[1];
  const reflection = sections[sections.length - 1];
  const activitySections = sections.slice(2, -1);

  const introCheck = IntroSectionSchema.safeParse(intro);
  if (!introCheck.success) {
    ctx.addIssue({ code: 'custom', path: ['sections', 0], message: 'La primera sección debe titularse "Introducción" y describir el objetivo (mín. 20 caracteres)' });
  }

  const vocabCheck = VocabularySectionSchema.safeParse(vocab);
  if (!vocabCheck.success) {
    ctx.addIssue({ code: 'custom', path: ['sections', 1], message: 'La segunda sección debe titularse "Vocabulario clave" y traer definiciones en activities' });
  }

  if (activitySections.length < 2 || activitySections.length > 4) {
    ctx.addIssue({ code: 'custom', path: ['sections'], message: `Debe haber entre 2 y 4 secciones de actividad (se encontraron ${activitySections.length})` });
  } else {
    activitySections.forEach((section, i) => {
      const check = ActivitySectionSchema.safeParse(section);
      if (!check.success) {
        ctx.addIssue({ code: 'custom', path: ['sections', i + 2], message: `La sección de actividad ${i + 1} debe titularse "Actividad N: nombre concreto" y traer pasos en activities` });
      }
    });
  }

  const reflectionCheck = ReflectionSectionSchema.safeParse(reflection);
  if (!reflectionCheck.success) {
    ctx.addIssue({ code: 'custom', path: ['sections', sections.length - 1], message: 'La última sección debe titularse "Reflexión / Autoevaluación" con 2 a 5 preguntas en activities' });
  }
});

export type GuiaEstudianteAI = z.infer<typeof GuiaEstudianteAISchema>;

// ─── Guía Docente ───

const TIME_PATTERN = '\\d+\\s*min(utos)?';

function timedMomentSchema(label: 'Inicio' | 'Desarrollo' | 'Cierre') {
  return GuideSectionSchema.extend({
    title: z.string()
      .regex(new RegExp(`^${label} \\(${TIME_PATTERN}\\)$`), `Formato esperado: "${label} (N min)" o "${label} (N minutos)"`),
    content: z.string()
      .min(15, 'La estrategia debe describirse con al menos 15 caracteres')
      .max(800, 'Máximo 800 caracteres'),
  });
}

const InicioSectionSchema = timedMomentSchema('Inicio');
const DesarrolloSectionSchema = timedMomentSchema('Desarrollo');
const CierreSectionSchema = timedMomentSchema('Cierre');

const DiferenciacionSectionSchema = GuideSectionSchema.extend({
  title: z.literal('Diferenciación / Adecuaciones DUA'),
  activities: z.array(z.string().min(10, 'Cada adecuación debe ser específica (mín. 10 caracteres)').max(250, 'Máximo 250 caracteres'))
    .min(2, 'Debe haber al menos 2 adecuaciones (1 para dificultades + 1 de extensión)')
    .max(6, 'Máximo 6 adecuaciones'),
});

const MaterialesSectionSchema = GuideSectionSchema.extend({
  title: z.literal('Materiales y evaluación'),
  content: z.string().min(10, 'Debe incluir duración total y criterios de evaluación').max(500, 'Máximo 500 caracteres'),
  activities: z.array(z.string().min(2, 'Cada material debe tener nombre').max(100, 'Máximo 100 caracteres'))
    .min(1, 'Debe haber al menos 1 material')
    .max(8, 'Máximo 8 materiales'),
});

export const GuiaDocenteAISchema = z.object({
  title: z.string().min(5, 'El título es requerido').max(150, 'Máximo 150 caracteres'),
  objective: z.string()
    .min(10, 'El objetivo debe tener al menos 10 caracteres')
    .max(400, 'Máximo 400 caracteres')
    .describe('OA en registro docente, preciso y accionable'),
  sections: z.tuple([
    InicioSectionSchema,
    DesarrolloSectionSchema,
    CierreSectionSchema,
    DiferenciacionSectionSchema,
    MaterialesSectionSchema,
  ]),
}).superRefine((val, ctx) => {
  // Coherencia de tiempo: los 3 momentos deben sumar una cantidad razonable
  // de minutos. No exigimos que calce contra un total explícito porque la
  // duración total vive como prosa libre dentro de "Materiales y
  // evaluación".content (no es un campo estructurado) — extraerla con
  // regex de ahí sería frágil. Solo validamos que la suma sea un tiempo de
  // clase plausible (no 0, no > 4 horas).
  const minutesOf = (title: string) => {
    const match = title.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };
  const total = minutesOf(val.sections[0].title) + minutesOf(val.sections[1].title) + minutesOf(val.sections[2].title);
  if (total <= 0 || total > 240) {
    ctx.addIssue({ code: 'custom', path: ['sections'], message: `La suma de tiempos de Inicio+Desarrollo+Cierre (${total} min) no es una duración de clase plausible` });
  }
});

export type GuiaDocenteAI = z.infer<typeof GuiaDocenteAISchema>;
