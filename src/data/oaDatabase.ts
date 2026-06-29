export interface OAEntry {
  oaCode: string;
  description: string;
  indicators: IndicatorEntry[];
}

export interface IndicatorEntry {
  id: string;
  description: string;
  maxPoints: number;
}

export interface SubjectOAData {
  subject: string;
  course: string;
  oas: OAEntry[];
}

export const SUBJECTS = [
  'Lenguaje y Comunicacion',
  'Matematica',
  'Ciencias Naturales',
  'Historia, Geografia y Cs. Sociales',
  'Ingles',
];

export const COURSES = [
  '1° Basico', '2° Basico', '3° Basico', '4° Basico',
  '5° Basico', '6° Basico', '7° Basico', '8° Basico',
  '1° Medio', '2° Medio', '3° Medio', '4° Medio',
];

export const OAS_POR_ASIGNATURA: SubjectOAData[] = [
  // ═══════════════════════════════════════════════════════
  // LENGUAJE Y COMUNICACION
  // ═══════════════════════════════════════════════════════
  {
    subject: 'Lenguaje y Comunicacion',
    course: '1° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Expresarse oralmente con claridad usando vocabulario variado en situaciones cotidianas.',
        indicators: [
          { id: 'l1b-oa1-i1', description: 'Participa en conversaciones respetando turnos y usando vocabulario variado.', maxPoints: 4 },
          { id: 'l1b-oa1-i2', description: 'Presenta informacion de forma oral usando conectores basicos.', maxPoints: 4 },
          { id: 'l1b-oa1-i3', description: 'Formula preguntas y respuestas sobre temas conocidos.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Leer textos significativos que incluyan palabras con hiatos y diptongos.',
        indicators: [
          { id: 'l1b-oa2-i1', description: 'Lee palabras con hiatos y diptongos con precision.', maxPoints: 4 },
          { id: 'l1b-oa2-i2', description: 'Lee textos completos en voz alta respetando la puntuacion basica.', maxPoints: 4 },
          { id: 'l1b-oa2-i3', description: 'Identifica informacion explicita relevante dentro del texto leido.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 3',
        description: 'Escribir textos breves usando mayusculas, puntos y conectores simples.',
        indicators: [
          { id: 'l1b-oa3-i1', description: 'Escribe oraciones simples respetando ortografia basica.', maxPoints: 4 },
          { id: 'l1b-oa3-i2', description: 'Utiliza conectores simples en sus escritos.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Lenguaje y Comunicacion',
    course: '2° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Leer textos significativos que incluyan palabras con hiatos y diptongos, con grupos consonanticos y con combinacion.',
        indicators: [
          { id: 'l2b-oa1-i1', description: 'Leen palabras con hiatos y diptongos, asi como combinaciones consonanticas y silabas complejas.', maxPoints: 4 },
          { id: 'l2b-oa1-i2', description: 'Leen textos completos en voz alta respetando la puntuacion basica y con una velocidad adecuada.', maxPoints: 4 },
          { id: 'l2b-oa1-i3', description: 'Identifican informacion explicita relevante dentro del texto leido.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Escribir textos narrativos, descriptivos y expositivos breves.',
        indicators: [
          { id: 'l2b-oa2-i1', description: 'Escribe textos breves incluyendo inicio, desarrollo y cierre.', maxPoints: 4 },
          { id: 'l2b-oa2-i2', description: 'Utiliza vocabulario variado y conectores en sus textos.', maxPoints: 4 },
          { id: 'l2b-oa2-i3', description: 'Respetan la ortografia y puntuacion aprendida.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 4',
        description: 'Leer independientemente y familiarizarse con un amplio repertorio de literatura.',
        indicators: [
          { id: 'l2b-oa4-i1', description: 'Relacionan aspectos de un texto leido y comentado en clases con otros textos.', maxPoints: 4 },
          { id: 'l2b-oa4-i2', description: 'Seleccionan textos para leer por su cuenta.', maxPoints: 4 },
          { id: 'l2b-oa4-i3', description: 'Manifiestan su preferencia por algun texto.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Lenguaje y Comunicacion',
    course: '5° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Leer y comprender textos narrativos adecuados al nivel.',
        indicators: [
          { id: 'l5b-oa1-i1', description: 'Localiza informacion explícita en textos narrativos.', maxPoints: 4 },
          { id: 'l5b-oa1-i2', description: 'Infiere informacion a partir de pistas del texto.', maxPoints: 4 },
          { id: 'l5b-oa1-i3', description: 'Identifica la secuencia narrativa (inicio, desarrollo, cierre).', maxPoints: 4 },
          { id: 'l5b-oa1-i4', description: 'Reconoce la idea principal del texto.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Escribir textos narrativos, descriptivos y expositivos.',
        indicators: [
          { id: 'l5b-oa2-i1', description: 'Planifica su escritura usando borradores.', maxPoints: 4 },
          { id: 'l5b-oa2-i2', description: 'Desarrolla una idea central con coherencia.', maxPoints: 4 },
          { id: 'l5b-oa2-i3', description: 'Revisa y corrige su texto usando normas ortograficas.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 3',
        description: 'Comunicar ideas de forma oral con claridad y seguridad.',
        indicators: [
          { id: 'l5b-oa3-i1', description: 'Presenta un tema de forma organizada y clara.', maxPoints: 4 },
          { id: 'l5b-oa3-i2', description: 'Utiliza vocabulario preciso y conectores logicos.', maxPoints: 4 },
          { id: 'l5b-oa3-i3', description: 'Responde preguntas con argumentos fundamentados.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Lenguaje y Comunicacion',
    course: '8° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Leer y comprender textos literarios y no literarios.',
        indicators: [
          { id: 'l8b-oa1-i1', description: 'Identifica generos literarios y sus caracteristicas.', maxPoints: 4 },
          { id: 'l8b-oa1-i2', description: 'Infiere significados contextualizados en el texto.', maxPoints: 4 },
          { id: 'l8b-oa1-i3', description: 'Analiza la estructura y elementos de un texto.', maxPoints: 4 },
          { id: 'l8b-oa1-i4', description: 'Emite opiniones fundamentadas sobre lo leido.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Escribir textos de distintos generos con intencion comunicativa.',
        indicators: [
          { id: 'l8b-oa2-i1', description: 'Selecciona el genero y formato segun la intencion comunicativa.', maxPoints: 4 },
          { id: 'l8b-oa2-i2', description: 'Desarrolla el texto con estructura coherente y cohesiva.', maxPoints: 4 },
          { id: 'l8b-oa2-i3', description: 'Aplica convenciones ortograficas y de puntuacion avanzadas.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 3',
        description: 'Analizar criticamente textos de los medios de comunicacion.',
        indicators: [
          { id: 'l8b-oa3-i1', description: 'Distingue hechos de opiniones en noticias.', maxPoints: 4 },
          { id: 'l8b-oa3-i2', description: 'Identifica el proposito comunicativo del autor.', maxPoints: 4 },
          { id: 'l8b-oa3-i3', description: 'Compara fuentes de informacion sobre un mismo tema.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Lenguaje y Comunicacion',
    course: '3° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Leer y comprender textos narrativos, descriptivos e instructivos.',
        indicators: [
          { id: 'l3b-oa1-i1', description: 'Identifica la idea principal y detalles relevantes del texto.', maxPoints: 4 },
          { id: 'l3b-oa1-i2', description: 'Distingue entre personajes principales y secundarios.', maxPoints: 4 },
          { id: 'l3b-oa1-i3', description: 'Reconoce la secuencia temporal en narraciones.', maxPoints: 4 },
          { id: 'l3b-oa1-i4', description: 'Infiere emociones e intenciones de los personajes.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Escribir textos narrativos y descriptivos con estructura clara.',
        indicators: [
          { id: 'l3b-oa2-i1', description: 'Planifica su escritura usando organizadores graficos.', maxPoints: 4 },
          { id: 'l3b-oa2-i2', description: 'Escribe textos con inicio, desarrollo y cierre coherente.', maxPoints: 4 },
          { id: 'l3b-oa2-i3', description: 'Utiliza adjetivos y adverbios para enriquecer la descripcion.', maxPoints: 4 },
          { id: 'l3b-oa2-i4', description: 'Revisa ortografia y puntuacion con autonomia.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 3',
        description: 'Participar en conversaciones respetando normas de interaccion.',
        indicators: [
          { id: 'l3b-oa3-i1', description: 'Mantiene el tema de la conversacion en intervenciones.', maxPoints: 4 },
          { id: 'l3b-oa3-i2', description: 'Expresa opiniones con argumentos sencillos.', maxPoints: 4 },
          { id: 'l3b-oa3-i3', description: 'Escucha activamente y responde pertinente.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Lenguaje y Comunicacion',
    course: '4° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Leer y comprender textos literarios e informativos de mayor extension.',
        indicators: [
          { id: 'l4b-oa1-i1', description: 'Identifica el proposito comunicativo y el destinatario del texto.', maxPoints: 4 },
          { id: 'l4b-oa1-i2', description: 'Distingue informacion explicita de la implicita.', maxPoints: 4 },
          { id: 'l4b-oa1-i3', description: 'Reconoce recursos literarios basicos (rima, metafora, simil).', maxPoints: 4 },
          { id: 'l4b-oa1-i4', description: 'Sintetiza la informacion principal de textos informativos.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Escribir textos de diversos generos con coherencia y cohesion.',
        indicators: [
          { id: 'l4b-oa2-i1', description: 'Estructura el texto segun su proposito (narrar, informar, opinar).', maxPoints: 4 },
          { id: 'l4b-oa2-i2', description: 'Utiliza conectores temporales, causales y adversativos.', maxPoints: 4 },
          { id: 'l4b-oa2-i3', description: 'Aplica normas ortograficas de acentuacion y puntuacion.', maxPoints: 4 },
          { id: 'l4b-oa2-i4', description: 'Reescribe suelta y edita su produccion con criterio.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 3',
        description: 'Investigar y presentar informacion usando multiples fuentes.',
        indicators: [
          { id: 'l4b-oa3-i1', description: 'Selecciona informacion relevante de fuentes diversas.', maxPoints: 4 },
          { id: 'l4b-oa3-i2', description: 'Organiza la informacion en esquemas o resumenes.', maxPoints: 4 },
          { id: 'l4b-oa3-i3', description: 'Presenta hallazgos de forma oral con apoyo visual.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Lenguaje y Comunicacion',
    course: '6° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Leer y analizar textos literarios y argumentativos.',
        indicators: [
          { id: 'l6b-oa1-i1', description: 'Identifica tesis, argumentos y contraargumentos.', maxPoints: 4 },
          { id: 'l6b-oa1-i2', description: 'Analiza la estructura de textos argumentativos.', maxPoints: 4 },
          { id: 'l6b-oa1-i3', description: 'Reconoce recursos retoricos y figuras literarias.', maxPoints: 4 },
          { id: 'l6b-oa1-i4', description: 'Evalua la credibilidad de fuentes informativas.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Escribir textos argumentativos y expositivos con estructura formal.',
        indicators: [
          { id: 'l6b-oa2-i1', description: 'Formula una tesis clara y la sostiene con argumentos.', maxPoints: 4 },
          { id: 'l6b-oa2-i2', description: 'Organiza ideas en parrafos con unidad tematica.', maxPoints: 4 },
          { id: 'l6b-oa2-i3', description: 'Utiliza conectores logicos y marcadores discursivos.', maxPoints: 4 },
          { id: 'l6b-oa2-i4', description: 'Cita fuentes y referencia informacion ajena.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 3',
        description: 'Exponer oralmente con claridad, usando recursos multimodales.',
        indicators: [
          { id: 'l6b-oa3-i1', description: 'Estructura la exposicion: introduccion, desarrollo, conclusion.', maxPoints: 4 },
          { id: 'l6b-oa3-i2', description: 'Utiliza lenguaje formal y vocabulario tecnico adecuado.', maxPoints: 4 },
          { id: 'l6b-oa3-i3', description: 'Integra apoyo visual (diapositivas, imagenes) coherente.', maxPoints: 4 },
          { id: 'l6b-oa3-i4', description: 'Responde preguntas del publico con argumentacion.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Lenguaje y Comunicacion',
    course: '7° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Leer criticamente textos de diversos generos y formatos.',
        indicators: [
          { id: 'l7b-oa1-i1', description: 'Analiza la intencionalidad y posicion ideologica del autor.', maxPoints: 4 },
          { id: 'l7b-oa1-i2', description: 'Compara tratamientos de un mismo tema en diferentes textos.', maxPoints: 4 },
          { id: 'l7b-oa1-i3', description: 'Identifica falacias y sesgos en argumentos.', maxPoints: 4 },
          { id: 'l7b-oa1-i4', description: 'Interpreta textos multimodales (infograficas, videos, memes).', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Producir textos creativos y academicos con voz propia.',
        indicators: [
          { id: 'l7b-oa2-i1', description: 'Desarrolla un estilo personal en escritura creativa.', maxPoints: 4 },
          { id: 'l7b-oa2-i2', description: 'Redacta ensayos breves con estructura academica.', maxPoints: 4 },
          { id: 'l7b-oa2-i3', description: 'Aplica criterios de coherencia, cohesion y adecuacion.', maxPoints: 4 },
          { id: 'l7b-oa2-i4', description: 'Autoevalua su proceso de escritura usando rúbricas.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Lenguaje y Comunicacion',
    course: '1° Medio',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Analizar e interpretar textos literarios chilenos e hispanoamericanos.',
        indicators: [
          { id: 'l1m-oa1-i1', description: 'Contextualiza obras en su epoca y movimiento literario.', maxPoints: 4 },
          { id: 'l1m-oa1-i2', description: 'Analiza construccion de personajes, espacio y tiempo narrativo.', maxPoints: 4 },
          { id: 'l1m-oa1-i3', description: 'Identifica temas universales y vision de mundo en la obra.', maxPoints: 4 },
          { id: 'l1m-oa1-i4', description: 'Compara versiones o adaptaciones de una misma obra.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Escribir textos argumentativos complejos y academicos.',
        indicators: [
          { id: 'l1m-oa2-i1', description: 'Construye argumentos solidos con evidencia y contraargumentos.', maxPoints: 4 },
          { id: 'l1m-oa2-i2', description: 'Utiliza conectores avanzados y sintaxis compleja.', maxPoints: 4 },
          { id: 'l1m-oa2-i3', description: 'Aplica normas APA o similares para referenciar.', maxPoints: 4 },
          { id: 'l1m-oa2-i4', description: 'Redacta informes de investigacion con rigor metodologico.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 3',
        description: 'Participar en debates y dialogos argumentativos formales.',
        indicators: [
          { id: 'l1m-oa3-i1', description: 'Sostiene una posicion con argumentos fundados.', maxPoints: 4 },
          { id: 'l1m-oa3-i2', description: 'Refuta contraargumentos con evidencia.', maxPoints: 4 },
          { id: 'l1m-oa3-i3', description: 'Utiliza lenguaje persuasivo y recursos retoricos.', maxPoints: 4 },
          { id: 'l1m-oa3-i4', description: 'Respeta turnos y normas del debate academico.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Lenguaje y Comunicacion',
    course: '2° Medio',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Analizar la construccion del sentido en textos literarios y no literarios.',
        indicators: [
          { id: 'l2m-oa1-i1', description: 'Analiza la intertextualidad y dialogo entre textos.', maxPoints: 4 },
          { id: 'l2m-oa1-i2', description: 'Examina el rol del lector en la construccion de sentido.', maxPoints: 4 },
          { id: 'l2m-oa1-i3', description: 'Interpreta textos desde enfoques criticos (genero, postcolonial, etc).', maxPoints: 4 },
          { id: 'l2m-oa1-i4', description: 'Evalua la calidad estetica y efectividad comunicativa.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Producir textos academicocientificos con metodologia de investigacion.',
        indicators: [
          { id: 'l2m-oa2-i1', description: 'Plantea problemas de investigacion y hipotesis.', maxPoints: 4 },
          { id: 'l2m-oa2-i2', description: 'Selecciona, analiza y sintetiza fuentes bibliograficas.', maxPoints: 4 },
          { id: 'l2m-oa2-i3', description: 'Redacta monografias con estructura IMRyD.', maxPoints: 4 },
          { id: 'l2m-oa2-i4', description: 'Aplica criterios eticos en uso de informacion (citacion, plagio).', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Lenguaje y Comunicacion',
    course: '3° Medio',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Interpretar y valorar la literatura como construccion cultural.',
        indicators: [
          { id: 'l3m-oa1-i1', description: 'Analiza canon literario y procesos de canonizacion.', maxPoints: 4 },
          { id: 'l3m-oa1-i2', description: 'Relaciona literatura con otros artes y expresiones culturales.', maxPoints: 4 },
          { id: 'l3m-oa1-i3', description: 'Reflexiona sobre la funcion social de la literatura.', maxPoints: 4 },
          { id: 'l3m-oa1-i4', description: 'Produces lecturas criticas autonomas y fundamentadas.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Comunicar ideas complejas en contextos academicos y profesionales.',
        indicators: [
          { id: 'l3m-oa2-i1', description: 'Adapta el registro segun audiencia, medio y proposito.', maxPoints: 4 },
          { id: 'l3m-oa2-i2', description: 'Diseña presentaciones ejecutivas y academicas efectivas.', maxPoints: 4 },
          { id: 'l3m-oa2-i3', description: 'Escribe para medios digitales y redes sociales profesionalmente.', maxPoints: 4 },
          { id: 'l3m-oa2-i4', description: 'Gestiona su portfolio de escrituras y producciones.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Lenguaje y Comunicacion',
    course: '4° Medio',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Ejercer ciudadania critica a traves del lenguaje y la comunicacion.',
        indicators: [
          { id: 'l4m-oa1-i1', description: 'Analiza discursos de poder, medios y redes sociales.', maxPoints: 4 },
          { id: 'l4m-oa1-i2', description: 'Desconstruye noticias falsas, sesgos y manipulacion informativa.', maxPoints: 4 },
          { id: 'l4m-oa1-i3', description: 'Argumenta posturas eticas en debates publicos contemporaneos.', maxPoints: 4 },
          { id: 'l4m-oa1-i4', description: 'Participa en espacios democraticos de deliberacion.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Producir comunicaciones efectivas para su proyecto de vida.',
        indicators: [
          { id: 'l4m-oa2-i1', description: 'Redacta CV, cartas de presentacion y portfolio profesional.', maxPoints: 4 },
          { id: 'l4m-oa2-i2', description: 'Comunica proyectos personales en contextos formales.', maxPoints: 4 },
          { id: 'l4m-oa2-i3', description: 'Negocia sentidos y acuerdos en situaciones colaborativas.', maxPoints: 4 },
          { id: 'l4m-oa2-i4', description: 'Autoevalua competencias comunicativas para aprendizaje continuo.', maxPoints: 4 },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════
  // MATEMATICA
  // ═══════════════════════════════════════════════════════
  {
    subject: 'Matematica',
    course: '1° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Reconocer y nombrar numeros hasta el 20, cuantificar colecciones.',
        indicators: [
          { id: 'm1b-oa1-i1', description: 'Cuenta en forma secuencial y recurrente hasta 20.', maxPoints: 4 },
          { id: 'm1b-oa1-i2', description: 'Identifica el numero de objetos en colecciones.', maxPoints: 4 },
          { id: 'm1b-oa1-i3', description: 'Representa numeros usando material concreto.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Establecer relaciones de correspondencia, clasificacion y seriacion.',
        indicators: [
          { id: 'm1b-oa2-i1', description: 'Clasifica objetos segun una o dos caracteristicas.', maxPoints: 4 },
          { id: 'm1b-oa2-i2', description: 'Establece relaciones de igualdad y desigualdad.', maxPoints: 4 },
          { id: 'm1b-oa2-i3', description: 'Completa seriaciones simples.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 3',
        description: 'Reconocer figuras geometricas basicas en objetos del entorno.',
        indicators: [
          { id: 'm1b-oa3-i1', description: 'Identifica circulo, cuadrado, triangulo y rectangulo.', maxPoints: 4 },
          { id: 'm1b-oa3-i2', description: 'Relaciona figuras geometricas con objetos del entorno.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Matematica',
    course: '2° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Reconocer y escribir numeros naturales de hasta 3 digitos.',
        indicators: [
          { id: 'm2b-oa1-i1', description: 'Lee y escribe numeros naturales hasta 999.', maxPoints: 4 },
          { id: 'm2b-oa1-i2', description: 'Identifica el valor posicional de las centenas, decenas y unidades.', maxPoints: 4 },
          { id: 'm2b-oa1-i3', description: 'Ordena y compara numeros de hasta 3 digitos.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Resolver problemas de suma y resta hasta 3 digitos sin reagrupar.',
        indicators: [
          { id: 'm2b-oa2-i1', description: 'Resuelve problemas de suma y resta de manera concreta.', maxPoints: 4 },
          { id: 'm2b-oa2-i2', description: 'Representa problemas con dibujos y/o material concreto.', maxPoints: 4 },
          { id: 'm2b-oa2-i3', description: 'Comunica su procedimiento de resolucion.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 3',
        description: 'Medir objetos usando unidades no convencionales.',
        indicators: [
          { id: 'm2b-oa3-i1', description: 'Mide longitudes usando pasos, manos o lapices.', maxPoints: 4 },
          { id: 'm2b-oa3-i2', description: 'Compara longitudes usando vocabulario adecuado.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Matematica',
    course: '5° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Demostrar comprension de fracciones con denominadores 10, 12, 100 o multiplos.',
        indicators: [
          { id: 'm5b-oa1-i1', description: 'Representa fracciones de manera concreta, pictorica y simbolica.', maxPoints: 4 },
          { id: 'm5b-oa1-i2', description: 'Identifica numerador y denominador y explica su significado.', maxPoints: 4 },
          { id: 'm5b-oa1-i3', description: 'Compara fracciones con igual denominador.', maxPoints: 4 },
          { id: 'm5b-oa1-i4', description: 'Resuelve problemas de suma y resta de fracciones comunes.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Demostrar comprension de la multiplicacion de numeros naturales.',
        indicators: [
          { id: 'm5b-oa2-i1', description: 'Interpreta la multiplicacion como suma repetida.', maxPoints: 4 },
          { id: 'm5b-oa2-i2', description: 'Resuelve multiplicaciones de dos digitos por un digito.', maxPoints: 4 },
          { id: 'm5b-oa2-i3', description: 'Aplica propiedades conmutativa, asociativa y distributiva.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Matematica',
    course: '8° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Demostrar comprension de proporciones y fracciones.',
        indicators: [
          { id: 'm8b-oa1-i1', description: 'Representa proporciones de manera concreta, pictorica y simbolica.', maxPoints: 4 },
          { id: 'm8b-oa1-i2', description: 'Resuelve problemas que involucran porcentajes.', maxPoints: 4 },
          { id: 'm8b-oa1-i3', description: 'Aplica regla de tres simple en situaciones contextualizadas.', maxPoints: 4 },
          { id: 'm8b-oa1-i4', description: 'Calcula porcentajes de descuento, recargo y ganancia.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Demostrar comprension de ecuaciones de segundo grado.',
        indicators: [
          { id: 'm8b-oa2-i1', description: 'Identifica los coeficientes de una ecuacion cuadratica.', maxPoints: 4 },
          { id: 'm8b-oa2-i2', description: 'Resuelve ecuaciones de segundo grado usando formula general.', maxPoints: 4 },
          { id: 'm8b-oa2-i3', description: 'Interpreta las soluciones en el contexto del problema.', maxPoints: 4 },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════
  // CIENCIAS NATURALES
  // ═══════════════════════════════════════════════════════
  {
    subject: 'Ciencias Naturales',
    course: '1° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Observar y describir caracteristicas de seres vivos y materiales.',
        indicators: [
          { id: 'c1b-oa1-i1', description: 'Observa y describe caracteristicas de plantas y animales.', maxPoints: 4 },
          { id: 'c1b-oa1-i2', description: 'Clasifica seres vivos y materiales segun sus caracteristicas.', maxPoints: 4 },
          { id: 'c1b-oa1-i3', description: 'Comunica sus observaciones de forma oral o escrita.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Ciencias Naturales',
    course: '5° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Explicar el ciclo del agua y su importancia para los seres vivos.',
        indicators: [
          { id: 'c5b-oa1-i1', description: 'Describe las etapas del ciclo del agua.', maxPoints: 4 },
          { id: 'c5b-oa1-i2', description: 'Explica como el ciclo del agua afecta el clima.', maxPoints: 4 },
          { id: 'c5b-oa1-i3', description: 'Propone acciones para cuidar el agua.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Demostrar comprension de la clasificacion de los seres vivos.',
        indicators: [
          { id: 'c5b-oa2-i1', description: 'Clasifica seres vivos en reinos y grandes grupos.', maxPoints: 4 },
          { id: 'c5b-oa2-i2', description: 'Identifica caracteristicas que diferencian a los seres vivos.', maxPoints: 4 },
          { id: 'c5b-oa2-i3', description: 'Construye arboles de clasificacion sencillos.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Ciencias Naturales',
    course: '8° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Explicar el papel central de la celula como unidad basica de los seres vivos.',
        indicators: [
          { id: 'c8b-oa1-i1', description: 'Identifica las partes fundamentales de la celula.', maxPoints: 4 },
          { id: 'c8b-oa1-i2', description: 'Diferencia entre celula animal y vegetal.', maxPoints: 4 },
          { id: 'c8b-oa1-i3', description: 'Explica las funciones de las organelas celulares.', maxPoints: 4 },
          { id: 'c8b-oa1-i4', description: 'Representa la estructura celular mediante dibujos.', maxPoints: 4 },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════
  // HISTORIA, GEOGRAFIA Y CS. SOCIALES
  // ═══════════════════════════════════════════════════════
  {
    subject: 'Historia, Geografia y Cs. Sociales',
    course: '1° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Reconocer su identidad个人 dentro de la familia y la escuela.',
        indicators: [
          { id: 'h1b-oa1-i1', description: 'Describe su identidad personal y familiar.', maxPoints: 4 },
          { id: 'h1b-oa1-i2', description: 'Identifica los roles dentro de la familia.', maxPoints: 4 },
          { id: 'h1b-oa1-i3', description: 'Reconoce la importancia de las normas de convivencia.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Historia, Geografia y Cs. Sociales',
    course: '5° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Ubicar acontecimientos en secuencias temporales.',
        indicators: [
          { id: 'h5b-oa1-i1', description: 'Identifica periodos historicos en la historia de Chile.', maxPoints: 4 },
          { id: 'h5b-oa1-i2', description: 'Reconoce cambios y continuidades en el tiempo.', maxPoints: 4 },
          { id: 'h5b-oa1-i3', description: 'Utiliza lineas de tiempo para organizar informacion.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Leer fuentes, imagenes o mapas simples para obtener informacion.',
        indicators: [
          { id: 'h5b-oa2-i1', description: 'Identifica elementos basicos de un mapa.', maxPoints: 4 },
          { id: 'h5b-oa2-i2', description: 'Obtiene informacion de imagenes historicas.', maxPoints: 4 },
          { id: 'h5b-oa2-i3', description: 'Responde preguntas usando fuentes simples.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Historia, Geografia y Cs. Sociales',
    course: '8° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Analizar el proceso de formacion del Estado Nacional chileno.',
        indicators: [
          { id: 'h8b-oa1-i1', description: 'Identifica los hitos fundamentales de la independencia.', maxPoints: 4 },
          { id: 'h8b-oa1-i2', description: 'Explica las causas y consecuencias de la Guerra del Pacifico.', maxPoints: 4 },
          { id: 'h8b-oa1-i3', description: 'Analiza el rol de los actores sociales en el proceso.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Analizar el quiebre de la democracia en Chile en la decada de 1970.',
        indicators: [
          { id: 'h8b-oa2-i1', description: 'Identifica las causas del golpe de Estado de 1973.', maxPoints: 4 },
          { id: 'h8b-oa2-i2', description: 'Describe las caracteristicas de la dictadura militar.', maxPoints: 4 },
          { id: 'h8b-oa2-i3', description: 'Evalua distintas interpretaciones historiograficas.', maxPoints: 4 },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════
  // INGLES
  // ═══════════════════════════════════════════════════════
  {
    subject: 'Ingles',
    course: '1° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Comprension de mensajes orales sencillos.',
        indicators: [
          { id: 'i1b-oa1-i1', description: 'Identifica palabras y frases en audio simple.', maxPoints: 4 },
          { id: 'i1b-oa1-i2', description: 'Responde a instrucciones orales basicas.', maxPoints: 4 },
          { id: 'i1b-oa1-i3', description: 'Reconoce saludos y presentaciones.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Ingles',
    course: '5° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Comprension lectora de textos simples.',
        indicators: [
          { id: 'i5b-oa1-i1', description: 'Lee y comprende textos simples con vocabulario conocido.', maxPoints: 4 },
          { id: 'i5b-oa1-i2', description: 'Identifica la idea principal de un texto corto.', maxPoints: 4 },
          { id: 'i5b-oa1-i3', description: 'Infiere significados de palabras desconocidas por contexto.', maxPoints: 4 },
        ],
      },
      {
        oaCode: 'OA 2',
        description: 'Expresion oral en situaciones comunicativas simples.',
        indicators: [
          { id: 'i5b-oa2-i1', description: 'Se presenta y presenta a otros en ingles.', maxPoints: 4 },
          { id: 'i5b-oa2-i2', description: 'Describe personas, lugares y objetos usando adjetivos.', maxPoints: 4 },
          { id: 'i5b-oa2-i3', description: 'Participa en dialogos simples.', maxPoints: 4 },
        ],
      },
    ],
  },
  {
    subject: 'Ingles',
    course: '8° Basico',
    oas: [
      {
        oaCode: 'OA 1',
        description: 'Comprension de textos autenticos variados.',
        indicators: [
          { id: 'i8b-oa1-i1', description: 'Lee y comprende textos de generos variados.', maxPoints: 4 },
          { id: 'i8b-oa1-i2', description: 'Identifica estructuras gramaticales en contextos reales.', maxPoints: 4 },
          { id: 'i8b-oa1-i3', description: 'Desarrolla estrategias de lectura eficientes.', maxPoints: 4 },
          { id: 'i8b-oa1-i4', description: 'Resume la informacion principal de un texto.', maxPoints: 4 },
        ],
      },
    ],
  },
];

export function getOAsForSubjectCourse(subject: string, course: string): OAEntry[] {
  const data = OAS_POR_ASIGNATURA.find(d => d.subject === subject && d.course === course);
  return data?.oas ?? [];
}

export function getIndicatorsForSubjectCourse(subject: string, course: string): { id: string; oaCode: string; description: string; maxPoints: number }[] {
  const oas = getOAsForSubjectCourse(subject, course);
  const indicators: { id: string; oaCode: string; description: string; maxPoints: number }[] = [];
  oas.forEach(oa => {
    oa.indicators.forEach(ind => {
      indicators.push({
        id: ind.id,
        oaCode: oa.oaCode,
        description: ind.description,
        maxPoints: ind.maxPoints,
      });
    });
  });
  return indicators;
}

export function getMaxScore(subject: string, course: string): number {
  const indicators = getIndicatorsForSubjectCourse(subject, course);
  return indicators.reduce((sum, ind) => sum + ind.maxPoints, 0);
}
