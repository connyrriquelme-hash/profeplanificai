import { verifyToken, createToken, type AuthEnv } from './auth';

export interface SessionEnv extends AuthEnv {
  DB: D1Database;
}

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}

export interface SessionPayload {
  userId: string;
  sessionId: string;
  email: string;
}

const SESSION_COOKIE = 'pia_session';
const SESSION_MAX_AGE = 86400 * 30; // 30 days in seconds

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function hashSessionId(sessionId: string): string {
  const bytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const data = encoder.encode(sessionId);
  return bytesToBase64Url(bytes);
}

export async function hashValue(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToBase64Url(new Uint8Array(hash));
}

export async function getSessionFromRequest(request: Request, env: SessionEnv): Promise<SessionPayload | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return getSessionFromCookie(request, env);
  }

  const token = auth.slice(7);
  const payload = await verifyToken(token, env.JWT_SECRET);
  if (!payload) return null;

  return {
    userId: payload.sub,
    sessionId: '',
    email: payload.email,
  };
}

async function getSessionFromCookie(request: Request, env: SessionEnv): Promise<SessionPayload | null> {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(cookieHeader.split(';').map(c => c.trim().split('=').map(s => s.trim())));
  const sessionId = cookies[SESSION_COOKIE];
  if (!sessionId) return null;

  const hash = await hashValue(sessionId);
  const session = await env.DB.prepare(
    'SELECT id, user_id, email, expires_at, revoked_at FROM user_sessions WHERE session_hash = ?'
  ).bind(hash).first<{ id: string; user_id: string; email: string; expires_at: string; revoked_at: string | null }>();

  if (!session || session.revoked_at) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  await env.DB.prepare('UPDATE user_sessions SET last_seen_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), session.id).run();

  return {
    userId: session.user_id,
    sessionId: session.id,
    email: session.email,
  };
}

export async function requireSession(request: Request, env: SessionEnv): Promise<SessionPayload> {
  const session = await getSessionFromRequest(request, env);
  if (!session) {
    throw new Response(JSON.stringify({ ok: false, error: 'Usuario o sesión inválida. Vuelve a iniciar sesión.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return session;
}

export async function requireUser(request: Request, env: SessionEnv): Promise<SessionUser> {
  const session = await requireSession(request, env);
  const user = await env.DB.prepare(
    'SELECT id, email, nombre, rol FROM usuarios WHERE id = ?'
  ).bind(session.userId).first<SessionUser>();

  if (!user) {
    throw new Response(JSON.stringify({ ok: false, error: 'Usuario no encontrado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return user;
}

export async function createSession(user: { id: string; email: string }, request: Request, env: SessionEnv): Promise<{ token: string; sessionId: string }> {
  const sessionId = crypto.randomUUID();
  const hash = await hashValue(sessionId);
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_MAX_AGE * 1000);
  const userAgent = request.headers.get('User-Agent') || '';

  await env.DB.prepare(
    `INSERT INTO user_sessions (id, user_id, session_hash, created_at, last_seen_at, expires_at, user_agent_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    hash,
    now.toISOString(),
    now.toISOString(),
    expires.toISOString(),
    userAgent.slice(0, 200),
  ).run();

  const token = await createToken(user.id, user.email, env.JWT_SECRET);
  return { token, sessionId };
}

export async function destroySession(sessionId: string, env: SessionEnv): Promise<void> {
  await env.DB.prepare('UPDATE user_sessions SET revoked_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), sessionId).run();
}

export async function revokeAllUserSessions(userId: string, env: SessionEnv, exceptSessionId?: string): Promise<void> {
  if (exceptSessionId) {
    await env.DB.prepare('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND id != ?')
      .bind(new Date().toISOString(), userId, exceptSessionId).run();
  } else {
    await env.DB.prepare('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ?')
      .bind(new Date().toISOString(), userId).run();
  }
}

export function serializeSessionCookie(sessionId: string, expiresAt: Date): string {
  const parts = [
    `${SESSION_COOKIE}=${sessionId}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE}`,
  ];
  if (typeof globalThis.process !== 'undefined' && globalThis.process.env?.ENVIRONMENT === 'production') {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
