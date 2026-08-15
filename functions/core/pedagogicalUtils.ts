// Utilidades pedagógicas compartidas entre engines de generación de
// contenido (PptContentEngine, GuiaEngine, ...). Antes vivía solo dentro de
// PptContentEngine.ts; se extrajo aquí porque GuiaEngine también la necesita
// y no tiene sentido que dependa de un módulo específico de PPT
// (PptContentEngine.ts trae consigo truncate/simplificarTextoCurricular/
// splitTextToBullets, que son ajenos a Guías).

// Rangos etarios aproximados por curso, usados para adaptar el lenguaje del
// contenido generado. No son edades legales/exactas, son una guía de
// complejidad de vocabulario y largo de oraciones para el prompt de la IA.
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
