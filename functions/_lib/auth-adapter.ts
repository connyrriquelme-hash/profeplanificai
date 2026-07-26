import { getSessionFromRequest, type SessionEnv } from './session';
import {
  requireAuthenticatedUserById,
  type AuthEnv,
  type AuthenticatedUserContext,
  requireActiveUser,
  requireInstitution,
  requireInstitutionMatch,
  requirePermission,
  requireAnyPermission,
  requireRole,
  AuthorizationError,
} from '../core/authorization';

export interface AuthAdapterEnv extends SessionEnv, AuthEnv {}

export async function getAuthContextFromRequest(
  request: Request,
  env: AuthAdapterEnv
): Promise<AuthenticatedUserContext | null> {
  const envForSession: SessionEnv = {
    DB: env.DB,
    JWT_SECRET: env.JWT_SECRET,
  };

  const session = await getSessionFromRequest(request, envForSession);
  if (!session) return null;

  const authEnv: AuthEnv = {
    DB: env.DB,
    JWT_SECRET: env.JWT_SECRET,
  };

  try {
    const context = await requireAuthenticatedUserById(session.userId, authEnv);
    return context;
  } catch (err) {
    if (err instanceof AuthorizationError) {
      throw err;
    }
    return null;
  }
}

export async function requireAuthContext(
  request: Request,
  env: AuthAdapterEnv
): Promise<AuthenticatedUserContext> {
  const context = await getAuthContextFromRequest(request, env);
  if (!context) {
    throw new Response(JSON.stringify({ ok: false, error: 'Token requerido' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return context;
}

export async function requireActiveAuthContext(
  request: Request,
  env: AuthAdapterEnv
): Promise<AuthenticatedUserContext> {
  try {
    const context = await requireAuthContext(request, env);
    return await requireActiveUser(context);
  } catch (err) {
    if (err instanceof AuthorizationError) {
      throw new Response(JSON.stringify({ ok: false, error: err.message }), {
        status: err.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw err;
  }
}

export async function requireInstitutionContext(
  request: Request,
  env: AuthAdapterEnv
) {
  const context = await requireAuthContext(request, env);
  const activeContext = await requireActiveUser(context);
  return requireInstitution(activeContext);
}

export async function requireInstitutionMatchContext(
  request: Request,
  env: AuthAdapterEnv,
  institutionId: string
) {
  const context = await requireInstitutionContext(request, env);
  return requireInstitutionMatch(context, institutionId);
}

export async function requirePermissionContext(
  request: Request,
  env: AuthAdapterEnv,
  permission: string
) {
  const context = await requireAuthContext(request, env);
  const activeContext = await requireActiveUser(context);
  try {
    return await requirePermission(activeContext, permission);
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      throw new Response(JSON.stringify({ ok: false, error: err.message }), {
        status: err.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw err;
  }
}

export async function requireAnyPermissionContext(
  request: Request,
  env: AuthAdapterEnv,
  permissions: string[]
) {
  const context = await requireAuthContext(request, env);
  const activeContext = await requireActiveUser(context);
  try {
    return await requireAnyPermission(activeContext, permissions);
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      throw new Response(JSON.stringify({ ok: false, error: err.message }), {
        status: err.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw err;
  }
}

export async function requireRoleContext(
  request: Request,
  env: AuthAdapterEnv,
  role: string
) {
  const context = await requireAuthContext(request, env);
  const activeContext = await requireActiveUser(context);
  return requireRole(activeContext, role as any);
}

export async function requireInstitutionAdminContext(
  request: Request,
  env: AuthAdapterEnv,
  institutionId: string
) {
  const context = await requireInstitutionContext(request, env);
  return requireInstitutionMatch(context, institutionId);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveEffectiveInstitutionId(
  request: Request,
  env: AuthAdapterEnv
): Promise<{ institutionId: string; authContext: AuthenticatedUserContext }> {
  const context = await requireAuthContext(request, env);
  const activeContext = await requireActiveUser(context);

  if (activeContext.role === 'super_admin') {
    const url = new URL(request.url);
    const param = url.searchParams.get('institution_id');

    if (!param) {
      throw new Response(JSON.stringify({ ok: false, error: 'Selecciona una institución activa' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!UUID_RE.test(param)) {
      throw new Response(JSON.stringify({ ok: false, error: 'Institución inválida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const exists = await env.DB.prepare('SELECT id FROM institutions WHERE id = ?').bind(param).first<{ id: string }>();
    if (!exists) {
      throw new Response(JSON.stringify({ ok: false, error: 'Institución no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return { institutionId: param, authContext: activeContext };
  }

  if (!activeContext.institutionId) {
    throw new Response(JSON.stringify({ ok: false, error: 'Usuario sin institución asignada' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return { institutionId: activeContext.institutionId, authContext: activeContext };
}
