export type QualitySeverity = 'error' | 'warning';

export interface QualityIssue {
  code: string;
  severity: QualitySeverity;
  message: string;
}

export interface QualityReport {
  status: 'ready' | 'draft' | 'blocked';
  score: number;
  issues: QualityIssue[];
}

const PLACEHOLDERS = [
  'alternativa correcta',
  'alternativa incorrecta',
  'pregunta de selección múltiple',
  'respuesta modelo',
  'criterio 1',
  'que se evalua especificamente',
  'descripcion detallada',
  'material didactico',
  'actividad generica',
];

function collectStrings(value: unknown, result: string[] = []): string[] {
  if (typeof value === 'string') result.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, result));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, result));
  return result;
}

function addIssue(issues: QualityIssue[], code: string, severity: QualitySeverity, message: string): void {
  issues.push({ code, severity, message });
}

function validateProductSpecificRules(product: Record<string, unknown>, productType: string | undefined, issues: QualityIssue[]): void {
  const sections = Array.isArray(product.sections) ? product.sections : [];
  const questions = Array.isArray(product.questions) ? product.questions : [];
  const criteria = Array.isArray(product.criteria) ? product.criteria : [];
  const slides = Array.isArray(product.slides) ? product.slides : [];

  if (productType === 'planificacion') {
    const classes = Array.isArray(product.classes) ? product.classes : [];
    if (classes.length < 3 || classes.length > 5) addIssue(issues, 'planning_class_count', 'error', 'La planificación debe contener entre 3 y 5 clases.');
    if (!product.methodology) addIssue(issues, 'planning_methodology', 'error', 'La planificación debe declarar una metodología aplicada.');
    if (!product.evaluation) addIssue(issues, 'planning_evaluation', 'error', 'La planificación debe explicar cómo se evaluará la unidad.');
  }

  if (productType === 'guia_estudiante' || productType === 'guia_docente') {
    if (sections.length < 4) addIssue(issues, 'guide_sections', 'error', 'La guía debe tener al menos cuatro secciones utilizables.');
    if (!product.objective) addIssue(issues, 'guide_objective', 'error', 'La guía debe declarar una meta de aprendizaje.');
  }

  if (productType === 'evaluacion') {
    if (questions.length < 3) addIssue(issues, 'evaluation_question_count', 'error', 'La evaluación debe tener al menos tres ítems.');
    if (!product.answerKey) addIssue(issues, 'evaluation_answer_key', 'error', 'La evaluación debe incluir una pauta de corrección.');
    if (!product.instructions) addIssue(issues, 'evaluation_instructions', 'error', 'La evaluación debe incluir instrucciones para estudiantes.');
  }

  if (productType === 'rubrica' || productType === 'evaluation_formative_rubric') {
    if (criteria.length < 3) addIssue(issues, 'rubric_criteria', 'error', 'La rúbrica debe tener al menos tres criterios observables.');
    if (criteria.some((criterion) => !criterion || typeof criterion !== 'object' || !Array.isArray((criterion as Record<string, unknown>).levels))) {
      addIssue(issues, 'rubric_levels', 'error', 'Cada criterio de la rúbrica debe tener niveles de desempeño.');
    }
  }

  if (productType === 'presentacion' && slides.length > 0) {
    if (slides.length < 4) addIssue(issues, 'presentation_slide_count', 'warning', 'La presentación debería incluir ruta, desarrollo, actividad y cierre.');
    if (slides.some((slide) => !slide || typeof slide !== 'object' || !String((slide as Record<string, unknown>).title || '').trim())) {
      addIssue(issues, 'presentation_slide_title', 'error', 'Cada diapositiva debe tener un título claro.');
    }
  }

  if (productType === 'serie_lecciones') {
    if (!product.metodologiaActiva && !product.methodology) addIssue(issues, 'sequence_methodology', 'error', 'La serie debe declarar la metodología aplicada.');
    if (Array.isArray(product.clases) && product.clases.length < 2) addIssue(issues, 'sequence_class_count', 'error', 'La serie debe contener al menos dos clases.');
  }

  if (productType === 'actividad_dua' || productType === 'recurso_dua') {
    for (const field of ['representation', 'action', 'engagement']) {
      if (!Array.isArray(product[field]) || (product[field] as unknown[]).length < 2) {
        addIssue(issues, `dua_${field}`, 'error', `El recurso DUA debe incluir al menos dos estrategias de ${field}.`);
      }
    }
  }

  if (productType === 'bitacora_cientifica') {
    if (!Array.isArray(product.materials) || product.materials.length < 2) addIssue(issues, 'notebook_materials', 'warning', 'La bitácora debería especificar al menos dos materiales.');
    const hasProcedure = (Array.isArray(product.procedure) && product.procedure.length >= 3) || (Array.isArray(product.estructura) && product.estructura.some((section) => typeof section === 'object' && section !== null && String((section as Record<string, unknown>).titulo || '').toLowerCase().includes('procedimiento')));
    if (!hasProcedure) addIssue(issues, 'notebook_procedure', 'error', 'La bitácora debe incluir un procedimiento de al menos tres pasos.');
    if (!product.assessment) addIssue(issues, 'notebook_assessment', 'error', 'La bitácora debe incluir criterios de evaluación.');
  }
}

export function validatePedagogicalProduct(
  product: unknown,
  context: { objectiveCode?: string; objectiveText?: string; methodology?: string; durationMinutes?: number; productType?: string } = {},
): QualityReport {
  const issues: QualityIssue[] = [];
  const strings = collectStrings(product);
  const normalizedText = strings.join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const placeholder of PLACEHOLDERS) {
    if (normalizedText.includes(placeholder)) {
      addIssue(issues, 'placeholder_content', 'error', `Contiene contenido de plantilla: “${placeholder}”.`);
    }
  }

  if (!product || typeof product !== 'object') {
    addIssue(issues, 'missing_product', 'error', 'La IA no devolvió un producto estructurado.');
  }

  const raw = product as Record<string, unknown>;
  const classes = Array.isArray(raw.classes) ? raw.classes : Array.isArray(raw.clases) ? raw.clases : [];
  const phases = ['opening', 'development', 'closure', 'inicio', 'desarrollo', 'cierre'];
  const missingPhases = phases.filter((phase) => phase in raw && typeof raw[phase] !== 'string');
  if (missingPhases.length > 0) {
    addIssue(issues, 'invalid_phase_shape', 'error', 'Las fases de la clase deben contener instrucciones textuales aplicables.');
  }

  if (classes.length > 0) {
    classes.forEach((lesson, index) => {
      if (!lesson || typeof lesson !== 'object') {
        addIssue(issues, 'invalid_class', 'error', `La clase ${index + 1} no tiene una estructura válida.`);
        return;
      }
      const item = lesson as Record<string, unknown>;
      if (!item.assessment && !item.evaluation && !item.evaluacion) {
        addIssue(issues, 'missing_evidence', 'error', `La clase ${index + 1} no declara una evidencia observable.`);
      }
      if (!item.materials && !item.materiales && !raw.resources && !raw.recursos) {
        addIssue(issues, 'missing_materials', 'warning', `La clase ${index + 1} no declara materiales concretos.`);
      }
    });
  }

  if (context.objectiveCode && !normalizedText.includes(context.objectiveCode.toLowerCase())) {
    addIssue(issues, 'objective_traceability', 'warning', `No se encontró una referencia visible al OA ${context.objectiveCode}.`);
  }

  if (context.productType) validateProductSpecificRules(raw, context.productType, issues);

  if (context.methodology && context.methodology !== 'Tradicional' && !normalizedText.includes(context.methodology.toLowerCase())) {
    addIssue(issues, 'methodology_traceability', 'error', `El producto no evidencia la metodología seleccionada: ${context.methodology}.`);
  }

  if (context.durationMinutes && classes.length === 0 && !normalizedText.includes(String(context.durationMinutes))) {
    addIssue(issues, 'duration_traceability', 'warning', `No se identifica la duración solicitada de ${context.durationMinutes} minutos.`);
  }

  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const score = Math.max(0, 100 - (errors * 25) - ((issues.length - errors) * 8));
  return {
    status: errors > 0 ? 'blocked' : issues.length > 0 ? 'draft' : 'ready',
    score,
    issues,
  };
}