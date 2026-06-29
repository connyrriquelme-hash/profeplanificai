import { buildEmailContent, validateEmail, validateShareUrl, sendEmail } from '../../_lib/email';

interface Env {
  EMAIL?: { send: (msg: { from: string; to: string; subject: string; text: string; html?: string }) => Promise<unknown> };
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  DB: D1Database;
}

function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';
}

const recentSends = new Map<string, number>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const last = recentSends.get(ip);
  if (last && now - last < 60000) return false;
  recentSends.set(ip, now);
  if (recentSends.size > 1000) {
    const cutoff = now - 300000;
    for (const [k, v] of recentSends) { if (v < cutoff) recentSends.delete(k); }
  }
  return true;
}

export async function onRequest(context: EventContext<Env>): Promise<Response> {
  if (context.request.method !== 'POST') {
    return Response.json({ error: 'Metodo no soportado' }, { status: 405 });
  }

  const ip = getClientIp(context.request);
  if (!checkRateLimit(ip)) {
    return Response.json({ error: 'Demasiadas solicitudes. Espera un minuto.' }, { status: 429 });
  }

  try {
    const body = await context.request.json() as Record<string, unknown>;
    const to = String(body.to || '').trim();
    const shareUrl = String(body.shareUrl || '').trim();
    const documentTitle = String(body.documentTitle || '').trim();
    const message = String(body.message || '').trim() || undefined;
    const documentType = String(body.documentType || '').trim() || undefined;

    if (!to) return Response.json({ error: 'El correo del destinatario es obligatorio.' }, { status: 400 });
    if (!validateEmail(to)) return Response.json({ error: 'Formato de correo invalido.' }, { status: 400 });
    if (!shareUrl) return Response.json({ error: 'La URL del recurso es obligatoria.' }, { status: 400 });
    if (!validateShareUrl(shareUrl)) return Response.json({ error: 'URL no valida para esta aplicacion.' }, { status: 400 });
    if (!documentTitle) return Response.json({ error: 'El titulo del documento es obligatorio.' }, { status: 400 });

    const { subject, text, html } = buildEmailContent({ documentTitle, shareUrl, message, documentType });

    const result = await sendEmail({ to, subject, text, html }, context.env);

    if (!result.ok) {
      if (result.code === 'provider_not_configured') {
        return Response.json({ ok: false, code: 'provider_not_configured', message: result.message }, { status: 501 });
      }
      return Response.json({ ok: false, code: 'send_failed', message: result.message }, { status: 500 });
    }

    return Response.json({ ok: true, provider: result.provider });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
