import type { PedagogicalEngineEnv } from '../../core/types';

interface ObjetivoRow {
  id: string;
  codigo_oa: string;
  descripcion: string;
  habilidades_csv: string;
  asignatura_nombre: string;
  nivel_nombre: string;
  unidad_titulo: string;
}

export async function onRequestGet(context: EventContext<PedagogicalEngineEnv>): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const objectiveId = url.searchParams.get('objective_id') || '';
    const objectiveCode = url.searchParams.get('objective_code') || '';

    if (!objectiveId && !objectiveCode) {
      return Response.json({ ok: false, error: 'Se requiere objective_id o objective_code' }, { status: 400 });
    }

    const param = objectiveId || objectiveCode;

    console.debug('[curriculum-api] context', { objectiveId, objectiveCode, param });

    const { results } = await context.env.CORE_DB.prepare(`
      SELECT o.id, o.codigo_oa, o.descripcion, o.habilidades_csv,
             u.titulo AS unidad_titulo, a.nombre AS asignatura_nombre, n.nombre AS nivel_nombre
      FROM objetivos_aprendizaje o
      JOIN unidades u ON u.id = o.unidad_id
      JOIN asignaturas a ON a.id = u.asignatura_id
      JOIN niveles n ON n.id = a.nivel_id
      WHERE o.id = ? OR o.codigo_oa = ?
      LIMIT 1
    `).bind(param, param).all<ObjetivoRow>();

    if (results.length === 0) {
      return Response.json({ ok: false, error: 'OA no encontrado en el Curriculo Nacional' }, { status: 404 });
    }

    const obj = results[0];

    let indicators: { description: string }[] = [];
    let indicatorsSource: 'DB' | 'CORE_DB' | 'empty' = 'empty';

    // Try DB first
    try {
      let indResult = await context.env.DB.prepare(
        'SELECT indicator_text AS description FROM curriculum_indicators WHERE objective_id = ? LIMIT 30'
      ).bind(obj.id).all<{ description: string }>();
      if (!indResult.results || indResult.results.length === 0) {
        indResult = await context.env.DB.prepare(
          'SELECT indicator_text AS description FROM curriculum_indicators WHERE oa_code = ? LIMIT 30'
        ).bind(obj.codigo_oa).all<{ description: string }>();
      }
      if (indResult.results && indResult.results.length > 0) {
        indicators = indResult.results;
        indicatorsSource = 'DB';
      }
    } catch { /* ignore */ }

    // Fallback to CORE_DB
    if (indicators.length === 0) {
      try {
        let indResult = await context.env.CORE_DB.prepare(
          'SELECT indicator_text AS description FROM curriculum_indicators WHERE objective_id = ? LIMIT 30'
        ).bind(obj.id).all<{ description: string }>();
        if (!indResult.results || indResult.results.length === 0) {
          indResult = await context.env.CORE_DB.prepare(
            'SELECT indicator_text AS description FROM curriculum_indicators WHERE oa_code = ? LIMIT 30'
          ).bind(obj.codigo_oa).all<{ description: string }>();
        }
        if (indResult.results && indResult.results.length > 0) {
          indicators = indResult.results;
          indicatorsSource = 'CORE_DB';
        }
      } catch { /* ignore */ }
    }

    let skills: { description: string }[] = [];
    let skillsSource: 'DB' | 'CORE_DB' | 'habilidades_csv' | 'empty' = 'empty';

    // Try DB skills via objective_skills
    try {
      const skResult = await context.env.DB.prepare(`
        SELECT sk.official_text AS description
        FROM skills sk
        JOIN objective_skills os ON os.skill_id = sk.id
        WHERE os.objective_id = ?
        LIMIT 20
      `).bind(obj.id).all<{ description: string }>();
      if (skResult.results && skResult.results.length > 0) {
        skills = skResult.results;
        skillsSource = 'DB';
      }
    } catch { /* ignore */ }

    // Fallback: try CORE_DB objective ID lookup via DB
    if (skills.length === 0) {
      try {
        const coreObj = await context.env.CORE_DB.prepare(
          'SELECT id FROM objetivos_aprendizaje WHERE codigo_oa = ? LIMIT 1'
        ).bind(obj.codigo_oa).first<{ id: string }>();
        if (coreObj) {
          const skResult = await context.env.DB.prepare(`
            SELECT sk.official_text AS description
            FROM skills sk
            JOIN objective_skills os ON os.skill_id = sk.id
            WHERE os.objective_id = ?
            LIMIT 20
          `).bind(coreObj.id).all<{ description: string }>();
          if (skResult.results && skResult.results.length > 0) {
            skills = skResult.results;
            skillsSource = 'CORE_DB';
          }
        }
      } catch { /* ignore */ }
    }

    // Final fallback: parse habilidades_csv from CORE_DB
    if (skills.length === 0 && obj.habilidades_csv) {
      skills = obj.habilidades_csv.split(',').map((h: string) => ({ description: h.trim() })).filter((h: { description: string }) => h.description);
      if (skills.length > 0) {
        skillsSource = 'habilidades_csv';
      }
    }

    console.debug('[curriculum-api] context result', {
      objectiveCode: obj.codigo_oa,
      indicatorsCount: indicators.length,
      indicatorsSource,
      skillsCount: skills.length,
      skillsSource,
    });

    return Response.json({
      ok: true,
      data: {
        objective_id: obj.id,
        objective_code: obj.codigo_oa,
        objective_description: obj.descripcion,
        subject_name: obj.asignatura_nombre,
        axis_name: null,
        course_name: obj.unidad_titulo,
        nivel_name: obj.nivel_nombre,
        indicators,
        indicatorsSource,
        skills,
        skillsSource,
        attitudes: [],
        methodologies: [],
      },
      source: 'CORE_DB',
      attribution: 'Curriculo Nacional - MINEDUC Chile',
    });
  } catch (err) {
    console.error('[curriculum/context] GET error:', err);
    return Response.json({ ok: false, error: 'Error al obtener el contexto curricular.' }, { status: 500 });
  }
}
