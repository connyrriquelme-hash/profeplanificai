import { resolveEffectiveInstitutionId, requirePermissionContext } from '../../../../_lib/auth-adapter';
import { SignatureCredentialsService } from '../../../../services/classbook';
import { ClassbookAuditService } from '../../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId, authContext } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:configure');

    const { userId } = context.params;
    if (!userId) {
      return Response.json({ ok: false, error: 'userId requerido' }, { status: 422 });
    }

    const credentialsService = new SignatureCredentialsService(env);
    const status = await credentialsService.getCredentialStatus(userId, institutionId);
    if (!status.configured) {
      return Response.json({ ok: false, error: 'Credencial no encontrada' }, { status: 404 });
    }

    if (!status.locked) {
      return Response.json({ ok: false, error: 'La credencial no está bloqueada' }, { status: 400 });
    }

    await credentialsService.unlockCredential(userId, institutionId);

    const auditService = new ClassbookAuditService(env);
    await auditService.log({
      institution_id: institutionId,
      actor_user_id: authContext.userId,
      action: 'signature_pin_unlocked',
      resource_type: 'teacher_signature_credential',
      resource_id: userId,
      metadata_json: { target_user_id: userId },
    });

    return Response.json({ ok: true, data: { unlocked: true } });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
