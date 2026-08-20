import { describe, expect, it } from 'vitest';
import { onRequest } from '../functions/api/resources';
import { createToken } from '../functions/_lib/auth';

const SECRET = 'ownership-test-secret-with-at-least-32-characters';

interface ResourceRow {
  id: string;
  user_id: string;
  title: string;
}

function makeDb(rows: ResourceRow[]) {
  return {
    prepare(sql: string) {
      return {
          async run() {
            return { success: true };
          },
        bind(...params: unknown[]) {
          return {
            async first<T>() {
              if (sql.includes('SELECT * FROM resource_bank WHERE id = ? AND user_id = ?')) {
                return (rows.find((row) => row.id === params[0] && row.user_id === params[1]) || null) as T | null;
              }
              return null;
            },
            async all<T>() {
              if (sql.includes('SELECT * FROM resource_bank WHERE user_id = ?')) {
                return { results: rows.filter((row) => row.user_id === params[0]) as T[] };
              }
              return { results: [] as T[] };
            },
            async run() {
              if (sql.includes('DELETE FROM resource_bank WHERE id = ? AND user_id = ?')) {
                const index = rows.findIndex((row) => row.id === params[0] && row.user_id === params[1]);
                if (index >= 0) rows.splice(index, 1);
              }
              return { success: true };
            },
          };
        },
      };
    },
  };
}

async function requestFor(userId: string, method: 'GET' | 'DELETE', path: string) {
  const token = await createToken(userId, `${userId}@test.cl`, SECRET);
  return new Request(`http://localhost${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
}

describe('resource ownership', () => {
  it('lists only resources owned by the authenticated user', async () => {
    const rows: ResourceRow[] = [
      { id: 'mine', user_id: 'teacher-a', title: 'Propio' },
      { id: 'other', user_id: 'teacher-b', title: 'Ajeno' },
    ];
    const response = await onRequest({
      request: await requestFor('teacher-a', 'GET', '/api/resources'),
      env: { DB: makeDb(rows), JWT_SECRET: SECRET },
    } as any);

    expect(response.status).toBe(200);
    expect((await response.json() as any).data.map((row: ResourceRow) => row.id)).toEqual(['mine']);
  });

  it('does not expose or delete another user resource', async () => {
    const rows: ResourceRow[] = [{ id: 'other', user_id: 'teacher-b', title: 'Ajeno' }];
    const context = { env: { DB: makeDb(rows), JWT_SECRET: SECRET } } as any;

    const read = await onRequest({ request: await requestFor('teacher-a', 'GET', '/api/resources?id=other'), ...context } as any);
    expect(read.status).toBe(200);
    expect((await read.json() as any).data).toBeNull();

    const remove = await onRequest({ request: await requestFor('teacher-a', 'DELETE', '/api/resources?id=other'), ...context } as any);
    expect(remove.status).toBe(200);
    expect(rows).toHaveLength(1);
  });

  it('rejects unauthenticated resource access', async () => {
    const response = await onRequest({
      request: new Request('http://localhost/api/resources'),
      env: { DB: makeDb([]), JWT_SECRET: SECRET },
    } as any);

    expect(response.status).toBe(401);
  });
});