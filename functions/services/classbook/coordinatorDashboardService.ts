import { D1Database } from '@cloudflare/workers-types';
import { AuthenticatedUserContext, CoordinatorScope } from '../../core/authorization';
import {
  CoordinatorDashboardSummary,
  CoordinatorTeacherSummary,
  CoordinatorCourseSummary,
  CoordinatorSessionSummary,
  CoordinatorPlanningSummary,
  CoordinatorSignatureSummary,
  CoordinatorCoverageSummary,
  CoordinatorAlert,
  CoordinatorDashboardFilters,
} from '../../types/classbookCoordinator';

export interface CoordinatorDashboardServiceEnv {
  DB: D1Database;
}

export interface CoordinatorFilterOptions {
  academicYears: { id: string; name: string }[];
  terms: { id: string; name: string }[];
  courses: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
}

async function getCoordinatorScope(
  db: D1Database,
  userId: string,
  institutionId: string
): Promise<CoordinatorScope | null> {
  const row = await db.prepare(
    `SELECT course_ids_json, subject_ids_json, level_ids_json, academic_year_id
     FROM coordinator_scopes
     WHERE user_id = ? AND institution_id = ? AND is_active = 1`
  ).bind(userId, institutionId).first<{
    course_ids_json: string;
    subject_ids_json: string;
    level_ids_json: string;
    academic_year_id: string | null;
  }>();

  if (!row) return null;

  return {
    institutionId,
    courseIds: JSON.parse(row.course_ids_json || '[]'),
    subjectIds: JSON.parse(row.subject_ids_json || '[]'),
    levelIds: JSON.parse(row.level_ids_json || '[]'),
    academicYearIds: row.academic_year_id ? [row.academic_year_id] : [],
  };
}

function applyScopeFilter(
  baseQuery: string,
  conditions: string[],
  scope: CoordinatorScope | null,
  role: string
): { query: string; conditions: string[] } {
  if (role === 'super_admin' || role === 'institution_admin' || !scope) {
    return { query: baseQuery, conditions };
  }
  if (scope.courseIds.length > 0) {
    conditions.push(`cs.course_id IN (${scope.courseIds.map(() => '?').join(',')})`);
  }
  if (scope.subjectIds.length > 0) {
    conditions.push(`cs.subject_id IN (${scope.subjectIds.map(() => '?').join(',')})`);
  }
  return { query: baseQuery, conditions };
}

function scopeBindValues(scope: CoordinatorScope | null, role: string): string[] {
  if (role === 'super_admin' || role === 'institution_admin' || !scope) return [];
  const values: string[] = [];
  if (scope.courseIds.length > 0) values.push(...scope.courseIds);
  if (scope.subjectIds.length > 0) values.push(...scope.subjectIds);
  return values;
}

export class CoordinatorDashboardService {
  private db: D1Database;

  constructor(env: CoordinatorDashboardServiceEnv) {
    this.db = env.DB;
  }

  async getDashboardSummary(
    institutionId: string,
    authContext: AuthenticatedUserContext,
    filters: CoordinatorDashboardFilters
  ): Promise<CoordinatorDashboardSummary> {
    const scope = authContext.scope || await getCoordinatorScope(this.db, authContext.userId, institutionId);
    const role = authContext.role;

    const conditions: string[] = ['cs.institution_id = ?'];
    const bindValues: string[] = [institutionId];

    if (filters.academicYearId) {
      conditions.push('cs.academic_year_id = ?');
      bindValues.push(filters.academicYearId);
    } else if (scope?.academicYearIds?.length && role === 'coordinator') {
      conditions.push(`cs.academic_year_id IN (${scope.academicYearIds.map(() => '?').join(',')})`);
      bindValues.push(...scope.academicYearIds);
    }

    if (filters.courseId) {
      conditions.push('cs.course_id = ?');
      bindValues.push(filters.courseId);
    }
    if (filters.subjectId) {
      conditions.push('cs.subject_id = ?');
      bindValues.push(filters.subjectId);
    }
    if (filters.teacherId) {
      conditions.push('cs.teacher_id = ?');
      bindValues.push(filters.teacherId);
    }
    if (filters.dateFrom) {
      conditions.push('cs.date >= ?');
      bindValues.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push('cs.date <= ?');
      bindValues.push(filters.dateTo);
    }

    if (scope && role === 'coordinator') {
      if (scope.courseIds.length > 0) {
        conditions.push(`cs.course_id IN (${scope.courseIds.map(() => '?').join(',')})`);
        bindValues.push(...scope.courseIds);
      }
      if (scope.subjectIds.length > 0) {
        conditions.push(`cs.subject_id IN (${scope.subjectIds.map(() => '?').join(',')})`);
        bindValues.push(...scope.subjectIds);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sessionsRow = await this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN cs.status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN cs.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN cs.status IN ('open','pending_signature') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN cs.status = 'completed' AND (cs.taught_content IS NULL OR cs.taught_content = '') THEN 1 ELSE 0 END) as no_content,
        SUM(CASE WHEN cs.status = 'completed' AND cs.id NOT IN (SELECT class_session_id FROM attendance_records WHERE class_session_id = cs.id) THEN 1 ELSE 0 END) as no_attendance,
        SUM(CASE WHEN cs.status = 'pending_signature' THEN 1 ELSE 0 END) as pending_signature,
        COUNT(DISTINCT cs.teacher_id) as teachers,
        COUNT(DISTINCT cs.course_id) as courses
      FROM class_sessions cs
      ${whereClause}
    `).bind(...bindValues).first<{
      total: number;
      scheduled: number;
      completed: number;
      pending: number;
      no_content: number;
      no_attendance: number;
      pending_signature: number;
      teachers: number;
      courses: number;
    }>();

    const reviewConditions = ['pr.institution_id = ?'];
    const reviewBindValues: string[] = [institutionId];
    if (filters.academicYearId) {
      reviewConditions.push('cs.academic_year_id = ?');
      reviewBindValues.push(filters.academicYearId);
    }
    if (scope && role === 'coordinator' && scope.courseIds.length > 0) {
      reviewConditions.push(`cs.course_id IN (${scope.courseIds.map(() => '?').join(',')})`);
      reviewBindValues.push(...scope.courseIds);
    }

    const reviewsRow = await this.db.prepare(`
      SELECT
        SUM(CASE WHEN pr.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN pr.status = 'observed' THEN 1 ELSE 0 END) as observed
      FROM planning_reviews pr
      LEFT JOIN class_sessions cs ON pr.planning_id = cs.id
      WHERE ${reviewConditions.join(' AND ')}
    `).bind(...reviewBindValues).first<{ pending: number; observed: number }>();

    const attendanceConditions = ['ar.institution_id = ?'];
    const attendanceBindValues: string[] = [institutionId];
    if (filters.academicYearId) {
      attendanceConditions.push('cs.academic_year_id = ?');
      attendanceBindValues.push(filters.academicYearId);
    }
    if (scope && role === 'coordinator' && scope.courseIds.length > 0) {
      attendanceConditions.push(`cs.course_id IN (${scope.courseIds.map(() => '?').join(',')})`);
      attendanceBindValues.push(...scope.courseIds);
    }

    const attendanceRow = await this.db.prepare(`
      SELECT
        COUNT(*) as total_records,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count
      FROM attendance_records ar
      JOIN class_sessions cs ON ar.class_session_id = cs.id
      WHERE ${attendanceConditions.join(' AND ')}
    `).bind(...attendanceBindValues).first<{ total_records: number; present_count: number }>();

    const obsConditions = ['so.institution_id = ?'];
    const obsBindValues: string[] = [institutionId];
    if (filters.academicYearId) {
      obsConditions.push('so.academic_year_id = ?');
      obsBindValues.push(filters.academicYearId);
    }
    if (scope && role === 'coordinator' && scope.courseIds.length > 0) {
      obsConditions.push(`so.course_id IN (${scope.courseIds.map(() => '?').join(',')})`);
      obsBindValues.push(...scope.courseIds);
    }

    const obsRow = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM student_observations so
      WHERE ${obsConditions.join(' AND ')} AND so.archived_at IS NULL
    `).bind(...obsBindValues).first<{ count: number }>();

    const coverageRow = await this.db.prepare(`
      SELECT
        COUNT(DISTINCT lpc.objective_id) as total_oa
      FROM lesson_plan_curriculum lpc
      JOIN lesson_plans lp ON lpc.lesson_plan_id = lp.id
      JOIN class_sessions cs ON cs.lesson_plan_id = lp.id
      WHERE cs.institution_id = ?
      ${filters.academicYearId ? 'AND cs.academic_year_id = ?' : ''}
    `).bind(...(filters.academicYearId ? [institutionId, filters.academicYearId] : [institutionId])).first<{ total_oa: number }>();

    const workedRow = await this.db.prepare(`
      SELECT COUNT(DISTINCT json_each.value) as worked_oa
      FROM class_sessions cs, json_each(cs.objective_ids_json)
      WHERE cs.institution_id = ? AND cs.status = 'completed'
      ${filters.academicYearId ? 'AND cs.academic_year_id = ?' : ''}
    `).bind(...(filters.academicYearId ? [institutionId, filters.academicYearId] : [institutionId])).first<{ worked_oa: number }>();

    const totalOA = coverageRow?.total_oa || 0;
    const workedOA = workedRow?.worked_oa || 0;
    const totalRecords = attendanceRow?.total_records || 0;
    const presentCount = attendanceRow?.present_count || 0;

    return {
      totalCourses: sessionsRow?.courses || 0,
      totalTeachers: sessionsRow?.teachers || 0,
      sessionsScheduled: sessionsRow?.scheduled || 0,
      sessionsCompleted: sessionsRow?.completed || 0,
      sessionsPending: sessionsRow?.pending || 0,
      sessionsWithoutContent: sessionsRow?.no_content || 0,
      sessionsWithoutAttendance: sessionsRow?.no_attendance || 0,
      sessionsPendingSignature: sessionsRow?.pending_signature || 0,
      planningReviewsPending: reviewsRow?.pending || 0,
      planningReviewsObserved: reviewsRow?.observed || 0,
      averageAttendanceRate: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
      openObservations: obsRow?.count || 0,
      estimatedCoveragePercent: totalOA > 0 ? Math.round((workedOA / totalOA) * 100) : 0,
    };
  }

  async getTeachersSummary(
    institutionId: string,
    authContext: AuthenticatedUserContext,
    filters: CoordinatorDashboardFilters
  ): Promise<CoordinatorTeacherSummary[]> {
    const scope = authContext.scope || await getCoordinatorScope(this.db, authContext.userId, institutionId);
    const role = authContext.role;

    const conditions: string[] = ['cs.institution_id = ?'];
    const bindValues: string[] = [institutionId];

    if (filters.academicYearId) {
      conditions.push('cs.academic_year_id = ?');
      bindValues.push(filters.academicYearId);
    }
    if (filters.courseId) {
      conditions.push('cs.course_id = ?');
      bindValues.push(filters.courseId);
    }
    if (filters.subjectId) {
      conditions.push('cs.subject_id = ?');
      bindValues.push(filters.subjectId);
    }
    if (scope && role === 'coordinator' && scope.courseIds.length > 0) {
      conditions.push(`cs.course_id IN (${scope.courseIds.map(() => '?').join(',')})`);
      bindValues.push(...scope.courseIds);
    }

    const whereClause = conditions.join(' AND ');

    const rows = await this.db.prepare(`
      SELECT
        cs.teacher_id,
        u.nombre as teacher_name,
        COUNT(*) as total_sessions,
        SUM(CASE WHEN cs.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN cs.status IN ('scheduled','open') THEN 1 ELSE 0 END) as pending,
        COUNT(DISTINCT cs.course_id) as course_count
      FROM class_sessions cs
      JOIN usuarios u ON cs.teacher_id = u.id
      WHERE ${whereClause}
      GROUP BY cs.teacher_id, u.nombre
      ORDER BY u.nombre
    `).bind(...bindValues).all<{
      teacher_id: string;
      teacher_name: string;
      total_sessions: number;
      completed: number;
      pending: number;
      course_count: number;
    }>();

    const results: CoordinatorTeacherSummary[] = [];

    for (const row of rows.results) {
      const pendingSigs = await this.db.prepare(`
        SELECT COUNT(*) as count
        FROM class_sessions cs
        WHERE cs.teacher_id = ? AND cs.institution_id = ? AND cs.status = 'pending_signature'
      `).bind(row.teacher_id, institutionId).first<{ count: number }>();

      const pendingRevs = await this.db.prepare(`
        SELECT COUNT(*) as count
        FROM planning_reviews pr
        JOIN class_sessions cs ON pr.planning_id = cs.id
        WHERE cs.teacher_id = ? AND pr.institution_id = ? AND pr.status = 'pending'
      `).bind(row.teacher_id, institutionId).first<{ count: number }>();

      const noAttend = await this.db.prepare(`
        SELECT COUNT(*) as count
        FROM class_sessions cs
        WHERE cs.teacher_id = ? AND cs.institution_id = ? AND cs.status = 'completed'
        AND cs.id NOT IN (SELECT class_session_id FROM attendance_records WHERE class_session_id = cs.id)
      `).bind(row.teacher_id, institutionId).first<{ count: number }>();

      const teacherCourses = await this.db.prepare(`
        SELECT DISTINCT tc.name as course_name
        FROM class_sessions cs
        JOIN teacher_classes tc ON cs.course_id = tc.id
        WHERE cs.teacher_id = ? AND cs.institution_id = ?
        ${filters.academicYearId ? 'AND cs.academic_year_id = ?' : ''}
      `).bind(...(filters.academicYearId ? [row.teacher_id, institutionId, filters.academicYearId] : [row.teacher_id, institutionId])).all<{ course_name: string }>();

      const compliancePercent = row.total_sessions > 0
        ? Math.round((row.completed / row.total_sessions) * 100)
        : 0;

      results.push({
        teacherId: row.teacher_id,
        teacherName: row.teacher_name,
        courses: teacherCourses.results.map(c => c.course_name),
        sessionsPlanned: row.total_sessions,
        sessionsCompleted: row.completed,
        sessionsPending: row.pending,
        sessionsWithoutAttendance: noAttend?.count || 0,
        pendingSignatures: pendingSigs?.count || 0,
        pendingReviews: pendingRevs?.count || 0,
        compliancePercent,
      });
    }

    return results;
  }

  async getCoursesSummary(
    institutionId: string,
    authContext: AuthenticatedUserContext,
    filters: CoordinatorDashboardFilters
  ): Promise<CoordinatorCourseSummary[]> {
    const scope = authContext.scope || await getCoordinatorScope(this.db, authContext.userId, institutionId);
    const role = authContext.role;

    const conditions: string[] = ['cs.institution_id = ?'];
    const bindValues: string[] = [institutionId];

    if (filters.academicYearId) {
      conditions.push('cs.academic_year_id = ?');
      bindValues.push(filters.academicYearId);
    }
    if (filters.subjectId) {
      conditions.push('cs.subject_id = ?');
      bindValues.push(filters.subjectId);
    }
    if (filters.teacherId) {
      conditions.push('cs.teacher_id = ?');
      bindValues.push(filters.teacherId);
    }
    if (scope && role === 'coordinator' && scope.courseIds.length > 0) {
      conditions.push(`cs.course_id IN (${scope.courseIds.map(() => '?').join(',')})`);
      bindValues.push(...scope.courseIds);
    }

    const whereClause = conditions.join(' AND ');

    const rows = await this.db.prepare(`
      SELECT
        cs.course_id,
        tc.name as course_name,
        sub.name as subject_name,
        u.nombre as teacher_name,
        COUNT(*) as total_sessions,
        SUM(CASE WHEN cs.status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM class_sessions cs
      JOIN teacher_classes tc ON cs.course_id = tc.id
      JOIN subjects sub ON cs.subject_id = sub.id
      JOIN usuarios u ON cs.teacher_id = u.id
      WHERE ${whereClause}
      GROUP BY cs.course_id, tc.name, sub.name, u.nombre
      ORDER BY tc.name, sub.name
    `).bind(...bindValues).all<{
      course_id: string;
      course_name: string;
      subject_name: string;
      teacher_name: string;
      total_sessions: number;
      completed: number;
    }>();

    const results: CoordinatorCourseSummary[] = [];

    for (const row of rows.results) {
      const attendRow = await this.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count
        FROM attendance_records ar
        WHERE ar.class_session_id IN (
          SELECT cs2.id FROM class_sessions cs2
          WHERE cs2.course_id = ? AND cs2.institution_id = ? AND cs2.status = 'completed'
        )
      `).bind(row.course_id, institutionId).first<{ total: number; present_count: number }>();

      const revRow = await this.db.prepare(`
        SELECT COUNT(*) as count
        FROM planning_reviews pr
        JOIN class_sessions cs2 ON pr.planning_id = cs2.id
        WHERE cs2.course_id = ? AND pr.institution_id = ? AND pr.status = 'pending'
      `).bind(row.course_id, institutionId).first<{ count: number }>();

      const oaRow = await this.db.prepare(`
        SELECT COUNT(DISTINCT lpc.objective_id) as total_oa
        FROM lesson_plan_curriculum lpc
        JOIN lesson_plans lp ON lpc.lesson_plan_id = lp.id
        JOIN class_sessions cs2 ON cs2.lesson_plan_id = lp.id
        WHERE cs2.course_id = ? AND cs2.institution_id = ?
      `).bind(row.course_id, institutionId).first<{ total_oa: number }>();

      const workedRow = await this.db.prepare(`
        SELECT COUNT(DISTINCT json_each.value) as worked_oa
        FROM class_sessions cs2, json_each(cs2.objective_ids_json)
        WHERE cs2.course_id = ? AND cs2.institution_id = ? AND cs2.status = 'completed'
      `).bind(row.course_id, institutionId).first<{ worked_oa: number }>();

      const total = attendRow?.total || 0;
      const present = attendRow?.present_count || 0;
      const totalOA = oaRow?.total_oa || 0;
      const workedOA = workedRow?.worked_oa || 0;

      results.push({
        courseId: row.course_id,
        courseName: row.course_name,
        subjectName: row.subject_name,
        teacherName: row.teacher_name,
        sessionsTotal: row.total_sessions,
        sessionsCompleted: row.completed,
        attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
        pendingReviews: revRow?.count || 0,
        coveragePercent: totalOA > 0 ? Math.round((workedOA / totalOA) * 100) : 0,
      });
    }

    return results;
  }

  async getSessionsSummary(
    institutionId: string,
    authContext: AuthenticatedUserContext,
    filters: CoordinatorDashboardFilters
  ): Promise<CoordinatorSessionSummary[]> {
    const scope = authContext.scope || await getCoordinatorScope(this.db, authContext.userId, institutionId);
    const role = authContext.role;

    const conditions: string[] = ['cs.institution_id = ?'];
    const bindValues: string[] = [institutionId];

    if (filters.academicYearId) {
      conditions.push('cs.academic_year_id = ?');
      bindValues.push(filters.academicYearId);
    }
    if (filters.courseId) {
      conditions.push('cs.course_id = ?');
      bindValues.push(filters.courseId);
    }
    if (filters.subjectId) {
      conditions.push('cs.subject_id = ?');
      bindValues.push(filters.subjectId);
    }
    if (filters.teacherId) {
      conditions.push('cs.teacher_id = ?');
      bindValues.push(filters.teacherId);
    }
    if (filters.status) {
      conditions.push('cs.status = ?');
      bindValues.push(filters.status);
    }
    if (filters.dateFrom) {
      conditions.push('cs.date >= ?');
      bindValues.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push('cs.date <= ?');
      bindValues.push(filters.dateTo);
    }
    if (scope && role === 'coordinator' && scope.courseIds.length > 0) {
      conditions.push(`cs.course_id IN (${scope.courseIds.map(() => '?').join(',')})`);
      bindValues.push(...scope.courseIds);
    }

    const whereClause = conditions.join(' AND ');

    const rows = await this.db.prepare(`
      SELECT
        cs.id as session_id,
        cs.date,
        tc.name as course_name,
        sub.name as subject_name,
        u.nombre as teacher_name,
        cs.status,
        cs.version,
        CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END as has_attendance,
        CASE WHEN se.id IS NOT NULL THEN 1 ELSE 0 END as has_signature
      FROM class_sessions cs
      JOIN teacher_classes tc ON cs.course_id = tc.id
      JOIN subjects sub ON cs.subject_id = sub.id
      JOIN usuarios u ON cs.teacher_id = u.id
      LEFT JOIN attendance_records ar ON ar.class_session_id = cs.id
      LEFT JOIN signature_events se ON se.class_session_id = cs.id AND se.result = 'success'
      WHERE ${whereClause}
      GROUP BY cs.id, cs.date, tc.name, sub.name, u.nombre, cs.status, cs.version
      ORDER BY cs.date DESC
      LIMIT 200
    `).bind(...bindValues).all<{
      session_id: string;
      date: string;
      course_name: string;
      subject_name: string;
      teacher_name: string;
      status: string;
      version: number;
      has_attendance: number;
      has_signature: number;
    }>();

    return rows.results.map(row => ({
      sessionId: row.session_id,
      date: row.date,
      courseName: row.course_name,
      subjectName: row.subject_name,
      teacherName: row.teacher_name,
      status: row.status,
      hasAttendance: row.has_attendance === 1,
      hasSignature: row.has_signature === 1,
      version: row.version,
    }));
  }

  async getPendingReviews(
    institutionId: string,
    authContext: AuthenticatedUserContext,
    filters: CoordinatorDashboardFilters
  ): Promise<CoordinatorPlanningSummary[]> {
    const scope = authContext.scope || await getCoordinatorScope(this.db, authContext.userId, institutionId);
    const role = authContext.role;

    const conditions: string[] = ['pr.institution_id = ?', "pr.status = 'pending'"];
    const bindValues: string[] = [institutionId];

    if (filters.academicYearId) {
      conditions.push('cs.academic_year_id = ?');
      bindValues.push(filters.academicYearId);
    }
    if (scope && role === 'coordinator' && scope.courseIds.length > 0) {
      conditions.push(`cs.course_id IN (${scope.courseIds.map(() => '?').join(',')})`);
      bindValues.push(...scope.courseIds);
    }

    const whereClause = conditions.join(' AND ');

    const rows = await this.db.prepare(`
      SELECT
        pr.id as review_id,
        pr.planning_id,
        u.nombre as teacher_name,
        tc.name as course_name,
        sub.name as subject_name,
        pr.status,
        pr.comments,
        pr.created_at
      FROM planning_reviews pr
      LEFT JOIN class_sessions cs ON pr.planning_id = cs.id
      LEFT JOIN usuarios u ON cs.teacher_id = u.id
      LEFT JOIN teacher_classes tc ON cs.course_id = tc.id
      LEFT JOIN subjects sub ON cs.subject_id = sub.id
      WHERE ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT 100
    `).bind(...bindValues).all<{
      review_id: string;
      planning_id: string;
      teacher_name: string;
      course_name: string;
      subject_name: string;
      status: string;
      comments: string | null;
      created_at: string;
    }>();

    return rows.results.map(row => ({
      reviewId: row.review_id,
      planningId: row.planning_id,
      teacherName: row.teacher_name || 'N/A',
      courseName: row.course_name || 'N/A',
      subjectName: row.subject_name || 'N/A',
      status: row.status,
      comments: row.comments,
      createdAt: row.created_at,
    }));
  }

  async getPendingSignatures(
    institutionId: string,
    authContext: AuthenticatedUserContext,
    filters: CoordinatorDashboardFilters
  ): Promise<CoordinatorSignatureSummary[]> {
    const scope = authContext.scope || await getCoordinatorScope(this.db, authContext.userId, institutionId);
    const role = authContext.role;

    const conditions: string[] = ['cs.institution_id = ?', "cs.status = 'pending_signature'"];
    const bindValues: string[] = [institutionId];

    if (filters.academicYearId) {
      conditions.push('cs.academic_year_id = ?');
      bindValues.push(filters.academicYearId);
    }
    if (filters.courseId) {
      conditions.push('cs.course_id = ?');
      bindValues.push(filters.courseId);
    }
    if (filters.teacherId) {
      conditions.push('cs.teacher_id = ?');
      bindValues.push(filters.teacherId);
    }
    if (scope && role === 'coordinator' && scope.courseIds.length > 0) {
      conditions.push(`cs.course_id IN (${scope.courseIds.map(() => '?').join(',')})`);
      bindValues.push(...scope.courseIds);
    }

    const whereClause = conditions.join(' AND ');

    const rows = await this.db.prepare(`
      SELECT
        cs.id as session_id,
        u.nombre as teacher_name,
        tc.name as course_name,
        sub.name as subject_name,
        cs.date,
        cs.version,
        cs.status,
        cs.updated_at as pending_since
      FROM class_sessions cs
      JOIN usuarios u ON cs.teacher_id = u.id
      JOIN teacher_classes tc ON cs.course_id = tc.id
      JOIN subjects sub ON cs.subject_id = sub.id
      WHERE ${whereClause}
      ORDER BY cs.date ASC
      LIMIT 100
    `).bind(...bindValues).all<{
      session_id: string;
      teacher_name: string;
      course_name: string;
      subject_name: string;
      date: string;
      version: number;
      status: string;
      pending_since: string;
    }>();

    return rows.results.map(row => ({
      sessionId: row.session_id,
      teacherName: row.teacher_name,
      courseName: row.course_name,
      subjectName: row.subject_name,
      date: row.date,
      version: row.version,
      status: row.status,
      pendingSince: row.pending_since,
    }));
  }

  async getCoverage(
    institutionId: string,
    authContext: AuthenticatedUserContext,
    filters: CoordinatorDashboardFilters
  ): Promise<CoordinatorCoverageSummary[]> {
    const scope = authContext.scope || await getCoordinatorScope(this.db, authContext.userId, institutionId);
    const role = authContext.role;

    const conditions: string[] = ['cs.institution_id = ?'];
    const bindValues: string[] = [institutionId];

    if (filters.academicYearId) {
      conditions.push('cs.academic_year_id = ?');
      bindValues.push(filters.academicYearId);
    }
    if (filters.courseId) {
      conditions.push('cs.course_id = ?');
      bindValues.push(filters.courseId);
    }
    if (filters.subjectId) {
      conditions.push('cs.subject_id = ?');
      bindValues.push(filters.subjectId);
    }
    if (scope && role === 'coordinator' && scope.courseIds.length > 0) {
      conditions.push(`cs.course_id IN (${scope.courseIds.map(() => '?').join(',')})`);
      bindValues.push(...scope.courseIds);
    }

    const whereClause = conditions.join(' AND ');

    const rows = await this.db.prepare(`
      SELECT
        cs.course_id,
        tc.name as course_name,
        sub.name as subject_name,
        COUNT(DISTINCT lpc.objective_id) as total_oa
      FROM class_sessions cs
      JOIN teacher_classes tc ON cs.course_id = tc.id
      JOIN subjects sub ON cs.subject_id = sub.id
      LEFT JOIN lesson_plans lp ON cs.lesson_plan_id = lp.id
      LEFT JOIN lesson_plan_curriculum lpc ON lpc.lesson_plan_id = lp.id
      WHERE ${whereClause}
      GROUP BY cs.course_id, tc.name, sub.name
      ORDER BY tc.name, sub.name
    `).bind(...bindValues).all<{
      course_id: string;
      course_name: string;
      subject_name: string;
      total_oa: number;
    }>();

    const results: CoordinatorCoverageSummary[] = [];

    for (const row of rows.results) {
      const workedRow = await this.db.prepare(`
        SELECT COUNT(DISTINCT json_each.value) as worked_oa
        FROM class_sessions cs2, json_each(cs2.objective_ids_json)
        WHERE cs2.course_id = ? AND cs2.institution_id = ? AND cs2.status = 'completed'
      `).bind(row.course_id, institutionId).first<{ worked_oa: number }>();

      const plannedRow = await this.db.prepare(`
        SELECT COUNT(DISTINCT lpc.objective_id) as planned_oa
        FROM lesson_plan_curriculum lpc
        JOIN lesson_plans lp ON lpc.lesson_plan_id = lp.id
        JOIN class_sessions cs2 ON cs2.lesson_plan_id = lp.id
        WHERE cs2.course_id = ? AND cs2.institution_id = ? AND cs2.status IN ('completed','signed')
      `).bind(row.course_id, institutionId).first<{ planned_oa: number }>();

      const totalOA = row.total_oa || 0;
      const plannedOA = plannedRow?.planned_oa || 0;
      const workedOA = workedRow?.worked_oa || 0;
      const pendingOA = totalOA - workedOA;

      results.push({
        courseId: row.course_id,
        courseName: row.course_name,
        subjectName: row.subject_name,
        totalOA,
        plannedOA,
        workedOA,
        pendingOA: pendingOA > 0 ? pendingOA : 0,
        coveragePercent: totalOA > 0 ? Math.round((workedOA / totalOA) * 100) : 0,
      });
    }

    return results;
  }

  async getAlerts(
    institutionId: string,
    authContext: AuthenticatedUserContext,
    filters: CoordinatorDashboardFilters
  ): Promise<CoordinatorAlert[]> {
    const scope = authContext.scope || await getCoordinatorScope(this.db, authContext.userId, institutionId);
    const role = authContext.role;
    const alerts: CoordinatorAlert[] = [];
    const now = new Date().toISOString();

    const scopeConditions: string[] = ['cs.institution_id = ?'];
    const scopeValues: string[] = [institutionId];
    if (filters.academicYearId) {
      scopeConditions.push('cs.academic_year_id = ?');
      scopeValues.push(filters.academicYearId);
    }
    if (scope && role === 'coordinator' && scope.courseIds.length > 0) {
      scopeConditions.push(`cs.course_id IN (${scope.courseIds.map(() => '?').join(',')})`);
      scopeValues.push(...scope.courseIds);
    }
    const scopeWhere = scopeConditions.join(' AND ');

    const completedNoSig = await this.db.prepare(`
      SELECT cs.id, cs.date, u.nombre as teacher_name, tc.name as course_name
      FROM class_sessions cs
      JOIN usuarios u ON cs.teacher_id = u.id
      JOIN teacher_classes tc ON cs.course_id = tc.id
      WHERE ${scopeWhere} AND cs.status = 'completed'
      AND cs.id NOT IN (SELECT class_session_id FROM signature_events WHERE result = 'success')
      LIMIT 20
    `).bind(...scopeValues).all<{ id: string; date: string; teacher_name: string; course_name: string }>();

    for (const row of completedNoSig.results) {
      alerts.push({
        id: `alert-sig-${row.id}`,
        type: 'session_completed_no_signature',
        severity: 'warning',
        title: 'Sesión completada sin firma',
        description: `Sesión del ${row.date} (${row.course_name}) completada pero sin firma digital.`,
        resourceType: 'class_session',
        resourceId: row.id,
        teacherId: null,
        courseId: null,
        dueDate: null,
        createdAt: now,
      });
    }

    const pastScheduled = await this.db.prepare(`
      SELECT cs.id, cs.date, u.nombre as teacher_name, tc.name as course_name
      FROM class_sessions cs
      JOIN usuarios u ON cs.teacher_id = u.id
      JOIN teacher_classes tc ON cs.course_id = tc.id
      WHERE ${scopeWhere} AND cs.status = 'scheduled' AND cs.date < date('now')
      LIMIT 20
    `).bind(...scopeValues).all<{ id: string; date: string; teacher_name: string; course_name: string }>();

    for (const row of pastScheduled.results) {
      alerts.push({
        id: `alert-past-${row.id}`,
        type: 'session_past_still_scheduled',
        severity: 'critical',
        title: 'Sesión pasada sin completar',
        description: `Sesión del ${row.date} (${row.course_name}) debería haberse realizado pero sigue como programada.`,
        resourceType: 'class_session',
        resourceId: row.id,
        teacherId: null,
        courseId: null,
        dueDate: null,
        createdAt: now,
      });
    }

    const completedNoAttend = await this.db.prepare(`
      SELECT cs.id, cs.date, u.nombre as teacher_name, tc.name as course_name
      FROM class_sessions cs
      JOIN usuarios u ON cs.teacher_id = u.id
      JOIN teacher_classes tc ON cs.course_id = tc.id
      WHERE ${scopeWhere} AND cs.status = 'completed'
      AND cs.id NOT IN (SELECT class_session_id FROM attendance_records)
      LIMIT 20
    `).bind(...scopeValues).all<{ id: string; date: string; teacher_name: string; course_name: string }>();

    for (const row of completedNoAttend.results) {
      alerts.push({
        id: `alert-attend-${row.id}`,
        type: 'session_completed_no_attendance',
        severity: 'warning',
        title: 'Sesión completada sin asistencia',
        description: `Sesión del ${row.date} (${row.course_name}) completada pero sin registro de asistencia.`,
        resourceType: 'class_session',
        resourceId: row.id,
        teacherId: null,
        courseId: null,
        dueDate: null,
        createdAt: now,
      });
    }

    const pendingReviews = await this.db.prepare(`
      SELECT pr.id, pr.created_at, u.nombre as teacher_name, tc.name as course_name
      FROM planning_reviews pr
      LEFT JOIN class_sessions cs ON pr.planning_id = cs.id
      LEFT JOIN usuarios u ON cs.teacher_id = u.id
      LEFT JOIN teacher_classes tc ON cs.course_id = tc.id
      WHERE pr.institution_id = ? AND pr.status = 'pending'
      ${scope && role === 'coordinator' && scope.courseIds.length > 0
        ? `AND cs.course_id IN (${scope.courseIds.map(() => '?').join(',')})`
        : ''}
      LIMIT 20
    `).bind(...(scope && role === 'coordinator' && scope.courseIds.length > 0
      ? [institutionId, ...scope.courseIds]
      : [institutionId])).all<{ id: string; created_at: string; teacher_name: string; course_name: string }>();

    for (const row of pendingReviews.results) {
      alerts.push({
        id: `alert-review-${row.id}`,
        type: 'planning_pending_review',
        severity: 'info',
        title: 'Planificación pendiente de revisión',
        description: `Revisión pendiente de ${row.teacher_name || 'N/A'} (${row.course_name || 'N/A'}).`,
        resourceType: 'planning_review',
        resourceId: row.id,
        teacherId: null,
        courseId: null,
        dueDate: null,
        createdAt: now,
      });
    }

    const overdueFollowUps = await this.db.prepare(`
      SELECT so.id, so.follow_up_date, so.category, u.nombre as teacher_name
      FROM student_observations so
      LEFT JOIN usuarios u ON so.created_by = u.id
      WHERE so.institution_id = ? AND so.follow_up_date < date('now') AND so.archived_at IS NULL
      ${scope && role === 'coordinator' && scope.courseIds.length > 0
        ? `AND so.course_id IN (${scope.courseIds.map(() => '?').join(',')})`
        : ''}
      LIMIT 20
    `).bind(...(scope && role === 'coordinator' && scope.courseIds.length > 0
      ? [institutionId, ...scope.courseIds]
      : [institutionId])).all<{ id: string; follow_up_date: string; category: string; teacher_name: string }>();

    for (const row of overdueFollowUps.results) {
      alerts.push({
        id: `alert-followup-${row.id}`,
        type: 'observation_follow_up_overdue',
        severity: 'warning',
        title: 'Seguimiento de observación vencido',
        description: `Observación (${row.category}) con seguimiento pendiente desde ${row.follow_up_date}.`,
        resourceType: 'student_observation',
        resourceId: row.id,
        teacherId: null,
        courseId: null,
        dueDate: row.follow_up_date,
        createdAt: now,
      });
    }

    alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return alerts;
  }

  async getFilterOptions(
    institutionId: string,
    authContext: AuthenticatedUserContext
  ): Promise<CoordinatorFilterOptions> {
    const scope = authContext.scope || await getCoordinatorScope(this.db, authContext.userId, institutionId);
    const role = authContext.role;

    const conditions: string[] = ['institution_id = ?'];
    const bindValues: string[] = [institutionId];

    if (scope && role === 'coordinator' && scope.courseIds.length > 0) {
      conditions.push(`id IN (${scope.courseIds.map(() => '?').join(',')})`);
      bindValues.push(...scope.courseIds);
    }

    // Get academic years
    const yearsConditions = ['institution_id = ?'];
    const yearsBind = [institutionId];
    if (scope && role === 'coordinator' && scope.academicYearIds.length > 0) {
      yearsConditions.push(`id IN (${scope.academicYearIds.map(() => '?').join(',')})`);
      yearsBind.push(...scope.academicYearIds);
    }
    const yearsRows = await this.db.prepare(`
      SELECT id, name FROM academic_years
      WHERE ${yearsConditions.join(' AND ')}
      ORDER BY start_date DESC
    `).bind(...yearsBind).all<{ id: string; name: string }>();

    // Get terms
    const termsRows = await this.db.prepare(`
      SELECT at.id, at.name
      FROM academic_terms at
      JOIN academic_years ay ON at.academic_year_id = ay.id
      WHERE ay.institution_id = ?
      ${scope && role === 'coordinator' && scope.academicYearIds.length > 0
        ? `AND at.academic_year_id IN (${scope.academicYearIds.map(() => '?').join(',')})`
        : ''
      }
      ORDER BY at.sort_order
    `).bind(...(scope && role === 'coordinator' && scope.academicYearIds.length > 0
      ? [institutionId, ...scope.academicYearIds]
      : [institutionId])).all<{ id: string; name: string }>();

    // Get courses
    const coursesRows = await this.db.prepare(`
      SELECT id, name FROM teacher_classes
      WHERE ${conditions.join(' AND ')} AND is_active = 1
      ORDER BY name
    `).bind(...bindValues).all<{ id: string; name: string }>();

    // Get subjects
    const subjectsConditions = ['sub.id IN (SELECT DISTINCT cs.subject_id FROM class_sessions cs WHERE ' + conditions.join(' AND ') + ')'];
    const subjectsBind = [...bindValues];
    const subjectsRows = await this.db.prepare(`
      SELECT DISTINCT sub.id, sub.name
      FROM subjects sub
      JOIN class_sessions cs ON cs.subject_id = sub.id
      WHERE cs.${conditions.join(' AND cs.')} AND cs.institution_id = ?
      ORDER BY sub.name
    `).bind(institutionId, ...bindValues).all<{ id: string; name: string }>();

    // Get teachers
    const teachersRows = await this.db.prepare(`
      SELECT DISTINCT u.id, u.nombre as name
      FROM usuarios u
      JOIN class_sessions cs ON cs.teacher_id = u.id
      WHERE cs.${conditions.join(' AND cs.')} AND cs.institution_id = ?
      ORDER BY u.nombre
    `).bind(institutionId, ...bindValues).all<{ id: string; name: string }>();

    return {
      academicYears: yearsRows.results || [],
      terms: termsRows.results || [],
      courses: coursesRows.results || [],
      subjects: subjectsRows.results || [],
      teachers: teachersRows.results || [],
    };
  }
}
