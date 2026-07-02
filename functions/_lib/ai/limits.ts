const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_CHARS_PER_REQUEST = 12_000;
const MAX_TOKENS_OUTPUT = 4_096;

const requestCounts = new Map<string, { count: number; windowStart: number }>();

export function checkRateLimit(teacherId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = requestCounts.get(teacherId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestCounts.set(teacherId, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count++;
  return { allowed: true };
}

export function validateInputSize(text: string): { valid: boolean; error?: string } {
  if (text.length > MAX_CHARS_PER_REQUEST) {
    return { valid: false, error: `Input excede ${MAX_CHARS_PER_REQUEST} caracteres. Reduce el contenido.` };
  }
  return { valid: true };
}

export function getMaxOutputTokens(): number {
  return MAX_TOKENS_OUTPUT;
}

export function sanitizeForPrompt(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[`$\\]/g, '').substring(0, 2000);
}
