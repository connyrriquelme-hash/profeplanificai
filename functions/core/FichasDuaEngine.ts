import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv, DuaGuide } from './types';
import { inferRangoEtario } from './pedagogicalUtils';
import {
  FichasDuaSchema,
  type FichaDiferenciada,
  type FichasDua,
} from '../_lib/ai/schemas/fichasDuaSchema';

export type { FichaDiferenciada, FichasDua } from '../_lib/ai/schemas/fichasDuaSchema';

export interface FichasDuaEngineOptions {
  level: string;
  subject: string;
  topic: string;
}

type Nivel = 'apoyo' | 'estandar' | 'desafio';

const NIVEL_LABELS: Record<Nivel, string> = {
  apoyo: 'Apoyo',
  estandar: 'Estándar',
  desafio: 'Desafío',
};

const NIVEL_AUTOEVALUACION: Record<Nivel, string[]> = {
  apoyo: [
    'Puedo explicar con mis palabras qué aprendí hoy.',
    'Todavía necesito ayuda con...',
  ],
  estandar: [
    'Puedo explicar qué aprendí sobre el tema.',
    '¿Qué parte me costó más y por qué?',
  ],
  desafio: [
    'Puedo justificar mi respuesta con al menos un argumento.',
    '¿Qué agregaría para profundizar más este tema?',
  ],
};

// ─── Capa 2: fallback determinista ───
// Arma las fichas directo desde duaGuide.nivel_apoyo/estandar/desafio (ya
// generados por AIEngine.generateDuaGuide), sin volver a llamar a la IA.
// No inventa contenido nuevo: reformatea lo que el DuaGuide ya trae.

function nivelActividadesFuente(duaGuide: DuaGuide, nivel: Nivel): string[] {
  if (nivel === 'apoyo') return duaGuide.nivel_apoyo;
  if (nivel === 'estandar') return duaGuide.nivel_estandar;
  return duaGuide.nivel_desafio;
}

function buildFallbackFicha(nivel: Nivel, duaGuide: DuaGuide, opciones: FichasDuaEngineOptions): FichaDiferenciada {
  const topic = opciones.topic || duaGuide.oa_a_trabajar || duaGuide.titulo_guia || 'el tema de la clase';
  const habilidades = (duaGuide.habilidades?.length ? duaGuide.habilidades : duaGuide.habilidades_sugeridas) || [];
  const criterios = duaGuide.criterios_aprendizaje || [];
  const terminosFuente = habilidades.length ? habilidades : criterios;

  const vocabularioClave = terminosFuente
    .slice(0, 3)
    .map((termino) => ({
      termino: termino.length > 60 ? `${termino.slice(0, 57)}...` : termino,
      definicion: `Palabra clave relacionada con ${topic}, trabajada en esta ficha de nivel ${NIVEL_LABELS[nivel].toLowerCase()}.`,
    }));

  let relleno = 1;
  while (vocabularioClave.length < 2) {
    vocabularioClave.push({
      termino: `Concepto ${relleno}`,
      definicion: `Idea importante para comprender ${topic}.`,
    });
    relleno += 1;
  }

  const actividadesFuente = nivelActividadesFuente(duaGuide, nivel);
  const actividades = (actividadesFuente.length ? actividadesFuente : [`Trabaja el tema "${topic}" siguiendo las indicaciones del docente.`])
    .slice(0, 6)
    .map((instruccion) => ({ instruccion, espacioRespuesta: true }));

  return {
    nivel,
    titulo: `Ficha de ${NIVEL_LABELS[nivel]}: ${topic}`,
    objetivo: duaGuide.oa_a_trabajar || duaGuide.contexto_pedagogico_inclusivo || topic,
    vocabularioClave,
    actividades,
    autoevaluacion: NIVEL_AUTOEVALUACION[nivel],
  };
}

function buildFallbackFichas(duaGuide: DuaGuide, opciones: FichasDuaEngineOptions): FichasDua {
  return {
    apoyo: buildFallbackFicha('apoyo', duaGuide, opciones),
    estandar: buildFallbackFicha('estandar', duaGuide, opciones),
    desafio: buildFallbackFicha('desafio', duaGuide, opciones),
  };
}

// ─── Prompt ───

function buildSystemPrompt(level: string): string {
  const rangoEtario = inferRangoEtario(level);

  return `Eres una educadora diferencial chilena, experta en Diseño Universal para el Aprendizaje (DUA), que transforma una guía DUA ya generada en 3 fichas de trabajo imprimibles para estudiantes: una de Apoyo, una Estándar y una de Desafío.

ADAPTACIÓN POR EDAD (usa exactamente este rango, no otro):
${rangoEtario}

REGLAS OBLIGATORIAS:
1. Recibirás el contexto de una guía DUA YA GENERADA (nivel_apoyo, nivel_estandar, nivel_desafio, criterios de aprendizaje y habilidades). NO inventes un tema nuevo: usa ese contexto tal cual para construir las 3 fichas.
2. El campo "objetivo" de cada ficha debe ser el OA reformulado en lenguaje apropiado para ESE nivel específico (más guiado en apoyo, más autónomo en desafío) — nunca copies el mismo texto literal en las 3 fichas.
3. "vocabularioClave" debe tener entre 2 y 4 términos ESPECÍFICOS al tema (nunca genéricos como "concepto" o "idea"), cada uno con una definición breve en lenguaje simple y apropiado al rango etario indicado.
4. "actividades" debe reformular las actividades de nivel_apoyo/nivel_estandar/nivel_desafio del contexto en instrucciones breves, accionables, en segunda persona ("Observa...", "Escribe...", "Dibuja...", "Compara..."), marcando "espacioRespuesta" en true cuando el estudiante debe escribir o dibujar una respuesta, y false cuando la actividad es solo oral, de observación o de movimiento.
5. "autoevaluacion" debe tener entre 2 y 3 preguntas en primera persona del estudiante ("Puedo...", "Me costó...", "Todavía necesito..."), adaptadas al nivel de la ficha. Nunca en segunda ni tercera persona.
6. NUNCA repitas el mismo vocabulario, las mismas actividades ni la misma autoevaluación en las 3 fichas — cada nivel debe ser distinto y coherente con su propósito (apoyo = muy guiado, estándar = actividad central, desafío = profundización sin adelantar curso).
7. Cuando una actividad necesite un ejemplo, persona o lugar, usa nombres chilenos (Sofía, Mateo, Javiera) y lugares reconocibles (el Mercado Central, la Cordillera de los Andes, una feria del barrio) en vez de ejemplos genéricos internacionales.
8. Responde ÚNICAMENTE con JSON válido, sin markdown ni explicaciones externas.

ESTRUCTURA JSON OBLIGATORIA:
{
  "apoyo": { "nivel": "apoyo", "titulo": "Ficha de Apoyo: [tema real]", "objetivo": "...", "vocabularioClave": [{"termino": "...", "definicion": "..."}], "actividades": [{"instruccion": "...", "espacioRespuesta": true}], "autoevaluacion": ["...", "..."] },
  "estandar": { "nivel": "estandar", "titulo": "Ficha Estándar: [tema real]", "objetivo": "...", "vocabularioClave": [...], "actividades": [...], "autoevaluacion": [...] },
  "desafio": { "nivel": "desafio", "titulo": "Ficha de Desafío: [tema real]", "objetivo": "...", "vocabularioClave": [...], "actividades": [...], "autoevaluacion": [...] }
}`;
}

function buildUserPrompt(duaGuide: DuaGuide, opciones: FichasDuaEngineOptions): string {
  return JSON.stringify(
    {
      nivel_curso: opciones.level,
      asignatura: opciones.subject,
      tema: opciones.topic,
      oa: duaGuide.oa_a_trabajar,
      titulo_guia: duaGuide.titulo_guia,
      criterios_aprendizaje: duaGuide.criterios_aprendizaje || [],
      habilidades: duaGuide.habilidades?.length ? duaGuide.habilidades : duaGuide.habilidades_sugeridas || [],
      nivel_apoyo: duaGuide.nivel_apoyo,
      nivel_estandar: duaGuide.nivel_estandar,
      nivel_desafio: duaGuide.nivel_desafio,
    },
    null,
    2,
  );
}

// ─── Capa 3: enrich — usa la ficha de la IA por nivel solo si trae contenido
// utilizable; si un nivel viene débil, ese nivel puntual cae al fallback en
// vez de descartar las otras dos fichas que sí pasaron. ───

function isUsableFicha(ficha: FichaDiferenciada | undefined): ficha is FichaDiferenciada {
  return !!ficha
    && ficha.vocabularioClave.length >= 2
    && ficha.actividades.length >= 2
    && ficha.autoevaluacion.length >= 2;
}

function enrichFichas(ai: FichasDua, fallback: FichasDua): FichasDua {
  return {
    apoyo: isUsableFicha(ai.apoyo) ? ai.apoyo : fallback.apoyo,
    estandar: isUsableFicha(ai.estandar) ? ai.estandar : fallback.estandar,
    desafio: isUsableFicha(ai.desafio) ? ai.desafio : fallback.desafio,
  };
}

// ─── Punto de entrada único ───
// Mismo patrón que generateGuia (GuiaEngine.ts:265-296): fallback
// determinista primero (a partir del DuaGuide ya generado, sin volver a
// llamar a la IA desde cero), intento IA con el modelo 70B, enrich por
// nivel si tiene éxito, catch → fallback completo.

export async function generateFichasDua(
  env: AIEngineEnv,
  duaGuide: DuaGuide,
  opciones: FichasDuaEngineOptions,
): Promise<FichasDua & { usedFallback: boolean }> {
  const fallback = buildFallbackFichas(duaGuide, opciones);

  try {
    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(opciones.level),
      buildUserPrompt(duaGuide, opciones),
      FichasDuaSchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', maxTokens: 3000 },
    );
    return { ...enrichFichas(data, fallback), usedFallback: false };
  } catch (error) {
    console.error('[FichasDuaEngine] generateFichasDua error:', error);
    return { ...fallback, usedFallback: true };
  }
}
