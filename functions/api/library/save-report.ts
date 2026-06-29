interface Env { DB: D1Database }

function generateId(): string {
  return `rpt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

function escapeSql(str: any): string {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as any;

    const id = generateId();
    const now = new Date().toISOString();
    const title = `Informe para apoderados — ${body.subject || ''} — ${body.course || ''}`;

    // Find a valid objective_id for the FK constraint
    let objectiveId = '';
    if (body.objectives?.[0]?.code) {
      const obj = await context.env.DB.prepare(`SELECT id FROM objectives WHERE code = ?`).bind(body.objectives[0].code).first<any>();
      if (obj) objectiveId = obj.id;
    }
    if (!objectiveId) {
      const anyObj = await context.env.DB.prepare(`SELECT id FROM objectives LIMIT 1`).first<any>();
      if (anyObj) objectiveId = anyObj.id;
    }
    if (!objectiveId) {
      return Response.json({ error: 'No hay objetivos en D1 para vincular el informe.' }, { status: 400 });
    }

    await context.env.DB.prepare(`
      INSERT INTO resources (id, objective_id, title, type, source_url, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      objectiveId,
      title,
      'parent_report',
      `parent-report/${id}`,
      JSON.stringify({
        type: 'parent_report',
        title,
        school: body.school || '',
        teacher: body.teacher || '',
        subject: body.subject || '',
        course: body.course || '',
        evaluationName: body.evaluationName || '',
        reportDate: body.reportDate || now,
        studentCount: body.studentCount || 0,
        objectives: body.objectives || [],
        indicators: body.indicators || [],
        studentNames: body.studentNames || [],
        status: 'generated',
        createdAt: now,
        source: 'Informes',
      })
    ).run();

    return Response.json({
      ok: true,
      id,
      title,
      saved: true,
      message: 'Informe guardado en la Biblioteca.',
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
