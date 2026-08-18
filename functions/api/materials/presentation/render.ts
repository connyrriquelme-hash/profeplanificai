import { PptDeckSchema } from '../../../../schemas/PptDeckSchema';
import type { PptDeck, ImageTextSlide } from '../../../../schemas/PptDeckSchema';
import { buildRenderableDeck } from '../../../core/PptLayoutEngine';
import { renderPptx } from '../../../core/PptRenderer';
import { getAuthenticatedUserId } from '../../../_lib/auth';
import { generateEducationalImage, type ImageEnv } from '../../../_lib/images';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  AI?: ImageEnv['AI'];
  ENABLE_IMAGE_AI?: string;
  IMAGE_PROVIDER_ORDER?: string;
  HF_API_TOKEN?: string;
  IMAGE_CACHE_TTL_DAYS?: string;
}

interface RenderRequest {
  resourceId?: string;
  deck?: PptDeck;
}

async function getUserInstitution(db: D1Database, userId: string): Promise<string | null> {
  const row = await db.prepare(
    `SELECT institution_id FROM institution_members WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
  ).bind(userId).first<{ institution_id: string }>();
  return row?.institution_id || null;
}

function isResolvedImageUrl(value: string): boolean {
  return value.startsWith('http') || value.startsWith('data:');
}

// pptxgenjs, cuando addImage() recibe una URL http(s):// en `path`, la
// descarga con el módulo `https` nativo de Node (node_modules/pptxgenjs/
// dist/pptxgen.cjs.js ~línea 4890) o, si no detecta Node, con
// XMLHttpRequest (navegador). Cloudflare Workers no es ninguno de los
// dos — no tiene `https`/`fs` de Node ni `XMLHttpRequest` — así que ese
// download interno de pptxgenjs falla en silencio y el .pptx termina con
// una imagen de 0 bytes (referencia XML válida, contenido vacío).
// Por eso descargamos la imagen nosotros mismos acá con fetch() (que sí
// funciona en Workers) y la convertimos a data: URI en base64 — así
// PptRenderer nunca recibe una URL http(s), solo data: URIs, que sí
// renderiza bien.
// pptxgenjs, para embeber un SVG, necesita generar además una versión PNG
// de "vista previa" (PowerPoint/OOXML exige ambas relaciones) dibujando el
// SVG en un <canvas> vía `new Image()` — APIs de navegador que no existen
// en el runtime de Cloudflare Workers (confirmado: pptxgen.cjs.js:4981,
// createSvgPngPreview). Cualquier data: URI image/svg+xml — como el que
// devuelve nuestro propio svgFallback() en _lib/images.ts — revienta el
// render completo con "Image is not defined". No hay forma de rasterizar
// SVG a PNG sin DOM/canvas en Workers, así que tratamos SVG como
// "no embebible" acá y dejamos que el slide quede sin imagen (igual que
// cualquier otro fallo de proveedor), en vez de que pptxgenjs truene.
function isEmbeddableImageDataUri(dataUri: string): boolean {
  return !dataUri.toLowerCase().startsWith('data:image/svg+xml');
}

async function toEmbeddableDataUri(url: string): Promise<string> {
  if (url.startsWith('data:')) {
    return isEmbeddableImageDataUri(url) ? url : '';
  }
  try {
    const response = await fetch(url);
    if (!response.ok) return '';
    const contentType = response.headers.get('content-type') || 'image/png';
    const bytes = new Uint8Array(await response.arrayBuffer());
    // Pollinations (y potencialmente otros proveedores gratuitos) a veces
    // responde 200 + content-type válido pero con el body vacío para
    // prompts largos/complejos (confirmado: Content-Length: 0 real contra
    // el prompt educativo completo, ~1500 caracteres). Sin este check se
    // incrusta una imagen "exitosa" pero vacía en vez de omitirla
    // limpiamente como cuando el proveedor falla de plano.
    if (bytes.length === 0) return '';
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const dataUri = `data:${contentType};base64,${btoa(binary)}`;
    return isEmbeddableImageDataUri(dataUri) ? dataUri : '';
  } catch {
    return '';
  }
}

async function resolveSlideImage(
  slide: ImageTextSlide,
  imageContext: { grade: string; subject: string; oa: string },
  env: ImageEnv,
): Promise<string> {
  const result = await generateEducationalImage({
    grade: imageContext.grade,
    subject: imageContext.subject,
    oa: imageContext.oa,
    resourceTitle: 'Presentación',
    slideTitle: slide.title,
    slideContent: slide.body.slice(0, 300),
  }, env);
  if (!result.ok) return '';
  return toEmbeddableDataUri(result.url);
}

// Resuelve imageQuery (texto descriptivo generado por PptContentEngine) a
// una imagen embebible ANTES de renderizar — PptRenderer.isValidImageSource()
// solo acepta data:/http(s):// y omite en silencio cualquier otra cosa, así
// que sin este paso los slides image_text nunca llevan imagen. Mismo patrón
// que guide.ts:62-73 (Promise.allSettled en paralelo, nunca bloquea el
// render completo si un proveedor o una descarga falla).
async function resolveDeckImages(
  deck: PptDeck,
  imageContext: { grade: string; subject: string; oa: string },
  env: ImageEnv,
): Promise<void> {
  const targets: ImageTextSlide[] = [];
  for (const slide of deck.slides) {
    if (slide.layout === 'image_text' && slide.imageQuery && !isResolvedImageUrl(slide.imageQuery)) {
      targets.push(slide);
    }
  }
  if (targets.length === 0) return;

  const results = await Promise.allSettled(
    targets.map((slide) => resolveSlideImage(slide, imageContext, env)),
  );

  results.forEach((result, i) => {
    const slide = targets[i];
    // String vacío en vez de undefined: imageQuery no es opcional en
    // ImageTextSlide, e isValidImageSource() de PptRenderer ya trata
    // cualquier valor falsy como "sin imagen" (omite limpiamente).
    slide.imageQuery = result.status === 'fulfilled' ? result.value : '';
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'presentacion';
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getAuthenticatedUserId(context.request, context.env.JWT_SECRET);
    if (!userId) {
      return Response.json({ error: 'Sesión inválida o expirada' }, { status: 401 });
    }

    const body = await context.request.json() as RenderRequest;
    const db = context.env.DB;

    if (!body.resourceId && !body.deck) {
      return Response.json({ error: 'Se requiere resourceId o deck' }, { status: 400 });
    }

    let deck: PptDeck;
    let imageContext = { grade: '', subject: '', oa: '' };

    if (body.resourceId) {
      const resource = await db.prepare(
        `SELECT content_json, user_id, level, subject, objective_code FROM generated_resources WHERE id = ?`,
      ).bind(body.resourceId).first<{ content_json: string; user_id: string | null; level: string | null; subject: string | null; objective_code: string | null }>();

      if (!resource) {
        return Response.json({ error: 'Recurso no encontrado' }, { status: 400 });
      }

      let contentJson: Record<string, unknown>;
      try {
        contentJson = JSON.parse(resource.content_json);
      } catch {
        return Response.json({ error: 'Recurso corrupto: content_json inválido' }, { status: 400 });
      }

      if (!contentJson.pptDeck) {
        return Response.json({ error: 'No hay PptDeck para este recurso. Usa la generación con IA (sin slides manuales).' }, { status: 400 });
      }

      // Institution cross-check: verify the requesting user is in the same institution
      // as the resource owner (if the resource has an owner).
      if (resource.user_id && resource.user_id !== userId) {
        const requesterInst = await getUserInstitution(db, userId);
        const ownerInst = await getUserInstitution(db, resource.user_id);
        if (!requesterInst || !ownerInst || requesterInst !== ownerInst) {
          return Response.json({ error: 'No tienes permiso para acceder a este recurso' }, { status: 403 });
        }
      }

      deck = contentJson.pptDeck as PptDeck;
      imageContext = { grade: resource.level || '', subject: resource.subject || '', oa: resource.objective_code || '' };
    } else {
      deck = body.deck!;
    }

    // Validate deck
    const parsed = PptDeckSchema.safeParse(deck);
    if (!parsed.success) {
      return Response.json({
        error: 'PptDeck inválido',
        details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      }, { status: 400 });
    }

    // Resuelve imageQuery -> URL real antes de renderizar (ver resolveDeckImages)
    const imageEnv: ImageEnv = {
      DB: context.env.DB,
      AI: context.env.AI,
      ENABLE_IMAGE_AI: context.env.ENABLE_IMAGE_AI,
      IMAGE_PROVIDER_ORDER: context.env.IMAGE_PROVIDER_ORDER,
      HF_API_TOKEN: context.env.HF_API_TOKEN,
      IMAGE_CACHE_TTL_DAYS: context.env.IMAGE_CACHE_TTL_DAYS,
    };
    await resolveDeckImages(parsed.data, imageContext, imageEnv);

    // Render
    const renderables = buildRenderableDeck(parsed.data);
    const buffer = await renderPptx(renderables);

    // Derive filename from first title slide
    const titleSlide = parsed.data.slides.find(s => s.layout === 'title') as { title: string } | undefined;
    const filename = titleSlide ? `${slugify(titleSlide.title)}.pptx` : 'presentacion.pptx';

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return Response.json({ error: 'Error al renderizar presentación', details: err.message }, { status: 500 });
  }
}
