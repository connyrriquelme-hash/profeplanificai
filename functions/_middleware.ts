import { verifyToken } from './_lib/auth';

interface Env { JWT_SECRET: string }

export async function onRequest(context: EventContext<Env>): Promise<Response> {
  const { request, next } = context;
  const origin = request.headers.get('Origin') || '*';

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const path = new URL(request.url).pathname;
  const protectedRoute = /^\/api\/(data|agent(?:\/|$)|ai(?:\/|$)|generate-activity(?:\/|$))/.test(path)
    || (/^\/api\/admin(?:\/|$)/.test(path) && !/^\/api\/admin\/import-/.test(path));
  if (protectedRoute) {
    const auth = request.headers.get('Authorization');
    const payload = auth?.startsWith('Bearer ')
      ? await verifyToken(auth.slice(7), context.env.JWT_SECRET)
      : null;
    if (!payload) {
      return Response.json({ error: 'Sesión inválida o expirada' }, {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': origin },
      });
    }
  }

  const response = await next();

  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', origin);
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
