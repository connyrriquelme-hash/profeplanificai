import { useState } from 'react';
import { LayoutDashboard, FolderKanban, ClipboardCheck, WandSparkles, LibraryBig, Boxes, Share2, Menu, X, Sparkles, BookOpen, BarChart2, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuSections = [
  {
    label: 'HERRAMIENTAS IA',
    items: [
      { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
      { id: 'generador', label: 'Generador Rapido', icon: Sparkles },
      { id: 'workspace', label: 'Espacio de Trabajo', icon: FolderKanban },
      { id: 'unidades-didacticas', label: 'Unidades Didacticas', icon: BookOpen },
      { id: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardCheck },
      { id: 'reportes', label: 'Reportes', icon: BarChart2 },
    ],
  },
  {
    label: 'GESTION ESCOLAR',
    items: [
      { id: 'biblioteca-creativa', label: 'Biblioteca Creativa', icon: WandSparkles },
      { id: 'banco', label: 'Biblioteca', icon: LibraryBig },
      { id: 'banco-recursos', label: 'Banco de Recursos', icon: Boxes },
      { id: 'panel-compartido', label: 'Panel Compartido', icon: Share2 },
    ],
  },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleNavigate = (view: string) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  const initials = user?.nombre
    ? user.nombre.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'P';

  const navItems = (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
      {menuSections.map((section) => (
        <div key={section.label}>
          <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">{section.label}</p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = activeView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 text-slate-900 font-semibold shadow-sm border border-blue-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  onClick={() => handleNavigate(item.id)}
                >
                  <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors duration-200 ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}>
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/25">
          P
        </div>
        <div>
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">PlanificaIA Chile</h2>
          <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Plataforma Docente</p>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-3 mb-4">
        <button
          onClick={() => handleNavigate('biblioteca-creativa')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-bold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:from-violet-600 hover:to-fuchsia-600 active:scale-[0.98] transition-all duration-200"
        >
          <Sparkles size={16} strokeWidth={2.5} />
          Nueva Planificacion
        </button>
      </div>

      {/* Navigation */}
      {navItems}

      {/* User Footer */}
      <div className="px-3 py-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-violet-500/20 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">{user?.nombre || 'Profe'}</p>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">{user?.rol === 'admin' ? 'Administrador' : 'Docente'}</p>
          </div>
          <button onClick={logout} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Cerrar sesion">
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-md text-slate-700 hover:bg-slate-50 transition-all"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <nav
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-72 min-w-[288px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-250 ease-out no-print shadow-xl ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-end px-3 pt-3">
          <button
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menu"
          >
            <X size={18} />
          </button>
        </div>
        {sidebarContent}
      </nav>

      <nav className="hidden lg:flex w-72 min-w-[288px] bg-white border-r border-slate-200 flex-col h-screen sticky top-0 z-10 no-print">
        {sidebarContent}
      </nav>
    </>
  );
}
