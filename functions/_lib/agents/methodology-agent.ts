import type { Env } from '../_middleware';

export interface PedagogyStrategy {
  id: string;
  methodology_id: string;
  code: string;
  description: string;
  strategy_type: string;
  resources_needed: string;
  estimated_time: string;
  learning_outcomes: string;
  created_at: string;
}

export interface MethodologySubjectFit {
  id: string;
  methodology_id: string;
  subject_id: string;
  fit_level: 'excellent' | 'good' | 'adequate' | 'poor' | 'unsuitable';
  adaptation_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Methodology {
  id: string;
  code: string;
  name: string;
  description: string;
  educational_focus: string;
  target_levels: string;
  target_subjects: string;
  pedagogical_approach: string;
  status: string;
  created_at: string;
  strategies?: PedagogyStrategy[];
  suitable_subjects?: MethodologySubjectFit[];
}

export class MethodologyAgent {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async getAllMethodologies(): Promise<Methodology[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, code, name, description, educational_focus,
               target_levels, target_subjects, pedagogical_approach, status, created_at
       FROM methodologies
       ORDER BY name`
    ).all();

    const methodologies = results.map(m => ({
      id: m.id,
      code: m.code,
      name: m.name,
      description: m.description,
      educational_focus: m.educational_focus,
      target_levels: m.target_levels,
      target_subjects: m.target_subjects,
      pedagogical_approach: m.pedagogical_approach,
      status: m.status,
      created_at: m.created_at,
    })) as Methodology[];

    for (const methodology of methodologies) {
      await this.loadMethodologyDetails(methodology.id, methodology);
    }

    return methodologies;
  }

  async getMethodologyById(methodologyId: string): Promise<Methodology | null> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, code, name, description, educational_focus,
               target_levels, target_subjects, pedagogical_approach, status, created_at
       FROM methodologies
       WHERE id = ?`
    ).bind(methodologyId).all();

    if (results.length === 0) return null;

    const methodology = results[0] as any;

    await this.loadMethodologyDetails(methodology.id, methodology);

    return methodology as Methodology;
  }

  private async loadMethodologyDetails(methodology: any, target: any): Promise<void> {
    const { results: strategies } = await this.env.DB.prepare(
      `SELECT id, methodology_id, code, description, strategy_type,
               resources_needed, estimated_time, learning_outcomes, created_at
       FROM methodology_strategies
       WHERE methodology_id = ?
       ORDER BY created_at`
    ).bind(methodology.id).all();

    target.strategies = strategies;

    const { results: fits } = await this.env.DB.prepare(
      `SELECT id, methodology_id, subject_id, fit_level, adaptation_notes, created_at, updated_at
       FROM methodology_subject_fit
       WHERE methodology_id = ?
       ORDER BY fit_level, subject_id`
    ).bind(methodology.id).all();

    target.suitable_subjects = fits;
  }

  async getMethodologiesBySubject(subjectId: string, minFitLevel: string = 'adequate'): Promise<Methodology[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT m.id, m.code, m.name, m.description, m.educational_focus,
               m.target_levels, m.target_subjects, m.pedagogical_approach, m.status, m.created_at,
               ms.fit_level, ms.adaptation_notes
       FROM methodologies m
       JOIN methodology_subject_fit ms ON ms.methodology_id = m.id
       WHERE ms.subject_id = ? AND ms.fit_level IN (?,?,?)
       ORDER BY ms.fit_level, m.name
       LIMIT 30`
    ).bind(subjectId, 'excellent', 'good', minFitLevel).all();

    const methodologies = results.map(m => ({
      id: m.id,
      code: m.code,
      name: m.name,
      description: m.description,
      educational_focus: m.educational_focus,
      target_levels: m.target_levels,
      target_subjects: m.target_subjects,
      pedagogical_approach: m.pedagogical_approach,
      status: m.status,
      created_at: m.created_at,
      suitable_subjects: [{
        id: m.id,
        methodology_id: m.id,
        subject_id: subjectId,
        fit_level: m.fit_level as any,
        adaptation_notes: m.adaptation_notes,
        created_at: m.created_at,
        updated_at: m.created_at,
      }],
    })) as Methodology[];

    for (const methodology of methodologies) {
      await this.loadMethodologyStrategies(methodology.id, methodology);
    }

    return methodologies;
  }

  private async loadMethodologyStrategies(methodologyId: string, target: any): Promise<void> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, methodology_id, code, description, strategy_type,
               resources_needed, estimated_time, learning_outcomes, created_at
       FROM methodology_strategies
       WHERE methodology_id = ?
       ORDER BY created_at`
    ).bind(methodologyId).all();

    target.strategies = results;
  }

  async getStrategiesByMethodology(methodologyId: string): Promise<PedagogyStrategy[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT id, methodology_id, code, description, strategy_type,
               resources_needed, estimated_time, learning_outcomes, created_at
       FROM methodology_strategies
       WHERE methodology_id = ?
       ORDER BY created_at`
    ).bind(methodologyId).all();

    return results;
  }

  async getMethodologiesByLevel(levelName: string): Promise<Methodology[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT DISTINCT m.id, m.code, m.name, m.description, m.educational_focus,
               m.target_levels, m.target_subjects, m.pedagogical_approach, m.status, m.created_at
       FROM methodologies m
       JOIN methodology_subject_fit ms ON ms.methodology_id = m.id
       JOIN subjects s ON ms.subject_id = s.id
       JOIN education_levels e ON s.education_level_id = e.id
       WHERE e.name LIKE ?
       ORDER BY m.name
       LIMIT 50`
    ).bind(`%${levelName}%`).all();

    const methodologies = results.map(m => ({
      id: m.id,
      code: m.code,
      name: m.name,
      description: m.description,
      educational_focus: m.educational_focus,
      target_levels: m.target_levels,
      target_subjects: m.target_subjects,
      pedagogical_approach: m.pedagogical_approach,
      status: m.status,
      created_at: m.created_at,
    })) as Methodology[];

    return methodologies;
  }
}