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
  const indicators = req.indicators?.length ? req.indicators.slice(0, 3).join('; ') : 'No especificados';
  const skills = req.skills?.length ? req.skills.slice(0, 3).join('; ') : 'No especificadas';
  const hasOA = Boolean(req.oaCode);

  const base = `Actividad pedagogica para ${course} — ${subject}.
OA: ${oa}
Indicadores: ${indicators}
Habilidades: ${skills}
Generado por fallback local pedagogico. Para contenido enriquecido, configura una API key de IA (Gemini, Workers AI, OpenRouter o HuggingFace).`;

  if (agentType === 'actividades_clase' && taskType === 'generar') {
    return {
      content: base,
      structured: {
        objetivoEspecifico: hasOA
          ? `Que los estudiantes demuestren comprension y aplicacion del ${req.oaCode}: ${req.oaText || ''}. Los indicadores a desarrollar incluyen: ${indicators}.`
          : `Que los estudiantes demuestren comprension de los aprendizajes propios de ${course} en ${subject}.`,
        proposito: hasOA
          ? `Fortalecer las competencias asociadas al ${req.oaCode} mediante actividades significativas que conecten con la realidad de los estudiantes.`
          : `Fortalecer competencias de ${subject} en el contexto de ${course}.`,
        inicio: hasOA
          ? `Momento de activacion (10-15 min): Activar conocimientos previos con una situacion concreta del ${req.oaCode}. El docente presenta un ejemplo o texto que ilustre el tipo de produccion esperada. Pregunta desafiante: "Como podemos aplicar lo aprendido en una situacion real?". Conectar con el contexto chileno cotidiano.`
          : `Momento de activacion (10-15 min): Pregunta motivadora que conecte con conocimientos previos de los estudiantes sobre ${subject}.`,
        desarrollo: hasOA
          ? `Momento de construccion (55-65 min):\n1. Modelamiento docente (15 min): El docente modela en la pizarra la tarea principal, mostrando cada paso concreto. Revisa con el curso que elementos son necesarios.\n2. Practica guiada (15 min): Los estudiantes practican en parejas con apoyo del docente. Fichas con vocabulario clave y organizadores graficos.\n3. Trabajo individual (20 min): Cada estudiante produce su propio resultado aplicando lo modelado. Andamiajes DUA: ejemplo resuelto, vocabulario resaltado, estructura guia.\n4. Revision entre pares (5-10 min): Intercambian productos y evaluan usando criterios simples.`
          : `Momento de construccion (25-35 min): Actividad principal con instrucciones paso a paso. Trabajo colaborativo con intercambio de ideas.`,
        cierre: hasOA
          ? `Momento de cierre (10-15 min): Sintesis guiada: el docente recoge 2-3 ejemplos de productos creados por los estudiantes. Pregunta metacognitiva: "Que parte del proceso les costo mas y por que?". Ticket de salida con 3 preguntas. Criterio de logro: si el estudiante logro producir el resultado esperado, esta en nivel adecuado.`
          : `Momento de cierre (10-15 min): Reflexion y metacognicion. Que aprendi y como puedo aplicarlo.`,
        evaluacionFormativa: hasOA
          ? `Evaluacion formativa durante la clase:\n- Observacion directa de participacion en modelamiento\n- Revision de productos durante la practica guiada\n- Producto final alineado al ${req.oaCode}\n- Retroalimentacion entre pares usando criterios simples\n- Ticket de salida para verificar comprension`
          : 'Observacion directa, productos escritos, retroalimentacion entre pares.',
        ticketSalida: hasOA
          ? `Ticket de salida (${req.oaCode}):\n1. Escribi el resultado de la actividad principal.\n2. Que parte del proceso me costo mas y como puedo mejorarla?\n3. En que situacion real podria usar lo aprendido?`
          : '1. Que aprendi hoy?\n2. En que situacion puedo aplicar lo aprendido?\n3. Que me falta por aprender o practicar?',
        recursosMateriales: hasOA
          ? ['Cuaderno o ficha de trabajo del estudiante', 'Textos modelo o ejemplos para analizar', 'Pizarron o papel grafo para modelamiento', 'Organizador grafico', `Referente al ${req.oaCode}`]
          : ['Cuaderno o ficha de trabajo', 'Materiales visuales', 'Pizarron'],
        adecuacionesDUA: hasOA
          ? 'Representacion: ofrecer informacion en multiples formatos con vocabulario clave resaltado y organizadores graficos. Accion y expresion: permitir diversas formas de producir el resultado (escrito, oral, grafico). Implicacion: conectar con temas de interes de los estudiantes.'
          : 'Representacion en multiples formatos. Diversas formas de demostrar aprendizaje. Conexion con intereses.',
        apoyoEstudiantesDescendidos: hasOA
          ? 'Trabajo en grupos heterogeneos con apoyo de pares avanzados. Fichas con vocabulario clave y estructura guia. Instrucciones paso a paso con ejemplos concretos. Tiempo adicional. Retroalimentacion individual positiva y formativa.'
          : 'Grupos heterogeneos, instrucciones paso a paso, ejemplos concretos, tiempo adicional.',
        extensionAvanzados: hasOA
          ? 'Actividades de profundizacion: proyectos de investigacion breve, produccion de material didactico para el curso, asumir rol de tutor de pares, conectar con situaciones reales del entorno.'
          : 'Problemas de mayor complejidad, proyectos breves, rol de tutores.',
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
        proposito: hasOA ? `Evaluar los aprendizajes del ${req.oaCode} en ${course}.` : `Evaluar los aprendizajes de ${subject} en ${course}.`,
        instruccionesEstudiantes: 'Lee cada pregunta con atencion. Responde segun lo solicitado.',
        preguntas: [
          { numero: 1, tipo: 'abierta', enunciado: hasOA ? `Explica con tus palabras la idea central del ${req.oaCode} trabajado.` : 'Explica con tus palabras la idea central del tema trabajado.', alternativas: [], respuestaCorrecta: '', respuestaEsperada: 'Respuesta alineada al OA y a los indicadores seleccionados.', habilidadEvaluada: 'Comprension', indicadorEvaluado: indicators, puntaje: 4, retroalimentacion: 'Se valora la claridad y uso de vocabulario propio.' },
          { numero: 2, tipo: 'aplicacion', enunciado: 'Resuelve o crea un ejemplo conectado al contexto chileno de la clase.', alternativas: [], respuestaCorrecta: '', respuestaEsperada: 'Ejemplo contextualizado y correcto.', habilidadEvaluada: 'Aplicacion', indicadorEvaluado: '', puntaje: 4, retroalimentacion: 'Se evalua la conexion con la realidad y correcta aplicacion.' },
          { numero: 3, tipo: 'metacognicion', enunciado: 'Que estrategia te ayudo mas y por que?', alternativas: [], respuestaCorrecta: '', respuestaEsperada: 'Reflexion personal sobre su proceso de aprendizaje.', habilidadEvaluada: 'Metacognicion', indicadorEvaluado: '', puntaje: 2, retroalimentacion: 'Toda respuesta reflexiva es valida.' },
        ],
        pautaCorreccion: hasOA ? `Respuesta esperada alineada al texto oficial del ${req.oaCode} y a indicadores seleccionados: ${indicators}.` : 'Respuesta esperada alineada al texto oficial del OA y a indicadores seleccionados.',
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
        enunciado: hasOA ? `Enunciado del item alineado al ${req.oaCode}. Complejidad media.` : 'Enunciado del item alineado al OA. Complejidad media.',
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
        descripcion: hasOA ? `Rubrica de evaluacion alineada al ${req.oaCode}.` : 'Rubrica de evaluacion alineada al curriculo.',
        criterios: [
          { nombre: hasOA ? `Comprension del ${req.oaCode}` : 'Comprension del OA', ponderacion: 40, niveles: [
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
