import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { interactiveLessonService, type GenerateInteractiveLessonParams } from '../../services/interactiveLessonService';
import type { Slide } from './InteractiveLesson.types';
import InteractiveLesson from './InteractiveLesson';
import { PALETTE } from './palette';

interface InteractiveLessonContainerProps {
  params: GenerateInteractiveLessonParams;
  onFinish?: () => void;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

export default function InteractiveLessonContainer({ params, onFinish }: InteractiveLessonContainerProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setStatus('loading');
    setError(null);

    const response = await interactiveLessonService.generate(params);

    if (response.ok && response.result) {
      setSlides(response.result.slides as Slide[]);
      setStatus('ready');
    } else {
      setError(response.error || 'No se pudo generar la lección.');
      setStatus('error');
    }
  }, [params]);

  if (status === 'idle') {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: '#f3e8ff' }}
          >
            <Sparkles className="w-10 h-10" style={{ color: PALETTE.purple }} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: PALETTE.purple }}>
            Lección Interactiva
          </h2>
          <p className="text-gray-500 mb-2 max-w-sm">
            Genera una presentación lúdica de 6 diapositivas para tus estudiantes.
          </p>
          <div className="text-sm text-gray-400 mb-8 space-y-1">
            <p><span className="font-medium">Asignatura:</span> {params.subject}</p>
            <p><span className="font-medium">Nivel:</span> {params.grade}</p>
            <p><span className="font-medium">OA:</span> {params.oa}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generate}
            className="px-8 py-3 rounded-xl font-semibold text-white text-sm"
            style={{ backgroundColor: PALETTE.turquoise }}
          >
            Generar Lección
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] py-16 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2
            className="w-12 h-12 mx-auto mb-4 animate-spin"
            style={{ color: PALETTE.turquoise }}
          />
          <p className="text-lg font-semibold mb-2" style={{ color: PALETTE.purple }}>
            Generando tu lección...
          </p>
          <p className="text-sm text-gray-400">La IA está creando 6 diapositivas pedagógicas</p>
        </motion.div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: '#fef2f2' }}
          >
            <AlertTriangle className="w-8 h-8" style={{ color: PALETTE.fuchsia }} />
          </div>
          <p className="text-lg font-semibold mb-2" style={{ color: PALETTE.fuchsia }}>
            Error al generar
          </p>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">{error}</p>
          <div className="flex gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generate}
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
              className="px-6 py-2.5 rounded-xl font-semibold text-sm text-gray-500 bg-gray-100"
            >
              Cancelar
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <InteractiveLesson
      lessonTitle={`Lección: ${params.subject}`}
      slides={slides}
      onFinish={onFinish}
    />
  );
}
