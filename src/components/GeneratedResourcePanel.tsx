import { useState } from 'react';
import { ArrowLeft, FileDown, Save, Presentation, ClipboardPlus, Undo2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { IconBadge } from './ui/IconBadge';

interface GeneratedResourcePanelProps {
  resultText: string;
  error?: string;
  onBack: () => void;
  onSave: () => void;
  onRegenerate: () => void;
}

export function GeneratedResourcePanel({ resultText, error, onBack, onSave, onRegenerate }: GeneratedResourcePanelProps) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateEvaluation = () => {
    showToast('Proximamente podras convertir este recurso en evaluacion.');
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handlePresentation = () => {
    showToast('Modo presentacion proximamente disponible.');
  };

  return (
    <div className="max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm flex items-center gap-1.5 text-sm">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex-1 min-w-[1px]" />
        <button onClick={handleExportPDF} className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm">
          <FileDown size={16} strokeWidth={2.25} /> Exportar PDF
        </button>
        <button onClick={onSave} className="p-2.5 rounded-xl bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-1.5 text-sm font-medium">
          <Save size={16} strokeWidth={2.25} /> Guardar en biblioteca
        </button>
        <button onClick={handlePresentation} className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm">
          <Presentation size={16} strokeWidth={2.25} /> Presentacion
        </button>
        <button onClick={handleCreateEvaluation} className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm">
          <ClipboardPlus size={16} strokeWidth={2.25} /> Crear evaluacion
        </button>
        <button onClick={onBack} className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm">
          <Undo2 size={16} strokeWidth={2.25} /> Volver a editar
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-start gap-3">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-medium">Error parcial:</span> {error} — Se ha usado una version preliminar.
          </div>
          <button onClick={onRegenerate} className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-medium transition-colors">
            Reintentar
          </button>
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 lg:p-10">
          <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
            {resultText.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return <h1 key={i} className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">{line.replace(/^# /, '')}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3 pb-2 border-b border-gray-100">{line.replace(/^## /, '')}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={i} className="text-base font-semibold text-gray-800 mt-5 mb-2">{line.replace(/^### /, '')}</h3>;
              }
              if (line.startsWith('- ')) {
                return <li key={i} className="text-sm ml-5 pl-1 text-gray-700 leading-relaxed">{line.replace(/^- /, '')}</li>;
              }
              if (line.startsWith('| ')) {
                return null;
              }
              if (line.trim() === '') {
                return <div key={i} className="h-3" />;
              }
              const html = line
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>');
              return <p key={i} className="text-sm text-gray-700 leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: html }} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
