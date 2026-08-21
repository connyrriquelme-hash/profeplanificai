/** Evaluation Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { useCoverImage } from '../useCoverImage';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import { ProductPremiumExtras, ProductImage } from '../ProductPremiumBlocks';
import type { PedagogicalProduct, EvaluationQuestion } from '../types';

interface EvaluationRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
  onProductChange?: (updated: PedagogicalProduct) => void;
}

export function EvaluationRenderer({ product, className, style, onProductChange }: EvaluationRendererProps) {
  const cover = useCoverImage(product, onProductChange);
  const { metadata, data } = product;
  const questions = (data.questions as EvaluationQuestion[]) || [];
  const totalPoints = data.totalPoints as number | undefined;
  const instructions = data.instructions as string | undefined;
  const timeLimit = data.timeLimit as string | undefined;
  const questionImages = (data.images as Array<{ url: string; alt: string; source: string; attribution: string }>) || [];
  const imageTitles = (data.imageTitles as string[]) || [];

  return (
    <div
      className={`evaluation-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title}
        subtitle={metadata.subtitle || 'Evaluación'}
        level={metadata.level}
        subject={metadata.subject}
        oaCode={metadata.oaCode}
        oaText={metadata.oaText}
        date={metadata.date}
        teacherName={metadata.teacherName}
        className="mb-6"
        coverImageUrl={cover.coverImageUrl}
        onGenerateCoverImage={cover.canGenerate ? cover.generate : undefined}
        isGeneratingCoverImage={cover.isGenerating}
        coverImageError={cover.error}
      />

      <div className="flex flex-wrap gap-3">
        {totalPoints && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--primary-tint)] text-[var(--primary-ink)]">
            Puntaje total: {totalPoints} pts
          </span>
        )}
        {timeLimit && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            ⏱ {timeLimit}
          </span>
        )}
      </div>

      {instructions && (
        <div className="bg-gray-50 border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-1">Instrucciones</h3>
          <p className="text-[var(--ink)] text-sm">{instructions}</p>
        </div>
      )}

      <ProductSection title="Preguntas" icon="❓">
        {questions.length === 0 ? (
          <p className="text-[var(--ink-soft)] text-sm italic">Sin preguntas definidas.</p>
        ) : (
          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={index} className="bg-white border border-[var(--border)] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--primary-tint)] text-[var(--primary-ink)] text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-[var(--ink)] font-medium text-sm">{q.text || q.question}</p>
                    {(q.score || q.points) && (
                      <span className="text-xs text-[var(--ink-soft)] mt-1 inline-block">({q.score || q.points} pts)</span>
                    )}

                    {questionImages[index] && (
                      <div className="mt-3">
                        <ProductImage
                          image={questionImages[index]}
                          className="max-w-sm"
                        />
                      </div>
                    )}

                    {q.type === 'closed' && (
                      <div className="mt-3 flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
                          <input type="radio" name={`q-${index}`} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                          Verdadero
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
                          <input type="radio" name={`q-${index}`} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                          Falso
                        </label>
                      </div>
                    )}

                    {q.type === 'verdadero_falso' && (
                      <div className="mt-3 flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
                          <input type="radio" name={`q-${index}`} value="V" className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                          Verdadero (V)
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
                          <input type="radio" name={`q-${index}`} value="F" className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                          Falso (F)
                        </label>
                      </div>
                    )}

                    {q.type === 'multiple' && q.options && (
                      <div className="mt-3 space-y-2">
                        {(q.options as string[]).map((option, oi) => (
                          <label key={oi} className="flex items-center gap-2 text-sm text-[var(--ink)]">
                            <input type="radio" name={`q-${index}`} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                            {option}
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'alternativa' && q.options && (
                      <div className="mt-3 space-y-2">
                        {(q.options as Array<{ text: string; isCorrect: boolean }>).map((option, oi) => {
                          const letter = String.fromCharCode(65 + oi); // 0 -> A, 1 -> B, etc.
                          return (
                            <label key={oi} className="flex items-center gap-2 text-sm text-[var(--ink)]">
                              <input type="radio" name={`q-${index}`} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                              {letter}) {option.text}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {(q.type === 'open' || q.type === 'desarrollo') && (
                      <div className="mt-3 min-h-[4rem] border-b border-dashed border-gray-300 pb-2">
                        <p className="text-gray-400 text-xs italic">Escribe tu respuesta aquí...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProductSection>

      <ProductPremiumExtras data={data} />

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}
