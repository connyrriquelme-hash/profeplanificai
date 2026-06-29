interface Env { GEMINI_API_KEY?: string; AI?: { run: (model: string, input: unknown) => Promise<any> } }

interface FeedbackRequest {
  studentName: string;
  course: string;
  subject: string;
  evaluationName: string;
  score: number;
  maxScore: number;
  achievementPercent: number;
  grade: number;
  achievementLevel: string;
  objectives: string[];
  achievedIndicators: string[];
  needsSupportIndicators: string[];
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

function buildFeedbackPrompt(req: FeedbackRequest): string {
  const objectivesText = req.objectives.length > 0 ? req.objectives.join('\n- ') : 'No especificados';
  const achievedText = req.achievedIndicators.length > 0 ? req.achievedIndicators.join('\n- ') : 'Ninguno identificado';
  const needsText = req.needsSupportIndicators.length > 0 ? req.needsSupportIndicators.join('\n- ') : 'Ninguno identificado';

  return `Eres un docente chileno que escribe informes de aprendizaje para apoderados. Genera una retroalimentación clara, profesional, positiva y comprensible.

DATOS DEL ESTUDIANTE:
- Nombre: ${req.studentName}
- Curso: ${req.course}
- Asignatura: ${req.subject}
- Evaluación: ${req.evaluationName}
- Puntaje: ${req.score}/${req.maxScore}
- Porcentaje de logro: ${req.achievementPercent}%
- Nota: ${req.grade}
- Nivel de logro: ${req.achievementLevel}

OBJETIVOS EVALUADOS:
- ${objectivesText}

INDICADORES LOGRADOS:
- ${achievedText}

INDICADORES POR REFORZAR:
- ${needsText}

REGLAS DE REDACCIÓN:
1. Máximo 120 palabras.
2. Tono chileno profesional, cercano y formativo.
3. Mencionar fortalezas del estudiante.
4. Mencionar qué debe reforzar (sin etiquetar negativamente).
5. Entregar sugerencias concretas para el hogar (máximo 3).
6. No diagnosticar, no comparar con otros, no culpar a la familia.
7. No usar lenguaje clínico ni inventar datos.
8. Evitar tecnicismos excesivos.

Devuelve SOLO JSON válido, sin markdown:
{
  "parentFeedback": "...",
  "strengths": ["..."],
  "needsSupport": ["..."],
  "familySuggestions": ["..."],
  "shortTeacherNote": "..."
}`;
}

function mockFeedback(req: FeedbackRequest): any {
  const level = req.achievementLevel.toLowerCase();
  let feedback = '';
  let suggestions: string[] = [];

  if (level.includes('adecuado')) {
    feedback = `${req.studentName} presenta un desempeño adecuado en la evaluación de ${req.subject}, demostrando comprensión de los aprendizajes trabajados. Se recomienda mantener una práctica constante en el hogar, reforzando la lectura, la comprensión y la expresión oral mediante preguntas simples sobre lo leído.`;
    suggestions = ['Leer diariamente 10 minutos en voz alta.', 'Hacer preguntas sobre lo leído para reforzar comprensión.', 'Felicitizar los avances y mantener la rutina de estudio.'];
  } else if (level.includes('elemental')) {
    feedback = `${req.studentName} se encuentra en proceso de consolidar los aprendizajes evaluados en ${req.subject}. Se sugiere reforzar en el hogar los indicadores que requieren apoyo mediante lectura acompañada, práctica breve y revisión de instrucciones paso a paso.`;
    suggestions = ['Leer juntos 10 minutos al día, señalando palabras clave.', 'Practicar los contenidos evaluados con ejercicios breves.', 'Mantener comunicación con el docente para seguimiento.'];
  } else if (level.includes('insuficiente')) {
    feedback = `${req.studentName} requiere apoyo sistemático para avanzar en los aprendizajes evaluados de ${req.subject}. Se recomienda acompañar el estudio con actividades breves, lectura guiada, preguntas de comprensión y refuerzo positivo frente a cada avance.`;
    suggestions = ['Establecer una rutina de estudio de 15 minutos diarios.', 'Usar material visual y concreto para reforzar conceptos.', 'Comunicarse con el docente para estrategias de apoyo.'];
  } else {
    feedback = `No se cuenta con información suficiente para emitir una retroalimentación definitiva sobre el desempeño de ${req.studentName}. Se sugiere realizar una nueva instancia de evaluación o seguimiento para recoger evidencia del aprendizaje.`;
    suggestions = ['Solicitar una reunión con el docente para conversar sobre el progreso.', 'Observar las tareas y actividades del estudiante en el hogar.'];
  }

  const strengths = req.achievedIndicators.length > 0 ? req.achievedIndicators.slice(0, 3) : ['Participación en clase'];
  const needs = req.needsSupportIndicators.length > 0 ? req.needsSupportIndicators.slice(0, 3) : ['Reforzar práctica'];

  return {
    parentFeedback: feedback,
    strengths,
    needsSupport: needs,
    familySuggestions: suggestions,
    shortTeacherNote: `${req.studentName}: nivel ${req.achievementLevel} (${req.achievementPercent}%).`,
  };
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as FeedbackRequest;

    if (!body.studentName || !body.course || !body.subject) {
      return Response.json({ error: 'Faltan campos obligatorios: studentName, course, subject' }, { status: 400 });
    }

    const prompt = buildFeedbackPrompt(body);

    // Try Gemini
    if (context.env.GEMINI_API_KEY) {
      try {
        const model = 'gemini-2.5-flash';
        const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(context.env.GEMINI_API_KEY)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, responseMimeType: 'application/json', maxOutputTokens: 2000 },
          }),
        }, 15000);
        const data = await response.json() as any;
        if (response.ok) {
          const raw = (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
          const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
          try {
            const parsed = JSON.parse(cleaned);
            return Response.json({ ok: true, provider: 'gemini', ...parsed });
          } catch { /* fall through to mock */ }
        }
      } catch { /* fall through to mock */ }
    }

    // Try Workers AI
    if (context.env.AI) {
      try {
        const model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
        const data = await context.env.AI.run(model, { prompt, response_format: { type: 'json_object' }, max_tokens: 2000 });
        const raw = String(data?.response || data);
        const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        const parsed = JSON.parse(cleaned);
        return Response.json({ ok: true, provider: 'workers-ai', ...parsed });
      } catch { /* fall through to mock */ }
    }

    // Mock fallback
    const mock = mockFeedback(body);
    return Response.json({
      ok: true, provider: 'mock',
      ...mock,
      warning: 'Resultado local. Configura GEMINI_API_KEY o Workers AI para contenido enriquecido.',
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
