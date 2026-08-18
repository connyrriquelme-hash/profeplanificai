import { SLIDE_WIDTH, SLIDE_HEIGHT, type RenderableSlide } from './PptLayoutEngine';

// Minimal types for pptxgenjs to avoid static import issues
interface PptxSlide {
  addText(text: string | Array<{ text: string; options?: Record<string, unknown> }>, options?: Record<string, unknown>): PptxSlide;
  addImage(options: { x: number; y: number; w: number; h: number; path?: string; data?: string }): PptxSlide;
  background: { fill: string };
}

interface PptxPres {
  layout: string;
  author: string;
  title: string;
  defineLayout(layout: { name: string; width: number; height: number }): void;
  addSlide(): PptxSlide;
  write(options: { outputType: 'uint8array' }): Promise<Uint8Array>;
  writeFile(options: { fileName: string }): Promise<void>;
}

// Debe coincidir EXACTAMENTE con SLIDE_WIDTH/SLIDE_HEIGHT de PptLayoutEngine.ts:
// todas las coordenadas de las shapes se calculan asumiendo este tamaño de lienzo.
const PPTX_LAYOUT_NAME = 'PLANIFICAIA';

async function createPres(): Promise<PptxPres> {
  const mod = await import('pptxgenjs');
  const PptxGenJS = mod.default;
  return new PptxGenJS() as unknown as PptxPres;
}

interface LocalTextRect {
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

interface LocalImageRect {
  x: number;
  y: number;
  width: number;
  height: number;
  query: string;
}

function asTextRect(obj: unknown): LocalTextRect {
  if (obj && typeof obj === 'object' && 'x' in obj && 'y' in obj && 'width' in obj && 'height' in obj) {
    return obj as LocalTextRect;
  }
  return { x: 0, y: 0, width: 1, height: 1, fontSize: 14, color: '#000000', fontFamily: 'Arial', text: '' };
}

function asImageRect(obj: unknown): LocalImageRect | null {
  if (obj && typeof obj === 'object' && 'x' in obj && 'y' in obj && 'query' in obj) {
    return obj as LocalImageRect;
  }
  return null;
}

function pptxAlign(align?: string): 'L' | 'C' | 'R' {
  switch (align) {
    case 'left': return 'L';
    case 'center': return 'C';
    case 'right': return 'R';
    default: return 'L';
  }
}

function pptxValign(valign?: string): 'top' | 'middle' | 'b' {
  switch (valign) {
    case 'top': return 'top';
    case 'middle': return 'middle';
    case 'bottom': return 'b';
    default: return 'top';
  }
}

function addTextFromRect(pptxSlide: PptxSlide, rect: LocalTextRect, text: string): void {
  pptxSlide.addText(text, {
    x: rect.x,
    y: rect.y,
    w: rect.width,
    h: rect.height,
    fontSize: rect.fontSize,
    color: rect.color.replace('#', ''),
    fontFace: rect.fontFamily,
    bold: rect.bold,
    align: pptxAlign(rect.align),
    valign: pptxValign(rect.valign),
  });
}

// pptxgenjs.addText(arrayDeRuns, opts) crea UNA sola caja de texto con varios
// párrafos: la posición/tamaño de esa caja sale del 2do argumento (`opts`),
// no de cada item del array. Por eso hay que calcular el bounding box real
// de todos los rects (cada uno ya viene bien posicionado desde
// PptLayoutEngine) y pasarlo como la caja compartida — si no, pptxgenjs
// no recibe x/y/w/h y la caja termina con height 0.
function addBulletListFromRects(pptxSlide: PptxSlide, rects: LocalTextRect[], bullet: boolean): void {
  if (rects.length === 0) return;

  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxX = Math.max(...rects.map((r) => r.x + r.width));
  const maxY = Math.max(...rects.map((r) => r.y + r.height));

  const runs = rects.map((rect) => ({
    text: rect.text ?? '',
    options: {
      fontSize: rect.fontSize,
      color: rect.color.replace('#', ''),
      fontFace: rect.fontFamily,
      bold: rect.bold,
      align: pptxAlign(rect.align),
      breakLine: true,
    },
  }));

  pptxSlide.addText(runs, {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
    valign: 'top',
    bullet,
  });
}

function renderTitleSlide(pres: PptxPres, slide: RenderableSlide): void {
  if (slide.layout !== 'title') return;
  const pptxSlide = pres.addSlide();
  pptxSlide.background = { fill: slide.background.replace('#', '') };

  const title = asTextRect(slide.title);
  addTextFromRect(pptxSlide, title, title.text ?? '');

  if (slide.subtitle) {
    const subtitle = asTextRect(slide.subtitle);
    addTextFromRect(pptxSlide, subtitle, subtitle.text ?? '');
  }
}

function renderBulletsSlide(pres: PptxPres, slide: RenderableSlide): void {
  if (slide.layout !== 'bullets') return;
  const pptxSlide = pres.addSlide();
  pptxSlide.background = { fill: slide.background.replace('#', '') };

  const title = asTextRect(slide.title);
  addTextFromRect(pptxSlide, title, title.text ?? '');

  addBulletListFromRects(pptxSlide, slide.bullets.map(asTextRect), true);
}

function isValidImageSource(src: string): boolean {
  if (!src || typeof src !== 'string') return false;
  if (src.startsWith('data:')) return true;
  if (src.startsWith('http://') || src.startsWith('https://')) return true;
  return false;
}

function renderImageTextSlide(pres: PptxPres, slide: RenderableSlide): void {
  if (slide.layout !== 'image_text') return;
  const pptxSlide = pres.addSlide();
  pptxSlide.background = { fill: slide.background.replace('#', '') };

  const title = asTextRect(slide.title);
  addTextFromRect(pptxSlide, title, title.text ?? '');

  const body = asTextRect(slide.body);
  addTextFromRect(pptxSlide, body, body.text ?? '');

  const img = asImageRect(slide.image);
  if (img && img.query && isValidImageSource(img.query)) {
    try {
      // pptxgenjs distingue "path" (URL http(s):// o ruta de archivo, la
      // descarga/lee él mismo) de "data" (payload base64 ya en memoria,
      // con el prefijo data: completo) — son mutuamente excluyentes.
      // Pasar un data: URI por "path" lo trata como ruta de archivo
      // literal y revienta con ENOENT.
      const isDataUri = img.query.startsWith('data:');
      pptxSlide.addImage({
        x: img.x,
        y: img.y,
        w: img.width,
        h: img.height,
        ...(isDataUri ? { data: img.query } : { path: img.query }),
      });
    } catch (err) {
      console.warn('[PptRenderer] imagen no cargable, omitiendo:', img.query, err);
    }
  }
}

function renderComparisonSlide(pres: PptxPres, slide: RenderableSlide): void {
  if (slide.layout !== 'comparison') return;
  const pptxSlide = pres.addSlide();
  pptxSlide.background = { fill: slide.background.replace('#', '') };

  const title = asTextRect(slide.title);
  addTextFromRect(pptxSlide, title, title.text ?? '');

  const leftLabel = asTextRect(slide.leftLabel);
  addTextFromRect(pptxSlide, leftLabel, leftLabel.text ?? '');

  const rightLabel = asTextRect(slide.rightLabel);
  addTextFromRect(pptxSlide, rightLabel, rightLabel.text ?? '');

  addBulletListFromRects(pptxSlide, slide.leftPoints.map(asTextRect), true);
  addBulletListFromRects(pptxSlide, slide.rightPoints.map(asTextRect), true);
}

function renderQuoteSlide(pres: PptxPres, slide: RenderableSlide): void {
  if (slide.layout !== 'quote') return;
  const pptxSlide = pres.addSlide();
  pptxSlide.background = { fill: slide.background.replace('#', '') };

  const text = asTextRect(slide.text);
  addTextFromRect(pptxSlide, text, text.text ?? '');

  if (slide.author) {
    const author = asTextRect(slide.author);
    addTextFromRect(pptxSlide, author, author.text ?? '');
  }
}

function renderQuizPreguntaSlide(pres: PptxPres, slide: RenderableSlide): void {
  if (slide.layout !== 'quiz_pregunta') return;
  const pptxSlide = pres.addSlide();
  pptxSlide.background = { fill: slide.background.replace('#', '') };

  const titulo = asTextRect(slide.titulo);
  addTextFromRect(pptxSlide, titulo, titulo.text ?? '');

  const pregunta = asTextRect(slide.pregunta);
  addTextFromRect(pptxSlide, pregunta, pregunta.text ?? '');

  addBulletListFromRects(pptxSlide, slide.opciones.map(asTextRect), false);
}

function renderQuizRespuestaSlide(pres: PptxPres, slide: RenderableSlide): void {
  if (slide.layout !== 'quiz_respuesta') return;
  const pptxSlide = pres.addSlide();
  pptxSlide.background = { fill: slide.background.replace('#', '') };

  const titulo = asTextRect(slide.titulo);
  addTextFromRect(pptxSlide, titulo, titulo.text ?? '');

  const resultado = asTextRect(slide.resultado);
  addTextFromRect(pptxSlide, resultado, resultado.text ?? '');

  const explicacion = asTextRect(slide.explicacion);
  addTextFromRect(pptxSlide, explicacion, explicacion.text ?? '');
}

function renderVerdaderoFalsoPreguntaSlide(pres: PptxPres, slide: RenderableSlide): void {
  if (slide.layout !== 'verdadero_falso_pregunta') return;
  const pptxSlide = pres.addSlide();
  pptxSlide.background = { fill: slide.background.replace('#', '') };

  const titulo = asTextRect(slide.titulo);
  addTextFromRect(pptxSlide, titulo, titulo.text ?? '');

  const afirmacion = asTextRect(slide.afirmacion);
  addTextFromRect(pptxSlide, afirmacion, afirmacion.text ?? '');

  for (const opt of slide.opciones) {
    const rect = asTextRect(opt);
    addTextFromRect(pptxSlide, rect, rect.text ?? '');
  }
}

function renderVerdaderoFalsoRespuestaSlide(pres: PptxPres, slide: RenderableSlide): void {
  if (slide.layout !== 'verdadero_falso_respuesta') return;
  const pptxSlide = pres.addSlide();
  pptxSlide.background = { fill: slide.background.replace('#', '') };

  const titulo = asTextRect(slide.titulo);
  addTextFromRect(pptxSlide, titulo, titulo.text ?? '');

  const resultado = asTextRect(slide.resultado);
  addTextFromRect(pptxSlide, resultado, resultado.text ?? '');

  const explicacion = asTextRect(slide.explicacion);
  addTextFromRect(pptxSlide, explicacion, explicacion.text ?? '');
}

function renderVocabularioSlide(pres: PptxPres, slide: RenderableSlide): void {
  if (slide.layout !== 'vocabulario') return;
  const pptxSlide = pres.addSlide();
  pptxSlide.background = { fill: slide.background.replace('#', '') };

  const titulo = asTextRect(slide.titulo);
  addTextFromRect(pptxSlide, titulo, titulo.text ?? '');

  for (const termino of slide.terminos) {
    const rect = asTextRect(termino);
    addTextFromRect(pptxSlide, rect, rect.text ?? '');
  }
}

function renderCicloProcesoSlide(pres: PptxPres, slide: RenderableSlide): void {
  if (slide.layout !== 'ciclo_proceso') return;
  const pptxSlide = pres.addSlide();
  pptxSlide.background = { fill: slide.background.replace('#', '') };

  const titulo = asTextRect(slide.titulo);
  addTextFromRect(pptxSlide, titulo, titulo.text ?? '');

  for (const paso of slide.pasos) {
    const rect = asTextRect(paso);
    addTextFromRect(pptxSlide, rect, rect.text ?? '');
  }
}

const RENDERERS: Record<string, (pres: PptxPres, slide: RenderableSlide) => void> = {
  title: renderTitleSlide,
  bullets: renderBulletsSlide,
  image_text: renderImageTextSlide,
  comparison: renderComparisonSlide,
  quote: renderQuoteSlide,
  vocabulario: renderVocabularioSlide,
  ciclo_proceso: renderCicloProcesoSlide,
  quiz_pregunta: renderQuizPreguntaSlide,
  quiz_respuesta: renderQuizRespuestaSlide,
  verdadero_falso_pregunta: renderVerdaderoFalsoPreguntaSlide,
  verdadero_falso_respuesta: renderVerdaderoFalsoRespuestaSlide,
};

export async function renderPptx(slides: RenderableSlide[]): Promise<Uint8Array> {
  const pres = await createPres();
  pres.defineLayout({ name: PPTX_LAYOUT_NAME, width: SLIDE_WIDTH, height: SLIDE_HEIGHT });
  pres.layout = PPTX_LAYOUT_NAME;
  pres.author = 'PlanificaIA Chile';
  pres.title = 'Presentación educativa';

  let slidesRenderizados = 0;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    try {
      const renderer = RENDERERS[slide.layout];
      if (renderer) {
        renderer(pres, slide);
        slidesRenderizados++;
      }
    } catch (err) {
      console.error(`[PptRenderer] error al renderizar slide ${i} (layout: ${slide.layout}), omitiendo:`, err);
    }
  }

  if (slidesRenderizados === 0) {
    const emptySlide = pres.addSlide();
    emptySlide.addText('No se pudieron renderizar los slides', {
      x: 1,
      y: 2,
      w: 8,
      h: 1.5,
      fontSize: 24,
      color: '999999',
      fontFace: 'Arial',
      align: 'center',
    });
  }

  return pres.write({ outputType: 'uint8array' });
}
