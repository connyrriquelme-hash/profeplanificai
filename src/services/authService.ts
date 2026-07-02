import { api } from './apiClient';
import type { User } from '../contexts/AuthContext';

const USERS_KEY = 'planificaia_users';
const USER_KEY = 'planificaia_user';
const TOKEN_KEY = 'planificaia_token';

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

interface AuthResponse {
  user: User;
  token: string;
  session?: { id: string; createdAt: string; expiresAt: string };
}

export interface SessionInfo {
  id: string;
  createdAt: string;
  lastSeenAt: string | null;
  expiresAt: string;
  userAgent: string;
  isCurrent: boolean;
}

export async function loginAPI(email: string, password: string): Promise<{ user: User; token: string }> {
  try {
    const data = await api.post<AuthResponse>('/api/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: data.token }));
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  } catch (error) {
    const status = (error as Error & { status?: number })?.status;
    if (status && status < 500) throw error;
    await new Promise((r) => setTimeout(r, 300));
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const found = users.find((u) => u.email === email);
    if (!found) throw new Error('Usuario no encontrado. Verifica tu email.');
    const token = genId() + '.' + genId();
    localStorage.setItem(USER_KEY, JSON.stringify(found));
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token }));
    return { user: found, token };
  }
}

export async function registerAPI(
  email: string,
  password: string,
  nombre: string
): Promise<{ user: User; token: string }> {
  try {
    const data = await api.post<AuthResponse>('/api/auth/register', { email, password, nombre });
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: data.token }));
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  } catch (error) {
    const status = (error as Error & { status?: number })?.status;
    if (status && status < 500) throw error;
    await new Promise((r) => setTimeout(r, 300));
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.some((u) => u.email === email)) throw new Error('Este email ya está registrado.');
    const newUser: User = { id: genId(), email, nombre, rol: 'docente' };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const token = genId() + '.' + genId();
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token }));
    return { user: newUser, token };
  }
}

export async function verifySession(): Promise<User | null> {
  const tokenRaw = localStorage.getItem(TOKEN_KEY);
  if (!tokenRaw) return null;

  try {
    const data = await api.get<{ user: User }>('/api/auth/me');
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  } catch (error) {
    const status = (error as Error & { status?: number })?.status;
    if (status && status < 500) {
      await logoutAPI();
      return null;
    }
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) as User : null;
  }
}

export async function refreshUser(): Promise<User | null> {
  try {
    const data = await api.get<{ user: User }>('/api/auth/me');
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  } catch {
    return null;
  }
}

export async function logoutAPI(): Promise<void> {
  try {
    await api.post('/api/auth/logout', undefined);
  } catch {
    // Even if the API call fails, clear local state
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function getSessions(): Promise<SessionInfo[]> {
  const data = await api.get<{ sessions: SessionInfo[] }>('/api/auth/sessions');
  return data.sessions;
}

export async function revokeSessionAPI(sessionId: string): Promise<void> {
  await api.del(`/api/auth/sessions/${sessionId}`);
}

export async function revokeOtherSessionsAPI(): Promise<number> {
  const data = await api.post<{ revokedCount: number }>('/api/auth/sessions/revoke-others', undefined);
  return data.revokedCount;
}
