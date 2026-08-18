import { getTeacherId } from '../../../_lib/my-classes';
import type { AIEngineEnv } from '../../../core/types';

interface Env extends AIEngineEnv {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getTeacherId(context);
    if (!userId) {
      return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    const id = String(context.params.id || '');
    if (!id) {
      return Response.json({ ok: false, error: 'ID requerido' }, { status: 400 });
    }

    const row = await context.env.DB.prepare(
      'SELECT id, user_id, subject, grade, oa, slides_json, ai_model, created_at FROM interactive_lessons WHERE id = ? AND user_id = ?',
    ).bind(id, userId).first<{
      id: string;
      user_id: string;
      subject: string;
      grade: string;
      oa: string;
      slides_json: string;
      ai_model: string | null;
      created_at: string;
    }>();

    if (!row) {
      return Response.json({ ok: false, error: 'Lección no encontrada' }, { status: 404 });
    }

    return Response.json({
      ok: true,
      data: {
        id: row.id,
        subject: row.subject,
        grade: row.grade,
        oa: row.oa,
        ai_model: row.ai_model,
        created_at: row.created_at,
        slides: JSON.parse(row.slides_json),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[interactive-lesson/[id]] GET error:', message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
