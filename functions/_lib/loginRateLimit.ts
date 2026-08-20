// Limita intentos fallidos de login por IP para frenar fuerza bruta / credential stuffing.
// En memoria por-isolate (igual que _lib/ai/limits.ts): no es distribuido, pero ya
// frena el caso comun de un solo origen repitiendo intentos. Solo cuenta fallos:
// logins correctos nunca se ven afectados, ni siquiera en redes compartidas (colegios
// suelen salir a internet por una sola IP).

const WINDOW_MS = 10 * 60_000; // 10 minutos
const MAX_FAILED_ATTEMPTS = 20;
const MAX_TRACKED_IPS = 10_000; // evita crecimiento sin limite del Map en un isolate de larga vida

const failedAttempts = new Map<string, { count: number; windowStart: number }>();

function sweepExpired(now: number): void {
  for (const [key, entry] of failedAttempts) {
    if (now - entry.windowStart > WINDOW_MS) failedAttempts.delete(key);
  }
}

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = failedAttempts.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    return { allowed: true };
  }

  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    if (failedAttempts.size >= MAX_TRACKED_IPS) sweepExpired(now);
    failedAttempts.set(ip, { count: 1, windowStart: now });
    return;
  }

  entry.count++;
}

export function clearFailedLogins(ip: string): void {
  failedAttempts.delete(ip);
}
