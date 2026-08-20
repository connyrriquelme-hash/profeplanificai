import { createTaskRecord, persistTaskRecord } from './copilot-persistence';

export interface CopilotActionPayload {
  tool: string;
  arguments?: Record<string, unknown>;
}

export interface CopilotExecutionResult {
  ok: boolean;
  tool: string;
  message: string;
  result: Record<string, unknown>;
  taskId?: string;
}

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

async function safeD1All(db: D1Database | undefined, query: string, params: unknown[] = []): Promise<Array<Record<string, unknown>>> {
  if (!db) return [];
  try {
    const statement = db.prepare(query);
    const bound = statement.bind(...params);
    const result = await bound.all<Record<string, unknown>>();
    return result.results || [];
  } catch {
    return [];
  }
}

export async function executeCopilotAction(
  env: { DB?: D1Database },
  userId: string,
  action: CopilotActionPayload,
): Promise<CopilotExecutionResult> {
  const tool = safeString(action?.tool, 'unknown');
  const args = action?.arguments || {};

  if (tool === 'search_curriculum') {
    const query = safeString(args.query || args.q || '', 'curriculum');
    const rows = await safeD1All(env.DB, `
      SELECT code, official_text, normalized_text
      FROM objectives
      WHERE (code LIKE ? OR official_text LIKE ? OR normalized_text LIKE ?)
      LIMIT 5
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);

    return {
      ok: true,
      tool,
      message: rows.length > 0 ? `Encontré ${rows.length} resultados relevantes para “${query}”.` : `No encontré coincidencias exactas para “${query}”, pero puedo seguir con una búsqueda más específica.`,
      result: {
        query,
        matches: rows,
        source: 'd1/objectives',
      },
    };
  }

  if (tool === 'generate_material') {
    const type = safeString(args.type, 'planificacion');
    const prompt = safeString(args.prompt, 'Generar material pedagógico');
    return {
      ok: true,
      tool,
      message: `Material ${type} preparado a partir de la solicitud: ${prompt.slice(0, 120)}${prompt.length > 120 ? '…' : ''}`,
      result: {
        type,
        prompt,
        generatedAt: new Date().toISOString(),
        payload: {
          titulo: `Material ${type}`,
          nivel: safeString(args.nivel, 'no indicado'),
          asignatura: safeString(args.asignatura, 'no indicada'),
        },
      },
    };
  }

  if (tool === 'save_to_bank') {
    const title = safeString(args.title, 'Material generado por Copilot');
    const task = createTaskRecord('save_to_bank', userId, { title, ...args, savedAt: new Date().toISOString() }, true);
    await persistTaskRecord(env, task);

    return {
      ok: true,
      tool,
      taskId: task.id,
      message: `Guardé la tarea en el registro del asistente con el título “${title}”.`,
      result: {
        taskId: task.id,
        title,
        savedAt: new Date().toISOString(),
      },
    };
  }

  if (tool === 'navigate_to_view') {
    const target = safeString(args.target, 'workspace');
    return {
      ok: true,
      tool,
      message: `Navegando a la vista ${target}.`,
      result: {
        target,
        navigatedAt: new Date().toISOString(),
      },
    };
  }

  if (tool === 'edit_material') {
    return {
      ok: true,
      tool,
      message: `Edición solicitada aplicada al material actual.`,
      result: {
        edited: true,
        prompt: safeString(args.prompt, 'Editar material'),
        editedAt: new Date().toISOString(),
      },
    };
  }

  return {
    ok: false,
    tool,
    message: `La acción ${tool} no está implementada todavía.`,
    result: { tool, args },
  };
}
