import { resolveEffectiveInstitutionId, requirePermissionContext } from '../../../_lib/auth-adapter';
import { ClassSessionService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId, authContext } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:create');

    const body = await context.request.json() as {
      lesson_instance_id: string;
    };

    if (!body.lesson_instance_id) {
      return Response.json({ ok: false, error: 'Falta lesson_instance_id' }, { status: 422 });
    }

    const sessionService = new ClassSessionService(env);
    const session = await sessionService.createFromLessonInstance(
      body.lesson_instance_id,
      institutionId,
      authContext.userId
    );

    return Response.json({ ok: true, data: session }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}