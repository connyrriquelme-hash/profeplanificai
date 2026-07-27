import { describe, it, expect, beforeEach } from 'vitest';
import { onRequestPost } from '../functions/api/materials/presentation';
import { createMockD1 } from './helpers/mockD1';

function makeContext(overrides: {
  body?: Record<string, unknown>;
  mockDB?: ReturnType<typeof createMockD1>;
  mockAi?: { run: (...args: unknown[]) => unknown };
}) {
  const mockDB = overrides.mockDB ?? createMockD1();
  const body = overrides.body ?? {
    level: '5° Básico',
    subject: 'Ciencias Naturales',
    objectiveCode: 'OA01',
    objectiveText: 'Identificar las partes de la célula',
    topic: 'La célula',
  };

  return {
    request: new Request('http://localhost/api/materials/presentation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    env: {
      DB: mockDB,
      AI: overrides.mockAi ?? makeDefaultAi(),
    },
  } as any;
}

function makeDefaultAi() {
  return {
    run: async () => JSON.stringify({
      slides: [
        { layout: 'title', title: 'La Célula', subtitle: 'Ciencias Naturales — 5° Básico' },
        { layout: 'bullets', title: 'Objetivo', bullets: ['Identificar partes de la célula', 'Comprender su función', 'Relacionar estructuras'] },
        { layout: 'image_text', title: 'Membrana Celular', body: 'Barrera selectiva que regula el paso de sustancias', imageQuery: 'membrana celular' },
        { layout: 'comparison', title: 'Tipos de Células', left: { label: 'Procariota', points: ['Sin núcleo definido', 'Más simples'] }, right: { label: 'Eucariota', points: ['Con núcleo', 'Más complejas'] } },
        { layout: 'quote', text: 'La célula es la unidad fundamental de la vida', author: 'Schleiden' },
      ],
    }),
  };
}

function makeSeededDB() {
  return createMockD1({
    objectives: [
      {
        code: 'OA01',
        descripcion: 'Identificar las partes de la célula',
        course_id: 'course-1',
        subject_id: 'subj-1',
        axis_id: 'axis-1',
        course_name: '5° Básico',
        subject_name: 'Ciencias Naturales',
        axis_name: 'Ciencias de la Vida',
      },
    ],
    curriculum_indicators: [
      { oa_code: 'OA01', indicator_text: 'Identifican las partes de la célula' },
      { oa_code: 'OA01', indicator_text: 'Describen la función de organelos' },
      { oa_code: 'OA01', indicator_text: 'Comparan tipos celulares' },
    ],
  });
}

describe('POST /api/materials/presentation', () => {
  let seededDB: ReturnType<typeof createMockD1>;

  beforeEach(() => {
    seededDB = makeSeededDB();
  });

  it('genera presentación con IA cuando slides no se proveen', async () => {
    const ctx = makeContext({ mockDB: seededDB });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.resourceId).toMatch(/^pptx_/);
    expect(json.slides).toBeDefined();
    expect(Array.isArray(json.slides)).toBe(true);

    expect(json.pptDeck).toBeDefined();
    expect(json.pptDeck.slides).toBeDefined();
    expect(json.pptDeck.slides.length).toBeGreaterThanOrEqual(5);

    const first = json.slides[0];
    expect(first.type).toBe('cover');
    expect(first.title).toBeDefined();
  });

  it('retorna pptDeck completo y slides legacy compatibles lado a lado', async () => {
    const ctx = makeContext({ mockDB: seededDB });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(json.slides.length).toBe(json.pptDeck.slides.length);
    expect(json.slides[0].type).toBe('cover');
    expect(json.pptDeck.slides[0].layout).toBe('title');
  });

  it('usa buildDefaultSlides cuando la IA devuelve respuesta vacía (fallback)', async () => {
    const emptyAi = {
      run: async () => '',
    };
    const ctx = makeContext({ mockDB: seededDB, mockAi: emptyAi });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.pptDeck).toBeDefined();
    expect(json.pptDeck.slides.length).toBeGreaterThanOrEqual(5);
    expect(json.slides.length).toBe(json.pptDeck.slides.length);
  });

  it('no lanza excepción cuando la IA falla (fallback seguro)', async () => {
    const throwingAi = {
      run: async () => { throw new Error('AI service unavailable'); },
    };
    const ctx = makeContext({ mockDB: seededDB, mockAi: throwingAi });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.pptDeck).toBeDefined();
    expect(json.pptDeck.slides.length).toBeGreaterThanOrEqual(5);
  });

  it('camino legacy: usa body.slides directamente cuando se proveen', async () => {
    const customSlides = [
      { type: 'cover', title: 'Portada Legacy', subtitle: 'Test' },
      { type: 'content', title: 'Slide Legacy', bullets: ['Punto 1', 'Punto 2'] },
    ];
    const ctx = makeContext({
      mockDB: seededDB,
      body: {
        level: '5° Básico',
        subject: 'Ciencias Naturales',
        objectiveCode: 'OA01',
        topic: 'Test',
        slides: customSlides,
      },
    });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.slides).toEqual(customSlides);
    expect(json.pptDeck).toBeUndefined();
  });

  it('devuelve 400 si faltan level, subject u objectiveCode', async () => {
    const ctx = makeContext({
      mockDB: seededDB,
      body: { title: 'test' },
    });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(400);
    expect(json.error).toContain('requeridos');
  });

  it('incluye metadata con objective e indicators', async () => {
    const ctx = makeContext({ mockDB: seededDB });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(json.metadata).toBeDefined();
    expect(json.metadata.objective).toBeDefined();
    expect(json.metadata.objective.code).toBe('OA01');
    expect(json.metadata.indicators).toBeDefined();
    expect(json.metadata.indicators.length).toBeGreaterThanOrEqual(1);
  });

  it('audiencia: estudiante habilita los 9 layouts (vocabulario, ciclo_proceso, quiz, verdadero_falso, etc.)', async () => {
    const estudianteAi = {
      run: async () => JSON.stringify({
        slides: [
          { layout: 'title', title: '¡La Célula!', subtitle: 'Ciencias Naturales — 5° Básico' },
          { layout: 'bullets', title: 'Objetivo', bullets: ['Identificar partes', 'Comprender función'] },
          { layout: 'image_text', title: 'Membrana', body: 'Barrera selectiva', imageQuery: 'membrana celular' },
          { layout: 'comparison', title: 'Tipos', left: { label: 'Procariota', points: ['Sin núcleo'] }, right: { label: 'Eucariota', points: ['Con núcleo'] } },
          { layout: 'quote', text: 'La célula es vida', author: 'Schleiden' },
          { layout: 'vocabulario', titulo: 'Palabras clave', terminos: [
            { palabra: 'Núcleo', definicion: 'Centro de la célula', imageQuery: 'núcleo celular' },
            { palabra: 'Membrana', definicion: 'Capa externa', imageQuery: 'membrana' },
          ]},
          { layout: 'ciclo_proceso', titulo: 'Pasos', pasos: [
            { nombre: 'Observar', descripcion: 'Mirar la célula', imageQuery: 'observar' },
            { nombre: 'Identificar', descripcion: 'Reconocer partes', imageQuery: 'identificar' },
            { nombre: 'Concluir', descripcion: 'Sacar conclusiones', imageQuery: 'concluir' },
          ]},
          { layout: 'quiz_opcion_multiple', pregunta: '¿Qué es la célula?', opciones: ['Unidad de vida', 'Un órgano', 'Un tejido', 'Un sistema'], respuestaCorrectaIndex: 0, explicacion: 'Es la unidad fundamental' },
          { layout: 'verdadero_falso', afirmacion: 'Toda célula tiene núcleo', esVerdadero: false, explicacion: 'Las procariotas no tienen núcleo' },
        ],
      }),
    };
    const ctx = makeContext({
      mockDB: seededDB,
      mockAi: estudianteAi,
      body: {
        level: '5° Básico',
        subject: 'Ciencias Naturales',
        objectiveCode: 'OA01',
        objectiveText: 'Identificar las partes de la célula',
        topic: 'La célula',
        audiencia: 'estudiante',
      },
    });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.pptDeck).toBeDefined();
    expect(json.pptDeck.slides.length).toBe(9);

    const layouts = json.pptDeck.slides.map((s: any) => s.layout);
    expect(layouts).toContain('title');
    expect(layouts).toContain('bullets');
    expect(layouts).toContain('image_text');
    expect(layouts).toContain('comparison');
    expect(layouts).toContain('quote');
    expect(layouts).toContain('vocabulario');
    expect(layouts).toContain('ciclo_proceso');
    expect(layouts).toContain('quiz_opcion_multiple');
    expect(layouts).toContain('verdadero_falso');

    expect(json.slides.length).toBe(11);
    expect(json.slides[0].type).toBe('cover');
  });

  it('quiz_opcion_multiple y verdadero_falso se dividen en pregunta (sin respuesta) y respuesta (marcada)', async () => {
    const quizAi = {
      run: async () => JSON.stringify({
        slides: [
          { layout: 'title', title: 'Quiz', subtitle: 'Test' },
          { layout: 'bullets', title: 'Repaso', bullets: ['Punto 1', 'Punto 2'] },
          { layout: 'image_text', title: 'Diagrama', body: 'Texto', imageQuery: 'diagrama' },
          { layout: 'quiz_opcion_multiple', pregunta: '¿Cuál es la capital?', opciones: ['París', 'Londres', 'Berlín', 'Madrid'], respuestaCorrectaIndex: 0, explicacion: 'Es la capital de Francia' },
          { layout: 'verdadero_falso', afirmacion: 'El agua hierve a 100°C', esVerdadero: true, explicacion: 'A nivel del mar' },
        ],
      }),
    };
    const ctx = makeContext({
      mockDB: seededDB,
      mockAi: quizAi,
      body: {
        level: '5° Básico',
        subject: 'Ciencias Naturales',
        objectiveCode: 'OA01',
        topic: 'Test',
        audiencia: 'estudiante',
      },
    });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    // 3 normal + 2 quiz + 2 VF = 7 legacy slides, 5 pptDeck slides
    expect(json.slides.length).toBe(7);
    expect(json.pptDeck.slides.length).toBe(5);

    // Quiz pregunta (slide 3): NINGUNA opción tiene ✓
    expect(json.slides[3].title).toBe('¿Cuál es la capital?');
    expect(json.slides[3].bullets.every((b: string) => !b.includes('✓'))).toBe(true);

    // Quiz respuesta (slide 4): la opción correcta tiene ✓
    expect(json.slides[4].title).toBe('¿Cuál es la capital?');
    expect(json.slides[4].bullets[0]).toMatch(/^✓/);
    expect(json.slides[4].bullets.slice(1).every((b: string) => !b.includes('✓'))).toBe(true);

    // VF pregunta (slide 5): solo dice "¿Verdadero o falso?"
    expect(json.slides[5].title).toBe('El agua hierve a 100°C');
    expect(json.slides[5].bullets).toEqual(['¿Verdadero o falso?']);

    // VF respuesta (slide 6): revela la respuesta
    expect(json.slides[6].title).toBe('El agua hierve a 100°C');
    expect(json.slides[6].bullets[0]).toBe('Verdadero');
  });
});
