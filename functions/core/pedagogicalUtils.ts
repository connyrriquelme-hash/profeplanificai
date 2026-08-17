// Utilidades pedagógicas compartidas entre engines de generación de
// contenido (PptContentEngine, GuiaEngine, BitacoraEngine, ...). Antes
// vivía solo dentro de PptContentEngine.ts; se extrajo aquí porque
// GuiaEngine y los engines de evaluación también la necesitan.

// ─── Rangos etarios ───

export function inferRangoEtario(curso: string): string {
  const c = (curso || '').toLowerCase();
  const grado = Number(c.match(/(\d+)/)?.[1] ?? NaN);

  if (/sala cuna|nivel medio|nivel transici|prekinder|pre-kinder|prekínder|kinder|kínder|parvularia/.test(c)) {
    return '3-5 años: frases de una sola idea, vocabulario muy concreto y cotidiano (cosas que se ven, tocan o hacen), apoyo constante en ejemplos y juego, sin conceptos abstractos';
  }
  if (c.includes('medio')) {
    return '14-18 años (Enseñanza Media): registro más adulto, mayor autonomía lectora, vocabulario técnico permitido y explicado con claridad la primera vez que aparece, mantener concisión';
  }
  if (c.includes('básico') || c.includes('basico')) {
    if (!Number.isNaN(grado) && grado <= 2) {
      return '6-8 años (1°-2° Básico): oraciones muy cortas (máximo 10 palabras), vocabulario cotidiano, evitar términos abstractos, usar comparaciones con objetos o situaciones del hogar o el patio';
    }
    if (!Number.isNaN(grado) && grado <= 6) {
      return '8-12 años (3°-6° Básico): oraciones simples, términos técnicos del área permitidos si se explican con un ejemplo concreto inmediatamente después';
    }
    return '12-14 años (7°-8° Básico): vocabulario más técnico permitido, siempre explicado con claridad la primera vez que aparece';
  }
  return '8-12 años: oraciones simples, algunos términos técnicos explicados con un ejemplo concreto';
}

// ─── Detección de contenido genérico/débil ───
// Compartido entre engines de evaluación formativa (BitacoraEngine,
// SemaforoEngine, TicketSalidaEngine, ListaCotejoEngine, Format321Engine)
// y RubricaEngine. Mismo patrón que FORBIDDEN_PHRASES / isGenericOrWeak
// en RubricaEngine.ts:1147-1168 — la idea es tener UNA sola fuente de
// verdad para las frases prohibidas y la lógica de detección.

/** Frases genéricas que la IA repite como fallback de calidad baja. */
export const FORBIDDEN_PHRASES: readonly string[] = [
  'cumple completamente', 'cumple parcialmente', 'no cumple',
  'excelente', 'bueno', 'regular', 'insuficiente',
  'demuestra comprensión del contenido', 'aplica el concepto', 'trabajo colaborativo',
  'participa en clase', 'presta atención', 'se esfuerza',
  'actividad colaborativa en situación real',
  'actividades variadas y enriquecedoras',
];

/** Patrón para detectar lenguaje de estado interno (no observable). */
export const INTERNAL_STATE_PATTERN = /\bsiente\b|\bsentimientos?\b|\bpiensa que\b/i;

/** Evaluación genérica de consignas/indicadores. */
export function isGenericOrWeak(text: string, siblingTexts: string[] = []): boolean {
  const normalized = (text || '').trim().toLowerCase();
  if (normalized.length < 20) return true;
  if (FORBIDDEN_PHRASES.includes(normalized)) return true;
  if (siblingTexts.some((s) => s.trim().toLowerCase() === normalized)) return true;
  if (INTERNAL_STATE_PATTERN.test(normalized)) return true;
  return false;
}

/**
 * Valida que un texto mencione el tema o un concepto derivado.
 * Devuelve true si el texto parece estar ligado al tema.
 */
export function mentionsTopic(text: string, topic: string): boolean {
  if (!topic) return true;
  const t = topic.toLowerCase();
  const words = t.split(/\s+/).filter((w) => w.length > 3);
  const textLower = text.toLowerCase();
  return words.some((w) => textLower.includes(w));
}
