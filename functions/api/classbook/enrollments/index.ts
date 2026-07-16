import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionContext } from '../../../_lib/auth-adapter';
import { CourseEnrollmentService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'enrollment:manage');
    await requireInstitutionContext(context.request, env);

    const enrollmentService = new CourseEnrollmentService(env);
    const institutionId = authContext.institutionId;
    const academicYearId = context.query.academic_year_id;
    const courseId = context.query.course_id;
    const studentId = context.query.student_id;

    const filters = {
      institution_id: institutionId,
      academic_year_id: academicYearId,
      course_id: courseId,
      student_id: studentId,
    };
    const { results } = await CourseEnrollmentService.list(filters, { limit: 100, offset: 0 });

    return Response.json({ ok: true, data: results, total: results.length });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requireInstitutionContext(context.request, env);
    await requirePermissionContext(context.request, env, 'enrollment:manage');

    const body = await context.request.json() as {
      academic_year_id: string;
      course_id: string;
      student_id: string;
      list_number?: number;
      start_date: string;
      end_date?: string;
      status?: 'active' | 'transferred' | 'dropped' | 'completed';
    };

    if (!body.academic_year_id || !body.course_id || !body.student_id || !body.start_date) {
      return Response.json({ ok: false, error: 'Faltan campos requeridos: academic_year_id, course_id, student_id, start_date' }, { status: 422 });
    }

    const enrollmentService = new CourseEnrollmentService(env);
    const institutionId = authContext.institutionId;
    const enrollment = await enrollmentService.create({
      institution_id: institutionId,
      academic_year_id: body.academic_year_id,
      course_id: body.course_id,
      student_id: body.student_id,
      list_number: body.list_number,
      start_date: body.start_date,
      end_date: body.end_date,
      status: body.status || 'active',
    }, institutionId);

    return Response.json({ ok: true, data: enrollment }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}