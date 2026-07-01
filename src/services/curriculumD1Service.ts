interface D1Course { id: string; code: string; name: string; cycle: string; sort_order: number; objective_count: number; }
interface D1Subject { id: string; name: string; normalized_name: string; objective_count: number; }
interface D1Objective { id: string; code: string; type: string; official_text: string; normalized_text: string; bloom_level: string; subject_name: string; course_name: string; axis_name: string; }
interface D1Indicator { id: string; oa_code: string; indicator_text: string; observable_action: string; evaluation_type: string; evidence_type: string; difficulty_level: string; source: string; status: string; }
interface D1Skill { id: string; code: string; official_text: string; subject_id: string; }

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function unwrap(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function getCourses(): Promise<D1Course[]> {
  const data = await fetchJSON<any>('/api/courses');
  return unwrap(data).filter((c: any) => (c.objective_count || 0) > 0);
}

export async function getSubjects(): Promise<D1Subject[]> {
  const data = await fetchJSON<any>('/api/subjects');
  return unwrap(data).filter((s: any) => (s.objective_count || 0) > 0);
}

export async function getSubjectsByCourse(courseId: string): Promise<D1Subject[]> {
  const data = await fetchJSON<any>(`/api/subjects?course=${encodeURIComponent(courseId)}`);
  const items = unwrap(data).filter((s: any) => (s.objective_count || 0) > 0);
  if (items.length > 0) return items;
  const all = await fetchJSON<any>('/api/subjects');
  return unwrap(all).filter((s: any) => (s.objective_count || 0) > 0);
}

export async function getObjectives(courseId: string, subjectId: string): Promise<D1Objective[]> {
  const data = await fetchJSON<any>(`/api/objectives?course=${encodeURIComponent(courseId)}&subject=${encodeURIComponent(subjectId)}&limit=200`);
  return unwrap(data);
}

export async function getIndicatorsByObjective(oaCode: string): Promise<D1Indicator[]> {
  const data = await fetchJSON<any>(`/api/curriculum/indicators?oa_code=${encodeURIComponent(oaCode)}&limit=100`);
  return unwrap(data?.indicators || data?.data || data);
}

export async function getSkillsByObjective(objectiveId: string): Promise<D1Skill[]> {
  const data = await fetchJSON<any>(`/api/curriculum/skills?objective_id=${encodeURIComponent(objectiveId)}`);
  return unwrap(data?.data || data);
}

export async function getSkillsBySubject(subjectName: string): Promise<D1Skill[]> {
  const data = await fetchJSON<any>(`/api/curriculum/skills?subject=${encodeURIComponent(subjectName)}`);
  return unwrap(data?.data || data);
}

export function findPreferredSubject(subjects: D1Subject[]): D1Subject | null {
  if (subjects.length === 0) return null;
  return subjects.find(s => s.name === 'Lenguaje y Comunicación')
    || subjects.find(s => s.name === 'Matemática')
    || subjects.find(s => (s.objective_count || 0) > 0)
    || subjects[0];
}
