import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authModule from '../functions/core/authorization';

const mod = authModule;

const TEST_SECRET = 'test-secret-key-for-testing-1234!';

async function signToken(sub: string, email: string, secret: string): Promise<string> {
  function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
  findUserById?: any;
  membership?: any;
  scopes?: any;
} = {}) {
  const { findUserById, membership, scopes } = options;

  return {
    prepare: (sql: string) => ({
      bind: (...args: any[]) => ({
        first: async () => {
          const sqlLower = sql.toLowerCase();
          // Global admin check: SELECT 1 FROM usuarios WHERE id = ? AND rol = ? LIMIT 1
          if (sqlLower.includes('from usuarios') && sqlLower.includes('where id') && sqlLower.includes('and rol') && sqlLower.includes('limit')) {
            if (findUserById && findUserById.rol === 'admin') {
              return { '1': 1 };
            }
            return null;
          }
          // Main user query: SELECT id, email, nombre, rol, active FROM usuarios WHERE id = ?
          if (sqlLower.includes('from usuarios') && sqlLower.includes('where id') && !sqlLower.includes('and rol') && !sqlLower.includes('limit')) {
            return findUserById || null;
          }
          if (sqlLower.includes('from institution_members') && sqlLower.includes('user_id')) {
            return membership || null;
          }
          if (sqlLower.includes('from coordinator_scopes') && sqlLower.includes('user_id')) {
            return scopes || null;
          }
          return null;
        },
        all: async () => ({ results: [] }),
        run: async () => {},
      }),
    }),
  };
}

describe('Authorization Context - Autenticación y Contexto', () => {
  it('request sin token → 401 UNAUTHENTICATED', async () => {
    const request = new Request('http://localhost/api/test');
    const context = { request, env: { DB: makeMockDB(), JWT_SECRET: TEST_SECRET } } as any;

    await expect(mod.requireAuthenticatedUser(request, context.env))
      .rejects.toThrow(mod.AuthorizationError);

    try {
      await mod.requireAuthenticatedUser(request, context.env);
    } catch (e) {
      expect((e as mod.AuthorizationError).status).toBe(401);
      expect((e as mod.AuthorizationError).code).toBe('UNAUTHENTICATED');
    }
  });

  it('token inválido → 401', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    const context = { request, env: { DB: makeMockDB(), JWT_SECRET: TEST_SECRET } } as any;

    await expect(mod.requireAuthenticatedUser(request, context.env))
      .rejects.toThrow(mod.AuthorizationError);
  });

  it('token expirado → 401', async () => {
    function bytesToBase64Url(bytes: Uint8Array): string {
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function textToBase64Url(value: unknown): string {
      return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
    }
    async function sig(value: string): Promise<string> {
      const key = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(TEST_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
      );
      return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
    }
    const header = textToBase64Url({ alg: 'HS256', typ: 'JWT' });
    const now = Math.floor(Date.now() / 1000);
    const payload = textToBase64Url({ sub: 'user-1', email: 'test@test.cl', iat: now - 10000, exp: now - 100 });
    const unsigned = `${header}.${payload}`;
    const token = `${unsigned}.${await sig(unsigned)}`;

    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const context = { request, env: { DB: makeMockDB(), JWT_SECRET: TEST_SECRET } } as any;

    await expect(mod.requireAuthenticatedUser(request, context.env))
      .rejects.toThrow(mod.AuthorizationError);
  });

  it('usuario inexistente → error controlado', async () => {
    const token = await signToken('nonexistent', 'none@test.cl', TEST_SECRET);
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const context = { request, env: { DB: makeMockDB({ findUserById: null }), JWT_SECRET: TEST_SECRET } } as any;

    await expect(mod.requireAuthenticatedUser(request, context.env))
      .rejects.toThrow(mod.AuthorizationError);

    try {
      await mod.requireAuthenticatedUser(request, context.env);
    } catch (e) {
      expect((e as mod.AuthorizationError).status).toBe(401);
      expect((e as mod.AuthorizationError).code).toBe('UNAUTHENTICATED');
    }
  });

  it('usuario inactivo → 409 INACTIVE_USER', async () => {
    const token = await signToken('inactive-1', 'inactive@test.cl', TEST_SECRET);
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const context = {
      request,
      env: { DB: makeMockDB({
        findUserById: { id: 'inactive-1', email: 'inactive@test.cl', nombre: 'Inactive', rol: 'docente', active: 0 }
      }), JWT_SECRET: TEST_SECRET }
    } as any;

    await expect(mod.requireAuthenticatedUser(request, context.env))
      .rejects.toThrow(mod.AuthorizationError);

    try {
      await mod.requireAuthenticatedUser(request, context.env);
    } catch (e) {
      expect((e as mod.AuthorizationError).status).toBe(409);
      expect((e as mod.AuthorizationError).code).toBe('INACTIVE_USER');
    }
  });

  it('super_admin global → institutionId null, role super_admin', async () => {
    const token = await signToken('super-1', 'super@test.cl', TEST_SECRET);
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const context = {
      request,
      env: { DB: makeMockDB({
        findUserById: { id: 'super-1', email: 'super@test.cl', nombre: 'Super', rol: 'admin', active: 1 }
      }), JWT_SECRET: TEST_SECRET }
    } as any;

    const ctx = await mod.requireAuthenticatedUser(request, context.env);

    expect(ctx.userId).toBe('super-1');
    expect(ctx.institutionId).toBeNull();
    expect(ctx.role).toBe('super_admin');
    expect(ctx.permissions).toContain('institution:*');
    expect(ctx.permissions).toContain('user:*');
  });

  it('admin miembro de institución → institution_admin', async () => {
    const token = await signToken('inst-admin-1', 'instadmin@test.cl', TEST_SECRET);
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const context = {
      request,
      env: { DB: makeMockDB({
        findUserById: { id: 'inst-admin-1', email: 'instadmin@test.cl', nombre: 'InstAdmin', rol: 'docente', active: 1 },
        membership: { institution_id: 'inst-123', role: 'institution_admin' }
      }), JWT_SECRET: TEST_SECRET }
    } as any;

    const ctx = await mod.requireAuthenticatedUser(request, context.env);

    expect(ctx.userId).toBe('inst-admin-1');
    expect(ctx.institutionId).toBe('inst-123');
    expect(ctx.role).toBe('institution_admin');
    expect(ctx.permissions).toContain('user:create');
    expect(ctx.permissions).toContain('course:assign_teacher');
  });

  it('docente legacy → teacher', async () => {
    const token = await signToken('teacher-1', 'teacher@test.cl', TEST_SECRET);
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const context = {
      request,
      env: { DB: makeMockDB({
        findUserById: { id: 'teacher-1', email: 'teacher@test.cl', nombre: 'Teacher', rol: 'docente', active: 1 },
        membership: { institution_id: 'inst-123', role: 'teacher' }
      }), JWT_SECRET: TEST_SECRET }
    } as any;

    const ctx = await mod.requireAuthenticatedUser(request, context.env);

    expect(ctx.userId).toBe('teacher-1');
    expect(ctx.institutionId).toBe('inst-123');
    expect(ctx.role).toBe('teacher');
    expect(ctx.permissions).toContain('plan:create');
    expect(ctx.permissions).toContain('classbook:sign_own');
  });

  it('coordinator con scope → coordinator', async () => {
    const token = await signToken('coordinator-1', 'coordinator@test.cl', TEST_SECRET);
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const context = {
      request,
      env: { DB: makeMockDB({
        findUserById: { id: 'coordinator-1', email: 'coordinator@test.cl', nombre: 'Coordinator', rol: 'docente', active: 1 },
        membership: { institution_id: 'inst-123', role: 'coordinator' },
        scopes: { course_ids: '["course-1","course-2"]', subject_ids: '["subj-1"]', level_ids: '["level-1"]', academic_year_ids: '["year-1"]' }
      }), JWT_SECRET: TEST_SECRET }
    } as any;

    const ctx = await mod.requireAuthenticatedUser(request, context.env);

    expect(ctx.userId).toBe('coordinator-1');
    expect(ctx.institutionId).toBe('inst-123');
    expect(ctx.role).toBe('coordinator');
    expect(ctx.scope).toBeDefined();
    expect(ctx.scope!.courseIds).toEqual(['course-1', 'course-2']);
    expect(ctx.scope!.subjectIds).toEqual(['subj-1']);
    expect(ctx.permissions).toContain('plan:review');
    expect(ctx.permissions).toContain('plan:approve');
  });

  it('student → student', async () => {
    const token = await signToken('student-1', 'student@test.cl', TEST_SECRET);
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const context = {
      request,
      env: { DB: makeMockDB({
        findUserById: { id: 'student-1', email: 'student@test.cl', nombre: 'Student', rol: 'docente', active: 1 },
        membership: { institution_id: 'inst-123', role: 'student' }
      }), JWT_SECRET: TEST_SECRET }
    } as any;

    const ctx = await mod.requireAuthenticatedUser(request, context.env);

    expect(ctx.userId).toBe('student-1');
    expect(ctx.institutionId).toBe('inst-123');
    expect(ctx.role).toBe('student');
    expect(ctx.permissions).toContain('classbook:read_own');
  });

  it('rol desconocido → acceso bloqueado', async () => {
    const token = await signToken('unknown-1', 'unknown@test.cl', TEST_SECRET);
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const context = {
      request,
      env: { DB: makeMockDB({
        findUserById: { id: 'unknown-1', email: 'unknown@test.cl', nombre: 'Unknown', rol: 'random_role', active: 1 },
        membership: { institution_id: 'inst-123', role: 'random_role' }
      }), JWT_SECRET: TEST_SECRET }
    } as any;

    await expect(mod.requireAuthenticatedUser(request, context.env))
      .rejects.toThrow(mod.AuthorizationError);

    try {
      await mod.requireAuthenticatedUser(request, context.env);
    } catch (e) {
      expect((e as mod.AuthorizationError).status).toBe(403);
      expect((e as mod.AuthorizationError).code).toBe('FORBIDDEN');
    }
  });

  it('requireActiveUser pasa si activo, falla si inactivo', async () => {
    const activeCtx = { isActive: true } as any;
    await expect(mod.requireActiveUser(activeCtx)).resolves.toBe(activeCtx);

    const inactiveCtx = { isActive: false } as any;
    await expect(mod.requireActiveUser(inactiveCtx))
      .rejects.toThrow(mod.AuthorizationError);

    try {
      await mod.requireActiveUser(inactiveCtx);
    } catch (e) {
      expect((e as mod.AuthorizationError).status).toBe(409);
      expect((e as mod.AuthorizationError).code).toBe('INACTIVE_USER');
    }
  });

  it('requireInstitution pasa si tiene institución, falla si no', async () => {
    const withInst = { institutionId: 'inst-1' } as any;
    await expect(mod.requireInstitution(withInst)).resolves.toBe(withInst);

    const withoutInst = { institutionId: null } as any;
    await expect(mod.requireInstitution(withoutInst))
      .rejects.toThrow(mod.AuthorizationError);

    try {
      await mod.requireInstitution(withoutInst);
    } catch (e) {
      expect((e as mod.AuthorizationError).status).toBe(403);
      expect((e as mod.AuthorizationError).code).toBe('FORBIDDEN');
    }
  });
});

describe('Authorization Context - Permisos', () => {
  it('permiso exacto concedido', async () => {
    const ctx = { permissions: ['plan:create', 'plan:read'] } as any;
    await expect(mod.requirePermission(ctx, 'plan:create')).resolves.toBe(ctx);
  });

  it('permiso exacto denegado', async () => {
    const ctx = { permissions: ['plan:read'] } as any;
    await expect(mod.requirePermission(ctx, 'plan:create'))
      .rejects.toThrow(mod.AuthorizationError);
  });

  it('wildcard institution:* concede institution:read', async () => {
    const ctx = { permissions: ['institution:*'] } as any;
    await expect(mod.requirePermission(ctx, 'institution:read')).resolves.toBe(ctx);
    await expect(mod.requirePermission(ctx, 'institution:update')).resolves.toBe(ctx);
  });

  it('wildcard no concede otro namespace', async () => {
    const ctx = { permissions: ['institution:*'] } as any;
    await expect(mod.requirePermission(ctx, 'user:create'))
      .rejects.toThrow(mod.AuthorizationError);
  });

  it('super_admin obtiene permisos esperados', async () => {
    const ctx = { permissions: ['institution:*', 'user:*', 'course:*', 'plan:*', 'classbook:*', 'report:*', 'config:*', 'audit:*'] } as any;
    expect(ctx.permissions).toContain('institution:*');
    expect(ctx.permissions).toContain('user:*');
    expect(ctx.permissions).toContain('classbook:*');
  });

  it('teacher no obtiene user:create', async () => {
    const ctx = { permissions: ['course:read_own', 'plan:create', 'plan:read_own', 'classbook:sign_own'] } as any;
    await expect(mod.requirePermission(ctx, 'user:create'))
      .rejects.toThrow(mod.AuthorizationError);
  });

  it('coordinator obtiene plan:review', async () => {
    const ctx = { permissions: ['course:read', 'plan:review', 'plan:approve', 'classbook:read', 'report:scope'] } as any;
    await expect(mod.requirePermission(ctx, 'plan:review')).resolves.toBe(ctx);
  });

  it('student no obtiene classbook:update_own', async () => {
    const ctx = { permissions: ['classbook:read_own', 'resource:read_assigned'] } as any;
    await expect(mod.requirePermission(ctx, 'classbook:update_own'))
      .rejects.toThrow(mod.AuthorizationError);
  });

  it('requireAnyPermission: uno de varios válido', async () => {
    const ctx = { permissions: ['plan:create'] } as any;
    await expect(mod.requireAnyPermission(ctx, ['plan:read', 'plan:create', 'plan:update'])).resolves.toBe(ctx);
  });

  it('requireAnyPermission: ninguno válido', async () => {
    const ctx = { permissions: ['plan:read'] } as any;
    await expect(mod.requireAnyPermission(ctx, ['plan:create', 'plan:update']))
      .rejects.toThrow(mod.AuthorizationError);
  });

  it('requireAnyPermission: lista vacía', async () => {
    const ctx = { permissions: ['plan:read'] } as any;
    await expect(mod.requireAnyPermission(ctx, []))
      .rejects.toThrow(mod.AuthorizationError);
  });
});

describe('Authorization Context - Aislamiento Multiinstitución', () => {
  it('institution_admin accede a su institución', async () => {
    const ctx = { institutionId: 'inst-123' } as any;
    await expect(mod.requireInstitutionMatch(ctx, 'inst-123')).resolves.toBe(ctx);
  });

  it('institution_admin intenta otra institución → 403', async () => {
    const ctx = { institutionId: 'inst-123' } as any;
    await expect(mod.requireInstitutionMatch(ctx, 'inst-456'))
      .rejects.toThrow(mod.AuthorizationError);

    try {
      await mod.requireInstitutionMatch(ctx, 'inst-456');
    } catch (e) {
      expect((e as mod.AuthorizationError).status).toBe(403);
      expect((e as mod.AuthorizationError).code).toBe('FORBIDDEN');
    }
  });
});

describe('Authorization Context - Seguridad y Errores', () => {
  it('AuthorizationError conserva status y code', () => {
    const err = new mod.AuthorizationError(403, 'FORBIDDEN', 'No tienes permiso');
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.message).toBe('No tienes permiso');
  });

  it('unauthorized() crea error 401', () => {
    const err = mod.unauthorized('Token inválido');
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHENTICATED');
  });

  it('forbidden() crea error 403', () => {
    const err = mod.forbidden('Sin permisos');
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('inactiveUser() crea error 409', () => {
    const err = mod.inactiveUser('Usuario desactivado');
    expect(err.status).toBe(409);
    expect(err.code).toBe('INACTIVE_USER');
  });

  it('notFound() crea error 404', () => {
    const err = mod.notFound('Recurso no existe');
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('errores serializables', () => {
    const err = mod.forbidden('Test');
    const json = JSON.stringify(err);
    expect(json).toContain('FORBIDDEN');
    expect(json).toContain('Test');
  });
});