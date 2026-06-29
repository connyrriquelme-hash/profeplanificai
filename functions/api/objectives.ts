interface Env { DB: D1Database }

const COURSE_ALIASES: Record<string, string[]> = {
  '1° básico': ['1 basico', '1b', '1ro basico', 'primero basico', '1° basico'],
  '2° básico': ['2 basico', '2b', '2do basico', 'segundo basico', '2° basico'],
  '3° básico': ['3 basico', '3b', '3ro basico', 'tercero basico', '3° basico'],
  '4° básico': ['4 basico', '4b', '4to basico', 'cuarto basico', '4° basico'],
  '5° básico': ['5 basico', '5b', '5to basico', 'quinto basico', '5° basico'],
  '6° básico': ['6 basico', '6b', '6to basico', 'sexto basico', '6° basico'],
  '7° básico': ['7 basico', '7b', '7mo basico', 'septimo basico', '7° basico'],
  '8° básico': ['8 basico', '8b', '8vo basico', 'octavo basico', '8° basico'],
  '1° medio': ['1 medio', '1m', '1ro medio', 'primero medio', '1° medio'],
  '2° medio': ['2 medio', '2m', '2do medio', 'segundo medio', '2° medio'],
  '3° medio': ['3 medio', '3m', '3ro medio', 'tercero medio', '3° medio'],
  '4° medio': ['4 medio', '4m', '4to medio', 'cuarto medio', '4° medio'],
};

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[°º]/g, '').replace(/[^a-z0-9]/g, '');
}

function resolveCourseCondition(label: string): { sql: string; params: unknown[] } | null {
  if (!label) return null;
  const norm = normalize(label);
  for (const [display, aliases] of Object.entries(COURSE_ALIASES)) {
    if (norm === normalize(display) || aliases.some(a => norm === normalize(a))) {
      return { sql: 'c.name LIKE ?', params: [`%${display}%`] };
    }
  }
  return { sql: '(c.code=? OR c.name LIKE ? OR c.id=?)', params: [label, `%${label}%`, label] };
}

function resolveSubjectCondition(label: string): { sql: string; params: unknown[] } | null {
  if (!label) return null;
  const norm = normalize(label);
  return {
    sql: '(s.id=? OR s.normalized_name=? OR s.name=? OR LOWER(REPLACE(s.normalized_name,\'-\',\'\'))=?)',
    params: [label, label, label, norm],
  };
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const course = url.searchParams.get('course') || '';
  const subject = url.searchParams.get('subject') || '';
  const level = url.searchParams.get('level') || '';
  const q = url.searchParams.get('q')?.trim() || '';
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 200, 500));

  const conditions: string[] = ["o.type='OA'"];
  const params: unknown[] = [];

  if (course) {
    const cond = resolveCourseCondition(course);
    if (cond) { conditions.push(cond.sql); params.push(...cond.params); }
  }

  if (level) {
    conditions.push('c.name LIKE ?');
    params.push(`%${level}%`);
  }

  if (subject) {
    const cond = resolveSubjectCondition(subject);
    if (cond) { conditions.push(cond.sql); params.push(...cond.params); }
  }

  if (q) {
    conditions.push('(o.code LIKE ? OR o.normalized_text LIKE ?)');
    params.push(`%${q.toUpperCase()}%`, `%${normalize(q)}%`);
  }

  const { results } = await context.env.DB.prepare(`
    SELECT o.id, o.code, o.type, o.official_text, o.normalized_text, o.bloom_level,
           o.skill_tags_json, o.attitude_tags_json, o.priority_label, o.source_url, o.source_name,
           o.course_id, o.subject_id, o.axis_id, o.unit_id,
           c.code AS course_code, c.name AS course_name,
           s.id AS subject_id_out, s.name AS subject_name,
           a.name AS axis_name
    FROM objectives o
    JOIN courses c ON c.id=o.course_id
    JOIN subjects s ON s.id=o.subject_id
    LEFT JOIN axes a ON a.id=o.axis_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.sort_order, s.name, o.code
    LIMIT ?
  `).bind(...params, limit).all();

  return Response.json({
    data: results,
    count: results.length,
    filters: { inputCourse: course, inputSubject: subject, inputLevel: level, inputQuery: q },
    attribution: { name: 'Currículum Nacional — MINEDUC Chile', url: 'https://www.curriculumnacional.cl/curriculum' },
  });
}
