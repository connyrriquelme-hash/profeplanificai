import { D1Database } from '@cloudflare/workers-types';
import {
  StudentProfile,
  CreateStudentProfileInput,
  UpdateStudentProfileInput,
  CourseEnrollment,
  CreateCourseEnrollmentInput,
  UpdateCourseEnrollmentInput,
  ClassbookFilters,
  ClassbookListOptions,
} from '../../types/classbook';

export interface StudentServiceEnv {
  DB: D1Database;
}

export class StudentProfileService {
  private db: D1Database;

  constructor(env: StudentServiceEnv) {
    this.db = env.DB;
  }

  async create(input: CreateStudentProfileInput, institutionId: string): Promise<StudentProfile> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const existing = await this.db.prepare(
      `SELECT id FROM student_profiles WHERE institution_id = ? AND internal_identifier = ?`
    ).bind(institutionId, input.internal_identifier).first();

    if (existing) {
      throw Response.json({ ok: false, error: 'Student with this internal identifier already exists in this institution' }, { status: 409 });
    }

    await this.db.prepare(
      `INSERT INTO student_profiles (id, institution_id, user_id, internal_identifier, first_name, last_name, preferred_name, birth_date, enrollment_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      institutionId,
      input.user_id || null,
      input.internal_identifier,
      input.first_name,
      input.last_name,
      input.preferred_name || null,
      input.birth_date || null,
      input.enrollment_status || 'active',
      now,
      now
    ).run();

    return this.getById(id);
  }

  async getById(id: string): Promise<StudentProfile | null> {
    const result = await this.db.prepare(
      `SELECT * FROM student_profiles WHERE id = ?`
    ).bind(id).first<StudentProfile>();

    return result || null;
  }

  async getByInternalIdentifier(institutionId: string, internalIdentifier: string): Promise<StudentProfile | null> {
    const result = await this.db.prepare(
      `SELECT * FROM student_profiles WHERE institution_id = ? AND internal_identifier = ?`
    ).bind(institutionId, internalIdentifier).first<StudentProfile>();

    return result || null;
  }

  async list(filters: ClassbookFilters, options: ClassbookListOptions = {}): Promise<{ data: StudentProfile[]; total: number }> {
    const { limit = 20, offset = 0, order_by = 'last_name', order_dir = 'asc' } = options;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters.institution_id) {
      where += ' AND institution_id = ?';
      params.push(filters.institution_id);
    }
    if (filters.academic_year_id) {
      where += ' AND id IN (SELECT student_id FROM course_enrollments WHERE academic_year_id = ?)';
      params.push(filters.academic_year_id);
    }
    if (filters.course_id) {
      where += ' AND id IN (SELECT student_id FROM course_enrollments WHERE course_id = ? AND status = ?)';
      params.push(filters.course_id, 'active');
    }
    if (filters.enrollment_status) {
      where += ' AND enrollment_status = ?';
      params.push(filters.enrollment_status);
    }
    if (filters.search) {
      where += ' AND (first_name LIKE ? OR last_name LIKE ? OR internal_identifier LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    if (filters.archived !== undefined) {
      where += filters.archived ? ' AND archived_at IS NOT NULL' : ' AND archived_at IS NULL';
    }

    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as total FROM student_profiles ${where}`
    ).bind(...params).first<{ total: number }>();

    const results = await this.db.prepare(
      `SELECT * FROM student_profiles ${where} ORDER BY ${order_by} ${order_dir} LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<StudentProfile>();

    return {
      data: results.results || [],
      total: countResult?.total || 0,
    };
  }

  async update(id: string, input: UpdateStudentProfileInput): Promise<StudentProfile | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (input.user_id !== undefined) {
      updates.push('user_id = ?');
      params.push(input.user_id);
    }
    if (input.internal_identifier !== undefined) {
      const dup = await this.db.prepare(
        `SELECT id FROM student_profiles WHERE institution_id = ? AND internal_identifier = ? AND id != ?`
      ).bind(existing.institution_id, input.internal_identifier, id).first();
      if (dup) throw Response.json({ ok: false, error: 'Student with this internal identifier already exists in this institution' }, { status: 409 });
      updates.push('internal_identifier = ?');
      params.push(input.internal_identifier);
    }
    if (input.first_name !== undefined) {
      updates.push('first_name = ?');
      params.push(input.first_name);
    }
    if (input.last_name !== undefined) {
      updates.push('last_name = ?');
      params.push(input.last_name);
    }
    if (input.preferred_name !== undefined) {
      updates.push('preferred_name = ?');
      params.push(input.preferred_name);
    }
    if (input.birth_date !== undefined) {
      updates.push('birth_date = ?');
      params.push(input.birth_date);
    }
    if (input.enrollment_status !== undefined) {
      updates.push('enrollment_status = ?');
      params.push(input.enrollment_status);
    }
    if (input.archived_at !== undefined) {
      updates.push('archived_at = ?');
      params.push(input.archived_at);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await this.db.prepare(
      `UPDATE student_profiles SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return this.getById(id);
  }

  async archive(id: string): Promise<StudentProfile | null> {
    return this.update(id, { archived_at: new Date().toISOString() });
  }

  async restore(id: string): Promise<StudentProfile | null> {
    return this.update(id, { archived_at: null });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM student_profiles WHERE id = ?`
    ).bind(id).run();

    return (result.changes || 0) > 0;
  }

  async getByInstitution(institutionId: string, status?: string): Promise<StudentProfile[]> {
    let query = `SELECT * FROM student_profiles WHERE institution_id = ?`;
    const params: (string | number)[] = [institutionId];

    if (status) {
      query += ` AND enrollment_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY last_name ASC, first_name ASC`;

    const result = await this.db.prepare(query).bind(...params).all<StudentProfile>();
    return result.results || [];
  }

  async getFullName(id: string): Promise<string | null> {
    const student = await this.getById(id);
    if (!student) return null;
    return `${student.first_name} ${student.last_name}`;
  }
}

export class CourseEnrollmentService {
  private db: D1Database;

  constructor(env: StudentServiceEnv) {
    this.db = env.DB;
  }

  async create(input: CreateCourseEnrollmentInput, institutionId: string): Promise<CourseEnrollment> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const existing = await this.db.prepare(
      `SELECT id FROM course_enrollments WHERE institution_id = ? AND academic_year_id = ? AND course_id = ? AND student_id = ?`
    ).bind(institutionId, input.academic_year_id, input.course_id, input.student_id).first();

    if (existing) {
      throw Response.json({ ok: false, error: 'Student is already enrolled in this course for this academic year' }, { status: 409 });
    }

    const student = await this.db.prepare(
      `SELECT id FROM student_profiles WHERE id = ? AND institution_id = ?`
    ).bind(input.student_id, institutionId).first();

    if (!student) {
      throw new Error('Student not found in this institution');
    }

    const course = await this.db.prepare(
      `SELECT id FROM teacher_classes WHERE id = ?`
    ).bind(input.course_id).first();

    if (!course) {
      throw new Error('Course not found');
    }

    const academicYear = await this.db.prepare(
      `SELECT id FROM academic_years WHERE id = ? AND institution_id = ?`
    ).bind(input.academic_year_id, institutionId).first();

    if (!academicYear) {
      throw new Error('Academic year not found in this institution');
    }

    const now2 = new Date().toISOString();

    await this.db.prepare(
      `INSERT INTO course_enrollments (id, institution_id, academic_year_id, course_id, student_id, list_number, start_date, end_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      institutionId,
      input.academic_year_id,
      input.course_id,
      input.student_id,
      input.list_number || null,
      input.start_date,
      input.end_date || null,
      input.status || 'active',
      now2,
      now2
    ).run();

    return this.getById(id);
  }

  async getById(id: string): Promise<CourseEnrollment | null> {
    const result = await this.db.prepare(
      `SELECT * FROM course_enrollments WHERE id = ?`
    ).bind(id).first<CourseEnrollment>();

    return result || null;
  }

  async list(filters: ClassbookFilters, options: ClassbookListOptions = {}): Promise<{ data: CourseEnrollment[]; total: number }> {
    const { limit = 20, offset = 0, order_by = 'start_date', order_dir = 'desc' } = options;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters.institution_id) {
      where += ' AND institution_id = ?';
      params.push(filters.institution_id);
    }
    if (filters.academic_year_id) {
      where += ' AND academic_year_id = ?';
      params.push(filters.academic_year_id);
    }
    if (filters.course_id) {
      where += ' AND course_id = ?';
      params.push(filters.course_id);
    }
    if (filters.student_id) {
      where += ' AND student_id = ?';
      params.push(filters.student_id);
    }
    if (filters.status) {
      where += ' AND status = ?';
      params.push(filters.status);
    }

    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as total FROM course_enrollments ${where}`
    ).bind(...params).first<{ total: number }>();

    const results = await this.db.prepare(
      `SELECT * FROM course_enrollments ${where} ORDER BY ${order_by} ${order_dir} LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<CourseEnrollment>();

    return {
      data: results.results || [],
      total: countResult?.total || 0,
    };
  }

  async update(id: string, input: UpdateCourseEnrollmentInput): Promise<CourseEnrollment | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (input.list_number !== undefined) {
      updates.push('list_number = ?');
      params.push(input.list_number);
    }
    if (input.end_date !== undefined) {
      updates.push('end_date = ?');
      params.push(input.end_date);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await this.db.prepare(
      `UPDATE course_enrollments SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM course_enrollments WHERE id = ?`
    ).bind(id).run();

    return (result.changes || 0) > 0;
  }

  async getByCourse(courseId: string, academicYearId: string, status?: string): Promise<CourseEnrollment[]> {
    let query = `SELECT * FROM course_enrollments WHERE course_id = ? AND academic_year_id = ?`;
    const params: (string | number)[] = [courseId, academicYearId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY list_number ASC NULLS LAST, start_date ASC`;

    const result = await this.db.prepare(query).bind(...params).all<CourseEnrollment>();
    return result.results || [];
  }

  async getByStudent(studentId: string, academicYearId?: string): Promise<CourseEnrollment[]> {
    let query = `SELECT * FROM course_enrollments WHERE student_id = ?`;
    const params: (string | number)[] = [studentId];

    if (academicYearId) {
      query += ` AND academic_year_id = ?`;
      params.push(academicYearId);
    }

    query += ` ORDER BY start_date DESC`;

    const result = await this.db.prepare(query).bind(...params).all<CourseEnrollment>();
    return result.results || [];
  }

  async getActiveByCourseAndYear(courseId: string, academicYearId: string): Promise<CourseEnrollment[]> {
    return this.getByCourse(courseId, academicYearId, 'active');
  }
}

const now = new Date().toISOString();