import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionContext } from '../../../_lib/auth-adapter';
import { ObservationService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:observe');
    await requireInstitutionContext(context.request, env);

    const observationService = new ObservationService(env);
    const institutionId = authContext.institutionId;
    const filters = {
      institution_id: institutionId,
      academic_year_id: context.query.academic_year_id,
      course_id: context.query.course_id,
      student_id: context.query.student_id,
      class_session_id: context.query.class_session_id,
      category: context.query.category,
      visibility: context.query.visibility,
      date_from: context.query.date_from,
      date_to: context.query.date_to,
    };
    const { results } = await observationService.list(filters, { limit: 100, offset: 0 });

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
    await requirePermissionContext(context.request, env, 'classbook:observe');

    const body = await context.request.json() as {
      academic_year_id: string;
      course_id: string;
      student_id: string;
      class_session_id?: string;
      category: 'positive' | 'academic' | 'coexistence' | 'attendance' | 'support' | 'family_contact' | 'follow_up' | 'alert';
      content: string;
      visibility?: 'teacher' | 'coordinator' | 'admin' | 'family';
      follow_up_date?: string;
    };

    if (!body.academic_year_id || !body.course_id || !body.student_id || !body.category || !body.content) {
      return Response.json({ ok: false, error: 'Faltan campos requeridos: academic_year_id, course_id, student_id, category, content' }, { status: 422 });
    }

    const observationService = new ObservationService(env);
    const institutionId = authContext.institutionId;
    const observation = await observationService.create({
      institution_id: institutionId,
      academic_year_id: body.academic_year_id,
      course_id: body.course_id,
      student_id: body.student_id,
      class_session_id: body.class_session_id,
      category: body.category,
      content: body.content,
      visibility: body.visibility || 'teacher',
      follow_up_date: body.follow_up_date,
      created_by: authContext.userId,
    }, institutionId);

    return Response.json({ ok: true, data: observation }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}