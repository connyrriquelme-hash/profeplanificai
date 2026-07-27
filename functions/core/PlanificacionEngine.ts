import { PlanificacionSchema, type Planificacion } from '../../schemas/PlanificacionSchema';
import { callAIConValidacion } from './AIEngine';
import type { AIEngineEnv } from './types';

export interface PlanificacionOptions {
  level: string;
  subject: string;
  objectiveText: string;
  topic?: string;
  methodology?: string;
  indicators?: string[];
}

export interface PlanificacionResult {
  planificacion: Planificacion;
  usedFallback: boolean;
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1).trimEnd();
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}

// CAMINO DE EMERGENCIA: se usa solo cuando la IA no responde, responde JSON
// inválido o no cumple PlanificacionSchema. No es una planificación diseñada
// pedagógicamente — es una estructura mínima siempre válida (nunca vacía)
// para que el flujo no se rompa. El resultado esperado normal es el generado
// por la IA a partir del prompt de buildMaterialPrompt (generate.ts).
export function buildFallbackPlanificacion(opciones: PlanificacionOptions): Planificacion {
  const tema = opciones.topic || opciones.objectiveText || opciones.subject;
  const metodologia = opciones.methodology || 'Metodología activa';
  const indicadores = (opciones.indicators || []).slice(0, 3);

  const classes = [
    {
      number: 1,
      objective: truncate(`Activar conocimientos previos sobre ${tema} y presentar el objetivo de la clase.`, 400),
      opening: `Presentación del tema "${truncate(tema, 150)}" y activación de conocimientos previos mediante preguntas guía.`,
      development: `Exploración inicial de ${truncate(tema, 150)} con apoyo del docente, aplicando ${metodologia}.`,
      closure: 'Síntesis breve de lo observado y anticipación de la siguiente clase.',
      duration: '45 min',
      materials: ['Pizarra o proyector', 'Material de la asignatura', 'Cuaderno del estudiante'],
      assessment: 'Observación directa de la participación y comprensión inicial.',
    },
    {
      number: 2,
      objective: truncate(`Profundizar en ${tema} mediante actividades guiadas alineadas al objetivo de aprendizaje.`, 400),
      opening: 'Recapitulación breve de la clase anterior.',
      development: `Desarrollo de actividades prácticas sobre ${truncate(tema, 150)}, aplicando ${metodologia} en grupos o de forma individual.`,
      closure: 'Puesta en común de resultados y retroalimentación docente.',
      duration: '45 min',
      materials: ['Guía de trabajo', 'Material concreto o digital'],
      assessment: indicadores.length
        ? truncate(`Verificación de: ${indicadores.join('; ')}`, 500)
        : 'Revisión de evidencias de trabajo elaboradas durante la clase.',
    },
    {
      number: 3,
      objective: truncate(`Aplicar y consolidar lo aprendido sobre ${tema} en una tarea final.`, 400),
      opening: 'Repaso de los aprendizajes clave de las clases anteriores.',
      development: `Aplicación integrada de ${truncate(tema, 150)} en una tarea o producto final, con retroalimentación formativa.`,
      closure: 'Cierre metacognitivo: reflexión sobre lo aprendido y su utilidad.',
      duration: '45 min',
      materials: ['Material de evaluación', 'Rúbrica o pauta de cotejo'],
      assessment: 'Evaluación formativa del producto final elaborado por los estudiantes.',
    },
  ];

  return {
    unit: truncate(`Planificación: ${tema} — ${opciones.subject}`, 200),
    classes,
    methodology: truncate(metodologia, 200),
    dua: [
      'Ofrecer múltiples formas de representar la información (visual, oral, escrita).',
      'Permitir distintas formas de expresión del aprendizaje (oral, escrita, gráfica).',
      'Vincular las actividades con intereses y contexto real de los estudiantes.',
    ],
    evaluation: 'Evaluación formativa a lo largo de las clases y evaluación sumativa al cierre de la unidad.',
  };
}

export async function generatePlanificacion(
  env: AIEngineEnv,
  prompt: string,
  opciones: PlanificacionOptions,
): Promise<PlanificacionResult> {
  try {
    const { data } = await callAIConValidacion(env, '', prompt, PlanificacionSchema, { maxTokens: 3000 });
    return { planificacion: data, usedFallback: false };
  } catch (error) {
    console.error('[PlanificacionEngine] error:', error);
    return { planificacion: buildFallbackPlanificacion(opciones), usedFallback: true };
  }
}
