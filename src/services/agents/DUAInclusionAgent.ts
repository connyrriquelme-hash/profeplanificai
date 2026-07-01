/**
 * DUAInclusionAgent — Generates DUA accommodations and inclusive adaptations
 */

import { PedagogicalAgent, type AgentContext, type AgentResponse } from './types';

export class DUAInclusionAgent extends PedagogicalAgent {
  name = 'DUAInclusionAgent';
  description = 'Genera adaptaciones DUA e inclusiones para diversidad en el aula';
  systemPrompt = 'Eres un experto en Diseño Universal para el Aprendizaje (DUA) y educación inclusiva chilena. Proporcionas adaptaciones concretas y aplicables.';

  async execute(context: AgentContext): Promise<AgentResponse> {
    return this.createResponse({
      representation: [
        'Presentar contenido en formato visual (organizadores gráficos, infografías)',
        'Ofrecer versión auditiva del texto (lectura en voz alta, audio)',
        'Usar material concreto y manipulativo',
        'Proporcionar glosario visual con imágenes',
      ],
      action: [
        'Permitir respuesta oral, escrita o dibujada',
        'Ofrecer plantillas con andamiaje (texto incompleto, opciones)',
        'Usar tecnología de apoyo si está disponible',
        'Permitir trabajo individual o en parejas según preferencia',
      ],
      engagement: [
        'Conectar con intereses y experiencias previas del estudiante',
        'Ofrecer opciones de producto final (presentación, poster, video)',
        'Proporcionar feedback inmediato y específico',
        'Crear ambiente de error seguro y aprendizaje',
      ],
      specificAdaptations: [
        'Para estudiantes con NEE: instrucciones paso a paso con apoyos visuales',
        'Para estudiantes descendidos: actividades con menor carga cognitiva',
        'Para estudiantes avanzados: preguntas de extensión y profundización',
        'Para estudiantes con TDAH: pausas activas cada 15-20 minutos',
      ],
    }, context);
  }
}
