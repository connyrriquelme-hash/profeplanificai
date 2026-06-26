import { useState } from 'react';
import { ArrowLeft, FileDown, Save, Presentation, ClipboardPlus, Undo2, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

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

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('No se pudo copiar el contenido.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium animate-scale-in">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <button onClick={onBack} className="p-2.5 rounded-2xl bg-white border border-gray-200/80 text-gray-500 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm font-medium">
          <ArrowLeft size={16} strokeWidth={2.25} />
          <span className="hidden sm:inline">Volver</span>
        </button>
        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />
        <button onClick={handleCopyContent} className={`p-2.5 rounded-2xl border transition-all shadow-sm flex items-center gap-1.5 text-sm ${copied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200/80 text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}>
          {copied ? <CheckCircle2 size={16} strokeWidth={2.25} /> : <FileDown size={16} strokeWidth={2.25} />}
          <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
        </button>
        <button onClick={handleExportPDF} className="p-2.5 rounded-2xl bg-white border border-gray-200/80 text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm">
          <FileDown size={16} strokeWidth={2.25} /> PDF
        </button>
        <button onClick={onSave} className="p-2.5 rounded-2xl bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200/40 flex items-center gap-1.5 text-sm font-semibold">
          <Save size={16} strokeWidth={2.25} />
          <span className="hidden sm:inline">Guardar</span>
        </button>
        <button onClick={handlePresentation} className="p-2.5 rounded-2xl bg-white border border-gray-200/80 text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm">
          <Presentation size={16} strokeWidth={2.25} /> Presentar
        </button>
        <button onClick={handleCreateEvaluation} className="p-2.5 rounded-2xl bg-white border border-gray-200/80 text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm">
          <ClipboardPlus size={16} strokeWidth={2.25} /> Evaluación
        </button>
        <button onClick={onBack} className="p-2.5 rounded-2xl bg-white border border-gray-200/80 text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm">
          <Undo2 size={16} strokeWidth={2.25} /> Editar
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-sm text-amber-800 flex items-start gap-3 animate-slide-up">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-medium">Error parcial:</span> {error} — Se ha usado una version preliminar.
          </div>
          <button onClick={onRegenerate} className="flex-shrink-0 px-4 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold transition-colors">
            Reintentar
          </button>
        </div>
      )}

      <div className="bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-gray-200/70 shadow-sm p-4 sm:p-6 lg:p-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-200/50 p-6 sm:p-8 lg:p-12">
          <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
            {resultText.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return <h1 key={i} className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 tracking-tight">{line.replace(/^# /, '')}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-lg font-bold text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-50 tracking-tight">{line.replace(/^## /, '')}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={i} className="text-base font-semibold text-gray-800 mt-6 mb-2">{line.replace(/^### /, '')}</h3>;
              }
              if (line.startsWith('- ')) {
                return <li key={i} className="text-sm ml-5 pl-1.5 text-gray-700 leading-relaxed marker:text-gray-300">{line.replace(/^- /, '')}</li>;
              }
              if (line.startsWith('| ')) {
                return null;
              }
              if (line.trim() === '') {
                return <div key={i} className="h-3" />;
              }
              const html = line
                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em class="text-gray-600">$1</em>');
              return <p key={i} className="text-sm text-gray-700 leading-relaxed mb-1.5" dangerouslySetInnerHTML={{ __html: html }} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
