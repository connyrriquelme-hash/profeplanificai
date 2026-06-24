import { md } from './htmlUtils';

export function generarHTMLImprimible(
  titulo: string,
  nivel: string,
  asignatura: string,
  oa: string,
  contenido: string,
  tipo: string
): string {
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    escH(titulo) + ' · PlanificaIA Chile</title><style>' +
    '@page{size:letter;margin:1.8cm 2cm}' +
    'body{font-family:Georgia,"Times New Roman",serif;color:#222;line-height:1.7;font-size:13px}' +
    '.print-header{text-align:center;border-bottom:2px solid #2563eb;padding-bottom:10px;margin-bottom:16px}' +
    '.print-header h1{font-size:20px;color:#2563eb;margin:0}' +
    '.print-header p{font-size:11px;color:#666;margin:4px 0 0}' +
    '.print-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;font-size:11px;color:#555}' +
    '.print-meta div{background:#f3f4f6;padding:6px 10px;border-radius:4px}' +
    '.print-meta b{display:block;font-size:9px;text-transform:uppercase;color:#888}' +
    '.print-content{padding:8px 0}' +
    '.print-content h1,.print-content h2,.print-content h3{color:#1f2937;margin:16px 0 6px}' +
    '.print-content h1{font-size:17px}.print-content h2{font-size:15px}.print-content h3{font-size:13px}' +
    '.print-content ul{padding-left:18px}.print-content li{margin:3px 0}' +
    '.print-footer{text-align:center;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:10px;margin-top:20px}' +
    '.print-footer .fields{display:flex;justify-content:space-between;margin-bottom:6px}' +
    '.print-footer .fields span{color:#555}' +
    'table{border-collapse:collapse;width:100%;margin:10px 0;font-size:12px}' +
    'td,th{border:1px solid #ddd;padding:6px 8px;text-align:left}' +
    'th{background:#f3f4f6;font-weight:700}' +
    '@media print{body{padding:0;margin:0}.no-print{display:none!important}}' +
    '</style></head><body>' +
    '<div class="print-header"><h1>PlanificaIA Chile</h1><p>Documento generado - ' + new Date().toLocaleDateString('es-CL') + '</p></div>' +
    '<div class="print-meta">' +
    '<div><b>Tipo</b>' + escH(tipo) + '</div>' +
    '<div><b>Nivel</b>' + escH(nivel) + '</div>' +
    '<div><b>Asignatura</b>' + escH(asignatura) + '</div>' +
    '<div><b>OA</b>' + escH(oa) + '</div>' +
    '</div>' +
    '<div class="print-content">' + md(contenido) + '</div>' +
    '<div class="print-footer">' +
    '<div class="fields"><span>Docente: ________________________</span><span>Curso: ________________________</span></div>' +
    'Generado con PlanificaIA Chile · ' + new Date().getFullYear() +
    '</div></body></html>';
}

function escH(s: string): string {
  return (s || '').replace(/[&<>]/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m] || m
  );
}

export function copiarAlPortapapeles(texto: string): void {
  navigator.clipboard.writeText(texto).then(
    () => { /* ok */ }
  ).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = texto;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

export interface ExportOpts {
  titulo?: string;
  nivel?: string;
  asignatura?: string;
  oa?: string;
  contenido?: string;
  tipo?: string;
  action?: 'html' | 'txt' | 'print' | 'pdf' | 'copy';
  el?: HTMLElement | null;
}

export function exportarDocumento(opts: ExportOpts): void {
  const action = opts.action || 'html';
  const titulo = opts.titulo || 'Documento';
  const nivel = opts.nivel || '';
  const asignatura = opts.asignatura || '';
  const oa = opts.oa || '';
  const tipo = opts.tipo || 'Material';
  let contenido = opts.contenido || '';

  if (!contenido && opts.el) {
    const el = opts.el;
    if (action === 'html' || action === 'print' || action === 'pdf') {
      contenido = (el as any)._md || el.textContent || '';
    } else {
      contenido = (el as any)._md || el.textContent || '';
    }
  }

  if (!contenido) return;

  if (action === 'copy') {
    copiarAlPortapapeles(contenido);
    return;
  }

  if (action === 'txt') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([contenido], { type: 'text/plain;charset=utf-8' }));
    a.download = titulo.replace(/[^a-zA-Z0-9áéíóúñ ]/g, '_') + '.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }

  if (action === 'print' || action === 'pdf') {
    const html = generarHTMLImprimible(titulo, nivel, asignatura, oa, contenido, tipo);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
    return;
  }

  // Default: HTML
  const html = generarHTMLImprimible(titulo, nivel, asignatura, oa, contenido, tipo);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  a.download = titulo.replace(/[^a-zA-Z0-9áéíóúñ ]/g, '_') + '.html';
  a.click();
  URL.revokeObjectURL(a.href);
}

// Legacy exports for backward compat
export function downloadHTML(htmlContent: string, filename: string): void {
  const content = '<!doctype html><meta charset="utf-8"><body style="font-family:Arial;line-height:1.5;padding:2cm">' + htmlContent + '</body>';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/html' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function printElement(): void {
  window.print();
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function generatePrintStyles(): string {
  return `
    @media print {
      body { background: white !important; }
      .no-print, nav, header, button, .btnrow { display: none !important; }
      .print-area { display: block !important; }
      .card { box-shadow: none !important; border: 1px solid #ddd !important; page-break-inside: avoid; }
      .output, .output-light { background: white !important; color: black !important; border: 0 !important; }
      .output * { color: black !important; }
      h1, h2, h3 { page-break-after: avoid; }
    }
  `;
}

export function exportAsJSON(data: unknown, filename: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function getDefaultFilename(tipo: string): string {
  const map: Record<string, string> = {
    planificacion: 'planificacion-planificaia',
    recurso: 'recurso-planificaia',
    evaluacion: 'evaluacion-planificaia',
    rubrica: 'rubrica-planificaia',
    ticket: 'ticket-salida-planificaia',
    simce: 'simce-planificaia',
  };
  return (map[tipo] || 'material-planificaia') + '.html';
}
