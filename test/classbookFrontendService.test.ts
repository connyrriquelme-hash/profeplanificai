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

describe('classbookService', () => {
  it('parses ok response for getAcademicYears', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [{ id: 'y1', name: '2026' }] }));
    const years = await classbookService.getAcademicYears('inst-1');
    expect(years).toHaveLength(1);
    expect(years[0].id).toBe('y1');
  });

  it('returns empty array for null data', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: null }));
    const years = await classbookService.getAcademicYears('inst-1');
    expect(years).toEqual([]);
  });

  it('handles 401 by clearing token', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: false, error: 'Unauthorized' }, { ok: false, status: 401 }));
    await expect(classbookService.getAcademicYears('inst-1')).rejects.toThrow();
  });

  it('handles 403 forbidden', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: false, error: 'Forbidden' }, { ok: false, status: 403 }));
    await expect(classbookService.getClassSessions('y1')).rejects.toThrow();
  });

  it('throws on 404', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: false, error: 'Not found' }, { ok: false, status: 404 }));
    await expect(classbookService.getClassSessionById('non-existent')).rejects.toThrow('Not found');
  });

  it('handles 409 conflict', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: false, error: 'Duplicate' }, { ok: false, status: 409 }));
    await expect(classbookService.createObservation({
      academic_year_id: 'y1', course_id: 'c1', student_id: 's1', category: 'academic', content: 'Test'
    })).rejects.toThrow();
  });

  it('handles 422 validation error', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: false, error: 'Validation failed' }, { ok: false, status: 422 }));
    await expect(classbookService.createPlanningReview('plan-1')).rejects.toThrow();
  });

  it('does not include institutionId in request URL (server determines it)', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [] }));
    await classbookService.getAcademicYears('inst-1');
    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain('/api/classbook/academic-years');
  });

  it('fetches with Authorization header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [] }));
    await classbookService.getAcademicYears('inst-1');
    const headers = mockFetch.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['Authorization']).toContain('Bearer');
  });

  it('getClassSessions returns array', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [{ id: 's1', title: 'Clase 1' }] }));
    const sessions = await classbookService.getClassSessions('y1');
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('s1');
  });

  it('getObservations filters by course_id', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [{ id: 'o1' }] }));
    await classbookService.getObservations('inst-1', { course_id: 'c1' });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('course_id=c1');
  });

  it('getAttendance returns records', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: [{ student_id: 'st1', status: 'present' }] }));
    const records = await classbookService.getAttendance('sess-1');
    expect(records).toHaveLength(1);
    expect(records[0].status).toBe('present');
  });

  it('archiveObservation calls DELETE', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true, data: { id: 'o1', archived: true } }));
    const result = await classbookService.archiveObservation('o1');
    expect(result.id).toBe('o1');
    const method = mockFetch.mock.calls[0][1]?.method;
    expect(method).toBe('DELETE');
  });
});
