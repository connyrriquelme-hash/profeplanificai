export const CURRICULUM_ORIGIN = 'https://www.curriculumnacional.cl';
export const CURRICULUM_START = `${CURRICULUM_ORIGIN}/curriculum`;

export interface ParsedObjective {
  code: string;
  type: 'OA' | 'OAH' | 'OAA';
  officialText: string;
  axis: string;
  courseCode: string;
  courseName: string;
  cycle: string;
  subject: string;
  sourceUrl: string;
}

export interface ParsedPage {
  objectives: ParsedObjective[];
  links: string[];
}

export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function slug(value: string): string {
  return normalizeText(value).replace(/\s+/g, '-').slice(0, 100) || crypto.randomUUID();
}

function decode(value: string): string {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (all, name) => named[name.toLowerCase()] ?? all);
}

function text(html: string): string {
  return decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}

export function assertCurriculumUrl(input: string): URL {
  const url = new URL(input, CURRICULUM_ORIGIN);
  if (url.protocol !== 'https:' || url.hostname !== 'www.curriculumnacional.cl') throw new Error('URL fuera de la allowlist de Currículum Nacional');
  if (!url.pathname.toLowerCase().startsWith('/curriculum')) throw new Error('Solo se permiten rutas curriculares oficiales');
  url.hash = '';
  return url;
}

function courseMetadata(pageTitle: string, url: URL): { code: string; name: string; cycle: string } {
  const source = `${pageTitle} ${url.pathname}`.toLowerCase();
  const grade = source.match(/([1-8])(?:°|º|o|-)?\s*(?:basico|básico)/) || source.match(/\/([1-8])-basico/);
  if (grade) return { code: `${grade[1]}B`, name: `${grade[1]}° Básico`, cycle: 'Educación Básica' };
  const medio = source.match(/([1-4])(?:°|º|o|-)?\s*medio/) || source.match(/\/([1-4])-medio(?:-(fg|hc|tp))?/);
  if (medio) {
    const suffix = source.includes('-hc') ? '-HC' : source.includes('-tp') ? '-TP' : source.includes('-fg') ? '-FG' : '';
    return { code: `${medio[1]}M${suffix}`, name: `${medio[1]}° Medio${suffix ? ` ${suffix.slice(1)}` : ''}`, cycle: 'Educación Media' };
  }
  if (/sala cuna|\/sc-/.test(source)) return { code: 'SC', name: 'Sala Cuna', cycle: 'Educación Parvularia' };
  if (/nivel medio|\/nm-/.test(source)) return { code: 'NM', name: 'Nivel Medio', cycle: 'Educación Parvularia' };
  if (/nivel transici|\/nt-/.test(source)) return { code: 'NT', name: 'Nivel Transición', cycle: 'Educación Parvularia' };
  return { code: 'OTRO', name: 'Nivel no identificado', cycle: 'Otro' };
}

export function parseCurriculumPage(html: string, source: string): ParsedPage {
  const url = assertCurriculumUrl(source);
  const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  const course = courseMetadata(h1, url);
  const subject = h1.replace(/\s+(?:[1-8]°\s+Básico|[1-4]°\s+Medio.*|Sala Cuna|Nivel Medio|Nivel Transición).*$/i, '').trim() || 'Asignatura no identificada';
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
    .map(match => {
      try { return assertCurriculumUrl(match[1]).toString(); } catch { return ''; }
    })
    .filter((value, index, all) => value && all.indexOf(value) === index);

  const tokens = [...html.matchAll(/<(h2|h3|h4|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  const objectives: ParsedObjective[] = [];
  let axis = '';
  let current: ParsedObjective | null = null;
  for (const token of tokens) {
    const tag = token[1].toLowerCase();
    const value = text(token[2]);
    if (!value) continue;
    if (tag === 'h2' || tag === 'h3') {
      if (!/objetivo|actitud|habilidad|explorar base|documentos|evaluaci|recursos/i.test(value)) axis = value;
      if (/actitud/i.test(value)) axis = 'Actitudes';
      if (/habilidad/i.test(value)) axis = 'Habilidades';
      continue;
    }
    if (tag === 'h4') {
      const match = value.match(/\b([A-Z]{1,8}\d{0,3}\s+OA(?:A|H)?\s+[A-Z0-9]{1,3})\b/i);
      current = null;
      if (match) {
        const code = match[1].toUpperCase().replace(/\s+/g, ' ');
        const type: ParsedObjective['type'] = /\sOAA\s/.test(code) ? 'OAA' : /\sOAH\s/.test(code) ? 'OAH' : 'OA';
        current = { code, type, officialText: '', axis, courseCode: course.code, courseName: course.name, cycle: course.cycle, subject, sourceUrl: url.toString() };
        objectives.push(current);
      }
      continue;
    }
    if (current && (tag === 'p' || tag === 'li')) current.officialText += `${current.officialText ? ' ' : ''}${value}`;
  }
  return { objectives: objectives.filter(item => item.officialText.length >= 12), links };
}

export function isCrawlCandidate(url: string): boolean {
  try {
    const path = assertCurriculumUrl(url).pathname.toLowerCase();
    return /\/curso\/(?:sc-|nm-|nt-|[1-8]-basico|[1-4]-medio)/.test(path) || /\/(?:sc-|nm-|nt-|[1-8]-basico|[1-4]-medio(?:-(?:fg|hc|tp))?)\/?$/.test(path);
  } catch { return false; }
}

export function isCoursePage(url: string): boolean {
  try {
    const path = assertCurriculumUrl(url).pathname.toLowerCase();
    return /\/curso\/(?:sc-|nm-|nt-|[1-8]-basico|[1-4]-medio)/.test(path);
  } catch { return false; }
}

export function isSubjectPage(url: string): boolean {
  try {
    const path = assertCurriculumUrl(url).pathname.toLowerCase();
    return !isCoursePage(url) && /\/(?:sc-|nm-|nt-|[1-8]-basico|[1-4]-medio(?:-(?:fg|hc|tp))?)\/?$/.test(path);
  } catch { return false; }
}

export function isCycleGroupPage(url: string): boolean {
  try {
    const path = assertCurriculumUrl(url).pathname.toLowerCase().replace(/\/+$/, '');
    return /^\/curriculum\/[^/]+$/.test(path) && !/\/curso$/.test(path);
  } catch { return false; }
}
