import { PptThemeSchema, defaultTheme, type PptTheme } from '../../schemas/PptThemeSchema';
import type { PptDeck, TitleSlide, BulletsSlide, ImageTextSlide, ComparisonSlide, QuoteSlide } from '../../schemas/PptDeckSchema';

const SLIDE_WIDTH = 10;
const SLIDE_HEIGHT = 5.63;
const MARGIN = 0.5;
const CONTENT_WIDTH = SLIDE_WIDTH - 2 * MARGIN;
const CONTENT_HEIGHT = SLIDE_HEIGHT - 2 * MARGIN;

interface TextRect {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  text?: string;
}

interface ImageRect {
  x: number;
  y: number;
  width: number;
  height: number;
  query: string;
}

export interface RenderableTitleSlide {
  layout: 'title';
  background: string;
  title: TextRect;
  subtitle?: TextRect;
}

export interface RenderableBulletsSlide {
  layout: 'bullets';
  background: string;
  title: TextRect;
  bullets: TextRect[];
}

export interface RenderableImageTextSlide {
  layout: 'image_text';
  background: string;
  title: TextRect;
  body: TextRect;
  image: ImageRect;
}

export interface RenderableComparisonSlide {
  layout: 'comparison';
  background: string;
  title: TextRect;
  leftLabel: TextRect;
  leftPoints: TextRect[];
  rightLabel: TextRect;
  rightPoints: TextRect[];
}

export interface RenderableQuoteSlide {
  layout: 'quote';
  background: string;
  text: TextRect;
  author?: TextRect;
}

export type RenderableSlide =
  | RenderableTitleSlide
  | RenderableBulletsSlide
  | RenderableImageTextSlide
  | RenderableComparisonSlide
  | RenderableQuoteSlide;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16) / 255,
    g: parseInt(clean.substring(2, 4), 16) / 255,
    b: parseInt(clean.substring(4, 6), 16) / 255,
  };
}

function luminanciaRelativa(r: number, g: number, b: number): number {
  const transformar = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * transformar(r) + 0.7152 * transformar(g) + 0.0722 * transformar(b);
}

export function calcularContraste(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const l1 = luminanciaRelativa(rgb1.r, rgb1.g, rgb1.b);
  const l2 = luminanciaRelativa(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function validarContraste(colorTexto: string, colorFondo: string, minimo: number): boolean {
  return calcularContraste(colorTexto, colorFondo) >= minimo;
}

function resolverColorTexto(colorTexto: string, colorFondo: string, colorOscuro: string, minimo: number): string {
  if (validarContraste(colorTexto, colorFondo, minimo)) {
    return colorTexto;
  }
  if (validarContraste(colorOscuro, colorFondo, minimo)) {
    return colorOscuro;
  }
  const candidatos = ['#000000', '#FFFFFF', colorOscuro, colorTexto];
  let mejor = colorTexto;
  let mejorRatio = calcularContraste(colorTexto, colorFondo);
  for (const candidato of candidatos) {
    const ratio = calcularContraste(candidato, colorFondo);
    if (ratio > mejorRatio) {
      mejorRatio = ratio;
      mejor = candidato;
    }
  }
  return mejor;
}

function ensureTheme(theme?: PptTheme): PptTheme {
  if (!theme) return defaultTheme;
  const result = PptThemeSchema.safeParse(theme);
  if (result.success) return result.data;
  const merged: PptTheme = {
    institucionId: theme.institucionId || defaultTheme.institucionId,
    colores: {
      primario: theme.colores?.primario || defaultTheme.colores.primario,
      secundario: theme.colores?.secundario || defaultTheme.colores.secundario,
      texto: theme.colores?.texto || defaultTheme.colores.texto,
      textoSobreFondoOscuro: theme.colores?.textoSobreFondoOscuro || defaultTheme.colores.textoSobreFondoOscuro,
      fondo: theme.colores?.fondo || defaultTheme.colores.fondo,
      acento: theme.colores?.acento || defaultTheme.colores.acento,
    },
    tipografia: {
      titulo: theme.tipografia?.titulo || defaultTheme.tipografia.titulo,
      cuerpo: theme.tipografia?.cuerpo || defaultTheme.tipografia.cuerpo,
    },
    reglasDUA: {
      contrasteMinimo: theme.reglasDUA?.contrasteMinimo ?? defaultTheme.reglasDUA.contrasteMinimo,
      tamanoFuenteMinimoPt: theme.reglasDUA?.tamanoFuenteMinimoPt ?? defaultTheme.reglasDUA.tamanoFuenteMinimoPt,
    },
  };
  return merged;
}

function makeTitleText(slide: TitleSlide, theme: PptTheme): TextRect {
  const color = resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  return {
    x: MARGIN,
    y: SLIDE_HEIGHT * 0.35,
    width: CONTENT_WIDTH,
    height: 1.2,
    fontSize: 36,
    color,
    fontFamily: theme.tipografia.titulo,
    bold: true,
    align: 'center',
    valign: 'middle',
    text: slide.title,
  };
}

function makeSubtitleText(slide: TitleSlide, theme: PptTheme): TextRect | undefined {
  if (!slide.subtitle) return undefined;
  const color = resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  return {
    x: MARGIN,
    y: SLIDE_HEIGHT * 0.35 + 1.4,
    width: CONTENT_WIDTH,
    height: 0.8,
    fontSize: 20,
    color,
    fontFamily: theme.tipografia.cuerpo,
    align: 'center',
    valign: 'top',
    text: slide.subtitle,
  };
}

function layoutTitleSlide(slide: TitleSlide, theme: PptTheme): RenderableTitleSlide {
  return {
    layout: 'title',
    background: theme.colores.fondo,
    title: makeTitleText(slide, theme),
    subtitle: makeSubtitleText(slide, theme),
  };
}

function makeBulletsTitle(slide: BulletsSlide, theme: PptTheme): TextRect {
  const color = resolverColorTexto(theme.colores.primario, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  return {
    x: MARGIN,
    y: MARGIN,
    width: CONTENT_WIDTH,
    height: 0.8,
    fontSize: 28,
    color,
    fontFamily: theme.tipografia.titulo,
    bold: true,
    align: 'left',
    valign: 'middle',
    text: slide.title,
  };
}

function makeBulletTexts(slide: BulletsSlide, theme: PptTheme): TextRect[] {
  const bulletFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 18);
  const color = resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const startY = MARGIN + 1.0;
  const availableHeight = SLIDE_HEIGHT - startY - MARGIN;
  const maxBullets = Math.min(slide.bullets.length, 6);
  const spacing = Math.min(availableHeight / maxBullets, 0.6);

  return slide.bullets.slice(0, maxBullets).map((bullet, i) => ({
    x: MARGIN + 0.3,
    y: startY + i * spacing,
    width: CONTENT_WIDTH - 0.3,
    height: spacing * 0.9,
    fontSize: bulletFontSize,
    color,
    fontFamily: theme.tipografia.cuerpo,
    align: 'left' as const,
    valign: 'middle' as const,
    text: bullet,
  }));
}

function layoutBulletsSlide(slide: BulletsSlide, theme: PptTheme): RenderableBulletsSlide {
  return {
    layout: 'bullets',
    background: theme.colores.fondo,
    title: makeBulletsTitle(slide, theme),
    bullets: makeBulletTexts(slide, theme),
  };
}

function layoutImageTextSlide(slide: ImageTextSlide, theme: PptTheme): RenderableImageTextSlide {
  const titleColor = resolverColorTexto(theme.colores.primario, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const bodyColor = resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const bodyFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 16);

  const textWidth = CONTENT_WIDTH * 0.55;
  const imageWidth = CONTENT_WIDTH * 0.4;

  return {
    layout: 'image_text',
    background: theme.colores.fondo,
    title: {
      x: MARGIN,
      y: MARGIN,
      width: textWidth,
      height: 0.8,
      fontSize: 28,
      color: titleColor,
      fontFamily: theme.tipografia.titulo,
      bold: true,
      align: 'left',
      valign: 'middle',
      text: slide.title,
    },
    body: {
      x: MARGIN,
      y: MARGIN + 1.0,
      width: textWidth,
      height: SLIDE_HEIGHT - 2 * MARGIN - 1.0,
      fontSize: bodyFontSize,
      color: bodyColor,
      fontFamily: theme.tipografia.cuerpo,
      align: 'left',
      valign: 'top',
      text: slide.body,
    },
    image: {
      x: MARGIN + textWidth + 0.3,
      y: MARGIN,
      width: imageWidth,
      height: CONTENT_HEIGHT,
      query: slide.imageQuery,
    },
  };
}

function layoutComparisonSlide(slide: ComparisonSlide, theme: PptTheme): RenderableComparisonSlide {
  const titleColor = resolverColorTexto(theme.colores.primario, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const labelColor = resolverColorTexto(theme.colores.acento, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const pointColor = resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const pointFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 16);
  const halfWidth = (CONTENT_WIDTH - 0.4) / 2;
  const startY = MARGIN + 1.0;
  const availableHeight = SLIDE_HEIGHT - startY - MARGIN;

  const makePointTexts = (points: string[], xOffset: number): TextRect[] => {
    const maxPoints = Math.min(points.length, 5);
    const spacing = Math.min(availableHeight / (maxPoints + 1), 0.5);
    return points.slice(0, maxPoints).map((point, i) => ({
      x: xOffset,
      y: startY + 0.5 + i * spacing,
      width: halfWidth,
      height: spacing * 0.9,
      fontSize: pointFontSize,
      color: pointColor,
      fontFamily: theme.tipografia.cuerpo,
      align: 'left' as const,
      valign: 'middle' as const,
      text: point,
    }));
  };

  return {
    layout: 'comparison',
    background: theme.colores.fondo,
    title: {
      x: MARGIN,
      y: MARGIN,
      width: CONTENT_WIDTH,
      height: 0.8,
      fontSize: 28,
      color: titleColor,
      fontFamily: theme.tipografia.titulo,
      bold: true,
      align: 'center',
      valign: 'middle',
      text: slide.title,
    },
    leftLabel: {
      x: MARGIN,
      y: startY,
      width: halfWidth,
      height: 0.5,
      fontSize: 22,
      color: labelColor,
      fontFamily: theme.tipografia.titulo,
      bold: true,
      align: 'center',
      valign: 'middle',
      text: slide.left.label,
    },
    leftPoints: makePointTexts(slide.left.points, MARGIN),
    rightLabel: {
      x: MARGIN + halfWidth + 0.4,
      y: startY,
      width: halfWidth,
      height: 0.5,
      fontSize: 22,
      color: labelColor,
      fontFamily: theme.tipografia.titulo,
      bold: true,
      align: 'center',
      valign: 'middle',
      text: slide.right.label,
    },
    rightPoints: makePointTexts(slide.right.points, MARGIN + halfWidth + 0.4),
  };
}

function layoutQuoteSlide(slide: QuoteSlide, theme: PptTheme): RenderableQuoteSlide {
  const textColor = resolverColorTexto(theme.colores.primario, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const authorColor = resolverColorTexto(theme.colores.secundario, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const authorFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 16);

  const result: RenderableQuoteSlide = {
    layout: 'quote',
    background: theme.colores.fondo,
    text: {
      x: MARGIN + 0.8,
      y: SLIDE_HEIGHT * 0.25,
      width: CONTENT_WIDTH - 1.6,
      height: 2.5,
      fontSize: 24,
      color: textColor,
      fontFamily: theme.tipografia.cuerpo,
      align: 'center',
      valign: 'middle',
      text: slide.text,
    },
  };

  if (slide.author) {
    result.author = {
      x: MARGIN + 0.8,
      y: SLIDE_HEIGHT * 0.25 + 2.7,
      width: CONTENT_WIDTH - 1.6,
      height: 0.5,
      fontSize: authorFontSize,
      color: authorColor,
      fontFamily: theme.tipografia.cuerpo,
      align: 'center',
      valign: 'top',
      text: slide.author,
    };
  }

  return result;
}

export function buildRenderableDeck(deck: PptDeck, theme?: PptTheme): RenderableSlide[] {
  const resolvedTheme = ensureTheme(theme);

  return deck.slides.map((slide) => {
    switch (slide.layout) {
      case 'title':
        return layoutTitleSlide(slide, resolvedTheme);
      case 'bullets':
        return layoutBulletsSlide(slide, resolvedTheme);
      case 'image_text':
        return layoutImageTextSlide(slide, resolvedTheme);
      case 'comparison':
        return layoutComparisonSlide(slide, resolvedTheme);
      case 'quote':
        return layoutQuoteSlide(slide, resolvedTheme);
    }
  });
}
