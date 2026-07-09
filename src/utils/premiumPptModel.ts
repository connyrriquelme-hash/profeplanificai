export type PremiumSlideLayout =
  | 'cover'
  | 'hook'
  | 'objective'
  | 'concept_cards'
  | 'visual_explanation'
  | 'guided_activity'
  | 'collaborative_activity'
  | 'dua_supports'
  | 'formative_assessment'
  | 'closure';

export type SubjectTheme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
};

export type PremiumImageBlock = {
  type: 'image';
  url?: string;
  alt?: string;
  prompt?: string;
  status?: 'pending' | 'generating' | 'generated' | 'failed';
  layout?: 'left' | 'right' | 'center';
};

export type PremiumTableBlock = {
  type: 'table';
  headers: string[];
  rows: string[][];
  caption?: string;
};

export type PremiumTextBlock = {
  type: 'text';
  content: string;
  variant?: 'paragraph' | 'quote' | 'callout' | 'highlight';
};

export type PremiumContentBlock = PremiumImageBlock | PremiumTableBlock | PremiumTextBlock;

export type PremiumSlide = {
  slideNumber: number;
  layout: PremiumSlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  studentPrompt?: string;
  teacherNotes?: string;
  visualKeyword?: string;
  visualPrompt?: string;
  icon?: string;
  colorTheme?: string;
  imageUrl?: string;
  imageStatus?: 'pending' | 'generating' | 'generated' | 'failed';
  contentBlocks?: PremiumContentBlock[];
  table?: { headers: string[]; rows: string[][]; caption?: string };
};

export type PremiumPresentation = {
  title: string;
  subtitle: string;
  nivel: string;
  asignatura: string;
  oa: string;
  oaText: string;
  tema: string;
  slides: PremiumSlide[];
};

export type PremiumInput = {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  topic: string;
  indicators?: string[];
  skills?: string[];
  additionalContext?: string;
};

const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  'Ciencias Naturales': { primary: '1B7A4A', secondary: '48B89F', accent: '7DD3C0', background: 'F0FAF4', text: '1A3A2A' },
  'Artes Visuales': { primary: '8B5CF6', secondary: 'D946EF', accent: 'FDE68A', background: 'FAF5FF', text: '3B0764' },
  'Lenguaje y Comunicación': { primary: '2563EB', secondary: 'A78BFA', accent: 'FB923C', background: 'EFF6FF', text: '1E293B' },
  'Matemática': { primary: '2563EB', secondary: '34D399', accent: 'FFFFFF', background: 'F0F9FF', text: '1E293B' },
  'Historia, Geografía y Cs. Sociales': { primary: 'C2410C', secondary: '1E40AF', accent: 'FEF3C7', background: 'FFFBEB', text: '431407' },
  'Formación Ciudadana': { primary: 'DC2626', secondary: '2563EB', accent: 'FEF9C3', background: 'FEF2F2', text: '7F1D1D' },
  'Inglés': { primary: '7C3AED', secondary: '06B6D4', accent: 'FDE68A', background: 'F5F3FF', text: '2E1065' },
  'Tecnología': { primary: '475569', secondary: '0EA5E9', accent: 'A3E635', background: 'F8FAFC', text: '1E293B' },
  'Orientación': { primary: 'D97706', secondary: '059669', accent: 'FCA5A5', background: 'FFFBEB', text: '78350F' },
};

const DEFAULT_THEME: SubjectTheme = { primary: '7C3AED', secondary: '818CF8', accent: 'C4B5FD', background: 'F5F3FF', text: '1E1B4B' };

const ICONS: Record<PremiumSlideLayout, string> = {
  cover: '🎯',
  hook: '💡',
  objective: '📌',
  concept_cards: '🃏',
  visual_explanation: '🔍',
  guided_activity: '✏️',
  collaborative_activity: '🤝',
  dua_supports: '🌈',
  formative_assessment: '✅',
  closure: '🏁',
};

function isLowerLevel(level: string): boolean {
  const lower = level.toLowerCase();
  const isBasic = lower.includes('básico') || lower.includes('basico') || lower.endsWith('b');
  return lower.includes('sala cuna') || lower.includes('transición') ||
    (isBasic && (lower.includes('1°') || lower.includes('2°') || lower.includes('3°') || lower.includes('4°'))) ||
    lower.includes('1b') || lower.includes('2b') || lower.includes('3b') || lower.includes('4b');
}

function maxBullets(level: string): number {
  return isLowerLevel(level) ? 3 : 5;
}

function adaptBulletsForLevel(bullets: string[], level: string): string[] {
  const max = maxBullets(level);
  return bullets.slice(0, max);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const sliced = text.slice(0, max - 3);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > max * 0.5) {
    return sliced.slice(0, lastSpace).trim() + '...';
  }
  return sliced.trim() + '...';
}

export function getSubjectTheme(subject: string): SubjectTheme {
  for (const [key, theme] of Object.entries(SUBJECT_THEMES)) {
    if (subject.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(subject.toLowerCase())) {
      return theme;
    }
  }
  return DEFAULT_THEME;
}

function extractOaConcepts(oaText: string): string[] {
  const words = oaText.toLowerCase()
    .replace(/[,;.:!?()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4);
  const stopwords = new Set([
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
    'variacion', 'herencia', 'genetica',     'celular', 'membrana', 'celula',
    'tejido', 'organo', 'sistema', 'bacterias',
    'raiz', 'tallo', 'hoja',
    'fotosintesis', 'respiracion',
    'incluyendo', 'incluye', 'incluir', 'describe', 'comprender',
    'conocer', 'aplicar', 'usar', 'utilizar', 'realizar', 'desarrollar',
    'trabajar', 'actividad', 'actividades', 'estudiantes', 'alumnos',
    'curso', 'clase', 'sesion', 'leccion', 'unidad', 'plan',
    'basico', 'medio', 'inicial', 'transicion', 'sala', 'cuna',
  ]);
  const concepts = words.filter(w => !stopwords.has(w));
  const unique = [...new Set(concepts)];
  return unique.slice(0, 8);
}

function buildOaDrivenBullets(oaText: string, isLower: boolean, maxB: number): string[] {
  const concepts = extractOaConcepts(oaText);
  if (concepts.length === 0) {
    return [truncate(oaText, 80)];
  }
  const verbs = isLower
    ? ['Observa', 'Identifica', 'Comparte', 'Descubre']
    : ['Analiza', 'Comprende', 'Relaciona', 'Aplica', 'Compara', 'Explica', 'Evalúa'];
  const bullets: string[] = [];
  for (let i = 0; i < Math.min(maxB, concepts.length); i++) {
    const verb = verbs[i % verbs.length];
    const concept = concepts[i];
    bullets.push(`${verb} ${concept}`);
  }
  return bullets;
}

function buildOaTable(oaText: string, subject: string, isLower: boolean): { headers: string[]; rows: string[][]; caption?: string } | undefined {
  const lower = oaText.toLowerCase();
  const subLower = subject.toLowerCase();

  if (subLower.includes('ciencias') || lower.includes('planta') || lower.includes('animal') || lower.includes('seres vivos') || lower.includes('ciclo') || lower.includes('ecosistema')) {
    if (isLower) {
      if (lower.includes('planta') || lower.includes('flor') || lower.includes('semilla') || lower.includes('polinización') || lower.includes('germinación')) {
        return {
          headers: ['Elemento', 'Lo observo', 'Dibujo o ejemplo'],
          rows: [
            ['Semilla', 'Puede germinar', 'Dibujar semilla'],
            ['Planta', 'Tiene tallo y hojas', 'Dibujar planta'],
            ['Flor', 'Puede formar fruto', 'Dibujar flor'],
          ],
          caption: 'Las plantas: lo que observamos',
        };
      }
      if (lower.includes('animal') || lower.includes('alimentación') || lower.includes('hábitat')) {
        return {
          headers: ['Animal', 'Dónde vive', 'Qué necesita'],
          rows: [
            ['Ave', 'Árboles o cielo', 'Alimento y refugio'],
            ['Pez', 'Agua dulce o salada', 'Oxígeno y alimento'],
            ['Insecto', 'Jardín o bosque', 'Plantas y agua'],
          ],
          caption: 'Los animales: dónde viven',
        };
      }
      return {
        headers: ['Elemento', 'Lo que veo', 'Comento'],
        rows: [
          [truncate(oaText.split(' ')[0] || 'Elemento', 20), 'Lo observo en la naturaleza', 'Lo explico con mis palabras'],
          ['Ejemplo', 'Lo veo en mi entorno', 'Lo comparto con mi curso'],
          ['Dibujo', 'Lo represento en mi cuaderno', 'Lo muestro al profe'],
        ],
        caption: 'Lo que aprendimos',
      };
    }
    if (lower.includes('planta') || lower.includes('flor') || lower.includes('semilla') || lower.includes('polinización') || lower.includes('germinación')) {
      return {
        headers: ['Etapa', 'Qué ocurre', 'Qué podemos observar'],
        rows: [
          ['Germinación', 'La semilla comienza a crecer', 'Aparece una pequeña raíz'],
          ['Crecimiento', 'La planta desarrolla tallo y hojas', 'Aumenta su tamaño y color verde'],
          ['Floración', 'Aparecen flores en la planta', 'Se observan colores y formas'],
          ['Polinización', 'El polen se traslada entre flores', 'Participan insectos, viento u otros'],
          ['Formación del fruto', 'Se forman frutos con semillas', 'Aparecen nuevas semillas'],
        ],
        caption: 'Ciclo de vida de las plantas con flor',
      };
    }
    if (lower.includes('animal') || lower.includes('alimentación') || lower.includes('hábitat')) {
      return {
        headers: ['Característica', 'Descripción', 'Ejemplo'],
        rows: [
          ['Alimentación', 'Cómo obtiene energía', 'Herbívoro, carnívoro, omnívoro'],
          ['Hábitat', 'Dónde vive y se desarrolla', 'Bosque, desierto, océano'],
          ['Reproducción', 'Cómo se perpetúa la especie', 'Huevos, vivíparo, gemación'],
          ['Adaptación', 'Cómo se ajusta al ambiente', 'Camuflaje, migración, hibernación'],
        ],
        caption: 'Características de los seres vivos',
      };
    }
    return {
      headers: ['Concepto', 'Descripción', 'Relación con el OA'],
      rows: [
        [truncate(oaText.split(' ')[0] || 'Concepto', 30), truncate(oaText, 50), subject],
        ['Evidencia observable', 'Lo que podemos ver y medir', 'Experimentación'],
        ['Conexión con la naturaleza', 'Presencia en nuestro entorno', 'Observación directa'],
      ],
      caption: 'Mapa de conceptos del OA',
    };
  }

  if (subLower.includes('historia') || lower.includes('sociedad') || lower.includes('chile') || lower.includes('histórico')) {
    if (isLower) {
      return {
        headers: ['Lugar o persona', 'Qué hace', 'Por qué es importante'],
        rows: [
          ['Mi barrio o ciudad', 'Aquí vivo yo', 'Es donde aprendo y juego'],
          ['Una persona importante', 'Ayuda a otros', 'Enseña y protege'],
          ['Una fecha especial', 'Celebramos algo', 'Recuerda nuestra historia'],
        ],
        caption: 'Lo que sé de mi comunidad',
      };
    }
    return {
      headers: ['Periodo / Evento', 'Características', 'Impacto'],
      rows: [
        ['Contexto histórico', truncate(oaText, 40), 'Transformaciones sociales'],
        ['Actores principales', 'Personas y grupos involucrados', 'Dinámica social'],
        ['Consecuencias', 'Cambios y legados', 'Relevancia actual'],
      ],
      caption: 'Análisis del contexto histórico',
    };
  }

  if (subLower.includes('matemática') || lower.includes('número') || lower.includes('operación') || lower.includes('geometría')) {
    if (isLower) {
      return {
        headers: ['Representación', 'Ejemplo', 'Lo explico'],
        rows: [
          ['Un número', 'Lo escribo y lo cuento', 'Lo muestro con dedos o fichas'],
          ['Una suma', '3 + 2 = 5', 'Lo resuelvo con MATERIAL'],
          ['Un problema', 'Leo y dibuyo', 'Lo explico con mis palabras'],
        ],
        caption: 'Lo que puedo hacer con los números',
      };
    }
    return {
      headers: ['Concepto', 'Procedimiento', 'Resultado esperado'],
      rows: [
        [truncate(oaText.split(',')[0] || 'Problema', 30), 'Identificar datos y operar', 'Solución correcta'],
        ['Verificación', 'Revisar el procedimiento', 'Coherencia del resultado'],
        ['Aplicación', 'Usar en situaciones reales', 'Transferencia del conocimiento'],
      ],
      caption: 'Pasos para resolver el problema',
    };
  }

  if (subLower.includes('lenguaje') || lower.includes('texto') || lower.includes('lectura') || lower.includes('escritura')) {
    if (isLower) {
      return {
        headers: ['Idea', '¿Dónde aparece?', 'Lo digo con mis palabras'],
        rows: [
          ['La idea principal', 'En el título o primer párrafo', 'La cuento con una frase'],
          ['Un personaje', 'En la historia', 'Lo describo y lo dibujo'],
          ['Una palabra nueva', 'En el texto', 'La busco y la uso'],
        ],
        caption: 'Lo que entendí del texto',
      };
    }
    return {
      headers: ['Estrategia', 'Descripción', 'Ejemplo de aplicación'],
      rows: [
        ['Comprensión', 'Entender el mensaje del texto', 'Identificar idea principal'],
        ['Interpretación', 'Dar sentido a la información', 'Inferir intención del autor'],
        ['Producción', 'Crear textos con propósito', 'Redactar según la situación'],
      ],
      caption: 'Estrategias de comprensión lectora',
    };
  }

  if (subLower.includes('artes') || lower.includes('expresión') || lower.includes('creatividad') || lower.includes('obra')) {
    if (isLower) {
      return {
        headers: ['Elemento visual', 'Lo veo en', 'Me hace sentir'],
        rows: [
          ['Color', 'Mi dibujo u obra', 'Alegría, calma u otra emoción'],
          ['Forma', 'Figuras o líneas', 'Curiosidad'],
          ['Textura', 'Materiales usados', 'Interés'],
        ],
        caption: 'Lo que veo en el arte',
      };
    }
    return {
      headers: ['Elemento', 'Descripción', 'Ejemplo en la obra'],
      rows: [
        ['Línea', 'Trazo que delimita formas', 'Contorno de figuras'],
        ['Color', 'Tono y saturación', 'Paleta cromática'],
        ['Textura', 'Sensación táctil visual', 'Superficie rugosa o lisa'],
        ['Composición', 'Organización de elementos', 'Distribución del espacio'],
      ],
      caption: 'Elementos del lenguaje visual',
    };
  }

  return undefined;
}

function generateSlideImagePrompt(layout: PremiumSlideLayout, oaText: string, subject: string, isLower: boolean): string | undefined {
  const oaLower = oaText.toLowerCase();
  const isPlant = oaLower.includes('planta') || oaLower.includes('flor') || oaLower.includes('semilla') || oaLower.includes('polinización');
  const isAnimal = oaLower.includes('animal') || oaLower.includes('alimentación') || oaLower.includes('hábitat');
  const base = isPlant ? 'plants flowers seeds pollination Chilean educational' : isAnimal ? 'animals habitat Chilean educational' : `${subject} educational Chilean`;

  switch (layout) {
    case 'cover':
      return `Educational presentation cover for ${subject}, ${base}, professional colorful illustration, wide format`;
    case 'hook':
      return `Engaging motivational image, ${base} for ${isLower ? 'young children' : 'students'}, thought-provoking`;
    case 'visual_explanation':
      return `Detailed educational diagram, ${base}, infographic style with clear labels, professional illustration`;
    case 'guided_activity':
      return `${isLower ? 'Children' : 'Students'} hands-on activity, ${base}, classroom setting, collaborative`;
    case 'concept_cards':
      return `Visual concept map, ${base}, clean educational infographic design`;
    case 'collaborative_activity':
      return `${isLower ? 'Children' : 'Students'} teamwork activity, ${base}, classroom engaged`;
    case 'dua_supports':
      return `Universal Design for Learning, inclusive classroom, diverse learners, ${base}`;
    case 'closure':
      return `Reflection learning summary, ${base}, inspiring educational achievement`;
    default:
      return `Educational illustration, ${base}, professional engaging`;
  }
}

function buildHookBullets(oaText: string, isLower: boolean): string[] {
  const concepts = extractOaConcepts(oaText);
  const mainConcept = concepts[0] || oaText.split(' ')[0] || 'este tema';
  if (isLower) {
    return [
      `¿Qué sabes sobre ${mainConcept}?`,
      `¿Dónde has visto ${mainConcept} en tu vida diaria?`,
      `Comparte una idea con tu compañero/a`,
    ];
  }
  return [
    `¿Qué sabes sobre ${mainConcept} y por qué es importante en ${mainConcept}?`,
    `¿Dónde encontramos ${mainConcept} en nuestro entorno o en la naturaleza?`,
    `Escribe una idea previa que tengas sobre el tema`,
    `Observa la imagen: ¿qué relaciones identificas con ${mainConcept}?`,
  ];
}

function buildObjectiveBullets(oaText: string, topicLabel: string, isLower: boolean): string[] {
  if (isLower) {
    return [
      `Comprenderemos: ${truncate(oaText, 60)}`,
      `Participaremos en actividades de observación y exploración`,
    ];
  }
  return [
    `Comprenderemos: ${truncate(oaText, 60)}`,
    `Aplicaremos el conocimiento en situaciones reales`,
    `Analizaremos las relaciones entre los conceptos del OA`,
  ];
}

function buildConceptBullets(oaText: string, skills: string[], subject: string, isLower: boolean): string[] {
  const concepts = extractOaConcepts(oaText);
  if (skills.length > 0) {
    return skills.slice(0, isLower ? 3 : 5).map(s => truncate(s, 50));
  }
  return concepts.slice(0, isLower ? 3 : 5).map(c => truncate(c.charAt(0).toUpperCase() + c.slice(1), 50));
}

function buildVisualBullets(oaText: string, isLower: boolean): string[] {
  const concepts = extractOaConcepts(oaText);
  const mainConcept = concepts[0] || 'este contenido';
  if (isLower) {
    return [
      `Observa la imagen con atención`,
      `¿Qué observas sobre ${mainConcept}?`,
      `Comparte lo que ves con tu compañero/a`,
    ];
  }
  return [
    `Analiza la información presentada sobre ${mainConcept}`,
    `¿Qué relaciones identificas entre los conceptos?`,
    `Conecta con los conceptos previos del OA`,
    `Identifica las partes clave del proceso`,
  ];
}

function buildGuidedBullets(oaText: string, isLower: boolean): string[] {
  const concepts = extractOaConcepts(oaText);
  const mainConcept = concepts[0] || 'la actividad';
  if (isLower) {
    return [
      `Observa ${mainConcept} con ayuda del/la profesor/a`,
      `Identifica las partes importantes`,
      `Comparte tus hallazgos`,
    ];
  }
  return [
    `Identifica los componentes de ${mainConcept}`,
    `Sigue las instrucciones para cada paso del proceso`,
    `Registra tus observaciones en la guía`,
    `Completa cada paso con tu compañero/a`,
  ];
}

function buildCollaborativeBullets(oaText: string, isLower: boolean): string[] {
  const concepts = extractOaConcepts(oaText);
  const mainConcept = concepts[0] || 'el tema';
  if (isLower) {
    return [
      `Forma parejas con tu compañero`,
      `Comparte lo que observaste sobre ${mainConcept}`,
      `Escucha las ideas de otros`,
    ];
  }
  return [
    `Organiza tu equipo de trabajo`,
    `Presenta los resultados sobre ${mainConcept} al curso`,
    `Retroalimenta con respeto y fundamenta tu opinión`,
  ];
}

function buildFormativeBullets(oaText: string, isLower: boolean): string[] {
  const concepts = extractOaConcepts(oaText);
  const mainConcept = concepts[0] || 'el tema';
  if (isLower) {
    return [
      `¿Qué te gustó más de la clase sobre ${mainConcept}?`,
      `Dibuja algo que aprendiste hoy`,
      `Levanta la mano si tienes dudas`,
    ];
  }
  return [
    `¿Qué concepto de ${mainConcept} lograste comprender mejor?`,
    `Escribe un ejemplo que demuestre tu comprensión`,
    `¿Qué dudas te quedan sobre ${mainConcept}?`,
    `Compara lo que sabías antes con lo que aprendiste hoy`,
  ];
}

function buildClosureBullets(oaText: string, isLower: boolean): string[] {
  const concepts = extractOaConcepts(oaText);
  const mainConcept = concepts[0] || 'el tema';
  if (isLower) {
    return [
      `Recuerda lo que aprendimos sobre ${mainConcept} hoy`,
      `¿Qué fue lo más divertido?`,
      `¡Gran trabajo hoy!`,
    ];
  }
  return [
    `Sintetiza los aprendizajes clave sobre ${mainConcept}`,
    `¿Cómo aplicarás esto fuera del aula?`,
    `Conecta ${mainConcept} con la próxima clase`,
  ];
}

export function buildPremiumPptModel(input: PremiumInput): PremiumPresentation {
  const theme = getSubjectTheme(input.subject);
  const nivelLabel = input.level;
  const oaShort = truncate(input.objectiveCode, 30);
  const isLower = isLowerLevel(nivelLabel);
  const max = maxBullets(nivelLabel);

  const oaText = input.objectiveText || input.topic;
  const topicLabel = truncate(oaText, 60);

  const skillSlice = (input.skills || []).filter(s => s && s.trim().length > 1).slice(0, 4);

  const oaTable = buildOaTable(oaText, input.subject, isLower);

  const slides: PremiumSlide[] = [
    {
      slideNumber: 1,
      layout: 'cover',
      title: topicLabel,
      subtitle: `${nivelLabel} — ${input.subject} — ${oaShort}`,
      visualKeyword: extractOaConcepts(oaText).slice(0, 3).join(', ') || topicLabel,
      visualPrompt: generateSlideImagePrompt('cover', oaText, input.subject, isLower),
      icon: ICONS.cover,
      colorTheme: theme.primary,
    },
    {
      slideNumber: 2,
      layout: 'hook',
      title: 'Activación inicial',
      subtitle: isLower ? '¿Qué sabemos?' : 'Pregunta motivadora',
      bullets: adaptBulletsForLevel(buildHookBullets(oaText, isLower), nivelLabel),
      visualKeyword: extractOaConcepts(oaText).slice(0, 2).join(', ') || 'activación',
      visualPrompt: generateSlideImagePrompt('hook', oaText, input.subject, isLower),
      icon: ICONS.hook,
      colorTheme: theme.secondary,
    },
    {
      slideNumber: 3,
      layout: 'objective',
      title: 'Objetivo de aprendizaje',
      subtitle: oaText,
      bullets: adaptBulletsForLevel(buildObjectiveBullets(oaText, topicLabel, isLower), nivelLabel),
      studentPrompt: isLower
        ? `Hoy vamos a aprender sobre ${truncate(oaText, 50)}`
        : `Nuestro objetivo es comprender: ${truncate(oaText, 60)}`,
      icon: ICONS.objective,
      colorTheme: theme.primary,
    },
    {
      slideNumber: 4,
      layout: 'concept_cards',
      title: 'Conceptos clave',
      subtitle: isLower ? 'Ideas importantes' : 'Conceptos fundamentales del OA',
      bullets: adaptBulletsForLevel(buildConceptBullets(oaText, skillSlice, input.subject, isLower), nivelLabel),
      visualKeyword: extractOaConcepts(oaText).slice(0, 2).join(', ') || input.subject,
      visualPrompt: generateSlideImagePrompt('concept_cards', oaText, input.subject, isLower),
      table: oaTable,
      icon: ICONS.concept_cards,
      colorTheme: theme.accent,
    },
    {
      slideNumber: 5,
      layout: 'visual_explanation',
      title: isLower ? 'Descubrimos' : 'Desarrollo del contenido',
      subtitle: isLower ? 'Observa y explora' : 'Análisis y comprensión del OA',
      bullets: adaptBulletsForLevel(buildVisualBullets(oaText, isLower), nivelLabel),
      visualKeyword: extractOaConcepts(oaText).slice(0, 2).join(', ') || oaText.split(' ')[0],
      visualPrompt: generateSlideImagePrompt('visual_explanation', oaText, input.subject, isLower),
      icon: ICONS.visual_explanation,
      colorTheme: theme.secondary,
    },
    {
      slideNumber: 6,
      layout: 'guided_activity',
      title: isLower ? 'Juguemos y aprendamos' : 'Actividad guiada',
      subtitle: isLower ? 'Actividad con apoyo' : 'Paso a paso con orientación docente',
      bullets: adaptBulletsForLevel(buildGuidedBullets(oaText, isLower), nivelLabel),
      visualKeyword: extractOaConcepts(oaText).slice(0, 2).join(', ') || 'paso a paso',
      visualPrompt: generateSlideImagePrompt('guided_activity', oaText, input.subject, isLower),
      studentPrompt: isLower
        ? `Vamos a explorar ${truncate(oaText, 40)}`
        : `Trabaja con tu grupo para resolver la actividad sobre ${truncate(oaText, 40)}`,
      icon: ICONS.guided_activity,
      colorTheme: theme.primary,
    },
    {
      slideNumber: 7,
      layout: 'collaborative_activity',
      title: isLower ? 'Trabajemos juntos' : 'Actividad colaborativa',
      subtitle: isLower ? 'En pareja o grupo' : 'Trabajo en equipo',
      bullets: adaptBulletsForLevel(buildCollaborativeBullets(oaText, isLower), nivelLabel),
      visualPrompt: generateSlideImagePrompt('collaborative_activity', oaText, input.subject, isLower),
      icon: ICONS.collaborative_activity,
      colorTheme: theme.secondary,
    },
    {
      slideNumber: 8,
      layout: 'dua_supports',
      title: 'Apoyos DUA',
      subtitle: 'Diseño Universal para el Aprendizaje',
      bullets: [
        'Representación: información en múltiples formatos',
        'Acción y expresión: opciones para demostrar aprendizaje',
        'Implicación: motivación y relevancia personal',
      ],
      visualKeyword: 'DUA inclusión',
      icon: ICONS.dua_supports,
      colorTheme: theme.primary,
    },
    {
      slideNumber: 9,
      layout: 'formative_assessment',
      title: 'Evaluación formativa',
      subtitle: isLower ? '¿Qué aprendimos?' : 'Monitoreo del aprendizaje',
      bullets: adaptBulletsForLevel(buildFormativeBullets(oaText, isLower), nivelLabel),
      table: isLower ? {
        headers: ['¿Qué puedo hacer?', 'Lo intenté', 'Lo logré'],
        rows: [
          ['Observar y dibujar partes del tema', '⬜', '✅'],
          ['Nombrar lo que aprendí', '⬜', '✅'],
          ['Compartir con mi curso', '⬜', '✅'],
        ],
        caption: 'Mi autoevaluación',
      } : {
        headers: ['Criterio', 'Logrado', 'Por mejorar'],
        rows: [
          ['Comprensión del concepto principal del OA', '—', '—'],
          ['Aplicación del conocimiento en contexto real', '—', '—'],
          ['Participación en actividades y trabajo en equipo', '—', '—'],
        ],
        caption: 'Autoevaluación del aprendizaje',
      },
      studentPrompt: isLower
        ? 'Responde con una imagen o una palabra'
        : 'Completa el ticket de salida antes de terminar',
      icon: ICONS.formative_assessment,
      colorTheme: theme.accent,
    },
    {
      slideNumber: 10,
      layout: 'closure',
      title: 'Cierre de la clase',
      subtitle: isLower ? '¿Qué nos llevamos?' : 'Reflexión y síntesis',
      bullets: adaptBulletsForLevel(buildClosureBullets(oaText, isLower), nivelLabel),
      studentPrompt: isLower
        ? '¿Qué fue lo más divertido de hoy?'
        : '¿Qué estrategia te ayudó a aprender mejor?',
      icon: ICONS.closure,
      colorTheme: theme.primary,
    },
  ];

  return {
    title: topicLabel,
    subtitle: `${nivelLabel} — ${input.subject}`,
    nivel: nivelLabel,
    asignatura: input.subject,
    oa: input.objectiveCode,
    oaText,
    tema: topicLabel,
    slides,
  };
}
