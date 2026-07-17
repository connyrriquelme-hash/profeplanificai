import { resolveEffectiveInstitutionId, requirePermissionContext } from '../../../../_lib/auth-adapter';
import { SignaturesService, SignatureCredentialsService } from '../../../../services/classbook';
import { ClassbookAuditService } from '../../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId, authContext } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:sign');

    const { id } = context.params;
    const body = await context.request.json() as {
      content_hash?: string;
      pin?: string;
    };

    if (!body.content_hash) {
      return Response.json({ ok: false, error: 'Falta content_hash' }, { status: 422 });
    }

    const signaturesService = new SignaturesService(env);
    const credentialsService = new SignatureCredentialsService(env);
    const auditService = new ClassbookAuditService(env);

    const sigStatus = await signaturesService.getSessionSignatureStatus(id);

    if (!sigStatus.session) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (sigStatus.session.institution_id !== institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta sesión' }, { status: 403 });
    }

    if (!sigStatus.canSign) {
      return Response.json({ ok: false, error: sigStatus.reason || 'No se puede firmar esta sesión' }, { status: 400 });
    }

    if (!body.pin) {
      return Response.json({ ok: false, error: 'PIN requerido para firmar' }, { status: 422 });
    }

    const credentialStatus = await credentialsService.getCredentialStatus(authContext.userId, institutionId);
    if (!credentialStatus.configured) {
      return Response.json({ ok: false, error: 'PIN de firma no configurado. Configure su PIN primero.' }, { status: 400 });
    }
    if (credentialStatus.locked) {
      return Response.json({ ok: false, error: 'Cuenta bloqueada por intentos fallidos. Contacte al administrador.' }, { status: 423 });
    }
    if (credentialStatus.must_change_pin) {
      return Response.json({ ok: false, error: 'Debe cambiar su PIN antes de firmar.' }, { status: 400 });
    }

    try {
      const result = await signaturesService.signSessionWithPin(
        id,
        authContext.userId,
        institutionId,
        body.content_hash,
        body.pin,
        credentialsService
      );

      await auditService.logSign(institutionId, authContext.userId, id, {
        method: 'pin',
        signed_version: result.signature.signed_version,
      });

      return Response.json({ ok: true, data: { session: result.session, signature: result.signature } });
    } catch (signErr) {
      await auditService.log({
        institution_id: institutionId,
        actor_user_id: authContext.userId,
        action: 'signature_attempt_failed',
        resource_type: 'class_session',
        resource_id: id,
        metadata_json: { reason: signErr instanceof Error ? signErr.message : 'unknown' },
      });
      throw signErr;
    }
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId, authContext } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:read');

    const signaturesService = new SignaturesService(env);
    const credentialsService = new SignatureCredentialsService(env);
    const { id } = context.params;

    const sigStatus = await signaturesService.getSessionSignatureStatus(id);

    if (!sigStatus.session) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (sigStatus.session.institution_id !== institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta sesión' }, { status: 403 });
    }

    const credentialStatus = await credentialsService.getCredentialStatus(authContext.userId, institutionId);

    return Response.json({
      ok: true,
      data: {
        ...sigStatus,
        credential: credentialStatus,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}