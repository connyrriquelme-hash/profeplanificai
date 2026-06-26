import { useState } from 'react';
import { LayoutDashboard, FolderKanban, ClipboardCheck, WandSparkles, LibraryBig, Boxes, Menu, X } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'workspace', label: 'Espacio de Trabajo', icon: FolderKanban },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardCheck },
    { id: 'biblioteca-creativa', label: 'Biblioteca Creativa', icon: WandSparkles },
    { id: 'banco', label: 'Biblioteca', icon: LibraryBig },
    { id: 'banco-recursos', label: 'Banco de Recursos', icon: Boxes },
  ];

  const handleNavigate = (view: string) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-200/50">
          P
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">ProfePlanificAI</h2>
          <div className="text-[11px] text-gray-400 font-medium tracking-wide">Suite docente IA</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-indigo-50/50 text-indigo-700 font-semibold shadow-sm border-l-[3px] border-indigo-500'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
              onClick={() => handleNavigate(item.id)}
            >
              <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                <Icon size={20} strokeWidth={2.25} />
              </span>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-auto" />}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-gray-100">
        <div className="text-center text-[11px] text-gray-400 font-medium tracking-wide">
          ProfePlanificAI v2.0
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 rounded-xl bg-white border border-gray-200 shadow-md text-gray-700 hover:bg-gray-50 transition-colors"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <nav
        className={`
          lg:hidden fixed inset-y-0 left-0 z-40 w-64 min-w-[260px] bg-white border-r border-gray-200 flex flex-col
          transition-transform duration-200 ease-in-out no-print
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex justify-end px-3 pt-3">
          <button
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>
        {sidebarContent}
      </nav>

      <nav className="hidden lg:flex w-64 min-w-[260px] bg-white border-r border-gray-200 flex-col h-screen sticky top-0 z-10 no-print">
        {sidebarContent}
      </nav>
    </>
  );
}
