import { getTeacherId, json, nowIso, readJson, text, type Env } from '../_lib/my-classes';

interface NTBRecord {
  id: string;
  teacher_id: string;
  block_type: string;
  non_teaching_type: string;
  title: string;
  description: string;
  block_date: string;
  start_time: string;
  end_time: string;
  location: string;
  priority: string;
  course_name: string;
  subject_name: string;
  status: string;
  reminder_enabled: number;
  reminder_minutes_before: number;
  reminder_email: string;
  reminder_status: string;
  reminder_sent_at: string | null;
  requires_follow_up: number;
  follow_up_notes: string;
  created_at: string;
  updated_at: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const teacherId = await getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const url = new URL(context.request.url);
  const week = url.searchParams.get('week');
  const startParam = url.searchParams.get('start');
  const endParam = url.searchParams.get('end');

  let start = '';
  let end = '';

  if (startParam && endParam) {
    start = startParam;
    end = endParam;
  } else if (week) {
    const monday = new Date(`${week}T12:00:00`);
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
    start = monday.toISOString().slice(0, 10);
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);
    end = friday.toISOString().slice(0, 10);
  } else {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
    start = monday.toISOString().slice(0, 10);
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);
    end = friday.toISOString().slice(0, 10);
  }

  const { results } = await context.env.DB.prepare(
    `SELECT * FROM non_teaching_blocks WHERE teacher_id = ? AND block_date BETWEEN ? AND ? ORDER BY block_date, start_time`
  ).bind(teacherId, start, end).all<NTBRecord>();

  return json({ data: results || [], week: { start, end } });
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const teacherId = await getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const body = await readJson(context.request);
  const title = text(body.title);
  const blockDate = text(body.block_date);
  const startTime = text(body.start_time, '08:00');
  const endTime = text(body.end_time, '09:00');

  if (!title || !blockDate) {
    return json({ ok: false, error: 'Título y fecha son requeridos' }, { status: 400 });
  }

  const id = `ntb_${crypto.randomUUID()}`;
  const now = nowIso();

  await context.env.DB.prepare(`
    INSERT INTO non_teaching_blocks
      (id, teacher_id, school_year, block_type, non_teaching_type, title, description,
       block_date, start_time, end_time, location, priority, course_name, subject_name,
       status, reminder_enabled, reminder_minutes_before, reminder_email,
       reminder_status, requires_follow_up, follow_up_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    teacherId,
    Number(body.school_year) || new Date().getFullYear(),
    text(body.block_type, 'no_lectivo'),
    text(body.non_teaching_type, 'otro'),
    title,
    text(body.description),
    blockDate,
    startTime,
    endTime,
    text(body.location),
    text(body.priority, 'media'),
    text(body.course_name),
    text(body.subject_name),
    text(body.status, 'pendiente'),
    body.reminder_enabled ? 1 : 0,
    Number(body.reminder_minutes_before) || 30,
    text(body.reminder_email),
    text(body.reminder_status, 'no_aplica'),
    body.requires_follow_up ? 1 : 0,
    text(body.follow_up_notes),
    now,
    now,
  ).run();

  return json({ ok: true, data: { id } }, 201);
}

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  const teacherId = await getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const url = new URL(context.request.url);
  const id = url.pathname.split('/').pop();
  if (!id) return json({ error: 'ID requerido' }, { status: 400 });

  const body = await readJson(context.request);
  const now = nowIso();

  const allowed = [
    'title', 'description', 'block_date', 'start_time', 'end_time',
    'location', 'priority', 'course_name', 'subject_name', 'status',
    'non_teaching_type', 'reminder_enabled', 'reminder_minutes_before',
    'reminder_email', 'requires_follow_up', 'follow_up_notes',
  ];

  const sets: string[] = ['updated_at = ?'];
  const vals: unknown[] = [now];

  for (const key of allowed) {
    if (key in body) {
      const val = body[key];
      if (key === 'reminder_enabled' || key === 'requires_follow_up') {
        sets.push(`${key} = ?`);
        vals.push(val ? 1 : 0);
      } else {
        sets.push(`${key} = ?`);
        vals.push(typeof val === 'string' ? val : JSON.stringify(val ?? ''));
      }
    }
  }

  if (sets.length === 1) return json({ ok: true });

  vals.push(id, teacherId);
  await context.env.DB.prepare(
    `UPDATE non_teaching_blocks SET ${sets.join(', ')} WHERE id = ? AND teacher_id = ?`
  ).bind(...vals).run();

  return json({ ok: true });
}

export async function onRequestDelete(context: EventContext<Env>): Promise<Response> {
  const teacherId = await getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const url = new URL(context.request.url);
  const id = url.pathname.split('/').pop();
  if (!id) return json({ error: 'ID requerido' }, { status: 400 });

  await context.env.DB.prepare(
    `DELETE FROM non_teaching_blocks WHERE id = ? AND teacher_id = ?`
  ).bind(id, teacherId).run();

  return json({ ok: true });
}
