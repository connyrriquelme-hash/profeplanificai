import { describe, it, expect, vi } from 'vitest';
import { generatePlanificacion, buildFallbackPlanificacion, type PlanificacionOptions } from '../functions/core/PlanificacionEngine';
import { PlanificacionSchema } from '../schemas/PlanificacionSchema';
import type { AIEngineEnv } from '../functions/core/types';

const MOCK_OPCIONES: PlanificacionOptions = {
  level: '5° Básico',
  subject: 'Ciencias Naturales',
  objectiveText: 'Investigar de manera guiada la transmisión del sonido a través de distintos medios.',
  topic: 'La propagación del sonido',
  methodology: 'Indagación científica',
  indicators: ['Explica cómo se propaga el sonido en distintos materiales.'],
};

const VALID_AI_RESPONSE = JSON.stringify({
  unit: 'El sonido y sus medios de propagación',
  classes: [
    {
      number: 1,
      objective: 'Reconocer que el sonido viaja distinto según el material que atraviesa.',
      opening: 'Pregunta disparadora sobre la propagación del sonido.',
      development: 'Exploración en grupos con materiales simples.',
      closure: 'Puesta en común de observaciones.',
      duration: '45 min',
      materials: ['Recipientes con agua', 'Reglas de madera'],
      assessment: 'Observación directa de la participación.',
    },
    {
      number: 2,
      objective: 'Registrar evidencia de cómo cambia la intensidad del sonido según el medio.',
      opening: 'Recapitulación de la clase anterior.',
      development: 'Registro sistemático de observaciones en tabla comparativa.',
      closure: 'Comparación de tablas entre grupos.',
      duration: '45 min',
      materials: ['Tabla de registro'],
      assessment: 'Revisión de la tabla de registro.',
    },
    {
      number: 3,
      objective: 'Comunicar conclusiones sobre la propagación del sonido en distintos medios.',
      opening: 'Repaso de hallazgos previos.',
      development: 'Elaboración de conclusión grupal y presentación breve.',
      closure: 'Cierre metacognitivo.',
      duration: '45 min',
      materials: ['Pauta de cotejo'],
      assessment: 'Evaluación formativa de la presentación final.',
    },
  ],
  methodology: 'Indagación científica',
  dua: ['Permitir registrar evidencia de forma escrita, oral o gráfica.'],
  evaluation: 'Evaluación formativa mediante observación directa y pauta de cotejo.',
});

function mockAI(responseText: string): AIEngineEnv {
  return { AI: { run: vi.fn().mockResolvedValue(responseText) } as unknown as Ai };
}

function mockAINoAI(): AIEngineEnv {
  return { AI: undefined as unknown as Ai };
}

describe('PlanificacionEngine.generatePlanificacion', () => {
  it('devuelve la planificación generada cuando la IA responde con JSON válido, usedFallback=false', async () => {
    const env = mockAI(VALID_AI_RESPONSE);
    const { planificacion, usedFallback } = await generatePlanificacion(env, 'system prompt de prueba', MOCK_OPCIONES);

    expect(usedFallback).toBe(false);
    expect(planificacion.unit).toBe('El sonido y sus medios de propagación');
    expect(planificacion.classes.length).toBe(3);
    expect(PlanificacionSchema.safeParse(planificacion).success).toBe(true);
  });

  it('activa el fallback cuando la IA no está configurada, nunca lanza excepción', async () => {
    const env = mockAINoAI();
    const { planificacion, usedFallback } = await generatePlanificacion(env, 'prompt', MOCK_OPCIONES);

    expect(usedFallback).toBe(true);
    expect(PlanificacionSchema.safeParse(planificacion).success).toBe(true);
  });

  it('activa el fallback cuando la IA responde JSON inválido, nunca lanza excepción', async () => {
    const env = mockAI('esto no es JSON en absoluto');
    const { planificacion, usedFallback } = await generatePlanificacion(env, 'prompt', MOCK_OPCIONES);

    expect(usedFallback).toBe(true);
    expect(PlanificacionSchema.safeParse(planificacion).success).toBe(true);
  });

  it('activa el fallback cuando la IA devuelve una planificación que viola el schema (menos de 3 clases)', async () => {
    const invalid = JSON.parse(VALID_AI_RESPONSE);
    invalid.classes = [invalid.classes[0]];
    const env = mockAI(JSON.stringify(invalid));

    const { planificacion, usedFallback } = await generatePlanificacion(env, 'prompt', MOCK_OPCIONES);

    expect(usedFallback).toBe(true);
    expect(PlanificacionSchema.safeParse(planificacion).success).toBe(true);
  });

  it('el fallback nunca lanza excepción aunque falten indicadores o tema', () => {
    const opciones: PlanificacionOptions = { level: '2° Medio', subject: 'Historia', objectiveText: 'OA de prueba' };
    const planificacion = buildFallbackPlanificacion(opciones);

    expect(PlanificacionSchema.safeParse(planificacion).success).toBe(true);
    expect(planificacion.classes.length).toBeGreaterThanOrEqual(3);
  });

  it('usa explícitamente el modelo llama-3.3-70b (mismo argumento que GuiaEngine/RubricaEngine)', async () => {
    const runSpy = vi.fn().mockResolvedValue(VALID_AI_RESPONSE);
    const env: AIEngineEnv = { AI: { run: runSpy } as unknown as Ai };

    await generatePlanificacion(env, 'system prompt de prueba', MOCK_OPCIONES);

    expect(runSpy).toHaveBeenCalledWith('@cf/meta/llama-3.3-70b-instruct-fp8-fast', expect.anything());
  });
});

describe('PlanificacionEngine.generatePlanificacion — enrich parcial', () => {
  const fallback = buildFallbackPlanificacion(MOCK_OPCIONES);

  function aiResponseWith(overrides: { openingIndex0?: string; developmentIndex0?: string; objectiveIndex1?: string }) {
    const parsed = JSON.parse(VALID_AI_RESPONSE);
    if (overrides.openingIndex0 !== undefined) parsed.classes[0].opening = overrides.openingIndex0;
    if (overrides.developmentIndex0 !== undefined) parsed.classes[0].development = overrides.developmentIndex0;
    if (overrides.objectiveIndex1 !== undefined) parsed.classes[1].objective = overrides.objectiveIndex1;
    return JSON.stringify(parsed);
  }

  it('reemplaza el inicio débil (<30 caracteres) con el del fallback determinista', async () => {
    const env = mockAI(aiResponseWith({ openingIndex0: 'Introducción al tema.' })); // 22 caracteres
    const { planificacion } = await generatePlanificacion(env, 'prompt', MOCK_OPCIONES);

    expect(planificacion.classes[0].opening).toBe(fallback.classes[0].opening);
  });

  it('reemplaza el desarrollo débil (<60 caracteres) con el del fallback determinista', async () => {
    const env = mockAI(aiResponseWith({ developmentIndex0: 'Actividad grupal breve.' })); // 24 caracteres
    const { planificacion } = await generatePlanificacion(env, 'prompt', MOCK_OPCIONES);

    expect(planificacion.classes[0].development).toBe(fallback.classes[0].development);
  });

  it('reemplaza el objetivo repetido (segunda ocurrencia) con el del fallback, dejando la primera intacta', async () => {
    const parsed = JSON.parse(VALID_AI_RESPONSE);
    const objetivoRepetido = parsed.classes[0].objective;
    const env = mockAI(aiResponseWith({ objectiveIndex1: objetivoRepetido }));
    const { planificacion } = await generatePlanificacion(env, 'prompt', MOCK_OPCIONES);

    expect(planificacion.classes[0].objective).toBe(objetivoRepetido);
    expect(planificacion.classes[1].objective).toBe(fallback.classes[1].objective);
    expect(planificacion.classes[1].objective).not.toBe(objetivoRepetido);
  });

  it('no toca campos fuertes: un inicio ya concreto y específico se mantiene tal cual lo devolvió la IA', async () => {
    const env = mockAI(VALID_AI_RESPONSE);
    const { planificacion } = await generatePlanificacion(env, 'prompt', MOCK_OPCIONES);

    const parsed = JSON.parse(VALID_AI_RESPONSE);
    expect(planificacion.classes[0].opening).toBe(parsed.classes[0].opening);
  });

  it('clases más allá de las 3 del fallback (4ª en adelante) no se enriquecen aunque tengan campos débiles', async () => {
    const parsed = JSON.parse(VALID_AI_RESPONSE);
    parsed.classes.push({
      number: 4,
      objective: 'Objetivo distinto para la cuarta clase.',
      opening: 'Corto.', // débil (<30 chars), pero no hay fallback.classes[3]
      development: 'Corto también.', // débil (<60 chars)
      closure: 'Cierre breve.',
      duration: '45 min',
      materials: ['Material X'],
      assessment: 'Evaluación X',
    });
    const env = mockAI(JSON.stringify(parsed));
    const { planificacion } = await generatePlanificacion(env, 'prompt', MOCK_OPCIONES);

    expect(planificacion.classes[3].opening).toBe('Corto.');
    expect(planificacion.classes[3].development).toBe('Corto también.');
  });
});
