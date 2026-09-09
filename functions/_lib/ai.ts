import { mockActivity, parseActivityJson, type ActivityRequest, type ActivityResult } from './activity';
import { extractWorkersAIText } from './workersAI';

interface AIEnv {
  GEMINI_API_KEY?: string;
  AI?: { run: (model: string, input: unknown) => Promise<any> };
}

interface ObjectiveContext {
  code: string; official_text: string; course_name: string; subject_name: string; axis_name?: string;
  skills: unknown[]; attitudes: unknown[];
}

export interface AIActivityResponse { result: ActivityResult; provider: string; model: string; warning?: string; prompt: string }

function promptFor(objective: ObjectiveContext, request: ActivityRequest): string {
  return `Eres especialista en pedagogía y Currículum Nacional de Chile. Diseña una actividad NUEVA, aplicable por docentes y alineada explícitamente al OA oficial.
Curso: ${objective.course_name}
Asignatura: ${objective.subject_name}
Eje: ${objective.axis_name || 'No indicado'}
Código OA: ${objective.code}
Texto oficial: ${objective.official_text}
Habilidades: ${JSON.stringify(objective.skills)}
Actitudes: ${JSON.stringify(objective.attitudes)}
Tipo: ${request.activity_type}
Duración: ${request.duration_minutes} minutos
Dificultad: ${request.difficulty}
Contexto: ${request.context || 'Curso heterogéneo chileno'}
Incluir rúbrica: ${request.include_rubric}
Incluir DUA: ${request.include_dua}
Estilo SIMCE: ${request.include_simce_style}

Exige indicadores observables, inicio/desarrollo/cierre, evaluación formativa, adecuaciones DUA y español chileno claro. No alteres el texto oficial ni inventes otros códigos OA.
Devuelve SOLO JSON válido, sin markdown, escapando correctamente comillas dobles y saltos de línea dentro de strings. Usa esta forma exacta:
{"titulo":"","objetivo":"","inicio":"","desarrollo":"","cierre":"","materiales":[],"evaluacion":[],"rubrica":[{"criterio":"","niveles":[]}],"adecuaciones_dua":[],"indicadores":[],"preguntas":[{"enunciado":"","alternativas":[],"respuesta":""}]}`;
}

// Antes: Gemini primero sin try/catch -- si GEMINI_API_KEY estaba
// configurada y Gemini fallaba, la excepción se propagaba y el bloque
// env.AI (que sí funciona) nunca se alcanzaba, pese a estar escrito justo
// abajo. Ahora Workers AI va primero (gratis, sin dependencia de una key
// externa que hoy está fallando en producción -- ver AIEngine.ts), Gemini
// como respaldo solo si Workers AI no está disponible o falla.
export async function generateActivityWithAI(env: AIEnv, objective: ObjectiveContext, request: ActivityRequest): Promise<AIActivityResponse> {
  const prompt = promptFor(objective, request);

  if (env.AI) {
    try {
      const model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
      const data = await env.AI.run(model, { prompt, response_format: { type: 'json_object' }, max_tokens: 5000 });
      const raw = extractWorkersAIText(data);
      if (raw) return { result: parseActivityJson(raw), provider: 'workers-ai', model, prompt };
    } catch {
      // cae a Gemini/mock abajo
    }
  }

  if (env.GEMINI_API_KEY) {
    try {
      const model = 'gemini-3.6-flash';
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: .45, responseMimeType: 'application/json', maxOutputTokens: 5000, thinkingConfig: { thinkingBudget: 0 } } }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json() as any;
      if (response.ok) {
        const raw = (data?.candidates?.[0]?.content?.parts || []).map((part: any) => part.text || '').join('');
        if (raw) return { result: parseActivityJson(raw), provider: 'gemini', model, prompt };
      }
    } catch {
      // cae a mock abajo
    }
  }

  return { result: mockActivity(objective, request), provider: 'mock', model: 'deterministic-local', warning: 'IA no disponible en este momento. Se generó una estructura pedagógica base.', prompt };
}
