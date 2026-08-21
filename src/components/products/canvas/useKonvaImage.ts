import { useEffect, useState } from 'react';

/** Loads an <img> for use as a Konva.Image fill; react-konva has no built-in loader. */
export function useKonvaImage(src: string | undefined): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    if (!src) { setImage(undefined); return; }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.src = src;
    return () => { img.onload = null; };
  }, [src]);

  return image;
}
