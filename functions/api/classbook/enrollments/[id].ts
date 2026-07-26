import { resolveEffectiveInstitutionId, requirePermissionContext } from '../../../_lib/auth-adapter';
import { CourseEnrollmentService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'enrollment:manage');

    const enrollmentService = new CourseEnrollmentService(env);
    const { id } = context.params;

    const enrollment = await enrollmentService.getById(id);

    if (!enrollment) {
      return Response.json({ ok: false, error: 'Matrícula no encontrada' }, { status: 404 });
    }

    if (enrollment.institution_id !== institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta matrícula' }, { status: 403 });
    }

    return Response.json({ ok: true, data: enrollment });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'enrollment:manage');

    const { id } = context.params;
    const body = await context.request.json() as {
      list_number?: number;
      end_date?: string | null;
      status?: 'active' | 'transferred' | 'dropped' | 'completed';
    };

    const enrollmentService = new CourseEnrollmentService(env);
    const enrollment = await enrollmentService.getById(id);

    if (!enrollment) {
      return Response.json({ ok: false, error: 'Matrícula no encontrada' }, { status: 404 });
    }

    if (enrollment.institution_id !== institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta matrícula' }, { status: 403 });
    }

    const updated = await enrollmentService.update(id, body);

    if (!updated) {
      return Response.json({ ok: false, error: 'Matrícula no encontrada' }, { status: 404 });
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
    const { institutionId } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'enrollment:manage');

    const { id } = context.params;

    const enrollmentService = new CourseEnrollmentService(env);
    const enrollment = await enrollmentService.getById(id);

    if (!enrollment) {
      return Response.json({ ok: false, error: 'Matrícula no encontrada' }, { status: 404 });
    }

    if (enrollment.institution_id !== institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta matrícula' }, { status: 403 });
    }

    const deleted = await enrollmentService.delete(id);

    if (!deleted) {
      return Response.json({ ok: false, error: 'Matrícula no encontrada' }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}