import { useEffect, useMemo, useRef, useState } from 'react';
import {
  appendGeneratedImages,
  buildImageMarkdown,
  EDUCATIONAL_IMAGE_STYLES,
  generateEducationalImage,
  imageSourceLabel,
  type EducationalImageResult,
  type EducationalImageStyle,
} from '../services/imageService';

interface EducationalImagesPanelProps {
  content: string;
  grade: string;
  subject: string;
  oa: string;
  resourceTitle: string;
  onContentChange: (next: string) => void;
  onStatus?: (message: string, type?: string) => void;
}

function splitSentences(text: string): string[] {
  return text
    .replace(/[#*_`>|-]/g, ' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => s.length > 35)
    .slice(0, 18);
}

function buildSlides(content: string, subject: string): Array<{ id: string; title: string; body: string }> {
  const headings = [...content.matchAll(/^#{1,3}\s+(.+)$/gm)].map(m => m[1].trim()).filter(Boolean);
  const sentences = splitSentences(content);
  const defaults = [
    'Inicio motivador',
    'Contexto del aprendizaje',
    'Concepto clave',
    'Ejemplo guiado',
    'Actividad colaborativa',
    'Práctica individual',
    'Cierre y metacognición',
  ];
  return Array.from({ length: 7 }, (_, index) => {
    const title = headings[index] || defaults[index] || `Visual ${index + 1}`;
    const body = sentences[index] || sentences[0] || `Apoyo visual para ${subject}`;
    return { id: `slide-${index + 1}`, title, body };
  });
}

export function EducationalImagesPanel({
  content,
  grade,
  subject,
  oa,
  resourceTitle,
  onContentChange,
  onStatus,
}: EducationalImagesPanelProps) {
  const [style, setStyle] = useState<EducationalImageStyle>('ilustración infantil');
  const [images, setImages] = useState<EducationalImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lastContentRef = useRef('');
  const slides = useMemo(() => buildSlides(content, subject), [content, subject]);

  async function loadImages(force = false, nextStyle = style) {
    if (!content.trim() || loading) return;
    setLoading(true);
    setError('');
    onStatus?.('Buscando imagen…', '');
    const results: EducationalImageResult[] = [];
    try {
      for (const slide of slides) {
        const image = await generateEducationalImage({
          grade,
          subject,
          oa,
          resourceTitle,
          slideTitle: slide.title,
          slideContent: slide.body,
          style: nextStyle,
          slideId: slide.id,
          force,
        });
        results.push(image);
        setImages([...results]);
      }
      setImages(results);
      onContentChange(appendGeneratedImages(content, results, slides.map(s => s.title)));
      onStatus?.('Imágenes educativas listas y guardables en el recurso.', 'ok');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudieron generar imágenes';
      setError(msg);
      onStatus?.(`Imágenes: ${msg}`, 'warn');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!content.trim()) return;
    if (/## Visuales educativos generados/.test(content)) return;
    if (lastContentRef.current === content) return;
    lastContentRef.current = content;
    setImages([]);
    const timer = window.setTimeout(() => {
      loadImages(false);
    }, 700);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!content.trim()) return null;

  return (
    <div className="edu-images-panel">
      <div className="edu-images-head">
        <div>
          <h3>Visuales educativos del recurso</h3>
          <p>{loading ? 'Buscando imagen…' : 'Cada visual pasa por backend Cloudflare y se conserva al guardar/exportar.'}</p>
        </div>
        <div className="edu-images-actions">
          <select
            value={style}
            onChange={(event) => {
              const next = event.target.value as EducationalImageStyle;
              setStyle(next);
              loadImages(true, next);
            }}
            aria-label="Cambiar estilo de imagen"
          >
            {EDUCATIONAL_IMAGE_STYLES.map(option => <option key={option}>{option}</option>)}
          </select>
          <button className="small secondary" onClick={() => loadImages(true)} disabled={loading}>
            Regenerar imagen
          </button>
        </div>
      </div>

      {error && <div className="status warn">{error}</div>}
      <div className="edu-images-grid">
        {slides.map((slide, index) => {
          const image = images[index];
          return (
            <article className="edu-image-card" key={slide.id}>
              <div className="edu-image-frame">
                {image ? (
                  <img src={image.url} alt={`Imagen educativa: ${slide.title}`} crossOrigin="anonymous" referrerPolicy="no-referrer" />
                ) : (
                  <div className="edu-image-loading">Buscando imagen…</div>
                )}
              </div>
              <div className="edu-image-meta">
                <strong>{index + 1}. {slide.title}</strong>
                <span>{image ? imageSourceLabel(image.source) : 'Pendiente'}</span>
                {image?.author && <small>{image.author}</small>}
              </div>
              {image && (
                <button
                  className="small ghost"
                  onClick={() => navigator.clipboard.writeText(buildImageMarkdown(image, slide.title))}
                >
                  Copiar imagen
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
