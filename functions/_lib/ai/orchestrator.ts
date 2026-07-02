import type { AIEnv, AIRequest, AIResponse, ProviderName } from './types';
import { buildPrompt } from './prompts';
import { callProvider, statusProviders } from './providers';
import { sanitizeOutput, scanContent, scanForSecrets } from './safety';
import { checkRateLimit, sanitizeForPrompt, validateInputSize } from './limits';
import { enrichAIRequestWithPedagogicalContext } from './context';

function localFallback(agentType: string, taskType: string, req: AIRequest): { content: string; structured: Record<string, unknown> } {
  const course = req.course || 'el curso';
  const subject = req.subject || 'la asignatura';
  const oa = req.oaCode ? `${req.oaCode}: ${req.oaText || ''}` : 'OA pendiente — el docente debe seleccionar un OA del Curriculo Nacional.';

  const base = `Actividad pedagogica para ${course} — ${subject}.
OA: ${oa}
Generado por fallback local pedagogico. Para contenido enriquecido, configura una API key de IA (Gemini, Workers AI, OpenRouter o HuggingFace).`;

  if (agentType === 'actividades_clase' && taskType === 'generar') {
    return {
      content: base,
      structured: {
        objetivoEspecifico: `Que los estudiantes demuestren comprension de los aprendizajes propios de ${course} en ${subject}.`,
        proposito: `Fortalecer competencias de ${subject} en el contexto de ${course}.`,
        inicio: `Momento de activacion (10-15 min): Pregunta motivadora que conecte con conocimientos previos de los estudiantes sobre ${subject}.`,
        desarrollo: `Momento de construccion (25-35 min): Actividad principal con instrucciones paso a paso. Trabajo colaborativo con intercambio de ideas.`,
        cierre: `Momento de cierre (10-15 min): Reflexion y metacognicion. Que aprendi y como puedo aplicarlo.`,
        evaluacionFormativa: 'Observacion directa, productos escritos, retroalimentacion entre pares.',
        ticketSalida: '1. Que aprendi hoy?\n2. En que situacion puedo aplicar lo aprendido?\n3. Que me falta por aprender o practicar?',
        recursosMateriales: ['Cuaderno o ficha de trabajo', 'Materiales visuales', 'Pizarron'],
        adecuacionesDUA: 'Representacion en multiples formatos. Diversas formas de demostrar aprendizaje. Conexion con intereses.',
        apoyoEstudiantesDescendidos: 'Grupos heterogeneos, instrucciones paso a paso, ejemplos concretos, tiempo adicional.',
        extensionAvanzados: 'Problemas de mayor complejidad, proyectos breves, rol de tutores.',
      },
    };
  }

  if (agentType === 'evaluador') {
    const evalType = req.instructions?.includes('SIMCE') ? 'SIMCE' : 'formativa';
    return {
      content: base,
      structured: {
        titulo: `Evaluacion ${evalType} — ${course} / ${subject}`,
        tipoEvaluacion: evalType.toLowerCase(),
        curso: course,
        asignatura: subject,
        proposito: `Evaluar los aprendizajes de ${subject} en ${course}.`,
        instruccionesEstudiantes: 'Lee cada pregunta con atencion. Responde segun lo solicitado.',
        preguntas: [
          { numero: 1, tipo: 'abierta', enunciado: 'Explica con tus palabras la idea central del tema trabajado.', alternativas: [], respuestaCorrecta: '', respuestaEsperada: 'Respuesta alineada al OA y a los indicadores seleccionados.', habilidadEvaluada: 'Comprension', indicadorEvaluado: '', puntaje: 4, retroalimentacion: 'Se valora la claridad y uso de vocabulario propio.' },
          { numero: 2, tipo: 'aplicacion', enunciado: 'Resuelve o crea un ejemplo conectado al contexto chileno de la clase.', alternativas: [], respuestaCorrecta: '', respuestaEsperada: 'Ejemplo contextualizado y correcto.', habilidadEvaluada: 'Aplicacion', indicadorEvaluado: '', puntaje: 4, retroalimentacion: 'Se evalua la conexion con la realidad y correcta aplicacion.' },
          { numero: 3, tipo: 'metacognicion', enunciado: 'Que estrategia te ayudo mas y por que?', alternativas: [], respuestaCorrecta: '', respuestaEsperada: 'Reflexion personal sobre su proceso de aprendizaje.', habilidadEvaluada: 'Metacognicion', indicadorEvaluado: '', puntaje: 2, retroalimentacion: 'Toda respuesta reflexiva es valida.' },
        ],
        pautaCorreccion: 'Respuesta esperada alineada al texto oficial del OA y a indicadores seleccionados.',
        nivelesLogro: ['Logrado', 'En desarrollo', 'Por reforzar'],
        tablaEspecificaciones: [],
        adecuacionesDUA: 'Permitir respuesta oral, escrita o grafica. Entregar pautas visuales. Tiempo adicional si se requiere.',
        reforzamientoSugerido: 'Repasar conceptos clave. Practicar con ejercicios similares.',
      },
    };
  }

  if (agentType === 'simce') {
    return {
      content: base,
      structured: {
        titulo: `Item SIMCE — ${course} / ${subject}`,
        tipoItem: 'seleccion_multiple',
        enunciado: 'Enunciado del item alineado al OA. Complejidad media.',
        alternativas: [
          { texto: 'Alternativa A (correcta)', esCorrecta: true },
          { texto: 'Alternativa B (distractor plausible)', esCorrecta: false },
          { texto: 'Alternativa C (distractor plausible)', esCorrecta: false },
          { texto: 'Alternativa D (distractor plausible)', esCorrecta: false },
        ],
        nivelComplejidad: 'medio',
        OA: req.oaCode || 'OA pendiente',
        justificacion: 'La alternativa A es correcta porque... Las demas son distractores basados en errores comunes.',
        tiempoEstimado: '3-5 min',
      },
    };
  }

  if (agentType === 'rubrica') {
    return {
      content: base,
      structured: {
        titulo: `Rubrica — ${course} / ${subject}`,
        descripcion: 'Rubrica de evaluacion alineada al curriculo.',
        criterios: [
          { nombre: 'Comprension del OA', ponderacion: 40, niveles: [
            { nivel: 'Logrado', puntaje: 4, descripcion: 'Demuestra comprension profunda y precisa.' },
            { nivel: 'En desarrollo', puntaje: 3, descripcion: 'Comprension parcial con algunos errores.' },
            { nivel: 'Por reforzar', puntaje: 2, descripcion: 'Comprension basica, errores significativos.' },
            { nivel: 'No logrado', puntaje: 1, descripcion: 'No demuestra comprension del tema.' },
          ]},
          { nombre: 'Uso de evidencia', ponderacion: 30, niveles: [
            { nivel: 'Logrado', puntaje: 4, descripcion: 'Evidencia clara, pertinente y bien explicada.' },
            { nivel: 'En desarrollo', puntaje: 3, descripcion: 'Evidencia parcialmente clara.' },
            { nivel: 'Por reforzar', puntaje: 2, descripcion: 'Evidencia insuficiente o poco clara.' },
            { nivel: 'No logrado', puntaje: 1, descripcion: 'No presenta evidencia.' },
          ]},
          { nombre: 'Comunicacion', ponderacion: 30, niveles: [
            { nivel: 'Logrado', puntaje: 4, descripcion: 'Expresion clara, vocabulario adecuado.' },
            { nivel: 'En desarrollo', puntaje: 3, descripcion: 'Expresion mayormente clara.' },
            { nivel: 'Por reforzar', puntaje: 2, descripcion: 'Expresion confusa o limitada.' },
            { nivel: 'No logrado', puntaje: 1, descripcion: 'No se entiende la respuesta.' },
          ]},
        ],
      },
    };
  }

  if (agentType === 'retroalimentacion') {
    return {
      content: base,
      structured: {
        fortalezas: ['Participacion activa', 'Comprension de conceptos clave'],
        sugerencias: ['Profundizar en la argumentacion', 'Conectar mas con experiencias personales'],
        proximoPaso: 'Trabajar en la estructuracion de respuestas escritas.',
        reflexionDocente: 'El grupo avanza bien. Considerar actividades de extension para los mas rapidos.',
      },
    };
  }

  return {
    content: base,
    structured: { message: 'Contenido generado por fallback local. Configura una API key para resultados enriquecidos.' },
  };
}

export function parseAIJsonSafely(raw: string): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'string') return null;

  let candidate = raw.trim();

  const mdMatch = candidate.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (mdMatch?.[1]) {
    candidate = mdMatch[1].trim();
  }

  const jsonStart = candidate.indexOf('{');
  const jsonEnd = candidate.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    candidate = candidate.substring(jsonStart, jsonEnd + 1);
  }

  try {
    const parsed = JSON.parse(candidate);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch { /* try repair */ }

  try {
    let repaired = candidate;
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';

    const lastComma = repaired.lastIndexOf(',');
    if (lastComma === repaired.length - 2) {
      repaired = repaired.substring(0, lastComma) + repaired.substring(lastComma + 1);
    }

    const parsed = JSON.parse(repaired);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch { /* unrepairable */ }

  return null;
}

function parseResponse(raw: string): { content: string; structured: Record<string, unknown> } {
  const parsed = parseAIJsonSafely(raw);
  if (parsed) return { content: raw, structured: parsed };
  return { content: raw, structured: {} };
}

export async function orchestrate(env: AIEnv, req: AIRequest, teacherId: string): Promise<AIResponse> {
  const start = Date.now();
  const warnings: string[] = [];

  const rateCheck = checkRateLimit(teacherId);
  if (!rateCheck.allowed) {
    return {
      ok: false, provider: 'local', model: '', agentType: req.agentType, taskType: req.taskType,
      content: '', structured: {}, warnings: [`Rate limit excedido. Intenta en ${Math.ceil((rateCheck.retryAfterMs || 60000) / 1000)} segundos.`],
      usedFallback: false, durationMs: Date.now() - start,
    };
  }

  const inputText = [req.course, req.subject, req.grade, req.oa, req.instructions, req.existingContent].filter(Boolean).join(' ');
  const inputCheck = validateInputSize(inputText);
  if (!inputCheck.valid) {
    return {
      ok: false, provider: 'local', model: '', agentType: req.agentType, taskType: req.taskType,
      content: '', structured: {}, warnings: [inputCheck.error!],
      usedFallback: false, durationMs: Date.now() - start,
    };
  }

  const secretCheck = scanForSecrets(inputText);
  if (!secretCheck.safe) {
    return {
      ok: false, provider: 'local', model: '', agentType: req.agentType, taskType: req.taskType,
      content: '', structured: {}, warnings: [secretCheck.reason!],
      usedFallback: false, durationMs: Date.now() - start,
    };
  }

  const safeReq: AIRequest = {
    ...req,
    course: sanitizeForPrompt(req.course),
    subject: sanitizeForPrompt(req.subject),
    grade: sanitizeForPrompt(req.grade),
    oa: sanitizeForPrompt(req.oa),
    instructions: sanitizeForPrompt(req.instructions),
  };

  let contextualReq = safeReq;
  try {
    contextualReq = await enrichAIRequestWithPedagogicalContext(env, safeReq);
    if (contextualReq.pedagogicalContext) warnings.push('Contexto D1/Vectorize agregado al prompt.');
  } catch (e) {
    warnings.push(`No se pudo enriquecer con D1/Vectorize: ${e instanceof Error ? e.message : 'desconocido'}`);
  }

  const prompt = buildPrompt(req.agentType, req.taskType, contextualReq);
  const { providers, recommended } = await statusProviders(env);
  const providerOrder: ProviderName[] = ['gemini', 'workers-ai', 'openrouter', 'huggingface'];

  for (const provider of providerOrder) {
    if (!providers[provider].available) continue;

    try {
      const result = await callProvider(provider, env, prompt);
      if (result.ok && result.content) {
        const contentCheck = scanContent(result.content);
        if (contentCheck.reason) warnings.push(contentCheck.reason);

        const sanitized = sanitizeOutput(result.content);
        const { content, structured } = parseResponse(sanitized);

        return {
          ok: true, provider, model: result.model, agentType: req.agentType, taskType: req.taskType,
          content, structured: structured || result.structured || {}, warnings,
          usedFallback: false, durationMs: Date.now() - start,
        };
      }
    } catch (e) {
      warnings.push(`Error con ${provider}: ${e instanceof Error ? e.message : 'desconocido'}`);
    }
  }

  const fallback = localFallback(req.agentType, req.taskType, safeReq);
  return {
    ok: true, provider: 'local', model: 'fallback-pedagogico', agentType: req.agentType, taskType: req.taskType,
    content: fallback.content, structured: fallback.structured,
    warnings: [...warnings, 'Todos los proveedores IA fallaron o no estan configurados. Se uso fallback local.'],
    usedFallback: true, durationMs: Date.now() - start,
  };
}
