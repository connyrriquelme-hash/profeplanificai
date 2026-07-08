import type { PedagogicalEngineEnv } from '../../core/types';

interface Env { DB: D1Database; CORE_DB: D1Database }

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

async function resolveNivelNameFromCORE(cORE_DB: D1Database, nivelId: string): Promise<string | null> {
  try {
    const aliases = normalizeIdAliases(nivelId);
    const { results } = await cORE_DB.prepare(
      `SELECT nombre FROM niveles WHERE id IN (${aliases.map(() => '?').join(', ')})`
    ).bind(...aliases).all<{ nombre: string }>();
    return results.length > 0 ? results[0].nombre : null;
  } catch {
    return null;
  }
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const nivel = url.searchParams.get('nivel') || '';
    const asignatura = url.searchParams.get('asignatura') || url.searchParams.get('subject') || '';
    const nivelId = url.searchParams.get('nivelId') || url.searchParams.get('level_id') || '';
    const asignaturaId = url.searchParams.get('asignaturaId') || url.searchParams.get('subject_id') || '';
    const q = url.searchParams.get('q')?.trim() || '';
    const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 200, 500));

    console.debug('[curriculum-api] objectives', { nivel, asignatura, nivelId, asignaturaId, q, limit });

    if (nivelId || asignaturaId) {
      let nivelName = nivel;
      if (nivelId && !nivel) {
        nivelName = await resolveNivelNameFromCORE(context.env.CORE_DB, nivelId) || nivelId;
      }

      const conditions: string[] = [];
      const params: unknown[] = [];

      if (nivelName) {
        conditions.push('c.name LIKE ?');
        params.push(`%${nivelName}%`);
      }
      if (asignaturaId) {
        conditions.push('s.id = ?');
        params.push(asignaturaId);
      } else if (asignatura) {
        conditions.push('s.name LIKE ?');
        params.push(`%${asignatura}%`);
      }
      if (q) {
        conditions.push('(o.code LIKE ? OR o.official_text LIKE ?)');
        params.push(`%${q.toUpperCase()}%`, `%${q}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      try {
        const { results: dbResults } = await context.env.DB.prepare(`
          SELECT o.id, o.code AS codigo_oa, o.official_text AS descripcion,
                 NULL AS habilidades_csv,
                 c.id AS nivel_id, c.name AS nivel_nombre,
                 s.name AS asignatura_nombre
          FROM objectives o
          JOIN courses c ON c.id = o.course_id
          JOIN subjects s ON s.id = o.subject_id
          ${whereClause}
          ORDER BY s.name, o.code
          LIMIT ?
        `).bind(...params, limit).all();

        if (dbResults.length > 0) {
          console.debug('[curriculum-api] objectives from DB', { count: dbResults.length, nivelName });
          return Response.json({
            data: dbResults,
            count: dbResults.length,
            source: 'DB',
            filters: { nivel, asignatura, nivelId, asignaturaId, q },
            attribution: { name: 'Curriculo Nacional - MINEDUC Chile', url: 'https://www.curriculumnacional.cl/curriculum' },
          });
        }
      } catch (e) {
        console.debug('[curriculum-api] objectives DB query failed, falling back to CORE_DB', e);
      }
    }

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
