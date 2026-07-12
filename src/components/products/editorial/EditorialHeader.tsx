/**
 * Editorial Header Component
 *
 * Full editorial header for classroom-ready products.
 * Shows platform branding, product title, establishment, course, subject, OA, date, and metadata.
 */

import React from 'react';

interface EditorialHeaderProps {
  title: string;
  subtitle?: string;
  platformName?: string;
  establishmentName?: string;
  course?: string;
  subject?: string;
  oaCode?: string;
  oaText?: string;
  topic?: string;
  date?: string;
  teacherName?: string;
  estimatedTime?: number;
  pageNumber?: number;
  version?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function EditorialHeader({
  title,
  subtitle,
  platformName = 'PlanificaIA Chile',
  establishmentName,
  course,
  subject,
  oaCode,
  oaText,
  topic,
  date,
  teacherName,
  estimatedTime,
  pageNumber,
  version,
  className,
  style,
}: EditorialHeaderProps) {
  return (
    <header
      className={`editorial-header bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className || ''}`}
      style={style}
    >
      {/* Brand bar */}
      <div className="bg-indigo-600 px-4 md:px-6 py-2 flex items-center justify-between print:bg-indigo-600">
        <span className="text-white text-xs font-semibold tracking-wide uppercase">
          {platformName}
        </span>
        <div className="flex items-center gap-3">
          {version && (
            <span className="text-indigo-200 text-xs">v{version}</span>
          )}
          {pageNumber !== undefined && (
            <span className="text-indigo-200 text-xs">Página {pageNumber}</span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 md:px-6 py-4 md:py-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-500 text-base font-medium">{subtitle}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 flex-shrink-0">
            {subject && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                {subject}
              </span>
            )}
            {course && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                {course}
              </span>
            )}
            {estimatedTime && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {estimatedTime} min
              </span>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
          {establishmentName && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {establishmentName}
            </span>
          )}
          {teacherName && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {teacherName}
            </span>
          )}
          {date && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {date}
            </span>
          )}
        </div>

        {/* OA row */}
        {(oaCode || oaText || topic) && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            {oaCode && (
              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-100 flex-shrink-0">
                  {oaCode}
                </span>
                {oaText && (
                  <span className="text-gray-700 text-sm leading-relaxed">{oaText}</span>
                )}
              </div>
            )}
            {topic && !oaCode && (
              <p className="text-gray-700 text-sm">
                <span className="font-semibold">Tema:</span> {topic}
              </p>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
