import { describe, it, expect } from 'vitest';
import * as authModule from '../functions/core/authorization';

const mod = authModule;

interface MockUser {
  id: string;
  email?: string;
  nombre?: string;
  rol?: string;
  active?: number;
}

interface MockCourse {
  id: string;
  teacher_id: string;
  subject_id?: string;
  is_active: number;
  institution_id: string;
}

interface MockAssignment {
  teacher_id: string;
  course_id: string;
  subject_id: string;
  is_active: number;
}

interface MockScope {
  course_ids: string[];
  subject_ids: string[];
  level_ids: string[];
  academic_year_ids: string[];
}

interface MockInstitutionMember {
  institution_id: string;
  role: string;
  status: string;
}

interface MockCoordinatorScope {
  course_ids: string;
  subject_ids: string;
  level_ids: string;
  academic_year_ids: string;
}

interface MockDBOptions {
  user?: MockUser | null;
  course?: MockCourse | null;
  assignment?: MockAssignment | null;
  scope?: MockScope | MockCoordinatorScope | null;
  membership?: MockInstitutionMember | null;
}

function makeMockDB(options: MockDBOptions = {}) {
  return {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => ({
        first: async () => {
          const sqlLower = sql.toLowerCase();

          // SELECT ... FROM teacher_classes WHERE id = ? AND subject_id = ? AND teacher_id = ? AND is_active = 1 (assignment)
          if (
            sqlLower.includes('from teacher_classes') &&
            sqlLower.includes('subject_id = ?') &&
            sqlLower.includes('teacher_id = ?') &&
            sqlLower.includes('is_active = 1')
          ) {
            const [courseId, subjectId, teacherId] = args as [string, string, string];
            if (
              options.assignment &&
              options.assignment.course_id === courseId &&
              options.assignment.subject_id === subjectId &&
              options.assignment.teacher_id === teacherId &&
              options.assignment.is_active === 1
            ) {
              return options.assignment;
            }
            return null;
          }

          // SELECT ... FROM teacher_classes WHERE id = ? AND institution_id = ? AND is_active = 1 (institution_admin)
          if (
            sqlLower.includes('from teacher_classes') &&
            sqlLower.includes('id = ?') &&
            sqlLower.includes('institution_id = ?') &&
            sqlLower.includes('is_active = 1')
          ) {
            const [courseId, institutionId] = args as [string, string];
            if (
              options.course &&
              options.course.id === courseId &&
              options.course.institution_id === institutionId &&
              options.course.is_active === 1
            ) {
              return options.course;
            }
            return null;
          }

          // SELECT ... FROM teacher_classes WHERE id = ? AND institution_id = ? (coordinator/teacher course access)
          if (
            sqlLower.includes('from teacher_classes') &&
            sqlLower.includes('id = ?') &&
            sqlLower.includes('institution_id = ?')
          ) {
            const [courseId, institutionId] = args as [string, string];
            if (
              options.course &&
              options.course.id === courseId &&
              options.course.institution_id === institutionId &&
              options.course.is_active === 1
            ) {
              return options.course;
            }
            return null;
          }

          // SELECT ... FROM teacher_classes WHERE id = ? AND is_active = 1 (teacher)
          if (
            sqlLower.includes('from teacher_classes') &&
            sqlLower.includes('where id = ?') &&
            sqlLower.includes('is_active = 1')
          ) {
            const courseId = args[0] as string | undefined;
            if (options.course && options.course.id === courseId && options.course.is_active === 1) {
              return options.course;
            }
            return null;
          }

          // SELECT ... FROM teacher_classes WHERE id = ? (no is_active filter)
          if (
            sqlLower.includes('from teacher_classes') &&
            sqlLower.includes('where id = ?') &&
            !sqlLower.includes('is_active')
          ) {
            const courseId = args[0] as string | undefined;
            if (options.course && options.course.id === courseId) {
              return options.course;
            }
            return null;
          }

          // SELECT ... FROM teacher_classes WHERE institution_id = ? (institution_admin course access - old query)
          if (
            sqlLower.includes('from teacher_classes') &&
            sqlLower.includes('institution_id = ?') &&
            !sqlLower.includes('id = ?')
          ) {
            const [, institutionId] = args as [unknown, string];
            if (options.course && options.course.institution_id === institutionId && options.course.is_active === 1) {
              return options.course;
            }
            return null;
          }

          // SELECT ... FROM teacher_classes tc JOIN institution_members im ON im.user_id = tc.teacher_id WHERE tc.id = ? AND im.institution_id = ? (old coordinator query)
          if (
            sqlLower.includes('from teacher_classes') &&
            sqlLower.includes('join institution_members') &&
            sqlLower.includes('im.institution_id = ?')
          ) {
            const [courseId, institutionId] = args as [string, string];
            if (
              options.course &&
              options.course.id === courseId &&
              options.course.institution_id === institutionId
            ) {
              return options.course;
            }
            return null;
          }

          // SELECT ... FROM institution_members WHERE user_id = ?
          if (
            sqlLower.includes('from institution_members') &&
            sqlLower.includes('user_id = ?')
          ) {
            return options.membership ?? null;
          }

          // SELECT ... FROM coordinator_scopes WHERE user_id = ? AND institution_id = ?
          if (
            sqlLower.includes('from coordinator_scopes') &&
            sqlLower.includes('user_id = ?') &&
            sqlLower.includes('institution_id = ?')
          ) {
            return options.scope ?? null;
          }

          // SELECT ... FROM usuarios WHERE id = ?
          if (
            sqlLower.includes('from usuarios') &&
            sqlLower.includes('where id = ?')
          ) {
            return options.user ?? null;
          }

          return null;
        },
        all: async () => ({ results: [] }),
        run: async () => ({ success: true }),
      }),
    }),
  };
}

function makeTeacherContext(overrides: Partial<any> = {}) {
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

function makeInstitutionAdminContext(overrides: Partial<any> = {}) {
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

function makeCoordinatorContext(overrides: Partial<any> = {}) {
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

function makeStudentContext(overrides: Partial<any> = {}) {
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

function makeSuperAdminContext(overrides: Partial<any> = {}) {
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

function makeMockEnv(db: any) {
  return {
    DB: db,
    JWT_SECRET: 'test-secret',
  };
}

describe('Authorization Resources — requireInstitutionMatch', () => {
  const mod = authModule;

  it('institution_admin con misma institución → permitido', async () => {
    const ctx = { ...makeInstitutionAdminContext(), institutionId: 'inst-1' };
    await expect(mod.requireInstitutionMatch(ctx, 'inst-1')).resolves.toBe(ctx);
  });

  it('teacher con misma institución → permitido', async () => {
    const ctx = { ...makeTeacherContext(), institutionId: 'inst-1' };
    await expect(mod.requireInstitutionMatch(ctx, 'inst-1')).resolves.toBe(ctx);
  });

  it('coordinator con misma institución → permitido', async () => {
    const ctx = { ...makeCoordinatorContext(), institutionId: 'inst-1' };
    await expect(mod.requireInstitutionMatch(ctx, 'inst-1')).resolves.toBe(ctx);
  });

  it('institution_admin con institución distinta → 403', async () => {
    const ctx = { ...makeInstitutionAdminContext(), institutionId: 'inst-1' };
    await expect(mod.requireInstitutionMatch(ctx, 'inst-2')).rejects.toThrow(mod.AuthorizationError);
    try {
      await mod.requireInstitutionMatch(ctx, 'inst-2');
    } catch (e) {
      expect((e as any).status).toBe(403);
      expect((e as any).code).toBe('FORBIDDEN');
    }
  });

  it('teacher con institución distinta → 403', async () => {
    const ctx = { ...makeTeacherContext(), institutionId: 'inst-1' };
    await expect(mod.requireInstitutionMatch(ctx, 'inst-2')).rejects.toThrow();
  });

  it('institutionId vacío → denegado', async () => {
    const ctx = { ...makeTeacherContext(), institutionId: '' };
    await expect(mod.requireInstitutionMatch(ctx, 'inst-1')).rejects.toThrow();
  });

  it('context.institutionId null → denegado', async () => {
    const ctx = { ...makeTeacherContext(), institutionId: null };
    await expect(mod.requireInstitutionMatch(ctx, 'inst-1')).rejects.toThrow();
  });

  it('super_admin → política explícita (puede cruzar instituciones)', async () => {
    const ctx = { ...makeSuperAdminContext(), institutionId: 'inst-1' };
    await expect(mod.requireInstitutionMatch(ctx, 'inst-2')).resolves.toBe(ctx);
  });

  it('IDs manipulados desde request no reemplazan institutionId del contexto', async () => {
    const ctx = { ...makeTeacherContext(), institutionId: 'inst-1' };
    await expect(mod.requireInstitutionMatch(ctx, 'inst-2')).rejects.toThrow();
  });
});

function makeTeacherCourseDb(teacherId: string, courseId: string, isActive = true) {
  return makeMockDB({
    course: { id: courseId, teacher_id: teacherId, is_active: isActive ? 1 : 0, institution_id: 'inst-1' },
    user: { id: 'teacher-1', email: 't@test.cl', nombre: 'Teacher', rol: 'docente', active: 1 },
    membership: { institution_id: 'inst-1', role: 'teacher', status: 'active' },
  });
}

describe('Authorization Resources — requireCourseAccess', () => {
  const mod = authModule;

  describe('TEACHER', () => {
    function makeTeacherCourseDb(teacherId: string, courseId: string, isActive = true) {
      return makeMockDB({
        course: { id: courseId, teacher_id: teacherId, is_active: isActive ? 1 : 0, institution_id: 'inst-1' },
        user: { id: 'teacher-1', email: 't@test.cl', nombre: 'Teacher', rol: 'docente', active: 1 },
        membership: { institution_id: 'inst-1', role: 'teacher', status: 'active' },
      });
    }

    it('profesor asignado al curso propio → permitido', async () => {
      const db = makeTeacherCourseDb('teacher-1', 'course-1');
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-1', env)).resolves.toBe(ctx);
    });

    it('profesor no asignado al curso → 403', async () => {
      const db = makeMockDB({ course: { id: 'course-2', teacher_id: 'teacher-other', is_active: 1, institution_id: 'inst-1' } });
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-2', env)).rejects.toThrow();
      try {
        await mod.requireCourseAccess(ctx, 'course-2', env);
      } catch (e) {
        expect((e as any).status).toBe(403);
      }
    });

    it('curso de otra institución → 403', async () => {
      const db = makeMockDB({ course: { id: 'course-3', teacher_id: 'teacher-1', is_active: 1, institution_id: 'inst-2' } });
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-3', env)).rejects.toThrow();
      try {
        await mod.requireCourseAccess(ctx, 'course-3', env);
      } catch (e) {
        expect((e as any).status).toBe(403);
      }
    });

    it('curso inexistente → 404 NOT_FOUND', async () => {
      const db = makeMockDB({ course: null });
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-nonexistent', env)).rejects.toThrow();
      try {
        await mod.requireCourseAccess(ctx, 'course-nonexistent', env);
      } catch (e) {
        expect((e as any).status).toBe(404);
        expect((e as any).code).toBe('NOT_FOUND');
      }
    });

    it('asignación inactiva → 404', async () => {
      const db = makeTeacherCourseDb('teacher-1', 'course-inactive', false);
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-inactive', env)).rejects.toThrow();
      try {
        await mod.requireCourseAccess(ctx, 'course-inactive', env);
      } catch (e) {
        expect((e as any).status).toBe(404);
      }
    });

    it('profesor asignado a otro curso → 403', async () => {
      // Teacher assigned to course-1, tries to access course-other (not assigned)
      const db = makeTeacherCourseDb('teacher-1', 'course-1');
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-other', env)).rejects.toThrow();
    });
  });

  describe('COORDINATOR', () => {
    function makeCoordinatorCourseDb(courseId: string, scopeCourses: string[]) {
      return makeMockDB({
        course: { id: courseId, teacher_id: 'teacher-1', is_active: 1, institution_id: 'inst-1' },
        scope: scopeCourses.length > 0 ? { course_ids: JSON.stringify(scopeCourses), subject_ids: '[]', level_ids: '[]', academic_year_ids: '[]' } : null,
        user: { id: 'coord-1', email: 'c@test.cl', nombre: 'Coord', rol: 'docente', active: 1 },
        membership: { institution_id: 'inst-1', role: 'coordinator', status: 'active' },
      });
    }

    it('courseId incluido en scope → permitido', async () => {
      const db = makeCoordinatorCourseDb('course-1', ['course-1', 'course-2']);
      const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1', 'course-2'] } });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-1', env)).resolves.toBeDefined();
    });

    it('courseId fuera de scope → 403', async () => {
      const db = makeCoordinatorCourseDb('course-3', ['course-1', 'course-2']);
      const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1', 'course-2'] } });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-3', env)).rejects.toThrow();
    });

    it('scope vacío → 403', async () => {
      const db = makeCoordinatorCourseDb('course-1', []);
      const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: [] } });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-1', env)).rejects.toThrow();
    });

    it('sin fila coordinator_scopes → 403', async () => {
      const db = makeMockDB({ course: { id: 'course-1', teacher_id: 't1', is_active: 1, institution_id: 'inst-1' }, scope: null });
      const ctx = makeCoordinatorContext({ institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-1', env)).rejects.toThrow();
    });

    it('JSON inválido en scope → 403, nunca 500', async () => {
      const db = makeMockDB({
        course: { id: 'course-1', teacher_id: 't1', is_active: 1, institution_id: 'inst-1' },
        scope: { course_ids: 'not-valid-json', subject_ids: '[]', level_ids: '[]', academic_year_ids: '[]' },
      });
      const ctx = makeCoordinatorContext({ institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-1', env)).rejects.toThrow();
      try {
        await mod.requireCourseAccess(ctx, 'course-1', env);
      } catch (e) {
        expect((e as any).status).toBe(403);
      }
    });
  });

  describe('INSTITUTION_ADMIN', () => {
    it('curso de su institución → permitido', async () => {
      const db = makeMockDB({
        course: { id: 'course-1', teacher_id: 't1', is_active: 1, institution_id: 'inst-1' },
        user: { id: 'admin-1', email: 'a@test.cl', nombre: 'Admin', rol: 'docente', active: 1 },
        membership: { institution_id: 'inst-1', role: 'institution_admin', status: 'active' },
      });
      const ctx = makeInstitutionAdminContext({ institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-1', env)).resolves.toBeDefined();
    });

    it('curso de otra institución → 403', async () => {
      const db = makeMockDB({ course: { id: 'course-1', teacher_id: 't1', is_active: 1, institution_id: 'inst-2' } });
      const ctx = makeInstitutionAdminContext({ institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-1', env)).rejects.toThrow();
    });
  });

  describe('SUPER_ADMIN', () => {
    it('acceso global según política explícita', async () => {
      const db = makeMockDB({ course: { id: 'course-1', teacher_id: 't1', is_active: 1, institution_id: 'inst-1' } });
      const ctx = makeSuperAdminContext({ institutionId: null });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-1', env)).resolves.toBeDefined();
    });
  });

  describe('STUDENT', () => {
    it('estudiante sin relación con el curso → denegado', async () => {
      const db = makeMockDB({ course: { id: 'course-1', teacher_id: 't1', is_active: 1, institution_id: 'inst-1' } });
      const ctx = makeStudentContext({ institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireCourseAccess(ctx, 'course-1', env)).rejects.toThrow();
    });
  });
});

function makeAssignmentDb(teacherId: string, courseId: string, subjectId: string, isActive = true) {
  return makeMockDB({
    assignment: { teacher_id: teacherId, course_id: courseId, subject_id: subjectId, is_active: isActive ? 1 : 0 },
    course: { id: 'course-1', teacher_id: 'teacher-1', subject_id: 'subject-1', is_active: 1, institution_id: 'inst-1' },
    user: { id: 'teacher-1', email: 't@test.cl', nombre: 'Teacher', rol: 'docente', active: 1 },
    membership: { institution_id: 'inst-1', role: 'teacher', status: 'active' },
  });
}

describe('Authorization Resources — requireTeacherAssignment', () => {
  const mod = authModule;

  describe('TEACHER', () => {
    it('teacher correcto + courseId correcto + subjectId correcto → permitido', async () => {
      const db = makeAssignmentDb('teacher-1', 'course-1', 'subject-1');
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireTeacherAssignment(ctx, 'course-1', 'subject-1', env)).resolves.toBeDefined();
    });

    it('teacher correcto + curso correcto + subjectId distinto → 403', async () => {
      const db = makeAssignmentDb('teacher-1', 'course-1', 'subject-1');
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireTeacherAssignment(ctx, 'course-1', 'subject-other', env)).rejects.toThrow();
    });

    it('teacher correcto + curso distinto → 403', async () => {
      const db = makeAssignmentDb('teacher-1', 'course-1', 'subject-1');
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireTeacherAssignment(ctx, 'course-other', 'subject-1', env)).rejects.toThrow();
    });

    it('teacher de otra institución → 403', async () => {
      const db = makeAssignmentDb('teacher-1', 'course-1', 'subject-1');
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-other' });
      const env = makeMockEnv(db);

      await expect(mod.requireTeacherAssignment(ctx, 'course-1', 'subject-1', env)).rejects.toThrow();
    });

    it('asignación inactiva → 403', async () => {
      const db = makeAssignmentDb('teacher-1', 'course-1', 'subject-1', false);
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireTeacherAssignment(ctx, 'course-1', 'subject-1', env)).rejects.toThrow();
    });

    it('asignación inexistente → 403', async () => {
      const db = makeMockDB({ assignment: null });
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireTeacherAssignment(ctx, 'course-1', 'subject-1', env)).rejects.toThrow();
    });

    it('curso inexistente → 404', async () => {
      const db = makeMockDB({ course: null });
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireTeacherAssignment(ctx, 'course-nonexistent', 'subject-1', env)).rejects.toThrow();
      try {
        await mod.requireTeacherAssignment(ctx, 'course-nonexistent', 'subject-1', env);
      } catch (e) {
        expect((e as any).status).toBe(404);
      }
    });

    it('subject inexistente → 404 o error controlado', async () => {
      const db = makeMockDB({ course: { id: 'course-1', subject_id: 'subject-other' } });
      const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireTeacherAssignment(ctx, 'course-1', 'subject-nonexistent', env)).rejects.toThrow();
    });
  });

  describe('INSTITUTION_ADMIN', () => {
    it('aplica política explícita del código', async () => {
      const db = makeAssignmentDb('teacher-1', 'course-1', 'subject-1');
      const ctx = makeInstitutionAdminContext({ institutionId: 'inst-1' });
      const env = makeMockEnv(db);

      await expect(mod.requireTeacherAssignment(ctx, 'course-1', 'subject-1', env)).resolves.toBeDefined();
    });
  });

  describe('COORDINATOR', () => {
    it('no usa esta función como bypass de scope', async () => {
      const db = makeAssignmentDb('teacher-1', 'course-1', 'subject-1');
      const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1'] } });
      const env = makeMockEnv(makeMockDB({}));

      await expect(mod.requireTeacherAssignment(ctx, 'course-1', 'subject-1', env)).rejects.toThrow();
    });
  });
});

function makeScopeDb(scope: any = {}) {
  return makeMockDB({
    scope: scope.course_ids ? {
      course_ids: JSON.stringify(scope.course_ids || []),
      subject_ids: JSON.stringify(scope.subject_ids || []),
      level_ids: JSON.stringify(scope.level_ids || []),
      academic_year_ids: JSON.stringify(scope.academic_year_ids || []),
    } : null,
    course: { id: 'course-1', teacher_id: 't1', is_active: 1, institution_id: 'inst-1', subject_id: 'subject-1' },
    user: { id: 'coord-1', email: 'c@test.cl', nombre: 'Coord', rol: 'docente', active: 1 },
    membership: { institution_id: 'inst-1', role: 'coordinator', status: 'active' },
  });
}

describe('Authorization Resources — requireCoordinatorScope', () => {
  const mod = authModule;

  it('courseId permitido → permitido', async () => {
    const db = makeScopeDb({ course_ids: ['course-1', 'course-2'] });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1', 'course-2'] } });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', null, env)).resolves.toBeDefined();
  });

  it('subjectId permitido → permitido', async () => {
    const db = makeScopeDb({ course_ids: ['course-1'], subject_ids: ['subject-1', 'subject-2'] });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1'], subjectIds: ['subject-1'] } });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', 'subject-1', env)).resolves.toBeDefined();
  });

  it('courseId + subjectId permitidos → permitido', async () => {
    const db = makeScopeDb({ course_ids: ['course-1'], subject_ids: ['subject-1'] });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1'], subjectIds: ['subject-1'] } });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', 'subject-1', env)).resolves.toBeDefined();
  });

  it('courseId fuera de scope → 403', async () => {
    const db = makeScopeDb({ course_ids: ['course-1'] });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1'] } });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-2', null, env)).rejects.toThrow();
  });

  it('subjectId fuera de scope → 403', async () => {
    const db = makeScopeDb({ course_ids: ['course-1'], subject_ids: ['subject-1'] });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1'], subjectIds: ['subject-1'] } });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', 'subject-other', env)).rejects.toThrow();
  });

  it('academicYearId permitido → permitido si la función lo soporta', async () => {
    const db = makeScopeDb({ course_ids: ['course-1'], academic_year_ids: ['year-1'] });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1'], academicYearIds: ['year-1'] } });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', null, env)).resolves.toBeDefined();
  });

  it('levelId permitido → permitido si la función lo soporta', async () => {
    const db = makeScopeDb({ course_ids: ['course-1'], level_ids: ['level-1'] });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1'], levelIds: ['level-1'] } });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', null, env)).resolves.toBeDefined();
  });

  it('scope vacío → 403', async () => {
    const db = makeScopeDb({ course_ids: [] });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: [] } });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', null, env)).rejects.toThrow();
  });

  it('ausencia de fila coordinator_scopes → 403', async () => {
    const db = makeMockDB({ scope: null });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', null, env)).rejects.toThrow();
  });

  it('JSON inválido en course_ids → 403, nunca 500', async () => {
    const db = makeMockDB({ 
      course: { id: 'course-1', teacher_id: 't1', is_active: 1, institution_id: 'inst-1', subject_id: 'subject-1' },
      scope: { course_ids: 'invalid-json', subject_ids: '[]', level_ids: '[]', academic_year_ids: '[]' } 
    });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', null, env)).rejects.toThrow();
    try {
      await mod.requireCoordinatorScope(ctx, 'course-1', null, env);
    } catch (e) {
      expect((e as any).status).toBe(403);
    }
  });

  it('JSON inválido en subject_ids → 403', async () => {
    const db = makeMockDB({ 
      course: { id: 'course-1', teacher_id: 't1', is_active: 1, institution_id: 'inst-1', subject_id: 'subject-1' },
      scope: { course_ids: '["course-1"]', subject_ids: 'invalid-json', level_ids: '[]', academic_year_ids: '[]' } 
    });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', 'subject-1', env)).rejects.toThrow();
    try {
      await mod.requireCoordinatorScope(ctx, 'course-1', 'subject-1', env);
    } catch (e) {
      expect((e as any).status).toBe(403);
    }
  });

  it('institución distinta → 403', async () => {
    const db = makeScopeDb({ course_ids: ['course-1'] });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1'] } });
    const env = makeMockEnv(makeMockDB({ course: { id: 'course-1', institution_id: 'inst-2' } }));

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', null, env)).rejects.toThrow();
  });

  it('usuario no coordinator → 403', async () => {
    const db = makeScopeDb({ course_ids: ['course-1'] });
    const ctx = makeTeacherContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', null, env)).rejects.toThrow();
  });

  it('super_admin → política explícita del código', async () => {
    const db = makeScopeDb({ course_ids: ['course-1'] });
    const ctx = makeSuperAdminContext({ institutionId: null });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', null, env)).resolves.toBeDefined();
  });

  it('institution_admin → política explícita del código', async () => {
    const db = makeScopeDb({ course_ids: ['course-1'] });
    const ctx = makeInstitutionAdminContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', null, env)).resolves.toBeDefined();
  });
});

describe('Authorization Resources — Aislamiento Multiinstitución', () => {
  const mod = authModule;

  it('teacher nunca accede a curso de otra institución', async () => {
    const db = makeMockDB({ course: { id: 'course-1', teacher_id: 'teacher-1', is_active: 1, institution_id: 'inst-2' } });
    const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireCourseAccess(ctx, 'course-1', env)).rejects.toThrow();
  });

  it('coordinator nunca accede fuera de scope', async () => {
    const db = makeMockDB({ scope: { course_ids: '["course-1"]', subject_ids: '[]', level_ids: '[]', academic_year_ids: '[]' } });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1'] } });
    const env = makeMockEnv(makeMockDB({ course: { id: 'course-2', institution_id: 'inst-1' } }));

    await expect(mod.requireCourseAccess(ctx, 'course-2', env)).rejects.toThrow();
  });

  it('institution_admin nunca accede a otra institución', async () => {
    const db = makeMockDB({ course: { id: 'course-1', institution_id: 'inst-2' } });
    const ctx = makeInstitutionAdminContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(makeMockDB({ course: { id: 'course-1', institution_id: 'inst-2' } }));

    await expect(mod.requireCourseAccess(ctx, 'course-1', env)).rejects.toThrow();
  });

  it('IDs enviados por frontend no conceden acceso', async () => {
    const db = makeMockDB({ course: { id: 'course-1', teacher_id: 'teacher-other', institution_id: 'inst-1' } });
    const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
    const env = makeMockEnv(makeMockDB({ course: { id: 'course-1', teacher_id: 'teacher-other', institution_id: 'inst-1' } }));

    await expect(mod.requireCourseAccess(ctx, 'course-1', env)).rejects.toThrow();
  });

  it('IDs predecibles no saltan filtros', async () => {
    const db = makeMockDB({ course: { id: 'course-1', teacher_id: 'teacher-1', institution_id: 'inst-1', is_active: 1 } });
    const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireCourseAccess(ctx, 'course-1', env)).resolves.toBeDefined();
  });

  it('recurso inexistente no se confunde con acceso permitido', async () => {
    const db = makeMockDB({ course: null });
    const ctx = makeTeacherContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireCourseAccess(ctx, 'course-nonexistent', env)).rejects.toThrow();
    try {
      await mod.requireCourseAccess(ctx, 'course-nonexistent', env);
    } catch (e) {
      expect((e as any).status).toBe(404);
    }
  });

  it('ninguna función confía solo en courseId o subjectId', async () => {
    const db = makeMockDB({ course: { id: 'course-1', institution_id: 'inst-2' } });
    const ctx = makeTeacherContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireCourseAccess(ctx, 'course-1', env)).rejects.toThrow();
  });
});

describe('Authorization Resources — Recursos Inexistentes', () => {
  const mod = authModule;

  it('curso inexistente → 404 NOT_FOUND', async () => {
    const db = makeMockDB({ course: null });
    const ctx = makeTeacherContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireCourseAccess(ctx, 'course-nonexistent', env)).rejects.toThrow();
    try {
      await mod.requireCourseAccess(ctx, 'course-nonexistent', env);
    } catch (e) {
      expect((e as any).status).toBe(404);
      expect((e as any).code).toBe('NOT_FOUND');
    }
  });

  it('asignación inexistente → error controlado', async () => {
    const db = makeMockDB({ assignment: null });
    const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireTeacherAssignment(ctx, 'course-1', 'subject-1', env)).rejects.toThrow();
  });

  it('scope inexistente → 403, nunca 500', async () => {
    const db = makeMockDB({ scope: null });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', null, env)).rejects.toThrow();
  });

  it('JSON inválido en scope → 403, nunca 500', async () => {
    const db = makeMockDB({ 
      course: { id: 'course-1', teacher_id: 't1', is_active: 1, institution_id: 'inst-1', subject_id: 'subject-1' },
      scope: { course_ids: 'invalid-json', subject_ids: '[]' } 
    });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireCoordinatorScope(ctx, 'course-1', null, env)).rejects.toThrow();
    try {
      await mod.requireCoordinatorScope(ctx, 'course-1', null, env);
    } catch (e) {
      expect((e as any).status).toBe(403);
    }
  });

  it('teacher assignment con curso inexistente → 404', async () => {
    const db = makeMockDB({ course: null });
    const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
    const env = makeMockEnv(db);

    await expect(mod.requireTeacherAssignment(ctx, 'course-nonexistent', 'subject-1', env)).rejects.toThrow();
    try {
      await mod.requireTeacherAssignment(ctx, 'course-nonexistent', 'subject-1', env);
    } catch (e) {
      expect((e as any).status).toBe(404);
    }
  });
});

describe('Authorization Resources — Seguridad', () => {
  const mod = authModule;

  it('403 para acceso fuera de scope', async () => {
    const db = makeMockDB({ scope: { course_ids: '["course-1"]' } });
    const ctx = makeCoordinatorContext({ institutionId: 'inst-1', scope: { courseIds: ['course-1'] } });
    const env = makeMockEnv(makeMockDB({ course: { id: 'course-2', institution_id: 'inst-1', is_active: 1 } }));

    await expect(mod.requireCourseAccess(ctx, 'course-2', env)).rejects.toThrow();
    try {
      await mod.requireCourseAccess(ctx, 'course-2', env);
    } catch (e) {
      expect((e as any).status).toBe(403);
    }
  });

  it('404 para recurso inexistente cuando corresponda', async () => {
    const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
    const env = makeMockEnv(makeMockDB({ course: null }));

    await expect(mod.requireCourseAccess(ctx, 'course-nonexistent', env)).rejects.toThrow();
    try {
      await mod.requireCourseAccess(ctx, 'course-nonexistent', env);
    } catch (e) {
      expect((e as any).status).toBe(404);
    }
  });

  it('ningún error incluye SQL', async () => {
    const ctx = makeTeacherContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(makeMockDB({ course: { id: 'course-1', teacher_id: 'other' } }));

    try {
      await mod.requireCourseAccess(ctx, 'course-1', env);
    } catch (e) {
      const msg = (e as any).message;
      expect(msg).not.toContain('SELECT');
      expect(msg).not.toContain('FROM');
      expect(msg).not.toContain('WHERE');
    }
  });

  it('ningún error incluye IDs sensibles innecesarios', async () => {
    const ctx = makeTeacherContext({ userId: 'teacher-1', institutionId: 'inst-1' });
    const env = makeMockEnv(makeMockDB({ course: { id: 'course-1', teacher_id: 'other' } }));

    try {
      await mod.requireCourseAccess(ctx, 'course-1', env);
    } catch (e) {
      const msg = (e as any).message;
      expect(msg).not.toContain('teacher-1');
      expect(msg).not.toContain('inst-1');
    }
  });

  it('ningún error incluye token o secret', async () => {
    const ctx = makeTeacherContext({ institutionId: 'inst-1' });
    const env = makeMockEnv(makeMockDB({ course: { id: 'course-1', teacher_id: 'other' } }));

    try {
      await mod.requireCourseAccess(ctx, 'course-1', env);
    } catch (e) {
      const json = JSON.stringify(e);
      expect(json).not.toContain('JWT_SECRET');
      expect(json).not.toContain('secret');
      expect(json).not.toContain('token');
    }
  });

  it('no se exponen stacks en JSON', () => {
    const err = new mod.AuthorizationError(403, 'FORBIDDEN', 'Test');
    const json = JSON.stringify(err);
    expect(json).not.toContain('stack');
  });
});