export const ACTIVITY_TYPES = ['clase', 'guia', 'evaluacion', 'simce', 'proyecto', 'ticket_salida'] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

export interface ActivityRequest {
  objective_code: string;
  activity_type: ActivityType;
  duration_minutes: number;
  difficulty: 'inicial' | 'medio' | 'avanzado';
  include_rubric: boolean;
  include_dua: boolean;
  include_simce_style: boolean;
  context?: string;
}

export interface ActivityResult {
  titulo: string;
  objetivo: string;
  inicio: string;
  desarrollo: string;
  cierre: string;
  materiales: string[];
  evaluacion: string[];
  rubrica: Array<{ criterio: string; niveles: string[] }>;
  adecuaciones_dua: string[];
  indicadores: string[];
  preguntas: Array<{ enunciado: string; alternativas?: string[]; respuesta?: string }>;
}

export function validateActivityRequest(value: unknown): ActivityRequest {
  const body = (value || {}) as Record<string, unknown>;
  if (typeof body.objective_code !== 'string' || !body.objective_code.trim()) throw new Error('objective_code es obligatorio');
  if (!ACTIVITY_TYPES.includes(body.activity_type as ActivityType)) throw new Error('activity_type no válido');
  const duration = Number(body.duration_minutes);
  if (!Number.isFinite(duration) || duration < 5 || duration > 300) throw new Error('duration_minutes debe estar entre 5 y 300');
  if (!['inicial', 'medio', 'avanzado'].includes(String(body.difficulty))) throw new Error('difficulty no válida');
  return {
    objective_code: body.objective_code.trim().toUpperCase().replace(/\s+/g, ' '),
    activity_type: body.activity_type as ActivityType,
    duration_minutes: Math.round(duration),
    difficulty: body.difficulty as ActivityRequest['difficulty'],
    include_rubric: body.include_rubric !== false,
    include_dua: body.include_dua !== false,
    include_simce_style: body.include_simce_style === true,
    context: typeof body.context === 'string' ? body.context.slice(0, 4000) : '',
  };
}

export function parseActivityJson(raw: string): ActivityResult {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let parsed: Partial<ActivityResult>;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    const posMatch = String(e).match(/position\s+(\d+)/);
    const pos = posMatch ? ` (posición ${posMatch[1]})` : '';
    throw new Error(`La IA devolvió JSON inválido${pos}. Reintenta la generación.`);
  }
  const required = ['titulo', 'objetivo', 'inicio', 'desarrollo', 'cierre'] as const;
  for (const key of required) if (typeof parsed[key] !== 'string' || !parsed[key]?.trim()) throw new Error(`Respuesta IA sin campo ${key}`);
  const strings = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  return {
    titulo: parsed.titulo!, objetivo: parsed.objetivo!, inicio: parsed.inicio!, desarrollo: parsed.desarrollo!, cierre: parsed.cierre!,
    materiales: strings(parsed.materiales), evaluacion: strings(parsed.evaluacion),
    rubrica: Array.isArray(parsed.rubrica) ? parsed.rubrica.map((item: any) => ({ criterio: String(item?.criterio || ''), niveles: strings(item?.niveles) })).filter(x => x.criterio) : [],
    adecuaciones_dua: strings(parsed.adecuaciones_dua), indicadores: strings(parsed.indicadores),
    preguntas: Array.isArray(parsed.preguntas) ? parsed.preguntas.map((item: any) => ({ enunciado: String(item?.enunciado || ''), alternativas: strings(item?.alternativas), respuesta: item?.respuesta ? String(item.respuesta) : undefined })).filter(x => x.enunciado) : [],
  };
}

export function mockActivity(oa: { code: string; official_text: string }, request: ActivityRequest): ActivityResult {
  return {
    titulo: `${request.activity_type.replace('_', ' ')} — ${oa.code}`,
    objetivo: oa.official_text,
    inicio: `Activar conocimientos previos y comunicar el propósito de aprendizaje (${Math.max(5, Math.round(request.duration_minutes * .2))} min).`,
    desarrollo: `Modelaje docente, práctica guiada y aplicación contextualizada al OA (${Math.round(request.duration_minutes * .6)} min).`,
    cierre: 'Síntesis, autoevaluación breve y ticket de salida.',
    materiales: ['Texto oficial del OA', 'Pizarra o proyector', 'Material de trabajo para estudiantes'],
    evaluacion: ['Observación de desempeño', 'Evidencia breve alineada al objetivo'],
    rubrica: request.include_rubric ? [{ criterio: 'Logro del OA', niveles: ['Inicial', 'En proceso', 'Logrado'] }] : [],
    adecuaciones_dua: request.include_dua ? ['Presentar información de forma oral, visual y escrita', 'Permitir distintas formas de respuesta', 'Ofrecer apoyos graduados'] : [],
    indicadores: ['Explica o demuestra el aprendizaje esperado', 'Aplica el aprendizaje en una tarea observable'],
    preguntas: [{ enunciado: '¿Qué aprendiste y qué evidencia lo demuestra?', alternativas: [], respuesta: 'Respuesta abierta basada en evidencia.' }],
  };
}
