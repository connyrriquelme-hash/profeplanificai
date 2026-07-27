import { z } from 'zod';

export const TITLE_MAX = 80;
export const SUBTITLE_MAX = 120;
export const BULLET_MAX = 140;
const BODY_MAX = 300;
const IMAGE_QUERY_MAX = 100;
const QUOTE_MAX = 200;
const AUTHOR_MAX = 60;
const LABEL_MAX = 40;
const MIN_BULLETS = 2;
const MAX_BULLETS = 6;
const MIN_POINTS = 1;
const MAX_POINTS = 5;
const MIN_SLIDES = 5;
const MAX_SLIDES = 20;
const TERMINO_PALABRA_MAX = 60;
const TERMINO_DEFINICION_MAX = 200;
const PASO_NOMBRE_MAX = 60;
const PASO_DESCRIPCION_MAX = 200;
const PREGUNTA_MAX = 200;
const EXPLICACION_MAX = 300;
const AFIRMACION_MAX = 300;

const TitleSlideSchema = z.object({
  layout: z.literal('title'),
  title: z.string().min(1).max(TITLE_MAX),
  subtitle: z.string().max(SUBTITLE_MAX).optional(),
});

const BulletsSlideSchema = z.object({
  layout: z.literal('bullets'),
  title: z.string().min(1).max(TITLE_MAX),
  bullets: z.array(z.string().min(1).max(BULLET_MAX)).min(MIN_BULLETS).max(MAX_BULLETS),
});

const ImageTextSlideSchema = z.object({
  layout: z.literal('image_text'),
  title: z.string().min(1).max(TITLE_MAX),
  body: z.string().min(1).max(BODY_MAX),
  imageQuery: z.string().min(1).max(IMAGE_QUERY_MAX),
});

const ComparisonSideSchema = z.object({
  label: z.string().min(1).max(LABEL_MAX),
  points: z.array(z.string().min(1).max(BULLET_MAX)).min(MIN_POINTS).max(MAX_POINTS),
});

const ComparisonSlideSchema = z.object({
  layout: z.literal('comparison'),
  title: z.string().min(1).max(TITLE_MAX),
  left: ComparisonSideSchema,
  right: ComparisonSideSchema,
});

const QuoteSlideSchema = z.object({
  layout: z.literal('quote'),
  text: z.string().min(1).max(QUOTE_MAX),
  author: z.string().max(AUTHOR_MAX).optional(),
});

const VocabularioTerminoSchema = z.object({
  palabra: z.string().min(1).max(TERMINO_PALABRA_MAX),
  definicion: z.string().min(1).max(TERMINO_DEFINICION_MAX),
  imageQuery: z.string().max(IMAGE_QUERY_MAX).optional(),
});

const VocabularioSlideSchema = z.object({
  layout: z.literal('vocabulario'),
  titulo: z.string().min(1).max(TITLE_MAX),
  terminos: z.array(VocabularioTerminoSchema).min(2).max(4),
});

const CicloProcesoSchema = z.object({
  nombre: z.string().min(1).max(PASO_NOMBRE_MAX),
  descripcion: z.string().min(1).max(PASO_DESCRIPCION_MAX),
  imageQuery: z.string().max(IMAGE_QUERY_MAX).optional(),
});

const CicloProcesoSlideSchema = z.object({
  layout: z.literal('ciclo_proceso'),
  titulo: z.string().min(1).max(TITLE_MAX),
  pasos: z.array(CicloProcesoSchema).min(3).max(6),
});

const QuizOpcionMultipleSlideSchema = z.object({
  layout: z.literal('quiz_opcion_multiple'),
  pregunta: z.string().min(1).max(PREGUNTA_MAX),
  opciones: z.array(z.string().min(1).max(BULLET_MAX)).min(3).max(5),
  respuestaCorrectaIndex: z.number().int().nonnegative(),
  explicacion: z.string().max(EXPLICACION_MAX).optional(),
}).refine(
  (data) => data.respuestaCorrectaIndex < data.opciones.length,
  { message: 'respuestaCorrectaIndex debe ser menor que la cantidad de opciones' },
);

const VerdaderoFalsoSlideSchema = z.object({
  layout: z.literal('verdadero_falso'),
  afirmacion: z.string().min(1).max(AFIRMACION_MAX),
  esVerdadero: z.boolean(),
  explicacion: z.string().max(EXPLICACION_MAX).optional(),
});

export const SlideSchema = z.discriminatedUnion('layout', [
  TitleSlideSchema,
  BulletsSlideSchema,
  ImageTextSlideSchema,
  ComparisonSlideSchema,
  QuoteSlideSchema,
  VocabularioSlideSchema,
  CicloProcesoSlideSchema,
  QuizOpcionMultipleSlideSchema,
  VerdaderoFalsoSlideSchema,
]);

export const PptDeckSchema = z.object({
  slides: z.array(SlideSchema).min(MIN_SLIDES).max(MAX_SLIDES),
});

export type Slide = z.infer<typeof SlideSchema>;
export type TitleSlide = z.infer<typeof TitleSlideSchema>;
export type BulletsSlide = z.infer<typeof BulletsSlideSchema>;
export type ImageTextSlide = z.infer<typeof ImageTextSlideSchema>;
export type ComparisonSlide = z.infer<typeof ComparisonSlideSchema>;
export type QuoteSlide = z.infer<typeof QuoteSlideSchema>;
export type VocabularioSlide = z.infer<typeof VocabularioSlideSchema>;
export type CicloProcesoSlide = z.infer<typeof CicloProcesoSlideSchema>;
export type QuizOpcionMultipleSlide = z.infer<typeof QuizOpcionMultipleSlideSchema>;
export type VerdaderoFalsoSlide = z.infer<typeof VerdaderoFalsoSlideSchema>;
export type PptDeck = z.infer<typeof PptDeckSchema>;
