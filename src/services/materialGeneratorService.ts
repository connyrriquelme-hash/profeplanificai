/**
 * Material Generator Service
 * Connects frontend to /api/materials/* endpoints
 */

export type FormativeEvaluationType =
  | 'evaluation_exit_ticket'
  | 'evaluation_321'
  | 'evaluation_checklist'
  | 'evaluation_formative_rubric'
  | 'evaluation_traffic_light';

export interface MaterialRequest {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  topic: string;
  additionalContext?: string;
  methodology?: string;
  designStyle?: string;
  duration?: string;
  studentCount?: number;
  questionCount?: number;
  difficulty?: string;
  type?: string;
  criteria?: string[];
  evaluationSubType?: FormativeEvaluationType;
}

export interface MaterialResult {
  ok: boolean;
  resourceId?: string;
  guide?: any;
  evaluation?: any;
  rubric?: any;
  slides?: any[];
  prompt?: string;
  context?: any;
  error?: string;
}

async function postJSON(url: string, body: MaterialRequest): Promise<MaterialResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function generateGuide(req: MaterialRequest, type: 'guia_estudiante' | 'guia_docente'): Promise<MaterialResult> {
  return postJSON(`/api/materials/guide?type=${type}`, { ...req, type });
}

export async function generateEvaluation(req: MaterialRequest): Promise<MaterialResult> {
  return postJSON('/api/materials/evaluation', req);
}

export async function generateFormativeEvaluation(req: MaterialRequest, subType: FormativeEvaluationType): Promise<MaterialResult> {
  return postJSON('/api/materials/evaluation/formative', { ...req, evaluationSubType: subType });
}

export async function generateRubric(req: MaterialRequest): Promise<MaterialResult> {
  return postJSON('/api/materials/rubric', req);
}

export async function generatePresentation(req: MaterialRequest): Promise<MaterialResult> {
  return postJSON('/api/materials/presentation', req);
}

export async function generateMaterial(req: MaterialRequest, type: string): Promise<MaterialResult> {
  return postJSON(`/api/materials/generate?type=${type}`, req);
}
