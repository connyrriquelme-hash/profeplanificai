import type { AIConfig } from '../types';

// Production uses the Pages Function proxy by default, so provider keys never
// need to be exposed to the browser. Set VITE_USE_SERVER_AI=false only for the
// explicitly portable/offline build.
const USE_SERVER_AI = import.meta.env.VITE_USE_SERVER_AI !== 'false';
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function callServerAI(provider: string, prompt: string, model?: string, systemPrompt?: string): Promise<string> {
  const stored = localStorage.getItem('planificaia_token');
  const token = stored ? (JSON.parse(stored)?.token || stored) : '';
  const r = await fetch(`${API_BASE}/ai/${provider}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt, model, systemPrompt }),
  });
  const data = await r.json();
  if (!r.ok || data.error) throw new Error(data.error || 'Error del servidor AI');
  return data.content || 'Sin texto devuelto.';
}

async function callClientAI(prompt: string, cfg: AIConfig): Promise<string> {
  if (!cfg.provider || cfg.provider === 'local') throw new Error('Modo local activo');
  if (!cfg.apiKey) throw new Error('Falta API key');

  if (cfg.provider === 'gemini') {
    const model = cfg.model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.72 },
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || 'Error Gemini');
    return (data.candidates?.[0]?.content?.parts || [])
      .map((p: { text?: string }) => p.text || '')
      .join('\n') || 'Sin texto devuelto.';
  }

  if (cfg.provider === 'openrouter') {
    const model = cfg.model || 'openrouter/auto';
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey,
        'HTTP-Referer': location.href,
        'X-Title': 'PlanificaIA Chile',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: 'Eres un asistente experto en planificación educativa chilena, DUA, evaluación formativa y recursos claros para docentes.' }, { role: 'user', content: prompt }],
        temperature: 0.72,
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || 'Error OpenRouter');
    return data.choices?.[0]?.message?.content || 'Sin texto devuelto.';
  }

  if (cfg.provider === 'huggingface') {
    const model = cfg.model || 'meta-llama/Llama-3.1-8B-Instruct';
    const r = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.72,
        max_tokens: 1800,
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || data.message || 'Error Hugging Face');
    return data.choices?.[0]?.message?.content || 'Sin texto devuelto.';
  }

  throw new Error('Proveedor no soportado');
}

export async function callAI(prompt: string, cfg: AIConfig): Promise<string> {
  if (USE_SERVER_AI && cfg.provider !== 'local') {
    return callServerAI(cfg.provider, prompt, cfg.model);
  }
  return callClientAI(prompt, cfg);
}

export async function testAIConnection(cfg: AIConfig): Promise<string> {
  return callAI('Responde solamente: PlanificaIA conectada.', cfg);
}

// ─── Central AI Engine (from portable v2) ──────────────────────────────────

let _aiBusy = false;

function _pA(nivel: string): boolean {
  return nivel === 'Prekinder' || nivel === 'Kinder';
}

function buildOAContext(nivel: string, asig: string, oaText: string): string {
  if (!oaText) return '';
  return `## Contexto curricular - ${nivel} · ${asig}\nOA: ${oaText}`;
}

function _titulo(tipo: string): string {
  const map: Record<string, string> = {
    planificacion: 'Planificación de clase',
    recurso: 'Recurso pedagógico',
    evaluacion: 'Evaluación',
    simce: 'Ensayo tipo SIMCE',
    reporte: 'Reporte pedagógico',
  };
  return map[tipo] || 'Material pedagógico';
}

function _genLocalCentral(p: any): string {
  const pv = _pA(p.nivel);
  const ctx = buildOAContext(p.nivel, p.asignatura, p.oa);
  const hdr = ctx ? ctx + '\n\n---\n\n' : '';
  const tipo = p.tipo;
  const niv = p.nivel;
  const asig = p.asignatura;
  const oa = p.oa || 'Especificar OA ministerial';
  const dur = p.duracion;
  const est = p.estudiantes;
  const nec = p.necesidades;
  const dif = p.dificultad;

  if (pv) {
    return hdr + [
      `# ${_titulo(tipo)} - Educación Parvularia`,
      `**Nivel:** ${niv} | **Ámbito:** ${asig} | **Duración:** ${dur} | **Estudiantes:** ${est}`,
      `**OA:** ${oa}`,
      '',
      '## Meta de aprendizaje',
      `Que niños y niñas ${(oa || 'exploren y aprendan').toLowerCase()} a través del juego, la exploración y la interacción.`,
      '',
      '## Inicio (10-15 min)',
      '- Canción o saludo grupal para crear ambiente acogedor.',
      '- Elemento sorpresa relacionado con el OA.',
      '- Explicar en lenguaje simple qué haremos hoy.',
      '',
      '## Desarrollo (20-25 min)',
      '- Experiencia práctica y lúdica principal.',
      '- Exploración con materiales concretos.',
      '- Mediación de la educadora con preguntas abiertas.',
      '- Variedad de opciones para distintos ritmos.',
      '',
      '## Cierre (10 min)',
      '- Conversación grupal: qué hicimos, cómo lo hicimos, qué aprendimos.',
      '- Evaluación por observación directa.',
      '- Sugerencia para realizar en familia.',
      '',
      '## DUA y apoyos',
      '- Representación: imágenes, objetos, modelaje.',
      '- Acción: manipulación, expresión oral y gráfica.',
      '- Participación: juego libre, trabajo en parejas, elección.',
      '',
      '## Evaluación formativa',
      '- Pauta de observación: Logrado / En Proceso / No Observado.',
      '- Registro anecdótico.',
    ].join('\n');
  }

  if (tipo === 'planificacion' || tipo === 'plan') {
    return hdr + [
      `# ${_titulo('planificacion')}`,
      `**Nivel:** ${niv} | **Asignatura:** ${asig} | **Duración:** ${dur} | **Estudiantes:** ${est || 30}`,
      `**OA:** ${oa}`,
      `**Contexto:** ${p.contexto || 'Curso heterogéneo.'}`,
      '',
      '## Objetivo de la clase',
      `OA: ${oa}`,
      '',
      '## Inicio (10-15 min)',
      '- Activación de conocimientos previos.',
      '- Presentación del objetivo en lenguaje claro.',
      '- Vocabulario clave.',
      '',
      '## Desarrollo (25-30 min)',
      '- Modelaje docente.',
      '- Práctica guiada en pares.',
      '- Actividad colaborativa o individual.',
      '',
      '## Cierre (5-10 min)',
      '- Síntesis de aprendizajes.',
      '- Ticket de salida o pregunta de metacognición.',
      '',
      '## Evaluación formativa',
      '- Indicadores de logro observables.',
      '- Retroalimentación descriptiva.',
      '',
      '## DUA',
      '- Múltiples formas de representación, acción y participación.',
      '',
      '## Recursos',
      '- Materiales según la actividad planificada.',
    ].join('\n');
  }

  if (tipo === 'recurso' || tipo === 'recursos') {
    return hdr + [
      `# ${_titulo('recurso')}`,
      `**Nivel:** ${niv} | **Asignatura/Ámbito:** ${asig}`,
      `**OA:** ${oa}`,
      `**Necesidad:** ${nec || 'No especificada.'}`,
      '',
      '## Propósito pedagógico',
      'Recurso diseñado para apoyar el aprendizaje activo y significativo.',
      '',
      '## Material para el/la docente',
      '- Preparación previa y materiales necesarios.',
      '- Instrucciones paso a paso.',
      '',
      '## Material para estudiantes',
      '- Instrucciones claras.',
      '- Actividad principal con ejercicios progresivos.',
      '- Desafío o pregunta de reflexión final.',
      '',
      '## Apoyos DUA',
      '- Representación, acción y participación.',
      '',
      '## Pauta de evaluación',
      '- Criterios de logro simples.',
    ].join('\n');
  }

  // Default: evaluación
  const esSIMCE = tipo === 'simce' || (p.tipo || '').toLowerCase().includes('simce');
  const np = p.cantEjercicios || 10;
  return hdr + [
    `# ${esSIMCE ? 'Ensayo tipo SIMCE' : _titulo('evaluacion')}`,
    `**Nivel:** ${niv} | **Asignatura:** ${asig}`,
    `**OA evaluado:** ${oa}`,
    `**Dificultad:** ${dif || 'Progresiva'} | **N° preguntas:** ${np}`,
    '',
    esSIMCE ? '## Instrucciones tipo SIMCE\nSelecciona la alternativa correcta (A-D). Justifica cuando se indique.' : '',
    ...Array.from({ length: Math.min(np, 5) }, (_, i) => [
      '',
      `**${i + 1}.** Pregunta sobre ${oa}.`,
      '   A) Alternativa A',
      '   B) Alternativa B (correcta)',
      '   C) Alternativa C',
      '   D) Alternativa D',
      `   *Habilidad: aplicar | Dificultad: ${dif || 'Media'}*`,
    ]).flat(),
    '',
    '## Pauta de corrección',
    '- Respuesta correcta: 1 punto.',
    '- Justificación con evidencia: 2 puntos.',
    '',
    '## Retroalimentación sugerida',
    '- Revisar errores por habilidad y planificar reenseñanza.',
  ].join('\n');
}

export interface GenAIOpts {
  tipo: string;
  nivel: string;
  asignatura: string;
  oa: string;
  tema?: string;
  duracion?: string;
  estudiantes?: number;
  necesidades?: string;
  estilo?: string;
  dificultad?: string;
  contexto?: string;
  habilidad?: string;
  cantEjercicios?: number;
  incluirAlternativas?: string;
  incluirDesarrollo?: string;
  incluirPauta?: string;
  incluirRetroalimentacion?: string;
  incluirTabla?: string;
  incluirDUA?: string;
  promptExt?: string;
  onStatus?: (msg: string, cls?: string) => void;
  onOutput?: (html: string, text: string) => void;
}

export async function generarConIA(opts: GenAIOpts): Promise<{ ok: boolean; texto?: string; error?: string; fuente?: string }> {
  if (_aiBusy) return { ok: false, error: 'Ya hay una generación en curso. Espera a que termine.' };
  _aiBusy = true;

  const defs = {
    tipo: 'planificacion', nivel: '2° básico', asignatura: 'Lenguaje y Comunicación',
    oa: '', tema: '', duracion: '90 min', estudiantes: 30,
    necesidades: '', estilo: 'completo', dificultad: 'Progresiva', contexto: '',
    habilidad: '', cantEjercicios: 10,
    incluirAlternativas: 'si', incluirDesarrollo: 'si', incluirPauta: 'si',
    incluirRetroalimentacion: 'si', incluirTabla: 'no', incluirDUA: 'si',
    onStatus: (_msg: string, _cls?: string) => {},
    onOutput: (_html: string, _text: string) => {},
  };

  const p = Object.assign({}, defs, opts);

  try {
    p.onStatus('Generando…');

    const cfg: AIConfig = (() => {
      try {
        return JSON.parse(localStorage.getItem('planificaia_cfg') || '{"provider":"gemini","model":"gemini-2.5-flash","apiKey":""}');
      } catch {
        return { provider: 'gemini' as const, model: 'gemini-2.5-flash', apiKey: '' };
      }
    })();

    let text = '', source = 'local';

    if (cfg.provider !== 'local' && (cfg.apiKey || USE_SERVER_AI)) {
      try {
        const prompt = p.promptExt || _buildPromptCentral(p);
        text = await callAI(prompt, cfg);
        source = cfg.provider;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error desconocido';
        p.onStatus(`IA externa falló: ${msg}. Usando modo local.`, 'warn');
      }
    }

    if (!text) text = _genLocalCentral(p);

    const { md } = await import('../utils/htmlUtils');
    p.onOutput(md(text), text);
    p.onStatus(source === 'local' ? 'Generado en modo local' : `Generado con ${source}`, 'ok');

    return { ok: true, texto: text, fuente: source };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    p.onStatus(`Error: ${msg}`, 'bad');
    return { ok: false, error: msg };
  } finally {
    _aiBusy = false;
  }
}

function _buildPromptCentral(p: any): string {
  const ctx = buildOAContext(p.nivel, p.asignatura, p.oa);
  const extra: string[] = [];
  if (p.cantEjercicios) extra.push(`Cantidad de preguntas/ejercicios: ${p.cantEjercicios}`);
  if (p.incluirRespuestas) extra.push(`Incluir respuestas: ${p.incluirRespuestas === 'si' ? 'Sí' : 'No'}`);
  if (p.incluirAlternativas) extra.push(`Incluir alternativas: ${p.incluirAlternativas === 'si' ? 'Sí' : 'No'}`);
  if (p.incluirDesarrollo) extra.push(`Incluir preguntas de desarrollo: ${p.incluirDesarrollo === 'si' ? 'Sí' : 'No'}`);
  if (p.incluirPauta) extra.push(`Incluir pauta de corrección: ${p.incluirPauta === 'si' ? 'Sí' : 'No'}`);
  if (p.incluirRetroalimentacion) extra.push(`Incluir retroalimentación: ${p.incluirRetroalimentacion === 'si' ? 'Sí' : 'No'}`);
  if (p.incluirTabla) extra.push(`Incluir tabla de especificaciones: ${p.incluirTabla === 'si' ? 'Sí' : 'No'}`);
  if (p.incluirDUA) extra.push(`Incluir adecuación DUA: ${p.incluirDUA === 'si' ? 'Sí' : 'No'}`);
  if (p.habilidad) extra.push(`Habilidad específica: ${p.habilidad}`);

  return [
    ctx || '',
    'Eres docente experto del Currículum Nacional Chileno. Genera contenido pedagógico de alta calidad.',
    `Tipo: ${p.tipo} | Nivel: ${p.nivel} | Asignatura: ${p.asignatura}`,
    `OA: ${p.oa} | Tema: ${p.tema} | Duración: ${p.duracion} | Estudiantes: ${p.estudiantes || 'N/A'}`,
    `Habilidad: ${p.habilidad || 'No especificada'} | Dificultad: ${p.dificultad || 'Progresiva'}`,
    ...extra,
    '',
    'Requisitos del contenido:',
    '- Lenguaje docente chileno claro y directo.',
    '- Alineado al Currículum Nacional.',
    '- Estructura ordenada con secciones ## y **negritas**.',
    '- Actividades concretas y aplicables en aula chilena real.',
    '- Evaluación o evidencia de aprendizaje explícita.',
    '- Sugerencias de reforzamiento para estudiantes descendidos.',
    '- Adaptación DUA (Representación, Acción, Participación).',
    '- Formato listo para copiar, imprimir o exportar.',
    '',
    p.estilo === 'resumido' ? 'Versión RESUMIDA: solo lo esencial.' :
    p.estilo === 'esquema' ? 'Entrega un ESQUEMA estructurado con viñetas jerárquicas.' :
    p.estilo === 'SIMCE' ? 'Formato tipo SIMCE con alternativas A-D, habilidad y dificultad por pregunta.' :
    'Versión COMPLETA y detallada, lista para aplicar.',
  ].filter(Boolean).join('\n');
}
