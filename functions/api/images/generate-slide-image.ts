import { generateImage, buildSafeImagePrompt, ProviderNotConfiguredError } from '../../_lib/imageGeneration';

interface Env {
  AI: Ai;
  OPENAI_API_KEY?: string;
  FAL_KEY?: string;
  REPLICATE_API_TOKEN?: string;
  STABILITY_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

// Cloudflare Workers AI de mayor calidad disponible (reemplaza SDXL base 1.0,
// que quedaba atras de Flux/DALL-E en calidad). Se usa solo como ultimo
// recurso: generateImage() ya prueba OpenAI/Fal/Replicate/Stability primero
// segun que secrets esten configurados.
const CLOUDFLARE_FALLBACK_MODEL = '@cf/black-forest-labs/flux-1-schnell';

function bytesToDataUrl(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

async function streamToBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = (await context.request.json()) as Record<string, unknown>;
    const prompt = (body.prompt as string || '').trim();

    if (!prompt) {
      return Response.json({ ok: false, code: 'missing_prompt', message: 'El prompt es obligatorio.' }, { status: 400 });
    }
    if (prompt.length > 2000) {
      return Response.json({ ok: false, code: 'prompt_too_long', message: 'El prompt es demasiado largo (máx. 2000 caracteres).' }, { status: 400 });
    }

    // Preferimos los proveedores externos configurados (OpenAI DALL-E 3, Fal
    // Flux Pro, etc.) porque dan mejor calidad que el modelo de Workers AI.
    // Cloudflare AI (Flux Schnell) queda como respaldo si ninguno esta
    // configurado o todos fallan, no como opcion primaria.
    try {
      const result = await generateImage(context.env, prompt);
      return Response.json({
        ok: true,
        imageUrl: result.imageUrl,
        provider: result.provider,
        model: result.model,
      });
    } catch (externalErr) {
      if (!context.env.AI) throw externalErr;

      const safePrompt = buildSafeImagePrompt(prompt);
      const result = await context.env.AI.run(CLOUDFLARE_FALLBACK_MODEL, { prompt: safePrompt });
      let imageBase64: string;
      if (result && typeof result === 'object' && 'image' in result && typeof (result as { image: unknown }).image === 'string') {
        imageBase64 = `data:image/jpeg;base64,${(result as { image: string }).image}`;
      } else {
        let imageBytes: Uint8Array;
        if (result instanceof ReadableStream) {
          imageBytes = await streamToBytes(result);
        } else if (result instanceof ArrayBuffer) {
          imageBytes = new Uint8Array(result);
        } else {
          imageBytes = result as Uint8Array;
        }
        imageBase64 = bytesToDataUrl(imageBytes);
      }

      return Response.json({
        ok: true,
        imageUrl: imageBase64,
        provider: 'cloudflare-ai',
        model: CLOUDFLARE_FALLBACK_MODEL,
      });
    }
  } catch (err) {
    if (err instanceof ProviderNotConfiguredError) {
      return Response.json({ ok: false, code: 'provider_not_configured', message: err.message });
    }
    const message = err instanceof Error ? err.message : 'Error interno';
    return Response.json({ ok: false, code: 'provider_error', message }, { status: 500 });
  }
}
