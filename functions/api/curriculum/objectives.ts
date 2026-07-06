import type { PedagogicalEngineEnv } from '../../core/types';

interface ObjetivoRow {
  id: string;
  unidad_id: string;
  codigo_oa: string;
  descripcion: string;
  habilidades_csv: string;
  unidad_titulo: string;
  asignatura_nombre: string;
  nivel_nombre: string;
}

function normalizeIdAliases(value: string): string[] {
  const compact = value.trim().toLowerCase();
  if (!compact) return [];
  const dashed = compact.includes('-')
    ? compact
    : compact.replace(/^(\d+)(basico|medio)$/, '$1-$2');
  return Array.from(new Set([compact, dashed]));
}

export async function onRequestGet(context: EventContext<PedagogicalEngineEnv>): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const nivel = url.searchParams.get('nivel') || '';
    const asignatura = url.searchParams.get('asignatura') || url.searchParams.get('subject') || '';
    const nivelId = url.searchParams.get('nivelId') || url.searchParams.get('level_id') || '';
    const asignaturaId = url.searchParams.get('asignaturaId') || url.searchParams.get('subject_id') || '';
    const q = url.searchParams.get('q')?.trim() || '';
    const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 200, 500));

    console.debug('[curriculum-api] objectives', { nivel, asignatura, nivelId, asignaturaId, q, limit });

    let query = `SELECT o.id, o.unidad_id, o.codigo_oa, o.descripcion, o.habilidades_csv,
                        u.titulo AS unidad_titulo, a.nombre AS asignatura_nombre, n.nombre AS nivel_nombre
                 FROM objetivos_aprendizaje o
                 JOIN unidades u ON u.id = o.unidad_id
                 JOIN asignaturas a ON a.id = u.asignatura_id
                 JOIN niveles n ON n.id = a.nivel_id`;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (nivelId) {
      const aliases = normalizeIdAliases(nivelId);
      conditions.push(`n.id IN (${aliases.map(() => '?').join(', ')})`);
      params.push(...aliases);
    } else if (nivel) {
      conditions.push('n.nombre LIKE ?');
      params.push(`%${nivel}%`);
    }

    if (asignaturaId) {
      const aliases = normalizeIdAliases(asignaturaId);
      conditions.push(`a.id IN (${aliases.map(() => '?').join(', ')})`);
      params.push(...aliases);
    } else if (asignatura) {
      conditions.push('a.nombre LIKE ?');
      params.push(`%${asignatura}%`);
    }

    if (q) {
      conditions.push('(o.codigo_oa LIKE ? OR o.descripcion LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY n.nombre, a.nombre, o.codigo_oa LIMIT ?`;

    const { results } = await context.env.CORE_DB.prepare(query).bind(...params, limit).all<ObjetivoRow>();

    console.debug('[curriculum-api] objectives result', { count: results.length, source: 'CORE_DB' });

    return Response.json({
      data: results,
      count: results.length,
      source: 'CORE_DB',
      filters: { nivel, asignatura, nivelId, asignaturaId, q },
      attribution: { name: 'Curriculo Nacional - MINEDUC Chile', url: 'https://www.curriculumnacional.cl/curriculum' },
    });
  } catch (err) {
    console.error('[curriculum/objectives] GET error:', err);
    return Response.json({ error: 'Error al obtener los objetivos.' }, { status: 500 });
  }
}
