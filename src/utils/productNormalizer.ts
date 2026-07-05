/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ProductSection {
  title: string;
  content: string;
  kind: 'text' | 'list' | 'table' | 'callout' | 'checklist';
}

export interface ProductTable {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface ProductCallout {
  type: 'importante' | 'docente' | 'familia' | 'estudiante' | 'dua';
  text: string;
}

export interface ProductChart {
  type: 'bar' | 'timeline' | 'process';
  title: string;
  data: { label: string; value: number }[];
}

export interface NormalizedProduct {
  id: string;
  title: string;
  type: string;
  displayType: string;
  level: string;
  subject: string;
  oaCode: string;
  oaText: string;
  classTitle: string;
  sourceTab: string;
  createdAt: string;
  sections: ProductSection[];
  tables: ProductTable[];
  callouts: ProductCallout[];
  charts: ProductChart[];
  checklist: string[];
  footerNotes: string[];
  rawMarkdown: string;
}

const TECHNICAL_FIELDS = new Set([
  'aiGenerated', 'provider', 'model', 'warnings', 'detailed',
  'teacherEditable', 'generatedAt', 'chileContext', 'kind',
  'action', 'rawPayload',
]);

function fixEncoding(s: string): string {
  if (!s) return '';
  let t = s;
  t = t.replace(/\u0027/g, "'");
  t = t.replace(/\u0022/g, '"');
  t = t.replace(/\\u003c/g, '<');
  t = t.replace(/\\u003e/g, '>');
  t = t.replace(/\\n/g, '\n');
  t = t.replace(/\\t/g, '  ');
  t = t.replace(/[\uFFFD]/g, '');
  t = t.replace(/(\d)\u00B0/g, '$1°');
  t = t.replace(/(\d)°/g, '$1°');
  t = t.replace(/\u00E1/g, 'á');
  t = t.replace(/\u00E9/g, 'é');
  t = t.replace(/\u00ED/g, 'í');
  t = t.replace(/\u00F3/g, 'ó');
  t = t.replace(/\u00FA/g, 'ú');
  t = t.replace(/\u00F1/g, 'ñ');
  t = t.replace(/\u00FC/g, 'ü');
  t = t.replace(/7° B.sico/g, '7° Básico');
  t = t.replace(/(\d)° B.sico/g, '$1° Básico');
  return t;
}

function stripTechnicalFields(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(stripTechnicalFields);
  const out: any = {};
  for (const key of Object.keys(obj)) {
    if (TECHNICAL_FIELDS.has(key)) continue;
    if (key === 'metadata' && typeof obj[key] === 'object') continue;
    out[key] = stripTechnicalFields(obj[key]);
  }
  return out;
}

function extractSectionsFromMarkdown(text: string): ProductSection[] {
  const lines = text.split('\n');
  const sections: ProductSection[] = [];
  let current: ProductSection | null = null;

  for (const line of lines) {
    const h3 = line.match(/^###\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h1 = line.match(/^#\s+(.+)/);
    const heading = h3 || h2 || h1;

    if (heading) {
      if (current) sections.push(current);
      current = { title: heading[1].trim(), content: '', kind: 'text' };
    } else if (current) {
      current.content += (current.content ? '\n' : '') + line;
    } else {
      if (!current) current = { title: '', content: '', kind: 'text' };
      current.content += (current.content ? '\n' : '') + line;
    }
  }
  if (current) sections.push(current);

  return sections
    .map((s) => ({
      ...s,
      content: s.content.trim(),
      kind: (s.content.match(/^- /gm) ? 'list' : s.kind) as any,
    }))
    .filter((s) => s.content);
}

function extractSectionsFromStructured(obj: any): ProductSection[] {
  const sections: ProductSection[] = [];

  if (obj.content && Array.isArray(obj.content)) {
    for (const item of obj.content) {
      if (typeof item === 'string') {
        const subSections = extractSectionsFromMarkdown(item);
        sections.push(...subSections);
      } else if (typeof item === 'object' && item.title) {
        sections.push({
          title: item.title || '',
          content: item.text || item.content || item.description || '',
          kind: 'text',
        });
      }
    }
  }

  if (obj.sections && Array.isArray(obj.sections)) {
    for (const s of obj.sections) {
      sections.push({
        title: s.title || s.titulo || s.heading || '',
        content: s.content || s.text || s.contenido || '',
        kind: s.kind || s.type || 'text',
      });
    }
  }

  if (obj.titulo || obj.title) {
    sections.unshift({
      title: '',
      content: obj.titulo || obj.title || '',
      kind: 'text',
    });
  }

  if (obj.proposito || obj.purpose) {
    sections.push({
      title: 'Propósito',
      content: obj.proposito || obj.purpose || '',
      kind: 'text',
    });
  }

  if (obj.instrucciones || obj.instructions) {
    sections.push({
      title: 'Instrucciones',
      content: obj.instrucciones || obj.instructions || '',
      kind: 'text',
    });
  }

  return sections.filter((s) => s.content);
}

function extractTables(obj: any): ProductTable[] {
  const tables: ProductTable[] = [];

  if (obj.tablas && Array.isArray(obj.tablas)) {
    for (const t of obj.tablas) {
      tables.push({
        title: t.title || t.titulo || '',
        columns: t.columns || t.columnas || [],
        rows: t.rows || t.filas || [],
      });
    }
  }

  if (obj.tables && Array.isArray(obj.tables)) {
    for (const t of obj.tables) {
      tables.push({
        title: t.title || '',
        columns: t.columns || [],
        rows: t.rows || [],
      });
    }
  }

  return tables;
}

function extractCallouts(obj: any): ProductCallout[] {
  const callouts: ProductCallout[] = [];

  if (obj.callouts && Array.isArray(obj.callouts)) {
    for (const c of obj.callouts) {
      callouts.push({
        type: c.type || c.tipo || 'importante',
        text: c.text || c.texto || '',
      });
    }
  }

  return callouts;
}

function extractCharts(obj: any): ProductChart[] {
  const charts: ProductChart[] = [];

  if (obj.graficos && Array.isArray(obj.graficos)) {
    for (const g of obj.graficos) {
      charts.push({
        type: g.type || g.tipo || 'bar',
        title: g.title || g.titulo || '',
        data: g.data || g.datos || [],
      });
    }
  }

  if (obj.charts && Array.isArray(obj.charts)) {
    for (const g of obj.charts) {
      charts.push({
        type: g.type || 'bar',
        title: g.title || '',
        data: g.data || [],
      });
    }
  }

  return charts;
}

function contentToMarkdown(sections: ProductSection[]): string {
  return sections
    .map((s) => {
      const prefix = s.title ? `## ${s.title}\n\n` : '';
      return prefix + s.content;
    })
    .join('\n\n');
}

function getTitleFromType(type: string): string {
  const map: Record<string, string> = {
    guia: 'Guía de Aprendizaje',
    guia_aprendizaje: 'Guía de Aprendizaje',
    ficha_trabajo: 'Ficha de Trabajo',
    actividad_pedagogica: 'Actividad Pedagógica',
    recurso_dua: 'Recurso DUA',
    reforzamiento: 'Reforzamiento',
    extension_avanzados: 'Extensión para Avanzados',
    material_apoderados: 'Material para Apoderados',
    banco_preguntas: 'Banco de Preguntas',
    ticket: 'Ticket de Salida',
    ticket_salida: 'Ticket de Salida',
    rubrica: 'Rúbrica',
    evaluacion: 'Evaluación',
    pauta: 'Pauta',
    prueba: 'Prueba',
    simce: 'Instrumento SIMCE',
    retroalimentacion: 'Retroalimentación',
    planificacion_clase: 'Planificación de Clase',
    presentacion: 'Presentación',
    presentation: 'Presentación',
  };
  return map[type] || type;
}

export function normalizeProductContent(
  rawContent: string,
  type: string,
  title?: string,
): NormalizedProduct {
  let parsed: any = {};

  try {
    parsed = JSON.parse(rawContent);
  } catch {
    parsed = { content: rawContent };
  }

  parsed = stripTechnicalFields(parsed);

  let sections: ProductSection[] = [];

  if (parsed.content && typeof parsed.content === 'string') {
    sections = extractSectionsFromMarkdown(parsed.content);
  } else if (parsed.content && Array.isArray(parsed.content)) {
    sections = extractSectionsFromStructured(parsed);
  } else {
    sections = extractSectionsFromStructured(parsed);
  }

  if (sections.length === 0 && typeof rawContent === 'string') {
    const cleaned = fixEncoding(rawContent);
    try {
      const reparsed = JSON.parse(cleaned);
      if (reparsed.content && typeof reparsed.content === 'string') {
        sections = extractSectionsFromMarkdown(reparsed.content);
      } else {
        sections = extractSectionsFromStructured(reparsed);
      }
    } catch {
      sections = extractSectionsFromMarkdown(cleaned);
    }
  }

  const tables = extractTables(parsed);
  const callouts = extractCallouts(parsed);
  const charts = extractCharts(parsed);
  const checklist = parsed.checklist || [];
  const footerNotes = parsed.footerNotes || parsed.footer_notes || [];

  const allText = sections.map((s) => s.content).join('\n');
  const encoded = fixEncoding(allText);
  if (encoded !== allText) {
    for (const s of sections) {
      s.content = fixEncoding(s.content);
    }
  }

  const rawMarkdown = contentToMarkdown(sections);

  const lessonObj = parsed.lesson || {};
  const curriculumObj = parsed.curriculum || {};

  return {
    id: '',
    title: title || parsed.title || parsed.titulo || getTitleFromType(type),
    type,
    displayType: getTitleFromType(type),
    level: lessonObj.course || '',
    subject: lessonObj.subject || '',
    oaCode: curriculumObj.oaCode || curriculumObj.code || '',
    oaText: curriculumObj.oaText || curriculumObj.text || '',
    classTitle: lessonObj.title || '',
    sourceTab: '',
    createdAt: '',
    sections,
    tables,
    callouts,
    charts,
    checklist,
    footerNotes,
    rawMarkdown,
  };
}

export function buildNormalizedProduct(
  bankResource: any,
): NormalizedProduct {
  const meta = (() => {
    try {
      return JSON.parse(bankResource.metadata_json || '{}');
    } catch {
      return {};
    }
  })();

  const product = normalizeProductContent(
    bankResource.content || '',
    bankResource.type || '',
    bankResource.title || '',
  );

  product.id = bankResource.id || '';
  product.level = bankResource.level || product.level;
  product.subject = bankResource.subject || product.subject;
  product.oaCode = bankResource.objective_code || product.oaCode;
  product.oaText = bankResource.objective_text || product.oaText;
  product.sourceTab = meta.sourceTab || '';
  product.classTitle = meta.classTitle || product.classTitle;
  product.createdAt = bankResource.created_at || '';

  return product;
}
