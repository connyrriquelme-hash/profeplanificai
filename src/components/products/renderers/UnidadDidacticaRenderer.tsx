/**
 * UnidadDidacticaRenderer — Premium renderer for teaching units.
 *
 * Renders unidad didactica data as a syllabus-style view with
 * grouped phases, class cards, methodology badges, and timeline.
 */

import { useState } from 'react';
import { BookOpen, Clock, ChevronDown, Layers, Target } from 'lucide-react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { ProductActionBar } from '../ProductActionBar';
import type { PedagogicalProduct } from '../types';

interface UDPhase {
  order?: number;
  nombre?: string;
  name?: string;
  description?: string;
  clases?: number[];
  classes?: number[];
}

interface UDClass {
  numero?: number;
  number?: number;
  tema?: string;
  theme?: string;
  faseAsociada?: string;
  phase?: string;
  duracion?: string;
  duration?: string;
  objetivo?: string;
  objective?: string;
  actividades?: string[];
  activities?: string[];
  materiales?: string[];
  materials?: string[];
  evaluacion?: string;
  assessment?: string;
}

interface UnidadData {
  titulo?: string;
  title?: string;
  nivel?: string;
  level?: string;
  asignatura?: string;
  subject?: string;
  metodologiaActiva?: string;
  methodology?: string;
  oa?: string[];
  objectives?: string[];
  fases?: UDPhase[];
  phases?: UDPhase[];
  clases?: UDClass[];
  classes?: UDClass[];
}

const PHASE_DOT_COLORS: Record<string, string> = {
  '06BFAD': 'bg-[#06BFAD]',
  'F2A413': 'bg-[#F2A413]',
  'F24162': 'bg-[#F24162]',
  '7F58A6': 'bg-[#7F58A6]',
};

const PHASE_BG_COLORS: Record<string, string> = {
  '06BFAD': 'border-[#06BFAD]/30 bg-[#06BFAD]/5',
  'F2A413': 'border-[#F2A413]/30 bg-[#F2A413]/5',
  'F24162': 'border-[#F24162]/30 bg-[#F24162]/5',
  '7F58A6': 'border-[#7F58A6]/30 bg-[#7F58A6]/5',
};

function getPhaseColor(index: number): string {
  const colors = ['06BFAD', 'F2A413', 'F24162', '7F58A6'];
  return colors[index % colors.length];
}

interface UnidadDidacticaRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function UnidadDidacticaRenderer({ product, className, style }: UnidadDidacticaRendererProps) {
  const { metadata, data } = product;
  const [expandedClass, setExpandedClass] = useState<number | null>(0);

  const unit = data as UnidadData;
  const phases: UDPhase[] = (unit.fases || unit.phases || []) as UDPhase[];
  const classes: UDClass[] = (unit.clases || unit.classes || []) as UDClass[];
  const methodology = unit.metodologiaActiva || unit.methodology || '';
  const oaList: string[] = (unit.oa || unit.objectives || []) as string[];

  return (
    <div
      className={`unidad-didactica-renderer w-full space-y-6 p-4 md:p-6 lg:p-8 print:m-0 print:max-w-none print:p-0 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={unit.titulo || unit.title || metadata.title}
        subtitle={unit.nivel || unit.level ? `${unit.nivel || unit.level} — ${unit.asignatura || unit.subject || ''}` : metadata.subtitle}
        level={unit.nivel || unit.level || metadata.level}
        subject={unit.asignatura || unit.subject || metadata.subject}
        oaCode={metadata.oaCode}
        oaText={metadata.oaText}
        topic={metadata.topic}
        date={metadata.date}
        teacherName={metadata.teacherName}
        estimatedTime={metadata.estimatedTime}
        className="mb-6"
      />

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        {methodology && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--primary-tint)] text-[var(--primary-ink)]">
            <Layers size={14} /> {methodology}
          </span>
        )}
        {classes.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            <BookOpen size={14} /> {classes.length} clase{classes.length !== 1 ? 's' : ''}
          </span>
        )}
        {phases.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
            <Target size={14} /> {phases.length} fase{phases.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* OA list */}
      {oaList.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Objetivos de Aprendizaje</p>
          <div className="flex flex-wrap gap-1.5">
            {oaList.map((oa, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[var(--primary-tint)] text-[var(--primary-ink)]">{oa}</span>
            ))}
          </div>
        </div>
      )}

      {/* Phases */}
      {phases.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider">Fases</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {phases.map((phase, i) => {
              const color = getPhaseColor(i);
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${PHASE_BG_COLORS[color] || 'border-[var(--border)] bg-white'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${PHASE_DOT_COLORS[color] || 'bg-gray-400'}`} />
                    <p className="text-sm font-bold text-[var(--ink)]">{phase.nombre || phase.name || `Fase ${i + 1}`}</p>
                  </div>
                  {phase.description && (
                    <p className="text-xs text-[var(--muted)] leading-relaxed">{phase.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Classes Timeline */}
      {classes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider">Secuencia de Clases</h3>
          <div className="relative pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-[var(--border)]" />

            {classes.map((cls, i) => {
              const num = cls.numero ?? cls.number ?? i + 1;
              const tema = cls.tema || cls.theme || `Clase ${num}`;
              const fase = cls.faseAsociada || cls.phase || '';
              const phaseIndex = phases.findIndex(p => (p.nombre || p.name) === fase);
              const dotColor = phaseIndex >= 0 ? getPhaseColor(phaseIndex) : 'B5471F';
              const isExpanded = expandedClass === i;

              return (
                <div key={i} className="relative mb-4 last:mb-0">
                  <div className={`absolute -left-5 top-3 w-6 h-6 rounded-full ${PHASE_DOT_COLORS[dotColor] || 'bg-[var(--primary)]'} text-white text-xs font-bold flex items-center justify-center z-10 shadow-sm`}>
                    {num}
                  </div>

                  <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedClass(isExpanded ? null : i)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg)] transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--ink)] truncate">{tema}</p>
                        {fase && (
                          <span className="text-[11px] font-medium text-[var(--muted)]">{fase}</span>
                        )}
                      </div>
                      {cls.duracion && (
                        <span className="text-[11px] font-medium text-[var(--muted)] bg-[var(--bg2)] px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1">
                          <Clock size={10} /> {cls.duracion}
                        </span>
                      )}
                      <ChevronDown size={16} className={`text-[var(--muted)] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)] pt-3">
                        {cls.objetivo && (
                          <p className="text-sm text-[var(--ink)]">{cls.objetivo}</p>
                        )}
                        {(cls.actividades || cls.activities || []).length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Actividades</p>
                            <ul className="space-y-1">
                              {(cls.actividades || cls.activities || []).map((a, j) => (
                                <li key={j} className="text-xs text-[var(--ink)] flex items-start gap-1.5">
                                  <span className="text-[var(--primary)] mt-0.5">•</span> {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {cls.evaluacion && (
                          <p className="text-xs text-[var(--muted)]"><span className="font-semibold">Evaluación:</span> {cls.evaluacion}</p>
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

      {/* Action bar */}
      <div className="print:hidden">
        <ProductActionBar product={product} />
      </div>
    </div>
  );
}
