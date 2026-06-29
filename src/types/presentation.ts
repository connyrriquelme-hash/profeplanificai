import type { DiagramType, DiagramNode, DiagramEdge, SlideTable } from './slideLesson';

export type SlideLayout =
  | 'cover-hero'
  | 'split-image-right'
  | 'split-image-left'
  | 'full-image-overlay'
  | 'cards-grid'
  | 'timeline'
  | 'steps'
  | 'quote'
  | 'checklist'
  | 'reflection'
  | 'diagram-process'
  | 'diagram-cycle'
  | 'diagram-hierarchy'
  | 'comparison'
  | 'table-view';

export type SlideVisualMode =
  | 'generated-image'
  | 'illustration'
  | 'photo-reference'
  | 'icon-grid'
  | 'diagram'
  | 'map'
  | 'timeline'
  | 'placeholder';

export type SlidePalette = 'violet' | 'indigo' | 'teal' | 'amber' | 'rose' | 'slate' | 'emerald' | 'fuchsia';

export interface SlideVisual {
  mode: SlideVisualMode;
  imagePrompt: string;
  imageUrl?: string;
  imageAlt: string;
  caption?: string;
  sourceLabel?: string;
  regionContext?: 'chile' | 'latam' | 'general';
  status?: 'pending' | 'generating' | 'generated' | 'failed' | 'placeholder';
}

export type LessonSlideType =
  | 'cover'
  | 'objective'
  | 'activation'
  | 'explanation'
  | 'guided-practice'
  | 'student-work'
  | 'formative-assessment'
  | 'closure';

export interface LessonSlide {
  id: string;
  slideNumber: number;
  type: LessonSlideType;
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  activity?: string;
  questions?: string[];
  teacherNotes?: string;
  layout: SlideLayout;
  palette: SlidePalette;
  visual: SlideVisual;
  /** Legacy fields preserved from old Slide format */
  metacognition?: string;
  exitTicket?: string;
  example?: string;
  instructions?: string;
  materials?: string[];
  successCriteria?: string[];
  diagram?: {
    type: DiagramType;
    nodes: DiagramNode[];
    edges?: DiagramEdge[];
  };
  table?: SlideTable;
}

export interface VisualLessonDeck {
  id: string;
  title: string;
  subtitle?: string;
  course: string;
  subject: string;
  objectiveCode?: string;
  objectiveText?: string;
  skill?: string;
  theme?: string;
  visualStyle: string;
  preferRegionalContext: boolean;
  includeImages: boolean;
  slides: LessonSlide[];
  createdAt: string;
}

export type ExportFormat = 'pptx' | 'pdf' | 'html' | 'revealjs';

export interface ExportOptions {
  format: ExportFormat;
  includeSpeakerNotes: boolean;
  includeTeacherNotes: boolean;
  imageResolution: 'low' | 'medium' | 'high';
  branding?: {
    schoolName?: string;
    schoolLogoUrl?: string;
    footerText?: string;
  };
}
