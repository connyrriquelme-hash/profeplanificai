export interface CreativeImageContext {
  tema: string;
  curso: string;
  asignatura: string;
  oa: string;
  estilo?: string;
}

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  historia: ['Chile', 'comunidad', 'barrio', 'escuela', 'familia', 'fiestas patrias', 'mapa de Chile', 'patrimonio', 'pueblos originarios', 'paisaje chileno'],
  ciencias: ['flora chilena', 'fauna chilena', 'ecosistema', 'agua', 'reciclaje', 'plantas', 'animales', 'cordillera', 'océano Pacífico'],
  lenguaje: ['biblioteca escolar', 'niños leyendo', 'cuento ilustrado', 'sala de clases', 'lectura compartida'],
  matematica: ['material concreto', 'bloques', 'patrones', 'conteo', 'números', 'sala de clases'],
  artes: ['colores', 'mural escolar', 'instrumentos', 'cultura latinoamericana', 'textiles', 'formas'],
};

const STYLE_DESCRIPTIONS: Record<string, string> = {
  'ilustración infantil': 'estilo infantil, amigable, colores suaves y alegres, formas redondeadas',
  'editorial escolar': 'estilo editorial profesional, limpio, composición editorial',
  'acuarela': 'técnica de acuarela, colores transparentes, trazos suaves, artístico',
  'infografía simple': 'infografía educativa simple, íconos claros, diagramas visuales, minimalista',
};

function clean(value: string, max = 360): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function subjectKeywords(subject: string): string[] {
  const s = subject.toLowerCase();
  if (s.includes('historia') || s.includes('geografía') || s.includes('sociales')) return SUBJECT_KEYWORDS.historia;
  if (s.includes('ciencia')) return SUBJECT_KEYWORDS.ciencias;
  if (s.includes('lenguaje') || s.includes('comunicación')) return SUBJECT_KEYWORDS.lenguaje;
  if (s.includes('matem')) return SUBJECT_KEYWORDS.matematica;
  if (s.includes('arte')) return SUBJECT_KEYWORDS.artes;
  return ['Chile', 'Latinoamérica', 'escuela', 'comunidad', 'aula', 'aprendizaje'];
}

function styleDescription(style?: string): string {
  const value = (style || 'ilustración infantil').toLowerCase();
  return STYLE_DESCRIPTIONS[value] || STYLE_DESCRIPTIONS['ilustración infantil'];
}

export function buildImagePrompt(context: CreativeImageContext): string {
  const keywords = subjectKeywords(context.asignatura).slice(0, 6).join(', ');
  const styleDesc = styleDescription(context.estilo);

  return [
    `Ilustración educativa horizontal 16:9 para estudiantes de ${context.curso} en Chile.`,
    `Asignatura: ${context.asignatura}. OA: ${context.oa}.`,
    `Tema: ${context.tema}.`,
    `Contexto visual sugerido: ${keywords}.`,
    `Estilo ${styleDesc}, editorial escolar, composición limpia, colores cálidos, adecuada para una presentación educativa.`,
    `Contexto chileno/latinoamericano: elementos culturales, geográficos y sociales de Chile y Latinoamérica.`,
    'Sin texto dentro de la imagen, sin logos, sin marcas de agua, sin personajes con copyright, sin rostros realistas de niñas o niños.',
  ].join(' ');
}

export function buildImageCacheKey(context: CreativeImageContext): string {
  const parts = [
    context.curso,
    context.asignatura,
    context.oa.slice(0, 32),
    context.tema,
    context.estilo || 'ilustración infantil',
  ].map(v => clean(v, 80).toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-').replace(/^-+|-+$/g, ''));

  return `creative-image:${parts.join(':')}`;
}