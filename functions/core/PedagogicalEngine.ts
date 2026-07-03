import type { CurriculumObjectiveRow, PedagogicalEngineEnv, PedagogicalPlan } from './types';

export interface PedagogicalEngineInput {
  nivel: string;
  asignatura: string;
  tema: string;
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

    const objective = await env.CORE_DB.prepare(
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

    if (!objective) {
      throw new Error(`No se encontró OA para ${normalizedNivel} / ${normalizedAsignatura}.`);
    }

    return {
      tema: normalizedTema,
      objetivo_aprendizaje: `${objective.codigo_oa}: ${objective.descripcion}`,
      habilidades: objective.habilidades_csv,
      taxonomia_bloom_sugerida: 'Comprender y Analizar',
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
