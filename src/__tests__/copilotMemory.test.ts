import { describe, it, expect } from 'vitest';
import { summarizeChatHistory, buildTaskDescriptor } from '../../functions/_lib/copilot-memory';
import { createTaskRecord } from '../../functions/_lib/copilot-persistence';

describe('summarizeChatHistory', () => {
  it('summarizes the last user intent and assistant output', () => {
    const summary = summarizeChatHistory([
      { role: 'user', content: 'Diseña una clase sobre fracciones' },
      { role: 'assistant', content: 'He identificado la intención: plan' },
      { role: 'user', content: 'Guárdala en el banco de recursos' },
    ]);

    expect(summary).toContain('fracciones');
    expect(summary).toContain('banco de recursos');
  });
});

describe('buildTaskDescriptor', () => {
  it('adds confirmation requirements and metadata for a save task', () => {
    const task = buildTaskDescriptor('save_to_bank', {
      nivel: '4° básico',
      asignatura: 'Matemática',
      source: 'copilot',
    });

    expect(task.requiresConfirmation).toBe(true);
    expect(task.metadata).toMatchObject({ nivel: '4° básico', asignatura: 'Matemática' });
  });

  it('creates a persisted task record with sane defaults', () => {
    const task = createTaskRecord('save_to_bank', 'user-1', {
      title: 'Guía de fracciones',
      nivel: '4° básico',
    }, true);

    expect(task.intent).toBe('save_to_bank');
    expect(task.userId).toBe('user-1');
    expect(task.status).toBe('pending');
    expect(task.requiresConfirmation).toBe(true);
    expect(task.metadata).toMatchObject({ title: 'Guía de fracciones', nivel: '4° básico' });
  });
});
