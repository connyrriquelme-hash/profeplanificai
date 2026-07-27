import { generateEducationalImage, type EducationalImageContext, type EducationalImageResult } from '../services/imageService';

export interface ProductImageRequest {
  grade: string;
  subject: string;
  oa: string;
  sections: Array<{ title: string; content: string; role?: string }>;
  productName: string;
}

export interface ProductImageSet {
  images: EducationalImageResult[];
  titles: string[];
  errors: string[];
}

export async function generateProductImages(request: ProductImageRequest): Promise<ProductImageSet> {
  const images: EducationalImageResult[] = [];
  const titles: string[] = [];
  const errors: string[] = [];

  const contextBase: Omit<EducationalImageContext, 'slideTitle' | 'slideContent'> = {
    grade: request.grade,
    subject: request.subject,
    oa: request.oa,
    resourceTitle: request.productName,
  };

  for (const section of request.sections) {
    try {
      const result = await generateEducationalImage({
        ...contextBase,
        slideTitle: section.title,
        slideContent: section.content.slice(0, 300),
      });
      images.push(result);
      titles.push(section.title);
    } catch (err) {
      errors.push(`Error generando imagen para "${section.title}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return { images, titles, errors };
}

export async function generateSingleImage(
  context: EducationalImageContext
): Promise<EducationalImageResult> {
  return generateEducationalImage(context);
}
