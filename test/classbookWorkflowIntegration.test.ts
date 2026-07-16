import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { classbookService } from '../src/services/classbookService';
import { canViewClassbook, canCreateSession, canEditSession, canCompleteSession, canManageAttendance, canCreateObservation, canSignSession } from '../src/utils/classbookPermissions';

function makeResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.setItem('planificaia_token', JSON.stringify({ token: 'test-token' }));
});

describe('FASE 6.6 — Teacher Workflow Integration', () => {

  describe('Session creation from lesson instance', () => {
    it('creates session from lessonInstanceId', async () => {
      const session = { id: 'sess-1', date: '2026-07-15', status: 'scheduled', version: 1 };
      mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: session }));
      const result = await classbookService.createClassSessionFromLesson('lesson-1');
      expect(result.id).toBe('sess-1');
      expect(result.status).toBe('scheduled');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.lesson_instance_id).toBe('lesson-1');
    });

    it('rejects duplicate session (409)', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse({ ok: false, error: 'Duplicate' }, { ok: false, status: 409 }));
      await expect(classbookService.createClassSessionFromLesson('lesson-1')).rejects.toThrow();
    });
  });

  describe('Session status transitions', () => {
    it('transitions from scheduled to completed via completeSession', async () => {
      const updated = { id: 'sess-1', status: 'completed', version: 1 };
      mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: updated }));
      const result = await classbookService.completeClassSession('sess-1', false);
      expect(result.status).toBe('completed');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.finalize).toBe(false);
    });

    it('transitions from completed to pending_signature via completeSession with finalize', async () => {
      const updated = { id: 'sess-1', status: 'pending_signature', version: 2 };
      mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: updated }));
      const result = await classbookService.completeClassSession('sess-1', true);
      expect(result.status).toBe('pending_signature');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.finalize).toBe(true);
    });

    it('allows direct status update via updateClassSession', async () => {
      const updated = { id: 'sess-1', status: 'in_progress', version: 1 };
      mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: updated }));
      const result = await classbookService.updateClassSession('sess-1', { status: 'in_progress' });
      expect(result.status).toBe('in_progress');
    });
  });

  describe('Versioning', () => {
    it('fetches session versions', async () => {
      const versions = [
        { version: 2, snapshot_json: '{}', created_at: '2026-07-15T10:00:00Z' },
        { version: 1, snapshot_json: '{}', created_at: '2026-07-15T09:00:00Z' },
      ];
      mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: versions }));
      const result = await classbookService.getSessionVersions('sess-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('Attendance integration', () => {
    it('fetches attendance for session', async () => {
      const records = [
        { id: 'att-1', student_id: 'st-1', status: 'present', class_session_id: 'sess-1' },
        { id: 'att-2', student_id: 'st-2', status: 'absent', class_session_id: 'sess-1' },
      ];
      mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: records }));
      const result = await classbookService.getAttendance('sess-1');
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('present');
    });

    it('saves attendance batch', async () => {
      const batchResult = { created: 2, updated: 0, records: [] };
      mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: batchResult }));
      const result = await classbookService.saveAttendance('sess-1', [
        { student_id: 'st-1', status: 'present' },
        { student_id: 'st-2', status: 'absent' },
      ], 'teacher-1');
      expect(result.created).toBe(2);
      const method = mockFetch.mock.calls[0][1].method;
      expect(method).toBe('PUT');
    });
  });

  describe('Observations linked to session', () => {
    it('creates observation with class_session_id', async () => {
      const obs = { id: 'obs-1', category: 'academic', content: 'Good progress', class_session_id: 'sess-1' };
      mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: obs }));
      const result = await classbookService.createObservation({
        academic_year_id: 'y1',
        course_id: 'c1',
        student_id: 'st-1',
        category: 'academic',
        content: 'Good progress',
        class_session_id: 'sess-1',
      });
      expect(result.class_session_id).toBe('sess-1');
    });
  });

  describe('Permission-based access control', () => {
    const adminUser = { id: '1', institutionalRole: 'institution_admin' as const };
    const teacherUser = { id: '2', institutionalRole: 'teacher' as const };
    const studentUser = { id: '3', institutionalRole: 'student' as const };

    it('admin can view, create, edit, complete, attend, observe, sign', () => {
      expect(canViewClassbook(adminUser)).toBe(true);
      expect(canCreateSession(adminUser)).toBe(true);
      expect(canEditSession(adminUser, 'any', 'any')).toBe(true);
      expect(canCompleteSession(adminUser)).toBe(true);
      expect(canManageAttendance(adminUser)).toBe(true);
      expect(canCreateObservation(adminUser)).toBe(true);
      expect(canSignSession(adminUser)).toBe(true);
    });

    it('teacher with permissions can perform actions', () => {
      const teacher = { ...teacherUser, permissions: ['classbook:create', 'classbook:update', 'classbook:complete', 'classbook:attendance', 'classbook:observe'] };
      expect(canCreateSession(teacher)).toBe(true);
      expect(canEditSession(teacher, 'any', 'any')).toBe(true);
      expect(canCompleteSession(teacher)).toBe(true);
      expect(canManageAttendance(teacher)).toBe(true);
      expect(canCreateObservation(teacher)).toBe(true);
    });

    it('teacher without permissions cannot perform actions', () => {
      expect(canCreateSession(teacherUser)).toBe(false);
      expect(canCompleteSession(teacherUser)).toBe(false);
      expect(canManageAttendance(teacherUser)).toBe(false);
      expect(canCreateObservation(teacherUser)).toBe(false);
    });

    it('student cannot access classbook', () => {
      expect(canViewClassbook(studentUser)).toBe(false);
    });

    it('teacher can only edit own sessions', () => {
      const teacher = { ...teacherUser, permissions: ['classbook:update_own'] };
      expect(canEditSession(teacher, 'teacher-2', 'teacher-2')).toBe(true);
      expect(canEditSession(teacher, 'teacher-3', 'teacher-2')).toBe(false);
    });
  });

  describe('Session data integrity', () => {
    it('preserves JSON fields through update cycle', async () => {
      const original = {
        id: 'sess-1',
        objective_ids_json: '["OA 1"]',
        indicators_json: '["Indicator 1"]',
        skills_json: '["Skill 1"]',
        attitudes_json: '["Attitude 1"]',
        dua_supports_json: '["DUA 1"]',
        resources_json: '[{"title":"Resource 1"}]',
        formative_assessment_json: '[{"title":"Assessment 1"}]',
      };
      mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: original }));
      const session = await classbookService.getClassSessionById('sess-1');
      expect(session?.objective_ids_json).toBe('["OA 1"]');
      expect(session?.indicators_json).toBe('["Indicator 1"]');
      expect(session?.resources_json).toBe('[{"title":"Resource 1"}]');
    });
  });
});
