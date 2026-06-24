import { Check, Copy, Download, Printer, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { exportarDocumento } from '../../utils/exportUtils';
import { mdToHtml } from '../../utils/htmlUtils';

interface ResultActionsProps {
  contenido: string;
  titulo?: string;
  nivel?: string;
  asignatura?: string;
  oa?: string;
  tipo?: string;
  onGuardar?: () => void;
  onLimpiar?: () => void;
}

export function ResultActions({ contenido, titulo = 'Documento', nivel, asignatura, oa, tipo, onGuardar, onLimpiar }: ResultActionsProps) {
  const [copied, setCopied] = useState(false);

  if (!contenido) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contenido);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = contenido;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="btnrow no-print" style={{ flexWrap: 'wrap', gap: 6 }}>
      <button className="secondary" onClick={handleCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
      <button className="ghost" onClick={() => exportarDocumento({ contenido, action: 'html', titulo, nivel, asignatura, oa, tipo })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Download size={14} /> HTML
      </button>
      <button className="ghost" onClick={() => exportarDocumento({ contenido, action: 'txt', titulo })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Download size={14} /> TXT
      </button>
      <button className="ghost" onClick={() => exportarDocumento({ contenido, action: 'print', titulo, nivel, asignatura, oa, tipo })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Printer size={14} /> Imprimir / PDF
      </button>
      {onGuardar && (
        <button className="primary" onClick={onGuardar} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Check size={14} /> Guardar
        </button>
      )}
      {onLimpiar && (
        <button className="danger" onClick={onLimpiar} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Trash2 size={14} /> Limpiar
        </button>
      )}
    </div>
  );
}
