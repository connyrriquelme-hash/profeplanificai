import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionContext } from '../../../_lib/auth-adapter';
import { ObservationService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:observe');
    await requireInstitutionContext(context.request, env);

    const observationService = new ObservationService(env);
    const { id } = context.params;

    const observation = await observationService.getById(id);

    if (!observation) {
      return Response.json({ ok: false, error: 'Observación no encontrada' }, { status: 404 });
    }

    if (observation.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta observación' }, { status: 403 });
    }

    return Response.json({ ok: true, data: observation });
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
    await requirePermissionContext(context.request, env, 'classbook:observe');

    const { id } = context.params;
    const body = await context.request.json() as {
      category?: 'positive' | 'academic' | 'coexistence' | 'attendance' | 'support' | 'family_contact' | 'follow_up' | 'alert';
      content?: string;
      visibility?: 'teacher' | 'coordinator' | 'admin' | 'family';
      follow_up_date?: string | null;
      archived_at?: string | null;
    };

    const observationService = new ObservationService(env);
    const observation = await observationService.getById(id);

    if (!observation) {
      return Response.json({ ok: false, error: 'Observación no encontrada' }, { status: 404 });
    }

    if (observation.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta observación' }, { status: 403 });
    }

    const updated = await observationService.update(id, body);

    if (!updated) {
      return Response.json({ ok: false, error: 'Observación no encontrada' }, { status: 404 });
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
    await requirePermissionContext(context.request, env, 'classbook:observe');

    const { id } = context.params;

    const observationService = new ObservationService(env);
    const observation = await observationService.getById(id);

    if (!observation) {
      return Response.json({ ok: false, error: 'Observación no encontrada' }, { status: 404 });
    }

    if (observation.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta observación' }, { status: 403 });
    }

    const archived = await observationService.archive(id);

    if (!archived) {
      return Response.json({ ok: false, error: 'Observación no encontrada' }, { status: 404 });
    }

    return Response.json({ ok: true, data: archived });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}