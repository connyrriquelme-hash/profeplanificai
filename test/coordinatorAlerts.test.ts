import { describe, it, expect } from 'vitest';
import { makeMockDB, makeContext, signToken } from './helpers/mockD1';

const TEST_SECRET = 'test-secret-key-for-testing-1234!';

function makeCoordinatorDB(overrides: Record<string, unknown[]> = {}) {
  return makeMockDB({
    academicYears: [{ id: 'year-1', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
    teacherClasses: [
      { id: 'course-1', institution_id: 'inst-1', name: '1° Básico A', subject_id: 'subject-1', teacher_id: 'teacher-1', is_active: 1 },
      { id: 'course-2', institution_id: 'inst-1', name: '2° Básico B', subject_id: 'subject-2', teacher_id: 'teacher-2', is_active: 1 },
    ],
    subjects: [
      { id: 'subject-1', name: 'Matematicas' },
      { id: 'subject-2', name: 'Lenguaje' },
    ],
    usuarios: [
      { id: 'coord-1', email: 'coord@test.cl', nombre: 'Coordinador', rol: 'admin', active: 1 },
      { id: 'teacher-1', email: 't1@test.cl', nombre: 'Prof. Juan', rol: 'docente', active: 1 },
      { id: 'teacher-2', email: 't2@test.cl', nombre: 'Prof. Maria', rol: 'docente', active: 1 },
    ],
    institution_members: [
      { user_id: 'coord-1', institution_id: 'inst-1', role: 'coordinator', status: 'active' },
    ],
    coordinator_scopes: [{
      user_id: 'coord-1',
      institution_id: 'inst-1',
      course_ids: JSON.stringify(['course-1', 'course-2']),
      subject_ids: JSON.stringify(['subject-1', 'subject-2']),
      level_ids: JSON.stringify(['level-1']),
      academic_year_id: 'year-1',
      is_active: 1,
    }],
    ...overrides,
  });
}

async function getAuthToken(userId = 'coord-1', role = 'coordinator', institutionId = 'inst-1') {
  return signToken({ sub: userId, role, institutionId }, 'test-secret-key-for-testing-1234!');
}

describe('Coordinator Alerts', () => {
  describe('getAlerts', () => {
    it('sesión completada sin firma', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido', version: 1, updated_at: '2026-03-15T10:00:00Z' },
        ],
        signatureEvents: [], // sin firmas
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      const alert = result.find(a => a.type === 'session_completed_no_signature');
      expect(alert).toBeDefined();
      expect(alert?.severity).toBe('warning');
      expect(alert?.resourceType).toBe('class_session');
      expect(alert?.resourceId).toBe('s1');
    });

    it('sesión pasada aún programada', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2020-01-01', status: 'scheduled' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      const alert = result.find(a => a.type === 'session_past_still_scheduled');
      expect(alert).toBeDefined();
      expect(alert?.severity).toBe('critical');
      expect(alert?.resourceType).toBe('class_session');
      expect(alert?.resourceId).toBe('s1');
    });

    it('sesión completada sin asistencia', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido' },
        ],
        attendanceRecords: [], // sin asistencia
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      const alert = result.find(a => a.type === 'session_completed_no_attendance');
      expect(alert).toBeDefined();
      expect(alert?.severity).toBe('warning');
      expect(alert?.resourceType).toBe('class_session');
    });

    it('planificación pendiente de revisión', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'completed' },
        ],
        planningReviews: [
          { id: 'rev-1', institution_id: 'inst-1', planning_id: 's1', reviewer_id: 'coord-1', status: 'pending', comments: null, created_at: '2026-03-15T10:00:00Z' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      const alert = result.find(a => a.type === 'planning_pending_review');
      expect(alert).toBeDefined();
      expect(alert?.severity).toBe('info');
      expect(alert?.resourceType).toBe('planning_review');
      expect(alert?.resourceId).toBe('rev-1');
    });

    it('planificación devuelta sin corrección no genera alerta ficticia', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        planningReviews: [
          { id: 'rev-1', institution_id: 'inst-1', planning_id: 's1', reviewer_id: 'coord-1', status: 'returned', comments: 'Corregir', created_at: '2026-03-15T10:00:00Z' },
        ],
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'completed' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      const alert = result.find(a => a.type === 'planning_returned_no_correction');
      expect(alert).toBeUndefined();
    });

    it('observación con seguimiento vencido', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        studentObservations: [
          { id: 'obs-1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', student_id: 'student-1', category: 'academic', content: 'Observación', visibility: 'teacher', follow_up_date: '2020-01-01', created_by: 'teacher-1', archived_at: null },
        ],
        studentProfiles: [{ id: 'student-1', institution_id: 'inst-1', internal_identifier: 'STU-001', first_name: 'Juan', last_name: 'Perez', enrollment_status: 'active' }],
        courseEnrollments: [{ id: 'e1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', student_id: 'student-1', status: 'active' }],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      const alert = result.find(a => a.type === 'observation_follow_up_overdue');
      expect(alert).toBeDefined();
      expect(alert?.severity).toBe('warning');
      expect(alert?.resourceType).toBe('student_observation');
      expect(alert?.resourceId).toBe('obs-1');
      expect(alert?.dueDate).toBe('2020-01-01');
    });

    it('asistencia bajo umbral no genera alerta ficticia si no existe regla activa', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'completed' },
        ],
        attendanceRecords: [
          { id: 'a1', institution_id: 'inst-1', class_session_id: 's1', student_id: 'student-1', status: 'absent', recorded_by: 'teacher-1' },
          { id: 'a2', institution_id: 'inst-1', class_session_id: 's1', student_id: 'student-2', status: 'absent', recorded_by: 'teacher-1' },
          { id: 'a3', institution_id: 'inst-1', class_session_id: 's1', student_id: 'student-3', status: 'absent', recorded_by: 'teacher-1' },
        ],
        studentProfiles: [
          { id: 'student-1', institution_id: 'inst-1', internal_identifier: 'STU-001', first_name: 'Juan', last_name: 'Perez', enrollment_status: 'active' },
          { id: 'student-2', institution_id: 'inst-1', internal_identifier: 'STU-002', first_name: 'Maria', last_name: 'Lopez', enrollment_status: 'active' },
          { id: 'student-3', institution_id: 'inst-1', internal_identifier: 'STU-003', first_name: 'Pedro', last_name: 'Gonzalez', enrollment_status: 'active' },
        ],
        courseEnrollments: [
          { id: 'e1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', student_id: 'student-1', status: 'active' },
          { id: 'e2', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', student_id: 'student-2', status: 'active' },
          { id: 'e3', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', student_id: 'student-3', status: 'active' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      const alert = result.find(a => a.type === 'attendance_below_threshold');
      expect(alert).toBeUndefined();
    });

    it('docente con varias sesiones pendientes no genera alerta ficticia si no existe regla activa', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'scheduled' },
          { id: 's2', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-16', status: 'scheduled' },
          { id: 's3', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-17', status: 'scheduled' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      const alert = result.find(a => a.type === 'teacher_multiple_pending_sessions');
      expect(alert).toBeUndefined();
    });

    it('severidad info/warning/critical', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido' }, // warning
          { id: 's2', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2020-01-01', status: 'scheduled' }, // critical
        ],
        attendanceRecords: [
          { id: 'a1', institution_id: 'inst-1', class_session_id: 's1', student_id: 'student-1', status: 'present', recorded_by: 'teacher-1' },
        ],
        planningReviews: [
          { id: 'rev-1', institution_id: 'inst-1', planning_id: 's1', reviewer_id: 'coord-1', status: 'pending', comments: null, created_at: '2026-03-15T10:00:00Z' }, // info
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      const severities = result.map(a => a.severity);
      expect(severities).toContain('critical');
      expect(severities).toContain('warning');
      expect(severities).toContain('info');
      
      // Verificar orden: critical > warning > info
      expect(result[0].severity).toBe('critical');
      expect(result[1].severity).toBe('warning');
      expect(result[2].severity).toBe('info');
    });

    it('resourceType correcto', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      const alert = result.find(a => a.type === 'session_completed_no_signature');
      expect(alert?.resourceType).toBe('class_session');
    });

    it('resourceId correcto', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      const alert = result.find(a => a.type === 'session_completed_no_signature');
      expect(alert?.resourceId).toBe('s1');
    });

    it('navegación a recurso', async () => {
      // Este test verifica que la alerta tiene los campos necesarios para navegación
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      const alert = result.find(a => a.type === 'session_completed_no_signature');
      expect(alert).toHaveProperty('resourceType');
      expect(alert).toHaveProperty('resourceId');
    });

    it('recurso inexistente no rompe vista', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      // La vista no debería romperse aunque el recurso no exista
      expect(Array.isArray(result)).toBe(true);
    });

    it('no genera alertas ficticias sin datos', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [],
        planningReviews: [],
        attendanceRecords: [],
        studentObservations: [],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getAlerts('inst-1', context, {});

      expect(result.length).toBe(0);
    });
  });
});
