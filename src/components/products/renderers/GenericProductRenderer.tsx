/** Generic Product Renderer

Fallback renderer for products without a specific renderer.
Displays structured data in a clean, professional format.
*/

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct } from '../types';

interface GenericProductRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function GenericProductRenderer({ product, className, style }: GenericProductRendererProps) {
  const { metadata, data } = product;

  const renderValue = (key: string, value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return null;

    if (typeof value === 'string') {
      return (
        <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">{formatLabel(key)}</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="flex items-center gap-2 text-sm text-gray-700">
          <span className={value ? 'text-green-500' : 'text-gray-300'}>
            {value ? '✓' : '○'}
          </span>
          {formatLabel(key)}
        </div>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      if (typeof value[0] === 'string') {
        return (
          <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{formatLabel(key)}</h4>
            <ul className="space-y-1">
              {value.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-indigo-400 mt-0.5">▸</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      }
      return (
        <div key={key}>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{formatLabel(key)}</h4>
          <div className="space-y-2">
            {value.map((item, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-700">
                {typeof item === 'object' && item !== null
                  ? Object.entries(item as Record<string, unknown>)
                      .filter(([, v]) => v != null)
                      .map(([k, v]) => `${formatLabel(k)}: ${typeof v === 'object' ? '...' : String(v)}`)
                      .join(', ')
                  : String(item)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined);
      if (entries.length === 0) return null;
      return (
        <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{formatLabel(key)}</h4>
          <div className="space-y-1">
            {entries.map(([k, v]) => (
              <div key={k} className="text-sm">
                <span className="font-medium text-gray-700">{formatLabel(k)}:</span>{' '}
                <span className="text-gray-600">
                  {typeof v === 'object' && v !== null
                    ? Array.isArray(v) ? `[${v.length} items]` : '...'
                    : String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  };

  const sections = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '');

  return (
    <div
      className={`generic-product-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title}
        subtitle={metadata.subtitle}
        level={metadata.level}
        subject={metadata.subject}
        oaCode={metadata.oaCode}
        oaText={metadata.oaText}
        topic={metadata.topic}
        date={metadata.date}
        teacherName={metadata.teacherName}
        estimatedTime={metadata.estimatedTime}
        className="mb-6"
      />

      {sections.map(([key, value]) => (
        <ProductSection key={key} title={formatLabel(key)} icon="📄">
          {renderValue(key, value)}
        </ProductSection>
      ))}

      {sections.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>Sin contenido disponible.</p>
        </div>
      )}

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}