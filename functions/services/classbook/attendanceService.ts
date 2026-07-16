import { D1Database } from '@cloudflare/workers-types';
import {
  AttendanceRecord,
  CreateAttendanceRecordInput,
  UpdateAttendanceRecordInput,
  BatchAttendanceInput,
  ClassbookFilters,
  ClassbookListOptions,
} from '../../types/classbook';

export interface AttendanceServiceEnv {
  DB: D1Database;
}

export class AttendanceService {
  private db: D1Database;

  constructor(env: AttendanceServiceEnv) {
    this.db = env.DB;
  }

  async getById(id: string): Promise<AttendanceRecord | null> {
    const result = await this.db.prepare(
      `SELECT * FROM attendance_records WHERE id = ?`
    ).bind(id).first<AttendanceRecord>();

    return result || null;
  }

  async getBySessionAndStudent(classSessionId: string, studentId: string): Promise<AttendanceRecord | null> {
    const result = await this.db.prepare(
      `SELECT * FROM attendance_records WHERE class_session_id = ? AND student_id = ?`
    ).bind(classSessionId, studentId).first<AttendanceRecord>();

    return result || null;
  }

  async list(filters: ClassbookFilters, options: ClassbookListOptions = {}): Promise<{ data: AttendanceRecord[]; total: number }> {
    const { limit = 50, offset = 0, order_by = 'created_at', order_dir = 'desc' } = options;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters.institution_id) {
      where += ' AND institution_id = ?';
      params.push(filters.institution_id);
    }
    if (filters.class_session_id) {
      where += ' AND class_session_id = ?';
      params.push(filters.class_session_id);
    }
    if (filters.student_id) {
      where += ' AND student_id = ?';
      params.push(filters.student_id);
    }
    if (filters.status) {
      where += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.date_from) {
      where += ' AND created_at >= ?';
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      where += ' AND created_at <= ?';
      params.push(filters.date_to);
    }

    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as total FROM attendance_records ${where}`
    ).bind(...params).first<{ total: number }>();

    const results = await this.db.prepare(
      `SELECT * FROM attendance_records ${where} ORDER BY ${order_by} ${order_dir} LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<AttendanceRecord>();

    return {
      data: results.results || [],
      total: countResult?.total || 0,
    };
  }

  async create(input: CreateAttendanceRecordInput): Promise<AttendanceRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const existing = await this.db.prepare(
      `SELECT id FROM attendance_records WHERE class_session_id = ? AND student_id = ?`
    ).bind(input.class_session_id, input.student_id).first();

    if (existing) {
      throw Response.json({ ok: false, error: 'Attendance record already exists for this student in this session' }, { status: 409 });
    }

    await this.db.prepare(
      `INSERT INTO attendance_records (id, institution_id, class_session_id, student_id, status, arrival_time, departure_time, justification, recorded_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      input.institution_id,
      input.class_session_id,
      input.student_id,
      input.status || 'present',
      input.arrival_time || null,
      input.departure_time || null,
      input.justification || null,
      input.recorded_by,
      now,
      now
    ).run();

    return this.getById(id);
  }

  async update(id: string, input: UpdateAttendanceRecordInput): Promise<AttendanceRecord | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }
    if (input.arrival_time !== undefined) {
      updates.push('arrival_time = ?');
      params.push(input.arrival_time);
    }
    if (input.departure_time !== undefined) {
      updates.push('departure_time = ?');
      params.push(input.departure_time);
    }
    if (input.justification !== undefined) {
      updates.push('justification = ?');
      params.push(input.justification);
    }
    if (input.confirmed_at !== undefined) {
      updates.push('confirmed_at = ?');
      params.push(input.confirmed_at);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await this.db.prepare(
      `UPDATE attendance_records SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return this.getById(id);
  }

  async upsert(input: CreateAttendanceRecordInput): Promise<AttendanceRecord> {
    const existing = await this.getBySessionAndStudent(input.class_session_id, input.student_id);
    if (existing) {
      return this.update(existing.id, input);
    }
    return this.create(input);
  }

  async batchUpsert(input: BatchAttendanceInput): Promise<{ created: number; updated: number; records: AttendanceRecord[] }> {
    let created = 0;
    let updated = 0;
    const records: AttendanceRecord[] = [];

    for (const record of input.records) {
      const existing = await this.getBySessionAndStudent(input.recorded_by, record.student_id);
      if (existing) {
        const result = await this.update(existing.id, {
          status: record.status,
          arrival_time: record.arrival_time,
          departure_time: record.departure_time,
          justification: record.justification,
        });
        if (result) {
          records.push(result);
          updated++;
        }
      } else {
        const result = await this.create({
          institution_id: existing.institution_id, // This needs to be passed
          class_session_id: existing.class_session_id, // This needs to be passed
          student_id: record.student_id,
          status: record.status,
          arrival_time: record.arrival_time,
          departure_time: record.departure_time,
          justification: record.justification,
          recorded_by: input.recorded_by,
        });
        records.push(result);
        created++;
      }
    }

    return { created, updated, records };
  }

  async batchUpsertForSession(
    classSessionId: string,
    institutionId: string,
    input: BatchAttendanceInput
  ): Promise<{ created: number; updated: number; records: AttendanceRecord[] }> {
    let created = 0;
    let updated = 0;
    const records: AttendanceRecord[] = [];

    for (const record of input.records) {
      const existing = await this.getBySessionAndStudent(classSessionId, record.student_id);
      if (existing) {
        const result = await this.update(existing.id, {
          status: record.status,
          arrival_time: record.arrival_time,
          departure_time: record.departure_time,
          justification: record.justification,
        });
        if (result) {
          records.push(result);
          updated++;
        }
      } else {
        const result = await this.create({
          institution_id: institutionId,
          class_session_id: classSessionId,
          student_id: record.student_id,
          status: record.status,
          arrival_time: record.arrival_time,
          departure_time: record.departure_time,
          justification: record.justification,
          recorded_by: input.recorded_by,
        });
        records.push(result);
        created++;
      }
    }

    return { created, updated, records };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM attendance_records WHERE id = ?`
    ).bind(id).run();

    return (result.changes || 0) > 0;
  }

  async getBySession(classSessionId: string): Promise<AttendanceRecord[]> {
    const result = await this.db.prepare(
      `SELECT * FROM attendance_records WHERE class_session_id = ? ORDER BY created_at ASC`
    ).bind(classSessionId).all<AttendanceRecord>();

    return result.results || [];
  }

  async getByStudent(studentId: string, institutionId: string): Promise<AttendanceRecord[]> {
    const result = await this.db.prepare(
      `SELECT ar.* FROM attendance_records ar
       JOIN class_sessions cs ON ar.class_session_id = cs.id
       WHERE ar.student_id = ? AND cs.institution_id = ?
       ORDER BY ar.created_at DESC`
    ).bind(studentId, institutionId).all<AttendanceRecord>();

    return result.results || [];
  }

  async getStatsBySession(classSessionId: string): Promise<{
    total: number;
    present: number;
    absent: number;
    late: number;
    justified: number;
    early_leave: number;
    external_activity: number;
  }> {
    const result = await this.db.prepare(
      `SELECT status, COUNT(*) as count FROM attendance_records
       WHERE class_session_id = ?
       GROUP BY status`
    ).bind(classSessionId).all<{ status: string; count: number }>();

    const stats = {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      justified: 0,
      early_leave: 0,
      external_activity: 0,
    };

    for (const row of result.results || []) {
      stats.total += row.count;
      if (row.status in stats) {
        stats[row.status as keyof typeof stats] = row.count;
      }
    }

    return stats;
  }

  async getStudentAttendanceRate(studentId: string, institutionId: string, academicYearId?: string): Promise<number> {
    let query = `
      SELECT COUNT(*) as total,
             SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
      FROM attendance_records ar
      JOIN class_sessions cs ON ar.class_session_id = cs.id
      WHERE ar.student_id = ? AND cs.institution_id = ?
    `;
    const params: (string | number)[] = [studentId, institutionId];

    if (academicYearId) {
      query += ` AND cs.academic_year_id = ?`;
      params.push(academicYearId);
    }

    const result = await this.db.prepare(query).bind(...params).first<{ total: number; present: number }>();

    if (!result || result.total === 0) return 0;
    return (result.present || 0) / result.total;
  }
}

const now = new Date().toISOString();