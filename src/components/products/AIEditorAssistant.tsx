/**
 * AIEditorAssistant — Chat-style AI editing panel
 *
 * Lets users send natural-language instructions to modify a product.
 * Shows edit history, allows undo, and highlights changes.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, RotateCcw, Check, AlertTriangle, Loader2, ChevronDown, ChevronUp, Undo2 } from 'lucide-react';
import { api } from '../../services/apiClient';
import type { PedagogicalProduct } from './types';

interface AIEditorAssistantProps {
  product: PedagogicalProduct;
  resourceId?: string;
  onProductUpdated: (updated: PedagogicalProduct, explanation: string) => void;
  className?: string;
}

interface EditHistoryEntry {
  id: number;
  instruction: string;
  explanation: string;
  camposModificados: string[];
  timestamp: Date;
  previousProduct: PedagogicalProduct;
}

const PALETTE = {
  turquoise: '#06BFAD',
  fuchsia: '#F24162',
  orange: '#F2A413',
  purple: '#7F58A6',
} as const;

const QUICK_ACTIONS = [
  { label: 'Simplificar lenguaje', instruction: 'Simplifica el lenguaje de todo el producto para que sea mas facil de entender' },
  { label: 'Agregar actividades', instruction: 'Agrega 2 actividades complementarias relevantes al producto' },
  { label: 'Mas ejemplos', instruction: 'Agrega ejemplos concretos y practicos al contenido' },
  { label: 'Corregir ortografia', instruction: 'Corrige cualquier error de ortografia o gramatica en todo el producto' },
  { label: 'Hacer mas corto', instruction: 'Reduce el contenido eliminando repeticiones y haciendo el texto mas conciso' },
  { label: 'Agregar evaluacion', instruction: 'Agrega una seccion de evaluacion con criterios claros' },
];

export function AIEditorAssistant({ product, resourceId, onProductUpdated, className }: AIEditorAssistantProps) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  const handleEdit = useCallback(async (instruccion: string) => {
    if (!instruccion.trim() || loading) return;

    setLoading(true);
    setError('');
    setInstruction('');

    try {
      const response = await api.post<{
        ok: boolean;
        productoModificado: Record<string, unknown>;
        explicacion: string;
        camposModificados: string[];
      }>('/api/materials/edit-product', {
        instruccion: instruccion.trim(),
        producto: product,
        resourceId,
      });

      if (!response.ok) {
        throw new Error('No se pudo aplicar el cambio');
      }

      const updatedProduct: PedagogicalProduct = {
        ...product,
        ...(response.productoModificado as Partial<PedagogicalProduct>),
        data: (response.productoModificado as Record<string, unknown>).data as Record<string, unknown> || product.data,
      };

      const entry: EditHistoryEntry = {
        id: Date.now(),
        instruction: instruccion.trim(),
        explanation: response.explicacion,
        camposModificados: response.camposModificados || [],
        timestamp: new Date(),
        previousProduct: { ...product },
      };

      setHistory(prev => [...prev, entry]);
      onProductUpdated(updatedProduct, response.explicacion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aplicar el cambio. Intentalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [product, resourceId, loading, onProductUpdated]);

  const handleUndo = useCallback((entry: EditHistoryEntry) => {
    onProductUpdated(entry.previousProduct, `Deshacer: ${entry.explanation}`);
    setHistory(prev => prev.filter(h => h.id !== entry.id));
  }, [onProductUpdated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleEdit(instruction);
  };

  const handleQuickAction = (instruccion: string) => {
    setShowQuickActions(false);
    handleEdit(instruccion);
  };

  return (
    <div className={`ai-editor-assistant flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className || ''}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: PALETTE.purple }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Asistente de Edicion IA</h3>
            <p className="text-[11px] text-gray-500">Modifica el contenido con instrucciones en lenguaje natural</p>
          </div>
        </div>
      </div>

      {/* History panel */}
      {history.length > 0 && (
        <div className="border-b border-gray-100">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Undo2 className="w-3.5 h-3.5" />
              Historial ({history.length} cambio{history.length !== 1 ? 's' : ''})
            </span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div ref={historyRef} className="max-h-48 overflow-y-auto px-4 pb-3 space-y-2">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-700 truncate">{entry.instruction}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{entry.explanation}</p>
                        {entry.camposModificados.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.camposModificados.slice(0, 3).map((campo) => (
                              <span key={campo} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-50 text-purple-600">
                                {campo}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUndo(entry)}
                        className="flex-shrink-0 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Deshacer este cambio"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-4 py-2 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="text-[11px] font-medium text-purple-600 hover:text-purple-700 transition-colors"
        >
          {showQuickActions ? 'Ocultar acciones rapidas' : 'Acciones rapidas'}
        </button>
        <AnimatePresence>
          {showQuickActions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleQuickAction(action.instruction)}
                    disabled={loading}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-40"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Ej: Agrega un ejemplo practico en la seccion de actividades..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
            disabled={loading}
          />
          <motion.button
            type="submit"
            whileHover={!loading ? { scale: 1.05 } : undefined}
            whileTap={!loading ? { scale: 0.95 } : undefined}
            disabled={loading || !instruction.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ backgroundColor: PALETTE.purple }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
        {loading && (
          <p className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            La IA esta procesando tu solicitud...
          </p>
        )}
      </form>
    </div>
  );
}
