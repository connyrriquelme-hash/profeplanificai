import { api } from './apiClient';

interface UploadAssetResponse {
  ok: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/** Uploads a data: URL (or any image blob converted to one) to R2 via the
 * backend, returning a stable /api/assets/... URL instead of keeping the
 * image inline as base64. */
export async function uploadAssetDataUrl(dataUrl: string, filename?: string): Promise<string> {
  const data = await api.post<UploadAssetResponse>('/api/assets/upload', { dataUrl, filename });
  if (!data.ok || !data.url) throw new Error(data.error || 'No se pudo subir la imagen.');
  return data.url;
}
