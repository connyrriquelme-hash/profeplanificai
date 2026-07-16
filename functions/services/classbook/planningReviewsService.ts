import { D1Database } from '@cloudflare/workers-types';
import {
  PlanningReview,
  CreatePlanningReviewInput,
  UpdatePlanningReviewInput,
  ClassbookFilters,
  ClassbookListOptions,
} from '../../types/classbook';

export interface PlanningReviewServiceEnv {
  DB: D1Database;
}

export class PlanningReviewService {
  private db: D1Database;

  constructor(env: PlanningReviewServiceEnv) {
    this.db = env.DB;
  }

  async getById(id: string): Promise<PlanningReview | null> {
    const result = await this.db.prepare(
      `SELECT * FROM planning_reviews WHERE id = ?`
    ).bind(id).first<PlanningReview>();

    return result || null;
  }

  async list(filters: ClassbookFilters, options: ClassbookListOptions = {}): Promise<{ data: PlanningReview[]; total: number }> {
    const { limit = 20, offset = 0, order_by = 'created_at', order_dir = 'desc' } = options;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters.institution_id) {
      where += ' AND institution_id = ?';
      params.push(filters.institution_id);
    }
    if (filters.planning_id) {
      where += ' AND planning_id = ?';
      params.push(filters.planning_id);
    }
    if (filters.reviewer_id) {
      where += ' AND reviewer_id = ?';
      params.push(filters.reviewer_id);
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
      `SELECT COUNT(*) as total FROM planning_reviews ${where}`
    ).bind(...params).first<{ total: number }>();

    const results = await this.db.prepare(
      `SELECT * FROM planning_reviews ${where} ORDER BY ${order_by} ${order_dir} LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<PlanningReview>();

    return {
      data: results.results || [],
      total: countResult?.total || 0,
    };
  }

  async create(input: CreatePlanningReviewInput): Promise<PlanningReview> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(
      `INSERT INTO planning_reviews (id, institution_id, planning_id, reviewer_id, status, comments, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      input.institution_id,
      input.planning_id,
      input.reviewer_id,
      input.status || 'pending',
      input.comments || null,
      now,
      now
    ).run();

    return this.getById(id);
  }

  async update(id: string, input: UpdatePlanningReviewInput): Promise<PlanningReview | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
      if (input.status !== 'pending' && !input.reviewed_at) {
        updates.push('reviewed_at = ?');
        params.push(new Date().toISOString());
      }
    }
    if (input.comments !== undefined) {
      updates.push('comments = ?');
      params.push(input.comments);
    }
    if (input.reviewed_at !== undefined) {
      updates.push('reviewed_at = ?');
      params.push(input.reviewed_at);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await this.db.prepare(
      `UPDATE planning_reviews SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return this.getById(id);
  }

  async approve(id: string, reviewerId: string, comments?: string): Promise<PlanningReview | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    if (existing.reviewer_id !== reviewerId) {
      throw new Error('Only the assigned reviewer can approve this review');
    }

    return this.update(id, {
      status: 'approved',
      comments: comments || existing.comments,
      reviewed_at: new Date().toISOString(),
    });
  }

  async observe(id: string, reviewerId: string, comments?: string): Promise<PlanningReview | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    if (existing.reviewer_id !== reviewerId) {
      throw new Error('Only the assigned reviewer can observe this review');
    }

    return this.update(id, {
      status: 'observed',
      comments: comments || existing.comments,
      reviewed_at: new Date().toISOString(),
    });
  }

  async return(id: string, reviewerId: string, comments?: string): Promise<PlanningReview | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    if (existing.reviewer_id !== reviewerId) {
      throw new Error('Only the assigned reviewer can return this review');
    }

    return this.update(id, {
      status: 'returned',
      comments: comments || existing.comments,
      reviewed_at: new Date().toISOString(),
    });
  }

  async archive(id: string): Promise<PlanningReview | null> {
    return this.update(id, { status: 'archived' });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM planning_reviews WHERE id = ?`
    ).bind(id).run();

    return (result.changes || 0) > 0;
  }

  async getByPlanning(planningId: string): Promise<PlanningReview[]> {
    const result = await this.db.prepare(
      `SELECT * FROM planning_reviews WHERE planning_id = ? ORDER BY created_at DESC`
    ).bind(planningId).all<PlanningReview>();

    return result.results || [];
  }

  async getLatestByPlanning(planningId: string): Promise<PlanningReview | null> {
    const result = await this.db.prepare(
      `SELECT * FROM planning_reviews WHERE planning_id = ? ORDER BY created_at DESC LIMIT 1`
    ).bind(planningId).first<PlanningReview>();

    return result || null;
  }

  async getByReviewer(reviewerId: string, institutionId?: string, status?: string): Promise<PlanningReview[]> {
    let query = `SELECT * FROM planning_reviews WHERE reviewer_id = ?`;
    const params: (string | number)[] = [reviewerId];

    if (institutionId) {
      query += ` AND institution_id = ?`;
      params.push(institutionId);
    }
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.db.prepare(query).bind(...params).all<PlanningReview>();
    return result.results || [];
  }

  async getByInstitution(institutionId: string, status?: string, limit = 50): Promise<PlanningReview[]> {
    let query = `SELECT * FROM planning_reviews WHERE institution_id = ?`;
    const params: (string | number)[] = [institutionId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const result = await this.db.prepare(query).bind(...params).all<PlanningReview>();
    return result.results || [];
  }

  async getPendingForReviewer(reviewerId: string, institutionId: string): Promise<PlanningReview[]> {
    return this.getByReviewer(reviewerId, institutionId, 'pending');
  }

  async getStatsByInstitution(institutionId: string): Promise<Record<string, number>> {
    const result = await this.db.prepare(
      `SELECT status, COUNT(*) as count FROM planning_reviews WHERE institution_id = ? GROUP BY status`
    ).bind(institutionId).all<{ status: string; count: number }>();

    return Object.fromEntries((result.results || []).map(r => [r.status, r.count]));
  }

  async getStatsByReviewer(reviewerId: string, institutionId: string): Promise<Record<string, number>> {
    const result = await this.db.prepare(
      `SELECT status, COUNT(*) as count FROM planning_reviews WHERE reviewer_id = ? AND institution_id = ? GROUP BY status`
    ).bind(reviewerId, institutionId).all<{ status: string; count: number }>();

    return Object.fromEntries((result.results || []).map(r => [r.status, r.count]));
  }

  async getPendingCount(institutionId: string): Promise<number> {
    const result = await this.db.prepare(
      `SELECT COUNT(*) as c FROM planning_reviews WHERE institution_id = ? AND status = 'pending'`
    ).bind(institutionId).first<{ c: number }>();

    return result?.c || 0;
  }

  async getOverdueReviews(institutionId: string, days = 7): Promise<PlanningReview[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const result = await this.db.prepare(
      `SELECT * FROM planning_reviews WHERE institution_id = ? AND status = 'pending' AND created_at <= ? ORDER BY created_at ASC`
    ).bind(institutionId, since).all<PlanningReview>();

    return result.results || [];
  }
}

const now = new Date().toISOString();