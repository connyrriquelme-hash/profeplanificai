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
    <header className={`product-header bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm ${className || ''}`} style={style}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 text-base">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {level && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
              {level}
            </span>
          )}
          {subject && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
              {subject}
            </span>
          )}
          {date && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
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
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Docente: {teacherName}
            </span>
          )}
        </div>
      </div>
      {(oaCode || oaText || topic) && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          {oaCode && (
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 rounded flex-shrink-0">
                {oaCode}
              </span>
              <span className="text-gray-700 text-sm flex-1">{oaText}</span>
            </div>
          )}
          {topic && !oaCode && (
            <p className="text-gray-700 text-sm"><span className="font-semibold">Tema:</span> {topic}</p>
          )}
        </div>
      )}
    </header>
  );
}