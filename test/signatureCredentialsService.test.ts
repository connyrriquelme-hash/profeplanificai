import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignatureCredentialsService } from '../functions/services/classbook/signatureCredentialsService';

function createMockEnv() {
  const store = new Map<string, unknown[]>();
  return {
    DB: {
      prepare: vi.fn((sql: string) => {
        const mock = {
          _sql: sql,
          _bindings: [] as unknown[],
          bind: vi.fn((...args: unknown[]) => {
            mock._bindings = args;
            return mock;
          }),
          first: vi.fn(async () => null),
          all: vi.fn(async () => ({ results: [] })),
          run: vi.fn(async () => ({ changes: 0 })),
        };
        return mock;
      }),
    },
  };
}

describe('SignatureCredentialsService', () => {
  it('can be instantiated', () => {
    const env = createMockEnv();
    const service = new SignatureCredentialsService(env as any);
    expect(service).toBeDefined();
  });

  it('hasCredential returns false when no credential exists', async () => {
    const env = createMockEnv();
    const service = new SignatureCredentialsService(env as any);
    const result = await service.hasCredential('user-1', 'inst-1');
    expect(result).toBe(false);
  });

  it('getCredentialStatus returns configured:false when no credential', async () => {
    const env = createMockEnv();
    const service = new SignatureCredentialsService(env as any);
    const status = await service.getCredentialStatus('user-1', 'inst-1');
    expect(status.configured).toBe(false);
    expect(status.locked).toBe(false);
    expect(status.must_change_pin).toBe(false);
    expect(status.failed_attempts).toBe(0);
  });
});
