/**
 * SimceAgent — Generates SIMCE-style assessments
 */

import { PedagogicalAgent, type AgentContext, type AgentResponse } from './types';

export class SimceAgent extends PedagogicalAgent {
  name = 'SimceAgent';
  description = 'Genera evaluaciones estilo SIMCE alineadas al currículum';
  systemPrompt = 'Eres un experto en evaluaciones tipo SIMCE. Generas preguntas con formato SIMCE: alternativas, habilidades evaluadas, y pauta de corrección.';

  async execute(context: AgentContext, input?: { questionCount?: number }): Promise<AgentResponse> {
    const count = input?.questionCount || 10;
    const questions = [];

    for (let i = 0; i < count; i++) {
      questions.push({
        number: i + 1,
        type: 'multiple_choice',
        question: `Pregunta estilo SIMCE sobre ${context.topic || context.objectiveCode}`,
        options: ['A) Alternativa correcta', 'B) Alternativa incorrecta', 'C) Alternativa incorrecta', 'D) Alternativa incorrecta'],
        correct: 'A',
        skill: 'Comprensión',
        oaRelated: context.objectiveCode,
      });
    }

    return this.createResponse({
      title: `Evaluación tipo SIMCE: ${context.objectiveCode}`,
      level: context.level,
      subject: context.subject,
      questions,
      answerKey: questions.map(q => `${q.number}. ${q.correct}`),
      scoring: `Cada pregunta correcta: 1 punto. Total: ${count} puntos.`,
    }, context);
  }
}
