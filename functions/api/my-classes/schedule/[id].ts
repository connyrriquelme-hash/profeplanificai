import { getTeacherId, int, json, nowIso, readJson, text, type Env } from '../../../_lib/my-classes';

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  const teacherId = getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const id = String(context.params.id || '');
  const body = await readJson(context.request);
  const slot = await context.env.DB.prepare(`
    SELECT tss.id, tss.schedule_id
    FROM teacher_schedule_slots tss
    JOIN teacher_weekly_schedules tws ON tws.id = tss.schedule_id
    WHERE tss.id = ? AND tws.teacher_id = ?
  `).bind(id, teacherId).first<{ id: string; schedule_id: string }>();
  if (!slot) return json({ error: 'Bloque de horario no encontrado' }, 404);

  await context.env.DB.prepare(`UPDATE teacher_schedule_slots SET
    weekday = COALESCE(?, weekday),
    start_time = COALESCE(?, start_time),
    end_time = COALESCE(?, end_time),
    repeats_weekly = COALESCE(?, repeats_weekly),
    room = COALESCE(?, room),
    updated_at = ?
    WHERE id = ?`)
    .bind(
      body.weekday ? int(body.weekday, 1) : null,
      text(body.start_time || body.startTime) || null,
      text(body.end_time || body.endTime) || null,
      typeof body.repeats_weekly === 'boolean' ? (body.repeats_weekly ? 1 : 0) : null,
      text(body.room) || null,
      nowIso(),
      id,
    ).run();

  return json({ ok: true });
}

export async function onRequestDelete(context: EventContext<Env>): Promise<Response> {
  const teacherId = getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const id = String(context.params.id || '');
  const mode = new URL(context.request.url).searchParams.get('mode') || 'series';
  const slot = await context.env.DB.prepare(`
    SELECT tss.id, tss.schedule_id
    FROM teacher_schedule_slots tss
    JOIN teacher_weekly_schedules tws ON tws.id = tss.schedule_id
    WHERE tss.id = ? AND tws.teacher_id = ?
  `).bind(id, teacherId).first<{ id: string; schedule_id: string }>();
  if (!slot) return json({ error: 'Bloque de horario no encontrado' }, 404);

  if (mode === 'series') {
    await context.env.DB.prepare('DELETE FROM teacher_weekly_schedules WHERE id = ? AND teacher_id = ?')
      .bind(slot.schedule_id, teacherId)
      .run();
  } else {
    await context.env.DB.prepare('DELETE FROM teacher_schedule_slots WHERE id = ?')
      .bind(id)
      .run();
  }
  return json({ ok: true });
}
