import type { CurriculumItem } from '../types';
import db from '../../data/curriculum-chile-db.json';
import { getBaseCurriculum } from '../data/base-curriculum';

const FAV_KEY = 'planificaia_oa_favoritos';
const SELECTED_KEY = 'planificaia_selectedCurriculumItem';

const DB: CurriculumItem[] = [
  ...(db as CurriculumItem[]),
  ...getBaseCurriculum(),
];

export function getDB(): CurriculumItem[] {
  return DB;
}

export function searchCurriculum(query: string, filters?: {
  nivel?: string;
  curso?: string;
  asignatura?: string;
  eje?: string;
}): CurriculumItem[] {
  let results = DB;

  if (filters?.nivel) results = results.filter((i) => i.nivel === filters.nivel);
  if (filters?.curso) results = results.filter((i) => i.curso === filters.curso);
  if (filters?.asignatura) results = results.filter((i) => i.asignatura === filters.asignatura);
  if (filters?.eje) results = results.filter((i) => i.eje === filters.eje);

  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(
      (i) =>
        i.oa.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.asignatura.toLowerCase().includes(q) ||
        i.eje.toLowerCase().includes(q) ||
        i.habilidad.toLowerCase().includes(q) ||
        i.indicadores.some((ind) => ind.toLowerCase().includes(q)) ||
        i.palabrasClave.some((p) => p.toLowerCase().includes(q)) ||
        i.conocimientos.some((c) => c.toLowerCase().includes(q))
    );
  }

  return results;
}

export function getNiveles(): string[] {
  return [...new Set(DB.map((i) => i.nivel))].sort();
}

export function getCursos(): string[] {
  return [...new Set(DB.map((i) => i.curso))].sort((a, b) => {
    const order: Record<string, number> = {
      'Prekinder': 0, 'Kinder': 1,
      '1° básico': 2, '2° básico': 3, '3° básico': 4, '4° básico': 5,
      '5° básico': 6, '6° básico': 7, '7° básico': 8, '8° básico': 9,
      '1° medio': 10, '2° medio': 11, '3° medio': 12, '4° medio': 13,
    };
    return (order[a] ?? 99) - (order[b] ?? 99);
  });
}

export function getAsignaturas(): string[] {
  return [...new Set(DB.map((i) => i.asignatura))].sort();
}

export function getEjes(asignatura?: string): string[] {
  const filtered = asignatura ? DB.filter((i) => i.asignatura === asignatura) : DB;
  return [...new Set(filtered.map((i) => i.eje))].sort();
}

export function getFavoritos(): CurriculumItem[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const ids: string[] = JSON.parse(raw);
    return DB.filter((item) => ids.includes(item.id));
  } catch {
    return [];
  }
}

export function isFavorito(id: string): boolean {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return false;
    const ids: string[] = JSON.parse(raw);
    return ids.includes(id);
  } catch {
    return false;
  }
}

export function toggleFavorito(id: string): boolean {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const idx = ids.indexOf(id);
    if (idx >= 0) {
      ids.splice(idx, 1);
      localStorage.setItem(FAV_KEY, JSON.stringify(ids));
      return false;
    } else {
      ids.push(id);
      localStorage.setItem(FAV_KEY, JSON.stringify(ids));
      return true;
    }
  } catch {
    return false;
  }
}

export function setSelectedCurriculumItem(item: CurriculumItem): void {
  localStorage.setItem(SELECTED_KEY, JSON.stringify(item));
}

export function getSelectedCurriculumItem(): CurriculumItem | null {
  try {
    const raw = localStorage.getItem(SELECTED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSelectedCurriculumItem(): void {
  localStorage.removeItem(SELECTED_KEY);
}

export function getAutoSuggestions(item: CurriculumItem): import('../types').AutoSuggestion {
  const actividadMap: Record<string, string> = {
    'Lectura': 'Lectura compartida',
    'Escritura': 'Taller de escritura',
    'Comunicación Oral': 'Discusión guiada',
    'Números': 'Juego numérico',
    'Álgebra': 'Resolución de problemas',
    'Geometría': 'Exploración geométrica',
    'Datos y Probabilidades': 'Análisis de datos',
    'Medición': 'Experiencia de medición',
    'Materia': 'Experimento guiado',
    'Seres Vivos': 'Observación naturalista',
    'Ciencias Físicas': 'Indagación guiada',
    'Historia': 'Análisis de fuentes',
    'Geografía': 'Lectura de mapas',
    'Formación Ciudadana': 'Debate y reflexión',
    'Artes Visuales': 'Creación artística',
    'Música': 'Exploración sonora',
  };
  const tipoActividad = actividadMap[item.eje] || 'Actividad guiada';
  const instrumento = item.evaluacionesSugeridas[0] || 'Pauta de observación con escala de logro';

  return {
    proposito: `Que los y las estudiantes ${item.habilidad.toLowerCase()} en el contexto de ${item.eje.toLowerCase()}, aplicando conocimientos sobre ${item.conocimientos.slice(0, 2).join(' y ') || item.asignatura}.`,
    habilidadPrincipal: item.habilidad,
    indicadores: [...item.indicadores],
    tipoActividad,
    instrumentoEvaluacion: instrumento,
    criteriosLogro: [
      `Demuestra ${item.habilidad.toLowerCase()} relacionando el contenido con situaciones concretas.`,
      `Comunica resultados o conclusiones usando vocabulario disciplinar pertinente.`,
      `Justifica sus respuestas con evidencia del texto, problema o experimento.`,
      `Participa activamente en trabajo colaborativo, respetando turnos y aportando ideas.`,
    ],
    recursosSugeridos: item.recursos.slice(0, 4).length > 0
      ? item.recursos.slice(0, 4)
      : ['Guía impresa con instrucciones paso a paso', 'Material concreto o manipulativo', 'Apoyo visual (lámina, diagrama, mapa)', 'Hoja de registro o bitácora'],
    adecuacionesDUA: [
      `Representación: Instrucciones orales + apoyo visual, vocabulario clave destacado, organizador gráfico.`,
      `Acción: Opción de responder oral, escrita, dibujada o seleccionando.`,
      `Participación: Roles definidos en equipo, elección de tarea o nivel de desafío.`,
    ],
  };
}

export function importCurriculumJSON(json: string): { count: number; errors: string[] } {
  try {
    const data: CurriculumItem[] = JSON.parse(json);
    const errors: string[] = [];
    let count = 0;
    if (!Array.isArray(data)) {
      return { count: 0, errors: ['El JSON debe ser un array de objetos CurriculumItem'] };
    }
    for (const item of data) {
      if (!item.id || !item.oa || !item.curso || !item.asignatura) {
        errors.push(`Item sin campos requeridos (id, oa, curso, asignatura)`);
        continue;
      }
      DB.push(item);
      count++;
    }
    return { count, errors };
  } catch (e) {
    return { count: 0, errors: ['Error al parsear JSON: ' + (e instanceof Error ? e.message : 'desconocido')] };
  }
}
