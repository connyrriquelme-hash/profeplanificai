/**
 * PresentacionRenderer — Premium renderer for PPT presentations.
 *
 * Renders slides as a responsive grid of 16:9 mini-slides with
 * color-coded layouts, expand-on-click, and full export support.
 */

import { useMemo, useState } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductHeader } from '../ProductHeader';
import { ProductActionBar } from '../ProductActionBar';
import type { PedagogicalProduct } from '../types';
import type { SlideLesson, SlideType } from '../../../types/slideLesson';
import type { VisualLessonDeck } from '../../../types/presentation';
import { SlideLessonPreview } from '../../SlideLessonPreview';
import { downloadPPTX } from '../../../services/pptxExportService';

interface Slide {
  layout: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  items?: string[];
  quote?: string;
  author?: string;
  term?: string;
  definition?: string;
  left?: { title?: string; items?: string[] };
  right?: { title?: string; items?: string[] };
  pairs?: Array<{ left?: string; right?: string }>;
  question?: string;
  answer?: string;
  [key: string]: unknown;
}

interface PptDeckData {
  slides: Slide[];
  title?: string;
  theme?: { primaryColor?: string; [key: string]: unknown };
}

const LAYOUT_COLORS: Record<string, { bg: string; accent: string; badge: string }> = {
  title:              { bg: 'from-[#B5471F] to-[#7C2F13]', accent: '#B5471F', badge: 'bg-[#B5471F] text-white' },
  bullets:            { bg: 'from-blue-500 to-blue-700',   accent: '#3B82F6', badge: 'bg-blue-100 text-blue-700' },
  image_text:         { bg: 'from-emerald-500 to-teal-600', accent: '#10B981', badge: 'bg-emerald-100 text-emerald-700' },
  comparison:         { bg: 'from-purple-500 to-violet-600', accent: '#8B5CF6', badge: 'bg-purple-100 text-purple-700' },
  quote:              { bg: 'from-amber-500 to-orange-500', accent: '#F59E0B', badge: 'bg-amber-100 text-amber-700' },
  vocabulario:        { bg: 'from-rose-400 to-pink-500',   accent: '#F43F5E', badge: 'bg-rose-100 text-rose-700' },
  ciclo_proceso:      { bg: 'from-cyan-500 to-blue-500',   accent: '#06B6D4', badge: 'bg-cyan-100 text-cyan-700' },
  quiz_opcion_multiple:{ bg: 'from-indigo-500 to-blue-600', accent: '#6366F1', badge: 'bg-indigo-100 text-indigo-700' },
  verdadero_falso:    { bg: 'from-teal-500 to-emerald-600', accent: '#14B8A6', badge: 'bg-teal-100 text-teal-700' },
};

const LAYOUT_LABELS: Record<string, string> = {
  title: 'Portada', bullets: 'Contenido', image_text: 'Imagen + Texto',
  comparison: 'Comparación', quote: 'Cita', vocabulario: 'Vocabulario',
  ciclo_proceso: 'Ciclo / Proceso', quiz_opcion_multiple: 'Quiz',
  verdadero_falso: 'Verdadero o Falso',
};

function MiniSlide({ slide, index, onClick }: { slide: Slide; index: number; onClick: () => void }) {
  const colors = LAYOUT_COLORS[slide.layout] || LAYOUT_COLORS.bullets;
  const bullets = slide.bullets || slide.items || [];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full aspect-video rounded-xl overflow-hidden border-2 border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg transition-all text-left"
    >
      {/* Slide background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`} />

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col p-3 sm:p-4">
        {/* Layout badge */}
        <span className={`self-start px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${colors.badge} mb-2`}>
          {LAYOUT_LABELS[slide.layout] || slide.layout}
        </span>

        {/* Title */}
        {slide.title && (
          <p className="text-white font-bold text-[10px] sm:text-xs leading-tight line-clamp-2 mb-1 drop-shadow-sm">
            {slide.title}
          </p>
        )}

        {/* Subtitle or bullets preview */}
        {slide.subtitle && (
          <p className="text-white/70 text-[9px] sm:text-[10px] line-clamp-1">{slide.subtitle}</p>
        )}
        {!slide.subtitle && bullets.length > 0 && (
          <div className="space-y-0.5 mt-auto">
            {bullets.slice(0, 3).map((b, i) => (
              <p key={i} className="text-white/70 text-[8px] sm:text-[9px] line-clamp-1">• {b}</p>
            ))}
          </div>
        )}

        {/* Quote */}
        {slide.quote && (
          <p className="text-white/80 text-[9px] italic line-clamp-2 mt-auto">"{slide.quote}"</p>
        )}
      </div>

      {/* Number */}
      <span className="absolute bottom-1.5 right-2 text-white/40 text-[10px] font-bold">{index + 1}</span>

      {/* Hover expand icon */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
        <Maximize2 size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

function SlideModal({ slide, index, total, onClose, onPrev, onNext }: {
  slide: Slide; index: number; total: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const colors = LAYOUT_COLORS[slide.layout] || LAYOUT_COLORS.bullets;
  const bullets = slide.bullets || slide.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        {/* Slide */}
        <div className={`aspect-video rounded-2xl bg-gradient-to-br ${colors.bg} shadow-2xl flex flex-col p-8 sm:p-12`}>
          <span className={`self-start px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${colors.badge} mb-6`}>
            {LAYOUT_LABELS[slide.layout] || slide.layout}
          </span>

          {slide.title && (
            <h2 className="text-white font-black text-2xl sm:text-4xl leading-tight mb-4 drop-shadow-lg">{slide.title}</h2>
          )}
          {slide.subtitle && (
            <p className="text-white/70 text-lg sm:text-xl mb-4">{slide.subtitle}</p>
          )}

          {bullets.length > 0 && (
            <div className="space-y-2 mt-4">
              {bullets.map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-white/90 text-sm sm:text-base leading-relaxed">{b}</p>
                </div>
              ))}
            </div>
          )}

          {slide.quote && (
            <blockquote className="mt-6 border-l-4 border-white/30 pl-4">
              <p className="text-white/80 text-lg italic">"{slide.quote}"</p>
              {slide.author && <cite className="text-white/50 text-sm mt-2 block">— {slide.author}</cite>}
            </blockquote>
          )}

          {slide.body && !bullets.length && (
            <p className="text-white/85 text-sm sm:text-base leading-relaxed mt-4 whitespace-pre-wrap">{slide.body}</p>
          )}

          {slide.layout === 'comparison' && (slide.left || slide.right) && (
            <div className="grid grid-cols-2 gap-6 mt-6">
              {slide.left && (
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white font-bold text-sm mb-2">{slide.left.title || 'Opción A'}</p>
                  {slide.left.items?.map((item, i) => (
                    <p key={i} className="text-white/80 text-xs mb-1">• {item}</p>
                  ))}
                </div>
              )}
              {slide.right && (
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white font-bold text-sm mb-2">{slide.right.title || 'Opción B'}</p>
                  {slide.right.items?.map((item, i) => (
                    <p key={i} className="text-white/80 text-xs mb-1">• {item}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button onClick={onPrev} disabled={index === 0} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-white/60 text-sm font-medium">{index + 1} / {total}</span>
          <button onClick={onNext} disabled={index === total - 1} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <button onClick={onClose} className="absolute -top-3 -right-3 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

interface PresentacionRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function PresentacionRenderer({ product, className, style }: PresentacionRendererProps) {
  const { metadata, data } = product;
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const deck: PptDeckData = {
    slides: (Array.isArray(data.slides) ? data.slides : []) as Slide[],
    title: typeof data.title === 'string' ? data.title : metadata.title,
    theme: typeof data.theme === 'object' && data.theme !== null ? data.theme as PptDeckData['theme'] : undefined,
  };

  const slides = deck.slides;
  const visualLesson = useMemo<SlideLesson>(() => ({
    title: metadata.title || deck.title || 'Presentación de clase',
    subtitle: metadata.subtitle || '',
    course: metadata.level || '',
    subject: metadata.subject || '',
    objectiveCode: metadata.oaCode || '',
    objectiveText: metadata.oaText || metadata.topic || '',
    theme: metadata.topic,
    slides: slides.map((slide, index) => {
      const content = [slide.body, ...(slide.bullets || slide.items || []), slide.activity, slide.question, slide.quote].filter(Boolean).join('. ');
      const typeMap: Record<string, SlideType> = {
        title: 'cover', bullets: index === 1 ? 'activation' : 'explanation', image_text: 'explanation',
        comparison: 'explanation', quote: 'activation', vocabulario: 'explanation', ciclo_proceso: 'guided-practice',
        quiz_opcion_multiple: 'formative-assessment', verdadero_falso: 'formative-assessment',
      };
      return {
        type: typeMap[slide.layout] || 'explanation',
        title: slide.title || slide.term || slide.question || `Diapositiva ${index + 1}`,
        subtitle: slide.subtitle,
        bullets: slide.bullets || slide.items,
        activity: typeof slide.activity === 'string' ? slide.activity : undefined,
        example: typeof slide.example === 'string' ? slide.example : undefined,
        questions: slide.question ? [slide.question] : undefined,
        speakerNotes: typeof slide.speakerNotes === 'string' ? slide.speakerNotes : undefined,
        visualPrompt: typeof slide.imageQuery === 'string' ? slide.imageQuery : content,
      };
    }),
  }), [deck.title, metadata.level, metadata.oaCode, metadata.oaText, metadata.subject, metadata.subtitle, metadata.title, metadata.topic, slides]);

  const exportVisualPptx = async (visualDeck: VisualLessonDeck) => {
    const images: Record<string, string> = {};
    visualDeck.slides.forEach((slide, index) => {
      if (slide.visual.imageUrl) images[String(index)] = slide.visual.imageUrl;
    });
    await downloadPPTX(visualLesson, images, `${metadata.title || 'presentacion'}.pptx`);
  };

  return (
    <div
      className={`presentacion-renderer w-full space-y-6 p-4 md:p-6 lg:p-8 print:m-0 print:max-w-none print:p-0 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title}
        subtitle={metadata.subtitle || `${slides.length} diapositiva${slides.length !== 1 ? 's' : ''}`}
        level={metadata.level}
        subject={metadata.subject}
        oaCode={metadata.oaCode}
        oaText={metadata.oaText}
        topic={metadata.topic}
        date={metadata.date}
        teacherName={metadata.teacherName}
        estimatedTime={metadata.estimatedTime}
        className="mb-6"
      />

      {/* Visual lesson preview: generates semantic images from OA + slide content */}
      {slides.length > 0 ? (
        <SlideLessonPreview lesson={visualLesson} onExportPPTX={exportVisualPptx} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white py-12 text-center text-[var(--muted)]">
          <p>No se encontraron diapositivas.</p>
        </div>
      )}

      {/* Action bar */}
      <div className="print:hidden">
        <ProductActionBar product={product} selectedProducto="presentacion" />
      </div>

      {/* Modal */}
      {modalIndex !== null && slides[modalIndex] && (
        <SlideModal
          slide={slides[modalIndex]}
          index={modalIndex}
          total={slides.length}
          onClose={() => setModalIndex(null)}
          onPrev={() => modalIndex > 0 && setModalIndex(modalIndex - 1)}
          onNext={() => modalIndex < slides.length - 1 && setModalIndex(modalIndex + 1)}
        />
      )}
    </div>
  );
}
