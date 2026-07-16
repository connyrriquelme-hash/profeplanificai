import { D1Database } from '@cloudflare/workers-types';
import {
  StudentObservation,
  CreateStudentObservationInput,
  UpdateStudentObservationInput,
  ClassbookFilters,
  ClassbookListOptions,
} from '../../types/classbook';

export interface ObservationServiceEnv {
  DB: D1Database;
}

export class ObservationService {
  private db: D1Database;

  constructor(env: ObservationServiceEnv) {
    this.db = env.DB;
  }

  async getById(id: string): Promise<StudentObservation | null> {
    const result = await this.db.prepare(
      `SELECT * FROM student_observations WHERE id = ?`
    ).bind(id).first<StudentObservation>();

    return result || null;
  }

  async list(filters: ClassbookFilters, options: ClassbookListOptions = {}): Promise<{ data: StudentObservation[]; total: number }> {
    const { limit = 20, offset = 0, order_by = 'created_at', order_dir = 'desc' } = options;

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
    if (filters.class_session_id) {
      where += ' AND class_session_id = ?';
      params.push(filters.class_session_id);
    }
    if (filters.category) {
      where += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.visibility) {
      where += ' AND visibility = ?';
      params.push(filters.visibility);
    }
    if (filters.date_from) {
      where += ' AND created_at >= ?';
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      where += ' AND created_at <= ?';
      params.push(filters.date_to);
    }
    if (filters.archived !== undefined) {
      where += filters.archived ? ' AND archived_at IS NOT NULL' : ' AND archived_at IS NULL';
    }
    if (filters.search) {
      where += ' AND content LIKE ?';
      params.push(`%${filters.search}%`);
    }

    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as total FROM student_observations ${where}`
    ).bind(...params).first<{ total: number }>();

    const results = await this.db.prepare(
      `SELECT * FROM student_observations ${where} ORDER BY ${order_by} ${order_dir} LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<StudentObservation>();

    return {
      data: results.results || [],
      total: countResult?.total || 0,
    };
  }

  async create(input: CreateStudentObservationInput): Promise<StudentObservation> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const student = await this.db.prepare(
      `SELECT id FROM student_profiles WHERE id = ? AND institution_id = ?`
    ).bind(input.student_id, input.institution_id).first();

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
    ).bind(input.academic_year_id, input.institution_id).first();

    if (!academicYear) {
      throw new Error('Academic year not found in this institution');
    }

    if (input.class_session_id) {
      const session = await this.db.prepare(
        `SELECT id FROM class_sessions WHERE id = ? AND institution_id = ?`
      ).bind(input.class_session_id, input.institution_id).first();

      if (!session) {
        throw new Error('Class session not found in this institution');
      }
    }

    await this.db.prepare(
      `INSERT INTO student_observations (id, institution_id, academic_year_id, course_id, student_id, class_session_id, category, content, visibility, follow_up_date, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      input.institution_id,
      input.academic_year_id,
      input.course_id,
      input.student_id,
      input.class_session_id || null,
      input.category,
      input.content,
      input.visibility || 'teacher',
      input.follow_up_date || null,
      input.created_by,
      now,
      now
    ).run();

    return this.getById(id);
  }

  async update(id: string, input: UpdateStudentObservationInput): Promise<StudentObservation | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (input.category !== undefined) {
      updates.push('category = ?');
      params.push(input.category);
    }
    if (input.content !== undefined) {
      updates.push('content = ?');
      params.push(input.content);
    }
    if (input.visibility !== undefined) {
      updates.push('visibility = ?');
      params.push(input.visibility);
    }
    if (input.follow_up_date !== undefined) {
      updates.push('follow_up_date = ?');
      params.push(input.follow_up_date);
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
      `UPDATE student_observations SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return this.getById(id);
  }

  async archive(id: string): Promise<StudentObservation | null> {
    return this.update(id, { archived_at: new Date().toISOString() });
  }

  async restore(id: string): Promise<StudentObservation | null> {
    return this.update(id, { archived_at: null });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM student_observations WHERE id = ?`
    ).bind(id).run();

    return (result.changes || 0) > 0;
  }

  async getByStudent(studentId: string, institutionId: string, academicYearId?: string): Promise<StudentObservation[]> {
    let query = `SELECT * FROM student_observations WHERE student_id = ? AND institution_id = ?`;
    const params: (string | number)[] = [studentId, institutionId];

    if (academicYearId) {
      query += ` AND academic_year_id = ?`;
      params.push(academicYearId);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.db.prepare(query).bind(...params).all<StudentObservation>();
    return result.results || [];
  }

  async getByCourse(courseId: string, academicYearId: string, filters?: { category?: string; visibility?: string }): Promise<StudentObservation[]> {
    let query = `SELECT * FROM student_observations WHERE course_id = ? AND academic_year_id = ?`;
    const params: (string | number)[] = [courseId, academicYearId];

    if (filters?.category) {
      query += ` AND category = ?`;
      params.push(filters.category);
    }
    if (filters?.visibility) {
      query += ` AND visibility = ?`;
      params.push(filters.visibility);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.db.prepare(query).bind(...params).all<StudentObservation>();
    return result.results || [];
  }

  async getBySession(classSessionId: string): Promise<StudentObservation[]> {
    const result = await this.db.prepare(
      `SELECT * FROM student_observations WHERE class_session_id = ? ORDER BY created_at DESC`
    ).bind(classSessionId).all<StudentObservation>();

    return result.results || [];
  }

  async getByCategory(category: string, institutionId: string, academicYearId?: string): Promise<StudentObservation[]> {
    let query = `SELECT * FROM student_observations WHERE category = ? AND institution_id = ?`;
    const params: (string | number)[] = [category, institutionId];

    if (academicYearId) {
      query += ` AND academic_year_id = ?`;
      params.push(academicYearId);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.db.prepare(query).bind(...params).all<StudentObservation>();
    return result.results || [];
  }

  async getByFollowUpDate(institutionId: string, date: string): Promise<StudentObservation[]> {
    const result = await this.db.prepare(
      `SELECT * FROM student_observations WHERE institution_id = ? AND follow_up_date = ? AND archived_at IS NULL ORDER BY created_at ASC`
    ).bind(institutionId, date).all<StudentObservation>();

    return result.results || [];
  }

  async getUpcomingFollowUps(institutionId: string, days = 7): Promise<StudentObservation[]> {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await this.db.prepare(
      `SELECT * FROM student_observations
       WHERE institution_id = ? AND follow_up_date BETWEEN ? AND ? AND archived_at IS NULL
       ORDER BY follow_up_date ASC`
    ).bind(institutionId, today, futureDate).all<StudentObservation>();

    return result.results || [];
  }

  async getByCreator(createdBy: string, institutionId: string, limit = 50): Promise<StudentObservation[]> {
    const result = await this.db.prepare(
      `SELECT * FROM student_observations WHERE created_by = ? AND institution_id = ? ORDER BY created_at DESC LIMIT ?`
    ).bind(createdBy, institutionId, limit).all<StudentObservation>();

    return result.results || [];
  }

  async getStatsByCategory(institutionId: string, academicYearId?: string): Promise<Record<string, number>> {
    let query = `SELECT category, COUNT(*) as count FROM student_observations WHERE institution_id = ?`;
    const params: (string | number)[] = [institutionId];

    if (academicYearId) {
      query += ` AND academic_year_id = ?`;
      params.push(academicYearId);
    }

    query += ` GROUP BY category`;

    const result = await this.db.prepare(query).bind(...params).all<{ category: string; count: number }>();
    return Object.fromEntries((result.results || []).map(r => [r.category, r.count]));
  }

  async getStatsByVisibility(institutionId: string): Promise<Record<string, number>> {
    const result = await this.db.prepare(
      `SELECT visibility, COUNT(*) as count FROM student_observations WHERE institution_id = ? GROUP BY visibility`
    ).bind(institutionId).all<{ visibility: string; count: number }>();

    return Object.fromEntries((result.results || []).map(r => [r.visibility, r.count]));
  }
}

const now = new Date().toISOString();