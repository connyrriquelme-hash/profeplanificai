import { authorizeAdmin } from '../../_lib/admin';
import { importUrl } from '../../_lib/importer';

interface Env { DB: D1Database; ADMIN_TOKEN?: string; HMAC_SECRET?: string }

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const raw = await context.request.text();
    if (!(await authorizeAdmin(context.request, raw, context.env))) return Response.json({ error: 'Credencial administrativa inválida' }, { status: 401 });
    const body = JSON.parse(raw || '{}');
    if (typeof body.url !== 'string') return Response.json({ error: 'url es obligatoria' }, { status: 400 });
    const summary = await importUrl(context.env, body.url);
    return Response.json({ data: summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('import-url error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
