import { describe, it, expect } from 'vitest';
import { classifyUserRequest, buildActionPlan } from '../../functions/_lib/copilot';

describe('classifyUserRequest', () => {
  it('detects intent to save material to bank', () => {
    const result = classifyUserRequest('guarda esta guía en el banco de recursos');
    expect(result.intent).toBe('save_to_bank');
    expect(result.requiresConfirmation).toBe(true);
    expect(result.actions[0]?.tool).toBe('save_to_bank');
  });

  it('detects intent to generate a lesson plan', () => {
    const result = classifyUserRequest('diseña una secuencia de clases para 4° básico sobre fracciones');
    expect(result.intent).toBe('plan');
    expect(result.actions.some((action) => action.tool === 'generate_material')).toBe(true);
  });

  it('detects curriculum search intent', () => {
    const result = classifyUserRequest('busca el OA de lenguaje para 2° básico');
    expect(result.intent).toBe('search_curriculum');
    expect(result.actions.some((action) => action.tool === 'search_curriculum')).toBe(true);
  });
});

describe('buildActionPlan', () => {
  it('adds confirmation for saving or navigating actions', () => {
    const plan = buildActionPlan('chat', { nivel: '4° básico', asignatura: 'Matemática' }, 'guarda esta planificación');
    expect(plan.requiresConfirmation).toBe(true);
    expect(plan.actions.some((action) => action.tool === 'save_to_bank')).toBe(true);
  });
});
