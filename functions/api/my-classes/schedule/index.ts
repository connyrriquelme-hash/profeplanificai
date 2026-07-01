import { getTeacherId, int, json, nowIso, randomId, readJson, text, type Env } from '../../../_lib/my-classes';

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const teacherId = await getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const body = await readJson(context.request);
  const classId = text(body.class_id || body.classId);
  const weekday = int(body.weekday, 1);
  const startTime = text(body.start_time || body.startTime);
  const endTime = text(body.end_time || body.endTime);
  const startsOn = text(body.starts_on || body.startsOn);
  if (!classId || weekday < 1 || weekday > 5 || !startTime || !endTime || !startsOn) {
    return json({ error: 'class_id, weekday (1-5), start_time, end_time y starts_on son requeridos' }, 400);
  }

  const teacherClass = await context.env.DB.prepare('SELECT id, school_year, class_name FROM teacher_classes WHERE id = ? AND teacher_id = ? AND is_active = 1')
    .bind(classId, teacherId)
    .first<{ id: string; school_year: number; class_name: string }>();
  if (!teacherClass) return json({ error: 'Clase no encontrada' }, 404);

  const scheduleId = randomId('schedule');
  const slotId = randomId('slot');
  const now = nowIso();
  const endsOn = text(body.ends_on || body.endsOn) || null;
  const repeatsWeekly = body.repeats_weekly === false || body.repeatsWeekly === false ? 0 : 1;
  const recurrenceRule = repeatsWeekly ? `FREQ=WEEKLY;BYDAY=${weekday};DTSTART=${startsOn}${endsOn ? `;UNTIL=${endsOn}` : ''}` : null;

  await context.env.DB.batch([
    context.env.DB.prepare(`INSERT INTO teacher_weekly_schedules
      (id, teacher_id, name, school_year, starts_on, ends_on, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`)
      .bind(scheduleId, teacherId, text(body.name, `Horario ${teacherClass.class_name}`), teacherClass.school_year, startsOn, endsOn, now, now),
    context.env.DB.prepare(`INSERT INTO teacher_schedule_slots
      (id, schedule_id, class_id, weekday, start_time, end_time, repeats_weekly, recurrence_rule, room, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(slotId, scheduleId, classId, weekday, startTime, endTime, repeatsWeekly, recurrenceRule, text(body.room) || null, now, now),
  ]);

  return json({ data: { schedule_id: scheduleId, slot_id: slotId, recurrence_rule: recurrenceRule } }, 201);
}
