interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

import { requireActiveAuthContext, getAuthContextFromRequest } from '../../_lib/auth-adapter';
import { type AuthenticatedUserContext } from '../../core/authorization';

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };

    const authContext = await getAuthContextFromRequest(context.request, env);

    if (!authContext) {
      return Response.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    if (!authContext.isActive) {
      return Response.json({ ok: false, error: 'INACTIVE_USER' }, { status: 409 });
    }

    // Get session metadata if available
    let sessionMeta = null;
    // The sessionId would be available from the session if we had access to it
    // For now, we keep the session metadata retrieval as-is but it needs the sessionId
    // This is a placeholder - the sessionId would need to be passed from the auth adapter

    return Response.json({
      user: {
        id: authContext.userId,
        email: authContext.email,
        nombre: authContext.nombre,
        rol: authContext.role,
        active: authContext.isActive ? 1 : 0,
        institutionId: authContext.institutionId,
        institutionalRole: authContext.role,
        permissions: authContext.permissions,
        scope: authContext.scope ? {
          courseIds: authContext.scope.courseIds,
          subjectIds: authContext.scope.subjectIds,
        } : undefined,
      },
      session: null, // session metadata not available in new auth flow
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
