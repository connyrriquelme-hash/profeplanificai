/**
 * Plantillas maestras para presentaciones — Fase de estructura pedagógica
 * consistente del roadmap Canva/Chalkie.
 *
 * Cada plantilla fuerza una secuencia FIJA de diapositivas (no una guía
 * libre) para que la IA actúe como diseñadora instruccional en vez de solo
 * generar texto. Se inyecta en buildSystemPrompt (PptContentEngine.ts)
 * reemplazando la sección "PROGRESIÓN PEDAGÓGICA OBLIGATORIA" genérica
 * cuando se selecciona (o se auto-sugiere) una plantilla.
 */

export type SlideLayoutHint =
  | 'title' | 'bullets' | 'image_text' | 'comparison' | 'quote'
  | 'vocabulario' | 'ciclo_proceso' | 'quiz_opcion_multiple' | 'verdadero_falso';

export interface MasterTemplateStep {
  /** Nombre pedagógico del paso (lo que ve el prompt, no el schema). */
  role: string;
  layout: SlideLayoutHint;
  /** Qué debe contener esta diapositiva exactamente. */
  instruction: string;
}

export interface MasterTemplate {
  id: string;
  name: string;
  uso: string;
  /** Keywords de asignatura para auto-sugerencia (minúsculas, sin tildes). */
  asignaturaKeywords: string[];
  steps: MasterTemplateStep[];
}

const T = (role: string, layout: SlideLayoutHint, instruction: string): MasterTemplateStep => ({ role, layout, instruction });

export const MASTER_TEMPLATES: MasterTemplate[] = [
  {
    id: 'exploracion_juego',
    name: 'Exploración y juego',
    uso: 'Observación, cuento, movimiento y conversación — Prekínder a 1° básico',
    asignaturaKeywords: ['parvulo', 'exploracion', 'entorno natural', 'entorno sociocultural'],
    steps: [
      T('Portada', 'title', 'Título atractivo con personaje o escena central del tema.'),
      T('Pregunta oral', 'bullets', '2-3 preguntas simples de observación: "¿Qué ves?", "¿Qué crees que pasará?".'),
      T('Imagen para explorar', 'image_text', 'Una escena grande y concreta relacionada al tema, con una frase muy breve.'),
      T('Juego de elegir', 'quiz_opcion_multiple', 'Pregunta simple de elegir entre 3 opciones con imágenes/palabras concretas.'),
      T('Actividad corporal', 'bullets', 'Instrucción de movimiento o juego corporal conectado al tema (máx. 2 líneas).'),
      T('Respuesta visual', 'image_text', 'Muestra la respuesta correcta del juego con una imagen clara.'),
      T('Ahora tú', 'bullets', 'Invitación a que el estudiante repita o aplique lo aprendido en el patio o la sala.'),
      T('Cierre celebratorio', 'quote', 'Frase corta y alegre de cierre, sin atribución a persona real.'),
    ],
  },
  {
    id: 'lectoescritura_fonologia',
    name: 'Letras, sonidos y sílabas',
    uso: 'Conciencia fonológica y lectoescritura inicial — Kínder a 2° básico',
    // Sin 'lenguaje'/'lectura'/'comunicacion' aca a proposito: esos tres
    // tambien identifican a lectura_escritura (linea de abajo), y esta
    // plantilla ya se selecciona explicitamente para Lenguaje en
    // preescolar/1er basico en suggestMasterTemplate() antes de llegar al
    // match generico por keyword — si estuvieran repetidos aca, esta
    // plantilla (por ir primero en el array) le robaba el match a
    // lectura_escritura en TODOS los grados, no solo los iniciales.
    asignaturaKeywords: ['lectoescritura', 'fonologia', 'silabas'],
    steps: [
      T('Portada', 'title', 'Título "Descubriendo [sonido/letra/sílaba]" con ilustración del sonido o letra.'),
      T('Sensación oral', 'bullets', 'Instrucción para pronunciar el sonido en voz alta, exagerando la articulación.'),
      T('Palabras modelo', 'vocabulario', '2-4 palabras que empiecen o contengan el sonido/sílaba, cada una con imagen.'),
      T('Comparación de sonidos', 'comparison', 'Compara el sonido/letra objetivo con uno que suele confundirse.'),
      T('Juego de alternativa', 'quiz_opcion_multiple', 'Elegir la palabra que SÍ tiene el sonido/sílaba entre 3-4 opciones.'),
      T('Corrección', 'verdadero_falso', 'Afirmación sobre una palabra y el sonido, con explicación breve.'),
      T('Familias silábicas', 'vocabulario', 'Combinaciones de la sílaba con las 5 vocales, con una palabra ejemplo cada una.'),
      T('Ordenar sílabas', 'bullets', 'Actividad: ordenar sílabas dadas para formar una palabra conocida.'),
      T('Aplicación en oración', 'image_text', 'Una oración simple y concreta que use la palabra trabajada.'),
      T('Cierre', 'quote', 'Frase corta de refuerzo positivo sobre el logro del día.'),
    ],
  },
  {
    id: 'lectura_escritura',
    name: 'Lectura y escritura',
    uso: 'Comprensión lectora, vocabulario y producción textual — 1° básico a media',
    // 'literatura' fuera a proposito: tambien es keyword de
    // profundizacion_media (electivo de Literatura en media) y esta
    // plantilla va antes en el array, asi que se lo robaria siempre.
    asignaturaKeywords: ['lenguaje', 'lectura', 'comunicacion'],
    steps: [
      T('Pregunta previa', 'bullets', 'Pregunta que active conocimiento previo relacionado con el texto o tema.'),
      T('Portada/texto breve', 'title', 'Título del texto o tema de lectura con subtítulo de contexto.'),
      T('Vocabulario clave', 'vocabulario', '2-4 palabras del texto que el estudiante debe conocer, con definición simple.'),
      T('Antes de leer', 'bullets', 'Predicciones o propósito de lectura antes de comenzar.'),
      T('Lectura segmentada', 'image_text', 'Fragmento del texto (o resumen) con una imagen que apoye la comprensión.'),
      T('Durante la lectura', 'bullets', 'Preguntas de monitoreo mientras se lee (2-3 preguntas cortas).'),
      T('Pregunta literal', 'quiz_opcion_multiple', 'Pregunta de información explícita del texto, 3-4 opciones.'),
      T('Pregunta inferencial', 'quiz_opcion_multiple', 'Pregunta que requiere inferir (no está escrito literalmente), 3-4 opciones.'),
      T('Organizador visual', 'ciclo_proceso', 'Estructura del texto (inicio-desarrollo-cierre, o causa-efecto) en 3-4 pasos.'),
      T('Producción breve', 'bullets', 'Consigna de escritura breve conectada al texto (oración, opinión, respuesta).'),
      T('Cierre', 'quote', 'Idea clave de la lectura resumida en una frase.'),
    ],
  },
  {
    id: 'matematica_concreta',
    name: 'Matemática concreta',
    uso: 'Número, operaciones, fracciones, geometría con representaciones — Prekínder a 6° básico',
    asignaturaKeywords: ['matematica', 'matemáticas'],
    steps: [
      T('Situación cotidiana', 'image_text', 'Un contexto real y chileno donde aparece el concepto matemático.'),
      T('Representación concreta', 'image_text', 'El concepto mostrado con material concreto (fichas, objetos, dibujos).'),
      T('Representación pictórica', 'image_text', 'El mismo concepto mostrado como dibujo o esquema.'),
      T('Representación simbólica', 'bullets', 'El concepto expresado con números/símbolos matemáticos.'),
      T('Ejemplo paso a paso', 'ciclo_proceso', '3-5 pasos resolviendo un ejemplo completo del concepto.'),
      T('Error frecuente', 'verdadero_falso', 'Una afirmación que representa un error común, con explicación de por qué está mal.'),
      T('Práctica guiada', 'quiz_opcion_multiple', 'Ejercicio de práctica con 3-4 alternativas de respuesta.'),
      T('Solución explicada', 'bullets', 'Explica paso a paso por qué la respuesta correcta es correcta.'),
      T('Desafío final', 'bullets', 'Un problema un poco más difícil para quienes ya dominan el concepto.'),
      T('Ticket de salida', 'quote', 'Pregunta breve de autoevaluación para cerrar la clase.'),
    ],
  },
  {
    id: 'problema_matematico',
    name: 'Problema matemático',
    uso: 'Estrategias, razonamiento, modelación y corrección — 3° básico a media',
    asignaturaKeywords: ['matematica', 'matemáticas'],
    steps: [
      T('Problema contextualizado', 'image_text', 'Un problema matemático real, con contexto chileno concreto.'),
      T('Qué sabemos', 'bullets', 'Datos del problema identificados explícitamente.'),
      T('Qué debemos averiguar', 'bullets', 'La pregunta del problema reformulada con claridad.'),
      T('Elegimos estrategia', 'bullets', '2-3 estrategias posibles para resolver este tipo de problema.'),
      T('Resolvemos paso a paso', 'ciclo_proceso', 'Resolución completa en 3-5 pasos numerados.'),
      T('Comprobamos', 'bullets', 'Cómo verificar que la respuesta tiene sentido.'),
      T('Comparamos procedimientos', 'comparison', 'Dos formas válidas distintas de resolver el mismo problema.'),
      T('Error frecuente', 'verdadero_falso', 'Un error típico al resolver este tipo de problema, con explicación.'),
      T('Problema similar', 'quiz_opcion_multiple', 'Un problema parecido para que el estudiante aplique la estrategia, con alternativas.'),
      T('Autoevaluación', 'quote', 'Pregunta reflexiva sobre qué estrategia le resultó más útil.'),
    ],
  },
  {
    id: 'ciencias_indagacion',
    name: 'Ciencias por indagación',
    uso: 'Seres vivos, materia, energía, cuerpo humano, tierra y universo — 1° básico a media',
    asignaturaKeywords: ['ciencias', 'biologia', 'quimica', 'fisica', 'naturaleza'],
    steps: [
      T('Fenómeno sorprendente', 'image_text', 'Un fenómeno científico llamativo y real relacionado al tema.'),
      T('Pregunta investigable', 'bullets', 'Una pregunta que se puede investigar u observar (no de opinión).'),
      T('Hipótesis', 'bullets', 'Ejemplo de hipótesis razonable que un estudiante podría proponer.'),
      T('Materiales/procedimiento', 'bullets', 'Qué se necesita y los pasos para observar o experimentar, seguros y realizables en clase.'),
      T('Observación o evidencia', 'image_text', 'Qué se espera observar, con una imagen representativa real (no inventada).'),
      T('Registro de resultados', 'bullets', 'Cómo anotar u organizar lo observado (tabla simple, dibujo, lista).'),
      T('Explicación científica', 'image_text', 'La explicación del fenómeno, factualmente precisa y en lenguaje adaptado al curso.'),
      T('Conclusión', 'bullets', 'Síntesis de lo aprendido conectada directamente a la pregunta inicial.'),
      T('Aplicación cotidiana', 'image_text', 'Dónde se ve este fenómeno o concepto en la vida diaria en Chile.'),
      T('Pregunta de salida', 'quiz_opcion_multiple', 'Pregunta de cierre para verificar comprensión, con alternativas.'),
    ],
  },
  {
    id: 'historia_ciudadania',
    name: 'Historia y ciudadanía',
    uso: 'Historia de Chile, pueblos originarios, territorio, democracia, fuentes y ciudadanía — 3° básico a media',
    asignaturaKeywords: ['historia', 'geografia', 'ciudadania', 'sociales'],
    steps: [
      T('Pregunta provocadora', 'bullets', 'Una pregunta que conecte el tema con la actualidad o la experiencia del estudiante.'),
      T('Imagen, mapa o fuente', 'image_text', 'Una fuente histórica, mapa o imagen real relevante al tema.'),
      T('Contexto temporal/espacial', 'bullets', 'Cuándo y dónde ocurre lo que se está estudiando.'),
      T('Concepto clave', 'image_text', 'El concepto histórico/cívico central, explicado con claridad factual.'),
      T('Línea de tiempo o mapa', 'ciclo_proceso', '3-5 hitos o zonas clave ordenados cronológica o espacialmente.'),
      T('Comparación de perspectivas', 'comparison', 'Dos visiones o actores distintos frente al mismo hecho o tema.'),
      T('Pregunta para conversar', 'bullets', 'Pregunta abierta para discusión en clase, sin respuesta única correcta.'),
      T('Actividad con fuente', 'bullets', 'Instrucción para analizar una fuente (documento, imagen, testimonio).'),
      T('Conclusión ciudadana', 'bullets', 'Qué implica este contenido para la vida en comunidad/democracia hoy.'),
      T('Cierre', 'quote', 'Idea clave resumida en una frase, sin atribución inventada.'),
    ],
  },
  {
    id: 'ingles_comunicativo',
    name: 'Inglés comunicativo',
    uso: 'Vocabulario, escucha, diálogo y producción oral — Prekínder a media',
    asignaturaKeywords: ['ingles', 'idioma extranjero', 'lengua extranjera'],
    steps: [
      T('Hello / objetivo', 'title', 'Saludo y objetivo de la clase en inglés simple, con traducción si el curso es bajo.'),
      T('Vocabulario', 'vocabulario', '3-4 palabras clave con imagen y traducción.'),
      T('Pronunciación', 'bullets', 'Guía breve de pronunciación de las palabras clave (fonética simplificada).'),
      T('Escucha y repite', 'bullets', 'Instrucción de práctica oral: escuchar y repetir en voz alta.'),
      T('Juego de asociación', 'quiz_opcion_multiple', 'Asociar palabra en inglés con su imagen o traducción correcta.'),
      T('Mini diálogo', 'image_text', 'Un diálogo corto y realista usando el vocabulario de la clase.'),
      T('Producción oral', 'bullets', 'Consigna para que el estudiante produzca una frase corta propia.'),
      T('Autoevaluación "I can..."', 'bullets', '2-3 afirmaciones "I can..." para que el estudiante marque su logro.'),
      T('Goodbye / desafío', 'quote', 'Despedida breve con un pequeño desafío para practicar en casa.'),
    ],
  },
  {
    id: 'arte_musica_tecnologia',
    name: 'Arte, música y tecnología',
    uso: 'Creación visual, musical, diseño, programación y proyectos maker — Prekínder a media',
    asignaturaKeywords: ['arte', 'artes visuales', 'musica', 'tecnologia', 'diseno'],
    steps: [
      T('Referente inspirador', 'image_text', 'Una obra, ejemplo o referente real relacionado a lo que se creará.'),
      T('Qué crearemos', 'bullets', 'Descripción clara y motivadora del producto final de la clase.'),
      T('Materiales', 'bullets', 'Lista de materiales necesarios, priorizando reciclados o de bajo costo.'),
      T('Técnica o herramienta', 'image_text', 'Explicación breve de la técnica o herramienta a usar.'),
      T('Paso 1', 'image_text', 'Primer paso del proceso creativo, con imagen si es posible.'),
      T('Paso 2', 'image_text', 'Segundo paso del proceso creativo.'),
      T('Paso 3', 'image_text', 'Tercer paso del proceso creativo (o pasos finales si son pocos).'),
      T('Criterios de logro', 'bullets', '2-4 criterios simples para saber si el resultado está bien logrado.'),
      T('Galería/reflexión', 'bullets', 'Pregunta de reflexión sobre el proceso creativo o para compartir el resultado.'),
      T('Cierre', 'quote', 'Frase breve que valore la creatividad y el esfuerzo.'),
    ],
  },
  {
    id: 'movimiento_salud_bienestar',
    name: 'Movimiento, salud y bienestar',
    uso: 'Educación física, vida saludable, emociones, convivencia y autocuidado — Prekínder a media',
    asignaturaKeywords: ['educacion fisica', 'salud', 'bienestar', 'convivencia', 'orientacion'],
    steps: [
      T('Activación', 'bullets', 'Instrucción de movimiento corto para activar el cuerpo al inicio.'),
      T('Propósito', 'bullets', 'Qué se va a trabajar hoy: habilidad física, hábito saludable o emoción.'),
      T('Demostración visual', 'image_text', 'Imagen o descripción clara de cómo se hace la actividad/postura correctamente.'),
      T('Reglas de seguridad', 'bullets', 'Reglas breves y concretas de seguridad para la actividad.'),
      T('Estación 1', 'image_text', 'Primera estación o parte de la actividad, con instrucción clara.'),
      T('Estación 2', 'image_text', 'Segunda estación o parte de la actividad.'),
      T('Pausa/reflexión', 'bullets', 'Momento breve de pausa: respiración, hidratación o chequeo emocional.'),
      T('Desafío personal', 'bullets', 'Una meta personal simple y alcanzable para el estudiante.'),
      T('Autoevaluación visual', 'quiz_opcion_multiple', 'Pregunta simple de autoevaluación (ej. cómo se sintió), con alternativas.'),
      T('Cierre regulador', 'quote', 'Frase de cierre calmada que invite a la regulación emocional.'),
    ],
  },
  {
    id: 'profundizacion_media',
    name: 'Profundización para media',
    uso: 'Conceptos abstractos: análisis disciplinar, evidencia — 7° básico a media',
    asignaturaKeywords: ['filosofia', 'quimica', 'fisica', 'biologia', 'literatura', 'electivo'],
    steps: [
      T('Pregunta desafiante', 'bullets', 'Una pregunta compleja y genuina sobre el tema, sin respuesta obvia.'),
      T('Caso, fenómeno o problema', 'image_text', 'Un caso real y específico que ilustre el problema disciplinar.'),
      T('Concepto disciplinar', 'bullets', 'El concepto central, definido con precisión técnica adecuada al nivel.'),
      T('Modelo/diagrama', 'ciclo_proceso', 'Un modelo o proceso disciplinar explicado en 3-5 pasos o componentes.'),
      T('Evidencia o fuente', 'image_text', 'Datos, fuente primaria o evidencia real que sustente el concepto.'),
      T('Análisis guiado', 'bullets', 'Preguntas guía para analizar la evidencia o el caso presentado.'),
      T('Aplicación', 'image_text', 'Aplicación del concepto a un problema o situación distinta.'),
      T('Debate o contraste', 'comparison', 'Dos posturas, teorías o interpretaciones distintas y legítimas sobre el tema.'),
      T('Síntesis', 'bullets', 'Resumen técnico-conceptual de lo cubierto.'),
      T('Pregunta tipo PAES', 'quiz_opcion_multiple', 'Pregunta de selección múltiple de exigencia similar a una prueba estandarizada, con explicación.'),
    ],
  },
  {
    id: 'repaso_evaluacion_formativa',
    name: 'Repaso y evaluación formativa',
    uso: 'Diagnóstico, práctica, corrección y metacognición — cualquier asignatura y nivel',
    asignaturaKeywords: ['repaso', 'evaluacion', 'sintesis'],
    steps: [
      T('Activación de saberes previos', 'bullets', 'Pregunta o actividad breve para recordar lo trabajado.'),
      T('Meta de aprendizaje', 'bullets', 'El OA o meta de esta clase, reformulada en lenguaje simple.'),
      T('Pregunta 1', 'quiz_opcion_multiple', 'Primera pregunta de repaso, con alternativas y explicación.'),
      T('Corrección comentada 1', 'bullets', 'Por qué la respuesta correcta de la pregunta 1 es correcta.'),
      T('Pregunta 2', 'quiz_opcion_multiple', 'Segunda pregunta de repaso, con alternativas y explicación.'),
      T('Corrección comentada 2', 'bullets', 'Por qué la respuesta correcta de la pregunta 2 es correcta.'),
      T('Error frecuente', 'verdadero_falso', 'Un error común del contenido repasado, con explicación.'),
      T('Desafío de aplicación', 'image_text', 'Un desafío breve que integre lo repasado.'),
      T('Semáforo / autoevaluación', 'bullets', '3 niveles simples de autoevaluación (logrado / en camino / por reforzar).'),
      T('Ticket de salida', 'quote', 'Pregunta breve final para que el estudiante responda antes de terminar.'),
    ],
  },
];

export function getMasterTemplate(id: string | undefined): MasterTemplate | undefined {
  if (!id) return undefined;
  return MASTER_TEMPLATES.find(t => t.id === id);
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Auto-sugiere una plantilla cuando el docente no elige una explícitamente. */
export function suggestMasterTemplate(asignatura: string, curso: string): MasterTemplate {
  const asig = normalize(asignatura || '');
  const cursoNorm = normalize(curso || '');
  // Solo prekinder/kinder/transicion — 1er ciclo del "tramo inicial" del
  // usuario, pero SIN incluir 1° básico acá: si lo incluyeramos, cualquier
  // asignatura con match propio (Ed. Física, Matemática, Artes...) en 1°
  // básico quedaria mal enrutada a "exploracion_juego" por revisarse antes
  // que el match de asignatura (bug encontrado al probar "Ed. Física, 1°
  // Básico" -> daba exploracion_juego en vez de movimiento_salud_bienestar).
  const esPreescolar = /prekinder|pre-kinder|kinder|sala cuna|nivel medio|nivel transici|parvularia/.test(cursoNorm);
  const es1roBasico = /^1.?\s*basico/.test(cursoNorm);

  if ((esPreescolar || es1roBasico) && (asig.includes('lenguaje') || asig.includes('lectura'))) {
    return getMasterTemplate('lectoescritura_fonologia')!;
  }

  // Chequeo explicito ANTES del match generico por keyword: "educacion
  // fisica" contiene la substring "fisica", que tambien es keyword de
  // ciencias_indagacion/profundizacion_media (la asignatura "Física" de
  // media) — sin este caso especial, Ed. Física siempre matcheaba mal.
  if (asig.includes('educacion fisica') || asig.includes('ed fisica')) {
    return getMasterTemplate('movimiento_salud_bienestar')!;
  }

  // Match por asignatura ANTES que el fallback generico de preescolar, para
  // que Ed. Física/Matemática/Artes/etc. en niveles bajos usen su propia
  // plantilla en vez de caer siempre en "exploracion_juego".
  const match = MASTER_TEMPLATES.find(t => t.asignaturaKeywords.some(k => asig.includes(k)));
  if (match) {
    // Matemática: distinguir "resolución de problemas" del resto solo cuando
    // el curso ya tiene edad para razonamiento multi-paso explícito.
    if (match.id === 'matematica_concreta') {
      const grado = Number(cursoNorm.match(/(\d+)/)?.[1] ?? NaN);
      const esMedia = cursoNorm.includes('medio');
      if (esMedia || (!Number.isNaN(grado) && grado >= 3)) {
        return getMasterTemplate('problema_matematico') || match;
      }
    }
    if (match.id === 'ciencias_indagacion' && cursoNorm.includes('medio')) {
      return getMasterTemplate('profundizacion_media') || match;
    }
    return match;
  }

  if (esPreescolar || es1roBasico) return getMasterTemplate('exploracion_juego')!;

  return getMasterTemplate('repaso_evaluacion_formativa')!;
}

/** Renderiza la secuencia fija de una plantilla como texto de prompt. */
export function renderTemplateStructure(template: MasterTemplate): string {
  const lines = template.steps.map((step, i) =>
    `${i + 1}. [${step.layout}] ${step.role}: ${step.instruction}`
  );
  // Recordatorio puntual solo cuando la plantilla de verdad usa alguno de
  // estos dos layouts -- confirmado contra el servidor real que el modelo
  // escribe "title" (el nombre que usan casi todos los demas layouts) en
  // vez de "titulo" para estos dos, fallando la validacion del schema.
  const layoutsEnStepos = new Set(template.steps.map((s) => s.layout));
  const recordatorioTitulo = (layoutsEnStepos.has('vocabulario') || layoutsEnStepos.has('ciclo_proceso'))
    ? '\n\nEsta plantilla incluye un slide de tipo "vocabulario" y/o "ciclo_proceso" — recuerda que esos dos usan el campo "titulo" (español), no "title".'
    : '';
  return `PLANTILLA MAESTRA SELECCIONADA: "${template.name}" (${template.uso})

Debes generar EXACTAMENTE ${template.steps.length} diapositivas, en este orden exacto, cada una con el layout de schema indicado entre corchetes y cumpliendo el contenido descrito:

${lines.join('\n')}

No agregues diapositivas fuera de esta secuencia, no cambies el orden, y no omitas ninguna. El layout indicado entre corchetes es el que debes usar en el campo "layout" del JSON para esa diapositiva.${recordatorioTitulo}`;
}
