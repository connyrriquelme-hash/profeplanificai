import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionContext } from '../../../_lib/auth-adapter';
import { ClassSessionService } from '../../../services/classbook';

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

    const sessionService = new ClassSessionService(env);
    const institutionId = authContext.institutionId;
    const filters = {
      institution_id: institutionId,
      academic_year_id: context.query.academic_year_id,
      academic_term_id: context.query.academic_term_id,
      course_id: context.query.course_id,
      subject_id: context.query.subject_id,
      teacher_id: context.query.teacher_id,
      status: context.query.status,
      date_from: context.query.date_from,
      date_to: context.query.date_to,
    };
    const { results } = await sessionService.list(filters, { limit: 100, offset: 0 });

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
    await requirePermissionContext(context.request, env, 'classbook:create');

    const body = await context.request.json() as {
      academic_year_id: string;
      academic_term_id?: string;
      course_id: string;
      subject_id: string;
      teacher_id?: string;
      lesson_instance_id?: string;
      lesson_plan_id?: string;
      planning_id?: string;
      date: string;
      start_time?: string;
      end_time?: string;
      planned_content?: string;
      objective_ids?: string[];
      indicators?: Array<{ indicator_id: string; weight?: number; criteria?: string }>;
      skills?: string[];
      attitudes?: string[];
      dua_supports?: string[];
      formative_assessment?: string[];
      resources?: string[];
      teacher_notes?: string;
      status?: 'scheduled' | 'open' | 'completed' | 'pending_signature' | 'signed' | 'corrected' | 'cancelled';
    };

    if (!body.academic_year_id || !body.course_id || !body.subject_id || !body.date) {
      return Response.json({ ok: false, error: 'Faltan campos requeridos: academic_year_id, course_id, subject_id, date' }, { status: 422 });
    }

    const sessionService = new ClassSessionService(env);
    const institutionId = authContext.institutionId;
    const session = await sessionService.create({
      academic_year_id: body.academic_year_id,
      academic_term_id: body.academic_term_id,
      course_id: body.course_id,
      subject_id: body.subject_id,
      teacher_id: body.teacher_id || authContext.userId,
      lesson_instance_id: body.lesson_instance_id,
      lesson_plan_id: body.lesson_plan_id,
      planning_id: body.planning_id,
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      planned_content: body.planned_content,
      objective_ids: body.objective_ids,
      indicators: body.indicators,
      skills: body.skills,
      attitudes: body.attitudes,
      dua_supports: body.dua_supports,
      formative_assessment: body.formative_assessment,
      resources: body.resources,
      teacher_notes: body.teacher_notes,
      status: body.status || 'scheduled',
    }, institutionId, authContext.userId);

    return Response.json({ ok: true, data: session }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}