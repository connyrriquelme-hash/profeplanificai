/**
 * GeneratedResourceCard — Premium document-style wrapper for AI-generated content.
 * Renders content as a single clean white surface with generous padding and subtle separators.
 */

import type { ReactNode } from 'react';
import { ResultActions } from '../shared/ResultActions';

interface GeneratedResourceCardProps {
  title?: string;
  subtitle?: string;
  badges?: Array<{ label: string; color?: string }>;
  children: ReactNode;
  contenido?: string;
  onGuardar?: () => void;
  onLimpiar?: () => void;
  className?: string;
}

export function GeneratedResourceCard({
  title,
  subtitle,
  badges = [],
  children,
  contenido,
  onGuardar,
  onLimpiar,
  className = '',
}: GeneratedResourceCardProps) {
  return (
    <div className={`relative max-w-5xl mx-auto ${className}`}>
      {/* Document surface */}
      <div className="bg-white rounded-xl border border-[var(--border)] shadow-lg shadow-black/5 overflow-hidden">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--accent-honey)] to-[var(--primary)]" />

        {/* Document header */}
        {(title || badges.length > 0) && (
          <div className="px-6 sm:px-10 lg:px-14 pt-8 pb-6 border-b border-[var(--border)]">
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {badges.map((badge, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--primary-tint)] text-[var(--primary-ink)]"
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            )}
            {title && (
              <h2 className="text-2xl font-bold text-[var(--ink)] tracking-tight">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-[var(--ink-soft)] mt-1">{subtitle}</p>
            )}
          </div>
        )}

        {/* Document body */}
        <div className="px-6 sm:px-10 lg:px-14 py-8 leading-relaxed text-[var(--ink)]">
          {children}
        </div>

        {/* Actions bar */}
        {contenido && (
          <div className="px-6 sm:px-10 lg:px-14 py-4 border-t border-[var(--border)] bg-[var(--bg)]">
            <ResultActions
              contenido={contenido}
              titulo={title}
              onGuardar={onGuardar}
              onLimpiar={onLimpiar}
            />
          </div>
        )}
      </div>
    </div>
  );
}
