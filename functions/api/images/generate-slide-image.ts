import { generateImage, buildSafeImagePrompt, ProviderNotConfiguredError } from '../../_lib/imageGeneration';

interface Env {
  AI: Ai;
  OPENAI_API_KEY?: string;
  FAL_KEY?: string;
  REPLICATE_API_TOKEN?: string;
  STABILITY_API_KEY?: string;
}

const SDXL_MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0';

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

    if (context.env.AI) {
      const safePrompt = buildSafeImagePrompt(prompt);
      const result = await context.env.AI.run(SDXL_MODEL, { prompt: safePrompt });
      let imageBytes: Uint8Array;
      if (result instanceof ReadableStream) {
        imageBytes = await streamToBytes(result);
      } else if (result instanceof ArrayBuffer) {
        imageBytes = new Uint8Array(result);
      } else {
        imageBytes = result as Uint8Array;
      }
      const imageBase64 = bytesToDataUrl(imageBytes);

      return Response.json({
        ok: true,
        imageUrl: imageBase64,
        provider: 'cloudflare-ai',
        model: SDXL_MODEL,
      });
    }

    const result = await generateImage(context.env, prompt);
    return Response.json({
      ok: true,
      imageUrl: result.imageUrl,
      provider: result.provider,
      model: result.model,
    });
  } catch (err) {
    if (err instanceof ProviderNotConfiguredError) {
      return Response.json({ ok: false, code: 'provider_not_configured', message: err.message });
    }
    const message = err instanceof Error ? err.message : 'Error interno';
    return Response.json({ ok: false, code: 'provider_error', message }, { status: 500 });
  }
}
