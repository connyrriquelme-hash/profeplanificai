interface Env { DB: D1Database }

interface CurriculumContextEnrichment {
  getFullContextForOA(objectiveId: string): Promise<{
    indicators: Array<{ id: string; code: string; description: string }>;
    skills: Array<{ id: string; code: string; description: string }>;
    attitudes: Array<{ id: string; code: string; description: string }>;
    suitableMethodologies: Array<{ id: string; name: string; code: string; fit_level?: string }>;
    subjectInfo: { name: string };
    axisInfo: { name: string };
    levelInfo: { name: string };
    courseInfo: { name: string };
  }>;
}

export interface CurriculumEnrichmentOptions {
  include_methodologies?: boolean;
  include_skills?: boolean;
  include_attitudes?: boolean;
  include_indicators?: boolean;
  max_indicators?: number;
  max_skills?: number;
  max_attitudes?: number;
}

export interface EnrichedObjective {
  id: string;
  code: string;
  type: string;
  description: string;
  official_text?: string;
  subject_name: string;
  axis_name: string;
  level_name: string;
  course_name: string;
  // Enriched data
  indicators?: Array<{ id: string; code: string; description: string; evaluation_type: string }>;
  skills?: Array<{ id: string; code: string; description: string; skill_type: string }>;
  attitudes?: Array<{ id: string; code: string; description: string; attitude_type: string }>;
  methodologies?: Array<{ id: string; name: string; code: string; fit_level?: string }>;
}

export class CurriculumChileAgent {
  private env: Env;
  private context: CurriculumContextEnrichment;

  constructor(env: Env, context: CurriculumContextEnrichment) {
    this.env = env;
    this.context = context;
  }

  async enrichObjective(
    objectiveId?: string,
    objectiveCode?: string,
    options: CurriculumEnrichmentOptions = {}
  ): Promise<EnrichedObjective> {
    const normalizedOptions: CurriculumEnrichmentOptions = {
      include_methodologies: options.include_methodologies ?? true,
      include_skills: options.include_skills ?? true,
      include_attitudes: options.include_attitudes ?? true,
      include_indicators: options.include_indicators ?? true,
      max_indicators: options.max_indicators ?? 10,
      max_skills: options.max_skills ?? 10,
      max_attitudes: options.max_attitudes ?? 10,
    };

    let objective: any;
    let subjectId: string;
    let subjectName: string;
    let axisId: string;

    if (objectiveId) {
      const { results } = await this.env.DB.prepare(
        `SELECT id, code, type, description, official_text,
                subject_id, axis_id
         FROM learning_objectives
         WHERE id = ?`
      ).bind(objectiveId).all();

      if (results.length === 0) {
        throw new Error(`Objetivo no encontrado: ${objectiveId}`);
      }
      objective = results[0];
      subjectId = objective.subject_id;
    } else if (objectiveCode) {
      const { results } = await this.env.DB.prepare(
        `SELECT id, code, type, description, official_text,
                subject_id, axis_id
         FROM learning_objectives
         WHERE code = ?`
      ).bind(objectiveCode).all();

      if (results.length === 0) {
        throw new Error(`Objetivo no encontrado: ${objectiveCode}`);
      }
      objective = results[0];
      subjectId = objective.subject_id;
    } else {
      throw new Error('Se requiere objectiveId o objectiveCode');
    }

    const enriched: EnrichedObjective = {
      id: objective.id,
      code: objective.code,
      type: objective.type,
      description: objective.description,
      official_text: objective.official_text,
      subject_name: '',
      axis_name: '',
      course_name: '',
    };

    const context = await this.context.getFullContextForOA(objective.id);

    if (normalizedOptions.include_indicators) {
      enriched.indicators = [];
      for (const indicator of context.indicators) {
        if (enriched.indicators.length >= normalizedOptions.max_indicators) break;
        enriched.indicators.push({
          id: indicator.id,
          code: indicator.code,
          description: indicator.description,
          evaluation_type: 'formativa', // Default
        });
      }
    }

    if (normalizedOptions.include_skills) {
      enriched.skills = [];
      for (const skill of context.skills) {
        if (enriched.skills.length >= normalizedOptions.max_skills) break;
        enriched.skills.push({
          id: skill.id,
          code: skill.code,
          description: skill.description,
          skill_type: 'transversal',
        });
      }
    }

    if (normalizedOptions.include_attitudes) {
      enriched.attitudes = [];
      for (const attitude of context.attitudes) {
        if (enriched.attitudes.length >= normalizedOptions.max_attitudes) break;
        enriched.attitudes.push({
          id: attitude.id,
          code: attitude.code,
          description: attitude.description,
          attitude_type: 'actitud',
        });
      }
    }

    if (normalizedOptions.include_methodologies) {
      enriched.methodologies = context.suitableMethodologies.map(m => ({
        id: m.id,
        name: m.name,
        code: m.code,
        fit_level: m.fit_level,
      }));
    }

    enriched.subject_name = context.subjectInfo.name;
    enriched.axis_name = context.axisInfo.name;
    enriched.level_name = context.levelInfo.name;
    enriched.course_name = context.courseInfo.name;

    return enriched;
  }

  async getObjectivesBySubject(subjectName: string, levelName?: string): Promise<EnrichedObjective[]> {
    let query = `
      SELECT o.id, o.code, o.type, o.description, o.official_text,
             s.name as subject_name, a.name as axis_name,
             e.name as level_name, c.name as course_name
      FROM learning_objectives o
      JOIN subjects s ON s.id = o.subject_id
      JOIN curriculum_axes a ON a.id = o.axis_id
      JOIN education_levels e ON s.education_level_id = e.id
      JOIN courses c ON c.id = o.course_id
      WHERE s.name LIKE ?
    `;
    const params: unknown[] = [`%${subjectName}%`];

    if (levelName) {
      query += ` AND e.name LIKE ?`;
      params.push(`%${levelName}%`);
    }

    query += ` ORDER BY e.sort_order, s.name, o.code LIMIT 200`;

    const { results } = await this.env.DB.prepare(query).bind(...params).all();

    const enrichedObjectives = await Promise.all(
      results.map(async (obj: any) => {
        const enriched = await this.enrichObjective(obj.id, undefined, {
          include_indicators: false,
          include_skills: false,
          include_attitudes: false,
          include_methodologies: false,
        });
        return enriched;
      })
    );

    return enrichedObjectives;
  }

  async getSubjectsWithObjectCount(levelName?: string): Promise<any[]> {
    let query = `
      SELECT s.id, s.code, s.name, s.description,
             e.name as level_name, COUNT(o.id) as objective_count
      FROM subjects s
      JOIN education_levels e ON s.education_level_id = e.id
      LEFT JOIN learning_objectives o ON o.subject_id = s.id
    `;
    const params: unknown[] = [];

    if (levelName) {
      query += ` WHERE e.name LIKE ?`;
      params.push(`%${levelName}%`);
    }

    query += ` GROUP BY s.id, s.code, s.name, s.description, e.name
               ORDER BY e.sort_order, s.name`;

    const { results } = await this.env.DB.prepare(query).bind(...params).all();
    return results;
  }

  async getTechnologiesBySubject(subjectId: string): Promise<any[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT DISTINCT m.id, m.name, m.code, m.description, m.educational_focus,
                ms.fit_level, ms.adaptation_notes
       FROM methodologies m
       JOIN methodology_subject_fit ms ON ms.methodology_id = m.id
       WHERE ms.subject_id = ? AND ms.fit_level IN ('excellent', 'good')
       ORDER BY ms.fit_level, m.name
       LIMIT 20`
    ).bind(subjectId).all();

    return results;
  }
}
