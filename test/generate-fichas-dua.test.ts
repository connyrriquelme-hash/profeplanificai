import { describe, it, expect } from 'vitest';
import { signToken } from './helpers/mockD1';
import type { DuaGuide } from '../functions/core/types';

const TEST_SECRET = 'test-jwt-secret-with-at-least-32-characters!!';

const MOCK_DUA_GUIDE: DuaGuide = {
  titulo_guia: 'Guía Multinivel DUA: La célula — Ciencias Naturales (5° Básico)',
  contexto_motivacional: 'Exploramos la célula desde experiencias concretas.',
  oa_a_trabajar: 'OA 1: Describir la estructura celular.',
  habilidades: ['Describir', 'Comparar'],
  criterios_aprendizaje: ['Identifica las partes principales de la célula.'],
  nivel_apoyo: ['Actividad 1: modelaje docente con diagrama de la célula.'],
  nivel_estandar: ['Actividad 1: explorar un modelo de célula y registrar sus partes.'],
  nivel_desafio: ['Actividad 1: investigar una organela y explicar su función.'],
};

function aiJsonResponse() {
  return JSON.stringify({
    apoyo: {
      nivel: 'apoyo',
      titulo: 'Ficha de Apoyo: La célula',
      objetivo: 'Reconozco las partes principales de la célula con apoyo visual.',
      vocabularioClave: [
        { termino: 'Célula', definicion: 'La unidad más pequeña que forma a los seres vivos.' },
        { termino: 'Núcleo', definicion: 'La parte de la célula que la controla.' },
      ],
      actividades: [
        { instruccion: 'Observa el diagrama y señala el núcleo.', espacioRespuesta: false },
        { instruccion: 'Dibuja una célula y pinta el núcleo.', espacioRespuesta: true },
      ],
      autoevaluacion: ['Puedo señalar el núcleo.', 'Todavía me cuesta reconocer la membrana.'],
    },
    estandar: {
      nivel: 'estandar',
      titulo: 'Ficha Estándar: La célula',
      objetivo: 'Describo las partes principales de la célula y su función.',
      vocabularioClave: [
        { termino: 'Membrana', definicion: 'La capa que envuelve y protege la célula.' },
        { termino: 'Citoplasma', definicion: 'El líquido que llena la célula por dentro.' },
      ],
      actividades: [
        { instruccion: 'Compara una célula animal y una vegetal.', espacioRespuesta: true },
        { instruccion: 'Explica a un compañero qué hace el núcleo.', espacioRespuesta: false },
      ],
      autoevaluacion: ['Puedo explicar qué hace el núcleo.', '¿Qué parte me costó más comparar?'],
    },
    desafio: {
      nivel: 'desafio',
      titulo: 'Ficha de Desafío: La célula',
      objetivo: 'Investigo una organela y explico su función en la célula.',
      vocabularioClave: [
        { termino: 'Mitocondria', definicion: 'La organela que produce la energía de la célula.' },
        { termino: 'Organela', definicion: 'Una estructura pequeña con una función específica.' },
      ],
      actividades: [
        { instruccion: 'Investiga una organela y escribe su función.', espacioRespuesta: true },
        { instruccion: 'Crea un modelo 3D de una célula.', espacioRespuesta: false },
      ],
      autoevaluacion: ['Puedo justificar por qué elegí esa organela.', '¿Qué agregaría para profundizar más?'],
    },
  });
}

async function makeContext(overrides: {
  body?: Record<string, unknown>;
  withAuth?: boolean;
  aiResponse?: string;
}) {
  const withAuth = overrides.withAuth ?? true;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = await signToken('user-1', 'user-1@test.cl', TEST_SECRET);
    headers['Authorization'] = `Bearer ${token}`;
  }

  const body = overrides.body ?? { duaGuide: MOCK_DUA_GUIDE, level: '5° Básico', subject: 'Ciencias Naturales', topic: 'La célula' };

  return {
    request: new Request('http://localhost/api/generate-fichas-dua', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }),
    env: {
      JWT_SECRET: TEST_SECRET,
      AI: { run: async () => overrides.aiResponse ?? aiJsonResponse() },
    },
  } as any;
}

describe('POST /api/generate-fichas-dua', () => {
  it('debe devolver 200 con las 3 fichas cuando el request es válido y hay sesión', async () => {
    const { onRequestPost } = await import('../functions/api/generate-fichas-dua');
    const ctx = await makeContext({});
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.fichas.apoyo.nivel).toBe('apoyo');
    expect(data.fichas.estandar.nivel).toBe('estandar');
    expect(data.fichas.desafio.nivel).toBe('desafio');
  });

  it('debe devolver 401 sin token de sesión', async () => {
    const { onRequestPost } = await import('../functions/api/generate-fichas-dua');
    const ctx = await makeContext({ withAuth: false });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Sesión');
  });

  it('debe devolver 400 cuando falta duaGuide', async () => {
    const { onRequestPost } = await import('../functions/api/generate-fichas-dua');
    const ctx = await makeContext({ body: { level: '5° Básico', subject: 'Ciencias Naturales' } });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('duaGuide');
  });

  it('debe devolver 400 cuando faltan level o subject', async () => {
    const { onRequestPost } = await import('../functions/api/generate-fichas-dua');
    const ctx = await makeContext({ body: { duaGuide: MOCK_DUA_GUIDE } });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('obligatorios');
  });

  it('debe devolver 200 con fallback determinista cuando la IA falla', async () => {
    const { onRequestPost } = await import('../functions/api/generate-fichas-dua');
    const ctx = await makeContext({ aiResponse: 'No es JSON' });
    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.fichas.apoyo.actividades[0].instruccion).toBe(MOCK_DUA_GUIDE.nivel_apoyo[0]);
  });

  it('debe devolver 405 para métodos distintos de POST', async () => {
    const { onRequest } = await import('../functions/api/generate-fichas-dua');
    const response = await onRequest();
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.error).toContain('POST');
  });
});
