interface Env { DB: D1Database; CORE_DB?: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const level = url.searchParams.get('level') || '';
  const grade = url.searchParams.get('grade') || '';
  const subject = url.searchParams.get('subject') || '';
  const oaCode = url.searchParams.get('oa_code') || '';
  const objectiveId = url.searchParams.get('objective_id') || '';
  const skillId = url.searchParams.get('skill_id') || '';
  const track = url.searchParams.get('track') || '';
  const status = url.searchParams.get('status') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  console.debug('[curriculum-api] indicators', { level, grade, subject, oaCode, objectiveId, limit, offset });

  const conditions: string[] = [];
  const params: any[] = [];

  if (level) { conditions.push('ci.level = ?'); params.push(level); }
  if (grade) { conditions.push('ci.grade = ?'); params.push(grade); }
  if (subject) { conditions.push('ci.subject = ?'); params.push(subject); }
  if (oaCode) { conditions.push('ci.oa_code = ?'); params.push(oaCode); }
  if (objectiveId) { conditions.push('ci.objective_id = ?'); params.push(objectiveId); }
  if (skillId) { conditions.push('ci.skill_id = ?'); params.push(skillId); }
  if (track) { conditions.push('ci.track = ?'); params.push(track); }
  if (status) { conditions.push('ci.status = ?'); params.push(status); }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  // Try DB first
  try {
    const countResult = await context.env.DB.prepare(`
      SELECT COUNT(*) as total FROM curriculum_indicators ci ${whereClause}
    `).bind(...params).first<{ total: number }>();

    const results = await context.env.DB.prepare(`
      SELECT ci.*,
        o.official_text as oa_text,
        o.code as objective_code,
        s.official_text as skill_text,
        s.code as skill_code,
        CASE WHEN ci.objective_id IS NULL OR ci.objective_id = '' THEN 1 ELSE 0 END as missing_oa,
        CASE WHEN ci.skill_id IS NULL OR ci.skill_id = '' THEN 1 ELSE 0 END as missing_skill
      FROM curriculum_indicators ci
      LEFT JOIN objectives o ON o.id = ci.objective_id
      LEFT JOIN skills s ON s.id = ci.skill_id
      ${whereClause}
      ORDER BY ci.track, ci.level, ci.grade, ci.subject, ci.oa_code
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all<any>();

    const rows = results.results || [];

    console.debug('[curriculum-api] indicators result', { count: rows.length, source: 'DB' });

    if (rows.length > 0) {
      return Response.json({
        total: countResult?.total || 0,
        limit,
        offset,
        indicators: rows,
        source: 'DB',
      });
    }
  } catch (err: any) {
    console.warn('[curriculum/indicators] DB query failed, trying CORE_DB:', err.message);
  }

  // Fallback to CORE_DB if DB returned empty
  if (context.env.CORE_DB) {
    try {
      const countResult = await context.env.CORE_DB.prepare(`
        SELECT COUNT(*) as total FROM curriculum_indicators ci ${whereClause}
      `).bind(...params).first<{ total: number }>();

      const results = await context.env.CORE_DB.prepare(`
        SELECT ci.*,
          CASE WHEN ci.objective_id IS NULL OR ci.objective_id = '' THEN 1 ELSE 0 END as missing_oa,
          CASE WHEN ci.skill_id IS NULL OR ci.skill_id = '' THEN 1 ELSE 0 END as missing_skill
        FROM curriculum_indicators ci
        ${whereClause}
        ORDER BY ci.track, ci.level, ci.grade, ci.subject, ci.oa_code
        LIMIT ? OFFSET ?
      `).bind(...params, limit, offset).all<any>();

      const rows = results.results || [];

      console.debug('[curriculum-api] indicators result', { count: rows.length, source: 'CORE_DB' });

      return Response.json({
        total: countResult?.total || 0,
        limit,
        offset,
        indicators: rows,
        source: 'CORE_DB',
      });
    } catch (err: any) {
      console.warn('[curriculum/indicators] CORE_DB query also failed:', err.message);
    }
  }

  // Both failed or empty
  console.debug('[curriculum-api] indicators result', { count: 0, source: 'empty' });

  return Response.json({
    total: 0,
    limit,
    offset,
    indicators: [],
    source: 'empty',
  });
}
