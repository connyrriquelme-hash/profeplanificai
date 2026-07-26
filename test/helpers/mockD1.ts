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

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function countDistinct(rows: Row[], column: string): number {
  return new Set(rows.map(row => row[column]).filter(Boolean)).size;
}

function filterCoordinatorSessions(state: MockDBState, sql: string, boundArgs: unknown[]): Row[] {
  let rows = [...state.getTable('class_sessions')];
  const normalized = sql.replace(/\s+/g, ' ');
  let argIndex = 0;

  const consumeEquals = (pattern: RegExp, column: string) => {
    if (!pattern.test(normalized)) return;
    const value = boundArgs[argIndex++];
    rows = rows.filter(row => row[column] === value);
  };

  consumeEquals(/cs\.institution_id\s*=\s*\?/i, 'institution_id');
  consumeEquals(/cs\.academic_year_id\s*=\s*\?/i, 'academic_year_id');
  consumeEquals(/cs\.course_id\s*=\s*\?/i, 'course_id');
  consumeEquals(/cs\.subject_id\s*=\s*\?/i, 'subject_id');
  consumeEquals(/cs\.teacher_id\s*=\s*\?/i, 'teacher_id');
  consumeEquals(/cs\.status\s*=\s*\?/i, 'status');

  if (/cs\.date\s*>=\s*\?/i.test(normalized)) {
    const value = String(boundArgs[argIndex++] || '');
    rows = rows.filter(row => String(row.date || '') >= value);
  }
  if (/cs\.date\s*<=\s*\?/i.test(normalized)) {
    const value = String(boundArgs[argIndex++] || '');
    rows = rows.filter(row => String(row.date || '') <= value);
  }

  const inMatches = [...normalized.matchAll(/cs\.(course_id|subject_id|academic_year_id)\s+IN\s*\(([^)]*)\)/gi)];
  for (const match of inMatches) {
    const column = match[1];
    const count = (match[2].match(/\?/g) || []).length;
    const allowed = boundArgs.slice(argIndex, argIndex + count);
    argIndex += count;
    if (allowed.length > 0) {
      rows = rows.filter(row => allowed.includes(row[column]));
    }
  }

  return rows;
}

function coordinatorDashboardSessionsRow(state: MockDBState, sql: string, boundArgs: unknown[]): Row {
  const sessions = filterCoordinatorSessions(state, sql, boundArgs);
  const attendanceSessionIds = new Set(state.getTable('attendance_records').map(row => row.class_session_id));

  return {
    total: sessions.length,
    scheduled: sessions.filter(row => row.status === 'scheduled').length,
    completed: sessions.filter(row => row.status === 'completed').length,
    pending: sessions.filter(row => row.status === 'open' || row.status === 'pending_signature').length,
    no_content: sessions.filter(row => row.status === 'completed' && !String(row.taught_content || '').trim()).length,
    no_attendance: sessions.filter(row => row.status === 'completed' && !attendanceSessionIds.has(row.id)).length,
    pending_signature: sessions.filter(row => row.status === 'pending_signature').length,
    teachers: countDistinct(sessions, 'teacher_id'),
    courses: countDistinct(sessions, 'course_id'),
  };
}

function coordinatorReviewSummaryRow(state: MockDBState, boundArgs: unknown[]): Row {
  const institutionId = boundArgs[0];
  const rows = state.getTable('planning_reviews').filter(row => row.institution_id === institutionId);
  return {
    pending: rows.filter(row => row.status === 'pending').length,
    observed: rows.filter(row => row.status === 'observed').length,
  };
}

function coordinatorAttendanceSummaryRow(state: MockDBState, boundArgs: unknown[]): Row {
  const institutionId = boundArgs[0];
  const rows = state.getTable('attendance_records').filter(row => row.institution_id === institutionId);
  return {
    total_records: rows.length,
    present_count: rows.filter(row => row.status === 'present').length,
  };
}

function coordinatorObservationSummaryRow(state: MockDBState, boundArgs: unknown[]): Row {
  const institutionId = boundArgs[0];
  return {
    count: state.getTable('student_observations').filter(row => row.institution_id === institutionId && !row.archived_at).length,
  };
}

function coordinatorCoverageTotalRow(state: MockDBState, boundArgs: unknown[]): Row {
  const institutionId = boundArgs[0];
  const academicYearId = boundArgs[1];
  const sessions = state.getTable('class_sessions').filter(row =>
    row.institution_id === institutionId && (!academicYearId || row.academic_year_id === academicYearId)
  );
  const lessonPlanIds = new Set(sessions.map(row => row.lesson_plan_id).filter(Boolean));
  const totalOA = new Set(
    state.getTable('lesson_plan_curriculum')
      .filter(row => lessonPlanIds.has(row.lesson_plan_id))
      .map(row => row.objective_id)
      .filter(Boolean)
  );
  return { total_oa: totalOA.size };
}

function coordinatorCoverageRows(state: MockDBState, sql: string, boundArgs: unknown[]): Row[] {
  const sessions = filterCoordinatorSessions(state, sql, boundArgs);
  const teacherClasses = state.getTable('teacher_classes');
  const subjects = state.getTable('subjects');
  const lessonPlanCurriculum = state.getTable('lesson_plan_curriculum');
  const grouped = new Map<string, {
    course_id: string;
    course_name: string;
    subject_name: string;
    objectiveIds: Set<string>;
  }>();

  for (const session of sessions) {
    const courseId = String(session.course_id || '');
    if (!courseId) continue;
    const subjectId = String(session.subject_id || '');
    const key = `${courseId}::${subjectId}`;
    const course = teacherClasses.find(row => row.id === courseId);
    const subject = subjects.find(row => row.id === subjectId);
    const current = grouped.get(key) ?? {
      course_id: courseId,
      course_name: String(course?.name || courseId),
      subject_name: String(subject?.name || subjectId),
      objectiveIds: new Set<string>(),
    };

    for (const curriculumRow of lessonPlanCurriculum) {
      if (curriculumRow.lesson_plan_id === session.lesson_plan_id && curriculumRow.objective_id) {
        current.objectiveIds.add(String(curriculumRow.objective_id));
      }
    }

    grouped.set(key, current);
  }

  return [...grouped.values()]
    .sort((a, b) => a.course_name.localeCompare(b.course_name) || a.subject_name.localeCompare(b.subject_name))
    .map(row => ({
      course_id: row.course_id,
      course_name: row.course_name,
      subject_name: row.subject_name,
      total_oa: row.objectiveIds.size,
    }));
}

function coordinatorCoverageWorkedRow(state: MockDBState, boundArgs: unknown[]): Row {
  const isCourseScopedQuery = boundArgs.length >= 2;
  const courseId = isCourseScopedQuery ? boundArgs[0] : null;
  const institutionId = isCourseScopedQuery ? boundArgs[1] : boundArgs[0];
  const academicYearId = isCourseScopedQuery ? null : boundArgs[1];
  const workedOA = new Set<string>();
  for (const row of state.getTable('class_sessions')) {
    if (row.institution_id !== institutionId || row.status !== 'completed') continue;
    if (courseId && row.course_id !== courseId) continue;
    if (academicYearId && row.academic_year_id !== academicYearId) continue;
    for (const objectiveId of parseJsonArray(row.objective_ids_json)) {
      workedOA.add(objectiveId);
    }
  }
  return { worked_oa: workedOA.size };
}

function coordinatorCoveragePlannedRow(state: MockDBState, boundArgs: unknown[]): Row {
  const courseId = boundArgs[0];
  const institutionId = boundArgs[1];
  const plannedOA = new Set<string>();
  const completedPlanIds = new Set(
    state.getTable('class_sessions')
      .filter(row => row.course_id === courseId && row.institution_id === institutionId && (row.status === 'completed' || row.status === 'signed'))
      .map(row => row.lesson_plan_id)
      .filter(Boolean)
  );

  for (const row of state.getTable('lesson_plan_curriculum')) {
    if (completedPlanIds.has(row.lesson_plan_id) && row.objective_id) {
      plannedOA.add(String(row.objective_id));
    }
  }

  return { planned_oa: plannedOA.size };
}

function getTeacherName(state: MockDBState, teacherId: unknown): string {
  return String(state.getTable('usuarios').find(row => row.id === teacherId)?.nombre || 'N/A');
}

function getCourseName(state: MockDBState, courseId: unknown): string {
  return String(state.getTable('teacher_classes').find(row => row.id === courseId)?.name || 'N/A');
}

function coordinatorAlertRows(state: MockDBState, sql: string, boundArgs: unknown[]): Row[] | null {
  const upper = sql.toUpperCase().replace(/\s+/g, ' ').trim();
  const institutionId = boundArgs[0];
  const scopedCourseIds = boundArgs.slice(1).map(String);
  const inScope = (row: Row) =>
    row.institution_id === institutionId &&
    (scopedCourseIds.length === 0 || scopedCourseIds.includes(String(row.course_id)));

  if (upper.includes('FROM CLASS_SESSIONS CS') && upper.includes("CS.STATUS = 'COMPLETED'") && upper.includes('SIGNATURE_EVENTS')) {
    const signedSessionIds = new Set(
      state.getTable('signature_events')
        .filter(row => row.result === 'success')
        .map(row => row.class_session_id)
    );
    return state.getTable('class_sessions')
      .filter(row => inScope(row) && row.status === 'completed' && !signedSessionIds.has(row.id))
      .slice(0, 20)
      .map(row => ({
        id: row.id,
        date: row.date,
        teacher_name: getTeacherName(state, row.teacher_id),
        course_name: getCourseName(state, row.course_id),
      }));
  }

  if (upper.includes('FROM CLASS_SESSIONS CS') && upper.includes("CS.STATUS = 'SCHEDULED'") && upper.includes("CS.DATE < DATE('NOW')")) {
    const today = new Date().toISOString().slice(0, 10);
    return state.getTable('class_sessions')
      .filter(row => inScope(row) && row.status === 'scheduled' && String(row.date || '') < today)
      .slice(0, 20)
      .map(row => ({
        id: row.id,
        date: row.date,
        teacher_name: getTeacherName(state, row.teacher_id),
        course_name: getCourseName(state, row.course_id),
      }));
  }

  if (upper.includes('FROM CLASS_SESSIONS CS') && upper.includes("CS.STATUS = 'COMPLETED'") && upper.includes('ATTENDANCE_RECORDS')) {
    const attendedSessionIds = new Set(state.getTable('attendance_records').map(row => row.class_session_id));
    return state.getTable('class_sessions')
      .filter(row => inScope(row) && row.status === 'completed' && !attendedSessionIds.has(row.id))
      .slice(0, 20)
      .map(row => ({
        id: row.id,
        date: row.date,
        teacher_name: getTeacherName(state, row.teacher_id),
        course_name: getCourseName(state, row.course_id),
      }));
  }

  if (upper.includes('FROM PLANNING_REVIEWS PR') && upper.includes("PR.STATUS = 'PENDING'")) {
    return state.getTable('planning_reviews')
      .filter(row => row.institution_id === institutionId && row.status === 'pending')
      .map(row => {
        const session = state.getTable('class_sessions').find(cs => cs.id === row.planning_id);
        if (scopedCourseIds.length > 0 && !scopedCourseIds.includes(String(session?.course_id || ''))) return null;
        return {
          id: row.id,
          created_at: row.created_at,
          teacher_name: getTeacherName(state, session?.teacher_id),
          course_name: getCourseName(state, session?.course_id),
        };
      })
      .filter((row): row is Row => row !== null)
      .slice(0, 20);
  }

  if (upper.includes('FROM STUDENT_OBSERVATIONS SO') && upper.includes('SO.FOLLOW_UP_DATE < DATE')) {
    const today = new Date().toISOString().slice(0, 10);
    return state.getTable('student_observations')
      .filter(row =>
        row.institution_id === institutionId &&
        !row.archived_at &&
        String(row.follow_up_date || '') < today &&
        (scopedCourseIds.length === 0 || scopedCourseIds.includes(String(row.course_id || '')))
      )
      .slice(0, 20)
      .map(row => ({
        id: row.id,
        follow_up_date: row.follow_up_date,
        category: row.category,
        teacher_name: getTeacherName(state, row.created_by),
      }));
  }

  return null;
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

      if (upper.includes('FROM CLASS_SESSIONS CS') && upper.includes('SUM(CASE WHEN CS.STATUS')) {
        return coordinatorDashboardSessionsRow(state, sql, boundArgs) as T;
      }

      if (upper.includes('FROM PLANNING_REVIEWS PR') && upper.includes('SUM(CASE WHEN PR.STATUS')) {
        return coordinatorReviewSummaryRow(state, boundArgs) as T;
      }

      if (upper.includes('FROM ATTENDANCE_RECORDS AR') && upper.includes('PRESENT_COUNT')) {
        return coordinatorAttendanceSummaryRow(state, boundArgs) as T;
      }

      if (upper.includes('FROM STUDENT_OBSERVATIONS SO') && upper.includes('SO.ARCHIVED_AT IS NULL')) {
        return coordinatorObservationSummaryRow(state, boundArgs) as T;
      }

      if (upper.includes('COUNT(DISTINCT LPC.OBJECTIVE_ID) AS TOTAL_OA')) {
        return coordinatorCoverageTotalRow(state, boundArgs) as T;
      }

      if (upper.includes('COUNT(DISTINCT JSON_EACH.VALUE) AS WORKED_OA')) {
        return coordinatorCoverageWorkedRow(state, boundArgs) as T;
      }

      if (upper.includes('COUNT(DISTINCT LPC.OBJECTIVE_ID) AS PLANNED_OA')) {
        return coordinatorCoveragePlannedRow(state, boundArgs) as T;
      }

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
      const upper = sql.toUpperCase().replace(/\s+/g, ' ').trim();

      if (upper.includes('COUNT(DISTINCT LPC.OBJECTIVE_ID) AS TOTAL_OA') && upper.includes('GROUP BY CS.COURSE_ID')) {
        return { results: coordinatorCoverageRows(state, sql, boundArgs) as T[], success: true };
      }

      const alertRows = coordinatorAlertRows(state, sql, boundArgs);
      if (alertRows) {
        return { results: alertRows as T[], success: true };
      }

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
    institution_members?: Row[];
    coordinator_scopes?: Row[];
    classSessions?: Row[];
    attendanceRecords?: Row[];
    signatureEvents?: Row[];
    studentObservations?: Row[];
    studentProfiles?: Row[];
    courseEnrollments?: Row[];
    lessonPlanCurriculum?: Row[];
    objectives?: Row[];
    courses?: Row[];
    institutions?: Row[];
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
  if (options.institution_members) {
    data['institution_members'] = options.institution_members;
  }
  if (options.coordinatorScope) {
    const cs = { ...options.coordinatorScope };
    if (!cs.user_id) cs.user_id = userId;
    if (!cs.institution_id) cs.institution_id = options.institutionMember?.institution_id || 'inst-1';
    if (cs.course_ids && !cs.course_ids_json) cs.course_ids_json = cs.course_ids;
    if (cs.subject_ids && !cs.subject_ids_json) cs.subject_ids_json = cs.subject_ids;
    if (cs.level_ids && !cs.level_ids_json) cs.level_ids_json = cs.level_ids;
    data['coordinator_scopes'] = [cs];
  }
  if (options.coordinator_scopes) {
    data['coordinator_scopes'] = options.coordinator_scopes.map(row => ({
      ...row,
      course_ids_json: row.course_ids_json ?? row.course_ids ?? '[]',
      subject_ids_json: row.subject_ids_json ?? row.subject_ids ?? '[]',
      level_ids_json: row.level_ids_json ?? row.level_ids ?? '[]',
    }));
  }
  if (options.academicYears) data['academic_years'] = options.academicYears;
  if (options.academicTerms) data['academic_terms'] = options.academicTerms;
  if (options.students) data['student_profiles'] = options.students;
  if (options.studentProfiles) data['student_profiles'] = options.studentProfiles;
  if (options.enrollments) data['course_enrollments'] = options.enrollments;
  if (options.courseEnrollments) data['course_enrollments'] = options.courseEnrollments;
  if (options.sessions) data['class_sessions'] = options.sessions;
  if (options.classSessions) data['class_sessions'] = options.classSessions;
  if (options.attendance) data['attendance_records'] = options.attendance;
  if (options.attendanceRecords) data['attendance_records'] = options.attendanceRecords;
  if (options.observations) data['student_observations'] = options.observations;
  if (options.studentObservations) data['student_observations'] = options.studentObservations;
  if (options.reviews) data['planning_reviews'] = options.reviews;
  if (options.signatures) data['signature_events'] = Array.isArray(options.signatures) ? options.signatures : [options.signatures];
  if (options.signatureEvents) data['signature_events'] = options.signatureEvents;
  if (options.teacherClasses) data['teacher_classes'] = options.teacherClasses;
  if (options.courses) data['courses'] = options.courses;
  if (options.subjects) data['subjects'] = options.subjects;
  if (options.lessonInstances) data['lesson_instances'] = options.lessonInstances;
  if (options.lessonPlans) data['lesson_plans'] = options.lessonPlans;
  if (options.lessonPlanCurriculum) data['lesson_plan_curriculum'] = options.lessonPlanCurriculum;
  if (options.objectives) data['objectives'] = options.objectives;
  if (options.classSessionVersions) data['class_session_versions'] = options.classSessionVersions;
  if (options.planningReviews) data['planning_reviews'] = options.planningReviews;
  if (options.institutions) data['institutions'] = options.institutions;

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
): Promise<string>;
export async function signToken(
  payload: { sub: string; email?: string; role?: string; institutionId?: string },
  secret: string
): Promise<string>;
export async function signToken(
  payloadOrSub: { sub: string; email?: string; role?: string; institutionId?: string } | string,
  emailOrSecret: string,
  maybeSecret?: string
): Promise<string> {
  const legacyPayload = typeof payloadOrSub === 'string';
  const payload = legacyPayload
    ? { sub: payloadOrSub, email: emailOrSecret, role: '', institutionId: '' }
    : payloadOrSub;
  const secret = legacyPayload ? maybeSecret || '' : emailOrSecret;
  const { sub, email = '', role = '', institutionId = '' } = payload;
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
  const jwtPayload = textToBase64Url({ sub, email, role, institutionId, iat: now, exp: now + 86400 });
  const unsigned = `${header}.${jwtPayload}`;
  return `${unsigned}.${await sig(unsigned)}`;
}

