/**
 * Vocabulary Box Component
 *
 * Displays key vocabulary terms with definitions in a styled card layout.
 */

import React from 'react';

interface VocabularyTerm {
  term: string;
  definition: string;
}

interface VocabularyBoxProps {
  title?: string;
  terms?: VocabularyTerm[];
  simpleTerms?: string[];
  className?: string;
  style?: React.CSSProperties;
}

export function VocabularyBox({
  title,
  terms,
  simpleTerms,
  className,
  style,
}: VocabularyBoxProps) {
  const displayTitle = title || 'Vocabulario clave';

  const allTerms: VocabularyTerm[] = terms && terms.length > 0
    ? terms
    : simpleTerms && simpleTerms.length > 0
      ? simpleTerms.map(t => ({ term: t, definition: '' }))
      : [];

  if (allTerms.length === 0) {
    return null;
  }

  return (
    <div
      className={`vocabulary-box bg-teal-50 border border-teal-200 rounded-xl p-4 ${className || ''}`}
      style={style}
      role="complementary"
      aria-label={displayTitle}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h4 className="text-sm font-bold text-teal-800">{displayTitle}</h4>
      </div>

      <dl className="space-y-2">
        {allTerms.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-teal-100 p-3"
          >
            <dt className="text-sm font-bold text-teal-800">{item.term}</dt>
            {item.definition && (
              <dd className="text-sm text-gray-700 mt-1 leading-relaxed">
                {item.definition}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}
