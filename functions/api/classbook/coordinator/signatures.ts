import { resolveEffectiveInstitutionId, requirePermissionContext } from '../../../_lib/auth-adapter';
import { CoordinatorDashboardService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId, authContext } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:read');

    const service = new CoordinatorDashboardService(env);

    const filters = {
      academicYearId: context.query.academic_year_id as string | undefined,
      courseId: context.query.course_id as string | undefined,
      teacherId: context.query.teacher_id as string | undefined,
    };

    const data = await service.getPendingSignatures(institutionId, authContext, filters);

    return Response.json({ ok: true, data });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; code: string; message: string };
      return Response.json({ ok: false, error: e.message }, { status: e.status });
    }
    return Response.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
