/** Print Toolbar Component

Toolbar for printing and resetting the notebook view.
*/

import React from 'react';

interface PrintToolbarProps {
  onPrint?: () => void;
  onReset?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function PrintToolbar({ onPrint, onReset, className, style }: PrintToolbarProps) {
  return (
    <div 
      className={`print-toolbar flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 print:hidden ${className || ''}`} 
      style={style}
      role="toolbar"
      aria-label="Herramientas de impresión"
    >
      <button
        type="button"
        onClick={onPrint}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        aria-label="Imprimir bitácora"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2h6m-6-4h.01M17 7h-6M9 7H3" />
        </svg>
        Imprimir
      </button>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        aria-label="Restablecer edición"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Restablecer
      </button>

      <div className="flex-1" aria-hidden="true" />

      <div className="text-xs text-gray-500 flex items-center gap-2">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2H7a2 2 0 01-2-2z" />
        </svg>
        <span>Formato A4 • Márgenes 12mm</span>
      </div>
    </div>
  );
}