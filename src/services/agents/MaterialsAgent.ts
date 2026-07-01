/**
 * MaterialsAgent — Generates student guides, teacher guides, and learning materials
 */

import { PedagogicalAgent, type AgentContext, type AgentResponse } from './types';

export class MaterialsAgent extends PedagogicalAgent {
  name = 'MaterialsAgent';
  description = 'Genera guías de estudiante, guías docentes y materiales de apoyo';
  systemPrompt = 'Eres un experto en diseño de materiales educativos chilenos. Creas guías claras, accesibles y alineadas al currículum con DUA implícito.';

  async execute(context: AgentContext, input?: { type?: string }): Promise<AgentResponse> {
    const type = input?.type || 'guia_estudiante';

    if (type === 'guia_estudiante') {
      return this.createResponse({
        title: `Guía Estudiante: ${context.objectiveCode}`,
        subtitle: `${context.level} — ${context.subject}`,
        objective: context.objectiveText,
        instructions: 'Lee atentamente. Responde con tus propias palabras. Si tienes dudas, pregunta.',
        activities: [
          { name: 'Activación', description: '¿Qué sabes sobre este tema?', steps: ['Piensa', 'Comparte', 'Escribe'] },
          { name: 'Desarrollo', description: 'Lee y responde', steps: ['Lee', 'Subraya', 'Responde'] },
          { name: 'Aplicación', description: 'Aplica lo aprendido', steps: ['Resuelve', 'Explica', 'Comparte'] },
        ],
        vocabulary: [{ term: 'Concepto clave', definition: 'Definición simple.' }],
        selfAssessment: ['¿Qué aprendí?', '¿Qué me costó?'],
      }, context);
    }

    return this.createResponse({
      title: `Guía Docente: ${context.objectiveCode}`,
      objective: context.objectiveText,
      duration: context.duration || '90 minutos',
      materials: ['Guía impresa', 'Pizarra', 'Material concreto'],
      opening: { activity: 'Activación', time: '15 min' },
      development: { activity: 'Explicación + práctica', time: '50 min' },
      closure: { activity: 'Síntesis + ticket', time: '15 min' },
      differentiation: ['Apoyo visual', 'Respuesta oral o escrita', 'Agrupación heterogénea'],
      assessment: 'Evaluación formativa mediante observación y ticket de salida.',
    }, context);
  }
}
