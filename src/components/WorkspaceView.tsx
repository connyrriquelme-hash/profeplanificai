import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Bot, Save, Copy, Printer, FileDown, FileText, Sparkles } from 'lucide-react';

export function WorkspaceView() {
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; content: string; timestamp: number }>>([]);
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
        nivel: '',
        asignatura: '',
        oa: '',
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
    <div className="view workspace">
      <div className="module-header">
        <h2 className="module-title"><BookOpen size={22} /> Espacio de Trabajo</h2>
        <p className="muted">Crea planificaciones, recursos y evaluaciones con IA.</p>
      </div>

      <div className="grid3">
        <div className="card">
          <h3>Crear Planificación</h3>
          <p className="muted">Genera una planificación completa con OA, DUA y evaluación.</p>
          <button className="primary" style={{ marginTop: 12 }}>Empezar</button>
        </div>
        <div className="card">
          <h3>Generar Recurso</h3>
          <p className="muted">Guías, fichas, presentaciones y más.</p>
          <button className="primary" style={{ marginTop: 12 }}>Empezar</button>
        </div>
        <div className="card">
          <h3>Crear Evaluación</h3>
          <p className="muted">Diagnósticas, formativas, sumativas y tipo SIMCE.</p>
          <button className="primary" style={{ marginTop: 12 }}>Empezar</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Asistente IA</h3>
        <div className="agent-chat" style={{ minHeight: 300 }}>
          {chatHistory.map((msg, i) => (
            <div key={i} className={`agent-message ${msg.role}`}>
              <div className="agent-role">{msg.role === 'user' ? 'Tú' : 'IA'}</div>
              <div className="output">{msg.content}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="agent-compose">
          <input
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe tu solicitud..."
            disabled={isLoading}
          />
          <button className="primary" onClick={handleSendMessage} disabled={isLoading || !messageInput.trim()}>
            {isLoading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}