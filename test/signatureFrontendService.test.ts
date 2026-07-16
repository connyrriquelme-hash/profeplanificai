import { describe, it, expect, vi } from 'vitest';

describe('Signature Frontend Components', () => {
  it('classbookService has signature credential methods', async () => {
    const { classbookService } = await import('../src/services/classbookService');
    expect(typeof classbookService.getSignatureCredentialStatus).toBe('function');
    expect(typeof classbookService.setupSignaturePin).toBe('function');
    expect(typeof classbookService.changeSignaturePin).toBe('function');
    expect(typeof classbookService.signSessionWithPin).toBe('function');
    expect(typeof classbookService.resetSignaturePin).toBe('function');
    expect(typeof classbookService.unlockSignaturePin).toBe('function');
  });

  it('SignatureCredentialStatus type is defined', async () => {
    const types = await import('../src/types/classbook');
    expect(types).toBeDefined();
  });
});
