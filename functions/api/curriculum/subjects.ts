import type { PedagogicalEngineEnv } from '../../core/types';

interface Env { DB: D1Database; CORE_DB: D1Database }

interface AsignaturaRow {
  id: string;
  nivel_id: string;
  nombre: string;
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
    const level = url.searchParams.get('level') || '';
    const nivelId = url.searchParams.get('nivelId') || url.searchParams.get('level_id') || '';
    const q = url.searchParams.get('q')?.trim() || '';

    console.debug('[curriculum-api] subjects', { level, nivelId, q });

    if (nivelId || level) {
      let nivelName = level;
      if (nivelId && !level) {
        nivelName = await resolveNivelNameFromCORE(context.env.CORE_DB, nivelId) || nivelId;
      }

      const conditions: string[] = [];
      const params: unknown[] = [];

      if (nivelName) {
        conditions.push('c.name LIKE ?');
        params.push(`%${nivelName}%`);
      }

      if (q) {
        conditions.push('(s.name LIKE ? OR c.name LIKE ?)');
        params.push(`%${q}%`, `%${q}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      try {
        const { results: dbResults } = await context.env.DB.prepare(`
          SELECT s.id, s.name, s.normalized_name,
                 c.id AS level_id, c.name AS level_name,
                 COUNT(DISTINCT o.id) AS objective_count
          FROM subjects s
          JOIN objectives o ON o.subject_id = s.id
          JOIN courses c ON c.id = o.course_id
          ${whereClause}
          GROUP BY s.id, c.id
          ORDER BY s.name
        `).bind(...params).all();

        if (dbResults.length > 0) {
          console.debug('[curriculum-api] subjects from DB', { count: dbResults.length, nivelName });
          return Response.json({
            data: dbResults,
            count: dbResults.length,
            source: 'DB',
            attribution: 'Curriculo Nacional - MINEDUC Chile (Asignaturas)',
          });
        }
      } catch (e) {
        console.debug('[curriculum-api] subjects DB query failed, falling back to CORE_DB', e);
      }
    }

    let query = `SELECT a.id, a.nivel_id, a.nombre, n.nombre AS nivel_nombre
                 FROM asignaturas a
                 JOIN niveles n ON n.id = a.nivel_id`;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (nivelId) {
      const aliases = normalizeIdAliases(nivelId);
      conditions.push(`a.nivel_id IN (${aliases.map(() => '?').join(', ')})`);
      params.push(...aliases);
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
