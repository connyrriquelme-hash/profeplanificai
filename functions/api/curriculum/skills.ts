interface Env { DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const objectiveId = url.searchParams.get('objective_id') || '';
  const subject = url.searchParams.get('subject') || '';
  const course = url.searchParams.get('course') || '';

  try {
    let results: any[] = [];

    if (objectiveId) {
      // Get skills linked to a specific objective via objective_skills
      results = await context.env.DB.prepare(`
        SELECT sk.id, sk.code, sk.official_text, sk.subject_id
        FROM skills sk
        JOIN objective_skills os ON os.skill_id = sk.id
        WHERE os.objective_id = ?
        ORDER BY sk.code
      `).bind(objectiveId).all<any>();
    } else if (subject) {
      // Get all skills for a subject
      results = await context.env.DB.prepare(`
        SELECT sk.id, sk.code, sk.official_text, sk.subject_id
        FROM skills sk
        JOIN subjects s ON s.id = sk.subject_id
        WHERE s.name = ? OR s.normalized_name = ? OR s.id = ?
        ORDER BY sk.code
      `).bind(subject, subject.toLowerCase().replace(/\s+/g, '-'), subject).all<any>();
    } else if (course) {
      // Get all skills for a course (via objectives)
      results = await context.env.DB.prepare(`
        SELECT DISTINCT sk.id, sk.code, sk.official_text, sk.subject_id
        FROM skills sk
        JOIN objective_skills os ON os.skill_id = sk.id
        JOIN objectives o ON o.id = os.objective_id
        JOIN courses c ON c.id = o.course_id
        WHERE c.code = ? OR c.name = ?
        ORDER BY sk.code
      `).bind(course, course).all<any>();
    } else {
      // Get all skills (limited)
      results = await context.env.DB.prepare(`
        SELECT sk.id, sk.code, sk.official_text, sk.subject_id
        FROM skills sk
        ORDER BY sk.code
        LIMIT 100
      `).all<any>();
    }

    return Response.json({
      ok: true,
      data: results,
      count: results.length,
      source: 'D1',
      message: results.length === 0 ? 'No hay habilidades oficiales vinculadas' : undefined,
    });
  } catch (err: any) {
    return Response.json({ ok: false, error: err.message, data: [] }, { status: 500 });
  }
}
