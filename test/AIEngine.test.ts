import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { AIEngine, AIValidationError, callAIConValidacion, extractJsonFromText, resolveAIResponseText } from '../functions/core/AIEngine';
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

describe('resolveAIResponseText', () => {
  // Hallazgo real de esta sesión: contra el mismo binding y el mismo
  // modelo (@cf/meta/llama-3.2-3b-instruct), env.AI.run() resolvió, en
  // llamadas consecutivas al servidor real, unas veces a un string plano
  // y otras a { response: "<texto>" } — de forma NO determinista, no
  // según el archivo/prompt que llamaba. Un fix probado solo contra
  // strings planos (la única forma que mockeaban los tests originales de
  // los 3 engines) dejó pasar el bug de doble-serialización sin ser
  // detectado. Estos tests cubren ambas formas y ambos órdenes.

  it('debe devolver el string sin cambios cuando la respuesta ya es un string plano', () => {
    const plano = '{"titulo":"Clase de prueba"}';
    expect(resolveAIResponseText(plano)).toBe(plano);
  });

  it('debe extraer .response sin re-stringify-arlo cuando la respuesta es { response: string } (forma real de Cloudflare Workers AI)', () => {
    const textoOriginal = '{"titulo":"Clase de prueba","bullets":["uno","dos"]}';
    const resultado = resolveAIResponseText({ response: textoOriginal });

    expect(resultado).toBe(textoOriginal);
    // La firma exacta del bug: JSON.stringify de un string ya formado
    // antepone una comilla al resultado y escapa las comillas internas.
    expect(resultado.startsWith('"')).toBe(false);
    expect(resultado).not.toContain('\\"');
  });

  it('debe manejar CUALQUIER ORDEN entre las dos formas para el mismo binding/modelo, sin arrastrar estado entre llamadas', () => {
    const stringPlano = '{"a":1}';
    const objetoConResponse = { response: '{"b":2}' };

    // string plano, luego objeto
    expect(resolveAIResponseText(stringPlano)).toBe(stringPlano);
    expect(resolveAIResponseText(objetoConResponse)).toBe('{"b":2}');

    // objeto, luego string plano (orden invertido)
    expect(resolveAIResponseText(objetoConResponse)).toBe('{"b":2}');
    expect(resolveAIResponseText(stringPlano)).toBe(stringPlano);
  });

  it('debe stringify-ar cuando .response no es un string (forma inesperada, no el caso normal)', () => {
    const resultado = resolveAIResponseText({ response: { anidado: true } });
    expect(resultado).toBe(JSON.stringify({ anidado: true }));
  });

  it('debe stringify-ar el objeto completo cuando no existe el campo .response', () => {
    const objetoSinResponse = { otraCosa: 'valor' };
    const resultado = resolveAIResponseText(objetoSinResponse);
    expect(resultado).toBe(JSON.stringify(objetoSinResponse));
  });

  it('debe convertir a String() cualquier otro tipo primitivo (null, number, etc.)', () => {
    expect(resolveAIResponseText(null)).toBe('null');
    expect(resolveAIResponseText(42)).toBe('42');
  });
});

describe('callAIConValidacion', () => {
  const SimpleSchema = z.object({ foo: z.string().min(3) });

  it('reintenta cuando la validación de schema falla, incluye los errores de Zod en el prompt del reintento, y resuelve usedFallback: false cuando el reintento finalmente tiene éxito', async () => {
    const run = vi.fn()
      .mockResolvedValueOnce(JSON.stringify({ foo: 'ab' })) // falla: min 3 caracteres
      .mockResolvedValueOnce(JSON.stringify({ foo: 'abcdef' })); // pasa

    const env: AIEngineEnv = { AI: { run } as unknown as Ai };

    const result = await callAIConValidacion(env, 'system prompt', 'user prompt original', SimpleSchema);

    expect(result.usedFallback).toBe(false);
    expect(result.intentos).toBe(2);
    expect(result.data).toEqual({ foo: 'abcdef' });
    expect(run).toHaveBeenCalledTimes(2);

    const [, segundoLlamado] = run.mock.calls[1] as [string, { messages: Array<{ role: string; content: string }> }];
    const segundoMensajeUsuario = segundoLlamado.messages.find((m) => m.role === 'user');

    // El prompt del reintento debe incluir el prompt original Y los
    // errores específicos de Zod del intento anterior (mismo mecanismo
    // que callWithSchemaValidation() en orchestrator.ts de main).
    expect(segundoMensajeUsuario?.content).toContain('user prompt original');
    expect(segundoMensajeUsuario?.content).toContain('REINTENTO');
    expect(segundoMensajeUsuario?.content).toContain('foo');
  });

  it('reintenta cuando la respuesta no es JSON válido, agregando instrucciones de formato en el reintento', async () => {
    const run = vi.fn()
      .mockResolvedValueOnce('esto no es JSON en absoluto')
      .mockResolvedValueOnce(JSON.stringify({ foo: 'valido' }));

    const env: AIEngineEnv = { AI: { run } as unknown as Ai };
    const result = await callAIConValidacion(env, '', 'user prompt', SimpleSchema);

    expect(result.usedFallback).toBe(false);
    expect(result.intentos).toBe(2);
    expect(result.data).toEqual({ foo: 'valido' });
    expect(run).toHaveBeenCalledTimes(2);

    const [, segundoLlamado] = run.mock.calls[1] as [string, { messages: Array<{ role: string; content: string }> }];
    expect(segundoLlamado.messages[0].content).toContain('JSON válido');
  });

  it('arroja AIValidationError tras agotar maxReintentos (3 intentos totales por defecto), sin construir ningún fallback propio', async () => {
    const run = vi.fn().mockResolvedValue(JSON.stringify({ foo: 'ab' })); // siempre falla min 3

    const env: AIEngineEnv = { AI: { run } as unknown as Ai };

    await expect(
      callAIConValidacion(env, '', 'user prompt', SimpleSchema),
    ).rejects.toThrow(AIValidationError);

    expect(run).toHaveBeenCalledTimes(3);
  });

  it('respeta un maxReintentos personalizado (0 = un solo intento, sin reintentos)', async () => {
    const run = vi.fn().mockResolvedValue(JSON.stringify({ foo: 'ab' }));
    const env: AIEngineEnv = { AI: { run } as unknown as Ai };

    await expect(
      callAIConValidacion(env, '', 'user prompt', SimpleSchema, { maxReintentos: 0 }),
    ).rejects.toThrow(AIValidationError);

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('no reintenta cuando el primer intento ya es válido', async () => {
    const run = vi.fn().mockResolvedValue(JSON.stringify({ foo: 'valido desde el inicio' }));
    const env: AIEngineEnv = { AI: { run } as unknown as Ai };

    const result = await callAIConValidacion(env, '', 'user prompt', SimpleSchema);

    expect(result.usedFallback).toBe(false);
    expect(result.intentos).toBe(1);
    expect(run).toHaveBeenCalledTimes(1);
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

  it('REGRESIÓN: debe parsear correctamente cuando env.AI.run() resuelve a { response: string }, la forma real de Cloudflare Workers AI (no solo un string plano)', async () => {
    const aiResponse = JSON.stringify({
      titulo_guia: 'Guía La Célula',
      contexto_motivacional: 'La célula es la unidad básica de la vida.',
      nivel_apoyo: ['Fichas con vocabulario'],
      nivel_estandar: ['Explicación guiada'],
      nivel_desafio: ['Análisis crítico'],
    });
    const env: AIEngineEnv = {
      AI: { run: vi.fn().mockResolvedValue({ response: aiResponse }) } as unknown as Ai,
    };

    const result = await AIEngine.generateDuaGuide(env, MOCK_PLAN);

    expect(result.titulo_guia).toBe('Guía La Célula');
    expect(result.nivel_apoyo).toEqual(['Fichas con vocabulario']);
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
