import mammoth from 'mammoth';
import { getAuthenticatedUserId } from '../_lib/auth';

interface Env {
  JWT_SECRET: string;
}

interface ExtractRequestBody {
  url?: string;
}

interface ExtractSuccess {
  ok: true;
  texto: string;
  fuente: 'url' | 'docx';
  titulo?: string;
}

interface ExtractFailure {
  ok: false;
  error: string;
}

const MAX_CHARS = 10000;
const FETCH_TIMEOUT_MS = 10000;
const USER_AGENT = 'Mozilla/5.0 (compatible; ProfePlanificAI/1.0; +https://planificaia.cl)';

// El caller (FlujoDocenteView.tsx) muestra `error` directo al docente sin
// distinguir status code, y la tarea pide explícitamente "nunca 500" para
// fallos esperables (URL caída, .docx corrupto) — así que todo fallo
// conocido responde 400 con un mensaje accionable; nunca 5xx.
function fail(error: string): Response {
  return Response.json({ ok: false, error } satisfies ExtractFailure, { status: 400 });
}

function ok(payload: Omit<ExtractSuccess, 'ok'>): Response {
  return Response.json({ ok: true, ...payload } satisfies ExtractSuccess);
}

function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  };
  return text
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name: string) => named[name] ?? '')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

function extractMetaContent(html: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]).trim();
  }
  return '';
}

function extractPageTitle(html: string): string {
  const ogTitle = extractMetaContent(html, 'og:title');
  if (ogTitle) return ogTitle;
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(match[1]).replace(/\s+/g, ' ').trim() : '';
}

// Se queda con <article>/<main> si existen (contenido probable) antes de
// limpiar — evita que texto de tarjetas de "artículos relacionados" fuera
// de esas zonas contamine el resultado, sin necesitar un parser DOM real.
function extractMainHtml(html: string): string {
  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (article) return article[1];
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (main) return main[1];
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return body ? body[1] : html;
}

function stripHtmlToText(html: string): string {
  let cleaned = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ');

  // Marca saltos de línea en límites de bloque/heading/lista ANTES de
  // tirar el resto de las etiquetas, para no soldar párrafos entre sí.
  cleaned = cleaned
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/(p|h1|h2|h3|h4|h5|h6|li|div|tr|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  cleaned = decodeHtmlEntities(cleaned);
  return cleaned
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function isYouTubeUrl(url: URL): boolean {
  const host = url.hostname.replace(/^www\./, '');
  return host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be';
}

async function handleUrlExtraction(rawUrl: string): Promise<Response> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return fail('La URL ingresada no es válida.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return fail('Solo se admiten URLs http o https.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let html: string;
  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    });
    if (!response.ok) {
      return fail(`No se pudo acceder a la URL (HTTP ${response.status}).`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('html')) {
      return fail('La URL no apunta a una página web (HTML).');
    }
    html = await response.text();
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'AbortError';
    return fail(timedOut ? 'La página tardó demasiado en responder.' : 'No se pudo conectar a la URL indicada.');
  } finally {
    clearTimeout(timeout);
  }

  const titulo = extractPageTitle(html) || undefined;

  if (isYouTubeUrl(parsed)) {
    const descripcion = extractMetaContent(html, 'og:description');
    const texto = [titulo, descripcion].filter(Boolean).join('\n\n').slice(0, MAX_CHARS);
    if (!texto) {
      return fail('No se pudo extraer título ni descripción del video de YouTube. Nota: esto no incluye la transcripción del video, solo metadata pública.');
    }
    return ok({ texto, fuente: 'url', titulo });
  }

  const texto = stripHtmlToText(extractMainHtml(html)).slice(0, MAX_CHARS);
  if (texto.length < 20) {
    return fail('No se encontró contenido de texto legible en esa URL.');
  }

  return ok({ texto, fuente: 'url', titulo });
}

async function handleDocxUpload(request: Request): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail('No se pudo leer el archivo enviado.');
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return fail('Debes adjuntar un archivo .docx.');
  }
  if (!file.name.toLowerCase().endsWith('.docx')) {
    return fail('Solo se admiten archivos .docx (Word).');
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    return fail('No se pudo leer el contenido del archivo adjunto.');
  }

  try {
    // mammoth resuelve a una implementación distinta de unzip según quién
    // haga el require: el campo "browser" de mammoth/package.json (que
    // Wrangler/esbuild sí respeta al bundlear para Workers) solo acepta
    // { arrayBuffer }; la resolución Node normal (p.ej. Vitest important
    // el paquete sin pasar por un bundler) carga lib/unzip.js, que solo
    // acepta { buffer }. Se pasan ambas claves derivadas del mismo archivo
    // — cada implementación ignora la que no reconoce — para no depender
    // de adivinar cuál de las dos rutas resuelve el entorno de ejecución.
    const input = { arrayBuffer, buffer: new Uint8Array(arrayBuffer) } as unknown as Parameters<typeof mammoth.extractRawText>[0];
    const { value } = await mammoth.extractRawText(input);
    const texto = value.trim().slice(0, MAX_CHARS);
    if (!texto) {
      return fail('El archivo Word no contiene texto extraíble.');
    }
    return ok({ texto, fuente: 'docx', titulo: file.name.replace(/\.docx$/i, '') });
  } catch (err) {
    console.error('[extract-content] mammoth error:', err);
    return fail('No se pudo procesar el archivo Word. Verifica que sea un .docx válido (no .doc).');
  }
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getAuthenticatedUserId(context.request, context.env.JWT_SECRET);
    if (!userId) {
      return Response.json({ ok: false, error: 'Sesión inválida o expirada' } satisfies ExtractFailure, { status: 401 });
    }

    const contentType = context.request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      return await handleDocxUpload(context.request);
    }

    const body = await context.request.json<ExtractRequestBody>().catch(() => ({}) as ExtractRequestBody);
    const url = (body.url || '').trim();
    if (!url) {
      return fail('Falta la URL o el archivo a procesar.');
    }

    return await handleUrlExtraction(url);
  } catch (err) {
    console.error('[extract-content] Error:', err);
    return fail('No se pudo extraer el contenido.');
  }
}

export async function onRequest(): Promise<Response> {
  return Response.json({ ok: false, error: 'Método no permitido. Use POST.' } satisfies ExtractFailure, { status: 405 });
}
