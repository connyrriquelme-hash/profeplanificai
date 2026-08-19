/**
 * ProductActionBar — Unified export/action bar for all product renderers.
 *
 * Replaces PrintToolbar with a full set of export options:
 * PDF, DOCX, PPTX, HTML, Copy, Print, Save, Edit with AI.
 */

import { useState } from 'react';
import {
  FileDown, FileText, Presentation, Copy, Check, Printer,
  Save, Sparkles, Loader2,
} from 'lucide-react';
import type { PedagogicalProduct } from './types';
import { exportProductToPremiumPDF } from '../../utils/productPdf';
import { exportElementToWord } from '../../utils/exportProductWord';
import { exportAsJSON } from '../../utils/exportUtils';

interface ProductActionBarProps {
  product: PedagogicalProduct;
  selectedProducto?: string;
  resourceId?: string;
  onSave?: () => void;
  onEditWithAI?: () => void;
  elementId?: string;
  filename?: string;
  className?: string;
}

export function ProductActionBar({
  product,
  selectedProducto,
  resourceId,
  onSave,
  onEditWithAI,
  elementId,
  filename,
  className = '',
}: ProductActionBarProps) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'docx' | 'pptx' | null>(null);

  const safeName = (filename || product.metadata.title || 'recurso')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '').trim().slice(0, 60) || 'recurso';

  const handlePDF = async () => {
    setExporting('pdf');
    try {
      await exportProductToPremiumPDF({
        id: resourceId || '',
        title: product.metadata.title || 'Producto',
        type: selectedProducto || product.type,
        displayType: selectedProducto || product.type,
        level: product.metadata.level || '',
        subject: product.metadata.subject || '',
        oaCode: product.metadata.oaCode || '',
        oaText: product.metadata.oaText || '',
        classTitle: '',
        sourceTab: '',
        createdAt: new Date().toISOString(),
        sections: Object.entries(product.data)
          .filter(([, v]) => v != null && v !== '')
          .map(([key, value]) => ({
            title: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            content: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
            kind: 'text' as const,
          })),
        tables: [],
        callouts: [],
        charts: [],
        checklist: [],
        footerNotes: [],
        rawMarkdown: '',
      });
    } catch { /* silent */ }
    setExporting(null);
  };

  const handleDOCX = () => {
    if (!elementId) return;
    setExporting('docx');
    try {
      exportElementToWord(elementId, `${safeName}.docx`);
    } catch { /* silent */ }
    setExporting(null);
  };

  const handleCopy = async () => {
    const text = JSON.stringify(product.data, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleJSON = () => {
    exportAsJSON(product, `${safeName}.json`);
  };

  const handlePrint = () => window.print();

  const isPresentation = selectedProducto === 'presentacion';

  return (
    <div className={`flex flex-wrap items-center gap-2 print:hidden ${className}`} role="toolbar" aria-label="Exportar recurso">
      {/* PDF */}
      <button
        type="button"
        onClick={handlePDF}
        disabled={exporting === 'pdf'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
      >
        {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
        PDF
      </button>

      {/* DOCX */}
      {elementId && (
        <button
          type="button"
          onClick={handleDOCX}
          disabled={exporting === 'docx'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] bg-white text-[var(--ink)] hover:bg-[var(--bg2)] transition-colors disabled:opacity-50"
        >
          {exporting === 'docx' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          DOCX
        </button>
      )}

      {/* PPTX — only for presentations */}
      {isPresentation && resourceId && (
        <button
          type="button"
          onClick={async () => {
            setExporting('pptx');
            try {
              const tokenRaw = localStorage.getItem('planificaia_token');
              const token = tokenRaw ? JSON.parse(tokenRaw).token : '';
              const resp = await fetch('/api/materials/presentation/render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ resourceId }),
              });
              if (!resp.ok) throw new Error(await resp.text() || `Error ${resp.status}`);
              const blob = await resp.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${safeName}.pptx`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } catch { /* silent */ }
            setExporting(null);
          }}
          disabled={exporting === 'pptx'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] bg-white text-[var(--ink)] hover:bg-[var(--bg2)] transition-colors disabled:opacity-50"
        >
          {exporting === 'pptx' ? <Loader2 size={14} className="animate-spin" /> : <Presentation size={14} />}
          PPTX
        </button>
      )}

      {/* Separator */}
      <div className="w-px h-5 bg-[var(--border)]" />

      {/* Copy */}
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:bg-[var(--bg2)] transition-colors"
      >
        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>

      {/* Print */}
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:bg-[var(--bg2)] transition-colors"
      >
        <Printer size={14} />
        Imprimir
      </button>

      {/* JSON */}
      <button
        type="button"
        onClick={handleJSON}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:bg-[var(--bg2)] transition-colors"
      >
        <FileDown size={14} />
        JSON
      </button>

      <div className="flex-1" />

      {/* Save */}
      {onSave && (
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <Save size={14} />
          Guardar
        </button>
      )}

      {/* Edit with AI */}
      {onEditWithAI && (
        <button
          type="button"
          onClick={onEditWithAI}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary-tint)] text-[var(--primary-ink)] hover:bg-[var(--primary)]/15 transition-colors"
        >
          <Sparkles size={14} />
          Editar con IA
        </button>
      )}
    </div>
  );
}
