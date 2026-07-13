import { getSessionFromRequest, type SessionEnv } from './session';
import {
  requireAuthenticatedUser,
  type AuthEnv,
  type AuthenticatedUserContext,
  requireActiveUser,
  requireInstitution,
  requireInstitutionMatch,
  requirePermission,
  requireAnyPermission,
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

  const authHeader = request.headers.get('Authorization');
  let authToken: string | null = null;
  
  if (request.headers.get('Authorization')?.startsWith('Bearer ')) {
    authToken = request.headers.get('Authorization')?.slice(7) || null;
  }

  const mockRequest = new Request(request.url, {
    method: request.method,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });

  try {
    const context = await requireAuthenticatedUser(mockRequest, authEnv);
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

export async function requireInstitutionAdminContext(
  request: Request,
  env: AuthAdapterEnv,
  institutionId: string
) {
  const context = await requireInstitutionContext(request, env);
  return requireInstitutionMatch(context, institutionId);
}