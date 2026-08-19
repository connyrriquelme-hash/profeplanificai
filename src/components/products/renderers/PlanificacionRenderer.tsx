/**
 * PlanificacionRenderer — Premium renderer for lesson plans.
 *
 * Renders planificacion data as a timeline of classes with
 * color-coded phases (apertura/desarrollo/cierre), materials,
 * DUA strategies, and evaluation method.
 */

import { useState } from 'react';
import { Clock, Users, BookOpen, Target, ChevronDown, CheckCircle2 } from 'lucide-react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { ProductActionBar } from '../ProductActionBar';
import type { PedagogicalProduct } from '../types';

interface PlanificacionRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

interface PlanClass {
  number?: number;
  numero?: number;
  theme?: string;
  tema?: string;
  objective?: string;
  objetivo?: string;
  opening?: string;
  apertura?: string;
  development?: string;
  desarrollo?: string;
  closure?: string;
  cierre?: string;
  duration?: string;
  duracion?: string;
  materials?: string[];
  materiales?: string[];
  assessment?: string;
  evaluacion?: string;
}

const PHASE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  apertura:    { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   dot: 'bg-[#06BFAD]' },
  desarrollo:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-[#F2A413]' },
  cierre:      { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   dot: 'bg-[#F24162]' },
};

function PhaseBlock({ label, content, phase }: { label: string; content?: string; phase: string }) {
  if (!content) return null;
  const colors = PHASE_COLORS[phase] || PHASE_COLORS.apertura;
  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-4`}>
      <p className={`text-[11px] font-black uppercase tracking-wider ${colors.text} mb-1.5`}>{label}</p>
      <p className="text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

export function PlanificacionRenderer({ product, className, style }: PlanificacionRendererProps) {
  const { metadata, data } = product;
  const [expandedClass, setExpandedClass] = useState<number | null>(0);

  const classes: PlanClass[] = Array.isArray(data.classes) ? data.classes as PlanClass[]
    : Array.isArray(data.clases) ? data.clases as PlanClass[]
    : [];
  const materials: string[] = Array.isArray(data.materials) ? data.materials as string[]
    : Array.isArray(data.materiales) ? data.materiales as string[]
    : [];
  const dua: Array<{ principle?: string; estrategia?: string; strategies?: string[]; accommodations?: string[] }> =
    Array.isArray(data.dua) ? data.dua as Array<{ principle?: string; estrategia?: string; strategies?: string[]; accommodations?: string[] }> : [];
  const evaluationMethod: string = (typeof data.evaluationMethod === 'string' ? data.evaluationMethod
    : typeof data.evaluacion === 'string' ? data.evaluacion
    : typeof data.assessmentMethod === 'string' ? data.assessmentMethod : '') || '';
  const duration: string = (typeof data.duration === 'string' ? data.duration
    : typeof data.duracion === 'string' ? data.duracion : '') || '';
  const totalClasses = classes.length;

  return (
    <div
      className={`planificacion-renderer w-full space-y-6 p-4 md:p-6 lg:p-8 print:m-0 print:max-w-none print:p-0 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title}
        subtitle={metadata.subtitle}
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

      {/* Stats row */}
      <div className="flex flex-wrap gap-3">
        {totalClasses > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--primary-tint)] text-[var(--primary-ink)]">
            <BookOpen size={14} /> {totalClasses} clase{totalClasses !== 1 ? 's' : ''}
          </span>
        )}
        {duration && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
            <Clock size={14} /> {duration}
          </span>
        )}
        {materials.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            <Users size={14} /> {materials.length} material{materials.length !== 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {/* Classes Timeline */}
      {classes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-2">
            <Target size={16} className="text-[var(--primary)]" />
            Secuencia de Clases
          </h3>

          <div className="relative pl-8">
            {/* Vertical line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-[var(--border)]" />

            {classes.map((cls, i) => {
              const num = cls.number ?? cls.numero ?? i + 1;
              const theme = cls.theme || cls.tema || `Clase ${num}`;
              const isExpanded = expandedClass === i;

              return (
                <div key={i} className="relative mb-4 last:mb-0">
                  {/* Dot */}
                  <div className="absolute -left-5 top-3 w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center z-10 shadow-sm">
                    {num}
                  </div>

                  <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedClass(isExpanded ? null : i)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg)] transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--ink)] truncate">{theme}</p>
                        {cls.objective && (
                          <p className="text-xs text-[var(--muted)] truncate mt-0.5">{cls.objective}</p>
                        )}
                      </div>
                      {cls.duration && (
                        <span className="text-[11px] font-medium text-[var(--muted)] bg-[var(--bg2)] px-2 py-0.5 rounded-full flex-shrink-0">
                          {cls.duration}
                        </span>
                      )}
                      <ChevronDown
                        size={16}
                        className={`text-[var(--muted)] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)] pt-3">
                        {cls.objective && (
                          <div className="flex items-start gap-2">
                            <Target size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-[var(--ink)]">{cls.objective}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <PhaseBlock label="Apertura" content={cls.opening || cls.apertura} phase="apertura" />
                          <PhaseBlock label="Desarrollo" content={cls.development || cls.desarrollo} phase="desarrollo" />
                          <PhaseBlock label="Cierre" content={cls.closure || cls.cierre} phase="cierre" />
                        </div>

                        {cls.assessment && (
                          <div className="flex items-start gap-2 text-xs text-[var(--muted)]">
                            <CheckCircle2 size={14} className="text-[#06BFAD] mt-0.5 flex-shrink-0" />
                            <span><span className="font-semibold">Evaluación:</span> {cls.assessment}</span>
                          </div>
                        )}

                        {(cls.materials && cls.materials.length > 0) && (
                          <div className="flex flex-wrap gap-1.5">
                            {cls.materials.map((m, j) => (
                              <span key={j} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--bg2)] text-[var(--muted)]">{m}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Materials */}
      {materials.length > 0 && (
        <ProductSection title="Materiales" icon={<Users size={18} />}>
          <div className="flex flex-wrap gap-2">
            {materials.map((m, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg text-sm bg-[var(--bg2)] text-[var(--ink)] border border-[var(--border)]">{m}</span>
            ))}
          </div>
        </ProductSection>
      )}

      {/* DUA */}
      {dua.length > 0 && (
        <ProductSection title="Estrategias DUA" icon={<BookOpen size={18} />}>
          <div className="space-y-3">
            {dua.map((item, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                <p className="text-sm font-semibold text-[var(--ink)] mb-1">{item.principle || item.estrategia || `Estrategia ${i + 1}`}</p>
                {(item.strategies || item.accommodations) && (
                  <ul className="space-y-1">
                    {(item.strategies || item.accommodations || []).map((s, j) => (
                      <li key={j} className="text-xs text-[var(--muted)] flex items-start gap-1.5">
                        <span className="text-[var(--primary)] mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </ProductSection>
      )}

      {/* Evaluation */}
      {evaluationMethod && (
        <ProductSection title="Evaluación" icon={<CheckCircle2 size={18} />}>
          <p className="text-sm text-[var(--ink)] whitespace-pre-wrap">{evaluationMethod}</p>
        </ProductSection>
      )}

      {/* Action bar */}
      <div className="print:hidden" id={`product-${product.metadata.title?.replace(/\s+/g, '-')}`}>
        <ProductActionBar product={product} />
      </div>
    </div>
  );
}
