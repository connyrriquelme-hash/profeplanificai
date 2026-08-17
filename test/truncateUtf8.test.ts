import { describe, it, expect } from 'vitest';
import { truncate } from '../functions/core/RubricaEngine';

// Un emoji (ej. 🟢) es un par subrogado: dos code units UTF-16. Si truncate()
// corta con string.slice() crudo puede partir el par por la mitad, dejando
// un surrogate huérfano. Ese surrogate no es UTF-8 válido: al codificar,
// TextEncoder lo reemplaza por U+FFFD — el mismo síntoma de "carácter
// corrupto" que productNormalizer.ts venía parchando en el texto ya generado.
function hasSurrogateCorruption(s: string): boolean {
  const roundTripped = new TextDecoder('utf-8').decode(new TextEncoder().encode(s));
  return roundTripped !== s || roundTripped.includes('�');
}

describe('truncate (RubricaEngine) — UTF-8 surrogate safety', () => {
  it('never leaves a lone surrogate when the cut falls inside an emoji', () => {
    const text = '🟢🟡🔴'.repeat(10) + ' resto del texto de relleno para superar el máximo';
    // Prueba todos los largos de corte posibles alrededor de los emojis
    // para no depender de encontrar el offset exacto que rompe el par.
    for (let max = 2; max <= 30; max++) {
      const result = truncate(text, max);
      expect(hasSurrogateCorruption(result)).toBe(false);
    }
  });

  it('still truncates plain text correctly (no regression)', () => {
    const result = truncate('Identificar las regiones naturales de Chile', 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result.endsWith('...')).toBe(true);
  });

  it('returns short text unchanged', () => {
    expect(truncate('Básico', 60)).toBe('Básico');
    expect(truncate('🟢 corto', 60)).toBe('🟢 corto');
  });
});
