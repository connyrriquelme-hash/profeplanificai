import { describe, it, expect } from 'vitest';
import { buildPremiumPptModel, type PremiumInput } from '../src/utils/premiumPptModel';

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

function makeInput(level: string, subject: string): PremiumInput {
  return {
    objectiveCode: 'OA-TEST-001',
    objectiveText: 'Demostra que el alumnado identifica conceptos clave del tema',
    level,
    subject,
    topic: 'Tema de prueba con contenido suficiente',
    skills: ['Identificar conceptos', 'Aplicar procedimientos'],
  };
}

describe('premiumPptModel coverage across all levels and subjects', () => {
  for (const level of LEVELS) {
    for (const subject of SUBJECTS) {
      it(`generates PPT for ${level} - ${subject}`, () => {
        const input = makeInput(level, subject);
        const ppt = buildPremiumPptModel(input);

        expect(ppt.title).toBeDefined();
        expect(ppt.slides.length).toBeGreaterThanOrEqual(3);
        expect(ppt.nivel).toBe(level);
        expect(ppt.asignatura).toBe(subject);

        const slideTypes = ppt.slides.map(s => s.layout);
        expect(slideTypes).toContain('cover');
        expect(slideTypes).toContain('objective');
      });
    }
  }
});
