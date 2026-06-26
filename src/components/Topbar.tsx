import { Search, Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const { user } = useAuth();
  const initials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'P';

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-4 lg:px-6 py-3 flex items-center gap-4">
      {title && (
        <h1 className="text-lg font-semibold text-gray-900 lg:hidden">{title}</h1>
      )}
      <div className="flex-1 flex items-center gap-3 max-w-md">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2.25} />
          <input
            placeholder="Buscar recursos, OA, clases..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <button className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all" aria-label="Ayuda">
          <HelpCircle size={18} strokeWidth={2.25} />
        </button>
        <button className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all relative" aria-label="Notificaciones">
          <Bell size={18} strokeWidth={2.25} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-2.5 pl-2 ml-1 border-l border-gray-200">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">{user?.nombre || 'Profe'}</p>
            <p className="text-xs text-gray-400 leading-tight">{user?.rol === 'admin' ? 'Administrador' : 'Docente'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
