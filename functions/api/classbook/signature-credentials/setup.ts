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

    const body = await context.request.json() as { pin?: string };
    if (!body.pin) {
      return Response.json({ ok: false, error: 'PIN requerido' }, { status: 422 });
    }

    const credentialsService = new SignatureCredentialsService(env);
    const hasExisting = await credentialsService.hasCredential(authContext.userId, institutionCtx.institutionId);
    if (hasExisting) {
      return Response.json({ ok: false, error: 'Ya existe una credencial de firma configurada' }, { status: 409 });
    }

    const credential = await credentialsService.createCredential(
      authContext.userId,
      institutionCtx.institutionId,
      body.pin
    );

    const auditService = new ClassbookAuditService(env);
    await auditService.log({
      institution_id: institutionCtx.institutionId,
      actor_user_id: authContext.userId,
      action: 'signature_pin_configured',
      resource_type: 'teacher_signature_credential',
      resource_id: credential.id,
    });

    return Response.json({
      ok: true,
      data: {
        configured: true,
        must_change_pin: credential.must_change_pin === 1,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
