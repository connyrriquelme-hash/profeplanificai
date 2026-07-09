import { describe, it, expect } from 'vitest';
import { buildPremiumRubricModel, type PremiumRubricInput } from '../src/utils/premiumRubricModel';

const LEVELS = [
  'Pre-Kinder', 'Kinder',
  '1° Básico', '2° Básico', '3° Básico', '4° Básico',
  '5° Básico', '6° Básico', '7° Básico', '8° Básico',
  '1° Medio', '2° Medio', '3° Medio', '4° Medio',
];

const SUBJECTS = [
  'Lenguaje y Comunicación', 'Matemática', 'Ciencias Naturales',
  'Historia y Geografía', 'Inglés', 'Artes Visuales',
  'Música', 'Tecnología', 'Educación Física', 'Orientación',
  'Formación Ciudadana', 'Filosofía', 'Biología', 'Física',
  'Química', 'Ciencias para la Ciudadanía', 'Educación Parvularia',
];

function makeInput(level: string, subject: string): PremiumRubricInput {
  return {
    objectiveCode: 'OA-TEST-001',
    objectiveText: 'Demostra que el alumnado identifica conceptos clave del tema',
    level,
    subject,
    topic: 'Tema de prueba con contenido suficiente',
    skills: ['Identificar conceptos', 'Aplicar procedimientos'],
  };
}

describe('premiumRubricModel coverage across all levels and subjects', () => {
  for (const level of LEVELS) {
    for (const subject of SUBJECTS) {
      it(`generates rubric for ${level} - ${subject}`, () => {
        const input = makeInput(level, subject);
        const rubric = buildPremiumRubricModel(input);

        expect(rubric.title).toBeDefined();
        expect(rubric.criteria.length).toBeGreaterThanOrEqual(3);
        expect(rubric.levels.length).toBe(4);

        const totalScore = rubric.levels.reduce((sum, l) => sum + l.score, 0);
        expect(totalScore).toBe(10);

        rubric.criteria.forEach(c => {
          expect(c.indicators.length).toBeGreaterThanOrEqual(4);
          c.indicators.forEach(ind => {
            expect(ind.levelId).toBeDefined();
            expect(ind.descriptor).toBeDefined();
          });
        });
      });
    }
  }
});
