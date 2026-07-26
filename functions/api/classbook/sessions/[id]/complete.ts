import { resolveEffectiveInstitutionId, requirePermissionContext } from '../../../../_lib/auth-adapter';
import { ClassSessionService } from '../../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:complete');

    const { id } = context.params;
    const body = await context.request.json() as {
      finalize?: boolean;
    };

    const sessionService = new ClassSessionService(env);

    const session = await sessionService.getById(id);

    if (!session) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (session.institution_id !== institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta sesión' }, { status: 403 });
    }

    const finalize = body.finalize || false;
    const completed = await sessionService.complete(id, finalize);

    if (!completed) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }

    return Response.json({ ok: true, data: completed });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}