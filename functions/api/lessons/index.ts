import { ensureLessonPlan, getTeacherId, json, normalizeStatus, nowIso, randomId, readJson, text, type Env } from '../../_lib/my-classes';

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const teacherId = getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const body = await readJson(context.request);
  const classId = text(body.class_id || body.classId);
  const lessonDate = text(body.lesson_date || body.lessonDate);
  const startTime = text(body.start_time || body.startTime);
  const endTime = text(body.end_time || body.endTime);
  const title = text(body.title, 'Nueva clase');
  if (!classId || !lessonDate || !startTime || !endTime) {
    return json({ error: 'class_id, lesson_date, start_time y end_time son requeridos' }, 400);
  }

  const teacherClass = await context.env.DB.prepare('SELECT id FROM teacher_classes WHERE id = ? AND teacher_id = ? AND is_active = 1')
    .bind(classId, teacherId)
    .first<{ id: string }>();
  if (!teacherClass) return json({ error: 'Clase no encontrada' }, 404);

  const lessonId = randomId('lesson');
  const now = nowIso();
  await context.env.DB.prepare(`INSERT INTO lesson_instances
    (id, teacher_id, class_id, schedule_slot_id, lesson_date, start_time, end_time, status, title, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      lessonId,
      teacherId,
      classId,
      text(body.schedule_slot_id || body.scheduleSlotId) || null,
      lessonDate,
      startTime,
      endTime,
      normalizeStatus(body.status),
      title,
      text(body.notes),
      now,
      now,
    ).run();

  const planId = await ensureLessonPlan(context.env.DB, lessonId, teacherId, title);
  return json({ data: { id: lessonId, lesson_plan_id: planId } }, 201);
}
