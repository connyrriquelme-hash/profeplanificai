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

const ART_FIRST_GRADE_PLAN: PedagogicalPlan = {
  tema: 'Preferencias frente a obras visuales',
  curso: '1° Básico',
  asignatura: 'Artes Visuales',
  objetivo_aprendizaje: 'AR01 OA 05: Expresar emociones e ideas en sus trabajos de arte a partir de la experimentación con diversos materiales y procedimientos.',
  habilidades: 'a',
  taxonomia_bloom_sugerida: 'Comprender y Crear',
  criterios_seleccionados: ['escribir'],
  estructura_clase: {
    inicio: { tiempo_minutos: 15, descripcion: 'Observar obras visuales breves.' },
    desarrollo: { tiempo_minutos: 60, descripcion: 'Crear y comentar preferencias.' },
    cierre: { tiempo_minutos: 15, descripcion: 'Compartir una idea.' },
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

  it('should replace invalid one-letter skills with suggested pedagogical skills', async () => {
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, ART_FIRST_GRADE_PLAN);

    expect(result.habilidades).toEqual([]);
    expect(result.habilidades_sugeridas?.join(' ').toLowerCase()).toContain('expresar preferencias');
    expect(result.habilidades_sugeridas).not.toContain('a');
  });

  it('should include learning barriers, DUA principles and inclusive formative assessment', async () => {
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, ART_FIRST_GRADE_PLAN);

    expect(result.barreras_posibles?.join(' ').toLowerCase()).toContain('vocabulario');
    expect(result.principios_dua?.representacion.length).toBeGreaterThan(0);
    expect(result.principios_dua?.accion_expresion.length).toBeGreaterThan(0);
    expect(result.principios_dua?.implicacion.length).toBeGreaterThan(0);
    expect(result.evaluacion_formativa_inclusiva?.evidencias.length).toBeGreaterThan(0);
  });

  it('should create distinct and specific support, standard and challenge levels for AR01 OA 05', async () => {
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, ART_FIRST_GRADE_PLAN);

    const apoyo = result.nivel_apoyo.join(' ');
    const estandar = result.nivel_estandar.join(' ');
    const desafio = result.nivel_desafio.join(' ');

    expect(apoyo).not.toBe(estandar);
    expect(estandar).not.toBe(desafio);
    expect(apoyo.toLowerCase()).toContain('pictogramas');
    expect(estandar.toLowerCase()).toContain('exploración central');
    expect(desafio.toLowerCase()).toContain('mini galería');
  });

  it('should never show single-letter skills like "a" in habilidades_sugeridas', async () => {
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, ART_FIRST_GRADE_PLAN);

    const allSkills = [...(result.habilidades || []), ...(result.habilidades_sugeridas || [])];
    for (const skill of allSkills) {
      expect(skill.trim().length).toBeGreaterThan(1);
      expect(skill.trim().toLowerCase()).not.toBe('a');
      expect(skill.trim().toLowerCase()).not.toBe('-');
    }
  });

  it('should replace dash "-" skill with suggested skills', async () => {
    const dashPlan: PedagogicalPlan = {
      ...ART_FIRST_GRADE_PLAN,
      habilidades: '-',
    };
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, dashPlan);

    expect(result.habilidades).toEqual([]);
    expect(result.habilidades_sugeridas?.length).toBeGreaterThan(0);
    expect(result.habilidades_sugeridas?.join(' ')).not.toContain('-');
  });

  it('should preserve valid skills and not add suggested ones', async () => {
    const validPlan: PedagogicalPlan = {
      ...ART_FIRST_GRADE_PLAN,
      habilidades: 'observar elementos visuales, expresar preferencias',
    };
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, validPlan);

    expect(result.habilidades.length).toBe(2);
    expect(result.habilidades).toContain('observar elementos visuales');
    expect(result.habilidades).toContain('expresar preferencias');
  });

  it('should include concrete learning barriers in Spanish, not generic phrases', async () => {
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, ART_FIRST_GRADE_PLAN);

    const barreras = result.barreras_posibles || [];
    expect(barreras.length).toBeGreaterThanOrEqual(5);

    const barrerasText = barreras.join(' ').toLowerCase();
    expect(barrerasText).toContain('vocabulario');
    expect(barrerasText).toContain('expresar');
    expect(barrerasText).toContain('escritura');
  });

  it('should include all three DUA principles with concrete strategies', async () => {
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, ART_FIRST_GRADE_PLAN);

    const representacion = result.principios_dua?.representacion || [];
    const accion = result.principios_dua?.accion_expresion || [];
    const implicacion = result.principios_dua?.implicacion || [];

    expect(representacion.length).toBeGreaterThanOrEqual(3);
    expect(accion.length).toBeGreaterThanOrEqual(3);
    expect(implicacion.length).toBeGreaterThanOrEqual(3);

    expect(representacion.join(' ').toLowerCase()).toContain('imágenes');
    expect(accion.join(' ').toLowerCase()).toContain('dibujando');
    expect(implicacion.join(' ').toLowerCase()).toContain('elección');
  });

  it('should include inclusive formative assessment with response options', async () => {
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, ART_FIRST_GRADE_PLAN);

    const eval_ = result.evaluacion_formativa_inclusiva;
    expect(eval_).toBeDefined();
    expect(eval_?.evidencias.length).toBeGreaterThanOrEqual(3);
    expect(eval_?.preguntas_retroalimentacion.length).toBeGreaterThanOrEqual(3);
    expect(eval_?.lista_cotejo.length).toBeGreaterThanOrEqual(3);
    expect(eval_?.opciones_respuesta.length).toBeGreaterThanOrEqual(4);
    expect(eval_?.opciones_respuesta).toContain('oral');
    expect(eval_?.opciones_respuesta).toContain('visual');
  });

  it('should generate subject-specific skills for Ciencias Naturales', async () => {
    const cienciasPlan: PedagogicalPlan = {
      tema: 'El ecosistema',
      curso: '4° Básico',
      asignatura: 'Ciencias Naturales',
      objetivo_aprendizaje: 'OA 1: Describir componentes de un ecosistema.',
      habilidades: '',
      taxonomia_bloom_sugerida: 'Comprender',
      estructura_clase: {
        inicio: { tiempo_minutos: 15, descripcion: 'Observar fotos.' },
        desarrollo: { tiempo_minutos: 60, descripcion: 'Explorar ecosistemas.' },
        cierre: { tiempo_minutos: 15, descripcion: 'Sintetizar.' },
      },
    };

    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, cienciasPlan);

    expect(result.habilidades.length).toBe(0);
    expect(result.habilidades_sugeridas?.length).toBeGreaterThan(0);
    const suggestedText = result.habilidades_sugeridas?.join(' ').toLowerCase() || '';
    expect(suggestedText).toContain('observar');
    expect(suggestedText).toContain('describir');
  });

  it('should generate subject-specific skills for Matemática', async () => {
    const mathPlan: PedagogicalPlan = {
      tema: 'Fracciones',
      curso: '3° Básico',
      asignatura: 'Matemática',
      objetivo_aprendizaje: 'OA 1: Representar fracciones.',
      habilidades: '',
      taxonomia_bloom_sugerida: 'Aplicar',
      estructura_clase: {
        inicio: { tiempo_minutos: 15, descripcion: 'Activar.' },
        desarrollo: { tiempo_minutos: 60, descripcion: 'Explorar.' },
        cierre: { tiempo_minutos: 15, descripcion: 'Cerrar.' },
      },
    };

    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, mathPlan);

    expect(result.habilidades_sugeridas?.join(' ').toLowerCase()).toContain('resolver');
  });

  it('should generate subject-specific criteria for Artes Visuales when criteria are generic', async () => {
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, ART_FIRST_GRADE_PLAN);

    expect(result.criterios_aprendizaje.length).toBeGreaterThanOrEqual(4);
    const criteriosText = result.criterios_aprendizaje.join(' ').toLowerCase();
    expect(criteriosText).toContain('preferencia');
    expect(criteriosText).toContain('elemento visual');
  });

  it('should generate level-specific support for first grade with pictogramas and tarjetas', async () => {
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, ART_FIRST_GRADE_PLAN);

    const apoyoText = result.nivel_apoyo.join(' ').toLowerCase();
    expect(apoyoText).toContain('modelaje');
    expect(apoyoText).toContain('pictogramas');
    expect(apoyoText).toContain('tarjetas');
    expect(apoyoText).toContain('frase iniciadora');
  });

  it('should include adecuaciones for TEA, TDAH, and reading difficulties', async () => {
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, ART_FIRST_GRADE_PLAN);

    const adecuaciones = result.adecuaciones_apoyos || [];
    expect(adecuaciones.length).toBeGreaterThanOrEqual(5);

    const adecuacionesText = adecuaciones.join(' ').toLowerCase();
    expect(adecuacionesText).toContain('tea');
    expect(adecuacionesText).toContain('tdah');
    expect(adecuacionesText).toContain('lecto');
  });

  it('should include cierre_inclusivo with specific sentence starters', async () => {
    const env = mockAINoAI();
    const result = await AIEngine.generateDuaGuide(env, ART_FIRST_GRADE_PLAN);

    const cierre = result.cierre_inclusivo || [];
    expect(cierre.length).toBeGreaterThanOrEqual(3);

    const cierreText = cierre.join(' ');
    expect(cierreText).toContain('descubrí');
    expect(cierreText).toContain('favorito');
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
