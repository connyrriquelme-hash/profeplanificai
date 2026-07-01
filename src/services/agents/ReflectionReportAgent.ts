/**
 * ReflectionReportAgent — Generates parent reports and reflection documents
 */

import { PedagogicalAgent, type AgentContext, type AgentResponse } from './types';

export class ReflectionReportAgent extends PedagogicalAgent {
  name = 'ReflectionReportAgent';
  description = 'Genera informes para apoderados y reflexiones pedagógicas';
  systemPrompt = 'Eres un experto en comunicación con apoderados y reflexión pedagógica. Generas informes claros, respetuosos y constructivos en lenguaje accesible.';

  async execute(context: AgentContext): Promise<AgentResponse> {
    return this.createResponse({
      parentReport: {
        title: `Informe de aprendizaje: ${context.level} — ${context.subject}`,
        objective: context.objectiveText,
        whatWeLearned: `Durante esta unidad, trabajamos el OA ${context.objectiveCode}: ${context.objectiveText}`,
        howToSupport: [
          'Pregunte a su hijo/a qué aprendió hoy',
          'Revise juntos la guía o cuaderno',
          'Conecte el aprendizaje con situaciones cotidianas',
          'Celebre el esfuerzo, no solo el resultado',
        ],
        nextSteps: 'En la próxima unidad continuaremos desarrollando...',
        contact: 'Cualquier duda, no dude en comunicarse con el/la docente.',
      },
      teacherReflection: {
        whatWorked: 'Aspectos positivos de la clase',
        whatToImprove: 'Áreas de mejora para la próxima clase',
        studentNeeds: 'Necesidades identificadas en el grupo',
        adjustments: 'Ajustes para la próxima planificación',
      },
    }, context);
  }
}
