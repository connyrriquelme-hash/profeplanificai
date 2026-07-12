/** Experiment Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct, ExperimentStep } from '../types';

interface ExperimentRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function ExperimentRenderer({ product, className, style }: ExperimentRendererProps) {
  const { metadata, data } = product;
  const steps = (data.steps as ExperimentStep[]) || [];
  const hypothesis = data.hypothesis as string | undefined;
  const materials = (data.materials as string[]) || [];
  const conclusion = data.conclusion as string | undefined;
  const safetyNotes = (data.safetyNotes as string[]) || [];
  const variables = data.variables as { independent?: string; dependent?: string; control?: string } | undefined;

  return (
    <div
      className={`experiment-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title}
        subtitle={metadata.subtitle || 'Experimento Científico'}
        level={metadata.level}
        subject={metadata.subject}
        oaCode={metadata.oaCode}
        oaText={metadata.oaText}
        topic={metadata.topic}
        date={metadata.date}
        teacherName={metadata.teacherName}
        className="mb-6"
      />

      {hypothesis && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-purple-800 mb-1">Hipótesis</h3>
          <p className="text-purple-700 text-sm italic">"{hypothesis}"</p>
        </div>
      )}

      {variables && (
        <ProductSection title="Variables" icon="🔬">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {variables.independent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <h4 className="text-xs font-semibold text-blue-800 uppercase">Independiente</h4>
                <p className="text-sm text-blue-700 mt-1">{variables.independent}</p>
              </div>
            )}
            {variables.dependent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <h4 className="text-xs font-semibold text-green-800 uppercase">Dependiente</h4>
                <p className="text-sm text-green-700 mt-1">{variables.dependent}</p>
              </div>
            )}
            {variables.control && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <h4 className="text-xs font-semibold text-amber-800 uppercase">Control</h4>
                <p className="text-sm text-amber-700 mt-1">{variables.control}</p>
              </div>
            )}
          </div>
        </ProductSection>
      )}

      {materials.length > 0 && (
        <ProductSection title="Materiales" icon="🧰">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {materials.map((material, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded text-sm text-gray-700">
                <span className="text-teal-500">🧪</span>
                {material}
              </div>
            ))}
          </div>
        </ProductSection>
      )}

      {safetyNotes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1">
            <span>⚠️</span> Medidas de Seguridad
          </h3>
          <ul className="space-y-1">
            {safetyNotes.map((note, index) => (
              <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ProductSection title="Procedimiento" icon="📋">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0 relative">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm">
                  {step.step}
                </span>
                {index < steps.length - 1 && (
                  <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-gray-200" />
                )}
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-800">{step.instruction}</p>
                {step.observation && (
                  <p className="text-xs text-gray-500 mt-2 italic">Observar: {step.observation}</p>
                )}
                {step.safetyNote && (
                  <p className="text-xs text-red-600 mt-1 font-medium">⚠ {step.safetyNote}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ProductSection>

      {conclusion && (
        <ProductSection title="Conclusión" icon="🎯">
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{conclusion}</p>
        </ProductSection>
      )}

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}