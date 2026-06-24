export interface AuthEnv {
  JWT_SECRET: string;
}

interface TokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function textToBase64Url(value: unknown): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

async function signature(value: string, secret: string): Promise<string> {
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET no configurado de forma segura');
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
}

export async function createToken(id: string, email: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = textToBase64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = textToBase64Url({ sub: id, email, iat: now, exp: now + 86400 * 30 });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${await signature(unsigned, secret)}`;
}

export async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const expected = await signature(`${parts[0]}.${parts[1]}`, secret);
    if (expected.length !== parts[2].length) return null;
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ parts[2].charCodeAt(i);
    if (mismatch !== 0) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as TokenPayload;
    if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUserId(request: Request, secret: string): Promise<string | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return (await verifyToken(auth.slice(7), secret))?.sub || null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, material, 256,
  );
  return `pbkdf2$100000$${bytesToBase64Url(salt)}$${bytesToBase64Url(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith('pbkdf2$')) {
    const legacy = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)));
    let binary = '';
    for (const byte of legacy) binary += String.fromCharCode(byte);
    return btoa(binary) === stored;
  }
  const [, iterationsRaw, saltRaw, expected] = stored.split('$');
  const decode = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: decode(saltRaw), iterations: Number(iterationsRaw) }, material, 256,
  );
  return bytesToBase64Url(new Uint8Array(bits)) === expected;
}
