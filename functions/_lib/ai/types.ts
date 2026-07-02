export type AgentType =
  | 'actividades_clase'
  | 'generador_recursos'
  | 'evaluador'
  | 'simce'
  | 'rubrica'
  | 'dua'
  | 'presentacion'
  | 'retroalimentacion'
  | 'curricular_checker';

export type TaskType =
  | 'generar'
  | 'mejorar'
  | 'adaptar'
  | 'evaluar'
  | 'crear_guia'
  | 'crear_rubrica'
  | 'crear_ticket_salida'
  | 'crear_ppt'
  | 'crear_reporte'
  | 'crear_evaluacion'
  | 'crear_retroalimentacion';

export type ProviderName = 'workers-ai' | 'gemini' | 'openrouter' | 'huggingface' | 'local';

export interface AIRequest {
  agentType: AgentType;
  taskType: TaskType;
  lessonId?: string;
  course?: string;
  subject?: string;
  grade?: string;
  oa?: string;
  oaCode?: string;
  oaText?: string;
  indicators?: string[];
  skills?: string[];
  attitudes?: string[];
  instructions?: string;
  outputFormat?: 'text' | 'json' | 'markdown';
  existingContent?: string;
  pedagogicalContext?: string;
}

export interface AIResponse {
  ok: boolean;
  provider: ProviderName;
  model: string;
  agentType: AgentType;
  taskType: TaskType;
  content: string;
  structured: Record<string, unknown>;
  warnings: string[];
  usedFallback: boolean;
  durationMs: number;
}

export interface ProviderStatus {
  available: boolean;
  model?: string;
  error?: string;
}

export interface ProviderResult {
  ok: boolean;
  content: string;
  model: string;
  provider: ProviderName;
  structured?: Record<string, unknown>;
  error?: string;
}

export interface AIEnv {
  DB: D1Database;
  JWT_SECRET?: string;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  HUGGINGFACE_API_KEY?: string;
  AI_DEFAULT_MODEL_GEMINI?: string;
  AI?: { run: (model: string, input: unknown) => Promise<unknown> };
  REPO_PEDAGOGICO?: {
    query: (vector: number[], options: { topK: number; returnMetadata?: boolean }) => Promise<{
      matches?: Array<{ id: string; score?: number; metadata?: Record<string, unknown> }>;
    }>;
  };
}

export const VALID_AGENT_TYPES: AgentType[] = [
  'actividades_clase', 'generador_recursos', 'evaluador', 'simce',
  'rubrica', 'dua', 'presentacion', 'retroalimentacion', 'curricular_checker',
];

export const VALID_TASK_TYPES: TaskType[] = [
  'generar', 'mejorar', 'adaptar', 'evaluar', 'crear_guia',
  'crear_rubrica', 'crear_ticket_salida', 'crear_ppt', 'crear_reporte',
  'crear_evaluacion', 'crear_retroalimentacion',
];
