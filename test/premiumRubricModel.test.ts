import { describe, it, expect } from 'vitest';
import { buildPremiumRubricModel } from '../src/utils/premiumRubricModel';

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

const LENGUAJE_INPUT = {
  level: '5° Básico',
  subject: 'Lenguaje y Comunicación',
  objectiveCode: 'LEN05 OA 01',
  objectiveText: 'Comprender textos argumentativos e identificar la tesis y los argumentos del autor',
  topic: 'Texto argumentativo',
  indicators: ['Identifica tesis', 'Reconoce argumentos'],
  skills: ['Comprensión lectora', 'Argumentación'],
};

const MATEMATICA_INPUT = {
  level: '4° Básico',
  subject: 'Matemática',
  objectiveCode: 'MAT04 OA 01',
  objectiveText: 'Resolver problemas que involucran operaciones de suma y resta de números de tres dígitos',
  topic: 'Operaciones con números',
  indicators: ['Resuelve sumas', 'Resuelve restas'],
  skills: ['Cálculo', 'Resolución de problemas'],
};

const ARTES_INPUT = {
  level: '2° Básico',
  subject: 'Artes Visuales',
  objectiveCode: 'ART02 OA 01',
  objectiveText: 'Expresar emociones e ideas a través de diferentes técnicas y materiales artísticos',
  topic: 'Expresión artística',
  indicators: ['Usa materiales', 'Expresa emociones'],
  skills: ['Creatividad', 'Expresión'],
};

const PLANT_OA_INPUT = {
  level: '5° Básico',
  subject: 'Ciencias Naturales',
  objectiveCode: 'CN05 OA 03',
  objectiveText: 'Describir el ciclo de vida de las plantas con flor, incluyendo germinación, crecimiento, floración, polinización y formación del fruto con semillas',
  topic: 'animales',
  indicators: ['Describe etapas del ciclo', 'Identifica procesos de polinización'],
  skills: ['Descripción del ciclo', 'Identificación de etapas', 'Observación de procesos'],
};

describe('buildPremiumRubricModel', () => {
  it('genera título y datos curriculares', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    expect(result.title).toBeTruthy();
    expect(result.subtitle).toBeTruthy();
    expect(result.nivel).toBe('1° Básico');
    expect(result.asignatura).toBe('Ciencias Naturales');
    expect(result.oa).toBe('CN01 OA 05');
    expect(result.tema).toBeTruthy();
  });

  it('genera 4 niveles de desempeño', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    expect(result.levels.length).toBe(4);
    expect(result.levels.map(l => l.id)).toEqual(['avanzado', 'adecuado', 'en_desarrollo', 'inicial']);
    result.levels.forEach(level => {
      expect(level.score).toBeGreaterThanOrEqual(1);
      expect(level.score).toBeLessThanOrEqual(4);
      expect(level.color).toBeTruthy();
      expect(level.description).toBeTruthy();
    });
  });

  it('genera entre 4 y 6 criterios', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    expect(result.criteria.length).toBeGreaterThanOrEqual(4);
    expect(result.criteria.length).toBeLessThanOrEqual(6);
  });

  it('para 1° básico genera máximo 4 criterios', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    expect(result.criteria.length).toBeLessThanOrEqual(4);
  });

  it('cada criterio tiene descriptores para todos los niveles', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    result.criteria.forEach(criterion => {
      expect(criterion.indicators.length).toBe(4);
      const levelIds = criterion.indicators.map(ind => ind.levelId);
      expect(levelIds).toContain('avanzado');
      expect(levelIds).toContain('adecuado');
      expect(levelIds).toContain('en_desarrollo');
      expect(levelIds).toContain('inicial');
    });
  });

  it('los descriptores no son genéricos', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    const genericPhrases = [
      'Cumple completamente',
      'Cumple parcialmente',
      'No cumple',
      'Excelente',
      'Bueno',
      'Regular',
      'Insuficiente',
      'Demuestra comprensión del contenido',
      'Aplica el concepto',
      'Trabajo colaborativo',
    ];
    result.criteria.forEach(criterion => {
      criterion.indicators.forEach(indicator => {
        genericPhrases.forEach(phrase => {
          expect(indicator.descriptor).not.toBe(phrase);
        });
        expect(indicator.descriptor.length).toBeGreaterThan(20);
      });
    });
  });

  it('incluye evidencias observables', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    result.criteria.forEach(criterion => {
      criterion.indicators.forEach(indicator => {
        expect(indicator.evidence).toBeTruthy();
        expect(indicator.evidence!.length).toBeGreaterThan(5);
      });
    });
  });

  it('incluye retroalimentación sugerida', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    result.criteria.forEach(criterion => {
      criterion.indicators.forEach(indicator => {
        expect(indicator.feedbackSuggestion).toBeTruthy();
        expect(indicator.feedbackSuggestion!.length).toBeGreaterThan(5);
      });
    });
  });

  it('incluye adecuaciones inclusivas', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    expect(result.inclusiveAdjustments.length).toBeGreaterThan(0);
    result.inclusiveAdjustments.forEach(adj => {
      expect(adj.length).toBeGreaterThan(10);
    });
  });

  it('incluye autoevaluación estudiante', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    expect(result.studentSelfAssessment).toBeDefined();
    expect(result.studentSelfAssessment.title).toBeTruthy();
    expect(result.studentSelfAssessment.prompts.length).toBeGreaterThan(0);
    result.studentSelfAssessment.prompts.forEach(prompt => {
      expect(prompt.length).toBeGreaterThan(3);
    });
  });

  it('si tema contradice OA, el OA manda', () => {
    const result = buildPremiumRubricModel(PLANT_OA_INPUT);
    const allDescriptors = result.criteria
      .flatMap(c => c.indicators.map(i => i.descriptor.toLowerCase()))
      .join(' ');
    expect(allDescriptors).toMatch(/planta|flor|semilla|germinación|polinización|ciclo de vida/i);
    const hasAnimalFocus = result.criteria.some(c =>
      c.name.toLowerCase().includes('animal') ||
      c.description.toLowerCase().includes('animal')
    );
    expect(hasAnimalFocus).toBe(false);
  });

  it('Ciencias genera criterios científicos', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    const names = result.criteria.map(c => c.name.toLowerCase()).join(' ');
    expect(names).toMatch(/observación|vocabulario|evidencia|fenómeno|descripción/i);
  });

  it('Lenguaje genera comprensión/comunicación', () => {
    const result = buildPremiumRubricModel(LENGUAJE_INPUT);
    const names = result.criteria.map(c => c.name.toLowerCase()).join(' ');
    expect(names).toMatch(/comprensión|argumento|texto|expresión|evidencia/i);
  });

  it('Matemática genera resolución/representación', () => {
    const result = buildPremiumRubricModel(MATEMATICA_INPUT);
    const names = result.criteria.map(c => c.name.toLowerCase()).join(' ');
    expect(names).toMatch(/resolución|representación|cálculo|procedimiento|estrategia/i);
  });

  it('Historia genera análisis/evidencia', () => {
    const result = buildPremiumRubricModel(UPPER_INPUT);
    const names = result.criteria.map(c => c.name.toLowerCase()).join(' ');
    expect(names).toMatch(/contexto|fuente|causa|consecuencia|comunicación|histor/i);
  });

  it('Artes genera proceso creativo/elementos visuales', () => {
    const result = buildPremiumRubricModel(ARTES_INPUT);
    const names = result.criteria.map(c => c.name.toLowerCase()).join(' ');
    expect(names).toMatch(/material|expresión|elemento|creativo|reflexión/i);
  });

  it('incluye meta de aprendizaje en lenguaje docente y estudiante', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    expect(result.learningGoal).toBeTruthy();
    expect(result.studentFriendlyGoal).toBeTruthy();
    expect(result.learningGoal.length).toBeGreaterThan(10);
    expect(result.studentFriendlyGoal.length).toBeGreaterThan(10);
  });

  it('incluye instrucciones de uso', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    expect(result.usageInstructions.length).toBeGreaterThan(0);
  });

  it('incluye fórmula de puntaje', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    expect(result.scoringFormula).toBeTruthy();
    expect(result.totalScore).toBeGreaterThan(0);
  });

  it('para 5°-4° medio genera más criterios que para 1° básico', () => {
    const basic = buildPremiumRubricModel(BASE_INPUT);
    const upper = buildPremiumRubricModel(UPPER_INPUT);
    expect(upper.criteria.length).toBeGreaterThanOrEqual(basic.criteria.length);
  });

  it('para nivel bajo genera autoevaluación simple', () => {
    const result = buildPremiumRubricModel(BASE_INPUT);
    expect(result.studentSelfAssessment.prompts.length).toBeLessThanOrEqual(5);
  });

  it('para nivel alto genera autoevaluación más profunda', () => {
    const result = buildPremiumRubricModel(UPPER_INPUT);
    expect(result.studentSelfAssessment.prompts.length).toBeGreaterThanOrEqual(4);
  });
});
