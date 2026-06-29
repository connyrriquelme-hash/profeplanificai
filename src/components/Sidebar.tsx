import { useState } from 'react';
import { LayoutDashboard, FolderKanban, ClipboardCheck, WandSparkles, LibraryBig, Boxes, Share2, Menu, X, Sparkles, BookOpen, BarChart2 } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'generador', label: 'Generador Rapido', icon: Sparkles },
  { id: 'workspace', label: 'Espacio de Trabajo', icon: FolderKanban },
  { id: 'unidades-didacticas', label: 'Unidades Didacticas', icon: BookOpen },
  { id: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardCheck },
  { id: 'reportes', label: 'Reportes', icon: BarChart2 },
  { id: 'panel-compartido', label: 'Panel Compartido', icon: Share2 },
  { id: 'biblioteca-creativa', label: 'Biblioteca Creativa', icon: WandSparkles },
  { id: 'banco', label: 'Biblioteca', icon: LibraryBig },
  { id: 'banco-recursos', label: 'Banco de Recursos', icon: Boxes },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (view: string) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  const navItems = (
    <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5">
      {menuItems.map((item) => {
        const isActive = activeView === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group ${
              isActive
                ? 'bg-theme-primary/10 text-theme-primary font-semibold shadow-sm border-l-[3px] border-theme-primary'
                : 'text-theme-secondary hover:text-theme-text hover:bg-theme-gray/30'
            }`}
            onClick={() => handleNavigate(item.id)}
          >
            <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors duration-200 ${
              isActive ? 'text-theme-primary' : 'text-theme-secondary group-hover:text-theme-text'
            }`}>
              <Icon size={20} strokeWidth={2.25} />
            </span>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-theme-primary ml-auto animate-scale-in" />}
          </button>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-theme-gray/50">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-theme-primary to-theme-secondary flex items-center justify-center text-white font-bold text-xl shadow-md shadow-theme-primary/20">
          P
        </div>
        <div>
          <h2 className="text-base font-bold text-theme-text tracking-tight">ProfePlanificAI</h2>
          <p className="text-[11px] text-theme-secondary font-medium tracking-wide">Suite docente IA</p>
        </div>
      </div>
      {navItems}
      <div className="px-4 py-3 border-t border-theme-gray/50">
        <p className="text-center text-[11px] text-theme-secondary font-medium tracking-wide">ProfePlanificAI v2.0</p>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 rounded-2xl bg-theme-card border border-theme-gray/50 shadow-md text-theme-text hover:bg-theme-gray/20 transition-all"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-theme-text/20 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <nav
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 min-w-[260px] bg-theme-card/95 backdrop-blur-md border-r border-theme-gray/50 flex flex-col transition-transform duration-250 ease-out no-print ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-end px-3 pt-3">
          <button
            className="p-1.5 rounded-xl text-theme-secondary hover:text-theme-text hover:bg-theme-gray/20 transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>
        {sidebarContent}
      </nav>

      <nav className="hidden lg:flex w-64 min-w-[260px] bg-white/95 border-r border-gray-200/60 flex-col h-screen sticky top-0 z-10 no-print shadow-sm">
        {sidebarContent}
      </nav>
    </>
  );
}
