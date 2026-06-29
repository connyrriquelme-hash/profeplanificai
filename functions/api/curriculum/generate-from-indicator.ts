interface Env { DB: D1Database; GEMINI_API_KEY?: string; AI?: { run: (model: string, input: unknown) => Promise<any> } }

interface GenerateRequest {
  indicatorId?: string;
  indicator_id?: string;
  resourceType?: string;
  generate_types?: string[];
  duration?: string;
  difficulty?: string;
  oa_code?: string;
  indicator_text?: string;
  observable_action?: string;
  evidence_type?: string;
  evaluation_type?: string;
  subject?: string;
  grade?: string;
  level?: string;
}

const RESOURCE_TYPES = ['actividad', 'evaluacion', 'rubrica', 'guia', 'presentacion', 'imagen'] as const;

function parseJsonSafe(raw: string): any {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(cleaned); } catch { return null; }
}

function buildIndicatorPrompt(indicator: any, resourceType: string, duration: string, difficulty: string): string {
  const resourceLabels: Record<string, string> = {
    actividad: 'actividad de aula completa con inicio/desarrollo/cierre',
    evaluacion: 'evaluación formativa con preguntas y criterios de corrección',
    rubrica: 'rúbrica de evaluación con niveles de desempeño (Logrado/Proceso/Inicial)',
    guia: 'guía de aprendizaje para el estudiante con instrucciones y ejercicios',
    presentacion: 'guion de presentación o diapositivas para el tema',
    imagen: 'sugerencia de imagen educativa con descripción detallada',
  };

  const selectedTypes = resourceType === 'todos'
    ? Object.keys(resourceLabels)
    : [resourceType].filter(t => resourceLabels[t]);
  if (selectedTypes.length === 0) selectedTypes.push('actividad');

  const oaText = indicator.oa_text || indicator.official_text || '';
  const skillText = indicator.skill_text || indicator.official_text || '';

  return `Eres especialista en pedagogía y Currículum Nacional de Chile. Genera el siguiente recurso educativo basado en un indicador curricular real.

CONTEXTO CURRICULAR:
- Asignatura: ${indicator.subject || 'No especificada'}
- Nivel/Curso: ${indicator.grade || indicator.level || 'No especificado'}
- Código OA: ${indicator.oa_code || 'No especificado'}
- Texto OA: ${oaText || 'No disponible'}
- Indicador de evaluación: ${indicator.indicator_text || 'No especificado'}
- Acción observable: ${indicator.observable_action || 'No especificada'}
- Tipo de evidencia: ${indicator.evidence_type || 'No especificado'}
- Tipo de evaluación: ${indicator.evaluation_type || 'No especificado'}
- Habilidad: ${skillText || 'No especificada'}

RECURSOS A GENERAR: ${selectedTypes.map(t => resourceLabels[t]).join('; ')}.

INSTRUCCIONES OBLIGATORIAS:
1. El contenido debe ser aplicable en un aula chilena real.
2. Usa español chileno claro y profesional.
3. Incluye inicio/desarrollo/cierre en actividades y guías.
4. Alinea explícitamente al OA e indicador indicados.
5. Incluye materiales concretos y evaluación formativa.

FORMATO DE RESPUESTA: Devuelve SOLO JSON válido, sin markdown, sin bloques de código. Escapa comillas dobles y saltos de línea dentro de strings. Usa esta estructura EXACTA:
{
  "recursos": {
    "actividad": { "titulo": "...", "contenido": "...", "duracion_sugerida": "...", "materiales": ["..."] },
    "evaluacion": { "titulo": "...", "preguntas": [{"enunciado": "...", "alternativas": ["A", "B", "C", "D"], "respuesta": "A"}], "criterios_correccion": ["..."] },
    "rubrica": { "titulo": "...", "criterios": [{"nombre": "...", "niveles": [{"nivel": "Logrado", "puntaje": "4", "descripcion": "..."}, {"nivel": "Proceso", "puntaje": "2", "descripcion": "..."}, {"nivel": "Inicial", "puntaje": "1", "descripcion": "..."}]}] },
    "guia": { "titulo": "...", "secciones": [{"titulo": "...", "contenido": "..."}] },
    "presentacion": { "titulo": "...", "diapositivas": [{"titulo": "...", "contenido": "...", "notas": "..."}] },
    "imagen": { "titulo": "...", "descripcion": "...", "elementos_visuales": ["..."], "sugerencia_prompt": "..." }
  }
}`;
}

function mockResources(indicator: any, resourceType: string): Record<string, any> {
  const oa = indicator.oa_code || 'N/A';
  const text = indicator.indicator_text || 'Indicador curricular';
  const subj = indicator.subject || 'Asignatura';
  const grade = indicator.grade || indicator.level || 'Curso';
  const dur = '45 minutos';

  const base: Record<string, any> = {};

  if (resourceType === 'actividad' || resourceType === 'todos') {
    base.actividad = {
      titulo: `Actividad: ${text.substring(0, 60)}`,
      contenido: `ACTIVIDAD DE AULA — ${subj} / ${grade}\n\nObjetivo de aprendizaje (OA): ${oa}\nIndicador: ${text}\n\nINICIO (10 min):\n- Saludo y activación de conocimientos previos.\n- Presentación del propósito de la clase.\n\nDESARROLLO (25 min):\n- Modelaje docente alineado al indicador.\n- Práctica guiada con apoyo.\n- Trabajo autónomo o en parejas.\n\nCIERRE (10 min):\n- Síntesis de lo aprendido.\n- Autoevaluación breve.\n- Tarea opcional de refuerzo.`,
      duracion_sugerida: dur,
      materiales: ['Cuaderno de trabajo', 'Lápiz', 'Recursos visuales', 'Pizarra o proyector'],
    };
  }
  if (resourceType === 'evaluacion' || resourceType === 'todos') {
    base.evaluacion = {
      titulo: `Evaluación: ${oa} — ${text.substring(0, 50)}`,
      preguntas: [
        { enunciado: `Pregunta 1: Demuestra comprensión del siguiente concepto vinculado al indicador "${text.substring(0, 60)}".`, alternativas: ['Opción A (correcta)', 'Opción B', 'Opción C', 'Opción D'], respuesta: 'Opción A (correcta)' },
        { enunciado: 'Pregunta 2: Aplica el aprendizaje en una situación nueva.', alternativas: ['Opción A', 'Opción B (correcta)', 'Opción C', 'Opción D'], respuesta: 'Opción B (correcta)' },
      ],
      criterios_correccion: ['Comprensión del concepto', 'Aplicación correcta', 'Fundamentación con evidencia'],
    };
  }
  if (resourceType === 'rubrica' || resourceType === 'todos') {
    base.rubrica = {
      titulo: `Rúbrica: ${oa}`,
      criterios: [
        { nombre: 'Comprensión del OA', niveles: [
          { nivel: 'Logrado', puntaje: '4', descripcion: 'Demuestra comprensión completa y aplica el aprendizaje con autonomía.' },
          { nivel: 'Proceso', puntaje: '2', descripcion: 'Demuestra comprensión parcial con apoyo del docente.' },
          { nivel: 'Inicial', puntaje: '1', descripcion: 'Requiere apoyo significativo para comprender el OA.' },
        ]},
        { nombre: 'Uso de evidencia', niveles: [
          { nivel: 'Logrado', puntaje: '4', descripcion: 'Presenta evidencia clara y pertinente.' },
          { nivel: 'Proceso', puntaje: '2', descripcion: 'Presenta evidencia parcial.' },
          { nivel: 'Inicial', puntaje: '1', descripcion: 'No presenta evidencia suficiente.' },
        ]},
      ],
    };
  }
  if (resourceType === 'guia' || resourceType === 'todos') {
    base.guia = {
      titulo: `Guía: ${oa} — ${grade}`,
      secciones: [
        { titulo: '¿Qué aprenderé?', contenido: `En esta clase aprenderás a: ${text}` },
        { titulo: 'Instrucciones', contenido: 'Lee atentamente las indicaciones del docente. Realiza las actividades en orden. Pide ayuda si lo necesitas.' },
        { titulo: 'Actividad principal', contenido: `Realiza la siguiente actividad alineada al indicador: ${text}` },
        { titulo: '¿Cómo me evaluarán?', contenido: `Serás evaluado/a mediante: ${indicator.evidence_type || 'actividad práctica'}.` },
      ],
    };
  }
  if (resourceType === 'presentacion' || resourceType === 'todos') {
    base.presentacion = {
      titulo: `Presentación: ${oa}`,
      diapositivas: [
        { titulo: 'Portada', contenido: `${subj} — ${grade}\nOA: ${oa}\nIndicador: ${text}`, notas: 'Presentar el tema y objetivos.' },
        { titulo: 'Contenido', contenido: 'Desarrollo del contenido principal con ejemplos.', notas: 'Modelar con ejemplos concretos.' },
        { titulo: 'Actividad', contenido: 'Instrucciones para la actividad de aula.', notas: 'Explicar dinámica y materiales.' },
        { titulo: 'Cierre', contenido: 'Síntesis y reflexión.', notas: 'Preguntar: ¿Qué aprendimos hoy?' },
      ],
    };
  }
  if (resourceType === 'imagen' || resourceType === 'todos') {
    base.imagen = {
      titulo: `Imagen: ${oa}`,
      descripcion: `Ilustración educativa para ${subj} ${grade} que represente visualmente el concepto del indicador: ${text}`,
      elementos_visuales: ['Diagrama o esquema del concepto', 'Etiquetas en español', 'Colores contrastantes para legibilidad', 'Contexto chileno recognizable'],
      sugerencia_prompt: `Educational illustration for ${subj} class, showing ${text.substring(0, 100)}, clean design, Chilean school context, labeled diagram, high contrast colors`,
    };
  }
  return base;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as GenerateRequest;
    const indicatorId = body.indicatorId || body.indicator_id;
    const resourceType = body.resourceType || body.generate_types?.[0] || 'actividad';
    const duration = body.duration || '45 minutos';
    const difficulty = body.difficulty || 'medio';

    let indicator: any = {};

    if (indicatorId) {
      const row = await context.env.DB.prepare(`
        SELECT ci.*, o.official_text as oa_text, o.code as objective_code,
          s.official_text as skill_text, s.code as skill_code
        FROM curriculum_indicators ci
        LEFT JOIN objectives o ON o.id = ci.objective_id
        LEFT JOIN skills s ON s.id = ci.skill_id
        WHERE ci.id = ?
      `).bind(indicatorId).first<any>();
      if (!row) return Response.json({ error: 'Indicador no encontrado' }, { status: 404 });
      indicator = row;
    } else if (body.oa_code && body.indicator_text) {
      indicator = {
        subject: body.subject || '', grade: body.grade || body.level || '',
        level: body.level || '', oa_code: body.oa_code,
        indicator_text: body.indicator_text, observable_action: body.observable_action || '',
        evidence_type: body.evidence_type || '', evaluation_type: body.evaluation_type || '',
      };
    } else {
      return Response.json({ error: 'Se requiere indicatorId o (oa_code + indicator_text)' }, { status: 400 });
    }

    const warningMsg = indicator.status === 'pendiente_revision'
      ? 'Este indicador requiere revisión curricular antes de usarse como fuente definitiva.'
      : undefined;

    const prompt = buildIndicatorPrompt(indicator, resourceType, duration, difficulty);

    // Try Gemini
    if (context.env.GEMINI_API_KEY) {
      const model = 'gemini-2.5-flash';
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(context.env.GEMINI_API_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, responseMimeType: 'application/json', maxOutputTokens: 8000 },
        }),
      });
      const data = await response.json() as any;
      if (!response.ok) {
        return Response.json({ error: data?.error?.message || `Gemini error ${response.status}` }, { status: 502 });
      }
      const raw = (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
      const parsed = parseJsonSafe(raw);
      if (parsed?.recursos) {
        return Response.json({ ok: true, provider: 'gemini', model, recursos: parsed.recursos, warning: warningMsg });
      }
      return Response.json({ ok: true, provider: 'gemini', model, raw_text: raw, warning: warningMsg });
    }

    // Try Workers AI
    if (context.env.AI) {
      try {
        const model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
        const data = await context.env.AI.run(model, { prompt, response_format: { type: 'json_object' }, max_tokens: 8000 });
        const raw = String(data?.response || data);
        const parsed = parseJsonSafe(raw);
        if (parsed?.recursos) {
          return Response.json({ ok: true, provider: 'workers-ai', model, recursos: parsed.recursos, warning: warningMsg });
        }
      } catch { /* fall through to mock */ }
    }

    // Mock fallback
    return Response.json({
      ok: true, provider: 'mock', model: 'deterministic-local',
      recursos: mockResources(indicator, resourceType),
      warning: warningMsg || 'Resultado mock. Configura GEMINI_API_KEY o Workers AI para contenido enriquecido.',
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
