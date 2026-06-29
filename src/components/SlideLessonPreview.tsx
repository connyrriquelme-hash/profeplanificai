import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2,
  BookOpen, BrainCircuit, Lightbulb, Users, Edit3,
  ClipboardCheck, Flag, Target, CheckCircle2, HelpCircle,
  Heart, Star, Sparkles, ImagePlus, ChevronDown, ChevronUp, Loader2,
  AlertTriangle, CheckCircle, LayoutGrid,
} from 'lucide-react';
import type { SlideLesson } from '../types/slideLesson';
import type { VisualLessonDeck, LessonSlide, SlideLayout, SlidePalette, SlideVisual } from '../types/presentation';
import { normalizeLessonSlidesToVisualDeck } from '../services/presentationAdapter';
import { generateImagesForDeck, replaceSlideImage } from '../services/slideImageGenerationService';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SmartArt } from './ui/SmartArt';

interface SlideLessonPreviewProps {
  lesson: SlideLesson;
  onExportPDF?: () => void;
  onSave?: () => void;
  onShare?: () => void;
}

// ── Palette engine ──────────────────────────────────────────────────────────

const PALETTE_STOPS: Record<SlidePalette, { from: string; to: string; accent: string; glass: string; border: string }> = {
  violet:  { from: 'from-violet-600', to: 'to-indigo-700', accent: 'text-violet-200', glass: 'bg-white/[0.10]', border: 'border-white/[0.08]' },
  indigo:  { from: 'from-indigo-500', to: 'to-blue-600',   accent: 'text-indigo-200', glass: 'bg-white/[0.10]', border: 'border-white/[0.08]' },
  teal:    { from: 'from-teal-500',   to: 'to-cyan-600',   accent: 'text-teal-200',   glass: 'bg-white/[0.10]', border: 'border-white/[0.08]' },
  amber:   { from: 'from-amber-500',  to: 'to-orange-600', accent: 'text-amber-200',  glass: 'bg-white/[0.12]', border: 'border-white/[0.10]' },
  rose:    { from: 'from-rose-500',   to: 'to-pink-600',   accent: 'text-rose-200',   glass: 'bg-white/[0.10]', border: 'border-white/[0.08]' },
  slate:   { from: 'from-slate-600',  to: 'to-gray-700',   accent: 'text-slate-200',  glass: 'bg-white/[0.10]', border: 'border-white/[0.08]' },
  emerald: { from: 'from-emerald-500',to: 'to-teal-600',   accent: 'text-emerald-200',glass: 'bg-white/[0.10]', border: 'border-white/[0.08]' },
  fuchsia: { from: 'from-fuchsia-500',to: 'to-purple-600', accent: 'text-fuchsia-200',glass: 'bg-white/[0.10]', border: 'border-white/[0.08]' },
};

function paletteFor(p: SlidePalette) { return PALETTE_STOPS[p] || PALETTE_STOPS.violet; }

// ── Slide type icons/labels (new system) ─────────────────────────────────────

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  cover: BookOpen, objective: Target, activation: BrainCircuit,
  explanation: Lightbulb, 'guided-practice': Users, 'student-work': Edit3,
  'formative-assessment': ClipboardCheck, closure: Heart,
};

const TYPE_LABELS: Record<string, string> = {
  cover: 'Portada', objective: 'Objetivo', activation: 'Activación',
  explanation: 'Concepto clave', 'guided-practice': 'Práctica guiada',
  'student-work': 'Actividad', 'formative-assessment': 'Evaluación formativa',
  closure: 'Cierre',
};

function TypeIcon({ type, size, className }: { type: string; size?: number; className?: string }) {
  const Icon = TYPE_ICONS[type] || BookOpen;
  return <Icon size={size} className={className} />;
}
function typeLabel(t: string) { return TYPE_LABELS[t] || t; }

// ── Placeholder / error image component ─────────────────────────────────────

function ImagePlaceholder({ visual, palette }: { visual: SlideVisual; palette: SlidePalette }) {
  const p = paletteFor(palette);

  if (visual.status === 'generating') {
    return (
      <div className={`relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${p.from} ${p.to} rounded-xl overflow-hidden`}>
        <div className="absolute inset-0 bg-black/15" />
        <Loader2 size={28} className="text-white/40 mb-2 animate-spin" strokeWidth={1.5} />
        <p className="text-[10px] text-white/50 text-center px-4">Generando...</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${p.from} ${p.to} rounded-xl overflow-hidden`}>
      <div className="absolute inset-0 bg-black/15" />
      {visual.status === 'failed' ? (
        <>
          <AlertTriangle size={28} className="text-red-300/60 mb-2" strokeWidth={1.5} />
          <p className="text-[10px] text-red-200/70 text-center px-4 max-w-[200px] leading-relaxed">
            Sin imagen disponible
          </p>
        </>
      ) : (
        <>
          <ImagePlus size={36} className="text-white/30 mb-2" strokeWidth={1.2} />
          <p className="text-[10px] text-white/40 text-center px-4 max-w-[200px] leading-relaxed line-clamp-2">
            {visual.imageAlt || 'Imagen'}
          </p>
        </>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1">
        <span className="inline-flex items-center text-[8px] text-white/25 uppercase tracking-wider font-mono">
          {visual.status === 'generated' ? 'listo' : visual.status === 'failed' ? 'error' : 'placeholder'}
        </span>
      </div>
    </div>
  );
}

// ── Cover-hero layout ───────────────────────────────────────────────────────

function renderCoverHero(slide: LessonSlide, deck: VisualLessonDeck) {
  const p = paletteFor(slide.palette);
  const hasImage = slide.visual.imageUrl && slide.visual.status === 'generated';
  return (
    <div className="relative h-full flex flex-col overflow-hidden rounded-xl">
      {hasImage ? (
        <img src={slide.visual.imageUrl} alt={slide.visual.imageAlt} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${slide.visual.imagePrompt.includes('minimalista') ? 'from-gray-800 to-gray-900' : `${p.from} ${p.to}`}`} />
      )}
      <div className={`absolute inset-0 ${hasImage ? 'bg-gradient-to-t from-black/70 via-black/30 to-black/20' : 'bg-black/15'}`} />
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 sm:px-10 md:px-14 text-center">
        <div className="mb-3">
          <BookOpen size={44} className="text-white/20 mx-auto" strokeWidth={1} />
        </div>
        <div className="w-10 h-0.5 bg-white/20 mx-auto mb-5" />
        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-white max-w-3xl drop-shadow-lg">
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p className="text-sm sm:text-base md:text-lg text-white/65 font-light tracking-wide max-w-xl mt-3 leading-relaxed">
            {slide.subtitle}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <span className="inline-flex items-center text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/15 text-white/90 backdrop-blur-sm border border-white/10">
            {deck.course}
          </span>
          <span className="inline-flex items-center text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/15 text-white/90 backdrop-blur-sm border border-white/10">
            {deck.subject}
          </span>
          {deck.objectiveCode && (
            <span className="inline-flex items-center text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/15 text-white/90 backdrop-blur-sm border border-white/10">
              {deck.objectiveCode}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Split image right ───────────────────────────────────────────────────────

function renderSplitImageRight(slide: LessonSlide, deck: VisualLessonDeck) {
  const p = paletteFor(slide.palette);
  return (
    <div className="relative h-full flex flex-col px-6 sm:px-10 md:px-14 py-6 sm:py-8">
      <div className="flex items-center gap-2 mb-1">
        <TypeIcon type={slide.type} size={14} className="text-white/50" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">{typeLabel(slide.type)}</span>
      </div>
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight mb-1">{slide.title}</h2>
      {slide.subtitle && <p className="text-xs sm:text-sm text-white/65 mb-3 font-light">{slide.subtitle}</p>}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 min-h-0">
        <div className="md:col-span-3 space-y-2 overflow-y-auto">
          {slide.bullets?.slice(0, 4).map((b, i) => (
            <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl ${p.glass} ${p.border}`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">{b}</p>
            </div>
          ))}
          {slide.body && (
            <div className={`p-2.5 rounded-xl ${p.glass} ${p.border}`}>
              <p className="text-xs text-white/80 leading-relaxed line-clamp-3">{slide.body}</p>
            </div>
          )}
        </div>
        <div className="md:col-span-2 flex">
          {slide.visual.imageUrl && slide.visual.status === 'generated' ? (
            <img src={slide.visual.imageUrl} alt={slide.visual.imageAlt} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <ImagePlaceholder visual={slide.visual} palette={slide.palette} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Split image left ────────────────────────────────────────────────────────

function renderSplitImageLeft(slide: LessonSlide, deck: VisualLessonDeck) {
  const p = paletteFor(slide.palette);
  return (
    <div className="relative h-full flex flex-col px-6 sm:px-10 md:px-14 py-6 sm:py-8">
      <div className="flex items-center gap-2 mb-1">
        <TypeIcon type={slide.type} size={14} className="text-white/50" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">{typeLabel(slide.type)}</span>
      </div>
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight mb-1">{slide.title}</h2>
      {slide.subtitle && <p className="text-xs sm:text-sm text-white/65 mb-3 font-light">{slide.subtitle}</p>}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 min-h-0">
        <div className="md:col-span-2 flex">
          {slide.visual.imageUrl && slide.visual.status === 'generated' ? (
            <img src={slide.visual.imageUrl} alt={slide.visual.imageAlt} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <ImagePlaceholder visual={slide.visual} palette={slide.palette} />
          )}
        </div>
        <div className="md:col-span-3 space-y-2 overflow-y-auto">
          {slide.bullets?.slice(0, 4).map((b, i) => (
            <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl ${p.glass} ${p.border}`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">{b}</p>
            </div>
          ))}
          {slide.body && (
            <div className={`p-2.5 rounded-xl ${p.glass} ${p.border}`}>
              <p className="text-xs text-white/80 leading-relaxed line-clamp-3">{slide.body}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Steps layout ────────────────────────────────────────────────────────────

function renderSteps(slide: LessonSlide, deck: VisualLessonDeck) {
  const p = paletteFor(slide.palette);
  const items = slide.bullets?.slice(0, 5) || [];
  return (
    <div className="relative h-full flex flex-col px-6 sm:px-10 md:px-14 py-6 sm:py-8">
      <div className="flex items-center gap-2 mb-1">
        <TypeIcon type={slide.type} size={14} className="text-white/50" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">{typeLabel(slide.type)}</span>
      </div>
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight mb-3">{slide.title}</h2>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 min-h-0">
        <div className={`md:col-span-3 space-y-2 overflow-y-auto ${items.length === 0 ? 'flex items-center justify-center' : ''}`}>
          {items.length === 0 && slide.body && (
            <p className="text-sm text-white/80 leading-relaxed">{slide.body}</p>
          )}
          {items.map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">{i + 1}</span>
                {i < items.length - 1 && <div className="w-px flex-1 bg-white/15 my-1" />}
              </div>
              <div className={`flex-1 p-2.5 rounded-xl ${p.glass} ${p.border} mt-0.5`}>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">{b}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="md:col-span-2 flex">
          {slide.visual.imageUrl && slide.visual.status === 'generated' ? (
            <img src={slide.visual.imageUrl} alt={slide.visual.imageAlt} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <ImagePlaceholder visual={slide.visual} palette={slide.palette} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Cards grid layout ───────────────────────────────────────────────────────

function renderCardsGrid(slide: LessonSlide, deck: VisualLessonDeck) {
  const p = paletteFor(slide.palette);
  const items = slide.bullets?.slice(0, 4) || [];
  const gridCols = items.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2';
  return (
    <div className="relative h-full flex flex-col px-6 sm:px-10 md:px-14 py-6 sm:py-8">
      <div className="flex items-center gap-2 mb-1">
        <TypeIcon type={slide.type} size={14} className="text-white/50" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">{typeLabel(slide.type)}</span>
      </div>
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight mb-1">{slide.title}</h2>
      {slide.subtitle && <p className="text-xs sm:text-sm text-white/65 mb-3 font-light">{slide.subtitle}</p>}
      <div className="flex-1 flex items-center">
        <div className={`w-full grid ${gridCols} gap-3`}>
          {items.map((b, i) => (
            <div key={i} className={`p-3.5 rounded-xl ${p.glass} ${p.border} backdrop-blur-sm flex flex-col items-start gap-2`}>
              <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-sm font-bold text-white/80">{i + 1}</span>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">{b}</p>
            </div>
          ))}
          {slide.body && (
            <div className={`p-3.5 rounded-xl ${p.glass} ${p.border} ${items.length > 0 ? '' : 'col-span-2'} backdrop-blur-sm flex items-center`}>
              <p className="text-xs text-white/80 leading-relaxed">{slide.body}</p>
            </div>
          )}
        </div>
      </div>
      {slide.activity && (
        <div className={`mt-3 p-2.5 rounded-xl ${p.glass} ${p.border} flex items-start gap-2`}>
          <Sparkles size={14} className="text-white/50 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white/85 leading-relaxed">{slide.activity}</p>
        </div>
      )}
    </div>
  );
}

// ── Checklist layout ────────────────────────────────────────────────────────

function renderChecklist(slide: LessonSlide, deck: VisualLessonDeck) {
  const p = paletteFor(slide.palette);
  const items = slide.bullets?.slice(0, 5) || [];
  const questions = slide.questions?.slice(0, 3) || [];
  return (
    <div className="relative h-full flex flex-col px-6 sm:px-10 md:px-14 py-6 sm:py-8">
      <div className="flex items-center gap-2 mb-1">
        <TypeIcon type={slide.type} size={14} className="text-white/50" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">{typeLabel(slide.type)}</span>
      </div>
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight mb-1">{slide.title}</h2>
      {slide.subtitle && <p className="text-xs sm:text-sm text-white/65 mb-3 font-light">{slide.subtitle}</p>}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 min-h-0">
        <div className="md:col-span-3 space-y-2 overflow-y-auto">
          {items.map((b, i) => (
            <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl ${p.glass} ${p.border}`}>
              <CheckCircle2 size={16} className="text-emerald-300 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">{b}</p>
            </div>
          ))}
          {questions.length > 0 && (
            <div className={`mt-2 p-2.5 rounded-xl bg-purple-400/15 border border-purple-400/20`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-purple-300 mb-1.5">Ticket de salida</p>
              {questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-white/85 mb-1 last:mb-0">
                  <HelpCircle size={12} className="text-white/40 flex-shrink-0 mt-0.5" />
                  {q}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2 space-y-2">
          {slide.activity && (
            <div className={`p-3 rounded-xl ${p.glass} ${p.border}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50 mb-1">Actividad</p>
              <p className="text-xs text-white/85 leading-relaxed">{slide.activity}</p>
            </div>
          )}
          {slide.body && (
            <div className={`p-3 rounded-xl ${p.glass} ${p.border}`}>
              <p className="text-xs text-white/80 leading-relaxed line-clamp-4">{slide.body}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reflection layout ───────────────────────────────────────────────────────

function renderReflection(slide: LessonSlide, deck: VisualLessonDeck) {
  const p = paletteFor(slide.palette);
  const hasImage = slide.visual.imageUrl && slide.visual.status === 'generated';
  return (
    <div className="relative h-full flex flex-col overflow-hidden rounded-xl">
      {hasImage ? (
        <img src={slide.visual.imageUrl} alt={slide.visual.imageAlt} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${p.from} ${p.to}`} />
      )}
      <div className={`absolute inset-0 ${hasImage ? 'bg-gradient-to-t from-black/70 via-black/40 to-black/30' : 'bg-black/15'}`} />
      <div className="relative z-10 flex flex-col flex-1 px-6 sm:px-10 md:px-14 py-6 sm:py-8">
        <div className="flex items-center gap-2 mb-1">
          <Heart size={14} className="text-white/50" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">{typeLabel(slide.type)}</span>
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight mb-1">{slide.title}</h2>
        {slide.subtitle && <p className="text-xs sm:text-sm text-white/65 mb-3 font-light">{slide.subtitle}</p>}
        <div className="flex-1 flex flex-col justify-center items-center text-center max-w-2xl mx-auto">
          <div className="w-10 h-0.5 bg-white/20 mb-5" />
          {slide.metacognition ? (
            <p className="text-base sm:text-lg md:text-xl text-white/90 italic leading-relaxed font-light">
              {slide.metacognition}
            </p>
          ) : slide.body ? (
            <p className="text-sm sm:text-base text-white/85 italic leading-relaxed">{slide.body}</p>
          ) : null}
          {slide.exitTicket && (
            <div className="mt-5 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 inline-block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50 mb-1">Ticket de salida</p>
              <p className="text-sm text-white/85 italic">{slide.exitTicket}</p>
            </div>
          )}
          {!slide.metacognition && !slide.body && !slide.exitTicket && (
            <div className="flex flex-wrap justify-center gap-2">
              {slide.bullets?.slice(0, 3).map((b, i) => (
                <div key={i} className={`p-2 rounded-lg ${p.glass} ${p.border} flex items-center gap-2`}>
                  <Star size={12} className="text-white/40" />
                  <span className="text-xs text-white/85">{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Layout dispatch ─────────────────────────────────────────────────────────

function renderDiagramProcess(slide: LessonSlide, _deck: VisualLessonDeck): React.ReactNode {
  if (!slide.diagram) return null;
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <SmartArt type="process" nodes={slide.diagram.nodes} edges={slide.diagram.edges} />
    </div>
  );
}

function renderDiagramCycle(slide: LessonSlide, _deck: VisualLessonDeck): React.ReactNode {
  if (!slide.diagram) return null;
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <SmartArt type="cycle" nodes={slide.diagram.nodes} />
    </div>
  );
}

function renderDiagramHierarchy(slide: LessonSlide, _deck: VisualLessonDeck): React.ReactNode {
  if (!slide.diagram) return null;
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <SmartArt type="hierarchy" nodes={slide.diagram.nodes} />
    </div>
  );
}

function renderComparison(slide: LessonSlide, _deck: VisualLessonDeck): React.ReactNode {
  if (!slide.diagram) return null;
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <SmartArt type="comparison" nodes={slide.diagram.nodes} />
    </div>
  );
}

function renderTableView(slide: LessonSlide, _deck: VisualLessonDeck): React.ReactNode {
  if (!slide.table) return null;
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-full max-w-3xl overflow-x-auto rounded-xl border border-white/10 shadow-lg">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-white/10 backdrop-blur-sm border-b border-white/10">
              {slide.table.headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-semibold text-white/90 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slide.table.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-3 text-white/80 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const LAYOUT_RENDERERS: Record<SlideLayout, (slide: LessonSlide, deck: VisualLessonDeck) => React.ReactNode> = {
  'cover-hero': renderCoverHero,
  'split-image-right': renderSplitImageRight,
  'split-image-left': renderSplitImageLeft,
  'full-image-overlay': () => null,
  'cards-grid': renderCardsGrid,
  timeline: () => null,
  steps: renderSteps,
  quote: renderChecklist,
  checklist: renderChecklist,
  reflection: renderReflection,
  'diagram-process': renderDiagramProcess,
  'diagram-cycle': renderDiagramCycle,
  'diagram-hierarchy': renderDiagramHierarchy,
  comparison: renderComparison,
  'table-view': renderTableView,
};

function renderSlide(layout: SlideLayout, slide: LessonSlide, deck: VisualLessonDeck): React.ReactNode {
  const renderer = LAYOUT_RENDERERS[layout] || renderCardsGrid;
  return renderer(slide, deck);
}

// ── Main component ──────────────────────────────────────────────────────────

export function SlideLessonPreview({ lesson, onExportPDF, onSave, onShare }: SlideLessonPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [deck, setDeck] = useState<VisualLessonDeck | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deckRef = useRef<VisualLessonDeck | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setDeck(normalizeLessonSlidesToVisualDeck(lesson));
    setCurrentSlide(0);
    setShowNotes(false);
  }, [lesson]);

  // Keep ref in sync with deck state
  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const handleGenerateAllImages = useCallback(async () => {
    const currentDeck = deckRef.current;
    if (!currentDeck || generatingAll) return;
    setGeneratingAll(true);

    const markGenerating = (idx: number) => {
      setDeck(prev => {
        if (!prev) return prev;
        const slides = prev.slides.map((s, i) => {
          if (i < idx) return { ...s, visual: { ...s.visual, status: 'generated' as const } };
          if (i === idx) return { ...s, visual: { ...s.visual, status: 'generating' as const } };
          return s;
        });
        return { ...prev, slides };
      });
    };

    try {
      const { deck: updated, failedCount, noProvider } = await generateImagesForDeck(currentDeck, (i) => { markGenerating(i - 1); });
      setDeck(updated);
      if (noProvider) {
        showToast('No hay proveedor de imágenes configurado. Configura una API key en Cloudflare.');
      } else if (failedCount === 0) {
        showToast('Imágenes generadas correctamente.');
      } else {
        const total = currentDeck.slides.length;
        const ok = total - failedCount;
        showToast(`${ok} de ${total} imágenes generadas${failedCount > 0 ? ` (${failedCount} fallaron).` : '.'}`);
      }
    } catch {
      setDeck(prev => {
        if (!prev) return prev;
        const slides = prev.slides.map(s => {
          if (s.visual.status === 'generating') return { ...s, visual: { ...s.visual, status: 'failed' as const } };
          return s;
        });
        return { ...prev, slides };
      });
      showToast('Error inesperado al generar imágenes.');
    } finally {
      setGeneratingAll(false);
    }
  }, [generatingAll, showToast]);

  const slide = deck?.slides[currentSlide];
  const totalSlides = deck?.slides.length || 0;

  if (!deck || !slide) return null;

  const content = (
    <div className="w-full max-w-4xl mx-auto" style={{ aspectRatio: '16 / 9' }}>
      <Card className="relative h-full overflow-hidden rounded-2xl shadow-xl text-white">
        {renderSlide(slide.layout, slide, deck)}
      </Card>
    </div>
  );

  const wrap = (children: React.ReactNode) => {
    if (fullscreen) {
      return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white z-20 transition-colors">
            <Minimize2 size={22} />
          </button>
          <div className="w-full max-w-5xl">{children}</div>
        </div>
      );
    }
    return children;
  };

  return (
    <div className="space-y-3">
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium animate-scale-in max-w-sm">
          {toast.includes('correctamente') ? <CheckCircle size={18} className="text-green-400" /> : toast.includes('configurado') ? <AlertTriangle size={18} className="text-amber-400" /> : <AlertTriangle size={18} className="text-red-400" />}
          {toast}
        </div>
      )}
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge color="violet" size="sm">{deck.course}</Badge>
          <Badge color="violet" size="sm">{deck.subject}</Badge>
          {deck.objectiveCode && <Badge color="violet" size="sm">{deck.objectiveCode}</Badge>}
          <Badge color="slate" size="sm">{totalSlides} diapositivas</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            iconLeft={generatingAll ? Loader2 : Sparkles}
            onClick={handleGenerateAllImages}
            disabled={generatingAll}
          >
            {generatingAll ? 'Generando...' : 'Generar imágenes'}
          </Button>
          {onSave && <Button variant="secondary" size="sm" onClick={onSave}>Guardar</Button>}
          {onShare && <Button variant="ghost" size="sm" onClick={onShare}>Compartir</Button>}
          {onExportPDF && <Button variant="ghost" size="sm" onClick={onExportPDF}>Exportar PDF</Button>}
          <Button variant="ghost" size="sm" iconLeft={Maximize2} onClick={() => setFullscreen(true)}>Presentar</Button>
        </div>
      </div>

      {wrap(content)}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" iconLeft={ChevronLeft} onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}>
          Anterior
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{typeLabel(slide.type)} ({currentSlide + 1} de {totalSlides})</span>
          {slide.teacherNotes && (
            <button onClick={() => setShowNotes(!showNotes)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              {showNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Notas docentes
            </button>
          )}
        </div>
        <Button variant="ghost" size="sm" iconRight={ChevronRight} onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))} disabled={currentSlide === totalSlides - 1}>
          Siguiente
        </Button>
      </div>

      {/* Collapsible teacher notes */}
      {showNotes && slide.teacherNotes && (
        <Card variant="default" className="p-3 border-l-4 border-indigo-400 bg-indigo-50/50">
          <p className="text-xs text-indigo-700 leading-relaxed">{slide.teacherNotes}</p>
        </Card>
      )}
    </div>
  );
}
