export interface LessonStage {
  tiempo_minutos: number;
  descripcion: string;
}

export interface PedagogicalPlan {
  tema: string;
  curso: string;
  asignatura: string;
  objetivo_aprendizaje: string;
  habilidades: string;
  taxonomia_bloom_sugerida: string;
  indicadores_seleccionados?: string[];
  criterios_seleccionados?: string[];
  habilidades_curriculares?: string[];
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

export interface LessonContent {
  titulo: string;
  curso: string;
  asignatura: string;
  objetivoAprendizaje: string;
  habilidadBloom: string;
  inicio: string;
  desarrollo: string;
  cierre: string;
  recursos: string[];
  evaluacionFormativa: string;
  adecuacionesDUA: string;
}

export interface DuaGuide {
  titulo_guia: string;
  contexto_motivacional: string;
  contexto_pedagogico_inclusivo?: string;
  oa_a_trabajar?: string;
  interpretacion_pedagogica?: string;
  habilidades?: string[];
  habilidades_sugeridas?: string[];
  criterios_aprendizaje?: string[];
  barreras_posibles?: string[];
  nivel_apoyo: string[];
  nivel_estandar: string[];
  nivel_desafio: string[];
  principios_dua?: {
    representacion: string[];
    accion_expresion: string[];
    implicacion: string[];
  };
  evaluacion_formativa_inclusiva?: {
    evidencias: string[];
    preguntas_retroalimentacion: string[];
    lista_cotejo: string[];
    opciones_respuesta: string[];
    retroalimentacion_docente: string[];
  };
  adecuaciones_apoyos?: string[];
  cierre_inclusivo?: string[];
}

export interface CurriculumObjectiveRow {
  codigo_oa: string;
  descripcion: string;
  habilidades_csv: string;
  unidad_titulo: string;
}
