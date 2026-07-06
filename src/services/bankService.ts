import { api } from './apiClient';

export interface BankResource {
  id: string;
  user_id: string;
  title: string;
  type: string;
  source: string;
  content: string;
  level: string;
  subject: string;
  objective_code: string;
  objective_text: string;
  skill: string;
  metadata_json: string;
  created_at: string;
  updated_at: string;
}

export type SourceTab = 'clase' | 'recursos_ia' | 'evaluacion' | 'actividades';

interface SaveToBankParams {
  title: string;
  type: string;
  content: string;
  source?: string;
  sourceTab?: SourceTab;
  lessonId?: string;
  classId?: string;
  classTitle?: string;
  level?: string;
  subject?: string;
  objectiveCode?: string;
  objectiveText?: string;
  skill?: string;
  indicators?: string[];
  criteria?: string[];
  generatedWith?: string;
  warnings?: string[];
}

export async function saveToBank(params: SaveToBankParams): Promise<BankResource | null> {
  try {
    const metadata: Record<string, string> = {};
    if (params.sourceTab) metadata.sourceTab = params.sourceTab;
    if (params.lessonId) metadata.lessonId = params.lessonId;
    if (params.classId) metadata.classId = params.classId;
    if (params.classTitle) metadata.classTitle = params.classTitle;
    if (params.generatedWith) metadata.generatedWith = params.generatedWith;
    if (params.warnings?.length) metadata.warnings = params.warnings.join('; ');
    if (params.indicators?.length) metadata.indicators = params.indicators.join(' | ');
    if (params.criteria?.length) metadata.criteria = params.criteria.join(' | ');
    if (params.level) metadata.level = params.level;
    if (params.subject) metadata.subject = params.subject;
    if (params.objectiveCode) metadata.objectiveCode = params.objectiveCode;
    if (params.objectiveText) metadata.objectiveText = params.objectiveText;

    const result = await api.post<{ data: BankResource }>('/api/resources', {
      title: params.title,
      type: params.type,
      source: params.source || 'mis_clases',
      content: params.content,
      level: params.level || '',
      subject: params.subject || '',
      objectiveCode: params.objectiveCode || '',
      objectiveText: params.objectiveText || '',
      skill: params.skill || '',
      metadata,
    });

    return result.data || null;
  } catch (err) {
    console.error('[bankService] saveToBank error:', err);
    return null;
  }
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  guia: 'Guía de aprendizaje',
  guia_aprendizaje: 'Guía de aprendizaje',
  ficha_trabajo: 'Ficha de trabajo',
  actividad_pedagogica: 'Actividad pedagógica',
  recurso_dua: 'Recurso DUA',
  reforzamiento: 'Reforzamiento',
  extension_avanzados: 'Extensión para avanzados',
  material_apoderados: 'Material para apoderados',
  banco_preguntas: 'Banco de preguntas',
  ticket: 'Ticket de salida',
  ticket_salida: 'Ticket de salida',
  rubrica: 'Rúbrica',
  evaluacion: 'Evaluación',
  pauta: 'Pauta',
  prueba: 'Prueba',
  simce: 'Instrumento SIMCE',
  retroalimentacion: 'Retroalimentación',
  planificacion_clase: 'Planificación de clase',
  presentacion: 'Presentación',
  presentation: 'Presentación',
};

export function resourceTypeLabel(type: string): string {
  return RESOURCE_TYPE_LABELS[type] || type;
}

const EVALUATION_TYPES = new Set([
  'evaluacion', 'rubrica', 'pauta', 'ticket', 'ticket_salida',
  'prueba', 'simce', 'retroalimentacion', 'banco_preguntas_evaluativos',
]);

export function isEvaluationType(type: string): boolean {
  return EVALUATION_TYPES.has(type);
}
