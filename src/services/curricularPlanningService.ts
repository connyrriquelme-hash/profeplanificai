import { api } from './apiClient';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface ObjectiveData {
  code: string;
  text: string;
  normalizedText: string;
  bloomLevel: string;
  courseCode: string;
  courseName: string;
  subjectName: string;
  axisName: string;
  sourceUrl: string;
}

export interface IndicatorData {
  id: string;
  text: string;
  orderIndex: number;
  sourceUrl: string;
  sourceType?: string;
  sourceName?: string;
}

export interface SkillData {
  id: string;
  text: string;
  code: string;
  sourceUrl: string;
}

export interface AttitudeData {
  id: string;
  text: string;
  code: string;
  sourceUrl: string;
}

export interface TextbookRef {
  id: string;
  title: string;
  publisher: string;
  year: string;
  type: string;
  unit: string;
  pageStart: number;
  pageEnd: number;
  sourceUrl: string;
  summary: string;
  sourceType?: string;
  sourceName?: string;
}

export interface TeacherGuideRef {
  id: string;
  title: string;
  unit: string;
  lessonTitle: string;
  suggestedActivity: string;
  didacticOrientation: string;
  assessmentSuggestion: string;
  pageStart: number;
  pageEnd: number;
  sourceUrl: string;
  summary: string;
  sourceType?: string;
  sourceName?: string;
}

export interface ResourceLink {
  id: string;
  title: string;
  type: string;
  description: string;
  sourceUrl: string;
  sourceName: string;
  sourceType?: string;
}

export interface DataStatus {
  hasIndicators: boolean;
  hasTextbookReferences: boolean;
  hasTeacherGuideReferences: boolean;
  hasResourceLinks: boolean;
  hasSequenceRecommendation: boolean;
}

export interface CurricularContext {
  objective: ObjectiveData;
  indicators: IndicatorData[];
  skills: SkillData[];
  attitudes: AttitudeData[];
  textbookReferences: TextbookRef[];
  teacherGuideReferences: TeacherGuideRef[];
  resourceLinks: ResourceLink[];
  recommendedLessons: number | null;
  complexity: string | null;
  rationale: string | null;
  dataStatus?: DataStatus;
}

export interface ComplexityAnalysis {
  complexity: string;
  recommendedLessons: number;
  rationale: string;
  suggestedSequence: { lesson: number; focus: string }[];
}

export async function getCurricularContext(
  level: string,
  subject: string,
  objectiveCode: string,
  objectiveId?: string
): Promise<CurricularContext | null> {
  try {
    const params = new URLSearchParams();
    if (objectiveId) params.set('objectiveId', objectiveId);
    if (objectiveCode) params.set('objectiveCode', objectiveCode);
    if (level) params.set('level', level);
    if (subject) params.set('subject', subject);
    const url = `${API_BASE}/api/curriculum/context?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateIndicators(params: {
  objectiveId?: string;
  objectiveCode?: string;
  objectiveText?: string;
  course?: string;
  subject?: string;
  skill?: string;
  force?: boolean;
}): Promise<IndicatorData[]> {
  try {
    const result = await api.post<{ data: IndicatorData[]; source: string }>('/api/curriculum/generate-indicators', params);
    return result?.data ?? [];
  } catch {
    return [];
  }
}

export async function analyzeObjectiveComplexity(params: {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators: string[];
  skills: string[];
}): Promise<ComplexityAnalysis | null> {
  try {
    const result = await api.post<{ data: ComplexityAnalysis }>('/api/curriculum/analyze-objective', params);
    return result?.data ?? null;
  } catch {
    return getFallbackComplexity(params);
  }
}

function getFallbackComplexity(params: {
  indicators: string[]; skills: string[]; level: string;
}): ComplexityAnalysis {
  const indicatorCount = params.indicators?.length || 0;
  const skillCount = params.skills?.length || 0;
  let score = 2;
  if (indicatorCount >= 5) score += 2;
  else if (indicatorCount >= 3) score += 1;
  if (skillCount >= 3) score += 1;
  if (params.level?.includes('Medio') && !params.level?.includes('Sala') && !params.level?.includes('Pre') && !params.level?.includes('Kinder')) score += 1;

  let recommendedLessons = 1;
  let complexity: string;
  let rationale: string;
  if (score <= 2) { complexity = 'baja'; recommendedLessons = 1; rationale = 'OA simple. Puede trabajarse en una clase.'; }
  else if (score <= 4) { complexity = 'media'; recommendedLessons = 2; rationale = 'OA con comprensión y aplicación. Requiere al menos 2 clases.'; }
  else if (score <= 6) { complexity = 'alta'; recommendedLessons = 3; rationale = 'OA con múltiples habilidades. Secuencia de 3 clases recomendada.'; }
  else if (score <= 8) { complexity = 'alta'; recommendedLessons = 4; rationale = 'OA de alta complejidad. Requiere 4 clases.'; }
  else { complexity = 'muy_alta'; recommendedLessons = 5; rationale = 'OA muy complejo. Secuencia completa de 5 clases.'; }

  const suggestedSequence = Array.from({ length: recommendedLessons }, (_, i) => ({
    lesson: i + 1,
    focus: i === 0 ? 'Introducción y exploración'
      : i === recommendedLessons - 1 ? 'Síntesis y evaluación'
      : `Desarrollo y profundización (parte ${i})`,
  }));

  return { complexity, recommendedLessons, rationale, suggestedSequence };
}

export function cleanGeneratedPlanText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^[ \t]*\*[ \t]+/gm, '- ')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildPedagogicalPrompt(context: {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators: string[];
  skills: string[];
  attitudes: string[];
  textbookRefs: { title: string; unit: string; summary: string }[];
  teacherGuideRefs: { title: string; suggestedActivity: string; didacticOrientation: string; assessmentSuggestion: string }[];
  numberOfLessons: number;
  theme?: string;
}): string {
  const sections: string[] = [];

  sections.push(`Eres un Especialista en currículum chileno, didáctica, evaluación formativa, DUA, progresión de habilidades y planificación de clases.`);
  sections.push(``);
  sections.push(`## Contexto pedagógico`);
  sections.push(`Nivel: ${context.level}`);
  sections.push(`Asignatura: ${context.subject}`);
  sections.push(`OA: ${context.objectiveCode} — ${context.objectiveText}`);
  sections.push(``);

  if (context.theme) {
    sections.push(`Tema de la clase: ${context.theme}`);
    sections.push(``);
  }

  if (context.indicators.length > 0) {
    sections.push(`### Indicadores de evaluación`);
    context.indicators.forEach(ind => sections.push(`- ${ind}`));
    sections.push(``);
  }

  if (context.skills.length > 0) {
    sections.push(`### Habilidades`);
    context.skills.forEach(s => sections.push(`- ${s}`));
    sections.push(``);
  }

  if (context.attitudes.length > 0) {
    sections.push(`### Actitudes`);
    context.attitudes.forEach(a => sections.push(`- ${a}`));
    sections.push(``);
  }

  if (context.textbookRefs.length > 0) {
    sections.push(`### Referencias de textos escolares (fuentes oficiales asociadas al OA)`);
    context.textbookRefs.forEach(ref => {
      sections.push(`- "${ref.title}" — Unidad: ${ref.unit}`);
      if (ref.summary) sections.push(`  Resumen: ${ref.summary}`);
    });
    sections.push(``);
  }

  if (context.teacherGuideRefs.length > 0) {
    sections.push(`### Sugerencias de guías docentes (fuentes oficiales)`);
    context.teacherGuideRefs.forEach(g => {
      sections.push(`- ${g.title}`);
      if (g.suggestedActivity) sections.push(`  Actividad sugerida: ${g.suggestedActivity}`);
      if (g.didacticOrientation) sections.push(`  Orientación didáctica: ${g.didacticOrientation}`);
      if (g.assessmentSuggestion) sections.push(`  Sugerencia de evaluación: ${g.assessmentSuggestion}`);
    });
    sections.push(``);
  }

  sections.push(`## Instrucciones`);
  sections.push(`Genera una planificación de ${context.numberOfLessons} clase(s) para este OA.`);
  sections.push(``);

  sections.push(`Formato para ${context.numberOfLessons} clase(s):`);
  for (let i = 1; i <= context.numberOfLessons; i++) {
    sections.push(``);
    sections.push(`Clase ${i}:`);
    sections.push(`- Objetivo específico de la clase`);
    sections.push(`- Inicio (10-15 min): activación de conocimientos previos, motivación`);
    sections.push(`- Desarrollo (25-35 min): actividades principales, metodología activa, mediación docente`);
    sections.push(`- Cierre (5-10 min): metacognición, ticket de salida`);
    sections.push(`- Actividad principal`);
    sections.push(`- Recurso sugerido`);
    sections.push(`- Evaluación formativa`);
    sections.push(`- Adecuaciones DUA`);
    sections.push(`- Evidencia de aprendizaje`);
    sections.push(`- Indicador(es) evaluado(s)`);
  }

  sections.push(``);
  sections.push(`Reglas:`);
  if (context.theme) {
    sections.push(`- Tema contextual: "${context.theme}". Usalo para contextualizar actividades, ejemplos y recursos. No reemplaza el OA ni los indicadores.`);
  }
  sections.push(`- No inventar OA. Usa solo el OA, indicadores y habilidades entregados.`);
  sections.push(`- Si faltan datos, reconócelo y genera con lo disponible.`);
  sections.push(`- Adapta la secuencia al nivel escolar (${context.level}).`);
  sections.push(`- Incluye evaluación formativa en cada clase.`);
  sections.push(`- Incluye adecuaciones DUA.`);
  sections.push(`- Incluye recursos sugeridos (actividades creadas por IA, no afirmar que provienen de texto escolar si solo fueron inferidas).`);
  sections.push(`- Incluye evidencias de aprendizaje.`);
  sections.push(`- Lenguaje docente chileno claro y directo.`);
  sections.push(`- Extensión total: entre 600 y 1500 palabras.`);
  sections.push(`- NO USES Markdown. No uses asteriscos ni **negritas**.`);
  sections.push(`- Usa solo texto plano legible. Los encabezados deben ir seguidos de dos puntos:`);
  sections.push(`  "Inicio:" en vez de "**Inicio:**".`);
  sections.push(`- Usa guiones "-" para listas, NO asteriscos "*".`);
  sections.push(`- El resultado debe verse limpio al copiar y pegar en Word o PDF.`);

  return sections.join('\n');
}
