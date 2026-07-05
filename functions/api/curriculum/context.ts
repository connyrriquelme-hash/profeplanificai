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

    const isId = Boolean(objectiveId);
    const whereClause = isId ? 'o.id = ?' : 'o.codigo_oa = ?';
    const param = isId ? objectiveId : objectiveCode;

    const { results } = await context.env.CORE_DB.prepare(`
      SELECT o.id, o.codigo_oa, o.descripcion, o.habilidades_csv,
             u.titulo AS unidad_titulo, a.nombre AS asignatura_nombre, n.nombre AS nivel_nombre
      FROM objetivos_aprendizaje o
      JOIN unidades u ON u.id = o.unidad_id
      JOIN asignaturas a ON a.id = u.asignatura_id
      JOIN niveles n ON n.id = a.nivel_id
      WHERE ${whereClause}
      LIMIT 1
    `).bind(param).all<ObjetivoRow>();

    if (results.length === 0) {
      return Response.json({ ok: false, error: 'OA no encontrado en el Curriculo Nacional' }, { status: 404 });
    }

    const obj = results[0];

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
        indicators: [],
        skills: [],
        attitudes: [],
        methodologies: [],
      },
      attribution: 'Curriculo Nacional - MINEDUC Chile',
    });
  } catch (err) {
    console.error('[curriculum/context] GET error:', err);
    return Response.json({ ok: false, error: 'Error al obtener el contexto curricular.' }, { status: 500 });
  }
}
