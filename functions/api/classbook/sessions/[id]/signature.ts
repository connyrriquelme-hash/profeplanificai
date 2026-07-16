import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionContext } from '../../../../_lib/auth-adapter';
import { SignaturesService } from '../../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requireInstitutionContext(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:sign');

    const { id } = context.params;
    const body = await context.request.json() as {
      content_hash: string;
    };

    if (!body.content_hash) {
      return Response.json({ ok: false, error: 'Falta content_hash' }, { status: 422 });
    }

    const signaturesService = new SignaturesService(env);
    const institutionId = authContext.institutionId;

    const status = await signaturesService.getSessionSignatureStatus(id);

    if (!status.session) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (status.session.institution_id !== institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta sesión' }, { status: 403 });
    }

    if (!status.canSign) {
      return Response.json({ ok: false, error: status.reason || 'No se puede firmar esta sesión' }, { status: 400 });
    }

    const signature = await signaturesService.manualConfirmSignature(
      id,
      authContext.userId,
      institutionId,
      body.content_hash
    );

    return Response.json({ ok: true, data: { session: status.session, signature } });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requireInstitutionContext(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:read');

    const signaturesService = new SignaturesService(env);
    const institutionId = authContext.institutionId;
    const { id } = context.params;

    const status = await signaturesService.getSessionSignatureStatus(id);

    if (!status.session) {
      return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (status.session.institution_id !== institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta sesión' }, { status: 403 });
    }

    return Response.json({ ok: true, data: status });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}