/** Learning Guide Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import { ProductPremiumExtras, ProductImage } from '../ProductPremiumBlocks';
import type { PedagogicalProduct, GuideSection, GuideTextoLectura } from '../types';

interface GuideRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function GuideRenderer({ product, className, style }: GuideRendererProps) {
  const { metadata, data } = product;
  const sections = (data.sections as GuideSection[]) || [];
  const textoLectura = data.textoLectura as GuideTextoLectura | undefined;
  const objective = data.objective as string | undefined;
  const materials = (data.materials as string[]) || [];
  const evaluation = data.evaluation as string | undefined;
  const duration = data.duration as string | undefined;
  const guideImages = (data.images as Array<{ url: string; alt: string; source: string; attribution: string }>) || [];
  const imageTitles = (data.imageTitles as string[]) || [];

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
        <div className="bg-[var(--primary-tint)] border border-[var(--primary-tint)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--primary-ink)] mb-1">Objetivo de Aprendizaje</h3>
          <p className="text-[var(--primary-ink)] text-sm">{objective}</p>
        </div>
      )}

      {textoLectura && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-1.5">
            <span aria-hidden="true">📖</span> Texto de lectura
            {textoLectura.fuente === 'proporcionado_profesor' && (
              <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5">
                Adaptado del material del profesor
              </span>
            )}
          </h3>
          <p className="text-amber-900 text-sm font-semibold mb-1">{textoLectura.titulo}</p>
          <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{textoLectura.cuerpo}</p>
        </div>
      )}

      {materials.length > 0 && (
        <ProductSection title="Materiales / Vocabulario" icon="🧰">
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {materials.map((material, index) => {
              const text = typeof material === 'object' && material !== null
                ? `${(material as Record<string, unknown>).term || ''}: ${(material as Record<string, unknown>).definition || ''}`.trim()
                : String(material || '');
              if (!text) return null;
              return (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                  {text}
                </li>
              );
            })}
          </ul>
        </ProductSection>
      )}

      {sections.map((section, index) => (
        <ProductSection key={index} title={section.title} icon="📖">
          {guideImages[index] && (
            <ProductImage
              image={guideImages[index]}
              className="mb-4"
            />
          )}
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{section.content}</p>
          </div>
          {section.activities && section.activities.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-800">Actividades:</h4>
              <ul className="space-y-1">
                {section.activities.map((activity, ai) => (
                  <li key={ai} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-[var(--primary)] mt-0.5">▸</span>
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

      <ProductPremiumExtras data={data} />

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}
