import { validateActivityRequest } from '../_lib/activity';
import { generateActivityWithAI } from '../_lib/ai';
import { verifyToken } from '../_lib/auth';

interface Env { DB: D1Database; JWT_SECRET: string; GEMINI_API_KEY?: string; AI?: any }

async function hash(value: string): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(x => x.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  let logId = crypto.randomUUID();
  try {
    const request = validateActivityRequest(await context.request.json());
    const auth = context.request.headers.get('Authorization');
    const userId = auth?.startsWith('Bearer ') ? (await verifyToken(auth.slice(7), context.env.JWT_SECRET))?.sub || null : null;
    const objective = await context.env.DB.prepare(`SELECT o.id,o.code,o.official_text,o.source_url,c.name AS course_name,s.name AS subject_name,a.name AS axis_name FROM objectives o JOIN courses c ON c.id=o.course_id JOIN subjects s ON s.id=o.subject_id LEFT JOIN axes a ON a.id=o.axis_id WHERE o.code=? AND o.type='OA'`).bind(request.objective_code).first<any>();
    if (!objective) return Response.json({ error: 'OA no encontrado en la base oficial' }, { status: 404 });
    const skills = (await context.env.DB.prepare(`SELECT sk.code,sk.official_text FROM skills sk JOIN objective_skills os ON os.skill_id=sk.id WHERE os.objective_id=?`).bind(objective.id).all()).results;
    const attitudes = (await context.env.DB.prepare(`SELECT at.code,at.official_text FROM attitudes at JOIN objective_attitudes oa ON oa.attitude_id=at.id WHERE oa.objective_id=?`).bind(objective.id).all()).results;
    const generated = await generateActivityWithAI(context.env, { ...objective, skills, attitudes }, request);
    const promptHash = await hash(generated.prompt);
    await context.env.DB.batch([
      context.env.DB.prepare(`INSERT INTO generated_activities (id,objective_id,user_id,title,activity_type,duration_minutes,grade_level,subject,prompt_json,result_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))`).bind(crypto.randomUUID(), objective.id, userId, generated.result.titulo, request.activity_type, request.duration_minutes, objective.course_name, objective.subject_name, JSON.stringify(request), JSON.stringify(generated.result)),
      context.env.DB.prepare(`INSERT INTO generation_logs (id,provider,model,prompt_hash,status,created_at) VALUES (?,?,?,?,?,datetime('now'))`).bind(logId, generated.provider, generated.model, promptHash, 'ok'),
    ]);
    return Response.json({ data: generated.result, meta: { provider: generated.provider, model: generated.model, warning: generated.warning || null, saved: true }, attribution: { name: 'Currículum Nacional — MINEDUC Chile', url: objective.source_url } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    try { await context.env.DB.prepare(`INSERT INTO generation_logs (id,provider,model,prompt_hash,status,error_message,created_at) VALUES (?,'unknown','unknown','', 'error',?,datetime('now'))`).bind(logId, message).run(); } catch {}
    return Response.json({ error: message }, { status: /obligatorio|válid|minutes/.test(message) ? 400 : 500 });
  }
}
