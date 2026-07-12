/**
 * Student Info Fields Component
 *
 * Displays student information fields (name, course, date, signature) in a printable row.
 * All fields are optional with clean fallbacks.
 */

import React from 'react';

interface StudentInfoFieldsProps {
  studentName?: string;
  course?: string;
  date?: string;
  showSignature?: boolean;
  editable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function StudentInfoFields({
  studentName,
  course,
  date,
  showSignature = false,
  editable = false,
  className,
  style,
}: StudentInfoFieldsProps) {
  return (
    <div
      className={`student-info-fields bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 ${className || ''}`}
      style={style}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Estudiante
          </label>
          {editable ? (
            <input
              type="text"
              defaultValue={studentName || ''}
              placeholder="Nombre completo"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              aria-label="Nombre del estudiante"
            />
          ) : (
            <p className="text-sm text-gray-800 min-h-[1.5rem]">
              {studentName || <span className="text-gray-400 italic">—</span>}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Curso
          </label>
          {editable ? (
            <input
              type="text"
              defaultValue={course || ''}
              placeholder="Ej: 4° Básico"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              aria-label="Curso"
            />
          ) : (
            <p className="text-sm text-gray-800 min-h-[1.5rem]">
              {course || <span className="text-gray-400 italic">—</span>}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Fecha
          </label>
          {editable ? (
            <input
              type="date"
              defaultValue={date || ''}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              aria-label="Fecha"
            />
          ) : (
            <p className="text-sm text-gray-800 min-h-[1.5rem]">
              {date || <span className="text-gray-400 italic">—</span>}
            </p>
          )}
        </div>
      </div>

      {showSignature && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Firma del estudiante
              </label>
              <div className="border-b border-gray-300 h-8" aria-label="Espacio para firma del estudiante" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Firma del docente
              </label>
              <div className="border-b border-gray-300 h-8" aria-label="Espacio para firma del docente" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
