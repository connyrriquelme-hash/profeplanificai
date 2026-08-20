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

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Printer,
  Download,
  Loader2,
} from 'lucide-react';
import { DocumentEditor } from './DocumentEditor';
import { AICopilotSidebar } from './AICopilotSidebar';
import { QualityReviewPanel } from './QualityReviewPanel';
import { PresentacionRenderer } from '../products/renderers/PresentacionRenderer';
import type { PedagogicalProduct } from '../products/types';

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
  onExport?: () => void | Promise<void>;
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
  onExport,
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

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await onExport?.();
      setIsDirty(false);
    } finally {
      setExporting(false);
    }
  }, [onExport]);

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
      <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 flex-shrink-0 z-20 print:hidden">
        {/* Left: Back button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="hidden sm:block h-5 w-px bg-gray-200" />
          <h1 className="text-sm font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-[400px]">
            {activeProduct.metadata.title || 'Sin titulo'}
          </h1>
        </div>

        {/* Center: Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Rehacer (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Print + Export */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline">Imprimir</span>
          </button>
          <motion.button
            type="button"
            onClick={handleExport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: PALETTE.primary }}
            title="Exportar"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden md:inline">Exportar</span>
          </motion.button>
        </div>
      </header>

      {/* ── Workspace body: 70/30 split ──────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Content area (70%) */}
        <div className="flex-[7] min-w-0 overflow-y-auto bg-slate-100">
          {mode === 'ppt' ? (
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
        <div className="flex-[3] min-w-[320px] max-w-[420px] border-l border-gray-200 bg-white flex flex-col overflow-hidden print:hidden">
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
    </div>
  );
}
