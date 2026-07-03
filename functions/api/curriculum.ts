import type { PedagogicalEngineEnv } from '../core/types';

interface CurriculumRow {
  nivel_id: string;
  nivel_nombre: string;
  asignatura_nombre: string;
}

interface CurriculumNivel {
  nivel: string;
  asignaturas: string[];
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestGet(context: EventContext<PedagogicalEngineEnv>): Promise<Response> {
  try {
    const { results } = await context.env.CORE_DB.prepare(
      `SELECT n.id AS nivel_id, n.nombre AS nivel_nombre, a.nombre AS asignatura_nombre
       FROM niveles n
       JOIN asignaturas a ON a.nivel_id = n.id
       ORDER BY n.nombre, a.nombre`
    ).all<CurriculumRow>();

    const grouped = new Map<string, CurriculumNivel>();

    for (const row of results) {
      if (!grouped.has(row.nivel_id)) {
        grouped.set(row.nivel_id, {
          nivel: row.nivel_nombre,
          asignaturas: [],
        });
      }
      grouped.get(row.nivel_id)!.asignaturas.push(row.asignatura_nombre);
    }

    return jsonResponse({ ok: true, data: Array.from(grouped.values()) });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: 'No se pudo obtener el currículum.',
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
}
