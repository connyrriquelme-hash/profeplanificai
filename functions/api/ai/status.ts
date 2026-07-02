import { statusProviders } from '../../_lib/ai/providers';
import type { AIEnv } from '../../_lib/ai/types';

export async function onRequestGet(context: EventContext<AIEnv>): Promise<Response> {
  const { providers, recommended } = await statusProviders(context.env);
  return Response.json({
    ok: true,
    providers: {
      workersAI: providers['workers-ai'].available,
      gemini: providers.gemini.available,
      openrouter: providers.openrouter.available,
      huggingface: providers.huggingface.available,
      local: true,
    },
    models: {
      workersAI: providers['workers-ai'].model || null,
      gemini: providers.gemini.model || null,
      openrouter: providers.openrouter.model || null,
      huggingface: providers.huggingface.model || null,
    },
    recommendedProvider: recommended,
    fallbackAvailable: true,
  });
}
