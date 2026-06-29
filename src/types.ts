export type Provider = 'local' | 'gemini' | 'openrouter' | 'huggingface';

export interface AIConfig {
  provider: Provider;
  model: string;
  apiKey: string;
}

export interface PlanFormData {
  nivel: string;
  asignatura: string;
  duracion: string;
  enfoque: string;
  oa: string;
  contexto: string;
  extra: string;
}

export interface PlanData {
  id: string;
  tipoPlan: string;
  titulo: string;
  nivel: string;
  asignatura: string;
  curso: string;
  eje: string;
  oa: string;
  indicador: string;
  tema: string;
  duracion: string;
  estudiantes: number;
  contexto: string;
  necesidades: string;
  recursos: string;
  tipoClase: string;
  tono: string;
  contenido: string;
  texto: string;
  timestamp: number;
}

export interface RecursoFormData {
  tipo: string;
  nivel: string;
  asignatura: string;
  oa: string;
  necesidad: string;
}

export interface RecursoData {
  id: string;
  tipoRecurso: string;
  titulo: string;
  nivel: string;
  asignatura: string;
  oa: string;
  contenido: string;
  texto: string;
  tema?: string;
  timestamp: number;
}

export interface EvalFormData {
  tipo: string;
  nivel: string;
  asignatura: string;
  nPreguntas: number;
  dificultad: string;
  oa: string;
  texto: string;
}

export interface EvalData {
  id: string;
  tipoEval: string;
  titulo: string;
  nivel: string;
  asignatura: string;
  oa: string;
  tema: string;
  habilidad: string;
  dificultad: string;
  nPreg: number;
  incluirAlternativas: string;
  incluirDesarrollo: string;
  incluirPauta: string;
  incluirRetroalimentacion: string;
  incluirTabla: string;
  incluirDUA: string;
  contenido: string;
  texto: string;
  timestamp: number;
}

export interface MaterialItem {
  id: string;
  tipo: 'planificacion' | 'recurso' | 'evaluacion' | 'rubrica' | 'ticket' | 'simce';
  titulo: string;
  contenido: string;
  nivel: string;
  asignatura: string;
  oa: string;
  fecha: string;
  etiquetas: string[];
}

export interface MaterialSaved {
  id: string;
  titulo: string;
  tipo: MaterialItem['tipo'];
  contenido: string;
  nivel: string;
  asignatura: string;
  oa: string;
  fecha: string;
  etiquetas: string[];
  tema?: string;
}

export interface BankEntry {
  id: string;
  title: string;
  tag: string;
  text: string;
  date: string;
}

export interface CurriculumItem {
  id: string;
  fuente: 'ejemplo_editable' | 'docente' | 'oficial' | 'oficial_importado' | 'docente_personalizado';
  nivel: 'Educación Parvularia' | 'Educación Básica' | 'Educación Media';
  curso: string;
  asignatura: string;
  eje: string;
  oa: string;
  habilidad: string;
  indicadores: string[];
  conocimientos: string[];
  actitudes: string[];
  palabrasClave: string[];
  actividadesSugeridas: string[];
  evaluacionesSugeridas: string[];
  recursos: string[];
}

export interface OAData {
  id: string;
  codigo: string;
  nivel: string;
  asig: string;
  eje: string;
  oa: string;
  desc: string;
  habilidad: string;
  habs: string[];
  indicadores: string[];
  palabrasClave: string[];
  esEjemplo: boolean;
}

export interface OAEntry {
  id: string;
  codigo: string;
  nivel: string;
  asignatura: string;
  descripcion: string;
  habilidades: string[];
  indicadores: string[];
}

export const CURSOS = [
  'Prekinder', 'Kinder',
  '1° básico', '2° básico', '3° básico', '4° básico',
  '5° básico', '6° básico', '7° básico', '8° básico',
  '1° medio', '2° medio', '3° medio', '4° medio',
];

export const EJES_POR_ASIGNATURA: Record<string, string[]> = {
  'Lenguaje y Comunicación': ['Lectura', 'Escritura', 'Comunicación Oral'],
  'Matemática': ['Números', 'Álgebra', 'Geometría', 'Datos y Azar'],
  'Ciencias Naturales': ['Ciencias de la Vida', 'Ciencias Físicas', 'Química', 'Astronomía'],
  'Historia, Geografía y Cs Sociales': ['Historia', 'Geografía', 'Formación Ciudadana'],
  'Inglés': ['Comprensión Lectora', 'Expresión Oral', 'Expresión Escrita'],
  'Artes Visuales': ['Expresión Artística', 'Apreciación Estética'],
  'Música': ['Lenguaje Musical', 'Apreciación Musical'],
  'Educación Física': ['Motricidad', 'Vida Saludable'],
  'Tecnología': ['Alfabetización Digital', 'Pensamiento Computacional'],
  'Orientación': ['Crecimiento Personal', 'Convivencia'],
  'Lenguaje Verbal': ['Comunicación Oral'],
  'Pensamiento Matemático': ['Números y Operaciones'],
  'Exploración del Entorno': ['Exploración'],
  'Identidad y Autonomía': ['Formación Personal'],
  'Expresión Artística': ['Expresión Artística'],
  'Corporalidad y Movimiento': ['Motricidad'],
  'Lenguaje Artístico': ['Lenguaje Artístico'],
  'Convivencia y Ciudadanía': ['Formación Ciudadana'],
  'Interdisciplinario': ['General'],
};

export interface CollaborationPost {
  id: string;
  usuario: string;
  titulo: string;
  contenido: string;
  tipo: string;
  nivel: string;
  asignatura: string;
  fecha: string;
  likes: number;
  comentarios: Comentario[];
}

export interface Comentario {
  id: string;
  usuario: string;
  texto: string;
  fecha: string;
}

export interface DriveItem {
  id: string;
  nombre: string;
  tipo: string;
  contenido: string;
  nivel: string;
  asignatura: string;
  oa?: string;
  carpetaId?: string | null;
  fecha: string;
  tamano?: number;
}

export interface DriveFolder {
  id: string;
  nombre: string;
  timestamp: number;
}

export interface CursoData {
  id: string;
  nombre: string;
  nivel: string;
  asignatura: string;
  estudiantes: number;
  timestamp: number;
}

export interface EstudianteData {
  id: string;
  nombre: string;
  cursoId: string;
  observaciones: string;
  timestamp: number;
}

export type ViewType =
  | 'dashboard'
  | 'workspace'
  | 'generador'
  | 'evaluaciones'
  | 'banco'
  | 'banco-recursos'
  | 'agente'
  | 'biblioteca-creativa'
  | 'panel-compartido'
  | 'unidades-didacticas'
  | 'reportes'
  | 'admin'
  | 'print';

export type SharedDocumentPermission = 'view' | 'comment' | 'edit';
export type SharedDocumentRole = 'owner' | 'editor' | 'viewer' | 'commenter';
export type SharedDocumentVisibility = 'private' | 'shared' | 'public';

export interface SharedDocumentCollaborator {
  id: string;
  documentId: string;
  email: string;
  role: SharedDocumentRole;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface SharedDocumentComment {
  id: string;
  documentId: string;
  userId: string;
  authorName: string;
  comment: string;
  createdAt: string;
}

export interface SharedDocumentVersion {
  id: string;
  documentId: string;
  content: string;
  editedBy: string;
  createdAt: string;
}

export interface SharedDocument {
  id: string;
  ownerUserId: string;
  ownerName: string;
  title: string;
  content: string;
  sourceType: string;
  sourceId: string;
  shareToken: string;
  visibility: SharedDocumentVisibility;
  permission: SharedDocumentPermission;
  collaborators: SharedDocumentCollaborator[];
  comments: SharedDocumentComment[];
  createdAt: string;
  updatedAt: string;
}

export const NIVELES = [
  'Prekinder', 'Kinder',
  '1° básico', '2° básico', '3° básico', '4° básico',
  '5° básico', '6° básico', '7° básico', '8° básico',
  '1° medio', '2° medio', '3° medio', '4° medio',
];

export const ASIGNATURAS = [
  'Lenguaje Verbal', 'Lenguaje Artístico', 'Exploración del Entorno Natural',
  'Identidad y Autonomía', 'Convivencia y Ciudadanía',
  'Lenguaje y Comunicación', 'Matemática',
  'Ciencias Naturales', 'Historia, Geografía y Cs. Sociales',
  'Inglés', 'Artes Visuales', 'Música',
  'Educación Física', 'Tecnología', 'Orientación', 'Interdisciplinario',
];

export const DURACIONES = [
  '45 minutos', '60 minutos', '90 minutos',
  '2 clases de 45 minutos', 'Unidad de 4 clases',
];

export const ENFOQUES = [
  'Comprensión lectora', 'Aprendizaje colaborativo',
  'Proyecto interdisciplinario', 'DUA e inclusión',
  'Preparación SIMCE', 'Evaluación formativa',
];

export const RECURSOS_TIPOS = [
  { v: 'guia', l: 'Guía de aprendizaje' },
  { v: 'ficha', l: 'Ficha de trabajo' },
  { v: 'ppt', l: 'Presentación tipo PPT' },
  { v: 'gamificada', l: 'Actividad gamificada' },
  { v: 'lectura', l: 'Actividad de lectura' },
  { v: 'matematica', l: 'Actividad matemática' },
  { v: 'interdisciplinaria', l: 'Actividad interdisciplinaria' },
  { v: 'dua', l: 'Recurso DUA' },
  { v: 'rezago', l: 'Actividad para rezago' },
  { v: 'inicio_rapido', l: 'Actividad de inicio rápido' },
  { v: 'cierre', l: 'Actividad de cierre' },
  { v: 'ticket', l: 'Ticket de salida' },
  { v: 'banco_preguntas', l: 'Banco de preguntas' },
  { v: 'pauta', l: 'Pauta de corrección' },
  { v: 'rubrica', l: 'Rúbrica' },
  { v: 'cotejo', l: 'Lista de cotejo' },
  { v: 'apoderados', l: 'Recurso para apoderados' },
  { v: 'guion_docente', l: 'Guion docente' },
];

export const EVAL_TIPOS = [
  { v: 'diagnostica', l: 'Evaluación diagnóstica' },
  { v: 'formativa', l: 'Evaluación formativa' },
  { v: 'sumativa', l: 'Evaluación sumativa' },
  { v: 'simce', l: 'Evaluación tipo SIMCE' },
  { v: 'simce_breve', l: 'Ensayo SIMCE breve' },
  { v: 'banco_preguntas', l: 'Banco de preguntas' },
  { v: 'rubrica', l: 'Rúbrica analítica' },
  { v: 'holistica', l: 'Rúbrica holística' },
  { v: 'cotejo', l: 'Lista de cotejo' },
  { v: 'escala', l: 'Escala de apreciación' },
  { v: 'ticket', l: 'Ticket de salida' },
  { v: 'autoevaluacion', l: 'Autoevaluación' },
  { v: 'coevaluacion', l: 'Coevaluación' },
  { v: 'retroalimentacion', l: 'Retroalimentación automática' },
];

export const PLAN_TIPOS = [
  { v: 'clase', l: 'Planificación de clase' },
  { v: 'unidad', l: 'Secuencia de unidad' },
];

export const SI_NO = [{ v: 'si', l: 'Sí' }, { v: 'no', l: 'No' }];

export const DIFICULTADES = [
  'Progresiva', 'Básica', 'Intermedia', 'Avanzada',
];

export const HABILIDADES = [
  'Localizar información',
  'Inferir',
  'Interpretar',
  'Argumentar',
  'Resolver problemas',
  'Aplicar',
  'Analizar',
  'Crear',
  'Comunicar',
  'Comparar',
  'Evaluar',
];

export const ESTILOS_REC = [
  'Formal', 'Creativo', 'Gamificado', 'SIMCE', 'Aula invertida',
];

export const FORMATOS_SALIDA = [
  'Docente y estudiante', 'Solo docente', 'Solo estudiante',
];

export const TONOS_PLAN = [
  'Formal', 'Semi-formal', 'Coloquial', 'Directo',
];

export const TIPOS_CLASE = [
  'Inicio', 'Desarrollo', 'Cierre', 'Mixta',
];

export const SUGERENCIAS_OA: Record<string, string[]> = {
  'Lenguaje Verbal': [
    'Expresarse oralmente con claridad usando vocabulario variado en situaciones cotidianas.',
    'Comprender mensajes orales sencillos y seguir instrucciones verbales de dos a tres pasos.',
    'Descubrir sonidos iniciales y finales de palabras mediante juegos de conciencia fonológica.',
    'Disfrutar de la literatura infantil escuchando cuentos, poemas y fábulas.',
    'Iniciar la escritura de palabras significativas mediante copia o escritura espontánea.',
  ],
  'Pensamiento Matemático': [
    'Establecer relaciones de correspondencia, clasificación y seriación con material concreto.',
    'Reconocer y nombrar números hasta el 20, cuantificar colecciones y resolver problemas simples.',
    'Reconocer figuras geométricas básicas en objetos del entorno.',
    'Medir objetos usando unidades no convencionales como pasos, manos o lápices.',
  ],
  'Lenguaje y Comunicación': [
    'Leer y comprender textos narrativos adecuados al nivel, localizando información explícita e infiriendo información simple.',
    'Desarrollar vocabulario a partir de palabras nuevas en textos orales y escritos.',
    'Escribir respuestas completas usando mayúscula, punto y conectores simples.',
    'Expresar opiniones sobre personajes, hechos o información del texto con fundamento.',
  ],
  'Matemática': [
    'Resolver problemas usando estrategias de conteo, representación pictórica, concreta y simbólica.',
    'Comunicar procedimientos matemáticos de forma oral, escrita y con representaciones.',
    'Identificar patrones, regularidades y relaciones numéricas en situaciones cotidianas.',
  ],
  'Ciencias Naturales': [
    'Observar, comparar y comunicar características de seres vivos, materiales o fenómenos naturales.',
    'Formular predicciones simples y registrar evidencias mediante tablas o dibujos.',
  ],
  'Historia, Geografía y Cs. Sociales': [
    'Ubicar acontecimientos en secuencias temporales y reconocer cambios y continuidades.',
    'Leer fuentes, imágenes o mapas simples para obtener información y responder preguntas.',
  ],
  'Interdisciplinario': [
    'Integrar lectura, resolución de problemas y comunicación oral en un desafío contextualizado.',
    'Crear un producto colaborativo que evidencie comprensión y aplicación de contenidos.',
  ],
  'Exploración del Entorno Natural': [
    'Explorar y describir elementos y seres vivos del entorno natural manifestando curiosidad.',
    'Reconocer cambios en la naturaleza como estaciones y crecimiento de plantas.',
  ],
  'Identidad y Autonomía': [
    'Reconocer emociones básicas en sí mismo y en los demás, expresándolas de manera regulada.',
    'Desarrollar autonomía en rutinas diarias y seguir normas simples de convivencia.',
  ],
};

export type NivelApoyo = 'bajo' | 'medio' | 'alto';
export type FocoApoyo = 'lectura' | 'escritura' | 'comprensión' | 'cálculo' | 'atención' | 'lenguaje oral' | 'motricidad' | 'convivencia';
export type FormatoApoyo = 'visual' | 'oral' | 'manipulativo' | 'digital' | 'colaborativo';

export interface AdaptacionConfig {
  nivelApoyo: NivelApoyo;
  focoApoyo: FocoApoyo;
  formato: FormatoApoyo;
  tiempoAdicional: boolean;
  simplificacion: boolean;
  evalAlternativa: boolean;
}

export interface AdaptacionResult {
  estandar: string;
  simplificada: string;
  apoyoVisual: string;
  colaborativo: string;
  profundizacion: string;
  sugerenciasDocente: string;
  criteriosLogro: string;
}

export interface AutoSuggestion {
  proposito: string;
  habilidadPrincipal: string;
  indicadores: string[];
  tipoActividad: string;
  instrumentoEvaluacion: string;
  criteriosLogro: string[];
  recursosSugeridos: string[];
  adecuacionesDUA: string[];
}

export interface ReportConfig {
  schoolName: string;
  subject: string;
  teacher: string;
  course: string;
  reportDate: string;
  maxScore: number;
  minGrade: number;
  requiredPercentage: number;
}

export interface ReportIndicator {
  id: string;
  oaCode: string;
  description: string;
  maxPoints: number;
}

export interface StudentScore {
  studentId: string;
  indicatorScores: Record<string, number>;
}

export interface StudentData {
  id: string;
  name: string;
  run: string;
  observations: string;
}

export type NivelLogro = 'Adecuado' | 'Elemental' | 'Insuficiente' | 'No evaluado';

export interface StudentReportResult {
  studentId: string;
  totalScore: number;
  percentage: number;
  grade: number;
  nivelLogro: NivelLogro;
}
