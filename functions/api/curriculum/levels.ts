import type { PedagogicalEngineEnv } from '../../core/types';

interface NivelRow {
  id: string;
  nombre: string;
  descripcion: string;
}

export async function onRequestGet(context: EventContext<PedagogicalEngineEnv>): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const level = url.searchParams.get('level') || '';
    const q = url.searchParams.get('q')?.trim() || '';

    let query = 'SELECT id, nombre, descripcion FROM niveles';
    const params: unknown[] = [];

    if (level) {
      query += ' WHERE nombre LIKE ?';
      params.push(`%${level}%`);
    } else if (q) {
      query += ' WHERE nombre LIKE ? OR descripcion LIKE ?';
      params.push(`%${q}%`, `%${q}%`);
    }

    query += ' ORDER BY nombre';

    const { results } = await context.env.CORE_DB.prepare(query).bind(...params).all<NivelRow>();

    const data = results.map((row, i) => ({
      id: row.id,
      code: row.id,
      name: row.nombre,
      description: row.descripcion,
      sort_order: i + 1,
    }));

    return Response.json({
      data,
      count: data.length,
      attribution: 'Curriculo Nacional - MINEDUC Chile (Niveles Educativos)',
    });
  } catch (err) {
    console.error('[curriculum/levels] GET error:', err);
    return Response.json({ error: 'Error al obtener los niveles.' }, { status: 500 });
  }
}
