/** Checklist Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct, ChecklistItem } from '../types';

interface ChecklistRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function ChecklistRenderer({ product, className, style }: ChecklistRendererProps) {
  const { metadata, data } = product;
  const items = (data.items as ChecklistItem[]) || (data.checklist as string[]) || [];
  const observations = data.observations as string | undefined;

  return (
    <div
      className={`checklist-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
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

      <ProductSection title="Lista de Cotejo" icon="☑️">
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Sin criterios definidos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" role="grid" aria-label="Lista de cotejo">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-8">#</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Criterio</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-24">Logrado</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-24">Observado</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => {
                  const criterion = typeof item === 'string' ? item : item.criterion;
                  const achieved = typeof item === 'object' ? item.achieved : undefined;
                  const observed = typeof item === 'object' ? item.observed : undefined;
                  const notes = typeof item === 'object' ? item.notes : undefined;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{criterion}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          defaultChecked={achieved}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                          aria-label={`Logrado: ${criterion}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          defaultChecked={observed}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                          aria-label={`Observado: ${criterion}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-h-[1.5rem] text-sm text-gray-500 italic">
                          {notes || '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ProductSection>

      {observations && (
        <ProductSection title="Observaciones" icon="📝">
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{observations}</p>
        </ProductSection>
      )}

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}