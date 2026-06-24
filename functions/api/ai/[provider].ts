import { getAuthenticatedUserId } from '../../_lib/auth';

interface Env {
  JWT_SECRET: string;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  HUGGINGFACE_API_KEY?: string;
}

export async function onRequestPost(context: EventContext<Env, string, { provider: string }>): Promise<Response> {
  try {
    if (!(await getAuthenticatedUserId(context.request, context.env.JWT_SECRET))) {
      return Response.json({ error: 'Sesión inválida o expirada' }, { status: 401 });
    }
    const { prompt, model, systemPrompt } = await context.request.json() as { prompt?: string; model?: string; systemPrompt?: string };
    if (!prompt?.trim()) return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    if (prompt.length > 20000) return Response.json({ error: 'Prompt demasiado extenso' }, { status: 413 });
    const provider = context.params.provider;

    if (provider === 'gemini') {
      if (!context.env.GEMINI_API_KEY) return Response.json({ error: 'Gemini no configurado en el servidor' }, { status: 503 });
      const selected = model || 'gemini-2.5-flash';
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selected)}:generateContent?key=${encodeURIComponent(context.env.GEMINI_API_KEY)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt || 'Eres especialista en educación chilena.' }] }, contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.65, maxOutputTokens: 5000 } }),
      });
      const data = await r.json() as any;
      if (!r.ok) return Response.json({ error: data?.error?.message || 'Error Gemini' }, { status: 502 });
      return Response.json({ content: (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('\n') });
    }

    const key = provider === 'openrouter' ? context.env.OPENROUTER_API_KEY : context.env.HUGGINGFACE_API_KEY;
    if (!key || !['openrouter', 'huggingface'].includes(provider)) return Response.json({ error: 'Proveedor no configurado' }, { status: 503 });
    const url = provider === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://router.huggingface.co/v1/chat/completions';
    const selected = model || (provider === 'openrouter' ? 'openrouter/auto' : 'meta-llama/Llama-3.1-8B-Instruct');
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: selected, messages: [{ role: 'system', content: systemPrompt || 'Eres especialista en educación chilena.' }, { role: 'user', content: prompt }], temperature: 0.65, max_tokens: 5000 }) });
    const data = await r.json() as any;
    if (!r.ok) return Response.json({ error: data?.error?.message || data?.message || 'Error del proveedor' }, { status: 502 });
    return Response.json({ content: data?.choices?.[0]?.message?.content || '' });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Error interno' }, { status: 500 });
  }
}
