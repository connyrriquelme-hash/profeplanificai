/** Appreciation Scale Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct } from '../types';

interface ScaleRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function ScaleRenderer({ product, className, style }: ScaleRendererProps) {
  const { metadata, data } = product;
  const scales = (data.scales as Array<{ name: string; description: string; color: string }>) || [];
  const criteria = (data.criteria as string[]) || [];
  const description = data.description as string | undefined;

  const colorMap: Record<string, string> = {
    verde: 'bg-green-100 border-green-300 text-green-800',
    amarillo: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    naranja: 'bg-orange-100 border-orange-300 text-orange-800',
    rojo: 'bg-red-100 border-red-300 text-red-800',
  };

  return (
    <div
      className={`scale-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title}
        subtitle={metadata.subtitle}
        level={metadata.level}
        subject={metadata.subject}
        oaCode={metadata.oaCode}
        oaText={metadata.oaText}
        date={metadata.date}
        teacherName={metadata.teacherName}
        className="mb-6"
      />

      {description && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <p className="text-indigo-800 text-sm">{description}</p>
        </div>
      )}

      <ProductSection title="Escala de Apreciación" icon="📈">
        {scales.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {scales.map((scale, index) => (
              <div
                key={index}
                className={`px-4 py-2 rounded-lg border text-sm font-medium ${colorMap[scale.color] || 'bg-gray-100 border-gray-300 text-gray-800'}`}
              >
                <span className="font-semibold">{scale.name}</span>
                <span className="block text-xs mt-0.5 opacity-75">{scale.description}</span>
              </div>
            ))}
          </div>
        )}

        {criteria.length > 0 && (
          <div className="space-y-3">
            {criteria.map((criterion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{criterion}</span>
              </div>
            ))}
          </div>
        )}
      </ProductSection>

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}