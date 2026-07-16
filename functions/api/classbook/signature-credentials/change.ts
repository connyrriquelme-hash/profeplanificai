import { requireAuthContext, requireActiveAuthContext, requireInstitutionContext } from '../../../_lib/auth-adapter';
import { SignatureCredentialsService } from '../../../services/classbook';
import { ClassbookAuditService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    const institutionCtx = await requireInstitutionContext(context.request, env);

    const body = await context.request.json() as { current_pin?: string; new_pin?: string };
    if (!body.current_pin || !body.new_pin) {
      return Response.json({ ok: false, error: 'PIN actual y nuevo PIN requeridos' }, { status: 422 });
    }

    const credentialsService = new SignatureCredentialsService(env);
    await credentialsService.changePin(
      authContext.userId,
      institutionCtx.institutionId,
      body.current_pin,
      body.new_pin
    );

    const auditService = new ClassbookAuditService(env);
    await auditService.log({
      institution_id: institutionCtx.institutionId,
      actor_user_id: authContext.userId,
      action: 'signature_pin_changed',
      resource_type: 'teacher_signature_credential',
      resource_id: authContext.userId,
    });

    return Response.json({ ok: true, data: { changed: true } });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
