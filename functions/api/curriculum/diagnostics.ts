interface Env { DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const [total, conIndicadores, sinIndicadores, porCurso] = await Promise.all([
      context.env.DB.prepare("SELECT COUNT(*) AS total FROM objectives WHERE type='OA'").first<any>(),
      context.env.DB.prepare("SELECT COUNT(DISTINCT o.id) AS total FROM objectives o JOIN objective_indicators oi ON oi.objective_id=o.id WHERE o.type='OA'").first<any>(),
      context.env.DB.prepare("SELECT COUNT(*) AS total FROM objectives o WHERE o.type='OA' AND o.id NOT IN (SELECT DISTINCT objective_id FROM objective_indicators)").first<any>(),
      context.env.DB.prepare(`
        SELECT c.name AS curso, s.name AS asignatura,
               COUNT(o.id) AS total_oa,
               SUM(CASE WHEN sub.cnt>0 THEN 1 ELSE 0 END) AS con_inds,
               ROUND(100.0*SUM(CASE WHEN sub.cnt>0 THEN 1 ELSE 0 END)/COUNT(o.id),1) AS cobertura_pct
        FROM (
          SELECT o.id, o.course_id, o.subject_id, COUNT(oi.id) AS cnt
          FROM objectives o LEFT JOIN objective_indicators oi ON oi.objective_id=o.id
          WHERE o.type='OA' GROUP BY o.id
        ) sub
        JOIN courses c ON c.id=sub.course_id
        JOIN subjects s ON s.id=sub.subject_id
        GROUP BY c.name, s.name
        ORDER BY cobertura_pct ASC, c.sort_order, s.name
      `).all<any>(),
    ]);

    const totalOA = total?.total || 0;
    const withInd = conIndicadores?.total || 0;

    return Response.json({
      totalObjectives: totalOA,
      objectivesWithIndicators: withInd,
      objectivesWithoutIndicators: totalOA - withInd,
      coveragePercent: totalOA > 0 ? Math.round((withInd / totalOA) * 1000) / 10 : 0,
      byCourseSubject: porCurso?.results?.map((r: any) => ({
        curso: r.curso,
        asignatura: r.asignatura,
        totalOA: r.total_oa,
        conIndicadores: r.con_inds,
        coberturaPct: r.cobertura_pct,
      })) || [],
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
