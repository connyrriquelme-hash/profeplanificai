import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { renderPptx } from '../functions/core/PptRenderer';
import { buildRenderableDeck } from '../functions/core/PptLayoutEngine';
import { defaultTheme } from '../schemas/PptThemeSchema';
import type { PptDeck } from '../schemas/PptDeckSchema';
import type { RenderableSlide } from '../functions/core/PptLayoutEngine';
import fs from 'fs';
import path from 'path';

const TMP_DIR = path.resolve(__dirname, '../tmp');

const FULL_DECK: PptDeck = {
  slides: [
    { layout: 'title', title: 'La Célula', subtitle: '5° Básico — Ciencias Naturales' },
    { layout: 'bullets', title: 'Objetivo de Aprendizaje', bullets: ['Describir la estructura celular', 'Identificar orgánulos celulares', 'Comparar célula vegetal y animal'] },
    { layout: 'image_text', title: 'Estructura Celular', body: 'La célula es la unidad básica de la vida. Tiene membrana, citoplasma y núcleo.', imageQuery: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Epidermis_en.svg/200px-Epidermis_en.svg.png' },
    { layout: 'comparison', title: 'Célula Vegetal vs Animal', left: { label: 'Vegetal', points: ['Pared celular', 'Cloroplastos', 'Vacuola grande'] }, right: { label: 'Animal', points: ['Sin pared', 'Centriolos', 'Vacuolas pequeñas'] } },
    { layout: 'quote', text: 'La vida es un fenómeno emergente de la complejidad molecular.', author: 'Francisco Varela' },
  ],
};

const VOCAB_RENDERABLE_DECK: PptDeck = {
  slides: [
    { layout: 'title', title: 'Portada' },
    { layout: 'bullets', title: 'Lista', bullets: ['A', 'B'] },
    { layout: 'bullets', title: 'L2', bullets: ['C', 'D'] },
    { layout: 'bullets', title: 'L3', bullets: ['E', 'F'] },
    { layout: 'bullets', title: 'L4', bullets: ['G', 'H'] },
    {
      layout: 'vocabulario',
      titulo: 'Palabras Nuevas',
      terminos: [
        { palabra: 'Célula', definicion: 'Unidad básica de la vida', imageQuery: 'célula microscopio' },
        { palabra: 'Núcleo', definicion: 'Centro de la célula', imageQuery: 'núcleo celular' },
      ],
    },
  ],
};

const CICLO_RENDERABLE_DECK: PptDeck = {
  slides: [
    { layout: 'title', title: 'Portada' },
    { layout: 'bullets', title: 'Lista', bullets: ['A', 'B'] },
    { layout: 'bullets', title: 'L2', bullets: ['C', 'D'] },
    { layout: 'bullets', title: 'L3', bullets: ['E', 'F'] },
    { layout: 'bullets', title: 'L4', bullets: ['G', 'H'] },
    {
      layout: 'ciclo_proceso',
      titulo: 'Fotosíntesis',
      pasos: [
        { nombre: 'Captura', descripcion: 'Las hojas capturan luz solar', imageQuery: 'hojas sol' },
        { nombre: 'Transformación', descripcion: 'Se convierte en energía', imageQuery: 'energía' },
        { nombre: 'Almacenamiento', descripcion: 'Se guarda como glucosa', imageQuery: 'glucosa' },
      ],
    },
  ],
};

const QUIZ_RENDERABLE_DECK: PptDeck = {
  slides: [
    { layout: 'title', title: 'Portada' },
    { layout: 'bullets', title: 'Lista', bullets: ['A', 'B'] },
    { layout: 'bullets', title: 'L2', bullets: ['C', 'D'] },
    { layout: 'bullets', title: 'L3', bullets: ['E', 'F'] },
    { layout: 'bullets', title: 'L4', bullets: ['G', 'H'] },
    {
      layout: 'quiz_opcion_multiple',
      pregunta: '¿Cuál es la capital de Chile?',
      opciones: ['Santiago', 'Lima', 'Bogotá', 'Buenos Aires'],
      respuestaCorrectaIndex: 0,
      explicacion: 'Santiago es la capital de Chile.',
    },
  ],
};

const VF_RENDERABLE_DECK: PptDeck = {
  slides: [
    { layout: 'title', title: 'Portada' },
    { layout: 'bullets', title: 'Lista', bullets: ['A', 'B'] },
    { layout: 'bullets', title: 'L2', bullets: ['C', 'D'] },
    { layout: 'bullets', title: 'L3', bullets: ['E', 'F'] },
    { layout: 'bullets', title: 'L4', bullets: ['G', 'H'] },
    {
      layout: 'verdadero_falso',
      afirmacion: 'La Tierra gira alrededor del Sol',
      esVerdadero: true,
      explicacion: 'La Tierra orbita al Sol.',
    },
  ],
};

beforeAll(() => {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
});

afterAll(() => {
  const files = fs.readdirSync(TMP_DIR).filter((f) => f.endsWith('.pptx'));
  for (const file of files) {
    const stat = fs.statSync(path.join(TMP_DIR, file));
    if (stat.size === 0) {
      fs.unlinkSync(path.join(TMP_DIR, file));
    }
  }
});

describe('PptRenderer.renderPptx', () => {
  it('should render a complete 5-slide deck to a non-empty .pptx file', async () => {
    const outputPath = path.join(TMP_DIR, 'test-full-deck.pptx');
    const renderableSlides = buildRenderableDeck(FULL_DECK, defaultTheme);
    const result = await renderPptx(renderableSlides, outputPath);

    expect(result).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);

    const stat = fs.statSync(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('should produce a valid ZIP file (.pptx is ZIP)', async () => {
    const outputPath = path.join(TMP_DIR, 'test-zip-valid.pptx');
    const renderableSlides = buildRenderableDeck(FULL_DECK, defaultTheme);
    await renderPptx(renderableSlides, outputPath);

    const buffer = fs.readFileSync(outputPath);
    const magicBytes = buffer.toString('ascii', 0, 4);
    expect(magicBytes).toBe('PK\x03\x04');
  });

  it('should not crash when image source is invalid (file path)', async () => {
    const deckWithBadImage: PptDeck = {
      slides: [
        { layout: 'title', title: 'Slide OK' },
        { layout: 'image_text', title: 'Con imagen', body: 'Texto visible', imageQuery: '/no/existe/imagen.png' },
        { layout: 'bullets', title: 'Después de imagen', bullets: ['A', 'B'] },
      ],
    };
    const outputPath = path.join(TMP_DIR, 'test-bad-image.pptx');
    const renderableSlides = buildRenderableDeck(deckWithBadImage, defaultTheme);

    await expect(renderPptx(renderableSlides, outputPath)).resolves.toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    const stat = fs.statSync(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('should skip a corrupted slide and render the rest', async () => {
    const goodSlide: RenderableSlide = {
      layout: 'title',
      background: '#FFFFFF',
      title: { x: 0.5, y: 1, width: 9, height: 1.5, fontSize: 36, color: '#1A1A1A', fontFamily: 'Arial', text: 'Slide válido' },
    };

    const badSlide = {
      layout: 'comparison',
      background: '#FFFFFF',
      title: { x: 0.5, y: 0.5, width: 9, height: 1, fontSize: 28, color: '#000', fontFamily: 'Arial' },
    } as unknown as RenderableSlide;

    const goodSlide2: RenderableSlide = {
      layout: 'bullets',
      background: '#FFFFFF',
      title: { x: 0.5, y: 0.5, width: 9, height: 0.8, fontSize: 28, color: '#1E3A5F', fontFamily: 'Arial', text: 'Después del corrupto' },
      bullets: [
        { x: 0.8, y: 1.5, width: 8, height: 0.5, fontSize: 18, color: '#1A1A1A', fontFamily: 'Arial', text: 'Punto A' },
        { x: 0.8, y: 2.1, width: 8, height: 0.5, fontSize: 18, color: '#1A1A1A', fontFamily: 'Arial', text: 'Punto B' },
      ],
    };

    const outputPath = path.join(TMP_DIR, 'test-corrupted-slide.pptx');
    const result = await renderPptx([goodSlide, badSlide, goodSlide2], outputPath);

    expect(result).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    const stat = fs.statSync(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('should handle an empty slides array gracefully', async () => {
    const outputPath = path.join(TMP_DIR, 'test-empty.pptx');
    const result = await renderPptx([], outputPath);

    expect(result).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    const stat = fs.statSync(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('should render a vocabulario deck to a non-empty .pptx file', async () => {
    const outputPath = path.join(TMP_DIR, 'test-vocabulario.pptx');
    const renderableSlides = buildRenderableDeck(VOCAB_RENDERABLE_DECK, defaultTheme);
    const result = await renderPptx(renderableSlides, outputPath);

    expect(result).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    const stat = fs.statSync(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('should render a ciclo_proceso deck to a non-empty .pptx file', async () => {
    const outputPath = path.join(TMP_DIR, 'test-ciclo-proceso.pptx');
    const renderableSlides = buildRenderableDeck(CICLO_RENDERABLE_DECK, defaultTheme);
    const result = await renderPptx(renderableSlides, outputPath);

    expect(result).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    const stat = fs.statSync(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('should render a quiz_opcion_multiple deck to a non-empty .pptx file', async () => {
    const outputPath = path.join(TMP_DIR, 'test-quiz.pptx');
    const renderableSlides = buildRenderableDeck(QUIZ_RENDERABLE_DECK, defaultTheme);
    const result = await renderPptx(renderableSlides, outputPath);

    expect(result).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    const stat = fs.statSync(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('should render a verdadero_falso deck to a non-empty .pptx file', async () => {
    const outputPath = path.join(TMP_DIR, 'test-verdadero-falso.pptx');
    const renderableSlides = buildRenderableDeck(VF_RENDERABLE_DECK, defaultTheme);
    const result = await renderPptx(renderableSlides, outputPath);

    expect(result).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    const stat = fs.statSync(outputPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('should produce a valid ZIP for vocabulario deck', async () => {
    const outputPath = path.join(TMP_DIR, 'test-vocab-zip.pptx');
    const renderableSlides = buildRenderableDeck(VOCAB_RENDERABLE_DECK, defaultTheme);
    await renderPptx(renderableSlides, outputPath);

    const buffer = fs.readFileSync(outputPath);
    const magicBytes = buffer.toString('ascii', 0, 4);
    expect(magicBytes).toBe('PK\x03\x04');
  });

  it('should produce a valid ZIP for quiz deck', async () => {
    const outputPath = path.join(TMP_DIR, 'test-quiz-zip.pptx');
    const renderableSlides = buildRenderableDeck(QUIZ_RENDERABLE_DECK, defaultTheme);
    await renderPptx(renderableSlides, outputPath);

    const buffer = fs.readFileSync(outputPath);
    const magicBytes = buffer.toString('ascii', 0, 4);
    expect(magicBytes).toBe('PK\x03\x04');
  });
});
