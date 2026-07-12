/** Product types for the pedagogical product renderers */

export type SupportedProductType =
  | 'checklist'
  | 'lista_cotejo'
  | 'rubrica'
  | 'rubrica_formativa'
  | 'escala_apreciacion'
  | 'ticket_salida'
  | 'ticket_entrada'
  | 'guia_aprendizaje'
  | 'guia_estudiante'
  | 'guia_docente'
  | 'guia_dua'
  | 'material_didactico'
  | 'actividad'
  | 'proyecto'
  | 'experimento'
  | 'formato_321'
  | 'organizador_grafico'
  | 'evaluacion'
  | 'semaforo'
  | 'bitacora_cientifica';

export interface ProductMetadata {
  title: string;
  subtitle?: string;
  level?: string;
  subject?: string;
  oaCode?: string;
  oaText?: string;
  topic?: string;
  date?: string;
  teacherName?: string;
  estimatedTime?: number;
}

export interface PedagogicalProduct {
  type: SupportedProductType;
  metadata: ProductMetadata;
  data: Record<string, unknown>;
}

export interface ChecklistItem {
  criterion: string;
  description?: string;
  achieved?: boolean;
  observed?: boolean;
  notes?: string;
}

export interface RubricLevel {
  name: string;
  description: string;
  score: number;
}

export interface RubricCriterion {
  criterion?: string;
  name?: string;
  description?: string;
  levels: RubricLevel[];
  weight?: number;
}

export interface ScaleLevel {
  level: string;
  description: string;
  color: string;
}

export interface ThreeTwoOneCard {
  type: 'three' | 'two' | 'one';
  prompt: string;
  items: string[];
}

export interface GraphicOrganizerNode {
  label: string;
  children?: string[];
  color?: string;
}

export interface EvaluationQuestion {
  question: string;
  type: 'open' | 'closed' | 'multiple';
  options?: string[];
  points?: number;
}

export interface ExperimentStep {
  step: number;
  instruction: string;
  observation?: string;
  caution?: string;
  safetyNote?: string;
}

export interface ExperimentHypothesis {
  if: string;
  then: string;
  because: string;
}

export interface ProjectTask {
  task: string;
  responsible?: string;
  deadline?: string;
  status?: string;
}

export interface GuideSection {
  title: string;
  content: string;
  activities?: string[];
}

export interface DUASection {
  principle: string;
  strategies: string[];
  accommodations?: string[];
}

export interface ActivityPhase {
  phase?: string;
  name?: string;
  description: string;
  duration?: string;
  materials?: string[];
}

export interface TicketContent {
  question: string;
  response?: string;
}