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

  it('7°-8° Básico → 12-14 años (separado de Media)', () => {
    expect(inferRangoEtario('7° Básico')).toContain('12-14 años');
    expect(inferRangoEtario('8° Básico')).toContain('12-14 años');
  });

  it('Educación Media → 14-18 años', () => {
    expect(inferRangoEtario('1° Medio')).toContain('14-18 años');
    expect(inferRangoEtario('4° Medio')).toContain('14-18 años');
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
    expect(promptMedio).toContain('14-18 años');
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

  it('REGRESIÓN: debe parsear correctamente cuando env.AI.run() resuelve a { response: string }, la forma real de Cloudflare Workers AI (no solo un string plano)', async () => {
    const env: AIEngineEnv = {
      AI: { run: vi.fn().mockResolvedValue({ response: VALID_AI_RESPONSE }) } as unknown as Ai,
    };
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

  it('should not corrupt an emoji straddling the truncation boundary', async () => {
    const emojiPlan: PedagogicalPlan = {
      ...MOCK_PLAN,
      tema: '🟢🟡🔴'.repeat(15) + ' Regiones naturales de Chile y sus características geográficas',
      asignatura: 'Historia, Geografía y Ciencias Sociales',
    };
    const env = mockAINoAI();
    const result = await generateDeckContent(env, emojiPlan);

    const titleSlide = result.slides[0];
    expect(titleSlide.layout).toBe('title');
    if (titleSlide.layout === 'title') {
      const roundTripped = new TextDecoder('utf-8').decode(new TextEncoder().encode(titleSlide.title));
      expect(roundTripped).toBe(titleSlide.title);
      expect(titleSlide.title).not.toContain('�');
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

  it('usa explícitamente el modelo llama-3.3-70b (mismo argumento que GuiaEngine/RubricaEngine/PlanificacionEngine)', async () => {
    const env = mockAI(VALID_AI_RESPONSE);
    await generateDeckContent(env, MOCK_PLAN);

    const runMock = env.AI!.run as unknown as ReturnType<typeof vi.fn>;
    expect(runMock).toHaveBeenCalledWith('@cf/meta/llama-3.3-70b-instruct-fp8-fast', expect.anything());
  });

  it('enrich: reemplaza un slide con título genérico ("Introducción") por el del fallback en esa posición', async () => {
    const response = JSON.stringify({
      slides: [
        { layout: 'title', title: 'La Célula', subtitle: '5° Básico — Ciencias Naturales' },
        { layout: 'bullets', title: 'Introducción', bullets: ['Un punto', 'Otro punto'] },
        { layout: 'bullets', title: 'Inicio', bullets: ['Pregunta guía: ¿Qué es una célula?', 'Observar imágenes de células'] },
        { layout: 'bullets', title: 'Desarrollo', bullets: ['Modelar la célula con plastilina', 'Identificar partes en el microscopio'] },
        { layout: 'bullets', title: 'Cierre', bullets: ['Crear organizador gráfico', 'Compartir aprendizajes'] },
      ],
    });
    const env = mockAI(response);
    const result = await generateDeckContent(env, MOCK_PLAN);

    const secondSlide = result.slides[1];
    expect(secondSlide.layout).toBe('bullets');
    if (secondSlide.layout === 'bullets') {
      expect(secondSlide.title).not.toBe('Introducción');
    }
  });

  it('enrich: reemplaza un slide de bullets cuando TODOS sus bullets tienen menos de 3 palabras', async () => {
    const response = JSON.stringify({
      slides: [
        { layout: 'title', title: 'La Célula', subtitle: '5° Básico — Ciencias Naturales' },
        { layout: 'bullets', title: 'Objetivo de Aprendizaje', bullets: ['Sí', 'El caracol', 'Actividad 1'] },
        { layout: 'bullets', title: 'Inicio', bullets: ['Pregunta guía: ¿Qué es una célula?', 'Observar imágenes de células'] },
        { layout: 'bullets', title: 'Desarrollo', bullets: ['Modelar la célula con plastilina', 'Identificar partes en el microscopio'] },
        { layout: 'bullets', title: 'Cierre', bullets: ['Crear organizador gráfico', 'Compartir aprendizajes'] },
      ],
    });
    const env = mockAI(response);
    const result = await generateDeckContent(env, MOCK_PLAN);

    const secondSlide = result.slides[1];
    expect(secondSlide.layout).toBe('bullets');
    if (secondSlide.layout === 'bullets') {
      expect(secondSlide.bullets).not.toEqual(['Sí', 'El caracol', 'Actividad 1']);
    }
  });

  it('enrich: NO reemplaza bullets de 4-5 palabras (son correctos y específicos para 2° básico, no débiles)', async () => {
    const response = JSON.stringify({
      slides: [
        { layout: 'title', title: 'El Caracol', subtitle: '2° Básico — Lenguaje y Comunicación' },
        { layout: 'bullets', title: 'Características del caracol', bullets: ['Tiene un caparazón duro', 'Se mueve muy lentamente', 'Come hojas y frutas'] },
        { layout: 'bullets', title: 'Inicio', bullets: ['Pregunta guía: ¿Qué es una célula?', 'Observar imágenes de células'] },
        { layout: 'bullets', title: 'Desarrollo', bullets: ['Modelar la célula con plastilina', 'Identificar partes en el microscopio'] },
        { layout: 'bullets', title: 'Cierre', bullets: ['Crear organizador gráfico', 'Compartir aprendizajes'] },
      ],
    });
    const env = mockAI(response);
    const result = await generateDeckContent(env, { ...MOCK_PLAN, curso: '2° Básico', tema: 'El caracol' });

    const caracteristicas = result.slides.find((s) => s.layout === 'bullets' && s.title === 'Características del caracol');
    expect(caracteristicas?.layout).toBe('bullets');
    if (caracteristicas?.layout === 'bullets') {
      expect(caracteristicas.bullets).toEqual(['Tiene un caparazón duro', 'Se mueve muy lentamente', 'Come hojas y frutas']);
    }
  });

  it('enrich: NO reemplaza slides titulados "Desarrollo"/"Cierre" cuando sus bullets son específicos (son rótulos de sección válidos, no genéricos)', async () => {
    const env = mockAI(VALID_AI_RESPONSE);
    const result = await generateDeckContent(env, MOCK_PLAN);

    const desarrollo = result.slides.find((s) => s.layout === 'bullets' && s.title === 'Desarrollo');
    expect(desarrollo?.layout).toBe('bullets');
    if (desarrollo?.layout === 'bullets') {
      expect(desarrollo.bullets).toEqual(['Modelar la célula con plastilina', 'Identificar partes en el microscopio']);
    }
  });

  it('validateDeck: sanea el author de una cita atribuida a una autoridad genérica sin nombre real', async () => {
    const response = JSON.stringify({
      slides: [
        { layout: 'title', title: 'La Célula', subtitle: '5° Básico — Ciencias Naturales' },
        { layout: 'bullets', title: 'Objetivo de Aprendizaje', bullets: ['Describir la estructura celular', 'Identificar orgánulos celulares'] },
        { layout: 'bullets', title: 'Inicio', bullets: ['Pregunta guía: ¿Qué es una célula?', 'Observar imágenes de células'] },
        { layout: 'bullets', title: 'Desarrollo', bullets: ['Modelar la célula con plastilina', 'Identificar partes en el microscopio'] },
        { layout: 'quote', text: 'La célula es la unidad fundamental de la vida', author: 'Un biólogo' },
      ],
    });
    const env = mockAI(response);
    const result = await generateDeckContent(env, MOCK_PLAN);

    const quoteSlide = result.slides.find((s) => s.layout === 'quote');
    expect(quoteSlide?.layout).toBe('quote');
    if (quoteSlide?.layout === 'quote') {
      expect(quoteSlide.text).toBe('La célula es la unidad fundamental de la vida');
      expect(quoteSlide.author).toBeUndefined();
    }
  });

  it('validateDeck: NO toca una cita con nombre propio real (ej. "Schleiden")', async () => {
    const response = JSON.stringify({
      slides: [
        { layout: 'title', title: 'La Célula', subtitle: '5° Básico — Ciencias Naturales' },
        { layout: 'bullets', title: 'Objetivo de Aprendizaje', bullets: ['Describir la estructura celular', 'Identificar orgánulos celulares'] },
        { layout: 'bullets', title: 'Inicio', bullets: ['Pregunta guía: ¿Qué es una célula?', 'Observar imágenes de células'] },
        { layout: 'bullets', title: 'Desarrollo', bullets: ['Modelar la célula con plastilina', 'Identificar partes en el microscopio'] },
        { layout: 'quote', text: 'La célula es la unidad fundamental de la vida', author: 'Schleiden' },
      ],
    });
    const env = mockAI(response);
    const result = await generateDeckContent(env, MOCK_PLAN);

    const quoteSlide = result.slides.find((s) => s.layout === 'quote');
    expect(quoteSlide?.layout).toBe('quote');
    if (quoteSlide?.layout === 'quote') {
      expect(quoteSlide.author).toBe('Schleiden');
    }
  });

  it('validateDeck: quita de un slide de bullets cualquier bullet que sea texto crudo del OA (>100 caracteres)', async () => {
    // >100 (umbral de la regla) pero <=140 (BULLET_MAX del schema): tiene
    // que ser un valor que la IA SÍ podría devolver sin que
    // callAIConValidacion lo rechace antes de llegar a validateDeck.
    const oaLargo = 'Leer independientemente y comprender textos no literarios para ampliar el conocimiento del mundo y entretenerse.';
    expect(oaLargo.length).toBeGreaterThan(100);
    expect(oaLargo.length).toBeLessThanOrEqual(140);

    const response = JSON.stringify({
      slides: [
        { layout: 'title', title: 'La Célula', subtitle: '5° Básico — Ciencias Naturales' },
        { layout: 'bullets', title: 'Objetivo de Aprendizaje', bullets: [oaLargo, 'Asignatura: Lenguaje y Comunicación', 'Curso: 2° Básico'] },
        { layout: 'bullets', title: 'Inicio', bullets: ['Pregunta guía: ¿Qué es una célula?', 'Observar imágenes de células'] },
        { layout: 'bullets', title: 'Desarrollo', bullets: ['Modelar la célula con plastilina', 'Identificar partes en el microscopio'] },
        { layout: 'bullets', title: 'Cierre', bullets: ['Crear organizador gráfico', 'Compartir aprendizajes'] },
      ],
    });
    const env = mockAI(response);
    const result = await generateDeckContent(env, MOCK_PLAN);

    const oaSlide = result.slides.find((s) => s.layout === 'bullets' && s.title === 'Objetivo de Aprendizaje');
    expect(oaSlide?.layout).toBe('bullets');
    if (oaSlide?.layout === 'bullets') {
      expect(oaSlide.bullets).not.toContain(oaLargo);
      expect(oaSlide.bullets.every((b) => b.length <= 100)).toBe(true);
      expect(oaSlide.bullets).toContain('Asignatura: Lenguaje y Comunicación');
      expect(oaSlide.bullets.length).toBeGreaterThanOrEqual(2); // nunca queda bajo el mínimo del schema
    }
  });

  it('validateDeck: si TODOS los bullets de un slide son texto crudo del OA, rellena con contenido genérico seguro en vez de eliminar el slide', async () => {
    const oaLargo1 = 'Leer independientemente y comprender textos no literarios para ampliar el conocimiento del mundo y entretenerse.';
    const oaLargo2 = 'Comprender la información que aportan las ilustraciones y símbolos, formulando una opinión sobre la lectura hecha.';
    expect(oaLargo1.length).toBeLessThanOrEqual(140);
    expect(oaLargo2.length).toBeLessThanOrEqual(140);

    const response = JSON.stringify({
      slides: [
        { layout: 'title', title: 'La Célula', subtitle: '5° Básico — Ciencias Naturales' },
        { layout: 'bullets', title: 'Objetivo de Aprendizaje', bullets: [oaLargo1, oaLargo2] },
        { layout: 'bullets', title: 'Inicio', bullets: ['Pregunta guía: ¿Qué es una célula?', 'Observar imágenes de células'] },
        { layout: 'bullets', title: 'Desarrollo', bullets: ['Modelar la célula con plastilina', 'Identificar partes en el microscopio'] },
        { layout: 'bullets', title: 'Cierre', bullets: ['Crear organizador gráfico', 'Compartir aprendizajes'] },
      ],
    });
    const env = mockAI(response);
    const result = await generateDeckContent(env, MOCK_PLAN);

    expect(result.slides.length).toBe(5); // el slide nunca se elimina
    const oaSlide = result.slides.find((s) => s.layout === 'bullets' && s.title === 'Objetivo de Aprendizaje');
    expect(oaSlide?.layout).toBe('bullets');
    if (oaSlide?.layout === 'bullets') {
      expect(oaSlide.bullets).not.toContain(oaLargo1);
      expect(oaSlide.bullets).not.toContain(oaLargo2);
      expect(oaSlide.bullets.length).toBeGreaterThanOrEqual(2);
      expect(oaSlide.bullets.every((b) => b.length <= 100)).toBe(true);
    }
  });

  it('validateDeck: el fallback determinista también queda saneado cuando la IA falla (su propio bullet de OA puede exceder 100 caracteres)', async () => {
    const longPlan: PedagogicalPlan = {
      ...MOCK_PLAN,
      objetivo_aprendizaje: 'Leer independientemente y comprender textos no literarios (cartas, notas, instrucciones y artículos informativos) para entretenerse y ampliar su conocimiento del mundo: extrayendo información explícita e implícita comprendiendo la información que aportan las ilustraciones y los símbolos a un texto formulando una opinión sobre algún aspecto de la lectura.',
    };
    const env = mockAINoAI();
    const result = await generateDeckContent(env, longPlan);

    for (const slide of result.slides) {
      if (slide.layout === 'bullets') {
        expect(slide.bullets.every((b) => b.length <= 100)).toBe(true);
      }
    }
  });
});
