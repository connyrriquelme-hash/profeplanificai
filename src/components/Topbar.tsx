import { useState, useCallback } from 'react';
import { Bell, HelpCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SearchInput } from './ui/SearchInput';
import { Button } from './ui/Button';

interface TopbarProps {
  title?: string;
  onNavigate?: (view: string, state?: { tab?: string }) => void;
}

export function Topbar({ title, onNavigate }: TopbarProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const initials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'P';

  const handleCreateResource = useCallback(() => {
    if (onNavigate) {
      onNavigate('biblioteca-creativa');
    }
  }, [onNavigate]);

  return (
    <header className="sticky top-0 z-20 glass border-b border-gray-200/40 px-4 lg:px-6 xl:px-8 py-3 flex items-center gap-4">
      {title && (
        <h1 className="text-lg font-semibold text-gray-900 lg:hidden">{title}</h1>
      )}
      <div className="flex-1 flex items-center gap-4 max-w-lg">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar herramientas, objetivos, recursos..."
        />
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="premium"
          size="sm"
          iconLeft={Sparkles}
          onClick={handleCreateResource}
          className="hidden sm:inline-flex"
        >
          Crear recurso
        </Button>
        <button className="p-2.5 rounded-2xl text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-all" aria-label="Ayuda">
          <HelpCircle size={18} strokeWidth={2.25} />
        </button>
        <button className="p-2.5 rounded-2xl text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-all relative" aria-label="Notificaciones">
          <Bell size={18} strokeWidth={2.25} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-2.5 pl-3 ml-2 border-l border-gray-200/70">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-200/40">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.nombre || 'Profe'}</p>
            <p className="text-[11px] text-gray-400 font-medium leading-tight">{user?.rol === 'admin' ? 'Administrador' : 'Docente'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
