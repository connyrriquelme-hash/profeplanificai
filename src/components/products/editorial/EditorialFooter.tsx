/**
 * Editorial Footer Component
 *
 * Footer with platform branding, version info, page number, and copyright.
 */

import React from 'react';

interface EditorialFooterProps {
  platformName?: string;
  version?: string;
  pageNumber?: number;
  totalPages?: number;
  copyrightText?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function EditorialFooter({
  platformName = 'PlanificaIA Chile',
  version,
  pageNumber,
  totalPages,
  copyrightText,
  className,
  style,
}: EditorialFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`editorial-footer bg-gray-50 border border-gray-200 rounded-lg px-4 md:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 ${className || ''}`}
      style={style}
      role="contentinfo"
    >
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="font-medium">{platformName}</span>
        {version && <span className="text-gray-400">v{version}</span>}
      </div>

      <div className="text-center">
        {copyrightText || (
          <span>© {year} {platformName}. Material educativo generado con IA.</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {pageNumber !== undefined && totalPages !== undefined && (
          <span className="font-medium">Página {pageNumber} de {totalPages}</span>
        )}
        {pageNumber !== undefined && totalPages === undefined && (
          <span className="font-medium">Página {pageNumber}</span>
        )}
        <span className="text-gray-400">Formato A4</span>
      </div>
    </footer>
  );
}
