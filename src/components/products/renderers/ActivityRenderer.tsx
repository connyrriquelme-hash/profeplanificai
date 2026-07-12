/** Activity Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct, ActivityPhase } from '../types';

interface ActivityRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function ActivityRenderer({ product, className, style }: ActivityRendererProps) {
  const { metadata, data } = product;
  const phases = (data.phases as ActivityPhase[]) || [];
  const objective = data.objective as string | undefined;
  const materials = (data.materials as string[]) || [];
  const resources = (data.resources as string[]) || [];
  const duration = data.duration as string | undefined;

  const phaseColors: Record<string, string> = {
    'inicio': 'bg-blue-50 border-blue-200 text-blue-800',
    'desarrollo': 'bg-green-50 border-green-200 text-green-800',
    'cierre': 'bg-purple-50 border-purple-200 text-purple-800',
  };

  const phaseIcons: Record<string, string> = {
    'inicio': '🚀',
    'desarrollo': '🔬',
    'cierre': '🎯',
  };

  return (
    <div
      className={`activity-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title}
        subtitle={metadata.subtitle || 'Actividad de Aprendizaje'}
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
          <h3 className="text-sm font-semibold text-indigo-800 mb-1">Objetivo</h3>
          <p className="text-indigo-700 text-sm">{objective}</p>
        </div>
      )}

      {(materials.length > 0 || resources.length > 0) && (
        <ProductSection title="Materiales y Recursos" icon="🧰">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Materiales:</h4>
                <ul className="space-y-1">
                  {materials.map((m, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {resources.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Recursos:</h4>
                <ul className="space-y-1">
                  {resources.map((r, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ProductSection>
      )}

      {phases.map((phase, index) => {
        const phaseName = phase.name || phase.phase || 'Fase';
        const key = phaseName.toLowerCase();
        const colorClass = Object.entries(phaseColors).find(([k]) => key.includes(k))?.[1] || 'bg-gray-50 border-gray-200 text-gray-800';
        const icon = Object.entries(phaseIcons).find(([k]) => key.includes(k))?.[1] || '📋';

        return (
          <ProductSection key={index} title={phaseName} icon={icon}>
            <div className={`border rounded-lg p-4 ${colorClass}`}>
              <p className="text-sm whitespace-pre-wrap">{phase.description}</p>
              {phase.duration && (
                <div className="mt-2 flex items-center gap-1 text-xs opacity-75">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {phase.duration} min
                </div>
              )}
              {phase.materials && phase.materials.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs font-semibold opacity-75">Materiales específicos:</span>
                  <ul className="mt-1 space-y-0.5">
                    {phase.materials.map((m, mi) => (
                      <li key={mi} className="text-xs opacity-75">• {m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ProductSection>
        );
      })}

      {duration && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
          <span className="text-amber-800 text-sm font-medium">Duración total: {duration}</span>
        </div>
      )}

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}