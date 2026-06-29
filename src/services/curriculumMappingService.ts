import type { CurriculumItem } from '../data/curriculumData';

export interface D1CurriculumFields {
  id?: string;
  code?: string;
  course_id?: string;
  subject_id?: string;
  course_code?: string;
  course_name?: string;
  subject_name?: string;
  source_url?: string;
  source_name?: string;
}

export type RichCurriculumItem = CurriculumItem & D1CurriculumFields;

const COURSE_MAP: Record<string, string> = {
  '1° básico': 'course-1b',
  '2° básico': 'course-2b',
  '3° básico': 'course-3b',
  '4° básico': 'course-4b',
  '5° básico': 'course-5b',
  '6° básico': 'course-6b',
  '7° básico': 'course-7b',
  '8° básico': 'course-8b',
  '1° medio': 'course-1m',
  '2° medio': 'course-2m',
  '3° medio': 'course-3m',
  '4° medio': 'course-4m',
  'Sala Cuna': 'course-sala-cuna',
  'Medio Menor': 'course-medio-menor',
  'Medio Mayor': 'course-medio-mayor',
  'Prekinder': 'course-prekinder',
  'NT1': 'course-prekinder',
  'Kinder': 'course-kinder',
  'NT2': 'course-kinder',
};

const COURSE_LABEL_FROM_ID: Record<string, string> = Object.fromEntries(
  Object.entries(COURSE_MAP).map(([k, v]) => [v, k])
);

const SUBJECT_DISPLAY_NAMES: Record<string, string[]> = {
  'subject-lenguaje-y-comunicacion': ['Lenguaje y Comunicación', 'Lenguaje y Comunicacion'],
  'subject-lengua-y-literatura': ['Lengua y Literatura'],
  'subject-matematica': ['Matemática', 'Matematica'],
  'subject-ciencias-naturales': ['Ciencias Naturales'],
  'subject-historia-geografia-y-ciencias-sociales': ['Historia, Geografía y Ciencias Sociales', 'Historia Geografia y Ciencias Sociales', 'Historia'],
  'subject-tecnologia': ['Tecnología', 'Tecnologia'],
  'subject-artes-visuales': ['Artes Visuales'],
  'subject-musica': ['Música', 'Musica'],
  'subject-educacion-fisica-y-salud': ['Educación Física y Salud', 'Educacion Fisica y Salud', 'Educación Física'],
  'subject-orientacion': ['Orientación', 'Orientacion'],
  'subject-ingles-propuesta': ['Inglés', 'Ingles', 'Idioma Extranjero Inglés'],
  'subject-comunicacion-integral': ['Comunicación Integral', 'Comunicacion Integral'],
  'subject-interaccion-y-comprension-del-entorno': ['Interacción y Comprensión del Entorno', 'Interaccion y Comprension del Entorno'],
  'subject-desarrollo-personal-y-social': ['Desarrollo Personal y Social'],
  'subject-lengua-y-cultura-de-los-pueblos-originarios-ancestrales': ['Lengua y Cultura de los Pueblos Originarios Ancestrales', 'Lengua y Cultura de los Pueblos Originarios'],
  'subject-filosofia': ['Filosofía', 'Filosofia'],
  'subject-educacion-ciudadana': ['Educación Ciudadana', 'Educacion Ciudadana'],
  'subject-ciencias-para-la-ciudadania': ['Ciencias para la Ciudadanía', 'Ciencias para la Ciudadania'],
  'subject-artes': ['Artes'],
  'subject-ciencias-de-la-energia': ['Ciencias de la Energía', 'Ciencias de la Energia'],
  'subject-ciencias-del-ecosistema': ['Ciencias del Ecosistema'],
};

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[áéíóúñ]/g, c => {
    const m: Record<string, string> = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n' };
    return m[c] || c;
  }).replace(/[^a-z0-9]/g, '');
}

export function getCourseIdFromLabel(label: string): string | null {
  if (!label) return null;
  const direct = COURSE_MAP[label];
  if (direct) return direct;
  const norm = normalizeName(label);
  for (const [display, id] of Object.entries(COURSE_MAP)) {
    if (normalizeName(display) === norm) return id;
  }
  return label;
}

export function getSubjectIdFromLabel(label: string): string | null {
  if (!label) return null;
  const norm = normalizeName(label);
  for (const [id, names] of Object.entries(SUBJECT_DISPLAY_NAMES)) {
    if (norm === normalizeName(id.replace('subject-', ''))) return id;
    for (const name of names) {
      if (norm === normalizeName(name)) return id;
    }
  }
  return label;
}

export function getCourseLabelFromId(courseId: string): string {
  return COURSE_LABEL_FROM_ID[courseId] || courseId;
}

export function getSubjectLabelFromId(subjectId: string): string {
  const names = SUBJECT_DISPLAY_NAMES[subjectId];
  return names?.[0] || subjectId;
}

export function normalizeObjectiveCode(code: string): string {
  if (!code) return '';
  const cleaned = code.trim().toUpperCase();
  const match = cleaned.match(/([A-Z]+\d+)\s+OA\s+(\d+)/i);
  if (match) return `${match[1]} OA ${match[2].padStart(2, '0')}`;
  const shortMatch = cleaned.match(/^OA\s+(\d+)$/i);
  if (shortMatch) return `OA ${shortMatch[1].padStart(2, '0')}`;
  return cleaned;
}

export function extractShortObjectiveCode(code: string): string {
  if (!code) return '';
  const match = code.match(/OA\s+(\d+)/i);
  if (match) return `OA ${match[1]}`;
  return code;
}

export function resolveObjectiveDisplayLabel(obj: CurriculumItem | RichCurriculumItem | null): string {
  if (!obj) return '';
  const code = (obj as RichCurriculumItem).code || obj.oa_id;
  return extractShortObjectiveCode(code);
}

export function resolveObjectiveRealCode(obj: CurriculumItem | RichCurriculumItem | null): string {
  if (!obj) return '';
  return (obj as RichCurriculumItem).code || obj.oa_id || '';
}

export function resolveObjectiveRealId(obj: CurriculumItem | RichCurriculumItem | null): string {
  if (!obj) return '';
  return (obj as RichCurriculumItem).id || '';
}

export function resolveObjectiveRealPayload(obj: CurriculumItem | RichCurriculumItem | null): {
  objectiveId: string;
  objectiveCode: string;
  objectiveText: string;
} {
  const rich = obj as RichCurriculumItem;
  return {
    objectiveId: rich?.id || '',
    objectiveCode: rich?.code || obj?.oa_id || '',
    objectiveText: obj?.oa_texto || '',
  };
}

export function hasD1Record(obj: CurriculumItem | RichCurriculumItem | null): boolean {
  return !!(obj && (obj as RichCurriculumItem).id);
}

export function getCourseDisplayName(course: { name?: string; code?: string } | string | null): string {
  if (!course) return '';
  if (typeof course === 'string') {
    const label = COURSE_LABEL_FROM_ID[course] || course;
    const norm = normalizeName(course);
    for (const [display] of Object.entries(COURSE_MAP)) {
      if (normalizeName(display) === norm) return display;
    }
    return label;
  }
  return course.name || course.code || '';
}

export function getSubjectDisplayName(subject: { name?: string; normalized_name?: string } | string | null): string {
  if (!subject) return '';
  if (typeof subject === 'string') {
    const norm = normalizeName(subject);
    for (const [id, names] of Object.entries(SUBJECT_DISPLAY_NAMES)) {
      if (norm === normalizeName(id.replace('subject-', ''))) return names[0];
      for (const name of names) {
        if (norm === normalizeName(name)) return names[0];
      }
    }
    return subject;
  }
  return subject.name || subject.normalized_name || '';
}
