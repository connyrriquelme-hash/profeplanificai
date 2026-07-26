import { resolveEffectiveInstitutionId, requirePermissionContext } from '../../../_lib/auth-adapter';
import { StudentProfileService, CourseEnrollmentService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'student:read');

    const studentService = new StudentProfileService(env);
    const academicYearId = context.query.academic_year_id;
    const courseId = context.query.course_id;

    const filters = {
      institution_id: institutionId,
      academic_year_id: academicYearId,
      course_id: courseId,
    };
    const { results } = await studentService.list(filters, { limit: 100, offset: 0 });

    return Response.json({ ok: true, data: results, total: results.length });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'student:create');

    const body = await context.request.json() as {
      internal_identifier: string;
      first_name: string;
      last_name: string;
      preferred_name?: string;
      birth_date?: string;
      enrollment_status?: 'active' | 'inactive' | 'transferred' | 'graduated' | 'withdrawn';
    };

    if (!body.internal_identifier || !body.first_name || !body.last_name) {
      return Response.json({ ok: false, error: 'Faltan campos requeridos: internal_identifier, first_name, last_name' }, { status: 422 });
    }

    const studentService = new StudentProfileService(env);
    const student = await studentService.create({
      institution_id: institutionId,
      internal_identifier: body.internal_identifier,
      first_name: body.first_name,
      last_name: body.last_name,
      preferred_name: body.preferred_name,
      birth_date: body.birth_date,
      enrollment_status: body.enrollment_status || 'active',
    }, institutionId);

    return Response.json({ ok: true, data: student }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}