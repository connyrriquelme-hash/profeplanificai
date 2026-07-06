interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface EmailEnv {
  EMAIL?: { send: (msg: { from: string; to: string; subject: string; text: string; html?: string }) => Promise<unknown> };
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  TRIAL_REQUEST_TO?: string;
  TRIAL_REQUEST_FROM?: string;
}

export function buildEmailContent(params: {
  documentTitle: string;
  shareUrl: string;
  message?: string;
  documentType?: string;
  senderName?: string;
}): { subject: string; text: string; html: string } {
  const typeLabel = params.documentType === 'evaluacion' ? 'una evaluacion'
    : params.documentType === 'planificacion' ? 'una planificacion'
    : 'un recurso';

  const subject = `ProfePlanificAI: te compartieron ${typeLabel}`;

  const safeMessage = params.message
    ? params.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
    : '';

  const text = [
    'Hola,',
    '',
    `Te compartieron ${typeLabel} desde ProfePlanificAI:`,
    '',
    params.documentTitle,
    '',
    params.message || '',
    '',
    'Puedes abrirlo aqui:',
    params.shareUrl,
    '',
    'Saludos,',
    'ProfePlanificAI',
    '',
    '---',
    'Si no esperabas este correo, puedes ignorarlo.',
  ].filter(l => l !== '' || l === '---').join('\n');

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fafafa">
    <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
      <h2 style="color:#7c3aed;margin:0 0 8px;font-size:18px">ProfePlanificAI</h2>
      <h3 style="color:#111827;margin:0 0 16px;font-size:15px;font-weight:400">Te compartieron ${typeLabel}:</h3>
      <div style="background:#f5f3ff;border-radius:12px;padding:16px;margin-bottom:16px">
        <p style="margin:0;color:#111827;font-weight:600;font-size:14px">${params.documentTitle.replace(/</g, '&lt;')}</p>
      </div>
      ${safeMessage ? `<p style="color:#374151;font-size:13px;line-height:1.5;margin-bottom:16px">${safeMessage}</p>` : ''}
      <a href="${params.shareUrl.replace(/&/g, '&amp;')}" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600">Abrir recurso</a>
      <p style="color:#9ca3af;font-size:11px;margin-top:24px">Si no esperabas este correo, puedes ignorarlo.</p>
    </div></body></html>`;

  return { subject, text, html };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateShareUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const allowed = ['profeplanificai.cl', 'planificaia-chile.pages.dev', 'localhost'];
    return allowed.some(host => u.hostname === host || u.hostname.endsWith('.' + host));
  } catch {
    return false;
  }
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export type EmailResult =
  | { ok: true; provider: string }
  | { ok: false; code: 'provider_not_configured'; message: string }
  | { ok: false; code: 'send_failed'; message: string };

export async function sendEmail(params: EmailParams, env: EmailEnv): Promise<EmailResult> {
  const from = env.EMAIL_FROM || 'ProfePlanificAI <no-reply@profeplanificai.cl>';

  if (env.EMAIL) {
    try {
      await env.EMAIL.send({ from, to: params.to, subject: params.subject, text: params.text, html: params.html });
      return { ok: true, provider: 'cloudflare_email' };
    } catch (err) {
      return { ok: false, code: 'send_failed', message: err instanceof Error ? err.message : 'Cloudflare Email error' };
    }
  }

  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: params.to, subject: params.subject, text: params.text, html: params.html }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        return { ok: false, code: 'send_failed', message: `Resend error ${res.status}: ${errBody}` };
      }
      return { ok: true, provider: 'resend' };
    } catch (err) {
      return { ok: false, code: 'send_failed', message: err instanceof Error ? err.message : 'Resend fetch error' };
    }
  }

  return { ok: false, code: 'provider_not_configured', message: 'No hay proveedor de correo configurado.' };
}

interface TrialRequestData {
  name: string;
  email: string;
  institution: string;
  role: string;
  message: string;
  source: string;
  ip: string;
}

export async function sendTrialRequestEmail(env: EmailEnv, data: TrialRequestData): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[email] RESEND_API_KEY not configured — skipping email send');
    return false;
  }

  const to = env.TRIAL_REQUEST_TO || 'connyrriquelme@gmail.com';
  const from = env.TRIAL_REQUEST_FROM || 'notificaciones@profeplanificai.cl';

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,#d946ef,#f97316);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
        <h1 style="color:white;margin:0;font-size:22px;">Nueva solicitud de prueba gratuita</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">ProfePlanificAI</p>
      </div>
      <div style="background:#f9fafb;border-radius:12px;padding:20px;border:1px solid #e5e7eb;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;font-weight:600;width:120px;">Nombre</td><td style="padding:8px 0;color:#111827;">${escapeHtml(data.name)}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-weight:600;">Email</td><td style="padding:8px 0;color:#111827;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-weight:600;">Institución</td><td style="padding:8px 0;color:#111827;">${escapeHtml(data.institution || 'No especificada')}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-weight:600;">Cargo</td><td style="padding:8px 0;color:#111827;">${escapeHtml(data.role || 'No especificado')}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-weight:600;">Mensaje</td><td style="padding:8px 0;color:#111827;">${escapeHtml(data.message || 'Sin mensaje')}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-weight:600;">Origen</td><td style="padding:8px 0;color:#111827;">${escapeHtml(data.source)}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-weight:600;">Fecha</td><td style="padding:8px 0;color:#111827;">${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}</td></tr>
        </table>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:20px;">Este correo fue generado automáticamente por ProfePlanificAI.</p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Nueva solicitud de prueba gratuita — ProfePlanificAI`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      console.error('[email] Resend API error:', res.status, err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[email] Failed to send trial request email:', err);
    return false;
  }
}
