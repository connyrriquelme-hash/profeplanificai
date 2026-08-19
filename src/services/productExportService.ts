import PptxGenJS from 'pptxgenjs';
import type { PedagogicalProduct } from '../components/products/types';
import { sanitizeDownloadName } from '../utils/exportProductWord';

const PALETTE = {
  turquoise: '#06BFAD',
  fuchsia: '#F24162',
  orange: '#F2A413',
  purple: '#7F58A6',
  darkPurple: '#4A2D73',
  lightGray: '#F3F4F6',
  white: '#FFFFFF',
} as const;

/* ──────────── Word Export ──────────── */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function paragraph(text: string, style = '', bold = false): string {
  const clean = text.trim();
  if (!clean) return '';
  const boldXml = bold ? '<w:rPr><w:b/></w:rPr>' : '';
  const styleXml = style ? `<w:pPr>${style}</w:pPr>` : '';
  return `<w:p>${styleXml}<w:r>${boldXml}<w:t xml:space="preserve">${escapeXml(clean)}</w:t></w:r></w:p>`;
}

function heading(text: string, level: 1 | 2 | 3): string {
  return paragraph(text, `<w:pStyle w:val="Heading${level}"/>`);
}

function bulletItem(text: string): string {
  return paragraph(`• ${text}`);
}

function tableXml(headers: string[], rows: string[][]): string {
  const headerRow = `<w:tr>${headers.map(h => `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>${paragraph(h, '', true)}</w:tc>`).join('')}</w:tr>`;
  const dataRows = rows.map(row =>
    `<w:tr>${row.map(cell => `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>${paragraph(cell)}</w:tc>`).join('')}</w:tr>`
  ).join('');

  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:left w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:right w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/></w:tblBorders></w:tblPr>${headerRow}${dataRows}</w:tbl>`;
}

function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1" w:default="0"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="${PALETTE.purple.slice(1)}"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2" w:default="0"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="${PALETTE.turquoise.slice(1)}"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3" w:default="0"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="${PALETTE.fuchsia.slice(1)}"/></w:rPr></w:style>
</w:styles>`;
}

function productToWordBody(product: PedagogicalProduct): string {
  const { metadata, data, type } = product;
  const sections: string[] = [];

  sections.push(heading(metadata.title || 'Producto Educativo', 1));
  if (metadata.subtitle) sections.push(paragraph(metadata.subtitle));

  const metaParts: string[] = [];
  if (metadata.level) metaParts.push(`Nivel: ${metadata.level}`);
  if (metadata.subject) metaParts.push(`Asignatura: ${metadata.subject}`);
  if (metadata.oaCode) metaParts.push(`OA: ${metadata.oaCode}`);
  if (metadata.topic) metaParts.push(`Tema: ${metadata.topic}`);
  if (metaParts.length) sections.push(paragraph(metaParts.join(' | ')));

  sections.push(paragraph(''));

  switch (type) {
    case 'rubrica':
    case 'rubrica_formativa': {
      const criteria = (data.criteria || data.criterios || []) as Array<{ criterion?: string; name?: string; levels: Array<{ name: string; description: string; score: number }> }>;
      if (criteria.length) {
        const levels = criteria[0]?.levels || [];
        const headers = ['Criterio', ...levels.map(l => `${l.name} (${l.score} pts)`)];
        const rows = criteria.map(c => [
          c.criterion || c.name || '',
          ...levels.map(l => l.description),
        ]);
        sections.push(tableXml(headers, rows));
      }
      break;
    }
    case 'checklist':
    case 'lista_cotejo': {
      const items = (data.items || data.criterios || []) as Array<{ criterion: string; description?: string }>;
      sections.push(heading('Criterios de verificación', 2));
      items.forEach(item => {
        sections.push(bulletItem(item.criterion));
        if (item.description) sections.push(paragraph(`  ${item.description}`));
      });
      break;
    }
    case 'ticket_salida':
    case 'ticket_entrada': {
      const questions = (data.questions || data.preguntas || []) as string[];
      sections.push(heading('Preguntas', 2));
      questions.forEach((q, i) => sections.push(paragraph(`${i + 1}. ${q}`)));
      break;
    }
    case 'guia_aprendizaje':
    case 'guia_estudiante':
    case 'guia_docente': {
      const sections_data = (data.sections || data.secciones || []) as Array<{ title?: string; content?: string; items?: string[] }>;
      sections_data.forEach(s => {
        if (s.title) sections.push(heading(s.title, 2));
        if (s.content) sections.push(paragraph(s.content));
        if (s.items) s.items.forEach(item => sections.push(bulletItem(item)));
      });
      if (!sections_data.length && data.content) {
        sections.push(paragraph(String(data.content)));
      }
      break;
    }
    case 'evaluacion': {
      const questions = (data.questions || data.preguntas || []) as Array<{ question?: string; pregunta?: string; options?: string[]; alternatives?: string[]; answer?: string; respuesta?: string }>;
      sections.push(heading('Preguntas', 2));
      questions.forEach((q, i) => {
        sections.push(paragraph(`${i + 1}. ${q.question || q.pregunta || ''}`));
        const opts = q.options || q.alternatives || [];
        opts.forEach((opt, j) => sections.push(paragraph(`   ${String.fromCharCode(65 + j)}) ${opt}`)));
        if (q.answer || q.respuesta) sections.push(paragraph(`   Respuesta: ${q.answer || q.respuesta}`, '', true));
      });
      break;
    }
    case 'semaforo': {
      const categories = (data.categories || data.categorias || []) as Array<{ name: string; color: string; items: string[] }>;
      categories.forEach(cat => {
        sections.push(heading(cat.name, 2));
        cat.items.forEach(item => sections.push(bulletItem(item)));
      });
      break;
    }
    case 'planificacion': {
      const classes = (data.classes || data.clases || []) as Array<{ title?: string; fase?: string; objetivo?: string; activities?: string[] }>;
      classes.forEach((cls, i) => {
        sections.push(heading(`Clase ${i + 1}: ${cls.title || cls.fase || ''}`, 2));
        if (cls.objetivo) sections.push(paragraph(`Objetivo: ${cls.objetivo}`));
        if (cls.activities) cls.activities.forEach(a => sections.push(bulletItem(a)));
      });
      break;
    }
    case 'presentacion': {
      const slides = (data.slides || []) as Array<{ title?: string; bullets?: string[]; body?: string }>;
      slides.forEach((slide, i) => {
        sections.push(heading(`Slide ${i + 1}: ${slide.title || ''}`, 2));
        if (slide.bullets) slide.bullets.forEach(b => sections.push(bulletItem(b)));
        if (slide.body) sections.push(paragraph(slide.body));
      });
      break;
    }
    default: {
      const keys = Object.keys(data).filter(k => typeof data[k] === 'string' || Array.isArray(data[k]));
      keys.forEach(key => {
        sections.push(heading(key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), 2));
        const val = data[key];
        if (typeof val === 'string') {
          sections.push(paragraph(val));
        } else if (Array.isArray(val)) {
          (val as unknown[]).forEach(item => {
            if (typeof item === 'string') sections.push(bulletItem(item));
            else if (typeof item === 'object' && item !== null) {
              const obj = item as Record<string, unknown>;
              const text = Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(' | ');
              sections.push(bulletItem(text));
            }
          });
        }
      });
      break;
    }
  }

  return sections.join('\n');
}

function buildWordDocument(bodyXml: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${bodyXml}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720"/></w:sectPr>
</w:body>
</w:document>`;
}

function buildPackageXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
}

function buildRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function buildWordRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

async function zipEntries(entries: Array<{ name: string; content: Uint8Array }>): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.name, entry.content);
  }
  return zip.generateAsync({ type: 'blob' });
}

export async function exportProductToWord(product: PedagogicalProduct): Promise<void> {
  const encoder = new TextEncoder();
  const bodyXml = productToWordBody(product);

  const entries = [
    { name: '[Content_Types].xml', content: encoder.encode(buildPackageXml()) },
    { name: '_rels/.rels', content: encoder.encode(buildRelsXml()) },
    { name: 'word/_rels/document.xml.rels', content: encoder.encode(buildWordRelsXml()) },
    { name: 'word/document.xml', content: encoder.encode(buildWordDocument(bodyXml)) },
    { name: 'word/styles.xml', content: encoder.encode(buildStylesXml()) },
  ];

  const blob = await zipEntries(entries);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeDownloadName(product.metadata.title || 'producto')}.docx`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ──────────── PPTX Export ──────────── */

function productToPptxSlides(product: PedagogicalProduct): Array<{ title: string; bullets: string[]; layout: 'title' | 'content' | 'twoContent' }> {
  const { metadata, data, type } = product;
  const slides: Array<{ title: string; bullets: string[]; layout: 'title' | 'content' | 'twoContent' }> = [];

  slides.push({ title: metadata.title || 'Producto Educativo', bullets: [metadata.subtitle || metadata.topic || ''].filter(Boolean), layout: 'title' });

  switch (type) {
    case 'rubrica':
    case 'rubrica_formativa': {
      const criteria = (data.criteria || data.criterios || []) as Array<{ criterion?: string; name?: string; levels: Array<{ name: string; score: number }> }>;
      criteria.forEach(c => {
        const levels = (c.levels || []).map(l => `${l.name}: ${l.score} pts`).join(' | ');
        slides.push({ title: c.criterion || c.name || 'Criterio', bullets: [levels], layout: 'content' });
      });
      break;
    }
    case 'checklist':
    case 'lista_cotejo': {
      const items = (data.items || data.criterios || []) as Array<{ criterion: string }>;
      const chunks = items.reduce<string[][]>((acc, item, i) => {
        const chunkIndex = Math.floor(i / 5);
        if (!acc[chunkIndex]) acc[chunkIndex] = [];
        acc[chunkIndex].push(item.criterion);
        return acc;
      }, []);
      chunks.forEach((chunk, i) => {
        slides.push({ title: `Criterios ${i + 1}`, bullets: chunk, layout: 'content' });
      });
      break;
    }
    case 'guia_aprendizaje':
    case 'guia_estudiante':
    case 'guia_docente': {
      const sections = (data.sections || data.secciones || []) as Array<{ title?: string; content?: string; items?: string[] }>;
      sections.forEach(s => {
        const bullets = s.items || (s.content ? [s.content] : []);
        slides.push({ title: s.title || 'Sección', bullets, layout: 'content' });
      });
      break;
    }
    case 'evaluacion': {
      const questions = (data.questions || data.preguntas || []) as Array<{ question?: string; pregunta?: string; options?: string[]; alternatives?: string[] }>;
      questions.forEach((q, i) => {
        const opts = (q.options || q.alternatives || []).map((o, j) => `${String.fromCharCode(65 + j)}) ${o}`);
        slides.push({ title: `Pregunta ${i + 1}`, bullets: [q.question || q.pregunta || '', ...opts], layout: 'content' });
      });
      break;
    }
    case 'presentacion': {
      const pptSlides = (data.slides || []) as Array<{ title?: string; bullets?: string[]; body?: string }>;
      pptSlides.forEach(s => {
        slides.push({ title: s.title || '', bullets: s.bullets || (s.body ? [s.body] : []), layout: 'content' });
      });
      break;
    }
    case 'planificacion': {
      const classes = (data.classes || data.clases || []) as Array<{ title?: string; fase?: string; objetivo?: string }>;
      classes.forEach((cls, i) => {
        slides.push({ title: `Clase ${i + 1}: ${cls.title || cls.fase || ''}`, bullets: cls.objetivo ? [`Objetivo: ${cls.objetivo}`] : [], layout: 'content' });
      });
      break;
    }
    default: {
      const keys = Object.keys(data).filter(k => typeof data[k] === 'string').slice(0, 10);
      keys.forEach(key => {
        const val = String(data[key]);
        slides.push({ title: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), bullets: val.length > 200 ? [val.slice(0, 200) + '...'] : [val], layout: 'content' });
      });
      break;
    }
  }

  return slides;
}

const BG_COLORS: Record<string, string> = {
  title: PALETTE.purple,
  content: PALETTE.white,
  twoContent: PALETTE.white,
};

export async function exportProductToPptx(product: PedagogicalProduct): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'CUSTOM', width: 13.333, height: 7.5 });
  pptx.layout = 'CUSTOM';

  const slides = productToPptxSlides(product);

  slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    const bg = BG_COLORS[s.layout] || PALETTE.white;
    slide.background = { color: bg.replace('#', '') };

    if (s.layout === 'title') {
      slide.addText(s.title, {
        x: 1, y: 2.5, w: 11.333, h: 1.5,
        fontSize: 40, bold: true, color: PALETTE.white, align: 'center',
      });
      if (s.bullets.length) {
        slide.addText(s.bullets.join(' | '), {
          x: 1, y: 4.2, w: 11.333, h: 0.8,
          fontSize: 18, color: 'CCCCCC', align: 'center',
        });
      }
    } else {
      slide.addText(s.title, {
        x: 0.6, y: 0.3, w: 12.1, h: 0.8,
        fontSize: 28, bold: true, color: PALETTE.darkPurple.replace('#', ''),
      });
      if (s.bullets.length) {
        slide.addText(
          s.bullets.map(b => ({ text: b, options: { bullet: { code: '2022' }, fontSize: 16, color: '333333' } })),
          { x: 0.6, y: 1.4, w: 12.1, h: 5.5, valign: 'top' },
        );
      }
    }

    slide.addText(`${i + 1}/${slides.length}`, {
      x: 12, y: 7, w: 1, h: 0.4,
      fontSize: 10, color: '999999', align: 'right',
    });
  });

  const blob = await pptx.write({ outputType: 'blob' }) as Blob;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeDownloadName(product.metadata.title || 'producto')}.pptx`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ──────────── Helpers ──────────── */

export function getProductExportFormats(product: PedagogicalProduct): Array<{ label: string; icon: string; action: () => Promise<void> }> {
  return [
    { label: 'Word', icon: 'FileText', action: () => exportProductToWord(product) },
    { label: 'PowerPoint', icon: 'Presentation', action: () => exportProductToPptx(product) },
  ];
}
