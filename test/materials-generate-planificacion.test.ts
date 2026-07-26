import { describe, it, expect } from 'vitest';
import { onRequestPost } from '../functions/api/materials/generate';
import { createMockD1 } from './helpers/mockD1';

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    level: '5° Básico',
    subject: 'Ciencias Naturales',
    objectiveCode: 'CN05 OA 07',
    objectiveText: 'Investigar de manera guiada la transmisión del sonido a través de distintos medios (sólidos, líquidos y gases).',
    indicators: ['Explica cómo se propaga el sonido en distintos materiales.'],
    topic: 'La propagación del sonido',
    methodology: 'Indagación científica',
    ...overrides,
  };
}

function validAiPlanificacion() {
  return JSON.stringify({
    unit: 'El sonido y sus medios de propagación',
    classes: [
      {
        number: 1,
        objective: 'Reconocer que el sonido viaja distinto según el material que atraviesa.',
        opening: 'Se presenta una pregunta disparadora: ¿el sonido viaja igual en el aire que en el agua?',
        development: 'Los estudiantes exploran en grupos pequeños con materiales simples (agua, aire, madera).',
        closure: 'Puesta en común de las primeras observaciones.',
        duration: '45 min',
        materials: ['Recipientes con agua', 'Reglas de madera', 'Bolsas plásticas con aire'],
        assessment: 'Observación directa de la participación en la exploración inicial.',
      },
      {
        number: 2,
        objective: 'Registrar evidencia de cómo cambia la intensidad del sonido según el medio.',
        opening: 'Recapitulación de la clase anterior.',
        development: 'Registro sistemático de observaciones en una tabla comparativa por medio (sólido/líquido/gas).',
        closure: 'Los grupos comparten sus tablas y discuten diferencias.',
        duration: '45 min',
        materials: ['Tabla de registro', 'Cronómetro'],
        assessment: 'Revisión de la tabla de registro de cada grupo.',
      },
      {
        number: 3,
        objective: 'Comunicar conclusiones sobre la propagación del sonido en distintos medios.',
        opening: 'Repaso de los hallazgos de las clases anteriores.',
        development: 'Elaboración de una conclusión grupal con evidencia recolectada y presentación breve al curso.',
        closure: 'Cierre metacognitivo sobre lo aprendido y su relación con la vida cotidiana.',
        duration: '45 min',
        materials: ['Material de presentación', 'Pauta de cotejo'],
        assessment: 'Evaluación formativa de la presentación final mediante pauta de cotejo.',
      },
    ],
    methodology: 'Indagación científica',
    dua: [
      'Permitir registrar evidencia de forma escrita, oral o gráfica.',
      'Ofrecer roles distintos dentro del grupo según las fortalezas de cada estudiante.',
    ],
    evaluation: 'Evaluación formativa mediante observación directa y pauta de cotejo en la presentación final.',
  });
}

async function makeContext(options: {
  type?: string;
  body?: Record<string, unknown>;
  ai?: Ai;
  mockDB?: ReturnType<typeof createMockD1>;
}) {
  const mockDB = options.mockDB ?? createMockD1({});
  const type = options.type ?? 'planificacion';

  return {
    request: new Request(`http://localhost/api/materials/generate?type=${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options.body ?? validBody()),
    }),
    env: { DB: mockDB, AI: options.ai },
  } as any;
}

describe('POST /api/materials/generate?type=planificacion', () => {
  it('genera la planificación con IA real (mock) → 200 + planificación válida, usedFallback=false', async () => {
    const ai = { run: async () => validAiPlanificacion() } as unknown as Ai;
    const ctx = await makeContext({ ai });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.usedFallback).toBe(false);
    expect(json.planificacion.unit).toBe('El sonido y sus medios de propagación');
    expect(json.planificacion.classes.length).toBe(3);
    expect(json.prompt).toBeUndefined();
    expect(json.resourceId).toMatch(/^res_/);
  });

  it('IA no configurada → nunca lanza excepción, cae al fallback (usedFallback=true) y sigue devolviendo 200', async () => {
    const ctx = await makeContext({ ai: undefined });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.usedFallback).toBe(true);
    expect(json.planificacion.classes.length).toBeGreaterThanOrEqual(3);
    expect(json.planificacion.unit).toBeTruthy();
  });

  it('IA devuelve JSON inválido → nunca lanza excepción, cae al fallback y sigue devolviendo 200', async () => {
    const ai = { run: async () => 'esto no es JSON en absoluto' } as unknown as Ai;
    const ctx = await makeContext({ ai });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.usedFallback).toBe(true);
    expect(json.planificacion.classes.length).toBeGreaterThanOrEqual(3);
  });

  it('IA devuelve una planificación que viola el schema (ej. 1 sola clase) → cae al fallback', async () => {
    const invalid = JSON.parse(validAiPlanificacion());
    invalid.classes = [invalid.classes[0]];
    const ai = { run: async () => JSON.stringify(invalid) } as unknown as Ai;
    const ctx = await makeContext({ ai });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.usedFallback).toBe(true);
    expect(json.planificacion.classes.length).toBeGreaterThanOrEqual(3);
  });

  it('REGRESIÓN: content_json en generated_resources nunca queda como {status:"generating"} tras un POST exitoso', async () => {
    const mockDB = createMockD1({});
    const ai = { run: async () => validAiPlanificacion() } as unknown as Ai;
    const ctx = await makeContext({ ai, mockDB });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;
    expect(res.status).toBe(200);

    const { results } = await mockDB.prepare('SELECT * FROM generated_resources WHERE id = ?').bind(json.resourceId).all<any>();
    expect(results.length).toBe(1);
    expect(results[0].content_json).not.toBe(JSON.stringify({ status: 'generating' }));
    expect(JSON.parse(results[0].content_json as string).unit).toBe(json.planificacion.unit);
  });

  it('REGRESIÓN: content_json tampoco queda como placeholder cuando la IA falla y se usa el fallback', async () => {
    const mockDB = createMockD1({});
    const ctx = await makeContext({ ai: undefined, mockDB });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;
    expect(res.status).toBe(200);

    const { results } = await mockDB.prepare('SELECT * FROM generated_resources WHERE id = ?').bind(json.resourceId).all<any>();
    expect(results.length).toBe(1);
    expect(results[0].content_json).not.toBe(JSON.stringify({ status: 'generating' }));
  });

  it('otros tipos (ej. guia_estudiante) mantienen el comportamiento anterior sin cambios', async () => {
    const ai = { run: async () => validAiPlanificacion() } as unknown as Ai;
    const ctx = await makeContext({ type: 'guia_estudiante', ai });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(typeof json.prompt).toBe('string');
    expect(json.prompt).toContain('Genera una guía de estudiante');
    expect(json.planificacion).toBeUndefined();
  });

  it('level, subject u objectiveCode faltantes → 400', async () => {
    const ctx = await makeContext({ body: { ...validBody(), level: '' } });
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(400);
  });
});
