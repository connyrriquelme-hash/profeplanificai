import { describe, it, expect, vi } from 'vitest';
import { generateDeckContent, buildSystemPrompt, inferRangoEtario } from '../functions/core/PptContentEngine';
import { PptDeckSchema } from '../schemas/PptDeckSchema';
import type { AIEngineEnv, PedagogicalPlan } from '../functions/core/types';

const MOCK_PLAN: PedagogicalPlan = {
  tema: 'La célula',
  curso: '5° Básico',
  asignatura: 'Ciencias Naturales',
  objetivo_aprendizaje: 'OA 1: Describir la estructura celular.',
  habilidades: 'Describir, identificar, comparar',
  taxonomia_bloom_sugerida: 'Comprender y Analizar',
  indicadores_seleccionados: [
    'Identifica las partes de la célula',
    'Compara célula vegetal y animal',
  ],
  criterios_seleccionados: [
    'Describe la estructura celular con vocabulario científico',
  ],
  estructura_clase: {
    inicio: { tiempo_minutos: 15, descripcion: 'Activar conocimientos previos sobre la célula.' },
    desarrollo: { tiempo_minutos: 60, descripcion: 'Explorar la estructura celular con imágenes y modelos.' },
    cierre: { tiempo_minutos: 15, descripcion: 'Sintetizar aprendizajes en un organizador gráfico.' },
  },
};

const VALID_AI_RESPONSE = JSON.stringify({
  slides: [
    { layout: 'title', title: 'La Célula', subtitle: '5° Básico — Ciencias Naturales' },
    { layout: 'bullets', title: 'Objetivo de Aprendizaje', bullets: ['Describir la estructura celular', 'Identificar orgánulos celulares'] },
    { layout: 'bullets', title: 'Inicio', bullets: ['Pregunta guía: ¿Qué es una célula?', 'Observar imágenes de células'] },
    { layout: 'bullets', title: 'Desarrollo', bullets: ['Modelar la célula con plastilina', 'Identificar partes en el microscopio'] },
    { layout: 'bullets', title: 'Cierre', bullets: ['Crear organizador gráfico', 'Compartir aprendizajes'] },
    { layout: 'bullets', title: 'Evaluación', bullets: ['Rúbrica de observación', 'Producto visual'] },
  ],
});

const EMPTY_BULLETS_RESPONSE = JSON.stringify({
  slides: [
    { layout: 'title', title: 'La Célula' },
    { layout: 'bullets', title: 'Contenido', bullets: [] },
    { layout: 'bullets', title: 'Más contenido', bullets: ['Un solo punto'] },
    { layout: 'bullets', title: 'Inicio', bullets: ['Paso 1'] },
    { layout: 'bullets', title: 'Desarrollo', bullets: ['Actividad'] },
    { layout: 'bullets', title: 'Cierre', bullets: ['Síntesis'] },
  ],
});

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

describe('PptDeckSchema', () => {
  it('should validate a complete deck with all slide types', () => {
    const input = {
      slides: [
        { layout: 'title', title: 'Portada', subtitle: 'Subtítulo' },
        { layout: 'bullets', title: 'Puntos', bullets: ['Punto 1', 'Punto 2'] },
        { layout: 'image_text', title: 'Imagen', body: 'Descripción', imageQuery: 'célula microscopio' },
        { layout: 'comparison', title: 'Comparar', left: { label: 'Izq', points: ['A'] }, right: { label: 'Der', points: ['B'] } },
        { layout: 'quote', text: 'Cita famous', author: 'Autor' },
      ],
    };
    const result = PptDeckSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject deck with fewer than 5 slides', () => {
    const input = {
      slides: [
        { layout: 'title', title: 'Portada' },
        { layout: 'bullets', title: 'Puntos', bullets: ['A', 'B'] },
      ],
    };
    const result = PptDeckSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject bullets slide with fewer than 2 bullets', () => {
    const slides = Array.from({ length: 5 }, (_, i) => {
      if (i === 0) return { layout: 'title', title: 'T' };
      if (i === 1) return { layout: 'bullets', title: 'B', bullets: ['solo uno'] };
      return { layout: 'bullets', title: `S${i}`, bullets: ['a', 'b'] };
    });
    const result = PptDeckSchema.safeParse({ slides });
    expect(result.success).toBe(false);
  });

  it('should reject slide with title exceeding 80 characters', () => {
    const slides = Array.from({ length: 5 }, (_, i) => {
      if (i === 0) return { layout: 'title', title: 'A'.repeat(81) };
      return { layout: 'bullets', title: `S${i}`, bullets: ['a', 'b'] };
    });
    const result = PptDeckSchema.safeParse({ slides });
    expect(result.success).toBe(false);
  });
});

describe('inferRangoEtario', () => {
  it('1°-2° Básico → 6-8 años', () => {
    expect(inferRangoEtario('1° Básico')).toContain('6-8 años');
    expect(inferRangoEtario('2° Básico')).toContain('6-8 años');
  });

  it('3°-6° Básico → 8-12 años', () => {
    expect(inferRangoEtario('3° Básico')).toContain('8-12 años');
    expect(inferRangoEtario('6° Básico')).toContain('8-12 años');
  });

  it('7°-8° Básico → 12-18 años', () => {
    expect(inferRangoEtario('7° Básico')).toContain('12-18 años');
    expect(inferRangoEtario('8° Básico')).toContain('12-18 años');
  });

  it('Educación Media → 12-18 años', () => {
    expect(inferRangoEtario('1° Medio')).toContain('12-18 años');
    expect(inferRangoEtario('4° Medio')).toContain('12-18 años');
  });

  it('Educación Parvularia → 3-5 años', () => {
    expect(inferRangoEtario('Kínder')).toContain('3-5 años');
    expect(inferRangoEtario('Sala Cuna')).toContain('3-5 años');
    expect(inferRangoEtario('Nivel Transición')).toContain('3-5 años');
  });

  it('curso vacío o irreconocible cae en un rango por defecto razonable', () => {
    expect(inferRangoEtario('')).toMatch(/años/);
    expect(inferRangoEtario('curso raro')).toMatch(/años/);
  });
});

describe('buildSystemPrompt', () => {
  it('incluye el tema y el objetivo de aprendizaje reales del plan', () => {
    const prompt = buildSystemPrompt(MOCK_PLAN);
    expect(prompt).toContain(MOCK_PLAN.tema);
    expect(prompt).toContain(MOCK_PLAN.objetivo_aprendizaje);
  });

  it('instruye explícitamente a no copiar el OA literal', () => {
    const prompt = buildSystemPrompt(MOCK_PLAN).toLowerCase();
    expect(prompt).toContain('nunca lo copies literalmente');
  });

  it('incluye el rango etario correspondiente al curso del plan', () => {
    const promptBasico = buildSystemPrompt({ ...MOCK_PLAN, curso: '1° Básico' });
    expect(promptBasico).toContain('6-8 años');

    const promptMedio = buildSystemPrompt({ ...MOCK_PLAN, curso: '3° Medio' });
    expect(promptMedio).toContain('12-18 años');
  });
});

describe('PptContentEngine.generateDeckContent', () => {
  it('should return parsed deck when AI responds with valid JSON', async () => {
    const env = mockAI(VALID_AI_RESPONSE);
    const result = await generateDeckContent(env, MOCK_PLAN);

    expect(result.slides.length).toBeGreaterThanOrEqual(5);
    expect(result.slides[0].layout).toBe('title');
    expect(result.slides.some((s) => s.layout === 'bullets')).toBe(true);
  });

  it('should activate fallback when AI returns invalid JSON', async () => {
    const env = mockAIParseError();
    const result = await generateDeckContent(env, MOCK_PLAN);

    expect(result.slides.length).toBeGreaterThanOrEqual(5);
    expect(result.slides[0].layout).toBe('title');
    const titles = result.slides.map((s) => {
      if (s.layout === 'title') return s.title;
      if (s.layout === 'bullets') return s.title;
      if (s.layout === 'image_text') return s.title;
      if (s.layout === 'comparison') return s.title;
      return '';
    });
    expect(titles.some((t) => t.includes('La célula'))).toBe(true);
  });

  it('should activate fallback when AI is not configured', async () => {
    const env = mockAINoAI();
    const result = await generateDeckContent(env, MOCK_PLAN);

    expect(result.slides.length).toBeGreaterThanOrEqual(5);
    expect(result.slides[0].layout).toBe('title');
  });

  it('should safeguard bullets when AI returns empty bullet arrays', async () => {
    const env = mockAI(EMPTY_BULLETS_RESPONSE);
    const result = await generateDeckContent(env, MOCK_PLAN);

    for (const slide of result.slides) {
      if (slide.layout === 'bullets') {
        expect(slide.bullets.length).toBeGreaterThanOrEqual(2);
        expect(slide.bullets.every((b) => b.trim().length > 0)).toBe(true);
      }
    }
  });

  it('should never return a deck with fewer than 5 slides', async () => {
    const env = mockAI(JSON.stringify({ slides: [{ layout: 'title', title: 'Solo una' }] }));
    const result = await generateDeckContent(env, MOCK_PLAN);

    expect(result.slides.length).toBeGreaterThanOrEqual(5);
  });

  it('should never return slides with empty arrays where schema requires minimums', async () => {
    const env = mockAI(VALID_AI_RESPONSE);
    const result = await generateDeckContent(env, MOCK_PLAN);

    for (const slide of result.slides) {
      if (slide.layout === 'bullets') {
        expect(slide.bullets.length).toBeGreaterThanOrEqual(2);
      }
      if (slide.layout === 'comparison') {
        expect(slide.left.points.length).toBeGreaterThanOrEqual(1);
        expect(slide.right.points.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('should include OA and indicators in fallback bullets', async () => {
    const env = mockAINoAI();
    const result = await generateDeckContent(env, MOCK_PLAN);

    const allText = result.slides
      .filter((s) => s.layout === 'bullets')
      .flatMap((s) => s.bullets)
      .join(' ')
      .toLowerCase();

    expect(allText).toContain('oa 1');
    expect(allText).toContain('célula');
  });

  it('should respect maxSlides option', async () => {
    const env = mockAI(VALID_AI_RESPONSE);
    const result = await generateDeckContent(env, MOCK_PLAN, { maxSlides: 3 });

    expect(result.slides.length).toBeLessThanOrEqual(3);
  });

  it('should validate final output against PptDeckSchema', async () => {
    const env = mockAI(VALID_AI_RESPONSE);
    const result = await generateDeckContent(env, MOCK_PLAN);

    const validation = PptDeckSchema.safeParse(result);
    expect(validation.success).toBe(true);
  });

  it('should validate fallback output against PptDeckSchema', async () => {
    const env = mockAIParseError();
    const result = await generateDeckContent(env, MOCK_PLAN);

    const validation = PptDeckSchema.safeParse(result);
    expect(validation.success).toBe(true);
  });

  it('should truncate a long real-world OA text instead of overflowing title/subtitle/bullets', async () => {
    const longPlan: PedagogicalPlan = {
      ...MOCK_PLAN,
      objetivo_aprendizaje: 'Identificar las regiones naturales de Chile y describir sus características geográficas, climáticas y de vegetación, relacionándolas con las actividades económicas de la población que las habita.',
      asignatura: 'Historia, Geografía y Ciencias Sociales',
    };
    const env = mockAINoAI();
    const result = await generateDeckContent(env, longPlan);

    const validation = PptDeckSchema.safeParse(result);
    expect(validation.success).toBe(true);

    const titleSlide = result.slides[0];
    expect(titleSlide.layout).toBe('title');
    if (titleSlide.layout === 'title') {
      expect(titleSlide.title.length).toBeLessThanOrEqual(80);
      expect(titleSlide.subtitle?.length ?? 0).toBeLessThanOrEqual(120);
    }
  });

  it('should send age-appropriate instructions to the AI based on the plan\'s curso', async () => {
    const env = mockAI(VALID_AI_RESPONSE);
    const plan1Basico: PedagogicalPlan = { ...MOCK_PLAN, curso: '1° Básico' };

    await generateDeckContent(env, plan1Basico);

    const runMock = env.AI!.run as unknown as ReturnType<typeof vi.fn>;
    expect(runMock).toHaveBeenCalledTimes(1);
    const [, callArgs] = runMock.mock.calls[0] as [string, { messages: Array<{ role: string; content: string }> }];
    const systemMessage = callArgs.messages.find((m) => m.role === 'system');

    expect(systemMessage?.content).toContain('6-8 años');
    expect(systemMessage?.content).toContain(plan1Basico.objetivo_aprendizaje);
    expect(systemMessage?.content.toLowerCase()).toContain('nunca lo copies literalmente');
  });

  it('should simplify long formal OA text in the fallback instead of copying it verbatim', async () => {
    const longOA = 'Describir los modos de vida de algunos pueblos originarios de Chile en el periodo precolombino, incluyendo ubicación geográfica, medio natural en que habitaban, vida nómada o sedentaria, roles de hombres y mujeres, herramientas y tecnología, principales actividades, vivienda, costumbres, idioma, creencias, alimentación y fiestas, entre otros.';
    const plan: PedagogicalPlan = {
      ...MOCK_PLAN,
      tema: 'Pueblos originarios de Chile',
      curso: '2° Básico',
      objetivo_aprendizaje: longOA,
      indicadores_seleccionados: [],
    };
    const env = mockAINoAI();
    const result = await generateDeckContent(env, plan);

    const oaSlide = result.slides.find((s) => s.layout === 'bullets' && s.title === 'Objetivo de Aprendizaje');
    expect(oaSlide?.layout).toBe('bullets');
    if (oaSlide?.layout === 'bullets') {
      const oaBullet = oaSlide.bullets[0];
      expect(oaBullet).not.toBe(longOA);
      expect(oaBullet.toLowerCase()).not.toContain('incluyendo');
      expect(oaBullet.length).toBeLessThan(longOA.length);
    }
  });
});
