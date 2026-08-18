export interface TitleSlide {
  type: 'title';
  title: string;
  subtitle?: string;
}

export interface BulletsSlide {
  type: 'bullets';
  title: string;
  items: string[];
}

export interface ImageTextSlide {
  type: 'imageText';
  title: string;
  content: string;
  imagePrompt: string;
}

export interface ComparisonSlide {
  type: 'comparison';
  title: string;
  element1: { name: string; characteristics: string[] };
  element2: { name: string; characteristics: string[] };
}

export interface QuizSlide {
  type: 'quiz';
  title: string;
  options: string[];
  correctIndex: number;
  feedback: string;
}

export interface ClosingSlide {
  type: 'closing';
  title: string;
  reflectionPrompt: string;
}

export type Slide =
  | TitleSlide
  | BulletsSlide
  | ComparisonSlide
  | ImageTextSlide
  | QuizSlide
  | ClosingSlide;

export type { InteractiveLessonModel } from '../../../schemas/interactiveLessonSchema';

export interface InteractiveLessonProps {
  lessonTitle: string;
  slides: Slide[];
  onFinish?: () => void;
}
