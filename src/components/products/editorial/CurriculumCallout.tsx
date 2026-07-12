/**
 * Curriculum Callout Component
 *
 * Displays curriculum reference information (OA code, text, level, subject, skills) in a styled callout box.
 */

import React from 'react';

interface CurriculumCalloutProps {
  oaCode?: string;
  oaText?: string;
  level?: string;
  subject?: string;
  skills?: string[];
  learningGoal?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CurriculumCallout({
  oaCode,
  oaText,
  level,
  subject,
  skills,
  learningGoal,
  className,
  style,
}: CurriculumCalloutProps) {
  const hasContent = oaCode || oaText || level || subject || (skills && skills.length > 0) || learningGoal;

  if (!hasContent) {
    return null;
  }

  return (
    <div
      className={`curriculum-callout bg-indigo-50 border border-indigo-200 rounded-xl p-4 md:p-5 ${className || ''}`}
      style={style}
      role="complementary"
      aria-label="Referencia curricular"
    >
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide">Referencia Curricular</h3>
      </div>

      <div className="space-y-2">
        {oaCode && (
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-100 text-indigo-800 rounded flex-shrink-0">
              {oaCode}
            </span>
            {oaText && (
              <span className="text-indigo-900 text-sm leading-relaxed">{oaText}</span>
            )}
          </div>
        )}

        {(!oaCode && oaText) && (
          <p className="text-indigo-900 text-sm leading-relaxed">{oaText}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-2">
          {level && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
              {level}
            </span>
          )}
          {subject && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700">
              {subject}
            </span>
          )}
        </div>

        {skills && skills.length > 0 && (
          <div className="mt-2">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Habilidades:</span>
            <ul className="mt-1 space-y-0.5">
              {skills.map((skill, index) => (
                <li key={index} className="text-sm text-indigo-800 flex items-start gap-1.5">
                  <span className="text-indigo-400 mt-1 flex-shrink-0">•</span>
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        )}

        {learningGoal && (
          <div className="mt-2 pt-2 border-t border-indigo-200">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Meta de aprendizaje:</span>
            <p className="text-sm text-indigo-900 mt-1 leading-relaxed">{learningGoal}</p>
          </div>
        )}
      </div>
    </div>
  );
}
