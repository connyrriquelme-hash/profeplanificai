import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionContext } from '../../../_lib/auth-adapter';
import { StudentProfileService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'student:read');
    await requireInstitutionContext(context.request, env);

    const studentService = new StudentProfileService(env);
    const { id } = context.params;

    const student = await studentService.getById(id);

    if (!student) {
      return Response.json({ ok: false, error: 'Estudiante no encontrado' }, { status: 404 });
    }

    if (student.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a este estudiante' }, { status: 403 });
    }

    return Response.json({ ok: true, data: student });
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
    await requirePermissionContext(context.request, env, 'student:update');

    const { id } = context.params;
    const body = await context.request.json() as {
      user_id?: string;
      internal_identifier?: string;
      first_name?: string;
      last_name?: string;
      preferred_name?: string;
      birth_date?: string;
      enrollment_status?: 'active' | 'inactive' | 'transferred' | 'graduated' | 'withdrawn';
      archived_at?: string | null;
    };

    const studentService = new StudentProfileService(env);
    const student = await studentService.getById(id);

    if (!student) {
      return Response.json({ ok: false, error: 'Estudiante no encontrado' }, { status: 404 });
    }

    if (student.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a este estudiante' }, { status: 403 });
    }

    const updated = await studentService.update(id, body);

    if (!updated) {
      return Response.json({ ok: false, error: 'Estudiante no encontrado' }, { status: 404 });
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
    await requirePermissionContext(context.request, env, 'student:update');

    const { id } = context.params;

    const studentService = new StudentProfileService(env);
    const student = await studentService.getById(id);

    if (!student) {
      return Response.json({ ok: false, error: 'Estudiante no encontrado' }, { status: 404 });
    }

    if (student.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a este estudiante' }, { status: 403 });
    }

    const archived = await studentService.archive(id);

    if (!archived) {
      return Response.json({ ok: false, error: 'Estudiante no encontrado' }, { status: 404 });
    }

    return Response.json({ ok: true, data: archived });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}