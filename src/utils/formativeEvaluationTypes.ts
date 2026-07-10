/**
 * Tipos compartidos para evaluaciones formativas
 * Usados tanto en Flujo Docente como en pestaña Evaluaciones
 */

export type FormativeEvaluationType =
  | 'evaluation_exit_ticket'
  | 'evaluation_321'
  | 'evaluation_checklist'
  | 'evaluation_formative_rubric'
  | 'evaluation_traffic_light';

export const FORMATIVE_EVALUATION_OPTIONS = [
  {
    id: 'evaluation_exit_ticket',
    label: 'Ticket de Salida',
    description: 'Pregunta breve para cerrar la clase y verificar comprensión inmediata.',
    icon: '🎫'
  },
  {
    id: 'evaluation_321',
    label: 'Formato 3-2-1',
    description: 'Reflexión metacognitiva: 3 aprendizajes, 2 intereses y 1 duda.',
    icon: '3️⃣'
  },
  {
    id: 'evaluation_checklist',
    label: 'Lista de Cotejo / Autoevaluación',
    description: 'Criterios Sí/No para revisar el propio desempeño.',
    icon: '✅'
  },
  {
    id: 'evaluation_formative_rubric',
    label: 'Rúbrica Analítica Formativa',
    description: 'Rúbrica breve con niveles de logro y retroalimentación obligatoria.',
    icon: '📊'
  },
  {
    id: 'evaluation_traffic_light',
    label: 'Semáforo de Comprensión',
    description: 'Técnica visual con rojo, amarillo y verde para monitorear comprensión.',
    icon: '🚦'
  }
] as const;

export function getEvaluationOption(type: FormativeEvaluationType) {
  return FORMATIVE_EVALUATION_OPTIONS.find(o => o.id === type);
}

export function getAllEvaluationLabels(): string[] {
  return FORMATIVE_EVALUATION_OPTIONS.map(o => o.label);
}