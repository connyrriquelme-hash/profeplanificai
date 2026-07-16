import { useState } from 'react';
import { classbookService } from '../../services/classbookService';

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

export function SignaturePinChange({ onComplete, onCancel }: Props) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (currentPin.length !== 6 || !/^\d{6}$/.test(currentPin)) {
      setError('El PIN actual debe ser de 6 dígitos');
      return;
    }
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setError('El nuevo PIN debe ser de 6 dígitos numéricos');
      return;
    }
    if (newPin === '000000' || newPin === '111111' || newPin === '222222' || newPin === '333333' ||
        newPin === '444444' || newPin === '555555' || newPin === '666666' || newPin === '777777' ||
        newPin === '888888' || newPin === '999999') {
      setError('El PIN no puede ser repeticiones del mismo dígito');
      return;
    }
    if (/^012345|^123456|^234567|^345678|^456789|^567890|^987654|^876543|^765432|^654321|^543210/.test(newPin)) {
      setError('El PIN no puede ser una secuencia');
      return;
    }
    if (newPin !== confirmPin) {
      setError('Los nuevos PINes no coinciden');
      return;
    }
    if (currentPin === newPin) {
      setError('El nuevo PIN debe ser diferente al actual');
      return;
    }

    setLoading(true);
    try {
      await classbookService.changeSignaturePin(currentPin, newPin);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Cambiar PIN de firma</h3>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</div>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor="current-pin" className="block text-xs font-semibold text-slate-700 mb-1">PIN actual</label>
          <input
            id="current-pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 tracking-[0.5em] text-center"
            placeholder="------"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="new-pin" className="block text-xs font-semibold text-slate-700 mb-1">Nuevo PIN</label>
          <input
            id="new-pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 tracking-[0.5em] text-center"
            placeholder="------"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="confirm-new-pin" className="block text-xs font-semibold text-slate-700 mb-1">Confirmar nuevo PIN</label>
          <input
            id="confirm-new-pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 tracking-[0.5em] text-center"
            placeholder="------"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || currentPin.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
        >
          {loading ? 'Cambiando...' : 'Cambiar PIN'}
        </button>
      </div>
    </div>
  );
}
