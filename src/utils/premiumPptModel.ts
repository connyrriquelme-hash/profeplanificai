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
};

export type PremiumPresentation = {
  title: string;
  subtitle: string;
  nivel: string;
  asignatura: string;
  oa: string;
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
  return lower.includes('sala cuna') || lower.includes('medio') || lower.includes('transición') ||
    lower.includes('1°') || lower.includes('2°') || lower.includes('3°') || lower.includes('4°') ||
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
  return text.slice(0, max - 3).trim() + '...';
}

export function getSubjectTheme(subject: string): SubjectTheme {
  for (const [key, theme] of Object.entries(SUBJECT_THEMES)) {
    if (subject.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(subject.toLowerCase())) {
      return theme;
    }
  }
  return DEFAULT_THEME;
}

export function buildPremiumPptModel(input: PremiumInput): PremiumPresentation {
  const theme = getSubjectTheme(input.subject);
  const nivelLabel = input.level;
  const oaShort = truncate(input.objectiveCode, 30);
  const topicLabel = input.topic || input.objectiveText.slice(0, 60);
  const isLower = isLowerLevel(nivelLabel);
  const max = maxBullets(nivelLabel);

  const indSlice = (input.indicators || []).slice(0, 3);
  const skillSlice = (input.skills || []).filter(s => s && s.trim().length > 1).slice(0, 4);

  const slides: PremiumSlide[] = [
    {
      slideNumber: 1,
      layout: 'cover',
      title: topicLabel,
      subtitle: `${nivelLabel} — ${input.subject} — ${oaShort}`,
      visualKeyword: input.topic || input.subject,
      visualPrompt: `Ilustración educativa de ${input.topic} para estudiantes de ${nivelLabel}`,
      icon: ICONS.cover,
      colorTheme: theme.primary,
    },
    {
      slideNumber: 2,
      layout: 'hook',
      title: 'Activación inicial',
      subtitle: isLower ? '¿Qué sabemos?' : 'Pregunta motivadora',
      bullets: adaptBulletsForLevel([
        isLower ? '¿Qué sabes sobre este tema?' : '¿Qué sabemos sobre este tema y por qué es importante?',
        isLower ? '¿Dónde lo has visto?' : '¿Dónde hemos encontrado este contenido en nuestra vida cotidiana?',
        'Comparte con tu compañero/a',
        isLower ? 'Dibuja lo que piensas' : 'Escribe una idea que tengas sobre el tema',
      ], nivelLabel),
      visualKeyword: input.topic || 'activación',
      visualPrompt: `Imagen motivadora de ${input.topic} en contexto chileno`,
      icon: ICONS.hook,
      colorTheme: theme.secondary,
    },
    {
      slideNumber: 3,
      layout: 'objective',
      title: 'Objetivo de aprendizaje',
      subtitle: input.objectiveText,
      bullets: adaptBulletsForLevel([
        isLower ? `Aprenderemos sobre: ${topicLabel}` : `Comprenderemos: ${topicLabel}`,
        isLower ? 'Participaremos en actividades' : 'Aplicaremos el conocimiento en situaciones reales',
      ], nivelLabel),
      studentPrompt: isLower
        ? `Hoy vamos a aprender sobre ${topicLabel}`
        : `Nuestro objetivo es comprender ${topicLabel} y aplicarlo en contextos reales`,
      icon: ICONS.objective,
      colorTheme: theme.primary,
    },
    {
      slideNumber: 4,
      layout: 'concept_cards',
      title: 'Conceptos clave',
      subtitle: isLower ? 'Ideas importantes' : 'Conceptos fundamentales',
      bullets: adaptBulletsForLevel(
        skillSlice.length > 0
          ? skillSlice.map(s => truncate(s, 50))
          : [
              truncate(input.objectiveText, 50),
              `Conexión con ${input.subject}`,
              isLower ? 'Ejemplo cotidiano' : 'Aplicación en contexto real',
            ],
        nivelLabel
      ),
      visualKeyword: skillSlice[0] || input.topic,
      visualPrompt: `Tarjetas visuales de conceptos de ${input.topic}`,
      icon: ICONS.concept_cards,
      colorTheme: theme.accent,
    },
    {
      slideNumber: 5,
      layout: 'visual_explanation',
      title: isLower ? 'Descubrimos' : 'Desarrollo del contenido',
      subtitle: isLower ? 'Observa y explora' : 'Análisis y comprensión',
      bullets: adaptBulletsForLevel([
        isLower ? 'Observa la imagen con atención' : 'Analiza la información presentada',
        isLower ? '¿Qué observas?' : '¿Qué relaciones identificas?',
        isLower ? 'Comparte lo que ves' : 'Conecta con los conceptos previos',
      ], nivelLabel),
      visualKeyword: input.topic,
      visualPrompt: `Esquema visual explicativo de ${topicLabel}`,
      icon: ICONS.visual_explanation,
      colorTheme: theme.secondary,
    },
    {
      slideNumber: 6,
      layout: 'guided_activity',
      title: isLower ? 'Juguemos y aprendamos' : 'Actividad guiada',
      subtitle: isLower ? 'Actividad con apoyo' : 'Paso a paso con orientación docente',
      bullets: adaptBulletsForLevel([
        isLower ? 'Realiza con ayuda del/la profesor/a' : 'Sigue las instrucciones con tu grupo',
        isLower ? 'Usa los materiales de la mesa' : 'Completa cada paso con tu compañero/a',
        isLower ? 'Pide ayuda si la necesitas' : 'Registra tus observaciones',
      ], nivelLabel),
      studentPrompt: isLower
        ? 'Vamos a hacer una actividad divertida'
        : 'Trabaja con tu grupo para resolver la actividad propuesta',
      icon: ICONS.guided_activity,
      colorTheme: theme.primary,
    },
    {
      slideNumber: 7,
      layout: 'collaborative_activity',
      title: isLower ? 'Trabajemos juntos' : 'Actividad colaborativa',
      subtitle: isLower ? 'En pareja o grupo' : 'Trabajo en equipo',
      bullets: adaptBulletsForLevel([
        isLower ? 'Forma parejas con tu compañero' : 'Organiza tu equipo de trabajo',
        isLower ? 'Comparte lo que hiciste' : 'Presenta los resultados al curso',
        isLower ? 'Escucha las ideas de otros' : 'Retroalimenta con respeto',
      ], nivelLabel),
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
      visualPrompt: 'Representación visual de los principios DUA',
      icon: ICONS.dua_supports,
      colorTheme: theme.primary,
    },
    {
      slideNumber: 9,
      layout: 'formative_assessment',
      title: 'Evaluación formativa',
      subtitle: isLower ? '¿Qué aprendimos?' : 'Monitoreo del aprendizaje',
      bullets: adaptBulletsForLevel([
        isLower ? '¿Qué te gustó más de la clase?' : '¿Qué concepto lograste comprender mejor?',
        isLower ? 'Dibuja algo que aprendiste' : 'Escribe un ejemplo que demuestre tu comprensión',
        isLower ? 'Levanta la mano si tienes dudas' : '¿Qué dudas te quedan sobre el tema?',
      ], nivelLabel),
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
      bullets: adaptBulletsForLevel([
        isLower ? 'Recuerda lo que aprendimos hoy' : 'Sintetiza los aprendizajes clave',
        isLower ? '¿Qué fue lo más divertido?' : '¿Cómo aplicarás esto fuera del aula?',
        isLower ? '¡Gran trabajo hoy!' : 'Conecta con la próxima clase',
      ], nivelLabel),
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
    tema: topicLabel,
    slides,
  };
}
