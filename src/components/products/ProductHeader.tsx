/** Product Header Component

Displays the main header with title, subtitle, and metadata.
*/

import React from 'react';
import { ImagePlus, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ProductHeaderProps {
  title: string;
  subtitle?: string;
  level?: string;
  subject?: string;
  oaCode?: string;
  oaText?: string;
  topic?: string;
  date?: string;
  teacherName?: string;
  estimatedTime?: number;
  className?: string;
  style?: React.CSSProperties;
  coverImageUrl?: string;
  onGenerateCoverImage?: () => void;
  isGeneratingCoverImage?: boolean;
  coverImageError?: string | null;
}

export function ProductHeader({
  title,
  subtitle,
  level,
  subject,
  oaCode,
  oaText,
  topic,
  date,
  teacherName,
  estimatedTime,
  className,
  style,
  coverImageUrl,
  onGenerateCoverImage,
  isGeneratingCoverImage,
  coverImageError,
}: ProductHeaderProps) {
  const { user } = useAuth();
  const branding = user?.institutionBranding;
  const brandColor = branding?.primaryColor || undefined;

  return (
    <header className={`product-header overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-md print:shadow-none ${className || ''}`} style={style}>
      <div
        className={`h-1.5 print:hidden ${brandColor ? '' : 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent-honey)]'}`}
        style={brandColor ? { background: brandColor } : undefined}
      />
      {coverImageUrl && (
        <div className="relative">
          <img src={coverImageUrl} alt="" className="w-full h-40 md:h-52 object-cover" />
          {onGenerateCoverImage && (
            <button
              type="button"
              onClick={onGenerateCoverImage}
              disabled={isGeneratingCoverImage}
              title="Generar otra imagen"
              className="print:hidden absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white/90 backdrop-blur text-[var(--ink)] shadow-sm hover:bg-white transition-colors disabled:opacity-60"
            >
              {isGeneratingCoverImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Regenerar
            </button>
          )}
        </div>
      )}
      {!coverImageUrl && onGenerateCoverImage && (
        <div className="print:hidden px-4 md:px-6 pt-4">
          <button
            type="button"
            onClick={onGenerateCoverImage}
            disabled={isGeneratingCoverImage}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--ink-mid)] bg-[var(--surface-soft)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary-ink)] border border-dashed border-[var(--border)] hover:border-[var(--primary)] transition-colors disabled:opacity-60"
          >
            {isGeneratingCoverImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            {isGeneratingCoverImage ? 'Generando ilustración…' : 'Generar ilustración con IA'}
          </button>
          {coverImageError && <p className="text-[11px] text-red-600 mt-1.5">{coverImageError}</p>}
        </div>
      )}
      <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo del colegio" className="h-8 max-w-[160px] object-contain object-left" />
          ) : (
            <span
              className="inline-flex items-center rounded-full bg-[var(--primary-tint)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--primary-ink)] print:bg-transparent print:px-0"
              style={brandColor ? { background: `${brandColor}1a`, color: brandColor } : undefined}
            >
              ProfePlanificAI
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--ink)] tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-[var(--ink-soft)] text-base">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {level && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {level}
            </span>
          )}
          {subject && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              {subject}
            </span>
          )}
          {date && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg2)] text-[var(--ink-soft)]">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {date}
            </span>
          )}
          {estimatedTime && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {estimatedTime} min
            </span>
          )}
          {teacherName && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg2)] text-[var(--ink-soft)]">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Docente: {teacherName}
            </span>
          )}
        </div>
      </div>
      {(oaCode || oaText || topic) && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
          {oaCode && (
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-[var(--primary-tint)] text-[var(--primary-ink)] rounded flex-shrink-0">
                {oaCode}
              </span>
              <span className="text-[var(--ink-soft)] text-sm flex-1">{oaText}</span>
            </div>
          )}
          {topic && !oaCode && (
            <p className="text-[var(--ink-soft)] text-sm"><span className="font-semibold">Tema:</span> {topic}</p>
          )}
        </div>
      )}
      </div>
    </header>
  );
}
