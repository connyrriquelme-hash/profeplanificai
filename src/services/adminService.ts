import { api } from './apiClient';

export interface Institution {
  id: string;
  name: string;
  rbd: string | null;
  country: string;
  region: string | null;
  commune: string | null;
  address: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  plan: string;
  created_at: string;
  updated_at: string | null;
  member_count?: number;
}

export interface InstitutionMember {
  id: string;
  institution_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  email?: string;
  nombre?: string;
}

export interface CalendarTemplate {
  id: string;
  institution_id: string;
  name: string;
  description: string | null;
  school_year: number;
  level_id: string | null;
  subject_id: string | null;
  weekday: number;
  start_time: string;
  end_time: string;
  block_type: string;
  room: string | null;
  repeats_weekly: number;
  starts_on: string | null;
  ends_on: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata_json: string | null;
  created_at: string;
  admin_email?: string;
}

export async function getAdminMe(): Promise<{ user: { id: string; email: string; nombre: string; rol: string }; isAdmin: boolean }> {
  const data = await api.get<{ user: { id: string; email: string; nombre: string; rol: string }; isAdmin: boolean }>('/api/admin/me');
  return data;
}

export async function listInstitutions(): Promise<Institution[]> {
  const data = await api.get<{ institutions: Institution[] }>('/api/admin/institutions');
  return data.institutions;
}

export async function createInstitution(data: { name: string; rbd?: string; region?: string; commune?: string; contact_name?: string; contact_email?: string; contact_phone?: string }): Promise<Institution> {
  const result = await api.post<{ institution: Institution }>('/api/admin/institutions', data);
  return result.institution;
}

export async function getInstitution(id: string): Promise<Institution> {
  const data = await api.get<{ institution: Institution }>(`/api/admin/institutions/${id}`);
  return data.institution;
}

export async function updateInstitution(id: string, data: Partial<Pick<Institution, 'name' | 'rbd' | 'region' | 'commune' | 'contact_name' | 'contact_email' | 'contact_phone' | 'status' | 'plan'>>): Promise<void> {
  await api.patch(`/api/admin/institutions/${id}`, data);
}

export async function listInstitutionMembers(institutionId: string): Promise<InstitutionMember[]> {
  const data = await api.get<{ members: InstitutionMember[] }>(`/api/admin/institutions/${institutionId}/members`);
  return data.members;
}

export async function addInstitutionMember(institutionId: string, data: { email: string; role?: string }): Promise<InstitutionMember> {
  const result = await api.post<{ member: InstitutionMember }>(`/api/admin/institutions/${institutionId}/members`, data);
  return result.member;
}

export async function updateInstitutionMember(institutionId: string, memberId: string, data: { role?: string; status?: string }): Promise<void> {
  await api.patch(`/api/admin/institutions/${institutionId}/members/${memberId}`, data);
}

export async function listCalendarTemplates(institutionId: string): Promise<CalendarTemplate[]> {
  const data = await api.get<{ templates: CalendarTemplate[] }>(`/api/admin/institutions/${institutionId}/calendar-templates`);
  return data.templates;
}

export async function createCalendarTemplate(institutionId: string, data: Omit<CalendarTemplate, 'id' | 'institution_id' | 'created_at' | 'created_by'>): Promise<CalendarTemplate> {
  const result = await api.post<{ template: CalendarTemplate }>(`/api/admin/institutions/${institutionId}/calendar-templates`, data);
  return result.template;
}

export async function updateCalendarTemplate(id: string, data: Partial<CalendarTemplate>): Promise<void> {
  await api.patch(`/api/admin/calendar-templates/${id}`, data);
}

export async function deleteCalendarTemplate(id: string): Promise<void> {
  await api.del(`/api/admin/calendar-templates/${id}`);
}

export async function getAdminAuditLog(): Promise<AuditLogEntry[]> {
  const data = await api.get<{ entries: AuditLogEntry[] }>('/api/admin/audit-log');
  return data.entries;
}
