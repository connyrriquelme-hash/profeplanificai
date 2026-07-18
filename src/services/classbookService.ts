import { api } from './apiClient';
import type {
  ClassbookAcademicYear,
  ClassbookTerm,
  ClassbookStudent,
  ClassbookEnrollment,
  ClassbookSession,
  ClassbookAttendanceRecord,
  ClassbookObservation,
  ClassbookPlanningReview,
  ClassbookSignatureStatus,
} from '../types/classbook';
import type {
  CoordinatorDashboardSummary,
  CoordinatorTeacherSummary,
  CoordinatorCourseSummary,
  CoordinatorSessionSummary,
  CoordinatorPlanningSummary,
  CoordinatorSignatureSummary,
  CoordinatorCoverageSummary,
  CoordinatorAlert,
  CoordinatorDashboardFilters,
} from '../types/classbookCoordinator';

interface ApiListResponse<T> {
  ok: boolean;
  data: T[];
  total?: number;
}

interface ApiSingleResponse<T> {
  ok: boolean;
  data: T;
}

interface AttendanceBatchResult {
  ok: boolean;
  data: {
    created: number;
    updated: number;
    records: ClassbookAttendanceRecord[];
  };
}

function buildClassbookUrl(
  endpoint: string,
  params?: Record<string, string | undefined>,
  institutionId?: string
): string {
  const search = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
  }
  if (institutionId) search.set('institution_id', institutionId);
  const qs = search.toString();
  return qs ? `${endpoint}?${qs}` : endpoint;
}

export const classbookService = {
  async getAcademicYears(institutionId: string, signal?: AbortSignal): Promise<ClassbookAcademicYear[]> {
    const res = await api.get<ApiListResponse<ClassbookAcademicYear>>(
      buildClassbookUrl('/api/classbook/academic-years', undefined, institutionId),
      signal
    );
    return res.data ?? [];
  },

  async getAcademicTerms(yearId: string, institutionId?: string, signal?: AbortSignal): Promise<ClassbookTerm[]> {
    const res = await api.get<ApiListResponse<ClassbookTerm>>(
      buildClassbookUrl('/api/classbook/academic-terms', { academic_year_id: yearId }, institutionId),
      signal
    );
    return res.data ?? [];
  },

  async getStudents(institutionId: string, signal?: AbortSignal): Promise<ClassbookStudent[]> {
    const res = await api.get<ApiListResponse<ClassbookStudent>>(
      buildClassbookUrl('/api/classbook/students', undefined, institutionId),
      signal
    );
    return res.data ?? [];
  },

  async getEnrollments(yearId: string, institutionId?: string, courseId?: string, signal?: AbortSignal): Promise<ClassbookEnrollment[]> {
    const res = await api.get<ApiListResponse<ClassbookEnrollment>>(
      buildClassbookUrl('/api/classbook/enrollments', { academic_year_id: yearId, course_id: courseId }, institutionId),
      signal
    );
    return res.data ?? [];
  },

  async getClassSessions(yearId: string, institutionId?: string, filters?: { course_id?: string; teacher_id?: string; status?: string }, signal?: AbortSignal): Promise<ClassbookSession[]> {
    const res = await api.get<ApiListResponse<ClassbookSession>>(
      buildClassbookUrl('/api/classbook/sessions', { academic_year_id: yearId, ...filters }, institutionId),
      signal
    );
    return res.data ?? [];
  },

  async getClassSessionById(sessionId: string, institutionId?: string, signal?: AbortSignal): Promise<ClassbookSession | null> {
    const res = await api.get<ApiSingleResponse<ClassbookSession>>(
      buildClassbookUrl(`/api/classbook/sessions/${sessionId}`, undefined, institutionId),
      signal
    );
    return res.data ?? null;
  },

  async createClassSessionFromLesson(lessonInstanceId: string, institutionId?: string, signal?: AbortSignal): Promise<ClassbookSession> {
    const res = await api.post<ApiSingleResponse<ClassbookSession>>(
      buildClassbookUrl('/api/classbook/sessions/from-lesson', undefined, institutionId),
      { lesson_instance_id: lessonInstanceId },
      signal
    );
    return res.data;
  },

  async updateClassSession(sessionId: string, data: Partial<ClassbookSession>, institutionId?: string, signal?: AbortSignal): Promise<ClassbookSession> {
    const res = await api.patch<ApiSingleResponse<ClassbookSession>>(
      buildClassbookUrl(`/api/classbook/sessions/${sessionId}`, undefined, institutionId),
      data,
      signal
    );
    return res.data;
  },

  async completeClassSession(sessionId: string, finalize: boolean, institutionId?: string, signal?: AbortSignal): Promise<ClassbookSession> {
    const res = await api.post<ApiSingleResponse<ClassbookSession>>(
      buildClassbookUrl(`/api/classbook/sessions/${sessionId}/complete`, undefined, institutionId),
      { finalize },
      signal
    );
    return res.data;
  },

  async getSessionVersions(sessionId: string, institutionId?: string, signal?: AbortSignal): Promise<unknown[]> {
    const res = await api.get<ApiListResponse<unknown>>(
      buildClassbookUrl(`/api/classbook/sessions/${sessionId}/versions`, undefined, institutionId),
      signal
    );
    return res.data ?? [];
  },

  async getAttendance(sessionId: string, institutionId?: string, signal?: AbortSignal): Promise<ClassbookAttendanceRecord[]> {
    const res = await api.get<ApiListResponse<ClassbookAttendanceRecord>>(
      buildClassbookUrl(`/api/classbook/sessions/${sessionId}/attendance`, undefined, institutionId),
      signal
    );
    return res.data ?? [];
  },

  async saveAttendance(sessionId: string, records: { student_id: string; status: string; justification?: string }[], recordedBy: string, institutionId?: string, signal?: AbortSignal): Promise<AttendanceBatchResult['data']> {
    const res = await api.put<AttendanceBatchResult>(
      buildClassbookUrl(`/api/classbook/sessions/${sessionId}/attendance`, undefined, institutionId),
      { records, recorded_by: recordedBy },
      signal
    );
    return res.data;
  },

  async getObservations(institutionId: string, filters?: { course_id?: string; student_id?: string; class_session_id?: string }, signal?: AbortSignal): Promise<ClassbookObservation[]> {
    const res = await api.get<ApiListResponse<ClassbookObservation>>(
      buildClassbookUrl('/api/classbook/observations', filters, institutionId),
      signal
    );
    return res.data ?? [];
  },

  async createObservation(data: {
    academic_year_id: string;
    course_id: string;
    student_id: string;
    category: string;
    content: string;
    visibility?: string;
    class_session_id?: string;
  }, institutionId?: string, signal?: AbortSignal): Promise<ClassbookObservation> {
    const res = await api.post<ApiSingleResponse<ClassbookObservation>>(
      buildClassbookUrl('/api/classbook/observations', undefined, institutionId),
      data,
      signal
    );
    return res.data;
  },

  async updateObservation(obsId: string, data: Partial<ClassbookObservation>, institutionId?: string, signal?: AbortSignal): Promise<ClassbookObservation> {
    const res = await api.patch<ApiSingleResponse<ClassbookObservation>>(
      buildClassbookUrl(`/api/classbook/observations/${obsId}`, undefined, institutionId),
      data,
      signal
    );
    return res.data;
  },

  async archiveObservation(obsId: string, institutionId?: string, signal?: AbortSignal): Promise<ClassbookObservation> {
    const res = await api.del<ApiSingleResponse<ClassbookObservation>>(
      buildClassbookUrl(`/api/classbook/observations/${obsId}`, undefined, institutionId),
      signal
    );
    return res.data;
  },

  async getPlanningReviews(institutionId: string, signal?: AbortSignal): Promise<ClassbookPlanningReview[]> {
    const res = await api.get<ApiListResponse<ClassbookPlanningReview>>(
      buildClassbookUrl('/api/classbook/planning-reviews', undefined, institutionId),
      signal
    );
    return res.data ?? [];
  },

  async createPlanningReview(planningId: string, institutionId?: string, signal?: AbortSignal): Promise<ClassbookPlanningReview> {
    const res = await api.post<ApiSingleResponse<ClassbookPlanningReview>>(
      buildClassbookUrl('/api/classbook/planning-reviews', undefined, institutionId),
      { planning_id: planningId },
      signal
    );
    return res.data;
  },

  async updatePlanningReview(reviewId: string, data: Partial<ClassbookPlanningReview>, institutionId?: string, signal?: AbortSignal): Promise<ClassbookPlanningReview> {
    const res = await api.patch<ApiSingleResponse<ClassbookPlanningReview>>(
      buildClassbookUrl(`/api/classbook/planning-reviews/${reviewId}`, undefined, institutionId),
      data,
      signal
    );
    return res.data;
  },

  async getSignatureStatus(sessionId: string, institutionId?: string, signal?: AbortSignal): Promise<ClassbookSignatureStatus> {
    const res = await api.get<{ ok: boolean; data: ClassbookSignatureStatus }>(
      buildClassbookUrl(`/api/classbook/sessions/${sessionId}/signature`, undefined, institutionId),
      signal
    );
    return res.data ?? { signed: false };
  },

  async getSignatureCredentialStatus(institutionId?: string, signal?: AbortSignal): Promise<import('../types/classbook').SignatureCredentialStatus> {
    const res = await api.get<{ ok: boolean; data: import('../types/classbook').SignatureCredentialStatus }>(
      buildClassbookUrl('/api/classbook/signature-credentials/status', undefined, institutionId),
      signal
    );
    return res.data ?? { configured: false, locked: false, must_change_pin: false, failed_attempts: 0, locked_until: null };
  },

  async setupSignaturePin(pin: string, institutionId?: string, signal?: AbortSignal): Promise<{ configured: boolean; must_change_pin: boolean }> {
    const res = await api.post<{ ok: boolean; data: { configured: boolean; must_change_pin: boolean } }>(
      buildClassbookUrl('/api/classbook/signature-credentials/setup', undefined, institutionId),
      { pin },
      signal
    );
    return res.data;
  },

  async changeSignaturePin(currentPin: string, newPin: string, institutionId?: string, signal?: AbortSignal): Promise<{ changed: boolean }> {
    const res = await api.post<{ ok: boolean; data: { changed: boolean } }>(
      buildClassbookUrl('/api/classbook/signature-credentials/change', undefined, institutionId),
      { current_pin: currentPin, new_pin: newPin },
      signal
    );
    return res.data;
  },

  async signSessionWithPin(sessionId: string, contentHash: string, pin: string, institutionId?: string, signal?: AbortSignal): Promise<{ session: ClassbookSession; signature: unknown }> {
    const res = await api.post<{ ok: boolean; data: { session: ClassbookSession; signature: unknown } }>(
      buildClassbookUrl(`/api/classbook/sessions/${sessionId}/signature`, undefined, institutionId),
      { content_hash: contentHash, pin },
      signal
    );
    return res.data;
  },

  async resetSignaturePin(userId: string, institutionId?: string, signal?: AbortSignal): Promise<{ reset: boolean }> {
    const res = await api.post<{ ok: boolean; data: { reset: boolean } }>(
      buildClassbookUrl(`/api/classbook/signature-credentials/${userId}/reset`, undefined, institutionId),
      {},
      signal
    );
    return res.data;
  },

  async unlockSignaturePin(userId: string, institutionId?: string, signal?: AbortSignal): Promise<{ unlocked: boolean }> {
    const res = await api.post<{ ok: boolean; data: { unlocked: boolean } }>(
      buildClassbookUrl(`/api/classbook/signature-credentials/${userId}/unlock`, undefined, institutionId),
      {},
      signal
    );
    return res.data;
  },

  async getCoordinatorDashboard(filters: CoordinatorDashboardFilters = {}, institutionId?: string, signal?: AbortSignal): Promise<CoordinatorDashboardSummary> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const res = await api.get<{ ok: boolean; data: CoordinatorDashboardSummary }>(
      buildClassbookUrl('/api/classbook/coordinator/dashboard', params, institutionId),
      signal
    );
    return res.data;
  },

  async getCoordinatorTeachers(filters: CoordinatorDashboardFilters = {}, institutionId?: string, signal?: AbortSignal): Promise<CoordinatorTeacherSummary[]> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const res = await api.get<{ ok: boolean; data: CoordinatorTeacherSummary[] }>(
      buildClassbookUrl('/api/classbook/coordinator/teachers', params, institutionId),
      signal
    );
    return res.data;
  },

  async getCoordinatorCourses(filters: CoordinatorDashboardFilters = {}, institutionId?: string, signal?: AbortSignal): Promise<CoordinatorCourseSummary[]> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const res = await api.get<{ ok: boolean; data: CoordinatorCourseSummary[] }>(
      buildClassbookUrl('/api/classbook/coordinator/courses', params, institutionId),
      signal
    );
    return res.data;
  },

  async getCoordinatorSessions(filters: CoordinatorDashboardFilters = {}, institutionId?: string, signal?: AbortSignal): Promise<CoordinatorSessionSummary[]> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const res = await api.get<{ ok: boolean; data: CoordinatorSessionSummary[] }>(
      buildClassbookUrl('/api/classbook/coordinator/sessions', params, institutionId),
      signal
    );
    return res.data;
  },

  async getCoordinatorPlanningReviews(filters: CoordinatorDashboardFilters = {}, institutionId?: string, signal?: AbortSignal): Promise<CoordinatorPlanningSummary[]> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const res = await api.get<{ ok: boolean; data: CoordinatorPlanningSummary[] }>(
      buildClassbookUrl('/api/classbook/coordinator/planning-reviews', params, institutionId),
      signal
    );
    return res.data;
  },

  async getCoordinatorPendingSignatures(filters: CoordinatorDashboardFilters = {}, institutionId?: string, signal?: AbortSignal): Promise<CoordinatorSignatureSummary[]> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const res = await api.get<{ ok: boolean; data: CoordinatorSignatureSummary[] }>(
      buildClassbookUrl('/api/classbook/coordinator/signatures', params, institutionId),
      signal
    );
    return res.data;
  },

  async getCoordinatorCoverage(filters: CoordinatorDashboardFilters = {}, institutionId?: string, signal?: AbortSignal): Promise<CoordinatorCoverageSummary[]> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const res = await api.get<{ ok: boolean; data: CoordinatorCoverageSummary[] }>(
      buildClassbookUrl('/api/classbook/coordinator/coverage', params, institutionId),
      signal
    );
    return res.data;
  },

  async getCoordinatorAlerts(filters: CoordinatorDashboardFilters = {}, institutionId?: string, signal?: AbortSignal): Promise<CoordinatorAlert[]> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const res = await api.get<{ ok: boolean; data: CoordinatorAlert[] }>(
      buildClassbookUrl('/api/classbook/coordinator/alerts', params, institutionId),
      signal
    );
    return res.data;
  },

  async getCoordinatorFilterOptions(institutionId?: string, signal?: AbortSignal): Promise<{
    academicYears: { id: string; name: string }[];
    terms: { id: string; name: string }[];
    courses: { id: string; name: string }[];
    subjects: { id: string; name: string }[];
    teachers: { id: string; name: string }[];
  }> {
    const res = await api.get<{ ok: boolean; data: {
      academicYears: { id: string; name: string }[];
      terms: { id: string; name: string }[];
      courses: { id: string; name: string }[];
      subjects: { id: string; name: string }[];
      teachers: { id: string; name: string }[];
    } }>(
      buildClassbookUrl('/api/classbook/coordinator/filter-options', undefined, institutionId),
      signal
    );
    return res.data;
  },

  async getInstitutions(signal?: AbortSignal): Promise<{ id: string; name: string }[]> {
    const res = await api.get<{ ok: boolean; data: { id: string; name: string }[] }>(
      '/api/classbook/institutions',
      signal
    );
    return res.data ?? [];
  },
};
