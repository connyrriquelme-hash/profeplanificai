import { describe, it, expect, vi } from 'vitest';
import { onRequestGet } from '../functions/api/objectives';

const MOCK_ROW = {
  id: 'obj-1',
  code: 'OA 1',
  type: 'OA',
  official_text: 'Describir la estructura celular.',
  normalized_text: 'describir la estructura celular',
  course_code: '5B',
  course_name: '5° Básico',
  subject_id_out: 'subj-1',
  subject_name: 'Ciencias Naturales',
  axis_name: 'Ciencias de la Vida',
  indicators_json: '["Identifica organelos celulares"]',
  skills_json: '["Observar: registrar evidencias"]',
};

function mockContext(url: string) {
  const allMock = vi.fn().mockResolvedValue({ results: [MOCK_ROW] });
  const bindMock = vi.fn().mockReturnValue({ all: allMock });
  const prepareMock = vi.fn().mockReturnValue({ bind: bindMock });

  return {
    request: { url },
    env: { DB: { prepare: prepareMock } as unknown as D1Database, CORE_DB: {} as D1Database },
  } as unknown as Parameters<typeof onRequestGet>[0];
}

describe('GET /api/objectives', () => {
  it('passes indicators_json and skills_json through to the response untouched', async () => {
    const ctx = mockContext('https://example.com/api/objectives?course=5°%20Básico&subject=Ciencias%20Naturales');
    const res = await onRequestGet(ctx);
    const json = await res.json() as { data: typeof MOCK_ROW[] };

    expect(json.data).toHaveLength(1);
    expect(json.data[0].indicators_json).toBe('["Identifica organelos celulares"]');
    expect(json.data[0].skills_json).toBe('["Observar: registrar evidencias"]');
  });

  it('includes json_group_array subqueries for indicators and skills in the SQL sent to D1', async () => {
    const ctx = mockContext('https://example.com/api/objectives');
    await onRequestGet(ctx);

    const prepareMock = (ctx.env.DB as unknown as { prepare: ReturnType<typeof vi.fn> }).prepare;
    const sql = prepareMock.mock.calls[0][0] as string;

    expect(sql).toContain('curriculum_indicators');
    expect(sql).toContain('ci.oa_code = o.code');
    expect(sql).toContain('objective_skills');
    expect(sql).toContain('os.objective_id = o.id');
  });
});
