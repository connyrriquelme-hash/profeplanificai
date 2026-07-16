import { describe, it, expect, beforeEach } from 'vitest';
import { makeMockDB, makeContext, signToken } from './helpers/mockD1';

const TEST_SECRET = 'test-secret-key-for-testing-1234!';

function baseDB(overrides: Record<string, unknown> = {}) {
  return makeMockDB({
    userId: overrides.userId as string || 'admin-1',
    institutionMember: overrides.institutionMember as any || { role: 'institution_admin', institution_id: 'inst-1' },
    academicYears: overrides.academicYears as any || [{ id: 'year-1', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
    students: overrides.students as any || undefined,
    teacherClasses: overrides.teacherClasses as any || undefined,
    subjects: overrides.subjects as any || undefined,
    sessions: overrides.sessions as any || undefined,
    enrollments: overrides.enrollments as any || undefined,
    lessonInstances: overrides.lessonInstances as any || undefined,
    ...overrides,
  });
}

describe('Classbook Endpoints', () => {
  let adminToken = '';
  let teacherToken = '';
  let coordinatorToken = '';
  let studentToken = '';

  beforeEach(async () => {
    adminToken = await signToken('admin-1', 'admin@test.cl', TEST_SECRET);
    teacherToken = await signToken('teacher-1', 'teacher@test.cl', TEST_SECRET);
    coordinatorToken = await signToken('coord-1', 'coord@test.cl', TEST_SECRET);
    studentToken = await signToken('student-1', 'student@test.cl', TEST_SECRET);
  });

  describe('Academic Years Endpoints', () => {
    it('GET /api/classbook/academic-years requires auth', async () => {
      const mockDB = makeMockDB({});
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestGet(makeContext(null, mockDB));
      expect(resp.status).toBe(401);
    });

    it('POST /api/classbook/academic-years requires classbook:create permission', async () => {
      const mockDB = makeMockDB({
        userId: 'student-1',
        institutionMember: { institution_id: 'inst-1', role: 'student' },
      });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestPost(makeContext(studentToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { name: '2026', start_date: '2026-03-01', end_date: '2026-12-31' },
      }));
      expect(resp.status).toBe(403);
    });
  });

  describe('Students Endpoints', () => {
    it('GET /api/classbook/students requires auth', async () => {
      const mockDB = makeMockDB({});
      const mod = await import('../functions/api/classbook/students/index');
      const resp = await mod.onRequestGet(makeContext(null, mockDB));
      expect(resp.status).toBe(401);
    });

    it('POST /api/classbook/students requires student:create permission', async () => {
      const mockDB = makeMockDB({ userId: 'teacher-1', institutionMember: { role: 'teacher', institution_id: 'inst-1' } });
      const mod = await import('../functions/api/classbook/students/index');
      const resp = await mod.onRequestPost(makeContext(teacherToken, mockDB, 'inst-1', { method: 'POST', body: {} }));
      expect(resp.status).toBe(403);
    });

    it('POST /api/classbook/students creates student with valid data', async () => {
      const mockDB = makeMockDB({
        userId: 'admin-1',
        institutionMember: { role: 'institution_admin', institution_id: 'inst-1' },
      });
      const mod = await import('../functions/api/classbook/students/index');
      const resp = await mod.onRequestPost(makeContext(adminToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { internal_identifier: 'STU-001', first_name: 'Juan', last_name: 'Perez' },
      }));
      expect(resp.status).toBe(201);
      const body = await resp.json() as any;
      expect(body.ok).toBe(true);
      expect(body.data.internal_identifier).toBe('STU-001');
    });
  });

  describe('Enrollments Endpoints', () => {
    it('POST /api/classbook/enrollments creates enrollment', async () => {
      const mockDB = makeMockDB({
        userId: 'admin-1',
        institutionMember: { role: 'institution_admin', institution_id: 'inst-1' },
        academicYears: [{ id: 'year-1', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
        students: [{ id: 'student-1', institution_id: 'inst-1', internal_identifier: 'STU-001', first_name: 'Juan', last_name: 'Perez' }],
        teacherClasses: [{ id: 'course-1', institution_id: 'inst-1', teacher_id: 'admin-1', subject_id: 'subject-1', is_active: 1 }],
      });
      const mod = await import('../functions/api/classbook/enrollments/index');
      const resp = await mod.onRequestPost(makeContext(adminToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { academic_year_id: 'year-1', course_id: 'course-1', student_id: 'student-1', start_date: '2026-03-01' },
      }));
      expect(resp.status).toBe(201);
      const body = await resp.json() as any;
      expect(body.ok).toBe(true);
    });
  });

  describe('Sessions Endpoints', () => {
    it('GET /api/classbook/sessions requires auth', async () => {
      const mockDB = makeMockDB({});
      const mod = await import('../functions/api/classbook/sessions/index');
      const resp = await mod.onRequestGet(makeContext(null, mockDB));
      expect(resp.status).toBe(401);
    });

    it('POST /api/classbook/sessions creates session', async () => {
      const mockDB = makeMockDB({
        userId: 'admin-1',
        institutionMember: { role: 'institution_admin', institution_id: 'inst-1' },
        academicYears: [{ id: 'year-1', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
        teacherClasses: [{ id: 'course-1', institution_id: 'inst-1', teacher_id: 'admin-1', subject_id: 'subject-1', is_active: 1 }],
        subjects: [{ id: 'subject-1', name: 'Matematicas' }],
      });
      const mod = await import('../functions/api/classbook/sessions/index');
      const resp = await mod.onRequestPost(makeContext(adminToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', date: '2026-03-15' },
      }));
      expect(resp.status).toBe(201);
      const body = await resp.json() as any;
      expect(body.ok).toBe(true);
    });

    it('POST /api/classbook/sessions/from-lesson creates from lesson_instance', async () => {
      const mockDB = makeMockDB({
        userId: 'admin-1',
        institutionMember: { role: 'institution_admin', institution_id: 'inst-1' },
        academicYears: [{ id: 'year-1', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
        teacherClasses: [{ id: 'course-1', institution_id: 'inst-1', teacher_id: 'admin-1', subject_id: 'subject-1', is_active: 1 }],
        subjects: [{ id: 'subject-1', name: 'Matematicas' }],
        lessonInstances: [{ id: 'lesson-1', class_id: 'course-1', teacher_id: 'admin-1', lesson_date: '2026-03-15', start_time: '08:00', end_time: '09:00', status: 'planned', title: 'Clase de prueba' }],
      });
      const mod = await import('../functions/api/classbook/sessions/from-lesson');
      const resp = await mod.onRequestPost(makeContext(adminToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { lesson_instance_id: 'lesson-1' },
      }));
      expect(resp.status).toBe(201);
      const body = await resp.json() as any;
      expect(body.ok).toBe(true);
    });

    it('POST /api/classbook/sessions/:id/complete requires classbook:complete permission', async () => {
      const mockDB = makeMockDB({ userId: 'teacher-1', institutionMember: { role: 'teacher', institution_id: 'inst-1' } });
      const mod = await import('../functions/api/classbook/sessions/[id]/complete');
      const resp = await mod.onRequestPost(makeContext(teacherToken, mockDB, 'inst-1', { params: { id: 'session-1' } }));
      expect(resp.status).toBe(403);
    });

    it('GET /api/classbook/sessions/:id/versions requires classbook:read permission', async () => {
      const mockDB = makeMockDB({ userId: 'teacher-1', institutionMember: { role: 'teacher', institution_id: 'inst-1' } });
      const mod = await import('../functions/api/classbook/sessions/[id]/versions');
      const resp = await mod.onRequestGet(makeContext(teacherToken, mockDB, 'inst-1', { params: { id: 'session-1' } }));
      expect(resp.status).toBe(403);
    });
  });

  describe('Attendance Endpoints', () => {
    it('GET /api/classbook/sessions/:id/attendance requires auth', async () => {
      const mockDB = makeMockDB({});
      const mod = await import('../functions/api/classbook/sessions/[id]/attendance');
      const resp = await mod.onRequestGet(makeContext(null, mockDB, 'inst-1', { params: { id: 'session-1' } }));
      expect(resp.status).toBe(401);
    });

    it('PUT /api/classbook/sessions/:id/attendance records batch attendance', async () => {
      const mockDB = makeMockDB({
        userId: 'teacher-1',
        institutionMember: { role: 'teacher', institution_id: 'inst-1' },
        sessions: [{ id: 'session-1', institution_id: 'inst-1', course_id: 'course-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'scheduled' }],
        enrollments: [{ id: 'enroll-1', student_id: 'student-1', course_id: 'course-1', institution_id: 'inst-1', status: 'active' }],
      });
      const mod = await import('../functions/api/classbook/sessions/[id]/attendance');
      const resp = await mod.onRequestPut(makeContext(teacherToken, mockDB, 'inst-1', {
        method: 'PUT',
        params: { id: 'session-1' },
        body: { records: [{ student_id: 'student-1', status: 'present' }], recorded_by: 'teacher-1' },
      }));
      expect(resp.status).toBe(200);
      const body = await resp.json() as any;
      expect(body.ok).toBe(true);
    });
  });

  describe('Observations Endpoints', () => {
    it('GET /api/classbook/observations requires auth', async () => {
      const mockDB = makeMockDB({});
      const mod = await import('../functions/api/classbook/observations/index');
      const resp = await mod.onRequestGet(makeContext(null, mockDB));
      expect(resp.status).toBe(401);
    });

    it('POST /api/classbook/observations creates observation', async () => {
      const mockDB = makeMockDB({
        userId: 'teacher-1',
        institutionMember: { role: 'teacher', institution_id: 'inst-1' },
        academicYears: [{ id: 'year-1', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
        students: [{ id: 'student-1', institution_id: 'inst-1', internal_identifier: 'STU-001', first_name: 'Juan', last_name: 'Perez' }],
        teacherClasses: [{ id: 'course-1', institution_id: 'inst-1', teacher_id: 'teacher-1', subject_id: 'subject-1', is_active: 1 }],
      });
      const mod = await import('../functions/api/classbook/observations/index');
      const resp = await mod.onRequestPost(makeContext(teacherToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { academic_year_id: 'year-1', course_id: 'course-1', student_id: 'student-1', category: 'academic', content: 'Test observation' },
      }));
      expect(resp.status).toBe(201);
      const body = await resp.json() as any;
      expect(body.ok).toBe(true);
    });
  });

  describe('Planning Reviews Endpoints', () => {
    it('GET /api/classbook/planning-reviews requires auth', async () => {
      const mockDB = makeMockDB({});
      const mod = await import('../functions/api/classbook/planning-reviews/index');
      const resp = await mod.onRequestGet(makeContext(null, mockDB));
      expect(resp.status).toBe(401);
    });

    it('POST /api/classbook/planning-reviews creates review', async () => {
      const mockDB = makeMockDB({
        userId: 'coord-1',
        institutionMember: { role: 'coordinator', institution_id: 'inst-1' },
        coordinatorScope: { institution_id: 'inst-1', course_ids: JSON.stringify(['course-1']) },
      });
      const mod = await import('../functions/api/classbook/planning-reviews/index');
      const resp = await mod.onRequestPost(makeContext(coordinatorToken, mockDB, 'inst-1', {
        method: 'POST',
        body: { planning_id: 'plan-1' },
      }));
      expect(resp.status).toBe(201);
      const body = await resp.json() as any;
      expect(body.ok).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('returns 404 for non-existent resource', async () => {
      const mockDB = makeMockDB({ userId: 'admin-1', institutionMember: { role: 'institution_admin', institution_id: 'inst-1' } });
      const mod = await import('../functions/api/classbook/academic-years/[id]');
      const resp = await mod.onRequestGet(makeContext(adminToken, mockDB, 'inst-1', { params: { id: 'non-existent' } }));
      expect(resp.status).toBe(404);
    });

    it('returns 409 for duplicate resource', async () => {
      const mockDB = makeMockDB({
        userId: 'admin-1',
        institutionMember: { role: 'institution_admin', institution_id: 'inst-1' },
        academicYears: [{ id: 'existing-year', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
      });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestPost(makeContext(adminToken, mockDB, 'inst-1', { method: 'POST', body: { name: '2026', start_date: '2026-03-01', end_date: '2026-12-31' } }));
      expect(resp.status).toBe(409);
      const body = await resp.json() as any;
      expect(body.ok).toBe(false);
    });

    it('returns 422 for invalid payload', async () => {
      const mockDB = makeMockDB({ userId: 'admin-1', institutionMember: { role: 'institution_admin', institution_id: 'inst-1' } });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestPost(makeContext(adminToken, mockDB, 'inst-1', { method: 'POST', body: {} }));
      expect(resp.status).toBe(422);
    });

    it('error response does not expose stack trace', async () => {
      const mockDB = makeMockDB({ userId: 'admin-1', institutionMember: { role: 'institution_admin', institution_id: 'inst-1' } });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestPost(makeContext(adminToken, mockDB, 'inst-1', { method: 'POST', body: 'invalid json' as any }));
      const body = await resp.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBeDefined();
      expect(JSON.stringify(body)).not.toContain('stack');
    });

    it('returns 500 with INTERNAL_ERROR on DB failure', async () => {
      const mockDB = makeMockDB({ userId: 'admin-1', institutionMember: { role: 'institution_admin', institution_id: 'inst-1' } });
      const origPrepare = mockDB.prepare.bind(mockDB);
      (mockDB as any).prepare = (sql: string) => {
        if (sql.toUpperCase().startsWith('INSERT')) {
          return {
            bind: () => ({
              async first() { return null; },
              async all() { return { results: [], success: true }; },
              async run() { throw new Error('Simulated DB failure'); },
            }),
            async run() { throw new Error('Simulated DB failure'); },
          };
        }
        return origPrepare(sql);
      };
      const mod = await import('../functions/api/classbook/academic-years/index');
      const resp = await mod.onRequestPost(makeContext(adminToken, mockDB, 'inst-1', { method: 'POST', body: { name: '2026', start_date: '2026-03-01', end_date: '2026-12-31' } }));
      expect(resp.status).toBe(500);
      const body = await resp.json() as any;
      expect(body.ok).toBe(false);
      expect(body.error).toBeDefined();
      expect(JSON.stringify(body)).not.toContain('stack');
      expect(JSON.stringify(body)).not.toContain('password');
      expect(JSON.stringify(body)).not.toContain('secret');
    });
  });
});
