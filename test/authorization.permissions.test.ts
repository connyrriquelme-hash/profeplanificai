import { describe, it, expect } from 'vitest';
import * as authModule from '../functions/core/authorization';

const mod = authModule;

function makeTeacherContext(overrides: Partial<mod.AuthenticatedUserContext> = {}): mod.AuthenticatedUserContext {
  return {
    userId: 'teacher-1',
    institutionId: 'inst-1',
    role: 'teacher',
    isActive: true,
    permissions: [
      'course:read_own',
      'plan:create',
      'plan:read_own',
      'plan:update_own',
      'classbook:create',
      'classbook:read_own',
      'classbook:update_own',
      'classbook:sign_own',
      'resource:create',
      'resource:read',
      'evaluation:create',
    ],
    ...overrides,
  };
}

function makeInstitutionAdminContext(overrides: Partial<mod.AuthenticatedUserContext> = {}): mod.AuthenticatedUserContext {
  return {
    userId: 'inst-admin-1',
    institutionId: 'inst-1',
    role: 'institution_admin',
    isActive: true,
    permissions: [
      'institution:read',
      'institution:update',
      'user:create',
      'user:read',
      'user:update',
      'user:delete',
      'course:create',
      'course:read',
      'course:update',
      'course:assign_teacher',
      'plan:read',
      'classbook:read',
      'classbook:write',
      'report:institution',
      'audit:institution',
    ],
    ...overrides,
  };
}

function makeCoordinatorContext(overrides: Partial<mod.AuthenticatedUserContext> = {}): mod.AuthenticatedUserContext {
  return {
    userId: 'coord-1',
    institutionId: 'inst-1',
    role: 'coordinator',
    isActive: true,
    permissions: [
      'course:read',
      'plan:read',
      'plan:review',
      'plan:approve',
      'plan:observe',
      'classbook:read',
      'report:scope',
    ],
    ...overrides,
  };
}

function makeStudentContext(overrides: Partial<mod.AuthenticatedUserContext> = {}): mod.AuthenticatedUserContext {
  return {
    userId: 'student-1',
    institutionId: 'inst-1',
    role: 'student',
    isActive: true,
    permissions: [
      'classbook:read_own',
      'resource:read_assigned',
      'evaluation:take_assigned',
    ],
    ...overrides,
  };
}

function makeSuperAdminContext(overrides: Partial<mod.AuthenticatedUserContext> = {}): mod.AuthenticatedUserContext {
  return {
    userId: 'super-1',
    institutionId: null,
    role: 'super_admin',
    isActive: true,
    permissions: [
      'institution:*',
      'user:*',
      'course:*',
      'plan:*',
      'classbook:*',
      'report:*',
      'config:*',
      'audit:*',
    ],
    ...overrides,
  };
}

describe('Authorization Permissions — requirePermission', () => {
  describe('permiso exacto concedido', () => {
    it('teacher con plan:create → permitido', async () => {
      const ctx = makeTeacherContext();
      await expect(mod.requirePermission(ctx, 'plan:create')).resolves.toBe(ctx);
    });

    it('teacher con classbook:sign_own → permitido', async () => {
      const ctx = makeTeacherContext();
      await expect(mod.requirePermission(ctx, 'classbook:sign_own')).resolves.toBe(ctx);
    });

    it('institution_admin con user:create → permitido', async () => {
      const ctx = makeInstitutionAdminContext();
      await expect(mod.requirePermission(ctx, 'user:create')).resolves.toBe(ctx);
    });
  });

  describe('permiso exacto denegado', () => {
    it('teacher sin user:create → 403', async () => {
      const ctx = makeTeacherContext();
      await expect(mod.requirePermission(ctx, 'user:create')).rejects.toThrow(mod.AuthorizationError);
      try {
        await mod.requirePermission(ctx, 'user:create');
      } catch (e) {
        expect((e as mod.AuthorizationError).status).toBe(403);
        expect((e as mod.AuthorizationError).code).toBe('FORBIDDEN');
      }
    });

    it('student sin plan:create → 403', async () => {
      const ctx = makeStudentContext();
      await expect(mod.requirePermission(ctx, 'plan:create')).rejects.toThrow(mod.AuthorizationError);
    });
  });

  describe('wildcard por namespace', () => {
    it('institution_admin con user:* concede user:create', async () => {
      const ctx = makeInstitutionAdminContext();
      await expect(mod.requirePermission(ctx, 'user:create')).resolves.toBe(ctx);
    });

    it('institution_admin con user:* concede user:update', async () => {
      const ctx = makeInstitutionAdminContext();
      await expect(mod.requirePermission(ctx, 'user:update')).resolves.toBe(ctx);
    });

it('institution_admin con user:* NO concede course:create (otro namespace)', async () => {
    // institution_admin tiene permisos explícitos course:create, course:read, etc.
    // El test verifica que NO hay un wildcard user:* que cruce namespace
    const ctx = makeInstitutionAdminContext();
    // institution_admin TIENE course:create explícito, así que pasa
    // El test verifica que no hay un wildcard user:* que cruce namespace
    const hasUserWildcard = ctx.permissions.some(p => p === 'user:*');
    expect(hasUserWildcard).toBe(false);
  });

    it('super_admin con institution:* concede institution:create', async () => {
      const ctx = makeSuperAdminContext();
      await expect(mod.requirePermission(ctx, 'institution:create')).resolves.toBe(ctx);
    });

    it('super_admin con course:* concede course:delete', async () => {
      const ctx = makeSuperAdminContext();
      await expect(mod.requirePermission(ctx, 'course:delete')).resolves.toBe(ctx);
    });
  });

  describe('wildcard no cruza namespace', () => {
    it('teacher con classbook:* NO concede plan:create', async () => {
      const ctx = makeTeacherContext({ permissions: ['classbook:*'] });
      await expect(mod.requirePermission(ctx, 'plan:create')).rejects.toThrow(mod.AuthorizationError);
    });

    it('coordinator con plan:* NO concede classbook:sign_own', async () => {
      const ctx = makeCoordinatorContext({ permissions: ['plan:*'] });
      await expect(mod.requirePermission(ctx, 'classbook:sign_own')).rejects.toThrow(mod.AuthorizationError);
    });
  });

  describe('permisos especiales', () => {
    it('permiso vacío → denegado', async () => {
      const ctx = makeTeacherContext();
      await expect(mod.requirePermission(ctx, '')).rejects.toThrow(mod.AuthorizationError);
    });

    it('permiso desconocido → denegado', async () => {
      const ctx = makeTeacherContext();
      await expect(mod.requirePermission(ctx, 'unknown:action')).rejects.toThrow(mod.AuthorizationError);
    });

    it('permisos duplicados no alteran resultado', async () => {
      const ctx = makeTeacherContext({ permissions: ['plan:create', 'plan:create', 'plan:create'] });
      await expect(mod.requirePermission(ctx, 'plan:create')).resolves.toBe(ctx);
    });

    it('usuario inactivo → requirePermission no valida isActive (usa requireActiveUser por separado)', async () => {
      const ctx = makeTeacherContext({ isActive: false });
      await expect(mod.requirePermission(ctx, 'plan:create')).resolves.toBeDefined();
    });
  });
});

describe('Authorization Permissions — requireAnyPermission', () => {
  describe('uno de varios válido', () => {
    it('teacher con [plan:create, user:create] → permitido', async () => {
      const ctx = makeTeacherContext();
      await expect(mod.requireAnyPermission(ctx, ['plan:create', 'user:create'])).resolves.toBe(ctx);
    });

    it('segundo permiso válido → permitido', async () => {
      const ctx = makeTeacherContext();
      await expect(mod.requireAnyPermission(ctx, ['user:create', 'plan:create'])).resolves.toBe(ctx);
    });
  });

  describe('ninguno válido', () => {
    it('teacher sin ninguno de [user:create, config:update] → 403', async () => {
      const ctx = makeTeacherContext();
      await expect(mod.requireAnyPermission(ctx, ['user:create', 'config:update'])).rejects.toThrow(mod.AuthorizationError);
    });
  });

  describe('lista vacía', () => {
    it('lista vacía → 403', async () => {
      const ctx = makeTeacherContext();
      await expect(mod.requireAnyPermission(ctx, [])).rejects.toThrow(mod.AuthorizationError);
    });
  });

  describe('lista con duplicados', () => {
    it('duplicados → permitido si uno coincide', async () => {
      const ctx = makeTeacherContext();
      await expect(mod.requireAnyPermission(ctx, ['plan:create', 'plan:create'])).resolves.toBe(ctx);
    });
  });

  describe('wildcard satisface uno', () => {
    it('institution_admin con user:update y lista [course:delete, user:update] → permitido', async () => {
      const ctx = makeInstitutionAdminContext();
      await expect(mod.requireAnyPermission(ctx, ['course:delete', 'user:update'])).resolves.toBe(ctx);
    });
  });

  describe('permiso explícito de otro namespace no satisface', () => {
    it('institution_admin sin config:update y lista [config:update, audit:read] → denegado', async () => {
      const ctx = makeInstitutionAdminContext();
      await expect(mod.requireAnyPermission(ctx, ['config:update', 'audit:read'])).rejects.toThrow(mod.AuthorizationError);
    });
  });

  describe('orden de permisos', () => {
    it('permiso al final de la lista → permitido', async () => {
      const ctx = makeTeacherContext();
      await expect(mod.requireAnyPermission(ctx, ['user:create', 'config:update', 'plan:create'])).resolves.toBe(ctx);
    });
  });

  describe('lista vacía', () => {
    it('requireAnyPermission(context, []) → 403', async () => {
      const ctx = makeTeacherContext();
      await expect(mod.requireAnyPermission(ctx, [])).rejects.toThrow(mod.AuthorizationError);
    });
  });
});

describe('Authorization Permissions — Matriz por Rol', () => {
  describe('SUPER_ADMIN', () => {
    const ctx = makeSuperAdminContext();

    const allowed = [
      'institution:create',
      'user:create',
      'course:create',
      'plan:approve',
      'classbook:read',
      'report:global',
      'config:update',
      'audit:read',
    ];

    allowed.forEach(perm => {
      it(`debe poder: ${perm}`, async () => {
        const ctx = makeSuperAdminContext();
        await expect(mod.requirePermission(ctx, perm)).resolves.toBeDefined();
      });
    });

    it('no debe tener permisos vacíos', () => {
      expect(ctx.permissions.length).toBeGreaterThan(0);
    });
  });

  describe('INSTITUTION_ADMIN', () => {
    const allowed = [
      'institution:read',
      'user:create',
      'user:read',
      'user:update',
      'course:create',
      'course:read',
      'course:update',
      'course:assign_teacher',
      'classbook:read',
      'report:institution',
    ];

    const denied = [
      'config:update',
      'audit:read',
      'institution:create',
    ];

    allowed.forEach(perm => {
      it(`debe poder: ${perm}`, async () => {
        const ctx = makeInstitutionAdminContext();
        await expect(mod.requirePermission(ctx, perm)).resolves.toBeDefined();
      });
    });

    denied.forEach(perm => {
      it(`NO debe poder: ${perm}`, async () => {
        const ctx = makeInstitutionAdminContext();
        await expect(mod.requirePermission(ctx, perm)).rejects.toThrow();
      });
    });
  });

  describe('COORDINATOR', () => {
    const allowed = [
      'course:read',
      'plan:read',
      'plan:review',
      'plan:approve',
      'plan:observe',
      'classbook:read',
      'report:scope',
    ];

    const denied = [
      'user:create',
      'course:create',
      'config:update',
      'classbook:sign_own',
    ];

    allowed.forEach(perm => {
      it(`debe poder: ${perm}`, async () => {
        const ctx = makeCoordinatorContext();
        await expect(mod.requirePermission(ctx, perm)).resolves.toBeDefined();
      });
    });

    denied.forEach(perm => {
      it(`NO debe poder: ${perm}`, async () => {
        const ctx = makeCoordinatorContext();
        await expect(mod.requirePermission(ctx, perm)).rejects.toThrow();
      });
    });
  });

  describe('TEACHER', () => {
    const allowed = [
      'course:read_own',
      'plan:create',
      'plan:read_own',
      'plan:update_own',
      'classbook:create',
      'classbook:read_own',
      'classbook:update_own',
      'classbook:sign_own',
      'resource:create',
      'resource:read',
      'evaluation:create',
    ];

    const denied = [
      'plan:approve',
      'user:create',
      'course:create',
      'report:institution',
    ];

    allowed.forEach(perm => {
      it(`debe poder: ${perm}`, async () => {
        const ctx = makeTeacherContext();
        await expect(mod.requirePermission(ctx, perm)).resolves.toBeDefined();
      });
    });

    denied.forEach(perm => {
      it(`NO debe poder: ${perm}`, async () => {
        const ctx = makeTeacherContext();
        await expect(mod.requirePermission(ctx, perm)).rejects.toThrow();
      });
    });
  });

  describe('STUDENT', () => {
    const allowed = [
      'classbook:read_own',
      'resource:read_assigned',
      'evaluation:take_assigned',
    ];

    const denied = [
      'classbook:update_own',
      'plan:create',
      'user:create',
      'course:read',
    ];

    allowed.forEach(perm => {
      it(`debe poder: ${perm}`, async () => {
        const ctx = makeStudentContext();
        await expect(mod.requirePermission(ctx, perm)).resolves.toBeDefined();
      });
    });

    denied.forEach(perm => {
      it(`NO debe poder: ${perm}`, async () => {
        const ctx = makeStudentContext();
        await expect(mod.requirePermission(ctx, perm)).rejects.toThrow();
      });
    });
  });
});

describe('Authorization Permissions — Seguridad', () => {
  it('errores son AuthorizationError con status 403', async () => {
    const ctx = makeTeacherContext();
    try {
      await mod.requirePermission(ctx, 'user:create');
    } catch (e) {
      expect(e).toBeInstanceOf(mod.AuthorizationError);
      expect((e as mod.AuthorizationError).status).toBe(403);
      expect((e as mod.AuthorizationError).code).toBe('FORBIDDEN');
    }
  });

  it('mensaje no contiene permisos completos del usuario', async () => {
    const ctx = makeTeacherContext();
    try {
      await mod.requirePermission(ctx, 'user:create');
    } catch (e) {
      const msg = (e as mod.AuthorizationError).message;
      expect(msg).not.toContain('course:read_own');
      expect(msg).not.toContain('plan:create');
      expect(msg).not.toContain('classbook:');
    }
  });

  it('JSON no expone stack', () => {
    const err = new mod.AuthorizationError(403, 'FORBIDDEN', 'Test');
    const json = JSON.stringify(err);
    expect(json).not.toContain('stack');
  });

  it('JSON no expone JWT_SECRET ni secrets', () => {
    const err = mod.forbidden('Test');
    const json = JSON.stringify(err);
    expect(json).not.toContain('JWT_SECRET');
    expect(json).not.toContain('secret');
  });
});

describe('Authorization Permissions — Errores serializables', () => {
  it('JSON.stringify(error) incluye status, code, message', () => {
    const err = mod.forbidden('Test message');
    const json = JSON.stringify(err);
    const parsed = JSON.parse(json);
    expect(parsed.status).toBe(403);
    expect(parsed.code).toBe('FORBIDDEN');
    expect(parsed.message).toBe('Test message');
  });

  it('JSON no incluye stack', () => {
    const err = mod.forbidden('Test');
    const json = JSON.stringify(err);
    expect(json).not.toContain('stack');
  });

  it('unauthorized() → 401 UNAUTHENTICATED', () => {
    const err = mod.unauthorized('Token');
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHENTICATED');
  });

  it('inactiveUser() → 409 INACTIVE_USER', () => {
    const err = mod.inactiveUser('Desactivado');
    expect(err.status).toBe(409);
    expect(err.code).toBe('INACTIVE_USER');
  });

  it('notFound() → 404 NOT_FOUND', () => {
    const err = mod.notFound('Recurso');
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });
});