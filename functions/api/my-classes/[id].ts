import { getTeacherId, int, json, nowIso, readJson, text, type Env } from '../../_lib/my-classes';

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  const teacherId = getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const id = String(context.params.id || '');
  const body = await readJson(context.request);
  const now = nowIso();
  await context.env.DB.prepare(`UPDATE teacher_classes SET
      school_year = COALESCE(?, school_year),
      level_id = COALESCE(?, level_id),
      subject_id = COALESCE(?, subject_id),
      course_name = COALESCE(?, course_name),
      class_name = COALESCE(?, class_name),
      color = COALESCE(?, color),
      is_active = COALESCE(?, is_active),
      updated_at = ?
    WHERE id = ? AND teacher_id = ?`)
    .bind(
      body.school_year || body.schoolYear ? int(body.school_year || body.schoolYear, new Date().getFullYear()) : null,
      text(body.level_id || body.levelId) || null,
      text(body.subject_id || body.subjectId) || null,
      text(body.course_name || body.courseName) || null,
      text(body.class_name || body.className) || null,
      text(body.color) || null,
      typeof body.is_active === 'boolean' ? (body.is_active ? 1 : 0) : null,
      now,
      id,
      teacherId,
    ).run();

  return json({ ok: true });
}

export async function onRequestDelete(context: EventContext<Env>): Promise<Response> {
  const teacherId = getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const id = String(context.params.id || '');
  const hard = new URL(context.request.url).searchParams.get('hard') === 'true';
  if (hard) {
    await context.env.DB.prepare('DELETE FROM teacher_classes WHERE id = ? AND teacher_id = ?').bind(id, teacherId).run();
  } else {
    await context.env.DB.prepare('UPDATE teacher_classes SET is_active = 0, updated_at = ? WHERE id = ? AND teacher_id = ?')
      .bind(nowIso(), id, teacherId)
      .run();
  }
  return json({ ok: true });
}
