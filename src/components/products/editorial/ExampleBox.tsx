/**
 * Example Box Component
 *
 * Displays an example with title, description, and optional step-by-step breakdown.
 */

import React from 'react';

interface ExampleStep {
  label?: string;
  content: string;
}

interface ExampleBoxProps {
  title?: string;
  description?: string;
  steps?: ExampleStep[];
  exampleText?: string;
  variant?: 'default' | 'worked' | 'guided';
  className?: string;
  style?: React.CSSProperties;
}

const variantConfig: Record<string, { bg: string; border: string; accent: string; label: string }> = {
  default: { bg: 'bg-teal-50', border: 'border-teal-200', accent: 'text-teal-700', label: 'Ejemplo' },
  worked: { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-700', label: 'Ejemplo resuelto' },
  guided: { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-700', label: 'Ejemplo guiado' },
};

export function ExampleBox({
  title,
  description,
  steps,
  exampleText,
  variant = 'default',
  className,
  style,
}: ExampleBoxProps) {
  const config = variantConfig[variant] || variantConfig.default;
  const displayTitle = title || config.label;

  return (
    <div
      className={`example-box ${config.bg} border ${config.border} rounded-xl p-4 ${className || ''}`}
      style={style}
      role="article"
      aria-label={displayTitle}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg className={`w-5 h-5 ${config.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h4 className={`text-sm font-bold ${config.accent}`}>{displayTitle}</h4>
      </div>

      {description && (
        <p className="text-sm text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap">{description}</p>
      )}

      {exampleText && (
        <div className="bg-white rounded-lg p-3 border border-gray-100 mb-3">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{exampleText}</p>
        </div>
      )}

      {steps && steps.length > 0 && (
        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className={`flex-shrink-0 w-5 h-5 rounded-full ${config.bg} ${config.accent} text-xs font-bold flex items-center justify-center border ${config.border}`}>
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                {step.label && (
                  <span className={`text-xs font-semibold ${config.accent} uppercase tracking-wide`}>
                    {step.label}
                  </span>
                )}
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{step.content}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
