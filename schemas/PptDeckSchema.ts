import { z } from 'zod';

const TITLE_MAX = 80;
const SUBTITLE_MAX = 120;
const BULLET_MAX = 140;
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

export const SlideSchema = z.discriminatedUnion('layout', [
  TitleSlideSchema,
  BulletsSlideSchema,
  ImageTextSlideSchema,
  ComparisonSlideSchema,
  QuoteSlideSchema,
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
export type PptDeck = z.infer<typeof PptDeckSchema>;
