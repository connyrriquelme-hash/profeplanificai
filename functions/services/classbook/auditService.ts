import { D1Database } from '@cloudflare/workers-types';
import {
  ClassbookAuditEntry,
  CreateClassbookAuditInput,
  ClassbookFilters,
  ClassbookListOptions,
} from '../../types/classbook';

export interface AuditServiceEnv {
  DB: D1Database;
}

export class ClassbookAuditService {
  private db: D1Database;

  constructor(env: AuditServiceEnv) {
    this.db = env.DB;
  }

  async log(input: CreateClassbookAuditInput): Promise<ClassbookAuditEntry> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const metadataJson = input.metadata_json ? JSON.stringify(input.metadata_json) : null;

    await this.db.prepare(
      `INSERT INTO classbook_audit_log (id, institution_id, actor_user_id, action, resource_type, resource_id, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      input.institution_id,
      input.actor_user_id,
      input.action,
      input.resource_type,
      input.resource_id || null,
      metadataJson,
      now
    ).run();

    return this.getById(id);
  }

  async getById(id: string): Promise<ClassbookAuditEntry | null> {
    const result = await this.db.prepare(
      `SELECT * FROM classbook_audit_log WHERE id = ?`
    ).bind(id).first<ClassbookAuditEntry>();

    if (!result) return null;

    return {
      ...result,
      metadata_json: result.metadata_json ? JSON.parse(result.metadata_json) : null,
    };
  }

  async list(filters: ClassbookFilters, options: ClassbookListOptions = {}): Promise<{ data: ClassbookAuditEntry[]; total: number }> {
    const { limit = 50, offset = 0, order_by = 'created_at', order_dir = 'desc' } = options;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters.institution_id) {
      where += ' AND institution_id = ?';
      params.push(filters.institution_id);
    }
    if (filters.actor_user_id) {
      where += ' AND actor_user_id = ?';
      params.push(filters.actor_user_id);
    }
    if (filters.action) {
      where += ' AND action = ?';
      params.push(filters.action);
    }
    if (filters.resource_type) {
      where += ' AND resource_type = ?';
      params.push(filters.resource_type);
    }
    if (filters.resource_id) {
      where += ' AND resource_id = ?';
      params.push(filters.resource_id);
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
      `SELECT COUNT(*) as total FROM classbook_audit_log ${where}`
    ).bind(...params).first<{ total: number }>();

    const results = await this.db.prepare(
      `SELECT * FROM classbook_audit_log ${where} ORDER BY ${order_by} ${order_dir} LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<ClassbookAuditEntry>();

    return {
      data: (results.results || []).map(r => ({
        ...r,
        metadata_json: r.metadata_json ? JSON.parse(r.metadata_json) : null,
      })),
      total: countResult?.total || 0,
    };
  }

  async logCreate(institutionId: string, actorUserId: string, resourceType: string, resourceId: string, metadata?: Record<string, unknown>): Promise<ClassbookAuditEntry> {
    return this.log({
      institution_id: institutionId,
      actor_user_id: actorUserId,
      action: 'create',
      resource_type: resourceType,
      resource_id: resourceId,
      metadata_json: metadata,
    });
  }

  async logUpdate(institutionId: string, actorUserId: string, resourceType: string, resourceId: string, before: Record<string, unknown>, after: Record<string, unknown>): Promise<ClassbookAuditEntry> {
    return this.log({
      institution_id: institutionId,
      actor_user_id: actorUserId,
      action: 'update',
      resource_type: resourceType,
      resource_id: resourceId,
      metadata_json: { before, after },
    });
  }

  async logDelete(institutionId: string, actorUserId: string, resourceType: string, resourceId: string): Promise<ClassbookAuditEntry> {
    return this.log({
      institution_id: institutionId,
      actor_user_id: actorUserId,
      action: 'delete',
      resource_type: resourceType,
      resource_id: resourceId,
    });
  }

  async logSign(institutionId: string, actorUserId: string, sessionId: string, metadata?: Record<string, unknown>): Promise<ClassbookAuditEntry> {
    return this.log({
      institution_id: institutionId,
      actor_user_id: actorUserId,
      action: 'sign',
      resource_type: 'class_session',
      resource_id: institutionId,
      metadata_json: { session_id: sessionId, ...metadata },
    });
  }

  async logReview(institutionId: string, actorUserId: string, planningId: string, action: 'approve' | 'observe' | 'return', comments?: string): Promise<ClassbookAuditEntry> {
    return this.log({
      institution_id: institutionId,
      actor_user_id: actorUserId,
      action: `review_${action}`,
      resource_type: 'planning_review',
      resource_id: planningId,
      metadata_json: { comments },
    });
  }

  async logAttendance(institutionId: string, actorUserId: string, sessionId: string, studentId: string, status: string): Promise<ClassbookAuditEntry> {
    return this.log({
      institution_id: institutionId,
      actor_user_id: actorUserId,
      action: 'record_attendance',
      resource_type: 'attendance_record',
      resource_id: sessionId,
      metadata_json: { student_id: studentId, status },
    });
  }

  async logObservation(institutionId: string, actorUserId: string, observationId: string, action: 'create' | 'update' | 'archive'): Promise<ClassbookAuditEntry> {
    return this.log({
      institution_id: institutionId,
      actor_user_id: actorUserId,
      action: `observation_${action}`,
      resource_type: 'student_observation',
      resource_id: observationId,
    });
  }

  async logEnrollment(institutionId: string, actorUserId: string, enrollmentId: string, action: 'create' | 'update' | 'delete'): Promise<ClassbookAuditEntry> {
    return this.log({
      institution_id: institutionId,
      actor_user_id: actorUserId,
      action: `enrollment_${action}`,
      resource_type: 'course_enrollment',
      resource_id: enrollmentId,
    });
  }

  async logStudentProfile(institutionId: string, actorUserId: string, studentId: string, action: 'create' | 'update' | 'archive' | 'restore'): Promise<ClassbookAuditEntry> {
    return this.log({
      institution_id: institutionId,
      actor_user_id: actorUserId,
      action: `student_${action}`,
      resource_type: 'student_profile',
      resource_id: studentId,
    });
  }

  async getByInstitution(institutionId: string, limit = 100): Promise<ClassbookAuditEntry[]> {
    const result = await this.db.prepare(
      `SELECT * FROM classbook_audit_log WHERE institution_id = ? ORDER BY created_at DESC LIMIT ?`
    ).bind(institutionId, limit).all<ClassbookAuditEntry>();

    return (result.results || []).map(r => ({
      ...r,
      metadata_json: r.metadata_json ? JSON.parse(r.metadata_json) : null,
    }));
  }

  async getByActor(actorUserId: string, institutionId: string, limit = 50): Promise<ClassbookAuditEntry[]> {
    const result = await this.db.prepare(
      `SELECT * FROM classbook_audit_log WHERE actor_user_id = ? AND institution_id = ? ORDER BY created_at DESC LIMIT ?`
    ).bind(actorUserId, institutionId, limit).all<ClassbookAuditEntry>();

    return (result.results || []).map(r => ({
      ...r,
      metadata_json: r.metadata_json ? JSON.parse(r.metadata_json) : null,
    }));
  }

  async getByResource(resourceType: string, resourceId: string): Promise<ClassbookAuditEntry[]> {
    const result = await this.db.prepare(
      `SELECT * FROM classbook_audit_log WHERE resource_type = ? AND resource_id = ? ORDER BY created_at DESC`
    ).bind(resourceType, resourceId).all<ClassbookAuditEntry>();

    return (result.results || []).map(r => ({
      ...r,
      metadata_json: r.metadata_json ? JSON.parse(r.metadata_json) : null,
    }));
  }

  async getRecent(institutionId: string, hours = 24): Promise<ClassbookAuditEntry[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const result = await this.db.prepare(
      `SELECT * FROM classbook_audit_log WHERE institution_id = ? AND created_at >= ? ORDER BY created_at DESC`
    ).bind(institutionId, since).all<ClassbookAuditEntry>();

    return (result.results || []).map(r => ({
      ...r,
      metadata_json: r.metadata_json ? JSON.parse(r.metadata_json) : null,
    }));
  }

  async getStats(institutionId: string, days = 30): Promise<{
    total: number;
    byAction: Record<string, number>;
    byResourceType: Record<string, number>;
    byActor: Record<string, number>;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [totalResult, actionResult, resourceResult, actorResult] = await Promise.all([
      this.db.prepare(
        `SELECT COUNT(*) as c FROM classbook_audit_log WHERE institution_id = ? AND created_at >= ?`
      ).bind(institutionId, since).first<{ c: number }>(),
      this.db.prepare(
        `SELECT action, COUNT(*) as c FROM classbook_audit_log WHERE institution_id = ? AND created_at >= ? GROUP BY action`
      ).bind(institutionId, since).all<{ action: string; c: number }>(),
      this.db.prepare(
        `SELECT resource_type, COUNT(*) as c FROM classbook_audit_log WHERE institution_id = ? AND created_at >= ? GROUP BY resource_type`
      ).bind(institutionId, since).all<{ resource_type: string; c: number }>(),
      this.db.prepare(
        `SELECT actor_user_id, COUNT(*) as c FROM classbook_audit_log WHERE institution_id = ? AND created_at >= ? GROUP BY actor_user_id ORDER BY c DESC LIMIT 10`
      ).bind(institutionId, since).all<{ actor_user_id: string; c: number }>(),
    ]);

    return {
      total: totalResult?.c || 0,
      byAction: Object.fromEntries((actionResult.results || []).map(r => [r.action, r.c])),
      byResourceType: Object.fromEntries((resourceResult.results || []).map(r => [r.resource_type, r.c])),
      byActor: Object.fromEntries((actorResult.results || []).map(r => [r.actor_user_id, r.c])),
    };
  }
}

const now = new Date().toISOString();