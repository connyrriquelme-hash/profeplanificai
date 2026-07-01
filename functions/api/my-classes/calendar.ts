import { addDays, getTeacherId, json, mondayOf, toDateOnly, type Env } from '../../_lib/my-classes';

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const teacherId = getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const url = new URL(context.request.url);
  const monday = mondayOf(url.searchParams.get('week'));
  const friday = addDays(monday, 4);
  const start = toDateOnly(monday);
  const end = toDateOnly(friday);

  const explicit = await context.env.DB.prepare(`
    SELECT li.*, tc.course_name, tc.class_name, tc.subject_id, tc.level_id, tc.color
    FROM lesson_instances li
    JOIN teacher_classes tc ON tc.id = li.class_id
    WHERE li.teacher_id = ? AND li.lesson_date BETWEEN ? AND ?
    ORDER BY li.lesson_date, li.start_time
  `).bind(teacherId, start, end).all<Record<string, unknown>>();

  const slots = await context.env.DB.prepare(`
    SELECT tss.*, tws.starts_on, tws.ends_on, tc.teacher_id, tc.school_year, tc.level_id, tc.subject_id,
           tc.course_name, tc.class_name, tc.color
    FROM teacher_schedule_slots tss
    JOIN teacher_weekly_schedules tws ON tws.id = tss.schedule_id
    JOIN teacher_classes tc ON tc.id = tss.class_id
    WHERE tc.teacher_id = ?
      AND tws.is_active = 1
      AND tc.is_active = 1
      AND date(tws.starts_on) <= date(?)
      AND (tws.ends_on IS NULL OR date(tws.ends_on) >= date(?))
    ORDER BY tss.weekday, tss.start_time
  `).bind(teacherId, end, start).all<Record<string, unknown>>();

  const explicitRows = explicit.results || [];
  const existingKeys = new Set(explicitRows.map((row) => `${row.schedule_slot_id || ''}:${row.lesson_date}`));
  const generated = (slots.results || []).flatMap((slot) => {
    const dayIndex = Number(slot.weekday || 1) - 1;
    const date = toDateOnly(addDays(monday, dayIndex));
    if (date < String(slot.starts_on)) return [];
    if (slot.ends_on && date > String(slot.ends_on)) return [];
    const key = `${slot.id}:${date}`;
    if (existingKeys.has(key)) return [];
    return [{
      id: `virtual_${slot.id}_${date}`,
      teacher_id: teacherId,
      class_id: slot.class_id,
      schedule_slot_id: slot.id,
      lesson_date: date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      status: 'pendiente',
      title: String(slot.class_name || 'Clase recurrente'),
      notes: slot.room ? `Sala: ${slot.room}` : '',
      is_virtual: true,
      course_name: slot.course_name,
      class_name: slot.class_name,
      subject_id: slot.subject_id,
      level_id: slot.level_id,
      color: slot.color,
    }];
  });

  const ntb = await context.env.DB.prepare(`
    SELECT id, teacher_id, block_type, non_teaching_type, title, description,
           block_date AS lesson_date, start_time, end_time, location, priority,
           status, course_name, subject_name,
           1 AS is_non_teaching,
           reminder_enabled, reminder_minutes_before, reminder_email
    FROM non_teaching_blocks
    WHERE teacher_id = ? AND block_date BETWEEN ? AND ?
    ORDER BY block_date, start_time
  `).bind(teacherId, start, end).all<Record<string, unknown>>();
  const ntbResults = (ntb.results || []).map((row) => ({
    ...row,
    color: row.priority === 'alta' ? '#ef4444' : row.priority === 'media' ? '#f59e0b' : '#6b7280',
  }));

  return json({ data: [...explicitRows, ...generated, ...(ntbResults || [])].sort((a, b) => String(a.lesson_date || a.block_date).localeCompare(String(b.lesson_date || b.block_date)) || String(a.start_time).localeCompare(String(b.start_time))), week: { start, end } });
}
