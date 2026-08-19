/**
 * WorkspaceLayout — Main workspace shell for Flujo Docente
 *
 * 70/30 split: left = DocumentEditor, right = AICopilotSidebar
 * Top bar with navigation, undo/redo, print, and export.
 */

import React, { useState, useCallback } from 'react';
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
  onExport?: () => void;
  onProductChange?: (updated: PedagogicalProduct) => void;
  className?: string;
}

export function WorkspaceLayout({
  product,
  resourceId,
  onBack,
  onExport,
  onProductChange,
  className,
}: WorkspaceLayoutProps) {
  const [activeProduct, setActiveProduct] = useState<PedagogicalProduct>(product);
  const [undoStack, setUndoStack] = useState<PedagogicalProduct[]>([]);
  const [redoStack, setRedoStack] = useState<PedagogicalProduct[]>([]);
  const [exporting, setExporting] = useState(false);

  const handleProductChange = useCallback((updated: PedagogicalProduct) => {
    setUndoStack(prev => [...prev, activeProduct]);
    setRedoStack([]);
    setActiveProduct(updated);
    onProductChange?.(updated);
  }, [activeProduct, onProductChange]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, activeProduct]);
    setUndoStack(u => u.slice(0, -1));
    setActiveProduct(prev);
    onProductChange?.(prev);
  }, [undoStack, activeProduct, onProductChange]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, activeProduct]);
    setRedoStack(r => r.slice(0, -1));
    setActiveProduct(next);
    onProductChange?.(next);
  }, [redoStack, activeProduct, onProductChange]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      onExport?.();
    } finally {
      setExporting(false);
    }
  }, [onExport]);

  const handleAIEdit = useCallback((updated: PedagogicalProduct) => {
    setUndoStack(prev => [...prev, activeProduct]);
    setRedoStack([]);
    setActiveProduct(updated);
    onProductChange?.(updated);
  }, [activeProduct, onProductChange]);

  return (
    <div className={`flex flex-col h-screen bg-slate-100 ${className || ''}`}>
      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 flex-shrink-0 z-20 print:hidden">
        {/* Left: Back button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
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
        {/* Left: Document editor (70%) */}
        <div className="flex-[7] min-w-0 overflow-y-auto bg-slate-100">
          <DocumentEditor
            product={activeProduct}
            onProductChange={handleProductChange}
          />
        </div>

        {/* Right: AI Copilot sidebar (30%) */}
        <div className="flex-[3] min-w-[320px] max-w-[420px] border-l border-gray-200 bg-white flex flex-col overflow-hidden print:hidden">
          <AICopilotSidebar
            product={activeProduct}
            resourceId={resourceId}
            onProductEdited={handleAIEdit}
          />
        </div>
      </div>
    </div>
  );
}
