import { describe, it, expect } from 'vitest';
import { onRequestPost } from '../functions/api/materials/rubric';
import { buildPremiumRubric, buildCurricularFrameworkBlock, type RubricaCurricularContext, type RubricaContextInput } from '../functions/core/RubricaEngine';
import { createMockD1 } from './helpers/mockD1';

const defaultBody = {
  level: '5° Básico',
  subject: 'Ciencias Naturales',
  objectiveCode: 'OA01',
  objectiveText: 'Observar y describir las partes principales de la célula.',
  topic: 'La célula',
};

function makeSeededDB(opts: { withIndicators?: boolean } = {}) {
  const withIndicators = opts.withIndicators !== false;
  return createMockD1({
    objectives: [{
      code: 'OA01',
      official_text: 'Observar y describir las partes principales de la célula usando el microscopio.',
      course_name: '5° Básico',
      subject_name: 'Ciencias Naturales',
    }],
    curriculum_indicators: withIndicators ? [
      { oa_code: 'OA01', indicator_text: 'Identifican las partes de la célula usando el microscopio.' },
      { oa_code: 'OA01', indicator_text: 'Describen la función de al menos dos organelos celulares.' },
    ] : [],
    objective_skills: [
      { code: 'OA01', official_text: 'Observar y registrar evidencias de forma sistemática.' },
    ],
    objective_attitudes: [
      { code: 'OA01', official_text: 'Demostrar curiosidad e interés por conocer seres vivos.' },
    ],
  });
}

function makeContext(overrides: {
  body?: Record<string, unknown>;
  mockDB?: ReturnType<typeof createMockD1>;
  mockAi?: { run: (...args: unknown[]) => unknown };
  withAi?: boolean;
}) {
  const mockDB = overrides.mockDB ?? makeSeededDB();
  const body = overrides.body ?? defaultBody;
  // IMAGE_PROVIDER_ORDER: 'svg' evita que generateEducationalImage() intente
  // llamadas de red reales (wikimedia/pollinations/huggingface) durante el test.
  const env: Record<string, unknown> = { DB: mockDB, IMAGE_PROVIDER_ORDER: 'svg' };
  if (overrides.withAi !== false) {
    env.AI = overrides.mockAi ?? makeValidAi();
  }

  return {
    request: new Request('http://localhost/api/materials/rubric', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    env,
  } as any;
}

function validAiPayload(extraCriterion?: Record<string, unknown>) {
  const criteria: unknown[] = [
    {
      id: 'c1', name: 'Identificación de organelos celulares',
      description: 'Reconoce y nombra los organelos principales de la célula observada.', weight: 30,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Nombra correctamente los seis organelos observados en el microscopio y explica su ubicación relativa', evidence: 'Dibujo etiquetado con seis organelos correctos', feedbackSuggestion: 'Lograste identificar todos los organelos con precisión.' },
        { levelId: 'adecuado', descriptor: 'Nombra correctamente cuatro de los seis organelos observados en el microscopio', evidence: 'Dibujo etiquetado con cuatro organelos correctos', feedbackSuggestion: 'Identificaste varios organelos correctamente, revisa los que faltan.' },
        { levelId: 'en_desarrollo', descriptor: 'Nombra solo dos organelos observados y confunde su ubicación en el dibujo', evidence: 'Dibujo con dos organelos identificados', feedbackSuggestion: 'Vamos a repasar juntos dónde está cada organelo.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo directo del docente para señalar cualquier organelo en el dibujo', evidence: 'Señalamiento guiado por el docente', feedbackSuggestion: 'Observemos juntos la imagen paso a paso.' },
      ],
    },
    {
      id: 'c2', name: 'Explicación de la función celular',
      description: 'Explica la función de al menos dos organelos en el funcionamiento de la célula.', weight: 30,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Explica con vocabulario científico la función de cuatro organelos y su relación con la vida de la célula', evidence: 'Texto explicativo con cuatro funciones correctas', feedbackSuggestion: 'Tu explicación demuestra dominio del tema.' },
        { levelId: 'adecuado', descriptor: 'Explica correctamente la función de dos organelos usando vocabulario adecuado', evidence: 'Texto explicativo con dos funciones correctas', feedbackSuggestion: 'Explicaste bien dos funciones, intenta agregar más.' },
        { levelId: 'en_desarrollo', descriptor: 'Menciona una función de un organelo con apoyo de preguntas guía', evidence: 'Respuesta oral guiada sobre una función', feedbackSuggestion: 'Vamos a pensar juntos para qué sirve este organelo.' },
        { levelId: 'inicial', descriptor: 'Requiere que el docente le indique directamente la función de cada organelo', evidence: 'Explicación con apoyo constante del docente', feedbackSuggestion: 'Te voy a explicar esta parte y luego la repetimos juntos.' },
      ],
    },
  ];
  if (extraCriterion) criteria.push(extraCriterion);

  return {
    learningGoal: 'Que los estudiantes reconozcan las partes principales de la célula y expliquen su función en el organismo.',
    studentFriendlyGoal: 'Vamos a aprender las partes de la célula y para qué sirve cada una.',
    criteria,
    usageInstructions: [
      'Observa la muestra de célula al microscopio junto a los estudiantes.',
      'Pide que dibujen y etiqueten los organelos que reconozcan.',
      'Evalúa cada criterio comparando el dibujo con los descriptores de la rúbrica.',
    ],
    inclusiveAdjustments: [
      'Ofrecer una lámina impresa de la célula para estudiantes con dificultad visual en el microscopio.',
      'Permitir respuestas orales en vez de escritas para estudiantes con dificultades de escritura.',
      'Extender el tiempo de observación para estudiantes que lo requieran.',
    ],
    studentSelfAssessment: {
      title: 'Mi autoevaluación sobre la célula',
      prompts: [
        'Los organelos que logré identificar fueron...',
        'La función que mejor entendí fue...',
        'Lo que necesito repasar es...',
      ],
    },
  };
}

function makeValidAi() {
  return { run: async () => JSON.stringify(validAiPayload()) };
}

function makeCountingAi(responder: (call: number) => string) {
  let calls = 0;
  const run = async () => {
    calls += 1;
    return responder(calls);
  };
  return { get calls() { return calls; }, run };
}

describe('POST /api/materials/rubric', () => {
  it('usa el contenido de la IA cuando responde válido contra el schema', async () => {
    const ctx = makeContext({});
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.rubric.criteria.map((c: any) => c.name)).toEqual([
      'Identificación de organelos celulares',
      'Explicación de la función celular',
    ]);
    expect(json.rubric.levels.map((l: any) => l.id)).toEqual(['avanzado', 'adecuado', 'en_desarrollo', 'inicial']);
    expect(json.rubric.totalScore).toBe(json.rubric.criteria.length * 4);
  });

  it('cae al fallback determinista si la IA nunca devuelve JSON válido', async () => {
    const ai = makeCountingAi(() => 'esto no es json');
    const ctx = makeContext({ mockAi: ai });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(ai.calls).toBe(3);

    const expectedFallback = buildPremiumRubric({
      level: '5° Básico', subject: 'Ciencias Naturales', objectiveCode: 'OA01',
      objectiveText: defaultBody.objectiveText, topic: defaultBody.topic,
      indicators: ['Identifican las partes de la célula usando el microscopio.', 'Describen la función de al menos dos organelos celulares.'],
      skills: [],
    });
    expect(json.rubric.criteria).toEqual(expectedFallback.criteria);
  });

  it('usa el fallback directo sin invocar AI.run cuando env.AI no está configurado', async () => {
    const ai = makeCountingAi(() => JSON.stringify(validAiPayload()));
    const ctx = makeContext({ withAi: false, mockAi: ai });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(ai.calls).toBe(0);
    expect(json.rubric.criteria[0].name).not.toBe('Identificación de organelos celulares');
  });

  it('genera una rúbrica válida aunque el OA no tenga indicadores oficiales cargados', async () => {
    const ctx = makeContext({ mockDB: makeSeededDB({ withIndicators: false }) });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(json.rubric.criteria.length).toBeGreaterThanOrEqual(2);
    for (const criterion of json.rubric.criteria) {
      expect(criterion.indicators).toHaveLength(4);
    }
  });

  it('buildCurricularFrameworkBlock documenta honestamente la ausencia de indicadores oficiales', () => {
    const ctx: RubricaCurricularContext = {
      officialObjectiveText: 'Observar y describir las partes principales de la célula.',
      officialIndicators: [],
      hasOfficialIndicators: false,
      skills: ['Observar y registrar evidencias de forma sistemática.'],
      attitudes: ['Demostrar curiosidad e interés por conocer seres vivos.'],
    };
    const input: RubricaContextInput = {
      level: '5° Básico', subject: 'Ciencias Naturales', objectiveCode: 'OA01',
      objectiveText: 'Observar y describir las partes principales de la célula.', topic: 'La célula',
      clientIndicators: [], clientSkills: [],
    };
    const block = buildCurricularFrameworkBlock(ctx, input);

    expect(block).toContain('No existen indicadores de evaluación oficiales MINEDUC catalogados');
    expect(block).not.toContain('INDICADORES DE EVALUACIÓN OFICIALES MINEDUC');
    expect(block).toContain('NO inventes que citas un indicador oficial que no existe');
  });

  it('cae al fallback si la IA insiste en un levelId fuera del enum permitido', async () => {
    const invalidPayload = validAiPayload();
    (invalidPayload.criteria[0] as any).indicators[0].levelId = 'excelente';
    const ai = makeCountingAi(() => JSON.stringify(invalidPayload));
    const ctx = makeContext({ mockAi: ai });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    expect(ai.calls).toBe(3);
    const expectedFallback = buildPremiumRubric({
      level: '5° Básico', subject: 'Ciencias Naturales', objectiveCode: 'OA01',
      objectiveText: defaultBody.objectiveText, topic: defaultBody.topic,
      indicators: ['Identifican las partes de la célula usando el microscopio.', 'Describen la función de al menos dos organelos celulares.'],
      skills: [],
    });
    expect(json.rubric.criteria).toEqual(expectedFallback.criteria);
  });

  it('descarta solo el criterio con descriptores duplicados y conserva el resto de la respuesta de la IA', async () => {
    const weakCriterion = {
      id: 'c3', name: 'Criterio con descriptor duplicado',
      description: 'Este criterio tiene descriptores repetidos entre niveles para probar el filtro de calidad.', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Este descriptor se repite exactamente igual en dos niveles distintos de este criterio', evidence: 'evidencia avanzada de prueba', feedbackSuggestion: 'sugerencia avanzada de prueba' },
        { levelId: 'adecuado', descriptor: 'Este descriptor se repite exactamente igual en dos niveles distintos de este criterio', evidence: 'evidencia adecuada de prueba', feedbackSuggestion: 'sugerencia adecuada de prueba' },
        { levelId: 'en_desarrollo', descriptor: 'Descriptor distinto para nivel en desarrollo con longitud suficiente para pasar validacion', evidence: 'evidencia en desarrollo de prueba', feedbackSuggestion: 'sugerencia en desarrollo de prueba' },
        { levelId: 'inicial', descriptor: 'Descriptor distinto para nivel inicial con longitud suficiente para pasar validacion tambien', evidence: 'evidencia inicial de prueba', feedbackSuggestion: 'sugerencia inicial de prueba' },
      ],
    };
    const ai = { run: async () => JSON.stringify(validAiPayload(weakCriterion)) };
    const ctx = makeContext({ mockAi: ai });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    const names = json.rubric.criteria.map((c: any) => c.name);
    expect(names).toContain('Identificación de organelos celulares');
    expect(names).toContain('Explicación de la función celular');
    expect(names).not.toContain('Criterio con descriptor duplicado');
  });

  it('descarta solo el criterio cuyo descriptor describe un "sentimiento" en vez del acto observable de expresarlo', async () => {
    const feelingCriterion = {
      id: 'c3', name: 'Opinión sobre la célula',
      description: 'Formula una opinión sobre lo aprendido de la célula.', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Explica con detalle su opinión fundamentada sobre lo más interesante de la célula observada', evidence: 'Texto con opinión fundamentada', feedbackSuggestion: 'Tu opinión está bien argumentada.' },
        { levelId: 'adecuado', descriptor: 'Señala una opinión sobre algún aspecto de la célula, aunque sin fundamentar del todo', evidence: 'Comentario oral con una razón', feedbackSuggestion: 'Intenta fundamentar más tu opinión.' },
        { levelId: 'en_desarrollo', descriptor: 'Menciona una posible opinión sobre la célula, aunque no queda del todo clara', evidence: 'Comentario oral breve', feedbackSuggestion: 'Vamos a pensar juntos en una opinión clara.' },
        { levelId: 'inicial', descriptor: 'Comienza a expresar una preferencia o sentimiento básico hacia el tema, aunque no lo explica', evidence: 'Gesto de agrado o desagrado', feedbackSuggestion: 'Sigamos explorando tus impresiones sobre el tema.' },
      ],
    };
    const ai = { run: async () => JSON.stringify(validAiPayload(feelingCriterion)) };
    const ctx = makeContext({ mockAi: ai });
    const res = await onRequestPost(ctx);
    const json = await res.json() as any;

    expect(res.status).toBe(200);
    const names = json.rubric.criteria.map((c: any) => c.name);
    expect(names).toContain('Identificación de organelos celulares');
    expect(names).toContain('Explicación de la función celular');
    expect(names).not.toContain('Opinión sobre la célula');
  });
});
