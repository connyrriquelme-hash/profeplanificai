import { describe, it, expect } from 'vitest';
import {
  detectSubjectCategory,
  buildPremiumRubric,
} from '../functions/api/materials/rubric';

function makeInput(level: string, subject: string) {
  return {
    level,
    subject,
    objectiveCode: 'OA-TEST-001',
    objectiveText: 'Demostra que el alumnado identifica conceptos clave del tema',
    topic: 'Tema de prueba con contenido suficiente',
  };
}

describe('server-side rubric: detectSubjectCategory', () => {
  it('detects Música', () => {
    expect(detectSubjectCategory('Música')).toBe('musica');
  });
  it('detects Educación Física', () => {
    expect(detectSubjectCategory('Educación Física')).toBe('educacion_fisica');
  });
  it('detects Filosofía', () => {
    expect(detectSubjectCategory('Filosofía')).toBe('filosofia');
  });
  it('detects Biología', () => {
    expect(detectSubjectCategory('Biología')).toBe('biologia');
  });
  it('detects Física (not Educación Física)', () => {
    expect(detectSubjectCategory('Física')).toBe('fisica');
  });
  it('detects Química', () => {
    expect(detectSubjectCategory('Química')).toBe('quimica');
  });
  it('detects Ciencias para la Ciudadanía', () => {
    expect(detectSubjectCategory('Ciencias para la Ciudadanía')).toBe('ciencias_ciudadania');
  });
  it('detects Educación Parvularia', () => {
    expect(detectSubjectCategory('Educación Parvularia')).toBe('parvularia');
  });
  it('English is not Ciencias', () => {
    expect(detectSubjectCategory('Inglés')).not.toBe('ciencias');
  });
  it('Ed.Física is not Física (physics)', () => {
    expect(detectSubjectCategory('Educación Física')).not.toBe('fisica');
  });
  it('Ciencias para la Ciudadanía is not generic Ciencias', () => {
    expect(detectSubjectCategory('Ciencias para la Ciudadanía')).not.toBe('ciencias');
  });
  it('unknown subject falls back to general', () => {
    expect(detectSubjectCategory('Sujeto Desconocido')).toBe('general');
  });
});

describe('server-side rubric: buildPremiumRubric categories', () => {
  it('generates Música rubric', () => {
    const rubric = buildPremiumRubric(makeInput('6° Básico', 'Música'));
    expect(rubric.criteria.length).toBeGreaterThanOrEqual(3);
    expect(rubric.asignatura).toBe('Música');
  });
  it('generates Educación Física rubric', () => {
    const rubric = buildPremiumRubric(makeInput('6° Básico', 'Educación Física'));
    expect(rubric.criteria.length).toBeGreaterThanOrEqual(3);
  });
  it('generates Filosofía rubric', () => {
    const rubric = buildPremiumRubric(makeInput('3° Medio', 'Filosofía'));
    expect(rubric.criteria.length).toBeGreaterThanOrEqual(3);
  });
  it('generates Biología rubric', () => {
    const rubric = buildPremiumRubric(makeInput('3° Medio', 'Biología'));
    expect(rubric.criteria.length).toBeGreaterThanOrEqual(3);
  });
  it('generates Física rubric', () => {
    const rubric = buildPremiumRubric(makeInput('3° Medio', 'Física'));
    expect(rubric.criteria.length).toBeGreaterThanOrEqual(3);
  });
  it('generates Química rubric', () => {
    const rubric = buildPremiumRubric(makeInput('3° Medio', 'Química'));
    expect(rubric.criteria.length).toBeGreaterThanOrEqual(3);
  });
  it('generates Ciencias para la Ciudadanía rubric', () => {
    const rubric = buildPremiumRubric(makeInput('3° Medio', 'Ciencias para la Ciudadanía'));
    expect(rubric.criteria.length).toBeGreaterThanOrEqual(3);
  });
  it('generates Parvularia rubric', () => {
    const rubric = buildPremiumRubric(makeInput('Pre-Kinder', 'Educación Parvularia'));
    expect(rubric.criteria.length).toBeGreaterThanOrEqual(3);
  });
});
