/**
 * AssessmentAgent — Generates formative and summative assessments
 */

import { PedagogicalAgent, type AgentContext, type AgentResponse } from './types';

export class AssessmentAgent extends PedagogicalAgent {
  name = 'AssessmentAgent';
  description = 'Genera evaluaciones formativas y sumativas alineadas a indicadores';
  systemPrompt = 'Eres un experto en evaluación educativa chilena. Generas evaluaciones alineadas a OA, indicadores y habilidades, con progresión de dificultad y contexto chileno.';

  async execute(context: AgentContext, input?: { type?: string; questionCount?: number }): Promise<AgentResponse> {
    const evalType = input?.type || 'formativa';
    const count = input?.questionCount || 10;

    const questions = [];
    const types = ['multiple_choice', 'open', 'true_false', 'matching'];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const indicator = context.indicators?.[i % (context.indicators?.length || 1)] || 'Comprensión del OA';

      questions.push({
        number: i + 1,
        type,
        question: `Pregunta ${i + 1} sobre ${context.topic || context.objectiveCode}`,
        indicator,
        skill: context.skills?.[0] || 'Comprensión',
        difficulty: i < count / 3 ? 'básico' : i < (count * 2) / 3 ? 'intermedio' : 'avanzado',
      });
    }

    return this.createResponse({
      title: `Evaluación ${evalType}: ${context.objectiveCode}`,
      type: evalType,
      objective: context.objectiveText,
      indicators: context.indicators?.slice(0, 3),
      questions,
      rubric: {
        criteria: [
          { name: 'Comprensión del contenido', levels: ['Logrado', 'En proceso', 'No logrado'] },
          { name: 'Aplicación del concepto', levels: ['Logrado', 'En proceso', 'No logrado'] },
        ],
      },
    }, context);
  }
}
