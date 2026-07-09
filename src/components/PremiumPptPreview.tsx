import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import type { PremiumPresentation, PremiumSlide, SubjectTheme } from '../utils/premiumPptModel';
import { getSubjectTheme } from '../utils/premiumPptModel';

const LAYOUT_LABELS: Record<string, string> = {
  cover: 'Portada',
  hook: 'Activación',
  objective: 'Objetivo',
  concept_cards: 'Conceptos',
  visual_explanation: 'Explicación visual',
  guided_activity: 'Actividad guiada',
  collaborative_activity: 'Actividad colaborativa',
  dua_supports: 'Apoyos DUA',
  formative_assessment: 'Evaluación',
  closure: 'Cierre',
};

function hexToCss(hex: string): string {
  return `#${hex}`;
}

function SlideImage({ url, keyword, className }: { url?: string; keyword: string; className?: string }) {
  const [error, setError] = useState(false);
  if (!url || error) {
    return (
      <div className={`flex items-center justify-center rounded-lg border-2 border-dashed bg-white/10 ${className || ''}`}>
        <div className="text-center text-white/40">
          <div className="text-3xl mb-1">🎨</div>
          <div className="text-sm italic">{keyword}</div>
        </div>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={keyword}
      className={`rounded-lg object-cover ${className || ''}`}
      onError={() => setError(true)}
    />
  );
}

function SlideTable({ headers, rows, caption, theme }: { headers: string[]; rows: string[][]; caption?: string; theme: SubjectTheme }) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg border border-white/20">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left font-bold text-white border-b border-white/20"
                  style={{ backgroundColor: hexToCss(theme.primary) }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-white/5' : 'bg-white/10'}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-white/90 border-b border-white/10">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <div className="text-xs text-white/50 italic mt-1 text-center">{caption}</div>}
    </div>
  );
}

function CoverSlideContent({ slide, pres, theme }: { slide: PremiumSlide; pres: PremiumPresentation; theme: SubjectTheme }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="text-5xl font-bold text-white mb-4">{slide.title}</div>
      <div className="text-xl mb-2" style={{ color: hexToCss(theme.accent) }}>
        {slide.subtitle || `${pres.nivel} — ${pres.asignatura}`}
      </div>
      <div className="text-sm text-white/60 italic mb-6">OA: {pres.oa}</div>
      <SlideImage url={slide.imageUrl} keyword={slide.visualKeyword || pres.tema} className="w-72 h-48" />
    </div>
  );
}

function HookSlideContent({ slide, theme }: { slide: PremiumSlide; theme: SubjectTheme }) {
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col justify-center px-8">
        <h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2>
        {slide.subtitle && <div className="text-base text-white/60 italic mb-4">{slide.subtitle}</div>}
        <ul className="space-y-2">
          {slide.bullets?.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-white/90">
              <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: hexToCss(theme.accent) }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {slide.studentPrompt && (
          <div className="mt-4 px-3 py-2 rounded-lg text-sm italic" style={{ backgroundColor: hexToCss(theme.primary) + '40', color: hexToCss(theme.accent) }}>
            {slide.studentPrompt}
          </div>
        )}
      </div>
      <div className="w-64 flex items-center p-4">
        <SlideImage url={slide.imageUrl} keyword={slide.visualKeyword || 'activación'} className="w-full h-56" />
      </div>
    </div>
  );
}

function ObjectiveSlideContent({ slide, pres, theme }: { slide: PremiumSlide; pres: PremiumPresentation; theme: SubjectTheme }) {
  return (
    <div className="flex flex-col h-full px-8 pt-6">
      <h2 className="text-3xl font-bold mb-4" style={{ color: hexToCss(theme.primary) }}>{slide.title}</h2>
      <div className="px-4 py-3 rounded-lg border-2 mb-4" style={{ borderColor: hexToCss(theme.primary), backgroundColor: hexToCss(theme.primary) + '10' }}>
        <div className="text-base font-medium" style={{ color: hexToCss(theme.text) }}>
          📋 {slide.subtitle || pres.oa}
        </div>
      </div>
      {slide.studentPrompt && (
        <div className="px-4 py-3 rounded-lg mb-4" style={{ backgroundColor: hexToCss(theme.secondary) + '20' }}>
          <div className="text-lg italic" style={{ color: hexToCss(theme.primary) }}>"{slide.studentPrompt}"</div>
        </div>
      )}
      <ul className="space-y-2 mt-auto">
        {slide.bullets?.map((b, i) => (
          <li key={i} className="flex items-start gap-2" style={{ color: hexToCss(theme.text) }}>
            <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: hexToCss(theme.primary) }} />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConceptCardsSlideContent({ slide, theme }: { slide: PremiumSlide; theme: SubjectTheme }) {
  if (slide.table) {
    return (
      <div className="flex flex-col h-full px-8 pt-6">
        <h2 className="text-3xl font-bold mb-1" style={{ color: hexToCss(theme.primary) }}>{slide.title}</h2>
        {slide.subtitle && <div className="text-sm text-white/60 italic mb-4">{slide.subtitle}</div>}
        <div className="flex-1 flex items-center">
          <SlideTable headers={slide.table.headers} rows={slide.table.rows} caption={slide.table.caption} theme={theme} />
        </div>
      </div>
    );
  }
  const items = slide.bullets || [];
  return (
    <div className="flex flex-col h-full px-8 pt-6">
      <h2 className="text-3xl font-bold mb-1" style={{ color: hexToCss(theme.primary) }}>{slide.title}</h2>
      {slide.subtitle && <div className="text-sm text-white/60 italic mb-4">{slide.subtitle}</div>}
      <div className="grid grid-cols-3 gap-3 flex-1">
        {items.map((item, i) => (
          <div key={i} className="relative bg-white/90 rounded-lg p-3 flex flex-col" style={{ borderTop: `3px solid ${hexToCss(theme.primary)}` }}>
            <div className="text-2xl font-bold mb-1" style={{ color: hexToCss(theme.primary) }}>0{i + 1}</div>
            <div className="text-sm flex-1" style={{ color: hexToCss(theme.text) }}>{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualExplanationSlideContent({ slide, theme }: { slide: PremiumSlide; theme: SubjectTheme }) {
  return (
    <div className="flex h-full">
      <div className="w-64 flex items-center p-4">
        <SlideImage url={slide.imageUrl} keyword={slide.visualKeyword || 'tema'} className="w-full h-56" />
      </div>
      <div className="flex-1 flex flex-col justify-center px-8">
        <h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2>
        {slide.subtitle && <div className="text-base italic mb-4" style={{ color: hexToCss(theme.accent) }}>{slide.subtitle}</div>}
        <ul className="space-y-2">
          {slide.bullets?.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-white/90">
              <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: hexToCss(theme.accent) }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function GuidedActivitySlideContent({ slide, theme }: { slide: PremiumSlide; theme: SubjectTheme }) {
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col justify-center px-8">
        <h2 className="text-3xl font-bold mb-1" style={{ color: hexToCss(theme.primary) }}>{slide.title}</h2>
        {slide.subtitle && <div className="text-sm text-white/60 italic mb-3">{slide.subtitle}</div>}
        <div className="bg-white/90 rounded-lg p-4 flex-1">
          {slide.bullets?.map((b, i) => (
            <div key={i} className="flex items-start gap-2 mb-3">
              <span className="font-bold text-sm" style={{ color: hexToCss(theme.primary) }}>Paso {i + 1}:</span>
              <span className="text-sm" style={{ color: hexToCss(theme.text) }}>{b}</span>
            </div>
          ))}
        </div>
        {slide.studentPrompt && (
          <div className="text-sm italic mt-2" style={{ color: hexToCss(theme.primary) }}>{slide.studentPrompt}</div>
        )}
      </div>
      <div className="w-56 flex items-center p-4">
        <SlideImage url={slide.imageUrl} keyword={slide.visualKeyword || 'paso a paso'} className="w-full h-48" />
      </div>
    </div>
  );
}

function CollaborativeActivitySlideContent({ slide, theme }: { slide: PremiumSlide; theme: SubjectTheme }) {
  const iconCards = [
    { icon: '👥', text: 'Trabajo en equipo' },
    { icon: '💬', text: 'Comunicación' },
    { icon: '🎯', text: 'Producto final' },
  ];
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col justify-center px-8">
        <h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2>
        {slide.subtitle && <div className="text-base italic mb-4" style={{ color: hexToCss(theme.accent) }}>{slide.subtitle}</div>}
        <ul className="space-y-2">
          {slide.bullets?.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-white/90">
              <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: hexToCss(theme.accent) }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-64 flex flex-col gap-3 justify-center p-4">
        {iconCards.map((ic, i) => (
          <div key={i} className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">{ic.icon}</div>
            <div className="text-xs font-bold text-white/80">{ic.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DuaSupportsSlideContent({ slide, theme }: { slide: PremiumSlide; theme: SubjectTheme }) {
  const duaCards = [
    { icon: '👁️', title: 'Representación', desc: 'Información en múltiples formatos: texto, imagen, audio, video, manipulación' },
    { icon: '✋', title: 'Acción y Expresión', desc: 'Opciones para demostrar aprendizaje: oral, escrita, visual, digital' },
    { icon: '❤️', title: 'Implicación', desc: 'Motivación y relevancia: elección, autonomía, conexión personal' },
  ];
  return (
    <div className="flex flex-col h-full px-8 pt-6">
      <h2 className="text-3xl font-bold mb-1" style={{ color: hexToCss(theme.primary) }}>{slide.title}</h2>
      {slide.subtitle && <div className="text-sm text-white/60 italic mb-4">{slide.subtitle}</div>}
      <div className="grid grid-cols-3 gap-4 flex-1">
        {duaCards.map((card, i) => (
          <div key={i} className="bg-white/90 rounded-lg p-4 flex flex-col items-center text-center" style={{ borderTop: `3px solid ${hexToCss(theme.primary)}` }}>
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className="font-bold text-sm mb-2" style={{ color: hexToCss(theme.primary) }}>{card.title}</div>
            <div className="text-xs" style={{ color: hexToCss(theme.text) }}>{card.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormativeAssessmentSlideContent({ slide, theme }: { slide: PremiumSlide; theme: SubjectTheme }) {
  return (
    <div className="flex flex-col h-full px-8 pt-6">
      <h2 className="text-3xl font-bold mb-1" style={{ color: hexToCss(theme.primary) }}>{slide.title}</h2>
      {slide.subtitle && <div className="text-sm text-white/60 italic mb-4">{slide.subtitle}</div>}
      {slide.table ? (
        <div className="flex-1 flex items-center">
          <SlideTable headers={slide.table.headers} rows={slide.table.rows} caption={slide.table.caption} theme={theme} />
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {slide.bullets?.map((b, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-lg">✅</span>
              <span className="text-base" style={{ color: hexToCss(theme.text) }}>{b}</span>
            </div>
          ))}
        </div>
      )}
      {slide.studentPrompt && (
        <div className="mt-4 px-4 py-3 rounded-lg border-2" style={{ borderColor: hexToCss(theme.primary), backgroundColor: hexToCss(theme.primary) + '10' }}>
          <div className="font-bold text-sm" style={{ color: hexToCss(theme.primary) }}>🎫 Ticket de salida: "{slide.studentPrompt}"</div>
        </div>
      )}
    </div>
  );
}

function ClosureSlideContent({ slide, pres, theme }: { slide: PremiumSlide; pres: PremiumPresentation; theme: SubjectTheme }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="text-4xl font-bold text-white mb-3">{slide.title}</div>
      {slide.subtitle && <div className="text-base mb-4" style={{ color: hexToCss(theme.accent) }}>{slide.subtitle}</div>}
      <ul className="space-y-2 mb-4">
        {slide.bullets?.map((b, i) => (
          <li key={i} className="text-base text-white/80">{b}</li>
        ))}
      </ul>
      {slide.studentPrompt && (
        <div className="text-sm italic" style={{ color: hexToCss(theme.accent) }}>"{slide.studentPrompt}"</div>
      )}
    </div>
  );
}

const SLIDE_RENDERERS: Record<string, (slide: PremiumSlide, pres: PremiumPresentation, theme: SubjectTheme) => any> = {
  cover: (slide, pres, theme) => <CoverSlideContent slide={slide} pres={pres} theme={theme} />,
  hook: (slide, pres, theme) => <HookSlideContent slide={slide} theme={theme} />,
  objective: (slide, pres, theme) => <ObjectiveSlideContent slide={slide} pres={pres} theme={theme} />,
  concept_cards: (slide, pres, theme) => <ConceptCardsSlideContent slide={slide} theme={theme} />,
  visual_explanation: (slide, pres, theme) => <VisualExplanationSlideContent slide={slide} theme={theme} />,
  guided_activity: (slide, pres, theme) => <GuidedActivitySlideContent slide={slide} theme={theme} />,
  collaborative_activity: (slide, pres, theme) => <CollaborativeActivitySlideContent slide={slide} theme={theme} />,
  dua_supports: (slide, pres, theme) => <DuaSupportsSlideContent slide={slide} theme={theme} />,
  formative_assessment: (slide, pres, theme) => <FormativeAssessmentSlideContent slide={slide} theme={theme} />,
  closure: (slide, pres, theme) => <ClosureSlideContent slide={slide} pres={pres} theme={theme} />,
};

interface PremiumPptPreviewProps {
  presentation: PremiumPresentation;
  isGeneratingImages?: boolean;
  imageProgress?: { current: number; total: number };
}

export default function PremiumPptPreview({ presentation, isGeneratingImages, imageProgress }: PremiumPptPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = getSubjectTheme(presentation.asignatura);
  const slides = presentation.slides;
  const total = slides.length;
  const slide = slides[currentSlide];

  const prev = useCallback(() => setCurrentSlide(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setCurrentSlide(i => Math.min(total - 1, i + 1)), [total]);

  const renderSlide = SLIDE_RENDERERS[slide.layout];
  const bgColor = slide.layout === 'cover' || slide.layout === 'hook' || slide.layout === 'visual_explanation' || slide.layout === 'collaborative_activity' || slide.layout === 'closure'
    ? hexToCss(theme.primary)
    : hexToCss(theme.background);

  const slideContent = (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl"
      style={{ backgroundColor: bgColor, aspectRatio: '16/9' }}
    >
      <div className="absolute inset-0 p-6">
        {renderSlide ? renderSlide(slide, presentation, theme) : (
          <div className="flex flex-col justify-center h-full px-8">
            <h2 className="text-2xl font-bold text-white mb-2">{slide.title}</h2>
            <ul className="space-y-1">
              {slide.bullets?.map((b, i) => (
                <li key={i} className="text-sm text-white/80">• {b}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="absolute bottom-2 left-4 right-4 flex justify-between items-center text-[10px] text-white/40">
        <span>ProfePlanificAI | {presentation.nivel} | {presentation.asignatura}</span>
        <span>{currentSlide + 1} / {total}</span>
      </div>
    </div>
  );

  const slideList = (
    <div className="flex flex-col gap-2 mt-4 max-h-64 overflow-y-auto">
      {slides.map((s, i) => (
        <button
          key={i}
          onClick={() => setCurrentSlide(i)}
          className={`text-left px-3 py-2 rounded-lg text-xs transition-all ${
            i === currentSlide ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-white/50 text-gray-600 hover:bg-white/80'
          }`}
        >
          <span className="font-mono mr-1">{i + 1}.</span>
          {LAYOUT_LABELS[s.layout] || s.layout}: {truncate(s.title, 40)}
        </button>
      ))}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
        <div className="flex items-center justify-between p-3">
          <div className="text-white text-sm font-medium">{presentation.title}</div>
          <div className="flex items-center gap-3">
            {isGeneratingImages && imageProgress && (
              <span className="text-xs text-white/60">
                Generando imágenes: {imageProgress.current}/{imageProgress.total}
              </span>
            )}
            <button onClick={() => setIsFullscreen(false)} className="text-white/60 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-5xl">
            {slideContent}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 p-4">
          <button onClick={prev} disabled={currentSlide === 0} className="text-white/60 hover:text-white disabled:opacity-30">
            <ChevronLeft size={24} />
          </button>
          <span className="text-white text-sm">{currentSlide + 1} / {total}</span>
          <button onClick={next} disabled={currentSlide === total - 1} className="text-white/60 hover:text-white disabled:opacity-30">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">
            Vista previa: {LAYOUT_LABELS[slide.layout] || slide.layout}
          </h3>
          <div className="flex items-center gap-2">
            {isGeneratingImages && imageProgress && (
              <span className="text-xs text-gray-500">
                Imágenes: {imageProgress.current}/{imageProgress.total}
              </span>
            )}
            <button onClick={() => setIsFullscreen(true)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
        {slideContent}
        <div className="flex items-center justify-center gap-3 mt-3">
          <button onClick={prev} disabled={currentSlide === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs text-gray-500">{currentSlide + 1} / {total}</span>
          <button onClick={next} disabled={currentSlide === total - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="w-56 flex-shrink-0">
        <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Diapositivas</div>
        {slideList}
      </div>
    </div>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3).trim() + '...';
}
