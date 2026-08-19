import { getAuthenticatedUserId } from '../../../_lib/auth';
import { editProduct } from '../../../core/EditProductEngine';
import type { AIEngineEnv } from '../../../core/types';

interface Env extends AIEngineEnv {
  DB: D1Database;
  JWT_SECRET: string;
}

interface EditProductRequest {
  instruccion?: string;
  producto?: Record<string, unknown>;
  resourceId?: string;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getAuthenticatedUserId(context.request, context.env.JWT_SECRET);
    if (!userId) {
      return jsonResponse({ error: 'Sesion invalida o expirada' }, 401);
    }

    const body = await context.request.json<EditProductRequest>();
    const instruccion = String(body.instruccion || '').trim();

    if (!instruccion) {
      return jsonResponse({ error: 'La instruccion de edicion es requerida' }, 400);
    }

    if (!body.producto || typeof body.producto !== 'object') {
      return jsonResponse({ error: 'El producto actual es requerido' }, 400);
    }

    const producto = body.producto as Record<string, unknown>;
    const tipo = typeof producto.type === 'string' ? producto.type : 'desconocido';
    const metadata = (producto.metadata || {}) as Record<string, unknown>;
    const nivel = typeof metadata.level === 'string' ? metadata.level : '';
    const asignatura = typeof metadata.subject === 'string' ? metadata.subject : '';

    const result = await editProduct(context.env, {
      producto,
      instruccion,
      tipo,
      nivel,
      asignatura,
    });

    // If resourceId provided, save updated content to D1
    if (body.resourceId) {
      try {
        const db = context.env.DB;
        await db.prepare(
          `UPDATE generated_resources SET content = ?, updated_at = ? WHERE id = ?`,
        ).bind(JSON.stringify(result.producto), new Date().toISOString(), String(body.resourceId)).run();
      } catch (d1Err) {
        console.error('[edit-product] D1 save error:', d1Err);
      }
    }

    return jsonResponse({
      ok: true,
      productoModificado: result.producto,
      explicacion: result.explicacion,
      camposModificados: result.camposModificados,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Error al editar el producto', details: message }, 500);
  }
}
