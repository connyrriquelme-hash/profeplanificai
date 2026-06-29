interface Env { DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const objectiveId = url.searchParams.get('objectiveId') || '';
  const code = url.searchParams.get('objectiveCode') || '';
  const course = url.searchParams.get('course') || '';
  const subject = url.searchParams.get('subject') || '';
  const level = url.searchParams.get('level') || '';

  if (!objectiveId && !code) {
    return Response.json({ error: 'objectiveId o objectiveCode es requerido' }, { status: 400 });
  }

  try {
    let objective: any = null;

    if (objectiveId) {
      objective = await context.env.DB.prepare(`
        SELECT o.*, c.name AS course_name, c.code AS course_code, s.name AS subject_name, a.name AS axis_name
        FROM objectives o
        JOIN courses c ON c.id = o.course_id
        JOIN subjects s ON s.id = o.subject_id
        LEFT JOIN axes a ON a.id = o.axis_id
        WHERE o.id = ?
      `).bind(objectiveId).first<any>();
    }

    if (!objective && code) {
      objective = await context.env.DB.prepare(`
        SELECT o.*, c.name AS course_name, c.code AS course_code, s.name AS subject_name, a.name AS axis_name
        FROM objectives o
        JOIN courses c ON c.id = o.course_id
        JOIN subjects s ON s.id = o.subject_id
        LEFT JOIN axes a ON a.id = o.axis_id
        WHERE o.code = ?
      `).bind(code).first<any>();
    }

    if (!objective && code) {
      const normalized = code.replace(/\s+/g, ' ').trim().toUpperCase();
      objective = await context.env.DB.prepare(`
        SELECT o.*, c.name AS course_name, c.code AS course_code, s.name AS subject_name, a.name AS axis_name
        FROM objectives o
        JOIN courses c ON c.id = o.course_id
        JOIN subjects s ON s.id = o.subject_id
        LEFT JOIN axes a ON a.id = o.axis_id
        WHERE LOWER(REPLACE(o.code, ' ', '')) = LOWER(REPLACE(?, ' ', ''))
      `).bind(normalized).first<any>();
    }

    if (!objective && code && course && subject) {
      const shortCode = code.replace(/^[A-Z]+\d+\s+/i, '');
      objective = await context.env.DB.prepare(`
        SELECT o.*, c.name AS course_name, c.code AS course_code, s.name AS subject_name, a.name AS axis_name
        FROM objectives o
        JOIN courses c ON c.id = o.course_id
        JOIN subjects s ON s.id = o.subject_id
        LEFT JOIN axes a ON a.id = o.axis_id
        WHERE (c.code=? OR c.name LIKE ?) AND (s.id=? OR s.normalized_name=? OR s.name=?) AND (o.code LIKE ? OR o.code=?)
      `).bind(course, `%${course}%`, subject, subject, subject, `%${shortCode}%`, code).first<any>();
    }

    if (!objective) {
      return Response.json({ error: 'Objetivo no encontrado' }, { status: 404 });
    }

    const [indicators, skills, attitudes, textbooks, teacherGuides, resources, recommendations] = await Promise.all([
      context.env.DB.prepare('SELECT * FROM objective_indicators WHERE objective_id = ? ORDER BY order_index').bind(objective.id).all(),
      context.env.DB.prepare(`SELECT sk.* FROM skills sk JOIN objective_skills os ON os.skill_id = sk.id WHERE os.objective_id = ?`).bind(objective.id).all(),
      context.env.DB.prepare(`SELECT at.* FROM attitudes at JOIN objective_attitudes oa ON oa.attitude_id = at.id WHERE oa.objective_id = ?`).bind(objective.id).all(),
      context.env.DB.prepare('SELECT * FROM textbook_references WHERE objective_code = ? ORDER BY unit, page_start').bind(objective.code).all(),
      context.env.DB.prepare('SELECT * FROM teacher_guide_references WHERE objective_code = ? ORDER BY unit, page_start').bind(objective.code).all(),
      context.env.DB.prepare('SELECT * FROM curricular_resource_links WHERE objective_code = ? ORDER BY title').bind(objective.code).all(),
      context.env.DB.prepare('SELECT * FROM lesson_sequence_recommendations WHERE objective_code = ? ORDER BY created_at DESC').bind(objective.code).all(),
    ]);

    const rec = recommendations.results[0] as any;
    const recommendedLessons = rec?.recommended_lessons || null;
    const complexity = rec?.complexity || null;
    const rationale = rec?.rationale || null;

    return Response.json({
      data: {
        objective: {
          id: objective.id,
          code: objective.code,
          text: objective.official_text,
          normalizedText: objective.normalized_text,
          bloomLevel: objective.bloom_level,
          courseCode: objective.course_code,
          courseName: objective.course_name,
          subjectName: objective.subject_name,
          axisName: objective.axis_name,
          sourceUrl: objective.source_url,
        },
        indicators: indicators.results.map((i: any) => ({
          id: i.id, text: i.indicator_text, orderIndex: i.order_index, sourceUrl: i.source_url,
          sourceType: i.source_type || 'official', sourceName: i.source_name || 'Currículum Nacional — MINEDUC Chile',
        })),
        skills: skills.results.map((s: any) => ({
          id: s.id, text: s.official_text, code: s.code, sourceUrl: s.source_url,
        })),
        attitudes: attitudes.results.map((a: any) => ({
          id: a.id, text: a.official_text, code: a.code, sourceUrl: a.source_url,
        })),
        textbookReferences: textbooks.results.map((t: any) => ({
          id: t.id, title: t.title, publisher: t.publisher, year: t.year, type: t.type,
          unit: t.unit, pageStart: t.page_start, pageEnd: t.page_end,
          sourceUrl: t.source_url, summary: t.summary,
          sourceType: t.source_type || 'official', sourceName: t.source_name || 'Currículum Nacional — MINEDUC Chile',
        })),
        teacherGuideReferences: teacherGuides.results.map((g: any) => ({
          id: g.id, title: g.title, unit: g.unit, lessonTitle: g.lesson_title,
          suggestedActivity: g.suggested_activity, didacticOrientation: g.didactic_orientation,
          assessmentSuggestion: g.assessment_suggestion,
          pageStart: g.page_start, pageEnd: g.page_end, sourceUrl: g.source_url, summary: g.summary,
          sourceType: g.source_type || 'official', sourceName: g.source_name || 'Currículum Nacional — MINEDUC Chile',
        })),
        resourceLinks: resources.results.map((r: any) => ({
          id: r.id, title: r.title, type: r.type, description: r.description,
          sourceUrl: r.source_url, sourceName: r.source_name,
          sourceType: r.source_type || 'official',
        })),
        recommendedLessons,
        complexity,
        rationale,
        dataStatus: {
          hasIndicators: indicators.results.length > 0,
          hasTextbookReferences: textbooks.results.length > 0,
          hasTeacherGuideReferences: teacherGuides.results.length > 0,
          hasResourceLinks: resources.results.length > 0,
          hasSequenceRecommendation: recommendations.results.length > 0,
        },
      },
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
