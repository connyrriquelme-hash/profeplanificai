import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { interactiveLessonService, type LessonDetail } from '../../services/interactiveLessonService';
import type { Slide } from './InteractiveLesson.types';
import InteractiveLesson from './InteractiveLesson';
import { PALETTE } from './palette';

interface InteractiveLessonViewerProps {
  id: string;
  onFinish?: () => void;
}

type Status = 'loading' | 'ready' | 'error';

export default function InteractiveLessonViewer({ id, onFinish }: InteractiveLessonViewerProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setStatus('loading');
    setError(null);
    const res = await interactiveLessonService.getById(id);
    if (res.ok && res.data) {
      setLesson(res.data);
      setStatus('ready');
    } else {
      setError(res.error || 'No se pudo cargar la lección.');
      setStatus('error');
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (status === 'loading') {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] py-16 px-4">
        <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: PALETTE.turquoise }} />
        <p className="text-lg font-semibold" style={{ color: PALETTE.purple }}>Cargando lección...</p>
      </div>
    );
  }

  if (status === 'error' || !lesson) {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] py-16 px-4">
        <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: '#fef2f2' }}>
          <AlertTriangle className="w-8 h-8" style={{ color: PALETTE.fuchsia }} />
        </div>
        <p className="text-lg font-semibold mb-2" style={{ color: PALETTE.fuchsia }}>Error al cargar</p>
        <p className="text-sm text-[var(--ink-soft)] mb-6 max-w-sm text-center">{error}</p>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={load}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{ backgroundColor: PALETTE.turquoise }}
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onFinish}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-[var(--ink-soft)] bg-gray-100"
          >
            Volver
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <InteractiveLesson
      lessonTitle={`${lesson.subject} — ${lesson.grade}`}
      slides={lesson.slides as Slide[]}
      onFinish={onFinish}
    />
  );
}
