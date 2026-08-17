import { describe, it, expect } from 'vitest';
import { onRequestPatch, onRequest } from '../functions/api/materials/guide/edit';
import { createMockD1, signToken } from './helpers/mockD1';
import type { GuiaResult } from '../functions/core/GuiaEngine';

const TEST_SECRET = 'test-jwt-secret-with-at-least-32-characters!!';

function mockGuia(): GuiaResult {
  return {
    title: 'Guía: Fracciones',
    objective: 'Comprendo qué es una fracción.',
    sections: [
      { title: 'Introducción', content: 'Hoy vamos a aprender sobre fracciones.' },
      {
        title: 'Actividad 1: Activación',
        content: 'Responde qué sabes sobre repartir cosas en partes iguales.',
        activities: ['¿Alguna vez repartiste una pizza en partes iguales?', 'Dibuja cómo la repartirías.', 'Escribe qué fracción representa.'],
      },
      {
        title: 'Reflexión / Autoevaluación',
        content: '',
        activities: ['Puedo explicar qué es una fracción.'],
      },
    ],
  };
}

function validAiEditResponse() {
  return {
    seccionModificada: 1,
    seccionNueva: {
      title: 'Actividad 1: Activación',
      content: 'Mira la imagen de la pizza repartida en 4 partes y responde con dibujos.',
      activities: ['Señala un pedazo y di qué fracción representa.', 'Colorea la mitad de la pizza.'],
    },
    explicacion: 'Simplifiqué la actividad usando apoyo visual para estudiantes con dificultades.',
  };
}

function seededDB() {
  return createMockD1({
    generated_resources: [
      {
        id: 'guide-valid',
        title: 'Guía Estudiante: OA01',
        type: 'guia_estudiante',
        content: JSON.stringify(mockGuia()),
        content_json: JSON.stringify({ topic: 'Fracciones', methodology: 'Tradicional' }),
        level: '4° Básico',
        subject: 'Matemática',
        objective_code: 'OA01',
        user_id: 'user-1',
      },
    ],
  });
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

  const body = overrides.body ?? {
    resourceId: 'guide-valid',
    instruccion: 'simplifica la primera actividad para estudiantes con dificultades',
    guia: mockGuia(),
  };

  return {
    request: new Request('http://localhost/api/materials/guide/edit', {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    }),
    env: {
      DB: overrides.mockDB ?? seededDB(),
      JWT_SECRET: TEST_SECRET,
      AI: { run: async () => overrides.aiResponse ?? JSON.stringify(validAiEditResponse()) },
    },
  } as any;
}

describe('PATCH /api/materials/guide/edit', () => {
  it('edición exitosa: devuelve seccionModificada, guiaActualizada y explicación, y persiste en D1', async () => {
    const mockDB = seededDB();
    const ctx = await makeContext({ mockDB });
    const response = await onRequestPatch(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.seccionModificada).toBe(1);
    expect(data.explicacion).toContain('Simplifiqué');
    expect(data.guiaActualizada.sections[1].content).toContain('dibujos');
    // El resto de la guía queda intacto.
    expect(data.guiaActualizada.sections[0]).toEqual(mockGuia().sections[0]);

    const persisted = await mockDB.prepare('SELECT content FROM generated_resources WHERE id = ?').bind('guide-valid').first<{ content: string }>();
    const persistedGuia = JSON.parse(persisted!.content as string);
    expect(persistedGuia.sections[1].content).toContain('dibujos');
  });

  it('instrucción que la IA no puede resolver (respuesta no-JSON) → 200 con fallback limpio, guía sin cambios', async () => {
    const ctx = await makeContext({ aiResponse: 'Esto no es JSON.' });
    const response = await onRequestPatch(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.seccionModificada).toBe(-1);
    expect(data.explicacion).toContain('No pude aplicar el cambio');
    expect(data.guiaActualizada).toEqual(mockGuia());
  });

  it('sin token → 401', async () => {
    const ctx = await makeContext({ withAuth: false });
    const response = await onRequestPatch(ctx);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Sesión');
  });

  it('resourceId inexistente → 400', async () => {
    const ctx = await makeContext({ body: { resourceId: 'no-existe', instruccion: 'cambia algo', guia: mockGuia() } });
    const response = await onRequestPatch(ctx);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('no encontrado');
  });

  it('sin instruccion → 400', async () => {
    const ctx = await makeContext({ body: { resourceId: 'guide-valid', guia: mockGuia() } });
    const response = await onRequestPatch(ctx);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('instruccion');
  });

  it('sin guia válida (sin sections) → 400', async () => {
    const ctx = await makeContext({ body: { resourceId: 'guide-valid', instruccion: 'cambia algo', guia: { title: 'x' } } });
    const response = await onRequestPatch(ctx);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('guia');
  });

  it('seccionIndex explícito se respeta aunque la IA sugiera otro índice', async () => {
    const ctx = await makeContext({
      body: { resourceId: 'guide-valid', instruccion: 'simplifica esta sección', seccionIndex: 2, guia: mockGuia() },
      aiResponse: JSON.stringify({ ...validAiEditResponse(), seccionModificada: 1 }),
    });
    const response = await onRequestPatch(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.seccionModificada).toBe(2);
    // La sección 1 (la que la IA sugirió) no debió tocarse.
    expect(data.guiaActualizada.sections[1]).toEqual(mockGuia().sections[1]);
  });

  it('método distinto de PATCH → 405', async () => {
    const response = await onRequest();
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.error).toContain('PATCH');
  });
});
