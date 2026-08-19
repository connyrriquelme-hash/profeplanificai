import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Presentation, Download, Printer, Copy, Check, Loader2 } from 'lucide-react';
import type { PedagogicalProduct } from './types';
import { exportProductToWord, exportProductToPptx } from '../../services/productExportService';

const PALETTE = {
  turquoise: '#06BFAD',
  fuchsia: '#F24162',
  orange: '#F2A413',
  purple: '#7F58A6',
} as const;

interface ProductActionBarProps {
  product: PedagogicalProduct;
  selectedProducto?: string;
  resourceId?: string;
  onSave?: () => void;
  onEditWithAI?: () => void;
  elementId?: string;
  className?: string;
}

type ExportStatus = 'idle' | 'exporting';

interface ExportButton {
  label: string;
  icon: typeof FileText;
  color: string;
  action: () => Promise<void>;
}

export default function ProductActionBar({ product, onSave, className }: ProductActionBarProps) {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [activeExport, setActiveExport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = useCallback(async (label: string, action: () => Promise<void>) => {
    setStatus('exporting');
    setActiveExport(label);
    try {
      await action();
    } catch (err) {
      console.error(`[ProductActionBar] Error exporting ${label}:`, err);
    } finally {
      setStatus('idle');
      setActiveExport(null);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    const text = productToPlainText(product);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('[ProductActionBar] Copy failed');
    }
  }, [product]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const exports: ExportButton[] = [
    { label: 'Word', icon: FileText, color: PALETTE.turquoise, action: () => exportProductToWord(product) },
    { label: 'PPTX', icon: Presentation, color: PALETTE.fuchsia, action: () => exportProductToPptx(product) },
  ];

  const isBusy = status === 'exporting';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      {exports.map(exp => (
        <motion.button
          key={exp.label}
          whileHover={!isBusy ? { scale: 1.05 } : undefined}
          whileTap={!isBusy ? { scale: 0.95 } : undefined}
          onClick={() => handleExport(exp.label, exp.action)}
          disabled={isBusy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40"
          style={{ backgroundColor: isBusy && activeExport === exp.label ? '#9ca3af' : exp.color }}
        >
          {isBusy && activeExport === exp.label ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <exp.icon className="w-3.5 h-3.5" />
          )}
          {exp.label}
        </motion.button>
      ))}

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <motion.button
        whileHover={!isBusy ? { scale: 1.05 } : undefined}
        whileTap={!isBusy ? { scale: 0.95 } : undefined}
        onClick={handleCopy}
        disabled={isBusy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-40"
      >
        {copied ? <Check className="w-3.5 h-3.5" style={{ color: PALETTE.turquoise }} /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copiado' : 'Copiar'}
      </motion.button>

      <motion.button
        whileHover={!isBusy ? { scale: 1.05 } : undefined}
        whileTap={!isBusy ? { scale: 0.95 } : undefined}
        onClick={handlePrint}
        disabled={isBusy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-40"
      >
        <Printer className="w-3.5 h-3.5" />
        Imprimir
      </motion.button>

      {onSave && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <motion.button
            whileHover={!isBusy ? { scale: 1.05 } : undefined}
            whileTap={!isBusy ? { scale: 0.95 } : undefined}
            onClick={onSave}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40"
            style={{ backgroundColor: PALETTE.orange }}
          >
            <Download className="w-3.5 h-3.5" />
            Guardar
          </motion.button>
        </>
      )}
    </div>
  );
}

function productToPlainText(product: PedagogicalProduct): string {
  const { metadata, data, type } = product;
  const lines: string[] = [];

  lines.push(metadata.title || 'Producto Educativo');
  if (metadata.subtitle) lines.push(metadata.subtitle);
  const meta: string[] = [];
  if (metadata.level) meta.push(`Nivel: ${metadata.level}`);
  if (metadata.subject) meta.push(`Asignatura: ${metadata.subject}`);
  if (metadata.oaCode) meta.push(`OA: ${metadata.oaCode}`);
  if (meta.length) lines.push(meta.join(' | '));
  lines.push('');

  const addValue = (key: string, val: unknown, indent = 0) => {
    const prefix = '  '.repeat(indent);
    if (typeof val === 'string' && val.trim()) {
      lines.push(`${prefix}${key.replace(/_/g, ' ')}: ${val}`);
    } else if (Array.isArray(val)) {
      lines.push(`${prefix}${key.replace(/_/g, ' ')}:`);
      val.forEach(item => {
        if (typeof item === 'string') lines.push(`${prefix}  • ${item}`);
        else if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          const text = Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(' | ');
          lines.push(`${prefix}  • ${text}`);
        }
      });
    }
  };

  Object.entries(data).forEach(([key, val]) => addValue(key, val));

  return lines.join('\n');
}

export { ProductActionBar };
