/**
 * Módulo de Importación Curricular — PlanificaIA Chile
 * 
 * Permite cargar, validar, normalizar y almacenar bases curriculares
 * desde archivos JSON preparados a partir de recursos oficiales del
 * Currículum Nacional MINEDUC.
 * 
 * ADVERTENCIA: Este módulo NO realiza scraping automático de sitios web.
 * Los datos oficiales deben ser preparados por el/la docente a partir de
 * archivos descargados manualmente desde fuentes ministeriales chilenas
 * (p. ej. curriculumnacional.mineduc.cl, plataformas de recursos educativos
 * abiertos del Mineduc) o exportados desde planificaciones personales.
 * 
 * Fuentes aceptadas:
 *   - ejemplo_editable:   Base de ejemplo incluida en la app
 *   - oficial_importado:  Datos preparados desde documentos MINEDUC
 *   - docente_personalizado: OA creados o modificados por el/la docente
 */

import type { CurriculumItem } from '../types';

const IMPORTED_KEY = 'planificaia_curriculum_importado';

const CAMPOS_OBLIGATORIOS: (keyof CurriculumItem)[] = [
  'id', 'nivel', 'curso', 'asignatura', 'eje', 'oa', 'habilidad', 'indicadores', 'fuente',
];

const FUENTES_VALIDAS: CurriculumItem['fuente'][] = [
  'ejemplo_editable', 'docente', 'oficial', 'oficial_importado', 'docente_personalizado',
];

export interface ImportValidationError {
  index: number;
  campo: string;
  mensaje: string;
}

export interface ImportValidationResult {
  valid: boolean;
  items: CurriculumItem[];
  errors: ImportValidationError[];
  total: number;
  validCount: number;
  errorCount: number;
  duplicados: string[];
}

export interface ImportStats {
  total: number;
  porNivel: Record<string, number>;
  porAsignatura: Record<string, number>;
  porFuente: Record<string, number>;
}

/**
 * Normaliza un objeto plano a un CurriculumItem estandarizado.
 * - Rellena campos faltantes con valores por defecto
 * - Convierte tipos (strings a arrays donde corresponda)
 * - Asigna fuente por defecto si no es válida
 * - Genera id si no existe
 */
export function normalizeCurriculumItem(raw: Record<string, unknown>, index: number): CurriculumItem {
  const id = raw.id ? String(raw.id).trim() : `importado_${Date.now()}_${index}`;

  const fuente = (() => {
    const f = raw.fuente ? String(raw.fuente).trim() : 'docente_personalizado';
    if ((FUENTES_VALIDAS as string[]).includes(f)) return f as CurriculumItem['fuente'];
    return 'docente_personalizado';
  })();

  const toArray = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  return {
    id,
    fuente,
    nivel: (raw.nivel ? String(raw.nivel).trim() : 'Educación Básica') as CurriculumItem['nivel'],
    curso: raw.curso ? String(raw.curso).trim() : 'No especificado',
    asignatura: raw.asignatura ? String(raw.asignatura).trim() : 'No especificada',
    eje: raw.eje ? String(raw.eje).trim() : 'General',
    oa: raw.oa ? String(raw.oa).trim() : '(OA sin contenido)',
    habilidad: raw.habilidad ? String(raw.habilidad).trim() : 'No especificada',
    indicadores: toArray(raw.indicadores),
    conocimientos: toArray(raw.conocimientos),
    actitudes: toArray(raw.actitudes),
    palabrasClave: toArray(raw.palabrasClave),
    actividadesSugeridas: toArray(raw.actividadesSugeridas),
    evaluacionesSugeridas: toArray(raw.evaluacionesSugeridas),
    recursos: toArray(raw.recursos),
  };
}

/**
 * Valida un string JSON y retorna resultados detallados.
 * Cada item se normaliza antes de validar.
 */
export function validateCurriculumJSON(json: string): ImportValidationResult {
  const result: ImportValidationResult = {
    valid: true,
    items: [],
    errors: [],
    total: 0,
    validCount: 0,
    errorCount: 0,
    duplicados: [],
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return {
      ...result,
      valid: false,
      errors: [{ index: -1, campo: 'json', mensaje: 'Error de sintaxis JSON: ' + (e instanceof Error ? e.message : 'formato inválido') }],
      total: 0,
      errorCount: 1,
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      ...result,
      valid: false,
      errors: [{ index: -1, campo: 'json', mensaje: 'El JSON debe ser un array de objetos. Se recibió: ' + typeof parsed }],
      total: 0,
      errorCount: 1,
    };
  }

  if (parsed.length === 0) {
    return {
      ...result,
      valid: false,
      errors: [{ index: -1, campo: 'json', mensaje: 'El array está vacío. No hay datos para importar.' }],
      total: 0,
      errorCount: 1,
    };
  }

  const seen = new Map<string, number>();

  for (let i = 0; i < parsed.length; i++) {
    const raw = parsed[i];
    if (!raw || typeof raw !== 'object') {
      result.errors.push({ index: i, campo: 'tipo', mensaje: 'Ítem no es un objeto válido' });
      result.errorCount++;
      continue;
    }

    const item = normalizeCurriculumItem(raw as Record<string, unknown>, i);
    const missing: string[] = [];

    for (const campo of CAMPOS_OBLIGATORIOS) {
      const val = item[campo];
      if (campo === 'indicadores') {
        if (!Array.isArray(val) || val.length === 0) {
          missing.push('indicadores (vacío o ausente)');
        }
      } else if (val === undefined || val === null || val === '' || val === 'No especificada' || val === 'No especificado' || (campo === 'oa' && val === '(OA sin contenido)')) {
        missing.push(campo);
      }
    }

    if (missing.length > 0) {
      result.errors.push({
        index: i,
        campo: missing.join(', '),
        mensaje: `Campos obligatorios faltantes o vacíos: ${missing.join(', ')}`,
      });
      result.errorCount++;
      continue;
    }

    if (seen.has(item.id)) {
      result.duplicados.push(item.id);
    }
    seen.set(item.id, i);

    result.items.push(item);
    result.validCount++;
  }

  if (result.errors.length > 0) {
    result.valid = false;
  }

  result.total = parsed.length;
  return result;
}

/**
 * Guarda los items importados en localStorage.
 * Combina con importaciones previas (merge) por defecto.
 */
export function saveImportedData(items: CurriculumItem[]): void {
  if (items.length === 0) return;
  try {
    const prev = getImportedData();
    const existingIds = new Set(prev.map((i) => i.id));
    const nuevos = items.filter((i) => !existingIds.has(i.id));
    const actualizados = items.filter((i) => existingIds.has(i.id));

    const merged = [
      ...prev.map((p) => actualizados.find((a) => a.id === p.id) || p),
      ...nuevos,
    ];

    localStorage.setItem(IMPORTED_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('Error al guardar datos importados:', e);
  }
}

/**
 * Recupera los items importados desde localStorage.
 */
export function getImportedData(): CurriculumItem[] {
  try {
    const raw = localStorage.getItem(IMPORTED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CurriculumItem[];
  } catch {
    return [];
  }
}

/**
 * Retorna estadísticas de los datos importados.
 */
export function getImportStats(items: CurriculumItem[]): ImportStats {
  const porNivel: Record<string, number> = {};
  const porAsignatura: Record<string, number> = {};
  const porFuente: Record<string, number> = {};

  for (const item of items) {
    porNivel[item.nivel] = (porNivel[item.nivel] || 0) + 1;
    porAsignatura[item.asignatura] = (porAsignatura[item.asignatura] || 0) + 1;
    porFuente[item.fuente] = (porFuente[item.fuente] || 0) + 1;
  }

  return { total: items.length, porNivel, porAsignatura, porFuente };
}

/**
 * Elimina todos los datos importados de localStorage.
 */
export function clearImportedData(): void {
  localStorage.removeItem(IMPORTED_KEY);
}

/**
 * Exporta un array de CurriculumItem a string JSON formateado.
 */
export function exportCurriculumJSON(items: CurriculumItem[]): string {
  return JSON.stringify(items, null, 2);
}

/**
 * Cuenta cuántos items importados hay actualmente.
 */
export function countImported(): number {
  return getImportedData().length;
}
