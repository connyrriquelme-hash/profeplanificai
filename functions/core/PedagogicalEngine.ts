import type { CurriculumObjectiveRow, PedagogicalEngineEnv, PedagogicalPlan } from './types';

export interface PedagogicalEngineInput {
  nivel: string;
  asignatura: string;
  tema: string;
}

const BLOOM_KEYWORDS: Record<string, string[]> = {
  'Recordar': ['recordar', 'definir', 'nombrar', 'listar', 'identificar'],
  'Comprender': ['comprender', 'explicar', 'describir', 'resumir', 'interpretar'],
  'Aplicar': ['aplicar', 'resolver', 'utilizar', 'demonstrar', 'calcular'],
  'Analizar': ['analizar', 'comparar', 'diferenciar', 'examinar', 'clasificar'],
  'Evaluar': ['evaluar', 'argumentar', 'justificar', 'crític', 'juzgar'],
  'Crear': ['crear', 'diseñar', 'proponer', 'construir', 'desarrollar'],
};

function inferBloomLevel(habilidades: string, descripcion: string): string {
  const text = `${habilidades} ${descripcion}`.toLowerCase();
  const scores: [string, number][] = [];

  for (const [level, keywords] of Object.entries(BLOOM_KEYWORDS)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > 0) scores.push([level, score]);
  }

  if (scores.length === 0) return 'Comprender y Analizar';
  scores.sort((a, b) => b[1] - a[1]);
  const top = scores[0][0];
  const second = scores.length > 1 ? scores[1][0] : null;
  return second ? `${top} y ${second}` : top;
}

export class PedagogicalEngine {
  static async buildPlan(
    env: PedagogicalEngineEnv,
    nivel: string,
    asignatura: string,
    tema: string,
  ): Promise<PedagogicalPlan> {
    if (!env.CORE_DB) {
      throw new Error('CORE_DB no está configurado en el entorno.');
    }

    const normalizedNivel = nivel.trim();
    const normalizedAsignatura = asignatura.trim();
    const normalizedTema = tema.trim();

    if (!normalizedNivel || !normalizedAsignatura || !normalizedTema) {
      throw new Error('nivel, asignatura y tema son obligatorios.');
    }

    let objective: CurriculumObjectiveRow | null = null;

    try {
      const keywords = normalizedTema
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);

      if (keywords.length > 0) {
        const likeClauses = keywords.map(() => 'LOWER(oa.descripcion) LIKE ?').join(' OR ');
        const likeBindings = keywords.map((kw) => `%${kw}%`);

        objective = await env.CORE_DB.prepare(
          `SELECT
            oa.codigo_oa,
            oa.descripcion,
            oa.habilidades_csv,
            u.titulo AS unidad_titulo
          FROM objetivos_aprendizaje oa
          INNER JOIN unidades u ON u.id = oa.unidad_id
          INNER JOIN asignaturas a ON a.id = u.asignatura_id
          INNER JOIN niveles n ON n.id = a.nivel_id
          WHERE TRIM(n.nombre) = ?
            AND TRIM(a.nombre) = ?
            AND (${likeClauses})
          ORDER BY u.numero ASC, oa.codigo_oa ASC
          LIMIT 1`,
        )
          .bind(normalizedNivel, normalizedAsignatura, ...likeBindings)
          .first<CurriculumObjectiveRow>();
      }
    } catch {
      // If keyword search fails, fall through to default query
    }

    if (!objective) {
      try {
        objective = await env.CORE_DB.prepare(
          `SELECT
            oa.codigo_oa,
            oa.descripcion,
            oa.habilidades_csv,
            u.titulo AS unidad_titulo
          FROM objetivos_aprendizaje oa
          INNER JOIN unidades u ON u.id = oa.unidad_id
          INNER JOIN asignaturas a ON a.id = u.asignatura_id
          INNER JOIN niveles n ON n.id = a.nivel_id
          WHERE TRIM(n.nombre) = ?
            AND TRIM(a.nombre) = ?
          ORDER BY u.numero ASC, oa.codigo_oa ASC
          LIMIT 1`,
        )
          .bind(normalizedNivel, normalizedAsignatura)
          .first<CurriculumObjectiveRow>();
      } catch (err) {
        throw new Error(
          `Error al consultar CORE_DB: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (!objective) {
      throw new Error(`No se encontró OA para ${normalizedNivel} / ${normalizedAsignatura}.`);
    }

    const bloom = inferBloomLevel(objective.habilidades_csv, objective.descripcion);

    return {
      tema: normalizedTema,
      curso: normalizedNivel,
      asignatura: normalizedAsignatura,
      objetivo_aprendizaje: `${objective.codigo_oa}: ${objective.descripcion}`,
      habilidades: objective.habilidades_csv,
      taxonomia_bloom_sugerida: bloom,
      estructura_clase: {
        inicio: {
          tiempo_minutos: 15,
          descripcion: `Activar conocimientos previos sobre ${normalizedTema} y conectar con la unidad "${objective.unidad_titulo}".`,
        },
        desarrollo: {
          tiempo_minutos: 60,
          descripcion: `Desarrollar actividades guiadas y colaborativas para abordar ${objective.codigo_oa}, usando observación, modelos y preguntas de análisis.`,
        },
        cierre: {
          tiempo_minutos: 15,
          descripcion: 'Sintetizar aprendizajes, verificar comprensión del objetivo y registrar una evidencia breve de salida.',
        },
      },
    };
  }
}

export function buildPedagogicalPlan(
  env: PedagogicalEngineEnv,
  input: PedagogicalEngineInput,
): Promise<PedagogicalPlan> {
  return PedagogicalEngine.buildPlan(env, input.nivel, input.asignatura, input.tema);
}
