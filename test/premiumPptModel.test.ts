import { describe, it, expect } from 'vitest';
import { buildPremiumPptModel, getSubjectTheme } from '../src/utils/premiumPptModel';

const BASE_INPUT = {
  level: '1° Básico',
  subject: 'Ciencias Naturales',
  objectiveCode: 'CN01 OA 05',
  objectiveText: 'Reconocer y describir las partes básicas de las plantas y animales',
  topic: 'Plantas y animales chilenos',
  indicators: ['Identifica partes de plantas', 'Describe características de animales'],
  skills: ['Observación', 'Descripción', 'Clasificación'],
};

const UPPER_INPUT = {
  level: '3° Medio',
  subject: 'Historia, Geografía y Cs. Sociales',
  objectiveCode: 'HIS06 OA 03',
  objectiveText: 'Analizar las transformaciones sociales y económicas de Chile en el siglo XX',
  topic: 'Chile en el siglo XX',
  indicators: ['Analiza fuentes históricas', 'Compara periodos'],
  skills: ['Análisis histórico', 'Pensamiento crítico', 'Interpretación de fuentes', 'Comparación'],
};

describe('buildPremiumPptModel', () => {
  it('genera entre 8 y 12 slides', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    expect(result.slides.length).toBeGreaterThanOrEqual(8);
    expect(result.slides.length).toBeLessThanOrEqual(12);
  });

  it('incluye portada (cover)', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    const cover = result.slides.find(s => s.layout === 'cover');
    expect(cover).toBeDefined();
    expect(cover!.slideNumber).toBe(1);
  });

  it('incluye objetivo en lenguaje estudiante', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    const objective = result.slides.find(s => s.layout === 'objective');
    expect(objective).toBeDefined();
    expect(objective!.studentPrompt).toBeDefined();
  });

  it('incluye conceptos clave', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    const concepts = result.slides.find(s => s.layout === 'concept_cards');
    expect(concepts).toBeDefined();
    expect(concepts!.bullets).toBeDefined();
    expect(concepts!.bullets!.length).toBeGreaterThan(0);
  });

  it('incluye actividad guiada', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    const guided = result.slides.find(s => s.layout === 'guided_activity');
    expect(guided).toBeDefined();
    expect(guided!.bullets).toBeDefined();
  });

  it('incluye apoyos DUA', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    const dua = result.slides.find(s => s.layout === 'dua_supports');
    expect(dua).toBeDefined();
    expect(dua!.bullets).toBeDefined();
    expect(dua!.bullets!.length).toBe(3);
  });

  it('incluye evaluación formativa', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    const assessment = result.slides.find(s => s.layout === 'formative_assessment');
    expect(assessment).toBeDefined();
  });

  it('incluye cierre', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    const closure = result.slides.find(s => s.layout === 'closure');
    expect(closure).toBeDefined();
  });

  it('no genera slides sin título', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    result.slides.forEach(slide => {
      expect(slide.title).toBeDefined();
      expect(slide.title.length).toBeGreaterThan(0);
    });
  });

  it('no genera slides sin layout', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    result.slides.forEach(slide => {
      expect(slide.layout).toBeDefined();
      expect(slide.layout.length).toBeGreaterThan(0);
    });
  });

  it('para 1° Básico usa bullets cortos (max 3)', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    result.slides.forEach(slide => {
      if (slide.bullets) {
        expect(slide.bullets.length).toBeLessThanOrEqual(3);
      }
    });
  });

  it('para Ciencias Naturales usa visualKeyword relacionado con naturaleza', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    const slideWithVisual = result.slides.find(s => s.visualKeyword);
    expect(slideWithVisual).toBeDefined();
    expect(slideWithVisual!.visualKeyword!.toLowerCase()).toMatch(/plantas|animales|naturaleza|ciencias/);
  });

  it('para Artes Visuales usa tema visual adecuado', () => {
    const artInput = { ...BASE_INPUT, subject: 'Artes Visuales' };
    const result = buildPremiumPptModel(artInput);
    const theme = getSubjectTheme('Artes Visuales');
    expect(theme.primary).toBe('8B5CF6');
    expect(result.asignatura).toBe('Artes Visuales');
  });

  it('no rompe generación de otros productos', () => {
    const guideInput = {
      level: '2° Básico',
      subject: 'Matemática',
      objectiveCode: 'MAT02 OA 01',
      objectiveText: 'Reconocer y escribir números del 0 al 99',
      topic: 'Números del 0 al 99',
      indicators: ['Escribe números', 'Compara números'],
      skills: ['Escritura', 'Comparación'],
    };
    const result = buildPremiumPptModel(guideInput);
    expect(result.slides.length).toBeGreaterThanOrEqual(8);
    expect(result.asignatura).toBe('Matemática');
  });

  it('para 3° Medio usa bullets más profundos (max 5)', () => {
    const result = buildPremiumPptModel(UPPER_INPUT);
    result.slides.forEach(slide => {
      if (slide.bullets) {
        expect(slide.bullets.length).toBeLessThanOrEqual(5);
      }
    });
  });

  it('asigna número de slide secuencial', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    result.slides.forEach((slide, i) => {
      expect(slide.slideNumber).toBe(i + 1);
    });
  });

  it('incluye tema y nivel correctos en el modelo', () => {
    const result = buildPremiumPptModel(BASE_INPUT);
    expect(result.nivel).toBe('1° Básico');
    expect(result.asignatura).toBe('Ciencias Naturales');
    expect(result.oa).toBe('CN01 OA 05');
    expect(result.tema).toBe('Plantas y animales chilenos');
  });
});

describe('getSubjectTheme', () => {
  it('retorna tema por defecto para asignatura desconocida', () => {
    const theme = getSubjectTheme('Música');
    expect(theme.primary).toBeDefined();
    expect(theme.secondary).toBeDefined();
    expect(theme.accent).toBeDefined();
    expect(theme.background).toBeDefined();
    expect(theme.text).toBeDefined();
  });

  it('retorna tema correcto para Ciencias Naturales', () => {
    const theme = getSubjectTheme('Ciencias Naturales');
    expect(theme.primary).toBe('1B7A4A');
  });

  it('retorna tema correcto para Matemática', () => {
    const theme = getSubjectTheme('Matemática');
    expect(theme.primary).toBe('2563EB');
  });

  it('retorna tema correcto para Historia', () => {
    const theme = getSubjectTheme('Historia, Geografía y Cs. Sociales');
    expect(theme.primary).toBe('C2410C');
  });

  it('retorna tema correcto para Artes Visuales', () => {
    const theme = getSubjectTheme('Artes Visuales');
    expect(theme.primary).toBe('8B5CF6');
  });
});
