export type RubricPerformanceLevel = {
  id: string;
  label: string;
  score: number;
  color: string;
  description: string;
};

export type RubricIndicator = {
  levelId: string;
  descriptor: string;
  evidence?: string;
  feedbackSuggestion?: string;
};

export type RubricCriterion = {
  id: string;
  name: string;
  description: string;
  weight: number;
  indicators: RubricIndicator[];
};

export type PremiumRubric = {
  title: string;
  subtitle: string;
  nivel: string;
  asignatura: string;
  oa: string;
  tema: string;
  learningGoal: string;
  studentFriendlyGoal: string;
  levels: RubricPerformanceLevel[];
  criteria: RubricCriterion[];
  totalScore: number;
  scoringFormula: string;
  usageInstructions: string[];
  inclusiveAdjustments: string[];
  formativeFeedbackQuestions: string[];
  studentSelfAssessment: {
    title: string;
    prompts: string[];
  };
};

export type PremiumRubricInput = {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  topic: string;
  indicators?: string[];
  skills?: string[];
  additionalContext?: string;
};

type SubjectCategory = 'ciencias' | 'lenguaje' | 'matematica' | 'historia' | 'artes' | 'tecnologia' | 'formacion_ciudadana' | 'orientacion' | 'ingles' | 'general';

type CriteriaTemplate = {
  name: string;
  description: string;
  descriptors: Record<string, { text: string; evidence: string; feedback: string }>;
};

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

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
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

function detectSubjectCategory(subject: string): SubjectCategory {
  const s = subject.toLowerCase();
  if (s.includes('ciencias') || s.includes('natural')) return 'ciencias';
  if (s.includes('lenguaje') || s.includes('comunicación') || s.includes('comunicacion') || s.includes('castellano')) return 'lenguaje';
  if (s.includes('matemática') || s.includes('matematica') || s.includes('mate')) return 'matematica';
  if (s.includes('historia') || s.includes('geografía') || s.includes('geografia') || s.includes('sociales')) return 'historia';
  if (s.includes('arte') || s.includes('visual') || s.includes('música') || s.includes('musica')) return 'artes';
  if (s.includes('tecnolog') || s.includes('inform')) return 'tecnologia';
  if (s.includes('formación ciudadana') || s.includes('formacion ciudadana') || s.includes('ciudadana')) return 'formacion_ciudadana';
  if (s.includes('orientación') || s.includes('orientacion')) return 'orientacion';
  if (s.includes('inglés') || s.includes('ingles')) return 'ingles';
  return 'general';
}

function detectSubjectKeywords(oaText: string): string[] {
  const lower = oaText.toLowerCase();
  const keywords: string[] = [];
  if (lower.includes('planta') || lower.includes('flor') || lower.includes('semilla') || lower.includes('germinación') || lower.includes('germinacion')) keywords.push('plantas');
  if (lower.includes('animal') || lower.includes('alimentación') || lower.includes('alimentacion') || lower.includes('hábitat') || lower.includes('habitat')) keywords.push('animales');
  if (lower.includes('ciclo de vida')) keywords.push('ciclo_de_vida');
  if (lower.includes('ecosistema') || lower.includes('ambiente') || lower.includes('naturaleza')) keywords.push('ecosistema');
  if (lower.includes('texto') || lower.includes('lectura') || lower.includes('comprensión') || lower.includes('comprension')) keywords.push('texto');
  if (lower.includes('número') || lower.includes('numero') || lower.includes('operación') || lower.includes('operacion') || lower.includes('suma') || lower.includes('resta')) keywords.push('operaciones');
  if (lower.includes('geometría') || lower.includes('geometria') || lower.includes('figura') || lower.includes('forma')) keywords.push('geometria');
  if (lower.includes('histórico') || lower.includes('historico') || lower.includes('época') || lower.includes('epoca') || lower.includes('periodo')) keywords.push('historia');
  if (lower.includes('expresión') || lower.includes('expresion') || lower.includes('creatividad') || lower.includes('obra')) keywords.push('expresion');
  if (lower.includes('argument') || lower.includes('opinión') || lower.includes('opinion') || lower.includes('debate')) keywords.push('argumentacion');
  if (lower.includes('experiment') || lower.includes('observación') || lower.includes('observacion') || lower.includes('hipótesis') || lower.includes('hipotesis')) keywords.push('investigacion');
  return keywords;
}

const LEVELS: RubricPerformanceLevel[] = [
  { id: 'avanzado', label: 'Avanzado', score: 4, color: '#059669', description: 'Demuestra dominio superior del criterio evaluado' },
  { id: 'adecuado', label: 'Adecuado', score: 3, color: '#2563EB', description: 'Cumple satisfactoriamente con el criterio' },
  { id: 'en_desarrollo', label: 'En desarrollo', score: 2, color: '#D97706', description: 'Muestra progreso pero necesita apoyo' },
  { id: 'inicial', label: 'Inicial', score: 1, color: '#DC2626', description: 'Requiere acompañamiento significativo' },
];

function buildCriteriaBank(category: SubjectCategory, keywords: string[], oaText: string): CriteriaTemplate[] {
  const concepts = extractConcepts(oaText);
  const mainConcept = concepts[0] || 'el contenido';

  switch (category) {
    case 'ciencias': return buildCienciasCriteria(keywords, oaText, mainConcept);
    case 'lenguaje': return buildLenguajeCriteria(keywords, oaText, mainConcept);
    case 'matematica': return buildMatematicaCriteria(keywords, oaText, mainConcept);
    case 'historia': return buildHistoriaCriteria(keywords, oaText, mainConcept);
    case 'artes': return buildArtesCriteria(keywords, oaText, mainConcept);
    case 'tecnologia': return buildTecnologiaCriteria(keywords, oaText, mainConcept);
    case 'formacion_ciudadana': return buildFormacionCiudadanaCriteria(keywords, oaText, mainConcept);
    case 'orientacion': return buildOrientacionCriteria(keywords, oaText, mainConcept);
    case 'ingles': return buildInglesCriteria(keywords, oaText, mainConcept);
    default: return buildGeneralCriteria(keywords, oaText, mainConcept);
  }
}

function buildCienciasCriteria(keywords: string[], _oaText: string, mainConcept: string): CriteriaTemplate[] {
  const isPlants = keywords.includes('plantas') || keywords.includes('ciclo_de_vida');
  const isAnimals = keywords.includes('animales');
  const isEcosystem = keywords.includes('ecosistema');

  const base: CriteriaTemplate[] = [
    {
      name: 'Observación y descripción de fenómenos',
      description: `Observa y describe con precisión elementos de ${mainConcept}`,
      descriptors: {
        avanzado: {
          text: `Identifica y describe detalles específicos de ${mainConcept}, usando vocabulario científico pertinente como estructura, función y relación con el ambiente`,
          evidence: 'Registro escrito o dibujo con etiquetas correctas de partes y funciones',
          feedback: 'Excelente observación. Lograste identificar detalles que muchos pasan por alto.',
        },
        adecuado: {
          text: `Describe características principales de ${mainConcept} y menciona algunos detalles relevantes con vocabulario adecuado`,
          evidence: 'Lista de características observadas con al menos 3 elementos correctos',
          feedback: 'Buen trabajo observando. Intenta agregar más detalles sobre las funciones de cada parte.',
        },
        en_desarrollo: {
          text: `Reconoce algunos elementos de ${mainConcept} pero necesita apoyo para describirlos con precisión`,
          evidence: 'Identificación parcial de elementos con apoyo de imágenes o guía visual',
          feedback: 'Estás en el camino correcto. Compara tu observación con la de un compañero para enriquecerla.',
        },
        inicial: {
          text: `Requiere apoyo directo para identificar y nombrar elementos de ${mainConcept}`,
          evidence: 'Señalamiento con apoyo del docente o compañeros',
          feedback: 'Vamos a observar juntos. ¿Qué puedes ver en esta imagen?',
        },
      },
    },
    {
      name: 'Uso de vocabulario científico',
      description: `Utiliza términos científicos apropiados para explicar ${mainConcept}`,
      descriptors: {
        avanzado: {
          text: `Emplea vocabulario científico preciso y puede explicar el significado de cada término relacionado con ${mainConcept}`,
          evidence: 'Explicación oral o escrita donde usa y define al menos 3 términos científicos',
          feedback: 'Domina el vocabulario científico. ¿Puedes explicarle a un compañero qué significa cada término?',
        },
        adecuado: {
          text: `Utiliza algunos términos científicos correctamente y logra explicar las ideas principales`,
          evidence: 'Uso correcto de al menos 2 términos científicos en contexto',
          feedback: 'Buen uso del vocabulario. Intenta usar más términos en tu próxima explicación.',
        },
        en_desarrollo: {
          text: `Reconoce algunos términos pero requiere apoyo para usarlos o explicar su significado`,
          evidence: 'Uso guiado de términos con apoyo de banco de palabras o imágenes',
          feedback: 'Estás aprendiendo las palabras clave. Practica usando cada término en una oración.',
        },
        inicial: {
          text: `Presenta dificultades para usar vocabulario científico y necesita apoyo visual o verbal constante`,
          evidence: 'Señalamiento de imágenes asociadas a términos con ayuda del docente',
          feedback: 'Vamos a jugar a emparejar las palabras con las imágenes.',
        },
      },
    },
    {
      name: 'Explicación de relaciones o procesos',
      description: `Explica cómo se relacionan los elementos de ${mainConcept}`,
      descriptors: {
        avanzado: {
          text: `Explica con claridad las relaciones causa-efecto y procesos de ${mainConcept}, conectando conceptos entre sí`,
          evidence: 'Diagrama de flujo, organizador gráfico o explicación oral estructurada',
          feedback: 'Excelente capacidad de explicar procesos. Tu organizador gráfico muestra comprensión profunda.',
        },
        adecuado: {
          text: `Identifica relaciones entre elementos y explica algunos procesos de ${mainConcept} con coherencia`,
          evidence: 'Lista de relaciones identificadas con ejemplos',
          feedback: 'Logras ver las conexiones. Intenta explicar qué pasaría si uno de los elementos cambiara.',
        },
        en_desarrollo: {
          text: `Reconoce algunas relaciones pero necesita apoyo para explicar los procesos de ${mainConcept}`,
          evidence: 'Completar un organizador gráfico con apoyo',
          feedback: 'Estás construyendo tu entendimiento. Usa las pistas visuales para completar las relaciones.',
        },
        inicial: {
          text: `Requiere acompañamiento significativo para identificar relaciones en ${mainConcept}`,
          evidence: 'Señalamiento de relaciones con guía directa del docente',
          feedback: 'Observemos juntos: ¿qué conecta a estos elementos?',
        },
      },
    },
    {
      name: 'Registro de evidencias',
      description: `Registra observaciones y evidencias de forma organizada`,
      descriptors: {
        avanzado: {
          text: `Registra evidencias de forma detallada y organizada, incluyendo mediciones, observaciones y conclusiones propias`,
          evidence: 'Cuaderno de ciencias con registros completos y ordenados',
          feedback: 'Tu registro es un modelo de organización. Incluye todo lo que necesitas para explicar tus hallazgos.',
        },
        adecuado: {
          text: `Registra evidencias principales de forma clara, incluyendo al menos 2 tipos de observación`,
          evidence: 'Tabla de observación o lista con al menos 3 registros',
          feedback: 'Buen registro. Para mejorar, agrega dibujos o mediciones junto a tus observaciones.',
        },
        en_desarrollo: {
          text: `Registra algunas evidencias pero con estructura incompleta o desordenada`,
          evidence: 'Registro parcial con apoyo de plantilla',
          feedback: 'Estás aprendiendo a registrar. Usa la plantilla para asegurarte de incluir todo.',
        },
        inicial: {
          text: `Necesita apoyo significativo para registrar evidencias de observación`,
          evidence: 'Registro con dictado o apoyo visual del docente',
          feedback: 'Vamos a registrar juntos lo que observamos paso a paso.',
        },
      },
    },
    {
      name: 'Comunicación de conclusiones',
      description: `Comunica sus hallazgos y conclusiones con claridad`,
      descriptors: {
        avanzado: {
          text: `Comunica conclusiones propias basadas en evidencias, usando vocabulario científico y conectando con la vida diaria`,
          evidence: 'Presentación oral, póster o informe escrito con conclusiones fundamentadas',
          feedback: 'Comunica como un verdadero científico. Tus conclusiones están bien fundamentadas.',
        },
        adecuado: {
          text: `Presenta conclusiones claras basadas en lo observado, con vocabulario adecuado`,
          evidence: 'Exposición breve o respuesta escrita con al menos 2 conclusiones',
          feedback: ' Buenas conclusiones. Intenta explicar por qué crees que eso ocurre.',
        },
        en_desarrollo: {
          text: `Expresa algunas ideas pero necesita apoyo para formular conclusiones claras`,
          evidence: 'Respuesta oral guiada o completar oraciones de cierre',
          feedback: 'Tienes buenas ideas. Ayuda completar la frase: "Descubrí que..."',
        },
        inicial: {
          text: `Requiere apoyo directo para expresar cualquier conclusión sobre lo observado`,
          evidence: 'Señalamiento de imágenes que representan la conclusión',
          feedback: '¿Qué fue lo más importante que viste? Señala la imagen.',
        },
      },
    },
  ];

  if (isPlants) {
    base[0].name = 'Observación de partes y ciclo de vida';
    base[0].descriptors.avanzado.text = 'Identifica raíz, tallo, hojas, flor y semilla, y describe cada etapa del ciclo de vida de las plantas con vocabulario preciso';
    base[0].descriptors.adecuado.text = 'Identifica las partes principales de la planta y menciona al menos 3 etapas del ciclo de vida';
    base[0].descriptors.en_desarrollo.text = 'Reconoce algunas partes de la planta pero necesita apoyo para nombrar todas o explicar el ciclo';
    base[0].descriptors.inicial.text = 'Señala la planta como un todo y necesita acompañamiento para identificar partes';
  }
  if (isAnimals) {
    base[0].name = 'Observación de características y hábitat';
    base[0].descriptors.avanzado.text = 'Describe características físicas, alimentación y hábitat de los animales, estableciendo relaciones con su supervivencia';
    base[0].descriptors.adecuado.text = 'Identifica características principales y menciona el hábitat de al menos 2 animales';
    base[0].descriptors.en_desarrollo.text = 'Reconoce algunos animales y sus características básicas pero necesita apoyo para relacionarlas con el hábitat';
    base[0].descriptors.inicial.text = 'Nombra algunos animales pero no logra describir sus características o hábitat';
  }
  if (isEcosystem) {
    base[0].name = 'Identificación de componentes del ecosistema';
    base[0].descriptors.avanzado.text = 'Identifica seres vivos y no vivos del ecosistema y explica sus relaciones de dependencia';
    base[0].descriptors.adecuado.text = 'Reconoce elementos del ecosistema y menciona al menos 2 relaciones entre ellos';
    base[0].descriptors.en_desarrollo.text = 'Identifica algunos seres vivos del ecosistema pero necesita apoyo para explicar las relaciones';
    base[0].descriptors.inicial.text = 'Señala seres vivos del ecosistema con guía del docente';
  }

  return base;
}

function buildLenguajeCriteria(keywords: string[], _oaText: string, mainConcept: string): CriteriaTemplate[] {
  const isTexto = keywords.includes('texto');
  const isArgumentacion = keywords.includes('argumentacion');

  if (isArgumentacion) {
    return [
      {
        name: 'Comprensión del texto argumentativo',
        description: `Comprende la tesis, argumentos y evidencias del texto sobre ${mainConcept}`,
        descriptors: {
          avanzado: { text: 'Identifica la tesis central, distingue argumentos de evidencias y reconoce la intención del autor', evidence: 'Anotaciones en el texto señalando tesis, argumentos y evidencias', feedback: 'Excelente análisis. Tu comprensión del texto argumentativo es sólida.' },
          adecuado: { text: 'Identifica la idea principal y al menos 2 argumentos del autor', evidence: 'Subrayado de idea principal y resumen de argumentos', feedback: 'Bien identificaste la idea principal. Intenta distinguir los argumentos de las evidencias.' },
          en_desarrollo: { text: 'Reconoce la idea general pero confunde argumentos con opiniones personales', evidence: 'Lista parcial de ideas del texto', feedback: 'Estás en buen camino. Recuerda que un argumento se apoya en evidencias.' },
          inicial: { text: 'Necesita apoyo para identificar la idea principal del texto', evidence: 'Selección guiada de oraciones clave', feedback: 'Vamos a leer juntos y subrayar lo más importante.' },
        },
      },
      {
        name: 'Construcción de argumentos',
        description: `Construye argumentos propios fundamentados en evidencias del texto o la experiencia`,
        descriptors: {
          avanzado: { text: 'Formula argumentos claros con tesis, evidencia textual y explicación propia, usando conectores adecuados', evidence: 'Escrito argumentativo con al menos 2 argumentos fundamentados', feedback: 'Tus argumentos están bien construidos. La evidencia textual fortalece tu posición.' },
          adecuado: { text: 'Presenta al menos 1 argumento con evidencia y explicación, aunque podría mejorar los conectores', evidence: 'Párrafo argumentativo con al menos 1 argumento claro', feedback: 'Buen argumento. Para mejorar, usa conectores como "además", "por lo tanto".' },
          en_desarrollo: { text: 'Expresa una opinión pero tiene dificultad para fundamentarla con evidencia', evidence: 'Escrito con opinión personal sin evidencia textual', feedback: 'Tu opinión es válida. Ahora busca en el texto algo que la respalde.' },
          inicial: { text: 'Requiere apoyo significativo para expresar una opinión o argumento', evidence: 'Oraciones completas con ayuda del docente', feedback: 'Vamos a construir juntos una idea sobre el texto.' },
        },
      },
      {
        name: 'Uso de evidencia textual',
        description: `Cita y utiliza evidencias del texto para respaldar sus ideas`,
        descriptors: {
          avanzado: { text: 'Cita textualmente fragmentos relevantes y los integra coherentemente en su explicación', evidence: 'Citas textuales correctas entre comillas con referencia al fragmento', feedback: 'Excelente uso de citas textuales. Esto fortalece mucho tu argumento.' },
          adecuado: { text: 'Menciona partes del texto como evidencia, aunque no siempre cita textualmente', evidence: 'Referencia a fragmentos del texto con paráfrasis', feedback: 'Bien usas el texto como apoyo. Intenta incluir citas textuales exactas.' },
          en_desarrollo: { text: 'Señala que algo está en el texto pero no logra citarlo o parafrasearlo con precisión', evidence: 'Referencia vaga al texto', feedback: 'Puedes mejorar citando exactamente qué dice el texto.' },
          inicial: { text: 'No logra identificar evidencias en el texto sin apoyo directo', evidence: 'Selección guiada de fragmentos relevantes', feedback: 'Vamos a buscar juntos las frases que respaldan tu idea.' },
        },
      },
      {
        name: 'Expresión escrita clara',
        description: `Expresa sus ideas de forma clara, coherente y con vocabulario preciso`,
        descriptors: {
          avanzado: { text: 'Escribe con claridad, coherencia y vocabulario preciso, usando estructuras variadas', evidence: 'Texto escrito sin errores graves, con conectores y vocabulario diverso', feedback: 'Tu escritura es clara y fluida. El vocabulario preciso enriquece tu texto.' },
          adecuado: { text: 'Expresa sus ideas de forma clara aunque con algunas repeticiones o errores menores', evidence: 'Texto comprensible con estructura adecuada', feedback: 'Escribiste con claridad. Revisa las repeticiones para hacer el texto más fluido.' },
          en_desarrollo: { text: 'Expresa ideas pero con dificultades de coherencia o vocabulario limitado', evidence: 'Texto comprensible con apoyo del lector', feedback: 'Tienes ideas claras. Para mejorar, busca sinónimos y revisa el orden de las oraciones.' },
          inicial: { text: 'Requiere apoyo significativo para escribir oraciones coherentes', evidence: 'Oraciones simples con ayuda del docente', feedback: 'Vamos a escribir juntos una oración sobre lo que piensas.' },
        },
      },
      {
        name: 'Comprensión lectora',
        description: `Comprende el mensaje del texto, identifica ideas principales y secundarias`,
        descriptors: {
          avanzado: { text: 'Identifica idea principal, ideas secundarias, intención del autor y relaciones entre partes del texto', evidence: 'Mapa conceptual o resumen que muestra jerarquía de ideas', feedback: 'Demuestras una comprensión profunda del texto. Conectaste todas las partes.' },
          adecuado: { text: 'Identifica la idea principal y al menos 1 idea secundaria del texto', evidence: 'Resumen o esquema con ideas identificadas', feedback: 'Bien identificaste las ideas clave. Intenta también detectar la intención del autor.' },
          en_desarrollo: { text: 'Reconoce la idea general pero tiene dificultad para distinguir ideas principales de secundarias', evidence: 'Selección de oraciones importantes con apoyo', feedback: 'Estás mejorando. Pregúntate: ¿Qué dice el autor sobre el tema principal?' },
          inicial: { text: 'Necesita guía directa para identificar ideas en el texto', evidence: 'Lectura guiada con preguntas del docente', feedback: 'Vamos a leer juntos y preguntarnos: ¿De qué habla este texto?' },
        },
      },
    ];
  }

  return [
    {
      name: 'Comprensión del texto',
      description: `Comprende el mensaje, estructura e ideas del texto sobre ${mainConcept}`,
      descriptors: {
        avanzado: { text: 'Identifica la idea principal, ideas secundarias y la intención del autor, conectando el texto con experiencias previas', evidence: 'Mapa conceptual o resumen escrito que muestra jerarquía de ideas', feedback: 'Excelente comprensión. Lograste conectar el texto con tu conocimiento previo.' },
        adecuado: { text: 'Identifica la idea principal y al menos 2 ideas secundarias del texto', evidence: 'Resumen o esquema con las ideas principales identificadas', feedback: 'Bien identificaste las ideas clave. Intenta también detectar la intención del autor.' },
        en_desarrollo: { text: 'Reconoce la idea general del texto pero tiene dificultad para identificar detalles específicos', evidence: 'Selección de oraciones importantes con apoyo visual', feedback: 'Estás en buen camino. Lee nuevamente y subraya lo que más te llame la atención.' },
        inicial: { text: 'Necesita apoyo para identificar la idea principal del texto', evidence: 'Lectura guiada con preguntas del docente', feedback: 'Vamos a leer juntos y preguntarnos: ¿De qué habla este texto?' },
      },
    },
    {
      name: 'Organización de ideas',
      description: `Organiza sus ideas de forma lógica en textos escritos o exposiciones`,
      descriptors: {
        avanzado: { text: 'Estructura sus ideas con introducción, desarrollo y cierre, usando conectores variados y párrafos claros', evidence: 'Texto escrito con estructura clara y uso de conectores', feedback: 'Tu texto tiene una estructura excelente. Los conectores guían al lector perfectamente.' },
        adecuado: { text: 'Presenta ideas en orden lógico con algunos conectores, aunque la estructura podría ser más clara', evidence: 'Texto con al menos 2 párrafos y conectores básicos', feedback: 'Organizaste bien tus ideas. Para mejorar, usa conectores como "además", "sin embargo".' },
        en_desarrollo: { text: 'Expresa ideas pero sin un orden claro, requiere apoyo para estructurar', evidence: 'Lista de ideas sin estructura de párrafo', feedback: 'Tienes buenas ideas. Intenta ordenarlas antes de escribir: ¿Qué va primero?' },
        inicial: { text: 'Requiere plantilla o guía para organizar sus ideas', evidence: 'Completar un organizador gráfico o plantilla', feedback: 'Usa esta plantilla para ayudarte a ordenar tus ideas paso a paso.' },
      },
    },
    {
      name: 'Uso de evidencia textual',
      description: `Cita y utiliza partes del texto para respaldar sus ideas`,
      descriptors: {
        avanzado: { text: 'Cita textualmente fragmentos relevantes y los integra coherentemente en su explicación o argumento', evidence: 'Citas textuales correctas entre comillas con referencia al párrafo', feedback: 'Excelente uso de evidencia textual. Las citas fortalecen tu argumento.' },
        adecuado: { text: 'Menciona o parafrasea partes del texto como evidencia, aunque no siempre cita textualmente', evidence: 'Referencia a fragmentos del texto con paráfrasis', feedback: 'Bien usas el texto como apoyo. Intenta incluir citas textuales exactas.' },
        en_desarrollo: { text: 'Indica que algo está en el texto pero tiene dificultad para citarlo con precisión', evidence: 'Referencia vaga al texto o al autor', feedback: 'Para mejorar, busca la frase exacta en el texto y cópiala entre comillas.' },
        inicial: { text: 'No logra identificar evidencias en el texto sin apoyo directo', evidence: 'Selección guiada de fragmentos relevantes', feedback: 'Vamos a buscar juntos las frases que responden tu pregunta.' },
      },
    },
    {
      name: 'Expresión oral o escrita',
      description: `Expresa sus ideas con claridad, coherencia y vocabulario adecuado`,
      descriptors: {
        avanzado: { text: 'Se expresa con claridad, vocabulario preciso y estructura adecuada, adaptando el lenguaje al contexto', evidence: 'Exposición oral fluida o texto escrito sin errores graves', feedback: 'Tu expresión es clara y precisa. Adaptas bien el lenguaje a la situación.' },
        adecuado: { text: 'Se expresa de forma comprensible con vocabulario adecuado, aunque con algunas repeticiones', evidence: 'Exposición breve o texto comprensible', feedback: 'Te expresaste bien. Para enriquecer, busca sinónimos y usa estructuras variadas.' },
        en_desarrollo: { text: 'Expresa ideas simples con vocabulario limitado y estructura básica', evidence: 'Oraciones simples con apoyo de imágenes o palabras clave', feedback: 'Estás mejorando tu expresión. Intenta usar oraciones más largas.' },
        inicial: { text: 'Requiere apoyo significativo para expresar ideas en oraciones simples', evidence: 'Completar oraciones con ayuda del docente', feedback: 'Vamos a construir juntos una oración sobre lo que piensas.' },
      },
    },
    {
      name: 'Claridad y coherencia',
      description: `Mantiene coherencia temática y claridad en su comunicación`,
      descriptors: {
        avanzado: { text: 'Mantiene un hilo conductor claro, conecta ideas con precisión y adapta el registro al propósito comunicativo', evidence: 'Texto o exposición con hilo conductor claro y vocabulario preciso', feedback: 'Tu comunicación es coherente y clara. El hilo conductor guía perfectamente al lector.' },
        adecuado: { text: 'Mantiene la coherencia general con algunas digresiones menores', evidence: 'Texto o exposición comprensible con idea central clara', feedback: 'Mantuviste la coherencia. Revisa si alguna idea se desvía del tema principal.' },
        en_desarrollo: { text: 'Presenta ideas relacionadas pero con dificultad para mantener el hilo conductor', evidence: 'Texto o exposición con ideas conectadas débilmente', feedback: 'Tus ideas están relacionadas. Para mejorar, pregúntate: ¿Esto se conecta con lo que dije antes?' },
        inicial: { text: 'Sus expresiones son aisladas y necesitan apoyo para mantener coherencia', evidence: 'Oraciones simples con apoyo del docente', feedback: 'Vamos a conectar tus ideas: ¿Qué pasó primero? ¿Y después?' },
      },
    },
  ];
}

function buildMatematicaCriteria(keywords: string[], _oaText: string, mainConcept: string): CriteriaTemplate[] {
  const isOperaciones = keywords.includes('operaciones');
  const isGeometria = keywords.includes('geometria');

  if (isGeometria) {
    return [
      {
        name: 'Identificación de figuras y propiedades',
        description: `Identifica figuras geométricas y sus propiedades en ${mainConcept}`,
        descriptors: {
          avanzado: { text: 'Identifica figuras por sus propiedades (lados, ángulos, simetría) y las clasifica correctamente', evidence: 'Clasificación de figuras con names y propiedades', feedback: 'Excelente identificación. Dominas las propiedades de las figuras.' },
          adecuado: { text: 'Identifica las figuras principales y menciona al menos 2 propiedades de cada una', evidence: 'Lista de figuras con 2 propiedades cada una', feedback: 'Bien identificaste las figuras. Intenta también comparar sus propiedades.' },
          en_desarrollo: { text: 'Reconoce figuras comunes pero tiene dificultad para identificar propiedades', evidence: 'Selección de figuras con apoyo visual', feedback: 'Reconoces las figuras. Ahora observa: ¿cuántos lados tiene cada una?' },
          inicial: { text: 'Necesita apoyo para nombrar y distinguir figuras geométricas', evidence: 'Señalamiento de figuras con guía del docente', feedback: 'Vamos a nombrar juntos las figuras que ves.' },
        },
      },
      {
        name: 'Representación matemática',
        description: `Representa problemas o situaciones usando números, operaciones o modelos`,
        descriptors: {
          avanzado: { text: 'Representa situaciones con ecuaciones, diagramas o modelos matemáticos, justificando su elección', evidence: 'Representación múltiple del problema con justificación', feedback: 'Tu representación es precisa y bien fundamentada.' },
          adecuado: { text: 'Representa situaciones con números y operaciones adecuadas, aunque podría usar más de una forma', evidence: 'Representación numérica o gráfica del problema', feedback: 'Buena representación. Intenta mostrar el problema de otra manera también.' },
          en_desarrollo: { text: 'Identifica los números involucrados pero tiene dificultad para elegir la operación', evidence: 'Identificación de datos sin operación clara', feedback: 'Identificaste los datos. Ahora pregúntate: ¿qué me piden encontrar?' },
          inicial: { text: 'Requiere apoyo para identificar datos y elegir una representación', evidence: 'Selección de datos con guía del docente', feedback: 'Vamos a identificar juntos los números del problema.' },
        },
      },
      {
        name: 'Estrategia de resolución',
        description: `Elige y aplica estrategias adecuadas para resolver el problema`,
        descriptors: {
          avanzado: { text: 'Elige la estrategia más eficiente, la aplica correctamente y verifica el resultado', evidence: 'Resolución con estrategia clara y verificación', feedback: 'Elegiste una estrategia efectiva y verificaste tu resultado. Excelente trabajo.' },
          adecuado: { text: 'Elige una estrategia adecuada y llega al resultado correcto, aunque la verificación es parcial', evidence: 'Resolución paso a paso con resultado correcto', feedback: 'Resolviste correctamente. Intenta siempre verificar tu resultado.' },
          en_desarrollo: { text: 'Intenta una estrategia pero comete errores en el procedimiento', evidence: 'Intento de resolución con errores parciales', feedback: 'Tu estrategia es buena. Revisa cada paso con cuidado.' },
          inicial: { text: 'Necesita guía directa para elegir y aplicar una estrategia', evidence: 'Resolución con apoyo paso a paso del docente', feedback: 'Vamos a resolver juntos paso a paso.' },
        },
      },
      {
        name: 'Precisión del resultado',
        description: `Obtiene resultados precisos y verifica su corrección`,
        descriptors: {
          avanzado: { text: 'Obtiene resultados precisos, verifica con otro método y explica si el resultado tiene sentido', evidence: 'Resultado verificado con segunda estrategia', feedback: 'Tu resultado es preciso y lo verificaste. Esto demuestra seguridad matemática.' },
          adecuado: { text: 'Obtiene el resultado correcto con cálculos precisos', evidence: 'Resultado correcto con procedimiento ordenado', feedback: 'Resultado correcto. Para reforzar, intenta verificar con otra estrategia.' },
          en_desarrollo: { text: 'Obtiene resultados parcialmente correctos con algunos errores de cálculo', evidence: 'Resultado con errores menores en cálculos', feedback: 'Estás cerca. Revisa cada operación con cuidado.' },
          inicial: { text: 'Obtiene resultados incorrectos y necesita apoyo para verificar', evidence: 'Resultado con errores significativos', feedback: 'Vamos a revisar juntos cada paso del cálculo.' },
        },
      },
      {
        name: 'Explicación del procedimiento',
        description: `Explica con claridad cómo resolvió el problema y por qué usó esa estrategia`,
        descriptors: {
          avanzado: { text: 'Explica cada paso del procedimiento, justifica la estrategia elegida y compara con otras posibles', evidence: 'Explicación oral o escrita con justificación', feedback: 'Explicas como un verdadero matemático. Tu razonamiento es claro y fundamentado.' },
          adecuado: { text: 'Explica los pasos principales de su resolución y la estrategia que utilizó', evidence: 'Descripción de los pasos seguidos', feedback: 'Bien explicaste tu proceso. Intenta también explicar por qué elegiste esa estrategia.' },
          en_desarrollo: { text: 'Describe algunos pasos pero tiene dificultad para explicar el porqué', evidence: 'Descripción parcial del procedimiento', feedback: 'Estás aprendiendo a explicar tu proceso. Pregúntate: ¿por qué hice esto?' },
          inicial: { text: 'Requiere apoyo para verbalizar los pasos de su resolución', evidence: 'Explicación con preguntas guía del docente', feedback: 'Vamos a explicar juntos qué hiciste paso a paso.' },
        },
      },
    ];
  }

  return [
    {
      name: 'Comprensión del problema',
      description: `Identifica datos, incógnitas y relaciones en el problema planteado`,
      descriptors: {
        avanzado: { text: 'Identifica todos los datos, la incógnita, las relaciones matemáticas y las restricciones del problema', evidence: 'Lista de datos, incógnita y relaciones identificadas', feedback: 'Identificaste todo lo necesario para resolver el problema.' },
        adecuado: { text: 'Identifica los datos principales y la incógnita del problema', evidence: 'Extracción de datos y pregunta del problema', feedback: 'Bien identificaste los datos. Revisa si no falta alguna restricción.' },
        en_desarrollo: { text: 'Reconoce algunos datos pero tiene dificultad para identificar la incógnita', evidence: 'Selección parcial de datos con apoyo', feedback: 'Identificaste algunos datos. ¿Qué te piden encontrar?' },
        inicial: { text: 'Necesita apoyo para extraer datos del enunciado', evidence: 'Lectura guiada con preguntas del docente', feedback: 'Vamos a leer juntos y subrayar los números que aparecen.' },
      },
    },
    {
      name: 'Estrategia de resolución',
      description: `Elige y aplica la estrategia matemática adecuada`,
      descriptors: {
        avanzado: { text: 'Elige la estrategia más eficiente entre varias opciones y la aplica con precisión', evidence: 'Resolución con estrategia clara y justificación de elección', feedback: 'Elegiste la mejor estrategia. Tu razonamiento matemático es sólido.' },
        adecuado: { text: 'Elige una estrategia adecuada y resuelve correctamente', evidence: 'Resolución paso a paso con resultado correcto', feedback: 'Resolviste bien. Intenta siempre verificar tu resultado.' },
        en_desarrollo: { text: 'Intenta una estrategia pero comete errores en la aplicación', evidence: 'Intento de resolución con errores parciales', feedback: 'Tu estrategia es buena. Revisa cada paso con cuidado.' },
        inicial: { text: 'Necesita guía para elegir y aplicar una estrategia', evidence: 'Resolución guiada paso a paso', feedback: 'Vamos a resolver juntos. Primero identificamos qué operación usar.' },
      },
    },
    {
      name: 'Representación matemática',
      description: `Usa números, símbolos, gráficos o modelos para representar la situación`,
      descriptors: {
        avanzado: { text: 'Representa la situación con múltiples formas (ecuaciones, gráficos, diagramas) y justifica su elección', evidence: 'Representación múltiple y bien fundamentada', feedback: 'Usaste varias formas para representar el problema. Esto muestra comprensión profunda.' },
        adecuado: { text: 'Representa la situación con números y operaciones de forma clara', evidence: 'Representación numérica o gráfica correcta', feedback: 'Buena representación. Intenta también mostrarla con un gráfico o modelo.' },
        en_desarrollo: { text: 'Identifica números pero tiene dificultad para organizar la representación', evidence: 'Representación parcial con apoyo', feedback: 'Identificaste los números. Ahora organízalos en una ecuación o diagrama.' },
        inicial: { text: 'Requiere apoyo para crear una representación matemática', evidence: 'Completar plantilla de representación', feedback: 'Usa esta plantilla para ayudarte a organizar la información.' },
      },
    },
    {
      name: 'Precisión del cálculo',
      description: `Realiza cálculos con precisión y verifica el resultado`,
      descriptors: {
        avanzado: { text: 'Realiza cálculos precisos, verifica con otro método y explica si el resultado tiene sentido en el contexto', evidence: 'Resultado verificado y validado en contexto', feedback: 'Tu cálculo es preciso y lo verificaste. ¡Seguridad matemática!' },
        adecuado: { text: 'Realiza cálculos correctos y obtiene el resultado esperado', evidence: 'Resultado correcto con procedimiento visible', feedback: 'Cálculo correcto. Para reforzar, intenta verificar con otra estrategia.' },
        en_desarrollo: { text: 'Realiza cálculos con algunos errores que afectan el resultado', evidence: 'Resultado con errores de cálculo', feedback: 'Tu proceso es bueno. Revisa cada operación aritmética con cuidado.' },
        inicial: { text: 'Necesita apoyo significativo para realizar cálculos', evidence: 'Cálculos con calculadora o apoyo del docente', feedback: 'Vamos a practicar los cálculos paso a paso.' },
      },
    },
    {
      name: 'Explicación del procedimiento',
      description: `Explica con claridad cómo resolvió el problema y por qué`,
      descriptors: {
        avanzado: { text: 'Explica cada paso, justifica la estrategia, verifica el resultado y lo conecta con el contexto del problema', evidence: 'Explicación completa con justificación y verificación', feedback: 'Explicas como un verdadero matemático. Tu razonamiento es claro.' },
        adecuado: { text: 'Explica los pasos principales y la estrategia utilizada', evidence: 'Descripción de pasos con resultado', feedback: 'Bien explicaste tu proceso. Intenta también explicar por qué elegiste esa estrategia.' },
        en_desarrollo: { text: 'Describe algunos pasos pero le cuesta explicar el porqué', evidence: 'Descripción parcial del procedimiento', feedback: 'Estás mejorando. Pregúntate: ¿por qué hice esto?' },
        inicial: { text: 'Requiere apoyo para verbalizar su procedimiento', evidence: 'Explicación con preguntas guía', feedback: 'Vamos a explicar juntos qué hiciste.' },
      },
    },
  ];
}

function buildHistoriaCriteria(keywords: string[], _oaText: string, mainConcept: string): CriteriaTemplate[] {
  return [
    {
      name: 'Comprensión del contexto histórico',
      description: `Comprende el contexto, actores y período histórico de ${mainConcept}`,
      descriptors: {
        avanzado: { text: 'Ubica el evento en su período, identifica actores principales y describe el contexto social, económico y político', evidence: 'Línea de tiempo o mapa conceptual con contexto completo', feedback: 'Excelente comprensión del contexto. Conectaste todos los elementos históricos.' },
        adecuado: { text: 'Identifica el período, los actores principales y al menos 2 características del contexto', evidence: 'Línea de tiempo con fechas y actores identificados', feedback: 'Bien ubicaste el evento. Intenta también explicar el contexto económico.' },
        en_desarrollo: { text: 'Ubica parcialmente el evento pero tiene dificultad para describir el contexto', evidence: 'Fechas y actores identificados con apoyo', feedback: 'Estás ubicando el evento. ¿Qué pasaba en esa época en otros ámbitos?' },
        inicial: { text: 'Necesita apoyo para ubicar el evento en el tiempo y contexto', evidence: 'Selección de fechas y actores con guía', feedback: 'Vamos a ubicar juntos este evento en la línea del tiempo.' },
      },
    },
    {
      name: 'Uso de fuentes o evidencias históricas',
      description: `Identifica y utiliza fuentes históricas para respaldar sus análisis`,
      descriptors: {
        avanzado: { text: 'Identifica tipos de fuentes, evalúa su confiabilidad y las integra coherentemente en su análisis', evidence: 'Análisis de fuente con identificación de tipo y confiabilidad', feedback: 'Manejas las fuentes históricas como un verdadero historiador.' },
        adecuado: { text: 'Identifica al menos 1 fuente histórica y la usa como evidencia', evidence: 'Cita o referencia a una fuente histórica', feedback: 'Bien usaste la fuente. Intenta evaluar si es confiable y por qué.' },
        en_desarrollo: { text: 'Reconoce que existen fuentes pero tiene dificultad para usarlas', evidence: 'Mención de una fuente sin análisis', feedback: 'Las fuentes son importantes. Pregúntate: ¿Quién la creó y por qué?' },
        inicial: { text: 'Requiere apoyo significativo para identificar fuentes históricas', evidence: 'Selección de fuente con guía del docente', feedback: 'Vamos a identificar juntos qué tipo de fuente es esta.' },
      },
    },
    {
      name: 'Explicación de causas y consecuencias',
      description: `Identifica y explica las causas que originaron el evento y sus consecuencias`,
      descriptors: {
        avanzado: { text: 'Explica causas profundas y consecuencias a corto y largo plazo, estableciendo relaciones de causalidad claras', evidence: 'Diagrama de causas y consecuencias con relaciones explicadas', feedback: 'Excelente análisis de causalidad. Conectaste las causas con sus efectos a largo plazo.' },
        adecuado: { text: 'Identifica al menos 2 causas y 2 consecuencias del evento', evidence: 'Lista de causas y consecuencias con explicaciones', feedback: 'Bien identificaste las causas y consecuencias. Intenta explicar cómo se relacionan.' },
        en_desarrollo: { text: 'Identifica algunas causas o consecuencias pero no logra explicar la relación', evidence: 'Lista parcial de causas o consecuencias', feedback: 'Estás identificando elementos clave. Pregúntate: ¿Qué causó esto?' },
        inicial: { text: 'Necesita apoyo para identificar causas y consecuencias', evidence: 'Selección guiada de causas y consecuencias', feedback: 'Vamos a identificar juntos qué pasó y por qué.' },
      },
    },
    {
      name: 'Relación con el contexto actual',
      description: `Establece relaciones entre el evento histórico y la realidad actual`,
      descriptors: {
        avanzado: { text: 'Establece conexiones significativas entre el evento histórico y temas actuales, explicando su relevancia', evidence: 'Escrito o exposición que conecta pasado y presente', feedback: 'Lograste ver la relevancia histórica. Excelente conexión con el presente.' },
        adecuado: { text: 'Menciona al menos 1 relación entre el evento y la actualidad', evidence: 'Mención de conexión con tema actual', feedback: 'Bien conectaste con el presente. Intenta explicar cómo nos afecta hoy.' },
        en_desarrollo: { text: 'Reconoce que hay relaciones pero tiene dificultad para explicarlas', evidence: 'Intento de conexión con apoyo', feedback: 'Estás pensando en la relevancia. ¿Qué sigue igual o qué cambió?' },
        inicial: { text: 'Requiere guía para establecer relaciones con el contexto actual', evidence: 'Conexión con apoyo del docente', feedback: 'Vamos a pensar: ¿esto sigue pasando hoy? ¿Cómo?' },
      },
    },
    {
      name: 'Comunicación histórica',
      description: `Comunica sus análisis históricos de forma clara, precisa y bien fundamentada`,
      descriptors: {
        avanzado: { text: 'Comunica con vocabulario histórico preciso, estructura clara y argumentos bien fundamentados', evidence: 'Escrito o exposición con vocabulario histórico y argumentación', feedback: 'Tu comunicación histórica es excelente. Usas vocabulario preciso y argumentas bien.' },
        adecuado: { text: 'Comunica sus ideas de forma clara con vocabulario histórico adecuado', evidence: 'Escrito o exposición comprensible con vocabulario histórico', feedback: 'Te expresaste bien. Para mejorar, usa más términos históricos específicos.' },
        en_desarrollo: { text: 'Expresa ideas pero con vocabulario general y estructura básica', evidence: 'Escrito o exposición con vocabulario general', feedback: 'Tienes ideas claras. Intenta usar vocabulario histórico: "causa", "consecuencia", "período".' },
        inicial: { text: 'Requiere apoyo para expresar ideas históricas de forma coherente', evidence: 'Explicación con preguntas guía del docente', feedback: 'Vamos a construir juntos una explicación sobre este evento.' },
      },
    },
  ];
}

function buildArtesCriteria(keywords: string[], _oaText: string, mainConcept: string): CriteriaTemplate[] {
  return [
    {
      name: 'Exploración de materiales y técnicas',
      description: `Explora diversos materiales y técnicas artísticas para expresar ${mainConcept}`,
      descriptors: {
        avanzado: { text: 'Selecciona y combina materiales y técnicas de forma intencional, explicando por qué elige cada uno', evidence: ' Registro del proceso creativo con justificación de elecciones', feedback: 'Tus elecciones de materiales son intencionales y creativas.' },
        adecuado: { text: 'Utiliza al menos 2 materiales o técnicas diferentes de forma adecuada', evidence: 'Obra o proceso que muestra uso de múltiples materiales', feedback: 'Experimentaste con varios materiales. ¿Cómo cambió tu obra al usar cada uno?' },
        en_desarrollo: { text: 'Utiliza materiales básicos con apoyo para experimentar', evidence: 'Uso de materiales con guía del docente', feedback: 'Estás explorando. No tengas miedo de probar cosas nuevas.' },
        inicial: { text: 'Necesita apoyo significativo para manipular materiales', evidence: 'Participación con asistencia del docente', feedback: 'Vamos a explorar juntos qué podemos hacer con estos materiales.' },
      },
    },
    {
      name: 'Expresión de ideas y emociones',
      description: `Expresa ideas, sentimientos y emociones a través de la obra artística`,
      descriptors: {
        avanzado: { text: 'Expresa ideas propias y emociones de forma original, conectando la obra con su intención comunicativa', evidence: 'Obra con reflexión escrita o verbal sobre la intención', feedback: 'Tu obra comunica emociones e ideas con originalidad.' },
        adecuado: { text: 'Expresa sentimientos e ideas en su obra de forma comprensible', evidence: 'Obra que refleja una intención clara', feedback: 'Lograste expresar lo que sentías. La obra comunica tu idea.' },
        en_desarrollo: { text: 'Intenta expresar algo pero la obra es más exploratoria que comunicativa', evidence: 'Obra con apoyo del docente para definir intención', feedback: 'Tu obra muestra exploración. ¿Qué quisiste decir con ella?' },
        inicial: { text: 'Requiere acompañamiento para definir qué quiere expresar', evidence: 'Creación con guía paso a paso', feedback: 'Vamos a definir juntos qué quieres expresar en tu obra.' },
      },
    },
    {
      name: 'Uso de elementos del lenguaje visual',
      description: `Utiliza línea, color, forma, textura y composición de forma intencional`,
      descriptors: {
        avanzado: { text: 'Emplea elementos del lenguaje visual de forma intencional y explican cómo contribuyen a la obra', evidence: 'Análisis propio de los elementos utilizados', feedback: 'Domina los elementos visuales y los usas con propósito.' },
        adecuado: { text: 'Utiliza al menos 3 elementos del lenguaje visual de forma adecuada', evidence: 'Obra que muestra uso de color, forma y textura', feedback: 'Usaste varios elementos visuales. Intenta explicar por qué elegiste cada uno.' },
        en_desarrollo: { text: 'Utiliza algunos elementos de forma básica sin intención clara', evidence: 'Obra con uso limitado de elementos', feedback: 'Estás usando algunos elementos. Pregúntate: ¿qué color mejoraría esto?' },
        inicial: { text: 'Requiere apoyo para incorporar elementos del lenguaje visual', evidence: 'Creación con sugerencias del docente', feedback: 'Vamos a pensar juntos qué colores y formas usar.' },
      },
    },
    {
      name: 'Proceso creativo',
      description: `Desarrolla un proceso creativo que incluye planificación, creación y reflexión`,
      descriptors: {
        avanzado: { text: 'Planifica, crea y reflexiona sobre su obra, haciendo ajustes y mejoras durante el proceso', evidence: 'Boceto, obra final y reflexión escrita o verbal', feedback: 'Tu proceso creativo es completo. Planificaste, creaste y reflexionaste.' },
        adecuado: { text: 'Desarrolla su obra con algún grado de planificación y revisión', evidence: 'Boceto o planificación previa y obra final', feedback: 'Tuviste un proceso creativo. Para mejorar, planifica más antes de crear.' },
        en_desarrollo: { text: 'Crea de forma espontánea sin planificación ni revisión evidente', evidence: 'Obra sin planificación previa', feedback: 'Creaste algo. Intenta planificar antes: ¿qué quieres hacer?' },
        inicial: { text: 'Necesita guía directa para desarrollar su proceso creativo', evidence: 'Creación con pasos guiados por el docente', feedback: 'Vamos a seguir juntos los pasos: planificar, crear, revisar.' },
      },
    },
    {
      name: 'Reflexión sobre la obra',
      description: 'Reflexiona sobre su obra y la de otros, valorando el proceso y producto',
      descriptors: {
        avanzado: { text: 'Reflexiona críticamente sobre su obra y la de otros, usando vocabulario artístico y proponiendo mejoras', evidence: 'Escrito o exposición con análisis crítico y propuestas', feedback: 'Tu reflexión es profunda y usa vocabulario artístico preciso.' },
        adecuado: { text: 'Comenta su obra y la de otros con vocabulario adecuado', evidence: 'Comentario con al menos 2 observaciones', feedback: 'Reflexionaste bien. Intenta también proponer mejoras concretas.' },
        en_desarrollo: { text: 'Expresa opiniones simples sobre su obra sin vocabulario artístico', evidence: 'Opinión general sin análisis', feedback: 'Estás reflexionando. Usa palabras como "composición", "color", "equilibrio".' },
        inicial: { text: 'Requiere apoyo para expresar cualquier reflexión sobre la obra', evidence: 'Reflexión con preguntas guía del docente', feedback: 'Vamos a pensar juntos: ¿qué te gustó de tu obra?' },
      },
    },
  ];
}

function buildTecnologiaCriteria(_keywords: string[], _oaText: string, _mainConcept: string): CriteriaTemplate[] {
  return [
    { name: 'Comprensión del problema tecnológico', description: 'Identifica la necesidad o problema a resolver', descriptors: { avanzado: { text: 'Analiza el problema desde múltiples perspectivas y define requisitos claros', evidence: 'Análisis con requisitos especificados', feedback: 'Análisis completo del problema.' }, adecuado: { text: 'Identifica el problema y menciona algunos requisitos', evidence: 'Descripción del problema', feedback: 'Identificaste bien el problema.' }, en_desarrollo: { text: 'Describe el problema de forma general', evidence: 'Descripción básica', feedback: 'Describe más detalles del problema.' }, inicial: { text: 'Necesita apoyo para identificar el problema', evidence: 'Descripción con guía', feedback: 'Vamos a definir juntos el problema.' } } },
    { name: 'Diseño de la solución', description: 'Diseña una solución tecnológica adecuada', descriptors: { avanzado: { text: 'Diseña una solución innovadora, considerando materiales, herramientas y pasos', evidence: 'Plano, boceto o plan detallado', feedback: 'Tu diseño es innovador y bien planificado.' }, adecuado: { text: 'Propone una solución viable con algunos detalles', evidence: 'Propuesta con materiales y pasos', feedback: 'Buena propuesta. Agrega más detalles.' }, en_desarrollo: { text: 'Propone una idea general sin detalles técnicos', evidence: 'Idea general', feedback: 'Tu idea es buena. Ahora define los pasos.' }, inicial: { text: 'Requiere guía para diseñar la solución', evidence: 'Diseño con apoyo', feedback: 'Vamos a diseñar juntos.' } } },
    { name: 'Construcción o programación', description: 'Construye o programa la solución siguiendo el diseño', descriptors: { avanzado: { text: 'Construye o programa con precisión, resolviendo problemas durante el proceso', evidence: 'Prototipo o programa funcional', feedback: 'Construiste con precisión y resolviste problemas.' }, adecuado: { text: 'Construye o programa la solución con resultados funcionales', evidence: 'Prototipo o programa que funciona', feedback: 'Funciona bien. ¿Cómo podrías mejorarlo?' }, en_desarrollo: { text: 'Intenta construir o programar con apoyo significativo', evidence: 'Prototipo parcial con ayuda', feedback: 'Estás avanzando. Sigue con el apoyo.' }, inicial: { text: 'Necesita asistencia directa para construir o programar', evidence: 'Construcción con guía paso a paso', feedback: 'Vamos a construir juntos.' } } },
    { name: 'Evaluación y mejora', description: 'Evalúa su solución y propone mejoras', descriptors: { avanzado: { text: 'Evalúa críticamente su solución, identifica debilidades y propone mejoras fundamentadas', evidence: 'Evaluación con criterios y propuestas', feedback: 'Tu evaluación es crítica y fundamentada.' }, adecuado: { text: 'Evalúa su solución y menciona al menos 1 mejora', evidence: 'Evaluación con sugerencia', feedback: 'Bien evaluaste. ¿Qué cambiarías?' }, en_desarrollo: { text: 'Reconoce que la solución puede mejorar pero sin especificar cómo', evidence: 'Evaluación general', feedback: 'Identifica algo concreto que mejorar.' }, inicial: { text: 'Requiere apoyo para evaluar su solución', evidence: 'Evaluación con preguntas guía', feedback: 'Vamos a evaluar juntos: ¿funciona? ¿Qué falta?' } } },
    { name: 'Comunicación técnica', description: 'Explica su solución y proceso de forma clara', descriptors: { avanzado: { text: 'Explica su solución con vocabulario técnico, mostrando el proceso y justificando decisiones', evidence: 'Presentación técnica con vocabulario adecuado', feedback: 'Comunicas como un verdadero ingeniero.' }, adecuado: { text: 'Explica su solución de forma clara con algunos términos técnicos', evidence: 'Presentación de la solución', feedback: 'Explicaste bien. Usa más términos técnicos.' }, en_desarrollo: { text: 'Describe su solución de forma básica', evidence: 'Descripción simple', feedback: 'Describe más detalles técnicos.' }, inicial: { text: 'Necesita apoyo para explicar su solución', evidence: 'Explicación con ayuda', feedback: 'Vamos a explicar juntos tu solución.' } } },
  ];
}

function buildFormacionCiudadanaCriteria(_keywords: string[], _oaText: string, _mainConcept: string): CriteriaTemplate[] {
  return [
    { name: 'Comprensión de normas y valores', description: 'Comprende normas, valores y principios ciudadanos', descriptors: { avanzado: { text: 'Explica normas y valores, conectándolos con situaciones reales y su importancia social', evidence: 'Análisis con ejemplos reales', feedback: 'Comprendes la importancia de las normas en la sociedad.' }, adecuado: { text: 'Identifica al menos 2 normas o valores y menciona su importancia', evidence: 'Lista de normas/valores con explicación', feedback: 'Identificaste bien las normas.' }, en_desarrollo: { text: 'Reconoce algunas normas pero sin explicar su importancia', evidence: 'Mención de normas', feedback: '¿Por qué es importante esta norma?' }, inicial: { text: 'Necesita apoyo para identificar normas y valores', evidence: 'Selección con guía', feedback: 'Vamos a identificar juntos las normas.' } } },
    { name: 'Participación responsable', description: 'Participa de forma respetuosa y responsable en contextos ciudadanos', descriptors: { avanzado: { text: 'Participa activamente, respeta diversas opiniones y aporta construyendo consensos', evidence: 'Registro de participación en debates o actividades', feedback: 'Participas de forma ejemplar y constructiva.' }, adecuado: { text: 'Participa y respeta las opiniones de otros', evidence: 'Participación en actividad grupal', feedback: 'Participaste bien. Intenta también aportar ideas propias.' }, en_desarrollo: { text: 'Participa con apoyo y a veces tiene dificultad para respetar diversas opiniones', evidence: 'Participación guiada', feedback: 'Estás aprendiendo a participar. Recuerda escuchar antes de hablar.' }, inicial: { text: 'Necesita acompañamiento significativo para participar', evidence: 'Participación con apoyo directo', feedback: 'Vamos a participar juntos de forma respetuosa.' } } },
    { name: 'Toma de decisiones informada', description: 'Toma decisiones considerando información, consecuencias y perspectivas diversas', descriptors: { avanzado: { text: 'Analiza opciones, evalúa consecuencias y toma decisiones fundamentadas, considerando diversas perspectivas', evidence: 'Análisis de opciones con justificación', feedback: 'Tomas decisiones de forma madura y fundamentada.' }, adecuado: { text: 'Considera al menos 2 opciones y sus consecuencias antes de decidir', evidence: 'Comparación de opciones', feedback: 'Bien consideraste las opciones. ¿Qué consecuencias tiene cada una?' }, en_desarrollo: { text: 'Toma decisiones sin analizar opciones o consecuencias', evidence: 'Decisión con reflexión guiada', feedback: 'Piensa antes de decidir: ¿qué opciones tengo?' }, inicial: { text: 'Requiere guía para analizar opciones y consecuencias', evidence: 'Decisiones con apoyo', feedback: 'Vamos a analizar juntos las opciones.' } } },
    { name: 'Valoración de la diversidad', description: 'Valora la diversidad cultural, de género y de capacidades', descriptors: { avanzado: { text: 'Reconoce y valora la diversidad, explica su importancia y propone acciones para la inclusión', evidence: 'Propuestas de inclusión con fundamentación', feedback: 'Valoras la diversidad y propones acciones concretas.' }, adecuado: { text: 'Reconoce la diversidad y menciona su valor', evidence: 'Mención de la diversidad como valor', feedback: 'Bien valoras la diversidad. ¿Cómo puedes incluir a todos?' }, en_desarrollo: { text: 'Reconoce que existen diferencias pero sin valorarlas explícitamente', evidence: 'Reconocimiento de diferencias', feedback: 'Las diferencias nos enriquecen. ¿Cómo?' }, inicial: { text: 'Necesita apoyo para reconocer y valorar la diversidad', evidence: 'Reconocimiento con guía', feedback: 'Vamos a pensar en cómo somos diferentes y por qué eso es bueno.' } } },
  ];
}

function buildOrientacionCriteria(_keywords: string[], _oaText: string, _mainConcept: string): CriteriaTemplate[] {
  return [
    { name: 'Reconocimiento personal y social', description: 'Reconoce sus cualidades, emociones y relación con otros', descriptors: { avanzado: { text: 'Identifica sus emociones, cualidades y cómo influyen en su relación con otros', evidence: 'Reflexión personal completa', feedback: 'Te conoces muy bien y eso es una fortaleza.' }, adecuado: { text: 'Identifica al menos 2 emociones o cualidades personales', evidence: 'Autoconocimiento básico', feedback: 'Bien te identificaste. ¿Cómo te hace sentir eso?' }, en_desarrollo: { text: 'Reconoce algunas emociones con apoyo', evidence: 'Reconocimiento con guía', feedback: 'Estás aprendiendo a conocerte.' }, inicial: { text: 'Necesita apoyo significativo para reconocer sus emociones', evidence: 'Reconocimiento con asistencia directa', feedback: 'Vamos a explorar juntos cómo te sientes.' } } },
    { name: 'Convivencia y autocuidado', description: 'Practica hábitos de convivencia, autocuidado y bienestar', descriptors: { avanzado: { text: 'Demuestra hábitos de convivencia y autocuidado de forma autónoma y proactiva', evidence: 'Registro de hábitos y participación en acuerdos', feedback: 'Tus hábitos de convivencia son ejemplares.' }, adecuado: { text: 'Cumple acuerdos de convivencia y muestra algunos hábitos de autocuidado', evidence: 'Participación en acuerdos', feedback: 'Bien cumples los acuerdos. Sigue fortaleciendo tus hábitos.' }, en_desarrollo: { text: 'Participa en acuerdos con recordatorio y apoyo del docente', evidence: 'Participación con recordatorios', feedback: 'Estás aprendiendo a convivir mejor.' }, inicial: { text: 'Necesita apoyo constante para convivir y cuidarse', evidence: 'Convivencia con apoyo directo', feedback: 'Vamos a establecer juntos hábitos de convivencia.' } } },
    { name: 'Toma de decisiones', description: 'Toma decisiones considerando sus necesidades, las de otros y consecuencias', descriptors: { avanzado: { text: 'Toma decisiones reflexivas, considerando sus necesidades, las de otros y las consecuencias', evidence: 'Registro de decisiones y justificación', feedback: 'Tomas decisiones de forma madura y responsable.' }, adecuado: { text: 'Toma decisiones considerando al menos dos factores', evidence: 'Decisión con justificación', feedback: 'Bien consideraste los factores.' }, en_desarrollo: { text: 'Toma decisiones impulsivas o sin considerar consecuencias', evidence: 'Decisión con reflexión guiada', feedback: 'Piensa antes de decidir: ¿qué consecuencias tiene?' }, inicial: { text: 'Requiere guía para tomar decisiones', evidence: 'Decisiones con apoyo', feedback: 'Vamos a analizar juntos las opciones.' } } },
    { name: 'Participación respetuosa', description: 'Participa de forma respetuosa en actividades de orientación y bienestar', descriptors: { avanzado: { text: 'Participa activamente, aporta ideas y demuestra empatía y respeto por los demás', evidence: 'Participación constructiva y empática', feedback: 'Tu participación es respetuosa y empática.' }, adecuado: { text: 'Participa y respeta a los demás en las actividades', evidence: 'Participación respetuosa', feedback: 'Participaste bien. Sigue manteniendo el respeto.' }, en_desarrollo: { text: 'Participa con recordatorio del docente para mantener el respeto', evidence: 'Participación con recordatorio', feedback: 'Estás aprendiendo a participar respetuosamente.' }, inicial: { text: 'Necesita apoyo constante para participar de forma respetuosa', evidence: 'Participación con apoyo directo', feedback: 'Vamos a participar juntos de forma respetuosa.' } } },
  ];
}

function buildInglesCriteria(_keywords: string[], _oaText: string, _mainConcept: string): CriteriaTemplate[] {
  return [
    { name: 'Comprensión de vocabulario', description: 'Reconoce y comprende vocabulario y expresiones en inglés', descriptors: { avanzado: { text: 'Comprende vocabulario variado y lo usa en contexto, demostrando dominio del significado', evidence: 'Uso correcto de vocabulario en oraciones', feedback: 'Tu comprensión de vocabulario es excelente.' }, adecuado: { text: 'Comprende al menos 5 palabras o expresiones y las usa en contexto simple', evidence: 'Identificación y uso de vocabulario', feedback: 'Bien comprendes el vocabulario. Sigue practicando.' }, en_desarrollo: { text: 'Reconoce algunas palabras con apoyo visual o del docente', evidence: 'Reconocimiento con apoyo', feedback: 'Estás aprendiendo nuevas palabras. Muy bien.' }, inicial: { text: 'Necesita apoyo constante para comprender vocabulario', evidence: 'Comprensión con asistencia directa', feedback: 'Vamos a aprender juntos nuevas palabras.' } } },
    { name: 'Uso comunicativo', description: 'Usa el inglés para comunicar ideas de forma básica', descriptors: { avanzado: { text: 'Se comunica con fluidez, usando estructuras variadas y vocabulario preciso', evidence: 'Comunicación oral o escrita fluida', feedback: 'Te comunicas en inglés con gran fluidez.' }, adecuado: { text: 'Se comunica en frases simples y comprende respuestas básicas', evidence: 'Comunicación en frases simples', feedback: 'Te comunicas bien. Intenta usar frases más largas.' }, en_desarrollo: { text: 'Usa palabras sueltas o frases muy cortas con apoyo', evidence: 'Comunicación con apoyo', feedback: 'Estás construyendo tu capacidad de comunicación.' }, inicial: { text: 'Necesita guía directa para comunicar en inglés', evidence: 'Comunicación con asistencia', feedback: 'Vamos a comunicarnos juntos en inglés.' } } },
    { name: 'Producción oral y escrita', description: 'Produce textos o expresiones orales en inglés', descriptors: { avanzado: { text: 'Produce textos o discursos coherentes con vocabulario variado y estructura correcta', evidence: 'Producción escrita u oral completa', feedback: 'Tu producción en inglés es sobresaliente.' }, adecuado: { text: 'Produce textos o expresiones orales con estructura básica y algunos errores menores', evidence: 'Producción con errores menores', feedback: 'Buena producción. Revisa la ortografía o pronunciación.' }, en_desarrollo: { text: 'Produce con apoyo significativo, usando frases memorizadas', evidence: 'Producción con apoyo', feedback: 'Estás avanzando en tu producción.' }, inicial: { text: 'Necesita asistencia directa para producir en inglés', evidence: 'Producción con guía paso a paso', feedback: 'Vamos a producir juntos en inglés.' } } },
    { name: 'Participación en tareas comunicativas', description: 'Participa en actividades que requieren uso funcional del inglés', descriptors: { avanzado: { text: 'Participa con entusiasmo, demuestra confianza y usa el inglés de forma autónoma en las tareas', evidence: 'Participación autónoma y confiada', feedback: 'Tu participación en inglés es ejemplar.' }, adecuado: { text: 'Participa en las tareas y usa el inglés con apoyo ocasional', evidence: 'Participación con apoyo mínimo', feedback: 'Participaste bien. Sigue ganando confianza.' }, en_desarrollo: { text: 'Participa con apoyo constante del docente o compañeros', evidence: 'Participación con apoyo', feedback: 'Estás participando cada vez más. ¡Sigue así!' }, inicial: { text: 'Necesita apoyo directo para participar en actividades en inglés', evidence: 'Participación con asistencia', feedback: 'Vamos a participar juntos en la actividad.' } } },
  ];
}

function buildGeneralCriteria(_keywords: string[], _oaText: string, _mainConcept: string): CriteriaTemplate[] {
  return [
    { name: 'Comprensión del contenido', description: 'Comprende los conceptos y habilidades del OA', descriptors: { avanzado: { text: 'Demuestra comprensión profunda, conectando el contenido con experiencias previas y contexto real', evidence: 'Explicación completa con conexiones', feedback: 'Comprensión excelente del contenido.' }, adecuado: { text: 'Demuestra comprensión satisfactoria de los conceptos principales', evidence: 'Respuestas correctas y explicaciones claras', feedback: 'Comprensión adecuada. Profundiza en los detalles.' }, en_desarrollo: { text: 'Reconoce conceptos generales pero sin profundidad', evidence: 'Identificación de conceptos básicos', feedback: 'Estás construyendo tu comprensión. Sigue explorando.' }, inicial: { text: 'Necesita apoyo significativo para comprender el contenido', evidence: 'Comprensión con guía directa', feedback: 'Vamos a revisar el contenido juntos.' } } },
    { name: 'Aplicación del conocimiento', description: 'Aplica lo aprendido en situaciones nuevas', descriptors: { avanzado: { text: 'Aplica el conocimiento en contextos variados y resuelve problemas no convencionales', evidence: 'Resolución de problemas nuevos', feedback: 'Aplicas el conocimiento con creatividad.' }, adecuado: { text: 'Aplica el conocimiento en situaciones similares a las trabajadas', evidence: 'Resolución correcta de ejercicios', feedback: 'Aplicaste bien. Intenta situaciones más desafiantes.' }, en_desarrollo: { text: 'Aplica con apoyo en situaciones guiadas', evidence: 'Resolución con ayuda', feedback: 'Estás aprendiendo a aplicar. Practica más.' }, inicial: { text: 'Requiere guía directa para aplicar el conocimiento', evidence: 'Aplicación con asistencia', feedback: 'Vamos a aplicar juntos lo que aprendimos.' } } },
    { name: 'Comunicación de ideas', description: 'Expresa sus ideas de forma clara y coherente', descriptors: { avanzado: { text: 'Se expresa con claridad, vocabulario preciso y estructura coherente', evidence: 'Expresión oral o escrita fluida', feedback: 'Te expresas de forma excelente.' }, adecuado: { text: 'Expresa sus ideas de forma comprensible', evidence: 'Expresión clara y ordenada', feedback: 'Te expresaste bien. Enriquece tu vocabulario.' }, en_desarrollo: { text: 'Expresa ideas simples con apoyo', evidence: 'Expresión básica con ayuda', feedback: 'Estás mejorando tu expresión. Sigue practicando.' }, inicial: { text: 'Necesita apoyo para expresar ideas', evidence: 'Expresión con guía', feedback: 'Vamos a expresar juntos tus ideas.' } } },
    { name: 'Pensamiento crítico', description: 'Analiza, evalúa y reflexiona sobre el contenido', descriptors: { avanzado: { text: 'Analiza críticamente, evalúa argumentos y propone alternativas fundamentadas', evidence: 'Análisis con argumentación', feedback: 'Tu pensamiento crítico es sólido.' }, adecuado: { text: 'Analiza el contenido y opina con argumentos', evidence: 'Opinión fundamentada', feedback: 'Bien analizas. Fundamenta más tus respuestas.' }, en_desarrollo: { text: 'Opina pero sin argumentación sólida', evidence: 'Opinión con apoyo', feedback: 'Estás desarrollando tu pensamiento crítico. ¿Por qué piensas eso?' }, inicial: { text: 'Requiere apoyo para reflexionar sobre el contenido', evidence: 'Reflexión con preguntas guía', feedback: 'Vamos a reflexionar juntos sobre lo que aprendimos.' } } },
  ];
}

function buildInclusiveAdjustments(category: SubjectCategory, isLower: boolean): string[] {
  const base = [
    'Para estudiantes con rezago lector: incluir apoyo visual con imágenes, pictogramas o organizadores gráficos junto al texto.',
    'Para dificultades de escritura: permitir respuestas orales, dibujos, selección múltiple o uso de tecnologías de apoyo.',
    'Para TEA: ofrecer instrucciones paso a paso, tiempos extendidos y alternativas sensoriales si es necesario.',
    'Para TDAH: dividir la evaluación en partes más pequeñas, permitir movimiento entre secciones y ofrecer recordatorios visuales.',
    'Para dificultades de lenguaje: usar vocabulario claro, incluir bancos de palabras y permitir expresión alternativa.',
    'Para estudiantes con mayor avance: ofrecer desafíos adicionales como extensión del OA o proyectos de investigación.',
  ];
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
  return base;
}

function buildSelfAssessment(isLower: boolean): { title: string; prompts: string[] } {
  if (isLower) {
    return {
      title: 'Mi autoevaluación',
      prompts: [
        'Lo que mejor logré fue...',
        'Me costó más...',
        'Una cosa que aprendí es...',
        'Mi próximo paso será...',
      ],
    };
  }
  return {
    title: 'Autoevaluación del aprendizaje',
    prompts: [
      'Creo que logré... (¿Qué evidencia tengo?)',
      'Necesito mejorar... (¿Qué paso siguiente doy?)',
      'Una evidencia de mi trabajo es...',
      'Mi próximo paso será...',
      'Lo que más me sorprendió de este tema fue...',
      'Una conexión que hago con mi vida diaria es...',
    ],
  };
}

export function buildPremiumRubricModel(input: PremiumRubricInput): PremiumRubric {
  const category = detectSubjectCategory(input.subject);
  const keywords = detectSubjectKeywords(input.objectiveText);
  const lower = isLowerLevel(input.level);
  const concepts = extractConcepts(input.objectiveText);
  const mainConcept = concepts[0] || input.topic || input.objectiveText.split(' ')[0] || 'el contenido';

  const oaText = input.objectiveText || input.topic;
  const topicLabel = truncate(oaText, 60);

  const criteriaBank = buildCriteriaBank(category, keywords, oaText);
  const maxCriteria = lower ? 4 : 6;
  const selectedCriteria = criteriaBank.slice(0, maxCriteria);

  const totalScore = selectedCriteria.length * 4;

  const scoringFormula = lower
    ? 'Puntaje total: ' + totalScore + ' puntos. Cada criterio vale 4 puntos.'
    : 'Puntaje total: ' + totalScore + ' puntos. Nota final: (puntaje obtenido / ' + totalScore + ') x 7. Ponderacion por criterio segun peso.';

  const learningGoal = lower
    ? 'Que los estudiantes puedan ' + truncate(oaText, 80).toLowerCase()
    : 'Que los estudiantes demuestren comprension y aplicacion de: ' + truncate(oaText, 80);

  const studentFriendlyGoal = lower
    ? 'Vamos a aprender sobre ' + mainConcept + ' y mostraremos lo que sabemos'
    : 'Nuestro objetivo es comprender y aplicar: ' + truncate(oaText, 60);

  const criteria: RubricCriterion[] = selectedCriteria.map((c, i) => ({
    id: 'c' + (i + 1),
    name: c.name,
    description: c.description,
    weight: Math.round(100 / selectedCriteria.length),
    indicators: LEVELS.map(level => ({
      levelId: level.id,
      descriptor: (c.descriptors[level.id] && c.descriptors[level.id].text) || level.label + ': ' + c.name,
      evidence: c.descriptors[level.id] ? c.descriptors[level.id].evidence : '',
      feedbackSuggestion: c.descriptors[level.id] ? c.descriptors[level.id].feedback : '',
    })),
  }));

  return {
    title: 'Rubrica: ' + topicLabel,
    subtitle: input.level + ' - ' + input.subject,
    nivel: input.level,
    asignatura: input.subject,
    oa: input.objectiveCode,
    tema: topicLabel,
    learningGoal,
    studentFriendlyGoal,
    levels: LEVELS,
    criteria,
    totalScore,
    scoringFormula,
    usageInstructions: [
      'Lee cada criterio y sus descriptores antes de iniciar la evaluación.',
      'Observa la evidencia del estudiante y compárala con los descriptores de cada nivel.',
      'Selecciona el nivel que mejor describa el desempeño del estudiante para cada criterio.',
      'Usa las evidencias sugeridas como guía, pero también considera evidencias adicionales.',
      'Proporciona retroalimentación específica usando las sugerencias de cada criterio.',
      'Completa la autoevaluación del estudiante al finalizar.',
    ],
    inclusiveAdjustments: buildInclusiveAdjustments(category, lower),
    formativeFeedbackQuestions: [
      '¿Qué aspecto del desempeño del estudiante fue más destacado?',
      '¿En qué criterio necesita más apoyo?',
      '¿Qué estrategia de retroalimentación usarás para mejorar su aprendizaje?',
      '¿Cómo puedes adaptar la próxima actividad según esta evaluación?',
    ],
    studentSelfAssessment: buildSelfAssessment(lower),
  };
}
