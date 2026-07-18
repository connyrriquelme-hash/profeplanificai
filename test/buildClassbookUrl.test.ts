import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { classbookService } from '../src/services/classbookService';

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

describe('classbookService buildClassbookUrl', () => {
  it('adds institution_id when provided', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [] }));
    await classbookService.getAcademicYears('inst-abc');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('institution_id=inst-abc');
  });

  it('omits institution_id when undefined', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [] }));
    await classbookService.getClassSessions('year-1');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain('institution_id');
  });

  it('preserves existing params alongside institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [] }));
    await classbookService.getClassSessions('year-1', 'inst-xyz', { course_id: 'c1', status: 'completed' });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('academic_year_id=year-1');
    expect(url).toContain('institution_id=inst-xyz');
    expect(url).toContain('course_id=c1');
    expect(url).toContain('status=completed');
  });

  it('does not duplicate institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [] }));
    await classbookService.getObservations('inst-1', { course_id: 'c1' });
    const url = mockFetch.mock.calls[0][0] as string;
    const matches = url.match(/institution_id/g);
    expect(matches).toHaveLength(1);
  });

  it('omits undefined filter values', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [] }));
    await classbookService.getClassSessions('year-1', 'inst-1', { course_id: 'c1' });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('course_id=c1');
    expect(url).not.toContain('teacher_id=');
    expect(url).not.toContain('status=');
  });

  it('coordinator endpoints include institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: {} }));
    await classbookService.getCoordinatorDashboard({}, 'inst-99');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('institution_id=inst-99');
  });

  it('coordinator endpoints omit institution_id when undefined', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: {} }));
    await classbookService.getCoordinatorDashboard({});
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain('institution_id');
  });

  it('builds URL without query string when no params and no institution', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [] }));
    await classbookService.getPlanningReviews('inst-1');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/classbook/planning-reviews?institution_id=inst-1');
  });
});

describe('classbookService 19 path-param methods — institution_id', () => {
  it('getClassSessionById adds institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: { id: 's1' } }));
    await classbookService.getClassSessionById('s1', 'inst-1');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/classbook/sessions/s1?institution_id=inst-1');
  });

  it('createClassSessionFromLesson adds institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: { id: 's1' } }));
    await classbookService.createClassSessionFromLesson('lesson-1', 'inst-2');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/classbook/sessions/from-lesson?institution_id=inst-2');
  });

  it('updateClassSession adds institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: { id: 's1' } }));
    await classbookService.updateClassSession('s1', { status: 'completed' }, 'inst-3');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/classbook/sessions/s1?institution_id=inst-3');
  });

  it('completeClassSession adds institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: { id: 's1' } }));
    await classbookService.completeClassSession('s1', true, 'inst-4');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/classbook/sessions/s1/complete?institution_id=inst-4');
  });

  it('getAttendance adds institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [] }));
    await classbookService.getAttendance('s1', 'inst-5');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/classbook/sessions/s1/attendance?institution_id=inst-5');
  });

  it('saveAttendance adds institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: { created: 1, updated: 0, records: [] } }));
    await classbookService.saveAttendance('s1', [{ student_id: 'st1', status: 'present' }], 'teacher1', 'inst-6');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/classbook/sessions/s1/attendance?institution_id=inst-6');
  });

  it('getSignatureStatus adds institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: { signed: false } }));
    await classbookService.getSignatureStatus('s1', 'inst-7');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/classbook/sessions/s1/signature?institution_id=inst-7');
  });

  it('setupSignaturePin adds institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: { configured: true, must_change_pin: false } }));
    await classbookService.setupSignaturePin('123456', 'inst-8');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/classbook/signature-credentials/setup?institution_id=inst-8');
  });

  it('createObservation adds institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: { id: 'obs1' } }));
    await classbookService.createObservation({
      academic_year_id: 'y1', course_id: 'c1', student_id: 'st1', category: 'academic', content: 'test'
    }, 'inst-9');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/classbook/observations?institution_id=inst-9');
  });

  it('updatePlanningReview adds institution_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: { id: 'r1' } }));
    await classbookService.updatePlanningReview('r1', { status: 'approved' }, 'inst-10');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/classbook/planning-reviews/r1?institution_id=inst-10');
  });

  it('when institutionId is undefined, no institution_id param is added', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: { id: 's1' } }));
    await classbookService.getClassSessionById('s1');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('/api/classbook/sessions/s1');
    expect(url).not.toContain('institution_id');
  });

  it('no duplicate institution_id on any path-param endpoint', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: { id: 's1' } }));
    await classbookService.signSessionWithPin('s1', 'hash', '123456', 'inst-x');
    const url = mockFetch.mock.calls[0][0] as string;
    const matches = url.match(/institution_id/g);
    expect(matches).toHaveLength(1);
  });
});
