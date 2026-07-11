interface Env { DB: D1Database }

interface BitacoraCientificaRequest {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  topic: string;
  additionalContext?: string;
  methodology?: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as BitacoraCientificaRequest;

    if (!body.level || !body.subject || !body.objectiveCode) {
      return Response.json({ error: 'level, subject y objectiveCode son requeridos' }, { status: 400 });
    }

    const db = context.env.DB;
    const objective = await db.prepare(
      `SELECT o.*, c.name as course_name, s.name as subject_name FROM objectives o LEFT JOIN courses c ON o.course_id = c.id LEFT JOIN subjects s ON o.subject_id = s.id WHERE o.code = ?`
    ).bind(body.objectiveCode).first();

    const indicators = await db.prepare(
      `SELECT ci.indicator_text FROM curriculum_indicators ci WHERE ci.oa_code = ? LIMIT 10`
    ).bind(body.objectiveCode).all();

    const evaluation = buildBitacoraCientifica(body, objective as any, (indicators as any)?.results || []);

    const resourceId = `bitacora_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(
      `INSERT INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, indicators_used_json, skills_used_json, prompt_used, created_at, updated_at)
       VALUES (?, ?, 'evaluacion', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      resourceId,
      `Bitácora Científica IA: ${body.objectiveCode}`,
      JSON.stringify(evaluation),
      JSON.stringify({ type: 'bitacora_cientifica', evaluationSubType: 'bitacora_cientifica' }),
      body.level,
      body.subject,
      body.objectiveCode,
      JSON.stringify(body.indicators || []),
      JSON.stringify(body.skills || []),
      `Bitácora Científica IA generada para ${body.objectiveCode}`
    ).run();

    return Response.json({ ok: true, resourceId, evaluation, context: { objective, indicators: (indicators as any)?.results || [] } });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar bitácora científica', details: err.message }, { status: 500 });
  }
}

function buildBitacoraCientifica(req: BitacoraCientificaRequest, objective: any, indicators: any[]): any {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;
  const isPrebasica = req.level.toLowerCase().includes('prebásica') || req.level.toLowerCase().includes('pre-básica') || req.level.toLowerCase().includes('prekinder') || req.level.toLowerCase().includes('pre-kinder') || req.level.toLowerCase().includes('kinder') || req.level.toLowerCase().includes('sala cuna') || req.level.toLowerCase().includes('sala cuna');
  const isBasica1a6 = req.level.toLowerCase().includes('1°') || req.level.toLowerCase().includes('2°') || req.level.toLowerCase().includes('3°') || req.level.toLowerCase().includes('4°') || req.level.toLowerCase().includes('5°') || req.level.toLowerCase().includes('6°') || req.level.toLowerCase().includes('1° basico') || req.level.toLowerCase().includes('2° basico') || req.level.toLowerCase().includes('3° basico') || req.level.toLowerCase().includes('4° basico') || req.level.toLowerCase().includes('5° basico') || req.level.toLowerCase().includes('6° basico');
  const isBasica7y8 = req.level.toLowerCase().includes('7°') || req.level.toLowerCase().includes('8°') || req.level.toLowerCase().includes('7° basico') || req.level.toLowerCase().includes('8° basico');
  const isMedia = req.level.toLowerCase().includes('medio') || req.level.toLowerCase().includes('1° medio') || req.level.toLowerCase().includes('2° medio') || req.level.toLowerCase().includes('3° medio') || req.level.toLowerCase().includes('4° medio');

  let modelo = '';
  let estructura = [];

  if (isPrebasica) {
    modelo = 'PREBÁSICA';
    estructura = [
      { titulo: 'Exploración Sensorial', descripcion: 'Actividades para explorar con los sentidos', campos: ['Objetivo sensorial', 'Materiales', 'Descripción de la actividad', 'Observaciones del niño/a'] },
      { titulo: 'Dibujo y Expresión Gráfica', descripcion: 'Representación gráfica de lo observado', campos: ['Tema del dibujo', 'Materiales utilizados', 'Descripción del niño/a', 'Interpretación docente'] },
      { titulo: 'Observación Dirigida', descripcion: 'Guía de observación para niños pequeños', campos: ['Qué observamos', 'Cómo reacciona el niño/a', 'Qué pregunta el docente', 'Registro fotográfico/dibujo'] },
      { titulo: 'Preguntas Guiadas', descripcion: 'Preguntas abiertas para estimular la curiosidad', campos: ['Pregunta guía', 'Respuesta del niño/a', 'Nueva pregunta emergente'] },
      { titulo: 'Registro del Docente', descripcion: 'Observaciones y anotaciones del educador', campos: ['Conducta observada', 'Interacciones', 'Logros', 'Próximos pasos'] },
      { titulo: 'Pictogramas de Apoyo', descripcion: 'Apoyos visuales para la comprensión', campos: ['Secuencia de pasos', 'Materiales con pictogramas', 'Reglas de seguridad visuales'] }
    ];
  } else if (isBasica1a6) {
    modelo = '1° A 6° BÁSICO';
    estructura = [
      { titulo: 'Pregunta de Investigación', descripcion: 'La pregunta que guía la indagación', campos: ['Pregunta principal', 'Por qué es importante', 'Qué esperamos descubrir'] },
      { titulo: 'Hipótesis', descripcion: 'Nuestra predicción fundamentada', campos: ['Mi predicción', 'Por qué creo esto', 'Qué evidencia buscaré'] },
      { titulo: 'Materiales', descripcion: 'Lista de materiales necesarios', campos: ['Material', 'Cantidad', 'Fuente/Proveedor', 'Medida de seguridad'] },
      { titulo: 'Procedimiento', descripcion: 'Pasos detallados del experimento', campos: ['Paso número', 'Acción', 'Qué observar', 'Registro de datos'] },
      { titulo: 'Observaciones y Registro de Datos', descripcion: 'Registro sistemático de lo observado', campos: ['Tabla de datos', 'Dibujos/Esquemas', 'Mediciones', 'Fotografías'] },
      { titulo: 'Conclusión', descripcion: 'Respuesta a la pregunta de investigación', campos: ['¿Se cumplió la hipótesis?', 'Evidencia que lo respalda', 'Qué aprendí', 'Qué haría diferente'] },
      { titulo: 'Reflexión', descripcion: 'Pensamiento metacognitivo sobre el proceso', campos: ['Qué fue lo más difícil', 'Qué disfruté más', 'Qué nueva pregunta tengo', 'Cómo se relaciona con mi vida'] }
    ];
  } else if (isBasica7y8) {
    modelo = '7° Y 8° BÁSICO';
    estructura = [
      { titulo: 'Método Científico', descripcion: 'Aplicación estructurada del método científico', campos: ['Problema', 'Investigación previa', 'Hipótesis', 'Variables (independiente, dependiente, control)', 'Diseño experimental'] },
      { titulo: 'Variables', descripcion: 'Identificación y control de variables', campos: ['Variable independiente', 'Variable dependiente', 'Variables de control', 'Cómo se miden'] },
      { titulo: 'Tabla de Datos', descripcion: 'Registro organizado de mediciones', campos: ['Variables', 'Unidades', 'Repeticiones', 'Promedios', 'Incertidumbres'] },
      { titulo: 'Resultados', descripcion: 'Presentación y análisis de datos', campos: ['Gráficos', 'Tendencias', 'Anomalías', 'Análisis estadístico básico'] },
      { titulo: 'Análisis', descripcion: 'Interpretación de resultados', campos: ['¿Qué muestran los datos?', '¿Apoyan la hipótesis?', 'Errores posibles', 'Limitaciones'] },
      { titulo: 'Nuevas Preguntas', descripcion: 'Extensión de la indagación', campos: ['Nueva hipótesis', 'Nuevo experimento', 'Aplicación en otro contexto'] }
    ];
  } else {
    modelo = 'ENSEÑANZA MEDIA';
    estructura = [
      { titulo: 'Informe Científico', descripcion: 'Estructura formal de comunicación científica', campos: ['Título', 'Autor/es', 'Fecha', 'Curso', 'Docente'] },
      { titulo: 'Marco Teórico', descripcion: 'Fundamentación bibliográfica', campos: ['Conceptos clave', 'Teorías relevantes', 'Investigaciones previas', 'Referencias bibliográficas (APA)'] },
      { titulo: 'Hipótesis', descripcion: 'Predicción fundamentada y comprobable', campos: ['Hipótesis nula', 'Hipótesis alternativa', 'Justificación teórica', 'Variables operacionalizadas'] },
      { titulo: 'Variables', descripcion: 'Definición operacional de variables', campos: ['Independiente', 'Dependiente', 'De control', 'Extranas', 'De medición'] },
      { titulo: 'Metodología', descripcion: 'Diseño experimental detallado', campos: ['Diseño experimental', 'Población/Muestra', 'Instrumentos', 'Procedimiento paso a paso', 'Ética y seguridad'] },
      { titulo: 'Resultados', descripcion: 'Presentación objetiva de datos', campos: ['Tablas', 'Gráficos', 'Estadísticas descriptivas', 'Pruebas estadísticas', 'Figuras'] },
      { titulo: 'Discusión', descripcion: 'Interpretación y análisis crítico', campos: ['Interpretación de resultados', 'Comparación con literatura', 'Limitaciones', 'Implicancias', 'Nuevas hipótesis'] },
      { titulo: 'Conclusión', descripcion: 'Síntesis final y respuesta a la hipótesis', campos: ['Respuesta a la hipótesis', 'Aportes', 'Recomendaciones', 'Trabajo futuro'] },
      { titulo: 'Bibliografía', descripcion: 'Referencias en formato APA 7ma edición', campos: ['Artículos', 'Libros', 'Fuentes web', 'Normas APA 7ma'] }
    ];
  }

  const indText = indicators.map((i: any) => i.indicator_text).filter(Boolean).slice(0, 5);

  return {
    title: `Bitácora Científica IA: ${req.objectiveCode}`,
    subtitle: `${ctx} — ${subj}`,
    objective: req.objectiveText,
    type: 'bitacora_cientifica',
    modelo,
    estructura,
    indicadores: indText.slice(0, 5),
    skills: req.skills || [],
    topic: req.topic,
    additionalContext: req.additionalContext,
    methodology: req.methodology,
    premiumExtras: {
      fotografias: true,
      dibujos: true,
      audio: true,
      video: true,
      tablas: true,
      graficos: true,
      evidencias: true,
      exportPDF: true,
      exportWord: true,
      exportPowerPoint: true
    },
    portfolio: {
      autoSave: true,
      associateClass: true,
      associateOA: true,
      associateTeacher: true,
      editable: true,
      exportable: ['PDF', 'Word', 'PowerPoint']
    },
    safetyMeasures: [
      'Uso obligatorio de elementos de protección personal (EPP) según actividad',
      'Supervisión docente constante durante manipulación de materiales',
      'Identificación previa de alergias y condiciones médicas',
      'Protocolo de emergencia y botiquín disponible',
      'Manipulación segura de sustancias químicas (si aplica)',
      'Manejo adecuado de residuos según normativa'
    ],
    teacherNotes: `Bitácora generada para nivel ${modelo}. Incluye estructura adaptada al nivel educativo, indicadores de logro alineados al OA ${req.objectiveCode}, y todos los componentes solicitados para una indagación científica rigurosa.    
Materiales y procedimiento generados considerando el nivel ${req.level} y asignatura ${req.subject}.
Medidas de seguridad incluidas según nivel educativo y tipo de actividad.`
  };
}