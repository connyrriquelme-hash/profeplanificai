interface Env {
  DB: D1Database;
  AI: Ai;
  REPO_PEDAGOGICO: VectorizeIndex;
}

type ObjetivoD1 = {
  id: string;
  code?: string;
  official_text?: string;
  normalized_text?: string;
  description?: string;
};

type PlanificarBody = {
  curso?: string;
  asignatura?: string;
  objetivo_id?: string;
  necesidad_aula?: string;
};

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json<PlanificarBody>();

    const curso = body.curso?.trim();
    const asignatura = body.asignatura?.trim();
    const objetivoId = body.objetivo_id?.trim();
    const necesidadAula = body.necesidad_aula?.trim();

    if (!curso || !asignatura || !objetivoId || !necesidadAula) {
      return Response.json(
        { ok: false, error: 'Faltan campos obligatorios: curso, asignatura, objetivo_id y necesidad_aula.' },
        { status: 400 },
      );
    }

    const objetivo = await context.env.DB.prepare(
      `SELECT id, code, official_text, normalized_text, description
       FROM objectives
       WHERE id = ? OR code = ?
       LIMIT 1`,
    )
      .bind(objetivoId, objetivoId)
      .first<ObjetivoD1>();

    if (!objetivo) {
      return Response.json(
        { ok: false, error: 'No se encontró el objetivo de aprendizaje solicitado.', objetivo_id: objetivoId },
        { status: 404 },
      );
    }

    const textoObjetivo = objetivo.official_text || objetivo.normalized_text || objetivo.description || objetivo.code || objetivo.id;

    const embeddingResponse = await context.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [necesidadAula],
    });

    const embedding = embeddingResponse?.data?.[0];

    if (!Array.isArray(embedding) || embedding.length === 0) {
      return Response.json(
        { ok: false, error: 'No se pudo generar un embedding válido para la necesidad de aula.' },
        { status: 500 },
      );
    }

    const vectorResults = await context.env.REPO_PEDAGOGICO.query(embedding, {
      topK: 3,
      returnMetadata: true,
    });

    const documentos = (vectorResults.matches || []).map((match) => ({
      id: match.id,
      score: match.score,
      titulo: String(match.metadata?.titulo || 'Documento sin título'),
      autor: String(match.metadata?.autor || 'Autor no informado'),
      metadata: match.metadata || {},
    }));

    const contextoVectorial = documentos.length > 0
      ? documentos
          .map((documento, index) => {
            return `Documento ${index + 1}
Título: ${documento.titulo}
Autor: ${documento.autor}
Score: ${documento.score}
Metadata: ${JSON.stringify(documento.metadata)}`;
          })
          .join('\n\n')
      : 'No se encontraron documentos pedagógicos similares en el repositorio vectorial.';

    const systemPrompt = `Eres el motor central de ProfePlanifica.cl, un asistente pedagógico de élite diseñado estrictamente para el contexto sociocultural y educativo de Chile.
Tienes un perfil profesional multidisciplinario: eres experto en pedagogía, educación diferencial, psicología educacional, antropología sociocultural y trabajo social escolar.

TUS REGLAS DE OPERACIÓN:
1. Conexión MINEDUC: Basas toda tu estructura en el currículum nacional chileno y las orientaciones del Ministerio de Educación.
2. Enfoque DUA y PIE: Aplicas siempre los principios del Diseño Universal de Aprendizaje (DUA) y consideras los lineamientos del Programa de Integración Escolar (PIE).
3. Mirada Sistémica (Trabajo Social y Psicología): Consideras a la familia, la comunidad y el bienestar socioemocional del estudiante como pilares del aprendizaje. Usa terminología chilena (apoderados, sostenedor, convivencia escolar, UTP, orientador).
4. Antropología del Aula: Reconoces la diversidad cultural, territorial y socioeconómica de Chile al proponer actividades.

CONTEXTO OBLIGATORIO PARA ESTA CLASE:
- Objetivo de Aprendizaje (MINEDUC): ${textoObjetivo}
- Políticas, marcos teóricos y orientaciones recuperadas: ${contextoVectorial}

INSTRUCCIÓN: Construye una planificación detallada (Inicio, Desarrollo, Cierre, y Adaptaciones Diferenciales) que aborde la siguiente necesidad específica del profesor: ${necesidadAula}. Responde exclusivamente en formato JSON estructurado.`;

    const userPrompt = `Curso: ${curso}
Asignatura: ${asignatura}
Objetivo ID: ${objetivoId}
Necesidad de aula: ${necesidadAula}`;

    const aiResponse = await context.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const responseText = aiResponse?.response;

    if (typeof responseText !== 'string' || !responseText.trim()) {
      return Response.json(
        { ok: false, error: 'El modelo no devolvió una respuesta válida.' },
        { status: 500 },
      );
    }

    let planificacion: unknown = responseText;

    try {
      planificacion = JSON.parse(responseText);
    } catch {
      planificacion = { respuesta: responseText };
    }

    return Response.json({
      ok: true,
      curso,
      asignatura,
      objetivo_id: objetivoId,
      objetivo: {
        id: objetivo.id,
        codigo: objetivo.code,
        texto: textoObjetivo,
      },
      documentos_usados: documentos,
      planificacion,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: 'No se pudo generar la planificación RAG.',
        detalle: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export function onRequestGet(): Response {
  return Response.json(
    { ok: false, error: 'Método no permitido. Usa POST con JSON.' },
    { status: 405 },
  );
}
