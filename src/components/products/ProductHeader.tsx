/** Product Header Component

Displays the main header with title, subtitle, and metadata.
*/

import React from 'react';

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
}: ProductHeaderProps) {
  return (
    <header className={`product-header overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-md print:shadow-none ${className || ''}`} style={style}>
      <div className="h-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-honey)] print:hidden" />
      <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center rounded-full bg-[var(--primary-tint)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--primary-ink)] print:bg-transparent print:px-0">
            ProfePlanificAI
          </span>
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
