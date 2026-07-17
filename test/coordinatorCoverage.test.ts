import { describe, it, expect, vi } from 'vitest';
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

function makeEmptyScopeDB() {
  return makeMockDB({
    academicYears: [{ id: 'year-1', institution_id: 'inst-1', name: '2026', status: 'active', start_date: '2026-03-01', end_date: '2026-12-31' }],
    teacherClasses: [],
    subjects: [],
    usuarios: [{ id: 'coord-1', email: 'coord@test.cl', nombre: 'Coordinador', rol: 'admin', active: 1 }],
    institution_members: [{ user_id: 'coord-1', institution_id: 'inst-1', role: 'coordinator', status: 'active' }],
    coordinator_scopes: [],
  });
}

async function getAuthToken(userId = 'coord-1', role = 'coordinator', institutionId = 'inst-1') {
  return signToken({ sub: userId, role, institutionId }, 'test-secret-key-for-testing-1234!');
}

describe('Coordinator Coverage', () => {
  describe('getCoverage', () => {
    it('sin datos → "Sin datos suficientes"', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeEmptyScopeDB();
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getCoverage('inst-1', context, {});

      expect(result).toEqual([]);
    });

    it('OA planificados', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', lesson_plan_id: 'lp-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido', objective_ids_json: JSON.stringify([]) },
        ],
        lessonPlans: [{ id: 'lp-1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1' }],
        lessonPlanCurriculum: [
          { lesson_plan_id: 'lp-1', objective_id: 'oa-1' },
          { lesson_plan_id: 'lp-1', objective_id: 'oa-2' },
          { lesson_plan_id: 'lp-1', objective_id: 'oa-3' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getCoverage('inst-1', context, {});

      expect(result.length).toBe(1);
      expect(result[0].totalOA).toBe(3);
    });

    it('OA trabajados', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', lesson_plan_id: 'lp-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido', objective_ids_json: JSON.stringify(['oa-1', 'oa-2']) },
        ],
        lessonPlans: [{ id: 'lp-1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1' }],
        lessonPlanCurriculum: [
          { lesson_plan_id: 'lp-1', objective_id: 'oa-1' },
          { lesson_plan_id: 'lp-1', objective_id: 'oa-2' },
          { lesson_plan_id: 'lp-1', objective_id: 'oa-3' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getCoverage('inst-1', context, {});

      expect(result[0].workedOA).toBe(2);
    });

    it('OA pendientes', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', lesson_plan_id: 'lp-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido', objective_ids_json: JSON.stringify(['oa-1']) },
        ],
        lessonPlans: [{ id: 'lp-1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1' }],
        lessonPlanCurriculum: [
          { lesson_plan_id: 'lp-1', objective_id: 'oa-1' },
          { lesson_plan_id: 'lp-1', objective_id: 'oa-2' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getCoverage('inst-1', context, {});

      expect(result[0].pendingOA).toBe(1);
    });

    it('porcentaje correcto', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', lesson_plan_id: 'lp-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido', objective_ids_json: JSON.stringify(['oa-1', 'oa-2']) },
        ],
        lessonPlans: [{ id: 'lp-1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1' }],
        lessonPlanCurriculum: [
          { lesson_plan_id: 'lp-1', objective_id: 'oa-1' },
          { lesson_plan_id: 'lp-1', objective_id: 'oa-2' },
          { lesson_plan_id: 'lp-1', objective_id: 'oa-3' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getCoverage('inst-1', context, {});

      expect(result[0].coveragePercent).toBe(67); // 2/3 = 66.66% -> 67%
    });

    it('filtro por curso', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        lessonPlans: [
          { id: 'lp-1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1' },
          { id: 'lp-2', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-2', subject_id: 'subject-2', teacher_id: 'teacher-2' },
        ],
        lessonPlanCurriculum: [
          { lesson_plan_id: 'lp-1', objective_id: 'oa-1' },
          { lesson_plan_id: 'lp-2', objective_id: 'oa-3' },
        ],
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', lesson_plan_id: 'lp-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido', objective_ids_json: JSON.stringify(['oa-1']) },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getCoverage('inst-1', context, { courseId: 'course-1' });

      expect(result.length).toBe(1);
      expect(result[0].courseId).toBe('course-1');
    });

    it('filtro por asignatura', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        lessonPlans: [
          { id: 'lp-1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1' },
        ],
        lessonPlanCurriculum: [
          { lesson_plan_id: 'lp-1', objective_id: 'oa-1' },
        ],
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', lesson_plan_id: 'lp-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido', objective_ids_json: JSON.stringify(['oa-1']) },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getCoverage('inst-1', context, { subjectId: 'subject-2' });

      expect(result.length).toBe(0);
    });

    it('filtro por período', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        academicTerms: [
          { id: 'term-1', academic_year_id: 'year-1', institution_id: 'inst-1', name: 'Semestre 1', start_date: '2026-03-01', end_date: '2026-07-31', sort_order: 1 },
        ],
        lessonPlans: [
          { id: 'lp-1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1' },
        ],
        lessonPlanCurriculum: [
          { lesson_plan_id: 'lp-1', objective_id: 'oa-1' },
        ],
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', academic_term_id: 'term-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', lesson_plan_id: 'lp-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido', objective_ids_json: JSON.stringify(['oa-1']) },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getCoverage('inst-1', context, { termId: 'term-1' });

      expect(result.length).toBe(1);
    });

    it('no modifica CORE_DB', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB();
      const execSpy = vi.spyOn(mockDB, 'exec');
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      await service.getCoverage('inst-1', context, {});

      // Verificar que no hubo escrituras
      expect(execSpy).not.toHaveBeenCalled();
      execSpy.mockRestore();
    });

    it('resumen textual accesible', async () => {
      const { CoordinatorDashboardService } = await import('../functions/services/classbook/coordinatorDashboardService');
      const mockDB = makeCoordinatorDB({
        classSessions: [
          { id: 's1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1', lesson_plan_id: 'lp-1', date: '2026-03-15', status: 'completed', taught_content: 'Contenido', objective_ids_json: JSON.stringify(['oa-1']) },
        ],
        lessonPlans: [{ id: 'lp-1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', subject_id: 'subject-1', teacher_id: 'teacher-1' }],
        lessonPlanCurriculum: [
          { lesson_plan_id: 'lp-1', objective_id: 'oa-1' },
        ],
      });
      const service = new CoordinatorDashboardService({ DB: mockDB });
      const token = await signToken({ sub: 'coord-1', role: 'coordinator', institutionId: 'inst-1' }, 'test-secret-key-for-testing-1234!');
      const context = makeContext(token, mockDB);

      const result = await service.getCoverage('inst-1', context, {});

      expect(result[0].courseName).toBeDefined();
      expect(result[0].subjectName).toBeDefined();
      expect(typeof result[0].coveragePercent).toBe('number');
    });
  });
});
