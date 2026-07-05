import { ensureLessonPlan, getLessonBundle, getTeacherId, json, normalizeStatus, nowIso, readJson, text, type Env } from '../../_lib/my-classes';

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const teacherId = await getTeacherId(context);
    if (!teacherId) return json({ error: 'No autorizado' }, 401);

    const id = String(context.params.id || '');
    const bundle = await getLessonBundle(context.env.DB, id, teacherId);
    if (!bundle) return json({ error: 'Clase no encontrada' }, 404);
    return json({ data: bundle });
  } catch (err) {
    console.error('[lessons/[id]] GET error:', err);
    return json({ error: 'Error al obtener la clase.' }, 500);
  }
}

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  try {
    const teacherId = await getTeacherId(context);
    if (!teacherId) return json({ error: 'No autorizado' }, 401);

    const id = String(context.params.id || '');
    const body = await readJson(context.request);
    const existing = await context.env.DB.prepare('SELECT id, title FROM lesson_instances WHERE id = ? AND teacher_id = ?')
      .bind(id, teacherId)
      .first<{ id: string; title: string }>();
    if (!existing) return json({ error: 'Clase no encontrada' }, 404);

    const now = nowIso();
    await context.env.DB.prepare(`UPDATE lesson_instances SET
        lesson_date = COALESCE(?, lesson_date),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        status = COALESCE(?, status),
        title = COALESCE(?, title),
        notes = COALESCE(?, notes),
        updated_at = ?
      WHERE id = ? AND teacher_id = ?`)
      .bind(
        text(body.lesson_date || body.lessonDate) || null,
        text(body.start_time || body.startTime) || null,
        text(body.end_time || body.endTime) || null,
        body.status ? normalizeStatus(body.status) : null,
        text(body.title) || null,
        text(body.notes) || null,
        now,
        id,
        teacherId,
      ).run();

    const planId = await ensureLessonPlan(context.env.DB, id, teacherId, text(body.title, existing.title));
    if (body.title) {
      await context.env.DB.prepare('UPDATE lesson_plans SET title = ?, updated_at = ? WHERE id = ? AND teacher_id = ?')
        .bind(text(body.title), now, planId, teacherId)
        .run();
    }

    return json({ ok: true });
  } catch (err) {
    console.error('[lessons/[id]] PATCH error:', err);
    return json({ error: 'Error al actualizar la clase.' }, 500);
  }
}

export async function onRequestDelete(context: EventContext<Env>): Promise<Response> {
  try {
    const teacherId = await getTeacherId(context);
    if (!teacherId) return json({ error: 'No autorizado' }, 401);

    const id = String(context.params.id || '');
    await context.env.DB.prepare('DELETE FROM lesson_instances WHERE id = ? AND teacher_id = ?')
      .bind(id, teacherId)
      .run();
    return json({ ok: true });
  } catch (err) {
    console.error('[lessons/[id]] DELETE error:', err);
    return json({ error: 'Error al eliminar la clase.' }, 500);
  }
}
