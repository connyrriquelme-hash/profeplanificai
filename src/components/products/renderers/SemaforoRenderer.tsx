/**
 * SemaforoRenderer — Premium renderer for traffic-light evaluations.
 *
 * Renders evaluation results as a 3-column traffic light table
 * with color-coded indicators (green/yellow/red).
 */

import { ProductHeader } from '../ProductHeader';
import { useCoverImage } from '../useCoverImage';
import { ProductActionBar } from '../ProductActionBar';
import type { PedagogicalProduct } from '../types';

interface SemaforoIndicator {
  indicator?: string;
  indicador?: string;
  description?: string;
  nivel?: string;
  level?: string;
  status?: string;
  percentage?: number;
  students?: string[];
}

interface SemaforoData {
  indicators?: SemaforoIndicator[];
  indicadores?: SemaforoIndicator[];
  green?: string[];
  yellow?: string[];
  red?: string[];
  verde?: string[];
  amarillo?: string[];
  rojo?: string[];
  categories?: Array<{
    name?: string;
    nombre?: string;
    green?: string[];
    yellow?: string[];
    red?: string[];
    verde?: string[];
    amarillo?: string[];
    rojo?: string[];
  }>;
}

const COLUMN_CONFIG = [
  { key: 'green', altKey: 'verde', label: 'Logrado', color: '#06BFAD', bg: 'bg-[#06BFAD]/8', border: 'border-[#06BFAD]/20', text: 'text-[#04856A]', dot: 'bg-[#06BFAD]' },
  { key: 'yellow', altKey: 'amarillo', label: 'En Proceso', color: '#F2A413', bg: 'bg-[#F2A413]/8', border: 'border-[#F2A413]/20', text: 'text-[#9A6A00]', dot: 'bg-[#F2A413]' },
  { key: 'red', altKey: 'rojo', label: 'Requiere Apoyo', color: '#F24162', bg: 'bg-[#F24162]/8', border: 'border-[#F24162]/20', text: 'text-[#B91842]', dot: 'bg-[#F24162]' },
] as const;

interface SemaforoRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
  onProductChange?: (updated: PedagogicalProduct) => void;
}

export function SemaforoRenderer({ product, className, style, onProductChange }: SemaforoRendererProps) {
  const cover = useCoverImage(product, onProductChange);
  const { metadata, data } = product;
  const sem = data as SemaforoData;

  // Flat indicators (no categories)
  const hasFlat = (sem.green || sem.verde || sem.yellow || sem.amarillo || sem.red || sem.rojo) && (!sem.categories || sem.categories.length === 0);
  // Categorized
  const categories = sem.categories || [];

  return (
    <div
      className={`semaforo-renderer w-full space-y-6 p-4 md:p-6 lg:p-8 print:m-0 print:max-w-none print:p-0 ${className || ''}`}
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
        coverImageUrl={cover.coverImageUrl}
        onGenerateCoverImage={cover.canGenerate ? cover.generate : undefined}
        isGeneratingCoverImage={cover.isGenerating}
        coverImageError={cover.error}
      />

      {/* Flat mode */}
      {hasFlat && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMN_CONFIG.map(col => {
            const items: string[] = (sem[col.key as keyof SemaforoData] as string[] || sem[col.altKey as keyof SemaforoData] as string[] || []) as string[];
            return (
              <div key={col.key} className={`rounded-xl border ${col.border} ${col.bg} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${col.dot}`} />
                  <h3 className={`text-sm font-bold ${col.text}`}>{col.label}</h3>
                  <span className={`ml-auto text-xs font-bold ${col.text} bg-white/60 px-2 py-0.5 rounded-full`}>
                    {items.length}
                  </span>
                </div>
                {items.length > 0 ? (
                  <ul className="space-y-1.5">
                    {items.map((item, i) => (
                      <li key={i} className="text-sm text-[var(--ink)] bg-white/60 rounded-lg px-3 py-2 border border-white/40">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--muted)] italic">Sin elementos</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Categorized mode */}
      {categories.length > 0 && (
        <div className="space-y-6">
          {categories.map((cat, ci) => (
            <div key={ci}>
              <h3 className="text-sm font-bold text-[var(--ink)] mb-3 uppercase tracking-wider">
                {cat.nombre || cat.name || `Categoría ${ci + 1}`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {COLUMN_CONFIG.map(col => {
                  const items: string[] = (cat[col.key as keyof typeof cat] || cat[col.altKey as keyof typeof cat] || []) as string[];
                  return (
                    <div key={col.key} className={`rounded-xl border ${col.border} ${col.bg} p-4`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-3 h-3 rounded-full ${col.dot}`} />
                        <h4 className={`text-sm font-bold ${col.text}`}>{col.label}</h4>
                        <span className={`ml-auto text-xs font-bold ${col.text} bg-white/60 px-2 py-0.5 rounded-full`}>
                          {items.length}
                        </span>
                      </div>
                      {items.length > 0 ? (
                        <ul className="space-y-1.5">
                          {items.map((item, i) => (
                            <li key={i} className="text-sm text-[var(--ink)] bg-white/60 rounded-lg px-3 py-2 border border-white/40">
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[var(--muted)] italic">Sin elementos</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indicators list (structured format) */}
      {(!hasFlat && categories.length === 0) && (sem.indicators || sem.indicadores) && (
        <div className="space-y-3">
          {(sem.indicators || sem.indicadores || []).map((ind, i) => {
            const nivel = (ind.nivel || ind.level || ind.status || '').toLowerCase();
            const isGreen = nivel.includes('verde') || nivel.includes('green') || nivel.includes('logrado') || nivel.includes('avanzado');
            const isRed = nivel.includes('rojo') || nivel.includes('red') || nivel.includes('requiere') || nivel.includes('inicial');
            const col = isRed ? COLUMN_CONFIG[2] : isGreen ? COLUMN_CONFIG[0] : COLUMN_CONFIG[1];

            return (
              <div key={i} className={`flex items-start gap-3 rounded-xl border ${col.border} ${col.bg} p-4`}>
                <div className={`w-3 h-3 rounded-full ${col.dot} mt-0.5 flex-shrink-0`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--ink)]">{ind.indicator || ind.indicador || `Indicador ${i + 1}`}</p>
                  {ind.description && <p className="text-xs text-[var(--muted)] mt-0.5">{ind.description}</p>}
                  {ind.students && ind.students.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ind.students.map((s, j) => (
                        <span key={j} className="text-[11px] px-2 py-0.5 rounded-full bg-white/60 text-[var(--ink)] border border-white/40">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                {ind.percentage != null && (
                  <span className={`text-sm font-bold ${col.text}`}>{ind.percentage}%</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action bar */}
      <div className="print:hidden">
        <ProductActionBar product={product} />
      </div>
    </div>
  );
}
