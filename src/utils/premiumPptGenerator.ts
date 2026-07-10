import PptxGenJS from 'pptxgenjs';
import type { PremiumPresentation, PremiumSlide, SubjectTheme } from './premiumPptModel';
import { getSubjectTheme, isChildMode, getPictogramForSlide } from './premiumPptModel';

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

const SUBJECT_ICONS: Record<string, string> = {
  'celula': '🧬', 'planta': '🌱', 'semilla': '🌱', 'flor': '🌸', 'poliniz': '🐝',
  'animal': '🦋', 'ecosistema': '🌿', 'ciclo': '🔄', 'fotosintesis': '☀️',
  'numero': '🔢', 'suma': '➕', 'resta': '➖', 'multiplic': '✖️', 'divis': '➗',
  'fraccion': '📊', 'geometr': '📐', 'figura': '🔷', 'angulo': '📐',
  'texto': '📖', 'lectura': '📖', 'escritura': '✍️', 'palabra': '🔤', 'cuento': '📚', 'historia': '📜',
  'personaje': '👤', 'narrativa': '📝', 'poema': '🎭', 'rima': '🎵',
  'mapa': '🗺️', 'chile': '🇨🇱', 'indigena': '🏞️', 'colonia': '⛪', 'independencia': '🎖️',
  'ingles': '🇬🇧', 'english': '🇬🇧', 'vocabulario': '📝', 'gramatica': '📐',
  'color': '🎨', 'forma': '🔷', 'textura': '🖌️', 'composicion': '🖼️', 'dibujo': '✏️', 'pintura': '🖌️',
  'ritmo': '🥁', 'melodia': '🎵', 'instrumento': '🎸', 'cancion': '🎤', 'partitura': '🎼',
'movimiento': '🏃', 'deporte': '⚽', 'ejercicio': '💪', 'salud': '❤️', 'equipo': '🤝',
  'tecnologia': '💻', 'programa': '💻', 'robot': '🤖', 'diseno': '🎨', 'prototipo': '🔧',
  'filosof': '🤔', 'etica': '⚖️', 'argumento': '💬', 'pregunta': '❓', 'razon': '🧠',
  'fuerza': '⚡', 'energia': '⚡', 'onda': '🌊', 'luz': '💡', 'electricidad': '⚡',
  'atomo': '⚛️', 'molecula': '🧪', 'reaccion': '⚗️', 'elemento': '🧪',
  'ciudadan': '🏛️', 'derecho': '⚖️', 'deber': '📋', 'participa': '🗳️', 'comunidad': '👥', 'convivencia': '🤝',
  'identidad': '👶', 'cuerpo': '🤸',
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function darken(hex: string, amount: number): string {
  const c = hexToRgb(hex);
  const r = Math.max(0, Math.round(c.r * (1 - amount)));
  const g = Math.max(0, Math.round(c.g * (1 - amount)));
  const b = Math.max(0, Math.round(c.b * (1 - amount)));
  return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lighten(hex: string, amount: number): string {
  const c = hexToRgb(hex);
  const r = Math.min(255, Math.round(c.r + (255 - c.r) * amount));
  const g = Math.min(255, Math.round(c.g + (255 - c.g) * amount));
  const b = Math.min(255, Math.round(c.b + (255 - c.b) * amount));
  return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getContrastColor(backgroundHex: string): string {
  const c = hexToRgb(backgroundHex);
  const luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  return luminance > 0.5 ? '000000' : 'FFFFFF';
}

function getTitleColor(theme: SubjectTheme, variant: 'dark' | 'light' | 'accent' = 'dark'): string {
  if (variant === 'dark') return 'FFFFFF';
  if (variant === 'accent') return theme.primary;
  return getContrastColor(theme.background);
}

function getBodyColor(theme: SubjectTheme, variant: 'dark' | 'light' | 'accent' = 'dark'): string {
  if (variant === 'dark') return 'FFFFFF';
  if (variant === 'accent') return theme.text;
  return getContrastColor(theme.background);
}

// Safe contrast helpers for child mode - ensure readable text on any background
function getSafeTitleColor(theme: SubjectTheme, backgroundHex: string): string {
  const c = hexToRgb(backgroundHex);
  const luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  // Force dark text on light backgrounds, white on dark
  if (luminance > 0.6) return theme.text; // Dark text for light backgrounds
  if (luminance > 0.4) return '1E1B4B'; // Dark navy for medium backgrounds
  return 'FFFFFF'; // White for dark backgrounds
}

function getSafeBodyColor(theme: SubjectTheme, backgroundHex: string): string {
  const c = hexToRgb(backgroundHex);
  const luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  if (luminance > 0.6) return theme.text;
  if (luminance > 0.4) return '3B0764';
  return 'FFFFFF';
}

function getChildModeBackground(theme: SubjectTheme): string {
  // Soft pastel background for child mode
  return lighten(theme.background, 0.3);
}

function isParvularia(oaText: string, subject: string): boolean {
  const oaLower = oaText.toLowerCase();
  const subLower = subject.toLowerCase();
  return subLower.includes('parvularia') || 
         subLower.includes('sala cuna') ||
         subLower.includes('kinder') ||
         subLower.includes('identidad') || 
         subLower.includes('convivencia') || 
         subLower.includes('corporalidad') ||
         oaLower.includes('rutina') || 
         oaLower.includes('vida cotidiana') || 
         oaLower.includes('actividad habitual') ||
         oaLower.includes('alimentación') || 
         oaLower.includes('alimentacion') ||
         oaLower.includes('dormir') || 
         oaLower.includes('preparación') || 
         oaLower.includes('preparacion') ||
         subLower.includes('parvularia') ||
         subLower.includes('sala cuna') ||
         subLower.includes('kinder') ||
         subLower.includes('identidad') || 
         subLower.includes('convivencia') || 
         subLower.includes('corporalidad');
}

function addRichBackground(slide: PptxGenJS.Slide, theme: SubjectTheme, variant: 'dark' | 'light' | 'accent' = 'dark', isParvularia: boolean = false) {
  if (variant === 'dark') {
    slide.background = { color: theme.primary };
    const base: PptxGenJS.ShapeProps = {
      x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
      fill: { color: darken(theme.primary, 0.08) },
      rectRadius: 0,
    };
    slide.addShape('rect', base);
    const grad1: PptxGenJS.ShapeProps = {
      x: SLIDE_W * 0.55, y: -1.5, w: SLIDE_W * 0.7, h: SLIDE_H + 3,
      fill: { color: theme.secondary, transparency: 75 },
      rectRadius: 0,
    };
    slide.addShape('rect', grad1);
    const grad2: PptxGenJS.ShapeProps = {
      x: -1, y: SLIDE_H * 0.6, w: SLIDE_W * 0.5, h: SLIDE_H * 0.6,
      fill: { color: theme.accent, transparency: 80 },
      rectRadius: 0,
    };
    slide.addShape('rect', grad2);
    const circle1: PptxGenJS.ShapeProps = {
      x: SLIDE_W - 3, y: -2, w: 5, h: 5,
      fill: { color: theme.accent, transparency: 65 },
      line: { width: 0 },
    };
    slide.addShape('ellipse', circle1);
    const circle2: PptxGenJS.ShapeProps = {
      x: -1.5, y: SLIDE_H - 3, w: 6, h: 6,
      fill: { color: theme.secondary, transparency: 70 },
      line: { width: 0 },
    };
    slide.addShape('ellipse', circle2);
  } else if (variant === 'accent') {
    slide.background = { color: theme.background };
    const topBar: PptxGenJS.ShapeProps = {
      x: 0, y: 0, w: SLIDE_W, h: 0.18,
      fill: { color: theme.primary },
      rectRadius: 0,
    };
    slide.addShape('rect', topBar);
    const sideBar: PptxGenJS.ShapeProps = {
      x: 0, y: 0, w: 0.18, h: SLIDE_H,
      fill: { color: theme.primary },
      rectRadius: 0,
    };
    slide.addShape('rect', sideBar);
    const accentCircle: PptxGenJS.ShapeProps = {
      x: SLIDE_W - 2.5, y: -1, w: 4, h: 4,
      fill: { color: theme.accent, transparency: 55 },
      line: { width: 0 },
    };
    slide.addShape('ellipse', accentCircle);
    const bottomAccent: PptxGenJS.ShapeProps = {
      x: 0, y: SLIDE_H - 0.12, w: SLIDE_W, h: 0.12,
      fill: { color: theme.primary, transparency: 60 },
      rectRadius: 0,
    };
    slide.addShape('rect', bottomAccent);
  } else {
    slide.background = { color: theme.background };
    const topGlow: PptxGenJS.ShapeProps = {
      x: 0, y: 0, w: SLIDE_W, h: 0.15,
      fill: { color: theme.primary },
      rectRadius: 0,
    };
    slide.addShape('rect', topGlow);
    const sideGlow: PptxGenJS.ShapeProps = {
      x: 0, y: 0, w: 0.12, h: SLIDE_H,
      fill: { color: theme.primary },
      rectRadius: 0,
    };
    slide.addShape('rect', sideGlow);
    const cornerCircle: PptxGenJS.ShapeProps = {
      x: SLIDE_W - 2, y: -1, w: 3.5, h: 3.5,
      fill: { color: theme.accent, transparency: 60 },
      line: { width: 0 },
    };
    slide.addShape('ellipse', cornerCircle);
    const bottomLine: PptxGenJS.ShapeProps = {
      x: 0, y: SLIDE_H - 0.1, w: SLIDE_W, h: 0.1,
      fill: { color: theme.primary, transparency: 50 },
      rectRadius: 0,
    };
    slide.addShape('rect', bottomLine);
  }
}

function addDecorativeElements(slide: PptxGenJS.Slide, theme: SubjectTheme) {
  const circles: PptxGenJS.ShapeProps[] = [
    { x: SLIDE_W - 2.2, y: -1, w: 3.5, h: 3.5, fill: { color: theme.accent, transparency: 75 }, line: { width: 0 } },
    { x: SLIDE_W - 1.2, y: SLIDE_H - 2, w: 2.8, h: 2.8, fill: { color: theme.secondary, transparency: 82 }, line: { width: 0 } },
    { x: -1, y: SLIDE_H - 1.3, w: 2.2, h: 2.2, fill: { color: theme.accent, transparency: 88 }, line: { width: 0 } },
  ];
  circles.forEach(c => slide.addShape('ellipse', { ...c, line: { width: 0 } }));
}

function addIconCard(slide: PptxGenJS.Slide, icon: string, keyword: string, theme: SubjectTheme, x: number, y: number, w: number, h: number) {
  const card: PptxGenJS.ShapeProps = {
    x, y, w, h,
    fill: { color: 'FFFFFF', transparency: 15 },
    rectRadius: 0.15,
    shadow: { type: 'outer', blur: 6, offset: 2, color: '000000', opacity: 0.1 },
  };
  slide.addShape('rect', card);

  slide.addText(icon, {
    x, y: y + 0.2, w, h: h * 0.5,
    fontSize: 36, align: 'center', valign: 'middle',
    fontFace: 'Segoe UI Emoji',
  });

  slide.addText(keyword, {
    x, y: y + h * 0.5, w, h: h * 0.4,
    fontSize: 11, align: 'center', valign: 'top',
    color: theme.text, fontFace: 'Arial',
    bold: true,
  });
}

function addVisualPlaceholder(slide: PptxGenJS.Slide, keyword: string, theme: SubjectTheme, layout: 'left' | 'right' | 'center') {
  const positions: Record<string, { x: number; y: number; w: number; h: number }> = {
    left: { x: 0.4, y: 1.2, w: 5.5, h: 5.5 },
    right: { x: 7.4, y: 1.2, w: 5.5, h: 5.5 },
    center: { x: 3.5, y: 1.0, w: 6.3, h: 4.0 },
  };
  const pos = positions[layout];

  const bg: PptxGenJS.ShapeProps = {
    ...pos,
    fill: { color: theme.primary, transparency: 10 },
    rectRadius: 0.25,
  };
  slide.addShape('rect', bg);

  const innerBorder: PptxGenJS.ShapeProps = {
    x: pos.x + 0.08, y: pos.y + 0.08, w: pos.w - 0.16, h: pos.h - 0.16,
    fill: { color: 'FFFFFF', transparency: 85 },
    rectRadius: 0.2,
    line: { color: theme.secondary, width: 1.5 },
  };
  slide.addShape('rect', innerBorder);

  const decoCircle: PptxGenJS.ShapeProps = {
    x: pos.x + pos.w * 0.3, y: pos.y + pos.h * 0.15, w: pos.w * 0.4, h: pos.w * 0.4,
    fill: { color: theme.secondary, transparency: 70 },
    line: { width: 0 },
  };
  slide.addShape('ellipse', decoCircle);

  slide.addText('🎨', {
    x: pos.x, y: pos.y + pos.h * 0.1, w: pos.w, h: pos.h * 0.45,
    fontSize: 48, align: 'center', valign: 'middle',
    fontFace: 'Segoe UI Emoji',
  });

  slide.addText(keyword, {
    x: pos.x + 0.3, y: pos.y + pos.h * 0.55, w: pos.w - 0.6, h: pos.h * 0.25,
    fontSize: 13, align: 'center', valign: 'middle',
    color: theme.text, fontFace: 'Arial',
    bold: true,
  });

  slide.addText('Contenido visual premium', {
    x: pos.x, y: pos.y + pos.h - 0.55, w: pos.w, h: 0.4,
    fontSize: 9, align: 'center', valign: 'middle',
    color: theme.text, fontFace: 'Arial',
    transparency: 40, italic: true,
  });
}

function addImageOrPlaceholder(slide: PptxGenJS.Slide, imageUrl: string | undefined, keyword: string, theme: SubjectTheme, layout: 'left' | 'right' | 'center') {
  const positions: Record<string, { x: number; y: number; w: number; h: number }> = {
    left: { x: 0.4, y: 1.2, w: 5.5, h: 5.5 },
    right: { x: 7.4, y: 1.2, w: 5.5, h: 5.5 },
    center: { x: 3.5, y: 1.0, w: 6.3, h: 4.0 },
  };
  const pos = positions[layout];

  if (imageUrl) {
    try {
      slide.addImage({
        data: imageUrl,
        x: pos.x, y: pos.y, w: pos.w, h: pos.h,
        rounding: true,
        sizing: { type: 'contain', w: pos.w, h: pos.h },
      });
      return;
    } catch {
      // fallback to premium visual
    }
  }

  addVisualPlaceholder(slide, keyword, theme, layout);
}

function addTable(slide: PptxGenJS.Slide, headers: string[], rows: string[][], opts: { x: number; y: number; w: number; h: number }, theme: SubjectTheme, caption?: string) {
  const headerRow = headers.map(h => ({
    text: h,
    options: {
      bold: true, fontSize: 11, color: 'FFFFFF', fontFace: 'Arial',
      fill: { color: theme.primary },
      align: 'center' as const,
      valign: 'middle' as const,
    },
  }));

  const dataRows = rows.map(row =>
    row.map(cell => ({
      text: cell,
      options: {
        fontSize: 10, color: theme.text, fontFace: 'Arial',
        valign: 'middle' as const,
      },
    }))
  );

  slide.addTable([headerRow, ...dataRows], {
    x: opts.x, y: opts.y, w: opts.w,
    border: { type: 'solid', pt: 0.5, color: theme.accent },
    colW: headers.map(() => opts.w / headers.length),
    rowH: 0.4,
    autoPage: false,
  });

  if (caption) {
    slide.addText(caption, {
      x: opts.x, y: opts.y + rows.length * 0.4 + 0.6, w: opts.w, h: 0.3,
      fontSize: 9, italic: true, color: theme.text, fontFace: 'Arial',
      align: 'center',
    });
  }
}

function addSlideTitle(slide: PptxGenJS.Slide, title: string, theme: SubjectTheme, opts?: { x?: number; y?: number; w?: number; color?: string }) {
  slide.addText(title, {
    x: opts?.x ?? 0.6, y: opts?.y ?? 0.3, w: opts?.w ?? 12.1, h: 0.8,
    fontSize: 28, bold: true, color: opts?.color ?? 'FFFFFF', align: 'left',
    fontFace: 'Arial',
  });
}

function addSlideSubtitle(slide: PptxGenJS.Slide, subtitle: string, theme: SubjectTheme) {
  slide.addText(subtitle, {
    x: 0.6, y: 1.0, w: 12.1, h: 0.5,
    fontSize: 14, color: theme.text, fontFace: 'Arial',
    italic: true, transparency: 30,
  });
}

function addBullets(slide: PptxGenJS.Slide, bullets: string[], opts: { x: number; y: number; w: number; h: number; fontSize?: number; color?: string }) {
  if (!bullets?.length) return;
  const text = bullets.map(b => ({
    text: `  ${b}`,
    options: {
      fontSize: opts.fontSize || 16,
      color: opts.color || 'FFFFFF',
      fontFace: 'Arial',
      bullet: { code: '2022', color: opts.color || 'FFFFFF' },
      paraSpaceAfter: 8,
    },
  }));
  slide.addText(text, { x: opts.x, y: opts.y, w: opts.w, h: opts.h, valign: 'top' });
}

function addFooter(slide: PptxGenJS.Slide, nivel: string, subject: string) {
  slide.addText(`ProfePlanificAI  |  ${nivel}  |  ${subject}`, {
    x: 0.3, y: 7.05, w: 12.7, h: 0.35,
    fontSize: 8, color: '888888', align: 'center', fontFace: 'Arial',
  });
}

function addSlideNumber(slide: PptxGenJS.Slide, num: number, total: number) {
  slide.addText(`${num} / ${total}`, {
    x: 12.2, y: 7.05, w: 1, h: 0.35,
    fontSize: 8, color: 'AAAAAA', align: 'right', fontFace: 'Arial',
  });
}

function buildCoverSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  const isChild = slide.isChildMode ?? isParvularia(pres.oa, pres.asignatura);
  addRichBackground(s, theme, 'dark', isChild);
  addDecorativeElements(s, theme);

  const titleBg: PptxGenJS.ShapeProps = {
    x: 1.5, y: 1.5, w: 10.3, h: 2.4,
    fill: { color: '000000', transparency: 30 },
    rectRadius: 0.2,
  };
  s.addShape('rect', titleBg);

  // Pictogram for child mode
  if (isChild && slide.pictogram) {
    s.addText(slide.pictogram, {
      x: 1.0, y: 0.4, w: 11.3, h: 1.2,
      fontSize: 48, align: 'center', fontFace: 'Arial',
    });
  }

  s.addText(slide.title, {
    x: 1.0, y: isChild ? 1.8 : 1.6, w: 11.3, h: 2.2,
    fontSize: isChild ? 40 : 44, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial',
    lineSpacing: 1.1,
  });

  s.addText(slide.subtitle || `${pres.nivel} — ${pres.asignatura}`, {
    x: 1.5, y: isChild ? 4.2 : 4.0, w: 10.3, h: 0.8,
    fontSize: 18, color: theme.accent, align: 'center', fontFace: 'Arial',
    bold: false,
  });

  const oaBox: PptxGenJS.ShapeProps = {
    x: 2.5, y: isChild ? 5.3 : 5.1, w: 8.3, h: 0.7,
    fill: { color: theme.primary, transparency: 85 },
    rectRadius: 0.3,
    line: { color: theme.accent, width: 1.5, transparency: 20 },
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.1 },
  };
  s.addShape('rect', oaBox);

  s.addText(`OA: ${pres.oa}`, {
    x: 2.5, y: (isChild ? 5.3 : 5.15), w: 8.3, h: 0.6,
    fontSize: 14, color: 'FFFFFF', align: 'center', fontFace: 'Arial',
    bold: true,
  });

  addImageOrPlaceholder(s, slide.imageUrl, slide.visualKeyword || pres.tema, theme, 'center');
  addSlideNumber(s, 1, pres.slides.length);
  addFooter(s, pres.nivel, pres.asignatura);
}

function buildHookSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  const isChild = slide.isChildMode ?? isParvularia(pres.oa, pres.asignatura);
  addRichBackground(s, theme, 'dark', isChild);

  // Pictogram for child mode
  if (isChild && slide.pictogram) {
    s.addText(slide.pictogram, {
      x: 0.6, y: 0.3, w: 12.1, h: 0.8,
      fontSize: 32, align: 'left', fontFace: 'Arial',
    });
  }

  addSlideTitle(s, slide.title, theme);
  if (slide.subtitle) addSlideSubtitle(s, slide.subtitle, theme);

  if (slide.bullets?.length) {
    addBullets(s, slide.bullets, { x: 0.6, y: isChild ? 2.0 : 1.6, w: 6.5, h: 4.5, color: 'FFFFFF', fontSize: isChild ? 18 : 16 });
  }

  addImageOrPlaceholder(s, slide.imageUrl, slide.visualKeyword || 'activación', theme, 'right');

  if (slide.studentPrompt) {
    s.addText(slide.studentPrompt, {
      x: 0.8, y: 6.0, w: 11.7, h: 0.7,
      fontSize: isChild ? 16 : 13, italic: true, color: theme.accent, fontFace: 'Arial',
      fill: { color: theme.primary, transparency: 60 },
      rectRadius: 0.1,
    });
  }

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildObjectiveSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  const isChild = slide.isChildMode ?? isParvularia(pres.oa, pres.asignatura);
  addRichBackground(s, theme, 'accent', isChild);

  // Pictogram for child mode
  if (isChild && slide.pictogram) {
    s.addText(slide.pictogram, {
      x: 0.6, y: 0.3, w: 12.1, h: 0.8,
      fontSize: 32, align: 'left', fontFace: 'Arial',
    });
  }

  const titleColor = isChild ? getSafeTitleColor(theme, theme.background) : theme.primary;
  s.addText(slide.title, {
    x: 0.6, y: 0.3, w: 12.1, h: 0.8,
    fontSize: isChild ? 32 : 28, bold: true, color: titleColor, align: 'left', fontFace: 'Arial',
  });

  const oaBox: PptxGenJS.ShapeProps = {
    x: 0.8, y: isChild ? 1.6 : 1.3, w: 11.7, h: isChild ? 1.8 : 1.5,
    fill: { color: theme.primary, transparency: 90 },
    rectRadius: 0.15,
    line: { color: theme.primary, width: 2 },
  };
  s.addShape('rect', oaBox);

  const bodyColor = isChild ? getSafeBodyColor(theme, theme.background) : theme.text;
  s.addText(`📋 ${slide.subtitle || pres.oa}`, {
    x: 1.0, y: isChild ? 1.7 : 1.4, w: 11.3, h: isChild ? 1.6 : 1.3,
    fontSize: isChild ? 18 : 16, color: bodyColor, fontFace: 'Arial',
    valign: 'middle',
  });

  if (slide.studentPrompt) {
    const promptBox: PptxGenJS.ShapeProps = {
      x: 0.8, y: isChild ? 3.8 : 3.2, w: 11.7, h: 1.2,
      fill: { color: theme.secondary, transparency: 80 },
      rectRadius: 0.15,
    };
    s.addShape('rect', promptBox);

    s.addText(`💬 "${slide.studentPrompt}"`, {
      x: 1.0, y: isChild ? 3.9 : 3.3, w: 11.3, h: 1.0,
      fontSize: isChild ? 20 : 18, italic: true, color: theme.primary, fontFace: 'Arial',
      valign: 'middle',
    });
  }

  if (slide.bullets?.length) {
    addBullets(s, slide.bullets, { 
      x: 0.8, 
      y: isChild ? 5.4 : 4.8, 
      w: 11.7, 
      h: isChild ? 1.5 : 2.0, 
      fontSize: isChild ? 16 : 15, 
      color: isChild ? getSafeBodyColor(theme, theme.background) : theme.text 
    });
  }

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildConceptCardsSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  const isChild = slide.isChildMode ?? isParvularia(pres.oa, pres.asignatura);
  addRichBackground(s, theme, isChild ? 'light' : 'light');
  // Softer background for child mode
  if (isChild) {
    s.background = { color: getChildModeBackground(theme) };
  }

  const titleColor = isChild ? getSafeTitleColor(theme, isChild ? getChildModeBackground(theme) : theme.background) : theme.primary;
  const bodyColor = isChild ? getSafeBodyColor(theme, isChild ? getChildModeBackground(theme) : theme.background) : theme.text;

  // Pictogram for child mode
  if (isChild && slide.pictogram) {
    s.addText(slide.pictogram, {
      x: 11.5, y: 0.1, w: 1.5, h: 1.0,
      fontSize: 48, align: 'right', fontFace: 'Arial',
    });
  }

  s.addText(slide.title, {
    x: 0.6, y: 0.3, w: isChild ? 10.5 : 12.1, h: 0.8,
    fontSize: isChild ? 32 : 28, bold: true, color: titleColor, align: 'left', fontFace: 'Arial',
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.6, y: 1.0, w: 12.1, h: 0.5,
      fontSize: isChild ? 16 : 14, color: bodyColor, fontFace: 'Arial', italic: true, transparency: isChild ? 0 : 30,
    });
  }

  if (slide.table) {
    addTable(s, slide.table.headers, slide.table.rows, { x: 0.6, y: isChild ? 2.0 : 1.7, w: 12.1, h: isChild ? 4.0 : 4.5 }, theme, slide.table.caption);
  } else {
    const items = slide.bullets || [];
    const cols = items.length <= 3 ? items.length : 3;
    const rows = Math.ceil(items.length / cols);
    const cardW = (12.1 - (cols - 1) * 0.3) / cols;
    const cardH = rows <= 1 ? (isChild ? 3.5 : 4.5) : ((isChild ? 4.5 : 5.0) - (rows - 1) * 0.3) / rows;

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 0.6 + col * (cardW + 0.3);
      const y = (isChild ? 2.0 : 1.7) + row * (cardH + 0.3);

      const card: PptxGenJS.ShapeProps = {
        x, y, w: cardW, h: cardH,
        fill: { color: 'FFFFFF' },
        rectRadius: 0.15,
        shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.08 },
        line: { color: theme.accent, width: 1 },
      };
      s.addShape('rect', card);

      const accentBar: PptxGenJS.ShapeProps = {
        x, y, w: cardW, h: 0.08,
        fill: { color: theme.primary },
        rectRadius: 0,
      };
      s.addShape('rect', accentBar);

      s.addText(`0${i + 1}`, {
        x: x + 0.15, y: y + 0.2, w: 0.6, h: 0.5,
        fontSize: isChild ? 26 : 22, bold: true, color: theme.primary, fontFace: 'Arial',
      });

      s.addText(item, {
        x: x + 0.15, y: y + 0.7, w: cardW - 0.3, h: cardH - 0.9,
        fontSize: isChild ? 15 : 13, color: bodyColor, fontFace: 'Arial',
        valign: 'top',
      });
    });
  }

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildVisualExplanationSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  const isChild = slide.isChildMode ?? isParvularia(pres.oa, pres.asignatura);
  addRichBackground(s, theme, isChild ? 'dark' : 'dark', isChild);

  // Pictogram for child mode
  if (isChild && slide.pictogram) {
    s.addText(slide.pictogram, {
      x: 0.6, y: 0.3, w: 12.1, h: 0.8,
      fontSize: 32, align: 'left', fontFace: 'Arial',
    });
  }

  const titleY = isChild ? 0.5 : 0.3;
  s.addText(slide.title, {
    x: 0.6, y: titleY, w: 12.1, h: 0.8,
    fontSize: isChild ? 32 : 28, bold: true, color: isChild ? getSafeTitleColor(theme, theme.primary) : 'FFFFFF', align: 'left', fontFace: 'Arial',
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.6, y: isChild ? 1.2 : 1.0, w: 12.1, h: 0.5,
      fontSize: 14, color: isChild ? getSafeBodyColor(theme, theme.primary) : theme.accent, fontFace: 'Arial', italic: true,
    });
  }

  if (slide.bullets?.length) {
    const bulletColor = isChild ? getSafeBodyColor(theme, theme.primary) : 'FFFFFF';
    addBullets(s, slide.bullets, { x: 0.6, y: isChild ? 1.8 : 1.6, w: isChild ? 11.5 : 5.8, h: 4.5, color: bulletColor, fontSize: isChild ? 18 : 16 });
  }

  if (!isChild) {
    addImageOrPlaceholder(s, slide.imageUrl, slide.visualKeyword || pres.tema, theme, 'left');
  } else {
    // For child mode, put image on right and bullets full width
    addImageOrPlaceholder(s, slide.imageUrl, slide.visualKeyword || pres.tema, theme, 'right');
  }
  addFooter(s, pres.nivel, pres.asignatura);
}

function buildGuidedActivitySlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  const isChild = slide.isChildMode ?? isParvularia(pres.oa, pres.asignatura);
  addRichBackground(s, theme, 'accent', isChild);

  // Pictogram for child mode
  if (isChild && slide.pictogram) {
    s.addText(slide.pictogram, {
      x: 0.6, y: 0.3, w: 12.1, h: 0.8,
      fontSize: 32, align: 'left', fontFace: 'Arial',
    });
  }

  const titleColor = isChild ? getSafeTitleColor(theme, theme.background) : theme.primary;
  s.addText(slide.title, {
    x: 0.6, y: isChild ? 0.5 : 0.3, w: 12.1, h: 0.8,
    fontSize: isChild ? 32 : 28, bold: true, color: titleColor, align: 'left', fontFace: 'Arial',
  });

  const stepsBox: PptxGenJS.ShapeProps = {
    x: 0.6, y: isChild ? 1.5 : 1.3, w: isChild ? 11.5 : 7.5, h: 5.0,
    fill: { color: isChild ? getChildModeBackground(theme) : 'FFFFFF' },
    rectRadius: 0.15,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.08 },
  };
  s.addShape('rect', stepsBox);

  if (slide.bullets?.length) {
    const stepTexts = slide.bullets.map((b, i) => ({
      text: `${isChild ? 'Paso' : 'Paso'} ${i + 1}: ${b}`,
      options: {
        fontSize: isChild ? 18 : 15, 
        color: isChild ? getSafeBodyColor(theme, getChildModeBackground(theme)) : theme.text, 
        fontFace: 'Arial',
        bullet: false,
        paraSpaceAfter: 12,
      },
    }));
    s.addText(stepTexts, { x: isChild ? 1.0 : 0.9, y: isChild ? 1.7 : 1.5, w: isChild ? 10.9 : 7.0, h: 4.5, valign: 'top' });
  }

  if (!isChild) {
    addImageOrPlaceholder(s, slide.imageUrl, slide.visualKeyword || 'paso a paso', theme, 'right');
  }

  if (slide.studentPrompt) {
    s.addText(slide.studentPrompt, {
      x: 0.8, y: 6.4, w: 11.7, h: 0.5,
      fontSize: isChild ? 14 : 12, italic: true, color: isChild ? getSafeBodyColor(theme, theme.background) : theme.primary, fontFace: 'Arial',
    });
  }

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildCollaborativeActivitySlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  const isChild = slide.isChildMode ?? isParvularia(pres.oa, pres.asignatura);
  addRichBackground(s, theme, 'dark', isChild);

  // Pictogram for child mode
  if (isChild && slide.pictogram) {
    s.addText(slide.pictogram, {
      x: 0.6, y: 0.3, w: 12.1, h: 0.8,
      fontSize: 32, align: 'left', fontFace: 'Arial',
    });
  }

  addSlideTitle(s, slide.title, theme);

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.6, y: isChild ? 1.2 : 1.0, w: 12.1, h: 0.5,
      fontSize: 14, color: isChild ? getSafeBodyColor(theme, theme.primary) : theme.accent, fontFace: 'Arial', italic: true,
    });
  }

  if (slide.bullets?.length) {
    const bulletColor = isChild ? getSafeBodyColor(theme, theme.primary) : 'FFFFFF';
    addBullets(s, slide.bullets, { x: 0.6, y: isChild ? 1.8 : 1.6, w: 7.0, h: 4.5, color: bulletColor, fontSize: isChild ? 18 : 16 });
  }

  if (!isChild) {
    const iconCards = [
      { icon: '👥', text: 'Trabajo en equipo' },
      { icon: '💬', text: 'Comunicación' },
      { icon: '🎯', text: 'Producto final' },
    ];
    iconCards.forEach((ic, i) => {
      const x = 8.5;
      const y = 1.8 + i * 1.6;
      addIconCard(s, ic.icon, ic.text, theme, x, y, 4.2, 1.3);
    });
  } else {
    // Child mode: simpler icons
    const iconCards = [
      { icon: '👫', text: 'Juntos' },
      { icon: '🗣️', text: 'Hablamos' },
      { icon: '🏆', text: 'Logramos' },
    ];
    iconCards.forEach((ic, i) => {
      const x = 0.6 + i * 4.0;
      const y = 4.5;
      addIconCard(s, ic.icon, ic.text, theme, x, y, 3.8, 1.2);
    });
  }

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildDuaSupportsSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  const isChild = slide.isChildMode ?? isParvularia(pres.oa, pres.asignatura);
  addRichBackground(s, theme, 'accent', isChild);

  // Pictogram for child mode
  if (isChild && slide.pictogram) {
    s.addText(slide.pictogram, {
      x: 0.6, y: 0.3, w: 12.1, h: 0.8,
      fontSize: 32, align: 'left', fontFace: 'Arial',
    });
  }

  const titleColor = isChild ? getSafeTitleColor(theme, theme.background) : theme.primary;
  const bodyColor = isChild ? getSafeBodyColor(theme, theme.background) : theme.text;

  s.addText(slide.title, {
    x: 0.6, y: isChild ? 0.5 : 0.3, w: 12.1, h: 0.8,
    fontSize: isChild ? 32 : 28, bold: true, color: titleColor, align: 'left', fontFace: 'Arial',
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.6, y: isChild ? 1.2 : 1.0, w: 12.1, h: 0.5,
      fontSize: 14, color: bodyColor, fontFace: 'Arial', italic: true,
    });
  }

  const duaCards = isChild ? [
    { icon: '👁️', title: 'Vemos', desc: 'Imágenes, videos, objetos reales' },
    { icon: '✋', title: 'Hacemos', desc: 'Dibujamos, jugamos, mostramos' },
    { icon: '❤️', title: 'Queremos', desc: 'Elegimos, nos gusta, participamos' },
  ] : [
    { icon: '👁️', title: 'Representación', desc: 'Información en múltiples formatos: texto, imagen, audio, video, manipulación' },
    { icon: '✋', title: 'Acción y Expresión', desc: 'Opciones para demostrar aprendizaje: oral, escrita, visual, digital' },
    { icon: '❤️', title: 'Implicación', desc: 'Motivación y relevancia: elección, autonomía, conexión personal' },
  ];

  duaCards.forEach((card, i) => {
    const x = 0.6 + i * 4.1;
    const y = isChild ? 2.0 : 1.7;
    const w = 3.8;
    const h = isChild ? 4.0 : 4.5;

    const cardBg: PptxGenJS.ShapeProps = {
      x, y, w, h,
      fill: { color: isChild ? getChildModeBackground(theme) : 'FFFFFF' },
      rectRadius: 0.15,
      shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.08 },
    };
    s.addShape('rect', cardBg);

    const header: PptxGenJS.ShapeProps = {
      x, y, w, h: 0.08,
      fill: { color: theme.primary },
      rectRadius: 0,
    };
    s.addShape('rect', header);

    s.addText(card.icon, {
      x, y: y + 0.3, w, h: 1.0,
      fontSize: isChild ? 40 : 36, align: 'center', fontFace: 'Segoe UI Emoji',
    });

    s.addText(card.title, {
      x, y: y + 1.3, w, h: 0.6,
      fontSize: isChild ? 18 : 16, bold: true, color: theme.primary, align: 'center', fontFace: 'Arial',
    });

    s.addText(card.desc, {
      x: x + 0.2, y: y + 2.0, w: w - 0.4, h: isChild ? 1.8 : 2.2,
      fontSize: isChild ? 14 : 12, color: bodyColor, align: 'center', fontFace: 'Arial',
      valign: 'top',
    });
  });

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildFormativeAssessmentSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  const isChild = slide.isChildMode ?? isParvularia(pres.oa, pres.asignatura);
  addRichBackground(s, theme, 'accent', isChild);

  // Pictogram for child mode
  if (isChild && slide.pictogram) {
    s.addText(slide.pictogram, {
      x: 0.6, y: 0.3, w: 12.1, h: 0.8,
      fontSize: 32, align: 'left', fontFace: 'Arial',
    });
  }

  const titleColor = isChild ? getSafeTitleColor(theme, theme.background) : theme.primary;
  const bodyColor = isChild ? getSafeBodyColor(theme, theme.background) : theme.text;

  s.addText(slide.title, {
    x: 0.6, y: isChild ? 0.5 : 0.3, w: 12.1, h: 0.8,
    fontSize: isChild ? 32 : 28, bold: true, color: titleColor, align: 'left', fontFace: 'Arial',
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.6, y: isChild ? 1.2 : 1.0, w: 12.1, h: 0.5,
      fontSize: 14, color: bodyColor, fontFace: 'Arial', italic: true,
    });
  }

  if (slide.table) {
    addTable(s, slide.table.headers, slide.table.rows, { x: 0.8, y: isChild ? 2.0 : 1.7, w: 11.5, h: isChild ? 3.5 : 3.0 }, theme, slide.table.caption);
  } else if (slide.bullets?.length) {
    const bulletTexts = slide.bullets.map((b, i) => ({
      text: `${isChild ? '✅' : '✅'}  ${b}`,
      options: {
        fontSize: isChild ? 18 : 15, color: bodyColor, fontFace: 'Arial',
        paraSpaceAfter: 14,
      },
    }));
    s.addText(bulletTexts, { x: 0.8, y: isChild ? 2.0 : 1.7, w: 11.5, h: isChild ? 3.5 : 4.0, valign: 'top' });
  }

  if (slide.studentPrompt) {
    const ticketBox: PptxGenJS.ShapeProps = {
      x: 0.8, y: isChild ? 5.8 : 5.5, w: 11.7, h: 1.2,
      fill: { color: theme.primary, transparency: 90 },
      rectRadius: 0.15,
      line: { color: theme.primary, width: 2 },
    };
    s.addShape('rect', ticketBox);

    s.addText(`${isChild ? '🎨' : '🎫'} ${isChild ? 'Mi dibujo:' : 'Ticket de salida:'} "${slide.studentPrompt}"`, {
      x: 1.0, y: isChild ? 5.9 : 5.6, w: 11.3, h: 1.0,
      fontSize: isChild ? 16 : 14, bold: true, color: theme.primary, fontFace: 'Arial',
      valign: 'middle',
    });
  }

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildClosureSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  const isChild = slide.isChildMode ?? isParvularia(pres.oa, pres.asignatura);
  addRichBackground(s, theme, 'dark', isChild);
  addDecorativeElements(s, theme);

  // Pictogram for child mode
  if (isChild && slide.pictogram) {
    s.addText(slide.pictogram, {
      x: 1.0, y: 0.3, w: 11.3, h: 1.0,
      fontSize: 48, align: 'center', fontFace: 'Arial',
    });
  }

  s.addText(slide.title, {
    x: 1.0, y: isChild ? 1.8 : 1.5, w: 11.3, h: 1.0,
    fontSize: isChild ? 40 : 36, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial',
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 1.5, y: isChild ? 2.8 : 2.5, w: 10.3, h: 0.6,
      fontSize: 16, color: theme.accent, align: 'center', fontFace: 'Arial',
    });
  }

  if (slide.bullets?.length) {
    addBullets(s, slide.bullets, { x: 2.0, y: isChild ? 3.5 : 3.3, w: 9.3, h: 2.5, fontSize: isChild ? 18 : 15, color: 'DDDDDD' });
  }

  if (slide.studentPrompt) {
    s.addText(`"${slide.studentPrompt}"`, {
      x: 2.0, y: isChild ? 6.0 : 5.8, w: 9.3, h: 0.7,
      fontSize: isChild ? 16 : 14, italic: true, color: theme.accent, align: 'center', fontFace: 'Arial',
    });
  }

  addFooter(s, pres.nivel, pres.asignatura);
}

const BUILDERS: Record<string, (pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) => void> = {
  cover: buildCoverSlide,
  hook: buildHookSlide,
  objective: buildObjectiveSlide,
  concept_cards: buildConceptCardsSlide,
  visual_explanation: buildVisualExplanationSlide,
  guided_activity: buildGuidedActivitySlide,
  collaborative_activity: buildCollaborativeActivitySlide,
  dua_supports: buildDuaSupportsSlide,
  formative_assessment: buildFormativeAssessmentSlide,
  closure: buildClosureSlide,
};

export async function generatePremiumPptx(presentation: PremiumPresentation): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'ProfePlanificAI';
  pptx.subject = presentation.asignatura;
  pptx.title = presentation.title;

  const theme = getSubjectTheme(presentation.asignatura);

  for (const slide of presentation.slides) {
    const builder = BUILDERS[slide.layout];
    if (builder) {
      builder(pptx, slide, presentation, theme);
    } else {
      const s = pptx.addSlide();
      s.background = { color: theme.background };
      addSlideTitle(s, slide.title, theme);
      if (slide.bullets?.length) {
        addBullets(s, slide.bullets, { x: 0.6, y: 1.3, w: 12.1, h: 5.0, color: theme.text });
      }
      addFooter(s, presentation.nivel, presentation.asignatura);
    }
  }

  const result = await pptx.write({ outputType: 'blob' });
  if (result instanceof Blob) return result;
  throw new Error('Unexpected return type from pptx.write');
}

export function downloadPremiumPptx(presentation: PremiumPresentation, blob: Blob) {
  const safeName = `${presentation.asignatura}-${presentation.nivel}-${presentation.tema}`
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+$/, '')
    .toLowerCase()
    .slice(0, 60);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `presentacion-${safeName}.pptx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
