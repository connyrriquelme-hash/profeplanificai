/** Materials Grid Component

Displays materials as a responsive grid of cards.
*/

import React from 'react';

interface MaterialItem {
  name: string;
  quantity: string;
  icon: React.ReactNode;
  safetyNote?: string;
  optional?: boolean;
}

interface MaterialsGridProps {
  materials: MaterialItem[];
  className?: string;
  style?: React.CSSProperties;
}

export function MaterialsGrid({ materials, className, style }: MaterialsGridProps) {
  if (!materials || materials.length === 0) {
    return (
      <p className="text-gray-500 text-sm italic">No hay materiales definidos para esta actividad.</p>
    );
  }

  return (
    <div className={`materials-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${className || ''}`} style={style}>
      {materials.map((material, index) => (
        <article
          key={index}
          className="material-card bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xl"
              aria-hidden="true"
            >
              {material.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{material.name}</h4>
              <p className="text-gray-600 text-sm mt-0.5">
                <span className="font-medium">Cantidad:</span> {material.quantity}
              </p>
              {material.safetyNote && (
                <p className="text-red-700 text-xs mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 11a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zm0 2.25a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs">{material.safetyNote}</span>
                </p>
              )}
              {material.optional && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mt-2">
                  Opcional
                </span>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}