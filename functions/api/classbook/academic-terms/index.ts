import { resolveEffectiveInstitutionId, requirePermissionContext } from '../../../_lib/auth-adapter';
import { AcademicTermService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:read');

    const academicTermService = new AcademicTermService(env);
    const academicYearId = context.params.academicYearId;

    const filters = { institution_id: institutionId, academic_year_id: academicYearId };
    const { results } = await academicTermService.list(filters, { limit: 100, offset: 0 });

    return Response.json({ ok: true, data: results });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:create');

    const body = await context.request.json() as {
      name: string;
      start_date: string;
      end_date: string;
      sort_order?: number;
      status?: 'planning' | 'active' | 'closed' | 'archived';
    };

    if (!body.name || !body.start_date || !body.end_date) {
      return Response.json({ ok: false, error: 'Faltan campos requeridos: name, start_date, end_date' }, { status: 422 });
    }

    const academicTermService = new AcademicTermService(env);
    const academicYearId = context.params.academicYearId;

    const term = await academicTermService.create({
      academic_year_id: academicYearId,
      institution_id: institutionId,
      name: body.name,
      start_date: body.start_date,
      end_date: body.end_date,
      sort_order: body.sort_order || 0,
      status: body.status || 'planning',
    }, institutionId);

    return Response.json({ ok: true, data: term }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}