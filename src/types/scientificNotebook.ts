/** Types for Classroom Scientific Notebook System

Rich, structured schema for scientific notebooks that are classroom-ready.
Replaces generic JSON with detailed, validated structure.
*/

import type { EducationGroup } from './education-level';

export interface ScientificNotebookMetadata {
  title: string;
  subtitle: string;
  level: string;
  educationGroup: EducationGroup;
  subject: string;
  oaCode: string;
  oaText: string;
  topic: string;
  date: string;
  teacherName: string;
  estimatedTime: number;
}

export interface ScientificNotebookIntro {
  motivatingQuestion: string;
  childFriendlyExplanation: string;
  visualPrompt: string;
  priorKnowledgePrompt: string;
}

export interface ScientificNotebookMaterial {
  name: string;
  quantity: string;
  icon: string;
  safetyNote: string;
}

export interface ScientificNotebookStep {
  step: number;
  instruction: string;
  teacherSupport: string;
  studentAction: string;
  visualCue: string;
  estimatedMinutes: number;
}

export interface ScientificObservationRecord {
  date: string;
  observation: string;
  change: string;
  drawingPrompt: string;
  climate: string;
  measurement: string;
  evidenceType: string;
}

export interface ScientificNotebookTable {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
  editable: boolean;
  studentFillable: boolean;
  columnTypes: string[];
}

export interface ScientificDrawingArea {
  title: string;
  instruction: string;
  size: 'small' | 'medium' | 'large' | 'full';
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
}

export interface ScientificNotebookQuestions {
  before: string;
  during: string;
  after: string;
  newQuestions: string[];
}

export interface ScientificNotebookHypothesis {
  enabled: boolean;
  prompt: string;
  sentenceStarter: string;
  drawingOption: string;
}

export interface ScientificNotebookConclusion {
  prompt: string;
  sentenceStarter: string;
  teacherDictationAllowed: boolean;
  evidenceReference: string;
}

export interface ScientificNotebookDUA {
  pictograms: string[];
  oralResponse: string;
  drawingResponse: string;
  sentenceStarters: string[];
  reducedText: string;
  challengeExtension: string;
}

export interface ScientificNotebookAssessment {
  checklist: string[];
  selfAssessment: string[];
  teacherFeedback: string;
  evidenceCriteria: string[];
}

export interface ScientificNotebookPortfolio {
  photos: string[];
  audio: string[];
  video: string[];
  attachments: string[];
  timeline: string[];
}

export interface ScientificNotebookExports {
  pdf: boolean;
  word: boolean;
  print: boolean;
  ppt: boolean;
}

export interface ClassroomScientificNotebook {
  metadata: ScientificNotebookMetadata;
  intro: ScientificNotebookIntro;
  materials: ScientificNotebookMaterial[];
  procedure: ScientificNotebookStep[];
  observationRecords: ScientificObservationRecord[];
  tables: ScientificNotebookTable[];
  drawingAreas: ScientificDrawingArea[];
  questions: ScientificNotebookQuestions;
  hypothesis: ScientificNotebookHypothesis;
  conclusion: ScientificNotebookConclusion;
  dua: ScientificNotebookDUA;
  assessment: ScientificNotebookAssessment;
  portfolio: ScientificNotebookPortfolio;
  exports: ScientificNotebookExports;
}