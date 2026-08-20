export type CopilotIntent =
  | 'search_curriculum'
  | 'plan'
  | 'generate_material'
  | 'edit_material'
  | 'save_to_bank'
  | 'navigate_to_view'
  | 'unknown';

export interface CopilotAction {
  tool: string;
  arguments: Record<string, unknown>;
}

export interface CopilotPlan {
  intent: CopilotIntent;
  requiresConfirmation: boolean;
  actions: CopilotAction[];
  confidence: number;
}

function normalize(input: string): string {
  return input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function classifyUserRequest(request: string): CopilotPlan {
  const text = normalize(request);

  if (!text) {
    return {
      intent: 'unknown',
      requiresConfirmation: false,
      actions: [{ tool: 'generate_material', arguments: { type: 'chat' } }],
      confidence: 0.1,
    };
  }

  if (/(guardar|guarda|save|banco de recursos|bank|guardar en)/.test(text)) {
    return {
      intent: 'save_to_bank',
      requiresConfirmation: true,
      actions: [{ tool: 'save_to_bank', arguments: { source: 'copilot', title: 'Material generado' } }],
      confidence: 0.95,
    };
  }

  if (/(buscar|busca|consulta|objetivo de aprendizaje|oa|curriculo|curriculum|metodologia|metodología|docente)/.test(text)) {
    return {
      intent: 'search_curriculum',
      requiresConfirmation: false,
      actions: [{ tool: 'search_curriculum', arguments: { query: request.trim() } }],
      confidence: 0.87,
    };
  }

  if (/(secuencia|planific|planificacion|clase|leccion|lección|miniunidad|unidad didactica|sesion|sesión)/.test(text)) {
    return {
      intent: 'plan',
      requiresConfirmation: false,
      actions: [{ tool: 'generate_material', arguments: { type: 'planificacion', prompt: request.trim() } }],
      confidence: 0.92,
    };
  }

  if (/(diferenciar|diferenciacion|dua|adaptar|apoyo|desafio|desafío|guia diferenciada|guía diferenciada)/.test(text)) {
    return {
      intent: 'generate_material',
      requiresConfirmation: false,
      actions: [{ tool: 'generate_material', arguments: { type: 'guia_diferenciada', prompt: request.trim() } }],
      confidence: 0.88,
    };
  }

  if (/(editar|edita|mejorar|mejora|corregir|revisa|redacta|reformular)/.test(text)) {
    return {
      intent: 'edit_material',
      requiresConfirmation: false,
      actions: [{ tool: 'edit_material', arguments: { prompt: request.trim() } }],
      confidence: 0.8,
    };
  }

  if (/(abrir|ir a|navega|mostrar|vista|módulo|modulo|workspace|mis clases|banco|evaluaciones)/.test(text)) {
    return {
      intent: 'navigate_to_view',
      requiresConfirmation: true,
      actions: [{ tool: 'navigate_to_view', arguments: { target: 'workspace' } }],
      confidence: 0.75,
    };
  }

  return {
    intent: 'unknown',
    requiresConfirmation: false,
    actions: [{ tool: 'generate_material', arguments: { type: 'chat', prompt: request.trim() } }],
    confidence: 0.4,
  };
}

export function buildActionPlan(
  mode: string,
  context: Record<string, unknown>,
  request: string,
): CopilotPlan {
  const plan = classifyUserRequest(request);

  const enrichedActions = plan.actions.map((action) => ({
    ...action,
    arguments: {
      ...context,
      mode,
      ...action.arguments,
    },
  }));

  return {
    ...plan,
    requiresConfirmation: plan.requiresConfirmation || ['save_to_bank', 'navigate_to_view'].includes(plan.intent),
    actions: enrichedActions,
  };
}
