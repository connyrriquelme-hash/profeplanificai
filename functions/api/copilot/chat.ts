import { getAuthenticatedUserId } from '../../_lib/auth';
import { buildActionPlan } from '../../_lib/copilot';
import { buildTaskDescriptor, summarizeChatHistory } from '../../_lib/copilot-memory';
import { createTaskRecord, ensureConversation, persistConversationMessage, persistTaskRecord } from '../../_lib/copilot-persistence';

interface Env {
  JWT_SECRET: string;
  GEMINI_API_KEY?: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getAuthenticatedUserId(context.request, context.env.JWT_SECRET);
    if (!userId) {
      return Response.json({ error: 'Sesion invalida o expirada' }, { status: 401 });
    }

    const body = await context.request.json() as {
      message?: string;
      mode?: string;
      context?: Record<string, unknown>;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    const message = (body.message || '').trim();
    if (!message) {
      return Response.json({ error: 'La solicitud del asistente es requerida' }, { status: 400 });
    }

    const conversationId = await ensureConversation(context.env, userId, body.context || {}, 'Tarea del Copilot');
    await persistConversationMessage(context.env, conversationId, 'user', message);

    const plan = buildActionPlan(body.mode || 'chat', body.context || {}, message);
    const historySummary = summarizeChatHistory((body.history || []).slice(-8));
    const taskDescriptor = buildTaskDescriptor(plan.intent, {
      ...(body.context || {}),
      mode: body.mode || 'chat',
      summary: historySummary,
      requiresConfirmation: plan.requiresConfirmation,
    });

    const task = createTaskRecord(plan.intent, userId, {
      ...taskDescriptor.metadata,
      ...body.context,
      mode: body.mode || 'chat',
      summary: historySummary,
      taskTitle: message.slice(0, 120),
    }, plan.requiresConfirmation);
    await persistTaskRecord(context.env, task);

    let assistantContent = `He identificado la intención: ${plan.intent}.`;
    if (plan.actions.length > 0) {
      assistantContent += `\n\nAcciones sugeridas:\n- ${plan.actions.map((action) => action.tool).join('\n- ')}`;
    }

    if (context.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(context.env.GEMINI_API_KEY)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `Contexto: ${JSON.stringify(body.context || {})}\n\nSolicitud: ${message}\n\nIntención detectada: ${plan.intent}\n\nResponde como asistente de tareas para docentes de Chile. Sé concreto, útil y en español.` }] }],
              generationConfig: { temperature: 0.6, maxOutputTokens: 3500 },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json() as any;
          const content = (data?.candidates?.[0]?.content?.parts || []).map((part: any) => part.text || '').join('\n').trim();
          if (content) assistantContent = content;
        }
      } catch {
        // fallback local below
      }
    }

    await persistConversationMessage(context.env, conversationId, 'assistant', assistantContent, plan.actions, { taskId: task.id, intent: plan.intent });

    return Response.json({
      ok: true,
      userId,
      intent: plan.intent,
      requiresConfirmation: plan.requiresConfirmation,
      actions: plan.actions,
      task: taskDescriptor,
      taskId: task.id,
      memorySummary: historySummary,
      content: assistantContent,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error interno del asistente',
    }, { status: 500 });
  }
}
