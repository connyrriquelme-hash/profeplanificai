import PptxGenJS from 'pptxgenjs';
import type { SlideLesson, Slide, SlideType } from '../types/slideLesson';

const SLIDE_WIDTH = 13.333;
const SLIDE_HEIGHT = 7.5;

type LayoutSection = {
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
  color: string;
  align?: 'left' | 'center';
  bold?: boolean;
  bulletChar?: string;
};

type SlideLayoutConfig = {
  title: LayoutSection;
  subtitle?: LayoutSection;
  body?: LayoutSection;
  bullets?: LayoutSection;
  image?: { x: number; y: number; w: number; h: number };
};

const LAYOUTS: Record<SlideType, SlideLayoutConfig> = {
  cover: {
    title: { x: 1.5, y: 1.8, w: 10.3, h: 2.5, fontSize: 40, bold: true, color: 'FFFFFF', align: 'center' },
    subtitle: { x: 1.5, y: 4.5, w: 10.3, h: 1.0, fontSize: 18, color: 'CCCCCC', align: 'center' },
    image: { x: 0, y: 0, w: 13.333, h: 7.5 },
  },
  activation: {
    title: { x: 0.6, y: 0.4, w: 5.8, h: 0.8, fontSize: 28, bold: true, color: 'FFFFFF', align: 'left' },
    body: { x: 0.6, y: 1.4, w: 5.8, h: 5.2, fontSize: 16, color: 'FFFFFF' },
    bullets: { x: 0.6, y: 1.4, w: 5.8, h: 5.2, fontSize: 16, color: 'FFFFFF', bulletChar: '•' },
    image: { x: 6.8, y: 0.5, w: 6.0, h: 6.5 },
  },
  explanation: {
    title: { x: 6.8, y: 0.4, w: 5.8, h: 0.8, fontSize: 28, bold: true, color: 'FFFFFF', align: 'left' },
    body: { x: 6.8, y: 1.4, w: 5.8, h: 5.2, fontSize: 16, color: 'FFFFFF' },
    image: { x: 0.5, y: 0.5, w: 6.0, h: 6.5 },
  },
  'guided-practice': {
    title: { x: 0.6, y: 0.3, w: 12.1, h: 0.7, fontSize: 26, bold: true, color: 'FFFFFF', align: 'center' },
    bullets: { x: 0.6, y: 1.2, w: 12.1, h: 5.5, fontSize: 16, color: 'FFFFFF', bulletChar: '•' },
  },
  'independent-practice': {
    title: { x: 0.6, y: 0.3, w: 12.1, h: 0.7, fontSize: 26, bold: true, color: 'FFFFFF', align: 'center' },
    bullets: { x: 0.6, y: 1.2, w: 12.1, h: 5.5, fontSize: 15, color: 'FFFFFF', bulletChar: '•' },
  },
  'formative-assessment': {
    title: { x: 0.6, y: 0.3, w: 12.1, h: 0.7, fontSize: 26, bold: true, color: 'FFFFFF', align: 'center' },
    bullets: { x: 0.6, y: 1.2, w: 12.1, h: 5.5, fontSize: 15, color: 'FFFFFF', bulletChar: '✓' },
  },
  closure: {
    title: { x: 1.5, y: 1.2, w: 10.3, h: 1.0, fontSize: 32, bold: true, color: 'FFFFFF', align: 'center' },
    body: { x: 1.5, y: 2.5, w: 10.3, h: 3.5, fontSize: 18, color: 'FFFFFF', align: 'center' },
    image: { x: 0, y: 0, w: 13.333, h: 7.5 },
  },
};

const PALETTE: Record<string, { bg: string; accent: string }> = {
  cover: { bg: '5B21B6', accent: 'F5E6FF' },
  activation: { bg: 'F59E0B', accent: 'FEF3C7' },
  explanation: { bg: '0D9488', accent: 'CCFBF1' },
  'guided-practice': { bg: '10B981', accent: 'D1FAE5' },
  'independent-practice': { bg: 'F43F5E', accent: 'FCE7F3' },
  'formative-assessment': { bg: 'D946EF', accent: 'FAE8FF' },
  closure: { bg: '475569', accent: 'E2E8F0' },
};

function addBackground(slide: PptxGenJS.Slide, type: SlideType) {
  const palette = PALETTE[type] || PALETTE.cover;
  slide.background = { color: palette.bg };
}

function addText(slide: PptxGenJS.Slide, text: string, opts: PptxGenJS.TextPropsOptions) {
  if (!text?.trim()) return;
  slide.addText(text, opts);
}

function addBullets(slide: PptxGenJS.Slide, bullets: string[], opts: PptxGenJS.TextPropsOptions, bulletChar = '•') {
  if (!bullets?.length) return;
  const text = bullets.map(b => `${bulletChar} ${b}`).join('\n');
  slide.addText(text, opts);
}

function addImage(slide: PptxGenJS.Slide, imageUrl: string, opts: PptxGenJS.ImageProps) {
  if (!imageUrl) return;
  try {
    slide.addImage({ path: imageUrl, ...opts });
  } catch {
    // Silently ignore broken images
  }
}

export async function exportLessonToPPTX(
  lesson: SlideLesson,
  imagesRecord: Record<string, string>
): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  lesson.slides.forEach((slideData, index) => {
    const type = slideData.type;
    const layout = LAYOUTS[type];
    const palette = PALETTE[type] || PALETTE.cover;
    const slide = pptx.addSlide();

    slide.background = { color: palette.bg };

    // Title
    if (slideData.title) {
      addText(slide, slideData.title, {
        x: layout.title.x,
        y: layout.title.y,
        w: layout.title.w,
        h: layout.title.h,
        fontSize: layout.title.fontSize,
        bold: layout.title.bold,
        color: layout.title.color,
        align: layout.title.align,
        fontFace: 'Arial',
      });
    }

    // Subtitle
    if (slideData.subtitle && layout.subtitle) {
      addText(slide, slideData.subtitle, {
        x: layout.subtitle!.x,
        y: layout.subtitle!.y,
        w: layout.subtitle!.w,
        h: layout.subtitle!.h,
        fontSize: layout.subtitle!.fontSize,
        color: layout.subtitle!.color,
        align: layout.subtitle!.align,
        fontFace: 'Arial',
      });
    }

    // Body content (activity, example)
    const bodyText = slideData.activity || slideData.example;
    if (bodyText && layout.body) {
      addText(slide, slideData.example ? `Ejemplo: ${slideData.example}` : bodyText, {
        x: layout.body!.x,
        y: layout.body!.y,
        w: layout.body!.w,
        h: layout.body!.h,
        fontSize: layout.body!.fontSize,
        color: layout.body!.color,
        align: 'left',
        fontFace: 'Arial',
      });
    }

    // Bullets
    if (slideData.bullets?.length && layout.bullets) {
      addBullets(slide, slideData.bullets, {
        x: layout.bullets.x,
        y: layout.bullets.y,
        w: layout.bullets.w,
        h: layout.bullets.h,
        fontSize: layout.bullets.fontSize,
        color: layout.bullets.color,
        fontFace: 'Arial',
        lineSpacing: 1.3,
      }, layout.bullets.bulletChar);
    }

    // Questions
    if (slideData.questions?.length && layout.body) {
      const qText = slideData.questions.map((q, i) => `P${i + 1}: ${q}`).join('\n');
      addText(slide, qText, {
        x: layout.body!.x,
        y: layout.body!.y + (layout.body!.h * 0.6),
        w: layout.body!.w,
        h: layout.body!.h * 0.4,
        fontSize: layout.body!.fontSize - 2,
        color: palette.accent,
        fontFace: 'Arial',
      });
    }

    // Materials
    if (slideData.materials?.length && layout.body) {
      const mText = 'Materiales: ' + slideData.materials.join(', ');
      addText(slide, mText, {
        x: layout.body!.x,
        y: layout.body!.y + (layout.body!.h * 0.8),
        w: layout.body!.w,
        h: layout.body!.h * 0.2,
        fontSize: layout.body!.fontSize - 4,
        color: palette.accent,
        fontFace: 'Arial',
      });
    }

    // Success Criteria
    if (slideData.successCriteria?.length && layout.bullets) {
      addBullets(slide, slideData.successCriteria, {
        x: layout.bullets.x,
        y: layout.bullets.y + (layout.bullets.h * 0.5),
        w: layout.bullets.w,
        h: layout.bullets.h * 0.5,
        fontSize: layout.bullets.fontSize - 2,
        color: palette.accent,
        fontFace: 'Arial',
      }, '✓');
    }

    // Metacognition / Exit Ticket
    const metaText = slideData.metacognition || slideData.exitTicket;
    if (metaText && layout.body) {
      addText(slide, metaText, {
        x: layout.body!.x,
        y: layout.body!.y + (layout.body!.h * 0.8),
        w: layout.body!.w,
        h: layout.body!.h * 0.2,
        fontSize: layout.body!.fontSize - 2,
        color: palette.accent,
        fontFace: 'Arial',
        italic: true,
      });
    }

    // Instructions
    if (slideData.instructions && layout.body) {
      addText(slide, `Instrucciones: ${slideData.instructions}`, {
        x: layout.body!.x,
        y: layout.body!.y + (layout.body!.h * 0.8),
        w: layout.body!.w,
        h: layout.body!.h * 0.2,
        fontSize: layout.body!.fontSize - 4,
        color: palette.accent,
        fontFace: 'Arial',
      });
    }

    // Image
    const imageKey = `${index}`;
    const imageUrl = imagesRecord[imageKey];
    if (imageUrl && layout.image) {
      try {
        slide.addImage({
          path: imageUrl,
          x: layout.image.x,
          y: layout.image.y,
          w: layout.image.w,
          h: layout.image.h,
          sizing: { type: 'cover', w: layout.image.w, h: layout.image.h },
        });
      } catch {
        // Silently ignore broken images
      }
    }

    // Speaker Notes
    if (slideData.speakerNotes) {
      slide.addNotes(slideData.speakerNotes);
    }

    // Footer metadata
    const footerText = `${lesson.course} | ${lesson.subject} | ${lesson.objectiveCode}`;
    addText(slide, footerText, {
      x: 0.3,
      y: 7.1,
      w: 12.7,
      h: 0.3,
      fontSize: 8,
      color: '888888',
      align: 'center',
      fontFace: 'Arial',
    });
  });

  return await pptx.write({ outputType: 'blob' }) as Blob;
}

export async function downloadPPTX(lesson: SlideLesson, imagesRecord: Record<string, string>, filename?: string) {
  const blob = await exportLessonToPPTX(lesson, imagesRecord);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${lesson.title.replace(/[^a-z0-9]/gi, '_')}.pptx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}