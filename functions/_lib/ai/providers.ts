import type { AIEnv, ProviderName, ProviderResult, ProviderStatus } from './types';
import { getMaxOutputTokens } from './limits';

function parseStructured(raw: string): Record<string, unknown> {
  try {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function getGeminiModel(env: AIEnv): string {
  return env.AI_DEFAULT_MODEL_GEMINI || 'gemini-2.5-flash';
}

export async function statusProviders(env: AIEnv): Promise<{ providers: Record<ProviderName, ProviderStatus>; recommended: ProviderName }> {
  const geminiModel = getGeminiModel(env);
  const providers: Record<ProviderName, ProviderStatus> = {
    gemini: { available: false },
    'workers-ai': { available: false },
    openrouter: { available: false },
    huggingface: { available: false },
    local: { available: true, model: 'fallback-pedagogico' },
  };

  if (env.GEMINI_API_KEY) {
    providers.gemini = { available: true, model: geminiModel };
  }

  if (env.AI) {
    try {
      await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { prompt: 'test', max_tokens: 5 });
      providers['workers-ai'] = { available: true, model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' };
    } catch (e) {
      providers['workers-ai'] = { available: false, error: String(e) };
    }
  }

  if (env.OPENROUTER_API_KEY) {
    providers.openrouter = { available: true, model: 'openrouter-default' };
  }

  if (env.HUGGINGFACE_API_KEY) {
    providers.huggingface = { available: true, model: 'huggingface-default' };
  }

  const priority: ProviderName[] = ['gemini', 'workers-ai', 'openrouter', 'huggingface', 'local'];
  const recommended = priority.find((p) => providers[p].available) || 'local';

  return { providers, recommended };
}

async function callWorkersAI(env: AIEnv, prompt: string): Promise<ProviderResult> {
  const model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
  const data = await env.AI!.run(model, {
    prompt,
    response_format: { type: 'json_object' },
    max_tokens: getMaxOutputTokens(),
  });
  const raw = String((data as Record<string, unknown>)?.response || data);
  return { ok: true, content: raw, model, provider: 'workers-ai', structured: parseStructured(raw) };
}

async function callGemini(apiKey: string, prompt: string, env: AIEnv): Promise<ProviderResult> {
  const model = getGeminiModel(env);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.45, maxOutputTokens: getMaxOutputTokens() },
      }),
    },
  );
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const err = (data?.error as Record<string, unknown>)?.message || `Gemini ${response.status}`;
    return { ok: false, content: '', model, provider: 'gemini', error: String(err) };
  }
  const candidates = data?.candidates as Array<Record<string, unknown>> | undefined;
  const parts = (candidates?.[0]?.content as Record<string, unknown>)?.parts as Array<Record<string, unknown>> | undefined;
  const raw = (parts || []).map((p) => String(p?.text || '')).join('');
  return { ok: true, content: raw, model, provider: 'gemini', structured: parseStructured(raw) };
}

async function callOpenRouter(apiKey: string, prompt: string): Promise<ProviderResult> {
  const model = 'meta-llama/llama-3.3-70b-instruct:free';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: getMaxOutputTokens(),
      temperature: 0.45,
    }),
  });
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const err = (data?.error as Record<string, unknown>)?.message || `OpenRouter ${response.status}`;
    return { ok: false, content: '', model, provider: 'openrouter', error: String(err) };
  }
  const choices = data?.choices as Array<Record<string, unknown>> | undefined;
  const message = choices?.[0]?.message as Record<string, unknown> | undefined;
  const raw = String(message?.content || '');
  return { ok: true, content: raw, model, provider: 'openrouter', structured: parseStructured(raw) };
}

async function callHuggingFace(apiKey: string, prompt: string): Promise<ProviderResult> {
  const model = 'meta-llama/Llama-3.3-70B-Instruct';
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: getMaxOutputTokens(), temperature: 0.45, return_full_text: false } }),
  });
  const data = await response.json() as Record<string, unknown> | Array<Record<string, unknown>>;
  if (!response.ok) {
    const err = (data as Record<string, unknown>)?.error || `HuggingFace ${response.status}`;
    return { ok: false, content: '', model, provider: 'huggingface', error: String(err) };
  }
  const items = Array.isArray(data) ? data : [data];
  const raw = items.map((item) => String(item?.generated_text || '')).join('');
  return { ok: true, content: raw, model, provider: 'huggingface', structured: parseStructured(raw) };
}

export async function callProvider(provider: ProviderName, env: AIEnv, prompt: string): Promise<ProviderResult> {
  switch (provider) {
    case 'workers-ai':
      if (!env.AI) return { ok: false, content: '', model: '', provider, error: 'Workers AI no configurado' };
      return callWorkersAI(env, prompt);
    case 'gemini':
      if (!env.GEMINI_API_KEY) return { ok: false, content: '', model: '', provider, error: 'Gemini API key no configurada' };
      return callGemini(env.GEMINI_API_KEY, prompt, env);
    case 'openrouter':
      if (!env.OPENROUTER_API_KEY) return { ok: false, content: '', model: '', provider, error: 'OpenRouter API key no configurada' };
      return callOpenRouter(env.OPENROUTER_API_KEY, prompt);
    case 'huggingface':
      if (!env.HUGGINGFACE_API_KEY) return { ok: false, content: '', model: '', provider, error: 'HuggingFace API key no configurada' };
      return callHuggingFace(env.HUGGINGFACE_API_KEY, prompt);
    default:
      return { ok: false, content: '', model: '', provider, error: `Proveedor desconocido: ${provider}` };
  }
}
