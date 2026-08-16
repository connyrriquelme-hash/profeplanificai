// jsdom (el entorno global de vitest.config.ts) serializa mal los bodies
// FormData/File de fetch — Content-Type queda como "text/plain" en vez del
// multipart/boundary real, y request.formData() no los puede reparsear. El
// runtime real de Cloudflare Workers (y Node nativo, verificado aparte) sí
// los maneja bien; esto es puramente una limitación de jsdom en este archivo.
// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { signToken } from './helpers/mockD1';

const TEST_SECRET = 'test-jwt-secret-with-at-least-32-characters!!';

async function makeContext(overrides: {
  body?: unknown;
  formData?: FormData;
  withAuth?: boolean;
}) {
  const withAuth = overrides.withAuth ?? true;
  const headers: Record<string, string> = {};
  if (withAuth) {
    const token = await signToken('user-1', 'user-1@test.cl', TEST_SECRET);
    headers['Authorization'] = `Bearer ${token}`;
  }

  let request: Request;
  if (overrides.formData) {
    request = new Request('http://localhost/api/extract-content', {
      method: 'POST',
      headers,
      body: overrides.formData,
    });
  } else {
    request = new Request('http://localhost/api/extract-content', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(overrides.body ?? {}),
    });
  }

  return { request, env: { JWT_SECRET: TEST_SECRET } } as any;
}

describe('POST /api/extract-content', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('debe devolver 401 sin token de sesión', async () => {
    const { onRequestPost } = await import('../functions/api/extract-content');
    const ctx = await makeContext({ body: { url: 'https://example.com' }, withAuth: false });
    const res = await onRequestPost(ctx);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.ok).toBe(false);
  });

  it('URL válida devuelve texto extraído y limpio del HTML', async () => {
    const html = `
      <html>
        <head><title>Página de prueba</title></head>
        <body>
          <nav>Menú: Inicio | Contacto</nav>
          <header>Encabezado del sitio</header>
          <main>
            <h1>El ciclo del agua</h1>
            <p>El agua se evapora con el calor del sol.</p>
            <ul><li>Evaporación</li><li>Condensación</li></ul>
            <script>console.log('no debería aparecer');</script>
            <style>.a { color: red; }</style>
          </main>
          <footer>Pie de página © 2026</footer>
        </body>
      </html>`;
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }),
    );

    const { onRequestPost } = await import('../functions/api/extract-content');
    const ctx = await makeContext({ body: { url: 'https://example.com/ciclo-agua' } });
    const res = await onRequestPost(ctx);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.fuente).toBe('url');
    expect(data.titulo).toBe('Página de prueba');
    expect(data.texto).toContain('El ciclo del agua');
    expect(data.texto).toContain('El agua se evapora con el calor del sol.');
    expect(data.texto).toContain('Evaporación');
    expect(data.texto).not.toContain('console.log');
    expect(data.texto).not.toContain('color: red');
    expect(data.texto).not.toContain('Menú: Inicio');
    expect(data.texto).not.toContain('Pie de página');
  });

  it('URL inválida (malformada) devuelve error claro con status 400, nunca 500', async () => {
    const { onRequestPost } = await import('../functions/api/extract-content');
    const ctx = await makeContext({ body: { url: 'no-es-una-url' } });
    const res = await onRequestPost(ctx);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(typeof data.error).toBe('string');
    expect(data.error.length).toBeGreaterThan(0);
  });

  it('URL que responde con error HTTP devuelve error claro con status 400, nunca 500', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response('Not found', { status: 404 }));

    const { onRequestPost } = await import('../functions/api/extract-content');
    const ctx = await makeContext({ body: { url: 'https://example.com/no-existe' } });
    const res = await onRequestPost(ctx);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toContain('404');
  });

  it('URL cuya conexión falla (network error) devuelve error claro con status 400, nunca 500', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down'));

    const { onRequestPost } = await import('../functions/api/extract-content');
    const ctx = await makeContext({ body: { url: 'https://example.com/inaccesible' } });
    const res = await onRequestPost(ctx);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it('falta url en el body devuelve error claro con status 400', async () => {
    const { onRequestPost } = await import('../functions/api/extract-content');
    const ctx = await makeContext({ body: {} });
    const res = await onRequestPost(ctx);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it('YouTube extrae título y descripción desde og:tags, no el HTML completo', async () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Cómo funciona el ciclo del agua">
        <meta property="og:description" content="Video educativo sobre evaporación y condensación.">
      </head><body><div id="player-shell">contenido del reproductor irrelevante</div></body></html>`;
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(html, { status: 200, headers: { 'content-type': 'text/html' } }),
    );

    const { onRequestPost } = await import('../functions/api/extract-content');
    const ctx = await makeContext({ body: { url: 'https://www.youtube.com/watch?v=abc123' } });
    const res = await onRequestPost(ctx);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.fuente).toBe('url');
    expect(data.titulo).toBe('Cómo funciona el ciclo del agua');
    expect(data.texto).toContain('Video educativo sobre evaporación y condensación.');
    expect(data.texto).not.toContain('contenido del reproductor irrelevante');
  });

  it('texto extraído nunca supera 10.000 caracteres', async () => {
    const longParagraph = `<p>${'palabra '.repeat(3000)}</p>`;
    const html = `<html><body><main>${longParagraph}</main></body></html>`;
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(html, { status: 200, headers: { 'content-type': 'text/html' } }),
    );

    const { onRequestPost } = await import('../functions/api/extract-content');
    const ctx = await makeContext({ body: { url: 'https://example.com/largo' } });
    const res = await onRequestPost(ctx);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.texto.length).toBeLessThanOrEqual(10000);
  });

  it('archivo .docx válido devuelve el texto extraído por mammoth', async () => {
    const docxPath = path.join(__dirname, 'fixtures', 'single-paragraph.docx');
    const buffer = readFileSync(docxPath);
    const file = new File([buffer], 'clase.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const formData = new FormData();
    formData.set('file', file);

    const { onRequestPost } = await import('../functions/api/extract-content');
    const ctx = await makeContext({ formData });
    const res = await onRequestPost(ctx);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.fuente).toBe('docx');
    expect(data.texto).toContain('Walking on imported air');
    expect(data.titulo).toBe('clase');
  });

  it('archivo que no es .docx devuelve error claro con status 400, nunca 500', async () => {
    const file = new File(['hola'], 'nota.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.set('file', file);

    const { onRequestPost } = await import('../functions/api/extract-content');
    const ctx = await makeContext({ formData });
    const res = await onRequestPost(ctx);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toContain('.docx');
  });

  it('archivo .docx corrupto (no es un zip válido) devuelve error claro con status 400, nunca 500', async () => {
    const file = new File(['esto no es un docx real'], 'roto.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const formData = new FormData();
    formData.set('file', file);

    const { onRequestPost } = await import('../functions/api/extract-content');
    const ctx = await makeContext({ formData });
    const res = await onRequestPost(ctx);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it('debe devolver 405 para métodos distintos de POST', async () => {
    const { onRequest } = await import('../functions/api/extract-content');
    const res = await onRequest();
    const data = await res.json();

    expect(res.status).toBe(405);
    expect(data.ok).toBe(false);
  });
});
