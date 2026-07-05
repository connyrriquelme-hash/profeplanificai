import { verifyToken } from './_lib/auth';

interface Env { JWT_SECRET: string }

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequest(context: EventContext<Env>): Promise<Response> {
  const { request, next } = context;
  const origin = request.headers.get('Origin') || '*';

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        ...CORS_HEADERS,
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const path = new URL(request.url).pathname;
  const protectedRoute = /^\/api\/(data|agent(?:\/|$)|ai\/generate(?:\/|$)|images(?:\/|$)|generate-activity(?:\/|$)|my-classes(?:\/|$)|lessons(?:\/|$))/.test(path)
    || (/^\/api\/admin(?:\/|$)/.test(path) && !/^\/api\/admin\/import-/.test(path));
  if (protectedRoute) {
    const auth = request.headers.get('Authorization');
    const payload = auth?.startsWith('Bearer ')
      ? await verifyToken(auth.slice(7), context.env.JWT_SECRET)
      : null;
    if (!payload) {
      return Response.json({ error: 'Sesion invalida o expirada' }, {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': origin },
      });
    }
  }

  let response: Response;
  try {
    response = await next();
  } catch (err) {
    console.error(`[middleware] Worker error on ${request.method} ${path}:`, err);
    const isApi = path.startsWith('/api/');
    if (isApi) {
      return Response.json({ error: 'Error interno del servidor.' }, {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': origin, ...CORS_HEADERS },
      });
    }
    return new Response('Internal Server Error', { status: 500 });
  }

  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', origin);
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (path.startsWith('/api/')) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      console.error(`[middleware] Non-JSON response on ${path}: status=${response.status} content-type=${contentType}`);
      return Response.json({ error: 'Error interno del servidor.' }, {
        status: response.status >= 400 ? response.status : 500,
        headers: newHeaders,
      });
    }
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
