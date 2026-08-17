import { describe, it, expect, vi } from 'vitest';
import { isGenericOrWeak, mentionsTopic, FORBIDDEN_PHRASES, INTERNAL_STATE_PATTERN } from '../functions/core/pedagogicalUtils';

describe('pedagogicalUtils — isGenericOrWeak', () => {
  it('detecta texto vacío', () => {
    expect(isGenericOrWeak('')).toBe(true);
  });

  it('detecta texto corto (< 20 chars)', () => {
    expect(isGenericOrWeak('Escribe algo')).toBe(true);
  });

  it('detecta frase prohibida exacta', () => {
    expect(isGenericOrWeak('excelente')).toBe(true);
    expect(isGenericOrWeak('participa en clase')).toBe(true);
  });

  it('detecta patrón de estado interno', () => {
    expect(isGenericOrWeak('El estudiante siente interés por la materia')).toBe(true);
    expect(isGenericOrWeak('Demuestra sentimientos positivos')).toBe(true);
    expect(isGenericOrWeak('Piensa que es importante')).toBe(true);
  });

  it('detecta duplicado entre hermanos', () => {
    const siblings = ['Describo los proceso celulares con ejemplos concretos del día a día'];
    expect(isGenericOrWeak('Describo los proceso celulares con ejemplos concretos del día a día', siblings)).toBe(true);
  });

  it('acepta texto largo, específico y no duplicado', () => {
    expect(isGenericOrWeak(
      'Describo los procesos celulares usando ejemplos concretos del día a día en la clase de hoy',
      ['Otro texto completamente distinto sobre plantas'],
    )).toBe(false);
  });

  it('FORBIDDEN_PHRASES contiene al menos 10 elementos', () => {
    expect(FORBIDDEN_PHRASES.length).toBeGreaterThanOrEqual(10);
  });
});

describe('pedagogicalUtils — mentionsTopic', () => {
  it('retorna true si topic está vacío', () => {
    expect(mentionsTopic('cualquier cosa', '')).toBe(true);
  });

  it('retorna true si el texto menciona palabras del tema', () => {
    expect(mentionsTopic('Explica la célula con un modelo', 'célula y membrana')).toBe(true);
  });

  it('retorna false si el texto no menciona ninguna palabra del tema', () => {
    expect(mentionsTopic('Escribe tu opinión general', 'fotosíntesis')).toBe(false);
  });
});

describe('pedagogicalUtils — INTERNAL_STATE_PATTERN', () => {
  it('detecta "siente"', () => {
    expect(INTERNAL_STATE_PATTERN.test('El estudiante siente curiosidad')).toBe(true);
  });

  it('detecta "sentimiento"', () => {
    expect(INTERNAL_STATE_PATTERN.test('Muestra sentimientos positivos')).toBe(true);
  });

  it('detecta "piensa que"', () => {
    expect(INTERNAL_STATE_PATTERN.test('Piensa que es fácil')).toBe(true);
  });

  it('no detecta texto válido sin patrón de estado interno', () => {
    expect(INTERNAL_STATE_PATTERN.test('Explica con sus palabras')).toBe(false);
  });
});
