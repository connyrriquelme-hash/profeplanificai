import { z } from 'zod';

const TITLE_MAX = 80;
const SUBTITLE_MAX = 120;
const CONTENT_MAX = 300;
const IMAGE_PROMPT_MAX = 150;
const CHAR_MAX = 60;
const ITEM_MAX = 120;
const FEEDBACK_MAX = 200;
const REFLECTION_MAX = 200;

export const TitleSlideSchema = z.object({
  type: z.literal('title'),
  title: z.string().min(1).max(TITLE_MAX),
  subtitle: z.string().max(SUBTITLE_MAX).optional(),
});

export const BulletsSlideSchema = z.object({
  type: z.literal('bullets'),
  title: z.string().min(1).max(TITLE_MAX),
  items: z.array(z.string().min(1).max(ITEM_MAX)).min(2).max(4),
});

export const ImageTextSlideSchema = z.object({
  type: z.literal('imageText'),
  title: z.string().min(1).max(TITLE_MAX),
  content: z.string().min(1).max(CONTENT_MAX),
  imagePrompt: z.string().min(1).max(IMAGE_PROMPT_MAX),
});

export const ComparisonSlideSchema = z.object({
  type: z.literal('comparison'),
  title: z.string().min(1).max(TITLE_MAX),
  element1: z.object({
    name: z.string().min(1).max(CHAR_MAX),
    characteristics: z.array(z.string().min(1).max(ITEM_MAX)).min(1).max(4),
  }),
  element2: z.object({
    name: z.string().min(1).max(CHAR_MAX),
    characteristics: z.array(z.string().min(1).max(ITEM_MAX)).min(1).max(4),
  }),
});

export const QuizSlideSchema = z.object({
  type: z.literal('quiz'),
  title: z.string().min(1).max(TITLE_MAX),
  options: z.array(z.string().min(1).max(ITEM_MAX)).length(3),
  correctIndex: z.number().min(0).max(2),
  feedback: z.string().min(1).max(FEEDBACK_MAX),
});

export const ClosingSlideSchema = z.object({
  type: z.literal('closing'),
  title: z.string().min(1).max(TITLE_MAX),
  reflectionPrompt: z.string().min(1).max(REFLECTION_MAX),
});

export const InteractiveSlideSchema = z.discriminatedUnion('type', [
  TitleSlideSchema,
  BulletsSlideSchema,
  ImageTextSlideSchema,
  ComparisonSlideSchema,
  QuizSlideSchema,
  ClosingSlideSchema,
]);

export const InteractiveLessonSchema = z.object({
  slides: z.array(InteractiveSlideSchema).length(6),
});

export type InteractiveSlide = z.infer<typeof InteractiveSlideSchema>;
export type InteractiveLessonModel = z.infer<typeof InteractiveLessonSchema>;

export type TitleSlide = z.infer<typeof TitleSlideSchema>;
export type BulletsSlide = z.infer<typeof BulletsSlideSchema>;
export type ImageTextSlide = z.infer<typeof ImageTextSlideSchema>;
export type ComparisonSlide = z.infer<typeof ComparisonSlideSchema>;
export type QuizSlide = z.infer<typeof QuizSlideSchema>;
export type ClosingSlide = z.infer<typeof ClosingSlideSchema>;
