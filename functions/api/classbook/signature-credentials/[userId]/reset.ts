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
    const hasCredential = await credentialsService.hasCredential(userId, institutionId);
    if (!hasCredential) {
      return Response.json({ ok: false, error: 'Credencial no encontrada' }, { status: 404 });
    }

    await credentialsService.resetCredential(userId, institutionId);

    const auditService = new ClassbookAuditService(env);
    await auditService.log({
      institution_id: institutionId,
      actor_user_id: authContext.userId,
      action: 'signature_pin_reset',
      resource_type: 'teacher_signature_credential',
      resource_id: userId,
      metadata_json: { target_user_id: userId },
    });

    return Response.json({ ok: true, data: { reset: true, must_change_pin: true } });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
