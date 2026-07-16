import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionContext } from '../../../_lib/auth-adapter';
import { AcademicYearService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:read');
    await requireInstitutionContext(context.request, env);

    const academicYearService = new AcademicYearService(env);
    const { id } = context.params;

    const year = await academicYearService.getById(id);

    if (!year) {
      return Response.json({ ok: false, error: 'Año académico no encontrado' }, { status: 404 });
    }

    if (year.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a este año académico' }, { status: 403 });
    }

    return Response.json({ ok: true, data: year });
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
      status?: 'planning' | 'active' | 'closed' | 'archived';
    };

    const academicYearService = new AcademicYearService(env);
    const year = await academicYearService.getById(id);

    if (!year) {
      return Response.json({ ok: false, error: 'Año académico no encontrado' }, { status: 404 });
    }

    if (year.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a este año académico' }, { status: 403 });
    }

    const updated = await academicYearService.update(id, body);

    if (!updated) {
      return Response.json({ ok: false, error: 'Año académico no encontrado' }, { status: 404 });
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

    const academicYearService = new AcademicYearService(env);
    const year = await academicYearService.getById(id);

    if (!year) {
      return Response.json({ ok: false, error: 'Año académico no encontrado' }, { status: 404 });
    }

    if (year.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a este año académico' }, { status: 403 });
    }

    const deleted = await academicYearService.delete(id);

    if (!deleted) {
      return Response.json({ ok: false, error: 'Año académico no encontrado' }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}