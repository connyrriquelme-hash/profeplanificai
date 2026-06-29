import { generateImage, ProviderNotConfiguredError } from '../../_lib/imageGeneration';

interface Env {
  OPENAI_API_KEY?: string;
  FAL_KEY?: string;
  REPLICATE_API_TOKEN?: string;
  STABILITY_API_KEY?: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as Record<string, unknown>;
    const prompt = (body.prompt as string || '').trim();

    if (!prompt) {
      return Response.json({ ok: false, code: 'missing_prompt', message: 'El prompt es obligatorio.' }, { status: 400 });
    }
    if (prompt.length > 2000) {
      return Response.json({ ok: false, code: 'prompt_too_long', message: 'El prompt es demasiado largo (máx. 2000 caracteres).' }, { status: 400 });
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
