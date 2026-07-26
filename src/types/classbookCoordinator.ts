export interface CoordinatorDashboardFilters {
  academicYearId?: string;
  termId?: string;
  courseId?: string;
  subjectId?: string;
  teacherId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CoordinatorDashboardSummary {
  totalCourses: number;
  totalTeachers: number;
  sessionsScheduled: number;
  sessionsCompleted: number;
  sessionsPending: number;
  sessionsWithoutContent: number;
  sessionsWithoutAttendance: number;
  sessionsPendingSignature: number;
  planningReviewsPending: number;
  planningReviewsObserved: number;
  averageAttendanceRate: number;
  openObservations: number;
  estimatedCoveragePercent: number;
}

export interface CoordinatorTeacherSummary {
  teacherId: string;
  teacherName: string;
  courses: string[];
  sessionsPlanned: number;
  sessionsCompleted: number;
  sessionsPending: number;
  sessionsWithoutAttendance: number;
  pendingSignatures: number;
  pendingReviews: number;
  compliancePercent: number;
}

export interface CoordinatorCourseSummary {
  courseId: string;
  courseName: string;
  subjectName: string;
  teacherName: string;
  sessionsTotal: number;
  sessionsCompleted: number;
  attendanceRate: number;
  pendingReviews: number;
  coveragePercent: number;
}

export interface CoordinatorSessionSummary {
  sessionId: string;
  date: string;
  courseName: string;
  subjectName: string;
  teacherName: string;
  status: string;
  hasAttendance: boolean;
  hasSignature: boolean;
  version: number;
}

export interface CoordinatorPlanningSummary {
  reviewId: string;
  planningId: string;
  teacherName: string;
  courseName: string;
  subjectName: string;
  status: string;
  comments: string | null;
  createdAt: string;
}

export interface CoordinatorSignatureSummary {
  sessionId: string;
  teacherName: string;
  courseName: string;
  subjectName: string;
  date: string;
  version: number;
  status: string;
  pendingSince: string;
}

export interface CoordinatorCoverageSummary {
  courseId: string;
  courseName: string;
  subjectName: string;
  totalOA: number;
  plannedOA: number;
  workedOA: number;
  pendingOA: number;
  coveragePercent: number;
}

export type CoordinatorAlertSeverity = 'info' | 'warning' | 'critical';

export type CoordinatorAlertType =
  | 'session_completed_no_signature'
  | 'session_past_still_scheduled'
  | 'session_completed_no_attendance'
  | 'planning_pending_review'
  | 'planning_returned_no_correction'
  | 'low_oa_coverage'
  | 'teacher_multiple_pending_sessions'
  | 'attendance_below_threshold'
  | 'observation_follow_up_overdue';

export interface CoordinatorAlert {
  id: string;
  type: CoordinatorAlertType;
  severity: CoordinatorAlertSeverity;
  title: string;
  description: string;
  resourceType: string;
  resourceId: string;
  teacherId: string | null;
  courseId: string | null;
  dueDate: string | null;
  createdAt: string;
}
