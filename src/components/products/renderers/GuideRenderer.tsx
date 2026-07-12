/** Learning Guide Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct, GuideSection } from '../types';

interface GuideRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function GuideRenderer({ product, className, style }: GuideRendererProps) {
  const { metadata, data } = product;
  const sections = (data.sections as GuideSection[]) || [];
  const objective = data.objective as string | undefined;
  const materials = (data.materials as string[]) || [];
  const evaluation = data.evaluation as string | undefined;
  const duration = data.duration as string | undefined;

  return (
    <div
      className={`guide-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title}
        subtitle={metadata.subtitle || 'Guía de Aprendizaje'}
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

      {objective && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-indigo-800 mb-1">Objetivo de Aprendizaje</h3>
          <p className="text-indigo-700 text-sm">{objective}</p>
        </div>
      )}

      {materials.length > 0 && (
        <ProductSection title="Materiales" icon="🧰">
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {materials.map((material, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                {material}
              </li>
            ))}
          </ul>
        </ProductSection>
      )}

      {sections.map((section, index) => (
        <ProductSection key={index} title={section.title} icon="📖">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{section.content}</p>
          </div>
          {section.activities && section.activities.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-800">Actividades:</h4>
              <ul className="space-y-1">
                {section.activities.map((activity, ai) => (
                  <li key={ai} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-indigo-500 mt-0.5">▸</span>
                    {activity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ProductSection>
      ))}

      {evaluation && (
        <ProductSection title="Evaluación" icon="✓">
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{evaluation}</p>
        </ProductSection>
      )}

      {duration && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
          <span className="text-amber-800 text-sm font-medium">Duración estimada: {duration}</span>
        </div>
      )}

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}