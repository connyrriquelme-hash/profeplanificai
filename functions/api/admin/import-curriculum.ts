import { authorizeAdmin } from '../../_lib/admin';
import { crawlCurriculum } from '../../_lib/importer';

interface Env { DB: D1Database; ADMIN_TOKEN?: string; HMAC_SECRET?: string }

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const raw = await context.request.text();
  if (!(await authorizeAdmin(context.request, raw, context.env))) return Response.json({ error: 'Credencial administrativa inválida' }, { status: 401 });
  const body = raw ? JSON.parse(raw) : {};
  const maxPages = body.max_pages ? Math.min(body.max_pages, 500) : 30;
  const summary = await crawlCurriculum(context.env, {
    maxPages,
    delayMs: body.delay_ms,
    startUrl: body.start_url,
  });
  return Response.json({
    data: summary,
    source: 'https://www.curriculumnacional.cl/curriculum',
    note: maxPages >= 200 ? 'Para importación completa, usa MAX_PAGES=300 o más.' : undefined,
  });
}

async function tryQuery<T>(db: D1Database, sql: string, bind?: any[]): Promise<T[]> {
  try {
    const result = bind ? await db.prepare(sql).bind(...bind).all<T>() : await db.prepare(sql).all<T>();
    return result.results || [];
  } catch { return []; }
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  if (!(await authorizeAdmin(context.request, '', context.env))) return Response.json({ error: 'Credencial administrativa inválida' }, { status: 401 });
  const db = context.env.DB;
  const [counts, byType, byCycle, lastImport] = await Promise.all([
    tryQuery(db, `SELECT 'courses' as tbl, COUNT(*) as cnt FROM courses
      UNION ALL SELECT 'subjects', COUNT(*) FROM subjects
      UNION ALL SELECT 'axes', COUNT(*) FROM axes
      UNION ALL SELECT 'objectives', COUNT(*) FROM objectives
      UNION ALL SELECT 'skills', COUNT(*) FROM skills
      UNION ALL SELECT 'attitudes', COUNT(*) FROM attitudes
      UNION ALL SELECT 'import_logs', COUNT(*) FROM import_logs`),
    tryQuery<{ type: string; cnt: number }>(db, `SELECT type, COUNT(*) as cnt FROM objectives GROUP BY type`),
    tryQuery<{ cycle: string; cnt: number }>(db, `SELECT c.cycle, COUNT(*) as cnt FROM objectives o JOIN courses c ON o.course_id = c.id GROUP BY c.cycle ORDER BY c.cycle`),
    tryQuery<{ source_url: string; status: string; items_found: number; items_saved: number; created_at: string }>(db, `SELECT source_url, status, items_found, items_saved, created_at FROM import_logs ORDER BY created_at DESC LIMIT 5`),
  ]);
  return Response.json({ data: { counts, byType, byCycle, lastImport } });
}
