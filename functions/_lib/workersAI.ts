/**
 * env.AI.run() no devuelve una forma consistente entre modelos: los modelos
 * chat pequeños (@cf/meta/llama-3.2-3b-instruct) suelen devolver
 * {response: "..."}, pero @cf/meta/llama-3.3-70b-instruct-fp8-fast devuelve
 * forma estilo OpenAI ({choices: [{message: {content: "..."}}], ...}) --
 * confirmado contra el servidor real (generate-indicators.ts devolvía
 * siempre el fallback determinístico porque solo se revisaba `.response`,
 * que en este modelo viene vacío/ausente).
 */
export function extractWorkersAIText(result: unknown): string {
  if (typeof result === 'string') return result;
  if (result && typeof result === 'object') {
    const r = result as { response?: unknown; choices?: Array<{ message?: { content?: string } }> };
    if (typeof r.choices?.[0]?.message?.content === 'string') return r.choices[0].message!.content!;
    if (typeof r.response === 'string') return r.response;
  }
  return '';
}
