import { getTeacherId, int, json, nowIso, randomId, readJson, text, type Env } from '../../_lib/my-classes';

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const teacherId = await getTeacherId(context);
    if (!teacherId) return json({ error: 'No autorizado' }, 401);

    const url = new URL(context.request.url);
    const year = int(url.searchParams.get('school_year'), new Date().getFullYear());
    const levelId = text(url.searchParams.get('level_id'));
    const subjectId = text(url.searchParams.get('subject_id'));
    const status = text(url.searchParams.get('status'));

    const where = ['tc.teacher_id = ?', 'tc.school_year = ?', 'tc.is_active = 1'];
    const params: unknown[] = [teacherId, year];
    if (levelId) { where.push('tc.level_id = ?'); params.push(levelId); }
    if (subjectId) { where.push('tc.subject_id = ?'); params.push(subjectId); }

    const { results } = await context.env.DB.prepare(`
      SELECT tc.*,
        COUNT(li.id) AS lesson_count,
        MIN(CASE WHEN li.lesson_date >= date('now') THEN li.lesson_date END) AS next_lesson_date
      FROM teacher_classes tc
      LEFT JOIN lesson_instances li ON li.class_id = tc.id ${status ? 'AND li.status = ?' : ''}
      WHERE ${where.join(' AND ')}
      GROUP BY tc.id
      ORDER BY tc.course_name, tc.class_name
    `).bind(...(status ? [status, ...params] : params)).all();

    return json({ data: results || [] });
  } catch (err) {
    console.error('[my-classes] GET error:', err);
    return json({ error: 'Error al obtener las clases.' }, 500);
  }
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const teacherId = await getTeacherId(context);
    if (!teacherId) return json({ error: 'No autorizado' }, 401);

    const body = await readJson(context.request);
    const schoolYear = int(body.school_year || body.schoolYear, new Date().getFullYear());
    const levelId = text(body.level_id || body.levelId);
    const subjectId = text(body.subject_id || body.subjectId);
    const courseName = text(body.course_name || body.courseName);
    const className = text(body.class_name || body.className);
    if (!levelId || !subjectId || !courseName || !className) {
      return json({ error: 'level_id, subject_id, course_name y class_name son requeridos' }, 400);
    }

    const id = randomId('class');
    const now = nowIso();
    await context.env.DB.prepare(`INSERT INTO teacher_classes
      (id, teacher_id, school_year, level_id, subject_id, course_name, class_name, color, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
      .bind(
        id,
        teacherId,
        schoolYear,
        levelId,
        subjectId,
        courseName,
        className,
        text(body.color, '#2563eb') || '#2563eb',
        now,
        now,
      ).run();

    return json({ data: { id, teacher_id: teacherId, school_year: schoolYear, level_id: levelId, subject_id: subjectId, course_name: courseName, class_name: className } }, 201);
  } catch (err) {
    console.error('[my-classes] POST error:', err);
    return json({ error: 'Error al crear la clase.' }, 500);
  }
}
