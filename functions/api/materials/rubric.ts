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

export function detectSubjectCategory(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes('música') || s.includes('musica')) return 'musica';
  if (s.includes('educación física') || s.includes('educacion fisica') || s.includes('ed. físico') || s.includes('ed. fisico') || s.includes('física y salud') || s.includes('fisica y salud')) return 'educacion_fisica';
  if (s.includes('filosofía') || s.includes('filosofia')) return 'filosofia';
  if (s.includes('biología') || s.includes('biologia')) return 'biologia';
  if (s.includes('física') && !s.includes('educación física') && !s.includes('física y salud')) return 'fisica';
  if (s.includes('química') || s.includes('quimica')) return 'quimica';
  if (s.includes('ciencias para la ciudadanía') || s.includes('ciencias para la ciudadania') || s.includes('ciudadanía científica')) return 'ciencias_ciudadania';
  if (s.includes('educación parvularia') || s.includes('educacion parvularia') || s.includes('parvularia') || s.includes('pre-kinder') || s.includes('prekinder') || s.includes('kinder')) return 'parvularia';
  if (s.includes('ciencias') || s.includes('natural')) return 'ciencias';
  if (s.includes('lenguaje') || s.includes('comunicación') || s.includes('comunicacion') || s.includes('castellano')) return 'lenguaje';
  if (s.includes('matemática') || s.includes('matematica') || s.includes('mate')) return 'matematica';
  if (s.includes('historia') || s.includes('geografía') || s.includes('geografia') || s.includes('sociales')) return 'historia';
  if (s.includes('arte') || s.includes('visual')) return 'artes';
  if (s.includes('tecnología') || s.includes('tecnologia') || s.includes('programación') || s.includes('programacion')) return 'tecnologia';
  if (s.includes('formación ciudadana') || s.includes('formacion ciudadana') || s.includes('educación ciudadana') || s.includes('educacion ciudadana')) return 'formacion_ciudadana';
  if (s.includes('orientación') || s.includes('orientacion')) return 'orientacion';
  if (s.includes('inglés') || s.includes('ingles') || s.includes('english')) return 'ingles';
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

function buildMusicaCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Escucha activa', description: 'Escucha con atención y reconoce elementos sonoros', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Identifica ritmo, melodía, timbre y dinámica con precisión', evidence: 'Análisis musical detallado', feedbackSuggestion: 'Tu escucha es muy atenta y precisa.' },
        { levelId: 'adecuado', descriptor: 'Reconoce al menos 3 elementos del sonido', evidence: 'Identificación de elementos musicales', feedbackSuggestion: 'Bien identificas los sonidos. Profundiza en el análisis.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce algunos elementos con apoyo', evidence: 'Reconocimiento con guía', feedbackSuggestion: 'Estás desarrollando tu oído musical.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo significativo para escuchar activamente', evidence: 'Escucha con asistencia', feedbackSuggestion: 'Vamos a escuchar juntos con atención.' },
      ],
    },
    {
      id: 'c2', name: 'Interpretación rítmica y melódica', description: 'Interpreta ritmos y melodías de forma personal', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Interpreta con precisión rítmica y melódica, añadiendo expresión personal', evidence: 'Interpretación completa y expresiva', feedbackSuggestion: 'Tu interpretación es expresiva y precisa.' },
        { levelId: 'adecuado', descriptor: 'Interpreta la pieza con ritmo y melodía correctos', evidence: 'Interpretación correcta', feedbackSuggestion: 'Buena interpretación. Agrega más expresión.' },
        { levelId: 'en_desarrollo', descriptor: 'Interpreta con apoyo del docente o compañeros', evidence: 'Interpretación con guía', feedbackSuggestion: 'Estás mejorando tu interpretación. Sigue practicando.' },
        { levelId: 'inicial', descriptor: 'Necesita modelado directo para interpretar', evidence: 'Interpretación con asistencia', feedbackSuggestion: 'Vamos a interpretar juntos.' },
      ],
    },
    {
      id: 'c3', name: 'Creación sonora', description: 'Crea sonidos, ritmos o pequeñas composiciones', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Crea composiciones originales con intención y estructura', evidence: 'Composición original documentada', feedbackSuggestion: 'Tu creación es original y bien estructurada.' },
        { levelId: 'adecuado', descriptor: 'Crea ritmos o sonidos con variaciones', evidence: 'Creación con variaciones', feedbackSuggestion: 'Buena creación. Prueba nuevas combinaciones.' },
        { levelId: 'en_desarrollo', descriptor: 'Crea con apoyo y usando modelos', evidence: 'Creación con modelado', feedbackSuggestion: 'Estás creando con más confianza.' },
        { levelId: 'inicial', descriptor: 'Requiere guía para crear sonidos', evidence: 'Creación con asistencia', feedbackSuggestion: 'Vamos a crear juntos algo nuevo.' },
      ],
    },
    {
      id: 'c4', name: 'Expresión y reflexión musical', description: 'Expresa emociones a través de la música y reflexiona sobre ella', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Expresa emociones con intención y reflexiona críticamente sobre la música', evidence: 'Reflexión profunda y expresión', feedbackSuggestion: 'Tu expresión y reflexión musical son sobresalientes.' },
        { levelId: 'adecuado', descriptor: 'Expresa emociones y menciona por qué le gusta la música', evidence: 'Expresión con reflexión', feedbackSuggestion: 'Bien expresas lo que sientes. Profundiza tu reflexión.' },
        { levelId: 'en_desarrollo', descriptor: 'Expresa emociones con apoyo y participa en reflexiones', evidence: 'Expresión con guía', feedbackSuggestion: 'Estás aprendiendo a expresarte musicalmente.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para expresar emociones a través de la música', evidence: 'Expresión con asistencia', feedbackSuggestion: 'Vamos a expresar juntos lo que sentimos.' },
      ],
    },
  ];
}

function buildEducacionFisicaCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Ejecución motriz', description: 'Ejecuta habilidades motrices con coordinación y control', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Ejecuta habilidades con coordinación, control y precisión, adaptándose a diferentes contextos', evidence: 'Demostración de habilidad motriz', feedbackSuggestion: 'Tu ejecución motriz es excelente y fluida.' },
        { levelId: 'adecuado', descriptor: 'Ejecuta la habilidad con control básico', evidence: 'Ejecución correcta', feedbackSuggestion: 'Buena ejecución. Sigue perfeccionando la técnica.' },
        { levelId: 'en_desarrollo', descriptor: 'Ejecuta con apoyo y modelado del docente', evidence: 'Ejecución con guía', feedbackSuggestion: 'Estás mejorando tu coordinación. Practica más.' },
        { levelId: 'inicial', descriptor: 'Necesita modelado directo para ejecutar', evidence: 'Ejecución con asistencia', feedbackSuggestion: 'Vamos a practicar juntos el movimiento.' },
      ],
    },
    {
      id: 'c2', name: 'Respeto de reglas y normas', description: 'Participa respetando las reglas del juego o actividad', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Participa respetando todas las reglas y ayuda a otros a cumplirlas', evidence: 'Participación respetuosa y colaborativa', feedbackSuggestion: 'Eres un ejemplo de respeto por las reglas.' },
        { levelId: 'adecuado', descriptor: 'Cumple la mayoría de las reglas del juego', evidence: 'Participación con cumplimiento', feedbackSuggestion: 'Bien respetas las reglas. Recuerda todas.' },
        { levelId: 'en_desarrollo', descriptor: 'Cumple reglas con recordatorio del docente', evidence: 'Participación con recordatorio', feedbackSuggestion: 'Estás aprendiendo a jugar con reglas.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo constante para respetar reglas', evidence: 'Participación con apoyo', feedbackSuggestion: 'Vamos a recordar las reglas juntos.' },
      ],
    },
    {
      id: 'c3', name: 'Autocuidado y seguridad', description: 'Aplica hábitos de autocuidado durante la actividad física', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Aplica autocuidado de forma autónoma: calienta, se hidrata, cuida su cuerpo y el de otros', evidence: 'Registro de hábitos de autocuidado', feedbackSuggestion: 'Tus hábitos de autocuidado son ejemplares.' },
        { levelId: 'adecuado', descriptor: 'Realiza calentamiento y cuida su seguridad', evidence: 'Participación con autocuidado', feedbackSuggestion: 'Bien cuidas tu seguridad. Sigue así.' },
        { levelId: 'en_desarrollo', descriptor: 'Aplica autocuidado con recordatorio', evidence: 'Autocuidado con guía', feedbackSuggestion: 'Estás aprendiendo a cuidarte durante la actividad.' },
        { levelId: 'inicial', descriptor: 'Necesita recordatorios constantes de seguridad', evidence: 'Autocuidado con apoyo', feedbackSuggestion: 'Vamos a cuidarnos juntos.' },
      ],
    },
    {
      id: 'c4', name: 'Trabajo colaborativo', description: 'Participa en actividades grupales de forma respetuosa', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Colabora activamente, apoya a compañeros y contribuye al logro del equipo', evidence: 'Participación colaborativa destacada', feedbackSuggestion: 'Tu trabajo en equipo es excelente.' },
        { levelId: 'adecuado', descriptor: 'Participa en grupo y respeta los turnos', evidence: 'Colaboración básica', feedbackSuggestion: 'Bien trabajas en equipo. Sigue colaborando.' },
        { levelId: 'en_desarrollo', descriptor: 'Participa con apoyo del docente para colaborar', evidence: 'Colaboración con guía', feedbackSuggestion: 'Estás aprendiendo a trabajar en equipo.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para participar en grupo', evidence: 'Colaboración con asistencia', feedbackSuggestion: 'Vamos a participar juntos en el grupo.' },
      ],
    },
  ];
}

function buildFilosofiaCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Formulación de preguntas', description: 'Formula preguntas filosóficas relevantes y profundas', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Formula preguntas abiertas, profundas que generan reflexión múltiple', evidence: 'Preguntas filosóficas formuladas', feedbackSuggestion: 'Tus preguntas generan debate profundo.' },
        { levelId: 'adecuado', descriptor: 'Formula al menos 2 preguntas relevantes al tema', evidence: 'Preguntas relevantes', feedbackSuggestion: 'Buenas preguntas. Profundiza más.' },
        { levelId: 'en_desarrollo', descriptor: 'Formula preguntas con apoyo del docente', evidence: 'Preguntas con guía', feedbackSuggestion: 'Estás aprendiendo a formular preguntas filosóficas.' },
        { levelId: 'inicial', descriptor: 'Necesita modelado para formular preguntas', evidence: 'Preguntas con asistencia', feedbackSuggestion: 'Vamos a formular juntos preguntas profundas.' },
      ],
    },
    {
      id: 'c2', name: 'Argumentación', description: 'Argumenta sus posturas con razones y ejemplos', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Argumenta con razones sólidas, ejemplos claros y anticipa objeciones', evidence: 'Argumentación completa y fundamentada', feedbackSuggestion: 'Tu argumentación es sólida y clara.' },
        { levelId: 'adecuado', descriptor: 'Argumenta con al menos 2 razones y un ejemplo', evidence: 'Argumentación con razones', feedbackSuggestion: 'Bien argumentas. Agrega más ejemplos.' },
        { levelId: 'en_desarrollo', descriptor: 'Argumenta con apoyo y razones simples', evidence: 'Argumentación con guía', feedbackSuggestion: 'Estás desarrollando tu capacidad argumentativa.' },
        { levelId: 'inicial', descriptor: 'Requiere guía para argumentar', evidence: 'Argumentación con asistencia', feedbackSuggestion: 'Vamos a argumentar juntos con razones.' },
      ],
    },
    {
      id: 'c3', name: 'Análisis de perspectivas', description: 'Analiza diferentes posturas sobre una cuestión filosófica', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Analiza múltiples perspectivas con profundidad y las relaciona entre sí', evidence: 'Análisis de perspectivas múltiples', feedbackSuggestion: 'Tu capacidad de análisis es sobresaliente.' },
        { levelId: 'adecuado', descriptor: 'Identifica al menos 2 perspectivas diferentes', evidence: 'Identificación de perspectivas', feedbackSuggestion: 'Bien identificas las perspectivas. Relaciona más.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce que existen diferentes posturas con apoyo', evidence: 'Reconocimiento con guía', feedbackSuggestion: 'Estás aprendiendo a ver diferentes posturas.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para reconocer perspectivas', evidence: 'Reconocimiento con asistencia', feedbackSuggestion: 'Vamos a explorar juntos las diferentes posturas.' },
      ],
    },
    {
      id: 'c4', name: 'Uso de ejemplos y diálogo respetuoso', description: 'Usa ejemplos para fundamentar y dialoga con respeto', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Usa ejemplos variados y relevantes, y mantiene diálogo respetuoso y productivo', evidence: 'Uso de ejemplos y diálogo ejemplar', feedbackSuggestion: 'Tu diálogo y uso de ejemplos son excelentes.' },
        { levelId: 'adecuado', descriptor: 'Usa al menos 1 ejemplo y respeta opiniones distintas', evidence: 'Uso de ejemplo y respeto', feedbackSuggestion: 'Bien usas ejemplos. Sigue dialogando con respeto.' },
        { levelId: 'en_desarrollo', descriptor: 'Usa ejemplos con apoyo y escucha opiniones', evidence: 'Uso de ejemplos con guía', feedbackSuggestion: 'Estás mejorando en el diálogo filosófico.' },
        { levelId: 'inicial', descriptor: 'Necesita modelado para usar ejemplos y dialogar', evidence: 'Diálogo con asistencia', feedbackSuggestion: 'Vamos a dialogar juntos con respeto.' },
      ],
    },
  ];
}

function buildBiologiaCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Observación de seres vivos', description: 'Observa y describe características de organismos', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Observa con precisión y describe características morfológicas, fisiológicas y conductuales', evidence: 'Registro de observación detallado', feedbackSuggestion: 'Tu observación es muy precisa y completa.' },
        { levelId: 'adecuado', descriptor: 'Identifica al menos 3 características del organismo', evidence: 'Identificación de características', feedbackSuggestion: 'Bien observas. Describe más detalles.' },
        { levelId: 'en_desarrollo', descriptor: 'Identifica características básicas con apoyo', evidence: 'Observación con guía', feedbackSuggestion: 'Estás mejorando tu capacidad de observación.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para observar y describir', evidence: 'Observación con asistencia', feedbackSuggestion: 'Vamos a observar juntos con atención.' },
      ],
    },
    {
      id: 'c2', name: 'Clasificación biológica', description: 'Clasifica organismos según criterios científicos', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Clasifica usando criterios taxonómicos y explica las razones de la clasificación', evidence: 'Clasificación con justificación', feedbackSuggestion: 'Tu clasificación es precisa y bien fundamentada.' },
        { levelId: 'adecuado', descriptor: 'Clasifica al menos 2 grupos de organismos', evidence: 'Clasificación básica', feedbackSuggestion: 'Bien clasificas. Fundamenta tus criterios.' },
        { levelId: 'en_desarrollo', descriptor: 'Clasifica con apoyo y criterios simples', evidence: 'Clasificación con guía', feedbackSuggestion: 'Estás aprendiendo a clasificar organismos.' },
        { levelId: 'inicial', descriptor: 'Requiere guía para clasificar', evidence: 'Clasificación con asistencia', feedbackSuggestion: 'Vamos a clasificar juntos.' },
      ],
    },
    {
      id: 'c3', name: 'Explicación de procesos biológicos', description: 'Explica procesos como ciclo de vida, alimentación, ecología', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Explica procesos biológicos con vocabulario científico y conexiones ecológicas', evidence: 'Explicación científica completa', feedbackSuggestion: 'Tu explicación es científica y clara.' },
        { levelId: 'adecuado', descriptor: 'Explica el proceso con vocabulario adecuado', evidence: 'Explicación correcta', feedbackSuggestion: 'Bien explicas el proceso. Usa más vocabulario científico.' },
        { levelId: 'en_desarrollo', descriptor: 'Explica con apoyo y vocabulario simple', evidence: 'Explicación con guía', feedbackSuggestion: 'Estás aprendiendo a explicar procesos biológicos.' },
        { levelId: 'inicial', descriptor: 'Necesita modelado para explicar', evidence: 'Explicación con asistencia', feedbackSuggestion: 'Vamos a explicar juntos el proceso.' },
      ],
    },
    {
      id: 'c4', name: 'Conexión con el entorno', description: 'Relaciona el contenido biológico con su entorno y realidad', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Relaciona el contenido con situaciones reales y propone acciones de conservación', evidence: 'Conexión con realidad y propuesta', feedbackSuggestion: 'Tu conexión con el entorno es profunda.' },
        { levelId: 'adecuado', descriptor: 'Menciona al menos 1 conexión con su entorno', evidence: 'Conexión básica', feedbackSuggestion: 'Bien conectas. Piensa en más ejemplos reales.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce conexiones con apoyo', evidence: 'Conexión con guía', feedbackSuggestion: 'Estás aprendiendo a relacionar con tu entorno.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para conectar con la realidad', evidence: 'Conexión con asistencia', feedbackSuggestion: 'Vamos a pensar en cómo se relaciona con tu vida.' },
      ],
    },
  ];
}

function buildFisicaCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Comprensión de leyes físicas', description: 'Comprende y aplica leyes y principios de la física', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Comprende leyes físicas con precisión y las aplica a situaciones nuevas', evidence: 'Aplicación de leyes a problemas', feedbackSuggestion: 'Tu comprensión de las leyes físicas es excelente.' },
        { levelId: 'adecuado', descriptor: 'Comprende al menos 2 leyes y sus aplicaciones', evidence: 'Comprensión de leyes', feedbackSuggestion: 'Bien comprendes las leyes. Aplica más.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce principios físicos con apoyo', evidence: 'Comprensión con guía', feedbackSuggestion: 'Estás construyendo tu comprensión de la física.' },
        { levelId: 'inicial', descriptor: 'Necesita modelado para comprender leyes', evidence: 'Comprensión con asistencia', feedbackSuggestion: 'Vamos a explorar juntos las leyes físicas.' },
      ],
    },
    {
      id: 'c2', name: 'Diseño experimental', description: 'Diseña experimentos para verificar hipótesis', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Diseña experimentos con control de variables, mediciones precisas y análisis de error', evidence: 'Diseño experimental completo', feedbackSuggestion: 'Tu diseño experimental es riguroso.' },
        { levelId: 'adecuado', descriptor: 'Diseña un experimento básico con hipótesis', evidence: 'Diseño con hipótesis', feedbackSuggestion: 'Bien diseñaste. Controla más variables.' },
        { levelId: 'en_desarrollo', descriptor: 'Participa en diseño experimental con guía', evidence: 'Diseño con apoyo', feedbackSuggestion: 'Estás aprendiendo a diseñar experimentos.' },
        { levelId: 'inicial', descriptor: 'Requiere asistencia para diseñar experimentos', evidence: 'Diseño con asistencia', feedbackSuggestion: 'Vamos a diseñar juntos el experimento.' },
      ],
    },
    {
      id: 'c3', name: 'Análisis de datos', description: 'Analiza resultados y extrae conclusiones', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Analiza datos con tablas, gráficos y estadísticas simples, extrayendo conclusiones fundamentadas', evidence: 'Análisis completo con gráficos', feedbackSuggestion: 'Tu análisis de datos es preciso y claro.' },
        { levelId: 'adecuado', descriptor: 'Organiza datos y saca conclusiones básicas', evidence: 'Análisis básico', feedbackSuggestion: 'Bien analizas. Usa más herramientas gráficas.' },
        { levelId: 'en_desarrollo', descriptor: 'Organiza datos con apoyo del docente', evidence: 'Análisis con guía', feedbackSuggestion: 'Estás aprendiendo a analizar datos.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para organizar datos', evidence: 'Análisis con asistencia', feedbackSuggestion: 'Vamos a organizar juntos los datos.' },
      ],
    },
    {
      id: 'c4', name: 'Explicación de fenómenos', description: 'Explica fenómenos físicos usando principios científicos', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Explica fenómenos con vocabulario preciso, diagramas y modelos conceptuales', evidence: 'Explicación científica completa', feedbackSuggestion: 'Tu explicación de fenómenos es sobresaliente.' },
        { levelId: 'adecuado', descriptor: 'Explica el fenómeno con vocabulario adecuado', evidence: 'Explicación correcta', feedbackSuggestion: 'Bien explicas. Usa más vocabulario técnico.' },
        { levelId: 'en_desarrollo', descriptor: 'Explica con apoyo y vocabulario simple', evidence: 'Explicación con guía', feedbackSuggestion: 'Estás aprendiendo a explicar fenómenos físicos.' },
        { levelId: 'inicial', descriptor: 'Necesita modelado para explicar fenómenos', evidence: 'Explicación con asistencia', feedbackSuggestion: 'Vamos a explicar juntos el fenómeno.' },
      ],
    },
  ];
}

function buildQuimicaCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Comprensión de sustancias', description: 'Comprende propiedades y clasificación de sustancias', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Clasifica sustancias con criterios químicos y explica sus propiedades a nivel molecular', evidence: 'Clasificación con justificación molecular', feedbackSuggestion: 'Tu comprensión de sustancias es profunda.' },
        { levelId: 'adecuado', descriptor: 'Identifica propiedades físicas y químicas básicas', evidence: 'Identificación de propiedades', feedbackSuggestion: 'Bien identificas las propiedades. Profundiza más.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce algunas propiedades con apoyo', evidence: 'Reconocimiento con guía', feedbackSuggestion: 'Estás construyendo tu comprensión química.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para identificar sustancias', evidence: 'Reconocimiento con asistencia', feedbackSuggestion: 'Vamos a explorar juntos las sustancias.' },
      ],
    },
    {
      id: 'c2', name: 'Diseño experimental químico', description: 'Diseña experimentos seguros para observar reacciones', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Diseña experimentos con protocolo de seguridad, mediciones y control de variables', evidence: 'Diseño experimental seguro y riguroso', feedbackSuggestion: 'Tu diseño experimental es seguro y preciso.' },
        { levelId: 'adecuado', descriptor: 'Diseña un experimento básico con supervisión', evidence: 'Diseño con supervisión', feedbackSuggestion: 'Bien diseñaste. Recuerda siempre la seguridad.' },
        { levelId: 'en_desarrollo', descriptor: 'Participa en experimentos con guía del docente', evidence: 'Participación con apoyo', feedbackSuggestion: 'Estás aprendiendo a experimentar con seguridad.' },
        { levelId: 'inicial', descriptor: 'Requiere asistencia directa para experimentar', evidence: 'Experimentación con asistencia', feedbackSuggestion: 'Vamos a experimentar juntos con cuidado.' },
      ],
    },
    {
      id: 'c3', name: 'Vocabulario químico', description: 'Usa vocabulario químico preciso para comunicar', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Usa vocabulario químico preciso y lo aplica en explicaciones y escritos', evidence: 'Uso de vocabulario técnico', feedbackSuggestion: 'Tu vocabulario químico es preciso.' },
        { levelId: 'adecuado', descriptor: 'Usa al menos 5 términos químicos correctamente', evidence: 'Uso de vocabulario básico', feedbackSuggestion: 'Bien usas el vocabulario. Sigue aprendiendo más términos.' },
        { levelId: 'en_desarrollo', descriptor: 'Usa vocabulario con apoyo y modelado', evidence: 'Uso de vocabulario con guía', feedbackSuggestion: 'Estás aprendiendo el vocabulario químico.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para usar vocabulario químico', evidence: 'Vocabulario con asistencia', feedbackSuggestion: 'Vamos a aprender juntos los términos químicos.' },
      ],
    },
    {
      id: 'c4', name: 'Conexión con la vida cotidiana', description: 'Relaciona la química con situaciones de la vida diaria', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Relaciona conceptos químicos con problemas reales y propone soluciones', evidence: 'Conexión con realidad y propuesta', feedbackSuggestion: 'Tu conexión con la vida real es excelente.' },
        { levelId: 'adecuado', descriptor: 'Menciona al menos 1 aplicación en la vida diaria', evidence: 'Conexión básica', feedbackSuggestion: 'Bien conectas. Piensa en más aplicaciones.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce aplicaciones con apoyo', evidence: 'Conexión con guía', feedbackSuggestion: 'Estás aprendiendo a relacionar con la vida real.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para conectar con la realidad', evidence: 'Conexión con asistencia', feedbackSuggestion: 'Vamos a pensar en cómo la química está en tu vida.' },
      ],
    },
  ];
}

function buildCiudadaniaCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Comprensión de problemas sociales', description: 'Comprende problemas sociales con evidencia científica', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Analiza problemas sociales con evidencia científica multidimensional', evidence: 'Análisis con evidencia', feedbackSuggestion: 'Tu comprensión de problemas es profunda.' },
        { levelId: 'adecuado', descriptor: 'Identifica al menos 2 dimensiones de un problema social', evidence: 'Identificación de dimensiones', feedbackSuggestion: 'Bien analizas. Considera más perspectivas.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce problemas con apoyo del docente', evidence: 'Reconocimiento con guía', feedbackSuggestion: 'Estás aprendiendo a analizar problemas sociales.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para comprender problemas', evidence: 'Reconocimiento con asistencia', feedbackSuggestion: 'Vamos a explorar juntos este problema.' },
      ],
    },
    {
      id: 'c2', name: 'Uso de evidencia científica', description: 'Usa datos y evidencia para fundamentar argumentos', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Usa evidencia científica variada y la integra en argumentos sólidos', evidence: 'Uso de evidencia múltiple', feedbackSuggestion: 'Tu uso de evidencia es riguroso.' },
        { levelId: 'adecuado', descriptor: 'Usa al menos 1 fuente de evidencia para argumentar', evidence: 'Uso de evidencia básica', feedbackSuggestion: 'Bien usas la evidencia. Busca más fuentes.' },
        { levelId: 'en_desarrollo', descriptor: 'Usa evidencia con apoyo del docente', evidence: 'Uso de evidencia con guía', feedbackSuggestion: 'Estás aprendiendo a usar evidencia científica.' },
        { levelId: 'inicial', descriptor: 'Necesita modelado para usar evidencia', evidence: 'Uso de evidencia con asistencia', feedbackSuggestion: 'Vamos a buscar juntos la evidencia.' },
      ],
    },
    {
      id: 'c3', name: 'Análisis de impacto', description: 'Analiza el impacto de decisiones en la sociedad y medio ambiente', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Analiza impactos a corto y largo plazo, proponiendo soluciones fundamentadas', evidence: 'Análisis de impacto completo', feedbackSuggestion: 'Tu análisis de impacto es profundo y propositivo.' },
        { levelId: 'adecuado', descriptor: 'Menciona al menos 2 impactos de una decisión', evidence: 'Identificación de impactos', feedbackSuggestion: 'Bien analizas los impactos. Profundiza más.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce impactos con apoyo', evidence: 'Análisis con guía', feedbackSuggestion: 'Estás aprendiendo a analizar impactos.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para identificar impactos', evidence: 'Análisis con asistencia', feedbackSuggestion: 'Vamos a pensar en las consecuencias juntos.' },
      ],
    },
    {
      id: 'c4', name: 'Decisión informada', description: 'Toma decisiones considerando evidencia y perspectivas diversas', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Toma decisiones considerando evidencia, ética y múltiples perspectivas', evidence: 'Decisión fundamentada y ética', feedbackSuggestion: 'Tus decisiones son informadas y responsables.' },
        { levelId: 'adecuado', descriptor: 'Toma una decisión considerando al menos 2 factores', evidence: 'Decisión con factores', feedbackSuggestion: 'Bien decides. Considera más factores.' },
        { levelId: 'en_desarrollo', descriptor: 'Toma decisiones con guía del docente', evidence: 'Decisión con guía', feedbackSuggestion: 'Estás aprendiendo a tomar decisiones informadas.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para tomar decisiones', evidence: 'Decisión con asistencia', feedbackSuggestion: 'Vamos a decidir juntos considerando todo.' },
      ],
    },
  ];
}

function buildParvulariaCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Exploración y juego', description: 'Explora el entorno y participa en juegos con curiosidad', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Explora con curiosidad, hace preguntas y participa activamente en juegos variados', evidence: 'Participación activa y curiosa', feedbackSuggestion: 'Tu exploración es muy curiosa y activa.' },
        { levelId: 'adecuado', descriptor: 'Participa en juegos y exploraciones con interés', evidence: 'Participación con interés', feedbackSuggestion: 'Bien exploras. Sigue haciendo preguntas.' },
        { levelId: 'en_desarrollo', descriptor: 'Participa con apoyo del docente o compañeros', evidence: 'Participación con guía', feedbackSuggestion: 'Estás explorando cada vez más.' },
        { levelId: 'inicial', descriptor: 'Necesita modelado para participar', evidence: 'Participación con asistencia', feedbackSuggestion: 'Vamos a explorar juntos.' },
      ],
    },
    {
      id: 'c2', name: 'Expresión libre', description: 'Se expresa a través del dibujo, la voz, el cuerpo y la creatividad', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Se expresa con variedad de medios y comunica sus ideas con claridad', evidence: 'Expresión variada y comunicativa', feedbackSuggestion: 'Tu expresión es muy creativa y clara.' },
        { levelId: 'adecuado', descriptor: 'Se expresa por al menos 2 medios diferentes', evidence: 'Expresión con variedad', feedbackSuggestion: 'Bien te expresas. Prueba nuevos medios.' },
        { levelId: 'en_desarrollo', descriptor: 'Se expresa con apoyo y estímulo', evidence: 'Expresión con guía', feedbackSuggestion: 'Estás encontrando tu forma de expresarte.' },
        { levelId: 'inicial', descriptor: 'Necesita estímulo para expresarse', evidence: 'Expresión con asistencia', feedbackSuggestion: 'Vamos a expresar juntos lo que sientes.' },
      ],
    },
    {
      id: 'c3', name: 'Participación grupal', description: 'Participa en actividades grupales respetando turnos y normas simples', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Participa respetando turnos, ayuda a compañeros y disfruta del juego grupal', evidence: 'Participación colaborativa', feedbackSuggestion: 'Eres muy buen compañero/a de juego.' },
        { levelId: 'adecuado', descriptor: 'Participa y respeta turnos básicos', evidence: 'Participación con turnos', feedbackSuggestion: 'Bien participas. Sigue respetando a los demás.' },
        { levelId: 'en_desarrollo', descriptor: 'Participa con recordatorio de normas', evidence: 'Participación con recordatorio', feedbackSuggestion: 'Estás aprendiendo a jugar con otros.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo constante para participar', evidence: 'Participación con apoyo', feedbackSuggestion: 'Vamos a participar juntos en el juego.' },
      ],
    },
    {
      id: 'c4', name: 'Relación con otros', description: 'Se relaciona con compañeros y adultos de forma respetuosa', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Se relaciona con empatía, resuelve conflictos con palabras y muestra afecto', evidence: 'Relación empática y respetuosa', feedbackSuggestion: 'Tu forma de relacionarte es ejemplar.' },
        { levelId: 'adecuado', descriptor: 'Se relaciona y comparte con al menos 2 compañeros', evidence: 'Relación básica', feedbackSuggestion: 'Bien te relacionas. Sigue compartiendo.' },
        { levelId: 'en_desarrollo', descriptor: 'Se relaciona con apoyo del adulto', evidence: 'Relación con guía', feedbackSuggestion: 'Estás aprendiendo a relacionarte mejor.' },
        { levelId: 'inicial', descriptor: 'Necesita mediación para relacionarse', evidence: 'Relación con asistencia', feedbackSuggestion: 'Vamos a jugar juntos con los demás.' },
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

function buildTecnologiaCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Comprensión del problema', description: 'Identifica la necesidad o problema tecnológico a resolver', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Analiza el problema desde múltiples perspectivas y define requisitos claros', evidence: 'Análisis con requisitos especificados', feedbackSuggestion: 'Análisis completo del problema.' },
        { levelId: 'adecuado', descriptor: 'Identifica el problema y menciona algunos requisitos', evidence: 'Descripción del problema', feedbackSuggestion: 'Identificaste bien el problema.' },
        { levelId: 'en_desarrollo', descriptor: 'Describe el problema de forma general', evidence: 'Descripción básica', feedbackSuggestion: 'Describe más detalles del problema.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para identificar el problema', evidence: 'Descripción con guía', feedbackSuggestion: 'Vamos a definir juntos el problema.' },
      ],
    },
    {
      id: 'c2', name: 'Diseño de la solución', description: 'Diseña una solución tecnológica adecuada', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Diseña una solución innovadora, considerando materiales, herramientas y pasos', evidence: 'Plano, boceto o plan detallado', feedbackSuggestion: 'Tu diseño es innovador y bien planificado.' },
        { levelId: 'adecuado', descriptor: 'Propone una solución viable con algunos detalles', evidence: 'Propuesta con materiales y pasos', feedbackSuggestion: 'Buena propuesta. Agrega más detalles.' },
        { levelId: 'en_desarrollo', descriptor: 'Propone una idea general sin detalles técnicos', evidence: 'Idea general', feedbackSuggestion: 'Tu idea es buena. Ahora define los pasos.' },
        { levelId: 'inicial', descriptor: 'Requiere guía para diseñar la solución', evidence: 'Diseño con apoyo', feedbackSuggestion: 'Vamos a diseñar juntos.' },
      ],
    },
    {
      id: 'c3', name: 'Construcción o programación', description: 'Construye o programa la solución siguiendo el diseño', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Construye o programa con precisión, resolviendo problemas durante el proceso', evidence: 'Prototipo o programa funcional', feedbackSuggestion: 'Construiste con precisión y resolviste problemas.' },
        { levelId: 'adecuado', descriptor: 'Construye o programa la solución con resultados funcionales', evidence: 'Prototipo o programa que funciona', feedbackSuggestion: 'Funciona bien. ¿Cómo podrías mejorarlo?' },
        { levelId: 'en_desarrollo', descriptor: 'Intenta construir o programar con apoyo significativo', evidence: 'Prototipo parcial con ayuda', feedbackSuggestion: 'Estás avanzando. Sigue con el apoyo.' },
        { levelId: 'inicial', descriptor: 'Necesita asistencia directa para construir o programar', evidence: 'Construcción con guía paso a paso', feedbackSuggestion: 'Vamos a construir juntos.' },
      ],
    },
    {
      id: 'c4', name: 'Evaluación y mejora', description: 'Evalúa el resultado y propone mejoras', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Evalúa críticamente el producto y propone mejoras concretas y creativas', evidence: 'Evaluación con propuestas de mejora', feedbackSuggestion: 'Tu capacidad de mejora es excelente.' },
        { levelId: 'adecuado', descriptor: 'Evalúa el resultado e identifica al menos una mejora', evidence: 'Evaluación con una mejora propuesta', feedbackSuggestion: 'Bien evaluaste. ¿Qué más podrías mejorar?' },
        { levelId: 'en_desarrollo', descriptor: 'Evalúa con apoyo y reconoce si funciona', evidence: 'Evaluación guiada', feedbackSuggestion: 'Estás aprendiendo a evaluar.' },
        { levelId: 'inicial', descriptor: 'Necesita guía para evaluar el resultado', evidence: 'Evaluación con asistencia', feedbackSuggestion: 'Vamos a evaluar juntos el resultado.' },
      ],
    },
  ];
}

function buildFormacionCiudadanaCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Comprensión de normas y valores', description: 'Comprende normas, valores y principios ciudadanos', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Explica normas y valores, conectándolos con situaciones reales y su importancia social', evidence: 'Análisis con ejemplos reales', feedbackSuggestion: 'Comprendes la importancia de las normas en la sociedad.' },
        { levelId: 'adecuado', descriptor: 'Identifica al menos 2 normas o valores y menciona su importancia', evidence: 'Lista de normas/valores con explicación', feedbackSuggestion: 'Identificaste bien las normas.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce algunas normas pero sin explicar su importancia', evidence: 'Mención de normas', feedbackSuggestion: '¿Por qué es importante esta norma?' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para identificar normas y valores', evidence: 'Selección con guía', feedbackSuggestion: 'Vamos a identificar juntos las normas.' },
      ],
    },
    {
      id: 'c2', name: 'Participación responsable', description: 'Participa de forma respetuosa y responsable en contextos ciudadanos', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Participa activamente, respeta diversas opiniones y aporta construyendo consensos', evidence: 'Registro de participación en debates o actividades', feedbackSuggestion: 'Participas de forma ejemplar y constructiva.' },
        { levelId: 'adecuado', descriptor: 'Participa y respeta las opiniones de otros', evidence: 'Participación en actividad grupal', feedbackSuggestion: 'Participaste bien. Intenta también aportar ideas propias.' },
        { levelId: 'en_desarrollo', descriptor: 'Participa con apoyo y a veces tiene dificultad para respetar diversas opiniones', evidence: 'Participación guiada', feedbackSuggestion: 'Estás aprendiendo a participar. Recuerda escuchar antes de hablar.' },
        { levelId: 'inicial', descriptor: 'Necesita acompañamiento significativo para participar', evidence: 'Participación con apoyo directo', feedbackSuggestion: 'Vamos a participar juntos de forma respetuosa.' },
      ],
    },
    {
      id: 'c3', name: 'Análisis de situaciones ciudadanas', description: 'Analiza situaciones que requieren tomar postura o decidir como ciudadano', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Analiza situaciones complejas, considera diversas perspectivas y propone acciones responsables', evidence: 'Análisis con propuestas fundamentadas', feedbackSuggestion: 'Tu análisis ciudadano es profundo y maduro.' },
        { levelId: 'adecuado', descriptor: 'Analiza la situación y menciona al menos una opción de acción', evidence: 'Análisis con opción propuesta', feedbackSuggestion: 'Bien analizaste. ¿Qué pasaría si eliges esa opción?' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce el problema pero no propone acciones', evidence: 'Reconocimiento del problema', feedbackSuggestion: 'Ahora piensa: ¿qué podemos hacer al respecto?' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo para comprender la situación', evidence: 'Comprensión con guía', feedbackSuggestion: 'Vamos a analizar juntos la situación.' },
      ],
    },
    {
      id: 'c4', name: 'Propuesta de acciones', description: 'Propone acciones responsables para mejorar la convivencia o comunidad', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Propone acciones viables, creativas y concretas que involucran a la comunidad', evidence: 'Plan de acciones con pasos y responsables', feedbackSuggestion: 'Tus propuestas pueden generar cambios reales.' },
        { levelId: 'adecuado', descriptor: 'Propone al menos una acción viable para mejorar la situación', evidence: 'Propuesta con un paso concreto', feedbackSuggestion: 'Buena propuesta. ¿Cómo la harías realidad?' },
        { levelId: 'en_desarrollo', descriptor: 'Menciona ideas generales sin plan concreto', evidence: 'Ideas generales', feedbackSuggestion: 'Tus ideas son buenas. Ahora define los pasos.' },
        { levelId: 'inicial', descriptor: 'Necesita guía para proponer acciones', evidence: 'Propuesta con asistencia', feedbackSuggestion: 'Vamos a proponer juntos una acción.' },
      ],
    },
  ];
}

function buildOrientacionCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Reconocimiento personal y social', description: 'Reconoce sus cualidades, emociones y relación con otros', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Identifica sus emociones, cualidades y cómo influyen en su relación con otros', evidence: 'Reflexión personal completa', feedbackSuggestion: 'Te conoces muy bien y eso es una fortaleza.' },
        { levelId: 'adecuado', descriptor: 'Identifica al menos 2 emociones o cualidades personales', evidence: 'Autoconocimiento básico', feedbackSuggestion: 'Bien te identificaste. ¿Cómo te hace sentir eso?' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce algunas emociones con apoyo', evidence: 'Reconocimiento con guía', feedbackSuggestion: 'Estás aprendiendo a conocerte.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo significativo para reconocer sus emociones', evidence: 'Reconocimiento con asistencia directa', feedbackSuggestion: 'Vamos a explorar juntos cómo te sientes.' },
      ],
    },
    {
      id: 'c2', name: 'Convivencia y autocuidado', description: 'Practica hábitos de convivencia, autocuidado y bienestar', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Demuestra hábitos de convivencia y autocuidado de forma autónoma y proactiva', evidence: 'Registro de hábitos y participación en acuerdos', feedbackSuggestion: 'Tus hábitos de convivencia son ejemplares.' },
        { levelId: 'adecuado', descriptor: 'Cumple acuerdos de convivencia y muestra algunos hábitos de autocuidado', evidence: 'Participación en acuerdos', feedbackSuggestion: 'Bien cumples los acuerdos. Sigue fortaleciendo tus hábitos.' },
        { levelId: 'en_desarrollo', descriptor: 'Participa en acuerdos con Recordatorio y apoyo del docente', evidence: 'Participación con recordatorios', feedbackSuggestion: 'Estás aprendiendo a convivir mejor.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo constante para convivir y cuidarse', evidence: 'Convivencia con apoyo directo', feedbackSuggestion: 'Vamos a establecer juntos hábitos de convivencia.' },
      ],
    },
    {
      id: 'c3', name: 'Toma de decisiones', description: 'Toma decisiones considerando sus necesidades, las de otros y consecuencias', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Toma decisiones reflexivas, considerando sus necesidades, las de otros y las consecuencias', evidence: 'Registro de decisiones y justificación', feedbackSuggestion: 'Tomas decisiones de forma madura y responsable.' },
        { levelId: 'adecuado', descriptor: 'Toma decisiones considerando al menos dos factores', evidence: 'Decisión con justificación', feedbackSuggestion: 'Bien consideraste los factores.' },
        { levelId: 'en_desarrollo', descriptor: 'Toma decisiones impulsivas o sin considerar consecuencias', evidence: 'Decisión con reflexión guiada', feedbackSuggestion: 'Piensa antes de decidir: ¿qué consecuencias tiene?' },
        { levelId: 'inicial', descriptor: 'Requiere guía para tomar decisiones', evidence: 'Decisiones con apoyo', feedbackSuggestion: 'Vamos a analizar juntos las opciones.' },
      ],
    },
    {
      id: 'c4', name: 'Participación respetuosa', description: 'Participa de forma respetuosa en actividades de orientación y bienestar', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Participa activamente, aporta ideas y demuestra empatía y respeto por los demás', evidence: 'Participación constructiva y empática', feedbackSuggestion: 'Tu participación es respetuosa y empática.' },
        { levelId: 'adecuado', descriptor: 'Participa y respeta a los demás en las actividades', evidence: 'Participación respetuosa', feedbackSuggestion: 'Participaste bien. Sigue manteniendo el respeto.' },
        { levelId: 'en_desarrollo', descriptor: 'Participa con Recordatorio del docente para mantener el respeto', evidence: 'Participación con recordatorio', feedbackSuggestion: 'Estás aprendiendo a participar respetuosamente.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo constante para participar de forma respetuosa', evidence: 'Participación con apoyo directo', feedbackSuggestion: 'Vamos a participar juntos de forma respetuosa.' },
      ],
    },
  ];
}

function buildInglesCriteria(): RubricCriterion[] {
  return [
    {
      id: 'c1', name: 'Comprensión de vocabulario', description: 'Reconoce y comprende vocabulario y expresiones en inglés', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Comprende vocabulario variado y lo usa en contexto, demostrando dominio del significado', evidence: 'Uso correcto de vocabulario en oraciones', feedbackSuggestion: 'Tu comprensión de vocabulario es excelente.' },
        { levelId: 'adecuado', descriptor: 'Comprende al menos 5 palabras o expresiones y las usa en contexto simple', evidence: 'Identificación y uso de vocabulario', feedbackSuggestion: 'Bien comprendes el vocabulario. Sigue practicando.' },
        { levelId: 'en_desarrollo', descriptor: 'Reconoce algunas palabras con apoyo visual o del docente', evidence: 'Reconocimiento con apoyo', feedbackSuggestion: 'Estás aprendiendo nuevas palabras. Muy bien.' },
        { levelId: 'inicial', descriptor: 'Necesita apoyo constante para comprender vocabulario', evidence: 'Comprensión con asistencia directa', feedbackSuggestion: 'Vamos a aprender juntos nuevas palabras.' },
      ],
    },
    {
      id: 'c2', name: 'Uso comunicativo', description: 'Usa el inglés para comunicar ideas de forma básica', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Se comunica con fluidez, usando estructuras variadas y vocabulario preciso', evidence: 'Comunicación oral o escrita fluida', feedbackSuggestion: 'Te comunicas en inglés con gran fluidez.' },
        { levelId: 'adecuado', descriptor: 'Se comunica en frases simples y comprende respuestas básicas', evidence: 'Comunicación en frases simples', feedbackSuggestion: 'Te comunicas bien. Intenta usar frases más largas.' },
        { levelId: 'en_desarrollo', descriptor: 'Usa palabras sueltas o frases muy cortas con apoyo', evidence: 'Comunicación con apoyo', feedbackSuggestion: 'Estás construyendo tu capacidad de comunicación.' },
        { levelId: 'inicial', descriptor: 'Necesita guía directa para comunicar en inglés', evidence: 'Comunicación con asistencia', feedbackSuggestion: 'Vamos a comunicarnos juntos en inglés.' },
      ],
    },
    {
      id: 'c3', name: 'Producción oral y escrita', description: 'Produce textos o expresiones orales en inglés', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Produce textos o discursos coherentes con vocabulario variado y estructura correcta', evidence: 'Producción escrita u oral completa', feedbackSuggestion: 'Tu producción en inglés es sobresaliente.' },
        { levelId: 'adecuado', descriptor: 'Produce textos o expresiones orales con estructura básica y algunos errores menores', evidence: 'Producción con errores menores', feedbackSuggestion: 'Buena producción. Revisa la ortografía o pronunciación.' },
        { levelId: 'en_desarrollo', descriptor: 'Produce con apoyo significativo, usando frases memorizadas', evidence: 'Producción con apoyo', feedbackSuggestion: 'Estás avanzando en tu producción.' },
        { levelId: 'inicial', descriptor: 'Necesita asistencia directa para producir en inglés', evidence: 'Producción con guía paso a paso', feedbackSuggestion: 'Vamos a producir juntos en inglés.' },
      ],
    },
    {
      id: 'c4', name: 'Participación en tareas comunicativas', description: 'Participa en actividades que requieren uso funcional del inglés', weight: 25,
      indicators: [
        { levelId: 'avanzado', descriptor: 'Participa con entusiasmo, demuestra confianza y usa el inglés de forma autónoma en las tareas', evidence: 'Participación autónoma y confiada', feedbackSuggestion: 'Tu participación en inglés es ejemplar.' },
        { levelId: 'adecuado', descriptor: 'Participa en las tareas y usa el inglés con apoyo ocasional', evidence: 'Participación con apoyo mínimo', feedbackSuggestion: 'Participaste bien. Sigue ganando confianza.' },
        { levelId: 'en_desarrollo', descriptor: 'Participa con apoyo constante del docente o compañeros', evidence: 'Participación con apoyo', feedbackSuggestion: 'Estás participando cada vez más. ¡Sigue así!' },
        { levelId: 'inicial', descriptor: 'Necesite apoyo directo para participar en actividades en inglés', evidence: 'Participación con asistencia', feedbackSuggestion: 'Vamos a participar juntos en la actividad.' },
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

export function buildPremiumRubric(input: {
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
    case 'tecnologia': criteriaBank = buildTecnologiaCriteria(); break;
    case 'formacion_ciudadana': criteriaBank = buildFormacionCiudadanaCriteria(); break;
    case 'orientacion': criteriaBank = buildOrientacionCriteria(); break;
    case 'ingles': criteriaBank = buildInglesCriteria(); break;
    case 'musica': criteriaBank = buildMusicaCriteria(); break;
    case 'educacion_fisica': criteriaBank = buildEducacionFisicaCriteria(); break;
    case 'filosofia': criteriaBank = buildFilosofiaCriteria(); break;
    case 'biologia': criteriaBank = buildBiologiaCriteria(); break;
    case 'fisica': criteriaBank = buildFisicaCriteria(); break;
    case 'quimica': criteriaBank = buildQuimicaCriteria(); break;
    case 'ciencias_ciudadania': criteriaBank = buildCiudadaniaCriteria(); break;
    case 'parvularia': criteriaBank = buildParvulariaCriteria(); break;
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
