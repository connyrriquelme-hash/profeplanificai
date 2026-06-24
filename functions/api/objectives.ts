interface Env { DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const course = url.searchParams.get('course') || '';
  const subject = url.searchParams.get('subject') || '';
  const q = url.searchParams.get('q')?.trim() || '';
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 80, 200));
  const conditions: string[] = ["o.type='OA'"];
  const params: unknown[] = [];
  if (course) { conditions.push('c.code=?'); params.push(course); }
  if (subject) { conditions.push('(s.id=? OR s.normalized_name=?)'); params.push(subject, subject); }
  if (q) { conditions.push('(o.code LIKE ? OR o.normalized_text LIKE ?)'); params.push(`%${q.toUpperCase()}%`, `%${q.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}%`); }
  const { results } = await context.env.DB.prepare(`SELECT o.code,o.type,o.official_text,o.bloom_level,o.priority_label,o.source_url,o.imported_at,c.code AS course_code,c.name AS course_name,s.id AS subject_id,s.name AS subject_name,a.name AS axis_name FROM objectives o JOIN courses c ON c.id=o.course_id JOIN subjects s ON s.id=o.subject_id LEFT JOIN axes a ON a.id=o.axis_id WHERE ${conditions.join(' AND ')} ORDER BY c.sort_order,s.name,o.code LIMIT ?`).bind(...params, limit).all();
  return Response.json({ data: results, count: results.length, attribution: { name: 'Currículum Nacional — MINEDUC Chile', url: 'https://www.curriculumnacional.cl/curriculum' } });
}
