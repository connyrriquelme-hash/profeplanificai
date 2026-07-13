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
  } catch {
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
  const context = await requireAuthContext(request, env);
  if (!context.isActive) {
    throw new Response(JSON.stringify({ ok: false, error: 'Usuario inactivo' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return context;
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
  return requirePermission(activeContext, permission);
}

export async function requireAnyPermissionContext(
  request: Request,
  env: AuthAdapterEnv,
  permissions: string[]
) {
  const context = await requireAuthContext(request, env);
  const activeContext = await requireActiveUser(context);
  return requireAnyPermission(activeContext, permissions);
}

export async function requireInstitutionAdminContext(
  request: Request,
  env: AuthAdapterEnv,
  institutionId: string
) {
  const context = await requireInstitutionContext(request, env);
  return requireInstitutionMatch(context, institutionId);
}