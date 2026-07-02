const BLOCKED_PATTERNS = [
  /api[_\-]?key/gi,
  /secret/gi,
  /password/gi,
  /token/gi,
  /bearer\s+[a-z0-9]/gi,
  /sk-[a-zA-Z0-9]{20,}/g,
  /ghp_[a-zA-Z0-9]{36,}/g,
  /xox[bpsa]-[a-zA-Z0-9-]+/g,
];

const CONTENT_WARNINGS = [
  { pattern: /violencia|golpear|matar/i, message: 'Contenido potencialmente violento detectado.' },
  { pattern: /discrimin|racis|sexis|homofob/i, message: 'Contenido potencialmente discriminatorio detectado.' },
  { pattern: /politic|partido|candidat/i, message: 'Contenido politico detectado — mantener neutralidad pedagogica.' },
];

export interface SafetyCheck {
  safe: boolean;
  reason?: string;
  sanitized?: string;
}

export function scanForSecrets(text: string): SafetyCheck {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'El contenido contiene datos sensibles (claves, tokens, passwords).' };
    }
  }
  return { safe: true };
}

export function scanContent(text: string): SafetyCheck {
  for (const { pattern, message } of CONTENT_WARNINGS) {
    if (pattern.test(text)) {
      return { safe: true, reason: message };
    }
  }
  return { safe: true };
}

export function sanitizeOutput(text: string): string {
  let sanitized = text;
  for (const pattern of BLOCKED_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

export function validateAgentType(agentType: string, validTypes: readonly string[]): SafetyCheck {
  if (!validTypes.includes(agentType)) {
    return { safe: false, reason: `agentType "${agentType}" no es valido. Tipos validos: ${validTypes.join(', ')}` };
  }
  return { safe: true };
}
