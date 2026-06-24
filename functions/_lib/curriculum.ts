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

/** Extract course metadata from page title and URL */
export function courseMetadata(pageTitle: string, url: string): { code: string; name: string; cycle: string } {
  const source = `${pageTitle} ${url}`.toLowerCase();

  // Parvularia
  if (/sala cuna|\/sc-|\bsc\b/.test(source)) return { code: 'SC', name: 'Sala Cuna', cycle: 'Educación Parvularia' };
  if (/nivel medio|\/nm-|\bnm\b/.test(source) && !/transicion|nt/i.test(source)) return { code: 'NM', name: 'Nivel Medio', cycle: 'Educación Parvularia' };
  if (/nivel transici|\/nt-|\bnt\b/.test(source)) return { code: 'NT', name: 'Nivel Transición', cycle: 'Educación Parvularia' };

  // Básica 1°-6°
  const basico = source.match(/([1-6])[°ºo]?\s*basico/) || source.match(/([1-6])-basico/);
  if (basico) return { code: `${basico[1]}B`, name: `${basico[1]}° Básico`, cycle: 'Educación Básica' };

  // Básica 7°-8°
  const basico78 = source.match(/([78])[°ºo]?\s*basico/) || source.match(/([78])-basico/);
  if (basico78) return { code: `${basico78[1]}B`, name: `${basico78[1]}° Básico`, cycle: 'Educación Básica' };

  // Media
  const medio = source.match(/([1-4])[°ºo]?\s*medio(?:-(fg|hc|tp))?/) || source.match(/\/([1-4])-medio(?:-(fg|hc|tp))?/);
  if (medio) {
    const suffix = medio[2] ? `-${medio[2].toUpperCase()}` : '';
    return { code: `${medio[1]}M${suffix}`, name: `${medio[1]}° Medio${suffix ? ` ${suffix.slice(1)}` : ''}`, cycle: 'Educación Media' };
  }

  return { code: 'OTRO', name: 'Nivel no identificado', cycle: 'Otro' };
}

/**
 * Determine if a URL should be crawled by the scanner.
 * Accepts: main curriculum page, cycle group pages, course pages, subject pages
 */
const parvCourseSlug = '(?:sc|nm|nt)(?:-[a-z-]+)?';
const gradeSlug = `(?:${parvCourseSlug}|[1-8]-basico|[1-4]-medio(?:-(?:fg|hc|tp))?)`;
const cycleGroupPath = '(?:educacion-parvularia|1o-6o-basico|7o-basico-2o?-medio|3o-4o-medio(?:-tecnico-profesional)?)';

export function isCrawlCandidate(url: string): boolean {
  try {
    const u = assertCurriculumUrl(url);
    const path = u.pathname.toLowerCase();
    // Main curriculum page and cycle group pages
    if (path === '/curriculum' || path === '/curriculum/') return true;
    if (new RegExp(`^/curriculum/${cycleGroupPath}$`).test(path)) return true;
    // Course/grade pages
    if (new RegExp(`/curso/${gradeSlug}$`).test(path)) return true;
    // Subject pages (contain OAs) – must have both subject name and grade
    if (new RegExp(`^/curriculum/[^/]+/[^/]+/${gradeSlug}$`).test(path)) return true;
    // Subject index pages within a cycle
    if (/^\/curriculum\/[^/]+\/[a-z][a-z0-9-]+$/.test(path) && !/curso|ambitos|asignaturas|cursos-y-niveles/i.test(path)) return true;
    return false;
  } catch { return false; }
}

/** Check if a URL points to a subject+grade page (leaf page with OAs) */
export function isSubjectPage(url: string): boolean {
  try {
    const u = assertCurriculumUrl(url);
    const path = u.pathname.toLowerCase();
    return new RegExp(`^/curriculum/[^/]+/[a-z][a-z0-9-]+/${gradeSlug}$`).test(path);
  } catch { return false; }
}

/** Check if URL is a course/grade listing page (shows subjects for a grade) */
export function isCoursePage(url: string): boolean {
  try {
    const u = assertCurriculumUrl(url);
    const path = u.pathname.toLowerCase();
    return new RegExp(`/curso/${gradeSlug}$`).test(path);
  } catch { return false; }
}

/** Check if URL is a cycle group page (shows subjects with grade links) */
export function isCycleGroupPage(url: string): boolean {
  try {
    const u = assertCurriculumUrl(url);
    const path = u.pathname.toLowerCase();
    return new RegExp(`^/curriculum/${cycleGroupPath}$`).test(path);
  } catch { return false; }
}

/** Extract text content from a specific HTML section by class or ID pattern */
function extractSection(html: string, idOrClass: string): string {
  const section = html.match(new RegExp(`<div[^>]*(?:id=["']${idOrClass}["']|class=["'][^"']*\\b${idOrClass}\\b[^"']*["'])[^>]*>([\\s\\S]*?)<\\/div>`, 'i'));
  return section ? section[1] : html;
}

/**
 * Parse a subject+grade page (leaf page that contains OA/OAH/OAA items).
 * URL pattern: /curriculum/{cycle}/{subject}/{grade}
 */
export function parseSubjectPage(html: string, sourceUrl: string): ParsedObjective[] {
  const url = assertCurriculumUrl(sourceUrl);
  const objectives: ParsedObjective[] = [];

  // Get page metadata
  const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  const course = courseMetadata(h1, url.toString());

  // Extract subject name from h1: "Matemática 1° Básico" → "Matemática", "Lenguaje y Comunicación 1° Básico" → "Lenguaje y Comunicación"
  const gradePattern = /[\s:]+(?:[1-8][°ºo]?\s*Básico|[1-4][°ºo]?\s*Medio(?:\s+(?:FG|HC|TP))?|SC\s*\(Sala Cuna\)|NM\s*\(Nivel Medio\)|NT\s*\(Nivel Transición\))/i;
  const subject = h1.replace(gradePattern, '').trim() || 'Asignatura no identificada';

  // Find the data-wrapper section (contains all OA/OAH/OAA)
  // Use a depth counter to find matching close tag for data-wrapper
  const dataWrapperMatch = html.match(/<div\s+class="data-wrapper">/i);
  if (!dataWrapperMatch) return objectives;
  const dwStart = dataWrapperMatch.index! + dataWrapperMatch[0].length;
  let depth = 1;
  let dwEnd = dwStart;
  const dwContent = html.slice(dwStart);
  const divRe = /<\/?div[^>]*>/gi;
  let divMatch;
  while ((divMatch = divRe.exec(dwContent)) !== null) {
    if (divMatch[0].startsWith('</div')) {
      depth--;
      if (depth === 0) { dwEnd = dwStart + divMatch.index; break; }
    } else {
      depth++;
    }
  }
  const content = html.slice(dwStart, dwEnd);

  // Find all items-wrapper sections (outer container with h3 axis title)
  const itemsSections: { index: number; html: string }[] = [];
  const iwRe = /<div\s+class="items-wrapper">/gi;
  let iwMatch;
  while ((iwMatch = iwRe.exec(content)) !== null) {
    let d = 1;
    let start = iwMatch.index! + iwMatch[0].length;
    let end = start;
    const sectionContent = content.slice(start);
    const tagRe = /<\/?div[^>]*>/gi;
    let tagMatch;
    while ((tagMatch = tagRe.exec(sectionContent)) !== null) {
      if (tagMatch[0].startsWith('</div')) {
        d--;
        if (d === 0) { end = start + tagMatch.index; break; }
      } else {
        d++;
      }
    }
    itemsSections.push({ index: iwMatch.index, html: content.slice(start, end) });
  }

  let currentSection = 'Eje';

  for (const section of itemsSections) {
    const sectionHtml = section.html;

    // Detect section type from preceding h2 in the content
    const beforeH2 = content.slice(0, section.index).match(/<h2[^>]*id="(habilidad|actitud)[^>]*>/i);
    currentSection = beforeH2 ? (beforeH2[1] === 'habilidad' ? 'Habilidad' : 'Actitud') : 'Eje';

    // Extract axis name from h3
    const axisMatch = sectionHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    const currentAxis = axisMatch ? text(axisMatch[1]) : '';

    // Filter out section titles
    if (/^(eje|habilidad|actitud)$/i.test(currentAxis)) continue;

    // Find item-wrappers container using depth counter
    const iwrMatch = sectionHtml.match(/<div\s+class="item-wrappers">/i);
    if (!iwrMatch) continue;
    let d = 1;
    const iwrStart = iwrMatch.index! + iwrMatch[0].length;
    const iwrContent = sectionHtml.slice(iwrStart);
    const tagRe2 = /<\/?div[^>]*>/gi;
    let iwrEnd = iwrStart;
    let tagMatch2;
    while ((tagMatch2 = tagRe2.exec(iwrContent)) !== null) {
      if (tagMatch2[0].startsWith('</div')) {
        d--;
        if (d === 0) { iwrEnd = iwrStart + tagMatch2.index; break; }
      } else {
        d++;
      }
    }
    const itemsWrapperContent = sectionHtml.slice(iwrStart, iwrEnd);

    // Find all item-wrapper (individual OA/OAH/OAA items)
    const items: { html: string }[] = [];
    const itRe = /<div\s+class="item-wrapper[^"]*">/gi;
    let itMatch;
    while ((itMatch = itRe.exec(itemsWrapperContent)) !== null) {
      let dd = 1;
      const itStart = itMatch.index! + itMatch[0].length;
      const itContent = itemsWrapperContent.slice(itStart);
      const tagRe3 = /<\/?div[^>]*>/gi;
      let itEnd = itStart;
      let tagMatch3;
      while ((tagMatch3 = tagRe3.exec(itContent)) !== null) {
        if (tagMatch3[0].startsWith('</div')) {
          dd--;
          if (dd === 0) { itEnd = itStart + tagMatch3.index; break; }
        } else {
          dd++;
        }
      }
      items.push({ html: itemsWrapperContent.slice(itStart, itEnd) });
    }

    for (const item of items) {
      const itemHtml = item.html;

      // Extract code from number-title span
      const codeMatch = itemHtml.match(/<span\s+class="number-title">\s*([^<]+)\s*<\/span>/i);
      const titleMatch = itemHtml.match(/<span\s+class="oa-title">([\s\S]*?)<\/span>/i);

      let code = '';

      if (codeMatch) {
        code = text(codeMatch[1]);
      } else if (titleMatch) {
        const fullTitle = text(titleMatch[1]);
        const titleCodeMatch = fullTitle.match(/([A-Z]{2}\d+\s+(?:OA\s+\d+|OAH\s+[a-z]|OAA\s+[A-Z]))/i);
        if (titleCodeMatch) code = titleCodeMatch[1].toUpperCase();
      }

      if (!code) continue;

      // Determine type from code
      let type: 'OA' | 'OAH' | 'OAA' = 'OA';
      if (/\sOAH\s/i.test(code)) type = 'OAH';
      else if (/\sOAA\s/i.test(code)) type = 'OAA';

      // Extract description
      const descMatch = itemHtml.match(/<div\s+class="clearfix text-formatted[^"]*field--name-description[^"]*">([\s\S]*?)<\/div>/i);
      let officialText = '';
      if (descMatch) {
        officialText = text(descMatch[1]);
      }

      if (!officialText || officialText.length < 5) continue;

        // Normalize the code format: ensure consistent spacing
        const normalizedCode = code.replace(/\s+/g, ' ').trim();

        objectives.push({
          code: normalizedCode,
          type,
          officialText,
          axis: currentAxis,
          courseCode: course.code,
          courseName: course.name,
          cycle: course.cycle,
          subject,
          sourceUrl: url.toString(),
        });
    }
  }

  return objectives;
}

/**
 * Parse a cycle group page (like /curriculum/1o-6o-basico) to extract
 * all subject+grade page links.
 */
export function extractSubjectGradeLinks(html: string, sourceUrl: string): string[] {
  const url = assertCurriculumUrl(sourceUrl);
  const base = `${url.origin}`;
  const links: string[] = [];

  // Find the subjects-and-grades-wrapper section (cycle group pages)
  // or the subjects-wrapper section (course pages)
  const subjectsSection = html.match(/<div\s+class="subjects-wrapper">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i);
  if (!subjectsSection) return links;

  // Extract all subject+grade links
  const hrefs = [...subjectsSection[1].matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)];
  for (const match of hrefs) {
    try {
      const absoluteUrl = new URL(match[1], base).toString();
      if (isSubjectPage(absoluteUrl) && !links.includes(absoluteUrl)) {
        links.push(absoluteUrl);
      }
    } catch { /* skip invalid */ }
  }

  return links;
}

/**
 * Parse the main curriculum page to extract all cycle group links.
 */
export function extractCycleGroupLinks(html: string): string[] {
  const links: string[] = [];

  // First try menu-viewer section (primary navigation)
  const menuSection = html.match(/<div\s+class="menu-viewer">([\s\S]*?)<\/div>\s*<\/div>/i);
  if (menuSection) {
    const hrefs = [...menuSection[1].matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)];
    for (const match of hrefs) {
      try {
        const absoluteUrl = new URL(match[1], CURRICULUM_ORIGIN).toString();
        if (isCycleGroupPage(absoluteUrl) && !links.includes(absoluteUrl)) {
          links.push(absoluteUrl);
        }
      } catch { /* skip invalid */ }
    }
  }

  // Fallback: scan entire page for any cycle group links not already found
  const allHrefs = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)];
  for (const match of allHrefs) {
    try {
      const absoluteUrl = new URL(match[1], CURRICULUM_ORIGIN).toString();
      if (isCycleGroupPage(absoluteUrl) && !links.includes(absoluteUrl)) {
        links.push(absoluteUrl);
      }
    } catch { /* skip invalid */ }
  }

  return links;
}

/**
 * Main parser: detect page type and return parsed objectives + discovered links.
 */
export function parseCurriculumPage(html: string, source: string): ParsedPage {
  const url = assertCurriculumUrl(source);
  const urlStr = url.toString();

  // Case 1: Subject+grade page → parse OAs directly
  if (isSubjectPage(urlStr)) {
    const objectives = parseSubjectPage(html, urlStr);
    return { objectives, links: [] };
  }

  // Case 2: Cycle group page → extract subject links
  if (isCycleGroupPage(urlStr)) {
    const links = extractSubjectGradeLinks(html, urlStr);
    return { objectives: [], links };
  }

  // Case 3: Course/grade page → also extract subject links
  if (isCoursePage(urlStr)) {
    // Course pages also have the subjects-wrapper
    const links = extractSubjectGradeLinks(html, urlStr);
    return { objectives: [], links };
  }

  // Case 4: Main curriculum page → extract cycle group links
  if (urlStr === CURRICULUM_START || urlStr === `${CURRICULUM_START}/`) {
    const links = extractCycleGroupLinks(html);
    return { objectives: [], links };
  }

  // Fallback: extract any crawlable links
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
    .map(m => {
      try { return new URL(m[1], urlStr).toString(); } catch { return ''; }
    })
    .filter(v => v && isCrawlCandidate(v))
    .filter((v, i, a) => a.indexOf(v) === i);

  return { objectives: [], links };
}
