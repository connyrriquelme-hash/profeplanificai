import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatePin, hashPin, verifyPin, isLockedOut, getLockoutExpiry } from '../functions/_lib/pin';

describe('PIN Validation', () => {
  it('rejects non-string input', () => {
    expect(validatePin('').valid).toBe(false);
    expect(validatePin(null as unknown as string).valid).toBe(false);
    expect(validatePin(undefined as unknown as string).valid).toBe(false);
  });

  it('rejects non-6-digit pins', () => {
    expect(validatePin('12345').valid).toBe(false);
    expect(validatePin('1234567').valid).toBe(false);
    expect(validatePin('abcdef').valid).toBe(false);
  });

  it('rejects sequential pins', () => {
    expect(validatePin('012345').valid).toBe(false);
    expect(validatePin('123456').valid).toBe(false);
    expect(validatePin('234567').valid).toBe(false);
    expect(validatePin('345678').valid).toBe(false);
    expect(validatePin('456789').valid).toBe(false);
    expect(validatePin('567890').valid).toBe(false);
    expect(validatePin('987654').valid).toBe(false);
    expect(validatePin('876543').valid).toBe(false);
    expect(validatePin('765432').valid).toBe(false);
    expect(validatePin('654321').valid).toBe(false);
    expect(validatePin('543210').valid).toBe(false);
  });

  it('rejects repeated digit pins', () => {
    expect(validatePin('000000').valid).toBe(false);
    expect(validatePin('111111').valid).toBe(false);
    expect(validatePin('222222').valid).toBe(false);
    expect(validatePin('333333').valid).toBe(false);
    expect(validatePin('444444').valid).toBe(false);
    expect(validatePin('555555').valid).toBe(false);
    expect(validatePin('666666').valid).toBe(false);
    expect(validatePin('777777').valid).toBe(false);
    expect(validatePin('888888').valid).toBe(false);
    expect(validatePin('999999').valid).toBe(false);
  });

  it('accepts valid pins', () => {
    expect(validatePin('246810').valid).toBe(true);
    expect(validatePin('135792').valid).toBe(true);
    expect(validatePin('975310').valid).toBe(true);
    expect(validatePin('102938').valid).toBe(true);
  });
});

describe('PIN Hashing', () => {
  it('produces consistent hash with same salt', async () => {
    const { hash: h1, salt } = await hashPin('123456');
    const { hash: h2 } = await hashPin('123456', salt);
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different pins', async () => {
    const { hash: h1, salt } = await hashPin('123456');
    const { hash: h2 } = await hashPin('654321', salt);
    expect(h1).not.toBe(h2);
  });

  it('generates unique salt when not provided', async () => {
    const { salt: s1 } = await hashPin('123456');
    const { salt: s2 } = await hashPin('123456');
    expect(s1).not.toBe(s2);
  });
});

describe('PIN Verification', () => {
  it('verifies correct PIN', async () => {
    const { hash, salt } = await hashPin('246810');
    expect(await verifyPin('246810', hash, salt)).toBe(true);
  });

  it('rejects incorrect PIN', async () => {
    const { hash, salt } = await hashPin('246810');
    expect(await verifyPin('111111', hash, salt)).toBe(false);
  });
});

describe('Lockout Logic', () => {
  it('not locked when attempts below threshold', () => {
    expect(isLockedOut(3, null)).toBe(false);
    expect(isLockedOut(4, null)).toBe(false);
  });

  it('locked when attempts reach threshold and locked_until in future', () => {
    const future = new Date(Date.now() + 60000).toISOString();
    expect(isLockedOut(5, future)).toBe(true);
  });

  it('not locked when locked_until is in the past', () => {
    const past = new Date(Date.now() - 60000).toISOString();
    expect(isLockedOut(5, past)).toBe(false);
  });

  it('not locked when locked_until is null', () => {
    expect(isLockedOut(5, null)).toBe(false);
  });
});

describe('Lockout Expiry', () => {
  it('returns future date', () => {
    const expiry = getLockoutExpiry();
    expect(new Date(expiry).getTime()).toBeGreaterThan(Date.now());
  });
});
