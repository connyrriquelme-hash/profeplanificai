import type { Env } from '../../_middleware';

export interface LearningResource {
  id: string;
  title: string;
  tag: string;
  text: string;
  date: string;
  type: 'guide' | 'presentation' | 'evaluation' | 'rubric' | 'worksheet' | 'activity' | 'manual';
  status: 'draft' | 'published' | 'archived';
  user_id?: string;
  objective_id?: string;
  methodology_id?: string;
  curriculum_context?: string;
  generated_at: string;
}

export interface ResourceTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'guide' | 'presentation' | 'evaluation' | 'rubric' | 'worksheet' | 'activity' | 'manual';
  format: string;
  template_content: string;
  created_at: string;
  updated_at: string;
}

export class BibliotecaAgent {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async getAllResources(): Promise<LearningResource[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, title, tag, text, date, type, status, user_id, objective_id,
               methodology_id, curriculum_context, created_at as generated_at
       FROM library_resources
       ORDER BY created_at DESC`
    ).all();

    return results;
  }

  async getResourcesByTag(tag: string): Promise<LearningResource[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, title, tag, text, date, type, status, user_id, objective_id,
               methodology_id, curriculum_context, created_at as generated_at
       FROM library_resources
       WHERE tag LIKE ?
       ORDER BY created_at DESC`
    ).bind(`%${tag}%`).all();

    return results;
  }

  async getResourcesByType(type: string): Promise<LearningResource[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, title, tag, text, date, type, status, user_id, objective_id,
               methodology_id, curriculum_context, created_at as generated_at
       FROM library_resources
       WHERE type = ?
       ORDER BY created_at DESC`
    ).bind(type).all();

    return results;
  }

  async saveResource(resource: LearningResource): Promise<void> {
    const now = new Date().toISOString();

    await this.env.DB.prepare(
      `INSERT INTO library_resources (
        id, title, tag, text, date, type, status, user_id, objective_id,
        methodology_id, curriculum_context, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      resource.id,
      resource.title,
      resource.tag,
      resource.text,
      resource.date,
      resource.type,
      resource.status,
      resource.user_id,
      resource.objective_id,
      resource.methodology_id,
      resource.curriculum_context || '{}',
      resource.generated_at || now,
      now
    ).run();
  }

  async getResourceTemplates(): Promise<ResourceTemplate[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, code, name, description, type, format, template_content,
               created_at, updated_at
       FROM resource_templates
       ORDER BY name`
    ).all();

    return results;
  }

  async searchResources(query: string, filters?: {
    type?: string;
    tag?: string;
    level?: string;
    subject?: string;
  }): Promise<LearningResource[]> {
    let sql = `
      SELECT id, title, tag, text, date, type, status, user_id, objective_id,
             methodology_id, curriculum_context, created_at as generated_at
      FROM library_resources
      WHERE text LIKE ? OR title LIKE ? OR tag LIKE ?
    `;
    const params: unknown[] = [`%${query}%`, `%${query}%`, `%${query}%`];

    if (filters?.type) {
      sql += ` AND type = ?`;
      params.push(filters.type);
    }

    if (filters?.tag) {
      sql += ` AND tag LIKE ?`;
      params.push(`%${filters.tag}%`);
    }

    if (filters?.level) {
      // Filtro contextual por nivel (requiere unión con OA)
      sql += ` AND (SELECT level FROM learning_objectives WHERE id = objective_id) LIKE ?`;
      params.push(`%${filters.level}%`);
    }

    if (filters?.subject) {
      sql += ` AND (SELECT subject_name FROM learning_objectives WHERE id = objective_id) LIKE ?`;
      params.push(`%${filters.subject}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT 50`;

    const { results } = await this.env.DB.prepare(sql).bind(...params).all();
    return results;
  }
}