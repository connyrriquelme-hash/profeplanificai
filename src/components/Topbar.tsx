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
    <header className="sticky top-0 z-20 glass border-b border-theme-gray/30 px-3 sm:px-4 lg:px-6 xl:px-8 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 bg-theme-beige/80 backdrop-blur-md">
      {title && (
        <h1 className="text-base sm:text-lg font-semibold text-theme-text lg:hidden">{title}</h1>
      )}
      <div className="flex-1 flex items-center gap-2 sm:gap-4 max-w-lg">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar..."
          className="hidden sm:flex"
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar..."
          className="sm:hidden"
          compact
        />
      </div>
      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        <Button
          variant="premium"
          size="sm"
          iconLeft={Sparkles}
          onClick={handleCreateResource}
          className="hidden md:inline-flex"
        >
          Crear recurso
        </Button>
        <button className="p-2 sm:p-2.5 rounded-2xl text-theme-secondary hover:text-theme-text hover:bg-theme-gray/20 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center" aria-label="Ayuda">
          <HelpCircle size={18} strokeWidth={2.25} />
        </button>
        <button className="p-2 sm:p-2.5 rounded-2xl text-theme-secondary hover:text-theme-text hover:bg-theme-gray/20 transition-all relative min-w-[36px] min-h-[36px] flex items-center justify-center" aria-label="Notificaciones">
          <Bell size={18} strokeWidth={2.25} />
          <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-2 h-2 rounded-full bg-theme-accent ring-2 ring-theme-beige" />
        </button>
        <div className="hidden sm:flex items-center gap-2.5 pl-3 ml-2 border-l border-theme-gray/30">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-theme-primary to-theme-secondary flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-theme-primary/20">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-theme-text leading-tight">{user?.nombre || 'Profe'}</p>
            <p className="text-[11px] text-theme-secondary font-medium leading-tight">{user?.rol === 'admin' ? 'Administrador' : 'Docente'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
