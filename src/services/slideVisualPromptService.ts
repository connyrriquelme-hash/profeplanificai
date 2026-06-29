import type { LessonSlideType, SlideLayout, SlidePalette, SlideVisual, SlideVisualMode, VisualLessonDeck } from '../types/presentation';

export interface SlidePromptParams {
  slideType: LessonSlideType;
  slideTitle: string;
  slideContent?: string;
  course: string;
  subject: string;
  objectiveCode?: string;
  objectiveText?: string;
  theme?: string;
  visualStyle: string;
  preferRegionalContext: boolean;
}

type SubjectContext = {
  keywords: string[];
  regionalElements: string[];
  avoid: string[];
};

const SUBJECT_CONTEXT: Record<string, SubjectContext> = {
  'Historia': {
    keywords: ['patrimonio', 'comunidad', 'familias', 'mapas simples', 'memoria local', 'pueblos originarios', 'inmigracion'],
    regionalElements: ['pueblos indigenas chilenos', 'patrimonio cultural latinoamericano', 'monumentos nacionales de Chile', 'memoria historica local'],
    avoid: ['personajes politicos vivos', 'escudos oficiales', 'simbolos patrios especificos', 'marcas comerciales'],
  },
  'Lenguaje': {
    keywords: ['lectura', 'conversacion', 'poesia', 'biblioteca', 'familia', 'escuela', 'narracion', 'escritura'],
    regionalElements: ['biblioteca escolar chilena', 'ninos leyendo en aula latinoamericana', 'cuentos tradicionales latinoamericanos', 'familia chilena leyendo'],
    avoid: ['personajes de marcas', 'libros comerciales especificos', 'logotipos'],
  },
  'Ciencias': {
    keywords: ['ecosistemas chilenos', 'cuerpo humano', 'experimentos escolares', 'naturaleza', 'observacion'],
    regionalElements: ['flora y fauna chilena', 'ecosistemas de Chile: desierto, bosque, costa', 'experimentos con materiales cotidianos', 'paisajes naturales de Chile'],
    avoid: ['especies no nativas', 'marcas de laboratorio', 'productos quimicos peligrosos'],
  },
  'Matematica': {
    keywords: ['materiales concretos', 'aula', 'conteo', 'patrones', 'figuras geometricas', 'medicion'],
    regionalElements: ['material didactico chileno', 'aula latinoamericana con materiales concretos', 'juegos tradicionales chilenos con numeros', 'feria local usando matematicas'],
    avoid: ['marcas de calculadoras', 'personajes de television'],
  },
  'Tecnologia': {
    keywords: ['diseno', 'objetos utiles', 'prototipos', 'materiales reciclados', 'soluciones creativas'],
    regionalElements: ['creaciones con materiales reciclados en Chile', 'tecnologia escolar chilena', 'proyectos de reutilizacion'],
    avoid: ['logotipos de empresas tech', 'productos comerciales especificos', 'modelos de dispositivos exactos'],
  },
  'Artes': {
    keywords: ['colores', 'emociones', 'expresion visual', 'creatividad', 'arte latinoamericano'],
    regionalElements: ['arte popular chileno', 'artesania latinoamericana', 'expresion artistica en aula', 'colores de la cultura chilena'],
    avoid: ['obras de artistas vivos', 'marcas de materiales', 'reproducciones de arte protegido'],
  },
};

const DEFAULT_SUBJECT_CONTEXT: SubjectContext = {
  keywords: ['aula chilena', 'educacion', 'aprendizaje', 'contexto escolar latinoamericano'],
  regionalElements: ['aula escolar chilena', 'estudiantes latinoamericanos', 'material educativo contextualizado'],
  avoid: ['estereotipos', 'marcas comerciales', 'personajes famosos'],
};

function getSubjectContext(subject: string): SubjectContext {
  for (const [key, ctx] of Object.entries(SUBJECT_CONTEXT)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return ctx;
  }
  return DEFAULT_SUBJECT_CONTEXT;
}

const LAYOUT_MAP: Record<LessonSlideType, SlideLayout> = {
  cover: 'cover-hero',
  objective: 'split-image-right',
  activation: 'split-image-right',
  explanation: 'split-image-left',
  'guided-practice': 'steps',
  'student-work': 'cards-grid',
  'formative-assessment': 'checklist',
  closure: 'reflection',
};

const PALETTE_MAP: Record<LessonSlideType, SlidePalette> = {
  cover: 'violet',
  objective: 'indigo',
  activation: 'amber',
  explanation: 'teal',
  'guided-practice': 'emerald',
  'student-work': 'rose',
  'formative-assessment': 'fuchsia',
  closure: 'slate',
};

const VISUAL_MODE_MAP: Record<LessonSlideType, SlideVisualMode> = {
  cover: 'illustration',
  objective: 'diagram',
  activation: 'illustration',
  explanation: 'diagram',
  'guided-practice': 'illustration',
  'student-work': 'icon-grid',
  'formative-assessment': 'icon-grid',
  closure: 'illustration',
};

function buildThemeDescription(params: SlidePromptParams): string {
  if (params.theme) return params.theme;
  if (params.objectiveText) return params.objectiveText;
  return params.slideTitle;
}

function buildStyleHint(visualStyle: string): string {
  const hints: Record<string, string> = {
    claro: 'minimalista, colores suaves, composicion limpia, estilo educativo moderno',
    ciencias: 'verde fresco, profesional, natural, diagramas claros',
    matematicas: 'azul estructurado, analitico, limpio, figuras geometricas',
    simple: 'alta legibilidad, sin decoracion excesiva, tipografia clara',
    profundo: 'visualmente rico, envolvente, capas de profundidad, colores vibrantes',
    'primeros-lectores': 'amigable, colores suaves y alegres, formas redondeadas, estilo infantil pero no infantilizante',
    'baja-estimulacion': 'neutral, calmado, bajo contraste, sin estimulos visuales innecesarios',
    'colorido-aula': 'vibrante, motivador, colores saturados pero armoniosos, estilo aula chilena',
  };
  return hints[visualStyle] || 'estilo educativo moderno, composicion limpia, profesional';
}

export function buildSlideImagePrompt(params: SlidePromptParams): string {
  const ctx = getSubjectContext(params.subject);
  const themeDesc = buildThemeDescription(params);
  const styleHint = buildStyleHint(params.visualStyle);
  const regionDesc = params.preferRegionalContext
    ? `Contexto chileno o latinoamericano: ${ctx.regionalElements.join(', ')}. Evitar estetica generica de stock internacional.`
    : 'Estetica educativa universal, neutra, sin contexto cultural especifico.';

  const slideHints: Record<LessonSlideType, string> = {
    cover: `Ilustracion educativa premium de portada para clase sobre ${themeDesc}.`,
    objective: `Representacion visual clara del objetivo de aprendizaje: ${params.objectiveText || themeDesc}.`,
    activation: `Escena de activacion de conocimientos previos: estudiantes compartiendo ideas, dialogando, con materiales visuales de apoyo.`,
    explanation: `Diagrama conceptual o infografia educativa sobre ${themeDesc}. Visualizacion clara de conceptos clave.`,
    'guided-practice': `Escena de practica guiada: docente apoyando a pequenos grupos de estudiantes trabajando en actividad colaborativa.`,
    'student-work': `Estudiantes trabajando de forma autonoma en actividad individual, concentrados, en ambiente de aula ordenado.`,
    'formative-assessment': `Escena de evaluacion formativa en aula: estudiantes respondiendo preguntas, ticket de salida, reflexion breve.`,
    closure: `Escena de cierre de clase positiva: estudiantes compartiendo lo aprendido, ambiente de logro y motivacion.`,
  };

  const parts: string[] = [
    `Ilustracion educativa premium para una diapositiva de clase sobre ${themeDesc}.`,
    `Contexto: ${params.course}, ${params.subject}${params.objectiveCode ? `, OA ${params.objectiveCode}` : ''}.`,
    `Estilo: ${styleHint}.`,
    `Tipo de diapositiva: ${params.slideType}.`,
    slideHints[params.slideType],
    `Composicion 16:9, sin texto dentro de la imagen, con elementos visuales relacionados a ${ctx.keywords.slice(0, 3).join(', ')}.`,
    `No incluir texto renderizado, logotipos, marcas registradas ni personajes famosos.`,
    `Imagen educativa segura para aula, apropiada para ninos y adolescentes.`,
    regionDesc,
  ];

  return parts.filter(Boolean).join(' ');
}

export function buildSlideImageAlt(params: SlidePromptParams): string {
  const ctx = getSubjectContext(params.subject);
  const themeDesc = buildThemeDescription(params);
  const regionTag = params.preferRegionalContext ? ' - contexto chileno/latinoamericano' : '';
  return `Ilustracion educativa: ${params.slideType} - ${params.subject} - ${themeDesc}${regionTag}`;
}

export function getRecommendedSlideLayout(slideType: LessonSlideType): SlideLayout {
  return LAYOUT_MAP[slideType] || 'cards-grid';
}

export function getRecommendedPalette(slideType: LessonSlideType): SlidePalette {
  return PALETTE_MAP[slideType] || 'slate';
}

export function getRecommendedVisualMode(slideType: LessonSlideType): SlideVisualMode {
  return VISUAL_MODE_MAP[slideType] || 'placeholder';
}

export function buildVisualForSlide(
  slideType: LessonSlideType,
  params: Omit<SlidePromptParams, 'slideType'> & { slideType: LessonSlideType },
): SlideVisual {
  return {
    mode: getRecommendedVisualMode(slideType),
    imagePrompt: buildSlideImagePrompt(params),
    imageAlt: buildSlideImageAlt(params),
    status: 'placeholder',
    regionContext: params.preferRegionalContext ? 'chile' : 'general',
  };
}

export function enhanceDeckWithVisualPrompts(deck: VisualLessonDeck): VisualLessonDeck {
  return {
    ...deck,
    slides: deck.slides.map((slide) => {
      const params: SlidePromptParams = {
        slideType: slide.type,
        slideTitle: slide.title,
        slideContent: slide.body || slide.activity || slide.bullets?.join('. '),
        course: deck.course,
        subject: deck.subject,
        objectiveCode: deck.objectiveCode,
        objectiveText: deck.objectiveText,
        theme: deck.theme,
        visualStyle: deck.visualStyle,
        preferRegionalContext: deck.preferRegionalContext,
      };

      return {
        ...slide,
        layout: slide.layout || getRecommendedSlideLayout(slide.type),
        palette: slide.palette || getRecommendedPalette(slide.type),
        visual: {
          mode: slide.visual.mode || getRecommendedVisualMode(slide.type),
          imagePrompt: slide.visual.imagePrompt || buildSlideImagePrompt(params),
          imageAlt: slide.visual.imageAlt || buildSlideImageAlt(params),
          status: slide.visual.status || 'placeholder',
          regionContext: slide.visual.regionContext || (deck.preferRegionalContext ? 'chile' : 'general'),
        },
      };
    }),
  };
}
