import { D1Database } from '@cloudflare/workers-types';
import {
  ClassSession,
  CreateClassSessionInput,
  UpdateClassSessionInput,
  ClassSessionVersion,
  CreateClassSessionVersionInput,
  ClassbookFilters,
  ClassbookListOptions,
} from '../../types/classbook';

export interface ClassSessionServiceEnv {
  DB: D1Database;
}

export class ClassSessionService {
  private db: D1Database;

  constructor(env: ClassSessionServiceEnv) {
    this.db = env.DB;
  }

  async create(input: CreateClassSessionInput, institutionId: string, createdBy: string): Promise<ClassSession> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const academicYear = await this.db.prepare(
      `SELECT id FROM academic_years WHERE id = ? AND institution_id = ?`
    ).bind(input.academic_year_id, institutionId).first();

    if (!academicYear) {
      throw new Error('Academic year not found in this institution');
    }

    if (input.academic_term_id) {
      const term = await this.db.prepare(
        `SELECT id FROM academic_terms WHERE id = ? AND academic_year_id = ? AND institution_id = ?`
      ).bind(input.academic_term_id, input.academic_year_id, institutionId).first();

      if (!term) {
        throw new Error('Academic term not found in this academic year and institution');
      }
    }

    const course = await this.db.prepare(
      `SELECT id FROM teacher_classes WHERE id = ?`
    ).bind(input.course_id).first();

    if (!course) {
      throw new Error('Course not found');
    }

    const subject = await this.db.prepare(
      `SELECT id FROM subjects WHERE id = ?`
    ).bind(input.subject_id).first();

    if (!subject) {
      throw new Error('Subject not found');
    }

    const teacher = await this.db.prepare(
      `SELECT id FROM usuarios WHERE id = ?`
    ).bind(input.teacher_id).first();

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    if (input.lesson_instance_id) {
      const lesson = await this.db.prepare(
        `SELECT id FROM lesson_instances WHERE id = ?`
      ).bind(input.lesson_instance_id).first();

      if (!lesson) {
        throw new Error('Lesson instance not found');
      }
    }

    if (input.lesson_plan_id) {
      const plan = await this.db.prepare(
        `SELECT id FROM lesson_plans WHERE id = ?`
      ).bind(input.lesson_plan_id).first();

      if (!plan) {
        throw new Error('Lesson plan not found');
      }
    }

    const existing = await this.db.prepare(
      `SELECT id FROM class_sessions WHERE course_id = ? AND date = ? AND teacher_id = ?`
    ).bind(input.course_id, input.date, input.teacher_id || createdBy).first();

    if (existing) {
      throw Response.json({ ok: false, error: 'A session already exists for this course, date, and teacher' }, { status: 409 });
    }

    await this.db.prepare(
      `INSERT INTO class_sessions (
        id, institution_id, academic_year_id, academic_term_id, course_id, subject_id,
        teacher_id, lesson_instance_id, lesson_plan_id, planning_id,
        date, start_time, end_time, planned_content, taught_content,
        objective_ids_json, indicators_json, skills_json, attitudes_json,
        dua_supports_json, formative_assessment_json, resources_json,
        teacher_notes, status, version, signed_version, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      institutionId,
      input.academic_year_id,
      input.academic_term_id || null,
      input.course_id,
      input.subject_id,
      input.teacher_id || createdBy,
      input.lesson_instance_id || null,
      input.lesson_plan_id || null,
      input.planning_id || null,
      input.date,
      input.start_time || null,
      input.end_time || null,
      input.planned_content || null,
      input.taught_content || null,
      JSON.stringify(input.objective_ids || []),
      JSON.stringify(input.indicators || []),
      JSON.stringify(input.skills || []),
      JSON.stringify(input.attitudes || []),
      JSON.stringify(input.dua_supports || []),
      JSON.stringify(input.formative_assessment || []),
      JSON.stringify(input.resources || []),
      input.teacher_notes || null,
      input.status || 'scheduled',
      1,
      null,
      createdBy,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();

    return this.getById(id);
  }

  async getById(id: string): Promise<ClassSession | null> {
    const result = await this.db.prepare(
      `SELECT * FROM class_sessions WHERE id = ?`
    ).bind(id).first<ClassSession>();

    if (!result) return null;

    return {
      ...result,
      objective_ids_json: result.objective_ids_json || '[]',
      indicators_json: result.indicators_json || '[]',
      skills_json: result.skills_json || '[]',
      attitudes_json: result.attitudes_json || '[]',
      dua_supports_json: result.dua_supports_json || '[]',
      formative_assessment_json: result.formative_assessment_json || '[]',
      resources_json: result.resources_json || '[]',
    };
  }

  async list(filters: ClassbookFilters, options: ClassbookListOptions = {}): Promise<{ data: ClassSession[]; total: number }> {
    const { limit = 20, offset = 0, order_by = 'date', order_dir = 'desc' } = options;

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
    if (filters.academic_term_id) {
      where += ' AND academic_term_id = ?';
      params.push(filters.academic_term_id);
    }
    if (filters.course_id) {
      where += ' AND course_id = ?';
      params.push(filters.course_id);
    }
    if (filters.subject_id) {
      where += ' AND subject_id = ?';
      params.push(filters.subject_id);
    }
    if (filters.teacher_id) {
      where += ' AND teacher_id = ?';
      params.push(filters.teacher_id);
    }
    if (filters.student_id) {
      where += ' AND id IN (SELECT class_session_id FROM attendance_records WHERE student_id = ?)';
      params.push(filters.student_id);
    }
    if (filters.status) {
      where += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.date_from) {
      where += ' AND date >= ?';
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      where += ' AND date <= ?';
      params.push(filters.date_to);
    }

    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as total FROM class_sessions ${where}`
    ).bind(...params).first<{ total: number }>();

    const results = await this.db.prepare(
      `SELECT * FROM class_sessions ${where} ORDER BY ${order_by} ${order_dir} LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<ClassSession>();

    return {
      data: (results.results || []).map(r => ({
        ...r,
        objective_ids_json: r.objective_ids_json || '[]',
        indicators_json: r.indicators_json || '[]',
        skills_json: r.skills_json || '[]',
        attitudes_json: r.attitudes_json || '[]',
        dua_supports_json: r.dua_supports_json || '[]',
        formative_assessment_json: r.formative_assessment_json || '[]',
        resources_json: r.resources_json || '[]',
      })),
      total: countResult?.total || 0,
    };
  }

  async update(id: string, input: UpdateClassSessionInput): Promise<ClassSession | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (input.academic_term_id !== undefined) {
      updates.push('academic_term_id = ?');
      params.push(input.academic_term_id);
    }
    if (input.taught_content !== undefined) {
      updates.push('taught_content = ?');
      params.push(input.taught_content);
    }
    if (input.objective_ids_json !== undefined) {
      updates.push('objective_ids_json = ?');
      params.push(input.objective_ids_json);
    }
    if (input.indicators_json !== undefined) {
      updates.push('indicators_json = ?');
      params.push(input.indicators_json);
    }
    if (input.skills_json !== undefined) {
      updates.push('skills_json = ?');
      params.push(input.skills_json);
    }
    if (input.attitudes_json !== undefined) {
      updates.push('attitudes_json = ?');
      params.push(input.attitudes_json);
    }
    if (input.dua_supports_json !== undefined) {
      updates.push('dua_supports_json = ?');
      params.push(input.dua_supports_json);
    }
    if (input.formative_assessment_json !== undefined) {
      updates.push('formative_assessment_json = ?');
      params.push(input.formative_assessment_json);
    }
    if (input.resources_json !== undefined) {
      updates.push('resources_json = ?');
      params.push(input.resources_json);
    }
    if (input.teacher_notes !== undefined) {
      updates.push('teacher_notes = ?');
      params.push(input.teacher_notes);
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
      `UPDATE class_sessions SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return this.getById(id);
  }

  async complete(id: string, finalize = false): Promise<ClassSession | null> {
    const session = await this.getById(id);
    if (!session) return null;

    const newStatus = finalize ? 'pending_signature' : 'completed';
    return this.update(id, { status: newStatus });
  }

  async createVersion(input: CreateClassSessionVersionInput): Promise<ClassSessionVersion> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(
      `INSERT INTO class_session_versions (id, class_session_id, institution_id, version, snapshot_json, content_hash, change_reason, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      input.class_session_id,
      input.institution_id,
      input.version,
      input.snapshot_json,
      input.content_hash || null,
      input.change_reason || null,
      input.created_by,
      now
    ).run();

    return this.getVersionById(id);
  }

  async getVersionById(id: string): Promise<ClassSessionVersion | null> {
    const result = await this.db.prepare(
      `SELECT * FROM class_session_versions WHERE id = ?`
    ).bind(id).first<ClassSessionVersion>();

    return result || null;
  }

  async listVersions(classSessionId: string, limit = 20): Promise<ClassSessionVersion[]> {
    const result = await this.db.prepare(
      `SELECT * FROM class_session_versions WHERE class_session_id = ? ORDER BY version DESC LIMIT ?`
    ).bind(classSessionId, limit).all<ClassSessionVersion>();

    return result.results || [];
  }

  async getVersionsBySession(classSessionId: string): Promise<ClassSessionVersion[]> {
    return this.listVersions(classSessionId);
  }

  async createFromLessonInstance(
    lessonInstanceId: string,
    institutionId: string,
    createdBy: string
  ): Promise<ClassSession> {
    const lesson = await this.db.prepare(
      `SELECT li.*, tc.id as course_id, tc.subject_id
       FROM lesson_instances li
       JOIN teacher_classes tc ON li.class_id = tc.id
       WHERE li.id = ?`
    ).bind(lessonInstanceId).first<{
      id: string;
      teacher_id: string;
      class_id: string;
      lesson_date: string;
      start_time: string;
      end_time: string;
      status: string;
      title: string;
      notes: string;
      course_id: string;
      subject_id: string;
    }>();

    if (!lesson) {
      throw new Error('Lesson instance not found');
    }

    const academicYear = await this.db.prepare(
      `SELECT id FROM academic_years WHERE institution_id = ? AND status = 'active' ORDER BY start_date DESC LIMIT 1`
    ).bind(institutionId).first<{ id: string }>();

    if (!academicYear) {
      throw new Error('No active academic year found for this institution');
    }

    return this.create({
      academic_year_id: academicYear.id,
      course_id: lesson.course_id,
      subject_id: lesson.subject_id,
      teacher_id: lesson.teacher_id,
      lesson_instance_id: lessonInstanceId,
      date: lesson.lesson_date,
      start_time: lesson.start_time,
      end_time: lesson.end_time,
      planned_content: lesson.notes || lesson.title,
      status: 'scheduled',
    }, institutionId, createdBy);
  }

  async getByLessonInstance(lessonInstanceId: string): Promise<ClassSession | null> {
    const result = await this.db.prepare(
      `SELECT * FROM class_sessions WHERE lesson_instance_id = ?`
    ).bind(lessonInstanceId).first<ClassSession>();

    if (!result) return null;

    return {
      ...result,
      objective_ids_json: result.objective_ids_json || '[]',
      indicators_json: result.indicators_json || '[]',
      skills_json: result.skills_json || '[]',
      attitudes_json: result.attitudes_json || '[]',
      dua_supports_json: result.dua_supports_json || '[]',
      formative_assessment_json: result.formative_assessment_json || '[]',
      resources_json: result.resources_json || '[]',
    };
  }

  async getByLessonPlan(lessonPlanId: string): Promise<ClassSession | null> {
    const result = await this.db.prepare(
      `SELECT * FROM class_sessions WHERE lesson_plan_id = ?`
    ).bind(lessonPlanId).first<ClassSession>();

    if (!result) return null;

    return {
      ...result,
      objective_ids_json: result.objective_ids_json || '[]',
      indicators_json: result.indicators_json || '[]',
      skills_json: result.skills_json || '[]',
      attitudes_json: result.attitudes_json || '[]',
      dua_supports_json: result.dua_supports_json || '[]',
      formative_assessment_json: result.formative_assessment_json || '[]',
      resources_json: result.resources_json || '[]',
    };
  }

  async getByDateRange(institutionId: string, startDate: string, endDate: string): Promise<ClassSession[]> {
    const result = await this.db.prepare(
      `SELECT * FROM class_sessions WHERE institution_id = ? AND date >= ? AND date <= ? ORDER BY date ASC, start_time ASC`
    ).bind(institutionId, startDate, endDate).all<ClassSession>();

    return (result.results || []).map(r => ({
      ...r,
      objective_ids_json: r.objective_ids_json || '[]',
      indicators_json: r.indicators_json || '[]',
      skills_json: r.skills_json || '[]',
      attitudes_json: r.attitudes_json || '[]',
      dua_supports_json: r.dua_supports_json || '[]',
      formative_assessment_json: r.formative_assessment_json || '[]',
      resources_json: r.resources_json || '[]',
    }));
  }

  async getByTeacherAndDate(teacherId: string, date: string): Promise<ClassSession[]> {
    const result = await this.db.prepare(
      `SELECT * FROM class_sessions WHERE teacher_id = ? AND date = ? ORDER BY start_time ASC`
    ).bind(teacherId, date).all<ClassSession>();

    return (result.results || []).map(r => ({
      ...r,
      objective_ids_json: r.objective_ids_json || '[]',
      indicators_json: r.indicators_json || '[]',
      skills_json: r.skills_json || '[]',
      attitudes_json: r.attitudes_json || '[]',
      dua_supports_json: r.dua_supports_json || '[]',
      formative_assessment_json: r.formative_assessment_json || '[]',
      resources_json: r.resources_json || '[]',
    }));
  }

  async getByCourseAndDate(courseId: string, date: string): Promise<ClassSession[]> {
    const result = await this.db.prepare(
      `SELECT * FROM class_sessions WHERE course_id = ? AND date = ? ORDER BY start_time ASC`
    ).bind(courseId, date).all<ClassSession>();

    return (result.results || []).map(r => ({
      ...r,
      objective_ids_json: r.objective_ids_json || '[]',
      indicators_json: r.indicators_json || '[]',
      skills_json: r.skills_json || '[]',
      attitudes_json: r.attitudes_json || '[]',
      dua_supports_json: r.dua_supports_json || '[]',
      formative_assessment_json: r.formative_assessment_json || '[]',
      resources_json: r.resources_json || '[]',
    }));
  }
}