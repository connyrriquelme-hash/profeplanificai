/**
 * ExpertKnowledge — Base de conocimiento experto compartida
 *
 * Fragmento de prompt que se inyecta en TODOS los motores de IA.
 * Contiene los fundamentos teoricos que todo producto pedagogico debe
 * considerar: pedagogia, psicologia cognitiva, neurociencias, y
 * curriculum chileno.
 *
 * IMPORTANTE: Cada motor importa getExpertContext() y lo agrega al final
 * de su system prompt. El conocimiento experto GUÍA las decisiones pedagogicas
 * del modelo, pero no se nombra en el texto final del estudiante.
 */

/** Devuelve el fragmento de conocimiento experto para inyectar en prompts */
export function getExpertContext(): string {
  return `
CONOCIMIENTO EXPERTO — MARCO TEORICO OBLIGATORIO:
==================================================

Aplica estos principios en TODO producto que generes. No los menciones
nombradamente en el texto final para el estudiante, pero DEBEN guiar
cada decision pedagogica:

FUNDAMENTOS PSICOLOGIA COGNITIVA:
- Carga cognitiva intrinseca (Sweller): limita la informacion nueva a 3-5 elementos
  por seccion. Si hay mas, segmenta en pasos progresivos.
- Memoria de trabajo (Baddeley): la capacidad es ~4 elementos simultaneos. En
  instrucciones, maximo 3 pasos por actividad. En explicaciones, una idea por parrafo.
- Codificacion dual (Paivio): combina siempre representation verbal + visual.
  Incluye graficos, diagramas, esquemas o imagenes junto al texto explicativo.
- Retreval practice (Roediger & Butler): la recuperacion activa fortalece la memoria
  mas que la relectura. Usa preguntas de recuperacion, quizzes, autoevaluacion.
- Espaciado (Ebbinghaus): distribuye la practica en el tiempo, no masivamente.
  En planificaciones multi-clase, reactiva conocimientos previos al inicio de cada clase.
- Elaboracion (Craik & Lockhart): pide al estudiante conectar nueva info con
  conocimientos previos, analogias personales, ejemplos de su vida real.

FUNDAMENTOS PEDAGOGICOS:
- Zona Proximal de Desarrollo (Vygotsky): diseña actividades entre lo que el estudiante
  YA SABE y lo que puede lograr con andamiaje (scaffolding). El docente modela, luego
  guia, luego delega — progresion "yo hago, hacemos juntos, tu haces".
- Taxonomia de Bloom (revisada): progrede de Recordar -> Comprender -> Aplicar ->
  Analizar -> Evaluar -> Crear. Las actividades deben incluir al menos 3 niveles
  distintos. La evaluacion debe medir al menos el nivel Aplicar.
- Constructivismo (Piaget): el aprendizaje ocurre cuando el estudiante resuelve
  conflicto cognitivo. Incluye situaciones que desafien creencias previas antes
  de presentar el concepto nuevo.
- Andamiaje (Bruner): proporciona apoyos temporales que se retiran gradualmente.
  En cada fase: primero modelo completo, luego modelo con huecos, luego independently.
- Aprendizaje situado (Lave & Wenger): conecta el contenido con contextos reales
  del estudiante (hogar, comunidad, Chile). El conocimiento transferido es el que
  se aprende en contexto autentico.
- Evaluacion formativa (Black & Wiliam): la retroalimentacion debe ser especifica,
  orientada a la tarea (no a la persona), y con oportunidad de mejora. Nunca
  retroalimentacion que solo dice "bien" o "mal".

NEUROCIENCIAS DEL APRENDIZAJE:
- Atencion (Posner): la atencion sostenida dura ~10-15 min en estudiantes jovenes.
  Cambia de actividad o modalidad cada 10-15 min. Usa transiciones claras.
- Consolidacion (Stickgold): el sueño consolida el aprendizaje. En planificaciones,
  la ultima actividad debe ser de sintesis/reflexion para facilitar consolidation.
- Emocion y aprendizaje (Immordino-Yang): la emocion positiva y la relevancia
  personal amplian la atencion y la memoria. Conecta el contenido con intereses
  del estudiante y su identidad cultural.
- Neuroplasticidad: el cerebro se reorganiza con la practica. Enfatiza la practica
  deliberada con retroalimentacion, no solo repeticion mecanica.
- Activacion (Miller): un nivel optimo de activacion mejora el rendimiento. Ni muy
  aburrido (baja activacion) ni muy ansioso (sobre-activacion). Diseña desafios
  al borde del fracaso controlado.

CURRICULUM CHILENO — MARCO NORMATIVO:
- Bases Curriculares MINEDUC 2012 (parvularia) / 2012 (basica) / 2012 (media):
  define OAs, indicadores, actitudes y habilidades transversales.
- OA (Objetivo de Aprendizaje): es la unidad central. Cada actividad debe estar
  alineada explicitamente a un OA y sus indicadores.
- Habilidades Transversales: Habilidades OAH (Observar, Describir, Comunicar,
  Indagar, Explicar, Aplicar, Analizar, Evaluar, Crear) y Actitudes OAA
  (Curiosidad, Perseverancia, Responsabilidad, etc.)
- Evaluacion SIMCE: formato y tipo de items que los estudiantes encontraran.
  Incluir practica con items tipo SIMCE cuando sea relevante.
- Inclusion: PIE (Programa de Integracion Escolar), NEE transitorias, DUA.
  Todo producto debe incluir al menos 1 adaptacion DUA explícita.
- Progresion curricular: los OAs se construyen verticalmente (cada nivel
  presupone los anteriores). Verifica coherencia con el nivel anterior.

METODOLOGIAS ACTIVAS — APLICACION PRACTICA:
- ABP (Aprendizaje Basado en Proyectos): fases Empatizar-Definir-Idear-Prototipar-Testear.
- Aula Invertida: contenido teorico en casa, practica en clase con el docente.
- Aprendizaje Cooperativo (Johnson & Johnson): roles claros, interdependencia positiva,
  responsabilidad individual, habilidades sociales explicitas.
- Indagacion Cientifica: pregunta -> hipotesis -> diseño -> recoleccion -> analisis -> conclusion.
- Gamificacion: narrativa, puntos, insignias, niveles — pero siempre con proposito
  pedagogico, no solo engagement superficial.
- Ensenanza Reciproca (Palincsar & Brown): prediccion, clarificacion, cuestion,
  resumen — rotacion de roles entre estudiantes.

REGLAS DE CALIDAD PREMIUM:
- Nunca generes actividades vagas como "dialogar", "comentar", "reflexionar" sin
  especificar que EXACTAMENTE haran los estudiantes, como se agruparan, y que
  producto observable produciran.
- Incluye tiempo estimado para cada actividad.
- El vocabulario del estudiante debe ser apropiado para su rango etario.
- Evita jerga pedagogica en el texto del estudiante — usa lenguaje concreto.
- Los ejemplos deben ser del contexto chileno (geografia, cultura, calendario).
- Cada recurso debe ser autocontenido: un profesor sin contexto debe poder
  usarlo directamente en clase.
`;
}

/** Contexto experto especifico para evaluaciones formativas */
export function getExpertEvaluationContext(): string {
  return `
EVALUACION FORMATIVA — FUNDAMENTOS EXPERTOS:
- Principio fundamental: la evaluacion formativa NO es para calificar sino para
  IDENTIFICAR donde estan las dificultades y AJUSTAR la ensenanza.
- Retroalimentacion especifica (Hattie & Timperley): debe responder 3 preguntas:
  (1) A donde voy? (2) Donde estoy? (3) Como cierro la brecha?
- La retroalimentacion debe ser INMEDIATA o lo mas cercana posible al momento
  de la actividad.
- Autoevaluacion: developa la metacognicion — el estudiante evalua SU PROPIO
  aprendizaje con criterios explicitos, no subjetivos.
- Coevaluacion: aprende a evaluar a pares con rúbricas claras, fomentando
  pensamiento critico y habilidades sociales.
- Tipo de evidencia: la evaluacion debe recoger evidencia OBSERVABLE (producto,
  respuesta escrita, grabacion, demostracion), nunca inferir estados internos.
`;
}

/** Contexto experto para diferenciacion DUA */
export function getExpertDUAContext(): string {
  return `
DUA — FUNDAMENTOS EXPERTOS:
- Los 3 principios DUA (CAST): 
  (1) Representacion multiple: ofrece informacion en multiples formatos (texto,
      audio, imagen, video, manipulativo).
  (2) Accion y expresion multiple: permite al estudiante demostrar aprendizaje
      de diversas formas (escrita, oral, grafica, digital, construccion).
  (3) Implicacion multiple: conecta con intereses, motiva, auto-regula.
- Niveles de diferenciacion:
  * Apoyo (tier 1): simplificacion de vocabulario, reduccion de pasos, apoyos
    visuales, tiempo extendido, instrucciones paso a paso.
  * Estandar (tier 2): nivel esperado para la mayoria, actividades alineadas
    al OA sin adaptaciones significativas.
  * Desafio (tier 2+): extension, complejidad adicional, transferencia a nuevos
    contextos, proyectos abiertos, liderazgo.
- NEE especificas: TEA (estructura visual, claridad literal, rutinas), TDAH
  (tiempos cortos, transiciones claras, movimiento), dificultades lectoras
  (texto reducido, apoyo fonologico, audiolibros).
- Adecuaciones de acceso: tiempo, material, espacio, posicion.
- Adecuaciones curriculares: solo con informe differential oficial.
`;
}
