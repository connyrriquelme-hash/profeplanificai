import { describe, it, expect, vi } from 'vitest';
import { generateDeckContent } from '../functions/core/PptContentEngine';
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
});
