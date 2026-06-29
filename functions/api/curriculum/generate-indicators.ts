interface Env {
  DB: D1Database;
  GEMINI_API_KEY?: string;
}

const SUBJECT_PROMPTS: Record<string, string> = {
  'Lenguaje y Comunicación': 'Comprensión lectora, producción de textos, comunicación oral, análisis literario.',
  'Lengua y Literatura': 'Comprensión lectora, producción de textos, comunicación oral, análisis literario.',
  'Matemática': 'Razonamiento lógico, resolución de problemas, aplicación de conceptos, modelación matemática.',
  'Ciencias Naturales': 'Observación, experimentación, análisis científico, relación con el entorno natural.',
  'Historia, Geografía y Ciencias Sociales': 'Análisis histórico, comprensión geográfica, formación ciudadana, pensamiento crítico.',
  'Tecnología': 'Uso de herramientas digitales, pensamiento computacional, diseño y solución de problemas.',
  'Artes Visuales': 'Expresión visual, apreciación estética, creación artística.',
  'Música': 'Expresión musical, apreciación rítmica, creación sonora.',
  'Educación Física y Salud': 'Desarrollo motor, hábitos saludables, trabajo en equipo.',
  'Orientación': 'Desarrollo personal, habilidades socioemocionales, convivencia escolar.',
  'Inglés': 'Comprensión auditiva y lectora, producción oral y escrita en inglés.',
};

function getSubjectContext(subject?: string): string {
  return SUBJECT_PROMPTS[subject || ''] || 'Observación, análisis y aplicación de conceptos en contextos pedagógicos.';
}

function generateDeterministicIndicators(text: string, subject?: string): string[] {
  const t = text.trim().replace(/\.$/, '');
  const intro = t.length > 120 ? t.slice(0, 120).replace(/\s+\S*$/, '') : t;
  return [
    `Identifica los elementos clave relacionados con ${intro.toLowerCase()}.`,
    `Explica con sus propias palabras ${intro.toLowerCase()}.`,
    `Aplica lo aprendido sobre ${intro.toLowerCase()} en situaciones nuevas o cotidianas.`,
    `Analiza ejemplos concretos de ${intro.toLowerCase()}.`,
    `Relaciona ${intro.toLowerCase()} con otros contenidos del nivel.`,
  ];
}

function generateIndicatorsFromSubject(text: string, subject?: string): string[] {
  const t = text.trim().replace(/\.$/, '');
  const ctx = getSubjectContext(subject);
  const short = t.length > 80 ? t.slice(0, 80).replace(/\s+\S*$/, '') + '...' : t;
  return [
    `Identifica ${short.toLowerCase()} en diversos contextos.`,
    `Explica con sus propias palabras ${short.toLowerCase()}.`,
    `Aplica los conceptos de ${short.toLowerCase()} en situaciones nuevas.`,
    `Analiza ejemplos de ${short.toLowerCase()} usando habilidades de ${ctx.split(',')[0].toLowerCase()}.`,
    `Evalúa la importancia de ${short.toLowerCase()} en el contexto del nivel.`,
  ];
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as {
      objectiveId?: string;
      objectiveCode?: string;
      objectiveText?: string;
      course?: string;
      subject?: string;
      skill?: string;
      force?: boolean;
    };

    const { objectiveId, objectiveCode, objectiveText, course, subject, skill, force } = body;

    if (!objectiveId && !objectiveCode && !objectiveText) {
      return Response.json({ error: 'objectiveId, objectiveCode u objectiveText es requerido' }, { status: 400 });
    }

    let objective: any = null;
    let persisted = false;

    if (objectiveId) {
      objective = await context.env.DB.prepare(
        'SELECT id, code, official_text FROM objectives WHERE id = ?'
      ).bind(objectiveId).first<any>();
    }

    if (!objective && objectiveCode) {
      objective = await context.env.DB.prepare(
        'SELECT id, code, official_text FROM objectives WHERE code = ?'
      ).bind(objectiveCode).first<any>();
    }

    if (!objective && objectiveCode) {
      const normalized = objectiveCode.replace(/\s+/g, ' ').trim().toUpperCase();
      objective = await context.env.DB.prepare(
        "SELECT id, code, official_text FROM objectives WHERE LOWER(REPLACE(code, ' ', '')) = LOWER(REPLACE(?, ' ', ''))"
      ).bind(normalized).first<any>();
    }

    if (objective) {
      persisted = true;
      const existing = await context.env.DB.prepare(
        'SELECT id, indicator_text, order_index, source_type, source_name FROM objective_indicators WHERE objective_id = ? ORDER BY order_index'
      ).bind(objective.id).all<any>();

      if (existing.results.length > 0 && !force) {
        return Response.json({
          data: existing.results.map((ind: any) => ({
            id: ind.id,
            text: ind.indicator_text,
            orderIndex: ind.order_index,
            sourceUrl: '',
            sourceType: ind.source_type || 'official',
            sourceName: ind.source_name || 'Currículum Nacional — MINEDUC Chile',
          })),
          source: 'existing',
          persisted: true,
        });
      }
    }

    const textForGeneration = objective?.official_text || objectiveText || objectiveCode || '';

    let indicators: string[] = [];

    if (context.env.GEMINI_API_KEY) {
      try {
        const prompt = `Eres una docente chilena experta en curriculo nacional y evaluacion educativa.

OA: ${objectiveCode || ''} — ${textForGeneration}
Curso: ${course || 'No especificado'}
Asignatura: ${subject || 'No especificada'}
Habilidad principal: ${skill || 'No especificada'}
Contexto disciplinar: ${getSubjectContext(subject)}

Genera 3 a 5 indicadores de evaluacion observables y pedagogicos derivados de este OA. Los indicadores deben:
- Ser concretos, medibles y alineados al texto real del OA
- Cubrir distintas habilidades cognitivas (identificar, explicar, aplicar, analizar, evaluar)
- Estar escritos en lenguaje claro para uso docente chileno
- No mencionar que son oficiales ni usar el nombre del OA como parte del indicador

Devuelve SOLO un array JSON valido de strings, sin markdown ni explicaciones.
Ejemplo: ["Indicador 1.", "Indicador 2.", "Indicador 3."]`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(context.env.GEMINI_API_KEY)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.45, maxOutputTokens: 1024 },
            }),
          }
        );

        const data = await response.json() as any;
        if (response.ok && data?.candidates?.[0]?.content?.parts) {
          const raw = data.candidates[0].content.parts.map((p: any) => p.text || '').join('');
          const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
          if (Array.isArray(parsed) && parsed.length >= 2) {
            indicators = parsed.slice(0, 5);
          }
        }
      } catch {
        // fall through to deterministic
      }
    }

    if (indicators.length < 2) {
      indicators = generateDeterministicIndicators(textForGeneration, subject);
    }

    if (indicators.length < 3) {
      indicators = indicators.concat([
        'Aplica los conceptos aprendidos en situaciones nuevas.',
        'Analiza ejemplos relacionados con el contenido del OA.',
      ]).slice(0, 5);
    }

    indicators = indicators.slice(0, 5);

    if (persisted && objective) {
      const insertStmts = indicators.map((text, i) =>
        context.env.DB.prepare(
          'INSERT INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          crypto.randomUUID(),
          objective.id,
          text,
          i + 1,
          '',
          'derived',
          'Indicador pedag\u00f3gico derivado',
        )
      );
      await context.env.DB.batch(insertStmts);
    }

    return Response.json({
      data: indicators.map((text, i) => ({
        id: '',
        text,
        orderIndex: i + 1,
        sourceUrl: '',
        sourceType: 'derived',
        sourceName: 'Indicador pedag\u00f3gico derivado',
      })),
      source: persisted ? 'generated' : 'generated_temporary',
      persisted,
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
