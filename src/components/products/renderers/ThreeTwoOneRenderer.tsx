/** 3-2-1 Format Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct, ThreeTwoOneCard } from '../types';

interface ThreeTwoOneRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function ThreeTwoOneRenderer({ product, className, style }: ThreeTwoOneRendererProps) {
  const { metadata, data } = product;
  const cards = (data.cards as ThreeTwoOneCard[]) || [];
  const title = data.title as string | undefined;
  const instructions = data.instructions as string | undefined;

  const defaultCards: ThreeTwoOneCard[] = cards.length > 0 ? cards : [
    { type: 'three', prompt: '3 cosas que aprendí', items: ['', '', ''] },
    { type: 'two', prompt: '2 cosas que me gustaron', items: ['', ''] },
    { type: 'one', prompt: '1 pregunta que tengo', items: [''] },
  ];

  const cardStyles: Record<string, { bg: string; border: string; icon: string; label: string }> = {
    'three': { bg: 'bg-green-50', border: 'border-green-200', icon: '3️⃣', label: 'green' },
    'two': { bg: 'bg-blue-50', border: 'border-blue-200', icon: '2️⃣', label: 'blue' },
    'one': { bg: 'bg-purple-50', border: 'border-purple-200', icon: '1️⃣', label: 'purple' },
  };

  return (
    <div
      className={`three-two-one-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title || title || 'Formato 3-2-1'}
        subtitle={metadata.subtitle}
        level={metadata.level}
        subject={metadata.subject}
        oaCode={metadata.oaCode}
        oaText={metadata.oaText}
        date={metadata.date}
        teacherName={metadata.teacherName}
        className="mb-6"
      />

      {instructions && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-indigo-700 text-sm">{instructions}</p>
        </div>
      )}

      <div className="space-y-4">
        {defaultCards.map((card, index) => {
          const cardStyle = cardStyles[card.type] || cardStyles.three;
          return (
            <div key={index} className={`${cardStyle.bg} border ${cardStyle.border} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{cardStyle.icon}</span>
                <h3 className="font-semibold text-gray-800">{card.prompt}</h3>
              </div>
              <div className="space-y-3">
                {(card.items || []).map((item, ii) => (
                  <div key={ii} className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="min-h-[2rem] text-sm text-gray-400 italic">
                      {item || 'Escribe aquí...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}