/** Teacher Feedback Box Component

A textarea for teacher feedback with accessible label.
*/

import React, { useState } from 'react';

interface TeacherFeedbackBoxProps {
  feedback?: string;
  className?: string;
  style?: React.CSSProperties;
  onChange?: (feedback: string) => void;
}

export function TeacherFeedbackBox({ feedback = '', className, style, onChange }: TeacherFeedbackBoxProps) {
  const [localFeedback, setLocalFeedback] = useState(feedback);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalFeedback(value);
    onChange?.(value);
  };

  return (
    <div className={`teacher-feedback-box ${className || ''}`} style={style}>
      <label htmlFor="teacher-feedback" className="block text-sm font-medium text-gray-700 mb-2">
        Retroalimentación docente
      </label>
      <textarea
        id="teacher-feedback"
        value={localFeedback}
        onChange={handleChange}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 placeholder-gray-400 resize-y min-h-[80px]"
        placeholder="Escribe tu retroalimentación para el estudiante..."
        aria-describedby="teacher-feedback-help"
      />
      <p id="teacher-feedback-help" className="mt-1 text-xs text-gray-500">
        Esta retroalimentación es visible para el estudiante y se guarda localmente.
      </p>
    </div>
  );
}