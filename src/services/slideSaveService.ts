import type { SlideLesson } from '../types/slideLesson';
import type { VisualLessonDeck } from '../types/presentation';
import { api } from './apiClient';
import { shareFromWorkspace } from './sharedDocumentService';

const SLIDE_DECKS_LOCAL_KEY = 'slide_decks_local';

export interface SlideSaveMetadata {
  course: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  theme?: string;
  slideCount: number;
  visualStyle: string;
  includeImages: boolean;
  preferRegionalContext: boolean;
  imageProvider?: string;
  createdAt: string;
}

export function serializeSlidesForSave(slideLesson: SlideLesson): string {
  return JSON.stringify({
    ...slideLesson,
    slides: slideLesson.slides.map((s) => ({
      type: s.type,
      title: s.title,
      subtitle: s.subtitle,
      bullets: s.bullets,
      activity: s.activity,
      example: s.example,
      instructions: s.instructions,
      materials: s.materials,
      questions: s.questions,
      successCriteria: s.successCriteria,
      metacognition: s.metacognition,
      exitTicket: s.exitTicket,
      speakerNotes: s.speakerNotes,
      visualPrompt: s.visualPrompt,
    })),
  });
}

export function deserializeSlidesFromSave(json: string): SlideLesson | null {
  try {
    const obj = JSON.parse(json);
    if (!obj.slides || !Array.isArray(obj.slides) || !obj.title) return null;
    return obj as SlideLesson;
  } catch {
    return null;
  }
}

export function buildSaveMetadata(
  slideLesson: SlideLesson,
  overrides?: {
    visualStyle?: string;
    includeImages?: boolean;
    preferRegionalContext?: boolean;
    imageProvider?: string;
  },
): SlideSaveMetadata {
  return {
    course: slideLesson.course,
    subject: slideLesson.subject,
    objectiveCode: slideLesson.objectiveCode,
    objectiveText: slideLesson.objectiveText,
    theme: slideLesson.theme,
    slideCount: slideLesson.slides.length,
    visualStyle: overrides?.visualStyle || 'modern',
    includeImages: overrides?.includeImages ?? true,
    preferRegionalContext: overrides?.preferRegionalContext ?? true,
    imageProvider: overrides?.imageProvider,
    createdAt: new Date().toISOString(),
  };
}

export interface CloudSaveResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function saveSlideDeckToCloud(
  slideLesson: SlideLesson,
  metadata: SlideSaveMetadata,
): Promise<CloudSaveResult> {
  try {
    const slidesJson = serializeSlidesForSave(slideLesson);
    const result = await api.post<{ data: { id: string } }>('/api/resources', {
      title: slideLesson.title || `Lección: ${slideLesson.objectiveCode}`,
      type: 'presentacion_clase_visual',
      source: 'biblioteca_creativa',
      content: slidesJson,
      level: slideLesson.course,
      subject: slideLesson.subject,
      objectiveCode: slideLesson.objectiveCode,
      objectiveText: slideLesson.objectiveText,
      metadata: {
        slides_json: slidesJson,
        slide_count: String(metadata.slideCount),
        visual_style: metadata.visualStyle,
        include_images: String(metadata.includeImages),
        prefer_regional_context: String(metadata.preferRegionalContext),
        image_provider: metadata.imageProvider || '',
        created_at: metadata.createdAt,
      },
    });
    return { ok: true, id: result?.data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al guardar' };
  }
}

export interface ShareSlideResult {
  ok: boolean;
  shareUrl?: string;
  error?: string;
}

export function saveSlideDeckLocally(slideLesson: SlideLesson): void {
  try {
    const slidesJson = serializeSlidesForSave(slideLesson);
    const existing = JSON.parse(localStorage.getItem(SLIDE_DECKS_LOCAL_KEY) || '[]');
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      title: slideLesson.title || `Lección: ${slideLesson.objectiveCode}`,
      content: slidesJson,
      type: 'presentacion_clase_visual' as const,
      level: slideLesson.course || '',
      subject: slideLesson.subject || '',
      objective_code: slideLesson.objectiveCode || '',
      created_at: new Date().toISOString(),
      source: 'local',
    };
    const updated = [entry, ...existing];
    localStorage.setItem(SLIDE_DECKS_LOCAL_KEY, JSON.stringify(updated));
  } catch { /* silent */ }
}

export function getLocalSlideDecks(): Array<{
  id: string;
  title: string;
  content: string;
  type: 'presentacion_clase_visual';
  level: string;
  subject: string;
  objective_code: string;
  created_at: string;
  source: string;
}> {
  try {
    return JSON.parse(localStorage.getItem(SLIDE_DECKS_LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

export function removeLocalSlideDeck(id: string): void {
  try {
    const existing = JSON.parse(localStorage.getItem(SLIDE_DECKS_LOCAL_KEY) || '[]');
    const updated = existing.filter((e: { id: string }) => e.id !== id);
    localStorage.setItem(SLIDE_DECKS_LOCAL_KEY, JSON.stringify(updated));
  } catch { /* silent */ }
}

export async function shareSlideDeck(
  slideLesson: SlideLesson,
  metadata: SlideSaveMetadata,
): Promise<ShareSlideResult> {
  try {
    const slidesJson = serializeSlidesForSave(slideLesson);
    const result = shareFromWorkspace({
      title: slideLesson.title || `Lección: ${slideLesson.objectiveCode}`,
      content: slidesJson,
      nivel: slideLesson.course,
      asignatura: slideLesson.subject,
      oa: slideLesson.objectiveCode,
      lessonTheme: slideLesson.theme,
    });
    return { ok: true, shareUrl: result.shareUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al compartir' };
  }
}
