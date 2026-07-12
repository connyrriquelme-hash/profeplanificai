/**
 * Response Area Component
 *
 * A labeled space for student responses — lines, text area, or numbered blank lines.
 */

import React from 'react';

interface ResponseAreaProps {
  label?: string;
  instruction?: string;
  lines?: number;
  variant?: 'lines' | 'textarea' | 'boxed';
  placeholder?: string;
  editable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ResponseArea({
  label,
  instruction,
  lines = 4,
  variant = 'lines',
  placeholder = 'Escribe tu respuesta aquí...',
  editable = true,
  className,
  style,
}: ResponseAreaProps) {
  return (
    <div
      className={`response-area ${className || ''}`}
      style={style}
    >
      {(label || instruction) && (
        <div className="mb-2">
          {label && (
            <label className="block text-sm font-semibold text-gray-700 mb-0.5">
              {label}
            </label>
          )}
          {instruction && (
            <p className="text-xs text-gray-500">{instruction}</p>
          )}
        </div>
      )}

      {variant === 'textarea' && (
        <textarea
          rows={lines}
          placeholder={placeholder}
          disabled={!editable}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-y min-h-[80px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
          aria-label={label || 'Espacio de respuesta'}
        />
      )}

      {variant === 'lines' && (
        <div
          className={`border border-gray-300 rounded-lg p-3 ${!editable ? 'bg-gray-50' : 'bg-white'}`}
          role="group"
          aria-label={label || 'Espacio de respuesta'}
        >
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className="border-b border-gray-200 h-7 last:border-b-0"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {variant === 'boxed' && (
        <div
          className={`border-2 border-dashed border-gray-300 rounded-lg p-4 ${!editable ? 'bg-gray-50' : 'bg-white'}`}
          style={{ minHeight: lines * 28 }}
          role="group"
          aria-label={label || 'Espacio de respuesta'}
        >
          <div className="text-gray-400 text-sm italic text-center">
            {placeholder}
          </div>
        </div>
      )}
    </div>
  );
}
