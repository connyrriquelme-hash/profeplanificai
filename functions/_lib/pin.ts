const PIN_LENGTH = 6;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;
const PBKDF2_ITERATIONS = 210000;
const PIN_REGEX = /^[0-9]{6}$/;

const SEQUENTIAL_PATTERNS = [
  '012345', '123456', '234567', '345678', '456789', '567890',
  '987654', '876543', '765432', '654321', '543210',
];

const REPEATED_PATTERNS = [
  '000000', '111111', '222222', '333333', '444444',
  '555555', '666666', '777777', '888888', '999999',
];

export interface PinValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePin(pin: string): PinValidationResult {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, error: 'PIN requerido' };
  }
  if (pin.length !== PIN_LENGTH) {
    return { valid: false, error: `PIN debe tener ${PIN_LENGTH} dígitos` };
  }
  if (!PIN_REGEX.test(pin)) {
    return { valid: false, error: 'PIN solo puede contener dígitos' };
  }
  if (SEQUENTIAL_PATTERNS.includes(pin)) {
    return { valid: false, error: 'PIN no puede ser secuencial' };
  }
  if (REPEATED_PATTERNS.includes(pin)) {
    return { valid: false, error: 'PIN no puede ser repeticiones del mismo dígito' };
  }
  return { valid: true };
}

export async function hashPin(pin: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const actualSalt = salt || crypto.randomUUID().replace(/-/g, '');
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + actualSalt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' } as const,
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: encoder.encode(actualSalt),
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(bits);
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  return { hash: hashHex, salt: actualSalt };
}

export async function verifyPin(pin: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const { hash } = await hashPin(pin, storedSalt);
  return hash === storedHash;
}

export function isLockedOut(failedAttempts: number, lockedUntil: string | null): boolean {
  if (failedAttempts < MAX_FAILED_ATTEMPTS) return false;
  if (!lockedUntil) return false;
  return new Date(lockedUntil) > new Date();
}

export function getLockoutExpiry(): string {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + LOCKOUT_MINUTES);
  return expiry.toISOString();
}

export { MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES, PIN_LENGTH, PBKDF2_ITERATIONS };
