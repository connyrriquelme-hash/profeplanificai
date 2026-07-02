import type { VisualLessonDeck } from '../types/presentation';

interface GenerateImageResponse {
  ok: boolean;
  imageUrl?: string;
  provider?: string;
  model?: string;
  code?: string;
  message?: string;
}

const API_URL = '/api/images/generate-slide-image';

export class ProviderNotConfiguredError extends Error {
  code = 'provider_not_configured' as const;
  constructor(message: string) {
    super(message);
    this.name = 'ProviderNotConfiguredError';
  }
}

export async function generateSlideImage(prompt: string, signal?: AbortSignal): Promise<string> {
  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    console.error('[slideImageGenerationService] Error de red:', err);
    throw new Error('No se pudo conectar con el servidor de generación de imágenes.');
  }

  let data: GenerateImageResponse;
  try {
    data = await response.json();
  } catch (err) {
    console.error('[slideImageGenerationService] Error parseando JSON:', err);
    throw new Error('El servidor devolvió una respuesta inesperada.');
  }

  if (!data.ok) {
    if (data.code === 'provider_not_configured') {
      throw new ProviderNotConfiguredError(data.message || 'No hay proveedor configurado.');
    }
    throw new Error(data.message || `Error del servidor (${response.status}).`);
  }

  if (!data.imageUrl) {
    throw new Error('El servidor no devolvió una imagen.');
  }

  return data.imageUrl;
}

export async function generateImagesForDeck(
  deck: VisualLessonDeck,
  onProgress?: (slideIndex: number, total: number) => void,
  signal?: AbortSignal,
): Promise<{ deck: VisualLessonDeck; failedCount: number; noProvider: boolean }> {
  const updated = { ...deck, slides: [...deck.slides] };
  let failedCount = 0;
  let noProvider = false;

  for (let i = 0; i < updated.slides.length; i++) {
    // Check if aborted
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const slide = updated.slides[i];
    if (slide.visual.status === 'generated') continue;

    const prompt = slide.visual.imagePrompt || slide.title;
    if (!prompt) continue;

    onProgress?.(i + 1, updated.slides.length);

    try {
      const imageUrl = await generateSlideImage(prompt, signal);
      updated.slides[i] = {
        ...slide,
        visual: {
          ...slide.visual,
          imageUrl,
          status: 'generated',
        },
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      failedCount++;
      if (err instanceof ProviderNotConfiguredError) {
        noProvider = true;
      }
      updated.slides[i] = {
        ...slide,
        visual: {
          ...slide.visual,
          status: 'failed' as const,
        },
      };
    }
  }

  return { deck: updated, failedCount, noProvider };
}

export async function replaceSlideImage(slide: VisualLessonDeck['slides'][0], prompt?: string): Promise<VisualLessonDeck['slides'][0]> {
  const imagePrompt = prompt || slide.visual.imagePrompt || slide.title;
  if (!imagePrompt) throw new Error('No hay prompt disponible para generar la imagen');

  const imageUrl = await generateSlideImage(imagePrompt);
  return {
    ...slide,
    visual: {
      ...slide.visual,
      imageUrl,
      status: 'generated',
    },
  };
}
