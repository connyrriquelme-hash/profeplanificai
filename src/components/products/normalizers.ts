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

function extractPremiumExtras(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    tablas: Array.isArray(raw.tablas) ? raw.tablas : Array.isArray(raw.tables) ? raw.tables : undefined,
    callouts: Array.isArray(raw.callouts) ? raw.callouts : undefined,
    graficos: Array.isArray(raw.graficos) ? raw.graficos : Array.isArray(raw.charts) ? raw.charts : undefined,
    checklist: Array.isArray(raw.checklist) ? raw.checklist : undefined,
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
      ...extractPremiumExtras(r),
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
      ...extractPremiumExtras(r),
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
      ...extractPremiumExtras(r),
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
      ...extractPremiumExtras(r),
    },
  };
}

/**
 * Normalize guide (guia_estudiante / guia_docente)
 * Raw (desde GuiaEngine, functions/core/GuiaEngine.ts): { title, objective, textoLectura?, sections: GuideSection[], images?, imageTitles? }
 * GuiaEngine ya genera "sections" en el shape exacto que GuideRenderer.tsx
 * consume (title/content/activities?) — este normalizer es un passthrough,
 * no traduce nombres de campo ni reconstruye materials/evaluation/duration
 * a partir de las secciones. textoLectura solo viene en guia_estudiante
 * (GuiaResult.textoLectura es opcional — la guía docente nunca lo trae).
 * NOTE: guide objects from API have NO `type` field
 */
export function normalizeGuide(raw: unknown, guideType: 'guia_estudiante' | 'guia_docente'): PedagogicalProduct | null {
  if (!hasStringProp(raw, 'title')) return null;
  const r = raw as Record<string, unknown>;

  return {
    type: guideType,
    metadata: extractMetadata(r),
    data: {
      sections: r.sections,
      objective: r.objective,
      textoLectura: r.textoLectura,
      images: r.images,
      imageTitles: r.imageTitles,
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
      data: { ...r, ...extractPremiumExtras(r) },
    };
  }

  return null;
}

/**
 * Normalize planificacion response
 * Raw: { planificacion: { unit, classes: [...], methodology, dua, evaluation }, usedFallback }
 * Or: { unit, classes: [...], methodology, dua, evaluation } (direct structure)
 */
export function normalizePlanificacion(raw: unknown): PedagogicalProduct | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;

  // Handle wrapped format: { planificacion: {...} }
  const plan = (typeof r.planificacion === 'object' && r.planificacion !== null)
    ? r.planificacion as Record<string, unknown>
    : r;

  if (!hasStringProp(plan, 'unit')) return null;

  const unitTitle = typeof plan.unit === 'string' ? plan.unit : 'Planificacion';

  return {
    type: 'planificacion',
    metadata: {
      title: unitTitle,
      subtitle: typeof r.subtitle === 'string' ? r.subtitle : undefined,
      level: typeof r.level === 'string' ? r.level : undefined,
      subject: typeof r.subject === 'string' ? r.subject : undefined,
    },
    data: {
      unit: plan.unit,
      classes: plan.classes,
      methodology: plan.methodology,
      dua: plan.dua,
      evaluation: plan.evaluation,
    },
  };
}

/**
 * Normalize semaforo/traffic_light response
 * Raw: { title, objective, instructions, aspects: [...], colors: [...], teacherNotes }
 */
export function normalizeSemaforo(raw: unknown): PedagogicalProduct | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.type !== 'semaforo' && r.type !== 'evaluation_traffic_light') return null;

  return {
    type: 'semaforo',
    metadata: extractMetadata(r),
    data: {
      objective: r.objective,
      instructions: r.instructions,
      aspects: r.aspects,
      colors: r.colors,
      teacherNotes: r.teacherNotes,
    },
  };
}

/**
 * Normalize unidad_didactica response
 * Raw: { unidad: { ... }, usedFallback } or direct structure
 */
export function normalizeUnidadDidactica(raw: unknown): PedagogicalProduct | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;

  // Handle wrapped format: { unidad: {...} }
  const unidad = (typeof r.unidad === 'object' && r.unidad !== null)
    ? r.unidad as Record<string, unknown>
    : r;

  // Must have some recognizable structure
  if (!hasStringProp(unidad, 'title') && !hasStringProp(unidad, 'unit')) return null;

  return {
    type: 'unidad_didactica',
    metadata: extractMetadata(r),
    data: unidad as Record<string, unknown>,
  };
}

/**
 * Generic fallback normalizer: wraps any raw product into PedagogicalProduct
 * Uses selectedProducto to determine type, puts all data in data field
 */
/**
 * Normaliza un DuaGuide crudo (AIEngine.generateDuaGuide, ver
 * functions/core/types.ts) al shape que espera DUAGuideRenderer:
 * {sections: {principle, strategies}[], principles, learningBarriers,
 * inclusiveAssessment}. DuaGuide no tiene esos campos -- tiene
 * principios_dua.{representacion,accion_expresion,implicacion} (el marco
 * DUA) y nivel_apoyo/nivel_estandar/nivel_desafio (la diferenciación en 3
 * niveles, el valor real de este engine) -- se mapean ambos a secciones
 * para no perder contenido generado.
 */
export function normalizeDuaGuide(raw: unknown): PedagogicalProduct | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.nivel_apoyo) && !Array.isArray(r.nivel_estandar) && !Array.isArray(r.nivel_desafio) && !r.principios_dua) {
    return null;
  }

  const principiosDua = (r.principios_dua as Record<string, unknown>) || {};
  const asStringArray = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

  const sections: { principle: string; strategies: string[] }[] = [
    { principle: 'Nivel de Apoyo', strategies: asStringArray(r.nivel_apoyo) },
    { principle: 'Nivel Estándar', strategies: asStringArray(r.nivel_estandar) },
    { principle: 'Nivel Desafío', strategies: asStringArray(r.nivel_desafio) },
    { principle: 'Representación', strategies: asStringArray(principiosDua.representacion) },
    { principle: 'Acción y Expresión', strategies: asStringArray(principiosDua.accion_expresion) },
    { principle: 'Implicación', strategies: asStringArray(principiosDua.implicacion) },
  ].filter((s) => s.strategies.length > 0);

  const evalInclusiva = (r.evaluacion_formativa_inclusiva as Record<string, unknown>) || {};
  const inclusiveAssessment = [
    ...asStringArray(evalInclusiva.evidencias),
    ...asStringArray(evalInclusiva.preguntas_retroalimentacion),
    ...asStringArray(evalInclusiva.lista_cotejo),
    ...asStringArray(evalInclusiva.retroalimentacion_docente),
  ].join('\n');

  return {
    type: 'guia_dua',
    metadata: {
      title: typeof r.titulo_guia === 'string' ? r.titulo_guia : 'Guía DUA',
      subtitle: typeof r.contexto_motivacional === 'string' ? r.contexto_motivacional : undefined,
      oaText: typeof r.oa_a_trabajar === 'string' ? r.oa_a_trabajar : undefined,
    },
    data: {
      sections,
      principles: ['Representación', 'Acción y Expresión', 'Implicación'],
      learningBarriers: asStringArray(r.barreras_posibles),
      inclusiveAssessment: inclusiveAssessment || undefined,
      adecuaciones: asStringArray(r.adecuaciones_apoyos),
      cierre: asStringArray(r.cierre_inclusivo),
    },
  };
}

export function normalizeGeneric(raw: unknown, selectedProducto: string): PedagogicalProduct | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;

  // Extract title from common field names
  const title = typeof r.title === 'string' ? r.title
    : typeof r.name === 'string' ? r.name
    : 'Producto';

  return {
    type: selectedProducto as SupportedProductType,
    metadata: {
      title,
      subtitle: typeof r.subtitle === 'string' ? r.subtitle : undefined,
      level: typeof r.level === 'string' ? r.level : undefined,
      subject: typeof r.subject === 'string' ? r.subject : undefined,
      oaCode: typeof r.objectiveCode === 'string' ? r.objectiveCode : undefined,
      oaText: typeof r.objectiveText === 'string' ? r.objectiveText : undefined,
    },
    data: r,
  };
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
  if (rawType === 'semaforo' || rawType === 'evaluation_traffic_light') return normalizeSemaforo(raw);

  // Guides: use selectedProducto to determine type (guides have no `type` field)
  if (selectedProducto === 'guia_estudiante') return normalizeGuide(raw, 'guia_estudiante');
  if (selectedProducto === 'guia_docente') return normalizeGuide(raw, 'guia_docente');
  if (selectedProducto === 'guia_dua') return normalizeDuaGuide(raw);

  // Planificacion (has planificacion wrapper or direct structure)
  const planificacion = normalizePlanificacion(raw);
  if (planificacion) return planificacion;

  // Unidad didactica
  const unidad = normalizeUnidadDidactica(raw);
  if (unidad) return unidad;

  // Generic fallback for any remaining products
  if (selectedProducto) {
    return normalizeGeneric(raw, selectedProducto);
  }

  return null;
}
