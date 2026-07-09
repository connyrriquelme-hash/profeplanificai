export type LevelCycle = 'parvularia' | 'basico_1_2' | 'basico_3_4' | 'basico_5_6' | 'basico_7_8' | 'medio_1_2' | 'medio_3_4';

export type LevelProfile = {
  cycle: LevelCycle;
  label: string;
  maxBullets: number;
  maxTableRows: number;
  maxTableCols: number;
  languageComplexity: 'simple' | 'basic' | 'intermediate' | 'advanced';
  evidenceTypes: string[];
  activityTypes: string[];
  cognitiveDepth: string[];
  duaSupports: string[];
  verbPrefix: string[];
  descriptorStyle: 'oral_dibujo' | 'observacion' | 'explicacion_basica' | 'comparacion' | 'analisis' | 'argumentacion';
};

export type SubjectPedagogicalProfile = {
  id: string;
  aliases: string[];
  displayName: string;
  conceptsLabel: string;
  pptVisualStyle: string;
  pptTableType: string;
  pptActivityTypes: string[];
  rubricCriteriaNames: string[];
  evidenceTypes: string[];
  feedbackFocus: string[];
  duaSupports: string[];
  imagePromptStyle: string;
};

const LEVEL_PROFILES: Record<LevelCycle, LevelProfile> = {
  parvularia: {
    cycle: 'parvularia',
    label: 'Educación Parvularia',
    maxBullets: 3,
    maxTableRows: 3,
    maxTableCols: 3,
    languageComplexity: 'simple',
    evidenceTypes: ['dibujo', 'señalamiento', 'expresión oral', 'manipulación', 'observación'],
    activityTypes: ['juego', 'exploración sensorial', 'canción', 'cuento', 'pintura', 'juego de roles'],
    cognitiveDepth: ['reconocimiento', 'identificación', 'imitación'],
    duaSupports: ['pictogramas', 'imágenes grandes', 'objeto concreto', 'modelado docente', 'ritmos y canciones'],
    verbPrefix: ['Observa', 'Toca', 'Escucha', 'Señala', 'Imita'],
    descriptorStyle: 'oral_dibujo',
  },
  basico_1_2: {
    cycle: 'basico_1_2',
    label: '1°-2° Básico',
    maxBullets: 3,
    maxTableRows: 3,
    maxTableCols: 3,
    languageComplexity: 'basic',
    evidenceTypes: ['dibujo', 'expresión oral', 'escritura simple', 'observación', 'clasificación simple'],
    activityTypes: ['lectura guiada', 'juego de roles', 'dictado', 'observación directa', 'trabajo manual'],
    cognitiveDepth: ['observar', 'identificar', 'nombrar', 'comparar simple'],
    duaSupports: ['pictogramas', 'tarjetas visuales', 'apoyo docente directo', 'trabajo en parejas', 'tiempo extendido'],
    verbPrefix: ['Observa', 'Identifica', 'Nombra', 'Comparte', 'Dibuja'],
    descriptorStyle: 'observacion',
  },
  basico_3_4: {
    cycle: 'basico_3_4',
    label: '3°-4° Básico',
    maxBullets: 4,
    maxTableRows: 4,
    maxTableCols: 3,
    languageComplexity: 'basic',
    evidenceTypes: ['explicación oral', 'escritura', 'dibujo con etiquetas', 'clasificación', 'comparación'],
    activityTypes: ['lectura comprensiva', 'experimento simple', 'trabajo en equipo', 'organizador gráfico', 'investigación guiada'],
    cognitiveDepth: ['describir', 'explicar simple', 'comparar', 'clasificar'],
    duaSupports: ['organizadores gráficos', 'guías paso a paso', 'apoyo visual', 'varias opciones de respuesta', 'tiempo flexible'],
    verbPrefix: ['Describe', 'Explica', 'Compara', 'Clasifica', 'Identifica'],
    descriptorStyle: 'explicacion_basica',
  },
  basico_5_6: {
    cycle: 'basico_5_6',
    label: '5°-6° Básico',
    maxBullets: 5,
    maxTableRows: 4,
    maxTableCols: 4,
    languageComplexity: 'intermediate',
    evidenceTypes: ['explicación escrita', 'análisis simple', 'comparación', 'registro', 'experimentación'],
    activityTypes: ['investigación', 'debate guiado', 'proyecto corto', 'análisis de texto', 'resolución de problemas'],
    cognitiveDepth: ['analizar simple', 'relacionar', 'inferir', 'evaluar simple'],
    duaSupports: ['textos adaptados', 'audioguías', 'organizadores de información', 'rúbricas sencillas', 'trabajo colaborativo'],
    verbPrefix: ['Analiza', 'Relaciona', 'Compara', 'Describe', 'Aplica'],
    descriptorStyle: 'comparacion',
  },
  basico_7_8: {
    cycle: 'basico_7_8',
    label: '7°-8° Básico',
    maxBullets: 5,
    maxTableRows: 5,
    maxTableCols: 4,
    languageComplexity: 'intermediate',
    evidenceTypes: ['análisis', 'argumentación básica', 'comparación', 'síntesis', 'experimentación'],
    activityTypes: ['debate', 'investigación', 'proyecto', 'análisis de fuentes', 'resolución de problemas complejos'],
    cognitiveDepth: ['analizar', 'argumentar', 'evaluar', 'sintetizar'],
    duaSupports: ['textos complejos adaptados', 'neumotecnicas', 'mapas conceptuales', 'guias de estudio', 'evaluación formativa'],
    verbPrefix: ['Analiza', 'Argumenta', 'Evalúa', 'Compara', 'Sintetiza'],
    descriptorStyle: 'comparacion',
  },
  medio_1_2: {
    cycle: 'medio_1_2',
    label: '1°-2° Medio',
    maxBullets: 5,
    maxTableRows: 5,
    maxTableCols: 4,
    languageComplexity: 'advanced',
    evidenceTypes: ['análisis profundo', 'argumentación', 'investigación', 'experimentación', 'síntesis'],
    activityTypes: ['investigación autónoma', 'debate argumentado', 'proyecto de aplicación', 'análisis de fuentes', 'modelamiento'],
    cognitiveDepth: ['analizar', 'argumentar', 'evaluar', 'crear', 'sintetizar'],
    duaSupports: ['textos académicos adaptados', 'neumotecnicas avanzadas', 'mapas conceptuales complejos', 'proyectos flexibles', 'rúbricas detalladas'],
    verbPrefix: ['Analiza', 'Argumenta', 'Evalúa', 'Diseña', 'Sintetiza'],
    descriptorStyle: 'analisis',
  },
  medio_3_4: {
    cycle: 'medio_3_4',
    label: '3°-4° Medio',
    maxBullets: 5,
    maxTableRows: 5,
    maxTableCols: 4,
    languageComplexity: 'advanced',
    evidenceTypes: ['argumentación fundamentada', 'investigación profunda', 'análisis crítico', 'creación', 'evaluación'],
    activityTypes: ['seminario', 'investigación autónoma', 'proyecto de aplicación', 'análisis de fuentes primarias', 'debate formal'],
    cognitiveDepth: ['argumentar', 'evaluar críticamente', 'crear', 'sintetizar', 'toma de postura'],
    duaSupports: ['formatos múltiples de acceso', 'opciones de expresión variadas', 'relevancia cultural', 'evaluación auténtica', 'autorregulación'],
    verbPrefix: ['Argumenta', 'Evalúa', 'Diseña', 'Crea', 'Toma postura'],
    descriptorStyle: 'argumentacion',
  },
};

const SUBJECT_PROFILES: SubjectPedagogicalProfile[] = [
  {
    id: 'lenguaje',
    aliases: ['lenguaje', 'comunicación', 'comunicacion', 'castellano', 'lengua y literatura', 'lengua'],
    displayName: 'Lenguaje y Comunicación',
    conceptsLabel: 'textos',
    pptVisualStyle: 'textos libros organizadores dialogue',
    pptTableType: 'texto_comprehension',
    pptActivityTypes: ['lectura', 'oralidad', 'escritura', 'comprensión', 'análisis de texto'],
    rubricCriteriaNames: ['Comprensión del texto', 'Organización de ideas', 'Uso de evidencia textual', 'Expresión oral/escrita'],
    evidenceTypes: ['texto escrito', 'exposición oral', 'lectoría', 'resumen', 'mapa conceptual'],
    feedbackFocus: ['comprensión lectora', 'coherencia', 'uso de vocabulario', 'estructura del texto'],
    duaSupports: ['textos adaptados', 'audiolibros', 'guías de lectura', 'formatos visuales'],
    imagePromptStyle: 'textos libros lectura comprensión organización',
  },
  {
    id: 'matematica',
    aliases: ['matemática', 'matematica', 'mate', 'pensamiento matemático', 'pensamiento matematico'],
    displayName: 'Matemática',
    conceptsLabel: 'problemas',
    pptVisualStyle: 'números geometría patrones gráficos',
    pptTableType: 'problema_resolucion',
    pptActivityTypes: ['resolución de problemas', 'representación', 'modelamiento', 'verificación', 'geometría'],
    rubricCriteriaNames: ['Comprensión del problema', 'Estrategia de resolución', 'Representación matemática', 'Precisión del cálculo'],
    evidenceTypes: ['problema resuelto', 'procedimiento', 'representación gráfica', 'verificación', 'explicación'],
    feedbackFocus: ['estrategia', 'procedimiento', 'resultado', 'razonamiento'],
    duaSupports: ['材料 concretos', 'línea numérica', 'regletas', 'representaciones visuales'],
    imagePromptStyle: 'números geometría patrones gráficos matemáticos',
  },
  {
    id: 'ciencias_ciudadania',
    aliases: ['ciencias para la ciudadanía', 'ciencias para la ciudadania', 'ciudadanía científica'],
    displayName: 'Ciencias para la Ciudadanía',
    conceptsLabel: 'problemas sociales-científicos',
    pptVisualStyle: 'ciudadanía ciencia sociedad evidencia decisión',
    pptTableType: 'problema_evidencia_impacto',
    pptActivityTypes: ['análisis de caso', 'debate', 'investigación', 'propuesta', 'deliberación'],
    rubricCriteriaNames: ['Comprensión del problema', 'Uso de evidencia científica', 'Análisis de impacto', 'Decisión informada'],
    evidenceTypes: ['análisis de caso', 'debate', 'propuesta', 'investigación', 'presentación'],
    feedbackFocus: ['evidencia', 'impacto social', 'argumentación', 'ciudadanía'],
    duaSupports: ['casos contextualizados', 'imágenes de impacto', 'dinámicas de debate', 'propuestas concretas'],
    imagePromptStyle: 'ciencia ciudadanía sociedad evidencia impacto decisión',
  },
  {
    id: 'ciencias',
    aliases: ['ciencias', 'ciencias naturales', 'natural', 'biología', 'biologia'],
    displayName: 'Ciencias Naturales',
    conceptsLabel: 'fenómenos',
    pptVisualStyle: 'ciencia naturaleza experimento observación',
    pptTableType: 'observacion_fenomeno',
    pptActivityTypes: ['observación', 'experimento', 'clasificación', 'medición', 'explicación'],
    rubricCriteriaNames: ['Observación de fenómenos', 'Vocabulario científico', 'Explicación de procesos', 'Registro de evidencias'],
    evidenceTypes: ['registro de observación', 'experimento', 'clasificación', 'diagrama', 'explicación'],
    feedbackFocus: ['precisión', 'uso de vocabulario', 'método científico', 'evidencia'],
    duaSupports: ['imágenes de fenómenos', 'videos', 'experimentos manipulativos', 'guías de observación'],
    imagePromptStyle: 'ciencia naturaleza biología experimento laboratorio',
  },
  {
    id: 'historia',
    aliases: ['historia', 'geografía', 'geografia', 'sociales', 'historia, geografía y cs. sociales'],
    displayName: 'Historia, Geografía y Cs. Sociales',
    conceptsLabel: 'contextos',
    pptVisualStyle: 'historia geografía mapas fuentes documentos',
    pptTableType: 'periodo_hecho_causa',
    pptActivityTypes: ['análisis de fuentes', 'línea de tiempo', 'mapa conceptual', 'debate', 'investigación'],
    rubricCriteriaNames: ['Comprensión del contexto histórico', 'Uso de fuentes', 'Causas y consecuencias', 'Relación con contexto actual'],
    evidenceTypes: ['análisis de fuente', 'línea de tiempo', 'mapa', 'ensayo', 'exposición'],
    feedbackFocus: ['uso de fuentes', 'contextualización', 'análisis causal', 'conexión actual'],
    duaSupports: ['mapas simplificados', 'líneas de tiempo visuales', 'fuentes adaptadas', 'imágenes históricas'],
    imagePromptStyle: 'historia geografía mapas documentos culturales',
  },
  {
    id: 'ingles',
    aliases: ['inglés', 'ingles', 'english'],
    displayName: 'Inglés',
    conceptsLabel: 'expresiones',
    pptVisualStyle: 'english vocabulary conversation cards scenes',
    pptTableType: 'vocabulario_expresion',
    pptActivityTypes: ['comprensión', 'vocabulario', 'producción oral', 'producción escrita', 'interacción comunicativa'],
    rubricCriteriaNames: ['Comprensión de vocabulario', 'Uso comunicativo', 'Producción oral/escrita', 'Interacción comunicativa'],
    evidenceTypes: ['uso de vocabulario', 'diálogo', 'texto escrito', 'presentación oral', 'tarea comunicativa'],
    feedbackFocus: ['pronunciación', 'uso correcto', 'fluidez', 'vocabulario'],
    duaSupports: ['tarjetas visuales', 'audio', 'imágenes', 'modelado', 'práctica repetitiva'],
    imagePromptStyle: 'english vocabulary conversation classroom bilingual',
  },
  {
    id: 'artes',
    aliases: ['artes', 'artes visuales', 'visual', 'arte'],
    displayName: 'Artes Visuales',
    conceptsLabel: 'elementos visuales',
    pptVisualStyle: 'arte color forma textura composición obra',
    pptTableType: 'elemento_visual_tecnica',
    pptActivityTypes: ['exploración de materiales', 'expresión creativa', 'análisis de obra', 'proceso creativo', 'técnicas'],
    rubricCriteriaNames: ['Exploración de materiales', 'Expresión de ideas', 'Elementos del lenguaje visual', 'Proceso creativo'],
    evidenceTypes: ['obra creativa', 'proceso documentado', 'boceto', 'análisis visual', ' reflexión'],
    feedbackFocus: ['creatividad', 'uso de elementos', 'proceso', 'intención'],
    duaSupports: ['materiales variados', 'modelado visual', 'inspiración', 'proceso flexible'],
    imagePromptStyle: 'arte visual color forma textura creatividad obra',
  },
  {
    id: 'musica',
    aliases: ['música', 'musica'],
    displayName: 'Música',
    conceptsLabel: 'elementos sonoros',
    pptVisualStyle: 'música ritmo sonido instrumento melodía',
    pptTableType: 'sonido_ritmo_instrumento',
    pptActivityTypes: ['escucha activa', 'interpretación', 'creación sonora', 'expresión musical', 'análisis musical'],
    rubricCriteriaNames: ['Escucha activa', 'Interpretación rítmica/melódica', 'Creación sonora', 'Expresión y reflexión musical'],
    evidenceTypes: ['interpretación', 'creación musical', 'registro de escucha', 'análisis sonoro', 'presentación'],
    feedbackFocus: ['ritmo', 'melodía', 'expresión', 'escucha'],
    duaSupports: ['instrumentos variados', 'canciones con movimiento', 'imágenes de instrumentos', 'práctica grupal'],
    imagePromptStyle: 'música ritmo sonido instrumento melodía escucha',
  },
  {
    id: 'tecnologia',
    aliases: ['tecnología', 'tecnologia', 'informática', 'informatica', 'programación', 'programacion'],
    displayName: 'Tecnología',
    conceptsLabel: 'soluciones',
    pptVisualStyle: 'tecnología diseño construcción prototipo herramienta',
    pptTableType: 'problema_solucion_material',
    pptActivityTypes: ['diseño', 'construcción', 'prueba', 'evaluación', 'mejora'],
    rubricCriteriaNames: ['Comprensión del problema', 'Diseño de solución', 'Construcción/prototipo', 'Evaluación y mejora'],
    evidenceTypes: ['prototipo', 'plan de diseño', 'prueba', 'evaluación', 'documentación'],
    feedbackFocus: ['diseño', 'funcionalidad', 'innovación', 'mejora'],
    duaSupports: ['instrucciones paso a paso', 'materiales variados', 'modelado', 'trabajo en equipo'],
    imagePromptStyle: 'tecnología diseño construcción prototipo herramientas digitales',
  },
  {
    id: 'edufisica',
    aliases: ['educación física', 'educacion fisica', 'ed. físico', 'ed. fisico', 'física y salud', 'fisica y salud'],
    displayName: 'Educación Física y Salud',
    conceptsLabel: 'habilidades motrices',
    pptVisualStyle: 'movimiento deporte reglas salud autocuidado',
    pptTableType: 'habilidad_motriz_regla',
    pptActivityTypes: ['calentamiento', 'juego dirigido', 'competencia', 'reflexión', 'autocuidado'],
    rubricCriteriaNames: ['Ejecución motriz', 'Respeto de reglas', 'Autocuidado', 'Trabajo colaborativo'],
    evidenceTypes: ['demonstración', 'participación', 'registro', 'reflexión', 'evaluación del compañero'],
    feedbackFocus: ['técnica', 'esfuerzo', 'colaboración', 'hábitos saludables'],
    duaSupports: ['adaptación de reglas', 'variantes de dificultad', 'espacios seguros', 'modelado'],
    imagePromptStyle: 'movimiento deporte salud actividad física juego',
  },
  {
    id: 'fisica',
    aliases: ['física', 'fisica', 'ciencias físicas', 'ciencias fisicas'],
    displayName: 'Física',
    conceptsLabel: 'fenómenos físicos',
    pptVisualStyle: 'física energía movimiento fuerzas experimento',
    pptTableType: 'fenomeno_ley_experimento',
    pptActivityTypes: ['experimento', 'medición', 'modelamiento', 'análisis de datos', 'explicación'],
    rubricCriteriaNames: ['Comprensión de leyes', 'Diseño experimental', 'Análisis de datos', 'Explicación'],
    evidenceTypes: ['registro experimental', 'cálculos', 'gráfico', 'modelamiento', 'explicación'],
    feedbackFocus: ['precisión', 'método', 'análisis', 'explicación'],
    duaSupports: ['experimentos manipulativos', 'simulaciones', 'gráficos', 'guías paso a paso'],
    imagePromptStyle: 'física energía movimiento fuerzas laboratorio experimento',
  },
  {
    id: 'orientacion',
    aliases: ['orientación', 'orientacion'],
    displayName: 'Orientación',
    conceptsLabel: 'situaciones',
    pptVisualStyle: 'emociones convivencia decisiones bienestar',
    pptTableType: 'situacion_emocion_decision',
    pptActivityTypes: ['reflexión', 'rol', 'diálogo', 'autoconocimiento', 'convivencia'],
    rubricCriteriaNames: ['Reconocimiento personal', 'Convivencia', 'Toma de decisiones', 'Participación respetuosa'],
    evidenceTypes: ['reflexión personal', 'participación', 'registro', 'diálogo', 'autoevaluación'],
    feedbackFocus: ['autoconocimiento', 'empatía', 'decisiones', 'convivencia'],
    duaSupports: ['espacios seguros', 'dinámicas inclusivas', 'escucha activa', 'fotos y situaciones'],
    imagePromptStyle: 'emociones convivencia bienestar socioemocional orientación',
  },
  {
    id: 'formacion_ciudadana',
    aliases: ['formación ciudadana', 'formacion ciudadana', 'educación ciudadana', 'educacion ciudadana', 'ciudadana'],
    displayName: 'Formación Ciudadana',
    conceptsLabel: 'situaciones ciudadanas',
    pptVisualStyle: 'ciudadanía derechos deberes participación comunidad',
    pptTableType: 'derecho_deber_accion',
    pptActivityTypes: ['análisis', 'debate', 'deliberación', 'participación', 'propuesta'],
    rubricCriteriaNames: ['Normas y valores', 'Participación responsable', 'Toma de decisiones informada', 'Valoración de la diversidad'],
    evidenceTypes: ['análisis', 'debate', 'propuesta', 'participación', 'registro'],
    feedbackFocus: ['argumentación', 'respeto', 'participación', 'ciudadanía'],
    duaSupports: ['situaciones contextualizadas', 'imágenes de comunidad', 'dinámicas de debate', 'propuestas concretas'],
    imagePromptStyle: 'ciudadanía derechos participación comunidad responsable',
  },
  {
    id: 'filosofia',
    aliases: ['filosofía', 'filosofia'],
    displayName: 'Filosofía',
    conceptsLabel: 'preguntas fundamentales',
    pptVisualStyle: 'filosofía preguntas argumentos perspectivas reflexión',
    pptTableType: 'pregunta_postura_argumento',
    pptActivityTypes: ['reflexión', 'debate argumentado', 'análisis de textos', 'diálogo socrático', 'ensayo'],
    rubricCriteriaNames: ['Formulación de preguntas', 'Argumentación', 'Análisis de perspectivas', 'Uso de ejemplos'],
    evidenceTypes: ['ensayo argumentado', 'participación en debate', 'análisis filosófico', ' reflexión escrita'],
    feedbackFocus: ['profundidad', 'argumentación', 'claridad', 'ejemplos'],
    duaSupports: ['textos adaptados', 'imágenes filosóficas', 'diálogo guiado', 'formatos de expresión variados'],
    imagePromptStyle: 'filosofía reflexión pensamiento argumentos ética',
  },
  {
    id: 'quimica',
    aliases: ['química', 'quimica'],
    displayName: 'Química',
    conceptsLabel: 'sustancias y reacciones',
    pptVisualStyle: 'química sustancias reacciones elemento molécula laboratorio',
    pptTableType: 'sustancia_propiedad_reaccion',
    pptActivityTypes: ['experimento', 'clasificación', 'medición', 'modelamiento', 'análisis'],
    rubricCriteriaNames: ['Comprensión de sustancias', 'Diseño experimental', 'Análisis de reacciones', 'Modelamiento molecular'],
    evidenceTypes: ['registro experimental', 'clasificación', 'cálculos', 'modelamiento', 'explicación'],
    feedbackFocus: ['precisión', 'método', 'análisis', 'vocabulario'],
    duaSupports: ['experimentos seguros', 'modelos moleculares', 'imágenes', 'guías paso a paso'],
    imagePromptStyle: 'química sustancias reacciones laboratorio moléculas elementos',
  },
  {
    id: 'parvularia',
    aliases: ['educación parvularia', 'educacion parvularia', 'parvularia', 'identidad', 'autonomía', 'autonomia', 'convivencia', 'corporalidad', 'movimiento', 'lenguaje verbal', 'pensamiento matemático', 'pensamiento matematico', 'exploración del entorno', 'exploracion del entorno'],
    displayName: 'Educación Parvularia',
    conceptsLabel: 'experiencias',
    pptVisualStyle: 'parvularia juego exploración sensorial identidad',
    pptTableType: 'experiencia_exploracion',
    pptActivityTypes: ['juego', 'exploración sensorial', 'canción', 'cuento', 'pintura', 'juego de roles'],
    rubricCriteriaNames: ['Exploración y juego', 'Expresión libre', 'Participación', 'Relación con otros'],
    evidenceTypes: ['dibujo', 'expresión oral', 'juego', 'señalamiento', 'imitación'],
    feedbackFocus: ['participación', 'exploración', 'expresión', 'interacción'],
    duaSupports: ['pictogramas', 'imágenes grandes', 'objeto concreto', 'ritmos', 'canciones'],
    imagePromptStyle: 'parvularia juego exploración niños identidad aprendizaje',
  },
  {
    id: 'lengua_indigena',
    aliases: ['lengua mapuche', 'lengua aymara', 'lengua quechua', 'lengua rapa nui', 'lengua indígena', 'pueblos originarios'],
    displayName: 'Lengua y Cultura de Pueblos Originarios',
    conceptsLabel: 'expresiones culturales',
    pptVisualStyle: 'lengua cultura pueblo originario tradición identidad',
    pptTableType: 'expresion_cultural_tradicion',
    pptActivityTypes: ['escucha', 'expresión oral', 'lectura', 'escritura', 'análisis cultural'],
    rubricCriteriaNames: ['Comprensión de expresiones', 'Uso de la lengua', 'Conexión cultural', 'Participación'],
    evidenceTypes: ['uso de la lengua', 'expresión cultural', 'participación', 'registro', 'análisis'],
    feedbackFocus: ['pronunciación', 'uso', 'respeto cultural', 'participación'],
    duaSupports: ['imágenes culturales', 'audio de hablantes', 'materiales visuales', 'práctica guiada'],
    imagePromptStyle: 'lengua cultura pueblo originario tradición identidad Chile',
  },
  {
    id: 'general',
    aliases: [],
    displayName: 'General',
    conceptsLabel: 'conceptos',
    pptVisualStyle: 'educación aprendizaje conceptual actividades',
    pptTableType: 'concepto_aplicacion',
    pptActivityTypes: ['análisis', 'discusión', 'investigación', 'proyecto', 'presentación'],
    rubricCriteriaNames: ['Comprensión del contenido', 'Aplicación del conocimiento', 'Comunicación de ideas', 'Pensamiento crítico'],
    evidenceTypes: ['explicación', 'análisis', 'presentación', 'proyecto', 'registro'],
    feedbackFocus: ['comprensión', 'aplicación', 'comunicación', 'pensamiento crítico'],
    duaSupports: ['formatos múltiples', 'opciones de expresión', 'relevancia personal', 'evaluación flexible'],
    imagePromptStyle: 'educación aprendizaje conceptual aula',
  },
];

export function getLevelProfile(level: string): LevelProfile {
  const lower = level.toLowerCase();
  if (lower.includes('sala cuna') || lower.includes('transición') || lower.includes('transicion') || lower.includes('pre-kinder') || lower.includes('prekinder') || lower.includes('kinder') || lower.includes('parvularia')) {
    return LEVEL_PROFILES.parvularia;
  }
  const isBasic = lower.includes('básico') || lower.includes('basico') || lower.endsWith('b');
  if (isBasic && (lower.includes('1°') || lower.includes('2°') || lower.includes('1b') || lower.includes('2b'))) {
    return LEVEL_PROFILES.basico_1_2;
  }
  if (isBasic && (lower.includes('3°') || lower.includes('4°') || lower.includes('3b') || lower.includes('4b'))) {
    return LEVEL_PROFILES.basico_3_4;
  }
  if (isBasic && (lower.includes('5°') || lower.includes('6°') || lower.includes('5b') || lower.includes('6b'))) {
    return LEVEL_PROFILES.basico_5_6;
  }
  if (isBasic && (lower.includes('7°') || lower.includes('8°') || lower.includes('7b') || lower.includes('8b'))) {
    return LEVEL_PROFILES.basico_7_8;
  }
  if (lower.includes('1° medio') || lower.includes('2° medio') || lower.includes('1m') || lower.includes('2m')) {
    return LEVEL_PROFILES.medio_1_2;
  }
  if (lower.includes('3° medio') || lower.includes('4° medio') || lower.includes('3m') || lower.includes('4m')) {
    return LEVEL_PROFILES.medio_3_4;
  }
  return LEVEL_PROFILES.basico_5_6;
}

export function getSubjectProfile(subject: string): SubjectPedagogicalProfile {
  const lower = subject.toLowerCase();
  for (const profile of SUBJECT_PROFILES) {
    if (profile.id === 'general') continue;
    for (const alias of profile.aliases) {
      if (lower === alias || lower.includes(alias)) {
        return profile;
      }
    }
  }
  for (const profile of SUBJECT_PROFILES) {
    if (profile.id === 'general') continue;
    for (const alias of profile.aliases) {
      if (alias.includes(lower)) {
        return profile;
      }
    }
  }
  return SUBJECT_PROFILES.find(p => p.id === 'general')!;
}

export function isLowerLevel(level: string): boolean {
  const profile = getLevelProfile(level);
  return profile.cycle === 'parvularia' || profile.cycle === 'basico_1_2' || profile.cycle === 'basico_3_4';
}

export function getAllLevelProfiles(): LevelProfile[] {
  return Object.values(LEVEL_PROFILES);
}

export function getAllSubjectProfiles(): SubjectPedagogicalProfile[] {
  return SUBJECT_PROFILES.filter(p => p.id !== 'general');
}

export function resolveProductFocus(input: { oa: string; tema: string; subject: string }): {
  focusTitle: string;
  focusConcepts: string;
  hasContradiction: boolean;
  visualKeywords: string;
  tableFocus: string;
  criteriaFocus: string;
} {
  const oaLower = input.oa.toLowerCase();
  const temaLower = input.tema.toLowerCase();
  const oaWords = oaLower.split(/\s+/).filter(w => w.length > 4);
  const temaWords = temaLower.split(/\s+/).filter(w => w.length > 4);
  const overlap = oaWords.filter(w => temaWords.includes(w));
  const hasContradiction = oaWords.length > 2 && temaWords.length > 2 && overlap.length === 0;
  return {
    focusTitle: input.oa,
    focusConcepts: oaWords.slice(0, 5).join(', '),
    hasContradiction,
    visualKeywords: oaWords.slice(0, 3).join(', ') || input.tema,
    tableFocus: oaWords.slice(0, 3).join(' ') || input.tema,
    criteriaFocus: oaWords.slice(0, 4).join(' ') || input.tema,
  };
}
