import { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutDashboard, FolderKanban, ClipboardCheck, Boxes, Share2, Menu, X, Sparkles, BookOpen, BarChart2, LogOut, Route, PanelLeftClose, PanelLeftOpen, Shield, Bot, GraduationCap, WandSparkles, ListChecks } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdminUser, ADMIN_ONLY_VIEW_IDS } from '../utils/roles';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const COLLAPSED_WIDTH = 80;
const SIDEBAR_KEY = 'sidebarCollapsed:v2';

function getInitialCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) return stored === 'true';
  } catch { /* noop */ }
  return true;
}

const menuSections = [
  {
    label: 'HERRAMIENTAS IA',
    items: [
      { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
      { id: 'biblioteca-creativa', label: 'Biblioteca Creativa', icon: WandSparkles },
      { id: 'flujo-docente', label: 'Flujo Docente', icon: Route },
      { id: 'mis-clases', label: 'Mis Clases', icon: Sparkles },
      { id: 'workspace', label: 'Espacio de Trabajo', icon: FolderKanban },
      { id: 'unidades-didacticas', label: 'Unidades Didacticas', icon: BookOpen },
      { id: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardCheck },
      { id: 'dua-guide', label: 'Guía DUA (Multinivel)', icon: BookOpen },
      { id: 'project-copilot', label: 'Project Copilot', icon: Bot },
      { id: 'copilot-tasks', label: 'Mis tareas IA', icon: ListChecks },
      { id: 'reportes', label: 'Reportes', icon: BarChart2 },
    ],
  },
  {
    label: 'GESTION ESCOLAR',
    items: [
      { id: 'libro-clases', label: 'Libro de Clases', icon: GraduationCap },
      { id: 'banco-recursos', label: 'Banco de Recursos', icon: Boxes },
      { id: 'panel-compartido', label: 'Panel Compartido', icon: Share2 },
    ],
  },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed);
  const { user, logout } = useAuth();

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, String(isCollapsed)); } catch { /* noop */ }
  }, [isCollapsed]);

  const toggleCollapse = useCallback(() => setIsCollapsed((prev) => !prev), []);

  const handleNavigate = (view: string) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  const initials = user?.nombre
    ? user.nombre.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'P';

  const isAdmin = isAdminUser(user);

  const navItems = (collapsed = false) => (
    <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-2 space-y-3' : 'px-3 space-y-5'}`}>
      {menuSections.map((section) => {
        const visibleItems = section.items.filter(item => {
          if (ADMIN_ONLY_VIEW_IDS.has(item.id)) return isAdmin;
          if (item.id === 'coordinator-dashboard') {
            const role = user?.institutionalRole;
            return role === 'super_admin' || role === 'institution_admin' || role === 'coordinator';
          }
          return true;
        });
        if (visibleItems.length === 0) return null;
        return (
          <div key={section.label}>
            {!collapsed && <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-[var(--ink-soft)] uppercase">{section.label}</p>}
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                const isActive = activeView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-[14px]'} py-[11px] rounded-xl text-[14px] transition-all duration-200 group ${
                      isActive
                        ? 'bg-[var(--primary)] text-white font-semibold shadow-sm'
                        : 'text-[var(--ink-mid)] font-medium hover:bg-[var(--sidebar-hover)]'
                    }`}
                    onClick={() => handleNavigate(item.id)}
                  >
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors duration-200">
                      <Icon size={18} strokeWidth={isActive ? 2.25 : 2} />
                    </span>
                    {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {user?.rol === 'admin' && (
        <div>
          {!collapsed && <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-[var(--ink-soft)] uppercase">Administración</p>}
          <div className="space-y-0.5">
            {[
              { id: 'admin', label: 'Admin General', icon: LayoutDashboard },
              { id: 'admin-panel', label: 'Panel Institucional', icon: Shield },
            ].map((item) => {
              const isActive = activeView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-[14px]'} py-[11px] rounded-xl text-[14px] transition-all duration-200 group ${
                    isActive
                      ? 'bg-[var(--primary)] text-white font-semibold shadow-sm'
                      : 'text-[var(--ink-mid)] font-medium hover:bg-[var(--sidebar-hover)]'
                  }`}
                  onClick={() => handleNavigate(item.id)}
                >
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors duration-200">
                    <Icon size={18} strokeWidth={isActive ? 2.25 : 2} />
                  </span>
                  {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );

  const sidebarContent = (collapsed = false, mobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-5 mb-2`}>
        <div
          className="w-[38px] h-[38px] rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold text-[19px] flex-shrink-0 shadow-sm"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          P
        </div>
        {!collapsed && <div>
          <h2 className="text-[15px] font-bold text-[var(--ink)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>PlanificaIA Chile</h2>
          <p className="text-[10px] text-[var(--ink-soft)] font-semibold tracking-widest uppercase">Plataforma Docente</p>
        </div>}
      </div>

      {/* Navigation */}
      {navItems(collapsed)}

      {/* Idea de la semana — widget decorativo, sin estado */}
      {!collapsed && (
        <div className="mx-3 mb-3 flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5">
          <span className="text-[13px] font-semibold text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>Idea de la semana</span>
          <span className="text-[12px] leading-[1.5] text-[var(--ink-soft)]">Prueba generar una guia con adecuaciones DUA en dos niveles de complejidad.</span>
        </div>
      )}

      {/* User Footer */}
      <div className={`${collapsed ? 'px-2' : 'px-3'} py-3 border-t border-[var(--border)]`}>
        <div className={`flex items-center ${collapsed ? 'justify-center px-1' : 'gap-3 px-2'} py-2 rounded-xl hover:bg-[var(--sidebar-hover)] transition-colors cursor-pointer`}>
          <div className="w-9 h-9 rounded-full bg-[var(--success)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          {!collapsed && <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[var(--ink)] truncate leading-tight">{user?.nombre || 'Profe'}</p>
            <p className="text-[11px] text-[var(--ink-soft)] font-medium leading-tight">{user?.rol === 'admin' ? 'Administrador' : 'Docente'}</p>
          </div>}
          {!collapsed && <button onClick={logout} className="p-1.5 rounded-lg text-[var(--ink-soft)] hover:text-red-500 hover:bg-red-50 transition-colors" title="Cerrar sesion">
            <LogOut size={14} strokeWidth={2} />
          </button>}
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
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-72 min-w-[288px] bg-[var(--sidebar)] flex flex-col transition-transform duration-250 ease-out no-print shadow-xl ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-end px-3 pt-3">
          <button
            className="p-1.5 rounded-xl text-[var(--ink-soft)] hover:bg-[var(--sidebar-hover)] transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menu"
          >
            <X size={18} />
          </button>
        </div>
        {sidebarContent(false, true)}
      </nav>

      <nav className={`hidden lg:flex ${isCollapsed ? 'w-20 min-w-[80px]' : 'w-64 min-w-[256px]'} bg-[var(--sidebar)] flex-col h-screen sticky top-0 z-10 no-print transition-all duration-200`}>
        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="absolute right-3 top-3 p-2 rounded-xl text-[var(--ink-soft)] hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors"
            aria-label="Contraer menu"
            title="Contraer menu"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
        {sidebarContent(isCollapsed)}
      </nav>

      {/* Floating expand tab when collapsed */}
      {isCollapsed && (
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex fixed top-1/2 -translate-y-1/2 z-20 items-center justify-center w-5 h-14 rounded-l-lg bg-[var(--primary)] text-white shadow-md hover:bg-[var(--primary-hover)] transition-all duration-200 no-print"
          style={{ left: COLLAPSED_WIDTH }}
          aria-label="Expandir menu"
          title="Expandir menu"
        >
          <PanelLeftOpen size={14} />
        </button>
      )}
    </>
  );
}
