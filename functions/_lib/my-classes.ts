import { verifyToken } from './auth';

export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  GEMINI_API_KEY?: string;
  AI?: { run: (model: string, input: unknown) => Promise<unknown> };
}

export type JsonRecord = Record<string, unknown>;

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export async function getTeacherId(context: EventContext<Env>): Promise<string | null> {
  const auth = context.request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const secret = context.env.JWT_SECRET || '';
  if (!secret) return null;
  const payload = await verifyToken(auth.slice(7), secret);
  return payload?.sub || null;
}

export async function readJson(request: Request): Promise<JsonRecord> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body as JsonRecord : {};
  } catch {
    return {};
  }
}

export function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

export function int(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

export function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function mondayOf(dateText?: string | null): Date {
  const base = dateText ? new Date(`${dateText}T12:00:00`) : new Date();
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diff);
  base.setHours(0, 0, 0, 0);
  return base;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function normalizeStatus(value: unknown): string {
  const status = text(value, 'pendiente');
  return ['planificada', 'en_preparacion', 'realizada', 'pendiente'].includes(status) ? status : 'pendiente';
}

export async function ensureLessonPlan(db: D1Database, lessonId: string, teacherId: string, title: string): Promise<string> {
  const existing = await db.prepare('SELECT id FROM lesson_plans WHERE lesson_instance_id = ? AND teacher_id = ?')
    .bind(lessonId, teacherId)
    .first<{ id: string }>();
  if (existing?.id) return existing.id;

  const id = randomId('plan');
  const now = nowIso();
  await db.prepare(`INSERT INTO lesson_plans (id, lesson_instance_id, teacher_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(id, lessonId, teacherId, title || 'Clase sin titulo', now, now)
    .run();
  return id;
}

export async function getLessonBundle(db: D1Database, lessonId: string, teacherId: string) {
  const lesson = await db.prepare(`
    SELECT li.*, tc.school_year, tc.level_id, tc.subject_id, tc.course_name, tc.class_name, tc.color
    FROM lesson_instances li
    JOIN teacher_classes tc ON tc.id = li.class_id
    WHERE li.id = ? AND li.teacher_id = ?
  `).bind(lessonId, teacherId).first<JsonRecord>();

  if (!lesson) return null;

  const planId = await ensureLessonPlan(db, lessonId, teacherId, String(lesson.title || 'Clase'));
  const plan = await db.prepare('SELECT * FROM lesson_plans WHERE id = ? AND teacher_id = ?')
    .bind(planId, teacherId)
    .first<JsonRecord>();
  const curriculum = await db.prepare('SELECT * FROM lesson_plan_curriculum WHERE lesson_plan_id = ?')
    .bind(planId)
    .first<JsonRecord>();
  const methodologies = await db.prepare(`
    SELECT lpm.*, m.name, m.description
    FROM lesson_plan_methodologies lpm
    LEFT JOIN methodologies m ON m.id = lpm.methodology_id
    WHERE lpm.lesson_plan_id = ?
    ORDER BY lpm.created_at DESC
  `).bind(planId).all<JsonRecord>();
  const resources = await db.prepare('SELECT * FROM lesson_generated_resources WHERE lesson_plan_id = ? ORDER BY created_at DESC')
    .bind(planId).all<JsonRecord>();
  const evaluations = await db.prepare('SELECT * FROM lesson_generated_evaluations WHERE lesson_plan_id = ? ORDER BY created_at DESC')
    .bind(planId).all<JsonRecord>();
  const comments = await db.prepare('SELECT * FROM lesson_comments WHERE lesson_plan_id = ? ORDER BY created_at DESC')
    .bind(planId).all<JsonRecord>();
  const attachments = await db.prepare('SELECT * FROM lesson_attachments WHERE lesson_plan_id = ? ORDER BY created_at DESC')
    .bind(planId).all<JsonRecord>();

  return {
    lesson,
    plan,
    curriculum,
    methodologies: methodologies.results || [],
    resources: resources.results || [],
    evaluations: evaluations.results || [],
    comments: comments.results || [],
    attachments: attachments.results || [],
  };
}

export async function getCurriculumContext(db: D1Database, objectiveId: string, levelId?: string, subjectId?: string) {
  const objective = await db.prepare(`
    SELECT o.id, o.code, o.official_text, o.normalized_text, o.bloom_level,
           c.id AS level_id, c.name AS level_name,
           s.id AS subject_id, s.name AS subject_name,
           a.id AS axis_id, a.name AS axis_name
    FROM objectives o
    LEFT JOIN courses c ON c.id = o.course_id
    LEFT JOIN subjects s ON s.id = o.subject_id
    LEFT JOIN axes a ON a.id = o.axis_id
    WHERE o.id = ? OR o.code = ?
    LIMIT 1
  `).bind(objectiveId, objectiveId).first<JsonRecord>();

  if (!objective) return null;

  const indicators = await db.prepare('SELECT id, indicator_text AS description, observable_action, evaluation_type FROM curriculum_indicators WHERE oa_code = ? LIMIT 30')
    .bind(objective.code)
    .all<JsonRecord>();
  const skills = await db.prepare(`
    SELECT sk.id, sk.official_text AS description
    FROM objective_skills os
    JOIN skills sk ON sk.id = os.skill_id
    WHERE os.objective_id = ?
    LIMIT 20
  `).bind(objective.id).all<JsonRecord>();
  const attitudes = await db.prepare(`
    SELECT att.id, att.official_text AS description
    FROM objective_attitudes oa
    JOIN attitudes att ON att.id = oa.attitude_id
    WHERE oa.objective_id = ?
    LIMIT 20
  `).bind(objective.id).all<JsonRecord>();
  const methodologies = await db.prepare(`
    SELECT id, name, description, educational_focus, pedagogical_approach
    FROM methodologies
    WHERE status IS NULL OR status = 'active'
    ORDER BY name
    LIMIT 8
  `).all<JsonRecord>();

  return {
    level_id: levelId || objective.level_id,
    subject_id: subjectId || objective.subject_id,
    axis_id: objective.axis_id,
    objective,
    indicators: indicators.results || [],
    skills: skills.results || [],
    attitudes: attitudes.results || [],
    methodologies: methodologies.results || [],
  };
}

export async function saveCurriculumSelection(db: D1Database, lessonPlanId: string, body: JsonRecord) {
  const objectiveId = text(body.objective_id || body.objectiveId);
  const levelId = text(body.level_id || body.levelId);
  const subjectId = text(body.subject_id || body.subjectId);
  if (!objectiveId || !levelId || !subjectId) {
    return null;
  }

  let ctx;
  try {
    ctx = await getCurriculumContext(db, objectiveId, levelId, subjectId);
  } catch {
    return null;
  }
  if (!ctx) return null;

  const id = randomId('lpc');
  const now = nowIso();
  const indicatorIds = parseJsonArray(body.indicator_ids_json || body.indicatorIds || body.indicators);
  const skillIds = parseJsonArray(body.skill_ids_json || body.skillIds || body.skills);
  const attitudeIds = parseJsonArray(body.attitude_ids_json || body.attitudeIds || body.attitudes);

  await db.prepare(`INSERT INTO lesson_plan_curriculum
    (id, lesson_plan_id, level_id, subject_id, axis_id, objective_id, indicator_ids_json, skill_ids_json, attitude_ids_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(lesson_plan_id) DO UPDATE SET
      level_id=excluded.level_id,
      subject_id=excluded.subject_id,
      axis_id=excluded.axis_id,
      objective_id=excluded.objective_id,
      indicator_ids_json=excluded.indicator_ids_json,
      skill_ids_json=excluded.skill_ids_json,
      attitude_ids_json=excluded.attitude_ids_json,
      updated_at=excluded.updated_at`)
    .bind(
      id,
      lessonPlanId,
      ctx.level_id,
      ctx.subject_id,
      ctx.axis_id || null,
      String(ctx.objective.id),
      JSON.stringify(indicatorIds.length ? indicatorIds : (ctx.indicators as JsonRecord[]).map((i) => i.id)),
      JSON.stringify(skillIds.length ? skillIds : (ctx.skills as JsonRecord[]).map((s) => s.id)),
      JSON.stringify(attitudeIds.length ? attitudeIds : (ctx.attitudes as JsonRecord[]).map((a) => a.id)),
      now,
      now,
    ).run();

  return ctx;
}

export function buildLocalGeneration(kind: string, action: string, ctx: JsonRecord, lesson: JsonRecord, plan: JsonRecord) {
  const objective = ctx.objective as JsonRecord;
  const indicators = (ctx.indicators as JsonRecord[] || []).map((i) => i.description || i.indicator_text).filter(Boolean);
  const skills = (ctx.skills as JsonRecord[] || []).map((s) => s.description || s.official_text).filter(Boolean);
  const attitudes = (ctx.attitudes as JsonRecord[] || []).map((a) => a.description || a.official_text).filter(Boolean);
  const hasRealOA = objective?.code && objective.code !== 'OA pendiente';
  const title = `${labelForAction(action)} - ${hasRealOA ? (objective?.code || 'OA') : (lesson.course_name || 'Curso')}`;
  const base = {
    title,
    action,
    kind,
    generatedAt: nowIso(),
    chileContext: true,
    lesson: {
      title: lesson.title,
      date: lesson.lesson_date,
      course: lesson.course_name,
      subject: lesson.subject_id,
    },
    curriculum: {
      level: ctx.level_id,
      subject: ctx.subject_id,
      axis: ctx.axis_id,
      objectiveCode: objective?.code,
      objectiveText: objective?.official_text,
      indicators,
      skills,
      attitudes,
    },
    content: [
      hasRealOA
        ? `Propuesta para ${lesson.course_name || 'el curso'} alineada al ${objective?.code}.`
        : `Propuesta para ${lesson.course_name || 'elcurso'} basada en curso y asignatura. Si no hay OA explicito, crea una actividad curricularmente plausible, indicando que el OA debe ser revisado y ajustado por el docente.`,
      `Foco: ${objective?.official_text || plan.objective_text || 'objetivo curricular del curso y asignatura'}`,
      indicators.length ? `Indicadores usados: ${indicators.slice(0, 3).join('; ')}` : hasRealOA ? 'Indicadores: revisar y ajustar segun evidencia de clase.' : 'Indicadores: a definir segun OA seleccionado por el docente.',
      `Accion docente sugerida: ${labelForAction(action)} con instrucciones claras, tiempos breves y cierre formativo.`,
      !hasRealOA ? 'Nota: El OA debe ser seleccionado y revisado por el docente para completar la alineacion curricular.' : '',
    ].filter(Boolean),
    teacherEditable: true,
  };

  if (kind === 'evaluation') {
    return {
      ...base,
      questions: [
        { type: 'entrada', prompt: 'Explica con tus palabras la idea central del OA trabajado.' },
        { type: 'aplicacion', prompt: 'Resuelve o crea un ejemplo conectado al contexto chileno de la clase.' },
        { type: 'metacognicion', prompt: 'Que estrategia te ayudo mas y por que?' },
      ],
      rubric: [
        { criterion: 'Comprension del OA', levels: ['Logrado', 'En desarrollo', 'Por reforzar'] },
        { criterion: 'Uso de evidencia', levels: ['Clara y pertinente', 'Parcial', 'Insuficiente'] },
      ],
      answerKey: ['Respuesta esperada alineada al texto oficial del OA y a indicadores seleccionados.'],
    };
  }

  return base;
}

export function labelForAction(action: string): string {
  const labels: Record<string, string> = {
    inicio: 'Generar inicio',
    desarrollo: 'Generar desarrollo',
    cierre: 'Generar cierre',
    guia: 'Crear guia',
    evaluacion: 'Crear evaluacion',
    rubrica: 'Crear rubrica',
    ticket: 'Crear ticket de salida',
    presentation: 'Crear presentacion PPT',
    dua: 'Crear recurso DUA',
    mejora: 'Mejorar esta clase',
    descendidos: 'Adaptar para estudiantes descendidos',
    alta_exigencia: 'Adaptar para alta exigencia',
    colaborativa: 'Crear actividad colaborativa',
    actividades_clase: 'Generar actividades de clase',
  };
  return labels[action] || action;
}

const SUBJECT_TEMPLATES: Record<string, { inicio: string; desarrollo: string; cierre: string }> = {
  'comunicacion-integral': {
    inicio: 'Activacion de conocimientos previos con una breve lectura, imagen o situacion comunicativa que invite a la reflexion. Pregunta guia para activar el interes.',
    desarrollo: 'Comprension lectora, analisis de textos, produccion escrita u oral. Trabajo colaborativo con intercambio de ideas y retroalimentacion entre pares.',
    cierre: 'Metacognicion: que aprendi y como puedo aplicarlo. Ticket de salida con una pregunta breve o reflexion personal.',
  },
  lenguaje: {
    inicio: 'Activacion de conocimientos previos con una breve lectura, imagen o situacion comunicativa que invite a la reflexion. Pregunta guia para activar el interes.',
    desarrollo: 'Comprension lectora, analisis de textos, produccion escrita u oral. Trabajo colaborativo con intercambio de ideas y retroalimentacion entre pares.',
    cierre: 'Metacognicion: que aprendi y como puedo aplicarlo. Ticket de salida con una pregunta breve o reflexion personal.',
  },
  matematica: {
    inicio: 'Problema contextualizado vinculado a la vida real del estudiante. Exploracion inicial con vật liệu concreto o situacion cotidiana.',
    desarrollo: 'Modelamiento matematico, practica guiada con ejemplos progresivos, aplicacion a situaciones nuevas. Trabajo en parejas o individual.',
    cierre: 'Estrategia matematica usada, error frecuente identificado y como evitarlo. Ticket de salida con un problema breve.',
  },
  'ciencias': {
    inicio: 'Pregunta investigable que despierte curiosidad. Observacion de un fenomeno, experimento breve o situacion del entorno.',
    desarrollo: 'Exploracion guiada, observacion sistematica, recoleccion de evidencias, discusion en grupo sobre hallazgos.',
    cierre: 'Conclusion con evidencia. Reflexion sobre lo observado y como se conecta con el objetivo de la clase.',
  },
  historia: {
    inicio: 'Activacion con imagen historica, fuente primaria o pregunta que conecte con el contexto chileno o universal.',
    desarrollo: 'Analisis de fuente historica, comparacion de perspectivas, construccion de linea de tiempo o debate guiado.',
    cierre: 'Reflexion ciudadana: que nos ensena la historia sobre nuestra responsabilidad actual. Ticket de salida con opinion fundamentada.',
  },
  ingles: {
    inicio: 'Warm-up con vocabulario visual, cancion breve o situacion comunicativa que active el tema de la clase.',
    desarrollo: 'Practica oral y escrita con enfoque comunicativo. Actividades de comprension, produccion e interaccion guiadas.',
    cierre: 'Produccion breve: oracion, dialogo o escrito corto usando el vocabulario y estructuras trabajadas.',
  },
};

function getSubjectTemplate(subjectId: string, courseName: string) {
  const norm = (subjectId || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, tpl] of Object.entries(SUBJECT_TEMPLATES)) {
    if (norm.includes(key) || (courseName || '').toLowerCase().includes(key)) return tpl;
  }
  return SUBJECT_TEMPLATES['comunicacion-integral'];
}

export function buildActividadesClase(ctx: JsonRecord, lesson: JsonRecord, plan: JsonRecord, instructions?: string) {
  const objective = ctx.objective as JsonRecord;
  const hasRealOA = objective?.code && objective.code !== 'OA pendiente';
  const subjectId = String(ctx.subject_id || lesson.subject_id || '');
  const courseName = String(lesson.course_name || '');
  const lessonTitle = String(lesson.title || 'Clase');
  const tpl = getSubjectTemplate(subjectId, courseName);

  const oaNote = hasRealOA
    ? `OA: ${objective.code} - ${objective.official_text}`
    : 'Sin OA explicito. El docente debe seleccionar y ajustar el OA del Curriculum Nacional.';

  const instruccionExtra = instructions ? `\nInstrucciones adicionales del docente: ${instructions}` : '';

  const objetivoEspecifico = hasRealOA
    ? `Que los estudiantes demuestren comprension y aplicacion del ${objective.code}: ${objective.official_text}`
    : `Que los estudiantes demuestren comprension y aplicacion de los aprendizajes propios de ${courseName || 'la asignatura'} en el contexto de la clase "${lessonTitle}". ${oaNote}`;

  const proposito = hasRealOA
    ? `Fortalecer las competencias asociadas al ${objective.code} mediante actividades significativas que conecten con la realidad de los estudiantes.${instruccionExtra}`
    : `Fortalecer las competencias de ${courseName} mediante actividades significativas que conecten con la realidad de los estudiantes.${instruccionExtra}`;

  const inicio = `Momento de activacion:\n${tpl.inicio}${instruccionExtra ? '\n' + instruccionExtra : ''}`;

  const desarrollo = `Momento de construccion:\n${tpl.desarrollo}${instruccionExtra ? '\n' + instruccionExtra : ''}`;

  const cierre = `Momento de cierre:\n${tpl.cierre}${instruccionExtra ? '\n' + instruccionExtra : ''}`;

  const actividadesEstudiantes = [
    { nombre: 'Activacion', momento: 'inicio', duracion: '10-15 min', modalidad: 'curso completo', instruccionesEstudiantes: tpl.inicio, rolDocente: 'Facilitar la situacion motivadora y guiar la reflexion inicial.', evidenciaEsperada: 'Participacion activa y formulacion de preguntas o hipotesis.' },
    { nombre: 'Trabajo principal', momento: 'desarrollo', duracion: '25-35 min', modalidad: 'parejas', instruccionesEstudiantes: tpl.desarrollo, rolDocente: 'Observar, orientar y retroalimentar durante la actividad.', evidenciaEsperada: 'Producto observable: escrito, oral, diagrama o resolucion de problema.' },
    { nombre: 'Cierre', momento: 'cierre', duracion: '10-15 min', modalidad: 'curso completo', instruccionesEstudiantes: tpl.cierre, rolDocente: 'Guiar la metacognicion y recoger evidencias.', evidenciaEsperada: 'Ticket de salida o reflexion escrita individual.' },
  ];

  const evaluacionFormativa = hasRealOA
    ? `Evaluacion formativa durante la clase:\n- Observacion directa de participacion y comprension\n- Productos escritos o orales durante el desarrollo\n- Retroalimentacion entre pares\n- Ticket de salida para verificar aprendizajes clave del ${objective.code}`
    : `Evaluacion formativa durante la clase:\n- Observacion directa de participacion y comprension\n- Productos escritos o orales durante el desarrollo\n- Retroalimentacion entre pares\n- Ticket de salida para verificar aprendizajes clave`;

  const ticketSalida = hasRealOA
    ? `Ticket de salida (${objective.code}):\n1. Que aprendi hoy sobre este objetivo?\n2. En que situacion puedo aplicar lo aprendido?\n3. Que me falta por aprender o practicar?`
    : 'Ticket de salida:\n1. Que aprendi hoy?\n2. En que situacion puedo aplicar lo aprendido?\n3. Que me falta por aprender o practicar?';

  const recursosMateriales = [
    'Cuaderno o ficha de trabajo del estudiante',
    'Textos, imagenes o materiales visuales segun la actividad',
    'Pizarron o papelógrafo para modelamiento',
    hasRealOA ? `Referente al ${objective.code} para orientar la actividad` : 'Referente curricular para orientar la actividad (seleccionar OA)',
  ];

  const adecuacionesDUA = 'Representacion: ofrecer la informacion en multiples formatos (texto, audio, visual). Accion y expresion: permitir diversas formas de demostrar el aprendizaje (escrito, oral, grafico). Implicacion: conectar con intereses y experiencias de los estudiantes. Fornecer apoyos visuales y estructurados.';

  const apoyoDescendidos = 'Trabajo en grupos heterogeneos con apoyo de pares avanzados. Instrucciones paso a paso con ejemplos concretos. Tiempo adicional si es necesario. Fichas de apoyo con vocabulario clave y estructuras guia. Retroalimentacion individual positiva y formativa.';

  const extensionAvanzados = 'Actividades de profundizacion: problemas de mayor complejidad, proyectos de investigacion breve, rol de tutores de pares, creacion de material didactico para el curso. Desafios que conecten con situaciones reales del entorno.';

  const content = [
    oaNote,
    `Curso: ${courseName} | Duracion: ${lesson.start_time || ''}-${lesson.end_time || ''}`,
    `Objetivo: ${objetivoEspecifico.substring(0, 120)}...`,
    `Inicio: ${tpl.inicio.substring(0, 100)}...`,
    `Desarrollo: ${tpl.desarrollo.substring(0, 100)}...`,
    `Cierre: ${tpl.cierre.substring(0, 100)}...`,
    !hasRealOA ? 'Nota: Actividades generadas sin OA explícito. Puedes seleccionar un OA después para ajustar la alineacion curricular.' : '',
  ].filter(Boolean);

  return {
    title: `Actividades de clase - ${lessonTitle}`,
    action: 'actividades_clase',
    kind: 'actividades',
    generatedAt: nowIso(),
    chileContext: true,
    hasOA: hasRealOA,
    lesson: { title: lessonTitle, date: lesson.lesson_date, course: courseName, subject: subjectId },
    curriculum: {
      level: ctx.level_id, subject: ctx.subject_id, axis: ctx.axis_id,
      objectiveCode: objective?.code, objectiveText: objective?.official_text,
    },
    actividadesClase: {
      objetivoEspecifico,
      proposito,
      inicio,
      desarrollo,
      cierre,
      actividadesEstudiantes,
      evaluacionFormativa,
      ticketSalida,
      recursosMateriales,
      adecuacionesDUA,
      apoyoEstudiantesDescendidos: apoyoDescendidos,
      extensionAvanzados,
    },
    content,
    teacherEditable: true,
  };
}
