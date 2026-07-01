/**
 * MethodologyAgent — Suggests and adapts pedagogical methodologies
 */

import { PedagogicalAgent, type AgentContext, type AgentResponse } from './types';

export class MethodologyAgent extends PedagogicalAgent {
  name = 'MethodologyAgent';
  description = 'Sugiere y adapta metodologías pedagógicas según contexto curricular';
  systemPrompt = 'Eres un experto en metodologías pedagógicas aplicadas al aula chilena. Sugieres metodologías basadas en el OA, asignatura, nivel y contexto del curso.';

  async execute(context: AgentContext): Promise<AgentResponse> {
    try {
      const methodologies = await fetch('/api/methodologies')
        .then(r => r.json())
        .then(d => d.data || [])
        .catch(() => []);

      const suggested = methodologies.slice(0, 5).map((m: any) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        whenToUse: m.when_to_use,
        steps: JSON.parse(m.steps_json || '[]'),
        duaAccommodations: JSON.parse(m.dua_accommodations_json || '[]'),
        fitReason: this.calculateFitReason(m, context),
      }));

      return this.createResponse({ suggestedMethodologies: suggested, total: methodologies.length }, context);
    } catch (err: any) {
      return this.createError(err.message, context);
    }
  }

  private calculateFitReason(methodology: any, context: AgentContext): string {
    const subject = context.subject.toLowerCase();
    const name = methodology.name?.toLowerCase() || '';

    if (subject.includes('ciencia') && (name.includes('indagación') || name.includes('steam'))) {
      return 'Ideal para desarrollar pensamiento científico y trabajo experimental.';
    }
    if (subject.includes('matem') && (name.includes('modelado') || name.includes('explícita'))) {
      return 'Efectiva para enseñar procedimientos y conceptos abstractos.';
    }
    if (subject.includes('lenguaje') && (name.includes('lectura') || name.includes('cooperativo'))) {
      return 'Fomenta comprensión lectora y expresión oral en comunidad.';
    }
    if (name.includes('dua')) {
      return 'Garantiza accesibilidad para todos los estudiantes del curso.';
    }
    return 'Metodología versátil aplicable a múltiples contextos de aula.';
  }
}
