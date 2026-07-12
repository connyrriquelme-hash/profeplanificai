/** Self Assessment Component

Displays a checklist for self-assessment with accessible checkboxes.
*/

import React from 'react';

interface SelfAssessmentProps {
  checklist?: string[];
  className?: string;
  style?: React.CSSProperties;
}

export function SelfAssessment({ checklist, className, style }: SelfAssessmentProps) {
  if (!checklist || checklist.length === 0) {
    return (
      <p className="text-gray-500 text-sm italic">Sin lista de autoevaluación definida.</p>
    );
  }

  return (
    <ul className={`self-assessment space-y-2 ${className || ''}`} style={style} role="list" aria-label="Lista de autoevaluación">
      {checklist.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label={`${item}`}
            />
            <span className="text-gray-700 text-sm">{item}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}