import { describe, it, expect } from 'vitest';
import { onRequestPost } from '../functions/api/materials/presentation/render';
import { createMockD1, signToken } from './helpers/mockD1';

function validPptDeck() {
  return {
    slides: [
      { layout: 'title', title: 'La Célula', subtitle: 'Ciencias Naturales — 5° Básico' },
      { layout: 'bullets', title: 'Objetivo', bullets: ['Identificar partes de la célula', 'Comprender su función', 'Relacionar estructuras'] },
      { layout: 'image_text', title: 'Membrana Celular', body: 'Barrera selectiva que regula el paso de sustancias', imageQuery: 'membrana celular' },
      { layout: 'comparison', title: 'Tipos de Células', left: { label: 'Procariota', points: ['Sin núcleo definido'] }, right: { label: 'Eucariota', points: ['Con núcleo definido'] } },
      { layout: 'quote', text: 'La célula es la unidad fundamental de la vida', author: 'Schleiden' },
    ],
  };
}

function invalidPptDeck() {
  return { slides: [{ layout: 'title', title: 'Solo' }] };
}

function seededDB() {
  return createMockD1({
    generated_resources: [
      {
        id: 'res-valid',
        title: 'Test Presentation',
        type: 'presentacion',
        content: '[{"type":"cover","title":"Test"}]',
        content_json: JSON.stringify({ slideCount: 5, pptDeck: validPptDeck() }),
        level: '5° Básico',
        subject: 'Ciencias Naturales',
        objective_code: 'OA01',
        user_id: 'user-1',
      },
      {
        id: 'res-legacy',
        title: 'Legacy Presentation',
        type: 'presentacion',
        content: '[{"type":"cover","title":"Legacy"}]',
        content_json: JSON.stringify({ slideCount: 3, designStyle: 'claro' }),
        level: '5° Básico',
        subject: 'Ciencias Naturales',
        objective_code: 'OA01',
        user_id: null,
      },
      {
        id: 'res-other-inst',
        title: 'Other Institution',
        type: 'presentacion',
        content: '[{"type":"cover","title":"Other"}]',
        content_json: JSON.stringify({ slideCount: 5, pptDeck: validPptDeck() }),
        level: '5° Básico',
        subject: 'Ciencias Naturales',
        objective_code: 'OA01',
        user_id: 'user-owner',
      },
    ],
    institution_members: [
      { user_id: 'user-1', institution_id: 'inst-1', role: 'docente', status: 'active' },
      { user_id: 'user-owner', institution_id: 'inst-2', role: 'docente', status: 'active' },
    ],
  });
}

async function makeContext(overrides: {
  body?: Record<string, unknown>;
  tokenSub?: string;
  mockDB?: ReturnType<typeof createMockD1>;
}) {
  const mockDB = overrides.mockDB ?? seededDB();
  const tokenSub = overrides.tokenSub ?? 'user-1';
  const TEST_SECRET = 'test-jwt-secret-with-at-least-32-characters!!';
  const token = await signToken(tokenSub, `${tokenSub}@test.cl`, TEST_SECRET);

  return {
    request: new Request('http://localhost/api/materials/presentation/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(overrides.body ?? { resourceId: 'res-valid' }),
    }),
    env: { DB: mockDB, JWT_SECRET: TEST_SECRET },
  } as any;
}

describe('POST /api/materials/presentation/render', () => {
  it('renderiza PPTX válido vía resourceId → 200 + Content-Type + firma PK', async () => {
    const ctx = await makeContext({});
    const res = await onRequestPost(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    );
    expect(res.headers.get('Content-Disposition')).toMatch(/^attachment; filename=".*\.pptx"$/);

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4B);
  });

  it('renderiza PPTX válido vía deck directo (sin resourceId)', async () => {
    const ctx = await makeContext({ body: { deck: validPptDeck() } });
    const res = await onRequestPost(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    );

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4B);
  });

  it('resourceId inexistente → 400', async () => {
    const ctx = await makeContext({ body: { resourceId: 'no-existe' } });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(400);
    expect(json.error).toContain('no encontrado');
  });

  it('resourceId sin pptDeck (camino legacy) → 400 con mensaje claro', async () => {
    const ctx = await makeContext({ body: { resourceId: 'res-legacy' } });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(400);
    expect(json.error).toContain('No hay PptDeck');
  });

  it('deck inválido (menos de 5 slides) → 400 con detalle de validación', async () => {
    const ctx = await makeContext({ body: { deck: invalidPptDeck() } });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(400);
    expect(json.error).toContain('inválido');
    expect(json.details).toBeDefined();
    expect(Array.isArray(json.details)).toBe(true);
  });

  it('usuario de institución A no puede renderizar resourceId de institución B → 403', async () => {
    const ctx = await makeContext({
      tokenSub: 'user-1',
      body: { resourceId: 'res-other-inst' },
    });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(403);
    expect(json.error).toContain('permiso');
  });

  it('sin token → 401', async () => {
    const ctx = {
      request: new Request('http://localhost/api/materials/presentation/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: 'res-valid' }),
      }),
      env: { DB: seededDB(), JWT_SECRET: 'test-jwt-secret-with-at-least-32-characters!!' },
    } as any;
    const res = await onRequestPost(ctx);

    expect(res.status).toBe(401);
    const json = await res.json() as any;
    expect(json.error).toContain('Sesión');
  });

  it('slug del filename se deriva del primer slide title', async () => {
    const ctx = await makeContext({});
    const res = await onRequestPost(ctx);

    expect(res.status).toBe(200);
    const disposition = res.headers.get('Content-Disposition') || '';
    expect(disposition).toContain('.pptx');
    expect(disposition).not.toContain('undefined');
  });
});
