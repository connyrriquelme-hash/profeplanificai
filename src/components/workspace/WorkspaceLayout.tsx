/**
 * WorkspaceLayout — Main workspace shell for Flujo Docente
 *
 * 70/30 split: left = content, right = AICopilotSidebar
 * Top bar with navigation, undo/redo, print, and export.
 *
 * Supports two modes:
 * - 'document' (default): Tiptap editor for Word-like products
 * - 'ppt': Slide grid for PPT presentations
 */

import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Printer,
  Download,
  FileText,
  Presentation,
  Save,
  Loader2,
  Palette,
  Share2,
  Copy,
  Check,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { DocumentEditor, productToHtml } from './DocumentEditor';
import { AICopilotSidebar } from './AICopilotSidebar';
import { QualityReviewPanel } from './QualityReviewPanel';
import { PresentacionRenderer } from '../products/renderers/PresentacionRenderer';
import type { PedagogicalProduct } from '../products/types';
import { exportProductToWord, exportProductToPptx } from '../../services/productExportService';
import { shareFromWorkspace } from '../../services/sharedDocumentService';
import { api } from '../../services/apiClient';

/** HTML del producto -> texto plano, para Compartir/Copiar (que no quieren
 * markup, solo el contenido legible como lo ve el docente). */
function productToPlainText(product: PedagogicalProduct): string {
  const div = document.createElement('div');
  div.innerHTML = productToHtml(product);
  return (div.innerText || div.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

// Konva/react-konva son pesados (~300KB) y solo los necesita quien entra a
// modo "Diseño"; cargarlos eager infla el chunk del workspace aunque nunca
// se abra el editor visual.
const ProductCanvasEditor = lazy(() => import('../products/canvas/ProductCanvasEditor').then(m => ({ default: m.ProductCanvasEditor })));

const PALETTE = {
  primary: '#B5471F',
  primaryHover: '#9A3A17',
  primaryTint: '#FEF3E2',
  primaryInk: '#7C2F13',
  accentHoney: '#E9A13B',
  purple: '#7F58A6',
} as const;

interface WorkspaceLayoutProps {
  product: PedagogicalProduct;
  resourceId?: string;
  onBack?: () => void;
  onSave?: () => void | Promise<void>;
  onProductChange?: (updated: PedagogicalProduct) => void;
  qualityReport?: {
    status: 'ready' | 'draft' | 'blocked';
    score: number;
    issues: Array<{ severity: 'error' | 'warning'; message: string }>;
  };
  mode?: 'document' | 'ppt';
  className?: string;
}

export function WorkspaceLayout({
  product,
  resourceId,
  onBack,
  onSave,
  onProductChange,
  qualityReport,
  mode = 'document',
  className,
}: WorkspaceLayoutProps) {
  const [activeProduct, setActiveProduct] = useState<PedagogicalProduct>(product);
  const [undoStack, setUndoStack] = useState<PedagogicalProduct[]>([]);
  const [redoStack, setRedoStack] = useState<PedagogicalProduct[]>([]);
  const [exporting, setExporting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingPptx, setExportingPptx] = useState(false);
  const [contentMode, setContentMode] = useState<'content' | 'diseno'>('content');
  const [sharing, setSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{ shareUrl: string; copied: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  // Avisa antes de cerrar/recargar la pestaña si hay cambios sin guardar
  // (edicion manual o de la IA que el docente aun no exporto/guardo).
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleProductChange = useCallback((updated: PedagogicalProduct) => {
    setUndoStack(prev => [...prev, activeProduct]);
    setRedoStack([]);
    setActiveProduct(updated);
    setIsDirty(true);
    onProductChange?.(updated);
  }, [activeProduct, onProductChange]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, activeProduct]);
    setUndoStack(u => u.slice(0, -1));
    setActiveProduct(prev);
    setIsDirty(true);
    onProductChange?.(prev);
  }, [undoStack, activeProduct, onProductChange]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, activeProduct]);
    setRedoStack(r => r.slice(0, -1));
    setActiveProduct(next);
    setIsDirty(true);
    onProductChange?.(next);
  }, [redoStack, activeProduct, onProductChange]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleWordExport = useCallback(async () => {
    setExportingWord(true);
    try {
      await exportProductToWord(activeProduct);
    } catch (err) {
      console.error('Error exporting Word:', err);
    } finally {
      setExportingWord(false);
    }
  }, [activeProduct]);

  const handlePptxExport = useCallback(async () => {
    setExportingPptx(true);
    try {
      await exportProductToPptx(activeProduct);
    } catch (err) {
      console.error('Error exporting PPTX:', err);
    } finally {
      setExportingPptx(false);
    }
  }, [activeProduct]);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const { doc, shareUrl } = shareFromWorkspace({
        title: activeProduct.metadata.title || 'Sin titulo',
        content: productToPlainText(activeProduct),
        nivel: activeProduct.metadata.level,
        asignatura: activeProduct.metadata.subject,
        oa: activeProduct.metadata.oaText || activeProduct.metadata.oaCode,
      });
      try {
        await api.post('/api/data/shared-documents', {
          id: doc.id,
          shareToken: doc.shareToken,
          ownerName: 'Docente',
          title: doc.title,
          content: doc.content,
          sourceType: doc.sourceType,
          sourceId: doc.sourceId,
          visibility: 'shared',
          permission: doc.permission,
        });
      } catch {
        // Sincronizacion a la nube fallo -- el link local (shareFromWorkspace,
        // ya persistido) sigue funcionando para quien tenga este navegador.
      }
      setShareResult({ shareUrl, copied: false });
    } finally {
      setSharing(false);
    }
  }, [activeProduct]);

  const handleCopyShareUrl = useCallback(async () => {
    if (!shareResult) return;
    try {
      await navigator.clipboard.writeText(shareResult.shareUrl);
      setShareResult(r => (r ? { ...r, copied: true } : r));
      setTimeout(() => setShareResult(r => (r ? { ...r, copied: false } : r)), 2000);
    } catch {
      // Clipboard no disponible -- el input readOnly con el link sigue visible para copiar a mano.
    }
  }, [shareResult]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(productToPlainText(activeProduct));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard no disponible -- sin fallback visual, el docente puede seleccionar el texto a mano.
    }
  }, [activeProduct]);

  const handleSave = useCallback(async () => {
    setExporting(true);
    try {
      await onSave?.();
      setIsDirty(false);
    } finally {
      setExporting(false);
    }
  }, [onSave]);

  const handleBack = useCallback(() => {
    if (isDirty && !window.confirm('Tienes cambios sin guardar. ¿Salir de todos modos?')) {
      return;
    }
    onBack?.();
  }, [isDirty, onBack]);

  const handleAIEdit = useCallback((updated: PedagogicalProduct) => {
    // La IA modifica los campos estructurados (data.*), no el HTML editado a mano.
    // Si dejamos editedHtml, DocumentEditor seguiria mostrando la version manual
    // vieja y el cambio de la IA quedaria invisible aunque se aplico de verdad.
    const { editedHtml: _discarded, ...restData } = updated.data;
    const withoutManualOverride: PedagogicalProduct = { ...updated, data: restData };
    setUndoStack(prev => [...prev, activeProduct]);
    setRedoStack([]);
    setActiveProduct(withoutManualOverride);
    setIsDirty(true);
    onProductChange?.(withoutManualOverride);
  }, [activeProduct, onProductChange]);

  return (
    <div className={`flex flex-col h-screen bg-slate-100 ${className || ''}`}>
      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-[var(--border)] flex-shrink-0 z-20 print:hidden">
        {/* Left: Back button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="hidden sm:block h-5 w-px bg-gray-200" />
          <h1 className="text-sm font-semibold text-[var(--ink)] truncate max-w-[200px] sm:max-w-[400px]">
            {activeProduct.metadata.title || 'Sin titulo'}
          </h1>
        </div>

        {/* Center: Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Rehacer (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Print + Export Word/PPTX + Save */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-mid)] hover:bg-gray-100 transition-colors"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden lg:inline">Imprimir</span>
          </button>
          <button
            type="button"
            onClick={handleWordExport}
            disabled={exportingWord}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-mid)] hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Exportar Word"
          >
            {exportingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">Word</span>
          </button>
          <button
            type="button"
            onClick={handlePptxExport}
            disabled={exportingPptx}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-mid)] hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Exportar PowerPoint"
          >
            {exportingPptx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Presentation className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">PPTX</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-mid)] hover:bg-gray-100 transition-colors"
            title="Copiar contenido"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-mid)] hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Compartir"
          >
            {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">Compartir</span>
          </button>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <motion.button
            type="button"
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: PALETTE.primary }}
            title="Guardar en biblioteca"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden md:inline">Guardar</span>
          </motion.button>
        </div>
      </header>

      {/* ── Workspace body: 70/30 split ──────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Content area (70%) */}
        <div className="flex-[7] min-w-0 overflow-y-auto bg-slate-100 flex flex-col">
          <div className="flex items-center gap-1 p-1 m-3 mb-0 w-fit bg-white border border-[var(--border)] rounded-lg print:hidden">
            <button
              type="button"
              onClick={() => setContentMode('content')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                contentMode === 'content'
                  ? 'bg-slate-100 text-[var(--ink)]'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              {mode === 'ppt' ? <Presentation className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              {mode === 'ppt' ? 'Presentación' : 'Documento'}
            </button>
            <button
              type="button"
              onClick={() => setContentMode('diseno')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                contentMode === 'diseno'
                  ? 'bg-slate-100 text-[var(--ink)]'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Diseño
            </button>
          </div>

          {contentMode === 'diseno' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-16 text-[var(--ink-mute)]"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando editor de diseño…</div>}>
              <ProductCanvasEditor
                product={activeProduct}
                onProductChange={handleProductChange}
              />
            </Suspense>
          ) : mode === 'ppt' ? (
            <div className="p-4">
              <PresentacionRenderer product={activeProduct} />
            </div>
          ) : (
            <DocumentEditor
              product={activeProduct}
              onProductChange={handleProductChange}
            />
          )}
        </div>

        {/* Right: AI Copilot sidebar (30%) */}
        <div className="flex-[3] min-w-[320px] max-w-[420px] border-l border-[var(--border)] bg-white flex flex-col overflow-hidden print:hidden">
          {qualityReport && <QualityReviewPanel
            status={qualityReport.status}
            score={qualityReport.score}
            issues={qualityReport.issues}
          />}
          <AICopilotSidebar
            product={activeProduct}
            resourceId={resourceId}
            reviewInstruction={qualityReport && qualityReport.status !== 'ready'
              ? `Corrige estas observaciones de calidad pedagógica: ${qualityReport.issues.map((issue) => issue.message).join(' ')} Mantén el OA, el nivel, la asignatura y la intención original.`
              : undefined}
            onProductEdited={handleAIEdit}
          />
        </div>
      </div>

      {shareResult && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShareResult(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: PALETTE.primaryTint }}>
                  <Share2 size={18} style={{ color: PALETTE.primary }} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--ink)]">Recurso compartido</h3>
                  <p className="text-xs text-gray-400">Copia el enlace para compartir</p>
                </div>
              </div>
              <button type="button" onClick={() => setShareResult(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 mb-4">
              <LinkIcon size={14} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={shareResult.shareUrl}
                readOnly
                className="flex-1 bg-transparent text-xs text-[var(--ink-mid)] outline-none border-none p-0"
              />
              <button
                type="button"
                onClick={handleCopyShareUrl}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${shareResult.copied ? 'bg-green-100 text-green-700' : 'bg-[var(--primary-tint)] text-[var(--primary-ink)] hover:brightness-95'}`}
              >
                {shareResult.copied ? <><Check size={12} className="inline mr-1" />Copiado</> : 'Copiar'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShareResult(null)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--ink-mid)] text-sm font-semibold hover:bg-gray-50 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
