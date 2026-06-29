import { api } from './apiClient';

export type EducationalImageStyle = 'ilustración infantil' | 'editorial escolar' | 'acuarela' | 'infografía simple';
export type EducationalImageSource = 'wikimedia' | 'cloudflare-ai' | 'pollinations' | 'huggingface' | 'svg-fallback';

export interface EducationalImageContext {
  grade: string;
  subject: string;
  oa: string;
  resourceTitle: string;
  slideTitle: string;
  slideContent: string;
  countryContext?: string;
  style?: EducationalImageStyle;
  aspectRatio?: string;
  slideId?: string;
  force?: boolean;
}

export interface EducationalImageResult {
  ok: boolean;
  url: string;
  source: EducationalImageSource;
  license: string;
  author: string;
  attribution?: string;
  prompt: string;
  cached: boolean;
  cacheKey: string;
  warning?: string;
}

export const EDUCATIONAL_IMAGE_STYLES: EducationalImageStyle[] = [
  'ilustración infantil',
  'editorial escolar',
  'acuarela',
  'infografía simple',
];

export async function generateEducationalImage(context: EducationalImageContext): Promise<EducationalImageResult> {
  return api.post<EducationalImageResult>('/api/images/generate', {
    ...context,
    countryContext: context.countryContext || 'Chile / Latinoamérica',
    aspectRatio: context.aspectRatio || '16:9',
  });
}

export function imageSourceLabel(source: EducationalImageSource): string {
  const labels: Record<EducationalImageSource, string> = {
    wikimedia: 'Imagen libre: Wikimedia',
    'cloudflare-ai': 'Imagen generada por IA',
    pollinations: 'Imagen generada por IA',
    huggingface: 'Imagen generada por IA',
    'svg-fallback': 'Ilustración segura local',
  };
  return labels[source] || source;
}

function cleanLine(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/[\[\]\(\)]/g, '').trim();
}

export function buildImageMarkdown(image: EducationalImageResult, title: string): string {
  const alt = cleanLine(`Imagen educativa: ${title}`).slice(0, 130) || 'Imagen educativa';
  const attribution = cleanLine([imageSourceLabel(image.source), image.author, image.license].filter(Boolean).join(' · '));
  return [
    `![${alt}](${image.url})`,
    attribution ? `_${attribution}_` : '',
  ].filter(Boolean).join('\n');
}

export function stripGeneratedImageSection(content: string): string {
  return content.replace(/\n{0,2}---\n\n## Visuales educativos generados[\s\S]*$/m, '').trim();
}

export function appendGeneratedImages(content: string, images: EducationalImageResult[], titles: string[]): string {
  const base = stripGeneratedImageSection(content);
  if (!images.length) return base;
  const blocks = images.map((image, index) => [
    `### Visual ${index + 1}: ${titles[index] || 'Apoyo educativo'}`,
    buildImageMarkdown(image, titles[index] || 'Apoyo educativo'),
  ].join('\n\n'));
  return [
    base,
    '',
    '---',
    '',
    '## Visuales educativos generados',
    '',
    ...blocks,
  ].join('\n').trim();
}
