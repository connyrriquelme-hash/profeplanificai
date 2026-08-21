import { z } from 'zod';
import type { AIEngineEnv, DuaGuide, LessonContent, PedagogicalPlan } from './types';
import { getExpertContext, getExpertEvaluationContext, getProfePlanificAIContext } from './ExpertKnowledge';

const MODEL = '@cf/meta/llama-3.2-3b-instruct';

const SYSTEM_PROMPT_DUA = `Eres una educadora diferencial y especialista en Diseño Universal para el Aprendizaje (DUA), neurodiversidad, adecuaciones de acceso, evaluación formativa y currículum chileno MINEDUC. Redactas como una profesional con experiencia real en aulas chilenas: lenguaje docente concreto, aplicable, sin tecnicismos clínicos innecesarios y sin frases vacías.

REGLAS OBLIGATORIAS:
1. Usa el OA seleccionado como eje central. No inventes OA ni cambies su sentido.
2. Transforma el OA en una meta comprensible para estudiantes y una interpretación pedagógica experta.
3. Considera diversidad real: rezago lector, TDAH, TEA, dificultades de lenguaje, NEE transitorias, alta motivación visual, barreras de participación y distintos ritmos.
4. Si las habilidades son vacías, nulas, "a", "-" o texto inválido, genera habilidades sugeridas desde el OA y márcalas como sugeridas.
5. Si los criterios son genéricos (ej. "escribir", "leer"), conviértelos en criterios observables y medibles.
6. Para 1° básico usa actividades breves, visuales, orales, manipulativas y lúdicas. No exijas escritura extensa.
7. Cada nivel debe ser DISTINTO y específico: apoyo muy guiado, estándar como actividad central, desafío como profundización sin adelantar curso.
8. NO uses frases genéricas como "actividad colaborativa en situación real" sin explicar concretamente qué hace el docente y qué hacen los estudiantes.
9. NO repitas el OA en todas las secciones. Usa el OA solo en "oa_a_trabajar" y "contexto_pedagogico_inclusivo".
10. NO generes secciones con una sola palabra o letra.
11. Responde ÚNICAMENTE con JSON válido, sin markdown ni explicaciones externas.
12. "criterios_aprendizaje" es OBLIGATORIO: genera siempre entre 2 y 6 criterios observables, medibles y específicos al OA. Nunca lo dejes vacío ni como []. Cada criterio debe describir qué hace el estudiante para demostrar aprendizaje, no qué hace el docente.

CONTEXTO POR NIVEL:
- Parvularia/1° básico: pictogramas, tarjetas visuales, modelaje con objetos, elección entre alternativas, respuesta oral, dibujo, señalamiento, trabajo en pareja con roles simples, frases iniciadoras, rutinas breves de cierre.
- 2°-4° básico: organizadores gráficos, conversación guiada con criterios, registro simple, justificación con elementos observables.
- 5°-6° básico: análisis comparativo, argumentación con evidencia, trabajo colaborativo con roles, producción propia.
- Media: argumentación crítica, vocabulario disciplinar, proyectos autónomos, conexión con identidad y cultura local.

ESTRUCTURA JSON OBLIGATORIA (12 campos):
{
  "titulo_guia": "Título motivador específico al tema y OA",
  "contexto_motivacional": "Breve narrativa que conecte el tema con intereses reales del grupo y situaciones de su entorno",
  "contexto_pedagogico_inclusivo": "Sentido del OA traducido a meta comprensible para estudiantes. Incluye posibles barreras de aprendizaje y participación.",
  "oa_a_trabajar": "OA completo sin deformar",
  "interpretacion_pedagogica": "Interpretación experta del OA: qué implica enseñarlo, qué desafíos pedagógicos presenta, por qué importa la diversidad de expresión",
  "habilidades": ["habilidad1", "habilidad2"], 
  "habilidades_sugeridas": ["si las habilidades del plan son inválidas"],
  "criterios_aprendizaje": ["criterio observable 1", "criterio observable 2"],
  "barreras_posibles": ["barrera concreta 1", "barrera concreta 2"],
  "nivel_apoyo": ["Actividad 1: modelaje docente con ejemplo concreto del OA, pictogramas/tarjetas visuales, elección entre 2-3 alternativas, respuesta oral o dibujo, frase iniciadora.", "Actividad 2...", "Actividad 3...", "Actividad 4: rutina breve de cierre."],
  "nivel_estandar": ["Actividad 1: exploración central de materiales/obras/producciones relacionadas con el tema.", "Actividad 2: producción o registro simple con modalidad elegida.", "Actividad 3: conversación guiada con criterios."],
  "nivel_desafio": ["Actividad 1: profundización sin adelantar curso.", "Actividad 2: creación o producción que conecte con identidad/cultura local.", "Actividad 3: retroalimentación entre pares."],
  "principios_dua": {
    "representacion": ["Estrategia concreta 1 para presentar la información"],
    "accion_expresion": ["Estrategia concreta 1 para que el estudiante demuestre aprendizaje"],
    "implicacion": ["Estrategia concreta 1 para motivar y dar sentido personal"]
  },
  "evaluacion_formativa_inclusiva": {
    "evidencias": ["Evidencia observable 1"],
    "preguntas_retroalimentacion": ["Pregunta específica 1"],
    "lista_cotejo": ["Criterio observable 1"],
    "opciones_respuesta": ["oral", "visual", "escrita breve", "corporal", "señalamiento"],
    "retroalimentacion_docente": ["Frase de retroalimentación positiva y específica 1"]
  },
  "adecuaciones_apoyos": ["Para dificultades lectoras: ...", "Para TEA: ...", "Para TDAH: ...", "Para dificultades de lenguaje: ...", "Para mayor avance: ..."],
  "cierre_inclusivo": ["Hoy descubrí...", "Mi favorito fue... porque...", "Una idea de un compañero que valoré fue...", "Puedo responder dibujando, hablando, escribiendo o señalando."]
}`;

const SYSTEM_PROMPT_LESSON =
  `Eres un profesor experto en pedagogia, psicologia cognitiva, neurociencias del aprendizaje y curriculo chileno MINEDUC. Generas el contenido completo de una clase que sea UTILIZABLE DIRECTAMENTE por un profesor en el aula.
${getProfePlanificAIContext()}
${getExpertContext()}

REGLAS DE VARIEDAD OBLIGATORIA EN CADA CLASE:
1. TIPOS DE PREGUNTAS: en cada clase debes usar al menos 5 tipos distintos de preguntas de la siguiente lista (nunca repetir el mismo tipo 2 veces seguidas):
   - Recordar: "Nombrа 3...", "Lista los...", "Completa: el primer paso es..."
   - Comprender: "Explica con tus palabras...", "Que quiere decir que...?", "Dibuja lo que entendiste..."
   - Aplicar: "Usa lo aprendido para resolver...", "Dame un ejemplo real de..."
   - Analizar: "Que tienen en comun X e Y?", "Por que crees que...?", "Que pasaria si eliminamos...?"
   - Evaluar: "Cual es mejor: A o B? Justifica", "Que opinas de...? Da 2 razones..."
   - Crear: "Disena tu propio...", "Crea una historia que use...", "Propone una solucion para..."

2. MODALIDADES DE APRENDIZAJE: en cada clase incluye al menos 3 modalidades distintas de las siguientes:
   - Visual (diagrama, imagen, esquema, mapa mental)
   - Auditiva (explicacion oral, audio, cancion, poema)
   - Kinestesica (movimiento, manipulacion, dramatizacion, construccion)
   - Lecto-escritura (lectura, escritura, organizador grafico)
   - Digital (app, video, busqueda web, creacion digital)
   - Social (pareja, grupo, tutoria entre pares)

3. ESTRATEGIA POR PERFIL NEURODIVERSO: en cada clase incluye al menos 1 adaptacion concreta para un perfil distinto:
   - TEA: agenda visual, instrucciones literales, timer visible, espacio calmado
   - TDAH: chunks de 3-5 min, movimiento integrado, cronometro, listas numeradas
   - Discalculia: material concreto, linea numerica, representacion visual antes de numeros
   - Disgrafia: alternativas a escritura larga (oral, dibujo, dictado)
   - Dificultades de lenguaje: instrucciones multimodales, tiempo de procesamiento, preguntas cerradas primero

4. VARIEDAD ESTRUCTURAL: no repitas la misma estructura de actividad 2 veces seguidas. Alterna entre: explicacion -> ejercicio -> juego -> reflexion -> produccion -> evaluacion -> descanso cognitivo.

DOMINIOS INTEGRADOS EN CADA CLASE:
1. CURRICULAR: cada actividad debe estar alineada a un OA especifico del nivel.
   Incluir al menos 1 referencia a una Habilidad Transversale OAT.
   La evaluacion debe ser coherente con el Decreto 67 (formativa + sumativa).

2. METODOLOGIAS ACTIVAS: transforma actividades estaticas en RUTAS DINAMICAS:
   - En vez de "leer y responder" -> "investiga, discute, propone"
   - Incluye fases del metodo elegido (ABP, Design Thinking, Indagacion)
   - El producto final debe ser algo que los estudiantes CREEN

3. MAKER/STEM: propone al menos 1 PRODUCTO TANGIBLE por clase:
   - Prototipo con materiales reciclados
   - Maqueta, poster digital (Canva), podcast, video corto
   - Codigo simple (Scratch para basica, Python para media)
   - Circuito electronico basico si aplica
   Detalla materiales necesarios, pasos de fabricacion, y criterios de exito.

4. INSTITUCIONAL: incluye sugerencias de como alinear con PEI/PME
   y extension a la comunidad (feria, exposicion, envio a municipio).

5. TECNOLOGICO: sugiere herramientas digitales especificas:
   Google Forms, Canva, Padlet, Scratch, Nearpod, etc.
   Incluye ALTERNATIVA NO DIGITAL para colegios sin connectivity.

REGLAS PARA CONTENIDO DE CLASE:
1. INICIO (activacion): Maximo 10-15 min. Activa conocimientos previos con una situacion concreta, problema real o pregunta provocadora del contexto chileno. NUNCA empieces con "Hoy veremos...". Usa una activacion que genere conflicto cognitivo o curiosidad.
2. DESARROLLO: Es el nucleo de la clase (30-40 min). Divide en 2-3 actividades concretas. Cada actividad debe especificar:
   - QUE hara el estudiante (accion observable, no "comprender" ni "reflexionar")
   - COMO se organiza (individual, parejas, grupos de 4, plenaria)
   - QUE producto observable producira (escrito, dibujo, modelo, presentacion)
   - CUANTO tiempo tomara
   Incluye modelado explicito del docente al inicio ("yo hago"), luego practica guiada ("hacemos juntos"), luego practica independiente ("tu haces").
3. CIERRE (sintesis): Maximo 10 min. Recuperacion activa (retrieval practice): el estudiante debe ARTICULAR verbalmente o por escrito que aprendio, NO el docente resumir. Usa preguntas como "Explica a un compañero...", "Ejemplo en tu vida real...", "Dibuja el concepto...".
4. RECURSOS: Lista especifica y concreta (no "material didactico" sino "cartulina A4, marcadores de colores, recortes de diario regional").
5. EVALUACION FORMATIVA: Must be observable and specific. No "observacion general" sino "registra en la rúbrica si el estudiante puede: (1) identificar X, (2) explicar Y con sus palabras, (3) aplicar Z en un ejemplo nuevo".
6. ADECUACIONES DUA: Incluye al menos 1 adaptacion especifica por nivel (apoyo/estandar/desafio) con estrategias concretas.

NUNCA uses:
- Actividades vagas: "dialogar", "comentar", "reflexionar", "compartir" sin especificar la accion concreta
- Frases motivacionales genericas: "tu puedes!", "se el mejor!"
- Jerga pedagogica en el texto del estudiante
- Evaluaciones que midan actitudes internas en vez de evidencias observables

Responde UNICAMENTE con un objeto JSON valido con esta estructura:
{ titulo, curso, asignatura, objetivoAprendizaje, habilidadBloom, inicio, desarrollo, cierre, recursos, evaluacionFormativa, adecuacionesDUA }
'inicio', 'desarrollo' y 'cierre' deben ser strings con la DESCRIPCION DETALLADA y CONCRETA de cada fase (minimo 200 caracteres cada uno). 'recursos' debe ser un arreglo de strings ESPECIFICOS. No incluyas explicaciones ni texto adicional fuera del JSON.`;

export function extractJsonFromText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let candidate = raw.trim();

  const mdMatch = candidate.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (mdMatch?.[1]) {
    candidate = mdMatch[1].trim();
  }

  const jsonStart = candidate.indexOf('{');
  const jsonEnd = candidate.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    candidate = candidate.substring(jsonStart, jsonEnd + 1);
  }

  return candidate;
}

// env.AI.run(...) con mensajes de chat puede resolver a un string plano o a
// { response: "<texto plano del modelo>" } — confirmado con evidencia real
// contra el servidor que, para el MISMO binding y modelo
// (@cf/meta/llama-3.2-3b-instruct), la forma varía de una llamada a otra de
// manera no determinista. Si .response ya es un string, hay que devolverlo
// tal cual: volver a hacerle JSON.stringify() lo escapa una segunda vez
// (comillas/backslashes) y rompe el JSON.parse posterior en
// extractJsonFromText. Solo se stringifica cuando .response no es un string
// (forma inesperada) o cuando el campo no existe.
export function resolveAIResponseText(response: unknown): string {
  if (typeof response === 'string') return response;
  if (typeof response === 'object' && response !== null) {
    const inner = (response as Record<string, unknown>).response;
    return typeof inner === 'string' ? inner : JSON.stringify(inner ?? response);
  }
  return String(response);
}

// Se agota cuando callAIConValidacion() reintentó maxReintentos veces y la
// IA nunca produjo una respuesta que pasara el schema. callAIConValidacion
// no conoce los fallbacks pedagógicos de cada dominio (cada engine tiene su
// propio buildFallback*()), así que en vez de inventar uno arroja este
// error: el caller ya tiene un try/catch alrededor de su llamada a la IA
// (mismo patrón que usaban antes de existir el retry) y solo necesita
// capturarlo y aplicar su propio fallback, como ya hacía.
export class AIValidationError extends Error {
  constructor(
    message: string,
    public readonly intentos: number,
    public readonly ultimoError: string,
  ) {
    super(message);
    this.name = 'AIValidationError';
  }
}

export interface CallAIConValidacionOptions {
  maxReintentos?: number;
  maxTokens?: number;
  temperature?: number;
  // Override puntual del modelo (default: MODEL, @cf/meta/llama-3.2-3b-instruct).
  // Ver RubricaEngine.ts: para su schema rico (criterios con 4 indicators c/u
  // + arrays de instrucciones), el modelo 3B falla sistemáticamente contra
  // Zod (confirmado contra el servidor real); el 70B ya usado por el
  // orchestrator de Mis Clases lo cumple al primer intento.
  model?: string;
}

// gemini-1.5-pro (pedido originalmente) ya no está disponible — retirado por
// Google. gemini-2.5-pro tampoco ("no longer available to new users") y su
// alias "gemini-pro-latest" (-> gemini-3.1-pro) devuelve limit:0 en el free
// tier de la API key real de esta cuenta — los modelos "pro" simplemente no
// están habilitados sin billing en Google Cloud. El alias "gemini-flash-latest"
// devolvió 503 (modelo preview saturado); "gemini-2.5-flash" fijo sí responde
// 200 contra el servidor real, con cupo gratuito y contexto largo (1M tokens).
const GEMINI_MODEL = 'gemini-2.5-flash';

// Llama a la API REST de Gemini (Google AI Studio) directamente por fetch,
// sin SDK — mismo criterio que env.AI.run(): un solo intento, sin retry
// propio (el retry vive en callAIConValidacion(), a nivel de proveedor).
// Devuelve el texto crudo envuelto en { response } — el mismo shape que ya
// entiende resolveAIResponseText(), así que callAIConValidacion() no
// necesita saber qué proveedor respondió.
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  opciones: { temperature: number; maxOutputTokens: number },
): Promise<{ response: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
      generationConfig: {
        temperature: opciones.temperature,
        maxOutputTokens: opciones.maxOutputTokens,
        // Sin esto, los modelos gemini-2.x gastan una porción no controlable
        // de maxOutputTokens en "thinking" interno antes del JSON visible —
        // confirmado contra el servidor real: la respuesta se cortaba a
        // mitad del JSON (contenido bueno, pero incompleto -> JSON inválido
        // -> fallback tras 3 reintentos). thinkingBudget: 0 lo desactiva.
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  const data = await res.json() as any;

  if (!res.ok) {
    throw new Error(`Gemini error ${res.status}: ${data?.error?.message ?? JSON.stringify(data)}`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
  if (!text) {
    const finishReason = data?.candidates?.[0]?.finishReason ?? 'desconocido';
    throw new Error(`Gemini no devolvió texto (finishReason: ${finishReason}).`);
  }

  return { response: text };
}

// Llama a env.AI.run(), valida la respuesta contra `schema` y, si falla
// (JSON inválido o schema.safeParse() rechaza), reintenta hasta
// maxReintentos veces (default 2, o sea 3 intentos en total) agregando al
// prompt los errores específicos de Zod para que el modelo se corrija en
// el siguiente intento. Es el mismo mecanismo de
// callWithSchemaValidation() en el orchestrator de main, pero reusando
// resolveAIResponseText() (ya probada contra el servidor real) en vez de
// la extracción de main, que tiene el mismo bug de doble-serialización
// repetido en 3 lugares distintos.
export async function callAIConValidacion<T>(
  env: AIEngineEnv,
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  opciones?: CallAIConValidacionOptions,
): Promise<{ data: T; usedFallback: false; intentos: number }> {
  const hayWorkersAI = !!env.AI;
  const hayGemini = !!env.GEMINI_API_KEY;

  if (!hayWorkersAI && !hayGemini) {
    throw new Error('AI no está configurado en el entorno.');
  }

  const maxReintentos = opciones?.maxReintentos ?? 2;
  const maxTokens = opciones?.maxTokens ?? 3000;
  const temperature = opciones?.temperature ?? 0.2;
  const model = opciones?.model ?? MODEL;
  const maxIntentos = maxReintentos + 1;

  let currentUserPrompt = userPrompt;
  let ultimoError = 'Sin detalle.';
  // Una vez que Workers AI falla (cupo agotado u otro error), se lo da por
  // no disponible para el resto de los intentos de esta misma llamada —
  // evita reintentar contra un proveedor que ya sabemos que va a seguir
  // fallando igual.
  let workersAIAgotado = false;

  for (let intento = 1; intento <= maxIntentos; intento++) {
    const messages = systemPrompt
      ? [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: currentUserPrompt },
        ]
      : [{ role: 'user' as const, content: currentUserPrompt }];

    let response: unknown;
    if (hayWorkersAI && !workersAIAgotado) {
      try {
        response = await env.AI.run(model, { messages, temperature, max_tokens: maxTokens });
      } catch (error) {
        // Cualquier fallo de Workers AI (no solo cupo agotado -- confirmado
        // que un error de cupo real, con "4006"/"neurons" en el mensaje, no
        // siempre coincidia con lo esperado aqui) cae a Gemini si esta
        // disponible, en vez de abortar toda la generacion. Gemini ya es un
        // proveedor confirmado funcional, asi que es estrictamente mejor
        // intentarlo que devolver el fallback generico sin ni probarlo.
        if (hayGemini) {
          workersAIAgotado = true;
          try {
            response = await callGemini(systemPrompt, currentUserPrompt, env.GEMINI_API_KEY!, {
              temperature,
              maxOutputTokens: maxTokens,
            });
          } catch (geminiError) {
            const workersMsg = error instanceof Error ? error.message : String(error);
            const geminiMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
            throw new Error(`Workers AI: ${workersMsg} | Gemini: ${geminiMsg}`);
          }
        } else {
          throw error;
        }
      }
    } else if (hayGemini) {
      response = await callGemini(systemPrompt, currentUserPrompt, env.GEMINI_API_KEY!, {
        temperature,
        maxOutputTokens: maxTokens,
      });
    } else {
      throw new Error('AI no está configurado en el entorno.');
    }

    const raw = resolveAIResponseText(response);
    const candidate = extractJsonFromText(raw);

    let parsedJson: unknown;
    try {
      if (!candidate) throw new Error('La respuesta no contenía JSON.');
      parsedJson = JSON.parse(candidate);
    } catch {
      ultimoError = 'La respuesta anterior no era JSON válido.';
      if (intento < maxIntentos) {
        currentUserPrompt = `${userPrompt}\n\n⚠️ REINTENTO ${intento}: Tu respuesta anterior NO era JSON válido. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones, sin texto antes o después del JSON.`;
      }
      continue;
    }

    const result = schema.safeParse(parsedJson);
    if (result.success) {
      return { data: result.data, usedFallback: false, intentos: intento };
    }

    const issues = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.length ? issue.path.join('.') : '(raíz)'}: ${issue.message}`);
    ultimoError = issues.join('; ');

    if (intento < maxIntentos) {
      currentUserPrompt = `${userPrompt}\n\n⚠️ REINTENTO ${intento}: Tu respuesta anterior tiene errores de estructura:\n  - ${issues.join('\n  - ')}\n\nCorrige TODOS los errores y responde ÚNICAMENTE con JSON válido que cumpla exactamente la estructura solicitada.`;
    }
  }

  throw new AIValidationError(
    `Validación de esquema falló tras ${maxIntentos} intentos: ${ultimoError}`,
    maxIntentos,
    ultimoError,
  );
}

function ensureStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`El campo ${fieldName} debe ser un arreglo de strings.`);
  }

  const normalized = value.map((item) => String(item).trim()).filter(Boolean);
  if (normalized.length === 0) {
    throw new Error(`El campo ${fieldName} no puede estar vacío.`);
  }

  return normalized;
}

function optionalStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function splitSkillText(value: string | undefined): string[] {
  return String(value || '')
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isInvalidSkill(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized === '-' || normalized === 'n/a' || normalized === 'undefined' || normalized === 'null' || normalized.length <= 1;
}

function normalizeSkills(plan: PedagogicalPlan): { skills: string[]; suggested: string[] } {
  const raw = [
    ...splitSkillText(plan.habilidades),
    ...(plan.habilidades_curriculares || []),
  ].map((skill) => skill.trim()).filter(Boolean);

  const valid = Array.from(new Set(raw.filter((skill) => !isInvalidSkill(skill))));

  if (valid.length > 0) {
    return { skills: valid, suggested: [] };
  }

  const text = `${plan.objetivo_aprendizaje} ${plan.asignatura} ${plan.tema}`.toLowerCase();
  const suggested = getSubjectSpecificSkills(text);

  return { skills: [], suggested };
}

function getSubjectSpecificSkills(text: string): string[] {
  if (text.includes('arte') || text.includes('visual') || text.includes('obra') || text.includes('pintura') || text.includes('dibujo')) {
    return ['observar elementos visuales', 'expresar preferencias estéticas', 'describir una creación artística', 'justificar decisiones creativas oralmente', 'comparar obras o técnicas'];
  }
  if (text.includes('lenguaje') || text.includes('lectura') || text.includes('escritura') || text.includes('comunicación')) {
    return ['comprender un texto', 'expresar ideas por escrito u oralmente', 'interpretar un mensaje', 'argumentar una opinión', 'escuchar y respetar turnos'];
  }
  if (text.includes('matemática') || text.includes('número') || text.includes('cálculo') || text.includes('geometría') || text.includes('medición')) {
    return ['resolver problemas numéricos', 'representar datos', 'argumentar procedimientos', 'comparar estrategias de resolución', 'comunicar resultados'];
  }
  if (text.includes('ciencia') || text.includes('naturaleza') || text.includes('célula') || text.includes('ecosistema') || text.includes('fuerza')) {
    return ['observar fenómenos naturales', 'describir procesos', 'formular hipótesis', 'comparar evidencias', 'explicar con evidencia'];
  }
  if (text.includes('historia') || text.includes('sociedad') || text.includes('geografía') || text.includes('ciudadanía') || text.includes('territorio')) {
    return ['analizar fuentes históricas', 'contextualizar eventos', 'argumentar con evidencia', 'comparar perspectivas', 'comunicar hallazgos'];
  }
  if (text.includes('inglés') || text.includes('english') || text.includes('idioma')) {
    return ['comprender vocabulario en contexto', 'expresar preferencias en inglés', 'comunicar ideas simples', 'escuchar y repetir', 'interpretar mensajes'];
  }
  if (text.includes('música') || text.includes('sonido') || text.includes('ritmo')) {
    return ['escuchar y diferenciar sonidos', 'expresar emociones con el cuerpo', 'crear patrones rítmicos', 'comparar obras musicales', 'justificar preferencias musicales'];
  }
  if (text.includes('educación física') || text.includes('deporte') || text.includes('movimiento') || text.includes('juego')) {
    return ['explorar movimientos', 'seguir instrucciones motoras', 'cooperar en equipos', 'regular emociones en el juego', 'experimentar nuevas habilidades motrices'];
  }
  return ['observar información relevante', 'describir ideas centrales', 'comparar evidencias', 'explicar con apoyo visual', 'justificar una respuesta'];
}

function normalizeCriteria(plan: PedagogicalPlan, skillsForCriteria: string[]): string[] {
  const rawCriteria = (plan.criterios_seleccionados || []).map((criterion) => criterion.trim()).filter(Boolean);
  const generic = rawCriteria.length === 0 || rawCriteria.every((criterion) => criterion.length < 12 || /^(leer|escribir|hablar|dibujar|participar)$/i.test(criterion));

  if (!generic) return rawCriteria;

  const text = `${plan.asignatura} ${plan.objetivo_aprendizaje} ${plan.tema}`.toLowerCase();
  return getSubjectSpecificCriteria(text, skillsForCriteria);
}

function getSubjectSpecificCriteria(text: string, skillsForCriteria: string[]): string[] {
  if (text.includes('arte') || text.includes('visual') || text.includes('obra') || text.includes('pintura') || text.includes('dibujo')) {
    return [
      'Expresa una preferencia personal frente a una obra, imagen o creación propia.',
      'Justifica su opinión usando al menos un elemento visual observable, como color, forma, línea o textura.',
      'Comunica sus ideas mediante oralidad, dibujo, señalamiento, apoyo visual o escritura emergente.',
      'Escucha y respeta las preferencias de sus pares durante la conversación guiada.',
    ];
  }
  if (text.includes('lenguaje') || text.includes('lectura') || text.includes('escritura') || text.includes('comunicación')) {
    return [
      'Comprende la idea central de un texto y la expresa con palabras propias.',
      'Participa en una conversación respetando turnos y diferentes puntos de vista.',
      'Usa vocabulario del tema para expresar una opinión o preferencia.',
      'Demuestra comprensión mediante una respuesta oral, escrita breve o visual.',
    ];
  }
  if (text.includes('matemática') || text.includes('número') || text.includes('cálculo') || text.includes('geometría')) {
    return [
      'Resuelve un problema aplicando una estrategia observable (dibujo, manipulación, cálculo).',
      'Argumenta su procedimiento usando vocabulario matemático básico.',
      'Representa datos o información de forma visual o numérica.',
      'Compara resultados con un par y justifica diferencias.',
    ];
  }
  if (text.includes('ciencia') || text.includes('naturaleza') || text.includes('célula') || text.includes('ecosistema')) {
    return [
      'Observa y describe un fenómeno o proceso usando vocabulario del tema.',
      'Formula una pregunta o hipótesis basada en evidencia observable.',
      'Compara resultados o características usando evidencia del material trabajado.',
      'Comunica sus hallazgos mediante una respuesta oral, visual o escrita breve.',
    ];
  }
  if (text.includes('historia') || text.includes('sociedad') || text.includes('geografía') || text.includes('ciudadanía')) {
    return [
      'Identifica causas o consecuencias de un evento usando evidencia del material.',
      'Compara diferentes perspectivas sobre un mismo hecho histórico o social.',
      'Justifica su opinión usando al menos un dato o ejemplo del contexto.',
      'Participa en el debate respetando diferentes puntos de vista.',
    ];
  }
  const firstSkill = skillsForCriteria[0] || 'el aprendizaje central del OA';
  return [
    `Comunica una idea relacionada con ${firstSkill} usando palabras propias o apoyo visual.`,
    'Usa evidencia del material trabajado para explicar su respuesta.',
    'Participa en la actividad respetando turnos y diferentes formas de expresión.',
    'Demuestra avance mediante una respuesta oral, visual, escrita breve o corporal.',
  ];
}

function buildDuaPrinciples(plan: PedagogicalPlan) {
  const isFirstGrade = /1[°º]\s*b[aá]sico/i.test(plan.curso);
  const isPreschool = /prekinder|kinder|parvularia/i.test(plan.curso);
  const isHighSchool = /media|1[1-4].*b[aá]sico/i.test(plan.curso);
  const asignatura = plan.asignatura;

  if (isPreschool || isFirstGrade) {
    return {
      representacion: [
        `Presentar el OA con imágenes grandes, objetos concretos, láminas y vocabulario clave de ${asignatura}.`,
        'Modelar con gestos, movimientos corporales y preguntas breves antes de pedir una respuesta.',
        'Repetir instrucciones en formato oral, visual y gestual, verificando comprensión con una señal simple (mostrar dedo, levantar mano, señalar imagen).',
      ],
      accion_expresion: [
        'Permitir responder hablando, dibujando, señalando, seleccionando tarjetas, manipulando objetos o usando gestos.',
        'Ofrecer frases iniciadoras en tarjetas y modelos visuales para estudiantes que requieren andamiaje.',
        'Aceptar evidencias equivalentes (dibujo, oralidad, selección) sin bajar la expectativa del OA.',
      ],
      implicacion: [
        'Dar opciones de elección de material (colores, texturas, imágenes) para conectar la tarea con intereses y entorno local.',
        'Usar trabajo en pareja con roles simples (observador/comunicador) para favorecer participación segura.',
        'Entregar retroalimentación positiva nombrando un logro específico: "Me gustó cómo elegiste este color porque...".',
      ],
    };
  }

  if (isHighSchool) {
    return {
      representacion: [
        `Presentar el OA con casos reales, documentos, datos estadísticos y fuentes primarias de ${asignatura}.`,
        'Usar organizadores conceptuales complejos, mapas de argumentación y ejemplos comparados.',
        'Ofrecer múltiples fuentes de información: texto, video, podcast, infografía para diferentes estilos de aprendizaje.',
      ],
      accion_expresion: [
        'Permitir responder mediante ensayo argumentado, presentación oral, infografía, podcast o propuesta de solución.',
        'Ofrecer rúbricas de autoevaluación y criterios claros para que el estudiante regule su propia producción.',
        'Aceptar evidencias diversas: análisis escrito, debate fundamentado, producto digital o mapa conceptual.',
      ],
      implicacion: [
        'Conectar el OA con problemáticas reales del entorno, identidad cultural o inquietudes personales del estudiante.',
        'Usar trabajo autónomo con elección de tema o enfoque para favorecer motivación intrínseca.',
        'Entregar retroalimentación orientada al siguiente paso con criterios disciplinares específicos.',
      ],
    };
  }

  return {
    representacion: [
      `Presentar el OA con imágenes, ejemplos concretos y vocabulario clave de ${asignatura}.`,
      'Usar organizadores gráficos y ejemplos comparados para anticipar la tarea.',
      'Repetir instrucciones en formato oral y visual, verificando comprensión con una señal simple.',
    ],
    accion_expresion: [
      'Permitir responder hablando, dibujando, señalando, seleccionando tarjetas o escribiendo frases breves.',
      'Ofrecer frases iniciadoras y modelos parciales para estudiantes que requieren andamiaje.',
      'Aceptar evidencias equivalentes sin bajar la expectativa del OA.',
    ],
    implicacion: [
      'Dar opciones de elección para conectar la tarea con intereses, identidad y entorno local.',
      'Usar trabajo en pareja o pequeño grupo con roles claros para favorecer participación segura.',
      'Entregar retroalimentación positiva, específica y orientada al siguiente paso.',
    ],
  };
}

function buildInclusiveAssessment() {
  return {
    evidencias: [
      'Observación directa de cómo el estudiante explica, señala, dibuja o justifica su respuesta.',
      'Producto breve de clase: dibujo, registro visual, frase oral grabada, ticket de salida o respuesta escrita corta.',
      'Participación en conversación guiada respetando turnos y preferencias de pares.',
    ],
    preguntas_retroalimentacion: [
      '¿Qué elemento te ayudó a decidir tu respuesta?',
      '¿Cómo podrías explicar tu idea con un dibujo, una palabra o un ejemplo?',
      '¿Qué apoyo necesitas para mostrar mejor lo que aprendiste?',
    ],
    lista_cotejo: [
      'Identifica o comunica una idea vinculada al OA.',
      'Usa un elemento observable o evidencia para justificar su respuesta.',
      'Elige una forma de expresión adecuada a sus posibilidades.',
      'Respeta y escucha respuestas distintas de sus pares.',
    ],
    opciones_respuesta: ['oral', 'visual', 'escrita breve', 'corporal', 'señalamiento con apoyo visual'],
    retroalimentacion_docente: [
      'Nombrar el logro específico antes de sugerir el siguiente paso.',
      'Usar frases como: “Lograste explicar tu idea usando un detalle; ahora intentemos agregar otro ejemplo”.',
    ],
  };
}

function validateDuaGuide(value: unknown): DuaGuide {
  if (!value || typeof value !== 'object') {
    throw new Error('La respuesta de IA no es un objeto.');
  }

  const record = value as Record<string, unknown>;
  const tituloGuia = String(record.titulo_guia || '').trim();

  if (!tituloGuia) {
    throw new Error('El campo titulo_guia es obligatorio.');
  }

  return {
    titulo_guia: tituloGuia,
    contexto_motivacional: String(record.contexto_motivacional || '').trim(),
    contexto_pedagogico_inclusivo: String(record.contexto_pedagogico_inclusivo || '').trim(),
    oa_a_trabajar: String(record.oa_a_trabajar || '').trim(),
    interpretacion_pedagogica: String(record.interpretacion_pedagogica || '').trim(),
    habilidades: optionalStringArray(record.habilidades),
    habilidades_sugeridas: optionalStringArray(record.habilidades_sugeridas),
    criterios_aprendizaje: optionalStringArray(record.criterios_aprendizaje),
    barreras_posibles: optionalStringArray(record.barreras_posibles),
    nivel_apoyo: ensureStringArray(record.nivel_apoyo, 'nivel_apoyo'),
    nivel_estandar: ensureStringArray(record.nivel_estandar, 'nivel_estandar'),
    nivel_desafio: ensureStringArray(record.nivel_desafio, 'nivel_desafio'),
    principios_dua: typeof record.principios_dua === 'object' && record.principios_dua !== null
      ? {
          representacion: optionalStringArray((record.principios_dua as Record<string, unknown>).representacion),
          accion_expresion: optionalStringArray((record.principios_dua as Record<string, unknown>).accion_expresion),
          implicacion: optionalStringArray((record.principios_dua as Record<string, unknown>).implicacion),
        }
      : undefined,
    evaluacion_formativa_inclusiva: typeof record.evaluacion_formativa_inclusiva === 'object' && record.evaluacion_formativa_inclusiva !== null
      ? {
          evidencias: optionalStringArray((record.evaluacion_formativa_inclusiva as Record<string, unknown>).evidencias),
          preguntas_retroalimentacion: optionalStringArray((record.evaluacion_formativa_inclusiva as Record<string, unknown>).preguntas_retroalimentacion),
          lista_cotejo: optionalStringArray((record.evaluacion_formativa_inclusiva as Record<string, unknown>).lista_cotejo),
          opciones_respuesta: optionalStringArray((record.evaluacion_formativa_inclusiva as Record<string, unknown>).opciones_respuesta),
          retroalimentacion_docente: optionalStringArray((record.evaluacion_formativa_inclusiva as Record<string, unknown>).retroalimentacion_docente),
        }
      : undefined,
    adecuaciones_apoyos: optionalStringArray(record.adecuaciones_apoyos),
    cierre_inclusivo: optionalStringArray(record.cierre_inclusivo),
  };
}

// Envuelve validateDuaGuide() (normalización + reglas de negocio ya
// probadas) en un schema Zod, sin duplicar su lógica: reusa la función tal
// cual y traduce el Error que lanza a un issue de Zod. Esto es lo que le
// permite a callAIConValidacion() reintentar generateDuaGuide con el
// mensaje de error específico en el prompt, en vez de ir directo al
// fallback ante el primer campo mal formado — el problema documentado
// para SYSTEM_PROMPT_DUA (12 campos, malformación frecuente del modelo).
const DuaGuideValidationSchema: z.ZodType<DuaGuide> = z.unknown().transform((value, ctx) => {
  try {
    return validateDuaGuide(value);
  } catch (error) {
    ctx.addIssue({
      code: 'custom',
      message: error instanceof Error ? error.message : 'La respuesta de IA no cumple la estructura esperada.',
    });
    return z.NEVER;
  }
});

function validateLessonContent(value: unknown): LessonContent {
  if (!value || typeof value !== 'object') {
    throw new Error('La respuesta de IA no es un objeto.');
  }

  const record = value as Record<string, unknown>;
  const titulo = String(record.titulo || '').trim();
  if (!titulo) throw new Error('El campo titulo es obligatorio.');

  return {
    titulo,
    curso: String(record.curso || '').trim(),
    asignatura: String(record.asignatura || '').trim(),
    objetivoAprendizaje: String(record.objetivoAprendizaje || '').trim(),
    habilidadBloom: String(record.habilidadBloom || '').trim(),
    inicio: String(record.inicio || '').trim(),
    desarrollo: String(record.desarrollo || '').trim(),
    cierre: String(record.cierre || '').trim(),
    recursos: ensureStringArray(record.recursos, 'recursos'),
    evaluacionFormativa: String(record.evaluacionFormativa || '').trim(),
    adecuacionesDUA: String(record.adecuacionesDUA || '').trim(),
  };
}

function buildFallbackDuaGuide(plan: PedagogicalPlan): DuaGuide {
  const oa = plan.objetivo_aprendizaje || plan.tema;
  const indicadores = (plan.indicadores_seleccionados || []).join('; ');
  const { skills, suggested } = normalizeSkills(plan);
  const skillsForCriteria = skills.length ? skills : suggested;
  const criterios = normalizeCriteria(plan, skillsForCriteria);
  const isFirstGrade = /1[°º]\s*b[aá]sico/i.test(plan.curso);
  const isPreschool = /prekinder|kinder|parvularia/i.test(plan.curso);
  const isHighSchool = /media|1[1-4].*b[aá]sico/i.test(plan.curso);
  const isLowerBasic = /[1-4][°º]\s*b[aá]sico/i.test(plan.curso);
  const theme = plan.tema || 'el tema de la clase';

  const barreras = [
    `Comprensión del vocabulario específico de ${plan.asignatura} y de las instrucciones de la tarea.`,
    'Dificultad para expresar preferencias, justificar ideas o participar oralmente frente al curso.',
    'Atención sostenida durante conversaciones o exploración de materiales.',
    'Dificultades lectoras o de escritura que pueden limitar la forma de mostrar aprendizaje.',
    'Acceso visual, sensorial o necesidad de anticipación para participar con seguridad.',
    'Baja confianza para opinar o tomar decisiones en actividades grupales.',
  ];

  const principios = buildDuaPrinciples(plan);
  const evaluacion = buildInclusiveAssessment();

  let nivelApoyo: string[];
  let nivelEstandar: string[];
  let nivelDesafio: string[];

  if (isPreschool || isFirstGrade) {
    nivelApoyo = [
      `Modelaje docente paso a paso: mostrar un ejemplo concreto de ${theme}, nombrar el vocabulario clave y pedir respuestas breves mediante señalamiento, oralidad o dibujo.`,
      'Usar pictogramas, tarjetas visuales y dos o tres alternativas de respuesta para que el estudiante elija, explique con apoyo y no dependa de escritura extensa.',
      'Trabajo en pareja con roles simples: un estudiante observa o selecciona evidencia y otro comunica la idea usando una frase iniciadora como "Yo pienso que... porque veo...".',
      'Cerrar con una rutina lúdica de 3 minutos: elegir una imagen, levantar una tarjeta de emoción o dibujar una respuesta rápida sobre lo que más le gustó.',
    ];
    nivelEstandar = [
      `Exploración central: presentar imágenes, objetos concretos o muestras relacionadas con ${theme} y guiar preguntas de observación: ¿qué veo?, ¿qué pienso?, ¿qué evidencia uso?`,
      `Producción simple: cada estudiante comunica una idea alineada al OA mediante una modalidad elegida —oral, dibujo, selección de tarjeta o señalamiento— y la comparte con un par.`,
      `Conversación guiada con criterios: comparar respuestas respetuosamente usando vocabulario visual del tema, como colores, formas o tamaños observables.`,
    ];
    nivelDesafio = [
      `Profundizar la justificación: pedir que el estudiante agregue un "por qué" adicional o compare su respuesta con la de un par usando al menos una palabra descriptiva.`,
      `Crear una mini galería o mural colectivo que conecte el aprendizaje con identidad, entorno cercano o cultura local del estudiante.`,
      `Formular una pregunta para otro grupo y retroalimentar con lenguaje respetuoso: "Me gustó tu idea porque..." o "Yo agregaría...".`,
    ];
  } else if (isLowerBasic) {
    nivelApoyo = [
      `Modelaje docente: mostrar un ejemplo completo vinculado a ${theme}, nombrar el vocabulario clave y modelar paso a paso la tarea.`,
      'Entregar tarjetas de palabras, organizadores gráficos simples y dos o tres alternativas de respuesta para guiar la producción.',
      'Trabajo en pareja con roles claros: uno busca evidencia en el material y otro comunica la idea usando una frase iniciadora.',
      'Usar señales visuales de avance (pasos numerados, iconos) para que el estudiante sepa en qué etapa está.',
    ];
    nivelEstandar = [
      `Exploración central: presentar materiales, imágenes o textos breves relacionados con ${theme} y guiar preguntas de observación y análisis.`,
      `Producción o registro simple: cada estudiante comunica una idea alineada al OA mediante una modalidad elegida y la comparte con un par.`,
      `Conversación guiada con criterios: comparar respuestas respetuosamente y justificar una preferencia usando un elemento observable del recurso trabajado.`,
    ];
    nivelDesafio = [
      `Profundizar la justificación: agregar un segundo argumento o comparar dos ejemplos sin cambiar el nivel curricular esperado.`,
      `Crear un producto visual, una explicación breve o un organizador que conecte el aprendizaje con identidad, cultura local o entorno cercano.`,
      `Formular una pregunta para otros grupos y retroalimentar con lenguaje respetuoso: "Valoro tu idea porque..." o "Podrías agregar...".`,
    ];
  } else if (isHighSchool) {
    nivelApoyo = [
      `Modelaje docente: presentar un caso o ejemplo completo de ${theme}, analizarlo paso a paso y explicitar el vocabulario disciplinar.`,
      'Entregar una guía de análisis con preguntas guiadas y un modelo parcial de respuesta para que el estudiante tenga una referencia clara.',
      'Trabajo en dupla con roles: uno analiza un aspecto y otro complementa, usando conectores y vocabulario del tema.',
      'Ofrecer alternativas de expresión: ensayo breve, presentación oral, infografía o mapa conceptual.',
    ];
    nivelEstandar = [
      `Exploración profunda: analizar fuentes, casos o producciones relacionadas con ${theme} usando preguntas de nivel superior (¿por qué?, ¿qué pasaría si...?).`,
      `Producción argumentada: cada estudiante construye una posición fundamentada usando evidencia del material trabajado y vocabulario disciplinar.`,
      `Debate guiado con criterios: confrontar perspectivas de manera respetuosa, usando conectores de causalidad, comparación y contraargumento.`,
    ];
    nivelDesafio = [
      `Investigación autónoma: profundizar un aspecto del tema con fuentes adicionales y presentar hallazgos al curso.`,
      `Crear un producto original (ensayo, podcast, infografía, propuesta) que conecte el aprendizaje con identidad, problemática social o cultura local.`,
      `Liderar una discusión o taller breve para pares, formulando preguntas de análisis crítico y retroalimentando respuestas.`,
    ];
  } else {
    nivelApoyo = [
      `Modelaje docente paso a paso: mostrar un ejemplo concreto vinculado a ${theme}, nombrar el vocabulario clave y pedir respuestas breves.`,
      'Usar organizadores gráficos, tarjetas de palabras y dos o tres alternativas de respuesta para guiar la producción.',
      'Trabajo en pareja con roles simples: uno busca evidencia y otro comunica la idea usando una frase iniciadora.',
      'Ofrecer un modelo parcial de respuesta para que el estudiante lo complete con sus propias palabras.',
    ];
    nivelEstandar = [
      `Exploración central: presentar materiales, textos o producciones relacionadas con ${theme} y guiar preguntas de observación y análisis.`,
      `Producción o registro: cada estudiante comunica una idea alineada al OA mediante una modalidad elegida y la comparte con un par.`,
      `Conversación guiada con criterios: comparar respuestas respetuosamente y justificar una preferencia usando evidencia del recurso trabajado.`,
    ];
    nivelDesafio = [
      `Profundizar la justificación: agregar un segundo argumento, comparar dos ejemplos o analizar un contraejemplo sin cambiar el nivel curricular.`,
      `Crear un producto que conecte el aprendizaje con identidad, cultura local o entorno cercano del estudiante.`,
      `Formular preguntas de análisis para otros grupos y retroalimentar con lenguaje respetuoso y fundamentado.`,
    ];
  }

  return {
    titulo_guia: `Guía Multinivel DUA: ${theme} — ${plan.asignatura} (${plan.curso})`,
    contexto_motivacional: `La guía propone que el curso se acerque a "${theme}" desde experiencias concretas, visuales y participativas, conectando el OA con intereses del grupo y con situaciones reconocibles de su escuela o comunidad.`,
    contexto_pedagogico_inclusivo: `El OA se trabaja como una oportunidad para que cada estudiante comprenda, comunique y demuestre aprendizaje por distintas vías. La meta en lenguaje estudiante es: "puedo observar, pensar y comunicar una idea sobre ${theme} usando apoyos que me ayuden a participar". ${indicadores ? `Se consideran estos indicadores: ${indicadores}.` : ''} Las barreras identificadas incluyen comprensión del vocabulario, dificultad para expresar preferencias, atención sostenida, dificultades de escritura y acceso visual o sensorial.`,
    oa_a_trabajar: oa,
    interpretacion_pedagogica: `Este OA requiere que la clase no se limite a repetir contenidos: debe ofrecer experiencias modeladas, conversación guiada y evidencias flexibles para que estudiantes con diferentes ritmos puedan acceder al mismo propósito curricular. La diversidad de expresión no baja la expectativa, sino que amplía las formas legítimas de demostrar aprendizaje.`,
    habilidades: skills,
    habilidades_sugeridas: suggested,
    criterios_aprendizaje: criterios,
    barreras_posibles: barreras,
    nivel_apoyo: nivelApoyo,
    nivel_estandar: nivelEstandar,
    nivel_desafio: nivelDesafio,
    principios_dua: principios,
    evaluacion_formativa_inclusiva: evaluacion,
    adecuaciones_apoyos: [
      'Dificultades lectoras o de escritura: reducir copia, leer consignas en voz alta, entregar banco de palabras y aceptar respuesta oral o visual.',
      'TEA: anticipar la secuencia, explicitar duración, ofrecer opción de trabajo individual/pareja y reducir sobrecarga sensorial.',
      'TDAH: dividir la tarea en pasos cortos, usar señales visuales de avance y permitir pausas activas breves.',
      'Dificultades de lenguaje: ofrecer frases iniciadoras, tiempo de espera y apoyo con imágenes o gestos.',
      'Mayor avance: pedir justificación más detallada, comparación entre ejemplos o apoyo como tutor par sin transformar al estudiante en ayudante permanente.',
    ],
    cierre_inclusivo: [
      'Hoy descubrí...',
      'Mi favorito fue... porque...',
      'Una idea de un compañero/a que valoré fue...',
      'Puedo responder dibujando, hablando, escribiendo una frase breve o señalando una tarjeta.',
    ],
  };
}

function enrichDuaGuide(guide: DuaGuide, plan: PedagogicalPlan): DuaGuide {
  const fallback = buildFallbackDuaGuide(plan);
  const hasUsableSkills = [...(guide.habilidades || []), ...(guide.habilidades_sugeridas || [])].some((skill) => !isInvalidSkill(skill));

  const aiCriterios = (guide.criterios_aprendizaje || []).filter((c) => c && c.trim().length > 3);
  const fallbackCriterios = fallback.criterios_aprendizaje;
  const finalCriterios = aiCriterios.length >= 2
    ? aiCriterios
    : fallbackCriterios.length >= 2
      ? fallbackCriterios
      : [...aiCriterios, ...fallbackCriterios].filter((c) => c && c.trim().length > 3);

  return {
    ...fallback,
    ...guide,
    contexto_motivacional: guide.contexto_motivacional || fallback.contexto_motivacional,
    contexto_pedagogico_inclusivo: guide.contexto_pedagogico_inclusivo || fallback.contexto_pedagogico_inclusivo,
    oa_a_trabajar: guide.oa_a_trabajar || fallback.oa_a_trabajar,
    interpretacion_pedagogica: guide.interpretacion_pedagogica || fallback.interpretacion_pedagogica,
    habilidades: hasUsableSkills ? (guide.habilidades || []).filter((skill) => !isInvalidSkill(skill)) : fallback.habilidades,
    habilidades_sugeridas: hasUsableSkills ? guide.habilidades_sugeridas || [] : fallback.habilidades_sugeridas,
    criterios_aprendizaje: finalCriterios,
    barreras_posibles: guide.barreras_posibles?.length ? guide.barreras_posibles : fallback.barreras_posibles,
    principios_dua: guide.principios_dua?.representacion?.length && guide.principios_dua.accion_expresion?.length && guide.principios_dua.implicacion?.length
      ? guide.principios_dua
      : fallback.principios_dua,
    evaluacion_formativa_inclusiva: guide.evaluacion_formativa_inclusiva?.evidencias?.length
      ? guide.evaluacion_formativa_inclusiva
      : fallback.evaluacion_formativa_inclusiva,
    adecuaciones_apoyos: guide.adecuaciones_apoyos?.length ? guide.adecuaciones_apoyos : fallback.adecuaciones_apoyos,
    cierre_inclusivo: guide.cierre_inclusivo?.length ? guide.cierre_inclusivo : fallback.cierre_inclusivo,
  };
}

function buildFallbackLessonContent(plan: PedagogicalPlan): LessonContent {
  return {
    titulo: plan.tema,
    curso: plan.curso,
    asignatura: plan.asignatura,
    objetivoAprendizaje: plan.objetivo_aprendizaje,
    habilidadBloom: plan.taxonomia_bloom_sugerida,
    inicio: plan.estructura_clase.inicio.descripcion,
    desarrollo: plan.estructura_clase.desarrollo.descripcion,
    cierre: plan.estructura_clase.cierre.descripcion,
    recursos: ['Pizarra o proyector', 'Material de la asignatura', 'Cuaderno del estudiante'],
    evaluacionFormativa: 'Pregunta de verificación al cierre de la clase para comprobar comprensión del objetivo.',
    adecuacionesDUA: 'Ofrecer opciones de representación (visual, auditiva, kinestésica) y flexibilidad en la presentación de evidencias.',
  };
}

async function callAI(
  env: AIEngineEnv,
  systemPrompt: string,
  plan: PedagogicalPlan,
): Promise<string> {
  if (!env.AI) {
    throw new Error('AI no está configurado en el entorno.');
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: JSON.stringify(plan, null, 2) },
  ];

  const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages,
    temperature: 0.2,
    max_tokens: 2500,
  });

  return resolveAIResponseText(response);
}

export class AIEngine {
  static async generateDuaGuide(env: AIEngineEnv, plan: PedagogicalPlan): Promise<DuaGuide> {
    try {
      const { data } = await callAIConValidacion(
        env,
        SYSTEM_PROMPT_DUA,
        JSON.stringify(plan, null, 2),
        DuaGuideValidationSchema,
        { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', maxTokens: 3000 },
      );
      const result = enrichDuaGuide(data, plan);

      if (!result.criterios_aprendizaje || result.criterios_aprendizaje.length < 2) {
        const fallbackCriterios = buildFallbackDuaGuide(plan).criterios_aprendizaje;
        result.criterios_aprendizaje = result.criterios_aprendizaje?.length
          ? [...result.criterios_aprendizaje, ...fallbackCriterios].filter((c) => c && c.trim().length > 3)
          : fallbackCriterios;
      }

      return result;
    } catch (error) {
      console.error('[AIEngine] generateDuaGuide error:', error);
      return buildFallbackDuaGuide(plan);
    }
  }

  static async generateLessonContent(
    env: AIEngineEnv,
    plan: PedagogicalPlan,
  ): Promise<LessonContent> {
    try {
      const raw = await callAI(env, SYSTEM_PROMPT_LESSON, plan);
      const parsed = extractJsonFromText(raw);
      if (!parsed) {
        console.warn('[AIEngine] generateLessonContent: respuesta vacía, usando fallback');
        return buildFallbackLessonContent(plan);
      }

      const parsedJson = JSON.parse(parsed) as unknown;
      return validateLessonContent(parsedJson);
    } catch (error) {
      console.error('[AIEngine] generateLessonContent error:', error);
      return buildFallbackLessonContent(plan);
    }
  }
}

export function generateDuaGuide(env: AIEngineEnv, plan: PedagogicalPlan): Promise<DuaGuide> {
  return AIEngine.generateDuaGuide(env, plan);
}

export function generateLessonContent(
  env: AIEngineEnv,
  plan: PedagogicalPlan,
): Promise<LessonContent> {
  return AIEngine.generateLessonContent(env, plan);
}
