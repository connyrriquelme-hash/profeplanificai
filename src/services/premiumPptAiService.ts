import type { PremiumPresentation, PremiumSlide } from '../utils/premiumPptModel';
import { generateSlideImage } from './slideImageGenerationService';

interface AiEnrichmentResult {
  presentation: PremiumPresentation;
  imagesGenerated: number;
  imagesFailed: number;
  noProvider: boolean;
}

export async function enrichPresentationWithImages(
  presentation: PremiumPresentation,
  onProgress?: (slideIndex: number, total: number, status: string) => void,
  signal?: AbortSignal,
): Promise<AiEnrichmentResult> {
  const slides = [...presentation.slides];
  let imagesGenerated = 0;
  let imagesFailed = 0;
  let noProvider = false;

  const slidesWithPrompts = slides
    .map((s, i) => ({ slide: s, index: i }))
    .filter(({ slide }) => slide.visualPrompt && slide.layout !== 'objective' && slide.layout !== 'dua_supports' && slide.layout !== 'formative_assessment' && slide.layout !== 'closure');

  for (const { slide, index } of slidesWithPrompts) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    onProgress?.(index + 1, slides.length, 'generating');

    try {
      const imageUrl = await generateSlideImage(slide.visualPrompt!, signal);
      slides[index] = {
        ...slide,
        imageUrl,
        imageStatus: 'generated',
      };
      imagesGenerated++;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      imagesFailed++;
      if (err && typeof err === 'object' && 'code' in err && (err as any).code === 'provider_not_configured') {
        noProvider = true;
      }
      slides[index] = {
        ...slide,
        imageStatus: 'failed',
      };
    }
  }

  return {
    presentation: { ...presentation, slides },
    imagesGenerated,
    imagesFailed,
    noProvider,
  };
}

export async function generateSingleSlideImage(
  slide: PremiumSlide,
  prompt?: string,
  signal?: AbortSignal,
): Promise<PremiumSlide> {
  const imagePrompt = prompt || slide.visualPrompt || slide.title;
  if (!imagePrompt) throw new Error('No hay prompt disponible para generar la imagen');

  const imageUrl = await generateSlideImage(imagePrompt, signal);
  return {
    ...slide,
    imageUrl,
    imageStatus: 'generated',
  };
}
