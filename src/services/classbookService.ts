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

export const classbookService = {
  async getAcademicYears(institutionId: string, signal?: AbortSignal): Promise<ClassbookAcademicYear[]> {
    const res = await api.get<ApiListResponse<ClassbookAcademicYear>>(
      `/api/classbook/academic-years?institution_id=${institutionId}`,
      signal
    );
    return res.data ?? [];
  },

  async getAcademicTerms(yearId: string, signal?: AbortSignal): Promise<ClassbookTerm[]> {
    const res = await api.get<ApiListResponse<ClassbookTerm>>(
      `/api/classbook/academic-terms?academic_year_id=${yearId}`,
      signal
    );
    return res.data ?? [];
  },

  async getStudents(institutionId: string, signal?: AbortSignal): Promise<ClassbookStudent[]> {
    const res = await api.get<ApiListResponse<ClassbookStudent>>(
      `/api/classbook/students?institution_id=${institutionId}`,
      signal
    );
    return res.data ?? [];
  },

  async getEnrollments(yearId: string, courseId?: string, signal?: AbortSignal): Promise<ClassbookEnrollment[]> {
    let url = `/api/classbook/enrollments?academic_year_id=${yearId}`;
    if (courseId) url += `&course_id=${courseId}`;
    const res = await api.get<ApiListResponse<ClassbookEnrollment>>(url, signal);
    return res.data ?? [];
  },

  async getClassSessions(yearId: string, filters?: { course_id?: string; teacher_id?: string; status?: string }, signal?: AbortSignal): Promise<ClassbookSession[]> {
    let url = `/api/classbook/sessions?academic_year_id=${yearId}`;
    if (filters?.course_id) url += `&course_id=${filters.course_id}`;
    if (filters?.teacher_id) url += `&teacher_id=${filters.teacher_id}`;
    if (filters?.status) url += `&status=${filters.status}`;
    const res = await api.get<ApiListResponse<ClassbookSession>>(url, signal);
    return res.data ?? [];
  },

  async getClassSessionById(sessionId: string, signal?: AbortSignal): Promise<ClassbookSession | null> {
    const res = await api.get<ApiSingleResponse<ClassbookSession>>(
      `/api/classbook/sessions/${sessionId}`,
      signal
    );
    return res.data ?? null;
  },

  async createClassSessionFromLesson(lessonInstanceId: string, signal?: AbortSignal): Promise<ClassbookSession> {
    const res = await api.post<ApiSingleResponse<ClassbookSession>>(
      '/api/classbook/sessions/from-lesson',
      { lesson_instance_id: lessonInstanceId },
      signal
    );
    return res.data;
  },

  async updateClassSession(sessionId: string, data: Partial<ClassbookSession>, signal?: AbortSignal): Promise<ClassbookSession> {
    const res = await api.patch<ApiSingleResponse<ClassbookSession>>(
      `/api/classbook/sessions/${sessionId}`,
      data,
      signal
    );
    return res.data;
  },

  async completeClassSession(sessionId: string, finalize: boolean, signal?: AbortSignal): Promise<ClassbookSession> {
    const res = await api.post<ApiSingleResponse<ClassbookSession>>(
      `/api/classbook/sessions/${sessionId}/complete`,
      { finalize },
      signal
    );
    return res.data;
  },

  async getSessionVersions(sessionId: string, signal?: AbortSignal): Promise<unknown[]> {
    const res = await api.get<ApiListResponse<unknown>>(
      `/api/classbook/sessions/${sessionId}/versions`,
      signal
    );
    return res.data ?? [];
  },

  async getAttendance(sessionId: string, signal?: AbortSignal): Promise<ClassbookAttendanceRecord[]> {
    const res = await api.get<ApiListResponse<ClassbookAttendanceRecord>>(
      `/api/classbook/sessions/${sessionId}/attendance`,
      signal
    );
    return res.data ?? [];
  },

  async saveAttendance(sessionId: string, records: { student_id: string; status: string; justification?: string }[], recordedBy: string, signal?: AbortSignal): Promise<AttendanceBatchResult['data']> {
    const res = await api.put<AttendanceBatchResult>(
      `/api/classbook/sessions/${sessionId}/attendance`,
      { records, recorded_by: recordedBy },
      signal
    );
    return res.data;
  },

  async getObservations(institutionId: string, filters?: { course_id?: string; student_id?: string; class_session_id?: string }, signal?: AbortSignal): Promise<ClassbookObservation[]> {
    let url = `/api/classbook/observations?institution_id=${institutionId || ''}`;
    if (filters?.course_id) url += `&course_id=${filters.course_id}`;
    if (filters?.student_id) url += `&student_id=${filters.student_id}`;
    if (filters?.class_session_id) url += `&class_session_id=${filters.class_session_id}`;
    const res = await api.get<ApiListResponse<ClassbookObservation>>(url, signal);
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
  }, signal?: AbortSignal): Promise<ClassbookObservation> {
    const res = await api.post<ApiSingleResponse<ClassbookObservation>>(
      '/api/classbook/observations',
      data,
      signal
    );
    return res.data;
  },

  async updateObservation(obsId: string, data: Partial<ClassbookObservation>, signal?: AbortSignal): Promise<ClassbookObservation> {
    const res = await api.patch<ApiSingleResponse<ClassbookObservation>>(
      `/api/classbook/observations/${obsId}`,
      data,
      signal
    );
    return res.data;
  },

  async archiveObservation(obsId: string, signal?: AbortSignal): Promise<ClassbookObservation> {
    const res = await api.del<ApiSingleResponse<ClassbookObservation>>(
      `/api/classbook/observations/${obsId}`,
      signal
    );
    return res.data;
  },

  async getPlanningReviews(institutionId: string, signal?: AbortSignal): Promise<ClassbookPlanningReview[]> {
    const res = await api.get<ApiListResponse<ClassbookPlanningReview>>(
      `/api/classbook/planning-reviews?institution_id=${institutionId}`,
      signal
    );
    return res.data ?? [];
  },

  async createPlanningReview(planningId: string, signal?: AbortSignal): Promise<ClassbookPlanningReview> {
    const res = await api.post<ApiSingleResponse<ClassbookPlanningReview>>(
      '/api/classbook/planning-reviews',
      { planning_id: planningId },
      signal
    );
    return res.data;
  },

  async updatePlanningReview(reviewId: string, data: Partial<ClassbookPlanningReview>, signal?: AbortSignal): Promise<ClassbookPlanningReview> {
    const res = await api.patch<ApiSingleResponse<ClassbookPlanningReview>>(
      `/api/classbook/planning-reviews/${reviewId}`,
      data,
      signal
    );
    return res.data;
  },

  async getSignatureStatus(sessionId: string, signal?: AbortSignal): Promise<ClassbookSignatureStatus> {
    const res = await api.get<{ ok: boolean; data: ClassbookSignatureStatus }>(
      `/api/classbook/sessions/${sessionId}/signature`,
      signal
    );
    return res.data ?? { signed: false };
  },

  async getSignatureCredentialStatus(signal?: AbortSignal): Promise<import('../types/classbook').SignatureCredentialStatus> {
    const res = await api.get<{ ok: boolean; data: import('../types/classbook').SignatureCredentialStatus }>(
      '/api/classbook/signature-credentials/status',
      signal
    );
    return res.data ?? { configured: false, locked: false, must_change_pin: false, failed_attempts: 0, locked_until: null };
  },

  async setupSignaturePin(pin: string, signal?: AbortSignal): Promise<{ configured: boolean; must_change_pin: boolean }> {
    const res = await api.post<{ ok: boolean; data: { configured: boolean; must_change_pin: boolean } }>(
      '/api/classbook/signature-credentials/setup',
      { pin },
      signal
    );
    return res.data;
  },

  async changeSignaturePin(currentPin: string, newPin: string, signal?: AbortSignal): Promise<{ changed: boolean }> {
    const res = await api.post<{ ok: boolean; data: { changed: boolean } }>(
      '/api/classbook/signature-credentials/change',
      { current_pin: currentPin, new_pin: newPin },
      signal
    );
    return res.data;
  },

  async signSessionWithPin(sessionId: string, contentHash: string, pin: string, signal?: AbortSignal): Promise<{ session: ClassbookSession; signature: unknown }> {
    const res = await api.post<{ ok: boolean; data: { session: ClassbookSession; signature: unknown } }>(
      `/api/classbook/sessions/${sessionId}/signature`,
      { content_hash: contentHash, pin },
      signal
    );
    return res.data;
  },

  async resetSignaturePin(userId: string, signal?: AbortSignal): Promise<{ reset: boolean }> {
    const res = await api.post<{ ok: boolean; data: { reset: boolean } }>(
      `/api/classbook/signature-credentials/${userId}/reset`,
      {},
      signal
    );
    return res.data;
  },

  async unlockSignaturePin(userId: string, signal?: AbortSignal): Promise<{ unlocked: boolean }> {
    const res = await api.post<{ ok: boolean; data: { unlocked: boolean } }>(
      `/api/classbook/signature-credentials/${userId}/unlock`,
      {},
      signal
    );
    return res.data;
  },

  async getCoordinatorDashboard(filters: CoordinatorDashboardFilters = {}, signal?: AbortSignal): Promise<CoordinatorDashboardSummary> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    const res = await api.get<{ ok: boolean; data: CoordinatorDashboardSummary }>(
      `/api/classbook/coordinator/dashboard${qs ? `?${qs}` : ''}`,
      signal
    );
    return res.data;
  },

  async getCoordinatorTeachers(filters: CoordinatorDashboardFilters = {}, signal?: AbortSignal): Promise<CoordinatorTeacherSummary[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    const res = await api.get<{ ok: boolean; data: CoordinatorTeacherSummary[] }>(
      `/api/classbook/coordinator/teachers${qs ? `?${qs}` : ''}`,
      signal
    );
    return res.data;
  },

  async getCoordinatorCourses(filters: CoordinatorDashboardFilters = {}, signal?: AbortSignal): Promise<CoordinatorCourseSummary[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    const res = await api.get<{ ok: boolean; data: CoordinatorCourseSummary[] }>(
      `/api/classbook/coordinator/courses${qs ? `?${qs}` : ''}`,
      signal
    );
    return res.data;
  },

  async getCoordinatorSessions(filters: CoordinatorDashboardFilters = {}, signal?: AbortSignal): Promise<CoordinatorSessionSummary[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    const res = await api.get<{ ok: boolean; data: CoordinatorSessionSummary[] }>(
      `/api/classbook/coordinator/sessions${qs ? `?${qs}` : ''}`,
      signal
    );
    return res.data;
  },

  async getCoordinatorPlanningReviews(filters: CoordinatorDashboardFilters = {}, signal?: AbortSignal): Promise<CoordinatorPlanningSummary[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    const res = await api.get<{ ok: boolean; data: CoordinatorPlanningSummary[] }>(
      `/api/classbook/coordinator/planning-reviews${qs ? `?${qs}` : ''}`,
      signal
    );
    return res.data;
  },

  async getCoordinatorPendingSignatures(filters: CoordinatorDashboardFilters = {}, signal?: AbortSignal): Promise<CoordinatorSignatureSummary[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    const res = await api.get<{ ok: boolean; data: CoordinatorSignatureSummary[] }>(
      `/api/classbook/coordinator/signatures${qs ? `?${qs}` : ''}`,
      signal
    );
    return res.data;
  },

  async getCoordinatorCoverage(filters: CoordinatorDashboardFilters = {}, signal?: AbortSignal): Promise<CoordinatorCoverageSummary[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    const res = await api.get<{ ok: boolean; data: CoordinatorCoverageSummary[] }>(
      `/api/classbook/coordinator/coverage${qs ? `?${qs}` : ''}`,
      signal
    );
    return res.data;
  },

  async getCoordinatorAlerts(filters: CoordinatorDashboardFilters = {}, signal?: AbortSignal): Promise<CoordinatorAlert[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    const res = await api.get<{ ok: boolean; data: CoordinatorAlert[] }>(
      `/api/classbook/coordinator/alerts${qs ? `?${qs}` : ''}`,
      signal
    );
    return res.data;
  },

  async getCoordinatorFilterOptions(signal?: AbortSignal): Promise<{
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
      `/api/classbook/coordinator/filter-options`,
      signal
    );
    return res.data;
  },
};
