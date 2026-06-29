export type SlideType =
  | 'cover'
  | 'activation'
  | 'explanation'
  | 'guided-practice'
  | 'independent-practice'
  | 'formative-assessment'
  | 'closure';

export type DiagramType = 'process' | 'cycle' | 'hierarchy' | 'comparison';

export interface DiagramNode {
  id: string;
  label: string;
  description?: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface SlideDiagram {
  type: DiagramType;
  nodes: DiagramNode[];
  edges?: DiagramEdge[];
}

export interface SlideTable {
  headers: string[];
  rows: string[][];
}

export interface Slide {
  type: SlideType;
  title: string;
  subtitle?: string;
  bullets?: string[];
  activity?: string;
  example?: string;
  instructions?: string;
  materials?: string[];
  questions?: string[];
  successCriteria?: string[];
  metacognition?: string;
  exitTicket?: string;
  visualPrompt?: string;
  speakerNotes?: string;
  diagram?: SlideDiagram;
  table?: SlideTable;
}

export interface SlideLesson {
  title: string;
  subtitle: string;
  course: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  theme?: string;
  slides: Slide[];
}
