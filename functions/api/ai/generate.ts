import { getTeacherId, json, readJson, type Env } from '../../_lib/my-classes';
import { orchestrate } from '../../_lib/ai/orchestrator';
import { validateAgentType } from '../../_lib/ai/safety';
import { VALID_AGENT_TYPES, VALID_TASK_TYPES, type AIEnv, type AIRequest } from '../../_lib/ai/types';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export async function onRequestPost(context: EventContext<Env & AIEnv>): Promise<Response> {
  const teacherId = await getTeacherId(context);
  if (!teacherId) return json({ ok: false, error: 'No autorizado' }, 401);

  const body = await readJson(context.request);
  const agentType = String(body.agentType || '');
  const taskType = String(body.taskType || '');

  const agentCheck = validateAgentType(agentType, VALID_AGENT_TYPES);
  if (!agentCheck.safe) return json({ ok: false, error: agentCheck.reason }, 400);

  if (!VALID_TASK_TYPES.includes(taskType as any)) {
    return json({ ok: false, error: `taskType "${taskType}" no es valido. Tipos validos: ${VALID_TASK_TYPES.join(', ')}` }, 400);
  }

  const req: AIRequest = {
    agentType: agentType as AIRequest['agentType'],
    taskType: taskType as AIRequest['taskType'],
    lessonId: String(body.lessonId || ''),
    course: String(body.course || ''),
    subject: String(body.subject || ''),
    grade: String(body.grade || ''),
    oa: String(body.oa || ''),
    oaCode: String(body.oaCode || ''),
    oaText: String(body.oaText || ''),
    indicators: Array.isArray(body.indicators) ? body.indicators.map(String) : [],
    skills: Array.isArray(body.skills) ? body.skills.map(String) : [],
    attitudes: Array.isArray(body.attitudes) ? body.attitudes.map(String) : [],
    instructions: String(body.instructions || ''),
    outputFormat: (body.outputFormat === 'json' || body.outputFormat === 'markdown' || body.outputFormat === 'text') ? body.outputFormat : 'json',
    existingContent: String(body.existingContent || ''),
  };

  const result = await orchestrate(context.env, req, teacherId);

  return json(result, result.ok ? 200 : 400);
}
