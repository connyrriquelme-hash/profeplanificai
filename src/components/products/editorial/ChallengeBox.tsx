/**
 * Challenge Box Component
 *
 * Displays a challenge or extension activity for advanced students.
 */

import React from 'react';

interface ChallengeBoxProps {
  title?: string;
  challenge: string;
  hints?: string[];
  variant?: 'challenge' | 'extension' | 'desafio';
  className?: string;
  style?: React.CSSProperties;
}

const variantConfig: Record<string, { bg: string; border: string; accent: string; icon: React.ReactNode }> = {
  challenge: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    accent: 'text-amber-800',
    icon: (
      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  extension: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    accent: 'text-purple-800',
    icon: (
      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  desafio: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    accent: 'text-red-800',
    icon: (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
  },
};

export function ChallengeBox({
  title,
  challenge,
  hints,
  variant = 'challenge',
  className,
  style,
}: ChallengeBoxProps) {
  const config = variantConfig[variant] || variantConfig.challenge;
  const displayTitle = title || (variant === 'extension' ? 'Extensión' : variant === 'desafio' ? 'Desafío' : 'Desafío');

  return (
    <div
      className={`challenge-box ${config.bg} border ${config.border} rounded-xl p-4 ${className || ''}`}
      style={style}
      role="article"
      aria-label={displayTitle}
    >
      <div className="flex items-center gap-2 mb-3">
        <span aria-hidden="true">{config.icon}</span>
        <h4 className={`text-sm font-bold ${config.accent}`}>{displayTitle}</h4>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
        {challenge}
      </p>

      {hints && hints.length > 0 && (
        <details className="group">
          <summary className={`text-xs font-semibold ${config.accent} cursor-pointer select-none flex items-center gap-1`}>
            <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Pistas ({hints.length})
          </summary>
          <ul className="mt-2 space-y-1 pl-4">
            {hints.map((hint, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-1.5">
                <span className="text-gray-400 mt-1 flex-shrink-0">💡</span>
                {hint}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
