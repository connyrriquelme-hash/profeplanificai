import { describe, it, expect, vi } from 'vitest';
import {
  canSignSession,
  canConfigureSignature,
  canResetSignature,
  canUnlockSignature,
} from '../src/utils/classbookPermissions';

describe('Signature Permissions', () => {
  it('canSignSession allows super_admin', () => {
    expect(canSignSession({ id: '1', institutionalRole: 'super_admin' })).toBe(true);
  });

  it('canSignSession allows institution_admin', () => {
    expect(canSignSession({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
  });

  it('canSignSession allows teacher with permission', () => {
    expect(canSignSession({ id: '1', institutionalRole: 'teacher', permissions: ['classbook:sign'] })).toBe(true);
  });

  it('canSignSession rejects teacher without permission', () => {
    expect(canSignSession({ id: '1', institutionalRole: 'teacher', permissions: [] })).toBe(false);
  });

  it('canSignSession rejects null user', () => {
    expect(canSignSession(null)).toBe(false);
  });

  it('canConfigureSignature allows institution_admin', () => {
    expect(canConfigureSignature({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
  });

  it('canConfigureSignature rejects teacher', () => {
    expect(canConfigureSignature({ id: '1', institutionalRole: 'teacher', permissions: [] })).toBe(false);
  });

  it('canResetSignature allows institution_admin', () => {
    expect(canResetSignature({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
  });

  it('canResetSignature rejects student', () => {
    expect(canResetSignature({ id: '1', institutionalRole: 'student' })).toBe(false);
  });

  it('canUnlockSignature allows institution_admin', () => {
    expect(canUnlockSignature({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
  });

  it('canUnlockSignature rejects coordinator', () => {
    expect(canUnlockSignature({ id: '1', institutionalRole: 'coordinator' })).toBe(false);
  });
});
