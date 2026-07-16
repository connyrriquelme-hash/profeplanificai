export interface AcademicYear {
  id: string;
  institution_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'closed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CreateAcademicYearInput {
  institution_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status?: 'planning' | 'active' | 'closed' | 'archived';
}

export interface UpdateAcademicYearInput {
  name?: string;
  start_date?: string;
  end_date?: string;
  status?: 'planning' | 'active' | 'closed' | 'archived';
}

export interface AcademicTerm {
  id: string;
  academic_year_id: string;
  institution_id: string;
  name: string;
  start_date: string;
  end_date: string;
  sort_order: number;
  status: 'planning' | 'active' | 'closed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CreateAcademicTermInput {
  academic_year_id: string;
  institution_id: string;
  name: string;
  start_date: string;
  end_date: string;
  sort_order?: number;
  status?: 'planning' | 'active' | 'closed' | 'archived';
}

export interface UpdateAcademicTermInput {
  name?: string;
  start_date?: string;
  end_date?: string;
  sort_order?: number;
  status?: 'planning' | 'active' | 'closed' | 'archived';
}

export interface StudentProfile {
  id: string;
  institution_id: string;
  user_id: string | null;
  internal_identifier: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  birth_date: string | null;
  enrollment_status: 'active' | 'inactive' | 'transferred' | 'graduated' | 'withdrawn';
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentProfileInput {
  institution_id: string;
  user_id?: string;
  internal_identifier: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  birth_date?: string;
  enrollment_status?: 'active' | 'inactive' | 'transferred' | 'graduated' | 'withdrawn';
}

export interface UpdateStudentProfileInput {
  user_id?: string;
  internal_identifier?: string;
  first_name?: string;
  last_name?: string;
  preferred_name?: string;
  birth_date?: string;
  enrollment_status?: 'active' | 'inactive' | 'transferred' | 'graduated' | 'withdrawn';
  archived_at?: string | null;
}

export interface CourseEnrollment {
  id: string;
  institution_id: string;
  academic_year_id: string;
  course_id: string;
  student_id: string;
  list_number: number | null;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'transferred' | 'dropped' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateCourseEnrollmentInput {
  institution_id: string;
  academic_year_id: string;
  course_id: string;
  student_id: string;
  list_number?: number;
  start_date: string;
  end_date?: string;
  status?: 'active' | 'transferred' | 'dropped' | 'completed';
}

export interface UpdateCourseEnrollmentInput {
  list_number?: number;
  end_date?: string | null;
  status?: 'active' | 'transferred' | 'dropped' | 'completed';
}

export interface ClassSession {
  id: string;
  institution_id: string;
  academic_year_id: string;
  academic_term_id: string | null;
  course_id: string;
  subject_id: string;
  teacher_id: string;
  lesson_instance_id: string | null;
  lesson_plan_id: string | null;
  planning_id: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  planned_content: string | null;
  taught_content: string | null;
  objective_ids_json: string;
  indicators_json: string;
  skills_json: string;
  attitudes_json: string;
  dua_supports_json: string;
  formative_assessment_json: string;
  resources_json: string;
  teacher_notes: string | null;
  status: 'scheduled' | 'open' | 'completed' | 'pending_signature' | 'signed' | 'corrected' | 'cancelled';
  version: number;
  signed_version: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface CreateClassSessionInput {
  institution_id: string;
  academic_year_id: string;
  academic_term_id?: string;
  course_id: string;
  subject_id: string;
  teacher_id?: string;
  lesson_instance_id?: string;
  lesson_plan_id?: string;
  planning_id?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  planned_content?: string;
  objective_ids?: string[];
  indicators?: Array<{ indicator_id: string; weight?: number; criteria?: string }>;
  skills?: string[];
  attitudes?: string[];
  dua_supports?: string[];
  formative_assessment?: string[];
  resources?: string[];
  teacher_notes?: string;
  status?: 'scheduled' | 'open' | 'completed' | 'pending_signature' | 'signed' | 'corrected' | 'cancelled';
}

export interface UpdateClassSessionInput {
  academic_term_id?: string | null;
  taught_content?: string;
  objective_ids_json?: string;
  indicators_json?: string;
  skills_json?: string;
  attitudes_json?: string;
  dua_supports_json?: string;
  formative_assessment_json?: string;
  resources_json?: string;
  teacher_notes?: string | null;
  status?: 'scheduled' | 'open' | 'completed' | 'pending_signature' | 'signed' | 'corrected' | 'cancelled';
}

export interface ClassSessionVersion {
  id: string;
  class_session_id: string;
  institution_id: string;
  version: number;
  snapshot_json: string;
  content_hash: string | null;
  change_reason: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateClassSessionVersionInput {
  class_session_id: string;
  institution_id: string;
  version: number;
  snapshot_json: string;
  content_hash?: string;
  change_reason?: string;
  created_by: string;
}

export interface AttendanceRecord {
  id: string;
  institution_id: string;
  class_session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'justified' | 'early_leave' | 'external_activity';
  arrival_time: string | null;
  departure_time: string | null;
  justification: string | null;
  recorded_by: string;
  confirmed_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface CreateAttendanceRecordInput {
  institution_id: string;
  class_session_id: string;
  student_id: string;
  status?: 'present' | 'absent' | 'late' | 'justified' | 'early_leave' | 'external_activity';
  arrival_time?: string;
  departure_time?: string;
  justification?: string;
  recorded_by: string;
}

export interface UpdateAttendanceRecordInput {
  status?: 'present' | 'absent' | 'late' | 'justified' | 'early_leave' | 'external_activity';
  arrival_time?: string | null;
  departure_time?: string | null;
  justification?: string | null;
  confirmed_at?: string | null;
}

export interface BatchAttendanceInput {
  records: Array<{
    student_id: string;
    status: 'present' | 'absent' | 'late' | 'justified' | 'early_leave' | 'external_activity';
    arrival_time?: string;
    departure_time?: string;
    justification?: string;
  }>;
  recorded_by: string;
}

export interface StudentObservation {
  id: string;
  institution_id: string;
  academic_year_id: string;
  course_id: string;
  student_id: string;
  class_session_id: string | null;
  category: 'positive' | 'academic' | 'coexistence' | 'attendance' | 'support' | 'family_contact' | 'follow_up' | 'alert';
  content: string;
  visibility: 'teacher' | 'coordinator' | 'admin' | 'family';
  follow_up_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface CreateStudentObservationInput {
  institution_id: string;
  academic_year_id: string;
  course_id: string;
  student_id: string;
  class_session_id?: string;
  category: 'positive' | 'academic' | 'coexistence' | 'attendance' | 'support' | 'family_contact' | 'follow_up' | 'alert';
  content: string;
  visibility?: 'teacher' | 'coordinator' | 'admin' | 'family';
  follow_up_date?: string;
  created_by: string;
}

export interface UpdateStudentObservationInput {
  category?: 'positive' | 'academic' | 'coexistence' | 'attendance' | 'support' | 'family_contact' | 'follow_up' | 'alert';
  content?: string;
  visibility?: 'teacher' | 'coordinator' | 'admin' | 'family';
  follow_up_date?: string | null;
  archived_at?: string | null;
}

export interface PlanningReview {
  id: string;
  institution_id: string;
  planning_id: string;
  reviewer_id: string;
  status: 'pending' | 'approved' | 'observed' | 'returned' | 'archived';
  comments: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanningReviewInput {
  institution_id: string;
  planning_id: string;
  reviewer_id: string;
  comments?: string;
}

export interface UpdatePlanningReviewInput {
  status?: 'pending' | 'approved' | 'observed' | 'returned' | 'archived';
  comments?: string;
  reviewed_at?: string;
}

export interface SignatureEvent {
  id: string;
  institution_id: string;
  class_session_id: string;
  user_id: string;
  signed_version: number;
  content_hash: string;
  signature_method: 'pin' | 'biometric' | 'external';
  terminal_id: string | null;
  signed_at: string;
  result: 'success' | 'failed' | 'expired' | 'revoked';
  created_at: string;
}

export interface CreateSignatureEventInput {
  institution_id: string;
  class_session_id: string;
  user_id: string;
  signed_version: number;
  content_hash: string;
  signature_method?: 'pin' | 'biometric' | 'external';
  terminal_id?: string;
  result: 'success' | 'failed' | 'expired' | 'revoked';
}

export interface ClassbookAuditEntry {
  id: string;
  institution_id: string;
  actor_user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata_json: string | null;
  created_at: string;
}

export interface CreateClassbookAuditInput {
  institution_id: string;
  actor_user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata_json?: Record<string, unknown>;
}

export interface ClassbookListOptions {
  limit?: number;
  offset?: number;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export interface ClassbookFilters {
  institution_id?: string;
  academic_year_id?: string;
  academic_term_id?: string;
  course_id?: string;
  subject_id?: string;
  teacher_id?: string;
  student_id?: string;
  status?: string;
  category?: string;
  visibility?: string;
  date_from?: string;
  date_to?: string;
}