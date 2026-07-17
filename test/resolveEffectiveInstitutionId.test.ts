import { describe, it, expect, beforeEach } from 'vitest';
import { makeMockDB, makeContext, signToken } from './helpers/mockD1';

const TEST_SECRET = 'test-secret-key-for-testing-1234!';

const INST_1 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const INST_2 = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

describe('resolveEffectiveInstitutionId', () => {
  let superAdminToken = '';
  let teacherToken = '';

  beforeEach(async () => {
    superAdminToken = await signToken('super-1', 'super@test.cl', TEST_SECRET);
    teacherToken = await signToken('teacher-1', 'teacher@test.cl', TEST_SECRET);
  });

  describe('super_admin', () => {
    it('resolves institution from query param', async () => {
      const mockDB = makeMockDB({
        userId: 'super-1',
        institutionMember: { institution_id: INST_1, role: 'super_admin' },
        institutions: [{ id: INST_1, name: 'Inst 1', status: 'active' }],
      });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const ctx = makeContext(superAdminToken, mockDB, INST_1);
      ctx.request = new Request(`http://localhost/api/classbook/test?institution_id=${INST_1}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      const resp = await mod.onRequestGet(ctx);
      expect(resp.status).toBe(200);
    });

    it('returns 400 when institution_id is missing', async () => {
      const mockDB = makeMockDB({
        userId: 'super-1',
        institutionMember: { institution_id: INST_1, role: 'super_admin' },
        institutions: [{ id: INST_1, name: 'Inst 1', status: 'active' }],
      });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const ctx = makeContext(superAdminToken, mockDB, INST_1);
      ctx.request = new Request('http://localhost/api/classbook/test', {
        method: 'GET',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      const resp = await mod.onRequestGet(ctx);
      expect(resp.status).toBe(400);
      const body = await resp.json() as any;
      expect(body.error).toContain('Selecciona una institución');
    });

    it('returns 400 when institution_id is not a valid UUID', async () => {
      const mockDB = makeMockDB({
        userId: 'super-1',
        institutionMember: { institution_id: INST_1, role: 'super_admin' },
        institutions: [{ id: INST_1, name: 'Inst 1', status: 'active' }],
      });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const ctx = makeContext(superAdminToken, mockDB, INST_1);
      ctx.request = new Request('http://localhost/api/classbook/test?institution_id=not-a-uuid', {
        method: 'GET',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      const resp = await mod.onRequestGet(ctx);
      expect(resp.status).toBe(400);
      const body = await resp.json() as any;
      expect(body.error).toContain('inválida');
    });

    it('returns 404 when institution does not exist', async () => {
      const mockDB = makeMockDB({
        userId: 'super-1',
        institutionMember: { institution_id: INST_1, role: 'super_admin' },
        institutions: [{ id: INST_1, name: 'Inst 1', status: 'active' }],
      });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const ctx = makeContext(superAdminToken, mockDB, INST_1);
      ctx.request = new Request(`http://localhost/api/classbook/test?institution_id=${INST_2}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      const resp = await mod.onRequestGet(ctx);
      expect(resp.status).toBe(404);
      const body = await resp.json() as any;
      expect(body.error).toContain('no encontrada');
    });

    it('can switch to a different institution via query param', async () => {
      const mockDB = makeMockDB({
        userId: 'super-1',
        institutionMember: { institution_id: INST_1, role: 'super_admin' },
        institutions: [
          { id: INST_1, name: 'Inst 1', status: 'active' },
          { id: INST_2, name: 'Inst 2', status: 'active' },
        ],
      });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const ctx = makeContext(superAdminToken, mockDB, INST_2);
      ctx.request = new Request(`http://localhost/api/classbook/test?institution_id=${INST_2}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      const resp = await mod.onRequestGet(ctx);
      expect(resp.status).toBe(200);
    });
  });

  describe('non-super_admin', () => {
    it('uses institutionId from membership, ignores query param', async () => {
      const instAdminToken = await signToken('inst-admin-1', 'inst-admin@test.cl', TEST_SECRET);
      const mockDB = makeMockDB({
        userId: 'inst-admin-1',
        institutionMember: { institution_id: INST_1, role: 'institution_admin' },
        institutions: [{ id: INST_1, name: 'Inst 1', status: 'active' }],
      });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const ctx = makeContext(instAdminToken, mockDB, INST_1);
      ctx.request = new Request(`http://localhost/api/classbook/test?institution_id=${INST_2}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${instAdminToken}` },
      });
      const resp = await mod.onRequestGet(ctx);
      expect(resp.status).toBe(200);
    });

    it('returns 403 when user has no institution membership', async () => {
      const mockDB = makeMockDB({
        userId: 'teacher-1',
        institutionMember: null,
      });
      const mod = await import('../functions/api/classbook/academic-years/index');
      const ctx = makeContext(teacherToken, mockDB);
      ctx.request = new Request('http://localhost/api/classbook/test', {
        method: 'GET',
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      const resp = await mod.onRequestGet(ctx);
      expect(resp.status).toBe(403);
    });
  });
});
