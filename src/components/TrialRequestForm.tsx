import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface TrialRequestFormProps {
  className?: string;
}

export default function TrialRequestForm({ className = '' }: TrialRequestFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) { setErrorMsg('Ingresa tu nombre.'); return; }
    if (!email.trim() || !isValidEmail(email)) { setErrorMsg('Ingresa un correo válido.'); return; }

    setStatus('loading');
    try {
      const res = await fetch('/api/trial-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), institution: institution.trim(), role: role.trim(), message: message.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No se pudo enviar la solicitud.');
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión.');
    }
  };

  if (status === 'success') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`bg-white rounded-2xl shadow-xl p-8 text-center ${className}`}>
        <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Solicitud enviada</h3>
        <p className="text-gray-600 text-sm">Te contactaremos pronto para activar tu prueba institucional.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-2xl shadow-xl p-8 ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Obtén tu prueba gratuita</h2>
      <p className="text-sm text-gray-500 mb-6">Escribe aquí y te contactaremos para activar una prueba institucional.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition" placeholder="Tu nombre completo" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition" placeholder="correo@colegio.cl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institución / Colegio</label>
            <input type="text" value={institution} onChange={e => setInstitution(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition" placeholder="Nombre del colegio" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition" placeholder="Director, Coordinador, etc." />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje (opcional)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 1000))} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition resize-none" placeholder="Cuéntanos sobre tu institución..." />
          <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/1000</p>
        </div>

        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle size={16} /> {errorMsg}
          </motion.div>
        )}

        <button type="submit" disabled={status === 'loading'} className="w-full py-2.5 bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white rounded-lg font-medium hover:from-fuchsia-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
          {status === 'loading' ? <><Loader2 size={18} className="animate-spin" /> Enviando...</> : <><Send size={18} /> Solicitar prueba gratuita</>}
        </button>
      </form>
    </motion.div>
  );
}
