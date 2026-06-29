import type { CurriculumItem } from '../data/curriculumData';
import type { RichCurriculumItem } from './curriculumMappingService';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface CourseRow {
  id: string;
  code: string;
  name: string;
  cycle: string;
  sort_order: number;
  objective_count: number;
}

export interface SubjectRow {
  id: string;
  name: string;
  normalized_name: string;
  sort_order: number;
  objective_count: number;
}

export interface D1ObjectiveRow {
  id: string;
  code: string;
  type: string;
  official_text: string;
  normalized_text: string;
  bloom_level: string;
  skill_tags_json: string;
  attitude_tags_json: string;
  priority_label: string;
  source_url: string;
  source_name: string;
  course_id: string;
  subject_id: string;
  axis_id: string;
  unit_id: string;
  course_code: string;
  course_name: string;
  subject_id_out: string;
  subject_name: string;
  axis_name: string;
}

export interface ObjectivesResponse {
  data: D1ObjectiveRow[];
  count: number;
  filters: Record<string, string>;
}

function normalizeRow(row: D1ObjectiveRow, nivel: string, asignatura: string): RichCurriculumItem {
  const habilidades: string[] = [];
  try {
    const tags = JSON.parse(row.skill_tags_json || '[]');
    if (Array.isArray(tags)) habilidades.push(...tags.map((t: any) => typeof t === 'string' ? t : t.text || String(t)));
  } catch { /* empty */ }

  const indicadores: string[] = [];

  return {
    nivel,
    asignatura,
    oa_id: row.code,
    oa_texto: row.official_text,
    indicadores,
    habilidades,
    id: row.id,
    code: row.code,
    course_id: row.course_id,
    subject_id: row.subject_id,
    course_code: row.course_code,
    subject_name: row.subject_name,
    source_url: row.source_url,
    source_name: row.source_name,
  };
}

export async function fetchCourses(): Promise<CourseRow[]> {
  try {
    const res = await fetch(`${API_BASE}/api/courses`);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []) as CourseRow[];
  } catch {
    return [];
  }
}

export async function fetchSubjects(courseCode?: string): Promise<SubjectRow[]> {
  try {
    const url = `${API_BASE}/api/subjects${courseCode ? `?course=${encodeURIComponent(courseCode)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []) as SubjectRow[];
  } catch {
    return [];
  }
}

export async function fetchObjectives(params: {
  level?: string;
  subject?: string;
  course?: string;
  query?: string;
}): Promise<RichCurriculumItem[]> {
  const qp = new URLSearchParams();
  if (params.level) qp.set('level', params.level);
  if (params.subject) qp.set('subject', params.subject);
  if (params.course) qp.set('course', params.course);
  if (params.query) qp.set('q', params.query);
  qp.set('limit', '200');

  try {
    const url = `${API_BASE}/api/objectives?${qp.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json() as ObjectivesResponse;
    return (json.data || []).map(row => normalizeRow(row, params.level || '', params.subject || ''));
  } catch {
    return [];
  }
}
