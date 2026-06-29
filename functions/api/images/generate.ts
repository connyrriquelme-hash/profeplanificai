import { generateEducationalImage, imageJsonResponse } from '../../_lib/images';

interface Env {
  DB?: D1Database;
  AI?: { run: (model: string, input: unknown) => Promise<unknown> };
  IMAGE_PROVIDER_ORDER?: string;
  ENABLE_IMAGE_AI?: string;
  HF_API_TOKEN?: string;
  IMAGE_CACHE_TTL_DAYS?: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json().catch(() => null);
    const result = await generateEducationalImage(body, context.env);
    return imageJsonResponse(result, {
      headers: {
        'Cache-Control': result.cached ? 'private, max-age=3600' : 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error generando imagen';
    return imageJsonResponse({ ok: false, error: message }, { status: 500 });
  }
}
