/** Entry/Exit Ticket Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct, TicketContent } from '../types';

interface TicketRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function TicketRenderer({ product, className, style }: TicketRendererProps) {
  const { metadata, data } = product;
  const questions = (data.questions as TicketContent[]) || [];
  const ticketType = (data.ticketType as 'entrada' | 'salida') || 'salida';
  const responseArea = data.responseArea as string | undefined;

  const title = ticketType === 'entrada' ? 'Ticket de Entrada' : 'Ticket de Salida';
  const icon = ticketType === 'entrada' ? '🎟️' : '🎫';

  return (
    <div
      className={`ticket-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title || title}
        subtitle={metadata.subtitle}
        level={metadata.level}
        subject={metadata.subject}
        oaCode={metadata.oaCode}
        oaText={metadata.oaText}
        date={metadata.date}
        teacherName={metadata.teacherName}
        className="mb-6"
      />

      <ProductSection title={title} icon={icon}>
        {questions.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Sin preguntas definidas.</p>
        ) : (
          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium text-sm">{q.question}</p>
                    <div className="mt-3 min-h-[3rem] border-b border-dashed border-gray-300 pb-2">
                      <p className="text-gray-400 text-xs italic">
                        {q.response || responseArea || 'Escribe tu respuesta aquí...'}
                      </p>
                    </div>
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