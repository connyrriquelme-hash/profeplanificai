/**
 * Metadata liviana de las 12 plantillas maestras de presentación —
 * compartida entre frontend (selector) y backend (functions/core/
 * pptMasterTemplates.ts, que además define la secuencia completa de
 * diapositivas de cada una). Una sola fuente de verdad para id/nombre/uso
 * evita que el selector del docente y el motor de generación se desincronicen.
 */
export interface MasterTemplateMeta {
  id: string;
  name: string;
  uso: string;
}

export const PPT_MASTER_TEMPLATES_META: MasterTemplateMeta[] = [
  { id: 'exploracion_juego', name: 'Exploración y juego', uso: 'Prekínder a 1° básico' },
  { id: 'lectoescritura_fonologia', name: 'Letras, sonidos y sílabas', uso: 'Kínder a 2° básico' },
  { id: 'lectura_escritura', name: 'Lectura y escritura', uso: '1° básico a media' },
  { id: 'matematica_concreta', name: 'Matemática concreta', uso: 'Prekínder a 6° básico' },
  { id: 'problema_matematico', name: 'Problema matemático', uso: '3° básico a media' },
  { id: 'ciencias_indagacion', name: 'Ciencias por indagación', uso: '1° básico a media' },
  { id: 'historia_ciudadania', name: 'Historia y ciudadanía', uso: '3° básico a media' },
  { id: 'ingles_comunicativo', name: 'Inglés comunicativo', uso: 'Prekínder a media' },
  { id: 'arte_musica_tecnologia', name: 'Arte, música y tecnología', uso: 'Prekínder a media' },
  { id: 'movimiento_salud_bienestar', name: 'Movimiento, salud y bienestar', uso: 'Prekínder a media' },
  { id: 'profundizacion_media', name: 'Profundización para media', uso: '7° básico a media' },
  { id: 'repaso_evaluacion_formativa', name: 'Repaso y evaluación formativa', uso: 'Cualquier asignatura y nivel' },
];
