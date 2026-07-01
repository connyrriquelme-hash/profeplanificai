import type { Env } from '../_middleware';

interface Level {
  id: string;
  code: string;
  name: string;
  description?: string;
  cycle?: string;
  sort_order?: number;
}

interface CurriculumSubject {
  id: string;
  code: string;
  name: string;
  description?: string;
  curriculum_source?: string;
  level_name?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const level = url.searchParams.get('level') || '';
  const cycle = url.searchParams.get('cycle') || '';
  const q = url.searchParams.get('q')?.trim() || '';

  let query = '';
  const params: unknown[] = [];

  if (level) {
    query = `SELECT e.id, e.code, e.name, e.description, e.cycle, e.sort_order FROM education_levels e WHERE e.code LIKE ? OR e.name LIKE ? ORDER BY e.sort_order, e.name`;
    params.push(`%${level}%`, `%${level}%`);
  } else if (cycle) {
    query = `SELECT e.id, e.code, e.name, e.description, e.cycle, e.sort_order FROM education_levels e WHERE e.cycle LIKE ? ORDER BY e.sort_order, e.name`;
    params.push(`%${cycle}%`);
  } else if (q) {
    query = `SELECT e.id, e.code, e.name, e.description, e.cycle, e.sort_order FROM education_levels e WHERE e.code LIKE ? OR e.name LIKE ? OR e.description LIKE ? ORDER BY e.sort_order, e.name`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  } else {
    query = `SELECT e.id, e.code, e.name, e.description, e.cycle, e.sort_order FROM education_levels e ORDER BY e.sort_order, e.name`;
  }

  const { results } = await context.env.DB.prepare(query).bind(...params).all();

  return Response.json({
    data: results,
    count: results.length,
    attribution: 'Currículum Nacional — MINEDUC Chile (Niveles Educativos)',
  });
}
