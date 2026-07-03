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

export interface DuaGuide {
  titulo_guia: string;
  contexto_motivacional: string;
  nivel_apoyo: string[];
  nivel_estandar: string[];
  nivel_desafio: string[];
}

export interface CopilotProjectResult {
  ok: boolean;
  plan: PedagogicalPlan;
  duaGuide: DuaGuide;
  data: PedagogicalPlan & DuaGuide;
}
