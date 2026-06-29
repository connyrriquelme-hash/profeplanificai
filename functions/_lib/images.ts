export type ImageSource = 'wikimedia' | 'cloudflare-ai' | 'pollinations' | 'huggingface' | 'svg-fallback';

export interface EducationalImageContext {
  grade: string;
  subject: string;
  oa: string;
  resourceTitle: string;
  slideTitle: string;
  slideContent: string;
  countryContext?: string;
  style?: string;
  aspectRatio?: string;
  slideId?: string;
  force?: boolean;
}

export interface EducationalImageResult {
  ok: boolean;
  url: string;
  source: ImageSource;
  license: string;
  author: string;
  attribution?: string;
  prompt: string;
  cached: boolean;
  cacheKey: string;
  warning?: string;
}

interface ImageD1Database {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
}

export interface ImageEnv {
  DB?: ImageD1Database;
  AI?: { run: (model: string, input: unknown) => Promise<unknown> };
  IMAGE_PROVIDER_ORDER?: string;
  ENABLE_IMAGE_AI?: string;
  HF_API_TOKEN?: string;
  IMAGE_CACHE_TTL_DAYS?: string;
}

const STYLE_OPTIONS = new Set(['ilustración infantil', 'editorial escolar', 'acuarela', 'infografía simple']);

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  historia: ['Chile', 'comunidad', 'barrio', 'escuela', 'familia', 'fiestas patrias', 'mapa de Chile', 'patrimonio', 'pueblos originarios', 'paisaje chileno'],
  ciencias: ['flora chilena', 'fauna chilena', 'ecosistema', 'agua', 'reciclaje', 'plantas', 'animales', 'cordillera', 'océano Pacífico'],
  lenguaje: ['biblioteca escolar', 'niños leyendo', 'cuento ilustrado', 'sala de clases', 'lectura compartida'],
  matemática: ['material concreto', 'bloques', 'patrones', 'conteo', 'números', 'sala de clases'],
  artes: ['colores', 'mural escolar', 'instrumentos', 'cultura latinoamericana', 'textiles', 'formas'],
};

function clean(value: unknown, max = 360): string {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function normalizeStyle(style?: string): string {
  const value = clean(style || 'ilustración infantil', 80).toLowerCase();
  return STYLE_OPTIONS.has(value) ? value : 'ilustración infantil';
}

function subjectKeywords(subject: string): string[] {
  const s = subject.toLowerCase();
  if (s.includes('historia') || s.includes('geografía') || s.includes('sociales')) return SUBJECT_KEYWORDS.historia;
  if (s.includes('ciencia')) return SUBJECT_KEYWORDS.ciencias;
  if (s.includes('lenguaje') || s.includes('comunicación')) return SUBJECT_KEYWORDS.lenguaje;
  if (s.includes('matem')) return SUBJECT_KEYWORDS.matemática;
  if (s.includes('arte')) return SUBJECT_KEYWORDS.artes;
  return ['Chile', 'Latinoamérica', 'escuela', 'comunidad', 'aula', 'aprendizaje'];
}

export function normalizeImageContext(input: unknown): EducationalImageContext {
  const raw = (input && typeof input === 'object') ? input as Record<string, unknown> : {};
  return {
    grade: clean(raw.grade || raw.curso, 80) || '1° Básico',
    subject: clean(raw.subject || raw.asignatura, 120) || 'Historia, Geografía y Ciencias Sociales',
    oa: clean(raw.oa, 520) || 'Objetivo de aprendizaje',
    resourceTitle: clean(raw.resourceTitle || raw.tituloRecurso, 160) || 'Recurso pedagógico',
    slideTitle: clean(raw.slideTitle || raw.tituloDiapositiva, 140) || 'Imagen educativa',
    slideContent: clean(raw.slideContent || raw.contenidoDiapositiva, 620) || '',
    countryContext: clean(raw.countryContext, 80) || 'Chile / Latinoamérica',
    style: normalizeStyle(clean(raw.style, 80)),
    aspectRatio: clean(raw.aspectRatio, 20) || '16:9',
    slideId: clean(raw.slideId, 80) || 'slide-1',
    force: Boolean(raw.force),
  };
}

export function buildEducationalImagePrompt(context: EducationalImageContext): string {
  const style = normalizeStyle(context.style);
  const keywords = subjectKeywords(context.subject).slice(0, 6).join(', ');
  const scene = [context.slideTitle, context.slideContent, context.oa].filter(Boolean).join('. ');
  return [
    `Ilustración educativa horizontal ${context.aspectRatio || '16:9'} para estudiantes de ${context.grade} en Chile.`,
    `Asignatura: ${context.subject}. OA: ${context.oa}.`,
    `Escena: ${scene}.`,
    `Contexto visual sugerido: ${keywords}.`,
    `Estilo ${style}, editorial escolar, composición limpia, colores cálidos, adecuada para una presentación educativa.`,
    'Sin texto dentro de la imagen, sin logos, sin marcas de agua, sin personajes con copyright, sin rostros realistas de niñas o niños.',
  ].join(' ');
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function buildImageCacheKey(context: EducationalImageContext): Promise<string> {
  const hash = (await sha256([context.oa, context.slideTitle, context.slideContent, context.style].join('|'))).slice(0, 18);
  const parts = [context.grade, context.subject, context.oa.slice(0, 32), context.slideId || 'slide', hash, context.style]
    .map(v => clean(v, 80).toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-').replace(/^-+|-+$/g, ''));
  return `image:${parts.join(':')}`;
}

function jsonHeaders(extra?: HeadersInit): HeadersInit {
  return { 'Content-Type': 'application/json; charset=utf-8', ...(extra || {}) };
}

export async function getCached(env: ImageEnv, cacheKey: string): Promise<EducationalImageResult | null> {
  if (!env.DB) return null;
  const row = await env.DB.prepare(
    'SELECT cache_key, prompt, url, source, license, author, attribution, expires_at FROM image_cache WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > datetime("now"))'
  ).bind(cacheKey).first<{
    cache_key: string; prompt: string; url: string; source: ImageSource; license?: string; author?: string; attribution?: string;
  }>();
  if (!row) return null;
  return {
    ok: true,
    url: row.url,
    source: row.source,
    license: row.license || '',
    author: row.author || '',
    attribution: row.attribution || '',
    prompt: row.prompt,
    cached: true,
    cacheKey: row.cache_key,
  };
}

export async function putCached(env: ImageEnv, context: EducationalImageContext, result: EducationalImageResult): Promise<void> {
  if (!env.DB) return;
  const ttlDays = Math.max(1, Math.min(365, Number(env.IMAGE_CACHE_TTL_DAYS || 30) || 30));
  const expires = new Date(Date.now() + ttlDays * 86400000).toISOString();
  await env.DB.prepare(
    `INSERT OR REPLACE INTO image_cache
      (cache_key, context_json, prompt, url, source, license, author, attribution, provider_meta, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    result.cacheKey,
    JSON.stringify(context),
    result.prompt,
    result.url,
    result.source,
    result.license || '',
    result.author || '',
    result.attribution || '',
    JSON.stringify({ cachedAt: new Date().toISOString() }),
    expires
  ).run();
}

function firstWords(text: string, count: number): string {
  return clean(text, 260).split(/\s+/).filter(w => w.length > 2).slice(0, count).join(' ');
}

function wikimediaQuery(context: EducationalImageContext): string {
  const kw = subjectKeywords(context.subject);
  const terms = [
    firstWords(context.slideTitle, 5),
    firstWords(context.oa, 8),
    ...kw.slice(0, 5),
    'educación',
  ].filter(Boolean);
  return terms.join(' ');
}

function metaValue(ext: Record<string, { value?: string }> | undefined, key: string): string {
  return clean(ext?.[key]?.value || '', 220);
}

function acceptableLicense(value: string): boolean {
  const license = value.toLowerCase();
  return /public domain|cc0|cc-by|cc by|creative commons|pd/i.test(license) && !/noncommercial|no derivatives|fair use/i.test(license);
}

export async function tryWikimedia(context: EducationalImageContext, prompt: string, cacheKey: string): Promise<EducationalImageResult | null> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '8',
    gsrsearch: wikimediaQuery(context),
    prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata',
    iiurlwidth: '1280',
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {
    headers: { 'User-Agent': 'PlanificaIA-Chile/2.0 educational image search' },
  });
  if (!response.ok) return null;
  const data = await response.json() as { query?: { pages?: Record<string, { title?: string; imageinfo?: Array<{ url?: string; thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }> }> } };
  const pages = Object.values(data.query?.pages || {});
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.url || !info.mime?.startsWith('image/')) continue;
    if (/svg/i.test(info.mime)) continue;
    const ext = info.extmetadata;
    const license = metaValue(ext, 'LicenseShortName') || metaValue(ext, 'UsageTerms') || 'Wikimedia Commons';
    const restrictions = `${metaValue(ext, 'Restrictions')} ${metaValue(ext, 'Copyrighted')}`.toLowerCase();
    if (restrictions.includes('watermark')) continue;
    if (license && !acceptableLicense(license)) continue;
    const author = metaValue(ext, 'Artist') || 'Autor no especificado';
    const description = metaValue(ext, 'ImageDescription');
    const pageUrl = metaValue(ext, 'ObjectURL') || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || '')}`;
    return {
      ok: true,
      url: info.thumburl || info.url,
      source: 'wikimedia',
      license,
      author,
      attribution: [description, author, license, pageUrl].filter(Boolean).join(' · '),
      prompt,
      cached: false,
      cacheKey,
    };
  }
  return null;
}

async function tryCloudflareAI(env: ImageEnv, context: EducationalImageContext, prompt: string, cacheKey: string): Promise<EducationalImageResult | null> {
  if (!env.AI || String(env.ENABLE_IMAGE_AI || 'false').toLowerCase() !== 'true') return null;
  try {
    const output = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt,
      width: 1024,
      height: 576,
    }) as { image?: string; data?: string } | ArrayBuffer;
    let base64 = '';
    if (output instanceof ArrayBuffer) {
      const bytes = new Uint8Array(output);
      base64 = btoa(String.fromCharCode(...bytes));
    } else {
      base64 = output.image || output.data || '';
    }
    if (!base64) return null;
    return {
      ok: true,
      url: base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`,
      source: 'cloudflare-ai',
      license: 'Generada por IA para uso educativo',
      author: 'PlanificaIA Chile + Cloudflare Workers AI',
      attribution: 'Imagen generada por IA desde backend Cloudflare.',
      prompt,
      cached: false,
      cacheKey,
    };
  } catch {
    return null;
  }
}

export async function tryPollinations(context: EducationalImageContext, prompt: string, cacheKey: string): Promise<EducationalImageResult | null> {
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true&safe=true&enhance=true&seed=${encodeURIComponent(cacheKey.slice(-12))}`;
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (!head.ok && head.status !== 405) return null;
  } catch {
    // Some providers do not support HEAD; returning the URL still lets the browser load it through the backend decision.
  }
  return {
    ok: true,
    url,
    source: 'pollinations',
    license: 'Imagen generada por IA; revisar antes de publicación externa',
    author: 'Pollinations vía backend Cloudflare',
    attribution: 'Imagen generada por IA desde proveedor configurable sin exponer claves.',
    prompt,
    cached: false,
    cacheKey,
  };
}

async function tryHuggingFace(env: ImageEnv, prompt: string, cacheKey: string): Promise<EducationalImageResult | null> {
  if (!env.HF_API_TOKEN || String(env.ENABLE_IMAGE_AI || 'false').toLowerCase() !== 'true') return null;
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { width: 1024, height: 576, guidance_scale: 7 },
        options: { wait_for_model: true },
      }),
    });
    if (!response.ok) return null;
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.startsWith('image/')) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.slice(i, i + 0x8000));
    }
    return {
      ok: true,
      url: `data:${contentType};base64,${btoa(binary)}`,
      source: 'huggingface',
      license: 'Imagen generada por IA; revisar antes de publicación externa',
      author: 'Hugging Face Inference vía backend Cloudflare',
      attribution: 'Imagen generada por IA desde backend Cloudflare con secreto HF_API_TOKEN.',
      prompt,
      cached: false,
      cacheKey,
    };
  } catch {
    return null;
  }
}

export function svgFallback(context: EducationalImageContext, prompt: string, cacheKey: string): EducationalImageResult {
  const title = clean(context.slideTitle || context.resourceTitle, 70);
  const subject = clean(context.subject, 46);
  const grade = clean(context.grade, 30);
  const palette = context.subject.toLowerCase().includes('historia')
    ? ['#0f766e', '#f59e0b', '#fef3c7']
    : context.subject.toLowerCase().includes('ciencia')
    ? ['#166534', '#0ea5e9', '#dcfce7']
    : context.subject.toLowerCase().includes('matem')
    ? ['#4f46e5', '#06b6d4', '#eef2ff']
    : ['#7c3aed', '#14b8a6', '#f5f3ff'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${palette[0]}"/><stop offset="1" stop-color="${palette[1]}"/></linearGradient>
    <pattern id="p" width="96" height="96" patternUnits="userSpaceOnUse"><path d="M0 48h96M48 0v96" stroke="rgba(255,255,255,.12)" stroke-width="3"/><circle cx="48" cy="48" r="10" fill="rgba(255,255,255,.13)"/></pattern>
  </defs>
  <rect width="1280" height="720" rx="42" fill="url(#g)"/>
  <rect width="1280" height="720" fill="url(#p)"/>
  <path d="M0 560 C210 500 320 640 520 585 C720 528 820 470 1030 540 C1130 575 1210 558 1280 520 L1280 720 L0 720Z" fill="${palette[2]}" opacity=".92"/>
  <g transform="translate(800 145)" fill="none" stroke="white" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity=".9">
    <path d="M50 350 h290"/>
    <path d="M95 350 V160 l95-70 95 70 v190"/>
    <path d="M145 350 V245 h90 v105"/>
    <path d="M190 90 V35"/>
    <path d="M122 190 h136"/>
    <path d="M122 228 h136"/>
    <circle cx="190" cy="285" r="22"/>
  </g>
  <g transform="translate(100 105)">
    <rect x="0" y="0" width="650" height="410" rx="36" fill="rgba(255,255,255,.93)"/>
    <text x="48" y="78" font-family="Inter,Arial,sans-serif" font-size="32" font-weight="800" fill="${palette[0]}">${escapeXml(grade)}</text>
    <text x="48" y="132" font-family="Inter,Arial,sans-serif" font-size="28" font-weight="700" fill="#111827">${escapeXml(subject)}</text>
    <foreignObject x="48" y="170" width="550" height="155">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Inter,Arial,sans-serif;font-size:44px;font-weight:900;line-height:1.08;color:#111827">${escapeHtml(title)}</div>
    </foreignObject>
    <text x="48" y="362" font-family="Inter,Arial,sans-serif" font-size="24" fill="#475569">Visual educativo Chile / Latinoamérica</text>
  </g>
</svg>`;
  return {
    ok: true,
    url: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`,
    source: 'svg-fallback',
    license: 'SVG original generado localmente',
    author: 'PlanificaIA Chile',
    attribution: 'Ilustración SVG original generada localmente como fallback seguro.',
    prompt,
    cached: false,
    cacheKey,
    warning: 'No se encontró una imagen libre adecuada o proveedor IA disponible; se usó fallback SVG.',
  };
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch] || ch));
}

function escapeHtml(value: string): string {
  return escapeXml(value);
}

export async function generateEducationalImage(input: unknown, env: ImageEnv): Promise<EducationalImageResult> {
  const context = normalizeImageContext(input);
  const prompt = buildEducationalImagePrompt(context);
  const cacheKey = await buildImageCacheKey(context);
  if (!context.force) {
    const cached = await getCached(env, cacheKey);
    if (cached) return cached;
  }

  const order = (env.IMAGE_PROVIDER_ORDER || 'wikimedia,cloudflare-ai,pollinations,huggingface,svg')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  let result: EducationalImageResult | null = null;
  for (const provider of order) {
    if (provider === 'wikimedia') result = await tryWikimedia(context, prompt, cacheKey);
    if (provider === 'cloudflare-ai') result = await tryCloudflareAI(env, context, prompt, cacheKey);
    if (provider === 'pollinations') result = await tryPollinations(context, prompt, cacheKey);
    if (provider === 'huggingface' || provider === 'hf') result = await tryHuggingFace(env, prompt, cacheKey);
    if (provider === 'svg') result = svgFallback(context, prompt, cacheKey);
    if (result) break;
  }
  result ||= svgFallback(context, prompt, cacheKey);
  await putCached(env, context, result);
  return result;
}

export function imageJsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), { ...init, headers: jsonHeaders(init?.headers) });
}
