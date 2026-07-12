/** Rubric Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct, RubricCriterion } from '../types';

interface RubricRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function RubricRenderer({ product, className, style }: RubricRendererProps) {
  const { metadata, data } = product;
  const criteria = (data.criteria as RubricCriterion[]) || [];
  const levels = data.levels as string[] || [];
  const description = data.description as string | undefined;

  return (
    <div
      className={`rubric-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
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

      <ProductSection title="Rúbrica de Evaluación" icon="📊">
        {criteria.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Sin criterios definidos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" role="grid" aria-label="Rúbrica">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">Criterio</th>
                  {levels.map((level, i) => (
                    <th key={i} scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase min-w-[150px]">{level}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {criteria.map((criterion, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800">{criterion.name}</div>
                      {criterion.description && (
                        <div className="text-xs text-gray-500 mt-1">{criterion.description}</div>
                      )}
                    </td>
                    {criterion.levels.map((level, li) => (
                      <td key={li} className="px-4 py-3 text-sm text-gray-700 text-center border-l border-gray-100">
                        <div className="font-medium text-gray-800">{level.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{level.description}</div>
                        <div className="text-xs font-semibold text-indigo-600 mt-1">{level.score} pts</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ProductSection>

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}