export type CopilotTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface CopilotD1Database {
  prepare(query: string): {
    bind(...params: unknown[]): {
      run(): Promise<unknown>;
      all<T>(): Promise<{ results?: T[] }>;
      first<T>(): Promise<T | null>;
    };
  };
}

export interface CopilotPersistedTask {
  id: string;
  userId: string;
  intent: string;
  status: CopilotTaskStatus;
  requiresConfirmation: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function normalizeMetadata(value: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

export function createTaskRecord(
  intent: string,
  userId: string,
  metadata: Record<string, unknown> = {},
  requiresConfirmation = false,
): CopilotPersistedTask {
  const now = new Date().toISOString();
  return {
    id: `copilot-task-${crypto.randomUUID()}`,
    userId,
    intent,
    status: 'pending',
    requiresConfirmation,
    metadata: normalizeMetadata(metadata),
    createdAt: now,
    updatedAt: now,
  };
}

export async function ensureConversation(
  env: { DB?: CopilotD1Database },
  userId: string,
  context: Record<string, unknown> = {},
  title = 'Conversación del Copilot',
): Promise<string> {
  if (!env.DB) return `local-${crypto.randomUUID()}`;

  const id = `copilot-conversation-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();

  try {
    await env.DB.prepare(`
      INSERT INTO copilot_conversations (id, user_id, title, context_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, userId, title, JSON.stringify(context), createdAt, createdAt).run();
    return id;
  } catch {
    return `local-${crypto.randomUUID()}`;
  }
}

export async function persistConversationMessage(
  env: { DB?: CopilotD1Database },
  conversationId: string,
  role: 'user' | 'assistant' | 'tool',
  content: string,
  toolCalls: Record<string, unknown>[] = [],
  toolResult: Record<string, unknown> = {},
): Promise<void> {
  if (!env.DB) return;

  try {
    await env.DB.prepare(`
      INSERT INTO copilot_messages (id, conversation_id, role, content, tool_calls_json, tool_result_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      `copilot-message-${crypto.randomUUID()}`,
      conversationId,
      role,
      content,
      JSON.stringify(toolCalls),
      JSON.stringify(toolResult),
    ).run();
  } catch {
    // best effort; conversation history is auxiliary, not the core workflow
  }
}

export async function persistTaskRecord(
  env: { DB?: CopilotD1Database },
  task: CopilotPersistedTask,
): Promise<CopilotPersistedTask> {
  if (!env.DB) return task;

  try {
    await env.DB.prepare(`
      INSERT INTO copilot_tasks (id, user_id, intent, status, requires_confirmation, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      task.id,
      task.userId,
      task.intent,
      task.status,
      task.requiresConfirmation ? 1 : 0,
      JSON.stringify(task.metadata),
      task.createdAt,
      task.updatedAt,
    ).run();
  } catch {
    // best effort if migration not applied yet
  }

  return task;
}

export async function updateTaskStatus(
  env: { DB?: CopilotD1Database },
  taskId: string,
  status: CopilotTaskStatus,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  if (!env.DB) return;

  try {
    const current = await env.DB.prepare('SELECT metadata_json FROM copilot_tasks WHERE id = ?').bind(taskId).first<{ metadata_json?: string }>();
    const merged = { ...(current && current.metadata_json ? JSON.parse(current.metadata_json) : {}), ...metadata };
    await env.DB.prepare(`
      UPDATE copilot_tasks
      SET status = ?, metadata_json = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, JSON.stringify(merged), taskId).run();
  } catch {
    // best effort only
  }
}