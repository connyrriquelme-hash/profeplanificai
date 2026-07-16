import { useState } from 'react';
import { classbookService } from '../../services/classbookService';

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

export function SignaturePinSetup({ onComplete, onCancel }: Props) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError('El PIN debe ser de 6 dígitos numéricos');
      return;
    }
    if (pin === '000000' || pin === '111111' || pin === '222222' || pin === '333333' ||
        pin === '444444' || pin === '555555' || pin === '666666' || pin === '777777' ||
        pin === '888888' || pin === '999999') {
      setError('El PIN no puede ser repeticiones del mismo dígito');
      return;
    }
    if (/^012345|^123456|^234567|^345678|^456789|^567890|^987654|^876543|^765432|^654321|^543210/.test(pin)) {
      setError('El PIN no puede ser una secuencia');
      return;
    }
    if (pin !== confirmPin) {
      setError('Los PINes no coinciden');
      return;
    }

    setLoading(true);
    try {
      await classbookService.setupSignaturePin(pin);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al configurar PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Configurar PIN de firma</h3>
        <p className="text-xs text-slate-500 mt-1">
          Su PIN será usado para firmar sesiones del Libro de Clases. Debe ser de 6 dígitos numéricos.
        </p>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</div>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor="pin-input" className="block text-xs font-semibold text-slate-700 mb-1">PIN</label>
          <input
            id="pin-input"
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 tracking-[0.5em] text-center"
            placeholder="------"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="pin-confirm" className="block text-xs font-semibold text-slate-700 mb-1">Confirmar PIN</label>
          <input
            id="pin-confirm"
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
          disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
        >
          {loading ? 'Configurando...' : 'Configurar PIN'}
        </button>
      </div>
    </div>
  );
}
