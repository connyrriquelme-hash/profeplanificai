import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { FileDown, Save, Presentation, ClipboardPlus, Undo2, CheckCircle2, AlertTriangle, Sparkles, FileText, Share2, Download, ImagePlus, FileSpreadsheet, PanelRightOpen } from 'lucide-react';
import { IconBadge } from './ui/IconBadge';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { SlideLessonPreview } from './SlideLessonPreview';
import { SlideAssistant } from './SlideAssistant';
import type { SlideLesson } from '../types/slideLesson';
import type { VisualLessonDeck } from '../types/presentation';
import { normalizeLessonSlidesToVisualDeck } from '../services/presentationAdapter';
import { buildSaveMetadata, saveSlideDeckToCloud, saveSlideDeckLocally, shareSlideDeck } from '../services/slideSaveService';
import { downloadPPTX } from '../services/pptxExportService';

interface GeneratedResourcePanelProps {
  resultText: string;
  error?: string;
  onBack: () => void;
  onSave: () => void;
  onRegenerate: () => void;
  slideLesson?: SlideLesson;
  creativeImage?: string | null;
}

function extractTitle(text: string): string | null {
  const firstLine = text.split('\n').find(l => l.startsWith('# '));
  return firstLine ? firstLine.replace(/^# /, '').trim() : null;
}

function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMarkdownLine(line: string): React.ReactNode {
  const sanitized = sanitizeHtml(line);
  const html = sanitized
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#081849] font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[#081849] italic opacity-80">$1</em>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

interface ParsedTable {
  headers: string[];
  rows: string[][];
}

function parseMarkdownTable(lines: string[]): ParsedTable {
  const headers: string[] = [];
  const rows: string[][] = [];

  lines.forEach((line, idx) => {
    const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
    if (idx === 0) {
      headers.push(...cells);
    } else if (cells.every(c => /^[-:]+$/.test(c))) {
      return;
    } else {
      rows.push(cells);
    }
  });

  return { headers, rows };
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const { headers, rows } = parseMarkdownTable(lines);

  return (
    <div className="overflow-x-auto my-4 rounded-xl border border-theme-gray/30 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-theme-primary/5 border-b border-theme-gray/30">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold text-[#081849] whitespace-nowrap">
                {renderMarkdownLine(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-theme-gray/20 last:border-0 hover:bg-theme-beige/50 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-[#081849] whitespace-nowrap">
                  {renderMarkdownLine(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GeneratedResourcePanel({ resultText, error, onBack, onSave, onRegenerate, slideLesson, creativeImage }: GeneratedResourcePanelProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [deck, setDeck] = useState<VisualLessonDeck | null>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  // Convert SlideLesson to VisualLessonDeck when slideLesson changes
  useEffect(() => {
    if (slideLesson) {
      setDeck(normalizeLessonSlidesToVisualDeck(slideLesson));
    }
  }, [slideLesson]);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const handleCreateEvaluation = () => {
    showToast('Próximamente podrás convertir este recurso en evaluación.');
  };

  const handleExportPDF = useCallback(async () => {
    if (slideLesson) {
      try {
        showToast('Generando PDF...');
        const { exportElementToPDF } = await import('../utils/exportPdf');
        const el = slideContainerRef.current?.querySelector('[style*="aspect-ratio: 16 / 9"]');
        if (el && el instanceof HTMLElement) {
          const id = 'slide-export-' + Date.now();
          el.id = id;
          await exportElementToPDF(id, `presentacion-${slideLesson.title?.slice(0, 30) || 'leccion'}.pdf`);
          el.id = '';
        } else {
          window.print();
        }
      } catch {
        window.print();
      }
    } else {
      window.print();
    }
  }, [slideLesson]);

  const handleExportPPTX = useCallback(async () => {
    if (!slideLesson) return;
    try {
      showToast('Generando PPTX...');
      const imagesRecord: Record<string, string> = {};
      if (deck?.slides) {
        deck.slides.forEach((slide, index) => {
          if (slide.visual?.imageUrl) {
            imagesRecord[String(index)] = slide.visual.imageUrl;
          }
        });
      }
      await downloadPPTX(slideLesson, imagesRecord);
      showToast('PPTX descargado');
    } catch {
      showToast('Error al generar PPTX');
    }
  }, [slideLesson, deck]);

  const handleShare = useCallback(async () => {
    if (!slideLesson) {
      showToast('Compartir disponible solo para presentaciones visuales.');
      return;
    }
    try {
      showToast('Preparando enlace...');
      const metadata = buildSaveMetadata(slideLesson);
      const result = await shareSlideDeck(slideLesson, metadata);
      if (result.ok && result.shareUrl) {
        await navigator.clipboard.writeText(result.shareUrl);
        showToast('Enlace copiado al portapapeles');
      } else {
        showToast(result.error || 'Error al compartir');
      }
    } catch {
      showToast('Error al compartir');
    }
  }, [slideLesson]);

  const handleSave = useCallback(async () => {
    if (slideLesson) {
      try {
        const metadata = buildSaveMetadata(slideLesson);
        await saveSlideDeckToCloud(slideLesson, metadata);
      } catch {
        // Cloud save is best-effort
      }
      saveSlideDeckLocally(slideLesson);
    }
    onSave();
  }, [slideLesson, onSave]);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('No se pudo copiar el contenido.');
    }
  };

  const handleUpdatePresentation = useCallback((updated: VisualLessonDeck) => {
    setDeck(updated);
    showToast('Presentación actualizada por el asistente');
  }, [showToast]);

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
    <div className="flex h-full">
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto animate-fade-in p-6">
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
        <Button variant="secondary" size="sm" iconLeft={FileSpreadsheet} onClick={handleExportPPTX}>
          Exportar PPTX
        </Button>
        <Button variant="secondary" size="sm" iconLeft={Save} onClick={handleSave}>
          Guardar en biblioteca
        </Button>
        {slideLesson && (
          <Button variant="outline" size="sm" iconLeft={Share2} onClick={handleShare}>
            Compartir
          </Button>
        )}
        <Button variant="outline" size="sm" iconLeft={Presentation} onClick={() => { const btn = document.querySelector('[aria-label="Presentar"]') as HTMLButtonElement; btn?.click(); }}>
          Presentación
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCopyContent}>
          {copied ? 'Copiado' : 'Copiar contenido'}
        </Button>
        {slideLesson && (
          <Button
            variant={assistantOpen ? 'primary' : 'outline'}
            size="sm"
            iconLeft={PanelRightOpen}
            onClick={() => setAssistantOpen(!assistantOpen)}
          >
            Asistente IA
          </Button>
        )}
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

      {/* Creative Image */}
      {creativeImage && (
        <Card variant="elevated" className="mb-6 p-0 overflow-hidden">
          <div className="relative" style={{ aspectRatio: '16 / 9' }}>
            <img src={creativeImage} alt="Imagen generada por IA" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 right-0 m-3 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                iconLeft={Download}
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = creativeImage;
                  a.download = 'imagen-ia-educativa.png';
                  a.click();
                }}
                className="bg-white/90 backdrop-blur"
              >
                Descargar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={ImagePlus}
                onClick={() => {
                  // Regenerate image - will need to be handled by parent
                }}
                className="bg-white/90 backdrop-blur"
              >
                Regenerar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Document body */}
      {slideLesson ? (
        <Card variant="elevated" className="p-4 sm:p-6">
          <div ref={slideContainerRef}>
            <SlideLessonPreview lesson={slideLesson} onExportPDF={handleExportPDF} onSave={handleSave} onShare={handleShare} />
          </div>
        </Card>
      ) : (
        <Card variant="elevated" className="p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8 lg:p-10 xl:p-12">
            <div className="max-w-none text-[#081849] leading-relaxed space-y-1">
              {(() => {
                const elements: React.ReactNode[] = [];
                let i = 0;

                while (i < bodyLines.length) {
                  const line = bodyLines[i];

                  if (line.startsWith('| ')) {
                    const tableLines: string[] = [];
                    while (i < bodyLines.length && bodyLines[i].startsWith('| ')) {
                      tableLines.push(bodyLines[i]);
                      i++;
                    }
                    elements.push(<MarkdownTable key={`table-${elements.length}`} lines={tableLines} />);
                  } else {
                    if (line.startsWith('# ')) {
                      elements.push(<h1 key={i} className="text-2xl sm:text-3xl font-bold text-[#081849] mb-6 pb-4 border-b border-gray-100 tracking-tight">{line.replace(/^# /, '')}</h1>);
                    } else if (line.startsWith('## ')) {
                      elements.push(<h2 key={i} className="text-xl font-bold text-[#081849] mt-8 mb-4 pb-2 border-b border-gray-100 tracking-tight">{line.replace(/^## /, '')}</h2>);
                    } else if (line.startsWith('### ')) {
                      elements.push(<h3 key={i} className="text-base font-semibold text-[#081849] mt-6 mb-3">{line.replace(/^### /, '')}</h3>);
                    } else if (line.startsWith('- ')) {
                      elements.push(
                        <ul key={i} className="list-disc ml-6 text-sm sm:text-base text-[#081849] leading-relaxed mb-1">
                          <li>{line.replace(/^- /, '')}</li>
                        </ul>
                      );
                    } else if (/^\d+\.\s/.test(line)) {
                      const content = line.replace(/^\d+\.\s/, '');
                      elements.push(
                        <ol key={i} className="list-decimal ml-6 text-sm sm:text-base text-[#081849] leading-relaxed mb-1">
                          <li>{content}</li>
                        </ol>
                      );
                    } else if (line.trim() === '---' || line.trim() === '***') {
                      elements.push(<hr key={i} className="my-8 border-gray-200" />);
                    } else if (line.trim() === '') {
                      elements.push(<div key={i} className="h-3 sm:h-4" />);
                    } else {
                      elements.push(<p key={i} className="text-sm sm:text-base text-[#081849] leading-relaxed mb-2">{renderMarkdownLine(line)}</p>);
                    }
                    i++;
                  }
                }

                return elements;
              })()}
            </div>
          </div>
        </Card>
      )}

      {/* Footer action */}
      <div className="flex justify-center mt-8 mb-4">
        <Button variant="ghost" size="sm" iconLeft={Undo2} onClick={onBack}>
          Volver a editar
        </Button>
      </div>
        </div>
      </div>

      {/* Slide Assistant Sidebar */}
      {deck && (
        <SlideAssistant
          currentPresentation={deck}
          onUpdatePresentation={handleUpdatePresentation}
          isOpen={assistantOpen}
          onToggle={() => setAssistantOpen(!assistantOpen)}
        />
      )}
    </div>
  );
}
