import PptxGenJS from 'pptxgenjs';
import type { PremiumPresentation, PremiumSlide, SubjectTheme } from './premiumPptModel';
import { getSubjectTheme } from './premiumPptModel';

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

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

function addGradientBackground(slide: PptxGenJS.Slide, theme: SubjectTheme, variant: 'dark' | 'light' | 'accent' = 'dark') {
  if (variant === 'dark') {
    slide.background = { color: theme.primary };
    const shape: PptxGenJS.ShapeProps = {
      x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
      fill: { color: darken(theme.primary, 0.15) },
      rectRadius: 0,
    };
    slide.addShape('rect', shape);
    const deco: PptxGenJS.ShapeProps = {
      x: SLIDE_W * 0.6, y: -1, w: SLIDE_W * 0.6, h: SLIDE_H + 2,
      fill: { color: theme.secondary, transparency: 70 },
      rectRadius: 0,
    };
    slide.addShape('rect', deco);
  } else if (variant === 'accent') {
    slide.background = { color: theme.background };
    const bar: PptxGenJS.ShapeProps = {
      x: 0, y: 0, w: SLIDE_W, h: 0.15,
      fill: { color: theme.primary },
      rectRadius: 0,
    };
    slide.addShape('rect', bar);
    const side: PptxGenJS.ShapeProps = {
      x: 0, y: 0, w: 0.15, h: SLIDE_H,
      fill: { color: theme.primary },
      rectRadius: 0,
    };
    slide.addShape('rect', side);
  } else {
    slide.background = { color: theme.background };
  }
}

function addDecorativeCircles(slide: PptxGenJS.Slide, theme: SubjectTheme) {
  const circles: PptxGenJS.ShapeProps[] = [
    { x: SLIDE_W - 2.5, y: -1, w: 4, h: 4, fill: { color: theme.accent, transparency: 60 } },
    { x: SLIDE_W - 1.5, y: SLIDE_H - 2, w: 3, h: 3, fill: { color: theme.secondary, transparency: 70 } },
    { x: -1, y: SLIDE_H - 1.5, w: 2.5, h: 2.5, fill: { color: theme.accent, transparency: 80 } },
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

  const card: PptxGenJS.ShapeProps = {
    ...pos,
    fill: { color: theme.secondary, transparency: 80 },
    rectRadius: 0.2,
    line: { color: theme.accent, width: 2, dashType: 'dash' },
  };
  slide.addShape('rect', card);

  slide.addText(`🎨 ${keyword}`, {
    ...pos,
    fontSize: 14, align: 'center', valign: 'middle',
    color: theme.text, fontFace: 'Arial',
    italic: true,
  });

  slide.addText('[ Imagen futura ]', {
    x: pos.x, y: pos.y + pos.h - 0.5, w: pos.w, h: 0.4,
    fontSize: 9, align: 'center', valign: 'middle',
    color: theme.text, fontFace: 'Arial',
    transparency: 50,
  });
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
      breakType: 'none' as const,
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
  addGradientBackground(s, theme, 'dark');
  addDecorativeCircles(s, theme);

  s.addText(slide.title, {
    x: 1.0, y: 1.8, w: 11.3, h: 2.0,
    fontSize: 40, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial',
  });

  s.addText(slide.subtitle || `${pres.nivel} — ${pres.asignatura}`, {
    x: 1.5, y: 3.8, w: 10.3, h: 0.8,
    fontSize: 18, color: theme.accent, align: 'center', fontFace: 'Arial',
  });

  s.addText(`OA: ${pres.oa}`, {
    x: 2.0, y: 4.6, w: 9.3, h: 0.6,
    fontSize: 12, color: 'CCCCCC', align: 'center', fontFace: 'Arial',
    italic: true,
  });

  addVisualPlaceholder(s, slide.visualKeyword || pres.tema, theme, 'center');
  addFooter(s, pres.nivel, pres.asignatura);
}

function buildHookSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  addGradientBackground(s, theme, 'dark');

  addSlideTitle(s, slide.title, theme);
  if (slide.subtitle) addSlideSubtitle(s, slide.subtitle, theme);

  if (slide.bullets?.length) {
    addBullets(s, slide.bullets, { x: 0.6, y: 1.6, w: 6.5, h: 4.5, color: 'FFFFFF' });
  }

  addVisualPlaceholder(s, slide.visualKeyword || 'activación', theme, 'right');

  if (slide.studentPrompt) {
    s.addText(slide.studentPrompt, {
      x: 0.8, y: 6.0, w: 11.7, h: 0.7,
      fontSize: 13, italic: true, color: theme.accent, fontFace: 'Arial',
      fill: { color: theme.primary, transparency: 60 },
      rectRadius: 0.1,
    });
  }

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildObjectiveSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  addGradientBackground(s, theme, 'accent');

  const titleColor = theme.primary;
  s.addText(slide.title, {
    x: 0.6, y: 0.3, w: 12.1, h: 0.8,
    fontSize: 28, bold: true, color: titleColor, align: 'left', fontFace: 'Arial',
  });

  const oaBox: PptxGenJS.ShapeProps = {
    x: 0.8, y: 1.3, w: 11.7, h: 1.5,
    fill: { color: theme.primary, transparency: 90 },
    rectRadius: 0.15,
    line: { color: theme.primary, width: 2 },
  };
  s.addShape('rect', oaBox);

  s.addText(`📋 ${slide.subtitle || pres.oa}`, {
    x: 1.0, y: 1.4, w: 11.3, h: 1.3,
    fontSize: 16, color: theme.text, fontFace: 'Arial',
    valign: 'middle',
  });

  if (slide.studentPrompt) {
    const promptBox: PptxGenJS.ShapeProps = {
      x: 0.8, y: 3.2, w: 11.7, h: 1.2,
      fill: { color: theme.secondary, transparency: 80 },
      rectRadius: 0.15,
    };
    s.addShape('rect', promptBox);

    s.addText(`💬 "${slide.studentPrompt}"`, {
      x: 1.0, y: 3.3, w: 11.3, h: 1.0,
      fontSize: 18, italic: true, color: theme.primary, fontFace: 'Arial',
      valign: 'middle',
    });
  }

  if (slide.bullets?.length) {
    addBullets(s, slide.bullets, { x: 0.8, y: 4.8, w: 11.7, h: 2.0, fontSize: 15, color: theme.text });
  }

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildConceptCardsSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  addGradientBackground(s, theme, 'light');

  s.addText(slide.title, {
    x: 0.6, y: 0.3, w: 12.1, h: 0.8,
    fontSize: 28, bold: true, color: theme.primary, align: 'left', fontFace: 'Arial',
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.6, y: 1.0, w: 12.1, h: 0.5,
      fontSize: 14, color: theme.text, fontFace: 'Arial', italic: true, transparency: 30,
    });
  }

  const items = slide.bullets || [];
  const cols = items.length <= 3 ? items.length : 3;
  const rows = Math.ceil(items.length / cols);
  const cardW = (12.1 - (cols - 1) * 0.3) / cols;
  const cardH = rows <= 1 ? 4.5 : (5.0 - (rows - 1) * 0.3) / rows;

  items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 0.6 + col * (cardW + 0.3);
    const y = 1.7 + row * (cardH + 0.3);

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
      fontSize: 22, bold: true, color: theme.primary, fontFace: 'Arial',
    });

    s.addText(item, {
      x: x + 0.15, y: y + 0.7, w: cardW - 0.3, h: cardH - 0.9,
      fontSize: 13, color: theme.text, fontFace: 'Arial',
      valign: 'top',
    });
  });

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildVisualExplanationSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  addGradientBackground(s, theme, 'dark');

  addSlideTitle(s, slide.title, theme);

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.6, y: 1.0, w: 12.1, h: 0.5,
      fontSize: 14, color: theme.accent, fontFace: 'Arial', italic: true,
    });
  }

  if (slide.bullets?.length) {
    addBullets(s, slide.bullets, { x: 7.0, y: 1.6, w: 5.8, h: 4.5, color: 'FFFFFF' });
  }

  addVisualPlaceholder(s, slide.visualKeyword || pres.tema, theme, 'left');
  addFooter(s, pres.nivel, pres.asignatura);
}

function buildGuidedActivitySlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  addGradientBackground(s, theme, 'accent');

  s.addText(slide.title, {
    x: 0.6, y: 0.3, w: 12.1, h: 0.8,
    fontSize: 28, bold: true, color: theme.primary, align: 'left', fontFace: 'Arial',
  });

  const stepsBox: PptxGenJS.ShapeProps = {
    x: 0.6, y: 1.3, w: 7.5, h: 5.0,
    fill: { color: 'FFFFFF' },
    rectRadius: 0.15,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.08 },
  };
  s.addShape('rect', stepsBox);

  if (slide.bullets?.length) {
    const stepTexts = slide.bullets.map((b, i) => ({
      text: `Paso ${i + 1}: ${b}`,
      options: {
        fontSize: 15, color: theme.text, fontFace: 'Arial',
        bullet: false,
        paraSpaceAfter: 12,
      },
    }));
    s.addText(stepTexts, { x: 0.9, y: 1.5, w: 7.0, h: 4.5, valign: 'top' });
  }

  addVisualPlaceholder(s, slide.visualKeyword || 'paso a paso', theme, 'right');

  if (slide.studentPrompt) {
    s.addText(slide.studentPrompt, {
      x: 0.8, y: 6.4, w: 11.7, h: 0.5,
      fontSize: 12, italic: true, color: theme.primary, fontFace: 'Arial',
    });
  }

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildCollaborativeActivitySlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  addGradientBackground(s, theme, 'dark');

  addSlideTitle(s, slide.title, theme);

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.6, y: 1.0, w: 12.1, h: 0.5,
      fontSize: 14, color: theme.accent, fontFace: 'Arial', italic: true,
    });
  }

  if (slide.bullets?.length) {
    addBullets(s, slide.bullets, { x: 0.6, y: 1.6, w: 7.0, h: 4.5, color: 'FFFFFF' });
  }

  const iconCards = [
    { icon: '👥', text: 'Trabajo en equipo' },
    { icon: '💬', text: 'Comunicación' },
    { icon: '🎯', text: 'Producto final' },
  ];
  iconCards.forEach((ic, i) => {
    const x = 8.5 + i * 0.0;
    const y = 1.8 + i * 1.6;
    addIconCard(s, ic.icon, ic.text, theme, x, y, 4.2, 1.3);
  });

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildDuaSupportsSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  addGradientBackground(s, theme, 'accent');

  s.addText(slide.title, {
    x: 0.6, y: 0.3, w: 12.1, h: 0.8,
    fontSize: 28, bold: true, color: theme.primary, align: 'left', fontFace: 'Arial',
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.6, y: 1.0, w: 12.1, h: 0.5,
      fontSize: 14, color: theme.text, fontFace: 'Arial', italic: true,
    });
  }

  const duaCards = [
    { icon: '👁️', title: 'Representación', desc: 'Información en múltiples formatos: texto, imagen, audio, video, manipulación' },
    { icon: '✋', title: 'Acción y Expresión', desc: 'Opciones para demostrar aprendizaje: oral, escrita, visual, digital' },
    { icon: '❤️', title: 'Implicación', desc: 'Motivación y relevancia: elección, autonomía, conexión personal' },
  ];

  duaCards.forEach((card, i) => {
    const x = 0.6 + i * 4.1;
    const y = 1.7;
    const w = 3.8;
    const h = 4.5;

    const cardBg: PptxGenJS.ShapeProps = {
      x, y, w, h,
      fill: { color: 'FFFFFF' },
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
      fontSize: 36, align: 'center', fontFace: 'Segoe UI Emoji',
    });

    s.addText(card.title, {
      x, y: y + 1.3, w, h: 0.6,
      fontSize: 16, bold: true, color: theme.primary, align: 'center', fontFace: 'Arial',
    });

    s.addText(card.desc, {
      x: x + 0.2, y: y + 2.0, w: w - 0.4, h: 2.2,
      fontSize: 12, color: theme.text, align: 'center', fontFace: 'Arial',
      valign: 'top',
    });
  });

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildFormativeAssessmentSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  addGradientBackground(s, theme, 'accent');

  s.addText(slide.title, {
    x: 0.6, y: 0.3, w: 12.1, h: 0.8,
    fontSize: 28, bold: true, color: theme.primary, align: 'left', fontFace: 'Arial',
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.6, y: 1.0, w: 12.1, h: 0.5,
      fontSize: 14, color: theme.text, fontFace: 'Arial', italic: true,
    });
  }

  if (slide.bullets?.length) {
    const bulletTexts = slide.bullets.map((b, i) => ({
      text: `✅  ${b}`,
      options: {
        fontSize: 15, color: theme.text, fontFace: 'Arial',
        paraSpaceAfter: 14,
      },
    }));
    s.addText(bulletTexts, { x: 0.8, y: 1.7, w: 11.5, h: 4.0, valign: 'top' });
  }

  if (slide.studentPrompt) {
    const ticketBox: PptxGenJS.ShapeProps = {
      x: 0.8, y: 5.5, w: 11.7, h: 1.2,
      fill: { color: theme.primary, transparency: 90 },
      rectRadius: 0.15,
      line: { color: theme.primary, width: 2 },
    };
    s.addShape('rect', ticketBox);

    s.addText(`🎫 Ticket de salida: "${slide.studentPrompt}"`, {
      x: 1.0, y: 5.6, w: 11.3, h: 1.0,
      fontSize: 14, bold: true, color: theme.primary, fontFace: 'Arial',
      valign: 'middle',
    });
  }

  addFooter(s, pres.nivel, pres.asignatura);
}

function buildClosureSlide(pptx: PptxGenJS, slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) {
  const s = pptx.addSlide();
  addGradientBackground(s, theme, 'dark');
  addDecorativeCircles(s, theme);

  s.addText(slide.title, {
    x: 1.0, y: 1.5, w: 11.3, h: 1.0,
    fontSize: 36, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial',
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 1.5, y: 2.5, w: 10.3, h: 0.6,
      fontSize: 16, color: theme.accent, align: 'center', fontFace: 'Arial',
    });
  }

  if (slide.bullets?.length) {
    addBullets(s, slide.bullets, { x: 2.0, y: 3.3, w: 9.3, h: 2.5, fontSize: 15, color: 'DDDDDD' });
  }

  if (slide.studentPrompt) {
    s.addText(`"${slide.studentPrompt}"`, {
      x: 2.0, y: 5.8, w: 9.3, h: 0.7,
      fontSize: 14, italic: true, color: theme.accent, align: 'center', fontFace: 'Arial',
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
