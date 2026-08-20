import { describe, it, expect } from 'vitest';
import { onRequestPost, onRequest } from '../functions/api/copilot/confirm';
import { createMockD1, signToken } from './helpers/mockD1';

const TEST_SECRET = 'test-jwt-secret-with-at-least-32-characters!!';

function seededDB(overrides: Record<string, unknown[]> = {}) {
  return createMockD1({
    copilot_conversations: [
      { id: 'conv-1', user_id: 'user-1', title: 'Conversación', active_context_json: '{}' },
    ],
    generated_resources: [
      {
        id: 'res-1',
        user_id: 'user-1',
        title: 'Guía de fracciones',
        type: 'guia_estudiante',
        content: '{}',
        content_json: JSON.stringify({ title: 'Guía de fracciones', sections: [] }),
        level: '4° básico',
        subject: 'Matemática',
        objective_code: 'MA04 OA 03',
      },
    ],
    ...overrides,
  });
}

async function makeContext(overrides: {
  body?: Record<string, unknown>;
  withAuth?: boolean;
  mockDB?: ReturnType<typeof createMockD1>;
}) {
  const withAuth = overrides.withAuth ?? true;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = await signToken('user-1', 'user-1@test.cl', TEST_SECRET);
    headers['Authorization'] = `Bearer ${token}`;
  }

  const body = overrides.body ?? {
    conversationId: 'conv-1',
    confirmedAction: { tool: 'save_to_bank', arguments: { resourceId: 'res-1' } },
  };

  return {
    request: new Request('http://localhost/api/copilot/confirm', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }),
    env: {
      DB: overrides.mockDB ?? seededDB(),
      JWT_SECRET: TEST_SECRET,
      AI: { run: async () => '{}' },
    },
  } as any;
}

describe('POST /api/copilot/confirm', () => {
  it('sin token → 401', async () => {
    const ctx = await makeContext({ withAuth: false });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Sesión');
  });

  it('conversationId faltante → 400, no ejecuta nada', async () => {
    const ctx = await makeContext({ body: { confirmedAction: { tool: 'save_to_bank', arguments: {} } } });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('conversationId');
  });

  it('herramienta que no está en WRITE_TOOLS → 400, nunca se ejecuta (ej. search_curriculum)', async () => {
    const ctx = await makeContext({
      body: { conversationId: 'conv-1', confirmedAction: { tool: 'search_curriculum', arguments: { query: 'x' } } },
    });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('no válida');
  });

  it('conversación de otro usuario → 404, no filtra conversaciones ajenas', async () => {
    const mockDB = seededDB({
      copilot_conversations: [
        { id: 'conv-other', user_id: 'user-2', title: 'Ajena', active_context_json: '{}' },
      ],
    });
    const ctx = await makeContext({
      mockDB,
      body: { conversationId: 'conv-other', confirmedAction: { tool: 'save_to_bank', arguments: { resourceId: 'res-1' } } },
    });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('no encontrada');
  });

  it('save_to_bank válido: ejecuta, guarda en resource_bank y persiste copilot_messages con role=tool', async () => {
    const mockDB = seededDB();
    const ctx = await makeContext({ mockDB });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.tool).toBe('save_to_bank');
    expect(data.result.bankResourceId).toBeTruthy();

    const bankRows = await mockDB.prepare('SELECT id, title, type FROM resource_bank WHERE id = ?')
      .bind(data.result.bankResourceId).all<{ id: string; title: string; type: string }>();
    expect(bankRows.results.length).toBe(1);
    expect(bankRows.results[0].title).toBe('Guía de fracciones');

    const toolMessages = await mockDB.prepare('SELECT role, content, tool_calls_json, tool_result_json FROM copilot_messages WHERE conversation_id = ?')
      .bind('conv-1').all<{ role: string; content: string; tool_calls_json: string; tool_result_json: string }>();
    expect(toolMessages.results.length).toBe(1);
    expect(toolMessages.results[0].role).toBe('tool');
    const calls = JSON.parse(toolMessages.results[0].tool_calls_json);
    expect(calls).toEqual({ tool: 'save_to_bank', arguments: { resourceId: 'res-1' } });
    const result = JSON.parse(toolMessages.results[0].tool_result_json);
    expect(result.ok).toBe(true);
  });

  it('resourceId inexistente o ajeno: no ejecuta la escritura, responde 500 y audita el fallo', async () => {
    const mockDB = seededDB();
    const ctx = await makeContext({
      mockDB,
      body: { conversationId: 'conv-1', confirmedAction: { tool: 'save_to_bank', arguments: { resourceId: 'res-inexistente' } } },
    });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.details).toContain('no encontrado');

    const bankRows = await mockDB.prepare('SELECT id FROM resource_bank').bind().all();
    expect(bankRows.results.length).toBe(0);

    const toolMessages = await mockDB.prepare('SELECT role, tool_result_json FROM copilot_messages WHERE conversation_id = ?')
      .bind('conv-1').all<{ role: string; tool_result_json: string }>();
    expect(toolMessages.results.length).toBe(1);
    expect(JSON.parse(toolMessages.results[0].tool_result_json).ok).toBe(false);
  });

  it('edit_material sin instruccion → argumentos inválidos, no ejecuta la edición (400/500, nunca 200)', async () => {
    const ctx = await makeContext({
      body: { conversationId: 'conv-1', confirmedAction: { tool: 'edit_material', arguments: { resourceId: 'res-1' } } },
    });
    const response = await onRequestPost(ctx);

    expect(response.status).not.toBe(200);
  });

  it('método distinto de POST → 405', async () => {
    const response = await onRequest();
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.error).toContain('POST');
  });

  it('REGRESIÓN: generate_material persiste user_id (vía token interno) para que save_to_bank encuentre el recurso recién creado', async () => {
    const mockDB = seededDB();
    const genCtx = await makeContext({
      mockDB,
      body: {
        conversationId: 'conv-1',
        confirmedAction: {
          tool: 'generate_material',
          arguments: {
            type: 'ticket_salida',
            level: '4° básico',
            subject: 'Matemática',
            objectiveCode: 'MA04 OA 03',
            objectiveText: 'comprender fracciones de uso común',
            topic: 'fracciones',
          },
        },
      },
    });
    const genResponse = await onRequestPost(genCtx);
    const genData = await genResponse.json();

    expect(genResponse.status).toBe(200);
    expect(genData.ok).toBe(true);
    const resourceId = genData.result.resourceId;
    expect(resourceId).toBeTruthy();

    // El endpoint interno (generate.ts) debe haber visto un Authorization
    // real y guardado user_id — si generateMaterial deja de mandar el token
    // interno, esta fila queda con user_id NULL y lo de abajo vuelve a fallar.
    const resourceRow = await mockDB.prepare('SELECT user_id FROM generated_resources WHERE id = ?')
      .bind(resourceId).first<{ user_id: string }>();
    expect(resourceRow?.user_id).toBe('user-1');

    const saveCtx = await makeContext({
      mockDB,
      body: {
        conversationId: 'conv-1',
        confirmedAction: { tool: 'save_to_bank', arguments: { resourceId } },
      },
    });
    const saveResponse = await onRequestPost(saveCtx);
    const saveData = await saveResponse.json();

    expect(saveResponse.status).toBe(200);
    expect(saveData.ok).toBe(true);
    expect(saveData.result.bankResourceId).toBeTruthy();
  });
});
