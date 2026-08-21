interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

import { getAuthContextFromRequest } from '../../_lib/auth-adapter';
import { AuthorizationError } from '../../core/authorization';
import { getSessionMetadataFromRequest } from '../../_lib/session';

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

    const sessionMeta = await getSessionMetadataFromRequest(context.request, env);

    let institutionBranding: { logoUrl: string | null; primaryColor: string | null } | null = null;
    if (authContext.institutionId) {
      const row = await context.env.DB.prepare(
        'SELECT logo_url, primary_color FROM institutions WHERE id = ?'
      ).bind(authContext.institutionId).first<{ logo_url: string | null; primary_color: string | null }>();
      if (row) {
        institutionBranding = { logoUrl: row.logo_url, primaryColor: row.primary_color };
      }
    }

    return Response.json({
      user: {
        id: authContext.userId,
        email: authContext.email,
        nombre: authContext.nombre,
        rol: authContext.legacyRole,
        active: authContext.isActive,
        institutionId: authContext.institutionId,
        institutionalRole: authContext.role,
        permissions: authContext.permissions,
        institutionBranding,
        scope: authContext.scope ? {
          courseIds: authContext.scope.courseIds,
          subjectIds: authContext.scope.subjectIds,
          levelIds: authContext.scope.levelIds,
          academicYearIds: authContext.scope.academicYearIds,
        } : undefined,
      },
      session: sessionMeta?.sessionId ? {
        id: sessionMeta.sessionId,
        createdAt: sessionMeta.createdAt,
        lastSeenAt: sessionMeta.lastSeenAt,
        expiresAt: sessionMeta.expiresAt,
      } : null,
    });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return Response.json({ ok: false, error: err.message }, { status: err.status });
    }
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
