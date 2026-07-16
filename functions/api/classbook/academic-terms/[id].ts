import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionContext } from '../../../_lib/auth-adapter';
import { AcademicTermService } from '../../../services/classbook';

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

    const academicTermService = new AcademicTermService(env);
    const { id } = context.params;

    const term = await academicTermService.getById(id);

    if (!term) {
      return Response.json({ ok: false, error: 'Período académico no encontrado' }, { status: 404 });
    }

    if (term.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a este período académico' }, { status: 403 });
    }

    return Response.json({ ok: true, data: term });
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
      name?: string;
      start_date?: string;
      end_date?: string;
      sort_order?: number;
      status?: 'planning' | 'active' | 'closed' | 'archived';
    };

    const academicTermService = new AcademicTermService(env);
    const term = await academicTermService.getById(id);

    if (!term) {
      return Response.json({ ok: false, error: 'Período académico no encontrado' }, { status: 404 });
    }

    if (term.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a este período académico' }, { status: 403 });
    }

    const updated = await academicTermService.update(id, body);

    if (!updated) {
      return Response.json({ ok: false, error: 'Período académico no encontrado' }, { status: 404 });
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

    const academicTermService = new AcademicTermService(env);
    const term = await academicTermService.getById(id);

    if (!term) {
      return Response.json({ ok: false, error: 'Período académico no encontrado' }, { status: 404 });
    }

    if (term.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a este período académico' }, { status: 403 });
    }

    const deleted = await academicTermService.delete(id);

    if (!deleted) {
      return Response.json({ ok: false, error: 'Período académico no encontrado' }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}