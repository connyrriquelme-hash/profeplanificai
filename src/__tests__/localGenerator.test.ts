import { describe, it, expect } from 'vitest';
import { generatePlan, generateRecurso, generatePrompts, generateEval } from '../services/localGenerator';
import type { PlanFormData, RecursoFormData, EvalFormData } from '../types';

describe('generatePlan', () => {
  const baseForm: PlanFormData = {
    nivel: '2° básico',
    asignatura: 'Lenguaje y Comunicación',
    duracion: '90 minutos',
    enfoque: 'Comprensión lectora',
    oa: 'Leer textos narrativos',
    contexto: 'Curso heterogéneo',
    extra: 'Incluir DUA',
  };

  it('generates a plan with correct heading', () => {
    const result = generatePlan('plan', baseForm);
    expect(result).toContain('# Planificación de clase');
    expect(result).toContain('**Nivel:** 2° básico');
    expect(result).toContain('**Asignatura:** Lenguaje y Comunicación');
  });

  it('generates a sequence with correct heading', () => {
    const result = generatePlan('secuencia', baseForm);
    expect(result).toContain('# Secuencia de unidad');
  });

  it('includes DUA section', () => {
    const result = generatePlan('plan', baseForm);
    expect(result).toContain('## DUA y apoyos');
  });

  it('includes objective from form', () => {
    const result = generatePlan('plan', baseForm);
    expect(result).toContain('Leer textos narrativos');
  });
});

describe('generateRecurso', () => {
  const baseForm: RecursoFormData = {
    tipo: 'Guía imprimible',
    nivel: '2° básico',
    asignatura: 'Matemática',
    oa: 'Resolver problemas de suma',
    necesidad: 'Estudiantes con bajo desempeño',
  };

  it('generates resource with correct heading', () => {
    const result = generateRecurso(baseForm);
    expect(result).toContain('# Guía imprimible');
    expect(result).toContain('**Nivel:** 2° básico');
    expect(result).toContain('**Asignatura:** Matemática');
  });

  it('includes DUA support section', () => {
    const result = generateRecurso(baseForm);
    expect(result).toContain('## Apoyo DUA');
  });
});

describe('generatePrompts', () => {
  const baseForm: RecursoFormData = {
    tipo: 'Guía imprimible',
    nivel: '2° básico',
    asignatura: 'Lenguaje y Comunicación',
    oa: 'Comprensión lectora',
    necesidad: 'Apoyo visual',
  };

  it('generates prompt section', () => {
    const result = generatePrompts(baseForm);
    expect(result).toContain('# Prompts para generadores IA gratuitos');
    expect(result).toContain('## Prompt para imagen educativa');
  });
});

describe('generateEval', () => {
  const baseForm: EvalFormData = {
    tipo: 'Evaluación formativa',
    nivel: '2° básico',
    asignatura: 'Matemática',
    nPreguntas: 5,
    dificultad: 'Básica',
    oa: 'Sumas y restas',
    texto: 'Situación problemática',
  };

  it('generates evaluation with correct heading', () => {
    const result = generateEval(baseForm);
    expect(result).toContain('# Evaluación formativa');
    expect(result).toContain('**Nivel:** 2° básico');
  });

  it('generates the specified number of questions', () => {
    const result = generateEval({ ...baseForm, nPreguntas: 3 });
    const matches = result.match(/^\d+\.\s*\(/gm);
    expect(matches).toHaveLength(3);
  });

  it('includes pauta section', () => {
    const result = generateEval(baseForm);
    expect(result).toContain('## Pauta');
  });
});
