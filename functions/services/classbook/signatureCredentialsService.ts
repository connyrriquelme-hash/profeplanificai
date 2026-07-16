import { D1Database } from '@cloudflare/workers-types';
import {
  validatePin,
  hashPin,
  verifyPin,
  isLockedOut,
  getLockoutExpiry,
  MAX_FAILED_ATTEMPTS,
  type PinValidationResult,
} from '../../_lib/pin';

export interface SignatureCredential {
  id: string;
  institution_id: string;
  user_id: string;
  pin_hash: string;
  pin_salt: string;
  failed_attempts: number;
  locked_until: string | null;
  must_change_pin: number;
  updated_at: string;
  created_at: string;
}

export interface CredentialStatus {
  configured: boolean;
  locked: boolean;
  must_change_pin: boolean;
  failed_attempts: number;
  locked_until: string | null;
}

export interface SignatureCredentialsServiceEnv {
  DB: D1Database;
}

export class SignatureCredentialsService {
  private db: D1Database;

  constructor(env: SignatureCredentialsServiceEnv) {
    this.db = env.DB;
  }

  async hasCredential(userId: string, institutionId: string): Promise<boolean> {
    const result = await this.db.prepare(
      `SELECT 1 FROM teacher_signature_credentials WHERE user_id = ? AND institution_id = ?`
    ).bind(userId, institutionId).first();
    return result !== null;
  }

  async getCredential(userId: string, institutionId: string): Promise<SignatureCredential | null> {
    return this.db.prepare(
      `SELECT * FROM teacher_signature_credentials WHERE user_id = ? AND institution_id = ?`
    ).bind(userId, institutionId).first<SignatureCredential>();
  }

  async getCredentialStatus(userId: string, institutionId: string): Promise<CredentialStatus> {
    const cred = await this.getCredential(userId, institutionId);
    if (!cred) {
      return { configured: false, locked: false, must_change_pin: false, failed_attempts: 0, locked_until: null };
    }
    return {
      configured: true,
      locked: isLockedOut(cred.failed_attempts, cred.locked_until),
      must_change_pin: cred.must_change_pin === 1,
      failed_attempts: cred.failed_attempts,
      locked_until: cred.locked_until,
    };
  }

  async createCredential(userId: string, institutionId: string, pin: string): Promise<SignatureCredential> {
    const validation = validatePin(pin);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const existing = await this.hasCredential(userId, institutionId);
    if (existing) {
      throw new Error('Ya existe una credencial de firma configurada');
    }

    const { hash, salt } = await hashPin(pin);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(
      `INSERT INTO teacher_signature_credentials (id, institution_id, user_id, pin_hash, pin_salt, failed_attempts, locked_until, must_change_pin, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, 0, NULL, 0, ?, ?)`
    ).bind(id, institutionId, userId, hash, salt, now, now).run();

    return this.getCredential(userId, institutionId) as Promise<SignatureCredential>;
  }

  async verifyPin(userId: string, institutionId: string, pin: string): Promise<{ valid: boolean; reason?: string }> {
    const cred = await this.getCredential(userId, institutionId);
    if (!cred) {
      return { valid: false, reason: 'Credencial no configurada' };
    }

    if (isLockedOut(cred.failed_attempts, cred.locked_until)) {
      return { valid: false, reason: 'Cuenta bloqueada por intentos fallidos. Intente más tarde o contacte al administrador.' };
    }

    const pinValid = await verifyPin(pin, cred.pin_hash, cred.pin_salt);
    if (!pinValid) {
      await this.recordFailedAttempt(userId, institutionId);
      const updatedCred = await this.getCredential(userId, institutionId);
      const remaining = MAX_FAILED_ATTEMPTS - (updatedCred?.failed_attempts ?? 0);
      if (remaining <= 0) {
        return { valid: false, reason: 'PIN incorrecto. Cuenta bloqueada por seguridad.' };
      }
      return { valid: false, reason: `PIN incorrecto. Intentos restantes: ${remaining}` };
    }

    await this.resetFailedAttempts(userId, institutionId);
    return { valid: true };
  }

  async changePin(userId: string, institutionId: string, currentPin: string, newPin: string): Promise<void> {
    const verification = await this.verifyPin(userId, institutionId, currentPin);
    if (!verification.valid) {
      throw new Error(verification.reason || 'PIN actual incorrecto');
    }

    const newValidation = validatePin(newPin);
    if (!newValidation.valid) {
      throw new Error(newValidation.error);
    }

    if (currentPin === newPin) {
      throw new Error('El nuevo PIN debe ser diferente al actual');
    }

    const { hash, salt } = await hashPin(newPin);
    const now = new Date().toISOString();

    await this.db.prepare(
      `UPDATE teacher_signature_credentials
       SET pin_hash = ?, pin_salt = ?, must_change_pin = 0, updated_at = ?
       WHERE user_id = ? AND institution_id = ?`
    ).bind(hash, salt, now, userId, institutionId).run();
  }

  async resetCredential(userId: string, institutionId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.prepare(
      `UPDATE teacher_signature_credentials
       SET failed_attempts = 0, locked_until = NULL, must_change_pin = 1, updated_at = ?
       WHERE user_id = ? AND institution_id = ?`
    ).bind(now, userId, institutionId).run();
  }

  async recordFailedAttempt(userId: string, institutionId: string): Promise<void> {
    const cred = await this.getCredential(userId, institutionId);
    if (!cred) return;

    const newAttempts = cred.failed_attempts + 1;
    const now = new Date().toISOString();

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutExpiry = getLockoutExpiry();
      await this.db.prepare(
        `UPDATE teacher_signature_credentials
         SET failed_attempts = ?, locked_until = ?, updated_at = ?
         WHERE user_id = ? AND institution_id = ?`
      ).bind(newAttempts, lockoutExpiry, now, userId, institutionId).run();
    } else {
      await this.db.prepare(
        `UPDATE teacher_signature_credentials
         SET failed_attempts = ?, updated_at = ?
         WHERE user_id = ? AND institution_id = ?`
      ).bind(newAttempts, now, userId, institutionId).run();
    }
  }

  async resetFailedAttempts(userId: string, institutionId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.prepare(
      `UPDATE teacher_signature_credentials
       SET failed_attempts = 0, locked_until = NULL, updated_at = ?
       WHERE user_id = ? AND institution_id = ?`
    ).bind(now, userId, institutionId).run();
  }

  async unlockCredential(userId: string, institutionId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.prepare(
      `UPDATE teacher_signature_credentials
       SET failed_attempts = 0, locked_until = NULL, updated_at = ?
       WHERE user_id = ? AND institution_id = ?`
    ).bind(now, userId, institutionId).run();
  }

  async deleteCredential(userId: string, institutionId: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM teacher_signature_credentials WHERE user_id = ? AND institution_id = ?`
    ).bind(userId, institutionId).run();
    return (result.changes || 0) > 0;
  }
}
