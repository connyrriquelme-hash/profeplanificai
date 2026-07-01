/**
 * CurriculumChileAgent — Retrieves and analyzes Chilean curriculum context
 * Always runs first to provide context to other agents
 */

import { PedagogicalAgent, type AgentContext, type AgentResponse } from './types';

export class CurriculumChileAgent extends PedagogicalAgent {
  name = 'CurriculumChileAgent';
  description = 'Recupera y analiza contexto curricular chileno desde D1';
  systemPrompt = 'Eres un experto en el currículum nacional chileno MINEDUC. Tu rol es proporcionar contexto curricular preciso para la planificación docente.';

  async execute(context: AgentContext): Promise<AgentResponse> {
    try {
      // Fetch from D1 via API
      const [objectiveRes, indicatorsRes, skillsRes] = await Promise.all([
        fetch(`/api/objectives?code=${encodeURIComponent(context.objectiveCode)}&limit=1`).catch(() => null),
        fetch(`/api/curriculum/indicators?oa_code=${encodeURIComponent(context.objectiveCode)}&limit=10`).catch(() => null),
        fetch(`/api/curriculum/skills?objective_id=${encodeURIComponent(context.objectiveCode)}`).catch(() => null),
      ]);

      const objective = objectiveRes ? await objectiveRes.json().then(d => d.data?.[0] || null) : null;
      const indicators = indicatorsRes ? await indicatorsRes.json().then(d => d.indicators || d.data || []) : [];
      const skills = skillsRes ? await skillsRes.json().then(d => d.data || []) : [];

      return this.createResponse({
        objective,
        indicators: indicators.map((i: any) => i.indicator_text || i.text),
        skills: skills.map((s: any) => s.official_text || s.text),
        courseName: objective?.course_name || context.level,
        subjectName: objective?.subject_name || context.subject,
        axisName: objective?.axis_name,
      }, { ...context, indicators: indicators.map((i: any) => i.indicator_text || i.text), skills: skills.map((s: any) => s.official_text || s.text) });
    } catch (err: any) {
      return this.createError(err.message, context);
    }
  }
}
