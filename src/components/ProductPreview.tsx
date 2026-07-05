import React from 'react';
import { NormalizedProduct, ProductSection, ProductTable, ProductCallout, ProductChart } from '../utils/productNormalizer';
import { resourceTypeLabel } from '../services/bankService';

function MarkdownContent({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((li, i) => (
            <li key={i} className="text-sm">{li}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${elements.length}`} className="text-sm font-semibold mt-4 mb-2 text-gray-800">
          {trimmed.slice(4)}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-base font-bold mt-5 mb-2 text-gray-900 border-b border-gray-200 pb-1">
          {trimmed.slice(3)}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-lg font-bold mt-5 mb-3 text-gray-900">
          {trimmed.slice(2)}
        </h2>
      );
    } else if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2));
    } else if (trimmed) {
      flushList();
      const formatted = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>');
      elements.push(
        <p
          key={`p-${elements.length}`}
          className="text-sm leading-relaxed my-1"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    } else {
      flushList();
    }
  }
  flushList();

  return <div>{elements}</div>;
}

function SectionCard({ section }: { section: ProductSection }) {
  return (
    <div className="mb-4">
      {section.title && (
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {section.title}
        </h4>
      )}
      <MarkdownContent text={section.content} />
    </div>
  );
}

function TableCard({ table }: { table: ProductTable }) {
  if (!table.columns.length || !table.rows.length) return null;
  return (
    <div className="mb-4 rounded-xl border border-gray-200 overflow-hidden">
      {table.title && (
        <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-blue-800">{table.title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              {table.columns.map((col, i) => (
                <th key={i} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 border-b border-gray-100 text-gray-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalloutCard({ callout }: { callout: ProductCallout }) {
  const styles: Record<string, { bg: string; border: string; icon: string }> = {
    importante: { bg: 'bg-amber-50', border: 'border-amber-300', icon: '!' },
    docente: { bg: 'bg-blue-50', border: 'border-blue-300', icon: 'D' },
    familia: { bg: 'bg-green-50', border: 'border-green-300', icon: 'F' },
    estudiante: { bg: 'bg-purple-50', border: 'border-purple-300', icon: 'E' },
    dua: { bg: 'bg-pink-50', border: 'border-pink-300', icon: 'U' },
  };
  const s = styles[callout.type] || styles.importante;
  return (
    <div className={`${s.bg} border-l-4 ${s.border} rounded-r-xl p-3 mb-3`}>
      <div className="flex items-start gap-2">
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white ${s.border.replace('border-', 'bg-')}`}>
          {s.icon}
        </span>
        <p className="text-sm text-gray-700 leading-relaxed">{callout.text}</p>
      </div>
    </div>
  );
}

function ChartCard({ chart }: { chart: ProductChart }) {
  if (!chart.data?.length) return null;
  const maxVal = Math.max(...chart.data.map((d) => d.value || 0), 1);
  return (
    <div className="mb-4 rounded-xl border border-gray-200 p-4">
      {chart.title && (
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{chart.title}</h4>
      )}
      <div className="space-y-2">
        {chart.data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-24 text-right truncate">{d.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                style={{ width: `${Math.max((d.value / maxVal) * 100, 4)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-8">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistCard({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mb-4 rounded-xl border border-gray-200 p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Lista de verificación</h4>
      <div className="space-y-1">
        {items.map((item, i) => (
          <label key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="rounded border-gray-300" readOnly />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

interface ProductPreviewProps {
  product: NormalizedProduct;
  onExportPDF?: () => void;
  onCopy?: () => void;
  onPrint?: () => void;
}

export default function ProductPreview({ product, onExportPDF, onCopy, onPrint }: ProductPreviewProps) {
  const metaChips = [
    product.level && { label: 'Nivel', value: product.level },
    product.subject && { label: 'Asignatura', value: product.subject },
    product.oaCode && { label: 'OA', value: product.oaCode },
    product.displayType && { label: 'Tipo', value: product.displayType },
    product.sourceTab && { label: 'Origen', value: product.sourceTab },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h2 className="text-lg font-bold text-white leading-tight">{product.title}</h2>
        <p className="text-blue-100 text-xs mt-1">{resourceTypeLabel(product.type)}</p>
      </div>

      {metaChips.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2">
          {metaChips.map((c, i) => (
            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-700">
              <span className="text-gray-400 mr-1">{c.label}:</span>
              {c.value}
            </span>
          ))}
        </div>
      )}

      <div className="px-6 py-5 space-y-1">
        {product.sections.length === 0 && product.tables.length === 0 && (
          <p className="text-sm text-gray-400 italic">No hay contenido estructurado disponible.</p>
        )}

        {product.callouts.map((c, i) => (
          <CalloutCard key={`callout-${i}`} callout={c} />
        ))}

        {product.sections.map((s, i) => (
          <SectionCard key={`section-${i}`} section={s} />
        ))}

        {product.tables.map((t, i) => (
          <TableCard key={`table-${i}`} table={t} />
        ))}

        {product.charts.map((c, i) => (
          <ChartCard key={`chart-${i}`} chart={c} />
        ))}

        {product.checklist.length > 0 && (
          <ChecklistCard items={product.checklist} />
        )}

        {product.footerNotes.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            {product.footerNotes.map((n, i) => (
              <p key={i} className="text-xs text-gray-500 italic">{n}</p>
            ))}
          </div>
        )}
      </div>

      {(onExportPDF || onCopy || onPrint) && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
          {onCopy && (
            <button
              onClick={onCopy}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Copiar
            </button>
          )}
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Imprimir
            </button>
          )}
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Exportar PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
}
