import { api } from './apiClient';

export interface TeacherClass {
  id: string;
  school_year: number;
  level_id: string;
  subject_id: string;
  course_name: string;
  class_name: string;
  color: string;
  is_active?: number;
}

export interface LessonInstance {
  id: string;
  class_id: string;
  schedule_slot_id?: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  status: 'planificada' | 'en_preparacion' | 'realizada' | 'pendiente';
  title: string;
  notes?: string;
  is_virtual?: boolean;
  course_name?: string;
  class_name?: string;
  level_id?: string;
  subject_id?: string;
  color?: string;
}

export interface LessonPlan {
  id: string;
  lesson_instance_id: string;
  title: string;
  objective_text?: string;
  purpose_text?: string;
  beginning_text?: string;
  development_text?: string;
  closure_text?: string;
  challenge_question?: string;
  abp_project_text?: string;
  resources_text?: string;
  evaluation_text?: string;
  instruments_text?: string;
  dua_adjustments_text?: string;
  teacher_observations?: string;
  autosave_version?: number;
}

export interface LessonBundle {
  lesson: LessonInstance & Record<string, unknown>;
  plan: LessonPlan;
  curriculum?: Record<string, unknown> | null;
  methodologies: Record<string, unknown>[];
  resources: Record<string, unknown>[];
  evaluations: Record<string, unknown>[];
  comments: Record<string, unknown>[];
  attachments: Record<string, unknown>[];
}

export function listTeacherClasses(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  });
  return api.get<{ data: TeacherClass[] }>(`/api/my-classes?${qs.toString()}`);
}

export function createTeacherClass(payload: Record<string, unknown>) {
  return api.post<{ data: TeacherClass }>('/api/my-classes', payload);
}

export function deleteTeacherClass(id: string) {
  return api.del<{ ok: boolean }>(`/api/my-classes/${encodeURIComponent(id)}`);
}

export function getCalendar(week?: string) {
  const qs = week ? `?week=${encodeURIComponent(week)}` : '';
  return api.get<{ data: LessonInstance[]; week: { start: string; end: string } }>(`/api/my-classes/calendar${qs}`);
}

export function createSchedule(payload: Record<string, unknown>) {
  return api.post<{ data: { schedule_id: string; slot_id: string } }>('/api/my-classes/schedule', payload);
}

export function deleteSchedule(slotId: string, mode: 'slot' | 'series' = 'series') {
  return api.del<{ ok: boolean }>(`/api/my-classes/schedule/${encodeURIComponent(slotId)}?mode=${mode}`);
}

export function createLesson(payload: Record<string, unknown>) {
  return api.post<{ data: { id: string; lesson_plan_id: string } }>('/api/lessons', payload);
}

export function getLesson(id: string) {
  return api.get<{ data: LessonBundle }>(`/api/lessons/${encodeURIComponent(id)}`);
}

export function updateLesson(id: string, payload: Record<string, unknown>) {
  return api.patch<{ ok: boolean }>(`/api/lessons/${encodeURIComponent(id)}`, payload);
}

export function deleteLesson(id: string) {
  return api.del<{ ok: boolean }>(`/api/lessons/${encodeURIComponent(id)}`);
}

export function autosaveLesson(id: string, payload: Record<string, unknown>) {
  return api.post<{ ok: boolean; message: string; saved_at: string; touched: number }>(`/api/lessons/${encodeURIComponent(id)}/autosave`, payload);
}

export function generateLessonResource(id: string, action: string) {
  return api.post<{ ok: boolean; message: string; data: Record<string, unknown> }>(`/api/lessons/${encodeURIComponent(id)}/generate-resource`, { action });
}

export function generateLessonEvaluation(id: string, action: string) {
  return api.post<{ ok: boolean; message: string; data: Record<string, unknown> }>(`/api/lessons/${encodeURIComponent(id)}/generate-evaluation`, { action });
}

export interface NonTeachingBlock {
  id: string;
  teacher_id: string;
  block_type: string;
  non_teaching_type: string;
  title: string;
  description: string;
  block_date: string;
  start_time: string;
  end_time: string;
  location: string;
  priority: string;
  course_name: string;
  subject_name: string;
  status: string;
  reminder_enabled: number;
  reminder_minutes_before: number;
  reminder_email: string;
  reminder_status: string;
  requires_follow_up: number;
  follow_up_notes: string;
  created_at: string;
  updated_at: string;
  is_non_teaching?: number;
  color?: string;
}

export function getNonTeachingBlocks(week: string) {
  return api.get<{ data: NonTeachingBlock[]; week: { start: string; end: string } }>(`/api/non-teaching-blocks?week=${encodeURIComponent(week)}`);
}

export function createNonTeachingBlock(payload: Record<string, unknown>) {
  return api.post<{ ok: boolean; data: { id: string } }>('/api/non-teaching-blocks', payload);
}

export function updateNonTeachingBlock(id: string, payload: Record<string, unknown>) {
  return api.patch<{ ok: boolean }>(`/api/non-teaching-blocks/${encodeURIComponent(id)}`, payload);
}

export function deleteNonTeachingBlock(id: string) {
  return api.del<{ ok: boolean }>(`/api/non-teaching-blocks/${encodeURIComponent(id)}`);
}

export function generateLessonPresentation(id: string) {
  return api.post<{ ok: boolean; message: string; data: Record<string, unknown> }>(`/api/lessons/${encodeURIComponent(id)}/generate-presentation`, {});
}

export function generateActividadesClase(id: string, options?: { force?: boolean; instructions?: string }) {
  return api.post<{ ok: boolean; message: string; data: Record<string, unknown>; error?: string }>(`/api/lessons/${encodeURIComponent(id)}/generate-actividades-clase`, options || {});
}
