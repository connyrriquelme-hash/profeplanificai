/**
 * Reflection Box Component
 *
 * Prompts student reflection with optional guided questions and response lines.
 */

import React from 'react';

interface ReflectionPrompt {
  question: string;
  lines?: number;
}

interface ReflectionBoxProps {
  title?: string;
  prompt?: string;
  prompts?: ReflectionPrompt[];
  className?: string;
  style?: React.CSSProperties;
}

export function ReflectionBox({
  title,
  prompt,
  prompts,
  className,
  style,
}: ReflectionBoxProps) {
  const displayTitle = title || 'Reflexión';
  const hasContent = prompt || (prompts && prompts.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <div
      className={`reflection-box bg-amber-50 border border-amber-200 rounded-xl p-4 ${className || ''}`}
      style={style}
      role="article"
      aria-label={displayTitle}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="text-sm font-bold text-amber-800">{displayTitle}</h4>
      </div>

      {prompt && (
        <div className="mb-3">
          <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{prompt}</p>
          <div className="mt-3 border border-amber-300 rounded-lg bg-white p-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="border-b border-amber-100 h-6 last:border-b-0" aria-hidden="true" />
            ))}
          </div>
        </div>
      )}

      {prompts && prompts.length > 0 && (
        <div className="space-y-4">
          {prompts.map((p, index) => (
            <div key={index}>
              <p className="text-sm font-medium text-amber-900 mb-2">
                <span className="text-amber-600 mr-1">{index + 1}.</span>
                {p.question}
              </p>
              <div className="border border-amber-300 rounded-lg bg-white p-3">
                {Array.from({ length: p.lines || 3 }, (_, i) => (
                  <div key={i} className="border-b border-amber-100 h-6 last:border-b-0" aria-hidden="true" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
