import { describe, it, expect, vi } from 'vitest';
import { AIEngine, extractJsonFromText } from '../functions/core/AIEngine';
import type { AIEngineEnv, PedagogicalPlan } from '../functions/core/types';

const MOCK_PLAN: PedagogicalPlan = {
  tema: 'La célula',
  curso: '5° Básico',
  asignatura: 'Ciencias Naturales',
  objetivo_aprendizaje: 'OA 1: Describir la estructura celular.',
  habilidades: 'Describir, identificar, comparar',
  taxonomia_bloom_sugerida: 'Comprender y Analizar',
  estructura_clase: {
    inicio: { tiempo_minutos: 15, descripcion: 'Activar conocimientos previos.' },
    desarrollo: { tiempo_minutos: 60, descripcion: 'Explorar la célula.' },
    cierre: { tiempo_minutos: 15, descripcion: 'Sintetizar aprendizajes.' },
  },
};

function mockAI(responseText: string): AIEngineEnv {
  return {
    AI: {
      run: vi.fn().mockResolvedValue(responseText),
    } as unknown as Ai,
  };
}

function mockAIParseError(): AIEngineEnv {
  return {
    AI: {
      run: vi.fn().mockResolvedValue('This is not JSON at all, just random text.'),
    } as unknown as Ai,
  };
}

function mockAINoAI(): AIEngineEnv {
  return {
    AI: undefined as unknown as Ai,
  };
}

describe('extractJsonFromText', () => {
  it('should extract JSON from plain text', () => {
    const result = extractJsonFromText('Here is the result: {"foo":"bar"} done.');
    expect(result).toBe('{"foo":"bar"}');
  });

  it('should extract JSON from markdown code block', () => {
    const result = extractJsonFromText('```json\n{"foo":"bar"}\n```');
    expect(result).toBe('{"foo":"bar"}');
  });

  it('should handle empty input', () => {
    expect(extractJsonFromText('')).toBe('');
    expect(extractJsonFromText(null as unknown as string)).toBe('');
  });

  it('should handle nested JSON', () => {
    const result = extractJsonFromText('prefix {"a":{"b":1}} suffix');
    expect(result).toBe('{"a":{"b":1}}');
  });
});

describe('AIEngine.generateDuaGuide', () => {
  it('should return parsed DuaGuide when AI responds with valid JSON', async () => {
    const aiResponse = JSON.stringify({
      titulo_guia: 'Guía La Célula',
      contexto_motivacional: 'La célula es la unidad básica de la vida.',
      nivel_apoyo: ['Fichas con vocabulario'],
      nivel_estandar: ['Explicación guiada'],
      nivel_desafio: ['Análisis crítico'],
    });

    const env = mockAI(aiResponse);
    const result = await AIEngine.generateDuaGuide(env, MOCK_PLAN);

    expect(result.titulo_guia).toBe('Guía La Célula');
    expect(result.nivel_apoyo).toEqual(['Fichas con vocabulario']);
    expect(result.nivel_estandar).toEqual(['Explicación guiada']);
    expect(result.nivel_desafio).toEqual(['Análisis crítico']);
  });

  it('should return fallback when AI returns invalid JSON', async () => {
    const env = mockAIParseError();
    const result = await AIEngine.generateDuaGuide(env, MOCK_PLAN);

    expect(result.titulo_guia).toContain('La célula');
    expect(result.nivel_apoyo.length).toBeGreaterThan(0);
  });

  it('should return fallback when AI is not configured', async () => {
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, MOCK_PLAN);

    expect(result.titulo_guia).toContain('La célula');
  });
});

describe('AIEngine.generateLessonContent', () => {
  it('should return parsed LessonContent when AI responds with valid JSON', async () => {
    const aiResponse = JSON.stringify({
      titulo: 'La Célula',
      curso: '5° Básico',
      asignatura: 'Ciencias Naturales',
      objetivoAprendizaje: 'OA 1: Describir la estructura celular.',
      habilidadBloom: 'Comprender',
      inicio: 'Presentar un video corto.',
      desarrollo: 'Observar al microscopio.',
      cierre: 'Exposición grupal.',
      recursos: ['Microscopio', 'Video'],
      evaluacionFormativa: 'Preguntas orales.',
      adecuacionesDUA: 'Ofrecer representaciones visuales y auditivas.',
    });

    const env = mockAI(aiResponse);
    const result = await AIEngine.generateLessonContent(env, MOCK_PLAN);

    expect(result.titulo).toBe('La Célula');
    expect(result.recursos).toEqual(['Microscopio', 'Video']);
    expect(result.inicio).toBe('Presentar un video corto.');
  });

  it('should return fallback when AI returns invalid JSON', async () => {
    const env = mockAIParseError();
    const result = await AIEngine.generateLessonContent(env, MOCK_PLAN);

    expect(result.titulo).toBe('La célula');
    expect(result.recursos.length).toBeGreaterThan(0);
  });
});
