import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Wand2, Loader2 } from 'lucide-react';
import { interactiveLessonService } from '../../services/interactiveLessonService';
import type { Slide } from './InteractiveLesson.types';
import { PALETTE } from './palette';

interface SlideRendererProps {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
}

export default function SlideRenderer({ slide, slideIndex, totalSlides }: SlideRendererProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);

  const progress = ((slideIndex + 1) / totalSlides) * 100;

  return (
    <motion.div
      key={slideIndex}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col items-center w-full"
    >
      <div className="w-full max-w-2xl mb-6">
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: PALETTE.turquoise }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">
          {slideIndex + 1} / {totalSlides}
        </p>
      </div>

      <div className="w-full max-w-2xl">
        {slide.type === 'title' && <TitleSlideView slide={slide} />}
        {slide.type === 'bullets' && <BulletsSlideView slide={slide} />}
        {slide.type === 'comparison' && <ComparisonSlideView slide={slide} />}
        {slide.type === 'imageText' && <ImageTextSlideView slide={slide} />}
        {slide.type === 'quiz' && (
          <QuizSlideView
            slide={slide}
            selectedIndex={selectedQuiz}
            onSelect={setSelectedQuiz}
          />
        )}
        {slide.type === 'closing' && <ClosingSlideView slide={slide} />}
      </div>
    </motion.div>
  );
}

function TitleSlideView({ slide }: { slide: Extract<Slide, { type: 'title' }> }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <motion.span
        className="text-6xl mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
      >
        📖
      </motion.span>
      <h1
        className="text-4xl font-extrabold mb-3"
        style={{ color: PALETTE.purple }}
      >
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p className="text-lg text-gray-500 max-w-md">{slide.subtitle}</p>
      )}
    </div>
  );
}

function BulletsSlideView({ slide }: { slide: Extract<Slide, { type: 'bullets' }> }) {
  return (
    <div className="py-10">
      <h2 className="text-2xl font-bold mb-6" style={{ color: PALETTE.turquoise }}>
        {slide.title}
      </h2>
      <ul className="space-y-4">
        {slide.items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex items-start gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <span
              className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: PALETTE.turquoise }}
            >
              {i + 1}
            </span>
            <span className="text-gray-700 text-base">{item}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonSlideView({ slide }: { slide: Extract<Slide, { type: 'comparison' }> }) {
  return (
    <div className="py-10">
      <h2 className="text-2xl font-bold text-center mb-8" style={{ color: PALETTE.purple }}>
        {slide.title}
      </h2>
      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-5 border-2"
          style={{ borderColor: PALETTE.turquoise, backgroundColor: '#f0fdf9' }}
        >
          <h3 className="font-bold text-lg mb-3" style={{ color: PALETTE.turquoise }}>
            {slide.element1.name}
          </h3>
          <ul className="space-y-2">
            {slide.element1.characteristics.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span style={{ color: PALETTE.turquoise }}>●</span> {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl p-5 border-2"
          style={{ borderColor: PALETTE.fuchsia, backgroundColor: '#fff5f7' }}
        >
          <h3 className="font-bold text-lg mb-3" style={{ color: PALETTE.fuchsia }}>
            {slide.element2.name}
          </h3>
          <ul className="space-y-2">
            {slide.element2.characteristics.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span style={{ color: PALETTE.fuchsia }}>●</span> {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

function ImageTextSlideView({ slide }: { slide: Extract<Slide, { type: 'imageText' }> }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenError(null);
    const res = await interactiveLessonService.generateSlideImage(slide.imagePrompt);
    if (res.ok && res.imageUrl) {
      setImageUrl(res.imageUrl);
    } else {
      setGenError(res.error || 'No se pudo generar la imagen.');
    }
    setIsGenerating(false);
  }, [slide.imagePrompt]);

  return (
    <div className="py-10 flex flex-col items-center text-center">
      <h2 className="text-2xl font-bold mb-6" style={{ color: PALETTE.orange }}>
        {slide.title}
      </h2>

      {imageUrl ? (
        <motion.img
          src={imageUrl}
          alt={slide.title}
          className="w-64 h-64 object-contain rounded-2xl shadow-md mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      ) : isGenerating ? (
        <div
          className="w-64 h-64 rounded-2xl mb-6 flex flex-col items-center justify-center gap-3"
          style={{ backgroundColor: '#f3e8ff', border: `2px dashed ${PALETTE.purple}` }}
        >
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: PALETTE.purple }} />
          <span className="text-sm font-medium" style={{ color: PALETTE.purple }}>
            Pintando con IA...
          </span>
        </div>
      ) : (
        <div
          className="w-64 h-64 rounded-2xl mb-6 flex flex-col items-center justify-center gap-3"
          style={{ backgroundColor: '#fef3c7', border: `2px dashed ${PALETTE.orange}` }}
        >
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{ backgroundColor: PALETTE.purple }}
          >
            <Wand2 className="w-4 h-4" />
            Generar Ilustración
          </motion.button>
        </div>
      )}

      {genError && (
        <p className="text-xs mb-3" style={{ color: PALETTE.fuchsia }}>{genError}</p>
      )}

      <p className="text-gray-600 max-w-md leading-relaxed">{slide.content}</p>
      <p className="text-xs text-gray-400 mt-2 italic max-w-sm">
        Prompt: {slide.imagePrompt}
      </p>
    </div>
  );
}

interface QuizSlideViewProps {
  slide: Extract<Slide, { type: 'quiz' }>;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

function QuizSlideView({ slide, selectedIndex, onSelect }: QuizSlideViewProps) {
  const answered = selectedIndex !== null;
  const isCorrect = answered && selectedIndex === slide.correctIndex;

  return (
    <div className="py-10">
      <h2
        className="text-xl font-bold mb-6 text-center"
        style={{ color: PALETTE.fuchsia }}
      >
        {slide.title}
      </h2>
      <div className="space-y-3">
        {slide.options.map((option, i) => {
          const isSelected = selectedIndex === i;
          const isCorrectOption = i === slide.correctIndex;

          let borderColor = '#e5e7eb';
          let bgColor = '#ffffff';
          if (answered && isSelected && isCorrectOption) {
            borderColor = PALETTE.turquoise;
            bgColor = '#f0fdf9';
          } else if (answered && isSelected && !isCorrectOption) {
            borderColor = PALETTE.fuchsia;
            bgColor = '#fff5f7';
          } else if (answered && isCorrectOption) {
            borderColor = PALETTE.turquoise;
            bgColor = '#f0fdf9';
          }

          return (
            <motion.button
              key={i}
              whileHover={!answered ? { scale: 1.02 } : undefined}
              whileTap={!answered ? { scale: 0.98 } : undefined}
              onClick={() => !answered && onSelect(i)}
              disabled={answered}
              className="w-full text-left rounded-xl border-2 px-4 py-3 text-sm transition-colors flex items-center gap-3"
              style={{ borderColor, backgroundColor: bgColor }}
            >
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: isCorrectOption && answered ? PALETTE.turquoise : PALETTE.purple }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-gray-700">{option}</span>
              {answered && isCorrectOption && <CheckCircle className="ml-auto w-5 h-5" style={{ color: PALETTE.turquoise }} />}
              {answered && isSelected && !isCorrectOption && <XCircle className="ml-auto w-5 h-5" style={{ color: PALETTE.fuchsia }} />}
            </motion.button>
          );
        })}
      </div>
      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-xl p-4 text-sm"
          style={{
            backgroundColor: isCorrect ? '#f0fdf9' : '#fff5f7',
            borderLeft: `4px solid ${isCorrect ? PALETTE.turquoise : PALETTE.fuchsia}`,
          }}
        >
          <p className="font-semibold mb-1" style={{ color: isCorrect ? PALETTE.turquoise : PALETTE.fuchsia }}>
            {isCorrect ? '¡Correcto! 🎉' : 'No es la respuesta correcta 😅'}
          </p>
          <p className="text-gray-600">{slide.feedback}</p>
        </motion.div>
      )}
    </div>
  );
}

function ClosingSlideView({ slide }: { slide: Extract<Slide, { type: 'closing' }> }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <motion.span
        className="text-6xl mb-4"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        🌟
      </motion.span>
      <h1 className="text-3xl font-extrabold mb-4" style={{ color: PALETTE.purple }}>
        {slide.title}
      </h1>
      <p className="text-gray-500 max-w-md leading-relaxed">{slide.reflectionPrompt}</p>
    </div>
  );
}
