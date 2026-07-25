import { PptThemeSchema, defaultTheme, type PptTheme } from '../../schemas/PptThemeSchema';
import type {
  PptDeck,
  TitleSlide,
  BulletsSlide,
  ImageTextSlide,
  ComparisonSlide,
  QuoteSlide,
  VocabularioSlide,
  CicloProcesoSlide,
  QuizOpcionMultipleSlide,
  VerdaderoFalsoSlide,
} from '../../schemas/PptDeckSchema';

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

export interface RenderableVocabularioSlide {
  layout: 'vocabulario';
  background: string;
  title: TextRect;
  terminos: TextRect[];
}

export interface RenderableCicloProcesoSlide {
  layout: 'ciclo_proceso';
  background: string;
  title: TextRect;
  pasos: TextRect[];
}

export interface RenderableQuizPreguntaSlide {
  layout: 'quiz_pregunta';
  background: string;
  titulo: TextRect;
  pregunta: TextRect;
  opciones: TextRect[];
}

export interface RenderableQuizRespuestaSlide {
  layout: 'quiz_respuesta';
  background: string;
  titulo: TextRect;
  resultado: TextRect;
  explicacion: TextRect;
}

export interface RenderableVerdaderoFalsoPreguntaSlide {
  layout: 'verdadero_falso_pregunta';
  background: string;
  titulo: TextRect;
  afirmacion: TextRect;
  opciones: TextRect[];
}

export interface RenderableVerdaderoFalsoRespuestaSlide {
  layout: 'verdadero_falso_respuesta';
  background: string;
  titulo: TextRect;
  resultado: TextRect;
  explicacion: TextRect;
}

export type RenderableSlide =
  | RenderableTitleSlide
  | RenderableBulletsSlide
  | RenderableImageTextSlide
  | RenderableComparisonSlide
  | RenderableQuoteSlide
  | RenderableVocabularioSlide
  | RenderableCicloProcesoSlide
  | RenderableQuizPreguntaSlide
  | RenderableQuizRespuestaSlide
  | RenderableVerdaderoFalsoPreguntaSlide
  | RenderableVerdaderoFalsoRespuestaSlide;

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

function layoutVocabularioSlide(slide: VocabularioSlide, theme: PptTheme): RenderableVocabularioSlide {
  const titleColor = resolverColorTexto(theme.colores.primario, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const terminoFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 14);
  const definicionFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 12);

  const terminos: TextRect[] = slide.terminos.map((t, i) => {
    const baseY = MARGIN + 1.0 + i * 1.1;
    return {
      x: MARGIN + 0.3,
      y: baseY,
      width: CONTENT_WIDTH - 0.6,
      height: 0.9,
      fontSize: terminoFontSize,
      color: resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo),
      fontFamily: theme.tipografia.cuerpo,
      align: 'left' as const,
      valign: 'top' as const,
      text: `${t.palabra}: ${t.definicion}`,
    };
  });

  if (terminos.length === 0) {
    terminos.push({
      x: MARGIN,
      y: MARGIN + 1.0,
      width: CONTENT_WIDTH,
      height: 0.8,
      fontSize: terminoFontSize,
      color: resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo),
      fontFamily: theme.tipografia.cuerpo,
      align: 'center' as const,
      valign: 'middle' as const,
      text: 'Sin términos disponibles',
    });
  }

  return {
    layout: 'vocabulario',
    background: theme.colores.fondo,
    title: {
      x: MARGIN,
      y: MARGIN,
      width: CONTENT_WIDTH,
      height: 0.7,
      fontSize: 26,
      color: titleColor,
      fontFamily: theme.tipografia.titulo,
      bold: true,
      align: 'center',
      valign: 'middle',
      text: slide.titulo,
    },
    terminos,
  };
}

function layoutCicloProcesoSlide(slide: CicloProcesoSlide, theme: PptTheme): RenderableCicloProcesoSlide {
  const titleColor = resolverColorTexto(theme.colores.primario, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const pasoFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 14);

  const pasos: TextRect[] = slide.pasos.map((p, i) => {
    const baseY = MARGIN + 1.0 + i * 0.7;
    return {
      x: MARGIN + 0.5,
      y: baseY,
      width: CONTENT_WIDTH - 1.0,
      height: 0.55,
      fontSize: pasoFontSize,
      color: resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo),
      fontFamily: theme.tipografia.cuerpo,
      align: 'left' as const,
      valign: 'middle' as const,
      text: `${i + 1}. ${p.nombre}: ${p.descripcion}`,
    };
  });

  if (pasos.length === 0) {
    pasos.push({
      x: MARGIN,
      y: MARGIN + 1.0,
      width: CONTENT_WIDTH,
      height: 0.8,
      fontSize: pasoFontSize,
      color: resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo),
      fontFamily: theme.tipografia.cuerpo,
      align: 'center' as const,
      valign: 'middle' as const,
      text: 'Sin pasos disponibles',
    });
  }

  return {
    layout: 'ciclo_proceso',
    background: theme.colores.fondo,
    title: {
      x: MARGIN,
      y: MARGIN,
      width: CONTENT_WIDTH,
      height: 0.7,
      fontSize: 26,
      color: titleColor,
      fontFamily: theme.tipografia.titulo,
      bold: true,
      align: 'center',
      valign: 'middle',
      text: slide.titulo,
    },
    pasos,
  };
}

function layoutQuizPreguntaSlide(slide: QuizOpcionMultipleSlide, theme: PptTheme): RenderableQuizPreguntaSlide {
  const titleColor = resolverColorTexto(theme.colores.primario, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const preguntaColor = resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const opcionColor = resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const opcionFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 16);
  const preguntaFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 18);

  const opciones: TextRect[] = slide.opciones.map((opt, i) => {
    const startY = SLIDE_HEIGHT * 0.35 + i * 0.5;
    return {
      x: MARGIN + 0.5,
      y: startY,
      width: CONTENT_WIDTH - 1.0,
      height: 0.4,
      fontSize: opcionFontSize,
      color: opcionColor,
      fontFamily: theme.tipografia.cuerpo,
      align: 'left' as const,
      valign: 'middle' as const,
      text: `${String.fromCharCode(65 + i)}) ${opt}`,
    };
  });

  return {
    layout: 'quiz_pregunta',
    background: theme.colores.fondo,
    titulo: {
      x: MARGIN,
      y: MARGIN,
      width: CONTENT_WIDTH,
      height: 0.5,
      fontSize: 22,
      color: titleColor,
      fontFamily: theme.tipografia.titulo,
      bold: true,
      align: 'center',
      valign: 'middle',
      text: 'Quiz — Opción múltiple',
    },
    pregunta: {
      x: MARGIN,
      y: SLIDE_HEIGHT * 0.35 - 0.2,
      width: CONTENT_WIDTH,
      height: 0.5,
      fontSize: preguntaFontSize,
      color: preguntaColor,
      fontFamily: theme.tipografia.cuerpo,
      align: 'left',
      valign: 'middle',
      text: slide.pregunta,
    },
    opciones,
  };
}

function layoutQuizRespuestaSlide(slide: QuizOpcionMultipleSlide, theme: PptTheme): RenderableQuizRespuestaSlide {
  const titleColor = resolverColorTexto(theme.colores.primario, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const correctColor = resolverColorTexto('#006400', theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const neutralColor = resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const resultadoFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 18);
  const explicacionFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 14);

  const opcionColor = slide.opciones.map((_, i) =>
    i === slide.respuestaCorrectaIndex ? correctColor : neutralColor
  );

  return {
    layout: 'quiz_respuesta',
    background: theme.colores.fondo,
    titulo: {
      x: MARGIN,
      y: MARGIN,
      width: CONTENT_WIDTH,
      height: 0.5,
      fontSize: 22,
      color: titleColor,
      fontFamily: theme.tipografia.titulo,
      bold: true,
      align: 'center',
      valign: 'middle',
      text: 'Respuesta',
    },
    resultado: {
      x: MARGIN + 0.5,
      y: SLIDE_HEIGHT * 0.3,
      width: CONTENT_WIDTH - 1.0,
      height: 1.0,
      fontSize: resultadoFontSize,
      color: correctColor,
      fontFamily: theme.tipografia.cuerpo,
      align: 'left',
      valign: 'middle',
      text: `La respuesta correcta es: ${String.fromCharCode(65 + slide.respuestaCorrectaIndex)}) ${slide.opciones[slide.respuestaCorrectaIndex] ?? ''}`,
    },
    explicacion: {
      x: MARGIN,
      y: SLIDE_HEIGHT * 0.55,
      width: CONTENT_WIDTH,
      height: 1.5,
      fontSize: explicacionFontSize,
      color: neutralColor,
      fontFamily: theme.tipografia.cuerpo,
      align: 'left',
      valign: 'top',
      text: slide.explicacion ?? 'Revisa el contenido de la clase.',
    },
  };
}

function layoutVerdaderoFalsoPreguntaSlide(slide: VerdaderoFalsoSlide, theme: PptTheme): RenderableVerdaderoFalsoPreguntaSlide {
  const titleColor = resolverColorTexto(theme.colores.primario, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const afirmacionColor = resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const opcionFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 18);

  const opciones: TextRect[] = [
    {
      x: MARGIN + 0.5,
      y: SLIDE_HEIGHT * 0.45,
      width: CONTENT_WIDTH / 2 - 1.0,
      height: 1.5,
      fontSize: opcionFontSize,
      color: resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo),
      fontFamily: theme.tipografia.cuerpo,
      align: 'center',
      valign: 'middle',
      text: 'VERDADERO',
    },
    {
      x: MARGIN + CONTENT_WIDTH / 2 + 0.5,
      y: SLIDE_HEIGHT * 0.45,
      width: CONTENT_WIDTH / 2 - 1.0,
      height: 1.5,
      fontSize: opcionFontSize,
      color: resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo),
      fontFamily: theme.tipografia.cuerpo,
      align: 'center',
      valign: 'middle',
      text: 'FALSO',
    },
  ];

  return {
    layout: 'verdadero_falso_pregunta',
    background: theme.colores.fondo,
    titulo: {
      x: MARGIN,
      y: MARGIN,
      width: CONTENT_WIDTH,
      height: 0.5,
      fontSize: 22,
      color: titleColor,
      fontFamily: theme.tipografia.titulo,
      bold: true,
      align: 'center',
      valign: 'middle',
      text: 'Verdadero o Falso',
    },
    afirmacion: {
      x: MARGIN + 0.5,
      y: SLIDE_HEIGHT * 0.3,
      width: CONTENT_WIDTH - 1.0,
      height: 0.8,
      fontSize: 20,
      color: afirmacionColor,
      fontFamily: theme.tipografia.cuerpo,
      align: 'center',
      valign: 'middle',
      text: slide.afirmacion,
    },
    opciones,
  };
}

function layoutVerdaderoFalsoRespuestaSlide(slide: VerdaderoFalsoSlide, theme: PptTheme): RenderableVerdaderoFalsoRespuestaSlide {
  const titleColor = resolverColorTexto(theme.colores.primario, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const correctColor = resolverColorTexto('#006400', theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const neutralColor = resolverColorTexto(theme.colores.texto, theme.colores.fondo, theme.colores.textoSobreFondoOscuro, theme.reglasDUA.contrasteMinimo);
  const resultadoFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 20);
  const explicacionFontSize = Math.max(theme.reglasDUA.tamanoFuenteMinimoPt, 14);

  const esCorrecto = slide.esVerdadero;

  return {
    layout: 'verdadero_falso_respuesta',
    background: theme.colores.fondo,
    titulo: {
      x: MARGIN,
      y: MARGIN,
      width: CONTENT_WIDTH,
      height: 0.5,
      fontSize: 22,
      color: titleColor,
      fontFamily: theme.tipografia.titulo,
      bold: true,
      align: 'center',
      valign: 'middle',
      text: 'Respuesta',
    },
    resultado: {
      x: MARGIN + 0.5,
      y: SLIDE_HEIGHT * 0.3,
      width: CONTENT_WIDTH - 1.0,
      height: 1.5,
      fontSize: resultadoFontSize,
      color: correctColor,
      fontFamily: theme.tipografia.cuerpo,
      align: 'center',
      valign: 'middle',
      text: esCorrecto ? '✅ VERDADERO' : '❌ FALSO',
    },
    explicacion: {
      x: MARGIN,
      y: SLIDE_HEIGHT * 0.55,
      width: CONTENT_WIDTH,
      height: 1.5,
      fontSize: explicacionFontSize,
      color: neutralColor,
      fontFamily: theme.tipografia.cuerpo,
      align: 'left',
      valign: 'top',
      text: slide.explicacion ?? 'Revisa el contenido de la clase.',
    },
  };
}

export function buildRenderableDeck(deck: PptDeck, theme?: PptTheme): RenderableSlide[] {
  const resolvedTheme = ensureTheme(theme);

  const result: RenderableSlide[] = [];

  for (const slide of deck.slides) {
    switch (slide.layout) {
      case 'title':
        result.push(layoutTitleSlide(slide, resolvedTheme));
        break;
      case 'bullets':
        result.push(layoutBulletsSlide(slide, resolvedTheme));
        break;
      case 'image_text':
        result.push(layoutImageTextSlide(slide, resolvedTheme));
        break;
      case 'comparison':
        result.push(layoutComparisonSlide(slide, resolvedTheme));
        break;
      case 'quote':
        result.push(layoutQuoteSlide(slide, resolvedTheme));
        break;
      case 'vocabulario':
        result.push(layoutVocabularioSlide(slide, resolvedTheme));
        break;
      case 'ciclo_proceso':
        result.push(layoutCicloProcesoSlide(slide, resolvedTheme));
        break;
      case 'quiz_opcion_multiple': {
        const safeSlide = safeQuizOPC(slide);
        result.push(layoutQuizPreguntaSlide(safeSlide, resolvedTheme));
        result.push(layoutQuizRespuestaSlide(safeSlide, resolvedTheme));
        break;
      }
      case 'verdadero_falso': {
        const safeSlide = safeVerdaderoFalso(slide);
        result.push(layoutVerdaderoFalsoPreguntaSlide(safeSlide, resolvedTheme));
        result.push(layoutVerdaderoFalsoRespuestaSlide(safeSlide, resolvedTheme));
        break;
      }
    }
  }

  return result;
}

function safeQuizOPC(slide: QuizOpcionMultipleSlide): QuizOpcionMultipleSlide {
  const safeOpciones = slide.opciones && slide.opciones.length > 0
    ? slide.opciones
    : ['Opción A', 'Opción B', 'Opción C'];
  const safeIndex = slide.respuestaCorrectaIndex >= 0 && slide.respuestaCorrectaIndex < safeOpciones.length
    ? slide.respuestaCorrectaIndex
    : 0;
  return { ...slide, opciones: safeOpciones, respuestaCorrectaIndex: safeIndex };
}

function safeVerdaderoFalso(slide: VerdaderoFalsoSlide): VerdaderoFalsoSlide {
  return {
    ...slide,
    afirmacion: slide.afirmacion || 'Sin afirmación',
  };
}
