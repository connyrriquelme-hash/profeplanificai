import {
  UnidadDidacticaSchema,
  TITULO_MAX,
  NIVEL_MAX,
  ASIGNATURA_MAX,
  CLASE_TEMA_MAX,
  OBJETIVO_ESPECIFICO_MAX,
  type UnidadDidactica,
  type MetodologiaActiva,
} from '../../schemas/UnidadDidacticaSchema';
import { extractJsonFromText } from './AIEngine';
import type { AIEngineEnv } from './types';

const MODEL = '@cf/meta/llama-3.2-3b-instruct';

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
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1).trimEnd();
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}

function buildSystemPrompt(opciones: UnidadDidacticaOptions): string {
  const oaLista = opciones.objetivosAprendizaje
    .map((o) => `- ${o.code}: ${o.text}`)
    .join('\n');

  return `Eres un experto en diseño curricular y metodologías activas para el currículum chileno. Diseñas unidades didácticas completas de múltiples clases integrando varios Objetivos de Aprendizaje (OA).

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
   Entre 2 y 8 fases. Cada fase: nombre (máx 60 caracteres), descripcion (máx 300 caracteres) y orden (entero secuencial empezando en 0).
2. Diseña entre 2 y 12 CLASES distribuidas entre esas fases. El campo clases[].faseAsociada debe ser EXACTAMENTE igual al nombre de una de las fases que definiste.
3. Cada clase tiene: numero (entero secuencial único, empezando en 1), faseAsociada, tema (concreto, máx 100 caracteres, nunca copiado del OA), objetivoEspecifico (máx 300 caracteres, ligado a los OA reales pero reformulado), y estructuraClase con inicio/desarrollo/cierre — cada uno con tiempoMinutos (entero, entre 5 y 90) y descripcion (máx 500 caracteres) de qué hace el docente y qué hacen los estudiantes.
4. El título de la unidad debe reflejar el tema real de los OA y la metodología, no ser genérico.
5. El campo "objetivosAprendizaje" de tu respuesta debe ser un ARRAY DE STRINGS con SOLO los códigos de OA (ej. ["HI02 OA 01", "HI02 OA 02"]) — nunca un array de objetos, nunca con el texto del objetivo adentro. Es distinto de "objetivosDisponibles" que recibiste como contexto (eso sí trae objetos con código y texto); tu salida solo repite los códigos, como strings simples.
6. NO incluyas explicaciones ni texto adicional fuera del JSON.
7. Responde ÚNICAMENTE con JSON válido que cumpla exactamente esta estructura.

ESTRUCTURA JSON OBLIGATORIA:
{
  "titulo": "Título específico de la unidad",
  "nivel": "${opciones.nivel}",
  "asignatura": "${opciones.asignatura}",
  "metodologiaActiva": "${opciones.metodologiaActiva}",
  "objetivosAprendizaje": [${opciones.objetivosAprendizaje.map((o) => `"${o.code}"`).join(', ')}],
  "fases": [
    { "nombre": "Nombre de fase", "descripcion": "Qué ocurre en esta fase", "orden": 0 }
  ],
  "clases": [
    {
      "numero": 1,
      "faseAsociada": "Nombre de fase (debe existir arriba)",
      "tema": "Tema concreto de esta clase",
      "objetivoEspecifico": "Qué logrará el estudiante en esta clase, en lenguaje simple",
      "estructuraClase": {
        "inicio": { "tiempoMinutos": 10, "descripcion": "..." },
        "desarrollo": { "tiempoMinutos": 30, "descripcion": "..." },
        "cierre": { "tiempoMinutos": 10, "descripcion": "..." }
      }
    }
  ]
}`;
}

function callAI(env: AIEngineEnv, systemPrompt: string, opciones: UnidadDidacticaOptions): Promise<string> {
  if (!env.AI) {
    throw new Error('AI no está configurado en el entorno.');
  }

  // El mensaje "user" NO debe usar el nombre "objetivosAprendizaje" para
  // los OA de entrada: es exactamente el mismo nombre de campo que el
  // schema exige en la SALIDA (ahí como array de strings/códigos, acá
  // como array de {code, text}). Con el mismo nombre, el modelo tendía a
  // copiar la forma del input en la salida en vez de aplanarla —
  // confirmado en un caso real contra el servidor. Renombrar a
  // "objetivosDisponibles" elimina esa colisión.
  const contextoParaIA = {
    nivel: opciones.nivel,
    asignatura: opciones.asignatura,
    metodologiaActiva: opciones.metodologiaActiva,
    objetivosDisponibles: opciones.objetivosAprendizaje.map((o) => ({ codigo: o.code, textoOficialOA: o.text })),
    temaSugerido: opciones.temaSugerido,
  };

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: JSON.stringify(contextoParaIA, null, 2) },
  ];

  return env.AI.run(MODEL, {
    messages,
    temperature: 0.2,
    max_tokens: 4000,
  }).then((response: unknown) => {
    if (typeof response === 'string') return response;
    if (typeof response === 'object' && response !== null) {
      // env.AI.run(...) con mensajes de chat normalmente resuelve a
      // { response: "<texto plano del modelo>" } — ese campo YA es el texto
      // a parsear, nunca hay que re-stringify-arlo (JSON.stringify de un
      // string produce un literal JSON con comillas/backslashes escapados,
      // que rompe JSON.parse en extractJsonFromText). Mismo bug confirmado
      // con evidencia real en PptContentEngine.ts y AIEngine.ts.
      const inner = (response as Record<string, unknown>).response;
      return typeof inner === 'string' ? inner : JSON.stringify(inner ?? response);
    }
    return String(response);
  });
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

export async function generateUnidadDidactica(
  env: AIEngineEnv,
  opciones: UnidadDidacticaOptions,
): Promise<UnidadDidacticaResult> {
  try {
    const raw = await callAI(env, buildSystemPrompt(opciones), opciones);
    const parsed = extractJsonFromText(raw);

    if (!parsed) {
      console.warn('[UnidadDidacticaEngine] respuesta vacía, usando fallback');
      return { unidad: buildFallbackUnidad(opciones), usedFallback: true };
    }

    const parsedJson: unknown = JSON.parse(parsed);
    const result = UnidadDidacticaSchema.safeParse(parsedJson);

    if (!result.success) {
      console.warn('[UnidadDidacticaEngine] validación falló, usando fallback:', result.error.issues);
      return { unidad: buildFallbackUnidad(opciones), usedFallback: true };
    }

    return { unidad: result.data, usedFallback: false };
  } catch (error) {
    console.error('[UnidadDidacticaEngine] error:', error);
    return { unidad: buildFallbackUnidad(opciones), usedFallback: true };
  }
}
