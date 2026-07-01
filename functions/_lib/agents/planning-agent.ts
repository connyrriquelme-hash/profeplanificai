import type { Env } from '../_middleware';

export interface PlanningTemplate {
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

export interface GeneratedResource {
  id: string;
  user_id: string;
  objective_id: string;
  resource_type: string;
  title: string;
  content: string;
  template_id?: string;
  methodology_id?: string;
  status: 'draft' | 'generated' | 'completed' | 'published' | 'archived';
  ai_model?: string;
  generation_params?: string;
  curriculum_context?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanningContext {
  objective: any;
  methodology: any;
  template: PlanningTemplate;
  curriculum_enrichment: any;
}

export class PlanningAgent {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async getPlanningTemplates(): Promise<PlanningTemplate[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, code, name, description, resource_type as type, format, template_content, created_at, updated_at
       FROM resource_templates
       ORDER BY created_at DESC`
    ).all();

    return results;
  }

  async getPlanningTemplateById(templateId: string): Promise<PlanningTemplate | null> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, code, name, description, resource_type as type, format, template_content, created_at, updated_at
       FROM resource_templates
       WHERE id = ?`
    ).bind(templateId).all();

    return results.length > 0 ? results[0] : null;
  }

  async generatePlanning(
    userId: string,
    objectiveId: string,
    methodologyId: string,
    templateId: string,
    type: 'planification' | 'guide' | 'presentation',
    customContent?: string
  ): Promise<GeneratedResource> {
    const now = new Date().toISOString();

    const template = await this.getPlanningTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const resourceId = `resource-${crypto.randomUUID()}`;

    const content = this.customizeTemplate(
      template.template_content,
      type,
      customContent || ''
    );

    await this.env.DB.prepare(
      `INSERT INTO generated_resources (
        id, user_id, objective_id, resource_type, title, content,
        template_id, methodology_id, status, ai_model, generation_params,
        curriculum_context, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      resourceId,
      userId,
      objectiveId,
      type,
      `Planificación ${type} para objetivo ${objectiveId}`, // title
      content,
      templateId,
      methodologyId,
      'generated',
      'gemini-2.0-flash',
      JSON.stringify({ template: templateId, methodology: methodologyId, type }),
      '{}', // curriculum_context
      now,
      now
    ).run();

    if (type === 'presentation') {
      await this.createPresentation(resourceId, userId);
    }

    const generatedResource = {
      id: resourceId,
      user_id: userId,
      objective_id: objectiveId,
      resource_type: type,
      title: `Planificación ${type} para objetivo ${objectiveId}`, // title
      content: content,
      template_id: templateId,
      methodology_id: methodologyId,
      status: 'generated',
      ai_model: 'gemini-2.0-flash',
      generation_params: JSON.stringify({ template: templateId, methodology: methodologyId, type }),
      curriculum_context: '{}',
      created_at: now,
      updated_at: now,
    };

    return generatedResource;
  }

  private customizeTemplate(
    template: string,
    type: string,
    customContent?: string
  ): string {
    let customized = template;

    if (customContent) {
      customized = `${customContent}\n\n${template}`;
    }

    customized = customized
      .replace(/{{type}}/g, type)
      .replace(/{{timestamp}}/g, new Date().toISOString())
      .replace(/{{objective_id}}/g, 'OA-001')
      .replace(/{{level}}/g, '2° básico')
      .replace(/{{subject}}/g, 'Matemáticas')
      .replace(/{{axis}}/g, 'Números');

    return customized;
  }

  async getUserResources(userId: string, type?: string): Promise<GeneratedResource[]> {
    let query = `
      SELECT id, user_id, objective_id, resource_type, title, content,
             template_id, methodology_id, status, ai_model, generation_params,
             curriculum_context, created_at, updated_at
      FROM generated_resources
      WHERE user_id = ?
    `;
    const params: unknown[] = [userId];

    if (type) {
      query += ` AND resource_type = ?`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC`;

    const { results } = await this.env.DB.prepare(query).bind(...params).all();

    return results;
  }

  async getGeneratedPresentations(resourceId: string): Promise<any[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, user_id, resource_id, title, slide_count, presentation_format,
               presentation_content, theme, layout, created_at, updated_at
       FROM generated_presentations
       WHERE resource_id = ?`
    ).bind(resourceId).all();

    return results;
  }

  private async createPresentation(resourceId: string, userId: string): Promise<void> {
    const presentationId = `presentation-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await this.env.DB.prepare(
      `INSERT INTO generated_presentations (
        id, user_id, resource_id, title, slide_count, presentation_format,
        presentation_content, theme, layout, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      presentationId,
      userId,
      resourceId,
      'Presentación generada',
      15, // slide_count
      'powerpoint',
      JSON.stringify({ slides: [], template: 'standard' }),
      'modern',
      'professional',
      now,
      now
    ).run();
  }
}