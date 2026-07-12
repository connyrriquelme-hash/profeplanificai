/**
 * Instruction Callout Component
 *
 * Highlights instructions for the student or teacher with an icon and optional urgency level.
 */

import React from 'react';

interface InstructionCalloutProps {
  title?: string;
  instruction: string;
  variant?: 'info' | 'warning' | 'tip' | 'important';
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: (
      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  tip: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  important: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function InstructionCallout({
  title,
  instruction,
  variant = 'info',
  icon,
  className,
  style,
}: InstructionCalloutProps) {
  const v = variantStyles[variant] || variantStyles.info;

  return (
    <div
      className={`instruction-callout ${v.bg} border ${v.border} rounded-xl p-4 ${className || ''}`}
      style={style}
      role="note"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
          {icon || v.icon}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-bold ${v.text} uppercase tracking-wide mb-1`}>
              {title}
            </h4>
          )}
          <p className={`text-sm ${v.text} leading-relaxed whitespace-pre-wrap`}>
            {instruction}
          </p>
        </div>
      </div>
    </div>
  );
}
