interface Env { DB: D1Database }

interface RubricRequest {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  topic: string;
  additionalContext?: string;
  criteria?: string[];
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as RubricRequest;

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

    const indText = ((indicators as any)?.results || [])
      .map((i: any) => i.indicator_text)
      .filter(Boolean)
      .slice(0, 5);

    const oaText = body.objectiveText || body.topic || '';
    const nivel = (objective as any)?.course_name || body.level;
    const asignatura = (objective as any)?.subject_name || body.subject;
    const topic = body.topic || truncate(oaText, 60);

    const rubric = buildPremiumRubric({
      level: nivel,
      subject: asignatura,
      objectiveCode: body.objectiveCode,
      objectiveText: oaText,
      topic,
      indicators: [...(body.indicators || []), ...indText],
      skills: body.skills || [],
    });

    const resourceId = `rubric_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(
      `INSERT INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, indicators_used_json, prompt_used, created_at, updated_at)
       VALUES (?, ?, 'rubrica', ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      resourceId,
      rubric.title,
      JSON.stringify(rubric),
      JSON.stringify({}),
      nivel,
      asignatura,
      body.objectiveCode,
      JSON.stringify(body.indicators || []),
      `Rúbrica premium generada para ${body.objectiveCode}`
    ).run();

    return Response.json({ ok: true, resourceId, rubric });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar rúbrica', details: err.message }, { status: 500 });
  }
}

function truncate(text: string, max: number): string {
  if (!text || text.length <= max) return text || '';
  const sliced = text.slice(0, max - 3);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > max * 0.5) return sliced.slice(0, lastSpace).trim() + '...';
  return sliced.trim() + '...';
}

function isLowerLevel(level: string): boolean {
  const lower = level.toLowerCase();
  const isBasic = lower.includes('básico') || lower.includes('basico') || lower.endsWith('b');
  return lower.includes('sala cuna') || lower.includes('transición') ||
    (isBasic && (lower.includes('1°') || lower.includes('2°') || lower.includes('3°') || lower.includes('4°'))) ||
    lower.includes('1b') || lower.includes('2b') || lower.includes('3b') || lower.includes('4b');
}

function detectSubjectCategory(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes('ciencias') || s.includes('natural')) return 'ciencias';
  if (s.includes('lenguaje') || s.includes('comunicación') || s.includes('comunicacion') || s.includes('castellano')) return 'lenguaje';
  if (s.includes('matemática') || s.includes('matematica') || s.includes('mate')) return 'matematica';
  if (s.includes('historia') || s.includes('geografía') || s.includes('geografia') || s.includes('sociales')) return 'historia';
  if (s.includes('arte') || s.includes('visual') || s.includes('música') || s.includes('musica')) return 'artes';
  return 'general';
}

const STOPWORDS = new Set([
  'para', 'como', 'entre', 'sobre', 'desde', 'hacia', 'otras', 'otros', 'otro',
  'esta', 'este', 'estos', 'estas', 'todo', 'toda', 'todos', 'todas', 'cada',
  'cuando', 'donde', 'puede', 'pueden', 'debe', 'deben', 'tiene', 'tienen',
  'hace', 'hacer', 'sido', 'mostrar', 'reconocer', 'describir', 'identificar',
  'comparar', 'analizar', 'explicar', 'desarrollar', 'observar', 'relacionar',
  'clasificar', 'ordenar', 'medir', 'estimar', 'calcular', 'resolver',
  'interpretar', 'evaluar', 'crear', 'disenar', 'proponer', 'argumentar',
  'comunicar', 'expresar', 'participar', 'colaborar', 'demostrar', 'aplicar',
  'construir', 'transformar', 'conocer', 'comprender', 'aprender', 'fomentar',
  'promover', 'fortalecer', 'integrar', 'vincular', 'conectar', 'asociar',
  'diferenciar', 'agrupar', 'categorizar', 'jerarquizar', 'organizar',
  'estructurar', 'sintetizar', 'generalizar', 'inferir', 'deducir', 'inducir',
  'predecir', 'experimentar', 'investigar', 'explorar', 'descubrir',
  'reflexionar', 'comprension', 'aprendizaje', 'desarrollo', 'proceso',
  'producto', 'resultado', 'evidencia', 'indicador', 'criterio', 'nivel',
  'logro', 'desempeno', 'competencia', 'habilidad', 'destreza', 'capacidad',
  'actitud', 'valor', 'norma', 'regla', 'principio', 'concepto', 'grupo',
  'clase', 'tipo', 'especie', 'organismo', 'ecosistema', 'ambiente',
  'poblacion', 'comunidad', 'cadena', 'ciclo', 'nutriente', 'energia',
  'materia', 'transformacion', 'cambio', 'equilibrio', 'interaccion',
  'relacion', 'dependencia', 'adaptacion', 'evolucion', 'seleccion',
  'variacion', 'herencia', 'genetica', 'celular', 'membrana', 'celula',
  'tejido', 'organo', 'sistema', 'bacterias',
  'raiz', 'tallo', 'hoja', 'fotosintesis', 'respiracion',
  'incluyendo', 'incluye', 'incluir', 'describe', 'comprender',
  'conocer', 'aplicar', 'usar', 'utilizar', 'realizar', 'desarrollar',
  'trabajar', 'actividad', 'actividades', 'estudiantes', 'alumnos',
  'curso', 'clase', 'sesion', 'leccion', 'unidad', 'plan',
  'basico', 'medio', 'inicial', 'transicion', 'sala', 'cuna',
]);

function extractConcepts(oaText: string): string[] {
  const words = oaText.toLowerCase()
    .replace(/[,;.:!?()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4 && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, 8);
}

function detectKeywords(oaText: string): string[] {
  const lower = oaText.toLowerCase();
  const kw: string[] = [];
  if (lower.includes('planta') || lower.includes('flor') || lower.includes('semilla') || lower.includes('germinación') || lower.includes('germinacion')) kw.push('plantas');
  if (lower.includes('animal') || lower.includes('alimentación') || lower.includes('habitat')) kw.push('animales');
  if (lower.includes('ciclo de vida')) kw.push('ciclo_de_vida');
  if (lower.includes('ecosistema') || lower.includes('ambiente')) kw.push('ecosistema');
  if (lower.includes('texto') || lower.includes('lectura') || lower.includes('comprensión')) kw.push('texto');
  if (lower.includes('número') || lower.includes('numero') || lower.includes('operación') || lower.includes('suma') || lower.includes('resta')) kw.push('operaciones');
  if (lower.includes('geometría') || lower.includes('figura')) kw.push('geometria');
  if (lower.includes('histórico') || lower.includes('época') || lower.includes('periodo')) kw.push('historia');
  if (lower.includes('expresión') || lower.includes('creatividad') || lower.includes('obra')) kw.push('expresion');
  if (lower.includes('argument') || lower.includes('opinión')) kw.push('argumentacion');
  return kw;
}

type RubricLevel = { id: string; label: string; score: number; color: string; description: string };
type RubricIndicator = { levelId: string; descriptor: string; evidence: string; feedbackSuggestion: string };
type RubricCriterion = { id: string; name: string; description: string; weight: number; indicators: RubricIndicator[] };

type PremiumRubric = {
  title: string; subtitle: string; nivel: string; asignatura: string; oa: string; tema: string;
  learningGoal: string; studentFriendlyGoal: string;
  levels: RubricLevel[]; criteria: RubricCriterion[];
  totalScore: number; scoringFormula: string;
  usageInstructions: string[]; inclusiveAdjustments: string[];
  formativeFeedbackQuestions: string[];
  studentSelfAssessment: { title: string; prompts: string[] };
};

const LEVELS: RubricLevel[] = [
  { id: 'avanzado', label: 'Avanzado', score: 4, color: '#059669', description: 'Demuestra dominio superior del criterio evaluado' },
  { id: 'adecuado', label: 'Adecuado', score: 3, color: '#2563EB', description: 'Cumple satisfactoriamente con el criterio' },
  { id: 'en_desarrollo', label: 'En desarrollo', score: 2, color: '#D97706', description: 'Muestra progreso pero necesita apoyo' },
  { id: 'inicial', label: 'Inicial', score: 1, color: '#DC2626', description: 'Requiere acompañamiento significativo' },
];

function buildCienciasCriteria(keywords: string[], mainConcept: string): RubricCriterion[] {
  const isPlants = keywords.includes('plantas') || keywords.includes('ciclo_de_vida');
  const isAnimals = keywords.includes('animales');
  const base: RubricCriterion[] = [
    {
      id: 'c1', name: 'Observación y descripción de fenómenos',
      description: `Observa y describe con precisión elementos de ${mainConcept}`, weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: `Identifica y describe detalles específicos de ${mainConcept}, usando vocabulario científico pertinente`, evidence: 'Registro escrito o dibujo con etiquetas correctas', feedbackSuggestion: 'Excelente observación. Lograste identificar detalles que muchos pasan por alto.' },
        { levelId: 'adecuado', descriptor: `Describe características principales de ${mainConcept} y menciona algunos detalles relevantes`, evidence: 'Lista de características con al menos 3 elementos correctos', feedbackSuggestion: 'Buen trabajo observando. Intenta agregar más detalles.' },
        { levelId: 'en_desarrollo', descriptor: `Reconoce algunos elementos de ${mainConcept} pero necesita apoyo para describirlos`, evidence: 'Identificación parcial con apoyo de imágenes', feedbackSuggestion: 'Estás en el camino correcto. Compara tu observación con la de un compañero.' },
        { levelId: 'inicial', descriptor: `Requiere apoyo directo para identificar y nombrar elementos de ${mainConcept}`, evidence: 'Señalamiento con apoyo del docente', feedbackSuggestion: 'Vamos a observar juntos. ¿Qué puedes ver?' },
      ],
    },
    {
      id: 'c2', name: 'Uso de vocabulario científico',
      description: `Utiliza términos científicos para explicar ${mainConcept}`, weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: `Emplea vocabulario científico preciso y puede explicar el significado de cada término`, evidence: 'Explicación donde usa y define al menos 3 términos', feedbackSuggestion: 'Domina el vocabulario científico.' },
        { levelId: 'adecuado', descriptor: `Utiliza algunos términos científicos correctamente`, evidence: 'Uso correcto de al menos 2 términos en contexto', feedbackSuggestion: 'Buen uso del vocabulario. Intenta usar más términos.' },
        { levelId: 'en_desarrollo', descriptor: `Reconoce algunos términos pero requiere apoyo para usarlos`, evidence: 'Uso guiado de términos con banco de palabras', feedbackSuggestion: 'Estás aprendiendo las palabras clave.' },
        { levelId: 'inicial', descriptor: `Presenta dificultades para usar vocabulario científico`, evidence: 'Señalamiento de imágenes asociadas a términos', feedbackSuggestion: 'Vamos a jugar a emparejar palabras con imágenes.' },
      ],
    },
    {
      id: 'c3', name: 'Explicación de relaciones o procesos',
      description: `Explica cómo se relacionan los elementos de ${mainConcept}`, weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: `Explica con claridad relaciones causa-efecto y procesos de ${mainConcept}`, evidence: 'Diagrama de flujo o explicación oral estructurada', feedbackSuggestion: 'Excelente capacidad de explicar procesos.' },
        { levelId: 'adecuado', descriptor: `Identifica relaciones y explica algunos procesos de ${mainConcept}`, evidence: 'Lista de relaciones con ejemplos', feedbackSuggestion: 'Logras ver las conexiones.' },
        { levelId: 'en_desarrollo', descriptor: `Reconoce algunas relaciones pero necesita apoyo para explicar procesos`, evidence: 'Completar organizador gráfico con apoyo', feedbackSuggestion: 'Estás construyendo tu entendimiento.' },
        { levelId: 'inicial', descriptor: `Requiere acompañamiento para identificar relaciones`, evidence: 'Señalamiento de relaciones con guía directa', feedbackSuggestion: 'Observemos juntos: ¿qué conecta a estos elementos?' },
      ],
    },
    {
      id: 'c4', name: 'Comunicación de conclusiones',
      description: `Comunica sus hallazgos y conclusiones con claridad`, weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: `Comunica conclusiones propias basadas en evidencias, usando vocabulario científico`, evidence: 'Presentación o informe con conclusiones fundamentadas', feedbackSuggestion: 'Comunica como un verdadero científico.' },
        { levelId: 'adecuado', descriptor: `Presenta conclusiones claras basadas en lo observado`, evidence: 'Exposición breve con al menos 2 conclusiones', feedbackSuggestion: 'Buenas conclusiones.' },
        { levelId: 'en_desarrollo', descriptor: `Expresa algunas ideas pero necesita apoyo para formular conclusiones`, evidence: 'Respuesta oral guiada o completar oraciones', feedbackSuggestion: 'Tienes buenas ideas.' },
        { levelId: 'inicial', descriptor: `Requiere apoyo directo para expresar conclusiones`, evidence: 'Señalamiento de imágenes que representan la conclusión', feedbackSuggestion: '¿Qué fue lo más importante que viste?' },
      ],
    },
  ];
  if (isPlants) { base[0].name = 'Observación de partes y ciclo de vida'; }
  if (isAnimals) { base[0].name = 'Observación de características y hábitat'; }
  return base;
}

function buildLenguajeCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Comprensión del texto', description: 'Comprende el mensaje, estructura e ideas del texto', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Identifica la idea principal, ideas secundarias y la intención del autor', evidence: 'Mapa conceptual o resumen con jerarquía de ideas', feedbackSuggestion: 'Excelente comprensión.' },
        { levelId: 'adecuado', descriptor: 'Identifica la idea principal y al menos 2 ideas secundarias', evidence: 'Resumen con ideas principales identificadas', feedbackSuggestion: 'Bien identificaste las ideas clave.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce la idea general pero tiene dificultad para detalles', evidence: 'Selección de oraciones con apoyo visual', feedbackSuggestion: 'Estás en buen camino.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para identificar la idea principal', evidence: 'Lectura guiada con preguntas', feedbackSuggestion: 'Vamos a leer juntos.' },
      ],
    },
    {
      id: 'c2', name: 'Organización de ideas', description: 'Organiza sus ideas de forma lógica', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Estructura sus ideas con introducción, desarrollo y cierre', evidence: 'Texto con estructura clara y conectores', feedbackSuggestion: 'Tu texto tiene una estructura excelente.' },
        { levelId: 'adecuado', descriptor: 'Presenta ideas en orden lógico con algunos conectores', evidence: 'Texto con al menos 2 párrafos', feedbackSuggestion: 'Organizaste bien tus ideas.' },
        { levelId: 'en_desarrollo', descriptor: 'Expresa ideas pero sin un orden claro', evidence: 'Lista de ideas sin estructura de párrafo', feedbackSuggestion: 'Tienes buenas ideas. Intenta ordenarlas.' },
        { levelId: 'inicial', descriptor: 'Requiere plantilla para organizar sus ideas', evidence: 'Completar organizador gráfico', feedbackSuggestion: 'Usa esta plantilla para ordenar tus ideas.' },
      ],
    },
    {
      id: 'c3', name: 'Uso de evidencia textual', description: 'Cita y utiliza partes del texto para respaldar sus ideas', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Cita textualmente fragmentos relevantes y los integra coherentemente', evidence: 'Citas textuales correctas entre comillas', feedbackSuggestion: 'Excelente uso de evidencia textual.' },
        { levelId: 'adecuado', descriptor: 'Menciona o parafrasea partes del texto como evidencia', evidence: 'Referencia a fragmentos con paráfrasis', feedbackSuggestion: 'Bien usas el texto como apoyo.' },
        { levelId: 'en_desarrollo', descriptor: 'Indica que algo está en el texto pero no logra citarlo', evidence: 'Referencia vaga al texto', feedbackSuggestion: 'Para mejorar, busca la frase exacta.' },
        { levelId: 'inicial', descriptor: 'No logra identificar evidencias sin apoyo', evidence: 'Selección guiada de fragmentos', feedbackSuggestion: 'Vamos a buscar juntos las frases.' },
      ],
    },
    {
      id: 'c4', name: 'Expresión oral o escrita', description: 'Expresa sus ideas con claridad y vocabulario adecuado', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Se expresa con claridad, vocabulario preciso y estructura adecuada', evidence: 'Exposición fluida o texto sin errores graves', feedbackSuggestion: 'Tu expresión es clara y precisa.' },
        { levelId: 'adecuado', descriptor: 'Se expresa de forma comprensible con vocabulario adecuado', evidence: 'Exposición breve o texto comprensible', feedbackSuggestion: 'Te expresaste bien.' },
        { levelId: 'en_desarrollo', descriptor: 'Expresa ideas simples con vocabulario limitado', evidence: 'Oraciones simples con apoyo visual', feedbackSuggestion: 'Estás mejorando tu expresión.' },
        { levelId: 'inicial', descriptor: 'Requiere apoyo para expresar ideas en oraciones simples', evidence: 'Completar oraciones con ayuda', feedbackSuggestion: 'Vamos a construir juntos una oración.' },
      ],
    },
    {
      id: 'c5', name: 'Claridad y coherencia', description: 'Mantiene coherencia temática y claridad', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Mantiene hilo conductor claro y adapta el registro al contexto', evidence: 'Texto con hilo conductor claro', feedbackSuggestion: 'Tu comunicación es coherente y clara.' },
        { levelId: 'adecuado', descriptor: 'Mantiene la coherencia general con algunas digresiones', evidence: 'Texto comprensible con idea central clara', feedbackSuggestion: 'Mantuviste la coherencia.' },
        { levelId: 'en_desarrollo', descriptor: 'Presenta ideas relacionadas pero con dificultad para mantener hilo', evidence: 'Texto con ideas conectadas débilmente', feedbackSuggestion: 'Tus ideas están relacionadas.' },
        { levelId: 'inicial', descriptor: 'Sus expresiones son aisladas y necesitan apoyo', evidence: 'Oraciones simples con apoyo', feedbackSuggestion: 'Vamos a conectar tus ideas.' },
      ],
    },
  ];
}

function buildMatematicaCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Comprensión del problema', description: 'Identifica datos, incógnitas y relaciones', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Identifica todos los datos, la incógnita y las relaciones matemáticas', evidence: 'Lista de datos, incógnita y relaciones', feedbackSuggestion: 'Identificaste todo lo necesario.' },
        { levelId: 'adecuado', descriptor: 'Identifica los datos principales y la incógnita', evidence: 'Extracción de datos y pregunta', feedbackSuggestion: 'Bien identificaste los datos.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce algunos datos pero tiene dificultad con la incógnita', evidence: 'Selección parcial de datos', feedbackSuggestion: 'Identificaste algunos datos. ¿Qué buscas?' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para extraer datos del enunciado', evidence: 'Lectura guiada con preguntas', feedbackSuggestion: 'Vamos a subrayar los números.' },
      ],
    },
    {
      id: 'c2', name: 'Estrategia de resolución', description: 'Elige y aplica la estrategia matemática adecuada', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Elige la estrategia más eficiente y la aplica con precisión', evidence: 'Resolución con estrategia clara y justificación', feedbackSuggestion: 'Elegiste la mejor estrategia.' },
        { levelId: 'adecuado', descriptor: 'Elige una estrategia adecuada y resuelve correctamente', evidence: 'Resolución paso a paso con resultado correcto', feedbackSuggestion: 'Resolviste bien.' },
        { levelId: 'en_desarrollo', descriptor: 'Intenta una estrategia pero comete errores', evidence: 'Intento de resolución con errores parciales', feedbackSuggestion: 'Tu estrategia es buena.' },
        { levelId: 'inicial', descriptor: 'Necesita guía para elegir una estrategia', evidence: 'Resolución guiada paso a paso', feedbackSuggestion: 'Vamos a resolver juntos.' },
      ],
    },
    {
      id: 'c3', name: 'Representación matemática', description: 'Usa números, símbolos o modelos para representar', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Representa con múltiples formas y justifica su elección', evidence: 'Representación múltiple y fundamentada', feedbackSuggestion: 'Usaste varias formas para representar.' },
        { levelId: 'adecuado', descriptor: 'Representa con números y operaciones de forma clara', evidence: 'Representación numérica o gráfica correcta', feedbackSuggestion: 'Buena representación.' },
        { levelId: 'en_desarrollo', descriptor: 'Identifica números pero tiene dificultad para organizar', evidence: 'Representación parcial con apoyo', feedbackSuggestion: 'Identificaste los números.' },
        { levelId: 'inicial', descriptor: 'Requiere apoyo para crear representación', evidence: 'Completar plantilla de representación', feedbackSuggestion: 'Usa esta plantilla.' },
      ],
    },
    {
      id: 'c4', name: 'Precisión del cálculo', description: 'Realiza cálculos con precisión y verifica', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Realiza cálculos precisos y verifica con otro método', evidence: 'Resultado verificado y validado', feedbackSuggestion: 'Tu cálculo es preciso y lo verificaste.' },
        { levelId: 'adecuado', descriptor: 'Realiza cálculos correctos y obtiene el resultado esperado', evidence: 'Resultado correcto con procedimiento visible', feedbackSuggestion: 'Cálculo correcto.' },
        { levelId: 'en_desarrollo', descriptor: 'Realiza cálculos con algunos errores', evidence: 'Resultado con errores de cálculo', feedbackSuggestion: 'Tu proceso es bueno. Revisa cada operación.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo significativo para cálculos', evidence: 'Cálculos con calculadora o apoyo', feedbackSuggestion: 'Vamos a practicar los cálculos.' },
      ],
    },
    {
      id: 'c5', name: 'Explicación del procedimiento', description: 'Explica con claridad cómo resolvió el problema', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Explica cada paso y justifica la estrategia elegida', evidence: 'Explicación completa con justificación', feedbackSuggestion: 'Explicas como un verdadero matemático.' },
        { levelId: 'adecuado', descriptor: 'Explica los pasos principales y la estrategia', evidence: 'Descripción de pasos con resultado', feedbackSuggestion: 'Bien explicaste tu proceso.' },
        { levelId: 'en_desarrollo', descriptor: 'Describe algunos pasos pero le cuesta explicar el porqué', evidence: 'Descripción parcial del procedimiento', feedbackSuggestion: 'Estás mejorando.' },
        { levelId: 'inicial', descriptor: 'Requiere apoyo para verbalizar su procedimiento', evidence: 'Explicación con preguntas guía', feedbackSuggestion: 'Vamos a explicar juntos.' },
      ],
    },
  ];
}

function buildHistoriaCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Comprensión del contexto histórico', description: 'Comprende el contexto, actores y período', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Ubica el evento, identifica actores y describe el contexto social, económico y político', evidence: 'Línea de tiempo o mapa conceptual completo', feedbackSuggestion: 'Excelente comprensión del contexto.' },
        { levelId: 'adecuado', descriptor: 'Identifica el período, actores principales y al menos 2 características del contexto', evidence: 'Línea de tiempo con fechas y actores', feedbackSuggestion: 'Bien ubicaste el evento.' },
        { levelId: 'en_desarrollo', descriptor: 'Ubica parcialmente el evento pero tiene dificultad con el contexto', evidence: 'Fechas y actores con apoyo', feedbackSuggestion: 'Estás ubicando el evento.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para ubicar el evento en el tiempo', evidence: 'Selección de fechas con guía', feedbackSuggestion: 'Vamos a ubicar juntos este evento.' },
      ],
    },
    {
      id: 'c2', name: 'Uso de fuentes o evidencias históricas', description: 'Identifica y utiliza fuentes históricas', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Identifica tipos de fuentes, evalúa su confiabilidad y las integra en su análisis', evidence: 'Análisis de fuente con identificación de tipo', feedbackSuggestion: 'Manejas las fuentes como un historiador.' },
        { levelId: 'adecuado', descriptor: 'Identifica al menos 1 fuente histórica y la usa como evidencia', evidence: 'Cita o referencia a una fuente', feedbackSuggestion: 'Bien usaste la fuente.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce que existen fuentes pero tiene dificultad para usarlas', evidence: 'Mención de una fuente sin análisis', feedbackSuggestion: 'Las fuentes son importantes.' },
        { levelId: 'inicial', descriptor: 'Requiere apoyo para identificar fuentes', evidence: 'Selección de fuente con guía', feedbackSuggestion: 'Vamos a identificar qué fuente es.' },
      ],
    },
    {
      id: 'c3', name: 'Explicación de causas y consecuencias', description: 'Identifica causas y consecuencias del evento', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Explica causas profundas y consecuencias a corto y largo plazo', evidence: 'Diagrama de causas y consecuencias', feedbackSuggestion: 'Excelente análisis de causalidad.' },
        { levelId: 'adecuado', descriptor: 'Identifica al menos 2 causas y 2 consecuencias', evidence: 'Lista de causas y consecuencias', feedbackSuggestion: 'Bien identificaste las causas.' },
        { levelId: 'en_desarrollo', descriptor: 'Identifica algunas causas o consecuencias sin explicar la relación', evidence: 'Lista parcial', feedbackSuggestion: 'Estás identificando elementos clave.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para identificar causas y consecuencias', evidence: 'Selección guiada', feedbackSuggestion: 'Vamos a identificar qué pasó y por qué.' },
      ],
    },
    {
      id: 'c4', name: 'Relación con el contexto actual', description: 'Establece relaciones entre el evento y la actualidad', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Establece conexiones significativas con temas actuales', evidence: 'Escrito que conecta pasado y presente', feedbackSuggestion: 'Lograste ver la relevancia histórica.' },
        { levelId: 'adecuado', descriptor: 'Menciona al menos 1 relación con la actualidad', evidence: 'Mención de conexión con tema actual', feedbackSuggestion: 'Bien conectaste con el presente.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce que hay relaciones pero sin explicarlas', evidence: 'Intento de conexión con apoyo', feedbackSuggestion: 'Estás pensando en la relevancia.' },
        { levelId: 'inicial', descriptor: 'Requiere guía para establecer relaciones', evidence: 'Conexión con apoyo del docente', feedbackSuggestion: 'Vamos a pensar: ¿esto sigue pasando hoy?' },
      ],
    },
    {
      id: 'c5', name: 'Comunicación histórica', description: 'Comunica análisis históricos de forma clara', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Comunica con vocabulario histórico preciso y argumentos fundamentados', evidence: 'Escrito con vocabulario histórico', feedbackSuggestion: 'Tu comunicación histórica es excelente.' },
        { levelId: 'adecuado', descriptor: 'Comunica de forma clara con vocabulario histórico adecuado', evidence: 'Escrito comprensible con vocabulario histórico', feedbackSuggestion: 'Te expresaste bien.' },
        { levelId: 'en_desarrollo', descriptor: 'Expresa ideas con vocabulario general y estructura básica', evidence: 'Escrito con vocabulario general', feedbackSuggestion: 'Tienes ideas claras.' },
        { levelId: 'inicial', descriptor: 'Requiere apoyo para expresar ideas históricas', evidence: 'Explicación con preguntas guía', feedbackSuggestion: 'Vamos a construir juntos una explicación.' },
      ],
    },
  ];
}

function buildArtesCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Exploración de materiales y técnicas', description: 'Explora materiales y técnicas artísticas', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Selecciona y combina materiales de forma intencional, explicando por qué', evidence: 'Registro del proceso creativo', feedbackSuggestion: 'Tus elecciones son intencionales y creativas.' },
        { levelId: 'adecuado', descriptor: 'Utiliza al menos 2 materiales o técnicas diferentes', evidence: 'Obra con uso de múltiples materiales', feedbackSuggestion: 'Experimentaste con varios materiales.' },
        { levelId: 'en_desarrollo', descriptor: 'Utiliza materiales básicos con apoyo', evidence: 'Uso de materiales con guía', feedbackSuggestion: 'Estás explorando.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo significativo para manipular materiales', evidence: 'Participación con asistencia', feedbackSuggestion: 'Vamos a explorar juntos.' },
      ],
    },
    {
      id: 'c2', name: 'Expresión de ideas y emociones', description: 'Expresa ideas y emociones a través de la obra', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Expresa ideas propias y emociones de forma original', evidence: 'Obra con reflexión sobre la intención', feedbackSuggestion: 'Tu obra comunica con originalidad.' },
        { levelId: 'adecuado', descriptor: 'Expresa sentimientos e ideas de forma comprensible', evidence: 'Obra con intención clara', feedbackSuggestion: 'Lograste expresar lo que sentías.' },
        { levelId: 'en_desarrollo', descriptor: 'Intenta expresar algo pero la obra es exploratoria', evidence: 'Obra con apoyo para definir intención', feedbackSuggestion: 'Tu obra muestra exploración.' },
        { levelId: 'inicial', descriptor: 'Requiere acompañamiento para definir qué quiere expresar', evidence: 'Creación con guía paso a paso', feedbackSuggestion: 'Vamos a definir juntos qué quieres expresar.' },
      ],
    },
    {
      id: 'c3', name: 'Uso de elementos del lenguaje visual', description: 'Utiliza línea, color, forma, textura y composición', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Emplea elementos del lenguaje visual de forma intencional', evidence: 'Análisis propio de los elementos', feedbackSuggestion: 'Domina los elementos visuales.' },
        { levelId: 'adecuado', descriptor: 'Utiliza al menos 3 elementos del lenguaje visual', evidence: 'Obra con color, forma y textura', feedbackSuggestion: 'Usaste varios elementos visuales.' },
        { levelId: 'en_desarrollo', descriptor: 'Utiliza algunos elementos de forma básica', evidence: 'Obra con uso limitado', feedbackSuggestion: 'Estás usando algunos elementos.' },
        { levelId: 'inicial', descriptor: 'Requiere apoyo para incorporar elementos visuales', evidence: 'Creación con sugerencias', feedbackSuggestion: 'Vamos a pensar qué colores usar.' },
      ],
    },
    {
      id: 'c4', name: 'Proceso creativo', description: 'Desarrolla un proceso creativo con planificación y reflexión', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Planifica, crea y reflexiona, haciendo ajustes durante el proceso', evidence: 'Boceto, obra final y reflexión', feedbackSuggestion: 'Tu proceso creativo es completo.' },
        { levelId: 'adecuado', descriptor: 'Desarrolla su obra con planificación y revisión', evidence: 'Boceto y obra final', feedbackSuggestion: 'Tuviste un proceso creativo.' },
        { levelId: 'en_desarrollo', descriptor: 'Crea de forma espontánea sin planificación', evidence: 'Obra sin planificación previa', feedbackSuggestion: 'Creaste algo. Planifica antes.' },
        { levelId: 'inicial', descriptor: 'Necesita guía directa para su proceso creativo', evidence: 'Creación con pasos guiados', feedbackSuggestion: 'Vamos a seguir los pasos juntos.' },
      ],
    },
    {
      id: 'c5', name: 'Reflexión sobre la obra', description: 'Reflexiona sobre su obra y la de otros', weight: 20,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Reflexiona críticamente usando vocabulario artístico', evidence: 'Escrito o exposición con análisis crítico', feedbackSuggestion: 'Tu reflexión es profunda.' },
        { levelId: 'adecuado', descriptor: 'Comenta su obra y la de otros con vocabulario adecuado', evidence: 'Comentario con al menos 2 observaciones', feedbackSuggestion: 'Reflexionaste bien.' },
        { levelId: 'en_desarrollo', descriptor: 'Expresa opiniones simples sin vocabulario artístico', evidence: 'Opinión general sin análisis', feedbackSuggestion: 'Estás reflexionando.' },
        { levelId: 'inicial', descriptor: 'Requiere apoyo para expresar reflexión', evidence: 'Reflexión con preguntas guía', feedbackSuggestion: 'Vamos a pensar: ¿qué te gustó?' },
      ],
    },
  ];
}

function buildGeneralCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Comprensión del contenido', description: 'Comprende los conceptos y habilidades del OA', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Demuestra comprensión profunda, conectando con experiencias y contexto real', evidence: 'Explicación completa con conexiones', feedbackSuggestion: 'Comprensión excelente.' },
        { levelId: 'adecuado', descriptor: 'Demuestra comprensión satisfactoria de los conceptos principales', evidence: 'Respuestas correctas y explicaciones claras', feedbackSuggestion: 'Comprensión adecuada.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce conceptos generales pero sin profundidad', evidence: 'Identificación de conceptos básicos', feedbackSuggestion: 'Estás construyendo tu comprensión.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo significativo para comprender', evidence: 'Comprensión con guía directa', feedbackSuggestion: 'Vamos a revisar el contenido juntos.' },
      ],
    },
    {
      id: 'c2', name: 'Aplicación del conocimiento', description: 'Aplica lo aprendido en situaciones nuevas', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Aplica el conocimiento en contextos variados y resuelve problemas no convencionales', evidence: 'Resolución de problemas nuevos', feedbackSuggestion: 'Aplicas con creatividad.' },
        { levelId: 'adecuado', descriptor: 'Aplica en situaciones similares a las trabajadas', evidence: 'Resolución correcta de ejercicios', feedbackSuggestion: 'Aplicaste bien.' },
        { levelId: 'en_desarrollo', descriptor: 'Aplica con apoyo en situaciones guiadas', evidence: 'Resolución con ayuda', feedbackSuggestion: 'Estás aprendiendo a aplicar.' },
        { levelId: 'inicial', descriptor: 'Requiere guía directa para aplicar', evidence: 'Aplicación con asistencia', feedbackSuggestion: 'Vamos a aplicar juntos.' },
      ],
    },
    {
      id: 'c3', name: 'Comunicación de ideas', description: 'Expresa sus ideas de forma clara y coherente', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Se expresa con claridad, vocabulario preciso y estructura coherente', evidence: 'Expresión oral o escrita fluida', feedbackSuggestion: 'Te expresas excelente.' },
        { levelId: 'adecuado', descriptor: 'Expresa sus ideas de forma comprensible', evidence: 'Expresión clara y ordenada', feedbackSuggestion: 'Te expresaste bien.' },
        { levelId: 'en_desarrollo', descriptor: 'Expresa ideas simples con apoyo', evidence: 'Expresión básica con ayuda', feedbackSuggestion: 'Estás mejorando tu expresión.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para expresar ideas', evidence: 'Expresión con guía', feedbackSuggestion: 'Vamos a expresar juntos tus ideas.' },
      ],
    },
    {
      id: 'c4', name: 'Pensamiento crítico', description: 'Analiza, evalúa y reflexiona sobre el contenido', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Analiza críticamente, evalúa argumentos y propone alternativas', evidence: 'Análisis con argumentación', feedbackSuggestion: 'Tu pensamiento crítico es sólido.' },
        { levelId: 'adecuado', descriptor: 'Analiza el contenido y opina con argumentos', evidence: 'Opinión fundamentada', feedbackSuggestion: 'Bien analizas.' },
        { levelId: 'en_desarrollo', descriptor: 'Opina pero sin argumentación sólida', evidence: 'Opinión con apoyo', feedbackSuggestion: 'Estás desarrollando tu pensamiento crítico.' },
        { levelId: 'inicial', descriptor: 'Requiere apoyo para reflexionar', evidence: 'Reflexión con preguntas guía', feedbackSuggestion: 'Vamos a reflexionar juntos.' },
      ],
    },
  ];
}

function buildInclusiveAdjustments(category: string, isLower: boolean): string[] {
  if (isLower) {
    return [
      'Usar pictogramas, caritas o etiquetas visuales para representar los niveles.',
      'Permitir respuestas con dibujos, señalamiento o manipulación de objetos.',
      'Ofrecer apoyo del docente o compañeros para leer instrucciones.',
      'Dividir la evaluación en momentos breves con pausas.',
      'Incluir elementos multisensoriales cuando sea posible.',
      'Valorar el esfuerzo y la participación activa.',
    ];
  }
  return [
    'Para estudiantes con rezago lector: incluir apoyo visual con imágenes, pictogramas o organizadores gráficos.',
    'Para dificultades de escritura: permitir respuestas orales, dibujos, selección múltiple o tecnologías de apoyo.',
    'Para TEA: ofrecer instrucciones paso a paso, tiempos extendidos y alternativas sensoriales.',
    'Para TDAH: dividir la evaluación en partes más pequeñas, permitir movimiento y ofrecer recordatorios visuales.',
    'Para dificultades de lenguaje: usar vocabulario claro, incluir bancos de palabras.',
    'Para estudiantes con mayor avance: ofrecer desafíos adicionales como extensión del OA.',
  ];
}

function buildSelfAssessment(isLower: boolean): { title: string; prompts: string[] } {
  if (isLower) {
    return {
      title: 'Mi autoevaluación',
      prompts: ['Lo que mejor logré fue...', 'Me costó más...', 'Una cosa que aprendí es...', 'Mi próximo paso será...'],
    };
  }
  return {
    title: 'Autoevaluación del aprendizaje',
    prompts: ['Creo que logré... (¿Qué evidencia tengo?)', 'Necesito mejorar... (¿Qué paso siguiente doy?)', 'Una evidencia de mi trabajo es...', 'Mi próximo paso será...', 'Lo que más me sorprendió fue...', 'Una conexión con mi vida diaria es...'],
  };
}

function buildPremiumRubric(input: {
  level: string; subject: string; objectiveCode: string; objectiveText: string;
  topic: string; indicators?: string[]; skills?: string[];
}): PremiumRubric {
  const category = detectSubjectCategory(input.subject);
  const keywords = detectKeywords(input.objectiveText);
  const lower = isLowerLevel(input.level);
  const concepts = extractConcepts(input.objectiveText);
  const mainConcept = concepts[0] || input.topic || input.objectiveText.split(' ')[0] || 'el contenido';
  const topicLabel = truncate(input.objectiveText || input.topic, 60);

  let criteriaBank: RubricCriterion[];
  switch (category) {
    case 'ciencias': criteriaBank = buildCienciasCriteria(keywords, mainConcept); break;
    case 'lenguaje': criteriaBank = buildLenguajeCriteria(); break;
    case 'matematica': criteriaBank = buildMatematicaCriteria(); break;
    case 'historia': criteriaBank = buildHistoriaCriteria(); break;
    case 'artes': criteriaBank = buildArtesCriteria(); break;
    default: criteriaBank = buildGeneralCriteria(); break;
  }

  const maxCriteria = lower ? 4 : 6;
  const criteria = criteriaBank.slice(0, maxCriteria);
  const totalScore = criteria.length * 4;

  return {
    title: `Rúbrica: ${topicLabel}`,
    subtitle: `${input.level} — ${input.subject}`,
    nivel: input.level,
    asignatura: input.subject,
    oa: input.objectiveCode,
    tema: topicLabel,
    learningGoal: lower
      ? `Que los estudiantes puedan ${truncate(input.objectiveText, 80).toLowerCase()}`
      : `Que los estudiantes demuestren comprensión y aplicación de: ${truncate(input.objectiveText, 80)}`,
    studentFriendlyGoal: lower
      ? `Vamos a aprender sobre ${mainConcept} y mostraremos lo que sabemos`
      : `Nuestro objetivo es comprender y aplicar: ${truncate(input.objectiveText, 60)}`,
    levels: LEVELS,
    criteria,
    totalScore,
    scoringFormula: lower
      ? `Puntaje total: ${totalScore} puntos. Cada criterio vale 4 puntos.`
      : `Puntaje total: ${totalScore} puntos. Nota final: (puntaje obtenido / ${totalScore}) × 7.`,
    usageInstructions: [
      'Lee cada criterio y sus descriptores antes de iniciar la evaluación.',
      'Observa la evidencia del estudiante y compárala con los descriptores.',
      'Selecciona el nivel que mejor describa el desempeño para cada criterio.',
      'Usa las evidencias sugeridas como guía.',
      'Proporciona retroalimentación específica.',
      'Completa la autoevaluación del estudiante al finalizar.',
    ],
    inclusiveAdjustments: buildInclusiveAdjustments(category, lower),
    formativeFeedbackQuestions: [
      '¿Qué aspecto del desempeño fue más destacado?',
      '¿En qué criterio necesita más apoyo?',
      '¿Qué estrategia de retroalimentación usarás?',
      '¿Cómo puedes adaptar la próxima actividad?',
    ],
    studentSelfAssessment: buildSelfAssessment(lower),
  };
}
