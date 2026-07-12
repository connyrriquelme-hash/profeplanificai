/** Drawing Box Component

A drawing area component for student notebooks with optional image upload.
*/

import React from 'react';

interface DrawingBoxProps {
  title?: string;
  instruction?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  className?: string;
  style?: React.CSSProperties;
}

const sizeClasses = {
  small: 'h-32',
  medium: 'h-48',
  large: 'h-64',
  full: 'h-96',
};

const borderClasses = {
  solid: 'border-gray-300',
  dashed: 'border-dashed border-gray-400',
  dotted: 'border-dotted border-gray-400',
  none: 'border-transparent',
};

export function DrawingBox({ 
  title, 
  instruction, 
  size = 'large', 
  borderStyle = 'solid', 
  className, 
  style 
}: DrawingBoxProps) {
  return (
    <div className={`drawing-box ${className || ''}`} style={style}>
      {(title || instruction) && (
        <div className="mb-2">
          {title && <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>}
          {instruction && (
            <p className="text-sm text-gray-600 mb-2">{instruction}</p>
          )}
        </div>
      )}
      <div
        className={`drawing-area border-2 rounded-lg bg-white ${sizeClasses[size]} ${borderClasses[borderStyle]} w-full`}
        role="img"
        aria-label={title || 'Espacio de dibujo'}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-gray-400 p-4">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.83 2.829a2 2 0 010 2.828l-8.486 8.485M7 17a4 4 0 118 0h.01" />
            </svg>
            <p className="text-gray-500 text-sm">Espacio para dibujo</p>
            <p className="text-xs text-gray-400 mt-1">Usa lápiz y papel, luego fotografía tu dibujo</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        En versión digital: usa lápiz y papel, luego sube una foto
      </p>
    </div>
  );
}