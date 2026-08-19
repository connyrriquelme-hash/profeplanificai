import {
  UnidadDidacticaSchema,
  TITULO_MAX,
  NIVEL_MAX,
  ASIGNATURA_MAX,
  CLASE_TEMA_MAX,
  OBJETIVO_ESPECIFICO_MAX,
  ETAPA_DESCRIPCION_MAX,
  type UnidadDidactica,
  type ClaseUnidad,
  type MetodologiaActiva,
} from '../../schemas/UnidadDidacticaSchema';
import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';
import { getExpertContext, getExpertEvaluationContext, getExpertDUAContext } from './ExpertKnowledge';

export interface ObjetivoAprendizajeInput {
  code: string;
  text: string;
}

export interface UnidadDidacticaOptions {
  nivel: string;
  asignatura: string;
  metodologiaActiva: MetodologiaActiva;
  objetivosAprendizaje: ObjetivoAprendizajeInput[];
  temaSugerido?: string;
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  const chars = Array.from(trimmed);
  if (chars.length <= max) return trimmed;
  const cut = chars.slice(0, max - 1).join('').trimEnd();
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}

function buildSystemPrompt(opciones: UnidadDidacticaOptions): string {
  const oaLista = opciones.objetivosAprendizaje
    .map((o) => `- ${o.code}: ${o.text}`)
    .join('\n');

  return `Eres EXPERTO en pedagogía, psicología cognitiva, neurociencias del aprendizaje y currículo chileno MINEDUC. Diseñas unidades didácticas completas de múltiples clases integrando varios Objetivos de Aprendizaje (OA).

${getExpertContext()}
${getExpertEvaluationContext()}
${getExpertDUAContext()}

CONTEXTO DE ESTA UNIDAD:
- Nivel: ${opciones.nivel}
- Asignatura: ${opciones.asignatura}
- Metodología activa: ${opciones.metodologiaActiva}
- Objetivos de Aprendizaje (OA) oficiales MINEDUC a cubrir:
${oaLista}
${opciones.temaSugerido ? `- Tema/enfoque sugerido por el docente: ${opciones.temaSugerido}` : ''}

REGLA MÁS IMPORTANTE: los OA de arriba son el texto curricular formal — NUNCA los copies literalmente en el título, tema de una clase u objetivoEspecifico. Reformúlalos siempre con tus propias palabras, en lenguaje simple y concreto, apropiado para estudiantes de ${opciones.nivel}.

REGLAS OBLIGATORIAS:
1. Diseña las FASES de la unidad según la metodología activa indicada, no genéricas:
   - Design Thinking: Empatizar, Definir, Idear, Prototipar (y opcionalmente Testear).
   - ABP: Pregunta Guía, Investigación, Desarrollo, Presentación.
   - Gamificación: una narrativa con misiones progresivas y un desafío final.
   - Aula Invertida: estudio previo fuera de la clase, verificación de comprensión, práctica guiada en clase, aplicación/extensión.
   - Tradicional: secuencia de contenidos (introducción, desarrollo, práctica, cierre/evaluación).
   Entre 2 y 8 fases. Cada fase: nombre (máx 60 caracteres), descripcion (máx 300 caracteres) y orden (entero secuencial empezando en 0). Las fases deben tener nombres concretos y descriptivos que reflejen qué ocurre en ellas — nunca "Fase 1", "Fase 2" genéricas.
2. Diseña entre 2 y 12 CLASES distribuidas entre esas fases. El campo clases[].faseAsociada debe ser EXACTAMENTE igual al nombre de una de las fases que definiste.
3. Cada clase tiene: numero (entero secuencial único, empezando en 1), faseAsociada, tema (concreto, máx 100 caracteres, nunca copiado del OA), objetivoEspecifico (máx 300 caracteres, ligado a los OA reales pero reformulado), y estructuraClase con inicio/desarrollo/cierre — cada uno con tiempoMinutos (entero, entre 5 y 90) y descripcion (máx 500 caracteres) de qué hace el docente y qué hacen los estudiantes.

REGLAS DE CALIDAD POR CAMPO:
4. INICIO: El campo "inicio.descripcion" de cada clase debe describir UNA estrategia concreta de activación de conocimientos previos específica al tema — escribe exactamente qué pregunta hacer, qué mostrar o qué situación plantear. NUNCA uses solo "Activación de conocimientos previos" sin describirla. Mínimo 40 caracteres.
5. DESARROLLO: El campo "desarrollo.descripcion" debe describir la secuencia de actividades con al menos 3 pasos concretos y ordenados que el profesor puede ejecutar. Incluye la progresión modelado explícito → práctica guiada → práctica independiente aplicada al contenido específico. Mínimo 80 caracteres.
6. CIERRE: El campo "cierre.descripcion" debe incluir la pregunta exacta o instrucción concreta del ticket de salida o síntesis — no solo "cierre y reflexión". El cierre debe referenciar algo producido o trabajado en el desarrollo de esa misma clase. Mínimo 40 caracteres.
7. PROGRESIÓN: Las clases deben tener una progresión real de dificultad y habilidad: Clase 1 introduce y modela, Clase 2 practica con apoyo, Clase 3 aplica con más autonomía, y así sucesivamente. Los objetivos de cada clase deben ser distintos y progresivos — nunca repitas el mismo objetivo en dos clases.
8. MATERIALES: Cuando se mencionen materiales, deben ser específicos y nombrados, no genéricos. No uses "material de la asignatura" — di exactamente qué tipo de recurso (ej: "fotografías impresas de pueblos originarios", no "material sobre pueblos originarios").
9. El título de la unidad debe reflejar el tema real de los OA y la metodología, no ser genérico.
10. El campo "objetivosAprendizaje" de tu respuesta debe ser un ARRAY DE STRINGS con SOLO los códigos de OA (ej. ["HI02 OA 01", "HI02 OA 02"]) — nunca un array de objetos, nunca con el texto del objetivo adentro. Es distinto de "objetivosDisponibles" que recibiste como contexto (eso sí trae objetos con código y texto); tu salida solo repite los códigos, como strings simples.
11. NO incluyas explicaciones ni texto adicional fuera del JSON.
12. Responde ÚNICAMENTE con JSON válido que cumpla exactamente esta estructura.

ESTRUCTURA JSON OBLIGATORIA:
{
  "titulo": "Título específico de la unidad",
  "nivel": "${opciones.nivel}",
  "asignatura": "${opciones.asignatura}",
  "metodologiaActiva": "${opciones.metodologiaActiva}",
  "objetivosAprendizaje": [${opciones.objetivosAprendizaje.map((o) => `"${o.code}"`).join(', ')}],
  "fases": [
    { "nombre": "Nombre concreto y descriptivo de la fase", "descripcion": "Qué ocure en esta fase, con detalles pedagógicos", "orden": 0 }
  ],
  "clases": [
    {
      "numero": 1,
      "faseAsociada": "Nombre de fase (debe existir arriba)",
      "tema": "Tema concreto y específico de esta clase",
      "objetivoEspecifico": "Qué logrará el estudiante en esta clase, en lenguaje simple, distinto del de otras clases",
      "estructuraClase": {
        "inicio": { "tiempoMinutos": 10, "descripcion": "Estrategia concreta de activación: qué pregunta, qué muestra, qué situación plantea" },
        "desarrollo": { "tiempoMinutos": 30, "descripcion": "Secuencia de 3+ pasos: modelado → práctica guiada → práctica independiente, todos aplicados al tema específico" },
        "cierre": { "tiempoMinutos": 10, "descripcion": "Pregunta o instrucción concreta de síntesis que referencie algo trabajado en el desarrollo" }
      }
    }
  ]
}`;
}

// El mensaje "user" NO debe usar el nombre "objetivosAprendizaje" para los
// OA de entrada: es exactamente el mismo nombre de campo que el schema
// exige en la SALIDA (ahí como array de strings/códigos, acá como array
// de {code, text}). Con el mismo nombre, el modelo tendía a copiar la
// forma del input en la salida en vez de aplanarla — confirmado en un
// caso real contra el servidor. Renombrar a "objetivosDisponibles"
// elimina esa colisión.
function buildContextoParaIA(opciones: UnidadDidacticaOptions) {
  return {
    nivel: opciones.nivel,
    asignatura: opciones.asignatura,
    metodologiaActiva: opciones.metodologiaActiva,
    objetivosDisponibles: opciones.objetivosAprendizaje.map((o) => ({ codigo: o.code, textoOficialOA: o.text })),
    temaSugerido: opciones.temaSugerido,
  };
}

// Fases de referencia por metodología, usadas SOLO por el fallback de
// emergencia (ver buildFallbackUnidad). Inspiradas en la lógica que ya
// existía como mock en src/components/UnidadesDidacticasView.tsx
// (líneas 112-115): Tradicional y Aula Invertida comparten el mismo
// esqueleto genérico ahí, igual que aquí.
const FASES_POR_METODOLOGIA: Record<MetodologiaActiva, Array<{ nombre: string; descripcion: string }>> = {
  'Design Thinking': [
    { nombre: 'Empatizar', descripcion: 'Los estudiantes exploran el contexto real ligado al objetivo de aprendizaje.' },
    { nombre: 'Definir', descripcion: 'Se define el desafío central que guiará el resto de la unidad.' },
    { nombre: 'Idear', descripcion: 'Los estudiantes generan posibles soluciones o propuestas.' },
    { nombre: 'Prototipar', descripcion: 'Los estudiantes construyen y presentan un prototipo o producto final.' },
  ],
  Gamificacion: [
    { nombre: 'El Llamado', descripcion: 'Se presenta la narrativa y el desafío inicial de la unidad.' },
    { nombre: 'Mision 1', descripcion: 'Primera misión: los estudiantes aplican conceptos iniciales.' },
    { nombre: 'Mision 2', descripcion: 'Segunda misión: se profundiza y complejiza el desafío.' },
    { nombre: 'Jefe Final', descripcion: 'Desafío final que integra todo lo aprendido en la unidad.' },
  ],
  ABP: [
    { nombre: 'Pregunta Guia', descripcion: 'Se plantea la pregunta central del proyecto ligada al objetivo de aprendizaje.' },
    { nombre: 'Investigacion', descripcion: 'Los estudiantes investigan en grupos para responder la pregunta guía.' },
    { nombre: 'Desarrollo', descripcion: 'Los estudiantes desarrollan el producto o solución del proyecto.' },
    { nombre: 'Presentacion', descripcion: 'Los estudiantes presentan y comparten los resultados del proyecto.' },
  ],
  Tradicional: [
    { nombre: 'Fase 1', descripcion: 'Introducción y activación de conocimientos previos.' },
    { nombre: 'Fase 2', descripcion: 'Desarrollo de contenidos y actividades guiadas.' },
    { nombre: 'Fase 3', descripcion: 'Práctica y consolidación de aprendizajes.' },
    { nombre: 'Fase 4', descripcion: 'Cierre y evaluación de la unidad.' },
  ],
  'Aula Invertida': [
    { nombre: 'Fase 1', descripcion: 'Introducción y activación de conocimientos previos.' },
    { nombre: 'Fase 2', descripcion: 'Desarrollo de contenidos y actividades guiadas.' },
    { nombre: 'Fase 3', descripcion: 'Práctica y consolidación de aprendizajes.' },
    { nombre: 'Fase 4', descripcion: 'Cierre y evaluación de la unidad.' },
  ],
};

// CAMINO DE EMERGENCIA: se usa solo cuando la IA no responde, responde
// JSON inválido o no cumple UnidadDidacticaSchema. No es una unidad
// diseñada pedagógicamente — es una estructura mínima siempre válida
// (nunca vacía) para que el flujo no se rompa. El resultado esperado
// normal es el generado por la IA vía buildSystemPrompt.
export function buildFallbackUnidad(opciones: UnidadDidacticaOptions): UnidadDidactica {
  const fasesDef = FASES_POR_METODOLOGIA[opciones.metodologiaActiva];
  const oas = opciones.objetivosAprendizaje.length > 0
    ? opciones.objetivosAprendizaje
    : [{ code: 'OA-PENDIENTE', text: opciones.temaSugerido || opciones.asignatura }];
  const temaBase = opciones.temaSugerido || oas[0].text || opciones.asignatura;

  const fases = fasesDef.map((f, idx) => ({ nombre: f.nombre, descripcion: f.descripcion, orden: idx }));

  const clases = fasesDef.map((f, idx) => ({
    numero: idx + 1,
    faseAsociada: f.nombre,
    tema: truncate(`${f.nombre}: ${opciones.asignatura}`, CLASE_TEMA_MAX),
    objetivoEspecifico: truncate(`Avanzar en el objetivo de la unidad durante la fase "${f.nombre}".`, OBJETIVO_ESPECIFICO_MAX),
    estructuraClase: {
      inicio: { tiempoMinutos: 15, descripcion: `Activación de conocimientos previos relacionados con la fase "${f.nombre}".` },
      desarrollo: { tiempoMinutos: 45, descripcion: f.descripcion },
      cierre: { tiempoMinutos: 15, descripcion: 'Síntesis y reflexión sobre lo trabajado en la clase.' },
    },
  }));

  return {
    titulo: truncate(`Unidad: ${temaBase} — ${opciones.asignatura}`, TITULO_MAX),
    nivel: truncate(opciones.nivel || 'Nivel por definir', NIVEL_MAX),
    asignatura: truncate(opciones.asignatura || 'Asignatura por definir', ASIGNATURA_MAX),
    metodologiaActiva: opciones.metodologiaActiva,
    objetivosAprendizaje: oas.map((o) => o.code).slice(0, 8),
    fases,
    clases,
  };
}

export interface UnidadDidacticaResult {
  unidad: UnidadDidactica;
  // true cuando se usó buildFallbackUnidad (la IA no respondió, respondió
  // JSON inválido, o el resultado no pasó UnidadDidacticaSchema). El
  // consumidor (endpoint → frontend) debe mostrarlo con claridad — no es
  // el resultado esperado normal.
  usedFallback: boolean;
}

// ─── Enrich parcial — mismo principio que enrichPlanificacion /
// enrichEstudiante: si la IA devolvió una unidad válida pero con campos
// débiles (inicio genérico < 40 chars, desarrollo débil < 80 chars,
// objetivos idénticos en dos clases), se reemplaza SOLO ese campo con el
// del fallback determinista en vez de descartar toda la unidad.

const MIN_INICIO_LEN = 40;
const MIN_DESARROLLO_LEN = 80;

function isWeakInicio(descripcion: string): boolean {
  return descripcion.trim().length < MIN_INICIO_LEN;
}

function isWeakDesarrollo(descripcion: string): boolean {
  return descripcion.trim().length < MIN_DESARROLLO_LEN;
}

// Detecta clases cuyo objetivo es idéntico (normalizado) a uno anterior —
// devuelve el índice de cada ocurrencia repetida (nunca la primera vez que
// aparece ese objetivo, esa se deja intacta).
function findDuplicateObjectiveIndices(clases: ClaseUnidad[]): Set<number> {
  const seen = new Set<string>();
  const duplicates = new Set<number>();
  clases.forEach((clase, index) => {
    const key = clase.objetivoEspecifico.trim().toLowerCase();
    if (seen.has(key)) {
      duplicates.add(index);
    } else {
      seen.add(key);
    }
  });
  return duplicates;
}

function enrichUnidad(ai: UnidadDidactica, fallback: UnidadDidactica): UnidadDidactica {
  const duplicateObjectiveIndices = findDuplicateObjectiveIndices(ai.clases);

  const clases = ai.clases.map((clase, index) => {
    const fallbackClase = fallback.clases[index];
    if (!fallbackClase) return clase;

    return {
      ...clase,
      tema: clase.tema.trim().length < 5 ? fallbackClase.tema : clase.tema,
      objetivoEspecifico: duplicateObjectiveIndices.has(index)
        ? fallbackClase.objetivoEspecifico
        : clase.objetivoEspecifico,
      estructuraClase: {
        inicio: {
          ...clase.estructuraClase.inicio,
          descripcion: isWeakInicio(clase.estructuraClase.inicio.descripcion)
            ? fallbackClase.estructuraClase.inicio.descripcion
            : clase.estructuraClase.inicio.descripcion,
        },
        desarrollo: {
          ...clase.estructuraClase.desarrollo,
          descripcion: isWeakDesarrollo(clase.estructuraClase.desarrollo.descripcion)
            ? fallbackClase.estructuraClase.desarrollo.descripcion
            : clase.estructuraClase.desarrollo.descripcion,
        },
        cierre: clase.estructuraClase.cierre,
      },
    };
  });

  // Validación cruzada: si el enrich cambió la faseAsociada de alguna
  // clase a una que no existe en las fases de la IA, mantener la original.
  const nombresFasesAI = new Set(ai.fases.map((f) => f.nombre));
  const clasesCorregidas = clases.map((clase) => ({
    ...clase,
    faseAsociada: nombresFasesAI.has(clase.faseAsociada)
      ? clase.faseAsociada
      : ai.clases.find((c) => c.numero === clase.numero)?.faseAsociada || clase.faseAsociada,
  }));

  return { ...ai, clases: clasesCorregidas };
}

// ─── Punto de entrada único ───
// Mismo patrón que generateGuia / generatePlanificacion: fallback
// determinista primero, intento IA con el modelo 70B (el schema con
// .refine() positional es lo suficientemente "rico" como para que el 3B
// falle sistemáticamente — mismo motivo documentado en RubricaEngine),
// enrich si tiene éxito, catch → fallback completo.

export async function generateUnidadDidactica(
  env: AIEngineEnv,
  opciones: UnidadDidacticaOptions,
): Promise<UnidadDidacticaResult> {
  const fallback = buildFallbackUnidad(opciones);

  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(opciones),
      JSON.stringify(buildContextoParaIA(opciones), null, 2),
      UnidadDidacticaSchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', maxTokens: 4000 },
    );
    return { unidad: enrichUnidad(data, fallback), usedFallback: false };
  } catch (error) {
    console.error('[UnidadDidacticaEngine] error:', error);
    return { unidad: fallback, usedFallback: true };
  }
}
