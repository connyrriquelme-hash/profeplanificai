import { useState } from 'react';
import { LayoutDashboard, BookOpen, Database, Archive, FileText, Menu, X } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'workspace', label: 'Espacio de Trabajo', icon: BookOpen },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: FileText },
    { id: 'banco', label: 'Biblioteca', icon: Database },
    { id: 'banco-recursos', label: 'Banco de Recursos', icon: Archive },
  ];

  const handleNavigate = (view: string) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
          P
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">ProfePlanificaI</h2>
          <div className="text-xs text-gray-500">Gestión docente</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              onClick={() => handleNavigate(item.id)}
            >
              <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center"><Icon size={18} /></span>
              <span className="flex-1 text-left truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-gray-200 text-center text-xs text-gray-500">
        ProfePlanificaI v2.0
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 rounded-xl bg-white border border-gray-200 shadow-md text-gray-700 hover:bg-gray-50 transition-colors"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay backdrop on mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar (fixed overlay) */}
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

      {/* Desktop sidebar (sticky, in-flow) */}
      <nav className="hidden lg:flex w-64 min-w-[260px] bg-white border-r border-gray-200 flex-col h-screen sticky top-0 z-10 no-print">
        {sidebarContent}
      </nav>
    </>
  );
}