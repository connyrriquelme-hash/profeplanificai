import type { CurriculumObjectiveRow, PedagogicalEngineEnv, PedagogicalPlan } from './types';

export interface CurriculumContext {
  objectiveId?: string;
  objectiveCode?: string;
  objectiveText?: string;
  indicators?: string[];
  skills?: string[];
  criteria?: string[];
  curricularSkills?: string[];
}

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

function buildObjectiveFromSelectedContext(
  curriculumContext: CurriculumContext | undefined,
  tema: string,
): CurriculumObjectiveRow | null {
  const objectiveCode = curriculumContext?.objectiveCode?.trim();
  const objectiveText = curriculumContext?.objectiveText?.trim();

  if (!objectiveCode || !objectiveText) return null;

  const selectedSkills = [
    ...(curriculumContext?.skills || []),
    ...(curriculumContext?.curricularSkills || []),
  ].map((skill) => skill.trim()).filter(Boolean);

  return {
    codigo_oa: objectiveCode,
    descripcion: objectiveText,
    habilidades_csv: selectedSkills.length ? selectedSkills.join(', ') : 'Habilidades asociadas al OA seleccionado',
    unidad_titulo: `Unidad relacionada con ${tema}`,
  };
}

export class PedagogicalEngine {
  static async buildPlan(
    env: PedagogicalEngineEnv,
    nivel: string,
    asignatura: string,
    tema: string,
    curriculumContext?: CurriculumContext,
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

    if (curriculumContext?.objectiveCode) {
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
            AND oa.codigo_oa = ?
          LIMIT 1`,
        )
          .bind(normalizedNivel, normalizedAsignatura, curriculumContext.objectiveCode)
          .first<CurriculumObjectiveRow>();
      } catch (err) {
        objective = buildObjectiveFromSelectedContext(curriculumContext, normalizedTema);
        if (!objective) {
          throw new Error(
            `Error al consultar el OA seleccionado en CORE_DB: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      if (!objective) {
        objective = buildObjectiveFromSelectedContext(curriculumContext, normalizedTema);
        if (!objective) {
          throw new Error(`No se encontró el OA seleccionado ${curriculumContext.objectiveCode} para ${normalizedNivel} / ${normalizedAsignatura}.`);
        }
      }
    }

    if (!objective) {
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

    const skills = curriculumContext?.skills?.length
      ? curriculumContext.skills.join(', ')
      : objective.habilidades_csv;

    const indicatorsText = curriculumContext?.indicators?.length
      ? `\nIndicadores de evaluación:\n${curriculumContext.indicators.map(i => `- ${i}`).join('\n')}`
      : '';

    const criteriaText = curriculumContext?.criteria?.length
      ? `\nCriterios de aprendizaje:\n${curriculumContext.criteria.map(c => `- ${c}`).join('\n')}`
      : '';

    const curricularSkillsText = curriculumContext?.curricularSkills?.length
      ? curriculumContext.curricularSkills.join(', ')
      : '';

    const allSkills = [skills, curricularSkillsText].filter(Boolean).join(', ');

    return {
      tema: normalizedTema,
      curso: normalizedNivel,
      asignatura: normalizedAsignatura,
      objetivo_aprendizaje: `${objective.codigo_oa}: ${objective.descripcion}`,
      habilidades: allSkills || skills,
      taxonomia_bloom_sugerida: bloom,
      ...(indicatorsText ? { indicadores_seleccionados: curriculumContext!.indicators } : {}),
      ...(criteriaText ? { criterios_seleccionados: curriculumContext!.criteria } : {}),
      ...(curricularSkillsText ? { habilidades_curriculares: curriculumContext!.curricularSkills } : {}),
      estructura_clase: {
        inicio: {
          tiempo_minutos: 15,
          descripcion: `Activar conocimientos previos sobre ${normalizedTema} y conectar con la unidad "${objective.unidad_titulo}".${indicatorsText}${criteriaText}`,
        },
        desarrollo: {
          tiempo_minutos: 60,
          descripcion: `Desarrollar actividades guiadas y colaborativas para abordar ${objective.codigo_oa}, usando observación, modelos y preguntas de análisis.${skills ? ` Incorporar habilidades: ${skills}.` : ''}`,
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
