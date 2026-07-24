import { mdToHtml } from './htmlUtils';

const UNSUPPORTED_CANVAS_COLOR = /(oklch|oklab|lab|lch|color-mix)\(/i;
const CANVAS_SAFE_STYLE_PROPERTIES = [
  'align-items',
  'background-color',
  'background-image',
  'border-bottom-color',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'border-bottom-style',
  'border-bottom-width',
  'border-left-color',
  'border-left-style',
  'border-left-width',
  'border-right-color',
  'border-right-style',
  'border-right-width',
  'border-top-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-top-style',
  'border-top-width',
  'box-shadow',
  'box-sizing',
  'color',
  'display',
  'flex-direction',
  'flex-wrap',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'gap',
  'justify-content',
  'letter-spacing',
  'line-height',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'opacity',
  'overflow',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'text-align',
  'text-transform',
  'vertical-align',
  'white-space',
  'word-break',
];

function usesUnsupportedCanvasColor(value: string | null): boolean {
  return Boolean(value && UNSUPPORTED_CANVAS_COLOR.test(value));
}

function canvasSafeValue(property: string, value: string): string {
  if (!usesUnsupportedCanvasColor(value)) return value;
  if (property === 'background-color') return 'transparent';
  if (property === 'background-image' || property === 'box-shadow') return 'none';
  if (property === 'color') return '#111827';
  if (property === 'fill' || property === 'stroke') return '#111827';
  return '#e5e7eb';
}

function sanitizeElementForCanvas(element: HTMLElement): void {
  const view = element.ownerDocument.defaultView ?? window;
  const nodes = [element, ...Array.from(element.querySelectorAll<HTMLElement>('*'))];
  const colorProperties = [
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
    'text-emphasis-color',
    'caret-color',
    'column-rule-color',
    'fill',
    'stroke',
  ];

  nodes.forEach((node) => {
    const style = view.getComputedStyle(node);

    CANVAS_SAFE_STYLE_PROPERTIES.forEach((property) => {
      const value = style.getPropertyValue(property);
      if (value) node.style.setProperty(property, canvasSafeValue(property, value));
    });

    colorProperties.forEach((property) => {
      const value = style.getPropertyValue(property);
      if (usesUnsupportedCanvasColor(value)) {
        node.style.setProperty(property, canvasSafeValue(property, value));
      }
    });
  });
}

function removeClonedStylesheets(clonedDocument: Document): void {
  clonedDocument.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove());
}

function escapeCssId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
}

function appendCanvasSafeOverrides(clonedDocument: Document, elementId: string): void {
  const selector = `#${escapeCssId(elementId)}`;
  const style = clonedDocument.createElement('style');
  style.textContent = `
    html, body, body * {
      background-image: none !important;
      border-color: #e5e7eb !important;
      box-shadow: none !important;
      caret-color: #111827 !important;
      color: #111827 !important;
      column-rule-color: #e5e7eb !important;
      outline-color: #e5e7eb !important;
      text-decoration-color: #111827 !important;
      text-emphasis-color: #111827 !important;
      text-shadow: none !important;
    }
    ${selector}, ${selector} * {
      background-color: transparent !important;
      background-image: none !important;
      border-color: #e5e7eb !important;
      caret-color: #111827 !important;
      color: #111827 !important;
      column-rule-color: #e5e7eb !important;
      outline-color: #e5e7eb !important;
      text-decoration-color: #111827 !important;
      text-emphasis-color: #111827 !important;
      text-shadow: none !important;
      box-shadow: none !important;
    }
    ${selector} {
      background: #ffffff !important;
    }
    ${selector} .print-toolbar,
    ${selector} [role="toolbar"],
    ${selector} button {
      display: none !important;
    }
    ${selector} .bg-white {
      background-color: #ffffff !important;
    }
    ${selector} .bg-gray-50,
    ${selector} .bg-slate-50,
    ${selector} .bg-violet-50,
    ${selector} .bg-indigo-50,
    ${selector} .bg-teal-50,
    ${selector} .bg-amber-50,
    ${selector} .bg-emerald-50,
    ${selector} .bg-rose-50 {
      background-color: #f8fafc !important;
    }
    ${selector} .bg-gradient-to-r,
    ${selector} .bg-gradient-to-br,
    ${selector} .bg-gradient-to-b {
      background-image: linear-gradient(135deg, #7c3aed, #ec4899) !important;
    }
    ${selector} .text-white,
    ${selector} .text-white * {
      color: #ffffff !important;
    }
    ${selector} svg,
    ${selector} svg * {
      fill: transparent !important;
      stroke: #111827 !important;
    }
  `;
  clonedDocument.head.appendChild(style);
}

function getPrintableElementText(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('button, .print-toolbar, [role="toolbar"], svg').forEach((node) => node.remove());

  const blockTags = new Set([
    'ARTICLE',
    'ASIDE',
    'DIV',
    'FIGCAPTION',
    'FIGURE',
    'FOOTER',
    'H1',
    'H2',
    'H3',
    'H4',
    'HEADER',
    'LI',
    'MAIN',
    'P',
    'SECTION',
    'TABLE',
    'TBODY',
    'THEAD',
    'TR',
    'UL',
    'OL',
  ]);
  const parts: string[] = [];

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.replace(/\s+/g, ' ').trim();
      if (text) parts.push(text);
      return;
    }

    if (!(node instanceof Element)) return;

    const tag = node.tagName;
    if (tag === 'BR') {
      parts.push('\n');
      return;
    }
    if (tag === 'LI') parts.push('\n- ');
    if (tag === 'TR') parts.push('\n');
    if (tag === 'TH' || tag === 'TD') parts.push('  ');
    if (blockTags.has(tag) && tag !== 'LI' && tag !== 'TR') parts.push('\n');

    node.childNodes.forEach(walk);

    if (tag === 'TH' || tag === 'TD') parts.push('  ');
    if (blockTags.has(tag)) parts.push('\n');
  };

  walk(clone);

  return parts
    .join(' ')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export async function exportToPDF(title: string, markdownContent: string): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const html = mdToHtml(markdownContent);

  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.cssText = `
    font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5;
    padding: 20px; color: #000; max-width: 190mm;
  `;
  container.querySelectorAll('h1, h2, h3').forEach((el) => {
    (el as HTMLElement).style.color = '#000';
    (el as HTMLElement).style.margin = '12px 0 6px';
  });
  container.querySelectorAll('ul').forEach((el) => {
    (el as HTMLElement).style.paddingLeft = '20px';
  });
  container.querySelectorAll('li').forEach((el) => {
    (el as HTMLElement).style.margin = '3px 0';
  });

  document.body.appendChild(container);

  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDocument) => {
        const clonedContainer = clonedDocument.body.lastElementChild;
        if (clonedContainer instanceof HTMLElement) {
          sanitizeElementForCanvas(clonedContainer);
          removeClonedStylesheets(clonedDocument);
        }
      },
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 190;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    pdf.save(`${title.replace(/[^a-zA-Z0-9áéíóúñ\s-]/g, '').trim()}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportElementToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Elemento #${elementId} no encontrado`);

  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF } = await import('jspdf');

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDocument) => {
        appendCanvasSafeOverrides(clonedDocument, elementId);
        const clonedElement = clonedDocument.getElementById(elementId);
        if (clonedElement instanceof HTMLElement) {
          sanitizeElementForCanvas(clonedElement);
        }
      },
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 190;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.warn('No se pudo exportar el producto como imagen. Se generará un PDF textual.', error);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 16;
    const lineHeight = 6;
    let y = margin;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('ProfePlanificAI', margin, y);
    y += 9;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    getPrintableElementText(element).split('\n').forEach((paragraph) => {
      const lines = pdf.splitTextToSize(paragraph || ' ', pageWidth - margin * 2) as string[];
      lines.forEach((line) => {
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += lineHeight;
      });
      y += 2;
    });

    pdf.save(`${filename}.pdf`);
  }
}
