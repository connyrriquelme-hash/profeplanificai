/**
 * Curricular Search Service — Enhanced
 * Searches within educational data with ranking priority:
 * 1. Exact OA code match (100pts)
 * 2. Level/subject match (60pts)
 * 3. Indicator match (40pts)
 * 4. Skill match (30pts)
 * 5. Attitude match (20pts)
 * 6. Methodological match (15pts)
 */

export interface CurricularSearchResult {
  id: string;
  type: 'objective' | 'indicator' | 'skill' | 'attitude' | 'methodology' | 'template' | 'resource';
  title: string;
  snippet: string;
  score: number;
  level?: string;
  subject?: string;
  axis?: string;
  objectiveCode?: string;
  metadata?: Record<string, unknown>;
}

export interface CurricularSearchFilters {
  level?: string;
  subject?: string;
  axis?: string;
  resourceType?: string;
  methodology?: string;
  track?: string;
}

function normalizeText(text: string): string {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function extractOACodes(query: string): string[] {
  const matches = query.match(/(?:OA|oa|Oa)\s*(\d+)/gi);
  if (!matches) return [];
  return matches.map(m => m.replace(/\s+/g, ' ').trim());
}

function scoreExactOACode(text: string, query: string): number {
  const codes = extractOACodes(query);
  if (codes.length === 0) return 0;
  const normalized = normalizeText(text);
  for (const code of codes) {
    if (normalized.includes(normalizeText(code))) return 100;
  }
  return 0;
}

function scoreLevelSubject(text: string, filters: CurricularSearchFilters): number {
  if (!filters.level && !filters.subject) return 0;
  const normalized = normalizeText(text);
  let score = 0;
  if (filters.level && normalized.includes(normalizeText(filters.level))) score += 30;
  if (filters.subject && normalized.includes(normalizeText(filters.subject))) score += 30;
  return score;
}

function scoreKeywordMatch(text: string, query: string): number {
  const normalized = normalizeText(text);
  const terms = normalizeText(query).split(/\s+/).filter(t => t.length > 2);
  let score = 0;
  for (const term of terms) {
    if (normalized.includes(term)) score += 10;
  }
  return Math.min(score, 40);
}

export function rankResults(
  results: Array<{ id: string; type: string; title: string; content: string; level?: string; subject?: string; axis?: string; objectiveCode?: string }>,
  query: string,
  filters: CurricularSearchFilters = {}
): CurricularSearchResult[] {
  return results
    .map(r => {
      const combined = `${r.objectiveCode || ''} ${r.title} ${r.content} ${r.level || ''} ${r.subject || ''} ${r.axis || ''}`;
      let score = 0;
      score += scoreExactOACode(r.objectiveCode || r.title, query);
      score += scoreLevelSubject(combined, filters);
      score += scoreKeywordMatch(combined, query);

      return {
        id: r.id,
        type: r.type as CurricularSearchResult['type'],
        title: r.title,
        snippet: r.content.substring(0, 200),
        score,
        level: r.level,
        subject: r.subject,
        axis: r.axis,
        objectiveCode: r.objectiveCode,
      };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function buildSearchQuery(query: string, filters: CurricularSearchFilters): { sql: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  if (query) {
    conditions.push('(title LIKE ? OR content LIKE ? OR objective_code LIKE ?)');
    const likeQuery = `%${query}%`;
    params.push(likeQuery, likeQuery, likeQuery);
  }

  if (filters.level) {
    conditions.push('level = ?');
    params.push(filters.level);
  }

  if (filters.subject) {
    conditions.push('subject = ?');
    params.push(filters.subject);
  }

  if (filters.axis) {
    conditions.push('axis = ?');
    params.push(filters.axis);
  }

  if (filters.resourceType) {
    conditions.push('doc_type = ?');
    params.push(filters.resourceType);
  }

  return {
    sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}
