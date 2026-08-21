import { PptDeckSchema, TITLE_MAX, SUBTITLE_MAX, BULLET_MAX, type PptDeck, type Slide } from '../../schemas/PptDeckSchema';
import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv, PedagogicalPlan } from './types';
import { inferRangoEtario } from './pedagogicalUtils';
import { getExpertContext, getProfePlanificAIContext } from './ExpertKnowledge';
import { type MasterTemplate, renderTemplateStructure } from './pptMasterTemplates';

export { inferRangoEtario };

export function buildSystemPrompt(plan: PedagogicalPlan, masterTemplate?: MasterTemplate): string {
  const rangoEtario = inferRangoEtario(plan.curso);

  return `Eres EXPERTO en pedagogía multimedia, psicología cognitiva, neurociencias del aprendizaje y currículo chileno MINEDUC. Generas contenido para presentaciones PPT que serán usadas en clase.

${getProfePlanificAIContext()}
${getExpertContext()}

REGLAS DE VARIEDAD PARA DIAPOSITIVAS:
1. DIVERSIDAD DE CONTENIDO: no todas las diapositivas deben ser texto+imagen. Varia:
   - Diapositiva de concepto: definicion + imagen + ejemplo
   - Diapositiva de pregunta: pregunta de retension + opciones
   - Diapositiva de ejemplo real: caso chileno + analisis
   - Diapositiva de actividad: instrucciones de actividad en clase
   - Diapositiva de resumen: mapa conceptual o esquema visual
   - Diapositiva de evaluacion: pregunta tipo SIMCE o reflexion
   - Diapositiva de transicion: "Ahora vamos a..." con icono claro

2. PREGUNTAS EN DIAPOSITIVAS: incluye al menos 1 diapositiva de pregunta por cada 3 diapositivas de contenido. Usa tipos variados:
   - "Cual de estas opciones es correcta?"
   - "Verdadero o falso"
   - "Completa: el concepto X significa..."
   - "Dibuja en tu cuaderno lo que entendiste"

3. ADAPTACIONES NEURODIVERSIDAD:
   - Font size minimo 24pt
   - Colores de alto contraste
   - Max 5 lineas de texto por diapositiva
   - Siempre imagen + texto, nunca solo texto
   - Instrucciones en negrita o color distinto

DOMINIOS EN LAS DIAPOSITIVAS:
1. CURRICULAR: al menos 1 diapositiva debe mostrar el OA y su relacion con la vida real

2. PRODUCTO TANGIBLE: incluye 1 diapositiva que muestre el PRODUCTO que los
   estudiantes fabricaran (foto de ejemplo, pasos de construccion, materiales)

3. MAKER: si el tema lo permite, incluye diapositiva de "VAMOS A CREAR" con:
   - Materiales necesarios (reciclados/bajo costo)
   - Pasos de construccion (con imagenes si es posible)
   - Criterios de exito

4. TECNOLOGIA: en diapositivas de actividades, sugiere herramientas digitales

5. FORMATO: las diapositivas deben ser visuales (max 5 lineas, imagen + texto,
   colores de alto contraste, font 24pt+)

CONTEXTO DE ESTA CLASE:
- Tema: ${plan.tema}
- Curso: ${plan.curso} — rango etario aproximado: ${rangoEtario}
- Objetivo de Aprendizaje (OA) oficial MINEDUC a cubrir: "${plan.objetivo_aprendizaje}"

REGLA MÁS IMPORTANTE: el texto del OA de arriba es el objetivo curricular formal, escrito para docentes — NUNCA lo copies literalmente en un título o bullet. Reformúlalo siempre con tus propias palabras, en lenguaje simple y concreto, adaptado exactamente al rango etario indicado arriba. Todo el contenido (títulos, bullets, ejemplos) debe estar atado al tema y al OA reales de esta clase, no ser genérico.

REGLAS OBLIGATORIAS:
1. Cada slide debe tener un título claro y conciso (máximo 80 caracteres). El slide "title" puede tener además un subtitle breve (máximo 120 caracteres) — nunca copies ahí el objetivo de aprendizaje completo, eso va en su propio slide de bullets, y siempre reformulado.
2. Los slides de tipo "bullets" deben tener ENTRE 2 Y 6 bullets, nunca menos de 2 ni más de 6. Cada bullet máximo 140 caracteres, en lenguaje simple (no copiado del OA).
3. Los slides de tipo "image_text" deben tener un imageQuery descriptivo (máximo 100 caracteres) para buscar una imagen relacionada. El imageQuery debe ser una búsqueda específica y concreta que encontraría una imagen real en Wikimedia Commons — por ejemplo "mapuche ruka vivienda tradicional" en vez de "pueblo indígena feliz". Nunca uses términos abstractos o emocionales como imageQuery.
4. Los slides de tipo "comparison" deben tener left y right con label y al menos 1 point cada uno.
5. Los slides de tipo "quote" deben tener text (máximo 200 caracteres) y author opcional.
6. ${masterTemplate ? `Genera EXACTAMENTE ${masterTemplate.steps.length} slides — ni uno más, ni uno menos (ver PLANTILLA MAESTRA más abajo).` : 'Genera SIEMPRE entre 10 y 14 slides para una clase completa. Nunca menos de 10 — una presentación con menos slides no cubre el OA de forma suficiente para una clase real.'}
7. NO incluyas explicaciones ni texto adicional fuera del JSON.
8. Responde ÚNICAMENTE con JSON válido que cumpla el esquema PptDeckSchema.
9. Cada slide puede incluir "teacherNotes" (máximo 300 caracteres): una instrucción breve y concreta para el docente sobre cómo usar esa diapositiva en clase (no la ve el estudiante). Inclúyela siempre que aporte valor real, especialmente en slides de actividad o pregunta.

${masterTemplate ? renderTemplateStructure(masterTemplate) : `PROGRESIÓN PEDAGÓGICA OBLIGATORIA:
Los slides deben seguir esta progresión:
- 1 slide de título (portada con el tema real)
- 1-2 slides de activación (pregunta o situación del contexto cotidiano del estudiante que conecte con el tema)
- 3-5 slides de desarrollo del contenido (conceptos clave, ejemplos concretos, datos reales — nunca frases vacías)
- 1-2 slides de actividad o práctica (algo que el estudiante hace: responde, compara, opina, relaciona)
- 1 slide de síntesis o cierre con pregunta reflexiva concreta`}

REGLA CRÍTICA — PRECISIÓN FACTUAL:
Si no tienes certeza sobre un dato específico (nombre científico, cifra, fecha, proceso biológico, característica anatómica), usa una descripción funcional general en vez de un dato concreto que pueda ser inexacto. NUNCA inventes datos, nombres, fechas, características, términos, palabras o conceptos que no existan. NUNCA uses metáforas, analogías o frases que suenen educativas pero no digan nada concreto ni produzcan información incorrecta.

CITAS PROHIBIDAS:
PROHIBIDO incluir slides de tipo "quote" con citas atribuidas a "Un biólogo", "Un experto", "Un científico" o cualquier autoridad genérica sin nombre real verificable. Si usas el layout "quote", la cita debe ser un refrán popular, un dicho conocido, o una pregunta reflexiva del propio contenido — nunca una atribución a una persona o fuente que no puedas verificar.

COHERENCIA CON EL OA — HABILIDAD, NO SOLO TEMA:
El contenido de los slides debe enseñar o modelar la HABILIDAD del OA, no solo información sobre el tema. Por ejemplo, si el OA es de comprensión lectora, incluye slides que modelen cómo identificar información explícita vs. implícita, cómo interpretar ilustraciones, y un espacio para que el estudiante practique formular una opinión — no solo datos sobre el tema. Siempre pregúntate: ¿este slide ayuda al estudiante a desarrollar la habilidad del OA, o solo informa sobre el tema?

CADA slide debe relacionarse directamente con el OA y desarrollar UNA habilidad o concepto específico del OA. Nunca incluyas slides con frases motivacionales genéricas ("La historia nos hace únicos", "Nuestra identidad es especial") que no enseñen nada concreto. Pregúntate: ¿este slide ayuda al estudiante a lograr el OA, o es relleno motivacional?

TIPOGRAFÍA Y ORTOGRAFÍA:
Cuida la ortografía española: usa tildes correctamente (imagen, no imagén), escribe con mayúscula solo al inicio de oraciones y en nombres propios.

NUNCA incluyas un slide cuyo único propósito sea listar el OA oficial textualmente — el objetivo debe aparecer reformulado en lenguaje simple integrado en el contenido, no como slide separado de "Objetivo de Aprendizaje" que solo repite el texto curricular.

ESTRUCTURA JSON OBLIGATORIA (usa el layout que corresponda a cada slide de la secuencia; "teacherNotes" es opcional en todos):
{
  "slides": [
    { "layout": "title", "title": "Título de la presentación", "subtitle": "Subtítulo opcional", "teacherNotes": "..." },
    { "layout": "bullets", "title": "Título del slide", "bullets": ["punto 1", "punto 2"], "teacherNotes": "..." },
    { "layout": "image_text", "title": "Título", "body": "Texto descriptivo", "imageQuery": "descripción de imagen", "teacherNotes": "..." },
    { "layout": "comparison", "title": "Comparación", "left": { "label": "Izquierda", "points": ["punto"] }, "right": { "label": "Derecha", "points": ["punto"] }, "teacherNotes": "..." },
    { "layout": "quote", "text": "Cita educativa", "author": "Autor opcional", "teacherNotes": "..." },
    { "layout": "vocabulario", "titulo": "Título", "terminos": [{ "palabra": "término", "definicion": "definición simple", "imageQuery": "opcional" }] },
    { "layout": "ciclo_proceso", "titulo": "Título", "pasos": [{ "nombre": "Paso 1", "descripcion": "qué pasa en este paso", "imageQuery": "opcional" }] },
    { "layout": "quiz_opcion_multiple", "pregunta": "¿...?", "opciones": ["A", "B", "C"], "respuestaCorrectaIndex": 0, "explicacion": "por qué es correcta" },
    { "layout": "verdadero_falso", "afirmacion": "...", "esVerdadero": true, "explicacion": "por qué" }
  ]
}`;
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  const chars = Array.from(trimmed);
  if (chars.length <= max) return trimmed;
  const cut = chars.slice(0, max - 1).join('').trimEnd();
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}

// CAMINO DE EMERGENCIA: se usa solo cuando la IA no entregó contenido
// válido (buildFallbackDeck). No es una reformulación pedagógica real —
// solo evita mostrar el texto curricular formal completo, con sus
// enumeraciones, tal cual en un bullet. El resultado esperado normal es
// que la IA reformule el contenido en lenguaje simple (ver
// buildSystemPrompt); esto es un mínimo aceptable, no un reemplazo.
function simplificarTextoCurricular(texto: string): string {
  const primeraClausula = texto.split(/(?<=[.;])\s+/)[0] || texto;
  return primeraClausula
    .replace(/,?\s*\b(incluyendo|considerando|tales como|entre otros?|entre otras?|así como)\b.*$/i, '')
    .replace(/[.,;]\s*$/, '')
    .trim();
}

function splitTextToBullets(text: string, maxItems: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return ['Sin contenido disponible', 'Consultar planificación para más detalles'];

  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 140);

  if (sentences.length === 0) return [trimmed.slice(0, 140), 'Detallar en clase'];
  if (sentences.length === 1) return [sentences[0], 'Ampliar durante la clase'];
  return sentences.slice(0, maxItems);
}

function buildFallbackDeck(plan: PedagogicalPlan): PptDeck {
  const oa = simplificarTextoCurricular(plan.objetivo_aprendizaje || plan.tema);
  const tema = plan.tema || 'el tema de la clase';
  const asignatura = plan.asignatura || 'la asignatura';
  const curso = plan.curso || 'el curso';

  const inicioDesc = plan.estructura_clase?.inicio?.descripcion || '';
  const desarrolloDesc = plan.estructura_clase?.desarrollo?.descripcion || '';
  const cierreDesc = plan.estructura_clase?.cierre?.descripcion || '';

  const indicadores = (plan.indicadores_seleccionados || []).join('; ');
  const criterios = (plan.criterios_seleccionados || []).join('; ');

  const slides: Slide[] = [
    {
      layout: 'title',
      title: truncate(`${tema} — ${asignatura}`, TITLE_MAX),
      subtitle: truncate([curso, asignatura].filter(Boolean).join(' | '), SUBTITLE_MAX),
    },
    {
      layout: 'bullets',
      title: 'Objetivo de Aprendizaje',
      bullets: [
        oa,
        ...(indicadores ? [indicadores] : []),
        `Asignatura: ${asignatura}`,
        `Curso: ${curso}`,
      ].slice(0, 6).map((b) => truncate(b, BULLET_MAX)),
    },
  ];

  if (inicioDesc) {
    slides.push({
      layout: 'bullets',
      title: 'Inicio de la Clase',
      bullets: splitTextToBullets(inicioDesc, 6),
    });
  }

  if (desarrolloDesc) {
    slides.push({
      layout: 'bullets',
      title: 'Desarrollo de la Clase',
      bullets: splitTextToBullets(desarrolloDesc, 6),
    });
  }

  if (cierreDesc) {
    slides.push({
      layout: 'bullets',
      title: 'Cierre de la Clase',
      bullets: splitTextToBullets(cierreDesc, 6),
    });
  }

  if (criterios) {
    slides.push({
      layout: 'bullets',
      title: 'Criterios de Evaluación',
      bullets: splitTextToBullets(criterios, 6),
    });
  }

  slides.push({
    layout: 'quote',
    text: `En ${asignatura}, cada estudiante puede demostrar su aprendizaje de múltiples formas.`,
    author: 'Diseño Universal para el Aprendizaje',
  });

  return { slides };
}

function isBulletsSlideValid(slide: Slide): boolean {
  if (slide.layout !== 'bullets') return true;
  return slide.bullets.length >= 2 && slide.bullets.every((b) => b.trim().length > 0);
}

function safeguardBulletsFromPlan(deck: PptDeck, plan: PedagogicalPlan): PptDeck {
  // CAMINO DE EMERGENCIA (ver simplificarTextoCurricular): solo se alcanza
  // si un slide de bullets queda con <2 items válidos después de la IA.
  const oa = simplificarTextoCurricular(plan.objetivo_aprendizaje || plan.tema);
  const indicadores = plan.indicadores_seleccionados || [];
  const criterios = plan.criterios_seleccionados || [];

  const fallbackBullets = [
    oa,
    ...indicadores,
    ...criterios,
  ].filter((s): s is string => s !== undefined && s.trim().length > 0 && s.trim().length <= 140);

  if (fallbackBullets.length < 2) {
    fallbackBullets.push(
      `OA: ${oa}`,
      `Asignatura: ${plan.asignatura}`,
      `Curso: ${plan.curso}`,
    );
  }

  const slides = deck.slides.map((slide) => {
    if (slide.layout === 'bullets' && !isBulletsSlideValid(slide)) {
      const validBullets = slide.bullets.filter((b) => b.trim().length > 0);
      const merged = [...validBullets, ...fallbackBullets];
      const unique = [...new Set(merged)].slice(0, 6);

      if (unique.length < 2) {
        unique.push(...fallbackBullets.slice(0, 2 - unique.length));
      }

      return { ...slide, bullets: unique };
    }
    return slide;
  });

  return { slides };
}

function safeguardEmptyArrays(deck: PptDeck): PptDeck {
  const slides = deck.slides.map((slide) => {
    if (slide.layout === 'comparison') {
      const leftPoints = slide.left.points.length > 0
        ? slide.left.points
        : [`${slide.left.label}: contenido no disponible`];
      const rightPoints = slide.right.points.length > 0
        ? slide.right.points
        : [`${slide.right.label}: contenido no disponible`];
      return {
        ...slide,
        left: { ...slide.left, points: leftPoints },
        right: { ...slide.right, points: rightPoints },
      };
    }
    return slide;
  });

  return { slides };
}

// ─── Enrich parcial — mismo principio que enrichPlanificacion
// (PlanificacionEngine.ts): safeguardBulletsFromPlan/safeguardEmptyArrays
// solo arreglan completitud ESTRUCTURAL (arrays vacíos o bajo el mínimo del
// schema); esto arregla CALIDAD de contenido — un slide que sí pasa el
// schema pero es débil o genérico se reemplaza por el fallback determinista
// en la misma posición, en vez de descartar el deck completo.

// 4: umbral pedido explícitamente para la revisión de calidad de PPT (deck
// de 10-14 slides, cobertura real del OA) — antes era 3 para no filtrar
// bullets cortos pero específicos en 1°-2° básico ("Tiene un caparazón
// duro" = 4 palabras, sobrevivía igual). Con 4, un bullet de exactamente
// 3 palabras específicas para cursos bajos ahora puede marcarse como débil
// y reemplazarse por el fallback determinista — vale la pena vigilar si
// esto genera falsos positivos en decks de 1°-2° básico.
const MIN_WORDS_PER_BULLET = 4;
// A propósito NO incluye "desarrollo"/"cierre"/"actividad"/"ejercicio":
// son los rótulos de sección estándar y deseables de una clase
// (Inicio/Desarrollo/Cierre, el mismo patrón que ya usa GuiaEngine para
// la guía docente) — un slide titulado "Desarrollo" con bullets
// específicos no es genérico, solo sigue la estructura esperada. Solo
// entran acá palabras que nunca aportan contexto por sí solas.
const GENERIC_TITLE_PATTERN = /^(introducci[oó]n|conclusi[oó]n|resumen|contenido)s?$/i;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Título "sin contexto específico": calza contra la lista de títulos
// genéricos de manual. A propósito NO se intentó además "es corto y no
// menciona el tema" — esa heurística marcaba falsos positivos reales
// (ej. "Membrana Celular" contra tema "La célula": no comparte el
// substring exacto por el acento/flexión y quedaba descartado un slide
// image_text perfectamente específico). Mejor un filtro angosto y sin
// falsos positivos que uno amplio que descarta contenido bueno.
function isGenericTitle(title: string): boolean {
  return GENERIC_TITLE_PATTERN.test(title.trim().toLowerCase());
}

function isWeakSlide(slide: Slide): boolean {
  if ('title' in slide && isGenericTitle(slide.title)) return true;
  if (slide.layout === 'bullets' && slide.bullets.every((b) => countWords(b) < MIN_WORDS_PER_BULLET)) return true;
  return false;
}

function enrichDeck(aiDeck: PptDeck, fallbackDeck: PptDeck): PptDeck {
  const slides = aiDeck.slides.map((slide, index) => {
    if (!isWeakSlide(slide)) return slide;
    // Sin equivalente en esa posición del fallback (deck más corto que el
    // generado por la IA) — se deja tal cual, no hay con qué enriquecerlo.
    return fallbackDeck.slides[index] ?? slide;
  });

  return { slides };
}

// ─── Verificación anti-cita — regla "CITAS PROHIBIDAS" en código: si la IA
// ignora la regla del prompt e igual atribuye una cita a una autoridad
// genérica sin nombre real, se sanea el campo "author" en vez de descartar
// el slide entero (el texto de la cita en sí puede seguir siendo válido).
// Mismo patrón de dos capas (prompt + runtime) que INTERNAL_STATE_PATTERN
// en RubricaEngine.ts.
const FAKE_AUTHORITY_PATTERN = /\b(bi[oó]log[oa]s?|expert[oa]s?|cient[ií]fic[oa]s?|investigador(a)?|profesor(a)?)\b/i;

// Regla "NUNCA incluyas un slide cuyo único propósito sea listar el OA
// textualmente" en código — no solo prompt: el caso real encontrado en el
// diagnóstico anterior vino del FALLBACK determinista (buildFallbackDeck
// trunca el OA a BULLET_MAX=140 caracteres, muy por sobre lo que un niño
// de 2° básico lee), no de la IA ignorando la regla. Un rule de prompt
// nunca habría arreglado eso — el fallback es código determinista, no le
// llega el prompt. 100 caracteres: más largo que cualquier bullet
// reformulado en lenguaje simple, pero corto para texto curricular crudo.
const OA_BULLET_MAX_LEN = 100;
const MIN_BULLETS_SCHEMA = 2; // BulletsSlideSchema.bullets.min — ver schemas/PptDeckSchema.ts
const SAFE_FILLER_BULLETS = ['Revisemos juntos el objetivo de esta clase.', 'Pregunta a tu profesor o profesora si tienes dudas.'];

function sanitizeBulletsSlide(slide: Extract<Slide, { layout: 'bullets' }>): Slide {
  const cleanBullets = slide.bullets.filter((b) => b.trim().length <= OA_BULLET_MAX_LEN);
  if (cleanBullets.length === slide.bullets.length) return slide;

  // Nunca se elimina el slide completo (arriesgaría bajar el deck de
  // MIN_SLIDES=5): si quedan menos bullets que el mínimo del schema, se
  // completa con relleno seguro y genérico en vez de texto curricular.
  const filled = [...cleanBullets];
  let fillerIndex = 0;
  while (filled.length < MIN_BULLETS_SCHEMA) {
    filled.push(SAFE_FILLER_BULLETS[fillerIndex % SAFE_FILLER_BULLETS.length]);
    fillerIndex += 1;
  }

  return { ...slide, bullets: filled };
}

export function validateDeck(deck: PptDeck): PptDeck {
  const slides = deck.slides.map((slide): Slide => {
    if (slide.layout === 'quote' && slide.author && FAKE_AUTHORITY_PATTERN.test(slide.author)) {
      const { author, ...rest } = slide;
      return rest;
    }
    if (slide.layout === 'bullets') {
      return sanitizeBulletsSlide(slide);
    }
    return slide;
  });

  return { slides };
}

export async function generateDeckContent(
  env: AIEngineEnv,
  plan: PedagogicalPlan,
  opciones?: { maxSlides?: number; masterTemplate?: MasterTemplate },
): Promise<PptDeck & { _fallbackReason?: string }> {
  const masterTemplate = opciones?.masterTemplate;
  const expectedMin = masterTemplate ? masterTemplate.steps.length : 10;
  const maxSlides = opciones?.maxSlides ?? (masterTemplate ? masterTemplate.steps.length : 20);
  const fallback = buildFallbackDeck(plan);

  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(plan, masterTemplate),
      JSON.stringify(plan, null, 2),
      PptDeckSchema,
      // 4000, no 3000: un deck de 10-14 slides con bullets/body completos
      // no entra cómodo en 3000 tokens (mismo ajuste que UnidadDidacticaEngine
      // hace para su generación multi-clase).
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', maxTokens: 4000 },
    );

    let deck = data;
    if (deck.slides.length < expectedMin) {
      console.warn(`[PptContentEngine] la IA devolvió ${deck.slides.length} slides, bajo lo esperado (${expectedMin}${masterTemplate ? `, plantilla "${masterTemplate.name}"` : ''})`);
    }
    deck = enrichDeck(deck, fallback);
    deck = safeguardBulletsFromPlan(deck, plan);
    deck = safeguardEmptyArrays(deck);
    deck = validateDeck(deck);
    deck.slides = deck.slides.slice(0, maxSlides);
    return deck;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[PptContentEngine] error:', error);
    // Sin esto, cuando la generacion con IA falla y cae al deck generico,
    // el motivo real (cuota, validacion de esquema, etc.) quedaba solo en
    // logs de Cloudflare -- invisible tanto para el docente como para
    // diagnosticar el problema sin una sesion de wrangler tail.
    return { ...validateDeck(fallback), _fallbackReason: message };
  }
}
