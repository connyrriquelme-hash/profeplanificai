import { describe, it, expect } from 'vitest';

const TEST_SECRET = 'test-secret-key-for-testing-1234!';

async function signToken(sub: string, email: string, secret: string): Promise<string> {
  function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  function textToBase64Url(value: unknown): string {
    return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
  }
  async function sig(value: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
  }
  const now = Math.floor(Date.now() / 1000);
  const header = textToBase64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = textToBase64Url({ sub, email, iat: now, exp: now + 86400 });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${await sig(unsigned)}`;
}

function makeMockDB(options: {
  findUserByEmail?: any;
  findUserById?: any;
  adminUser?: any;
  adminCount?: number;
  institutionMember?: any;
  coordinatorScope?: any;
  teacherCourses?: any;
}) {
  return {
    prepare: (sql: string) => ({
      bind: (...args: any[]) => ({
        first: async () => {
          // User query from JWT token
          if (sql.includes('SELECT id, email, nombre, rol, active') && sql.includes('WHERE id = ?')) {
            return options.findUserById || options.adminUser || { id: 'user-1', email: 'test@test.cl', nombre: 'Test', rol: 'docente', active: 1 };
          }
          // Email lookup for registration
          if (sql.includes('SELECT id FROM usuarios WHERE email')) {
            return options.findUserByEmail || null;
          }
          // Admin count check
          if (sql.includes('SELECT COUNT(*) as c FROM usuarios WHERE rol')) {
            return { c: options.adminCount ?? 1 };
          }
          // Institution membership query (new authorization system)
          if (sql.includes('FROM institution_members') && sql.includes('WHERE user_id = ?')) {
            return options.institutionMember || null;
          }
          // Global admin check
          if (sql.includes('SELECT 1 FROM usuarios WHERE id = ? AND rol = ?')) {
            return options.adminUser?.rol === 'admin' ? { 1: 1 } : null;
          }
          // Coordinator scope query
          if (sql.includes('FROM coordinator_scopes') && sql.includes('WHERE user_id = ?')) {
            return options.coordinatorScope || null;
          }
          // Teacher courses query
          if (sql.includes('FROM teacher_classes') && sql.includes('WHERE tc.teacher_id = ?')) {
            return options.teacherCourses || { results: [] };
          }
          return options.findUserById || null;
        },
        all: async () => ({ results: [] }),
        run: async () => {},
      }),
    }),
  };
}

describe('Auth + Admin User Management', () => {
  describe('Register endpoint blocked', () => {
    it('POST /api/auth/register returns 403', async () => {
      const mod = await import('../functions/api/auth/register');
      const resp = await mod.onRequestPost();
      expect(resp.status).toBe(403);
      const body = await resp.json() as any;
      expect(body.success).toBe(false);
      expect(body.error).toContain('deshabilitado');
    });

    it('Register endpoint does not create user', async () => {
      const mod = await import('../functions/api/auth/register');
      const resp = await mod.onRequestPost();
      const body = await resp.json() as any;
      expect(body.success).toBe(false);
    });
  });

  describe('Login endpoint', () => {
    it('returns 400 when email missing', async () => {
      const mod = await import('../functions/api/auth/login');
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test123' }),
      });
      const context = { request, env: { DB: null, JWT_SECRET: TEST_SECRET } } as any;
      const resp = await mod.onRequestPost(context);
      expect(resp.status).toBe(400);
    });

    it('returns 401 when user does not exist', async () => {
      const mod = await import('../functions/api/auth/login');
      const mockDB = {
        prepare: () => ({
          bind: () => ({
            first: async () => null,
          }),
        }),
      };
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@test.cl', password: 'test123' }),
      });
      const context = { request, env: { DB: mockDB, JWT_SECRET: TEST_SECRET } } as any;
      const resp = await mod.onRequestPost(context);
      expect(resp.status).toBe(401);
      const body = await resp.json() as any;
      expect(body.error).toContain('incorrectos');
    });

    it('returns 403 when user is inactive', async () => {
      const mod = await import('../functions/api/auth/login');
      const mockDB = {
        prepare: () => ({
          bind: () => ({
            first: async () => ({
              id: 'user-1',
              email: 'test@test.cl',
              nombre: 'Test',
              password_hash: 'pbkdf2$100000$test$test',
              rol: 'docente',
              active: 0,
            }),
          }),
        }),
      };
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.cl', password: 'test123' }),
      });
      const context = { request, env: { DB: mockDB, JWT_SECRET: TEST_SECRET } } as any;
      const resp = await mod.onRequestPost(context);
      expect(resp.status).toBe(403);
      const body = await resp.json() as any;
      expect(body.error).toContain('desactivada');
    });
  });

  describe('Admin users endpoint', () => {
    const adminUser = { id: 'admin-1', email: 'admin@test.cl', nombre: 'Admin', rol: 'admin' };

    it('GET requires admin role - non-admin gets 403', async () => {
      const mod = await import('../functions/api/admin/usuarios');
      const mockDB = makeMockDB({
        findUserById: { id: 'user-1', email: 'doc@test.cl', nombre: 'Doc', rol: 'docente', active: 1 },
        institutionMember: { institution_id: 'inst-1', role: 'teacher' },
      });
      const token = await signToken('user-1', 'doc@test.cl', TEST_SECRET);
      const request = new Request('http://localhost/api/admin/usuarios', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const context = { request, env: { DB: mockDB, JWT_SECRET: TEST_SECRET } } as any;
      const resp = await mod.onRequestGet(context);
      expect(resp.status).toBe(403);
    });

    it('GET requires token - no token gets 401', async () => {
      const mod = await import('../functions/api/admin/usuarios');
      const mockDB = makeMockDB({ adminUser: null });
      const request = new Request('http://localhost/api/admin/usuarios', {
        method: 'GET',
      });
      const context = { request, env: { DB: mockDB, JWT_SECRET: TEST_SECRET } } as any;
      const resp = await mod.onRequestGet(context);
      expect(resp.status).toBe(401);
    });

    it('POST requires admin role - non-admin gets 403', async () => {
      const mod = await import('../functions/api/admin/usuarios');
      const mockDB = makeMockDB({
        findUserById: { id: 'user-1', email: 'doc@test.cl', nombre: 'Doc', rol: 'docente', active: 1 },
        institutionMember: { institution_id: 'inst-1', role: 'teacher' },
      });
      const token = await signToken('user-1', 'doc@test.cl', TEST_SECRET);
      const request = new Request('http://localhost/api/admin/usuarios', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New', email: 'new@test.cl', password: 'test1234' }),
      });
      const context = { request, env: { DB: mockDB, JWT_SECRET: TEST_SECRET } } as any;
      const resp = await mod.onRequestPost(context);
      expect(resp.status).toBe(403);
    });

    it('POST returns 400 when fields missing', async () => {
      const mod = await import('../functions/api/admin/usuarios');
      const mockDB = makeMockDB({
        findUserById: { id: 'admin-1', email: 'admin@test.cl', nombre: 'Admin', rol: 'admin', active: 1 },
        institutionMember: { role: 'institution_admin' },
      });
      const token = await signToken('admin-1', 'admin@test.cl', TEST_SECRET);
      const request = new Request('http://localhost/api/admin/usuarios', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New' }),
      });
      const context = { request, env: { DB: mockDB, JWT_SECRET: TEST_SECRET } } as any;
      const resp = await mod.onRequestPost(context);
      expect(resp.status).toBe(400);
      const body = await resp.json() as any;
      expect(body.error).toContain('Faltan campos');
    });

    it('POST returns 409 when email exists', async () => {
      const mod = await import('../functions/api/admin/usuarios');
      const mockDB = makeMockDB({
        findUserById: { id: 'admin-1', email: 'admin@test.cl', nombre: 'Admin', rol: 'admin', active: 1 },
        institutionMember: { role: 'institution_admin' },
        findUserByEmail: { id: 'existing-user' },
      });
      const token = await signToken('admin-1', 'admin@test.cl', TEST_SECRET);
      const request = new Request('http://localhost/api/admin/usuarios', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'existing@test.cl', password: 'test1234' }),
      });
      const context = { request, env: { DB: mockDB, JWT_SECRET: TEST_SECRET } } as any;
      const resp = await mod.onRequestPost(context);
      expect(resp.status).toBe(409);
      const body = await resp.json() as any;
      expect(body.error).toContain('ya está registrado');
    });

    it('POST returns 400 when password too short', async () => {
      const mod = await import('../functions/api/admin/usuarios');
      const mockDB = makeMockDB({
        findUserById: { id: 'admin-1', email: 'admin@test.cl', nombre: 'Admin', rol: 'admin', active: 1 },
        institutionMember: { role: 'institution_admin' },
        findUserByEmail: null,
      });
      const token = await signToken('admin-1', 'admin@test.cl', TEST_SECRET);
      const request = new Request('http://localhost/api/admin/usuarios', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'test@test.cl', password: '123' }),
      });
      const context = { request, env: { DB: mockDB, JWT_SECRET: TEST_SECRET } } as any;
      const resp = await mod.onRequestPost(context);
      expect(resp.status).toBe(400);
      const body = await resp.json() as any;
      expect(body.error).toContain('6 caracteres');
    });

    it('PATCH returns 400 when trying to deactivate self', async () => {
      const mod = await import('../functions/api/admin/usuarios');
      const mockDB = makeMockDB({
        findUserById: { id: 'admin-1', email: 'admin@test.cl', nombre: 'Admin', rol: 'admin', active: 1 },
        institutionMember: { role: 'institution_admin' },
      });
      const token = await signToken('admin-1', 'admin@test.cl', TEST_SECRET);
      const request = new Request('http://localhost/api/admin/usuarios', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'admin-1', active: false }),
      });
      const context = { request, env: { DB: mockDB, JWT_SECRET: TEST_SECRET } } as any;
      const resp = await mod.onRequestPatch(context);
      expect(resp.status).toBe(400);
      const body = await resp.json() as any;
      expect(body.error).toContain('propia cuenta');
    });

    it('PATCH returns 400 when no fields provided', async () => {
      const mod = await import('../functions/api/admin/usuarios');
      const mockDB = makeMockDB({
        findUserById: { id: 'admin-1', email: 'admin@test.cl', nombre: 'Admin', rol: 'admin', active: 1 },
        institutionMember: { role: 'institution_admin' },
      });
      const token = await signToken('admin-1', 'admin@test.cl', TEST_SECRET);
      const request = new Request('http://localhost/api/admin/usuarios', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'some-user' }),
      });
      const context = { request, env: { DB: mockDB, JWT_SECRET: TEST_SECRET } } as any;
      const resp = await mod.onRequestPatch(context);
      expect(resp.status).toBe(400);
      const body = await resp.json() as any;
      expect(body.error).toContain('No hay campos');
    });

    it('PATCH returns 400 when userId missing', async () => {
      const mod = await import('../functions/api/admin/usuarios');
      const mockDB = makeMockDB({
        findUserById: { id: 'admin-1', email: 'admin@test.cl', nombre: 'Admin', rol: 'admin', active: 1 },
        institutionMember: { role: 'institution_admin' },
      });
      const token = await signToken('admin-1', 'admin@test.cl', TEST_SECRET);
      const request = new Request('http://localhost/api/admin/usuarios', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: 'admin' }),
      });
      const context = { request, env: { DB: mockDB, JWT_SECRET: TEST_SECRET } } as any;
      const resp = await mod.onRequestPatch(context);
      expect(resp.status).toBe(400);
      const body = await resp.json() as any;
      expect(body.error).toContain('Falta userId');
    });
  });
});
