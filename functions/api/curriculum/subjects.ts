import type { PedagogicalEngineEnv } from '../../core/types';

interface AsignaturaRow {
  id: string;
  nivel_id: string;
  nombre: string;
  nivel_nombre: string;
}

export async function onRequestGet(context: EventContext<PedagogicalEngineEnv>): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const level = url.searchParams.get('level') || '';
    const nivelId = url.searchParams.get('nivelId') || url.searchParams.get('level_id') || '';
    const q = url.searchParams.get('q')?.trim() || '';

    console.debug('[curriculum-api] subjects', { level, nivelId, q });

    let query = `SELECT a.id, a.nivel_id, a.nombre, n.nombre AS nivel_nombre
                 FROM asignaturas a
                 JOIN niveles n ON n.id = a.nivel_id`;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (nivelId) {
      conditions.push('a.nivel_id = ?');
      params.push(nivelId);
    } else if (level) {
      conditions.push('n.nombre LIKE ?');
      params.push(`%${level}%`);
    }

    if (q) {
      conditions.push('(a.nombre LIKE ? OR n.nombre LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY n.nombre, a.nombre';

    const { results } = await context.env.CORE_DB.prepare(query).bind(...params).all<AsignaturaRow>();

    console.debug('[curriculum-api] subjects result', { count: results.length, source: 'CORE_DB' });

    const data = results.map((row) => ({
      id: row.id,
      code: row.id,
      name: row.nombre,
      level_name: row.nivel_nombre,
      level_code: row.nivel_id,
      level_id: row.nivel_id,
    }));

    return Response.json({
      data,
      count: data.length,
      source: 'CORE_DB',
      attribution: 'Curriculo Nacional - MINEDUC Chile (Asignaturas)',
    });
  } catch (err) {
    console.error('[curriculum/subjects] GET error:', err);
    return Response.json({ error: 'Error al obtener las asignaturas.' }, { status: 500 });
  }
}
