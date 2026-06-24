export interface AdminEnv { ADMIN_TOKEN?: string; HMAC_SECRET?: string }

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index++) mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return mismatch === 0;
}

export async function authorizeAdmin(request: Request, rawBody: string, env: AdminEnv): Promise<boolean> {
  const token = request.headers.get('x-admin-token') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (env.ADMIN_TOKEN && token && safeEqual(token, env.ADMIN_TOKEN)) return true;
  if (!env.HMAC_SECRET) return false;
  const timestamp = request.headers.get('x-timestamp') || '';
  const provided = request.headers.get('x-signature')?.replace(/^sha256=/, '') || '';
  if (!timestamp || Math.abs(Date.now() - Number(timestamp)) > 300000) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.HMAC_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`)));
  return safeEqual(expected, provided);
}
