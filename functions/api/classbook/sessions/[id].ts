import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionContext } from '../../../_lib/auth-adapter';
import { ClassSessionService } from '../../../services/classbook';

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
    const { id } = context.params;

    const session = await sessionService.getById(id);

    if (!session) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (session.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta sesión' }, { status: 403 });
    }

    return Response.json({ ok: true, data: session });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requireInstitutionContext(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:update');

    const { id } = context.params;
    const body = await context.request.json() as {
      academic_term_id?: string | null;
      taught_content?: string;
      objective_ids_json?: string;
      indicators_json?: string;
      skills_json?: string;
      attitudes_json?: string;
      dua_supports_json?: string;
      formative_assessment_json?: string;
      resources_json?: string;
      teacher_notes?: string | null;
      status?: 'scheduled' | 'open' | 'completed' | 'pending_signature' | 'signed' | 'corrected' | 'cancelled';
    };

    const sessionService = new ClassSessionService(env);
    const session = await sessionService.getById(id);

    if (!session) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (session.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta sesión' }, { status: 403 });
    }

    const updated = await sessionService.update(id, body);

    if (!updated) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }

    return Response.json({ ok: true, data: updated });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestDelete(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requireInstitutionContext(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:configure');

    const { id } = context.params;

    const sessionService = new ClassSessionService(env);
    const session = await sessionService.getById(id);

    if (!session) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (session.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta sesión' }, { status: 403 });
    }

    // Soft delete - archive
    const archived = await sessionService.update(id, { status: 'cancelled' });

    if (!archived) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}