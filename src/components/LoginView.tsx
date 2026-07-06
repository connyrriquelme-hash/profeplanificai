import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Loader2, Shield, BookOpen, ClipboardCheck, Users, FolderOpen, Bot } from 'lucide-react';
import TrialRequestForm from './TrialRequestForm';

const SLOGAN = 'Gestión invisible, impacto infinito.';

const BENEFITS = [
  { icon: BookOpen, text: 'Planificaciones alineadas a OA del currículum chileno' },
  { icon: ClipboardCheck, text: 'Evaluaciones, rúbricas y tickets de salida' },
  { icon: Bot, text: 'Guía DUA y Project Copilot con IA' },
  { icon: FolderOpen, text: 'Banco de Recursos institucional' },
  { icon: Users, text: 'Gestión de usuarios por administrador' },
  { icon: Shield, text: 'Seguridad y control de acceso institucional' },
];

export default function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Completa todos los campos.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-white to-orange-50">
      {/* Mobile header */}
      <div className="lg:hidden flex flex-col items-center pt-8 pb-4 px-4">
        <img src="/brand/logo-profeplanificai.png" alt="Logo ProfePlanificAI" className="w-16 h-16 rounded-2xl object-contain mb-3" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-fuchsia-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">ProfePlanificAI</h1>
        <p className="text-sm text-gray-500 italic mt-0.5">{SLOGAN}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-0 lg:min-h-screen lg:flex lg:items-center">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 w-full">

          {/* Left column — branding */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="hidden lg:flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-6">
              <img src="/brand/logo-profeplanificai.png" alt="Logo ProfePlanificAI" className="w-20 h-20 rounded-2xl object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-fuchsia-600 via-purple-600 to-orange-500 bg-clip-text text-transparent leading-tight">ProfePlanificAI</h1>
                <p className="text-base text-gray-500 italic">{SLOGAN}</p>
              </div>
            </div>

            <p className="text-lg text-gray-700 leading-relaxed mb-8 max-w-lg">
              Planifica, evalúa y crea recursos pedagógicos con IA, alineados al currículum chileno.
            </p>

            <div className="space-y-3">
              {BENEFITS.map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                    <b.icon size={18} className="text-fuchsia-600" />
                  </div>
                  <span className="text-sm text-gray-700">{b.text}</span>
                </motion.div>
              ))}
            </div>

            <p className="mt-10 text-xs text-gray-400">&copy; {new Date().getFullYear()} ProfePlanificAI. Todos los derechos reservados.</p>
          </motion.div>

          {/* Right column — login + trial */}
          <div className="space-y-6">
            {/* Login card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-orange-500 flex items-center justify-center">
                  <LogIn size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Ingreso a ProfePlanificAI</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6 ml-[52px]">Solo pueden acceder administradores y usuarios creados previamente por el administrador.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition" placeholder="docente@colegio.cl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition" placeholder="mínimo 6 caracteres" />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</motion.p>
                )}

                <button type="submit" disabled={busy} className="w-full py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-lg font-medium hover:from-fuchsia-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                  {busy ? <><Loader2 size={18} className="animate-spin" /> Ingresando...</> : 'Iniciar sesión'}
                </button>
              </form>

              <p className="mt-5 text-xs text-gray-400 text-center leading-relaxed">
                Si tu institución ya tiene acceso, solicita tus credenciales al administrador.
              </p>
            </motion.div>

            {/* Trial request */}
            <TrialRequestForm />
          </div>
        </div>
      </div>
    </div>
  );
}
