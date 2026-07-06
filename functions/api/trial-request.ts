import { sendTrialRequestEmail } from '../_lib/email';

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  TRIAL_REQUEST_TO?: string;
  TRIAL_REQUEST_FROM?: string;
}

function jsonResp(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function sanitize(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim().slice(0, 1000);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 21; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json<{
      name?: string;
      email?: string;
      institution?: string;
      role?: string;
      message?: string;
    }>();

    const name = sanitize(body.name);
    const email = sanitize(body.email);
    const institution = sanitize(body.institution);
    const role = sanitize(body.role);
    const message = sanitize(body.message);

    if (!name) return jsonResp({ success: false, error: 'El nombre es obligatorio.' }, 400);
    if (!email || !isValidEmail(email)) return jsonResp({ success: false, error: 'Ingresa un correo válido.' }, 400);

    const id = generateId();
    const ip = context.request.headers.get('CF-Connecting-IP') || '';
    const ua = context.request.headers.get('User-Agent') || '';

    await context.env.DB.prepare(`
      INSERT INTO trial_requests (id, name, email, institution, role, message, status, source, user_agent, ip_hash, email_sent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'new', 'public_landing', ?, ?, 0, datetime('now'), datetime('now'))
    `).bind(id, name, email, institution, role, message, ua.slice(0, 500), ip.slice(0, 45)).run();

    let emailSent = false;
    try {
      emailSent = await sendTrialRequestEmail(context.env, { name, email, institution, role, message, source: 'public_landing', ip });
    } catch (err) {
      console.error('[trial-request] email send failed:', err);
    }

    if (emailSent) {
      await context.env.DB.prepare('UPDATE trial_requests SET email_sent = 1 WHERE id = ?').bind(id).run();
    }

    return jsonResp({ success: true, message: 'Solicitud recibida. Te contactaremos pronto.' });
  } catch (err) {
    console.error('[trial-request] Error:', err);
    return jsonResp({ success: false, error: 'No se pudo procesar la solicitud.' }, 500);
  }
}

export async function onRequest(): Promise<Response> {
  return jsonResp({ success: false, error: 'Método no permitido. Use POST.' }, 405);
}
