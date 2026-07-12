/**
 * Minimal normalizers for raw API responses → PedagogicalProduct
 *
 * Each normalizer receives the raw backend response (unknown) and returns
 * a PedagogicalProduct if it can be normalized, or null otherwise.
 *
 * No `any`. No `@ts-ignore`. Type guards validate before cast.
 */

import type { PedagogicalProduct, SupportedProductType, ProductMetadata } from './types';

/** Check if an object has a string property */
function hasStringProp(obj: unknown, key: string): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj && typeof (obj as Record<string, unknown>)[key] === 'string';
}

/** Extract metadata from any raw product response */
function extractMetadata(raw: Record<string, unknown>): ProductMetadata {
  return {
    title: typeof raw.title === 'string' ? raw.title : 'Producto',
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : undefined,
    level: typeof raw.level === 'string' ? raw.level : undefined,
    subject: typeof raw.subject === 'string' ? raw.subject : undefined,
    oaCode: typeof raw.objectiveCode === 'string' ? raw.objectiveCode : undefined,
    oaText: typeof raw.objectiveText === 'string' ? raw.objectiveText : undefined,
    topic: typeof raw.topic === 'string' ? raw.topic : undefined,
    date: typeof raw.date === 'string' ? raw.date : undefined,
    teacherName: typeof raw.teacherName === 'string' ? raw.teacherName : undefined,
  };
}

/**
 * Normalize a ticket_salida response
 * Raw: { title, subtitle, type: 'ticket_salida', questions: [...], instructions, ... }
 */
export function normalizeTicket(raw: unknown): PedagogicalProduct | null {
  if (!hasStringProp(raw, 'title')) return null;
  const r = raw as Record<string, unknown>;
  const type = r.type as string;
  if (type !== 'ticket_salida' && type !== 'ticket_entrada') return null;

  return {
    type: type as SupportedProductType,
    metadata: extractMetadata(r),
    data: {
      questions: Array.isArray(r.questions) ? r.questions : [],
      instructions: r.instructions,
      ticketType: type === 'ticket_salida' ? 'salida' : 'entrada',
    },
  };
}

/**
 * Normalize a formato_321 response
 * Raw: { title, subtitle, type: 'formato_321', sections: [...], instructions, ... }
 */
export function normalizeThreeTwoOne(raw: unknown): PedagogicalProduct | null {
  if (!hasStringProp(raw, 'title')) return null;
  const r = raw as Record<string, unknown>;
  if (r.type !== 'formato_321') return null;

  const sections = Array.isArray(r.sections) ? r.sections : [];
  const cards = sections.map((s: unknown) => {
    if (typeof s !== 'object' || s === null) return null;
    const sec = s as Record<string, unknown>;
    const num = typeof sec.number === 'number' ? sec.number : 0;
    return {
      type: num === 3 ? 'three' as const : num === 2 ? 'two' as const : 'one' as const,
      prompt: typeof sec.title === 'string' ? sec.title : '',
      items: Array.from({ length: num }, () => ''),
    };
  }).filter(Boolean);

  return {
    type: 'formato_321',
    metadata: extractMetadata(r),
    data: {
      cards,
      instructions: r.instructions,
    },
  };
}

/**
 * Normalize a lista_cotejo response
 * Raw: { title, subtitle, type: 'lista_cotejo', criteria: [...], instructions, ... }
 */
export function normalizeChecklist(raw: unknown): PedagogicalProduct | null {
  if (!hasStringProp(raw, 'title')) return null;
  const r = raw as Record<string, unknown>;
  if (r.type !== 'lista_cotejo' && r.type !== 'checklist') return null;

  const rawCriteria = Array.isArray(r.criteria) ? r.criteria : [];
  const items = rawCriteria.map((c: unknown) => {
    if (typeof c !== 'object' || c === null) return { criterion: String(c), achieved: false };
    const crit = c as Record<string, unknown>;
    return {
      criterion: typeof crit.description === 'string' ? crit.description : typeof crit.criterion === 'string' ? crit.criterion : '',
      achieved: false,
      observed: false,
    };
  });

  return {
    type: 'lista_cotejo',
    metadata: extractMetadata(r),
    data: {
      items,
      instructions: r.instructions,
      observations: r.teacherNotes,
    },
  };
}

/**
 * Normalize a rubrica_formativa response
 * Raw: { title, subtitle, type: 'rubrica_formativa', criteria: [...], instructions, ... }
 */
export function normalizeRubric(raw: unknown): PedagogicalProduct | null {
  if (!hasStringProp(raw, 'title')) return null;
  const r = raw as Record<string, unknown>;
  if (r.type !== 'rubrica_formativa' && r.type !== 'rubrica') return null;

  const rawCriteria = Array.isArray(r.criteria) ? r.criteria : [];
  const criteria = rawCriteria.map((c: unknown) => {
    if (typeof c !== 'object' || c === null) return null;
    const crit = c as Record<string, unknown>;
    const rawLevels = Array.isArray(crit.levels) ? crit.levels : [];
    const levels = rawLevels.map((l: unknown) => {
      if (typeof l !== 'object' || l === null) return null;
      const lev = l as Record<string, unknown>;
      return {
        name: typeof lev.level === 'string' ? lev.level : '',
        description: typeof lev.description === 'string' ? lev.description : '',
        score: typeof lev.points === 'number' ? lev.points : 0,
      };
    }).filter(Boolean);
    return {
      name: typeof crit.name === 'string' ? crit.name : typeof crit.criterion === 'string' ? crit.criterion : '',
      description: typeof crit.description === 'string' ? crit.description : undefined,
      levels,
    };
  }).filter(Boolean);

  const levels = criteria.length > 0 && criteria[0]?.levels
    ? criteria[0].levels.filter((l): l is { name: string; description: string; score: number } => l !== null).map((l) => l.name)
    : [];

  return {
    type: 'rubrica_formativa',
    metadata: extractMetadata(r),
    data: {
      criteria,
      levels,
      description: r.instructions,
      totalPoints: r.totalScore,
    },
  };
}

/**
 * Normalize guide (guia_estudiante / guia_docente)
 * Raw: { title, subtitle, objective, activities: [...], vocabulary, ... }
 * NOTE: guide objects from API have NO `type` field
 */
export function normalizeGuide(raw: unknown, guideType: 'guia_estudiante' | 'guia_docente'): PedagogicalProduct | null {
  if (!hasStringProp(raw, 'title')) return null;
  const r = raw as Record<string, unknown>;

  const rawActivities = Array.isArray(r.activities) ? r.activities : [];
  const sections = rawActivities.map((a: unknown) => {
    if (typeof a !== 'object' || a === null) return null;
    const act = a as Record<string, unknown>;
    return {
      title: typeof act.name === 'string' ? act.name : '',
      content: typeof act.description === 'string' ? act.description : '',
      activities: Array.isArray(act.steps) ? act.steps.map(String) : [],
    };
  }).filter(Boolean);

  return {
    type: guideType,
    metadata: extractMetadata(r),
    data: {
      sections,
      objective: r.objective,
      materials: r.vocabulary,
      evaluation: r.selfAssessment,
      instructions: r.instructions,
    },
  };
}

/**
 * Normalize bitacora_cientifica
 * Can be ClassroomScientificNotebook or legacy format
 */
export function normalizeBitacora(raw: unknown): PedagogicalProduct | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;

  // ClassroomScientificNotebook has 'materials' and 'procedure' and 'assessment'
  if ('materials' in r && 'procedure' in r && 'assessment' in r) {
    return {
      type: 'bitacora_cientifica',
      metadata: {
        title: typeof r.title === 'string' ? r.title : 'Bitácora Científica',
        subtitle: typeof r.subtitle === 'string' ? r.subtitle : undefined,
        level: typeof r.level === 'string' ? r.level : undefined,
        subject: typeof r.subject === 'string' ? r.subject : undefined,
      },
      data: raw as Record<string, unknown>,
    };
  }

  // Legacy format
  if (hasStringProp(r, 'title') && hasStringProp(r, 'type') && r.type === 'bitacora_cientifica') {
    return {
      type: 'bitacora_cientifica',
      metadata: extractMetadata(r),
      data: r,
    };
  }

  return null;
}

/**
 * Master normalizer: tries each normalizer in order
 */
export function normalizeProduct(raw: unknown, selectedProducto?: string): PedagogicalProduct | null {
  if (typeof raw !== 'object' || raw === null) return null;

  // Try bitacora first (has special structure)
  const bitacora = normalizeBitacora(raw);
  if (bitacora) return bitacora;

  // Check if raw has a `type` field
  const r = raw as Record<string, unknown>;
  const rawType = typeof r.type === 'string' ? r.type : null;

  if (rawType === 'ticket_salida' || rawType === 'ticket_entrada') return normalizeTicket(raw);
  if (rawType === 'formato_321') return normalizeThreeTwoOne(raw);
  if (rawType === 'lista_cotejo' || rawType === 'checklist') return normalizeChecklist(raw);
  if (rawType === 'rubrica_formativa' || rawType === 'rubrica') return normalizeRubric(raw);

  // Guides: use selectedProducto to determine type (guides have no `type` field)
  if (selectedProducto === 'guia_estudiante') return normalizeGuide(raw, 'guia_estudiante');
  if (selectedProducto === 'guia_docente') return normalizeGuide(raw, 'guia_docente');

  return null;
}