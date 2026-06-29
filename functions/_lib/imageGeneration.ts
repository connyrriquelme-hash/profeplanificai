interface ImageEnv {
  OPENAI_API_KEY?: string;
  FAL_KEY?: string;
  REPLICATE_API_TOKEN?: string;
  STABILITY_API_KEY?: string;
}

interface ImageGenResult {
  imageUrl: string;
  provider: string;
  model: string;
  warning?: string;
}

async function urlToBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo descargar la imagen (${response.status})`);
  const blob = await response.arrayBuffer();
  const type = response.headers.get('content-type') || 'image/jpeg';
  const base64 = btoa(String.fromCharCode(...new Uint8Array(blob)));
  return `data:${type};base64,${base64}`;
}

function sanitizePrompt(prompt: string): string {
  return prompt
    .replace(/<[^>]*>/g, '')
    .replace(/[""]/g, '"')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .trim()
    .slice(0, 1000);
}

async function generateWithOpenAI(env: ImageEnv, prompt: string): Promise<ImageGenResult | null> {
  if (!env.OPENAI_API_KEY) return null;

  const tryModel = async (model: string, size: string) => {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, n: 1, size, quality: model === 'dall-e-3' ? 'standard' : undefined }),
    });
    const data = await response.json() as any;
    if (!response.ok) throw new Error(data?.error?.message || `OpenAI respondió ${response.status}`);
    const url = data.data?.[0]?.url;
    if (!url) throw new Error(`OpenAI ${model}: no se recibió URL de imagen`);
    return url;
  };

  let url: string;
  const models = [
    { model: 'dall-e-3', size: '1792x1024' },
    { model: 'dall-e-2', size: '1024x1024' },
  ];
  const errors: string[] = [];
  for (const { model, size } of models) {
    try {
      url = await tryModel(model, size);
      return { imageUrl: await urlToBase64(url), provider: 'openai', model };
    } catch (e) {
      errors.push(`${model}: ${e instanceof Error ? e.message : 'error'}`);
    }
  }
  throw new Error(`OpenAI: ${errors.join('; ')}`);
}

async function generateWithFal(env: ImageEnv, prompt: string): Promise<ImageGenResult | null> {
  if (!env.FAL_KEY) return null;
  const response = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
    method: 'POST',
    headers: { 'Authorization': `Key ${env.FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, num_images: 1, safety_check: false, output_format: 'jpeg' }),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || `FAL respondió ${response.status}`);
  const url = data.images?.[0]?.url || data.image?.url;
  if (!url) throw new Error('FAL: no se recibió URL de imagen');
  return { imageUrl: await urlToBase64(url), provider: 'fal', model: 'flux-pro-v1.1' };
}

async function generateWithReplicate(env: ImageEnv, prompt: string): Promise<ImageGenResult | null> {
  if (!env.REPLICATE_API_TOKEN) return null;
  const createRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json', 'Prefer': 'wait=60' },
    body: JSON.stringify({ input: { prompt, num_outputs: 1, aspect_ratio: '16:9', output_format: 'jpeg' } }),
  });
  const prediction = await createRes.json() as any;
  if (!createRes.ok) throw new Error(prediction?.detail || `Replicate respondió ${createRes.status}`);
  let imageUrl: string | undefined;
  if (prediction.output?.[0]) {
    imageUrl = prediction.output[0];
  } else if (prediction.urls?.get) {
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(prediction.urls.get, { headers: { 'Authorization': `Bearer ${env.REPLICATE_API_TOKEN}` } });
      const status = await statusRes.json() as any;
      if (status.status === 'succeeded') { imageUrl = status.output?.[0]; break; }
      if (status.status === 'failed') throw new Error(status.error || 'Replicate: generación fallida');
    }
    if (!imageUrl) throw new Error('Replicate: tiempo de espera agotado');
  }
  if (!imageUrl) throw new Error('Replicate: respuesta inesperada');
  return { imageUrl: await urlToBase64(imageUrl), provider: 'replicate', model: 'flux-dev' };
}

async function generateWithStability(env: ImageEnv, prompt: string): Promise<ImageGenResult | null> {
  if (!env.STABILITY_API_KEY) return null;
  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.STABILITY_API_KEY}`, 'Accept': 'application/json' },
    body: (() => {
      const fd = new FormData();
      fd.append('prompt', prompt);
      fd.append('output_format', 'jpeg');
      fd.append('aspect_ratio', '16:9');
      return fd;
    })(),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.message || `Stability respondió ${response.status}`);
  const base64 = data.image;
  if (base64) return { imageUrl: `data:image/jpeg;base64,${base64}`, provider: 'stability', model: 'core' };
  throw new Error('Stability: no se recibió imagen');
}

async function generateWithPollinations(prompt: string): Promise<ImageGenResult> {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1792&height=1024&nologo=true&model=flux`;
  return { imageUrl: await urlToBase64(url), provider: 'pollinations', model: 'flux', warning: 'Servicio gratuito — la calidad y velocidad pueden variar.' };
}

export class ProviderNotConfiguredError extends Error {
  code = 'provider_not_configured' as const;
  constructor() {
    super('No hay proveedor de imágenes configurado. Configura OPENAI_API_KEY, FAL_KEY, REPLICATE_API_TOKEN o STABILITY_API_KEY como secret en Cloudflare, o usa el servicio gratuito predeterminado.');
  }
}

export async function generateImage(env: ImageEnv, prompt: string): Promise<ImageGenResult> {
  const cleaned = sanitizePrompt(prompt);
  const educationalPrefix = 'Imagen educativa para aula chilena, apropiada para menores, sin texto, sin logos, sin personajes famosos. ';
  const finalPrompt = educationalPrefix + cleaned;

  const providers: { name: string; fn: () => Promise<ImageGenResult | null> }[] = [
    { name: 'openai', fn: () => generateWithOpenAI(env, finalPrompt) },
    { name: 'fal', fn: () => generateWithFal(env, finalPrompt) },
    { name: 'replicate', fn: () => generateWithReplicate(env, finalPrompt) },
    { name: 'stability', fn: () => generateWithStability(env, finalPrompt) },
    { name: 'pollinations (gratuito)', fn: () => generateWithPollinations(finalPrompt) },
  ];

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const result = await provider.fn();
      if (result) return result;
    } catch (e) {
      errors.push(`${provider.name}: ${e instanceof Error ? e.message : 'error desconocido'}`);
    }
  }

  throw new Error(`No se pudo generar imagen con ningún proveedor. ${errors.join('; ')}`);
}
