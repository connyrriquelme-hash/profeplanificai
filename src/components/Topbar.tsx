import { useState } from 'react';
import { Bell, HelpCircle, ChevronDown, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SearchInput } from './ui/SearchInput';

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

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 sm:gap-4 bg-white/95 backdrop-blur-xl" style={{ minHeight: '80px' }}>
      {title && (
        <h1 className="text-base sm:text-lg font-semibold text-slate-900 lg:hidden">{title}</h1>
      )}

      {/* School selector pill */}
      <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-xl border border-blue-100 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Building2 size={14} className="text-blue-600" strokeWidth={2.5} />
        </div>
        <div className="hidden xl:block">
          <p className="text-[9px] font-bold text-blue-400 tracking-widest uppercase leading-tight">Establecimiento</p>
          <p className="text-[12px] font-semibold text-slate-700 leading-tight truncate max-w-[140px]">Liceo Nacional</p>
        </div>
        <ChevronDown size={14} className="text-slate-400" />
      </div>

      {/* Search */}
      <div className="flex-1 flex items-center gap-2 sm:gap-4 max-w-xl">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar materiales, planes u OAs..."
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

      {/* Right actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
        <button className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center" aria-label="Ayuda">
          <HelpCircle size={18} strokeWidth={2} />
        </button>

        <button className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all relative min-w-[40px] min-h-[40px] flex items-center justify-center" aria-label="Notificaciones">
          <Bell size={18} strokeWidth={2} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-fuchsia-500 ring-2 ring-white" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 pl-3 ml-1 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-violet-500/20">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-[13px] font-semibold text-slate-900 leading-tight">{user?.nombre || 'Profe'}</p>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">{user?.rol === 'admin' ? 'Administrador' : 'Docente'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
