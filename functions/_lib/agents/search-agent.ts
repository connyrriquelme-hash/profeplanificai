import type { Env } from '../../_middleware';

export interface SearchIndex {
  id: string;
  title: string;
  content: string;
  doc_type: 'objective' | 'indicator' | 'skill' | 'attitude' | 'methodology' | 'template' | 'resource';
  ref_id: string;
  level: string;
  subject: string;
  axis: string;
  objective_code: string;
  tags_json: string;
  search_vector: string;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  doc_type: string;
  ref_id: string;
  level: string;
  subject: string;
  axis: string;
  objective_code: string;
  tags: string[];
  relevance_score?: number;
  created_at: string;
}

export class SearchAgent {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async indexDocument(document: {
    id: string;
    title: string;
    content: string;
    doc_type: SearchIndex['doc_type'];
    ref_id: string;
    level?: string;
    subject?: string;
    axis?: string;
    objective_code?: string;
    tags?: string[];
  }): Promise<void> {
    const now = new Date().toISOString();
    const tags_json = JSON.stringify(document.tags || []);

    await this.env.DB.prepare(
      `INSERT OR REPLACE INTO search_documents (
        id, title, content, doc_type, ref_id,
        level, subject, axis, objective_code, tags_json,
        search_vector, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      document.id,
      document.title,
      document.content,
      document.doc_type,
      document.ref_id,
      document.level,
      document.subject,
      document.axis,
      document.objective_code,
      tags_json,
      this.generateSearchVector(document.title, document.content),
      now,
      now
    ).run();
  }

  async search(query: string, filters?: {
    doc_type?: SearchIndex['doc_type'];
    level?: string;
    subject?: string;
    axis?: string;
    objective_code?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<SearchResult[]> {
    let sql = `
      SELECT id, title, content, doc_type, ref_id,
             level, subject, axis, objective_code, tags_json,
             created_at
      FROM search_documents
      WHERE (
        title LIKE ? OR content LIKE ? OR tags_json LIKE ?
      )
    `;
    const params: unknown[] = [
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
    ];

    if (filters?.doc_type) {
      sql += ` AND doc_type = ?`;
      params.push(filters.doc_type);
    }

    if (filters?.level) {
      sql += ` AND level LIKE ?`;
      params.push(`%${filters.level}%`);
    }

    if (filters?.subject) {
      sql += ` AND subject LIKE ?`;
      params.push(`%${filters.subject}%`);
    }

    if (filters?.axis) {
      sql += ` AND axis LIKE ?`;
      params.push(`%${filters.axis}%`);
    }

    if (filters?.objective_code) {
      sql += ` AND objective_code LIKE ?`;
      params.push(`%${filters.objective_code}%`);
    }

    if (filters?.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(() => `tags_json LIKE ?`).join(' OR ');
      sql += ` AND (${tagConditions})`;
      filters.tags.forEach(tag => params.push(`%${tag}%`));
    }

    sql += ` ORDER BY created_at DESC`;

    if (filters?.limit) {
      sql += ` LIMIT ?`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      sql += ` OFFSET ?`;
      params.push(filters.offset);
    }

    const { results } = await this.env.DB.prepare(sql).bind(...params).all();

    return results.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content.substring(0, 200) + '...',
      doc_type: doc.doc_type,
      ref_id: doc.ref_id,
      level: doc.level,
      subject: doc.subject,
      axis: doc.axis,
      objective_code: doc.objective_code,
      tags: JSON.parse(doc.tags_json),
      created_at: doc.created_at,
    }));
  }

  private generateSearchVector(title: string, content: string): string {
    const vector = `${title} ${content}`
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúüñ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return btoa(vector).slice(0, 100);
  }

  async getAllDocTypes(): Promise<string[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT DISTINCT doc_type FROM search_documents ORDER BY doc_type`
    ).all();

    return results.map((row: any) => row.doc_type);
  }

  async getAllLevels(): Promise<string[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT DISTINCT level FROM search_documents WHERE level IS NOT NULL ORDER BY level`
    ).all();

    return results.map((row: any) => row.level);
  }

  async getAllSubjects(): Promise<string[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT DISTINCT subject FROM search_documents WHERE subject IS NOT NULL ORDER BY subject`
    ).all();

    return results.map((row: any) => row.subject);
  }

  async createFullTextSearchIndex(): Promise<void> {
    await this.env.DB.prepare(
      `CREATE VIRTUAL TABLE search_documents_fts USING fts5(
        title, content, tags_json,
        level, subject, axis, objective_code,
        doc_type,
        tokenize='porter'
      )`
    ).run();

    await this.env.DB.prepare(
      `INSERT INTO search_documents_fts (id, title, content, tags_json, level, subject, axis, objective_code, doc_type)
       SELECT id, title, content, tags_json, level, subject, axis, objective_code, doc_type
       FROM search_documents`
    ).run();
  }

  async searchAdvanced(query: string, filters?: {
    doc_type?: SearchIndex['doc_type'];
    level?: string;
    subject?: string;
    axis?: string;
    objective_code?: string;
    tags?: string[];
    fields?: string[]; // Campos específicos para buscar
  }): Promise<SearchResult[]> {
    const fields = filters?.fields || ['title', 'content', 'tags_json'];
    const whereConditions: string[] = [];

    for (const field of fields) {
      whereConditions.push(`${field} LIKE ?`);
    }

    let whereClause = whereConditions.join(' OR ');

    if (filters?.doc_type) {
      whereClause += ` AND doc_type = ?`;
    }

    if (filters?.level) {
      whereClause += ` AND level LIKE ?`;
    }

    if (filters?.subject) {
      whereClause += ` AND subject LIKE ?`;
    }

    if (filters?.axis) {
      whereClause += ` AND axis LIKE ?`;
    }

    if (filters?.objective_code) {
      whereClause += ` AND objective_code LIKE ?`;
    }

    const params: unknown[] = [];

    for (let i = 0; i < fields.length; i++) {
      params.push(`%${query}%`);
    }

    if (filters?.doc_type) params.push(filters.doc_type);
    if (filters?.level) params.push(`%${filters.level}%`);
    if (filters?.subject) params.push(`%${filters.subject}%`);
    if (filters?.axis) params.push(`%${filters.axis}%`);
    if (filters?.objective_code) params.push(`%${filters.objective_code}%`);

    const sql = `
      SELECT id, title, content, doc_type, ref_id,
             level, subject, axis, objective_code, tags_json,
             created_at
      FROM search_documents
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const { results } = await this.env.DB.prepare(sql).bind(...params).all();

    return results.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content.substring(0, 200) + '...',
      doc_type: doc.doc_type,
      ref_id: doc.ref_id,
      level: doc.level,
      subject: doc.subject,
      axis: doc.axis,
      objective_code: doc.objective_code,
      tags: JSON.parse(doc.tags_json),
      relevance_score: this.calculateRelevanceScore(query, doc.title, doc.content),
      created_at: doc.created_at,
    }));
  }

  private calculateRelevanceScore(query: string, title: string, content: string): number {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    let score = 0;

    if (titleLower.includes(queryLower)) score += 10;
    if (contentLower.includes(queryLower)) score += 5;

    const queryWords = queryLower.split(' ').filter(w => w.length > 3);
    const titleWords = titleLower.split(' ');
    const contentWords = contentLower.split(' ');

    for (const word of queryWords) {
      if (titleWords.includes(word)) score += 2;
      if (contentWords.includes(word)) score += 1;
    }

    return score;
  }
}