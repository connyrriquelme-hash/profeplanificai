import { describe, it, expect, beforeEach } from 'vitest';
import { makeMockDB, makeContext, signToken } from './helpers/mockD1';

const TEST_SECRET = 'test-secret-key-for-testing-1234!';

function mockDBWithTestData(overrides: Record<string, unknown[]> = {}) {
  return makeMockDB({
    academicYears: [{ id: 'year-1', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
    students: [{ id: 'student-1', institution_id: 'inst-1', internal_identifier: 'STU-001', first_name: 'Juan', last_name: 'Perez', enrollment_status: 'active' }],
    teacherClasses: [{ id: 'course-1', teacher_id: 'teacher-1', subject_id: 'subject-1', is_active: 1 }],
    subjects: [{ id: 'subject-1', name: 'Matematicas' }],
    usuarios: [{ id: 'teacher-1', email: 'teacher@test.cl', nombre: 'Prof', rol: 'docente', active: 1 }],
    ...overrides,
  });
}

describe('Classbook Services', () => {
  describe('AcademicYearService', () => {
    it('should create academic year', async () => {
      const { AcademicYearService } = await import('../functions/services/classbook/academicYearsService');
      const mockDB = makeMockDB({});
      const service = new AcademicYearService({ DB: mockDB });

      const year = await service.create({
        institution_id: 'inst-1',
        name: '2026',
        start_date: '2026-03-01',
        end_date: '2026-12-31',
        status: 'planning',
      }, 'inst-1');

      expect(year).toBeDefined();
      expect(year.name).toBe('2026');
      expect(year.institution_id).toBe('inst-1');
    });

    it('should create academic year with same name for different institutions', async () => {
      const { AcademicYearService } = await import('../functions/services/classbook/academicYearsService');
      const mockDB = makeMockDB({});
      const service = new AcademicYearService({ DB: mockDB });

      const year1 = await service.create({
        institution_id: 'inst-1',
        name: '2026',
        start_date: '2026-03-01',
        end_date: '2026-12-31',
      }, 'inst-1');

      const year2 = await service.create({
        institution_id: 'inst-2',
        name: '2026',
        start_date: '2026-03-01',
        end_date: '2026-12-31',
      }, 'inst-2');

      expect(year1.id).not.toBe(year2.id);
      expect(year1.name).toBe('2026');
      expect(year2.name).toBe('2026');
    });
  });

  describe('AcademicTermService', () => {
    it('should create academic term', async () => {
      const { AcademicTermService } = await import('../functions/services/classbook/academicYearsService');
      const mockDB = mockDBWithTestData();
      const service = new AcademicTermService({ DB: mockDB });

      const term = await service.create({
        academic_year_id: 'year-1',
        name: 'Semestre 1',
        start_date: '2026-03-01',
        end_date: '2026-07-31',
        order_index: 1,
      }, 'inst-1');

      expect(term).toBeDefined();
      expect(term.name).toBe('Semestre 1');
      expect(term.academic_year_id).toBe('year-1');
    });

    it('should create non-overlapping terms', async () => {
      const { AcademicTermService } = await import('../functions/services/classbook/academicYearsService');
      const mockDB = mockDBWithTestData();
      const service = new AcademicTermService({ DB: mockDB });

      const term1 = await service.create({
        academic_year_id: 'year-1',
        name: 'Semestre 1',
        start_date: '2026-03-01',
        end_date: '2026-07-31',
        order_index: 1,
      }, 'inst-1');

      const term2 = await service.create({
        academic_year_id: 'year-1',
        name: 'Semestre 2',
        start_date: '2026-08-01',
        end_date: '2026-12-31',
        order_index: 2,
      }, 'inst-1');

      expect(term1.id).not.toBe(term2.id);
      expect(term1.name).toBe('Semestre 1');
      expect(term2.name).toBe('Semestre 2');
    });
  });

  describe('StudentProfileService', () => {
    it('should create student profile', async () => {
      const { StudentProfileService } = await import('../functions/services/classbook/studentsService');
      const mockDB = makeMockDB({});
      const service = new StudentProfileService({ DB: mockDB });

      const student = await service.create({
        institution_id: 'inst-1',
        internal_identifier: 'STU-001',
        first_name: 'Juan',
        last_name: 'Perez',
        preferred_name: 'Juan',
        birth_date: '2010-01-01',
        enrollment_status: 'active',
      }, 'inst-1');

      expect(student).toBeDefined();
      expect(student.internal_identifier).toBe('STU-001');
      expect(student.first_name).toBe('Juan');
    });

    it('should prevent duplicate internal identifier', async () => {
      const { StudentProfileService } = await import('../functions/services/classbook/studentsService');
      const mockDB = makeMockDB({});
      const service = new StudentProfileService({ DB: mockDB });

      await service.create({
        institution_id: 'inst-1',
        internal_identifier: 'STU-001',
        first_name: 'Juan',
        last_name: 'Perez',
      }, 'inst-1');

      await expect(service.create({
        institution_id: 'inst-1',
        internal_identifier: 'STU-001',
        first_name: 'Maria',
        last_name: 'Lopez',
      }, 'inst-1')).rejects.toThrow();
    });

    it('should archive student (soft delete)', async () => {
      const { StudentProfileService } = await import('../functions/services/classbook/studentsService');
      const mockDB = makeMockDB({});
      const service = new StudentProfileService({ DB: mockDB });

      const student = await service.create({
        institution_id: 'inst-1',
        internal_identifier: 'STU-001',
        first_name: 'Juan',
        last_name: 'Perez',
      }, 'inst-1');

      const archived = await service.archive(student.id);
      expect(archived?.archived_at).toBeDefined();
    });
  });

  describe('CourseEnrollmentService', () => {
    it('should create enrollment', async () => {
      const { CourseEnrollmentService } = await import('../functions/services/classbook/studentsService');
      const mockDB = mockDBWithTestData();
      const service = new CourseEnrollmentService({ DB: mockDB });

      const enrollment = await service.create({
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-1',
        student_id: 'student-1',
        start_date: '2026-03-01',
        status: 'active',
      }, 'inst-1');

      expect(enrollment).toBeDefined();
      expect(enrollment.status).toBe('active');
    });

    it('should prevent duplicate enrollment', async () => {
      const { CourseEnrollmentService } = await import('../functions/services/classbook/studentsService');
      const mockDB = mockDBWithTestData();
      const service = new CourseEnrollmentService({ DB: mockDB });

      await service.create({
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-1',
        student_id: 'student-1',
        start_date: '2026-03-01',
      }, 'inst-1');

      await expect(service.create({
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-1',
        student_id: 'student-1',
        start_date: '2026-03-01',
      }, 'inst-1')).rejects.toThrow();
    });
  });

  describe('ClassSessionService', () => {
    it('should create class session', async () => {
      const { ClassSessionService } = await import('../functions/services/classbook/classSessionsService');
      const mockDB = mockDBWithTestData();
      const service = new ClassSessionService({ DB: mockDB });

      const session = await service.create({
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-1',
        subject_id: 'subject-1',
        teacher_id: 'teacher-1',
        date: '2026-03-15',
        planned_content: 'Clase de prueba',
      }, 'inst-1', 'teacher-1');

      expect(session).toBeDefined();
      expect(session.course_id).toBe('course-1');
      expect(session.status).toBe('scheduled');
    });

    it('should create session from lesson instance', async () => {
      const { ClassSessionService } = await import('../functions/services/classbook/classSessionsService');
      const mockDB = mockDBWithTestData({
        lessonInstances: [{ id: 'lesson-1', class_id: 'course-1', teacher_id: 'teacher-1', lesson_date: '2026-03-15', start_time: '08:00', end_time: '09:00', status: 'planned', title: 'Clase de prueba', course_id: 'course-1', subject_id: 'subject-1' }],
      });
      const service = new ClassSessionService({ DB: mockDB });

      const session = await service.createFromLessonInstance('lesson-1', 'inst-1', 'teacher-1');
      expect(session).toBeDefined();
      expect(session.lesson_instance_id).toBe('lesson-1');
    });

    it('should prevent duplicate session for same course/date/teacher', async () => {
      const { ClassSessionService } = await import('../functions/services/classbook/classSessionsService');
      const mockDB = mockDBWithTestData();
      const service = new ClassSessionService({ DB: mockDB });

      await service.create({
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-1',
        subject_id: 'subject-1',
        teacher_id: 'teacher-1',
        date: '2026-03-15',
      }, 'inst-1', 'teacher-1');

      await expect(service.create({
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-1',
        subject_id: 'subject-1',
        teacher_id: 'teacher-1',
        date: '2026-03-15',
      }, 'inst-1', 'teacher-1')).rejects.toThrow();
    });

    it('should generate version on complete', async () => {
      const { ClassSessionService } = await import('../functions/services/classbook/classSessionsService');
      const mockDB = mockDBWithTestData();
      const service = new ClassSessionService({ DB: mockDB });

      const session = await service.create({
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-1',
        subject_id: 'subject-1',
        teacher_id: 'teacher-1',
        date: '2026-03-15',
      }, 'inst-1', 'teacher-1');

      const completed = await service.complete(session.id, true);
      expect(completed).toBeDefined();
      expect(completed.status).toBe('pending_signature');
    });
  });

  describe('AttendanceService', () => {
    it('should record attendance batch', async () => {
      const { AttendanceService } = await import('../functions/services/classbook/attendanceService');
      const mockDB = mockDBWithTestData({
        sessions: [{ id: 'session-1', institution_id: 'inst-1', course_id: 'course-1' }],
        enrollments: [
          { id: 'enroll-1', student_id: 'student-1', course_id: 'course-1', status: 'active' },
          { id: 'enroll-2', student_id: 'student-2', course_id: 'course-1', status: 'active' },
        ],
      });
      const service = new AttendanceService({ DB: mockDB });

      const result = await service.batchUpsertForSession('session-1', 'inst-1', {
        records: [
          { student_id: 'student-1', status: 'present' },
          { student_id: 'student-2', status: 'absent', justification: 'Enfermedad' },
        ],
        recorded_by: 'teacher-1',
      });

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.records.length).toBe(2);
    });

    it('should upsert attendance (not duplicate)', async () => {
      const { AttendanceService } = await import('../functions/services/classbook/attendanceService');
      const mockDB = mockDBWithTestData({
        sessions: [{ id: 'session-1', institution_id: 'inst-1', course_id: 'course-1' }],
        enrollments: [{ id: 'enroll-1', student_id: 'student-1', course_id: 'course-1', status: 'active' }],
        attendance: [{ id: 'att-1', class_session_id: 'session-1', student_id: 'student-1', status: 'present' }],
      });
      const service = new AttendanceService({ DB: mockDB });

      await service.batchUpsertForSession('session-1', 'inst-1', {
        records: [{ student_id: 'student-1', status: 'present' }],
        recorded_by: 'teacher-1',
      });

      const result = await service.batchUpsertForSession('session-1', 'inst-1', {
        records: [{ student_id: 'student-1', status: 'late' }],
        recorded_by: 'teacher-1',
      });

      expect(result.updated).toBe(1);
      expect(result.created).toBe(0);
    });

    it('should allow attendance for any student', async () => {
      const { AttendanceService } = await import('../functions/services/classbook/attendanceService');
      const mockDB = mockDBWithTestData({
        sessions: [{ id: 'session-1', institution_id: 'inst-1', course_id: 'course-1' }],
        enrollments: [{ id: 'enroll-1', student_id: 'student-1', course_id: 'course-1', status: 'active' }],
      });
      const service = new AttendanceService({ DB: mockDB });

      const result = await service.batchUpsertForSession('session-1', 'inst-1', {
        records: [{ student_id: 'student-1', status: 'present' }],
        recorded_by: 'teacher-1',
      });

      expect(result.created).toBe(1);
      expect(result.records.length).toBe(1);
    });
  });

  describe('ObservationService', () => {
    it('should create observation', async () => {
      const { ObservationService } = await import('../functions/services/classbook/observationsService');
      const mockDB = mockDBWithTestData();
      const service = new ObservationService({ DB: mockDB });

      const obs = await service.create({
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-1',
        student_id: 'student-1',
        category: 'academic',
        content: 'Buen desempeno',
        visibility: 'teacher',
      }, 'inst-1');

      expect(obs).toBeDefined();
      expect(obs.category).toBe('academic');
    });

    it('should archive observation (soft delete)', async () => {
      const { ObservationService } = await import('../functions/services/classbook/observationsService');
      const mockDB = mockDBWithTestData();
      const service = new ObservationService({ DB: mockDB });

      const obs = await service.create({
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-1',
        student_id: 'student-1',
        category: 'academic',
        content: 'Test',
      }, 'inst-1');

      const archived = await service.archive(obs.id);
      expect(archived?.archived_at).toBeDefined();
    });
  });

  describe('PlanningReviewService', () => {
    it('should create review', async () => {
      const { PlanningReviewService } = await import('../functions/services/classbook/planningReviewsService');
      const mockDB = makeMockDB({});
      const service = new PlanningReviewService({ DB: mockDB });

      const review = await service.create({
        institution_id: 'inst-1',
        planning_id: 'plan-1',
        reviewer_id: 'coordinator-1',
      }, 'inst-1');

      expect(review).toBeDefined();
      expect(review.status).toBe('pending');
    });

    it('should allow reviewer to approve', async () => {
      const { PlanningReviewService } = await import('../functions/services/classbook/planningReviewsService');
      const mockDB = makeMockDB({});
      const service = new PlanningReviewService({ DB: mockDB });

      const review = await service.create({
        institution_id: 'inst-1',
        planning_id: 'plan-1',
        reviewer_id: 'coordinator-1',
      }, 'inst-1');

      const approved = await service.approve(review.id, 'coordinator-1', 'Aprobado');
      expect(approved?.status).toBe('approved');
      expect(approved?.reviewed_at).toBeDefined();
    });

    it('should reject non-reviewer approval', async () => {
      const { PlanningReviewService } = await import('../functions/services/classbook/planningReviewsService');
      const mockDB = makeMockDB({});
      const service = new PlanningReviewService({ DB: mockDB });

      const review = await service.create({
        institution_id: 'inst-1',
        planning_id: 'plan-1',
        reviewer_id: 'coordinator-1',
      }, 'inst-1');

      await expect(service.approve(review.id, 'other-coordinator')).rejects.toThrow();
    });
  });

  describe('SignaturesService', () => {
    it('should sign session with content hash', async () => {
      const { SignaturesService } = await import('../functions/services/classbook/signaturesService');
      const mockDB = mockDBWithTestData({
        sessions: [{ id: 'session-1', institution_id: 'inst-1', course_id: 'course-1', status: 'completed', version: 1 }],
      });
      const service = new SignaturesService({ DB: mockDB });

      const signature = await service.signSession('session-1', 'teacher-1', 'inst-1', 'content-hash-123');

      expect(signature).toBeDefined();
      expect(signature.signature.content_hash).toBe('content-hash-123');
      expect(signature.signature.signed_version).toBeDefined();
    });

    it('should prevent double signing', async () => {
      const { SignaturesService } = await import('../functions/services/classbook/signaturesService');
      const mockDB = mockDBWithTestData({
        sessions: [{ id: 'session-1', institution_id: 'inst-1', course_id: 'course-1', status: 'completed', version: 1 }],
      });
      const service = new SignaturesService({ DB: mockDB });

      await service.signSession('session-1', 'teacher-1', 'inst-1', 'hash-1');

      await expect(service.signSession('session-1', 'teacher-1', 'inst-1', 'hash-2')).rejects.toThrow();
    });
  });

  describe('AuditService', () => {
    it('should log create action', async () => {
      const { ClassbookAuditService } = await import('../functions/services/classbook/auditService');
      const mockDB = makeMockDB({});
      const service = new ClassbookAuditService({ DB: mockDB });

      const entry = await service.logCreate('inst-1', 'user-1', 'class_session', 'session-1', { title: 'Test' });

      expect(entry).toBeDefined();
      expect(entry.action).toBe('create');
      expect(entry.resource_type).toBe('class_session');
    });

    it('should log update with before/after', async () => {
      const { ClassbookAuditService } = await import('../functions/services/classbook/auditService');
      const mockDB = makeMockDB({});
      const service = new ClassbookAuditService({ DB: mockDB });

      const entry = await service.logUpdate('inst-1', 'user-1', 'class_session', 'session-1', { a: 1 }, { a: 2 });

      expect(entry.metadata_json).toEqual({ before: { a: 1 }, after: { a: 2 } });
    });
  });
});
