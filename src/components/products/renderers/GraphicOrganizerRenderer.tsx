/** Graphic Organizer Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct, GraphicOrganizerNode } from '../types';

interface GraphicOrganizerRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function GraphicOrganizerRenderer({ product, className, style }: GraphicOrganizerRendererProps) {
  const { metadata, data } = product;
  const nodes = (data.nodes as GraphicOrganizerNode[]) || [];
  const organizerType = (data.organizerType as string) || 'concept_map';
  const centralConcept = data.centralConcept as string | undefined;
  const instructions = data.instructions as string | undefined;

  const typeLabels: Record<string, string> = {
    'concept_map': 'Mapa Conceptual',
    'mind_map': 'Mapa Mental',
    'flowchart': 'Diagrama de Flujo',
    'venn': 'Diagrama de Venn',
    'kwl': 'Tabla KWL',
    'cycle': 'Diagrama de Ciclo',
  };

  return (
    <div
      className={`graphic-organizer-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title}
        subtitle={metadata.subtitle || typeLabels[organizerType] || 'Organizador Gráfico'}
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

      {centralConcept && (
        <div className="flex justify-center">
          <div className="bg-indigo-100 border-2 border-indigo-300 rounded-xl px-6 py-3 text-center">
            <span className="text-indigo-800 font-semibold text-sm">{centralConcept}</span>
          </div>
        </div>
      )}

      <ProductSection title="Elementos" icon="🗺️">
        {nodes.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center min-h-[4rem] flex items-center justify-center">
                <span className="text-gray-400 text-sm italic">Agregar elemento...</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {nodes.map((node, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">{node.label}</h4>
                {node.children && node.children.length > 0 && (
                  <ul className="space-y-0.5">
                    {node.children.map((child, ci) => (
                      <li key={ci} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-indigo-400 mt-0.5">▸</span>
                        {child}
                      </li>
                    ))}
                  </ul>
                )}
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