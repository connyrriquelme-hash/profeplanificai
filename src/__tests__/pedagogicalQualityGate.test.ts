import { describe, expect, it } from 'vitest';
import { validatePedagogicalProduct } from '../../functions/_lib/pedagogicalQualityGate';

describe('validatePedagogicalProduct', () => {
  it('blocks placeholder evaluation content', () => {
    const report = validatePedagogicalProduct({
      title: 'Evaluación de fracciones',
      questions: [{ text: 'Pregunta de selección múltiple sobre fracciones', options: ['Alternativa correcta'] }],
    }, { objectiveCode: 'OA 08' });

    expect(report.status).toBe('blocked');
    expect(report.issues.some((issue) => issue.code === 'placeholder_content')).toBe(true);
  });

  it('accepts a classroom-ready lesson with evidence and materials', () => {
    const report = validatePedagogicalProduct({
      title: 'Fracciones en la feria',
      objectiveCode: 'OA 08',
      classes: [{
        objective: 'Representar fracciones en situaciones de compra',
        materials: ['Tarjetas de precios', 'Círculos de papel'],
        assessment: 'Explica y representa una fracción usando material concreto.',
      }],
    }, { objectiveCode: 'OA 08' });

    expect(report.status).toBe('ready');
    expect(report.score).toBe(100);
  });

  it('blocks a selected methodology that is absent from the result', () => {
    const report = validatePedagogicalProduct({
      title: 'Unidad de ciencias',
      objectiveCode: 'OA 03',
      classes: [{ materials: ['Vasos'], assessment: 'Registro de observaciones.' }],
    }, { objectiveCode: 'OA 03', methodology: 'ABP' });

    expect(report.status).toBe('blocked');
    expect(report.issues.some((issue) => issue.code === 'methodology_traceability')).toBe(true);
  });

  it('requires a correction key and instructions for an evaluation', () => {
    const report = validatePedagogicalProduct({
      title: 'Evaluación',
      questions: [{ text: 'Explica el concepto.' }],
    }, { productType: 'evaluacion' });

    expect(report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'evaluation_question_count',
      'evaluation_answer_key',
      'evaluation_instructions',
    ]));
    expect(report.status).toBe('blocked');
  });

  it('requires observable rubric criteria with performance levels', () => {
    const report = validatePedagogicalProduct({
      title: 'Rúbrica',
      criteria: [{ name: 'Aplicación' }, { name: 'Comunicación' }],
    }, { productType: 'rubrica' });

    expect(report.issues.some((issue) => issue.code === 'rubric_criteria')).toBe(true);
    expect(report.issues.some((issue) => issue.code === 'rubric_levels')).toBe(true);
    expect(report.status).toBe('blocked');
  });

  it('accepts a Rúbrica Premium (productType "rubrica") whose criteria carry levels via indicators[], not .levels', () => {
    // Bug real encontrado hoy: RubricaEngine.ts (RubricCriterion) guarda los
    // niveles de cada criterio en `indicators` (cada uno con levelId +
    // descriptor + evidence), no en un campo `.levels` propio -- ese shape
    // solo existe en evaluation_formative_rubric. El check antes buscaba
    // `.levels` para AMBOS tipos, así que toda Rúbrica Premium real quedaba
    // "blocked" (75/100) con "Cada criterio... debe tener niveles de
    // desempeño" sin importar qué tan completo estuviera el contenido.
    const report = validatePedagogicalProduct({
      title: 'Rúbrica Premium',
      criteria: [
        { id: 'c1', name: 'Clasificación', description: 'Clasifica seres vivos', weight: 30, indicators: [
          { levelId: 'avanzado', descriptor: 'Clasifica con precisión', evidence: 'Árbol de clasificación', feedbackSuggestion: '' },
          { levelId: 'adecuado', descriptor: 'Clasifica de forma básica', evidence: 'Lista simple', feedbackSuggestion: '' },
        ] },
        { id: 'c2', name: 'Explicación', description: 'Explica la estructura celular', weight: 40, indicators: [
          { levelId: 'avanzado', descriptor: 'Explica con detalle', evidence: 'Explicación escrita', feedbackSuggestion: '' },
        ] },
        { id: 'c3', name: 'Comunicación', description: 'Comunica evidencias', weight: 30, indicators: [
          { levelId: 'avanzado', descriptor: 'Comunica con claridad', evidence: 'Presentación oral', feedbackSuggestion: '' },
        ] },
      ],
    }, { productType: 'rubrica' });

    expect(report.issues.some((issue) => issue.code === 'rubric_levels')).toBe(false);
  });
});