import { ensureLessonPlan, getLessonBundle, getTeacherId, json, nowIso, readJson, saveCurriculumSelection, text, type Env } from '../../../_lib/my-classes';

const PLAN_FIELDS = new Set([
  'title',
  'objective_text',
  'purpose_text',
  'beginning_text',
  'development_text',
  'closure_text',
  'challenge_question',
  'abp_project_text',
  'resources_text',
  'evaluation_text',
  'instruments_text',
  'dua_adjustments_text',
  'teacher_observations',
  'ai_summary',
]);

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const teacherId = await getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const lessonId = String(context.params.id || '');
  const body = await readJson(context.request);
  const bundle = await getLessonBundle(context.env.DB, lessonId, teacherId);
  if (!bundle) return json({ error: 'Clase no encontrada' }, 404);

  const planId = await ensureLessonPlan(context.env.DB, lessonId, teacherId, String(bundle.lesson.title || 'Clase'));
  const now = nowIso();

  if (body.curriculum && typeof body.curriculum === 'object') {
    await saveCurriculumSelection(context.env.DB, planId, body.curriculum as Record<string, unknown>);
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(body.fields && typeof body.fields === 'object' ? body.fields as Record<string, unknown> : body)) {
    if (PLAN_FIELDS.has(key)) {
      updates.push(`${key} = ?`);
      values.push(typeof value === 'string' ? value : JSON.stringify(value ?? ''));
    }
  }

  if (updates.length > 0) {
    updates.push('autosave_version = autosave_version + 1');
    updates.push('updated_at = ?');
    values.push(now, planId, teacherId);
    await context.env.DB.prepare(`UPDATE lesson_plans SET ${updates.join(', ')} WHERE id = ? AND teacher_id = ?`)
      .bind(...values)
      .run();

    for (const [key, value] of Object.entries(body.fields && typeof body.fields === 'object' ? body.fields as Record<string, unknown> : body)) {
      if (!PLAN_FIELDS.has(key)) continue;
      await context.env.DB.prepare(`INSERT INTO lesson_autosave_events (id, lesson_plan_id, field_name, saved_value_json, created_at)
        VALUES (?, ?, ?, ?, ?)`)
        .bind(crypto.randomUUID(), planId, key, JSON.stringify(value ?? ''), now)
        .run();
    }
  }

  return json({ ok: true, message: 'Guardado automaticamente', saved_at: now, plan_id: planId, touched: updates.length });
}
