import { api } from './apiClient';
import type { InteractiveLessonModel } from '../../schemas/interactiveLessonSchema';

export interface GenerateInteractiveLessonParams {
  subject: string;
  grade: string;
  oa: string;
}

export interface InteractiveLessonResponse {
  ok: boolean;
  resourceId?: string;
  result?: InteractiveLessonModel;
  error?: string;
}

export interface SlideImageResponse {
  ok: boolean;
  imageUrl?: string;
  provider?: string;
  model?: string;
  error?: string;
}

export interface LessonListItem {
  id: string;
  subject: string;
  grade: string;
  oa: string;
  ai_model: string | null;
  created_at: string;
}

export interface LessonDetail {
  id: string;
  subject: string;
  grade: string;
  oa: string;
  ai_model: string | null;
  created_at: string;
  slides: InteractiveLessonModel['slides'];
}

export const interactiveLessonService = {
  generate: async (params: GenerateInteractiveLessonParams): Promise<InteractiveLessonResponse> => {
    try {
      return await api.post<InteractiveLessonResponse>('/api/materials/interactive-lesson', params);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error de conexión al generar la lección interactiva.';
      return { ok: false, error: message };
    }
  },

  generateSlideImage: async (prompt: string): Promise<SlideImageResponse> => {
    try {
      return await api.post<SlideImageResponse>('/api/images/generate-slide-image', { prompt });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al generar la imagen.';
      return { ok: false, error: message };
    }
  },

  getAll: async (): Promise<{ ok: boolean; data?: LessonListItem[]; error?: string }> => {
    try {
      return await api.get<{ ok: boolean; data?: LessonListItem[]; error?: string }>('/api/materials/interactive-lesson');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener las lecciones.';
      return { ok: false, error: message };
    }
  },

  getById: async (id: string): Promise<{ ok: boolean; data?: LessonDetail; error?: string }> => {
    try {
      return await api.get<{ ok: boolean; data?: LessonDetail; error?: string }>(`/api/materials/interactive-lesson/${id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener la lección.';
      return { ok: false, error: message };
    }
  },
};
