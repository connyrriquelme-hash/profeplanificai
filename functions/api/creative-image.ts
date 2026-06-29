import { buildEducationalImagePrompt, normalizeImageContext, tryWikimedia, tryPollinations, svgFallback, buildImageCacheKey, getCached, putCached, imageJsonResponse } from '../_lib/images';

interface Env {
  DB?: {
    prepare(query: string): {
      bind(...values: unknown[]): {
        first<T = unknown>(): Promise<T | null>;
        run(): Promise<unknown>;
      };
    };
  };
}

interface CreativeImageInput {
  tema: string;
  curso: string;
  asignatura: string;
  oa: string;
  estilo?: string;
  aspectRatio?: string;
  force?: boolean;
}

export async function onRequestPost(ctx: EventContext<Env>): Promise<Response> {
  try {
    const body = await ctx.request.json().catch(() => null) as CreativeImageInput | null;

    if (!body || !body.tema?.trim()) {
      return imageJsonResponse({ ok: false, error: 'El campo "tema" es obligatorio.' }, { status: 400 });
    }

    const grade = body.curso?.trim() || '1° Básico';
    const subject = body.asignatura?.trim() || 'Historia, Geografía y Ciencias Sociales';
    const oa = body.oa?.trim() || 'Objetivo de aprendizaje';
    const style = body.estilo?.trim() || 'ilustración infantil';
    const aspectRatio = body.aspectRatio?.trim() || '16:9';
    const force = body.force === true;

    const contextInput = {
      grade,
      subject,
      oa,
      resourceTitle: body.tema,
      slideTitle: body.tema,
      slideContent: `Contenido educativo sobre ${body.tema} para ${grade} de ${subject}. Objetivo: ${oa}. Contexto chileno/latinoamericano.`,
      countryContext: 'Chile / Latinoamérica',
      style,
      aspectRatio,
      slideId: `creative-${Date.now()}`,
      force,
    };

    const imageContext = normalizeImageContext(contextInput);
    const prompt = buildEducationalImagePrompt(imageContext);
    const cacheKey = await buildImageCacheKey(imageContext);

    if (!force) {
      const cached = await getCached(ctx.env, cacheKey);
      if (cached) {
        return imageJsonResponse({
          ok: true,
          url: cached.url,
          source: cached.source,
          prompt: cached.prompt,
          cached: true,
        }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
      }
    }

    let result = await tryWikimedia(imageContext, prompt, cacheKey);
    if (!result) result = await tryPollinations(imageContext, prompt, cacheKey);
    if (!result) result = svgFallback(imageContext, prompt, cacheKey);

    await putCached(ctx.env, imageContext, result);

    return imageJsonResponse({
      ok: true,
      url: result.url,
      source: result.source,
      prompt: result.prompt,
      cached: false,
      warning: result.warning,
    }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error generando imagen creativa';
    return imageJsonResponse({ ok: false, error: message }, { status: 500 });
  }
}