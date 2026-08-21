import type { PedagogicalProduct } from '../types';
import {
  type CanvasLayout,
  type CanvasElement,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  newElementId,
} from './types';

const MARGIN = 48;
const CONTENT_WIDTH = DEFAULT_CANVAS_WIDTH - MARGIN * 2;

/** Rough text-height estimate (Konva doesn't measure until it renders). */
function estimateTextHeight(text: string, fontSize: number, width = CONTENT_WIDTH): number {
  const charsPerLine = Math.max(10, Math.floor(width / (fontSize * 0.55)));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return lines * fontSize * 1.35 + 6;
}

interface TextBlock {
  heading?: string;
  body: string;
}

const SKIP_KEYS = new Set([
  'coverImageUrl', 'canvasLayout', 'editedHtml', 'images', 'imageTitles',
  'ai_model', 'generated_at', 'template_id', 'templateName', 'generatedBy',
]);

/** Flatten product.data into readable text blocks, in roughly reading order. */
function extractTextBlocks(product: PedagogicalProduct): TextBlock[] {
  const { data, type } = product;
  const blocks: TextBlock[] = [];

  if (typeof data.objective === 'string' && data.objective.trim() && type !== 'planificacion') {
    blocks.push({ heading: 'Objetivo de Aprendizaje', body: data.objective });
  }

  if (Array.isArray(data.sections)) {
    for (const raw of data.sections) {
      const section = raw as Record<string, unknown>;
      if (!section || typeof section !== 'object') continue;
      const title = typeof section.title === 'string' ? section.title : undefined;
      const content = typeof section.content === 'string' ? section.content : '';
      if (content.trim()) blocks.push({ heading: title, body: content });
      if (Array.isArray(section.activities)) {
        const acts = section.activities.filter((a: unknown) => typeof a === 'string') as string[];
        if (acts.length) blocks.push({ heading: 'Actividades', body: acts.map(a => `• ${a}`).join('\n') });
      }
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (SKIP_KEYS.has(key) || key === 'sections' || key === 'objective') continue;
    if (typeof value === 'string' && value.trim()) {
      blocks.push({ heading: formatLabel(key), body: value });
    } else if (Array.isArray(value) && value.length && value.every(v => typeof v === 'string')) {
      blocks.push({ heading: formatLabel(key), body: (value as string[]).map(v => `• ${v}`).join('\n') });
    }
  }

  return blocks;
}

function formatLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** Builds an initial CanvasLayout from a product's structured data + cover image. */
export function autoLayoutFromProduct(product: PedagogicalProduct): CanvasLayout {
  const { metadata, data } = product;
  const elements: CanvasElement[] = [];
  let y = MARGIN;
  let z = 0;

  const coverImageUrl = typeof data.coverImageUrl === 'string' ? data.coverImageUrl : undefined;
  if (coverImageUrl) {
    const height = 220;
    elements.push({
      id: newElementId('img'), type: 'image', x: MARGIN, y, width: CONTENT_WIDTH, height,
      rotation: 0, zIndex: z++, src: coverImageUrl,
    });
    y += height + 20;
  }

  const titleFontSize = 26;
  const titleHeight = estimateTextHeight(metadata.title || '', titleFontSize);
  elements.push({
    id: newElementId('text'), type: 'text', x: MARGIN, y, width: CONTENT_WIDTH, height: titleHeight,
    rotation: 0, zIndex: z++, text: metadata.title || 'Sin título', fontSize: titleFontSize,
    fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontStyle: 'normal', color: '#1E293B', align: 'left',
  });
  y += titleHeight + 8;

  if (metadata.subtitle) {
    const h = estimateTextHeight(metadata.subtitle, 16);
    elements.push({
      id: newElementId('text'), type: 'text', x: MARGIN, y, width: CONTENT_WIDTH, height: h,
      rotation: 0, zIndex: z++, text: metadata.subtitle, fontSize: 16,
      fontFamily: 'Outfit, sans-serif', fontWeight: 'normal', fontStyle: 'normal', color: '#64748B', align: 'left',
    });
    y += h + 16;
  } else {
    y += 8;
  }

  for (const block of extractTextBlocks(product)) {
    if (block.heading) {
      const h = estimateTextHeight(block.heading, 15);
      elements.push({
        id: newElementId('text'), type: 'text', x: MARGIN, y, width: CONTENT_WIDTH, height: h,
        rotation: 0, zIndex: z++, text: block.heading, fontSize: 15,
        fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontStyle: 'normal', color: '#334155', align: 'left',
      });
      y += h + 4;
    }
    const bodyHeight = estimateTextHeight(block.body, 13);
    elements.push({
      id: newElementId('text'), type: 'text', x: MARGIN, y, width: CONTENT_WIDTH, height: bodyHeight,
      rotation: 0, zIndex: z++, text: block.body, fontSize: 13,
      fontFamily: 'Outfit, sans-serif', fontWeight: 'normal', fontStyle: 'normal', color: '#1E293B', align: 'left',
    });
    y += bodyHeight + 16;
  }

  return {
    width: DEFAULT_CANVAS_WIDTH,
    height: Math.max(DEFAULT_CANVAS_HEIGHT, y + MARGIN),
    background: '#FFFFFF',
    elements,
  };
}
