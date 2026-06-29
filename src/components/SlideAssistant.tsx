import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sparkles, PanelRightOpen, PanelRightClose } from 'lucide-react';
import type { VisualLessonDeck } from '../types/presentation';

interface SlideAssistantProps {
  currentPresentation: VisualLessonDeck;
  onUpdatePresentation: (updated: VisualLessonDeck) => void;
  isProcessing?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export function SlideAssistant({
  currentPresentation,
  onUpdatePresentation,
  isProcessing = false,
  isOpen,
  onToggle,
}: SlideAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: '¡Hola! Soy tu asistente de presentaciones. Pédeme lo que quieras cambiar: colores, contenido, orden de diapositivas, o cualquier ajuste.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || isProcessing) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage: ChatMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/ai/mutate-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentation: currentPresentation,
          instruction: trimmed,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('Error en la solicitud');

      const data = await response.json();

      if (data.updatedPresentation) {
        onUpdatePresentation(data.updatedPresentation);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.message || '¡He actualizado la presentación! Revisa los cambios en la vista previa.',
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.message || 'No pude procesar esa solicitud. Intenta con otra instrucción.',
          },
        ]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Ocurrió un error al conectar con el asistente. Intenta nuevamente.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isProcessing, currentPresentation, onUpdatePresentation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors lg:hidden"
      >
        {isOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
      </button>

      {/* Sidebar panel */}
      <aside
        className={`flex flex-col h-full bg-slate-50 border-l border-slate-200 transition-all duration-300 ${
          isOpen ? 'w-80 xl:w-96' : 'w-0 overflow-hidden border-l-0'
        }`}
        role="complementary"
        aria-label="Asistente de presentaciones"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100">
            <Sparkles size={18} className="text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">Asistente IA</h2>
            <p className="text-xs text-slate-500">Modifica tu presentación</p>
          </div>
          <button
            onClick={onToggle}
            aria-label="Cerrar asistente"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <PanelRightClose size={16} />
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          role="log"
          aria-label="Historial de mensajes"
          aria-live="polite"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5">
                  <Bot size={14} className="text-indigo-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm'
                }`}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center mt-0.5">
                  <User size={14} className="text-white" />
                </div>
              )}
            </div>
          ))}

          {(isLoading || isProcessing) && (
            <div className="flex gap-2.5 justify-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <Bot size={14} className="text-indigo-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Pensando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-end gap-2">
            <label htmlFor="assistant-input" className="sr-only">
              Escribe tu instrucción
            </label>
            <textarea
              ref={textareaRef}
              id="assistant-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej: Cambia el color de fondo a azul..."
              disabled={isLoading || isProcessing}
              className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Escribe tu instrucción para modificar la presentación"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isProcessing}
              aria-label="Enviar mensaje"
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400 text-center">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </aside>
    </>
  );
}
