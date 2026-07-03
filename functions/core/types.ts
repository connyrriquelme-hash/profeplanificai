export interface LessonStage {
  tiempo_minutos: number;
  descripcion: string;
}

export interface PedagogicalPlan {
  tema: string;
  objetivo_aprendizaje: string;
  habilidades: string;
  taxonomia_bloom_sugerida: string;
  estructura_clase: {
    inicio: LessonStage;
    desarrollo: LessonStage;
    cierre: LessonStage;
  };
}

export interface PedagogicalEngineEnv {
  CORE_DB: D1Database;
}

export interface AIEngineEnv {
  AI: Ai;
}

export interface DuaGuide {
  titulo_guia: string;
  contexto_motivacional: string;
  nivel_apoyo: string[];
  nivel_estandar: string[];
  nivel_desafio: string[];
}

export interface CurriculumObjectiveRow {
  codigo_oa: string;
  descripcion: string;
  habilidades_csv: string;
  unidad_titulo: string;
}
