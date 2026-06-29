import { describe, expect, it } from 'vitest';
import {
  buildEducationalImagePrompt,
  buildImageCacheKey,
  generateEducationalImage,
  normalizeImageContext,
} from '../../functions/_lib/images';
import { appendGeneratedImages, stripGeneratedImageSection } from '../services/imageService';
import { md } from '../utils/htmlUtils';

describe('educational image pipeline', () => {
  const context = normalizeImageContext({
    grade: '1° Básico',
    subject: 'Historia, Geografía y Cs. Sociales',
    oa: 'OA2: reconocer elementos de identidad local y familiar.',
    resourceTitle: 'Revolución y comunidad',
    slideTitle: 'Celebración comunitaria',
    slideContent: 'Niñas y niños observan una celebración familiar chilena.',
    style: 'acuarela',
    slideId: 'slide-1',
  });

  it('builds a safe Chilean educational prompt', () => {
    const prompt = buildEducationalImagePrompt(context);
    expect(prompt).toContain('Chile');
    expect(prompt).toContain('Sin texto dentro de la imagen');
    expect(prompt).toContain('sin logos');
    expect(prompt).toContain('sin rostros realistas');
    expect(prompt).toContain('acuarela');
  });

  it('builds stable cache keys from educational context', async () => {
    await expect(buildImageCacheKey(context)).resolves.toMatch(/^image:/);
    await expect(buildImageCacheKey(context)).resolves.toEqual(await buildImageCacheKey(context));
  });

  it('falls back to a professional SVG when only svg provider is enabled', async () => {
    const result = await generateEducationalImage(context, { IMAGE_PROVIDER_ORDER: 'svg' });
    expect(result.ok).toBe(true);
    expect(result.source).toBe('svg-fallback');
    expect(result.url).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(result.license).toContain('SVG');
  });

  it('renders safe markdown images and preserves generated sections', () => {
    const result = {
      ok: true,
      url: 'data:image/svg+xml;base64,PHN2Zy8+',
      source: 'svg-fallback' as const,
      license: 'SVG original',
      author: 'PlanificaIA Chile',
      prompt: 'prompt',
      cached: false,
      cacheKey: 'image:test',
    };
    const content = appendGeneratedImages('# Recurso', [result], ['Celebración comunitaria']);
    expect(content).toContain('## Visuales educativos generados');
    expect(stripGeneratedImageSection(content)).toBe('# Recurso');
    expect(md(content)).toContain('edu-image-figure');
  });
});
