/** DUA Guide Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct, DUASection } from '../types';

interface DUAGuideRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function DUAGuideRenderer({ product, className, style }: DUAGuideRendererProps) {
  const { metadata, data } = product;
  const sections = (data.sections as DUASection[]) || [];
  const principles = (data.principles as string[]) || [];
  const learningBarriers = (data.learningBarriers as string[]) || [];
  const inclusiveAssessment = data.inclusiveAssessment as string | undefined;

  const principleIcons: Record<string, string> = {
    'repräsentieren': '👁️',
    'acción y expresión': '✋',
    'compromiso': '💡',
    'representación': '👁️',
    'acción': '✋',
    'compromisoMotivacional': '💡',
  };

  return (
    <div
      className={`dua-guide-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title}
        subtitle={metadata.subtitle || 'Guía de Acceso Universal al Aprendizaje'}
        level={metadata.level}
        subject={metadata.subject}
        oaCode={metadata.oaCode}
        oaText={metadata.oaText}
        date={metadata.date}
        teacherName={metadata.teacherName}
        className="mb-6"
      />

      {learningBarriers.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">Barreras de Aprendizaje Identificadas</h3>
          <ul className="space-y-1">
            {learningBarriers.map((barrier, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="text-amber-500 mt-0.5">⚠</span>
                {barrier}
              </li>
            ))}
          </ul>
        </div>
      )}

      {principles.length > 0 && (
        <ProductSection title="Principios DUA" icon="🎯">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {principles.map((principle, index) => {
              const key = principle.toLowerCase();
              const icon = Object.entries(principleIcons).find(([k]) => key.includes(k))?.[1] || '📘';
              return (
                <div key={index} className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-center">
                  <span className="text-2xl">{icon}</span>
                  <h4 className="text-sm font-semibold text-indigo-800 mt-2">{principle}</h4>
                </div>
              );
            })}
          </div>
        </ProductSection>
      )}

      {sections.map((section, index) => (
        <ProductSection key={index} title={section.principle} icon="📋">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-800">Estrategias:</h4>
            <ul className="space-y-2">
              {section.strategies.map((strategy, si) => (
                <li key={si} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  <span className="text-indigo-500 mt-0.5">✦</span>
                  {strategy}
                </li>
              ))}
            </ul>
            {section.accommodations && section.accommodations.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Adecuaciones:</h4>
                <ul className="space-y-1">
                  {section.accommodations.map((acc, ai) => (
                    <li key={ai} className="flex items-start gap-2 text-sm text-teal-700">
                      <span className="text-teal-500 mt-0.5">♦</span>
                      {acc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ProductSection>
      ))}

      {inclusiveAssessment && (
        <ProductSection title="Evaluación Inclusiva" icon="✓">
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{inclusiveAssessment}</p>
        </ProductSection>
      )}

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}