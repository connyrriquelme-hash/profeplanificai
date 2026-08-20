export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CopilotTaskDescriptor {
  intent: string;
  requiresConfirmation: boolean;
  metadata: Record<string, unknown>;
}

export function summarizeChatHistory(history: CopilotMessage[]): string {
  const reduced = history.slice(-8).filter((item) => item.content && item.content.trim().length > 0);
  if (reduced.length === 0) return 'Sin historial previo.';

  const sentences = reduced.map((item) => `${item.role === 'user' ? 'Usuario' : 'Asistente'}: ${item.content.trim()}`);
  return sentences.join(' | ');
}

export function buildTaskDescriptor(intent: string, metadata: Record<string, unknown>): CopilotTaskDescriptor {
  return {
    intent,
    requiresConfirmation: intent === 'save_to_bank' || intent === 'navigate_to_view',
    metadata,
  };
}
