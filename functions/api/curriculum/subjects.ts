import type { Env } from '../_middleware';

interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  curriculum_source?: string;
  level_name?: string;
  level_code?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const level = url.searchParams.get('level') || '';
    const q = url.searchParams.get('q')?.trim() || '';
    const subject_type = url.searchParams.get('subject_type') || '';

    let query = '';
    const params: unknown[] = [];

    if (level) {
      query = `SELECT s.id, s.code, s.name, s.description, s.curriculum_source, e.code as level_code, e.name as level_name 
               FROM subjects s 
               JOIN education_levels e ON s.education_level_id = e.id 
               WHERE e.code LIKE ? OR e.name LIKE ? ORDER BY e.sort_order, s.name`;
      params.push(`%${level}%`, `%${level}%`);
    } else if (q) {
      query = `SELECT s.id, s.code, s.name, s.description, s.curriculum_source, e.code as level_code, e.name as level_name 
               FROM subjects s 
               JOIN education_levels e ON s.education_level_id = e.id 
               WHERE s.code LIKE ? OR s.name LIKE ? OR s.description LIKE ? OR e.name LIKE ? OR e.code LIKE ? 
               ORDER BY e.sort_order, s.name`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    } else {
      query = `SELECT s.id, s.code, s.name, s.description, s.curriculum_source, e.code as level_code, e.name as level_name 
               FROM subjects s 
               JOIN education_levels e ON s.education_level_id = e.id 
               ORDER BY e.sort_order, s.name`;
    }

    const { results } = await context.env.DB.prepare(query).bind(...params).all();

    return Response.json({
      data: results,
      count: results.length,
      attribution: 'Curriculo Nacional - MINEDUC Chile (Asignaturas)',
    });
  } catch (err) {
    console.error('[curriculum/subjects] GET error:', err);
    return Response.json({ error: 'Error al obtener las asignaturas.' }, { status: 500 });
  }
}
