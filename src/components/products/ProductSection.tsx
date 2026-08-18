/** Product Section Component

A collapsible section wrapper for product content.
*/

import React, { useState } from 'react';

interface ProductSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  defaultExpanded?: boolean;
}

export function ProductSection({ 
  title, 
  icon, 
  children, 
  className, 
  style,
  defaultExpanded = true,
}: ProductSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <section className={`product-section overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm break-inside-avoid print:shadow-none ${className || ''}`} style={style}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg)] border-b border-[var(--border)] hover:bg-[var(--bg2)] transition-colors text-left print:bg-white"
        aria-expanded={isExpanded}
        aria-controls={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {icon && <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary-tint)] text-lg" aria-hidden="true">{icon}</span>}
        <h2 className="font-semibold text-[var(--ink)] flex-1 text-left text-[14px]">{title}</h2>
        <svg
          className={`w-5 h-5 text-[var(--muted)] flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className={`${isExpanded ? 'block' : 'hidden'} p-4 md:p-6`}
        role="region"
        aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}-label`}
        hidden={!isExpanded}
      >
        {isExpanded && children}
      </div>
    </section>
  );
}
