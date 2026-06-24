import { CURRICULUM_ORIGIN, CURRICULUM_START, assertCurriculumUrl, isCrawlCandidate, isSubjectPage, isCoursePage, isCycleGroupPage, normalizeText, parseCurriculumPage, slug, type ParsedObjective } from './curriculum';

interface ImportEnv { DB: D1Database }
export interface ImportSummary { pagesProcessed: number; itemsFound: number; itemsSaved: number; errors: string[] }

async function fetchOfficial(url: string): Promise<string> {
  const safe = assertCurriculumUrl(url);
  const response = await fetch(safe, {
    headers: { 'User-Agent': 'PlanificaIA-Chile-Curriculum-Importer/1.0 (+educational; rate-limited)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Fuente oficial respondió ${response.status}`);
  return await response.text();
}

async function saveObjective(db: D1Database, item: ParsedObjective): Promise<void> {
  const now = new Date().toISOString();
  const courseId = `course-${item.courseCode.toLowerCase()}`;
  const subjectId = `subject-${slug(item.subject)}`;
  const axisId = item.axis ? `axis-${slug(`${item.subject}-${item.axis}`)}` : null;

  await db.batch([
    db.prepare(`INSERT INTO courses (id,code,name,cycle,sort_order) VALUES (?,?,?,?,999)
      ON CONFLICT(code) DO UPDATE SET name=excluded.name, cycle=excluded.cycle`).bind(courseId, item.courseCode, item.courseName, item.cycle),
    db.prepare(`INSERT INTO subjects (id,name,normalized_name) VALUES (?,?,?)
      ON CONFLICT(normalized_name) DO UPDATE SET name=excluded.name`).bind(subjectId, item.subject, normalizeText(item.subject)),
  ]);

  if (axisId) {
    await db.prepare(`INSERT INTO axes (id,subject_id,name) VALUES (?,?,?) ON CONFLICT(subject_id,name) DO NOTHING`).bind(axisId, subjectId, item.axis).run();
  }

  const objectiveId = `objective-${crypto.randomUUID()}`;
  await db.prepare(`INSERT INTO objectives
    (id,code,type,course_id,subject_id,axis_id,official_text,normalized_text,source_url,source_name,license_note,imported_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,'Currículum Nacional — MINEDUC Chile','Fuente oficial MINEDUC. Reutilización con atribución y enlace a la fuente original.',?,?)
    ON CONFLICT(code) DO UPDATE SET official_text=excluded.official_text, normalized_text=excluded.normalized_text,
      course_id=excluded.course_id, subject_id=excluded.subject_id, axis_id=excluded.axis_id, source_url=excluded.source_url, updated_at=excluded.updated_at`)
    .bind(objectiveId, item.code, item.type, courseId, subjectId, axisId, item.officialText, normalizeText(item.officialText), item.sourceUrl, now, now).run();

  if (item.type === 'OAA') {
    await db.prepare(`INSERT INTO attitudes (id,code,subject_id,official_text,source_url) VALUES (?,?,?,?,?) ON CONFLICT(code) DO UPDATE SET official_text=excluded.official_text, source_url=excluded.source_url`)
      .bind(`attitude-${crypto.randomUUID()}`, item.code, subjectId, item.officialText, item.sourceUrl).run();
  }
  if (item.type === 'OAH') {
    await db.prepare(`INSERT INTO skills (id,code,subject_id,official_text,source_url) VALUES (?,?,?,?,?) ON CONFLICT(code) DO UPDATE SET official_text=excluded.official_text, source_url=excluded.source_url`)
      .bind(`skill-${crypto.randomUUID()}`, item.code, subjectId, item.officialText, item.sourceUrl).run();
  }
}

export async function importUrl(env: ImportEnv, sourceUrl: string): Promise<ImportSummary> {
  const url = assertCurriculumUrl(sourceUrl).toString();
  const logId = crypto.randomUUID();
  try {
    const page = parseCurriculumPage(await fetchOfficial(url), url);
    let savedCount = 0;
    for (const objective of page.objectives) {
      await saveObjective(env.DB, objective);
      savedCount++;
    }
    await env.DB.prepare(`INSERT INTO import_logs (id,source_url,status,items_found,items_saved,created_at) VALUES (?,?,?,?,?,datetime('now'))`)
      .bind(logId, url, 'ok', page.objectives.length, savedCount).run();
    return { pagesProcessed: 1, itemsFound: page.objectives.length, itemsSaved: savedCount, errors: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    await env.DB.prepare(`INSERT INTO import_logs (id,source_url,status,items_found,items_saved,error_message,created_at) VALUES (?,?,?,0,0,?,datetime('now'))`)
      .bind(logId, url, 'error', message).run();
    throw error;
  }
}

/**
 * Crawl the official curriculum website using a multi-level BFS:
 * 1. Main page → discovers cycle groups (e.g., /curriculum/1o-6o-basico)
 * 2. Cycle group pages → discovers subject+grade pages (e.g., /curriculum/1o-6o-basico/matematica/1-basico)
 * 3. Subject+grade pages → parses OA/OAH/OAA objectives
 *
 * Also handles course pages (e.g., /curriculum/1o-6o-basico/curso/1-basico) as fallback discovery.
 */
export async function crawlCurriculum(env: ImportEnv, options: { maxPages?: number; delayMs?: number; startUrl?: string } = {}): Promise<ImportSummary> {
  const maxPages = Math.max(1, Math.min(options.maxPages || 30, 500));
  const delayMs = Math.max(350, Math.min(options.delayMs || 700, 3000));
  const start = assertCurriculumUrl(options.startUrl || CURRICULUM_START).toString();

  // Multi-level queue: priority determines processing order
  // Level 0: Main page
  // Level 1: Cycle group pages
  // Level 2: Course pages (fallback)
  // Level 3: Subject+grade pages (leaf nodes with OAs)
  const queue: { url: string; level: number }[] = [{ url: start, level: 0 }];
  const seen = new Set<string>();
  const summary: ImportSummary = { pagesProcessed: 0, itemsFound: 0, itemsSaved: 0, errors: [] };

  while (queue.length && summary.pagesProcessed < maxPages) {
    const { url, level } = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);

    try {
      const html = await fetchOfficial(url);
      const parsed = parseCurriculumPage(html, url);
      summary.pagesProcessed++;

      // If this is a subject page, save the objectives
      if (isSubjectPage(url)) {
        summary.itemsFound += parsed.objectives.length;
        for (const item of parsed.objectives) {
          await saveObjective(env.DB, item);
          summary.itemsSaved++;
        }
      }

      // Process discovered links
      for (const link of parsed.links) {
        if (seen.has(link)) continue;

        // Determine link level based on URL depth
        if (isSubjectPage(link)) {
          queue.push({ url: link, level: 3 });
        } else if (isCoursePage(link)) {
          queue.push({ url: link, level: 2 });
        } else if (isCycleGroupPage(link)) {
          queue.push({ url: link, level: 1 });
        } else {
          // Other crawlable pages at default priority
          queue.push({ url: link, level: 99 });
        }
      }

      // Sort queue by level (lower = higher priority) so subject pages get processed first
      queue.sort((a, b) => a.level - b.level);

    } catch (error) {
      summary.errors.push(`${url}: ${error instanceof Error ? error.message : 'error'}`);
    }

    if (queue.length && summary.pagesProcessed < maxPages) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  await env.DB.prepare(`INSERT INTO import_logs (id,source_url,status,items_found,items_saved,error_message,created_at) VALUES (?,?,?,?,?,?,datetime('now'))`)
    .bind(crypto.randomUUID(), start, summary.errors.length ? 'partial' : 'ok', summary.itemsFound, summary.itemsSaved, summary.errors.slice(0, 10).join('\n') || null).run();

  return summary;
}
