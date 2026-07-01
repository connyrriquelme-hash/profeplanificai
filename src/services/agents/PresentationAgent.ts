/**
 * PresentationAgent — Generates slide presentations with Chilean context
 */

import { PedagogicalAgent, type AgentContext, type AgentResponse } from './types';

export class PresentationAgent extends PedagogicalAgent {
  name = 'PresentationAgent';
  description = 'Genera presentaciones visuales tipo Gamma IA con contexto chileno';
  systemPrompt = 'Eres un experto en diseño de presentaciones educativas premium. Creas slides visuales, concisos, con contexto chileno/latinoamericano y notas para el docente.';

  async execute(context: AgentContext): Promise<AgentResponse> {
    const slides = [
      { type: 'cover', title: context.topic || `Clase: ${context.objectiveCode}`, subtitle: `${context.level} — ${context.subject}`, speakerNotes: 'Presentar el OA y motivar.' },
      { type: 'activation', title: 'Activación', bullets: ['¿Qué sabes?', '¿Dónde lo has visto?'], activity: 'Compartir en parejas', speakerNotes: '2 min individual, 3 min parejas.' },
      { type: 'explanation', title: 'Concepto clave', subtitle: context.objectiveText, bullets: ['Definición clara', 'Ejemplo chileno', 'Representación visual'], speakerNotes: 'Usar preguntas guiadas.' },
      { type: 'guided-practice', title: 'Práctica guiada', activity: 'Resolver en parejas', instructions: 'Circular y retroalimentar', speakerNotes: 'Preguntar "por qué" y "cómo".' },
      { type: 'independent-practice', title: 'Trabajo individual', bullets: ['Aplica el concepto', 'Resuelve el ejercicio'], speakerNotes: 'Apoyo diferenciado.' },
      { type: 'formative-assessment', title: 'Evaluación formativa', activity: 'Ticket de salida', questions: ['Explica el concepto', 'Da un ejemplo'], speakerNotes: 'Revisar para ajustar próxima clase.' },
      { type: 'closure', title: 'Cierre', bullets: ['Síntesis', 'Conexión próxima clase'], metacognition: '¿Qué estrategia te ayudó?', speakerNotes: 'Cierre positivo.' },
    ];

    return this.createResponse({
      title: `Presentación: ${context.objectiveCode}`,
      slideCount: slides.length,
      visualStyle: context.designStyle || 'claro',
      preferRegionalContext: 'chile',
      slides,
    }, context);
  }
}
