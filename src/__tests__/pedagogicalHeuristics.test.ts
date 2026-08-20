import { describe, expect, it } from 'vitest';
import { recommendLessonCount, defaultClassroomConfiguration } from '../utils/pedagogicalHeuristics';

describe('recommendLessonCount', () => {
  it('recommends more sessions for complex project work in short blocks', () => {
    const result = recommendLessonCount({
      objectiveText: 'Investiga, analiza y diseña una solución para un problema ambiental',
      methodology: 'ABP',
      productType: 'serie_lecciones',
      classDurationMinutes: 45,
    });

    expect(result).toBeGreaterThanOrEqual(6);
    expect(result).toBeLessThanOrEqual(8);
  });

  it('keeps foundational objectives shorter in extended blocks', () => {
    const result = recommendLessonCount({
      objectiveText: 'Identifica y clasifica figuras geométricas',
      methodology: 'Tradicional',
      productType: 'serie_lecciones',
      classDurationMinutes: 135,
    });

    expect(result).toBe(2);
  });

  it('provides Chilean classroom defaults', () => {
    expect(defaultClassroomConfiguration()).toMatchObject({
      classDurationMinutes: 90,
      studentCount: 35,
      grouping: 'pairs',
      outputFormat: 'word_editable',
    });
  });
});