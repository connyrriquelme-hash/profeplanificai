import type { Env } from '../_middleware';

interface Objective {
  id: string;
  code: string;
  type: string;
  description?: string;
  official_text?: string;
  bloom_level?: string;
  competency?: string;
  subject_name?: string;
  axis_name?: string;
  level_name?: string;
  indicators?: any[];
  skills?: any[];
  attitudes?: any[];
  course_name?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const course = url.searchParams.get('course') || '';
    const subject = url.searchParams.get('subject') || '';
    const level = url.searchParams.get('level') || '';
    const q = url.searchParams.get('q')?.trim() || '';
    const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 200, 500));

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (course) {
      conditions.push('(c.code LIKE ? OR c.name LIKE ? OR c.id=?)');
      params.push(course, `%${course}%`, course);
    }

    if (subject) {
      conditions.push('(s.id=? OR s.normalized_name=? OR s.name=?)');
      params.push(subject, subject, subject);
    }

    if (level) {
      conditions.push('e.name LIKE ?');
      params.push(`%${level}%`);
    }

    if (q) {
      conditions.push('(o.code LIKE ? OR o.description LIKE ? OR o.official_text LIKE ?)');
      params.push(`%${q.toUpperCase()}%`, `%${q}%`, `%${q}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { results } = await context.env.DB.prepare(
      `SELECT o.id, o.code, o.type, o.description, o.official_text, o.bloom_level, o.competency,
               s.name as subject_name, s.code as subject_code, a.name as axis_name,
               e.name as level_name, c.name as course_name
        FROM learning_objectives o
        JOIN subjects s ON s.id = o.subject_id
        JOIN curriculum_axes a ON a.id = o.axis_id
        JOIN education_levels e ON s.education_level_id = e.id
        JOIN courses c ON c.id = o.course_id
        ${whereClause}
        ORDER BY e.sort_order, s.name, o.code
        LIMIT ?`
    ).bind(...params, limit).all();

    return Response.json({
      data: results,
      count: results.length,
      filters: { inputCourse: course, inputSubject: subject, inputLevel: level, inputQuery: q },
      attribution: { name: 'Curriculo Nacional - MINEDUC Chile', url: 'https://www.curriculumnacional.cl/curriculum' },
    });
  } catch (err) {
    console.error('[curriculum/objectives] GET error:', err);
    return Response.json({ error: 'Error al obtener los objetivos.' }, { status: 500 });
  }
}
