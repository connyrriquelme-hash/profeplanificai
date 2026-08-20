export type ClassDuration = 45 | 90 | 135;

export interface ClassroomConfiguration {
  classDurationMinutes: ClassDuration;
  studentCount: number;
  grouping: 'individual' | 'pairs' | 'small_groups' | 'whole_class' | 'stations';
  availableResources: string;
  outputFormat: 'word_editable';
}

export interface LessonRecommendationInput {
  objectiveText: string;
  methodology?: string;
  productType?: string;
  classDurationMinutes: ClassDuration;
}

const COMPLEXITY_TERMS = /analiza|argumenta|compara|evalua|crea|diseña|investiga|resuelve problemas|experimenta|proyecto|modela|interpreta/i;
const FOUNDATIONAL_TERMS = /reconoce|identifica|nombra|describe|clasifica|lee|cuenta|ordena/i;

export function recommendLessonCount(input: LessonRecommendationInput): number {
  let count = COMPLEXITY_TERMS.test(input.objectiveText) ? 4 : 3;
  if (FOUNDATIONAL_TERMS.test(input.objectiveText)) count = Math.max(2, count - 1);
  if (input.methodology && ['ABP', 'Design Thinking', 'Gamificacion'].includes(input.methodology)) count += 1;
  if (input.productType === 'serie_lecciones') count += 1;
  if (input.classDurationMinutes === 45) count += 1;
  if (input.classDurationMinutes === 135) count = Math.max(2, count - 1);
  return Math.min(8, Math.max(2, count));
}

export function defaultClassroomConfiguration(): ClassroomConfiguration {
  return {
    classDurationMinutes: 90,
    studentCount: 35,
    grouping: 'pairs',
    availableResources: 'Pizarra, proyector, hojas impresas y materiales de bajo costo',
    outputFormat: 'word_editable',
  };
}

export function groupingLabel(grouping: ClassroomConfiguration['grouping']): string {
  return {
    individual: 'Trabajo individual',
    pairs: 'Trabajo en parejas',
    small_groups: 'Grupos pequeños de 3 a 5',
    whole_class: 'Curso completo',
    stations: 'Estaciones de aprendizaje',
  }[grouping];
}