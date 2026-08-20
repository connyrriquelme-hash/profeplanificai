import { getAuthenticatedUserId } from '../../_lib/auth';
import { executeCopilotAction } from '../../_lib/copilot-actions';
import { persistConversationMessage, updateTaskStatus } from '../../_lib/copilot-persistence';

interface Env {
  JWT_SECRET: string;
  DB?: D1Database;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getAuthenticatedUserId(context.request, context.env.JWT_SECRET);
    if (!userId) {
      return Response.json({ error: 'Sesion invalida o expirada' }, { status: 401 });
    }

    const body = await context.request.json() as {
      action?: { tool?: string; arguments?: Record<string, unknown> };
    };

    if (!body.action || !body.action.tool) {
      return Response.json({ error: 'La acción del asistente es requerida' }, { status: 400 });
    }

    const result = await executeCopilotAction(context.env, userId, body.action);

    const finalTaskId = result.taskId || `copilot-task-${crypto.randomUUID()}`;
    await updateTaskStatus(context.env, finalTaskId, result.ok ? 'completed' : 'failed', {
      result: result.result,
      tool: result.tool,
      message: result.message,
    });

    const conversationId = `copilot-conversation-${crypto.randomUUID()}`;
    await persistConversationMessage(context.env, conversationId, 'tool', result.message, [{ tool: result.tool }], result.result);

    return Response.json({
      ok: result.ok,
      tool: result.tool,
      message: result.message,
      result: result.result,
      taskId: finalTaskId,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error interno al ejecutar la acción',
    }, { status: 500 });
  }
}
