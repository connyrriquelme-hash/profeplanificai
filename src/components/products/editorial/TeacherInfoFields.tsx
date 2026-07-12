/**
 * Teacher Info Fields Component
 *
 * Displays teacher and institutional information fields in a printable row.
 * All fields are optional with clean fallbacks.
 */

import React from 'react';

interface TeacherInfoFieldsProps {
  teacherName?: string;
  establishmentName?: string;
  subject?: string;
  grade?: string;
  editable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function TeacherInfoFields({
  teacherName,
  establishmentName,
  subject,
  grade,
  editable = false,
  className,
  style,
}: TeacherInfoFieldsProps) {
  return (
    <div
      className={`teacher-info-fields bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 ${className || ''}`}
      style={style}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Docente
          </label>
          {editable ? (
            <input
              type="text"
              defaultValue={teacherName || ''}
              placeholder="Nombre del docente"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              aria-label="Nombre del docente"
            />
          ) : (
            <p className="text-sm text-gray-800 min-h-[1.5rem]">
              {teacherName || <span className="text-gray-400 italic">—</span>}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Establecimiento
          </label>
          {editable ? (
            <input
              type="text"
              defaultValue={establishmentName || ''}
              placeholder="Nombre del establecimiento"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              aria-label="Nombre del establecimiento"
            />
          ) : (
            <p className="text-sm text-gray-800 min-h-[1.5rem]">
              {establishmentName || <span className="text-gray-400 italic">—</span>}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Asignatura
          </label>
          {editable ? (
            <input
              type="text"
              defaultValue={subject || ''}
              placeholder="Ej: Ciencias Naturales"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              aria-label="Asignatura"
            />
          ) : (
            <p className="text-sm text-gray-800 min-h-[1.5rem]">
              {subject || <span className="text-gray-400 italic">—</span>}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Grado / Nivel
          </label>
          {editable ? (
            <input
              type="text"
              defaultValue={grade || ''}
              placeholder="Ej: 6° Básico"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              aria-label="Grado o nivel"
            />
          ) : (
            <p className="text-sm text-gray-800 min-h-[1.5rem]">
              {grade || <span className="text-gray-400 italic">—</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
