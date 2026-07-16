import { useState } from 'react';
import { classbookService } from '../../services/classbookService';
import type { ClassbookSession } from '../../types/classbook';

interface Props {
  session: ClassbookSession;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SessionSignatureModal({ session, onSuccess, onCancel }: Props) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentHash = `v${session.version}-${session.id}-${session.updated_at ?? ''}`;

  const handleSign = async () => {
    setError(null);
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError('PIN debe ser de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      await classbookService.signSessionWithPin(session.id, contentHash, pin);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al firmar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-base font-bold text-slate-900">Firmar sesión</h2>
          <p className="text-xs text-slate-500 mt-1">
            Ingrese su PIN para firmar esta sesión del Libro de Clases.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Sesión:</span>
            <span className="font-medium text-slate-700">{session.planned_content ?? session.date}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Fecha:</span>
            <span className="font-medium text-slate-700">{session.date}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Versión:</span>
            <span className="font-medium text-slate-700">v{session.version}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Hash:</span>
            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">{contentHash}</span>
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</div>
        )}

        <div>
          <label htmlFor="sign-pin" className="block text-xs font-semibold text-slate-700 mb-1">PIN de firma</label>
          <input
            id="sign-pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => { if (e.key === 'Enter' && pin.length === 6) handleSign(); }}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 tracking-[0.5em] text-center"
            placeholder="------"
            autoComplete="off"
            autoFocus
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
          >
            Cancelar
          </button>
          <button
            onClick={handleSign}
            disabled={loading || pin.length !== 6}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
          >
            {loading ? 'Firmando...' : 'Firmar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
