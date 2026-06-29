const API_BASE = import.meta.env.VITE_API_URL || '';

export interface SendEmailParams {
  to: string;
  documentTitle: string;
  shareUrl: string;
  message?: string;
  documentType?: string;
}

export interface SendEmailResult {
  ok: boolean;
  code?: 'provider_not_configured' | 'send_failed' | 'validation_error';
  message?: string;
  provider?: string;
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('planificaia_token');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || raw;
  } catch {
    return null;
  }
}

export async function sendSharedDocumentEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/api/share/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (res.status === 501 && data.code === 'provider_not_configured') {
      return { ok: false, code: 'provider_not_configured', message: data.message };
    }
    if (!res.ok) {
      return { ok: false, code: 'send_failed', message: data.error || data.message || 'Error al enviar correo' };
    }
    return { ok: true, provider: data.provider };
  } catch {
    return { ok: false, code: 'send_failed', message: 'No se pudo conectar con el servidor.' };
  }
}

export function buildMailtoUrl(params: {
  to: string;
  documentTitle: string;
  shareUrl: string;
  message?: string;
  documentType?: string;
}): string {
  const typeLabel = params.documentType === 'evaluacion' ? 'una evaluacion'
    : params.documentType === 'planificacion' ? 'una planificacion'
    : 'un recurso';
  const subject = `ProfePlanificAI: te compartieron ${typeLabel}`;
  const body = [
    `Te compartieron ${typeLabel} desde ProfePlanificAI:`,
    '',
    params.documentTitle,
    '',
    params.message || '',
    '',
    'Puedes abrirlo aqui:',
    params.shareUrl,
    '',
    '---',
    'Si no esperabas este correo, puedes ignorarlo.',
  ].join('\n').replace(/\n{3,}/g, '\n\n');
  return `mailto:${encodeURIComponent(params.to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
