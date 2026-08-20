import { describe, it, expect } from 'vitest';
import { onRequestPost, onRequest } from '../functions/api/copilot/chat';
import { createMockD1, signToken } from './helpers/mockD1';

const TEST_SECRET = 'test-jwt-secret-with-at-least-32-characters!!';

function validCopilotAiResponse(overrides: Record<string, unknown> = {}) {
  return {
    message: 'Puedo ayudarte a encontrar objetivos de aprendizaje sobre fracciones.',
    intent: 'search_curriculum',
    requiresConfirmation: false,
    actions: [{ tool: 'search_curriculum', arguments: { query: 'fracciones' } }],
    ...overrides,
  };
}

function seededDB() {
  return createMockD1({});
}

async function makeContext(overrides: {
  body?: Record<string, unknown>;
  withAuth?: boolean;
  aiResponse?: string;
  mockDB?: ReturnType<typeof createMockD1>;
}) {
  const withAuth = overrides.withAuth ?? true;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = await signToken('user-1', 'user-1@test.cl', TEST_SECRET);
    headers['Authorization'] = `Bearer ${token}`;
  }

  const body = overrides.body ?? { message: 'Busca objetivos sobre fracciones' };

  return {
    request: new Request('http://localhost/api/copilot/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }),
    env: {
      DB: overrides.mockDB ?? seededDB(),
      JWT_SECRET: TEST_SECRET,
      AI: { run: async () => overrides.aiResponse ?? JSON.stringify(validCopilotAiResponse()) },
    },
  } as any;
}

describe('POST /api/copilot/chat', () => {
  it('sin token → 401', async () => {
    const ctx = await makeContext({ withAuth: false });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Sesión');
  });

  it('sin conversationId: crea una conversación nueva en copilot_conversations y persiste ambos mensajes', async () => {
    const mockDB = seededDB();
    const ctx = await makeContext({ mockDB, body: { message: 'Busca objetivos sobre fracciones' } });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(typeof data.conversationId).toBe('string');
    expect(data.conversationId.length).toBeGreaterThan(0);

    const conversation = await mockDB.prepare('SELECT id, user_id, title FROM copilot_conversations WHERE id = ?')
      .bind(data.conversationId).first<{ id: string; user_id: string; title: string }>();
    expect(conversation).not.toBeNull();
    expect(conversation!.user_id).toBe('user-1');
    expect(conversation!.title).toContain('Busca objetivos');

    const messages = await mockDB.prepare('SELECT role, content FROM copilot_messages WHERE conversation_id = ?')
      .bind(data.conversationId).all<{ role: string; content: string }>();
    const roles = messages.results.map((m) => m.role).sort();
    expect(roles).toEqual(['assistant', 'user']);

    const userMsg = messages.results.find((m) => m.role === 'user');
    expect(userMsg?.content).toBe('Busca objetivos sobre fracciones');
    const assistantMsg = messages.results.find((m) => m.role === 'assistant');
    expect(assistantMsg?.content).toContain('objetivos de aprendizaje');
  });

  it('respuesta cumple CopilotResponseSchema: intent, requiresConfirmation y actions con la forma esperada', async () => {
    const ctx = await makeContext({});
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.intent).toBe('search_curriculum');
    expect(typeof data.requiresConfirmation).toBe('boolean');
    expect(Array.isArray(data.actions)).toBe(true);
    expect(data.actions[0]).toEqual({ tool: 'search_curriculum', arguments: { query: 'fracciones' } });
    expect(typeof data.message).toBe('string');
    expect(data.message.length).toBeGreaterThan(0);
  });

  it('con conversationId existente de otro usuario → 404 (no filtra conversaciones ajenas)', async () => {
    const mockDB = createMockD1({
      copilot_conversations: [
        { id: 'conv-other-user', user_id: 'user-2', title: 'Otra', active_context_json: '{}' },
      ],
    });
    const ctx = await makeContext({ mockDB, body: { message: 'hola', conversationId: 'conv-other-user' } });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('no encontrada');
  });

  it('con conversationId existente del mismo usuario: reusa la conversación en vez de crear otra', async () => {
    const mockDB = createMockD1({
      copilot_conversations: [
        { id: 'conv-1', user_id: 'user-1', title: 'Conversación previa', active_context_json: '{}' },
      ],
    });
    const ctx = await makeContext({ mockDB, body: { message: 'sigamos', conversationId: 'conv-1' } });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.conversationId).toBe('conv-1');

    const conversations = await mockDB.prepare('SELECT id FROM copilot_conversations WHERE user_id = ?')
      .bind('user-1').all<{ id: string }>();
    expect(conversations.results.length).toBe(1);
  });

  it('si la IA falla la validación de schema, devuelve un fallback controlado en vez de 500', async () => {
    const ctx = await makeContext({ aiResponse: 'Esto no es JSON.' });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.intent).toBe('clarify');
    expect(data.message.length).toBeGreaterThan(0);
  });

  it('sin message → 400', async () => {
    const ctx = await makeContext({ body: {} });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('message');
  });

  it('método distinto de POST → 405', async () => {
    const response = await onRequest();
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.error).toContain('POST');
  });

  it('aunque la IA proponga generate_material con requiresConfirmation:false, nunca se auto-ejecuta (Fase 2 — WRITE_TOOLS)', async () => {
    const ctx = await makeContext({
      aiResponse: JSON.stringify(validCopilotAiResponse({
        intent: 'generate_material',
        requiresConfirmation: false,
        actions: [{
          tool: 'generate_material',
          arguments: { type: 'guia_estudiante', level: '4B', subject: 'Matemática', objectiveCode: 'MA04 OA 03', objectiveText: 'x', topic: 'fracciones' },
        }],
      })),
    });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.requiresConfirmation).toBe(false);
    expect(data.actions[0].tool).toBe('generate_material');
    // La herramienta de escritura queda propuesta pero jamás se ejecuta acá:
    // solo /api/copilot/confirm puede ejecutarla, y solo tras confirmación.
    expect(data.toolResults).toEqual([]);
  });
});
