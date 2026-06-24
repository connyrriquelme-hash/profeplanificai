import { describe, it, expect } from 'vitest';
import { getDB, searchCurriculum, getNiveles, getAsignaturas } from '../services/curriculumService';

describe('Curriculum DB', () => {
  it('has at least 200 entries', () => {
    expect(getDB().length).toBeGreaterThanOrEqual(200);
  });

  it('all entries have required fields', () => {
    for (const item of getDB()) {
      expect(item.id).toBeTruthy();
      expect(item.curso).toBeTruthy();
      expect(item.asignatura).toBeTruthy();
      expect(item.oa).toBeTruthy();
      expect(item.eje).toBeTruthy();
      expect(item.habilidad).toBeTruthy();
      expect(Array.isArray(item.indicadores)).toBe(true);
    }
  });
});

describe('searchCurriculum', () => {
  it('returns all items when no query or filters', () => {
    expect(searchCurriculum('').length).toBe(getDB().length);
  });

  it('filters by asignatura', () => {
    const results = searchCurriculum('', { asignatura: 'Matemática' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((o) => o.asignatura === 'Matemática')).toBe(true);
  });

  it('searches by text in OA', () => {
    const results = searchCurriculum('narrativo');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty array for non-matching query', () => {
    const results = searchCurriculum('zzzxnombrequenoexistexxx');
    expect(results).toHaveLength(0);
  });
});

describe('getNiveles', () => {
  it('returns unique niveles', () => {
    const niveles = getNiveles();
    expect(niveles.length).toBeGreaterThanOrEqual(2);
  });
});

describe('getAsignaturas', () => {
  it('returns unique asignaturas', () => {
    const asigs = getAsignaturas();
    expect(asigs).toContain('Lenguaje y Comunicación');
    expect(asigs).toContain('Matemática');
  });
});
