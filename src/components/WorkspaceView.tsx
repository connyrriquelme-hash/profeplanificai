import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Bot, Save, Copy, Printer, FileDown, FileText, Sparkles } from 'lucide-react';

interface WorkspaceViewProps {
  output: string;
  onNavigate: (view: string) => void;
  onSave: () => void;
  onCopy: () => void;
  onPrint: () => void;
  onExportPDF: () => void;
  onExportWord: () => void;
  onClose: () => void;
  initialMessage?: string;
}

export function WorkspaceView({ 
  output, 
  onNavigate, 
  onSave, 
  onCopy, 
  onPrint, 
  onExportPDF, 
  onExportWord, 
  onClose,
  initialMessage
}: WorkspaceViewProps) {
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; content: string; timestamp: number }>>([
    ...(initialMessage ? [{ role: 'ai' as const, content: initialMessage, timestamp: Date.now() }] : []),
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const userMessage = { role: 'user' as const, content: messageInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMessage]);
    setMessageInput('');
    setIsLoading(true);

    try {
      const { generarConIA } = await import('../services/aiService');
      const modifiedResponse = await generarConIA({
        tipo: 'ajustar',
        promptExt: `El usuario quiere que modifiques el siguiente documento según su solicitud: "${messageInput}"

Documento actual:
"${output}"

Por favor, aplica los ajustes solicitados y retorna el documento modificado.
Si la solicitud no es clara, pide aclaración.
Usa el mismo formato y estructura que el original.
Incluye una breve nota explicando qué se cambió y por qué.
`,
        onStatus: () => {},
      });

      if (modifiedResponse.ok && modifiedResponse.texto) {
        const aiMessage = { 
          role: 'ai' as const, 
          content: modifiedResponse.texto, 
          timestamp: Date.now() 
        };
        setChatHistory(prev => [...prev, aiMessage]);
      }
    } catch (e) {
      console.error('Error ajustando documento:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="view workspace-view">
      <div className="workspace-toolbar">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="secondary small" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={16} /> Volver al generador
          </button>
          <div className="workspace-divider" />
        </div>
        <div className="workspace-actions">
          <button className="secondary" onClick={onCopy} title="Copiar al portapapeles">
            <Copy size={14} /> Copiar
          </button>
          <button className="secondary" onClick={onPrint} title="Imprimir documento">
            <Printer size={14} /> Imprimir
          </button>
          <button className="secondary" onClick={onExportPDF} title="Exportar a PDF">
            <FileDown size={14} /> PDF
          </button>
          <button className="secondary" onClick={onExportWord} title="Exportar a Word">
            <FileText size={14} /> Word
          </button>
          <button className="primary" onClick={onSave} title="Guardar en Banco de Recursos">
            <Save size={14} /> Guardar
          </button>
        </div>
      </div>

      <div className="workspace-container">
        <div className="document-workspace">
          <div className="document-header">
            <h3>Documento generado</h3>
          </div>
          <div className="document-content-wrapper">
            <div className="document-content" dangerouslySetInnerHTML={{ __html: formatMarkdown(output) }} />
          </div>
        </div>

        <div className="chat-workspace">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} />
              <h4>Chat con la IA</h4>
            </div>
            <div className="chat-status">
              {isLoading ? 'Generando...' : 'Lista para ajustar'}
            </div>
          </div>

          <div className="chat-messages">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-header">
                  <span className="message-role">{msg.role === 'ai' ? 'IA' : 'Tú'}</span>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="message-content">
                  {msg.role === 'ai' ? (
                    <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
            {isLoading && (
              <div className="message ai">
                <div className="message-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="w-2 h-2 bg-brand2 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-brand2 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-brand2 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chat-input">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Pedir ajustes: 'Hazlo más corto', 'Agrega una adaptación visual', etc..."
              rows={3}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              className="primary"
              onClick={handleSendMessage}
              disabled={isLoading || !messageInput.trim()}
              style={{ alignSelf: 'flex-end', marginTop: 8, marginLeft: 8 }}
            >
              {isLoading ? 'Procesando...' : 'Enviar ajuste'}
            </button>
          </div>

          <div className="chat-suggestions">
            <button
              className="ghost"
              onClick={() => setMessageInput('Hazlo más corto y claro')}
              style={{ fontSize: 11 }}
            >
              Hazlo más corto
            </button>
            <button
              className="ghost"
              onClick={() => setMessageInput('Agrega una adaptación visual (DUA)')}
              style={{ fontSize: 11 }}
            >
              Agregar DUA
            </button>
            <button
              className="ghost"
              onClick={() => setMessageInput('Añade más ejemplos prácticos')}
              style={{ fontSize: 11 }}
            >
              Agregar ejemplos
            </button>
            <button
              className="ghost"
              onClick={() => setMessageInput('Mejora la redacción')}
              style={{ fontSize: 11 }}
            >
              Mejorar redacción
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .workspace-view {
          padding: 0;
          height: calc(100vh - 64px);
          display: flex;
          flex-direction: column;
          background: var(--bg2);
        }

        .workspace-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          background: var(--card);
          border-bottom: 1px solid var(--line);
          z-index: 10;
        }

        .workspace-actions {
          display: flex;
          gap: 8px;
        }

        .workspace-divider {
          width: 1px;
          height: 24px;
          background: var(--line);
          margin: 0 12px;
        }

        .workspace-container {
          display: flex;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }

        .document-workspace {
          flex: 3;
          background: white;
          border-right: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
        }

        .document-header {
          padding: 16px 24px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .document-content-wrapper {
          flex: 1;
          overflow-y: auto;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        .document-content {
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.8;
          color: #2c3e50;
          font-size: 14px;
        }

        .document-content h1, .document-content h2, .document-content h3 {
          color: #1a365d;
          margin-top: 24px;
          margin-bottom: 12px;
        }

        .document-content h1 { font-size: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        .document-content h2 { font-size: 22px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        .document-content h3 { font-size: 18px; }

        .document-content p { margin-bottom: 16px; text-align: justify; }

        .document-content ul, .document-content ol { margin-left: 24px; margin-bottom: 16px; }

        .document-content strong { color: #dc2626; font-weight: 600; }

        .chat-workspace {
          flex: 2;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-header {
          padding: 16px 20px;
          background: var(--card);
          border-bottom: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-status {
          font-size: 11px;
          color: var(--muted);
          background: var(--success-bg);
          color: var(--success);
          padding: 4px 8px;
          border-radius: 999px;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message {
          max-width: 80%;
        }

        .message.user {
          align-self: flex-end;
        }

        .message.ai {
          align-self: flex-start;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--muted);
          margin-bottom: 4px;
        }

        .message-role {
          font-weight: 600;
        }

        .message-content {
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.5;
        }

        .message.user .message-content {
          background: linear-gradient(135deg, var(--brand), var(--brand2));
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.ai .message-content {
          background: var(--surface);
          border: 1px solid var(--line);
          border-bottom-left-radius: 4px;
        }

        .chat-input {
          padding: 16px 20px;
          border-top: 1px solid var(--line);
          background: var(--card);
        }

        .chat-input textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 10px;
          font-size: 13px;
          resize: none;
          font-family: inherit;
          background: var(--bg);
        }

        .chat-input textarea:focus {
          outline: none;
          border-color: var(--brand);
          box-shadow: 0 0 0 3px rgba(109,93,252,0.1);
        }

        .chat-suggestions {
          display: flex;
          gap: 8px;
          padding: 12px 20px;
          background: var(--surface);
          border-top: 1px solid var(--line);
          flex-wrap: wrap;
        }

        .chat-suggestions button {
          padding: 6px 10px;
          font-size: 11px;
          border-radius: 8px;
          background: var(--card);
          border: 1px solid var(--line);
          color: var(--muted);
          cursor: pointer;
          transition: all var(--t-base);
        }

        .chat-suggestions button:hover {
          background: var(--brand-bg);
          border-color: var(--brand);
          color: var(--brand);
        }

        @media (max-width: 768px) {
          .workspace-container {
            flex-direction: column;
            height: calc(100vh - 120px);
          }

          .document-workspace, .chat-workspace {
            border-right: none;
            border-bottom: 1px solid var(--line);
          }

          .workspace-toolbar {
            flex-wrap: wrap;
            gap: 8px;
          }

          .workspace-actions {
            width: 100%;
            justify-content: center;
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  );
}

function formatMarkdown(text: string): string {
  if (!text) return '';

  let html = text;

  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>');

  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/\n/g, '<br>');

  return html;
}