/**
 * Worker entry point for Cloudflare Workers.
 * API endpoints are handled by Pages Functions in /functions.
 */
export default {
  async fetch(_request: Request): Promise<Response> {
    return new Response(JSON.stringify({ error: 'Usa las rutas /api/* para acceder a la API' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
