import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignaturesService } from '../functions/services/classbook/signaturesService';

function createMockEnv() {
  const sessions = new Map<string, any>();
  const signatures = new Map<string, any[]>();

  return {
    DB: {
      prepare: vi.fn((sql: string) => {
        const mock = {
          _sql: sql,
          _bindings: [] as unknown[],
          bind: vi.fn((...args: unknown[]) => {
            mock._bindings = args;
            if (sql.includes('SELECT * FROM class_sessions WHERE id = ?')) {
              mock.first = vi.fn(async () => sessions.get(args[0] as string) || null);
            } else if (sql.includes('SELECT * FROM signature_events WHERE class_session_id = ?')) {
              mock.first = vi.fn(async () => {
                const sigs = signatures.get(args[0] as string);
                return sigs?.[0] || null;
              });
            } else if (sql.includes('INSERT INTO signature_events')) {
              mock.run = vi.fn(async () => ({ changes: 1 }));
            } else if (sql.includes('UPDATE class_sessions SET status')) {
              mock.run = vi.fn(async () => ({ changes: 1 }));
            }
            return mock;
          }),
          first: vi.fn(async () => null),
          all: vi.fn(async () => ({ results: [] })),
          run: vi.fn(async () => ({ changes: 0 })),
        };
        return mock;
      }),
    },
    sessions,
    signatures,
  };
}

describe('SignaturesService', () => {
  it('can be instantiated', () => {
    const env = createMockEnv();
    const service = new SignaturesService(env as any);
    expect(service).toBeDefined();
  });

  it('getSessionSignatureStatus returns null for missing session', async () => {
    const env = createMockEnv();
    const service = new SignaturesService(env as any);
    const result = await service.getSessionSignatureStatus('nonexistent');
    expect(result.session).toBeNull();
    expect(result.canSign).toBe(false);
  });

  it('signSessionWithPin rejects when teacher_id does not match', async () => {
    const env = createMockEnv();
    env.sessions.set('session-1', {
      id: 'session-1',
      institution_id: 'inst-1',
      status: 'completed',
      teacher_id: 'teacher-1',
      version: 1,
    });

    const service = new SignaturesService(env as any);
    const mockCredentials = {
      verifyPin: vi.fn(async () => ({ valid: true })),
    };

    await expect(
      service.signSessionWithPin('session-1', 'teacher-2', 'inst-1', 'hash', '123456', mockCredentials)
    ).rejects.toThrow('Solo el docente de la sesión puede firmarla');
  });

  it('signSessionWithPin rejects when session already signed', async () => {
    const env = createMockEnv();
    env.sessions.set('session-1', {
      id: 'session-1',
      institution_id: 'inst-1',
      status: 'completed',
      teacher_id: 'teacher-1',
      version: 1,
    });
    env.signatures.set('session-1', [{ id: 'sig-1', class_session_id: 'session-1' }]);

    const service = new SignaturesService(env as any);
    const mockCredentials = {
      verifyPin: vi.fn(async () => ({ valid: true })),
    };

    await expect(
      service.signSessionWithPin('session-1', 'teacher-1', 'inst-1', 'hash', '123456', mockCredentials)
    ).rejects.toThrow('Sesión ya firmada');
  });

  it('signSessionWithPin rejects when PIN verification fails', async () => {
    const env = createMockEnv();
    env.sessions.set('session-1', {
      id: 'session-1',
      institution_id: 'inst-1',
      status: 'completed',
      teacher_id: 'teacher-1',
      version: 1,
    });

    const service = new SignaturesService(env as any);
    const mockCredentials = {
      verifyPin: vi.fn(async () => ({ valid: false, reason: 'PIN incorrecto' })),
    };

    await expect(
      service.signSessionWithPin('session-1', 'teacher-1', 'inst-1', 'hash', '123456', mockCredentials)
    ).rejects.toThrow('PIN incorrecto');
  });
});
