/**
 * chileanCurriculumFallback.ts
 * Utilidades de fallback curricular chileno basadas en el OA oficial.
 * Usar solo cuando D1 no tenga datos para un objetivo/indicador/habilidad.
 */

export const CHILEAN_CURRICULAR_VERBS = [
  'leer', 'comprender', 'identificar', 'reconocer', 'describir', 'explicar',
  'comparar', 'clasificar', 'analizar', 'interpretar', 'inferir', 'argumentar',
  'resolver', 'representar', 'calcular', 'modelar', 'comunicar', 'escribir',
  'crear', 'observar', 'registrar', 'experimentar', 'aplicar', 'evaluar',
  'ubicar', 'relacionar', 'participar', 'expresar', 'formular', 'plantear',
  'seleccionar', 'proponer', 'valorar', 'apreciar', 'diseñar', 'usar',
];

export function normalizeText(text: string): string {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function extractVerbsFromOA(oaText: string): string[] {
  if (!oaText) return [];
  const lower = normalizeText(oaText);
  const found: string[] = [];
  for (const verb of CHILEAN_CURRICULAR_VERBS) {
    if (lower.includes(normalizeText(verb))) found.push(verb);
  }
  return [...new Set(found)];
}

export function getSubjectTemplateKey(subject: string): string {
  const n = normalizeText(subject);
  if (n.includes('ciencia')) return 'ciencias';
  if (n.includes('matem')) return 'matematica';
  if (n.includes('historia') || n.includes('geografia') || n.includes('sociales')) return 'historia';
  if (n.includes('lenguaje') || n.includes('comunicacion') || n.includes('literatura')) return 'lenguaje';
  if (n.includes('ingl')) return 'ingles';
  if (n.includes('musica') || n.includes('creacion musical')) return 'musica';
  if (n.includes('educacion fisica') || n.includes('deporte') || n.includes('salud')) return 'edufisica';
  if (n.includes('tecnologia') || n.includes('programacion')) return 'tecnologia';
  if (n.includes('orientacion')) return 'orientacion';
  if (n.includes('arte') || n.includes('danza') || n.includes('teatro')) return 'artes';
  return 'default';
}

export function isSuggestedSource(source?: string): boolean {
  return source === 'curriculum_chileno_sugerido' || source === 'auto_from_objective';
}

const INDICATOR_TEMPLATES: Record<string, (verbs: string[], oaText: string) => string[]> = {
  'lenguaje': (v, oa) => {
    const base: string[] = [];
    if (v.includes('leer') || v.includes('comprender') || oa.toLowerCase().includes('leer')) base.push('Lee textos adecuados al nivel con propósito definido, identificando la idea principal.');
    if (v.includes('inferir') || v.includes('interpretar') || oa.toLowerCase().includes('comprender')) base.push('Infiere información a partir de pistas o contexto presente en el texto.');
    if (v.includes('escribir') || v.includes('comunicar') || oa.toLowerCase().includes('escri')) base.push('Escribe respuestas o textos breves manteniendo coherencia con la tarea planteada.');
    if (v.includes('comunicar') || v.includes('expresar') || oa.toLowerCase().includes('oral')) base.push('Comunica oralmente ideas relacionadas con el OA usando vocabulario adecuado al nivel.');
    if (base.length < 3) base.push('Demuestra comprensión del contenido del OA mediante evidencia observable.');
    if (base.length < 4) base.push('Participa en actividades de lectura, escritura u oralidad según corresponda al OA.');
    return base;
  },
  'matematica': (v, oa) => {
    const base: string[] = [];
    if (v.includes('resolver') || v.includes('plantear') || oa.toLowerCase().includes('problema')) base.push('Resuelve problemas aplicando estrategias adecuadas al contenido del OA.');
    if (v.includes('representar') || v.includes('modelar') || oa.toLowerCase().includes('numero')) base.push('Representa la información usando números, esquemas, dibujos o material concreto.');
    if (v.includes('calcular') || v.includes('operar')) base.push('Calcula resultados verificando la coherencia de la respuesta con la situación planteada.');
    if (v.includes('comunicar') || v.includes('argumentar') || v.includes('explicar')) base.push('Explica el procedimiento utilizado para llegar a la respuesta.');
    if (base.length < 3) base.push('Aplica el aprendizaje del OA en una actividad guiada o contextualizada.');
    if (base.length < 4) base.push('Verifica si el resultado es coherente con la situación del problema.');
    return base;
  },
  'ciencias': (v, oa) => {
    const base: string[] = [];
    if (v.includes('observar') || v.includes('describir')) base.push('Observa características o fenómenos relacionados con el OA y los describe con vocabulario científico.');
    if (v.includes('clasificar') || v.includes('comparar')) base.push('Clasifica o compara elementos según criterios trabajados en el OA.');
    if (v.includes('explicar') || v.includes('reconocer')) base.push('Explica relaciones o procesos usando evidencia de la investigación.');
    if (v.includes('registrar') || v.includes('experimentar')) base.push('Registra evidencia mediante dibujos, tablas simples o explicaciones breves.');
    if (base.length < 3) base.push('Participa en actividades de exploración y observación guiada.');
    if (base.length < 4) base.push('Comunica conclusiones simples a partir de evidencia recolectada.');
    return base;
  },
  'historia': (v, oa) => {
    const base: string[] = [];
    if (v.includes('identificar') || v.includes('reconocer')) base.push('Identifica información relevante sobre el proceso, lugar o tema trabajado.');
    if (v.includes('ubicar') || v.includes('relacionar')) base.push('Ubica acontecimientos o elementos en una secuencia temporal o espacial.');
    if (v.includes('comparar') || v.includes('analizar')) base.push('Compara características de sociedades, paisajes o procesos históricos.');
    if (v.includes('explicar') || v.includes('argumentar')) base.push('Explica cambios y continuidades con apoyo de fuentes o ejemplos.');
    if (base.length < 3) base.push('Utiliza fuentes simples para obtener información sobre el tema.');
    if (base.length < 4) base.push('Comunica sus hallazgos de forma oral o escrita.');
    return base;
  },
  'musica': (v, oa) => {
    const base: string[] = [];
    if (v.includes('escuchar') || v.includes('reconocer') || v.includes('identificar')) base.push('Reconoce elementos musicales presentes en una audición o interpretación.');
    if (v.includes('interpretar') || v.includes('participar')) base.push('Participa en actividades musicales respetando instrucciones y turnos.');
    if (v.includes('crear') || v.includes('expresar')) base.push('Crea patrones rítmicos o melódicos acordes al nivel.');
    if (v.includes('apreciar') || v.includes('valorar')) base.push('Expresa apreciaciones sobre obras o sonidos escuchados.');
    if (base.length < 3) base.push('Interpreta canciones o repertorio trabajado en clase.');
    if (base.length < 4) base.push('Experimenta con instrumentos o la voz de manera guiada.');
    return base;
  },
  'artes': (v, oa) => {
    const base: string[] = [];
    if (v.includes('crear') || v.includes('expresar')) base.push('Crea una producción visual relacionada con el propósito del OA.');
    if (v.includes('observar') || v.includes('describir')) base.push('Describe elementos visuales presentes en obras o producciones.');
    if (v.includes('experimentar') || v.includes('usar')) base.push('Experimenta con materiales, herramientas o técnicas trabajadas.');
    if (v.includes('apreciar') || v.includes('valorar')) base.push('Expresa ideas o emociones mediante recursos visuales.');
    if (base.length < 3) base.push('Participa en actividades de creación visual siguiendo indicaciones.');
    if (base.length < 4) base.push('Reconoce elementos artísticos en su entorno o en obras observadas.');
    return base;
  },
  'edufisica': (v, oa) => {
    const base: string[] = [];
    if (v.includes('ejecutar') || v.includes('realizar') || v.includes('participar')) base.push('Ejecuta habilidades motrices según las indicaciones de la actividad.');
    if (v.includes('aplicar') || v.includes('seguir')) base.push('Participa activamente respetando normas de seguridad y convivencia.');
    if (v.includes('reconocer') || v.includes('identificar')) base.push('Reconoce acciones que favorecen el autocuidado y la vida activa.');
    if (v.includes('colaborar') || v.includes('cooperar')) base.push('Coopera con sus pares durante juegos o actividades físicas.');
    if (base.length < 3) base.push('Demuestra coordinación y control corporal en actividades guiadas.');
    if (base.length < 4) base.push('Sigue instrucciones durante la actividad física de forma autónoma.');
    return base;
  },
  'tecnologia': (v, oa) => {
    const base: string[] = [];
    if (v.includes('diseñar') || v.includes('proponer')) base.push('Propone soluciones tecnológicas simples frente a una necesidad.');
    if (v.includes('usar') || v.includes('aplicar')) base.push('Usa herramientas o materiales de manera segura y pertinente.');
    if (v.includes('seguir') || v.includes('realizar')) base.push('Sigue etapas básicas de diseño, construcción o mejora.');
    if (v.includes('evaluar') || v.includes('analizar')) base.push('Evalúa el resultado de su trabajo según criterios acordados.');
    if (base.length < 3) base.push('Participa en proyectos tecnológicos siguiendo instrucciones.');
    if (base.length < 4) base.push('Comunica el proceso y resultado de su trabajo tecnológico.');
    return base;
  },
  'orientacion': (v, oa) => {
    const base: string[] = [];
    if (v.includes('reconocer') || v.includes('identificar')) base.push('Reconoce emociones, necesidades o situaciones de convivencia.');
    if (v.includes('proponer') || v.includes('participar')) base.push('Propone acciones para favorecer el respeto y el buen trato.');
    if (v.includes('participar') || v.includes('comunicar')) base.push('Participa en actividades de reflexión personal o grupal.');
    if (v.includes('decidir') || v.includes('valorar')) base.push('Identifica decisiones responsables en contextos escolares o familiares.');
    if (base.length < 3) base.push('Expresa sus ideas y emociones de manera respetuosa.');
    if (base.length < 4) base.push('Colabora en actividades grupales respetando acuerdos.');
    return base;
  },
  'ingles': (v, oa) => {
    const base: string[] = [];
    if (v.includes('comprender') || v.includes('escuchar') || v.includes('leer')) base.push('Comprende palabras, frases o instrucciones simples relacionadas con el OA.');
    if (v.includes('usar') || v.includes('aplicar') || v.includes('comunicar')) base.push('Usa vocabulario trabajado en situaciones comunicativas breves.');
    if (v.includes('responder') || v.includes('participar')) base.push('Responde preguntas simples con apoyo visual o contextual.');
    if (v.includes('escribir') || v.includes('producir')) base.push('Produce frases breves siguiendo modelos dados.');
    if (base.length < 3) base.push('Participa en actividades orales o escritas sencillas.');
    if (base.length < 4) base.push('Identifica vocabulario clave en textos o audios adecuados al nivel.');
    return base;
  },
};

const SKILL_TEMPLATES: Record<string, (verbs: string[], oa: string) => string[]> = {
  'lenguaje': (v, oa) => {
    const base: string[] = [];
    if (v.includes('leer') || oa.toLowerCase().includes('leer')) base.push('Leer textos adecuados al nivel con propósito definido.');
    if (v.includes('comprender') || v.includes('inferir') || oa.toLowerCase().includes('comprender')) base.push('Comprender información explícita e implícita del texto.');
    if (v.includes('escribir') || oa.toLowerCase().includes('escri')) base.push('Producir textos breves manteniendo coherencia y claridad.');
    if (v.includes('comunicar') || v.includes('expresar') || oa.toLowerCase().includes('oral')) base.push('Comunicar ideas oralmente con claridad y vocabulario adecuado.');
    if (base.length < 3) base.push('Utilizar estrategias de comprensión lectora según el propósito.');
    if (base.length < 4) base.push('Participar en interacciones comunicativas en el aula.');
    return base;
  },
  'matematica': (v, oa) => {
    const base: string[] = [];
    if (v.includes('resolver') || oa.toLowerCase().includes('problema')) base.push('Resolver problemas aplicando estrategias adecuadas.');
    if (v.includes('representar') || v.includes('modelar')) base.push('Representar información con números, esquemas o material concreto.');
    if (v.includes('calcular') || v.includes('operar')) base.push('Calcular y verificar resultados de operaciones.');
    if (v.includes('argumentar') || v.includes('explicar') || v.includes('comunicar')) base.push('Argumentar y comunicar procedimientos y resultados.');
    if (base.length < 3) base.push('Aplicar el aprendizaje del OA en situaciones nuevas.');
    if (base.length < 4) base.push('Utilizar vocabulario matemático adecuado al nivel.');
    return base;
  },
  'ciencias': (v, oa) => {
    const base: string[] = [];
    if (v.includes('observar') || v.includes('describir')) base.push('Observar y describir características o fenómenos.');
    if (v.includes('clasificar') || v.includes('comparar')) base.push('Comparar y clasificar información o elementos.');
    if (v.includes('explicar') || v.includes('reconocer')) base.push('Explicar relaciones causa-efecto con apoyo de evidencia.');
    if (v.includes('registrar') || v.includes('experimentar')) base.push('Registrar evidencia mediante dibujos, tablas o explicaciones.');
    if (base.length < 3) base.push('Formular preguntas y predicciones sobre el entorno.');
    if (base.length < 4) base.push('Comunicar conclusiones simples a partir de evidencia.');
    return base;
  },
  'historia': (v, oa) => {
    const base: string[] = [];
    if (v.includes('identificar') || v.includes('reconocer')) base.push('Identificar procesos y acontecimientos relevantes.');
    if (v.includes('ubicar') || v.includes('relacionar')) base.push('Ubicar información temporal y espacialmente.');
    if (v.includes('comparar') || v.includes('analizar')) base.push('Comparar fuentes o situaciones históricas.');
    if (v.includes('explicar') || v.includes('argumentar')) base.push('Explicar cambios y continuidades con ejemplos.');
    if (base.length < 3) base.push('Obtener información de fuentes simples.');
    if (base.length < 4) base.push('Comunicar hallazgos de forma oral o escrita.');
    return base;
  },
  'musica': (v, oa) => {
    const base: string[] = [];
    if (v.includes('escuchar') || v.includes('reconocer')) base.push('Escuchar y reconocer elementos musicales.');
    if (v.includes('interpretar') || v.includes('participar')) base.push('Interpretar repertorio o patrones musicales.');
    if (v.includes('crear') || v.includes('expresar')) base.push('Crear patrones o secuencias sonoras.');
    if (v.includes('apreciar') || v.includes('valorar')) base.push('Apreciar manifestaciones musicales de diverso origen.');
    if (base.length < 3) base.push('Participar en actividades musicales de forma colaborativa.');
    if (base.length < 4) base.push('Expresar ideas y emociones a través de la música.');
    return base;
  },
  'artes': (v, oa) => {
    const base: string[] = [];
    if (v.includes('crear') || v.includes('expresar')) base.push('Crear producciones expresivas con intención comunicativa.');
    if (v.includes('observar') || v.includes('describir')) base.push('Observar y describir elementos visuales en obras o producciones.');
    if (v.includes('experimentar') || v.includes('usar')) base.push('Experimentar con materiales y técnicas artísticas.');
    if (v.includes('apreciar') || v.includes('valorar')) base.push('Apreciar manifestaciones artísticas de diverso origen.');
    if (base.length < 3) base.push('Expresar ideas o emociones mediante recursos visuales.');
    if (base.length < 4) base.push('Participar en actividades de creación visual.');
    return base;
  },
  'edufisica': (v, oa) => {
    const base: string[] = [];
    if (v.includes('ejecutar') || v.includes('realizar')) base.push('Ejecutar habilidades motrices en diversas actividades.');
    if (v.includes('participar') || v.includes('colaborar')) base.push('Participar activamente en actividades físicas y deportivas.');
    if (v.includes('reconocer') || v.includes('identificar')) base.push('Reconocer acciones que favorecen el autocuidado.');
    if (v.includes('seguir') || v.includes('aplicar')) base.push('Aplicar normas de seguridad y convivencia en el juego.');
    if (base.length < 3) base.push('Cooperar con pares durante actividades físicas.');
    if (base.length < 4) base.push('Demostrar coordinación y control corporal.');
    return base;
  },
  'tecnologia': (v, oa) => {
    const base: string[] = [];
    if (v.includes('diseñar') || v.includes('proponer')) base.push('Diseñar soluciones tecnológicas simples.');
    if (v.includes('usar') || v.includes('aplicar')) base.push('Usar herramientas y materiales de manera segura.');
    if (v.includes('evaluar') || v.includes('analizar')) base.push('Evaluar procesos y productos tecnológicos.');
    if (v.includes('seguir') || v.includes('realizar')) base.push('Seguir etapas de diseño y construcción.');
    if (base.length < 3) base.push('Proponer mejoras a partir del análisis del trabajo realizado.');
    if (base.length < 4) base.push('Comunicar el proceso y resultado de su trabajo.');
    return base;
  },
  'orientacion': (v, oa) => {
    const base: string[] = [];
    if (v.includes('reconocer') || v.includes('identificar')) base.push('Reconocer emociones y situaciones de convivencia.');
    if (v.includes('participar') || v.includes('proponer')) base.push('Participar respetuosamente en actividades grupales.');
    if (v.includes('decidir') || v.includes('valorar')) base.push('Tomar decisiones responsables en contextos escolares.');
    if (v.includes('comunicar') || v.includes('expresar')) base.push('Expresar ideas y necesidades de manera respetuosa.');
    if (base.length < 3) base.push('Colaborar en la construcción de un clima positivo de aula.');
    if (base.length < 4) base.push('Identificar acciones que favorecen el bienestar propio y colectivo.');
    return base;
  },
  'ingles': (v, oa) => {
    const base: string[] = [];
    if (v.includes('comprender') || v.includes('escuchar') || v.includes('leer')) base.push('Comprender mensajes orales y escritos simples.');
    if (v.includes('usar') || v.includes('aplicar')) base.push('Usar vocabulario contextual en situaciones comunicativas.');
    if (v.includes('interactuar') || v.includes('responder')) base.push('Interactuar en situaciones simples usando frases aprendidas.');
    if (v.includes('escribir') || v.includes('producir')) base.push('Producir frases breves siguiendo modelos dados.');
    if (base.length < 3) base.push('Participar en actividades de comprensión auditiva.');
    if (base.length < 4) base.push('Identificar vocabulario clave en textos o audios.');
    return base;
  },
};

export function generateChileanCurriculumIndicators(params: { course: string; subject: string; objectiveCode: string; objectiveText: string }): any[] {
  const { subject, objectiveCode, objectiveText } = params;
  const verbs = extractVerbsFromOA(objectiveText);
  const templateKey = getSubjectTemplateKey(subject);
  const generator = INDICATOR_TEMPLATES[templateKey];
  const texts = generator ? generator(verbs, objectiveText) : [
    'Demuestra comprensión del contenido del OA mediante evidencia observable.',
    'Aplica el aprendizaje del OA en una actividad guiada.',
    'Comunica sus ideas relacionadas con el OA de forma oral o escrita.',
  ];
  return texts.map((text, i) => ({
    id: `curriculum-suggested-${objectiveCode?.replace(/\s+/g, '-') || 'oa'}-${i + 1}`,
    oa_code: objectiveCode || 'SUGERIDO',
    indicator_text: text,
    source: 'curriculum_chileno_sugerido',
    label: 'Sugerido desde OA MINEDUC',
    _editable: true,
  }));
}

export function generateChileanCurriculumSkills(params: { course: string; subject: string; objectiveCode: string; objectiveText: string }): string[] {
  const { subject, objectiveText } = params;
  const verbs = extractVerbsFromOA(objectiveText);
  const templateKey = getSubjectTemplateKey(subject);
  const generator = SKILL_TEMPLATES[templateKey];
  if (generator) return generator(verbs, objectiveText);
  return [
    'Comprender información explícita e implícita.',
    'Aplicar el aprendizaje en situaciones nuevas.',
    'Comunicar ideas con claridad.',
    'Demostrar avance en el objetivo evaluado.',
  ];
}
