interface Env { DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const q = url.searchParams.get('q') || '';
    const level = url.searchParams.get('level') || '';
    const subject = url.searchParams.get('subject') || '';
    const type = url.searchParams.get('type') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

    const results: any[] = [];

    // 1. Search objectives (highest priority)
    if (!type || type === 'objective') {
      let qObj = `SELECT o.id, o.code as objective_code, o.official_text as content, 
        c.name as level, s.name as subject, 'objective' as doc_type
        FROM objectives o
        LEFT JOIN courses c ON o.course_id = c.id
        LEFT JOIN subjects s ON o.subject_id = s.id
        WHERE 1=1`;
      const params: any[] = [];

      if (q) {
        qObj += ` AND (o.code LIKE ? OR o.official_text LIKE ? OR o.normalized_text LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }
      if (level) {
        qObj += ` AND c.name LIKE ?`;
        params.push(`%${level}%`);
      }
      if (subject) {
        qObj += ` AND s.name LIKE ?`;
        params.push(`%${subject}%`);
      }

      qObj += ` LIMIT ${limit}`;
      const { results: objResults } = await context.env.DB.prepare(qObj).bind(...params).all();
      results.push(...objResults);
    }

    // 2. Search indicators
    if (!type || type === 'indicator') {
      let qInd = `SELECT ci.id, ci.oa_code as objective_code, ci.indicator_text as content,
        ci.level, ci.subject, 'indicator' as doc_type
        FROM curriculum_indicators ci WHERE 1=1`;
      const params: any[] = [];

      if (q) {
        qInd += ` AND (ci.indicator_text LIKE ? OR ci.oa_code LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`);
      }
      if (level) {
        qInd += ` AND ci.level LIKE ?`;
        params.push(`%${level}%`);
      }
      if (subject) {
        qInd += ` AND ci.subject LIKE ?`;
        params.push(`%${subject}%`);
      }

      qInd += ` LIMIT ${limit}`;
      const { results: indResults } = await context.env.DB.prepare(qInd).bind(...params).all();
      results.push(...indResults);
    }

    // 3. Search methodologies
    if (!type || type === 'methodology') {
      let qMet = `SELECT m.id, '' as objective_code, m.description as content,
        '' as level, '' as subject, 'methodology' as doc_type, m.name as title
        FROM methodologies m WHERE 1=1`;
      const params: any[] = [];

      if (q) {
        qMet += ` AND (m.name LIKE ? OR m.description LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`);
      }

      qMet += ` LIMIT ${limit}`;
      const { results: metResults } = await context.env.DB.prepare(qMet).bind(...params).all();
      results.push(...metResults);
    }

    // Simple ranking
    const ranked = results.map((r: any) => {
      let score = 0;
      const content = (r.content || '').toLowerCase();
      const code = (r.objective_code || '').toLowerCase();
      const query = q.toLowerCase();

      if (code === query || code.includes(query)) score += 100;
      if (content.includes(query)) score += 50;
      if (level && (r.level || '').toLowerCase().includes(level.toLowerCase())) score += 30;
      if (subject && (r.subject || '').toLowerCase().includes(subject.toLowerCase())) score += 30;

      return { ...r, score, title: r.title || r.objective_code || r.content?.substring(0, 60) || '' };
    }).filter((r: any) => r.score > 0).sort((a: any, b: any) => b.score - a.score).slice(0, limit);

    return Response.json({ data: ranked, total: ranked.length, query: q });
  } catch (err: any) {
    return Response.json({ error: 'Error en búsqueda curricular', details: err.message }, { status: 500 });
  }
}
