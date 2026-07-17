import { describe, expect, it } from 'vitest';
import { onRequestGet } from '../functions/api/auth/me';
import { hashValue } from '../functions/_lib/session';
import { createMockD1, signToken, type MockD1Database } from './helpers/mockD1';

const TEST_SECRET = 'test-secret-key-for-testing-1234!';

type AuthMeContext = Parameters<typeof onRequestGet>[0];

interface AuthMeUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  active: boolean;
  institutionId: string | null;
  institutionalRole: string;
  permissions: string[];
  scope?: {
    courseIds: string[];
    subjectIds: string[];
    levelIds: string[];
    academicYearIds: string[];
  };
}

interface AuthMeBody {
  user: AuthMeUser;
  session: {
    id: string;
    createdAt: string;
    lastSeenAt: string | null;
    expiresAt: string;
  } | null;
  ok?: boolean;
  error?: string;
}

function contextFor(request: Request, db: MockD1Database): AuthMeContext {
  return {
    request,
    env: { DB: db as unknown as D1Database, JWT_SECRET: TEST_SECRET },
    params: {},
    waitUntil: () => undefined,
    passThroughOnException: () => undefined,
    next: () => Promise.resolve(new Response(null, { status: 404 })),
    data: {},
  } as unknown as AuthMeContext;
}

async function makeCookieRequest(userId: string, dbData: Record<string, Record<string, unknown>[]>): Promise<{
  request: Request;
  db: MockD1Database;
}> {
  const sessionId = `session-${userId}`;
  const sessionHash = await hashValue(sessionId);
  const db = createMockD1({
    ...dbData,
    user_sessions: [{
      id: sessionId,
      user_id: userId,
      session_hash: sessionHash,
      created_at: '2026-07-16T10:00:00.000Z',
      last_seen_at: '2026-07-16T10:05:00.000Z',
      expires_at: '2099-01-01T00:00:00.000Z',
      revoked_at: null,
      user_agent_hash: 'test-agent',
    }],
  });
  const request = new Request('http://localhost/api/auth/me', {
    headers: { Cookie: `pia_session=${sessionId}` },
  });
  return { request, db };
}

async function readBody(response: Response): Promise<AuthMeBody> {
  return await response.json() as AuthMeBody;
}

describe('GET /api/auth/me', () => {
  it('preserva contrato legacy y resuelve permisos con user_sessions sin email', async () => {
    const { request, db } = await makeCookieRequest('teacher-1', {
      usuarios: [{
        id: 'teacher-1',
        email: 'teacher@test.cl',
        nombre: 'Docente Test',
        rol: 'docente',
        active: 1,
      }],
      institution_members: [],
      coordinator_scopes: [],
    });

    const response = await onRequestGet(contextFor(request, db));
    const body = await readBody(response);

    expect(response.status).toBe(200);
    expect(body.user).toMatchObject({
      id: 'teacher-1',
      email: 'teacher@test.cl',
      nombre: 'Docente Test',
      rol: 'docente',
      active: true,
      institutionId: null,
      institutionalRole: 'teacher',
    });
    expect(body.user.permissions).toContain('classbook:read_own');
    expect(body.session).toMatchObject({
      id: 'session-teacher-1',
      createdAt: '2026-07-16T10:00:00.000Z',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
  });

  it('resuelve super_admin legacy solo cuando no hay membership activo', async () => {
    const token = await signToken('super-1', 'super@test.cl', TEST_SECRET);
    const db = createMockD1({
      usuarios: [{
        id: 'super-1',
        email: 'super@test.cl',
        nombre: 'Super Admin',
        rol: 'admin',
        active: 1,
      }],
      institution_members: [],
      coordinator_scopes: [],
    });
    const request = new Request('http://localhost/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const response = await onRequestGet(contextFor(request, db));
    const body = await readBody(response);

    expect(response.status).toBe(200);
    expect(body.user.rol).toBe('admin');
    expect(body.user.institutionalRole).toBe('super_admin');
    expect(body.user.permissions).toContain('classbook:*');
  });

  it('resuelve institution_admin desde membership sin escalar por rol admin legacy', async () => {
    const token = await signToken('admin-1', 'admin@test.cl', TEST_SECRET);
    const db = createMockD1({
      usuarios: [{
        id: 'admin-1',
        email: 'admin@test.cl',
        nombre: 'Admin Institucional',
        rol: 'admin',
        active: 1,
      }],
      institution_members: [{
        id: 'member-admin-1',
        user_id: 'admin-1',
        institution_id: 'inst-1',
        role: 'institution_admin',
        status: 'active',
      }],
      coordinator_scopes: [],
    });
    const request = new Request('http://localhost/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const response = await onRequestGet(contextFor(request, db));
    const body = await readBody(response);

    expect(response.status).toBe(200);
    expect(body.user.rol).toBe('admin');
    expect(body.user.institutionId).toBe('inst-1');
    expect(body.user.institutionalRole).toBe('institution_admin');
    expect(body.user.permissions).toContain('classbook:read');
    expect(body.user.permissions).not.toContain('classbook:*');
  });

  it('resuelve coordinator con scope usando columnas *_json del preview', async () => {
    const token = await signToken('coord-1', 'coord@test.cl', TEST_SECRET);
    const db = createMockD1({
      usuarios: [{
        id: 'coord-1',
        email: 'coord@test.cl',
        nombre: 'Coordinador',
        rol: 'docente',
        active: 1,
      }],
      institution_members: [{
        id: 'member-coord-1',
        user_id: 'coord-1',
        institution_id: 'inst-1',
        role: 'coordinator',
        status: 'active',
      }],
      coordinator_scopes: [{
        id: 'scope-1',
        user_id: 'coord-1',
        institution_id: 'inst-1',
        course_ids_json: JSON.stringify(['course-1']),
        subject_ids_json: JSON.stringify(['subject-1']),
        level_ids_json: JSON.stringify(['level-1']),
        academic_year_id: 'year-2026',
        is_active: 1,
      }],
    });
    const request = new Request('http://localhost/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const response = await onRequestGet(contextFor(request, db));
    const body = await readBody(response);

    expect(response.status).toBe(200);
    expect(body.user.institutionalRole).toBe('coordinator');
    expect(body.user.permissions).toContain('report:scope');
    expect(body.user.scope).toEqual({
      courseIds: ['course-1'],
      subjectIds: ['subject-1'],
      levelIds: ['level-1'],
      academicYearIds: ['year-2026'],
    });
  });

  it('resuelve teacher desde membership', async () => {
    const token = await signToken('teacher-2', 'teacher2@test.cl', TEST_SECRET);
    const db = createMockD1({
      usuarios: [{
        id: 'teacher-2',
        email: 'teacher2@test.cl',
        nombre: 'Teacher Membership',
        rol: 'docente',
        active: 1,
      }],
      institution_members: [{
        id: 'member-teacher-2',
        user_id: 'teacher-2',
        institution_id: 'inst-1',
        role: 'teacher',
        status: 'active',
      }],
      coordinator_scopes: [],
      teacher_classes: [],
    });
    const request = new Request('http://localhost/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const response = await onRequestGet(contextFor(request, db));
    const body = await readBody(response);

    expect(response.status).toBe(200);
    expect(body.user.institutionId).toBe('inst-1');
    expect(body.user.institutionalRole).toBe('teacher');
    expect(body.user.permissions).toContain('classbook:read_own');
  });

  it('devuelve 409 para usuario inactivo', async () => {
    const token = await signToken('inactive-1', 'inactive@test.cl', TEST_SECRET);
    const db = createMockD1({
      usuarios: [{
        id: 'inactive-1',
        email: 'inactive@test.cl',
        nombre: 'Inactive',
        rol: 'docente',
        active: 0,
      }],
      institution_members: [],
      coordinator_scopes: [],
    });
    const request = new Request('http://localhost/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const response = await onRequestGet(contextFor(request, db));
    const body = await readBody(response);

    expect(response.status).toBe(409);
    expect(body.error).toBe('Usuario desactivado');
  });

  it('devuelve 401 para sesión inexistente', async () => {
    const db = createMockD1({
      usuarios: [],
      user_sessions: [],
      institution_members: [],
      coordinator_scopes: [],
    });
    const request = new Request('http://localhost/api/auth/me', {
      headers: { Cookie: 'pia_session=session-missing' },
    });

    const response = await onRequestGet(contextFor(request, db));
    const body = await readBody(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe('UNAUTHENTICATED');
  });
});
