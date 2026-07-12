/** Editable Table Component

An accessible table component with editable cells.
*/

import React, { useState } from 'react';

interface EditableTableProps {
  title?: string;
  headers: string[];
  rows: string[][];
  editable?: boolean;
  studentFillable?: boolean;
  onCellChange?: (rowIndex: number, colIndex: number, value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function EditableTable({ 
  title, 
  headers, 
  rows, 
  editable = false, 
  studentFillable = false,
  onCellChange,
  className, 
  style 
}: EditableTableProps) {
  const [localRows, setLocalRows] = useState<string[][]>(rows.map(r => r.map(c => c ?? '')));
  const [editCell, setEditCell] = useState<{ row: number; col: number } | null>(null);
  const [cellValue, setCellValue] = useState<string>('');

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...localRows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = value;
    setLocalRows(newRows);
    onCellChange?.(rowIndex, colIndex, value);
  };

  const handleDoubleClick = (rowIndex: number, colIndex: number, value: string) => {
    if (editable && studentFillable) {
      setEditCell({ row: rowIndex, col: colIndex });
      setCellValue(value ?? '');
    }
  };

  const handleBlur = (rowIndex: number, colIndex: number) => {
    if (editCell?.row === rowIndex && editCell?.col === colIndex) {
      onCellChange?.(rowIndex, colIndex, cellValue);
      setEditCell(null);
      setCellValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setCellValue('');
      setEditCell(null);
    }
  };

  const isEditable = editable && studentFillable;

  if (!headers || headers.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic py-4">
        No hay tabla de datos definida.
      </div>
    );
  }

  return (
    <div className={`editable-table-container ${className || ''}`} style={style}>
      {title && (
        <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max" role="grid" aria-label={title || 'Tabla de datos'}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {headers.map((header, colIndex) => (
                <th
                  key={colIndex}
                  scope="col"
                  className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-100"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {localRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-3 py-2 text-sm text-gray-700 border-r border-gray-100 align-top"
                  >
                    {editCell?.row === rowIndex && editCell?.col === colIndex ? (
                      <input
                        type="text"
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => handleBlur(rowIndex, colIndex)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        autoFocus
                        className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        aria-label={`Editar celda ${colIndex + 1}, fila ${rowIndex + 1}`}
                      />
                    ) : (
                      <div
                        onDoubleClick={() => handleDoubleClick(rowIndex, colIndex, localRows[rowIndex][colIndex])}
                        onKeyDown={(e) => e.key === 'Enter' && handleDoubleClick(rowIndex, colIndex, localRows[rowIndex][colIndex])}
                        className={`min-h-[1.5rem] whitespace-pre-wrap break-words ${editable && studentFillable ? 'cursor-pointer hover:bg-indigo-50' : ''}`}
                        tabIndex={editable && studentFillable ? 0 : -1}
                        role={editable && studentFillable ? 'button' : undefined}
                        aria-label={editable && studentFillable ? `Editar celda ${colIndex + 1}, fila ${rowIndex + 1}` : undefined}
                      >
                        {cell ?? <span className="text-gray-400 italic">—</span>}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(editable || studentFillable) && (
        <div className="mt-2 text-xs text-gray-500">
          <svg className="inline w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 100 2h.01a1 1 0 100-2H7zM14 7a1 1 0 100-2h.01a1 1 0 100 2H13z" clipRule="evenodd" />
          </svg>
          <span className="text-gray-600">
            {editable 
              ? 'Haz doble clic o presiona Enter en una celda para editar'
              : 'Tabla en modo solo lectura'}
          </span>
        </div>
      )}
    </div>
  );
}