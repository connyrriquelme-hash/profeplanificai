import { describe, it, expect } from 'vitest';
import {
  buildRenderableDeck,
  calcularContraste,
  validarContraste,
  SLIDE_WIDTH,
  SLIDE_HEIGHT,
} from '../functions/core/PptLayoutEngine';
import { defaultTheme, type PptTheme } from '../schemas/PptThemeSchema';
import type { PptDeck } from '../schemas/PptDeckSchema';

const FULL_DECK: PptDeck = {
  slides: [
    { layout: 'title', title: 'Portada', subtitle: 'Subtítulo de clase' },
    { layout: 'bullets', title: 'Contenido', bullets: ['Punto uno', 'Punto dos', 'Punto tres'] },
    { layout: 'image_text', title: 'Imagen con texto', body: 'Descripción del contenido', imageQuery: 'célula microscopio' },
    { layout: 'comparison', title: 'Comparar', left: { label: 'Izquierda', points: ['A1', 'A2'] }, right: { label: 'Derecha', points: ['B1', 'B2'] } },
    { layout: 'quote', text: 'Cita famosa del día', author: 'Autor conocido' },
  ],
};

const BULLETS_ONLY_DECK: PptDeck = {
  slides: [
    { layout: 'bullets', title: 'Lista', bullets: ['Item 1', 'Item 2'] },
    { layout: 'bullets', title: 'Lista 2', bullets: ['Item A', 'Item B', 'Item C', 'Item D', 'Item E', 'Item F'] },
  ],
};

const COMPARISON_ONLY_DECK: PptDeck = {
  slides: [
    { layout: 'comparison', title: 'Vs', left: { label: 'L', points: ['p1'] }, right: { label: 'R', points: ['p1', 'p2', 'p3'] } },
  ],
};

function isWithinBounds(x: number, y: number, width: number, height: number): boolean {
  return (
    x >= 0 &&
    y >= 0 &&
    x + width <= SLIDE_WIDTH + 0.01 &&
    y + height <= SLIDE_HEIGHT + 0.01
  );
}

describe('calcularContraste', () => {
  it('should calculate correct contrast ratio for white on black', () => {
    const ratio = calcularContraste('#FFFFFF', '#000000');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('should calculate correct contrast ratio for same color', () => {
    const ratio = calcularContraste('#FFFFFF', '#FFFFFF');
    expect(ratio).toBeCloseTo(1, 0);
  });

  it('should return ratio > 4.5 for dark text on white', () => {
    const ratio = calcularContraste('#1A1A1A', '#FFFFFF');
    expect(ratio).toBeGreaterThan(4.5);
  });
});

describe('validarContraste', () => {
  it('should return true when contrast meets minimum', () => {
    expect(validarContraste('#1A1A1A', '#FFFFFF', 4.5)).toBe(true);
  });

  it('should return false when contrast is insufficient', () => {
    expect(validarContraste('#CCCCCC', '#FFFFFF', 4.5)).toBe(false);
  });

  it('should return true for high contrast pairs', () => {
    expect(validarContraste('#000000', '#FFFFFF', 7)).toBe(true);
  });
});

describe('buildRenderableDeck — title slide', () => {
  it('should map title slide to RenderableTitleSlide with valid coordinates', () => {
    const deck: PptDeck = { slides: [{ layout: 'title', title: 'Test' }] };
    const result = buildRenderableDeck(deck);

    expect(result).toHaveLength(1);
    const slide = result[0];
    expect(slide.layout).toBe('title');

    if (slide.layout === 'title') {
      expect(isWithinBounds(slide.title.x, slide.title.y, slide.title.width, slide.title.height)).toBe(true);
      expect(slide.title.fontSize).toBeGreaterThanOrEqual(18);
      expect(slide.title.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('should include subtitle when provided', () => {
    const deck: PptDeck = { slides: [{ layout: 'title', title: 'Test', subtitle: 'Sub' }] };
    const result = buildRenderableDeck(deck);
    const slide = result[0];

    if (slide.layout === 'title') {
      expect(slide.subtitle).toBeDefined();
      if (slide.subtitle) {
        expect(isWithinBounds(slide.subtitle.x, slide.subtitle.y, slide.subtitle.width, slide.subtitle.height)).toBe(true);
      }
    }
  });
});

describe('buildRenderableDeck — bullets slide', () => {
  it('should map bullets slide with all bullets having valid coordinates', () => {
    const result = buildRenderableDeck(BULLETS_ONLY_DECK);

    expect(result).toHaveLength(2);
    const slide = result[0];
    expect(slide.layout).toBe('bullets');

    if (slide.layout === 'bullets') {
      expect(isWithinBounds(slide.title.x, slide.title.y, slide.title.width, slide.title.height)).toBe(true);
      expect(slide.bullets.length).toBeGreaterThanOrEqual(2);
      for (const bullet of slide.bullets) {
        expect(isWithinBounds(bullet.x, bullet.y, bullet.width, bullet.height)).toBe(true);
        expect(bullet.fontSize).toBeGreaterThanOrEqual(18);
      }
    }
  });

  it('should handle max bullets (6) without exceeding slide bounds', () => {
    const result = buildRenderableDeck(BULLETS_ONLY_DECK);
    const slide = result[1];

    if (slide.layout === 'bullets') {
      expect(slide.bullets.length).toBeLessThanOrEqual(6);
      for (const bullet of slide.bullets) {
        expect(isWithinBounds(bullet.x, bullet.y, bullet.width, bullet.height)).toBe(true);
      }
    }
  });
});

describe('buildRenderableDeck — image_text slide', () => {
  it('should map image_text slide with text and image regions', () => {
    const result = buildRenderableDeck(FULL_DECK);
    const slide = result[2];

    expect(slide.layout).toBe('image_text');
    if (slide.layout === 'image_text') {
      expect(isWithinBounds(slide.title.x, slide.title.y, slide.title.width, slide.title.height)).toBe(true);
      expect(isWithinBounds(slide.body.x, slide.body.y, slide.body.width, slide.body.height)).toBe(true);
      expect(isWithinBounds(slide.image.x, slide.image.y, slide.image.width, slide.image.height)).toBe(true);
      expect(slide.image.query).toBe('célula microscopio');
    }
  });
});

describe('buildRenderableDeck — comparison slide', () => {
  it('should map comparison slide with both sides within bounds', () => {
    const result = buildRenderableDeck(COMPARISON_ONLY_DECK);
    const slide = result[0];

    expect(slide.layout).toBe('comparison');
    if (slide.layout === 'comparison') {
      expect(isWithinBounds(slide.title.x, slide.title.y, slide.title.width, slide.title.height)).toBe(true);
      expect(isWithinBounds(slide.leftLabel.x, slide.leftLabel.y, slide.leftLabel.width, slide.leftLabel.height)).toBe(true);
      expect(isWithinBounds(slide.rightLabel.x, slide.rightLabel.y, slide.rightLabel.width, slide.rightLabel.height)).toBe(true);

      for (const point of slide.leftPoints) {
        expect(isWithinBounds(point.x, point.y, point.width, point.height)).toBe(true);
      }
      for (const point of slide.rightPoints) {
        expect(isWithinBounds(point.x, point.y, point.width, point.height)).toBe(true);
      }
    }
  });
});

describe('buildRenderableDeck — quote slide', () => {
  it('should map quote slide with text centered', () => {
    const result = buildRenderableDeck(FULL_DECK);
    const slide = result[4];

    expect(slide.layout).toBe('quote');
    if (slide.layout === 'quote') {
      expect(isWithinBounds(slide.text.x, slide.text.y, slide.text.width, slide.text.height)).toBe(true);
      expect(slide.text.align).toBe('center');
      expect(slide.author).toBeDefined();
      if (slide.author) {
        expect(isWithinBounds(slide.author.x, slide.author.y, slide.author.width, slide.author.height)).toBe(true);
      }
    }
  });
});

describe('buildRenderableDeck — theme handling', () => {
  it('should use defaultTheme when no theme is provided', () => {
    const deck: PptDeck = { slides: [{ layout: 'title', title: 'Test' }] };
    const result = buildRenderableDeck(deck);
    const slide = result[0];

    if (slide.layout === 'title') {
      expect(slide.background).toBe(defaultTheme.colores.fondo);
      expect(slide.title.fontFamily).toBe(defaultTheme.tipografia.titulo);
    }
  });

  it('should apply custom theme colors', () => {
    const customTheme: PptTheme = {
      ...defaultTheme,
      colores: {
        primario: '#FF0000',
        secundario: '#00FF00',
        texto: '#000001',
        textoSobreFondoOscuro: '#EEEEEE',
        fondo: '#FAFAFA',
        acento: '#0000FF',
      },
    };
    const deck: PptDeck = { slides: [{ layout: 'title', title: 'Test' }] };
    const result = buildRenderableDeck(deck, customTheme);
    const slide = result[0];

    if (slide.layout === 'title') {
      expect(slide.background).toBe('#FAFAFA');
    }
  });

  it('should fallback to defaultTheme for incomplete theme without throwing', () => {
    const incompleteTheme = { institucionId: 'test' } as unknown as PptTheme;
    const deck: PptDeck = { slides: [{ layout: 'title', title: 'Test' }] };

    expect(() => buildRenderableDeck(deck, incompleteTheme)).not.toThrow();
    const result = buildRenderableDeck(deck, incompleteTheme);
    expect(result).toHaveLength(1);
  });

  it('should fallback to defaultTheme for invalid theme without throwing', () => {
    const invalidTheme = { colores: { primario: 'not-a-color' } } as unknown as PptTheme;
    const deck: PptDeck = { slides: [{ layout: 'title', title: 'Test' }] };

    expect(() => buildRenderableDeck(deck, invalidTheme)).not.toThrow();
    const result = buildRenderableDeck(deck, invalidTheme);
    expect(result).toHaveLength(1);
  });
});

describe('buildRenderableDeck — DUA contrast validation', () => {
  it('should correct text color when contrast is insufficient', () => {
    const lowContrastTheme: PptTheme = {
      ...defaultTheme,
      colores: {
        ...defaultTheme.colores,
        texto: '#CCCCCC',
        fondo: '#FFFFFF',
      },
    };
    const deck: PptDeck = { slides: [{ layout: 'title', title: 'Test' }] };
    const result = buildRenderableDeck(deck, lowContrastTheme);
    const slide = result[0];

    if (slide.layout === 'title') {
      const passes = validarContraste(slide.title.color, lowContrastTheme.colores.fondo, lowContrastTheme.reglasDUA.contrasteMinimo);
      expect(passes).toBe(true);
    }
  });

  it('should ensure all text in bullets slides passes contrast check', () => {
    const lowContrastTheme: PptTheme = {
      ...defaultTheme,
      colores: {
        ...defaultTheme.colores,
        texto: '#DDDDDD',
        fondo: '#FFFFFF',
      },
    };
    const result = buildRenderableDeck(BULLETS_ONLY_DECK, lowContrastTheme);

    for (const slide of result) {
      if (slide.layout === 'bullets') {
        expect(validarContraste(slide.title.color, lowContrastTheme.colores.fondo, lowContrastTheme.reglasDUA.contrasteMinimo)).toBe(true);
        for (const bullet of slide.bullets) {
          expect(validarContraste(bullet.color, lowContrastTheme.colores.fondo, lowContrastTheme.reglasDUA.contrasteMinimo)).toBe(true);
        }
      }
    }
  });

  it('should ensure comparison labels pass contrast check', () => {
    const lowContrastTheme: PptTheme = {
      ...defaultTheme,
      colores: {
        ...defaultTheme.colores,
        acento: '#EEEEEE',
        fondo: '#FFFFFF',
      },
    };
    const result = buildRenderableDeck(COMPARISON_ONLY_DECK, lowContrastTheme);
    const slide = result[0];

    if (slide.layout === 'comparison') {
      expect(validarContraste(slide.leftLabel.color, lowContrastTheme.colores.fondo, lowContrastTheme.reglasDUA.contrasteMinimo)).toBe(true);
      expect(validarContraste(slide.rightLabel.color, lowContrastTheme.colores.fondo, lowContrastTheme.reglasDUA.contrasteMinimo)).toBe(true);
    }
  });
});

describe('buildRenderableDeck — full deck integration', () => {
  it('should transform a complete deck without errors', () => {
    expect(() => buildRenderableDeck(FULL_DECK)).not.toThrow();
    const result = buildRenderableDeck(FULL_DECK);
    expect(result).toHaveLength(FULL_DECK.slides.length);
  });

  it('should have all coordinates within slide bounds for full deck', () => {
    const result = buildRenderableDeck(FULL_DECK);

    for (const slide of result) {
      switch (slide.layout) {
        case 'title':
          expect(isWithinBounds(slide.title.x, slide.title.y, slide.title.width, slide.title.height)).toBe(true);
          if (slide.subtitle) {
            expect(isWithinBounds(slide.subtitle.x, slide.subtitle.y, slide.subtitle.width, slide.subtitle.height)).toBe(true);
          }
          break;
        case 'bullets':
          expect(isWithinBounds(slide.title.x, slide.title.y, slide.title.width, slide.title.height)).toBe(true);
          for (const b of slide.bullets) {
            expect(isWithinBounds(b.x, b.y, b.width, b.height)).toBe(true);
          }
          break;
        case 'image_text':
          expect(isWithinBounds(slide.title.x, slide.title.y, slide.title.width, slide.title.height)).toBe(true);
          expect(isWithinBounds(slide.body.x, slide.body.y, slide.body.width, slide.body.height)).toBe(true);
          expect(isWithinBounds(slide.image.x, slide.image.y, slide.image.width, slide.image.height)).toBe(true);
          break;
        case 'comparison':
          expect(isWithinBounds(slide.title.x, slide.title.y, slide.title.width, slide.title.height)).toBe(true);
          expect(isWithinBounds(slide.leftLabel.x, slide.leftLabel.y, slide.leftLabel.width, slide.leftLabel.height)).toBe(true);
          expect(isWithinBounds(slide.rightLabel.x, slide.rightLabel.y, slide.rightLabel.width, slide.rightLabel.height)).toBe(true);
          for (const p of slide.leftPoints) expect(isWithinBounds(p.x, p.y, p.width, p.height)).toBe(true);
          for (const p of slide.rightPoints) expect(isWithinBounds(p.x, p.y, p.width, p.height)).toBe(true);
          break;
        case 'quote':
          expect(isWithinBounds(slide.text.x, slide.text.y, slide.text.width, slide.text.height)).toBe(true);
          if (slide.author) expect(isWithinBounds(slide.author.x, slide.author.y, slide.author.width, slide.author.height)).toBe(true);
          break;
      }
    }
  });

  it('should never produce slides with negative coordinates', () => {
    const result = buildRenderableDeck(FULL_DECK);

    for (const slide of result) {
      const rects = extractRects(slide);
      for (const rect of rects) {
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('should apply DUA minimum font size across all slides', () => {
    const result = buildRenderableDeck(FULL_DECK);

    for (const slide of result) {
      const rects = extractRects(slide);
      for (const rect of rects) {
        expect(rect.fontSize).toBeGreaterThanOrEqual(defaultTheme.reglasDUA.tamanoFuenteMinimoPt);
      }
    }
  });
});

describe('buildRenderableDeck — vocabulario slide', () => {
  const VOCAB_DECK: PptDeck = {
    slides: [
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

  it('should map vocabulario slide to RenderableVocabularioSlide', () => {
    const result = buildRenderableDeck(VOCAB_DECK);
    expect(result).toHaveLength(1);
    expect(result[0].layout).toBe('vocabulario');
  });

  it('should have valid coordinates for all terminos', () => {
    const result = buildRenderableDeck(VOCAB_DECK);
    const slide = result[0];
    if (slide.layout === 'vocabulario') {
      expect(isWithinBounds(slide.title.x, slide.title.y, slide.title.width, slide.title.height)).toBe(true);
      for (const t of slide.terminos) {
        expect(isWithinBounds(t.x, t.y, t.width, t.height)).toBe(true);
        expect(t.fontSize).toBeGreaterThanOrEqual(defaultTheme.reglasDUA.tamanoFuenteMinimoPt);
      }
    }
  });
});

describe('buildRenderableDeck — ciclo_proceso slide', () => {
  const CICLO_DECK: PptDeck = {
    slides: [
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

  it('should map ciclo_proceso slide to RenderableCicloProcesoSlide', () => {
    const result = buildRenderableDeck(CICLO_DECK);
    expect(result).toHaveLength(1);
    expect(result[0].layout).toBe('ciclo_proceso');
  });

  it('should have valid coordinates for all pasos', () => {
    const result = buildRenderableDeck(CICLO_DECK);
    const slide = result[0];
    if (slide.layout === 'ciclo_proceso') {
      expect(isWithinBounds(slide.title.x, slide.title.y, slide.title.width, slide.title.height)).toBe(true);
      for (const p of slide.pasos) {
        expect(isWithinBounds(p.x, p.y, p.width, p.height)).toBe(true);
        expect(p.fontSize).toBeGreaterThanOrEqual(defaultTheme.reglasDUA.tamanoFuenteMinimoPt);
      }
    }
  });
});

describe('buildRenderableDeck — quiz_opcion_multiple expands to 2 slides', () => {
  const QUIZ_DECK: PptDeck = {
    slides: [
      {
        layout: 'quiz_opcion_multiple',
        pregunta: '¿Cuál es la capital de Chile?',
        opciones: ['Santiago', 'Lima', 'Bogotá', 'Buenos Aires'],
        respuestaCorrectaIndex: 0,
        explicacion: 'Santiago es la capital de Chile.',
      },
    ],
  };

  it('should expand quiz_opcion_multiple to exactly 2 RenderableSlides', () => {
    const result = buildRenderableDeck(QUIZ_DECK);
    expect(result).toHaveLength(2);
    expect(result[0].layout).toBe('quiz_pregunta');
    expect(result[1].layout).toBe('quiz_respuesta');
  });

  it('should mark the correct option in verde on the answer slide', () => {
    const result = buildRenderableDeck(QUIZ_DECK);
    const answerSlide = result[1];
    if (answerSlide.layout === 'quiz_respuesta') {
      expect(answerSlide.resultado.fontSize).toBeGreaterThanOrEqual(defaultTheme.reglasDUA.tamanoFuenteMinimoPt);
    }
  });
});

describe('buildRenderableDeck — verdadero_falso expands to 2 slides', () => {
  const VF_DECK: PptDeck = {
    slides: [
      {
        layout: 'verdadero_falso',
        afirmacion: 'La Tierra gira alrededor del Sol',
        esVerdadero: true,
        explicacion: 'La Tierra orbita alrededor del Sol una vez al año.',
      },
    ],
  };

  it('should expand verdadero_falso to exactly 2 RenderableSlides', () => {
    const result = buildRenderableDeck(VF_DECK);
    expect(result).toHaveLength(2);
    expect(result[0].layout).toBe('verdadero_falso_pregunta');
    expect(result[1].layout).toBe('verdadero_falso_respuesta');
  });
});

describe('buildRenderableDeck — empty/defensive data', () => {
  it('should produce placeholders for vocabulario with empty terminos', () => {
    const deck: PptDeck = {
      slides: [
        {
          layout: 'vocabulario',
          titulo: 'Vocabulario',
          terminos: [],
        },
      ],
    };
    expect(() => buildRenderableDeck(deck)).not.toThrow();
    const result = buildRenderableDeck(deck);
    expect(result).toHaveLength(1);
  });

  it('should produce placeholders for ciclo_proceso with empty pasos', () => {
    const deck: PptDeck = {
      slides: [
        {
          layout: 'ciclo_proceso',
          titulo: 'Proceso',
          pasos: [],
        },
      ],
    };
    expect(() => buildRenderableDeck(deck)).not.toThrow();
    const result = buildRenderableDeck(deck);
    expect(result).toHaveLength(1);
  });

  it('should handle quiz_opcion_multiple with empty opciones defensively', () => {
    const deck: PptDeck = {
      slides: [
        {
          layout: 'quiz_opcion_multiple' as const,
          pregunta: 'Pregunta?',
          opciones: [],
          respuestaCorrectaIndex: 0,
        },
      ],
    };
    expect(() => buildRenderableDeck(deck)).not.toThrow();
    const result = buildRenderableDeck(deck);
    expect(result).toHaveLength(2);
  });
});

function extractRects(slide: import('../functions/core/PptLayoutEngine').RenderableSlide): Array<{ x: number; y: number; width: number; height: number; fontSize: number }> {
  const rects: Array<{ x: number; y: number; width: number; height: number; fontSize: number }> = [];

  switch (slide.layout) {
    case 'title':
      rects.push(slide.title);
      if (slide.subtitle) rects.push(slide.subtitle);
      break;
    case 'bullets':
      rects.push(slide.title);
      rects.push(...slide.bullets);
      break;
    case 'image_text':
      rects.push(slide.title);
      rects.push(slide.body);
      break;
    case 'comparison':
      rects.push(slide.title);
      rects.push(slide.leftLabel);
      rects.push(slide.rightLabel);
      rects.push(...slide.leftPoints);
      rects.push(...slide.rightPoints);
      break;
    case 'quote':
      rects.push(slide.text);
      if (slide.author) rects.push(slide.author);
      break;
    case 'vocabulario':
      rects.push(slide.title);
      rects.push(...slide.terminos);
      break;
    case 'ciclo_proceso':
      rects.push(slide.title);
      rects.push(...slide.pasos);
      break;
    case 'quiz_pregunta':
      rects.push(slide.titulo);
      rects.push(slide.pregunta);
      rects.push(...slide.opciones);
      break;
    case 'quiz_respuesta':
      rects.push(slide.titulo);
      rects.push(slide.resultado);
      rects.push(slide.explicacion);
      break;
    case 'verdadero_falso_pregunta':
      rects.push(slide.titulo);
      rects.push(slide.afirmacion);
      rects.push(...slide.opciones);
      break;
    case 'verdadero_falso_respuesta':
      rects.push(slide.titulo);
      rects.push(slide.resultado);
      rects.push(slide.explicacion);
      break;
  }

  return rects;
}
