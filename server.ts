import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ─── Static files (production) ────────────────────────────────────────────────

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// ─── Endpoints ───────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/ai-status', (_req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const openRouterKey = process.env.OPENROUTER_API_KEY || '';
  const huggingFaceKey = process.env.HUGGINGFACE_API_KEY || '';

  res.json({
    gemini: geminiKey.length > 0,
    openrouter: openRouterKey.length > 0,
    huggingface: huggingFaceKey.length > 0,
    localMode: !geminiKey && !openRouterKey && !huggingFaceKey,
    message: !geminiKey && !openRouterKey && !huggingFaceKey
      ? 'Modo local activo. Configura GEMINI_API_KEY, OPENROUTER_API_KEY o HUGGINGFACE_API_KEY en .env para activar IA externa.'
      : 'Al menos un proveedor IA configurado.',
  });
});

interface ChatRequest {
  message: string;
  history?: { role: string; content: string }[];
}

app.post('/api/pedagogico-chat', (req, res) => {
  const { message, history } = req.body as ChatRequest;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    return;
  }

  if (message.length > 4000) {
    res.status(400).json({ error: 'El mensaje es demasiado largo (máx. 4000 caracteres).' });
    return;
  }

  const contextSummary = history && Array.isArray(history) && history.length > 0
    ? `\nContexto de la conversación (${history.length} mensajes previos): ${history.slice(-3).map((m) => `${m.role}: ${m.content.slice(0, 100)}`).join(' | ')}`
    : '';

  const respuesta = generaRespuestaPedagogica(message, contextSummary);

  res.json({
    role: 'assistant',
    content: respuesta,
    timestamp: new Date().toISOString(),
  });
});

interface MaterialRequest {
  tipo: string;
  nivel: string;
  asignatura: string;
  oa: string;
  contexto?: string;
  extras?: string;
  incluirDUA?: boolean;
  incluirSIMCE?: boolean;
}

app.post('/api/generar-material', (req, res) => {
  const body = req.body as MaterialRequest;

  if (!body.tipo || !body.nivel || !body.asignatura) {
    res.status(400).json({
      error: 'Faltan campos requeridos: tipo, nivel, asignatura.',
    });
    return;
  }

  const validTypes = ['planificacion', 'guia', 'actividad', 'presentacion', 'ticket', 'rubrica', 'recurso'];
  if (!validTypes.includes(body.tipo)) {
    res.status(400).json({
      error: `Tipo inválido. Tipos válidos: ${validTypes.join(', ')}`,
    });
    return;
  }

  const material = generaMaterial(body);
  res.json({
    success: true,
    tipo: body.tipo,
    contenido: material,
    timestamp: new Date().toISOString(),
  });
});

interface EvalRequest {
  tipo: string;
  nivel: string;
  asignatura: string;
  oa: string;
  nPreguntas: number;
  dificultad: string;
  textoBase?: string;
}

app.post('/api/generar-evaluacion', (req, res) => {
  const body = req.body as EvalRequest;

  if (!body.tipo || !body.nivel || !body.asignatura) {
    res.status(400).json({
      error: 'Faltan campos requeridos: tipo, nivel, asignatura.',
    });
    return;
  }

  if (body.nPreguntas < 1 || body.nPreguntas > 50) {
    res.status(400).json({ error: 'nPreguntas debe estar entre 1 y 50.' });
    return;
  }

  const evaluacion = generaEvaluacion(body);
  res.json({
    success: true,
    tipo: body.tipo,
    contenido: evaluacion,
    nPreguntas: body.nPreguntas || 10,
    timestamp: new Date().toISOString(),
  });
});

// ─── Generación local ────────────────────────────────────────────────────────

function generaRespuestaPedagogica(message: string, _context: string): string {
  const msg = message.toLowerCase();

  if (msg.includes('hola') || msg.includes('buenos días') || msg.includes('buenas')) {
    return '¡Hola! Soy el asistente pedagógico de PlanificaIA Chile. Puedo ayudarte a crear planificaciones, evaluaciones, recursos DUA, rúbricas y más. ¿En qué puedo ayudarte hoy?';
  }

  if (msg.includes('planificar') || msg.includes('planificación')) {
    return 'Para crear una planificación, ve al Planificador de clases, completa nivel, asignatura, OA, duración y contexto. Luego presiona "Generar planificación". Obtendrás una estructura completa con inicio, desarrollo, cierre, DUA y evaluación formativa.';
  }

  if (msg.includes('simce') || msg.includes('evaluación')) {
    return 'Para generar una evaluación tipo SIMCE, ve a la sección Evaluaciones. Puedes elegir entre diagnóstica, formativa, sumativa o ensayo SIMCE. Define el OA, número de preguntas y dificultad. El sistema generará alternativas, pauta y retroalimentación.';
  }

  if (msg.includes('dua') || msg.includes('inclusión') || msg.includes('adecuación')) {
    return 'El Diseño Universal para el Aprendizaje (DUA) se integra en todos los materiales generados:\n- Representación: texto, imagen y audio.\n- Acción: respuesta oral, escrita, dibujo o selección.\n- Participación: roles, elección y refuerzo positivo.\nPuedes solicitar adecuaciones específicas en el campo "Instrucciones especiales" del planificador.';
  }

  if (msg.includes('rubrica') || msg.includes('rúbrica')) {
    return 'Las rúbricas se pueden generar desde el Generador de recursos (seleccionando "Rúbrica" como tipo) o desde Evaluaciones. Incluyen criterios, niveles de logro y descriptores. Son editables antes de imprimir o exportar.';
  }

  if (msg.includes('pdf') || msg.includes('imprimir') || msg.includes('exportar')) {
    return 'Puedes exportar cualquier material de tres formas:\n1. Botón "Imprimir / PDF" - abre el diálogo de impresión del navegador, donde puedes elegir "Guardar como PDF".\n2. Botón "Descargar HTML" - descarga un archivo HTML formateado.\n3. Botón "Copiar" - copia el contenido al portapapeles.';
  }

  if (msg.includes('ticket') || msg.includes('salida')) {
    return 'Los tickets de salida se generan desde el Generador de recursos (seleccionando "Ticket de salida") o desde Evaluaciones. Incluyen 3 preguntas: una literal, una inferencial y una de autoevaluación. Ideales para el cierre de clase.';
  }

  return 'Entiendo tu consulta. Como asistente pedagógico chileno, puedo orientarte en:\n- Creación de planificaciones clase a clase.\n- Diseño de evaluaciones formativas, sumativas y SIMCE.\n- Recursos DUA e inclusión.\n- Rúbricas y tickets de salida.\n- Exportación a PDF y HTML.\n\n¿Sobre qué tema específico necesitas ayuda?';
}

function generaMaterial(body: MaterialRequest): string {
  const lines: string[] = [
    `# ${capitalize(body.tipo)}`,
    '',
    `**Nivel:** ${body.nivel}`,
    `**Asignatura:** ${body.asignatura}`,
    `**OA:** ${body.oa || 'No especificado'}`,
    '',
    '## Propósito pedagógico',
    'Material diseñado para apoyar el proceso de enseñanza-aprendizaje en el aula chilena, promoviendo el desarrollo de habilidades priorizadas.',
    '',
    '## Desarrollo',
    '1. Activación de conocimientos previos (5 min)',
    '2. Presentación del objetivo y vocabulario clave (5 min)',
    '3. Desarrollo de la actividad principal (20 min)',
    '4. Práctica guiada y colaborativa (15 min)',
    '5. Cierre y metacognición (5 min)',
    '',
    '## Actividades',
    '- Actividad inicial de motivación',
    '- Trabajo individual con apoyo del docente',
    '- Trabajo colaborativo en parejas o grupos',
    '- Puesta en común y síntesis',
  ];

  if (body.incluirDUA) {
    lines.push(
      '',
      '## DUA (Diseño Universal para el Aprendizaje)',
      '- Múltiples formas de representación: texto, imagen, organizador gráfico',
      '- Múltiples formas de acción: respuesta oral, escrita, dibujo',
      '- Múltiples formas de participación: roles, trabajo en equipo, elección de tarea',
      '- Apoyos adicionales: banco de palabras, instrucciones paso a paso, material concreto',
    );
  }

  if (body.incluirSIMCE) {
    lines.push(
      '',
      '## Actividad tipo SIMCE',
      '1. Pregunta de selección múltiple con 4 alternativas',
      '2. Pregunta de desarrollo breve con evidencia',
      '3. Pregunta de justificación de respuesta',
      '',
      '**Habilidades evaluadas:** localizar, inferir, interpretar, evaluar',
      '**Pauta de corrección:** 1 punto por respuesta correcta en selección múltiple, 2 puntos por justificación completa.',
    );
  }

  if (body.extras) {
    lines.push('', '## Instrucciones adicionales', body.extras);
  }

  lines.push('', '## Evaluación formativa', '- Lista de cotejo con indicadores de logro', '- Observación directa del docente', '- Ticket de salida con 3 preguntas');

  return lines.join('\n');
}

function generaEvaluacion(body: EvalRequest): string {
  const n = Math.max(1, Math.min(50, body.nPreguntas || 10));
  const preguntas: string[] = [];
  const habilidades = ['localizar información', 'inferir', 'interpretar', 'evaluar', 'aplicar', 'analizar'];

  for (let i = 1; i <= n; i++) {
    const hab = habilidades[i % habilidades.length];
    preguntas.push(
      `${i}. (${hab}) ${body.textoBase ? 'Considerando el texto base, ' : ''}¿Cuál es la opción correcta?`,
      '   A) Opción distractora',
      '   B) Opción correcta',
      '   C) Opción parcialmente correcta',
      '   D) Opción fuera de contexto',
      `   Habilidad: ${hab} | Respuesta: B | Retroalimentación: Revisa la evidencia en el texto/fuente.`,
      '',
    );
  }

  return [
    `# ${capitalize(body.tipo)}`,
    '',
    `**Nivel:** ${body.nivel}`,
    `**Asignatura:** ${body.asignatura}`,
    `**OA/Habilidad:** ${body.oa || 'No especificado'}`,
    `**Dificultad:** ${body.dificultad || 'Progresiva'}`,
    '',
    '## Instrucciones para el/la estudiante',
    'Lee atentamente cada pregunta y sus alternativas. Marca solo una respuesta por pregunta. Justifica dos respuestas a elección del docente.',
    '',
    '## Preguntas',
    ...preguntas,
    '',
    '## Pauta de corrección',
    '- Respuesta correcta (alternativa): 1 punto',
    '- Justificación con evidencia: 2 puntos adicionales',
    '- Sin respuesta: 0 puntos',
    '',
    '## Análisis de resultados',
    '- Agrupar errores por habilidad',
    '- Identificar necesidades de reenseñanza',
    '- Planificar ajustes para la siguiente clase',
    '',
    '## Retroalimentación sugerida',
    'Para cada pregunta incorrecta, guiar al estudiante a revisar la evidencia, comparar alternativas y explicar su razonamiento.',
  ].join('\n');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}

// ─── AI Proxy endpoints (server-side) ───────────────────────────────────────

interface AIProxyRequest {
  prompt: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

app.post('/api/ai/gemini', async (req, res) => {
  try {
    const { prompt, model, temperature, maxTokens } = req.body as AIProxyRequest;
    if (!genAI) {
      res.status(400).json({ error: 'GEMINI_API_KEY no configurada en el servidor.' });
      return;
    }
    const m = model || 'gemini-2.0-flash';
    const response = await genAI.models.generateContent({
      model: m,
      contents: prompt,
      config: { temperature: temperature ?? 0.72, maxOutputTokens: maxTokens ?? 2048 },
    });
    res.json({ success: true, content: response.text || '' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error Gemini';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/ai/openrouter', async (req, res) => {
  try {
    const { prompt, model, systemPrompt, temperature, maxTokens } = req.body as AIProxyRequest;
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: 'OPENROUTER_API_KEY no configurada en el servidor.' });
      return;
    }
    const m = model || 'openrouter/auto';
    const messages = [{ role: 'system', content: systemPrompt || 'Eres un asistente experto en planificación educativa chilena.' }, { role: 'user', content: prompt }];
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': 'https://planificaia.app', 'X-Title': 'PlanificaIA Chile' },
      body: JSON.stringify({ model: m, messages, temperature: temperature ?? 0.72, max_tokens: maxTokens ?? 2048 }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || 'Error OpenRouter');
    res.json({ success: true, content: data.choices?.[0]?.message?.content || '' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error OpenRouter';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/ai/huggingface', async (req, res) => {
  try {
    const { prompt, model, systemPrompt, temperature, maxTokens } = req.body as AIProxyRequest;
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: 'HUGGINGFACE_API_KEY no configurada en el servidor.' });
      return;
    }
    const m = model || 'meta-llama/Llama-3.1-8B-Instruct';
    const messages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]
      : [{ role: 'user', content: prompt }];
    const r = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: m, messages, temperature: temperature ?? 0.72, max_tokens: maxTokens ?? 2048 }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || data.message || 'Error Hugging Face');
    res.json({ success: true, content: data.choices?.[0]?.message?.content || '' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error Hugging Face';
    res.status(500).json({ error: msg });
  }
});

app.get('/api/ai/providers', (_req, res) => {
  res.json({
    gemini: !!process.env.GEMINI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    huggingface: !!process.env.HUGGINGFACE_API_KEY,
  });
});

// ─── SPA fallback ────────────────────────────────────────────────────────────

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── Inicio del servidor ─────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[PlanificaIA Server] corriendo en http://localhost:${PORT}`);
  console.log(`[PlanificaIA Server] Endpoints:`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/ai-status`);
  console.log(`  POST /api/pedagogico-chat`);
  console.log(`  POST /api/generar-material`);
  console.log(`  POST /api/generar-evaluacion`);
  if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY && !process.env.HUGGINGFACE_API_KEY) {
    console.log(`[PlanificaIA Server] Modo local: respuestas generadas localmente.`);
    console.log(`[PlanificaIA Server] Configura .env para activar IA externa.`);
  }
});
