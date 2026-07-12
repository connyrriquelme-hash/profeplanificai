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
    <section className={`product-section bg-white rounded-xl border border-gray-200 overflow-hidden ${className || ''}`} style={style}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors text-left"
        aria-expanded={isExpanded}
        aria-controls={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {icon && <span className="text-lg" aria-hidden="true">{icon}</span>}
        <h2 className="font-semibold text-gray-800 flex-1 text-left">{title}</h2>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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