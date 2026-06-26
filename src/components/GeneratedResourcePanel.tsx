import { useState } from 'react';
import { FileDown, Save, Presentation, ClipboardPlus, Undo2, CheckCircle2, AlertTriangle, Sparkles, FileText } from 'lucide-react';
import { IconBadge } from './ui/IconBadge';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { EmptyState } from './ui/EmptyState';

interface GeneratedResourcePanelProps {
  resultText: string;
  error?: string;
  onBack: () => void;
  onSave: () => void;
  onRegenerate: () => void;
}

function extractTitle(text: string): string | null {
  const firstLine = text.split('\n').find(l => l.startsWith('# '));
  return firstLine ? firstLine.replace(/^# /, '').trim() : null;
}

export function GeneratedResourcePanel({ resultText, error, onBack, onSave, onRegenerate }: GeneratedResourcePanelProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateEvaluation = () => {
    showToast('Próximamente podrás convertir este recurso en evaluación.');
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handlePresentation = () => {
    showToast('Modo presentación próximamente disponible.');
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

  if (!resultText && !error) {
    return (
      <EmptyState
        icon={FileText}
        title="Aún no hay recurso generado"
        description="Completa el flujo de Biblioteca Creativa para crear una propuesta pedagógica."
        action={
          <Button variant="primary" size="md" onClick={onBack}>
            Volver a Biblioteca Creativa
          </Button>
        }
      />
    );
  }

  const title = extractTitle(resultText);
  const contentLines = resultText.split('\n');
  const bodyLines = title ? contentLines.filter(l => !l.startsWith('# ') || l !== contentLines[0]) : contentLines;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium animate-scale-in">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      {/* Document header */}
      <Card variant="elevated" className="p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <IconBadge icon={Sparkles} size="lg" color="#4f46e5" variant="gradient" className="flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge color="indigo" size="sm">Recurso generado</Badge>
                <Badge color="green" size="sm" dot>Listo para revisar</Badge>
              </div>
              <h2 className="text-lg font-bold text-gray-900 truncate">{title || 'Recurso pedagógico generado'}</h2>
            </div>
          </div>
          <Button variant="ghost" size="sm" iconLeft={Undo2} onClick={onBack}>
            Volver a editar
          </Button>
        </div>
      </Card>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Button variant="premium" size="sm" iconLeft={FileDown} onClick={handleExportPDF}>
          Exportar PDF
        </Button>
        <Button variant="secondary" size="sm" iconLeft={Save} onClick={onSave}>
          Guardar en biblioteca
        </Button>
        <Button variant="outline" size="sm" iconLeft={Presentation} onClick={handlePresentation}>
          Presentación
        </Button>
        <Button variant="outline" size="sm" iconLeft={ClipboardPlus} onClick={handleCreateEvaluation}>
          Crear evaluación
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCopyContent}>
          {copied ? 'Copiado' : 'Copiar contenido'}
        </Button>
      </div>

      {/* Error bar */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-sm text-amber-800 flex items-start gap-3 animate-slide-up">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-medium">Error parcial:</span> {error} — Se ha usado una versión preliminar.
          </div>
          <Button variant="danger" size="sm" onClick={onRegenerate}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Document body */}
      <Card variant="elevated" className="p-4 sm:p-6 lg:p-8 xl:p-10">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8 lg:p-10 xl:p-12">
          <div className="max-w-none text-slate-800 leading-relaxed space-y-1">
            {bodyLines.map((line, i) => {
              if (line.startsWith('# ')) {
                return <h1 key={i} className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100 tracking-tight">{line.replace(/^# /, '')}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-100 tracking-tight">{line.replace(/^## /, '')}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={i} className="text-base font-semibold text-gray-900 mt-6 mb-3">{line.replace(/^### /, '')}</h3>;
              }
              if (line.startsWith('- ')) {
                return (
                  <ul key={i} className="list-disc ml-6 text-sm sm:text-base text-slate-700 leading-relaxed mb-1">
                    <li>{line.replace(/^- /, '')}</li>
                  </ul>
                );
              }
              if (/^\d+\.\s/.test(line)) {
                const content = line.replace(/^\d+\.\s/, '');
                return (
                  <ol key={i} className="list-decimal ml-6 text-sm sm:text-base text-slate-700 leading-relaxed mb-1">
                    <li>{content}</li>
                  </ol>
                );
              }
              if (line.startsWith('| ')) {
                return null;
              }
              if (line.trim() === '---' || line.trim() === '***') {
                return <hr key={i} className="my-8 border-gray-200" />;
              }
              if (line.trim() === '') {
                return <div key={i} className="h-3 sm:h-4" />;
              }
              const html = line
                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em class="text-slate-600">$1</em>');
              return <p key={i} className="text-sm sm:text-base text-slate-700 leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: html }} />;
            })}
          </div>
        </div>
      </Card>

      {/* Footer action */}
      <div className="flex justify-center mt-8 mb-4">
        <Button variant="ghost" size="sm" iconLeft={Undo2} onClick={onBack}>
          Volver a editar
        </Button>
      </div>
    </div>
  );
}
