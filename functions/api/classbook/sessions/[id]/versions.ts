import { requireAuthContext, requireActiveAuthContext, requireInstitutionContext, requirePermissionContext } from '../../../../_lib/auth-adapter';
import { ClassSessionService } from '../../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requireInstitutionContext(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:read');

    const sessionService = new ClassSessionService(env);
    const institutionId = authContext.institutionId;
    const { id } = context.params;

    const session = await sessionService.getById(id);

    if (!session) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (session.institution_id !== institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta sesión' }, { status: 403 });
    }

    const versions = await sessionService.getVersionsBySession(id);

    return Response.json({ ok: true, data: versions });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}