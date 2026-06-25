export interface CurriculumItem {
  nivel: string;
  asignatura: string;
  oa_id: string;
  oa_texto: string;
  indicadores: string[];
  habilidades: string[];
}

export type CurriculumDB = Record<string, Record<string, CurriculumItem[]>>;

function ci(data: Omit<CurriculumItem, 'nivel' | 'asignatura'> & { nivel: string; asig: string }): CurriculumItem {
  return {
    nivel: data.nivel,
    asignatura: data.asig,
    oa_id: data.oa_id,
    oa_texto: data.oa_texto,
    indicadores: data.indicadores,
    habilidades: data.habilidades,
  };
}

const raw: CurriculumItem[] = [
  // ── PARVULARIA: Lenguaje Verbal ──
  ci({ nivel: 'Prekinder', asig: 'Lenguaje Verbal', oa_id: 'OA 1', oa_texto: 'Expresarse oralmente con claridad usando vocabulario variado en situaciones cotidianas.',
    indicadores: ['Responde preguntas simples sobre experiencias personales', 'Usa palabras nuevas en conversaciones guiadas', 'Describe imágenes con frases de 3-4 palabras'],
    habilidades: ['Comunicación oral', 'Vocabulario', 'Descripción'] }),
  ci({ nivel: 'Prekinder', asig: 'Lenguaje Verbal', oa_id: 'OA 4', oa_texto: 'Disfrutar de la literatura infantil escuchando cuentos, poemas y fábulas.',
    indicadores: ['Escucha atentamente durante la lectura', 'Identifica personajes principales de un cuento', 'Expresa preferencias sobre textos escuchados'],
    habilidades: ['Escucha activa', 'Comprensión narrativa', 'Expresión de preferencias'] }),
  ci({ nivel: 'Kinder', asig: 'Lenguaje Verbal', oa_id: 'OA 3', oa_texto: 'Descubrir sonidos iniciales y finales de palabras mediante juegos de conciencia fonológica.',
    indicadores: ['Identifica sonido inicial de palabras familiares', 'Reconoce rimas simples', 'Segmenta palabras en sílabas'],
    habilidades: ['Conciencia fonológica', 'Rima', 'Segmentación silábica'] }),
  ci({ nivel: 'Kinder', asig: 'Lenguaje Verbal', oa_id: 'OA 6', oa_texto: 'Iniciar la escritura de palabras significativas mediante copia o escritura espontánea.',
    indicadores: ['Escribe su nombre sin modelo', 'Copia palabras cortas', 'Escribe palabras usando letras que conoce'],
    habilidades: ['Escritura emergente', 'Motricidad fina', 'Asociación fonema-grafema'] }),

  // ── PARVULARIA: Pensamiento Matemático ──
  ci({ nivel: 'Prekinder', asig: 'Pensamiento Matemático', oa_id: 'OA 1', oa_texto: 'Establecer relaciones de correspondencia, clasificación y seriación con material concreto.',
    indicadores: ['Agrupa objetos por un atributo (color, forma)', 'Ordena 3 elementos por tamaño', 'Establece correspondencia uno a uno'],
    habilidades: ['Clasificación', 'Seriación', 'Correspondencia'] }),
  ci({ nivel: 'Kinder', asig: 'Pensamiento Matemático', oa_id: 'OA 4', oa_texto: 'Reconocer y nombrar números hasta el 20, cuantificar colecciones y resolver problemas simples.',
    indicadores: ['Cuenta hasta 20 en secuencia', 'Asocia número a cantidad hasta 10', 'Resuelve problemas de agregar y quitar con material concreto'],
    habilidades: ['Conteo', 'Cuantificación', 'Resolución de problemas'] }),

  // ── PARVULARIA: Exploración del Entorno ──
  ci({ nivel: 'Prekinder', asig: 'Exploración del Entorno Natural', oa_id: 'OA 1', oa_texto: 'Explorar y describir elementos y seres vivos del entorno natural manifestando curiosidad.',
    indicadores: ['Nombra seres vivos de su entorno', 'Describe características de animales y plantas', 'Manifiesta curiosidad haciendo preguntas'],
    habilidades: ['Observación', 'Descripción', 'Curiosidad científica'] }),
  ci({ nivel: 'Kinder', asig: 'Exploración del Entorno Natural', oa_id: 'OA 3', oa_texto: 'Reconocer cambios en la naturaleza como estaciones y crecimiento de plantas.',
    indicadores: ['Identifica las cuatro estaciones del año', 'Describe cambios observables en plantas', 'Relaciona eventos cotidianos con estaciones'],
    habilidades: ['Observación de cambios', 'Relación temporal', 'Causa-efecto'] }),

  // ── 1° BÁSICO: Lenguaje y Comunicación ──
  ci({ nivel: '1° Básico', asig: 'Lenguaje y Comunicación', oa_id: 'OA 2', oa_texto: 'Leer palabras aisladas y combinaciones consonánticas directas.',
    indicadores: ['Lee palabras con todas las letras del alfabeto', 'Lee combinaciones (bra, cre, dri, flo, gru)', 'Lee oraciones breves con fluidez inicial'],
    habilidades: ['Decodificación', 'Fluidez lectora', 'Conciencia fonológica'] }),
  ci({ nivel: '1° Básico', asig: 'Lenguaje y Comunicación', oa_id: 'OA 5', oa_texto: 'Escribir oraciones simples utilizando combinaciones consonánticas trabajadas.',
    indicadores: ['Escribe oraciones de 3-5 palabras', 'Usa mayúscula al inicio y punto final', 'Respeta la secuencia de sonidos en palabras'],
    habilidades: ['Producción de textos', 'Conciencia fonológica', 'Uso de convenciones'] }),
  ci({ nivel: '1° Básico', asig: 'Lenguaje y Comunicación', oa_id: 'OA 8', oa_texto: 'Comprender textos breves, extrayendo información explícita.',
    indicadores: ['Responde preguntas literales sobre el texto', 'Identifica personajes y acciones principales', 'Ordena secuencias de hasta 3 eventos'],
    habilidades: ['Comprensión lectora', 'Localización de información', 'Secuenciación'] }),

  // ── 1° BÁSICO: Matemática ──
  ci({ nivel: '1° Básico', asig: 'Matemática', oa_id: 'OA 1', oa_texto: 'Contar números del 0 al 100 de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10.',
    indicadores: ['Cuenta hacia adelante desde cualquier número', 'Cuenta de 2 en 2 hasta 20', 'Cuenta de 5 en 5 y 10 en 10 hasta 100'],
    habilidades: ['Conteo', 'Patrones numéricos', 'Secuencia'] }),
  ci({ nivel: '1° Básico', asig: 'Matemática', oa_id: 'OA 6', oa_texto: 'Resolver problemas de adición y sustracción con números hasta 20.',
    indicadores: ['Representa problemas con dibujos o material concreto', 'Resuelve problemas de cambio y combinación', 'Explica el procedimiento usado'],
    habilidades: ['Resolución de problemas', 'Representación', 'Comunicación matemática'] }),
  ci({ nivel: '1° Básico', asig: 'Matemática', oa_id: 'OA 11', oa_texto: 'Reconocer figuras 2D y 3D en el entorno.',
    indicadores: ['Nombra círculo, cuadrado, triángulo y rectángulo', 'Identifica cubos, esferas y cilindros', 'Describe atributos de figuras'],
    habilidades: ['Identificación de formas', 'Geometría', 'Vocabulario geométrico'] }),

  // ── 1° BÁSICO: Ciencias Naturales ──
  ci({ nivel: '1° Básico', asig: 'Ciencias Naturales', oa_id: 'OA 1', oa_texto: 'Reconocer y describir las características de los seres vivos (animales y plantas).',
    indicadores: ['Clasifica animales según hábitat', 'Describe partes de una planta', 'Compara seres vivos e inertes'],
    habilidades: ['Observación', 'Clasificación', 'Comparación'] }),

  // ── 1° BÁSICO: Historia ──
  ci({ nivel: '1° Básico', asig: 'Historia, Geografía y Cs. Sociales', oa_id: 'OA 2', oa_texto: 'Secuenciar cronológicamente eventos significativos de su historia personal y familiar.',
    indicadores: ['Ordena fotografías de etapas de su vida', 'Nombra fechas importantes familiares', 'Relata eventos en orden temporal'],
    habilidades: ['Orientación temporal', 'Secuenciación', 'Narrativa histórica'] }),

  // ── 2° BÁSICO: Lenguaje ──
  ci({ nivel: '2° Básico', asig: 'Lenguaje y Comunicación', oa_id: 'OA 3', oa_texto: 'Leer textos breves con fluidez, comprendiendo información explícita e implícita.',
    indicadores: ['Lee 40 palabras por minuto', 'Responde preguntas inferenciales', 'Identifica propósito del texto'],
    habilidades: ['Fluidez lectora', 'Comprensión inferencial', 'Propósito del autor'] }),
  ci({ nivel: '2° Básico', asig: 'Lenguaje y Comunicación', oa_id: 'OA 12', oa_texto: 'Producir textos narrativos breves con estructura clara de inicio, desarrollo y final.',
    indicadores: ['Escribe un cuento breve', 'Respeta la estructura narrativa', 'Usa conectores de secuencia (primero, luego, al final)'],
    habilidades: ['Producción narrativa', 'Estructura textual', 'Cohesión'] }),

  // ── 2° BÁSICO: Matemática ──
  ci({ nivel: '2° Básico', asig: 'Matemática', oa_id: 'OA 3', oa_texto: 'Comparar y ordenar números del 0 al 100 según valor posicional.',
    indicadores: ['Identifica decenas y unidades', 'Compara usando >, <, =', 'Ordena números en forma ascendente y descendente'],
    habilidades: ['Valor posicional', 'Comparación numérica', 'Orden'] }),
  ci({ nivel: '2° Básico', asig: 'Matemática', oa_id: 'OA 9', oa_texto: 'Demostrar que comprenden la multiplicación como suma repetida.',
    indicadores: ['Representa multiplicaciones como sumas repetidas', 'Resuelve problemas de multiplicación simple', 'Usa material concreto para agrupar'],
    habilidades: ['Multiplicación', 'Representación', 'Resolución de problemas'] }),

  // ── 3° BÁSICO ──
  ci({ nivel: '3° Básico', asig: 'Lenguaje y Comunicación', oa_id: 'OA 4', oa_texto: 'Leer y comprender textos narrativos y no narrativos de mediana extensión.',
    indicadores: ['Identifica idea principal y secundarias', 'Distingue tipos de texto (cuento, noticia, poema)', 'Hace conexiones con experiencias personales'],
    habilidades: ['Comprensión lectora', 'Identificación de ideas', 'Conexiones personales'] }),
  ci({ nivel: '3° Básico', asig: 'Matemática', oa_id: 'OA 5', oa_texto: 'Resolver problemas de adición, sustracción, multiplicación y división con números hasta 1.000.',
    indicadores: ['Resuelve problemas de dos operaciones', 'Selecciona la operación adecuada', 'Verifica resultados usando estrategias'],
    habilidades: ['Resolución de problemas', 'Cálculo', 'Verificación'] }),
  ci({ nivel: '3° Básico', asig: 'Ciencias Naturales', oa_id: 'OA 5', oa_texto: 'Describir los estados de la materia y sus cambios.',
    indicadores: ['Identifica sólido, líquido y gaseoso', 'Describe cambios como fusión y evaporación', 'Clasifica materiales según su estado'],
    habilidades: ['Observación', 'Clasificación', 'Descripción'] }),

  // ── 4° BÁSICO ──
  ci({ nivel: '4° Básico', asig: 'Lenguaje y Comunicación', oa_id: 'OA 6', oa_texto: 'Leer y comprender textos literarios y no literarios, extrayendo conclusiones fundamentadas.',
    indicadores: ['Formula conclusiones basadas en evidencia textual', 'Compara textos del mismo género', 'Argumenta su interpretación'],
    habilidades: ['Inferencia', 'Argumentación', 'Análisis comparativo'] }),
  ci({ nivel: '4° Básico', asig: 'Matemática', oa_id: 'OA 10', oa_texto: 'Identificar y representar fracciones en contextos cotidianos.',
    indicadores: ['Representa fracciones con material concreto', 'Identifica fracciones en figuras', 'Compara fracciones con igual denominador'],
    habilidades: ['Fracciones', 'Representación', 'Comparación'] }),
  ci({ nivel: '4° Básico', asig: 'Historia, Geografía y Cs. Sociales', oa_id: 'OA 1', oa_texto: 'Describir los pueblos originarios de Chile, reconociendo su diversidad cultural.',
    indicadores: ['Nombra pueblos originarios de cada zona', 'Describe aspectos de su vida cotidiana', 'Valora la diversidad cultural'],
    habilidades: ['Conocimiento histórico', 'Valoración cultural', 'Descripción'] }),

  // ── 5° BÁSICO ──
  ci({ nivel: '5° Básico', asig: 'Lenguaje y Comunicación', oa_id: 'OA 3', oa_texto: 'Analizar textos literarios considerando elementos narrativos y recursos literarios.',
    indicadores: ['Identifica narrador, personajes y ambiente', 'Reconoce figuras literarias simples', 'Interpreta el mensaje del texto'],
    habilidades: ['Análisis literario', 'Identificación de elementos', 'Interpretación'] }),
  ci({ nivel: '5° Básico', asig: 'Matemática', oa_id: 'OA 1', oa_texto: 'Representar y comparar números decimales en contextos cotidianos.',
    indicadores: ['Lee y escribe números decimales', 'Ubica decimales en recta numérica', 'Compara y ordena decimales'],
    habilidades: ['Números decimales', 'Representación', 'Comparación'] }),
  ci({ nivel: '5° Básico', asig: 'Ciencias Naturales', oa_id: 'OA 4', oa_texto: 'Investigar y explicar el sistema reproductivo humano y los cambios de la pubertad.',
    indicadores: ['Describe cambios físicos en pubertad', 'Identifica órganos del sistema reproductor', 'Explica el ciclo de reproducción'],
    habilidades: ['Investigación', 'Explicación', 'Conocimiento corporal'] }),

  // ── 6° BÁSICO ──
  ci({ nivel: '6° Básico', asig: 'Lenguaje y Comunicación', oa_id: 'OA 8', oa_texto: 'Escribir textos expositivos con estructura clara y desarrollo de ideas.',
    indicadores: ['Planifica la escritura con organizador gráfico', 'Desarrolla párrafos con idea principal y secundaria', 'Usa conectores de causa y consecuencia'],
    habilidades: ['Producción expositiva', 'Planificación', 'Coherencia y cohesión'] }),
  ci({ nivel: '6° Básico', asig: 'Matemática', oa_id: 'OA 4', oa_texto: 'Resolver problemas que involucran porcentajes en contextos variados.',
    indicadores: ['Calcula porcentajes simples', 'Resuelve problemas de descuento e interés', 'Representa porcentajes en gráficos'],
    habilidades: ['Porcentajes', 'Resolución de problemas', 'Representación gráfica'] }),
  ci({ nivel: '6° Básico', asig: 'Historia, Geografía y Cs. Sociales', oa_id: 'OA 2', oa_texto: 'Analizar la independencia de Chile considerando causas, desarrollo y consecuencias.',
    indicadores: ['Identifica causas internas y externas', 'Secuencia hitos del proceso independentista', 'Evalúa consecuencias políticas y sociales'],
    habilidades: ['Análisis histórico', 'Secuenciación', 'Evaluación crítica'] }),

  // ── 1° MEDIO ──
  ci({ nivel: '1° Medio', asig: 'Lenguaje y Comunicación', oa_id: 'OA 1', oa_texto: 'Leer y analizar obras literarias del canon, interpretando recursos literarios y temáticas.',
    indicadores: ['Analiza personajes y su evolución', 'Identifica recursos retóricos en poemas', 'Escribe reseñas críticas'],
    habilidades: ['Análisis literario avanzado', 'Identificación de recursos', 'Pensamiento crítico'] }),
  ci({ nivel: '1° Medio', asig: 'Matemática', oa_id: 'OA 3', oa_texto: 'Resolver ecuaciones lineales con coeficientes enteros y fraccionarios.',
    indicadores: ['Despeja la incógnita en ecuaciones simples', 'Resuelve ecuaciones con paréntesis', 'Verifica soluciones sustituyendo'],
    habilidades: ['Ecuaciones', 'Álgebra', 'Verificación'] }),
  ci({ nivel: '1° Medio', asig: 'Ciencias Naturales', oa_id: 'OA 2', oa_texto: 'Explicar los conceptos de átomo, elemento y compuesto, y los tipos de enlaces químicos.',
    indicadores: ['Diferencia entre átomo, elemento y compuesto', 'Identifica enlaces iónicos y covalentes', 'Representa moléculas simples'],
    habilidades: ['Modelización', 'Clasificación', 'Representación'] }),
  ci({ nivel: '1° Medio', asig: 'Historia, Geografía y Cs. Sociales', oa_id: 'OA 3', oa_texto: 'Analizar el proceso de construcción del Estado chileno durante el siglo XIX.',
    indicadores: ['Describe los gobiernos de la época', 'Analiza la Guerra Civil de 1891', 'Evalúa la consolidación del Estado'],
    habilidades: ['Análisis histórico', 'Causa-consecuencia', 'Evaluación crítica'] }),
  ci({ nivel: '1° Medio', asig: 'Inglés', oa_id: 'OA 1', oa_texto: 'Comprender textos orales y escritos breves sobre temas familiares.',
    indicadores: ['Identifica información específica en audios', 'Lee y comprende textos simples', 'Responde preguntas en inglés'],
    habilidades: ['Comprensión auditiva', 'Comprensión lectora', 'Vocabulario básico'] }),

  // ── 2° MEDIO ──
  ci({ nivel: '2° Medio', asig: 'Lenguaje y Comunicación', oa_id: 'OA 4', oa_texto: 'Producir textos argumentativos con tesis, argumentos y conclusión.',
    indicadores: ['Formula una tesis clara', 'Selecciona argumentos pertinentes', 'Redacta una conclusión coherente'],
    habilidades: ['Argumentación', 'Pensamiento crítico', 'Estructura textual'] }),
  ci({ nivel: '2° Medio', asig: 'Matemática', oa_id: 'OA 5', oa_texto: 'Analizar funciones lineales y afines en contextos variados.',
    indicadores: ['Grafica funciones lineales', 'Determina pendiente e intersección', 'Relaciona la función con situaciones reales'],
    habilidades: ['Funciones', 'Graficación', 'Modelación'] }),
  ci({ nivel: '2° Medio', asig: 'Ciencias Naturales', oa_id: 'OA 6', oa_texto: 'Analizar los procesos de fotosíntesis y respiración celular.',
    indicadores: ['Describe el proceso fotosintético', 'Compara fotosíntesis y respiración', 'Explica la importancia de ambos procesos'],
    habilidades: ['Análisis', 'Comparación', 'Explicación'] }),

  // ── 3° MEDIO ──
  ci({ nivel: '3° Medio', asig: 'Lenguaje y Comunicación', oa_id: 'OA 2', oa_texto: 'Analizar críticamente textos periodísticos de opinión, identificando sesgos y posturas.',
    indicadores: ['Distingue hecho de opinión', 'Identifica recursos persuasivos', 'Evalúa la credibilidad de las fuentes'],
    habilidades: ['Pensamiento crítico', 'Análisis de medios', 'Evaluación de fuentes'] }),
  ci({ nivel: '3° Medio', asig: 'Matemática', oa_id: 'OA 1', oa_texto: 'Modelar situaciones utilizando funciones exponenciales y logarítmicas.',
    indicadores: ['Grafica funciones exponenciales', 'Aplica logaritmos en contextos', 'Resuelve ecuaciones exponenciales'],
    habilidades: ['Modelación', 'Graficación', 'Resolución de ecuaciones'] }),
  ci({ nivel: '3° Medio', asig: 'Historia, Geografía y Cs. Sociales', oa_id: 'OA 1', oa_texto: 'Analizar la Guerra Fría y sus efectos en América Latina.',
    indicadores: ['Describe los bloques de poder', 'Analiza impacto en Chile', 'Evalúa consecuencias actuales'],
    habilidades: ['Análisis geopolítico', 'Causa-efecto', 'Evaluación crítica'] }),

  // ── 4° MEDIO ──
  ci({ nivel: '4° Medio', asig: 'Lenguaje y Comunicación', oa_id: 'OA 5', oa_texto: 'Elaborar ensayos literarios o académicos con profundidad analítica.',
    indicadores: ['Desarrolla una tesis compleja', 'Cita fuentes adecuadamente', 'Construye una conclusión sólida'],
    habilidades: ['Ensayo académico', 'Investigación', 'Síntesis'] }),
  ci({ nivel: '4° Medio', asig: 'Matemática', oa_id: 'OA 3', oa_texto: 'Aplicar conceptos de probabilidad y estadística en la toma de decisiones.',
    indicadores: ['Calcula probabilidades condicionales', 'Interpreta gráficos estadísticos', 'Toma decisiones basadas en datos'],
    habilidades: ['Probabilidad', 'Estadística', 'Toma de decisiones'] }),
  ci({ nivel: '4° Medio', asig: 'Ciencias Naturales', oa_id: 'OA 4', oa_texto: 'Analizar problemáticas ambientales aplicando conceptos de sostenibilidad.',
    indicadores: ['Identifica problemas ambientales locales', 'Propone soluciones sostenibles', 'Evalúa impacto de actividades humanas'],
    habilidades: ['Conciencia ambiental', 'Propuesta de soluciones', 'Evaluación crítica'] }),
  ci({ nivel: '4° Medio', asig: 'Historia, Geografía y Cs. Sociales', oa_id: 'OA 5', oa_texto: 'Analizar el Chile actual considerando sus desafíos políticos, sociales y económicos.',
    indicadores: ['Describe el sistema político chileno', 'Analiza desigualdad social', 'Propone mejoras para el desarrollo'],
    habilidades: ['Análisis político', 'Pensamiento crítico', 'Propuesta ciudadana'] }),
];

// Build the nested structure
export const curriculumData: CurriculumDB = {};
for (const item of raw) {
  if (!curriculumData[item.nivel]) curriculumData[item.nivel] = {};
  if (!curriculumData[item.nivel][item.asignatura]) curriculumData[item.nivel][item.asignatura] = [];
  curriculumData[item.nivel][item.asignatura].push(item);
}

export const niveles = Object.keys(curriculumData).sort();

export function getAsignaturas(nivel: string): string[] {
  return curriculumData[nivel] ? Object.keys(curriculumData[nivel]).sort() : [];
}

export function getOAs(nivel: string, asignatura: string): CurriculumItem[] {
  return curriculumData[nivel]?.[asignatura] || [];
}
