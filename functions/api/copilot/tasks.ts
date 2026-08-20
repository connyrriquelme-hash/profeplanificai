import { getAuthenticatedUserId } from '../../_lib/auth';

interface Env {
  JWT_SECRET: string;
  DB?: D1Database;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getAuthenticatedUserId(context.request, context.env.JWT_SECRET);
    if (!userId) return Response.json({ error: 'Sesion invalida o expirada' }, { status: 401 });
    if (!context.env.DB) return Response.json({ data: [] });

    const url = new URL(context.request.url);
    const requestedStatus = url.searchParams.get('status');
    const allowedStatuses = new Set(['pending', 'running', 'completed', 'failed', 'cancelled']);
    const status = requestedStatus && allowedStatuses.has(requestedStatus) ? requestedStatus : null;
    const query = status
      ? `SELECT id, intent, status, requires_confirmation, metadata_json, created_at, updated_at
         FROM copilot_tasks WHERE user_id = ? AND status = ? ORDER BY updated_at DESC LIMIT 100`
      : `SELECT id, intent, status, requires_confirmation, metadata_json, created_at, updated_at
         FROM copilot_tasks WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100`;
    const result = status
      ? await context.env.DB.prepare(query).bind(userId, status).all()
      : await context.env.DB.prepare(query).bind(userId).all();

    const data = (result.results || []).map((task: Record<string, unknown>) => {
      let metadata: Record<string, unknown> = {};
      try {
        metadata = task.metadata_json ? JSON.parse(String(task.metadata_json)) : {};
      } catch {
        metadata = {};
      }
      return {
        id: task.id,
        intent: task.intent,
        status: task.status,
        requiresConfirmation: Boolean(task.requires_confirmation),
        metadata,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      };
    });

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'No se pudieron cargar las tareas' }, { status: 500 });
  }
}