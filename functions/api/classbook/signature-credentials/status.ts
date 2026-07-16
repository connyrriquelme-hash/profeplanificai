import { requireAuthContext, requireActiveAuthContext, requireInstitutionContext } from '../../../_lib/auth-adapter';
import { SignatureCredentialsService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    const institutionCtx = await requireInstitutionContext(context.request, env);

    const credentialsService = new SignatureCredentialsService(env);
    const status = await credentialsService.getCredentialStatus(authContext.userId, institutionCtx.institutionId);

    return Response.json({ ok: true, data: status });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
