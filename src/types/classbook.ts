export interface ClassbookAcademicYear {
  id: string;
  institution_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface ClassbookTerm {
  id: string;
  academic_year_id: string;
  institution_id: string;
  name: string;
  start_date: string;
  end_date: string;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClassbookStudent {
  id: string;
  institution_id: string;
  internal_identifier: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  birth_date?: string;
  enrollment_status: string;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassbookEnrollment {
  id: string;
  institution_id: string;
  academic_year_id: string;
  course_id: string;
  student_id: string;
  list_number?: number;
  start_date: string;
  end_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClassbookSession {
  id: string;
  institution_id: string;
  academic_year_id: string;
  academic_term_id?: string;
  course_id: string;
  subject_id?: string;
  teacher_id: string;
  lesson_instance_id?: string;
  lesson_plan_id?: string;
  planning_id?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  planned_content?: string;
  taught_content?: string;
  objective_ids_json?: string;
  indicators_json?: string;
  skills_json?: string;
  attitudes_json?: string;
  dua_supports_json?: string;
  formative_assessment_json?: string;
  resources_json?: string;
  teacher_notes?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'pending_signature' | 'signed' | 'cancelled';
  version: number;
  signed_version?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClassbookAttendanceRecord {
  id: string;
  institution_id: string;
  class_session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'justified' | 'early_departure' | 'external_activity';
  arrival_time?: string;
  departure_time?: string;
  justification?: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClassbookObservation {
  id: string;
  institution_id: string;
  academic_year_id: string;
  course_id: string;
  student_id: string;
  class_session_id?: string;
  category: string;
  content: string;
  visibility: string;
  follow_up_date?: string;
  created_by: string;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassbookPlanningReview {
  id: string;
  institution_id: string;
  planning_id: string;
  reviewer_id: string;
  status: 'pending' | 'approved' | 'observed' | 'returned' | 'archived';
  comments?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassbookSignatureStatus {
  signed: boolean;
  signed_version?: number;
  signed_at?: string;
  signed_by?: string;
  content_hash?: string;
  credential?: SignatureCredentialStatus;
}

export interface SignatureCredentialStatus {
  configured: boolean;
  locked: boolean;
  must_change_pin: boolean;
  failed_attempts: number;
  locked_until: string | null;
}
