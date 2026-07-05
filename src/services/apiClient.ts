import { sanitizeApiError } from './apiError';

const BASE_URL = import.meta.env.VITE_API_URL || '';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('planificaia_token');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || raw;
  } catch {
    return null;
  }
}

async function request<T = unknown>(endpoint: string, opts: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = opts;
  const token = getToken();

  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (token) h['Authorization'] = `Bearer ${token}`;

  let r: Response;
  try {
    r = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: h,
      body: body ? JSON.stringify(body) : undefined,
      signal,
      credentials: 'include',
    });
  } catch (networkErr) {
    const msg = networkErr instanceof Error ? networkErr.message : '';
    if (msg.includes('abort') || msg.includes('AbortError')) throw networkErr;
    throw new Error('No se pudo conectar al servidor. Verifica tu conexion.');
  }

  const rawText = await r.text().catch(() => '');
  let data: any = null;
  try { data = rawText ? JSON.parse(rawText) : null; } catch { data = rawText; }

  if (!r.ok) {
    if (r.status === 401) {
      localStorage.removeItem('planificaia_token');
      localStorage.removeItem('planificaia_user');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:invalid-session'));
      }
    }

    const serverMsg = (data && typeof data === 'object')
      ? (data.error || data.message || JSON.stringify(data))
      : rawText;
    const msg = sanitizeApiError(serverMsg, r.status);

    const error = new Error(msg) as Error & { status?: number };
    error.status = r.status;
    throw error;
  }

  return data as T;
}

export const api = {
  get: <T = unknown>(endpoint: string, signal?: AbortSignal) =>
    request<T>(endpoint, { method: 'GET', signal }),
  post: <T = unknown>(endpoint: string, body: unknown, signal?: AbortSignal) =>
    request<T>(endpoint, { method: 'POST', body, signal }),
  patch: <T = unknown>(endpoint: string, body: unknown, signal?: AbortSignal) =>
    request<T>(endpoint, { method: 'PATCH', body, signal }),
  put: <T = unknown>(endpoint: string, body: unknown, signal?: AbortSignal) =>
    request<T>(endpoint, { method: 'PUT', body, signal }),
  del: <T = unknown>(endpoint: string, signal?: AbortSignal) =>
    request<T>(endpoint, { method: 'DELETE', signal }),
  getToken,
};

export type { ApiOptions };
