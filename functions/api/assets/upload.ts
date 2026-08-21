import { z } from 'zod';
import { requireAuthContext, requireActiveAuthContext } from '../../_lib/auth-adapter';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  ASSETS_BUCKET: R2Bucket;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

const UploadSchema = z.object({
  dataUrl: z.string().min(1).refine(v => v.startsWith('data:'), 'Debe ser un data: URL'),
  filename: z.string().trim().max(200).optional(),
});

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function extensionForContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
    'image/svg+xml': 'svg', 'image/gif': 'gif',
  };
  return map[contentType] || 'bin';
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);

    const parsed = UploadSchema.safeParse(await context.request.json());
    if (!parsed.success) {
      return Response.json({ ok: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 });
    }

    const match = /^data:([^;]+);base64,(.+)$/.exec(parsed.data.dataUrl);
    if (!match) {
      return Response.json({ ok: false, error: 'Formato de data URL inválido' }, { status: 400 });
    }
    const [, contentType, base64] = match;
    if (!contentType.startsWith('image/')) {
      return Response.json({ ok: false, error: 'Solo se aceptan imágenes' }, { status: 400 });
    }

    const bytes = base64ToBytes(base64);
    if (bytes.byteLength > MAX_BYTES) {
      return Response.json({ ok: false, error: `La imagen es demasiado pesada (máx. ${MAX_BYTES / 1024 / 1024}MB)` }, { status: 400 });
    }

    const ext = extensionForContentType(contentType);
    const key = `${authContext.userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    await context.env.ASSETS_BUCKET.put(key, bytes, {
      httpMetadata: { contentType },
    });

    const url = new URL(context.request.url);
    const assetUrl = `${url.origin}/api/assets/${key}`;

    return Response.json({ ok: true, url: assetUrl, key });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
