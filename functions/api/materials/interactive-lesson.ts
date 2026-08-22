import { generateInteractiveLesson, type InteractiveLessonParams } from '../../core/InteractiveLessonEngine';
import { getTeacherId } from '../../_lib/my-classes';
import type { AIEngineEnv } from '../../core/types';

interface Env extends AIEngineEnv {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getTeacherId(context);
    if (!userId) {
      return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    const { results } = await context.env.DB.prepare(
      'SELECT id, subject, grade, oa, ai_model, created_at FROM interactive_lessons WHERE user_id = ? ORDER BY created_at DESC',
    ).bind(userId).all();

    return Response.json({ ok: true, data: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[interactive-lesson] GET error:', message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getTeacherId(context);
    if (!userId) {
      return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = (await context.request.json()) as InteractiveLessonParams;

    if (!body.subject || !body.grade || !body.oa) {
      return Response.json(
        { ok: false, error: 'subject, grade y oa son requeridos' },
        { status: 400 },
      );
    }

    const lessonData = await generateInteractiveLesson(
      { AI: context.env.AI, GEMINI_API_KEY: context.env.GEMINI_API_KEY, GROQ_API_KEY: context.env.GROQ_API_KEY } as AIEngineEnv,
      body,
    );

    const resourceId = `ilesson_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    await context.env.DB.prepare(
      'INSERT INTO interactive_lessons (id, user_id, subject, grade, oa, slides_json, ai_model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(
      resourceId,
      userId,
      body.subject,
      body.grade,
      body.oa,
      JSON.stringify(lessonData),
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      now,
    ).run();

    return Response.json({
      ok: true,
      resourceId,
      result: lessonData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[interactive-lesson] POST error:', message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
