import { describe, it, expect, vi } from 'vitest';
import type { AIEngineEnv, PedagogicalEngineEnv, CurriculumObjectiveRow } from '../functions/core/types';

const MOCK_ROW: CurriculumObjectiveRow = {
  codigo_oa: 'OA 1',
  descripcion: 'Describir la estructura celular',
  habilidades_csv: 'describir, identificar',
  unidad_titulo: 'La célula',
};

function mockContext(body?: unknown, method = 'POST') {
  const bindMock = vi.fn().mockReturnValue({
    first: vi.fn().mockResolvedValue(MOCK_ROW),
  });
  const prepareMock = vi.fn().mockReturnValue({ bind: bindMock });

  const env = {
    CORE_DB: { prepare: prepareMock } as unknown as D1Database,
    AI: {
      run: vi.fn().mockResolvedValue(JSON.stringify({
        titulo_guia: 'Guía La Célula',
        contexto_motivacional: 'La célula es la unidad básica.',
        nivel_apoyo: ['Fichas'],
        nivel_estandar: ['Explicación'],
        nivel_desafio: ['Análisis'],
      })),
    } as unknown as Ai,
  };

  return {
    env,
    request: {
      method,
      url: 'https://example.com/api/generate-project',
      json: body ? vi.fn().mockResolvedValue(body) : vi.fn().mockRejectedValue(new Error('No body')),
    },
  };
}

describe('POST /api/generate-project', () => {
  it('should return 200 with plan and duaGuide for valid request', async () => {
    const { onRequestPost } = await import('../functions/api/generate-project');
    const ctx = mockContext({ tema: 'La célula', nivel: '5° Básico', asignatura: 'Ciencias Naturales', objectiveCode: 'OA 1' });
    const response = await onRequestPost(ctx as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.plan).toBeDefined();
    expect(data.plan.tema).toBe('La célula');
    expect(data.plan.curso).toBe('5° Básico');
    expect(data.duaGuide).toBeDefined();
    expect(data.duaGuide.titulo_guia).toBeDefined();
  });

  it('should return 400 when fields are missing', async () => {
    const { onRequestPost } = await import('../functions/api/generate-project');
    const ctx = mockContext({ tema: 'La célula' });
    const response = await onRequestPost(ctx as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toContain('obligatorios');
  });

  it('should return 400 when body is empty', async () => {
    const { onRequestPost } = await import('../functions/api/generate-project');
    const ctx = mockContext({});
    const response = await onRequestPost(ctx as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it('should return 400 when objectiveCode is missing', async () => {
    const { onRequestPost } = await import('../functions/api/generate-project');
    const ctx = mockContext({ tema: 'La célula', nivel: '5° Básico', asignatura: 'Ciencias Naturales' });
    const response = await onRequestPost(ctx as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toContain('objetivo de aprendizaje');
  });

  it('should return 200 using selected OA text when CORE_DB does not contain that OA', async () => {
    const { onRequestPost } = await import('../functions/api/generate-project');
    const ctx = mockContext({
      tema: 'Lectura comprensiva',
      nivel: '2° Básico',
      asignatura: 'Lenguaje',
      objectiveCode: 'LE02 OA 05',
      objectiveText: 'Demostrar comprensión de las narraciones leídas.',
    });
    const bindMock = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
    });
    ctx.env.CORE_DB = { prepare: vi.fn().mockReturnValue({ bind: bindMock }) } as any;

    const response = await onRequestPost(ctx as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.plan.objetivo_aprendizaje).toContain('LE02 OA 05');
    expect(data.duaGuide).toBeDefined();
  });

  it('should return 404 when no OA is found', async () => {
    const { onRequestPost } = await import('../functions/api/generate-project');
    const ctx = mockContext({ tema: 'Tema inexistente', nivel: '99° Básico', asignatura: 'Fantasía', objectiveCode: 'OA X' });
    const bindMock = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
    });
    ctx.env.CORE_DB = { prepare: vi.fn().mockReturnValue({ bind: bindMock }) } as any;
    const response = await onRequestPost(ctx as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.ok).toBe(false);
    expect(data.error).toContain('objetivo de aprendizaje');
  });

  it('should return 500 when CORE_DB is not configured', async () => {
    const { onRequestPost } = await import('../functions/api/generate-project');
    const ctx = mockContext({ tema: 'La célula', nivel: '5° Básico', asignatura: 'Ciencias Naturales', objectiveCode: 'OA 1' });
    ctx.env.CORE_DB = undefined as any;
    const response = await onRequestPost(ctx as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.ok).toBe(false);
  });

  it('should return 405 for non-POST methods', async () => {
    const { onRequest } = await import('../functions/api/generate-project');
    const response = await onRequest();
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.ok).toBe(false);
    expect(data.error).toContain('POST');
  });

  it('should not expose stack traces in error response', async () => {
    const { onRequestPost } = await import('../functions/api/generate-project');
    const ctx = mockContext({ tema: 'La célula', nivel: '5° Básico', asignatura: 'Ciencias Naturales', objectiveCode: 'OA 1' });
    ctx.env.CORE_DB = undefined as any;
    const response = await onRequestPost(ctx as any);
    const data = await response.json();

    expect(data.stack).toBeUndefined();
    expect(data.details).toBeUndefined();
  });
});
