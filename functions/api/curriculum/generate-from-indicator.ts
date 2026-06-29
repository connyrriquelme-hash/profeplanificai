interface Env { DB: D1Database; GEMINI_API_KEY?: string }

interface GenerateRequest {
  indicator_id?: string;
  oa_code?: string;
  indicator_text?: string;
  observable_action?: string;
  evidence_type?: string;
  evaluation_type?: string;
  subject?: string;
  grade?: string;
  level?: string;
  generate_types?: string[];
}

function buildPrompt(indicator: any, types: string[]): string {
  const typeDescriptions: Record<string, string> = {
    actividad: 'actividad de aula completa con inicio/desarrollo/cierre',
    evaluacion: 'evaluación con preguntas y criterios de corrección',
    rubrica: 'rúbrica de evaluación con niveles de desempeño',
    presentacion: 'guion de presentación o diapositivas para el tema',
    guia: 'guía de aprendizaje para el estudiante con instrucciones y ejercicios',
    imagen: 'sugerencia de imagen educativa con descripción detallada',
  };

  const selectedTypes = types.filter(t => typeDescriptions[t]);
  if (selectedTypes.length === 0) selectedTypes.push('actividad', 'evaluacion');

  return `Eres especialista en pedagogía y Currículum Nacional de Chile. Genera recursos educativos basados en el siguiente indicador curricular.

Asignatura: ${indicator.subject || 'No especificada'}
Curso/Nivel: ${indicator.grade || indicator.level || 'No especificado'}
Código OA: ${indicator.oa_code || 'No especificado'}
Indicador: ${indicator.indicator_text || 'No especificado'}
Acción observable: ${indicator.observable_action || 'No especificada'}
Tipo de evidencia: ${indicator.evidence_type || 'No especificado'}
Tipo de evaluación: ${indicator.evaluation_type || 'No especificado'}
Habilidad: ${indicator.skill || 'No especificada'}

Genera los siguientes recursos: ${selectedTypes.map(t => typeDescriptions[t]).join('; ')}.

Para cada recurso, incluye:
- Título descriptivo
- Contenido completo y aplicable en aula chilena
- Alineación explícita al OA e indicador
- Español chileno claro y profesional

Devuelve SOLO JSON válido, sin markdown, escapando comillas dobles. Usa esta estructura:
{
  "recursos": {
    "actividad": { "titulo": "...", "contenido": "...", "duracion_sugerida": "...", "materiales": [] },
    "evaluacion": { "titulo": "...", "preguntas": [{"enunciado":"","alternativas":[],"respuesta":""}], "criterios_correccion": [] },
    "rubrica": { "titulo": "...", "criterios": [{"nombre":"","niveles":[{"nivel":"","puntaje":"","descripcion":""}]}] },
    "presentacion": { "titulo": "...", "diapositivas": [{"titulo":"","contenido":"","notas":""}] },
    "guia": { "titulo": "...", "secciones": [{"titulo":"","contenido":""}] },
    "imagen": { "titulo": "...", "descripcion": "...", "elementos_visuales": [], "sugerencia_prompt": "" }
  }
}`;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as GenerateRequest;
    const types = body.generate_types || ['actividad', 'evaluacion'];

    let indicator: any = {};

    // If indicator_id provided, fetch from D1
    if (body.indicator_id) {
      const row = await context.env.DB.prepare(`
        SELECT ci.*, o.official_text as oa_text
        FROM curriculum_indicators ci
        LEFT JOIN objectives o ON o.id = ci.objective_id
        WHERE ci.id = ?
      `).bind(body.indicator_id).first<any>();

      if (!row) {
        return Response.json({ error: 'Indicador no encontrado' }, { status: 404 });
      }
      indicator = row;

      // Warn if indicator needs review
      if (row.status === 'pendiente_revision') {
        indicator._warning = 'Este indicador requiere revisión curricular antes de usarse como fuente definitiva.';
      }
    } else if (body.oa_code && body.indicator_text) {
      // Use provided data directly
      indicator = {
        subject: body.subject || '',
        grade: body.grade || body.level || '',
        level: body.level || '',
        oa_code: body.oa_code,
        indicator_text: body.indicator_text,
        observable_action: body.observable_action || '',
        evidence_type: body.evidence_type || '',
        evaluation_type: body.evaluation_type || '',
      };
    } else {
      return Response.json({ error: 'Se requiere indicator_id o (oa_code + indicator_text)' }, { status: 400 });
    }

    const prompt = buildPrompt(indicator, types);
    const warningMsg = indicator._warning || undefined;

    // Try Gemini first
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
      try {
        const parsed = JSON.parse(raw);
        return Response.json({ ok: true, provider: 'gemini', model, recursos: parsed.recursos || parsed, prompt, warning: warningMsg });
      } catch {
        return Response.json({ ok: true, provider: 'gemini', model, raw_text: raw, prompt, warning: warningMsg });
      }
    }

    // Fallback: return structured mock
    return Response.json({
      ok: true,
      provider: 'mock',
      model: 'deterministic-local',
      recursos: {
        actividad: {
          titulo: `Actividad: ${indicator.indicator_text?.substring(0, 80) || 'Indicador curricular'}`,
          contenido: `Actividad de aula basada en el indicador: ${indicator.indicator_text || 'N/A'}.\n\nObjetivo: ${indicator.oa_code || 'N/A'}\nTipo de evidencia: ${indicator.evidence_type || 'escrita'}\n\nDesarrollo:\n- Inicio (10 min): Presentación del tema y activación de conocimientos previos.\n- Desarrollo (25 min): Actividad principal alineada al indicador.\n- Cierre (10 min): Reflexión y retroalimentación.`,
          duracion_sugerida: '45 minutos',
          materiales: ['Cuaderno', 'Lápiz', 'Recursos visuales'],
        },
        evaluacion: {
          titulo: `Evaluación: ${indicator.oa_code || 'Indicador'}`,
          preguntas: [{ enunciado: `Pregunta basada en: ${indicator.indicator_text || 'N/A'}`, alternativas: ['Opción A', 'Opción B', 'Opción C', 'Opción D'], respuesta: 'Opción A' }],
          criterios_correccion: ['Comprensión del concepto', 'Aplicación correcta', 'Fundamentación'],
        },
      },
      prompt,
      warning: warningMsg || 'Resultado mock. Configura GEMINI_API_KEY para contenido enriquecido.',
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
