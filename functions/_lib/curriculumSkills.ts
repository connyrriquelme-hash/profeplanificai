interface Env {
  DB: D1Database;
}

export interface CurricularSkill {
  id: string;
  code: string;
  name: string;
  description: string | null;
  nivel_desde: string | null;
  nivel_hasta: string | null;
  actividades_principales_json: string | null;
  source_type: string;
}

export interface Habilidad {
  id: string;
  nombre: string;
  asignatura_id: string;
  curricular_skill_id: string | null;
  descripcion: string | null;
  unidad_numero: number | null;
  keywords_json: string | null;
}

export interface SkillWithUnits extends CurricularSkill {
  unidades: Habilidad[];
}

export async function getCurricularSkillsByLevelAndSubject(
  env: Env,
  nivel: string,
  asignatura: string,
): Promise<SkillWithUnits[]> {
  const skills = await env.DB.prepare(`
    SELECT id, code, name, description, nivel_desde, nivel_hasta,
           actividades_principales_json, source_type
    FROM curricular_skills
    WHERE nivel_desde <= ? AND nivel_hasta >= ?
    ORDER BY code
  `).bind(nivel, nivel).all<CurricularSkill>();

  const result: SkillWithUnits[] = [];
  for (const skill of skills.results) {
    const unidades = await env.DB.prepare(`
      SELECT id, nombre, asignatura_id, curricular_skill_id, descripcion,
             unidad_numero, keywords_json
      FROM habilidades
      WHERE curricular_skill_id = ?
        AND (asignatura_id = (SELECT id FROM asignaturas WHERE nombre = ? LIMIT 1)
             OR asignatura_id IS NULL)
      ORDER BY unidad_numero
    `).bind(skill.id, asignatura).all<Habilidad>();

    result.push({ ...skill, unidades: unidades.results });
  }

  return result;
}

export async function getSkillsForObjective(
  env: Env,
  objectiveId: string,
): Promise<SkillWithUnits[]> {
  const linked = await env.DB.prepare(`
    SELECT DISTINCT cs.id, cs.code, cs.name, cs.description, cs.nivel_desde,
           cs.nivel_hasta, cs.actividades_principales_json, cs.source_type
    FROM curricular_skills cs
    JOIN habilidades h ON h.curricular_skill_id = cs.id
    JOIN oa_habilidades_curriculares oac ON oac.habilidad_id = h.id
    WHERE oac.objetivo_id = ?
  `).bind(objectiveId).all<CurricularSkill>();

  const result: SkillWithUnits[] = [];
  for (const skill of linked.results) {
    const unidades = await env.DB.prepare(`
      SELECT id, nombre, asignatura_id, curricular_skill_id, descripcion,
             unidad_numero, keywords_json
      FROM habilidades
      WHERE curricular_skill_id = ?
        AND id IN (
          SELECT habilidad_id FROM oa_habilidades_curriculares WHERE objetivo_id = ?
        )
      ORDER BY unidad_numero
    `).bind(skill.id, objectiveId).all<Habilidad>();

    result.push({ ...skill, unidades: unidades.results });
  }

  return result;
}

export async function linkSkillsToObjectives(env: Env): Promise<number> {
  const keywordMap: Record<string, string[]> = {
    'hab_len_lectura': ['lectura', 'interpretar', 'texto', 'leer', 'comprensión', 'biblioteca'],
    'hab_len_escritura': ['escribir', 'producir', 'redactar', 'escritura', 'borrador', 'texto'],
    'hab_len_comunicacion_oral': ['oral', 'diálogo', 'exposición', 'hablar', 'escuchar', 'presentación'],
    'hab_len_investigacion': ['investigar', 'fuentes', 'información', 'buscar', 'seleccionar'],
    'hab_mat_resolver_problemas': ['resolver', 'problema', 'calcular', 'operar', 'solución', 'estrategia'],
    'hab_mat_argumentar_comunicar': ['argumentar', 'justificar', 'explicar', 'comunicar', 'razonamiento'],
    'hab_mat_modelar': ['modelar', 'función', 'gráfico', 'representar', 'situación'],
    'hab_mat_representar': ['representar', 'esquema', 'pictórico', 'simbólico', 'diagrama'],
    'hab_cie_observar_preguntar': ['observar', 'pregunta', 'hipótesis', 'explorar', 'natural'],
    'hab_cie_planificar_investigar': ['investigar', 'experimento', 'variable', 'diseño', 'datos'],
    'hab_cie_procesar_evidencia': ['datos', 'evidencia', 'tabla', 'gráfico', 'analizar', 'resultado'],
    'hab_cie_evaluar_comunicar': ['comunicar', 'presentar', 'conclusiones', 'evaluar', 'hallazgo'],
    'hab_his_pensamiento_temporal_espacial': ['temporal', 'espacial', 'tiempo', 'espacio', 'mapa', 'cronología'],
    'hab_his_analisis_fuentes': ['fuentes', 'fuente', 'documento', 'análisis', 'primaria', 'secundaria'],
    'hab_his_pensamiento_critico': ['crítico', 'argumento', 'prejuicio', 'causas', 'consecuencias', 'perspectiva'],
  };

  let linked = 0;

  const allSkills = await env.DB.prepare(`
    SELECT h.id as habilidad_id, h.keywords_json, h.asignatura_id, a.nombre as asignatura_name
    FROM habilidades h
    LEFT JOIN asignaturas a ON a.id = h.asignatura_id
    WHERE h.keywords_json IS NOT NULL
  `).all<{ habilidad_id: string; keywords_json: string; asignatura_id: string; asignatura_name: string }>();

  const objectives = await env.DB.prepare(`
    SELECT id, codigo, descripcion, nivel, asignatura
    FROM objetivos_aprendizaje
  `).all<{ id: string; codigo: string; descripcion: string; nivel: string; asignatura: string }>();

  for (const obj of objectives.results) {
    const desc = (obj.descripcion || '').toLowerCase();
    const codigo = (obj.codigo || '').toLowerCase();
    const text = `${desc} ${codigo}`;

    for (const skill of allSkills.results) {
      const keywords: string[] = JSON.parse(skill.keywords_json || '[]');
      let matches = false;

      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) {
          matches = true;
          break;
        }
      }

      if (matches) {
        const id = `oac-${obj.id}-${skill.habilidad_id}`;
        try {
          await env.DB.prepare(`
            INSERT OR IGNORE INTO oa_habilidades_curriculares (id, objetivo_id, habilidad_id, match_source, confidence, rationale)
            VALUES (?, ?, ?, 'keyword_match', 0.6, 'Matched by keyword')
          `).bind(id, obj.id, skill.habilidad_id).run();
          linked++;
        } catch {
          // skip duplicates
        }
      }
    }
  }

  return linked;
}
