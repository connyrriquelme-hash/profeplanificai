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

export interface ClassContent {
  titulo_clase: string;
  actividades_inicio: string[];
  actividades_desarrollo: string[];
  actividades_cierre: string[];
  materiales_sugeridos: string[];
}

export interface CopilotProjectResult {
  ok: boolean;
  plan: PedagogicalPlan;
  contenido: ClassContent;
  data: PedagogicalPlan & ClassContent;
}
