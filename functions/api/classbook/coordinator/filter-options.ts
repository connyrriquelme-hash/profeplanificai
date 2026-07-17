import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionContext } from '../../../_lib/auth-adapter';
import { CoordinatorDashboardService } from '../../../services/classbook';

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
    await requirePermissionContext(context.request, env, 'report:scope');

    const service = new CoordinatorDashboardService(env);
    const institutionId = authContext.institutionId!;

    const data = await service.getFilterOptions(institutionId, authContext);

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