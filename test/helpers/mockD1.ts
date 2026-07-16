export interface MockD1PreparedStatement {
  bind(...values: unknown[]): MockD1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
  run(): Promise<{ success: boolean; meta: { changes: number; last_row_id: number } }>;
}

export interface MockD1Database {
  prepare(sql: string): MockD1PreparedStatement;
  exec(sql: string): Promise<{ success: boolean }>;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: MockD1PreparedStatement[]): Promise<Array<{ results: T[]; success: boolean }>>;
}

type Row = Record<string, unknown>;

type UniqueConstraint = { columns: string[] };

const UNIQUE_CONSTRAINTS: Record<string, UniqueConstraint[]> = {
  academic_years: [{ columns: ['institution_id', 'name'] }],
  student_profiles: [{ columns: ['institution_id', 'internal_identifier'] }],
  course_enrollments: [{ columns: ['institution_id', 'academic_year_id', 'course_id', 'student_id'] }],
  class_sessions: [{ columns: ['course_id', 'date', 'teacher_id'] }],
  attendance_records: [{ columns: ['class_session_id', 'student_id'] }],
  signature_events: [{ columns: ['class_session_id', 'signed_by'] }],
};

class MockDBState {
  tables: Map<string, Row[]> = new Map();
  lastInsertedId: string | null = null;

  getTable(name: string): Row[] {
    if (!this.tables.has(name)) this.tables.set(name, []);
    return this.tables.get(name)!;
  }

  insertRow(table: string, row: Row) {
    this.getTable(table).push(row);
    if (row.id) this.lastInsertedId = row.id as string;
  }

  checkUnique(table: string, row: Row): void {
    const constraints = UNIQUE_CONSTRAINTS[table];
    if (!constraints) return;

    for (const constraint of constraints) {
      const existingRows = this.getTable(table);
      const duplicate = existingRows.find(existing =>
        constraint.columns.every(col => existing[col] === row[col])
      );
      if (duplicate) {
        throw Response.json({ ok: false, error: `UNIQUE constraint violation on ${table}(${constraint.columns.join(', ')})` }, { status: 409 });
      }
    }
  }

  stripAlias(colRef: string): string {
    const parts = colRef.split('.');
    return parts[parts.length - 1].toLowerCase();
  }

  findByWhere(sql: string, boundArgs: unknown[]): Row[] {
    const upper = sql.toUpperCase().replace(/\s+/g, ' ').trim();

    const joinMatch = upper.match(/FROM\s+(\w+)\s+\w+\s+JOIN\s+(\w+)\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);

    let tableName: string | null = null;
    const fromMatch = upper.match(/FROM\s+(\w+)/);
    if (fromMatch) tableName = fromMatch[1].toLowerCase();
    if (!tableName) {
      const intoMatch = upper.match(/INTO\s+(\w+)/);
      if (intoMatch) tableName = intoMatch[1].toLowerCase();
    }
    if (!tableName) {
      const updateMatch = upper.match(/UPDATE\s+(\w+)/);
      if (updateMatch) tableName = updateMatch[1].toLowerCase();
    }

    if (!tableName) return [];

    let rows = this.getTable(tableName);
    if (rows.length === 0) return [];

    const whereMatch = upper.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+GROUP\s+BY|\s+LIMIT|\s+OFFSET|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      const conditions = whereClause.split(/\s+AND\s+/i).map(c => c.trim());

      const simpleConditions: { column: string; argIndex: number; op: string }[] = [];
      let argIdx = 0;

      for (const cond of conditions) {
        const condUpper = cond.toUpperCase().replace(/\s+/g, ' ').trim();

        if (condUpper.includes('(SELECT')) {
          const qCount = (cond.match(/\?/g) || []).length;
          argIdx += qCount;
          continue;
        }

        if (condUpper.includes('IS NULL')) {
          const nullMatch = condUpper.match(/^(\w+(?:\.\w+)?)\s+IS\s+NULL$/);
          if (nullMatch) {
            simpleConditions.push({ column: this.stripAlias(nullMatch[1]), argIndex: -1, op: 'IS_NULL' });
          }
          continue;
        }

        if (condUpper.includes('IS NOT NULL')) {
          const nullMatch = condUpper.match(/^(\w+(?:\.\w+)?)\s+IS\s+NOT\s+NULL$/);
          if (nullMatch) {
            simpleConditions.push({ column: this.stripAlias(nullMatch[1]), argIndex: -1, op: 'IS_NOT_NULL' });
          }
          continue;
        }

        if (condUpper.includes('LIKE')) {
          const likeMatch = condUpper.match(/^(\w+(?:\.\w+)?)\s+LIKE\s+\?$/);
          if (likeMatch) {
            simpleConditions.push({ column: this.stripAlias(likeMatch[1]), argIndex: argIdx, op: 'LIKE' });
          }
          argIdx++;
          continue;
        }

        if (condUpper.includes('BETWEEN')) {
          argIdx += 2;
          continue;
        }

        const eqMatch = condUpper.match(/^(\w+(?:\.\w+)?)\s*=\s*\?$/);
        if (eqMatch) {
          simpleConditions.push({ column: this.stripAlias(eqMatch[1]), argIndex: argIdx, op: '=' });
          argIdx++;
          continue;
        }

        const eqLiteralMatch = condUpper.match(/^(\w+(?:\.\w+)?)\s*=\s*'([^']*)'$/);
        if (eqLiteralMatch) {
          simpleConditions.push({ column: this.stripAlias(eqLiteralMatch[1]), argIndex: -1, op: '=' });
          continue;
        }

        const neqMatch = condUpper.match(/^(\w+(?:\.\w+)?)\s*(?:!=|<>)\s*\?$/);
        if (neqMatch) {
          simpleConditions.push({ column: this.stripAlias(neqMatch[1]), argIndex: argIdx, op: '!=' });
          argIdx++;
          continue;
        }

        const cmpMatch = condUpper.match(/^(\w+(?:\.\w+)?)\s*(?:>=|<=|>|<)\s*\?$/);
        if (cmpMatch) {
          argIdx++;
          continue;
        }

        const inMatch = condUpper.match(/^(\w+(?:\.\w+)?)\s+IN\s*\(/);
        if (inMatch) {
          const qCount = (cond.match(/\?/g) || []).length;
          argIdx += qCount;
          continue;
        }

        const qCount = (cond.match(/\?/g) || []).length;
        argIdx += qCount;
      }

      let filtered = [...rows];
      for (const { column, argIndex, op } of simpleConditions) {
        if (argIndex < 0) {
          if (op === 'IS_NULL') {
            filtered = filtered.filter(r => r[column] === null || r[column] === undefined);
          } else if (op === 'IS_NOT_NULL') {
            filtered = filtered.filter(r => r[column] !== null && r[column] !== undefined);
          }
          continue;
        }
        if (argIndex >= boundArgs.length) continue;

        const value = boundArgs[argIndex];

        if (op === '=') {
          filtered = filtered.filter(r => r[column] === value);
        } else if (op === '!=') {
          filtered = filtered.filter(r => r[column] !== value);
        } else if (op === 'LIKE') {
          const pattern = String(value).replace(/%/g, '.*');
          const regex = new RegExp(`^${pattern}$`, 'i');
          filtered = filtered.filter(r => regex.test(String(r[column] || '')));
        }
      }

      rows = filtered;
    }

    if (joinMatch) {
      const joinTableName = joinMatch[2].toLowerCase();
      const joinSqlAlias = joinMatch[3].toLowerCase();
      const joinRows = this.getTable(joinTableName);
      const onLeftAlias = joinMatch[4].toLowerCase();
      const onLeftCol = joinMatch[5].toLowerCase();
      const onRightAlias = joinMatch[6].toLowerCase();
      const onRightCol = joinMatch[7].toLowerCase();

      if (joinRows.length > 0) {
        const leftCol = onLeftCol;
        const rightCol = onRightCol;

        const aliasMatches = [...upper.matchAll(/(\w+)\.(\w+)\s+AS\s+(\w+)/gi)];
        const aliases: { table: string; column: string; alias: string }[] = aliasMatches.map(m => ({
          table: m[1].toLowerCase(),
          column: m[2].toLowerCase(),
          alias: m[3].toLowerCase(),
        }));

        rows = rows.map(row => {
          const match = joinRows.find(jr => jr[rightCol] === row[leftCol]);
          if (match) {
            const merged = { ...row };
            for (const [key, val] of Object.entries(match)) {
              if (!(key in merged)) {
                merged[key] = val;
              }
            }
            for (const alias of aliases) {
              if (alias.table === joinSqlAlias || alias.table === joinTableName) {
                merged[alias.alias] = match[alias.column];
              }
            }
            return merged;
          }
          return row;
        });
      }
    }

    return rows;
  }
}

function createStatement(
  sql: string,
  state: MockDBState,
): MockD1PreparedStatement {
  let boundArgs: unknown[] = [];

  const stmt: MockD1PreparedStatement = {
    bind(...values: unknown[]) {
      boundArgs = values;
      return stmt;
    },
    async first<T = unknown>(): Promise<T | null> {
      const upper = sql.toUpperCase().replace(/\s+/g, ' ').trim();

      if (upper.includes('SELECT COUNT(*)')) {
        const rows = state.findByWhere(sql, boundArgs);
        return { total: rows.length, c: rows.length } as T;
      }

      if (upper.includes('GROUP BY')) {
        return { results: [] } as T;
      }

      if (upper.includes(' JOIN ')) {
        const rows = state.findByWhere(sql, boundArgs);
        return (rows[0] || null) as T;
      }

      if (upper.match(/^SELECT\s+1\s+FROM\s+\w+\s+WHERE/)) {
        const rows = state.findByWhere(sql, boundArgs);
        return (rows[0] ? { 1: 1 } : null) as T;
      }

      if (upper.includes('SELECT ID, EMAIL, NOMBRE, ROL, ACTIVE')) {
        const rows = state.findByWhere(sql, boundArgs);
        if (rows[0]) return rows[0] as T;
        return { id: 'user-1', email: 'test@test.cl', nombre: 'Test', rol: 'docente', active: 1 } as T;
      }

      if (upper.includes('SELECT INSTITUTION_ID, ROLE') && upper.includes('INSTITUTION_MEMBERS')) {
        const rows = state.findByWhere(sql, boundArgs);
        if (rows.length > 0) {
          const roleOrder: Record<string, number> = { institution_admin: 1, coordinator: 2 };
          rows.sort((a, b) => (roleOrder[a.role as string] || 3) - (roleOrder[b.role as string] || 3));
          return rows[0] as T;
        }
        return null as T;
      }

      if (upper.includes('SELECT COURSE_IDS') && upper.includes('COORDINATOR_SCOPES')) {
        const rows = state.findByWhere(sql, boundArgs);
        return (rows[0] || null) as T;
      }

      if (upper.match(/^SELECT\s+ID\s+FROM\s+\w+\s+WHERE/)) {
        const rows = state.findByWhere(sql, boundArgs);
        return (rows[0] ? { id: rows[0].id } : null) as T;
      }

      if (upper.match(/^SELECT\s+\*\s+FROM\s+\w+\s+WHERE/)) {
        const rows = state.findByWhere(sql, boundArgs);
        return (rows[0] || null) as T;
      }

      if (upper.match(/^SELECT\s+\w+\.\*\s+FROM/)) {
        const rows = state.findByWhere(sql, boundArgs);
        return (rows[0] || null) as T;
      }

      const rows = state.findByWhere(sql, boundArgs);
      return (rows[0] || null) as T;
    },

    async all<T = unknown>(): Promise<{ results: T[]; success: boolean }> {
      const rows = state.findByWhere(sql, boundArgs);
      return { results: rows as T[], success: true };
    },

    async run(): Promise<{ success: boolean; meta: { changes: number; last_row_id: number } }> {
      const upper = sql.toUpperCase().replace(/\s+/g, ' ').trim();
      let changes = 0;
      let lastRowId = 0;

      if (upper.startsWith('INSERT')) {
        const tableName = sql.match(/INTO\s+(\w+)/i)?.[1];
        if (tableName) {
          const row: Row = {};
          const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
          if (colMatch) {
            const cols = colMatch[1].split(',').map(c => c.trim());
            cols.forEach((col, i) => {
              if (i < boundArgs.length) row[col] = boundArgs[i];
            });
          }
          state.checkUnique(tableName, row);
          state.insertRow(tableName, row);
          changes = 1;
          lastRowId = 1;
        }
      } else if (upper.startsWith('UPDATE')) {
        const tableName = sql.match(/UPDATE\s+(\w+)/i)?.[1];
        if (tableName) {
          const rows = state.getTable(tableName);
          const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
          const whereMatch = sql.match(/WHERE\s+(.+)/i);
          if (setMatch && whereMatch) {
            const assignments = setMatch[1].split(',').map(a => a.trim().split('=')[0].trim().toLowerCase());
            const whereConditions = whereMatch[1].split(/\s+AND\s+/i).map(c => c.trim());
            const whereCols = whereConditions.map(c => {
              const m = c.toUpperCase().match(/^(\w+(?:\.\w+)?)\s*=/);
              return m ? m[1].split('.').pop()!.toLowerCase() : null;
            }).filter(Boolean);

            const idx = rows.findIndex(r => {
              return whereCols.every((col, i) => {
                if (!col) return true;
                const whereArgIdx = assignments.length + i;
                return whereArgIdx < boundArgs.length ? r[col] === boundArgs[whereArgIdx] : true;
              });
            });

            if (idx >= 0) {
              assignments.forEach((col, i) => {
                if (i < boundArgs.length) rows[idx][col] = boundArgs[i];
              });
              changes = 1;
            }
          }
        }
      } else if (upper.startsWith('DELETE')) {
        const tableName = sql.match(/FROM\s+(\w+)/i)?.[1];
        if (tableName) {
          const rows = state.getTable(tableName);
          const id = boundArgs[0];
          const idx = rows.findIndex(r => r.id === id);
          if (idx >= 0) {
            rows.splice(idx, 1);
            changes = 1;
          }
        }
      }

      return {
        success: true,
        meta: { changes, last_row_id: lastRowId },
      };
    },
  };

  return stmt;
}

export function createMockD1(initialData: Record<string, Row[]> = {}): MockD1Database {
  const state = new MockDBState();
  for (const [table, rows] of Object.entries(initialData)) {
    for (const row of rows) {
      state.insertRow(table, row);
    }
  }

  return {
    prepare(sql: string) {
      return createStatement(sql, state);
    },
    async exec() {
      return { success: true };
    },
    async dump() {
      return new ArrayBuffer(0);
    },
    async batch<T = unknown>(statements: MockD1PreparedStatement[]) {
      const results = await Promise.all(statements.map((s) => s.all<T>()));
      return results;
    },
  };
}

export function makeMockDB(
  options: {
    userId?: string;
    email?: string;
    institutionMember?: Row | null;
    coordinatorScope?: Row | null;
    academicYears?: Row[];
    academicTerms?: Row[];
    students?: Row[];
    enrollments?: Row[];
    sessions?: Row[];
    attendance?: Row[];
    observations?: Row[];
    reviews?: Row[];
    signatures?: Row[] | null;
    teacherClasses?: Row[];
    subjects?: Row[];
    usuarios?: Row[];
    lessonInstances?: Row[];
    lessonPlans?: Row[];
    classSessionVersions?: Row[];
    planningReviews?: Row[];
  } = {}
): MockD1Database {
  const data: Record<string, Row[]> = {};

  const roleToDbRol = (role?: string): string => {
    if (role === 'super_admin') return 'admin';
    return 'docente';
  };

  const userId = options.userId || 'user-1';
  const email = options.email || `${userId}@test.cl`;

  if (!options.usuarios) {
    const imRole = options.institutionMember?.role as string | undefined;
    data['usuarios'] = [{
      id: userId,
      email,
      nombre: `User ${userId}`,
      rol: roleToDbRol(imRole),
      active: 1,
    }];
  } else {
    data['usuarios'] = options.usuarios;
  }

  if (options.institutionMember) {
    const im = { ...options.institutionMember };
    if (!im.user_id) im.user_id = userId;
    if (!im.status) im.status = 'active';
    data['institution_members'] = [im];
  }
  if (options.coordinatorScope) {
    const cs = { ...options.coordinatorScope };
    if (!cs.user_id) cs.user_id = userId;
    if (!cs.institution_id) cs.institution_id = options.institutionMember?.institution_id || 'inst-1';
    data['coordinator_scopes'] = [cs];
  }
  if (options.academicYears) data['academic_years'] = options.academicYears;
  if (options.academicTerms) data['academic_terms'] = options.academicTerms;
  if (options.students) data['student_profiles'] = options.students;
  if (options.enrollments) data['course_enrollments'] = options.enrollments;
  if (options.sessions) data['class_sessions'] = options.sessions;
  if (options.attendance) data['attendance_records'] = options.attendance;
  if (options.observations) data['student_observations'] = options.observations;
  if (options.reviews) data['planning_reviews'] = options.reviews;
  if (options.signatures) data['signature_events'] = Array.isArray(options.signatures) ? options.signatures : [options.signatures];
  if (options.teacherClasses) data['teacher_classes'] = options.teacherClasses;
  if (options.subjects) data['subjects'] = options.subjects;
  if (options.lessonInstances) data['lesson_instances'] = options.lessonInstances;
  if (options.lessonPlans) data['lesson_plans'] = options.lessonPlans;
  if (options.classSessionVersions) data['class_session_versions'] = options.classSessionVersions;
  if (options.planningReviews) data['planning_reviews'] = options.planningReviews;

  return createMockD1(data);
}

export function makeContext(
  token: string | null,
  mockDB: MockD1Database,
  institutionId = 'inst-1',
  options?: { method?: string; body?: unknown; params?: Record<string, string> }
) {
  const method = options?.method || 'GET';
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
  }

  let bodyInit: string | undefined;
  if (options?.body !== undefined) {
    bodyInit = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  return {
    request: new Request('http://localhost/api/classbook/test', {
      method,
      headers,
      body: bodyInit,
    }),
    env: { DB: mockDB, JWT_SECRET: 'test-secret-key-for-testing-1234!' },
    params: options?.params || {},
    query: {},
  } as any;
}

export async function signToken(
  sub: string,
  email: string,
  secret: string
): Promise<string> {
  function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  function textToBase64Url(value: unknown): string {
    return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
  }
  async function sig(value: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
  }
  const now = Math.floor(Date.now() / 1000);
  const header = textToBase64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = textToBase64Url({ sub, email, iat: now, exp: now + 86400 });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${await sig(unsigned)}`;
}
