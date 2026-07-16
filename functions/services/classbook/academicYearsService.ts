import { D1Database } from '@cloudflare/workers-types';
import {
  AcademicYear,
  AcademicTerm,
  CreateAcademicYearInput,
  UpdateAcademicYearInput,
  CreateAcademicTermInput,
  UpdateAcademicTermInput,
  ClassbookFilters,
  ClassbookListOptions,
} from '../../types/classbook';

export interface AcademicYearServiceEnv {
  DB: D1Database;
}

export class AcademicYearService {
  private db: D1Database;

  constructor(env: AcademicYearServiceEnv) {
    this.db = env.DB;
  }

  async create(input: CreateAcademicYearInput, institutionId: string): Promise<AcademicYear> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(
      `INSERT INTO academic_years (id, institution_id, name, start_date, end_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, institutionId, input.name, input.start_date, input.end_date, input.status || 'planning', now, now).run();

    return this.getById(id);
  }

  async getById(id: string): Promise<AcademicYear | null> {
    const result = await this.db.prepare(
      `SELECT * FROM academic_years WHERE id = ?`
    ).bind(id).first<AcademicYear>();

    return result || null;
  }

  async list(filters: ClassbookFilters, options: ClassbookListOptions = {}): Promise<{ data: AcademicYear[]; total: number }> {
    const { limit = 20, offset = 0, order_by = 'start_date', order_dir = 'desc' } = options;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters.institution_id) {
      where += ' AND institution_id = ?';
      params.push(filters.institution_id);
    }
    if (filters.status) {
      where += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.date_from) {
      where += ' AND start_date >= ?';
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      where += ' AND end_date <= ?';
      params.push(filters.date_to);
    }

    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as total FROM academic_years ${where}`
    ).bind(...params).first<{ total: number }>();

    const results = await this.db.prepare(
      `SELECT * FROM academic_years ${where} ORDER BY ${order_by} ${order_dir} LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<AcademicYear>();

    return {
      data: results.results || [],
      total: countResult?.total || 0,
    };
  }

  async update(id: string, input: UpdateAcademicYearInput): Promise<AcademicYear | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.start_date !== undefined) {
      updates.push('start_date = ?');
      params.push(input.start_date);
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
      `UPDATE academic_years SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM academic_years WHERE id = ?`
    ).bind(id).run();

    return (result.changes || 0) > 0;
  }

  async getByInstitution(institutionId: string, status?: string): Promise<AcademicYear[]> {
    let query = `SELECT * FROM academic_years WHERE institution_id = ?`;
    const params: (string | number)[] = [institutionId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY start_date DESC`;

    const result = await this.db.prepare(query).bind(...params).all<AcademicYear>();
    return result.results || [];
  }
}

export class AcademicTermService {
  private db: D1Database;

  constructor(env: AcademicYearServiceEnv) {
    this.db = env.DB;
  }

  async create(input: CreateAcademicTermInput, institutionId: string): Promise<AcademicTerm> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(
      `INSERT INTO academic_terms (id, academic_year_id, institution_id, name, start_date, end_date, sort_order, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, input.academic_year_id, institutionId, input.name, input.start_date, input.end_date, input.sort_order || 0, input.status || 'planning', now, now).run();

    return this.getById(id);
  }

  async getById(id: string): Promise<AcademicTerm | null> {
    const result = await this.db.prepare(
      `SELECT * FROM academic_terms WHERE id = ?`
    ).bind(id).first<AcademicTerm>();

    return result || null;
  }

  async list(filters: ClassbookFilters, options: ClassbookListOptions = {}): Promise<{ data: AcademicTerm[]; total: number }> {
    const { limit = 20, offset = 0, order_by = 'sort_order', order_dir = 'asc' } = options;

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
    if (filters.status) {
      where += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.date_from) {
      where += ' AND start_date >= ?';
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      where += ' AND end_date <= ?';
      params.push(filters.date_to);
    }

    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as total FROM academic_terms ${where}`
    ).bind(...params).first<{ total: number }>();

    const results = await this.db.prepare(
      `SELECT * FROM academic_terms ${where} ORDER BY ${order_by} ${order_dir} LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<AcademicTerm>();

    return {
      data: results.results || [],
      total: countResult?.total || 0,
    };
  }

  async update(id: string, input: UpdateAcademicTermInput): Promise<AcademicTerm | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.start_date !== undefined) {
      updates.push('start_date = ?');
      params.push(input.start_date);
    }
    if (input.end_date !== undefined) {
      updates.push('end_date = ?');
      params.push(input.end_date);
    }
    if (input.sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(input.sort_order);
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
      `UPDATE academic_terms SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM academic_terms WHERE id = ?`
    ).bind(id).run();

    return (result.changes || 0) > 0;
  }

  async getByAcademicYear(academicYearId: string, status?: string): Promise<AcademicTerm[]> {
    let query = `SELECT * FROM academic_terms WHERE academic_year_id = ?`;
    const params: (string | number)[] = [academicYearId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY sort_order ASC, start_date ASC`;

    const result = await this.db.prepare(query).bind(...params).all<AcademicTerm>();
    return result.results || [];
  }
}