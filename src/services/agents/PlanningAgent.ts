/**
 * PlanningAgent — Generates lesson plans and class sequences
 */

import { PedagogicalAgent, type AgentContext, type AgentResponse } from './types';

export class PlanningAgent extends PedagogicalAgent {
  name = 'PlanningAgent';
  description = 'Genera planificaciones clase a clase alineadas al currículum';
  systemPrompt = 'Eres un experto en planificación docente chilena. Generas planificaciones clase a clase con estructura inicio-desarrollo-cierre, tiempos realistas, materiales, DUA y evaluación formativa.';

  async execute(context: AgentContext): Promise<AgentResponse> {
    const ctxPrompt = this.buildContextPrompt(context);
    const plan = this.generatePlanStructure(context);

    return this.createResponse({
      planType: 'clase_a_clase',
      context: ctxPrompt,
      classes: plan,
      methodology: context.methodology || 'Clase Explícita Gradual',
      duaConsiderations: [
        'Ofrecer múltiples formas de representación del contenido',
        'Permitir diferentes formas de expresión y acción',
        'Proporcionar múltiples formas de engagement',
      ],
      evaluationType: 'formativa',
    }, context);
  }

  private generatePlanStructure(context: AgentContext): any[] {
    const classes = [];
    const count = 3;

    for (let i = 1; i <= count; i++) {
      classes.push({
        number: i,
        title: `Clase ${i}: ${context.topic || context.objectiveCode}`,
        objective: context.objectiveText,
        duration: '90 minutos',
        opening: {
          activity: i === 1 ? 'Activación de conocimientos previos' : 'Revisión clase anterior + activación',
          time: '15 min',
        },
        development: {
          activity: i === 1 ? 'Explicación del concepto clave con ejemplo contextualizado' : 'Práctica guiada + actividad colaborativa',
          time: '50 min',
        },
        closure: {
          activity: 'Síntesis + ticket de salida',
          time: '15 min',
        },
        materials: ['Guía de trabajo', 'Pizarra o proyector', 'Material concreto'],
        assessment: 'Observación directa + ticket de salida',
      });
    }

    return classes;
  }
}
