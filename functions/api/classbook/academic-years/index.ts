import { resolveEffectiveInstitutionId, requirePermissionContext } from '../../../_lib/auth-adapter';
import { AcademicYearService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:read');

    const academicYearService = new AcademicYearService(env);

    const { results, total } = await academicYearService.list(
      { institution_id: institutionId },
      { limit: 100 }
    );

    return Response.json({ ok: true, data: results, total });
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
      status?: 'planning' | 'active' | 'closed' | 'archived';
    };

    if (!body.name || !body.start_date || !body.end_date) {
      return Response.json({ ok: false, error: 'Faltan campos requeridos: name, start_date, end_date' }, { status: 422 });
    }

    const academicYearService = new AcademicYearService(env);

    const year = await academicYearService.create({
      institution_id: institutionId,
      name: body.name,
      start_date: body.start_date,
      end_date: body.end_date,
      status: body.status || 'planning',
    }, institutionId);

    return Response.json({ ok: true, data: year }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}