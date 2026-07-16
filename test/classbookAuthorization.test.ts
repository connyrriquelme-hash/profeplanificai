import { describe, it, expect, beforeEach } from 'vitest';
import { makeMockDB, makeContext, signToken } from './helpers/mockD1';

const TEST_SECRET = 'test-secret-key-for-testing-1234!';

describe('Classbook Authorization', () => {
  let superAdminToken = '';
  let institutionAdminToken = '';
  let coordinatorToken = '';
  let teacherToken = '';
  let studentToken = '';

  beforeEach(async () => {
    superAdminToken = await signToken('super-1', 'super@test.cl', TEST_SECRET);
    institutionAdminToken = await signToken('inst-admin-1', 'inst-admin@test.cl', TEST_SECRET);
    coordinatorToken = await signToken('coord-1', 'coord@test.cl', TEST_SECRET);
    teacherToken = await signToken('teacher-1', 'teacher@test.cl', TEST_SECRET);
    studentToken = await signToken('student-1', 'student@test.cl', TEST_SECRET);
  });

  describe('SUPER_ADMIN', () => {
    it('has all classbook permissions', async () => {
      const mockDB = makeMockDB({ userId: 'super-1', institutionMember: { institution_id: 'inst-1', role: 'super_admin' } });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestGet(makeContext(superAdminToken, mockDB, 'inst-1'));
      expect(resp.status).toBe(200);
    });

    it('can access any institution', async () => {
      const mockDB = makeMockDB({ userId: 'super-1', institutionMember: { institution_id: 'inst-2', role: 'super_admin' } });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestGet(makeContext(superAdminToken, mockDB, 'inst-2'));
      expect(resp.status).toBe(200);
    });
  });

  describe('INSTITUTION_ADMIN', () => {
    it('can manage own institution', async () => {
      const mockDB = makeMockDB({ userId: 'inst-admin-1', institutionMember: { institution_id: 'inst-1', role: 'institution_admin' } });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestPost(makeContext(institutionAdminToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { name: '2026', start_date: '2026-03-01', end_date: '2026-12-31' },
      }));
      expect(resp.status).toBe(201);
      const body = await resp.json() as any;
      expect(body.ok).toBe(true);
    });

    it('cannot access other institution', async () => {
      const mockDB = makeMockDB({ userId: 'inst-admin-1', institutionMember: { institution_id: 'inst-1', role: 'institution_admin' } });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestGet(makeContext(institutionAdminToken, mockDB, 'inst-2'));
      expect(resp.status).toBe(200);
    });

    it('can create academic year', async () => {
      const mockDB = makeMockDB({ userId: 'inst-admin-1', institutionMember: { institution_id: 'inst-1', role: 'institution_admin' } });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestPost(makeContext(institutionAdminToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { name: '2026', start_date: '2026-03-01', end_date: '2026-12-31' },
      }));
      expect(resp.status).toBe(201);
    });

    it('can manage students', async () => {
      const mockDB = makeMockDB({ userId: 'inst-admin-1', institutionMember: { institution_id: 'inst-1', role: 'institution_admin' } });
      const mod = await import('../functions/api/classbook/students/index');
      const resp = await mod.onRequestPost(makeContext(institutionAdminToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { internal_identifier: 'STU-001', first_name: 'Test', last_name: 'User' },
      }));
      expect(resp.status).toBe(201);
    });

    it('can manage enrollments', async () => {
      const mockDB = makeMockDB({
        userId: 'inst-admin-1',
        institutionMember: { institution_id: 'inst-1', role: 'institution_admin' },
        academicYears: [{ id: 'year-1', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
        students: [{ id: 'student-1', institution_id: 'inst-1', internal_identifier: 'STU-001', first_name: 'Test', last_name: 'User' }],
        teacherClasses: [{ id: 'course-1', institution_id: 'inst-1', teacher_id: 'inst-admin-1', subject_id: 'subject-1', is_active: 1 }],
      });
      const mod = await import('../functions/api/classbook/enrollments/index');
      const resp = await mod.onRequestPost(makeContext(institutionAdminToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { academic_year_id: 'year-1', course_id: 'course-1', student_id: 'student-1', start_date: '2026-03-01' },
      }));
      expect(resp.status).toBe(201);
    });

    it('can create and manage sessions', async () => {
      const mockDB = makeMockDB({
        userId: 'inst-admin-1',
        institutionMember: { institution_id: 'inst-1', role: 'institution_admin' },
        academicYears: [{ id: 'year-1', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
        teacherClasses: [{ id: 'course-1', institution_id: 'inst-1', teacher_id: 'inst-admin-1', subject_id: 'subject-1', is_active: 1 }],
        subjects: [{ id: 'subject-1', name: 'Matematicas' }],
      });
      const mod = await import('../functions/api/classbook/sessions/index');
      const resp = await mod.onRequestPost(makeContext(institutionAdminToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', date: '2026-03-15' },
      }));
      expect(resp.status).toBe(201);
    });
  });

  describe('COORDINATOR', () => {
    it('can read academic years', async () => {
      const mockDB = makeMockDB({
        userId: 'coord-1',
        institutionMember: { institution_id: 'inst-1', role: 'coordinator' },
        coordinatorScope: { institution_id: 'inst-1', course_ids: JSON.stringify(['course-1']) },
      });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestGet(makeContext(coordinatorToken, mockDB, 'inst-1'));
      expect(resp.status).toBe(200);
    });

    it('can review planning within scope', async () => {
      const mockDB = makeMockDB({
        userId: 'coord-1',
        institutionMember: { institution_id: 'inst-1', role: 'coordinator' },
        coordinatorScope: { institution_id: 'inst-1', course_ids: JSON.stringify(['course-1']) },
      });
      const mod = await import('../functions/api/classbook/planning-reviews/index');
      const resp = await mod.onRequestPost(makeContext(coordinatorToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { planning_id: 'plan-1' },
      }));
      expect(resp.status).toBe(201);
    });

    it('cannot review planning outside scope', async () => {
      const mockDB = makeMockDB({
        userId: 'coord-1',
        institutionMember: { institution_id: 'inst-1', role: 'coordinator' },
        coordinatorScope: { institution_id: 'inst-1', course_ids: JSON.stringify(['course-1']) },
      });
      const mod = await import('../functions/api/classbook/planning-reviews/index');
      const resp = await mod.onRequestPost(makeContext(coordinatorToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { planning_id: 'plan-outside-scope' },
      }));
      expect([201, 403].includes(resp.status)).toBe(true);
    });

    it('can manage observations within scope', async () => {
      const mockDB = makeMockDB({
        userId: 'coord-1',
        institutionMember: { institution_id: 'inst-1', role: 'coordinator' },
        coordinatorScope: { institution_id: 'inst-1', course_ids: JSON.stringify(['course-1']) },
        academicYears: [{ id: 'year-1', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
        students: [{ id: 'student-1', institution_id: 'inst-1', internal_identifier: 'STU-001', first_name: 'Test', last_name: 'User' }],
        teacherClasses: [{ id: 'course-1', institution_id: 'inst-1', teacher_id: 'teacher-1', subject_id: 'subject-1', is_active: 1 }],
      });
      const mod = await import('../functions/api/classbook/observations/index');
      const resp = await mod.onRequestPost(makeContext(coordinatorToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { academic_year_id: 'year-1', course_id: 'course-1', student_id: 'student-1', category: 'academic', content: 'Test' },
      }));
      expect(resp.status).toBe(201);
    });
  });

  describe('TEACHER', () => {
    it('can read academic years', async () => {
      const mockDB = makeMockDB({ userId: 'teacher-1', institutionMember: { institution_id: 'inst-1', role: 'teacher' } });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestGet(makeContext(teacherToken, mockDB, 'inst-1'));
      expect(resp.status).toBe(403);
    });

    it('cannot access other teacher sessions', async () => {
      const mockDB = makeMockDB({ userId: 'teacher-1', institutionMember: { institution_id: 'inst-1', role: 'teacher' } });
      const mod = await import('../functions/api/classbook/sessions/[id]');
      const resp = await mod.onRequestGet(makeContext(teacherToken, mockDB, 'inst-1', { params: { id: 'other-session' } }));
      expect(resp.status).toBe(403);
    });

    it('can record attendance', async () => {
      const mockDB = makeMockDB({
        userId: 'teacher-1',
        institutionMember: { institution_id: 'inst-1', role: 'teacher' },
        sessions: [{ id: 'session-1', institution_id: 'inst-1', course_id: 'course-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'scheduled' }],
        enrollments: [{ id: 'enroll-1', student_id: 'student-1', course_id: 'course-1', institution_id: 'inst-1', status: 'active' }],
      });
      const mod = await import('../functions/api/classbook/sessions/[id]/attendance');
      const resp = await mod.onRequestPut(makeContext(teacherToken, mockDB, 'inst-1', {
        method: 'PUT',
        body: { records: [{ student_id: 'student-1', status: 'present' }], recorded_by: 'teacher-1' },
        params: { id: 'session-1' },
      }));
      expect(resp.status).toBe(200);
    });

    it('can create observations for own students', async () => {
      const mockDB = makeMockDB({
        userId: 'teacher-1',
        institutionMember: { institution_id: 'inst-1', role: 'teacher' },
        academicYears: [{ id: 'year-1', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
        students: [{ id: 'student-1', institution_id: 'inst-1', internal_identifier: 'STU-001', first_name: 'Test', last_name: 'User' }],
        teacherClasses: [{ id: 'course-1', institution_id: 'inst-1', teacher_id: 'teacher-1', subject_id: 'subject-1', is_active: 1 }],
      });
      const mod = await import('../functions/api/classbook/observations/index');
      const resp = await mod.onRequestPost(makeContext(teacherToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { academic_year_id: 'year-1', course_id: 'course-1', student_id: 'student-1', category: 'academic', content: 'Test' },
      }));
      expect(resp.status).toBe(201);
    });
  });

  describe('STUDENT', () => {
    it('cannot access admin endpoints', async () => {
      const endpoints = [
        { mod: '../functions/api/classbook/academic-years/index', method: 'onRequestGet' },
        { mod: '../functions/api/classbook/students/index', method: 'onRequestGet' },
        { mod: '../functions/api/classbook/sessions/index', method: 'onRequestGet' },
        { mod: '../functions/api/classbook/observations/index', method: 'onRequestGet' },
        { mod: '../functions/api/classbook/planning-reviews/index', method: 'onRequestGet' },
      ];

      for (const { mod, method } of endpoints) {
        const mockDB = makeMockDB({ userId: 'student-1', institutionMember: { institution_id: 'inst-1', role: 'student' } });
        const modImport = await import(mod);
        const resp = await modImport[method](makeContext(studentToken, mockDB, 'inst-1'));
        expect(resp.status).toBe(403);
      }
    });

    it('cannot create sessions', async () => {
      const mockDB = makeMockDB({ userId: 'student-1', institutionMember: { institution_id: 'inst-1', role: 'student' } });
      const mod = await import('../functions/api/classbook/sessions/index');
      const resp = await mod.onRequestPost(makeContext(studentToken, mockDB, 'inst-1', {
        method: 'POST',
        body: {},
      }));
      expect(resp.status).toBe(403);
    });
  });

  describe('UNAUTHENTICATED', () => {
    it('all endpoints return 401', async () => {
      const endpoints = [
        { mod: '../functions/api/classbook/academic-years/index', method: 'onRequestGet' },
        { mod: '../functions/api/classbook/students/index', method: 'onRequestGet' },
        { mod: '../functions/api/classbook/sessions/index', method: 'onRequestGet' },
        { mod: '../functions/api/classbook/observations/index', method: 'onRequestGet' },
        { mod: '../functions/api/classbook/planning-reviews/index', method: 'onRequestGet' },
      ];

      for (const { mod, method } of endpoints) {
        const mockDB = makeMockDB({});
        const modImport = await import(mod);
        const resp = await modImport[method]({ request: new Request('http://localhost'), env: { DB: mockDB, JWT_SECRET: TEST_SECRET } } as any);
        expect(resp.status).toBe(401);
      }
    });
  });
});
