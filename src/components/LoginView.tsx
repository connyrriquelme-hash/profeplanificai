import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, Loader2, WifiOff } from 'lucide-react';

export default function LoginView() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || (mode === 'register' && !nombre)) {
      setError('Completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, nombre);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">PlanificaIA</h1>
          <p className="text-gray-500 mt-1">Asistente de planificación docente</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LogIn className="inline w-4 h-4 mr-1.5" />
              Iniciar sesión
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'register' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="inline w-4 h-4 mr-1.5" />
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="María González"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="docente@colegio.cl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="mínimo 6 caracteres"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-sm bg-red-50 p-3 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {busy ? (
                <Loader2 className="inline w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                'Iniciar sesión'
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
            Al continuar, aceptas usar PlanificaIA bajo los términos de uso.
            <br />
            Los datos se almacenan localmente o en Cloudflare D1 según disponibilidad.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
