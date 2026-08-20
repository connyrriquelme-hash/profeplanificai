/**
 * AICopilotSidebar — AI editing assistant panel
 *
 * Tabbed sidebar with Chat, Differentiation, and Design tabs.
 * Chat area with user/AI messages and a sticky input at the bottom.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  Pencil,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Lightbulb,
  Palette,
} from 'lucide-react';
import { api } from '../../services/apiClient';
import type { PedagogicalProduct } from '../products/types';

const PALETTE = {
  primary: '#B5471F',
  primaryHover: '#9A3A17',
  primaryTint: '#FEF3E2',
  primaryInk: '#7C2F13',
  accentHoney: '#E9A13B',
  purple: '#7F58A6',
} as const;

const EDIT_REQUEST_TIMEOUT_MS = 30_000;

/* ── Types ──────────────────────────────────────────────────────────── */

type TabId = 'chat' | 'diferenciacion' | 'diseno';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Sparkles;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  editedCount?: number;
}

interface EditNotification {
  id: string;
  explanation: string;
  camposModificados: string[];
  timestamp: Date;
  collapsed: boolean;
}

interface AICopilotSidebarProps {
  product: PedagogicalProduct;
  resourceId?: string;
  onProductEdited: (updated: PedagogicalProduct) => void;
  reviewInstruction?: string;
  className?: string;
}

/* ── Tabs config ────────────────────────────────────────────────────── */

const TABS: Tab[] = [
  { id: 'chat', label: 'Chat', icon: Sparkles },
  { id: 'diferenciacion', label: 'Diferenciación', icon: Lightbulb },
  { id: 'diseno', label: 'Diseño', icon: Palette },
];

const QUICK_SUGGESTIONS: Record<TabId, string[]> = {
  chat: [
    'Simplifica el lenguaje',
    'Agrega ejemplos prácticos',
    'Corrige ortografía',
    'Haz más breve el contenido',
  ],
  diferenciacion: [
    'Adapta para estudiantes visuales',
    'Agrega apoyos para EDA',
    'Genera versión en珠l',
    'Incluye lectura fácil',
  ],
  diseno: [
    'Mejora la estructura',
    'Reorganiza por secciones',
    'Agrega separadores visuales',
    'Uniformiza el formato',
  ],
};

/* ── Main component ─────────────────────────────────────────────────── */

export function AICopilotSidebar({
  product,
  resourceId,
  onProductEdited,
  reviewInstruction,
  className,
}: AICopilotSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<EditNotification[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, notifications]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EDIT_REQUEST_TIMEOUT_MS);

    try {
      const response = await api.post<{
        ok: boolean;
        productoModificado: Record<string, unknown>;
        explicacion: string;
        camposModificados: string[];
      }>('/api/materials/edit-product', {
        instruccion: text.trim(),
        producto: product,
        resourceId,
      }, controller.signal);

      if (response.ok) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: response.explicacion,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);

        const notification: EditNotification = {
          id: `n-${Date.now()}`,
          explanation: response.explicacion,
          camposModificados: response.camposModificados || [],
          timestamp: new Date(),
          collapsed: false,
        };
        setNotifications(prev => [...prev, notification]);

        // Apply the edit
        const updatedProduct: PedagogicalProduct = {
          ...product,
          ...(response.productoModificado as Partial<PedagogicalProduct>),
          data: (response.productoModificado as Record<string, unknown>).data as Record<string, unknown> || product.data,
        };
        onProductEdited(updatedProduct);
      } else {
        const errorMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: 'No se pudo procesar la solicitud. Intenta de nuevo.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      const detail = err instanceof Error ? err.message : 'Error desconocido';
      const errorMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: isTimeout
          ? 'La IA está tardando más de lo esperado. Intenta de nuevo en unos segundos.'
          : detail.includes('401') || detail.includes('Sesion')
            ? 'Sesion expirada. Recarga la pagina e inicia sesion de nuevo.'
            : detail.includes('conectar')
              ? detail
              : `Error al editar: ${detail.substring(0, 150)}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [product, resourceId, loading, onProductEdited]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const toggleNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, collapsed: !n.collapsed } : n))
    );
  };

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* ── Tab bar ──────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2 ${
                isActive
                  ? 'text-slate-800 border-slate-800 bg-slate-50'
                  : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Chat area (scrollable) ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {/* Edit notifications */}
        {notifications.length > 0 && (
          <div className="space-y-2 mb-4">
            {notifications.map(n => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border overflow-hidden"
                style={{ borderColor: PALETTE.primary, backgroundColor: PALETTE.primaryTint }}
              >
                <button
                  type="button"
                  onClick={() => toggleNotification(n.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: PALETTE.primaryInk }}>
                    <Pencil className="w-3 h-3" />
                    Edición realizada
                    {n.camposModificados.length > 0 && (
                      <span className="text-[10px] font-normal opacity-70">
                        ({n.camposModificados.length} campo{n.camposModificados.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </span>
                  {n.collapsed ? (
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-3 h-3 text-gray-400" />
                  )}
                </button>
                <AnimatePresence>
                  {!n.collapsed && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-2 space-y-1">
                        <p className="text-[11px] text-gray-600">{n.explanation}</p>
                        {n.camposModificados.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {n.camposModificados.map(campo => (
                              <span
                                key={campo}
                                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white border"
                                style={{ borderColor: PALETTE.primary, color: PALETTE.primaryInk }}
                              >
                                {campo}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${PALETTE.purple}15` }}
            >
              <Sparkles className="w-6 h-6" style={{ color: PALETTE.purple }} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">Copiloto IA</h3>
            <p className="text-xs text-gray-400 mb-4 max-w-[200px]">
              Pidele a la IA que modifique, agregue o elimine contenido del documento.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {reviewInstruction && (
                <button
                  type="button"
                  onClick={() => sendMessage(reviewInstruction)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white transition-all"
                  style={{ backgroundColor: PALETTE.primary }}
                >
                  <Sparkles className="w-3 h-3" /> Corregir observaciones
                </button>
              )}
              {QUICK_SUGGESTIONS[activeTab].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-3">
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' ? (
                <div className="max-w-[90%] bg-gray-50 rounded-xl rounded-tl-sm px-3 py-2 text-[13px] text-gray-700 leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div
                  className="max-w-[90%] rounded-xl rounded-tr-sm px-3 py-2 text-[13px] text-white leading-relaxed"
                  style={{ backgroundColor: PALETTE.purple }}
                >
                  {msg.content}
                </div>
              )}
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-2 text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs">Pensando...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ── Sticky input ─────────────────────────────────────────── */}
      <div className="border-t border-gray-200 p-3 flex-shrink-0 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Chatea con la IA..."
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-gray-300 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50 placeholder:text-gray-300"
          />
          <motion.button
            type="submit"
            whileHover={!loading ? { scale: 1.05 } : undefined}
            whileTap={!loading ? { scale: 0.95 } : undefined}
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-white transition-all disabled:opacity-40"
            style={{ backgroundColor: PALETTE.primary }}
            title="Enviar"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
