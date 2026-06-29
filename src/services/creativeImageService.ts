import { api } from './apiClient';

export interface CreativeImageContext {
  tema: string;
  curso: string;
  asignatura: string;
  oa: string;
  estilo?: string;
}

export interface CreativeImageResult {
  ok: boolean;
  url?: string;
  source?: 'free-image' | 'pollinations' | 'svg-fallback';
  prompt?: string;
  cached?: boolean;
  error?: string;
}

export async function generateCreativeImage(context: CreativeImageContext): Promise<CreativeImageResult> {
  return api.post<CreativeImageResult>('/api/creative-image', context);
}

export function creativeImageSourceLabel(source?: CreativeImageResult['source']): string {
  const labels: Record<string, string> = {
    'free-image': 'Imagen libre',
    'pollinations': 'Imagen generada por IA',
    'svg-fallback': 'Ilustración segura local',
  };
  return source ? labels[source] : 'Imagen';
}