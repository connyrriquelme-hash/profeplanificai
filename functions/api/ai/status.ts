import { statusProviders } from '../../_lib/ai/providers';
import type { AIEnv } from '../../_lib/ai/types';

export async function onRequestGet(context: EventContext<AIEnv>): Promise<Response> {
  const { providers, recommended } = await statusProviders(context.env);
  return Response.json({
    ok: true,
    providers: {
      gemini: providers.gemini.available,
      workersAI: providers['workers-ai'].available,
      openrouter: providers.openrouter.available,
      huggingface: providers.huggingface.available,
      local: true,
    },
    models: {
      gemini: providers.gemini.model || null,
      workersAI: providers['workers-ai'].model || null,
      openrouter: providers.openrouter.model || null,
      huggingface: providers.huggingface.model || null,
    },
    recommendedProvider: recommended,
    fallbackAvailable: true,
  });
}
