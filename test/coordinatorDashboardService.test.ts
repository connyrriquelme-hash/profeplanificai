import { describe, expect, it } from 'vitest';
import { CoordinatorDashboardService } from '../functions/services/classbook/coordinatorDashboardService';
import type { AuthenticatedUserContext, CoordinatorScope, InstitutionalRole } from '../functions/core/authorization';
import { createMockD1, type MockD1Database } from './helpers/mockD1';

const BASE_SCOPE: CoordinatorScope = {
  institutionId: 'inst-1',
  courseIds: [],
  subjectIds: [],
  levelIds: [],
  academicYearIds: [],
};

function auth(role: InstitutionalRole = 'institution_admin', scope?: Partial<CoordinatorScope>): AuthenticatedUserContext {
  return {
    userId: 'user-admin',
    institutionId: 'inst-1',
    role,
    isActive: true,
    permissions: role === 'coordinator' ? ['report:scope'] : ['report:*'],
    scope: scope ? { ...BASE_SCOPE, ...scope } : undefined,
  };
}

function serviceWith(db: MockD1Database) {
  return new CoordinatorDashboardService({ DB: db as unknown as D1Database });
}

function dashboardDb(overrides: Record<string, Record<string, unknown>[]> = {}) {
  return createMockD1({
    class_sessions: [
      {
        id: 's-scheduled',
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-1',
        subject_id: 'subject-1',
        teacher_id: 'teacher-1',
        date: '2026-03-01',
        status: 'scheduled',
        taught_content: '',
        objective_ids_json: '[]',
        lesson_plan_id: 'lp-1',
      },
      {
        id: 's-completed-content',
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-1',
        subject_id: 'subject-1',
        teacher_id: 'teacher-1',
        date: '2026-03-02',
        status: 'completed',
        taught_content: 'Contenido trabajado',
        objective_ids_json: JSON.stringify(['oa-1']),
        lesson_plan_id: 'lp-1',
      },
      {
        id: 's-completed-no-content',
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-1',
        subject_id: 'subject-1',
        teacher_id: 'teacher-1',
        date: '2026-03-03',
        status: 'completed',
        taught_content: '',
        objective_ids_json: JSON.stringify(['oa-2']),
        lesson_plan_id: 'lp-1',
      },
      {
        id: 's-completed-no-attendance',
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-2',
        subject_id: 'subject-2',
        teacher_id: 'teacher-2',
        date: '2026-03-04',
        status: 'completed',
        taught_content: 'Contenido trabajado',
        objective_ids_json: JSON.stringify(['oa-3']),
        lesson_plan_id: 'lp-2',
      },
      {
        id: 's-open',
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-2',
        subject_id: 'subject-2',
        teacher_id: 'teacher-2',
        date: '2026-03-05',
        status: 'open',
        taught_content: '',
        objective_ids_json: '[]',
        lesson_plan_id: 'lp-2',
      },
      {
        id: 's-pending-signature',
        institution_id: 'inst-1',
        academic_year_id: 'year-1',
        course_id: 'course-2',
        subject_id: 'subject-2',
        teacher_id: 'teacher-2',
        date: '2026-03-06',
        status: 'pending_signature',
        taught_content: 'Lista para firma',
        objective_ids_json: '[]',
        lesson_plan_id: 'lp-2',
      },
      {
        id: 's-year-2',
        institution_id: 'inst-1',
        academic_year_id: 'year-2',
        course_id: 'course-1',
        subject_id: 'subject-1',
        teacher_id: 'teacher-1',
        date: '2025-03-06',
        status: 'completed',
        taught_content: 'Año anterior',
        objective_ids_json: JSON.stringify(['oa-4']),
        lesson_plan_id: 'lp-3',
      },
      {
        id: 's-outside-institution',
        institution_id: 'inst-2',
        academic_year_id: 'year-1',
        course_id: 'course-99',
        subject_id: 'subject-99',
        teacher_id: 'teacher-99',
        date: '2026-03-07',
        status: 'completed',
        taught_content: 'No debe aparecer',
        objective_ids_json: JSON.stringify(['oa-x']),
        lesson_plan_id: 'lp-99',
      },
      ...(overrides.class_sessions || []),
    ],
    attendance_records: [
      { id: 'a-1', institution_id: 'inst-1', class_session_id: 's-completed-content', student_id: 'student-1', status: 'present' },
      { id: 'a-2', institution_id: 'inst-1', class_session_id: 's-completed-content', student_id: 'student-2', status: 'present' },
      { id: 'a-3', institution_id: 'inst-1', class_session_id: 's-completed-content', student_id: 'student-3', status: 'absent' },
      { id: 'a-4', institution_id: 'inst-1', class_session_id: 's-completed-no-content', student_id: 'student-1', status: 'present' },
      { id: 'a-x', institution_id: 'inst-2', class_session_id: 's-outside-institution', student_id: 'student-x', status: 'present' },
      ...(overrides.attendance_records || []),
    ],
    planning_reviews: [
      { id: 'pr-1', institution_id: 'inst-1', planning_id: 's-completed-content', status: 'pending' },
      { id: 'pr-2', institution_id: 'inst-1', planning_id: 's-completed-no-content', status: 'observed' },
      { id: 'pr-x', institution_id: 'inst-2', planning_id: 's-outside-institution', status: 'pending' },
      ...(overrides.planning_reviews || []),
    ],
    student_observations: [
      { id: 'obs-1', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', archived_at: null },
      { id: 'obs-archived', institution_id: 'inst-1', academic_year_id: 'year-1', course_id: 'course-1', archived_at: '2026-04-01T00:00:00Z' },
      { id: 'obs-x', institution_id: 'inst-2', academic_year_id: 'year-1', course_id: 'course-99', archived_at: null },
      ...(overrides.student_observations || []),
    ],
    lesson_plan_curriculum: [
      { lesson_plan_id: 'lp-1', objective_id: 'oa-1' },
      { lesson_plan_id: 'lp-1', objective_id: 'oa-2' },
      { lesson_plan_id: 'lp-2', objective_id: 'oa-3' },
      { lesson_plan_id: 'lp-2', objective_id: 'oa-4' },
      { lesson_plan_id: 'lp-99', objective_id: 'oa-x' },
      ...(overrides.lesson_plan_curriculum || []),
    ],
  });
}

async function summary(db: MockD1Database, institutionId = 'inst-1', ctx = auth(), filters = {}) {
  return serviceWith(db).getDashboardSummary(institutionId, ctx, filters);
}

describe('CoordinatorDashboardService.getDashboardSummary', () => {
  it('resumen vacío devuelve ceros', async () => {
    await expect(summary(createMockD1({}))).resolves.toEqual({
      totalCourses: 0,
      totalTeachers: 0,
      sessionsScheduled: 0,
      sessionsCompleted: 0,
      sessionsPending: 0,
      sessionsWithoutContent: 0,
      sessionsWithoutAttendance: 0,
      sessionsPendingSignature: 0,
      planningReviewsPending: 0,
      planningReviewsObserved: 0,
      averageAttendanceRate: 0,
      openObservations: 0,
      estimatedCoveragePercent: 0,
    });
  });

  it('filtra por institutionId', async () => {
    const result = await summary(dashboardDb(), 'inst-2', auth('super_admin'));
    expect(result.sessionsCompleted).toBe(1);
    expect(result.totalCourses).toBe(1);
  });

  it('filtra por courseIds', async () => {
    const result = await summary(dashboardDb(), 'inst-1', auth('coordinator', { courseIds: ['course-1'] }));
    expect(result.totalCourses).toBe(1);
    expect(result.sessionsCompleted).toBe(3);
    expect(result.sessionsPending).toBe(0);
  });

  it('filtra por subjectIds', async () => {
    const result = await summary(dashboardDb(), 'inst-1', auth('coordinator', { subjectIds: ['subject-2'] }));
    expect(result.totalCourses).toBe(1);
    expect(result.sessionsCompleted).toBe(1);
    expect(result.sessionsPending).toBe(2);
  });

  it('filtra por academicYearIds', async () => {
    const result = await summary(dashboardDb(), 'inst-1', auth('coordinator', { academicYearIds: ['year-1'] }));
    expect(result.sessionsCompleted).toBe(3);
    expect(result.sessionsScheduled).toBe(1);
  });

  it('filtra por teacherId', async () => {
    const result = await summary(dashboardDb(), 'inst-1', auth(), { teacherId: 'teacher-2' });
    expect(result.totalTeachers).toBe(1);
    expect(result.sessionsCompleted).toBe(1);
    expect(result.sessionsPending).toBe(2);
  });

  it('calcula sesiones programadas', async () => {
    expect((await summary(dashboardDb())).sessionsScheduled).toBe(1);
  });

  it('calcula sesiones completadas', async () => {
    expect((await summary(dashboardDb())).sessionsCompleted).toBe(4);
  });

  it('calcula sesiones pendientes', async () => {
    expect((await summary(dashboardDb())).sessionsPending).toBe(2);
  });

  it('calcula sesiones sin contenido', async () => {
    expect((await summary(dashboardDb())).sessionsWithoutContent).toBe(1);
  });

  it('calcula sesiones sin asistencia', async () => {
    expect((await summary(dashboardDb())).sessionsWithoutAttendance).toBe(2);
  });

  it('calcula firmas pendientes', async () => {
    expect((await summary(dashboardDb())).sessionsPendingSignature).toBe(1);
  });

  it('calcula revisiones pendientes', async () => {
    const result = await summary(dashboardDb());
    expect(result.planningReviewsPending).toBe(1);
    expect(result.planningReviewsObserved).toBe(1);
  });

  it('calcula asistencia promedio', async () => {
    expect((await summary(dashboardDb())).averageAttendanceRate).toBe(75);
  });

  it('calcula cobertura curricular', async () => {
    expect((await summary(dashboardDb())).estimatedCoveragePercent).toBe(100);
  });

  it('no devuelve datos fuera del scope', async () => {
    const result = await summary(
      dashboardDb(),
      'inst-1',
      auth('coordinator', { courseIds: ['course-1'], subjectIds: ['subject-1'], academicYearIds: ['year-1'] }),
    );

    expect(result.totalCourses).toBe(1);
    expect(result.totalTeachers).toBe(1);
    expect(result.sessionsPending).toBe(0);
    expect(result.sessionsCompleted).toBe(2);
  });
});
