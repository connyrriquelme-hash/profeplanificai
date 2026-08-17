import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { fetchObjectivesFromAPI } from '../src/data/libraryMockData';

function makeResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('fetchObjectivesFromAPI', () => {
  it('parses indicators_json and skills_json from /api/objectives into string arrays', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({
      data: [{
        code: 'OA 1',
        official_text: 'Describir la estructura celular.',
        axis_name: 'Ciencias de la Vida',
        course_code: '5B',
        course_name: '5° Básico',
        subject_name: 'Ciencias Naturales',
        indicators_json: '["Identifica organelos celulares", "Compara célula animal y vegetal"]',
        skills_json: '["Observar: registrar evidencias", "Comunicar: explicar hallazgos"]',
      }],
    }));

    const [objective] = await fetchObjectivesFromAPI({ course: '5° Básico', subject: 'Ciencias Naturales' });

    expect(objective.indicators).toEqual(['Identifica organelos celulares', 'Compara célula animal y vegetal']);
    expect(objective.skills).toEqual(['Observar: registrar evidencias', 'Comunicar: explicar hallazgos']);
  });

  it('falls back to an empty array when indicators_json/skills_json are null (no match in D1)', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({
      data: [{
        code: 'OA 2',
        official_text: 'Sin indicadores ligados.',
        axis_name: '',
        course_code: '5B',
        course_name: '5° Básico',
        subject_name: 'Ciencias Naturales',
        indicators_json: null,
        skills_json: null,
      }],
    }));

    const [objective] = await fetchObjectivesFromAPI({});

    expect(objective.indicators).toEqual([]);
    expect(objective.skills).toEqual([]);
  });

  it('falls back to an empty array on malformed JSON instead of throwing', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({
      data: [{
        code: 'OA 3',
        official_text: 'JSON corrupto.',
        axis_name: '',
        course_code: '5B',
        course_name: '5° Básico',
        subject_name: 'Ciencias Naturales',
        indicators_json: 'no es json',
        skills_json: '{"no":"es un array"}',
      }],
    }));

    const [objective] = await fetchObjectivesFromAPI({});

    expect(objective.indicators).toEqual([]);
    expect(objective.skills).toEqual([]);
  });

  it('throws with the status code when the endpoint responds with an error', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, { ok: false, status: 500 }));

    await expect(fetchObjectivesFromAPI({})).rejects.toThrow('500');
  });
});
