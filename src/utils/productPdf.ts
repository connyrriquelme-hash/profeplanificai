/* eslint-disable @typescript-eslint/no-explicit-any */
import { NormalizedProduct, ProductTable, ProductCallout, ProductChart } from './productNormalizer';
import { resourceTypeLabel } from '../services/bankService';

const MARGIN = 15;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const BOTTOM_MARGIN = 25;

type JsPDFInstance = any;

function ensurePage(pdf: JsPDFInstance, cursorY: number, needed: number): number {
  if (cursorY + needed > PAGE_HEIGHT - BOTTOM_MARGIN) {
    pdf.addPage();
    return MARGIN + 5;
  }
  return cursorY;
}

function addHeader(pdf: JsPDFInstance, product: NormalizedProduct) {
  pdf.setFillColor(41, 98, 255);
  pdf.rect(0, 0, PAGE_WIDTH, 40, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(product.title, CONTENT_WIDTH);
  pdf.text(titleLines[0], MARGIN, 18);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(resourceTypeLabel(product.type), MARGIN, 28);

  pdf.setFontSize(8);
  const metaParts: string[] = [];
  if (product.level) metaParts.push(product.level);
  if (product.subject) metaParts.push(product.subject);
  if (product.oaCode) metaParts.push(product.oaCode);
  if (metaParts.length) pdf.text(metaParts.join(' | '), MARGIN, 36);

  pdf.setTextColor(0, 0, 0);
}

function addFooter(pdf: JsPDFInstance, pageNum: number, total: number) {
  pdf.setFillColor(245, 245, 245);
  pdf.rect(0, PAGE_HEIGHT - 15, PAGE_WIDTH, 15, 'F');
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.text('ProfePlanificAI Chile', MARGIN, PAGE_HEIGHT - 8);
  pdf.text(`${pageNum} / ${total}`, PAGE_WIDTH - MARGIN - 20, PAGE_HEIGHT - 8);
  pdf.setTextColor(0, 0, 0);
}

function addSectionTitle(pdf: JsPDFInstance, title: string, cursorY: number): number {
  cursorY = ensurePage(pdf, cursorY, 15);
  pdf.setFillColor(240, 243, 255);
  pdf.roundedRect(MARGIN, cursorY - 4, CONTENT_WIDTH, 10, 2, 2, 'F');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(41, 98, 255);
  pdf.text(title, MARGIN + 4, cursorY + 3);
  pdf.setTextColor(0, 0, 0);
  return cursorY + 12;
}

function addTextBlock(pdf: JsPDFInstance, text: string, cursorY: number, opts?: { bold?: boolean; indent?: number }): number {
  if (!text) return cursorY;
  const x = MARGIN + (opts?.indent || 0);
  const maxWidth = CONTENT_WIDTH - (opts?.indent || 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
  const lines = pdf.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    cursorY = ensurePage(pdf, cursorY, 5);
    pdf.text(line, x, cursorY);
    cursorY += 5;
  }
  return cursorY + 2;
}

function addMarkdownContent(pdf: JsPDFInstance, content: string, cursorY: number): number {
  if (!content) return cursorY;
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      cursorY += 3;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      cursorY = ensurePage(pdf, cursorY, 12);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(50, 50, 50);
      const tLines = pdf.splitTextToSize(trimmed.slice(4), CONTENT_WIDTH);
      pdf.text(tLines[0], MARGIN + 2, cursorY);
      cursorY += 7;
      pdf.setTextColor(0, 0, 0);
    } else if (trimmed.startsWith('## ')) {
      cursorY = ensurePage(pdf, cursorY, 15);
      cursorY = addSectionTitle(pdf, trimmed.slice(3), cursorY);
    } else if (trimmed.startsWith('# ')) {
      cursorY = ensurePage(pdf, cursorY, 12);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const tLines = pdf.splitTextToSize(trimmed.slice(2), CONTENT_WIDTH);
      pdf.text(tLines[0], MARGIN, cursorY);
      cursorY += 8;
    } else if (trimmed.startsWith('- ')) {
      cursorY = ensurePage(pdf, cursorY, 6);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('\u2022', MARGIN + 4, cursorY);
      const bulletLines = pdf.splitTextToSize(trimmed.slice(2), CONTENT_WIDTH - 10);
      for (const bl of bulletLines) {
        cursorY = ensurePage(pdf, cursorY, 5);
        pdf.text(bl, MARGIN + 10, cursorY);
        cursorY += 5;
      }
    } else {
      const cleanLine = trimmed
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1');
      cursorY = addTextBlock(pdf, cleanLine, cursorY);
    }
  }
  return cursorY;
}

function addTable(pdf: JsPDFInstance, table: ProductTable, cursorY: number): number {
  if (!table.columns.length || !table.rows.length) return cursorY;

  cursorY = ensurePage(pdf, cursorY, 20);

  if (table.title) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(41, 98, 255);
    pdf.text(table.title, MARGIN + 2, cursorY);
    cursorY += 6;
    pdf.setTextColor(0, 0, 0);
  }

  const colCount = table.columns.length;
  const colWidth = CONTENT_WIDTH / colCount;
  const rowHeight = 7;

  pdf.setFillColor(41, 98, 255);
  pdf.rect(MARGIN, cursorY - 4, CONTENT_WIDTH, rowHeight, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  for (let ci = 0; ci < colCount; ci++) {
    const colText = String(table.columns[ci] || '');
    const truncated = colText.length > 30 ? colText.slice(0, 27) + '...' : colText;
    pdf.text(truncated, MARGIN + ci * colWidth + 3, cursorY);
  }
  cursorY += rowHeight;
  pdf.setTextColor(0, 0, 0);

  for (let ri = 0; ri < table.rows.length; ri++) {
    const row = table.rows[ri];
    cursorY = ensurePage(pdf, cursorY, rowHeight + 2);

    if (ri % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(MARGIN, cursorY - 4, CONTENT_WIDTH, rowHeight, 'F');
    }

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    for (let ci = 0; ci < colCount; ci++) {
      const cellText = String(row[ci] || '');
      const truncated = cellText.length > 40 ? cellText.slice(0, 37) + '...' : cellText;
      pdf.text(truncated, MARGIN + ci * colWidth + 3, cursorY);
    }
    cursorY += rowHeight;
  }

  pdf.setDrawColor(200, 200, 200);
  pdf.rect(MARGIN, cursorY - 4, CONTENT_WIDTH, 0.2, 'S');

  return cursorY + 4;
}

function addCallout(pdf: JsPDFInstance, callout: ProductCallout, cursorY: number): number {
  cursorY = ensurePage(pdf, cursorY, 20);

  const colors: Record<string, number[]> = {
    importante: [255, 243, 205],
    docente: [230, 240, 255],
    familia: [230, 255, 230],
    estudiante: [240, 230, 255],
    dua: [255, 230, 245],
  };
  const bg = colors[callout.type] || colors.importante;

  const textLines = pdf.splitTextToSize(callout.text, CONTENT_WIDTH - 16);
  const boxHeight = Math.max(textLines.length * 4.5 + 10, 16);

  cursorY = ensurePage(pdf, cursorY, boxHeight);

  pdf.setFillColor(bg[0], bg[1], bg[2]);
  pdf.roundedRect(MARGIN, cursorY - 4, CONTENT_WIDTH, boxHeight, 3, 3, 'F');

  const prefixMap: Record<string, string> = {
    importante: 'IMPORTANTE',
    docente: 'PARA EL DOCENTE',
    familia: 'PARA LA FAMILIA',
    estudiante: 'PARA EL ESTUDIANTE',
    dua: 'ADECUACION DUA',
  };
  const prefix = prefixMap[callout.type] || '';

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(80, 80, 80);
  if (prefix) pdf.text(prefix, MARGIN + 6, cursorY + 2);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(50, 50, 50);
  for (let i = 0; i < textLines.length; i++) {
    pdf.text(textLines[i], MARGIN + 6, cursorY + 8 + i * 4.5);
  }

  pdf.setTextColor(0, 0, 0);
  return cursorY + boxHeight + 4;
}

function addChart(pdf: JsPDFInstance, chart: ProductChart, cursorY: number): number {
  if (!chart.data?.length) return cursorY;

  cursorY = ensurePage(pdf, cursorY, 30);

  if (chart.title) {
    cursorY = addSectionTitle(pdf, chart.title, cursorY);
  }

  const maxVal = Math.max(...chart.data.map((d) => d.value || 0), 1);
  const barHeight = 6;
  const labelWidth = 50;
  const barWidth = CONTENT_WIDTH - labelWidth - 20;

  for (const item of chart.data) {
    cursorY = ensurePage(pdf, cursorY, barHeight + 4);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    const labelText = (item.label || '').length > 25 ? (item.label || '').slice(0, 22) + '...' : item.label || '';
    pdf.text(labelText, MARGIN, cursorY + 2);

    pdf.setFillColor(230, 235, 245);
    pdf.roundedRect(MARGIN + labelWidth, cursorY - 2, barWidth, barHeight, 2, 2, 'F');

    const fillWidth = Math.max((item.value / maxVal) * barWidth, 4);
    pdf.setFillColor(41, 98, 255);
    pdf.roundedRect(MARGIN + labelWidth, cursorY - 2, fillWidth, barHeight, 2, 2, 'F');

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(41, 98, 255);
    pdf.text(`${item.value}%`, MARGIN + labelWidth + barWidth + 3, cursorY + 2);

    cursorY += barHeight + 4;
  }

  pdf.setTextColor(0, 0, 0);
  return cursorY + 4;
}

function addChecklist(pdf: JsPDFInstance, items: string[], cursorY: number): number {
  if (!items.length) return cursorY;

  cursorY = ensurePage(pdf, cursorY, 15);
  cursorY = addSectionTitle(pdf, 'Lista de verificacion', cursorY);

  for (const item of items) {
    cursorY = ensurePage(pdf, cursorY, 7);
    pdf.setDrawColor(150, 150, 150);
    pdf.rect(MARGIN + 4, cursorY - 3, 4, 4, 'S');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const itemLines = pdf.splitTextToSize(item, CONTENT_WIDTH - 16);
    for (const line of itemLines) {
      pdf.text(line, MARGIN + 12, cursorY);
      cursorY += 5;
    }
  }

  return cursorY + 4;
}

export async function exportProductToPremiumPDF(product: NormalizedProduct): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const pdf = new jsPDF('p', 'mm', 'a4');
  let cursorY = 0;

  addHeader(pdf, product);
  cursorY = 48;

  if (product.oaCode || product.oaText) {
    cursorY = ensurePage(pdf, cursorY, 16);
    pdf.setFillColor(245, 245, 250);
    pdf.roundedRect(MARGIN, cursorY - 4, CONTENT_WIDTH, 12, 2, 2, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 100);
    const oaText = product.oaText
      ? `OA: ${product.oaCode} - ${product.oaText}`
      : `OA: ${product.oaCode}`;
    const oaLines = pdf.splitTextToSize(oaText, CONTENT_WIDTH - 8);
    pdf.text(oaLines[0], MARGIN + 4, cursorY + 3);
    cursorY += 12;
    pdf.setTextColor(0, 0, 0);
  }

  for (const callout of product.callouts) {
    cursorY = addCallout(pdf, callout, cursorY);
  }

  for (const section of product.sections) {
    if (section.title) {
      cursorY = addSectionTitle(pdf, section.title, cursorY);
    }
    if (section.content) {
      cursorY = addMarkdownContent(pdf, section.content, cursorY);
    }
    cursorY += 2;
  }

  for (const table of product.tables) {
    cursorY = ensurePage(pdf, cursorY, 20);
    cursorY = addTable(pdf, table, cursorY);
  }

  for (const chart of product.charts) {
    cursorY = ensurePage(pdf, cursorY, 20);
    cursorY = addChart(pdf, chart, cursorY);
  }

  if (product.checklist.length) {
    cursorY = addChecklist(pdf, product.checklist, cursorY);
  }

  if (product.footerNotes.length) {
    cursorY = ensurePage(pdf, cursorY, 15);
    cursorY += 5;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);
    cursorY += 5;
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    for (const note of product.footerNotes) {
      const noteLines = pdf.splitTextToSize(note, CONTENT_WIDTH);
      for (const nl of noteLines) {
        cursorY = ensurePage(pdf, cursorY, 4);
        pdf.text(nl, MARGIN, cursorY);
        cursorY += 4;
      }
    }
    pdf.setTextColor(0, 0, 0);
  }

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(pdf, i, totalPages);
  }

  const safeName = product.title
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '')
    .trim()
    .slice(0, 60);
  pdf.save(`${safeName}.pdf`);
}

export async function exportResourceFromBank(resource: any): Promise<void> {
  const { buildNormalizedProduct } = await import('./productNormalizer');
  const product = buildNormalizedProduct(resource);
  await exportProductToPremiumPDF(product);
}
