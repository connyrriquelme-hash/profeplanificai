/**
 * Generic Product Renderer
 *
 * Fallback premium renderer for products without a specific renderer.
 * It keeps raw structured data printable, readable and classroom-ready.
 */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import {
  ProductPremiumExtras,
  PremiumKeyValueGrid,
  formatProductLabel,
  isTechnicalKey,
} from '../ProductPremiumBlocks';
import type { PedagogicalProduct } from '../types';

interface GenericProductRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

const EXTRA_KEYS = new Set(['tablas', 'tables', 'callouts', 'graficos', 'charts', 'checklist']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function hasRenderableValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.some(hasRenderableValue);
  if (isRecord(value)) return Object.values(value).some(hasRenderableValue);
  return true;
}

export function GenericProductRenderer({ product, className, style }: GenericProductRendererProps) {
  const { metadata, data } = product;

  const renderValue = (key: string, value: unknown): React.ReactNode => {
    if (value === null || value === undefined || EXTRA_KEYS.has(key) || isTechnicalKey(key)) return null;

    if (typeof value === 'string' || typeof value === 'number') {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm break-inside-avoid">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{formatProductLabel(key)}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{formatValue(value)}</p>
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm break-inside-avoid">
          <span className={value ? 'text-emerald-600 font-black' : 'text-slate-300 font-black'}>
            {value ? '✓' : '○'}
          </span>{' '}
          {formatProductLabel(key)}
        </div>
      );
    }

    if (Array.isArray(value)) {
      const items = value.filter(hasRenderableValue);
      if (items.length === 0) return null;

      if (items.every((item) => !isRecord(item))) {
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm break-inside-avoid">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{formatProductLabel(key)}</p>
            <ul className="mt-3 space-y-2">
              {items.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                  <span className="mt-0.5 text-violet-500">•</span>
                  <span>{formatValue(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm break-inside-avoid">
              {isRecord(item) ? (
                <PremiumKeyValueGrid data={item} />
              ) : (
                <p className="text-sm text-slate-700">{formatValue(item)}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (isRecord(value)) {
      const entries = Object.fromEntries(
        Object.entries(value).filter(([, item]) => hasRenderableValue(item)),
      );
      if (Object.keys(entries).length === 0) return null;
      return <PremiumKeyValueGrid data={entries} />;
    }

    return null;
  };

  const sections = Object.entries(data).filter(
    ([key, value]) => !EXTRA_KEYS.has(key) && !isTechnicalKey(key) && hasRenderableValue(value),
  );

  return (
    <div
      className={`generic-product-renderer mx-auto max-w-5xl space-y-6 p-4 md:p-6 lg:p-8 print:m-0 print:max-w-none print:p-0 ${className || ''}`}
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

      <ProductPremiumExtras data={data} />

      {sections.map(([key, value]) => (
        <ProductSection key={key} title={formatProductLabel(key)} icon="📄">
          {renderValue(key, value)}
        </ProductSection>
      ))}

      {sections.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-400">
          <p>Sin contenido disponible.</p>
        </div>
      )}

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}
