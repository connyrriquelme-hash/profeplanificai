import { describe, it, expect } from 'vitest';
import { onRequestPost, onRequestGet } from '../functions/api/materials/unidad-didactica';
import { createMockD1, signToken } from './helpers/mockD1';

const TEST_SECRET = 'test-jwt-secret-with-at-least-32-characters!!';

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    titulo: 'Pueblos originarios de Chile',
    nivel: '2° Básico',
    metodologiaActiva: 'ABP',
    oas: [
      { subject: 'Historia, Geografía y Ciencias Sociales', objective: 'HI02 OA 01: Describir los modos de vida de algunos pueblos originarios de Chile.' },
      { subject: 'Historia, Geografía y Ciencias Sociales', objective: 'HI02 OA 02: Comparar el modo de vida de pueblos indígenas actuales con el periodo precolombino.' },
    ],
    ...overrides,
  };
}

function validAiUnidad() {
  return JSON.stringify({
    titulo: 'Investigando a los pueblos originarios de Chile',
    nivel: '2° Básico',
    asignatura: 'Historia, Geografía y Ciencias Sociales',
    metodologiaActiva: 'ABP',
    objetivosAprendizaje: ['HI02 OA 01', 'HI02 OA 02'],
    fases: [
      { nombre: 'Pregunta Guia', descripcion: 'Se plantea la pregunta central del proyecto.', orden: 0 },
      { nombre: 'Investigacion', descripcion: 'Los estudiantes investigan en grupos.', orden: 1 },
    ],
    clases: [
      {
        numero: 1,
        faseAsociada: 'Pregunta Guia',
        tema: '¿Quiénes vivían en Chile hace mucho tiempo?',
        objetivoEspecifico: 'Reconocer que existieron distintos pueblos antes de la llegada de los españoles.',
        estructuraClase: {
          inicio: { tiempoMinutos: 10, descripcion: 'Mostrar imágenes de distintos pueblos originarios.' },
          desarrollo: { tiempoMinutos: 30, descripcion: 'Formar grupos y plantear la pregunta guía.' },
          cierre: { tiempoMinutos: 10, descripcion: 'Compartir ideas iniciales en plenario.' },
        },
      },
      {
        numero: 2,
        faseAsociada: 'Investigacion',
        tema: 'Cómo vivían los pueblos originarios',
        objetivoEspecifico: 'Investigar en grupos cómo vivía un pueblo originario asignado.',
        estructuraClase: {
          inicio: { tiempoMinutos: 5, descripcion: 'Recordar la pregunta guía.' },
          desarrollo: { tiempoMinutos: 35, descripcion: 'Investigación en grupos con material impreso.' },
          cierre: { tiempoMinutos: 5, descripcion: 'Registrar avances en una bitácora grupal.' },
        },
      },
    ],
  });
}

async function makeContext(options: {
  body?: Record<string, unknown>;
  tokenSub?: string | null;
  ai?: Ai;
  mockDB?: ReturnType<typeof createMockD1>;
}) {
  const mockDB = options.mockDB ?? createMockD1({});
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options.tokenSub !== null) {
    const tokenSub = options.tokenSub ?? 'user-1';
    const token = await signToken(tokenSub, `${tokenSub}@test.cl`, TEST_SECRET);
    headers['Authorization'] = `Bearer ${token}`;
  }

  return {
    request: new Request('http://localhost/api/materials/unidad-didactica', {
      method: 'POST',
      headers,
      body: JSON.stringify(options.body ?? validBody()),
    }),
    env: { DB: mockDB, AI: options.ai, JWT_SECRET: TEST_SECRET },
  } as any;
}

describe('POST /api/materials/unidad-didactica', () => {
  it('genera la unidad con IA real (mock) → 200 + unidad válida', async () => {
    const ai = { run: async () => validAiUnidad() } as unknown as Ai;
    const ctx = await makeContext({ ai });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.usedFallback).toBe(false);
    expect(json.unidad.titulo).toBe('Investigando a los pueblos originarios de Chile');
    expect(json.unidad.clases.length).toBe(2);
    expect(json.id).toMatch(/^unidad_/);
  });

  it('IA no configurada → nunca lanza excepción, cae al fallback (usedFallback=true) y sigue devolviendo 200', async () => {
    const ctx = await makeContext({ ai: undefined });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.usedFallback).toBe(true);
    expect(json.unidad.clases.length).toBeGreaterThanOrEqual(2);
    expect(json.unidad.fases.length).toBeGreaterThanOrEqual(2);
  });

  it('IA devuelve JSON inválido → nunca lanza excepción, cae al fallback y sigue devolviendo 200', async () => {
    const ai = { run: async () => 'esto no es JSON en absoluto' } as unknown as Ai;
    const ctx = await makeContext({ ai });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.unidad.clases.length).toBeGreaterThanOrEqual(2);
  });

  it('persiste la unidad en la tabla unidades_didacticas', async () => {
    const mockDB = createMockD1({});
    const ai = { run: async () => validAiUnidad() } as unknown as Ai;
    const ctx = await makeContext({ ai, mockDB, tokenSub: 'user-42' });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);

    const { results } = await mockDB.prepare('SELECT * FROM unidades_didacticas WHERE id = ?').bind(json.id).all<any>();
    expect(results.length).toBe(1);
    expect(results[0].user_id).toBe('user-42');
    expect(results[0].nivel).toBe('2° Básico');
    expect(results[0].metodologia_activa).toBe('ABP');
    expect(results[0].clase_count).toBe(2);
    expect(JSON.parse(results[0].content_json as string).titulo).toBe(json.unidad.titulo);
  });

  it('sin token → 401, no persiste nada', async () => {
    const mockDB = createMockD1({});
    const ctx = await makeContext({ mockDB, tokenSub: null });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(401);
    expect(json.error).toContain('Sesión');

    const { results } = await mockDB.prepare('SELECT * FROM unidades_didacticas').all<any>();
    expect(results.length).toBe(0);
  });

  it('metodologiaActiva inválida → 400', async () => {
    const ctx = await makeContext({ body: validBody({ metodologiaActiva: 'No Existe' }) });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(400);
    expect(json.error).toContain('metodologiaActiva');
  });

  it('sin oas → 400', async () => {
    const ctx = await makeContext({ body: validBody({ oas: [] }) });
    const res = await onRequestPost(ctx);

    expect(res.status).toBe(400);
  });
});

async function makeGetContext(options: {
  tokenSub?: string | null;
  mockDB?: ReturnType<typeof createMockD1>;
}) {
  const mockDB = options.mockDB ?? createMockD1({});
  const headers: Record<string, string> = {};

  if (options.tokenSub !== null) {
    const tokenSub = options.tokenSub ?? 'user-1';
    const token = await signToken(tokenSub, `${tokenSub}@test.cl`, TEST_SECRET);
    headers['Authorization'] = `Bearer ${token}`;
  }

  return {
    request: new Request('http://localhost/api/materials/unidad-didactica', { method: 'GET', headers }),
    env: { DB: mockDB, JWT_SECRET: TEST_SECRET },
  } as any;
}

describe('GET /api/materials/unidad-didactica', () => {
  it('sin token → 401', async () => {
    const ctx = await makeGetContext({ tokenSub: null });
    const res = await onRequestGet(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(401);
    expect(json.error).toContain('Sesión');
  });

  it('devuelve solo las unidades del usuario autenticado, nunca las de otro', async () => {
    const mockDB = createMockD1({
      unidades_didacticas: [
        {
          id: 'unidad-mia',
          user_id: 'user-1',
          content_json: JSON.stringify({ titulo: 'Mi unidad', clases: [] }),
          created_at: '2026-07-26 10:00:00',
        },
        {
          id: 'unidad-de-otro',
          user_id: 'user-2',
          content_json: JSON.stringify({ titulo: 'Unidad de otro docente', clases: [] }),
          created_at: '2026-07-26 09:00:00',
        },
      ],
    });

    const ctx = await makeGetContext({ mockDB, tokenSub: 'user-1' });
    const res = await onRequestGet(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.length).toBe(1);
    expect(json.data[0].id).toBe('unidad-mia');
    expect(json.data[0].unidad.titulo).toBe('Mi unidad');
  });

  it('usuario sin unidades guardadas → data vacío, no 500', async () => {
    const ctx = await makeGetContext({ tokenSub: 'user-sin-unidades' });
    const res = await onRequestGet(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
  });
});
