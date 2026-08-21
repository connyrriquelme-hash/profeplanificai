import { useCallback, useState } from 'react';
import { generateSlideImage } from '../../services/slideImageGenerationService';
import type { PedagogicalProduct } from './types';

/**
 * Genera y persiste una ilustracion de portada para cualquier tipo de
 * producto pedagogico, reusando el mismo endpoint que ya genera imagenes
 * para diapositivas. Se guarda en product.data.coverImageUrl, asi que viaja
 * con el producto igual que cualquier otro campo (se guarda en Banco de
 * Recursos al hacer "Guardar").
 */
export function useCoverImage(
  product: PedagogicalProduct,
  onProductChange?: (updated: PedagogicalProduct) => void,
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coverImageUrl = typeof product.data?.coverImageUrl === 'string'
    ? (product.data.coverImageUrl as string)
    : undefined;

  const generate = useCallback(async () => {
    if (!onProductChange || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const { title, subject, level, topic } = product.metadata;
      const descriptors = [subject, level, topic].filter(Boolean).join(', ');
      const prompt = `Ilustracion educativa que represente: ${title}${descriptors ? ` (${descriptors})` : ''}.`;
      const imageUrl = await generateSlideImage(prompt);
      onProductChange({ ...product, data: { ...product.data, coverImageUrl: imageUrl } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la imagen.');
    } finally {
      setIsGenerating(false);
    }
  }, [product, onProductChange, isGenerating]);

  return { coverImageUrl, isGenerating, error, generate, canGenerate: !!onProductChange };
}
