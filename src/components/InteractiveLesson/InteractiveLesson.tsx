import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { InteractiveLessonProps } from './InteractiveLesson.types';
import SlideRenderer from './SlideRenderer';
import { PALETTE } from './palette';

export default function InteractiveLesson({ lessonTitle, slides, onFinish }: InteractiveLessonProps) {
  const [current, setCurrent] = useState(0);
  const total = slides.length;
  const isFirst = current === 0;
  const isLast = current === total - 1;

  const goNext = useCallback(() => {
    setCurrent((c) => Math.min(c + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onFinish?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onFinish]);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center min-h-[80vh] py-8 px-4">
      {/* Encabezado */}
      <div className="w-full flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold truncate mr-4" style={{ color: PALETTE.purple }}>
          {lessonTitle}
        </h1>
        <button
          onClick={onFinish}
          className="flex-shrink-0 p-2 rounded-xl hover:bg-gray-100 transition-colors"
          title="Cerrar lección"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Slides */}
      <div className="w-full flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <SlideRenderer
            key={current}
            slide={slides[current]}
            slideIndex={current}
            totalSlides={total}
          />
        </AnimatePresence>
      </div>

      {/* Navegación */}
      <div className="w-full flex items-center justify-between mt-8 gap-4">
        <motion.button
          whileHover={{ scale: isFirst ? 1 : 1.08 }}
          whileTap={{ scale: isFirst ? 1 : 0.95 }}
          onClick={goPrev}
          disabled={isFirst}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isFirst ? '#f3f4f6' : PALETTE.turquoise,
            color: isFirst ? '#9ca3af' : '#ffffff',
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </motion.button>

        {isLast ? (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={onFinish}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{ backgroundColor: PALETTE.fuchsia }}
          >
            Finalizar ✨
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{ backgroundColor: PALETTE.orange }}
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
