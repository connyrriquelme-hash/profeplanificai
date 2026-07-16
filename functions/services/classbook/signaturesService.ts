import { D1Database } from '@cloudflare/workers-types';
import {
  ClassSession,
  SignatureEvent,
  CreateSignatureEventInput,
  ClassbookFilters,
  ClassbookListOptions,
} from '../../types/classbook';

export interface SignaturesServiceEnv {
  DB: D1Database;
}

export class SignaturesService {
  private db: D1Database;

  constructor(env: SignaturesServiceEnv) {
    this.db = env.DB;
  }

  async getSessionSignatureStatus(sessionId: string): Promise<{
    session: ClassSession | null;
    signature: SignatureEvent | null;
    canSign: boolean;
    reason?: string;
  }> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      return { session: null, signature: null, canSign: false, reason: 'Session not found' };
    }

    const signature = await this.getSignatureBySession(sessionId);

    if (session.status === 'signed') {
      return { session, signature, canSign: false, reason: 'Already signed' };
    }

    if (session.status === 'cancelled') {
      return { session, signature, canSign: false, reason: 'Session cancelled' };
    }

    if (session.status !== 'completed' && session.status !== 'pending_signature') {
      return { session, signature, canSign: false, reason: 'Session not ready for signature' };
    }

    return { session, signature, canSign: true };
  }

  async getSessionById(id: string): Promise<ClassSession | null> {
    const result = await this.db.prepare(
      `SELECT * FROM class_sessions WHERE id = ?`
    ).bind(id).first<ClassSession>();

    if (!result) return null;

    return {
      ...result,
      objective_ids_json: result.objective_ids_json || '[]',
      indicators_json: result.indicators_json || '[]',
      skills_json: result.skills_json || '[]',
      attitudes_json: result.attitudes_json || '[]',
      dua_supports_json: result.dua_supports_json || '[]',
      formative_assessment_json: result.formative_assessment_json || '[]',
      resources_json: result.resources_json || '[]',
    };
  }

  async getSignatureBySession(sessionId: string): Promise<SignatureEvent | null> {
    const result = await this.db.prepare(
      `SELECT * FROM signature_events WHERE class_session_id = ? ORDER BY signed_at DESC LIMIT 1`
    ).bind(sessionId).first<SignatureEvent>();

    return result || null;
  }

  async list(filters: ClassbookFilters, options: ClassbookListOptions = {}): Promise<{ data: SignatureEvent[]; total: number }> {
    const { limit = 20, offset = 0, order_by = 'signed_at', order_dir = 'desc' } = options;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters.institution_id) {
      where += ' AND institution_id = ?';
      params.push(filters.institution_id);
    }
    if (filters.session_id) {
      where += ' AND class_session_id = ?';
      params.push(filters.session_id);
    }
    if (filters.user_id) {
      where += ' AND user_id = ?';
      params.push(filters.user_id);
    }
    if (filters.result) {
      where += ' AND result = ?';
      params.push(filters.result);
    }
    if (filters.date_from) {
      where += ' AND signed_at >= ?';
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      where += ' AND signed_at <= ?';
      params.push(filters.date_to);
    }

    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as total FROM signature_events ${where}`
    ).bind(...params).first<{ total: number }>();

    const results = await this.db.prepare(
      `SELECT * FROM signature_events ${where} ORDER BY ${order_by} ${order_dir} LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<SignatureEvent>();

    return {
      data: results.results || [],
      total: countResult?.total || 0,
    };
  }

  async create(input: CreateSignatureEventInput): Promise<SignatureEvent> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(
      `INSERT INTO signature_events (id, institution_id, class_session_id, user_id, signed_version, content_hash, signature_method, terminal_id, signed_at, result, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      input.institution_id,
      input.class_session_id,
      input.user_id,
      input.signed_version,
      input.content_hash,
      input.signature_method || 'pin',
      input.terminal_id || null,
      now,
      input.result,
      now
    ).run();

    return this.getById(id);
  }

  async getById(id: string): Promise<SignatureEvent | null> {
    const result = await this.db.prepare(
      `SELECT * FROM signature_events WHERE id = ?`
    ).bind(id).first<SignatureEvent>();

    return result || null;
  }

  async signSession(
    sessionId: string,
    userId: string,
    institutionId: string,
    contentHash: string,
    signatureMethod: 'pin' | 'biometric' | 'external' = 'pin',
    terminalId?: string
  ): Promise<{ session: ClassSession | null; signature: SignatureEvent }> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.institution_id !== institutionId) {
      throw new Error('Session does not belong to this institution');
    }

    if (session.status !== 'completed' && session.status !== 'pending_signature') {
      throw new Error('Session is not ready for signature');
    }

    const existingSignature = await this.getSignatureBySession(sessionId);
    if (existingSignature) {
      throw Response.json({ ok: false, error: 'Session already signed' }, { status: 409 });
    }

    const signature = await this.create({
      institution_id: institutionId,
      class_session_id: sessionId,
      user_id: userId,
      signed_version: session.version,
      content_hash: contentHash,
      signature_method: signatureMethod,
      terminal_id: terminalId || null,
      result: 'success',
    });

    await this.updateSessionStatus(sessionId, 'signed', session.version);

    const updatedSession = await this.getSessionById(sessionId);
    return { session: updatedSession, signature };
  }

  async signSessionWithPin(
    sessionId: string,
    userId: string,
    institutionId: string,
    contentHash: string,
    pin: string,
    credentialsService: {
      verifyPin: (userId: string, institutionId: string, pin: string) => Promise<{ valid: boolean; reason?: string }>;
    }
  ): Promise<{ session: ClassSession | null; signature: SignatureEvent }> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.institution_id !== institutionId) {
      throw new Error('Session does not belong to this institution');
    }

    if (session.status !== 'completed' && session.status !== 'pending_signature') {
      throw new Error('Session is not ready for signature');
    }

    if (session.teacher_id !== userId) {
      throw new Error('Solo el docente de la sesión puede firmarla');
    }

    const existingSignature = await this.getSignatureBySession(sessionId);
    if (existingSignature) {
      throw new Error('Sesión ya firmada');
    }

    const pinVerification = await credentialsService.verifyPin(userId, institutionId, pin);
    if (!pinVerification.valid) {
      throw new Error(pinVerification.reason || 'PIN inválido');
    }

    const signature = await this.create({
      institution_id: institutionId,
      class_session_id: sessionId,
      user_id: userId,
      signed_version: session.version,
      content_hash: contentHash,
      signature_method: 'pin',
      terminal_id: null,
      result: 'success',
    });

    await this.updateSessionStatus(sessionId, 'signed', session.version);

    const updatedSession = await this.getSessionById(sessionId);
    return { session: updatedSession, signature };
  }

  async manualConfirmSignature(
    sessionId: string,
    userId: string,
    institutionId: string,
    contentHash: string
  ): Promise<{ session: ClassSession | null; signature: SignatureEvent }> {
    return this.signSession(sessionId, userId, institutionId, contentHash, 'manual_confirmation');
  }

  async getByUser(userId: string, institutionId: string, limit = 20): Promise<SignatureEvent[]> {
    const result = await this.db.prepare(
      `SELECT * FROM signature_events WHERE user_id = ? AND institution_id = ? ORDER BY signed_at DESC LIMIT ?`
    ).bind(userId, institutionId, limit).all<SignatureEvent>();

    return result.results || [];
  }

  async getByInstitution(institutionId: string, limit = 50): Promise<SignatureEvent[]> {
    const result = await this.db.prepare(
      `SELECT * FROM signature_events WHERE institution_id = ? ORDER BY signed_at DESC LIMIT ?`
    ).bind(institutionId, limit).all<SignatureEvent>();

    return result.results || [];
  }

  private async updateSessionStatus(sessionId: string, status: string, signedVersion: number): Promise<void> {
    await this.db.prepare(
      `UPDATE class_sessions SET status = ?, signed_version = ?, updated_at = ? WHERE id = ?`
    ).bind(status, signedVersion, new Date().toISOString(), sessionId).run();
  }

  async getPendingSignatures(institutionId: string): Promise<ClassSession[]> {
    const result = await this.db.prepare(
      `SELECT cs.* FROM class_sessions cs
       WHERE cs.institution_id = ? AND cs.status = 'pending_signature'
       ORDER BY cs.date ASC`
    ).bind(institutionId).all<ClassSession>();

    return (result.results || []).map(r => ({
      ...r,
      objective_ids_json: r.objective_ids_json || '[]',
      indicators_json: r.indicators_json || '[]',
      skills_json: r.skills_json || '[]',
      attitudes_json: r.attitudes_json || '[]',
      dua_supports_json: r.dua_supports_json || '[]',
      formative_assessment_json: r.formative_assessment_json || '[]',
      resources_json: r.resources_json || '[]',
    }));
  }

  async getFailedSignatures(institutionId: string, since?: string): Promise<SignatureEvent[]> {
    let query = `SELECT * FROM signature_events WHERE institution_id = ? AND result = 'failed'`;
    const params: (string | number)[] = [institutionId];

    if (since) {
      query += ` AND signed_at >= ?`;
      params.push(since);
    }

    query += ` ORDER BY signed_at DESC`;

    const result = await this.db.prepare(query).bind(...params).all<SignatureEvent>();
    return result.results || [];
  }

  async getSignatureStats(institutionId: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    pending: number;
  }> {
    const [totalResult, successResult, failedResult, pendingResult] = await Promise.all([
      this.db.prepare(`SELECT COUNT(*) as c FROM signature_events WHERE institution_id = ?`).bind(institutionId).first<{ c: number }>(),
      this.db.prepare(`SELECT COUNT(*) as c FROM signature_events WHERE institution_id = ? AND result = 'success'`).bind(institutionId).first<{ c: number }>(),
      this.db.prepare(`SELECT COUNT(*) as c FROM signature_events WHERE institution_id = ? AND result = 'failed'`).bind(institutionId).first<{ c: number }>(),
      this.db.prepare(`SELECT COUNT(*) as c FROM class_sessions WHERE institution_id = ? AND status = 'pending_signature'`).bind(institutionId).first<{ c: number }>(),
    ]);

    return {
      total: totalResult?.c || 0,
      successful: successResult?.c || 0,
      failed: failedResult?.c || 0,
      pending: pendingResult?.c || 0,
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM signature_events WHERE id = ?`
    ).bind(id).run();

    return (result.changes || 0) > 0;
  }
}

const now = new Date().toISOString();