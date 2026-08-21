interface Env {
  ASSETS_BUCKET: R2Bucket;
}

/** Serves an uploaded asset from R2. Public read (images are meant to be
 * embedded in generated documents that may be shared/printed) but keys are
 * unguessable UUIDs, and upload requires auth (see upload.ts). */
export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const key = Array.isArray(context.params.key) ? context.params.key.join('/') : context.params.key;
  if (!key) return new Response('Not found', { status: 404 });

  const object = await context.env.ASSETS_BUCKET.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
