import PptxGenJS from 'pptxgenjs';
import type { SlideLesson, Slide, SlideType, SlideDiagram, SlideTable } from '../types/slideLesson';

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
    // For external URLs (not data: or same-origin), PptxGenJS may fail due to CORS
    // Data URLs and same-origin URLs work reliably
    if (imageUrl.startsWith('data:') || imageUrl.startsWith(window.location.origin)) {
      slide.addImage({ path: imageUrl, ...opts });
    } else {
      // External images may fail in PPTX export due to CORS restrictions
      // The image will be silently skipped
      console.warn('[pptxExportService] Skipping external image (CORS restriction):', imageUrl.slice(0, 80));
    }
  } catch {
    // Silently ignore broken images
  }
}

const DIAGRAM_COLORS = ['213885', '5F3475', '893172', '3B82F6', '10B981', 'F59E0B'];

function addProcessDiagram(slide: PptxGenJS.Slide, diagram: SlideDiagram) {
  const nodeW = 1.8;
  const nodeH = 0.8;
  const gap = 0.4;
  const arrowW = 0.5;
  const totalW = diagram.nodes.length * nodeW + (diagram.nodes.length - 1) * (gap + arrowW);
  const startX = (SLIDE_WIDTH - totalW) / 2;
  const y = (SLIDE_HEIGHT - nodeH) / 2;

  diagram.nodes.forEach((node, i) => {
    const x = startX + i * (nodeW + gap + arrowW);
    const color = DIAGRAM_COLORS[i % DIAGRAM_COLORS.length];

    slide.addShape('roundRect', {
      x, y, w: nodeW, h: nodeH,
      fill: { color },
      rectRadius: 0.1,
      shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.3 },
    });

    slide.addText(node.label, {
      x, y, w: nodeW, h: nodeH,
      fontSize: 11, color: 'FFFFFF', bold: true,
      align: 'center', valign: 'middle', fontFace: 'Arial',
    });

    if (i < diagram.nodes.length - 1) {
      const arrowX = x + nodeW;
      slide.addShape('rightArrow', {
        x: arrowX, y: y + nodeH / 2 - 0.15, w: arrowW, h: 0.3,
        fill: { color: 'CCCACC' },
      });
    }
  });
}

function addCycleDiagram(slide: PptxGenJS.Slide, diagram: SlideDiagram) {
  const cx = SLIDE_WIDTH / 2;
  const cy = SLIDE_HEIGHT / 2;
  const radius = 2.2;
  const nodeR = 0.7;

  diagram.nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / diagram.nodes.length - Math.PI / 2;
    const x = cx + radius * Math.cos(angle) - nodeR / 2;
    const y = cy + radius * Math.sin(angle) - nodeR / 2;
    const color = DIAGRAM_COLORS[i % DIAGRAM_COLORS.length];

    slide.addShape('ellipse', {
      x, y, w: nodeR, h: nodeR,
      fill: { color },
      shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.3 },
    });

    slide.addText(node.label, {
      x: x - 0.3, y: y - 0.2, w: nodeR + 0.6, h: nodeR + 0.4,
      fontSize: 9, color: 'FFFFFF', bold: true,
      align: 'center', valign: 'middle', fontFace: 'Arial',
    });
  });
}

function addHierarchyDiagram(slide: PptxGenJS.Slide, diagram: SlideDiagram) {
  const nodeW = 1.5;
  const nodeH = 0.6;
  const levelH = 1.0;

  diagram.nodes.forEach((node, i) => {
    const level = i === 0 ? 0 : Math.floor(Math.log2(i + 1));
    const nodesInLevel = diagram.nodes.filter((_, idx) => {
      if (idx === 0) return level === 0;
      return Math.floor(Math.log2(idx + 1)) === level;
    });
    const posInLevel = nodesInLevel.indexOf(node);
    const totalInLevel = nodesInLevel.length;

    const x = (SLIDE_WIDTH - totalInLevel * (nodeW + 0.3)) / 2 + posInLevel * (nodeW + 0.3);
    const y = 1.0 + level * levelH;
    const color = DIAGRAM_COLORS[i % DIAGRAM_COLORS.length];

    slide.addShape('roundRect', {
      x, y, w: nodeW, h: nodeH,
      fill: { color },
      rectRadius: 0.08,
      shadow: { type: 'outer', blur: 3, offset: 1, color: '000000', opacity: 0.25 },
    });

    slide.addText(node.label, {
      x, y, w: nodeW, h: nodeH,
      fontSize: 10, color: 'FFFFFF', bold: true,
      align: 'center', valign: 'middle', fontFace: 'Arial',
    });

    if (i > 0) {
      const parentIdx = Math.floor((i - 1) / 2);
      const parentNode = diagram.nodes[parentIdx];
      if (parentNode) {
        const pLevel = parentIdx === 0 ? 0 : Math.floor(Math.log2(parentIdx + 1));
        const pNodesInLevel = diagram.nodes.filter((_, idx) => {
          if (idx === 0) return pLevel === 0;
          return Math.floor(Math.log2(idx + 1)) === pLevel;
        });
        const pPosInLevel = pNodesInLevel.indexOf(parentNode);
        const pTotalInLevel = pNodesInLevel.length;
        const px = (SLIDE_WIDTH - pTotalInLevel * (nodeW + 0.3)) / 2 + pPosInLevel * (nodeW + 0.3) + nodeW / 2;
        const py = 1.0 + pLevel * levelH + nodeH;

        slide.addShape('line', {
          x: px, y: py, w: 0, h: levelH - nodeH,
          line: { color: 'CCCACC', width: 1.5 },
        });
      }
    }
  });
}

function addTableToSlide(slide: PptxGenJS.Slide, table: SlideTable) {
  const startX = 1.0;
  const startY = 1.5;
  const colW = Math.min(2.5, (SLIDE_WIDTH - 2.0) / table.headers.length);

  const headerRow = table.headers.map(h => ({
    text: h,
    options: { fontSize: 11, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'center' as const, valign: 'middle' as const },
  }));

  const dataRows = table.rows.map(row =>
    row.map(cell => ({
      text: cell,
      options: { fontSize: 10, color: '1A1A2E', fontFace: 'Arial', align: 'left' as const, valign: 'middle' as const },
    }))
  );

  slide.addTable([headerRow, ...dataRows], {
    x: startX, y: startY,
    w: colW * table.headers.length,
    colW: Array(table.headers.length).fill(colW),
    border: { type: 'solid', pt: 0.5, color: 'CCCACC' },
    rowH: [0.5, ...Array(table.rows.length).fill(0.4)],
    autoPage: false,
  });
}

function addDiagramOrTable(slide: PptxGenJS.Slide, slideData: Slide) {
  if (slideData.diagram) {
    const diagram = slideData.diagram;
    switch (diagram.type) {
      case 'process':
        addProcessDiagram(slide, diagram);
        break;
      case 'cycle':
        addCycleDiagram(slide, diagram);
        break;
      case 'hierarchy':
        addHierarchyDiagram(slide, diagram);
        break;
      case 'comparison':
        addProcessDiagram(slide, diagram);
        break;
    }
  } else if (slideData.table) {
    addTableToSlide(slide, slideData.table);
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

    // Diagram or Table
    addDiagramOrTable(slide, slideData);

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

  const result = await pptx.write({ outputType: 'blob' });
  if (result instanceof Blob) return result;
  throw new Error('Unexpected return type from pptx.write');
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