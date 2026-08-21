/**
 * Pedagogical Block Component
 *
 * A generic wrapper for pedagogical content blocks with title, icon, and optional numbering.
 * Used as a structural building block inside product renderers.
 */

import React from 'react';

interface PedagogicalBlockProps {
  title?: string;
  icon?: React.ReactNode;
  number?: number;
  variant?: 'default' | 'highlighted' | 'muted';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const variantClasses: Record<string, string> = {
  default: 'bg-white border-[var(--border)]',
  highlighted: 'bg-[var(--primary-tint)] border-[var(--primary)]/25',
  muted: 'bg-gray-50 border-[var(--border)]',
};

export function PedagogicalBlock({
  title,
  icon,
  number,
  variant = 'default',
  children,
  className,
  style,
}: PedagogicalBlockProps) {
  return (
    <div
      className={`pedagogical-block border rounded-xl overflow-hidden ${variantClasses[variant] || variantClasses.default} ${className || ''}`}
      style={style}
    >
      {(title || icon || number !== undefined) && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          {number !== undefined && (
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--primary-tint)] text-[var(--primary-ink)] text-xs font-bold flex items-center justify-center">
              {number}
            </span>
          )}
          {icon && (
            <span className="text-lg flex-shrink-0" aria-hidden="true">{icon}</span>
          )}
          {title && (
            <h3 className="text-sm font-bold text-[var(--ink)]">{title}</h3>
          )}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
