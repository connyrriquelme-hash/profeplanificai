import type { SlideLesson, Slide, SlideType } from '../types/slideLesson';
import type { VisualLessonDeck, LessonSlide, LessonSlideType, SlideLayout, SlidePalette, SlideVisual } from '../types/presentation';
import { enhanceDeckWithVisualPrompts, getRecommendedSlideLayout, getRecommendedPalette, buildSlideImagePrompt, buildSlideImageAlt } from './slideVisualPromptService';
import type { SlidePromptParams } from './slideVisualPromptService';

function uid(): string {
  return `ls_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const OLD_TO_NEW_TYPE: Record<SlideType, LessonSlideType> = {
  cover: 'cover',
  activation: 'activation',
  explanation: 'explanation',
  'guided-practice': 'guided-practice',
  'independent-practice': 'student-work',
  'formative-assessment': 'formative-assessment',
  closure: 'closure',
};

function buildBody(slide: Slide): string | undefined {
  const parts: string[] = [];
  if (slide.activity) parts.push(slide.activity);
  if (slide.example) parts.push(`Ejemplo: ${slide.example}`);
  if (slide.instructions) parts.push(slide.instructions);
  if (slide.metacognition) parts.push(slide.metacognition);
  if (parts.length === 0) return undefined;
  return parts.join('\n\n');
}

function convertSlide(slide: Slide, idx: number, lesson: SlideLesson): LessonSlide {
  const newType = OLD_TO_NEW_TYPE[slide.type];
  const layout = getRecommendedSlideLayout(newType);
  const palette = getRecommendedPalette(newType);

  const visual: SlideVisual = {
    mode: 'placeholder',
    imagePrompt: slide.visualPrompt || buildSlideImagePrompt({
      slideType: newType,
      slideTitle: slide.title,
      slideContent: slide.activity || slide.bullets?.join('. '),
      course: lesson.course,
      subject: lesson.subject,
      objectiveCode: lesson.objectiveCode,
      objectiveText: lesson.objectiveText,
      theme: lesson.theme,
      visualStyle: 'modern',
      preferRegionalContext: true,
    }),
    imageAlt: buildSlideImageAlt({
      slideType: newType,
      slideTitle: slide.title,
      course: lesson.course,
      subject: lesson.subject,
      objectiveCode: lesson.objectiveCode,
      visualStyle: 'modern',
      preferRegionalContext: true,
    }),
    status: 'placeholder',
    regionContext: 'chile',
  };

  return {
    id: uid(),
    slideNumber: idx + 1,
    type: newType,
    title: slide.title,
    subtitle: slide.subtitle,
    bullets: slide.bullets,
    body: buildBody(slide),
    activity: slide.activity,
    questions: slide.questions,
    teacherNotes: slide.speakerNotes,
    layout,
    palette,
    visual,
  };
}

export function normalizeLessonSlidesToVisualDeck(
  raw: SlideLesson,
  overrides?: {
    id?: string;
    skill?: string;
    visualStyle?: string;
    preferRegionalContext?: boolean;
    includeImages?: boolean;
  },
): VisualLessonDeck {
  const deck: VisualLessonDeck = {
    id: overrides?.id || uid(),
    title: raw.title,
    subtitle: raw.subtitle,
    course: raw.course,
    subject: raw.subject,
    objectiveCode: raw.objectiveCode,
    objectiveText: raw.objectiveText,
    skill: overrides?.skill,
    theme: raw.theme,
    visualStyle: overrides?.visualStyle || 'modern',
    preferRegionalContext: overrides?.preferRegionalContext ?? true,
    includeImages: overrides?.includeImages ?? true,
    slides: raw.slides.map((s, i) => convertSlide(s, i, raw)),
    createdAt: new Date().toISOString(),
  };

  return enhanceDeckWithVisualPrompts(deck);
}
