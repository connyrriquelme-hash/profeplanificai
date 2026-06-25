import { Sparkles } from 'lucide-react';

export function AIAssistant() {
  return (
    <div className="card" style={{ padding: 16, position: 'sticky', top: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Sparkles size={18} style={{ color: 'var(--brand)' }} />
        <strong style={{ fontSize: 14 }}>Asistente IA</strong>
      </div>
      <p className="muted" style={{ fontSize: 13 }}>
        El asistente te ayudará a generar planificaciones, evaluaciones y más.
      </p>
    </div>
  );
}
