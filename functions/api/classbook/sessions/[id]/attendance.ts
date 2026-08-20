import { z } from 'zod';
import { resolveEffectiveInstitutionId, requirePermissionContext } from '../../../../_lib/auth-adapter';
import { AttendanceService, ClassSessionService } from '../../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

const AttendanceStatusSchema = z.enum(['present', 'absent', 'late', 'justified', 'early_leave', 'external_activity']);

const BatchAttendanceSchema = z.object({
  records: z.array(z.object({
    student_id: z.string().trim().min(1),
    status: AttendanceStatusSchema,
    arrival_time: z.string().trim().max(20).optional(),
    departure_time: z.string().trim().max(20).optional(),
    justification: z.string().trim().max(1000).optional(),
  })).min(1, 'records no puede estar vacío'),
  recorded_by: z.string().trim().min(1),
});

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:read');

    const { id } = context.params;

    const sessionService = new ClassSessionService(env);
    const session = await sessionService.getById(id);
    if (!session) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }
    if (session.institution_id !== institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta sesión' }, { status: 403 });
    }

    const attendanceService = new AttendanceService(env);
    const records = await attendanceService.getBySession(id);

    return Response.json({ ok: true, data: records });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPut(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:attendance');

    const { id } = context.params;
    const parsed = BatchAttendanceSchema.safeParse(await context.request.json());
    if (!parsed.success) {
      return Response.json({ ok: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 422 });
    }
    const body = parsed.data;

    const sessionService = new ClassSessionService(env);
    const session = await sessionService.getById(id);
    if (!session) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }
    if (session.institution_id !== institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta sesión' }, { status: 403 });
    }

    const attendanceService = new AttendanceService(env);
    const result = await attendanceService.batchUpsertForSession(id, institutionId, body);

    return Response.json({ ok: true, data: result });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}