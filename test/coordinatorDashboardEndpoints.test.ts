import { describe, it, expect } from 'vitest';
import { makeMockDB, makeContext } from './helpers/mockD1';

describe('Coordinator Dashboard Endpoints - Structure', () => {
  describe('GET /api/classbook/coordinator/dashboard', () => {
    it('exporta handler onRequestGet', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/dashboard');
      expect(typeof onRequestGet).toBe('function');
    });

    it('respuesta exitosa sin session', async () => {
      const mockDB = makeMockDB({});
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/dashboard');
      const res = await onRequestGet?.(makeContext(null, makeMockDB({})));
      expect(res?.status).toBe(401);
    });
  });

  describe('GET /api/classbook/coordinator/teachers', () => {
    it('exporta handler onRequestGet', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/teachers');
      expect(typeof onRequestGet).toBe('function');
    });

    it('sin sesión → 401', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/teachers');
      const res = await onRequestGet?.(makeContext(null, makeMockDB({})));
      expect(res?.status).toBe(401);
    });
  });

  describe('GET /api/classbook/coordinator/courses', () => {
    it('exporta handler onRequestGet', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/courses');
      expect(typeof onRequestGet).toBe('function');
    });

    it('sin sesión → 401', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/courses');
      const res = await onRequestGet?.(makeContext(null, makeMockDB({})));
      expect(res?.status).toBe(401);
    });
  });

  describe('GET /api/classbook/coordinator/sessions', () => {
    it('exporta handler onRequestGet', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/sessions');
      expect(typeof onRequestGet).toBe('function');
    });

    it('sin sesión → 401', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/sessions');
      const res = await onRequestGet?.(makeContext(null, makeMockDB({})));
      expect(res?.status).toBe(401);
    });
  });

  describe('GET /api/classbook/coordinator/planning-reviews', () => {
    it('exporta handler onRequestGet', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/planning-reviews');
      expect(typeof onRequestGet).toBe('function');
    });

    it('sin sesión → 401', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/planning-reviews');
      const res = await onRequestGet?.(makeContext(null, makeMockDB({})));
      expect(res?.status).toBe(401);
    });
  });

  describe('GET /api/classbook/coordinator/signatures', () => {
    it('exporta handler onRequestGet', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/signatures');
      expect(typeof onRequestGet).toBe('function');
    });

    it('sin sesión → 401', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/signatures');
      const res = await onRequestGet?.(makeContext(null, makeMockDB({})));
      expect(res?.status).toBe(401);
    });
  });

  describe('GET /api/classbook/coordinator/coverage', () => {
    it('exporta handler onRequestGet', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/coverage');
      expect(typeof onRequestGet).toBe('function');
    });

    it('sin sesión → 401', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/coverage');
      const res = await onRequestGet?.(makeContext(null, makeMockDB({})));
      expect(res?.status).toBe(401);
    });
  });

  describe('GET /api/classbook/coordinator/alerts', () => {
    it('exporta handler onRequestGet', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/alerts');
      expect(typeof onRequestGet).toBe('function');
    });

    it('sin sesión → 401', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/alerts');
      const res = await onRequestGet?.(makeContext(null, makeMockDB({})));
      expect(res?.status).toBe(401);
    });
  });

  describe('GET /api/classbook/coordinator/filter-options', () => {
    it('exporta handler onRequestGet', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/filter-options');
      expect(typeof onRequestGet).toBe('function');
    });

    it('sin sesión → 401', async () => {
      const { onRequestGet } = await import('../functions/api/classbook/coordinator/filter-options');
      const res = await onRequestGet?.(makeContext(null, makeMockDB({})));
      expect(res?.status).toBe(401);
    });
  });
});