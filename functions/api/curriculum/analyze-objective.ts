interface Env { DB: D1Database }

function determineComplexity(params: {
  level: string; subject: string;
  indicatorCount: number; skillCount: number;
  bloomLevel: string; hasResources: boolean;
}): { complexity: string; recommendedLessons: number; rationale: string } {
  const { level, indicatorCount, skillCount, bloomLevel, hasResources } = params;
  let score = 0;

  const bloomScores: Record<string, number> = {
    'recordar': 1, 'reconocer': 1, 'identificar': 1,
    'comprender': 2, 'explicar': 2, 'describir': 2,
    'aplicar': 3, 'resolver': 3, 'ejecutar': 3,
    'analizar': 4, 'comparar': 4, 'categorizar': 4,
    'evaluar': 5, 'argumentar': 5, 'criticar': 5,
    'crear': 5, 'diseñar': 5, 'producir': 5,
  };
  score += bloomScores[bloomLevel?.toLowerCase()] || 2;

  if (indicatorCount >= 5) score += 2;
  else if (indicatorCount >= 3) score += 1;

  if (skillCount >= 3) score += 1;

  const parvularia = level.includes('Sala') || level.includes('Medio') || level.includes('Prekinder') || level.includes('Kinder');
  if (parvularia) score = Math.max(1, score - 1);

  const media = level.includes('Medio') && !parvularia;
  if (media) score += 1;

  if (hasResources) score = Math.max(1, score - 1);

  let complexity: string;
  let recommendedLessons: number;
  let rationale: string;

  if (score <= 2) {
    complexity = 'baja';
    recommendedLessons = 1;
    rationale = 'OA simple con baja carga cognitiva. Puede abordarse en una clase integrando inicio, desarrollo y cierre.';
  } else if (score <= 4) {
    complexity = 'media';
    recommendedLessons = 2;
    rationale = 'OA con habilidades de comprensión y aplicación. Requiere al menos dos clases para asegurar apropiación del aprendizaje.';
  } else if (score <= 6) {
    complexity = 'alta';
    recommendedLessons = 3;
    rationale = 'OA que involucra comprensión, aplicación y producción. Se recomienda una secuencia de tres clases para cubrir análisis, práctica y síntesis.';
  } else if (score <= 8) {
    complexity = 'alta';
    recommendedLessons = 4;
    rationale = 'OA de alta complejidad con múltiples indicadores y habilidades. Requiere una secuencia extendida para abordar progresivamente cada dimensión.';
  } else {
    complexity = 'muy_alta';
    recommendedLessons = 5;
    rationale = 'OA interdisciplinario o de muy alta exigencia cognitiva. Se recomienda una secuencia completa de cinco clases con evaluación de producto final.';
  }

  return { complexity, recommendedLessons, rationale };
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as {
      level?: string; subject?: string; objectiveCode?: string;
      objectiveText?: string; indicators?: string[]; skills?: string[];
    };

    if (!body.objectiveCode) {
      return Response.json({ error: 'objectiveCode es requerido' }, { status: 400 });
    }

    const indicatorCount = body.indicators?.length || 0;
    const skillCount = body.skills?.length || 0;

    let bloomLevel = '';
    let hasResources = false;

    const existing = await context.env.DB.prepare(
      'SELECT bloom_level FROM objectives WHERE code = ?'
    ).bind(body.objectiveCode).first<any>();

    if (existing) {
      bloomLevel = existing.bloom_level || '';
      const res = await context.env.DB.prepare(
        'SELECT COUNT(*) as count FROM curricular_resource_links WHERE objective_code = ?'
      ).bind(body.objectiveCode).first<any>();
      hasResources = (res?.count || 0) > 0;
    }

    const { complexity, recommendedLessons, rationale } = determineComplexity({
      level: body.level || '',
      subject: body.subject || '',
      indicatorCount,
      skillCount,
      bloomLevel,
      hasResources,
    });

    const suggestedSequence = Array.from({ length: recommendedLessons }, (_, i) => ({
      lesson: i + 1,
      focus: i === 0 ? 'Introducción y exploración'
        : i === recommendedLessons - 1 ? 'Síntesis y evaluación'
        : `Desarrollo y profundización (parte ${i})`,
    }));

    return Response.json({
      data: {
        complexity,
        recommendedLessons,
        rationale,
        suggestedSequence,
      },
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
