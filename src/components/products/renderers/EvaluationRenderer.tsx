/** Evaluation Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct, EvaluationQuestion } from '../types';

interface EvaluationRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function EvaluationRenderer({ product, className, style }: EvaluationRendererProps) {
  const { metadata, data } = product;
  const questions = (data.questions as EvaluationQuestion[]) || [];
  const totalPoints = data.totalPoints as number | undefined;
  const instructions = data.instructions as string | undefined;
  const timeLimit = data.timeLimit as string | undefined;

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
      />

      <div className="flex flex-wrap gap-3">
        {totalPoints && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
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
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Instrucciones</h3>
          <p className="text-gray-700 text-sm">{instructions}</p>
        </div>
      )}

      <ProductSection title="Preguntas" icon="❓">
        {questions.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Sin preguntas definidas.</p>
        ) : (
          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium text-sm">{q.question}</p>
                    {q.points && (
                      <span className="text-xs text-gray-500 mt-1 inline-block">({q.points} pts)</span>
                    )}

                    {q.type === 'closed' && (
                      <div className="mt-3 flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="radio" name={`q-${index}`} className="text-indigo-600 focus:ring-indigo-500" />
                          Verdadero
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="radio" name={`q-${index}`} className="text-indigo-600 focus:ring-indigo-500" />
                          Falso
                        </label>
                      </div>
                    )}

                    {q.type === 'multiple' && q.options && (
                      <div className="mt-3 space-y-2">
                        {q.options.map((option, oi) => (
                          <label key={oi} className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="radio" name={`q-${index}`} className="text-indigo-600 focus:ring-indigo-500" />
                            {option}
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'open' && (
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

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}