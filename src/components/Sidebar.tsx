import { useState, useEffect } from 'react';
import { LayoutDashboard, ClipboardEdit, Package, FileText, BookOpen, Users, Folder, GraduationCap, LogOut, Minimize2, BarChart3, Bot, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth as useAuthContext } from '../contexts/AuthContext';
import type { ViewType, AIConfig } from '../types';
import type { User } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  config: AIConfig;
  user: User | null;
}

function getBadgeCount(key: string): number {
  try {
    const d = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(d) ? d.length : 0;
  } catch {
    return 0;
  }
}

interface NavItem {
  view: ViewType;
  label: string;
  icon: React.ReactNode;
  badgeKey?: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'inicio', label: 'Inicio', icon: <LayoutDashboard size={18} /> },
  { view: 'agente', label: 'Agente IA', icon: <Bot size={18} /> },
  { view: 'planificador', label: 'Planificador', icon: <ClipboardEdit size={18} />, badgeKey: 'planificaia_plans' },
  { view: 'recursos', label: 'Recursos', icon: <Package size={18} />, badgeKey: 'planificaia_recursos' },
  { view: 'evaluaciones', label: 'Evaluaciones', icon: <FileText size={18} />, badgeKey: 'planificaia_evals' },
  { view: 'banco', label: 'Banco OA', icon: <BookOpen size={18} /> },
  { view: 'colaboracion', label: 'Colaboración', icon: <Users size={18} />, badgeKey: 'planificaia_collab' },
  { view: 'drive', label: 'Drive', icon: <Folder size={18} />, badgeKey: 'planificaia_drive' },
  { view: 'docente', label: 'Docente', icon: <GraduationCap size={18} />, badgeKey: 'planificaia_cursos' },
  { view: 'admin', label: 'Admin', icon: <BarChart3 size={18} />, adminOnly: true },
  { view: 'banco_recursos', label: 'Banco Recursos', icon: <Database size={18} /> },
];

export function Sidebar({ activeView, onNavigate, config, user }: SidebarProps) {
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    const update = () => {
      const counts: Record<string, number> = {};
      NAV_ITEMS.forEach((item) => {
        if (item.badgeKey) counts[item.view] = getBadgeCount(item.badgeKey);
      });
      setBadges(counts);
    };
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  const modeLabel =
    config.provider === 'local'
      ? 'Modo local activo'
      : `IA: ${config.provider}`;

  return (
    <nav className="w-64 min-w-[260px] bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-10 no-print">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
          P
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">PlanificaIA Chile</h2>
          <div className="text-xs text-gray-500">Gestión docente</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.filter((item) => !item.adminOnly || user?.rol === 'admin').map((item) => {
          const count = badges[item.view];
          const isActive = activeView === item.view;
          return (
            <motion.button
              key={item.view}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              onClick={() => onNavigate(item.view)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{ position: 'relative' }}
            >
              <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">{item.icon}</span>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {count !== undefined && count > 0 && (
                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-bold text-white rounded-full bg-gradient-to-r from-indigo-600 to-teal-600">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-gray-200">
        <div className="text-center text-xs text-gray-500 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
          {modeLabel}
        </div>
        {user && <UserBar nombre={user.nombre} />}
      </div>
    </nav>
  );
}

function UserBar({ nombre }: { nombre: string }) {
  const { logout } = useAuthContext();
  const [compact, setCompact] = useState(() => localStorage.getItem('planificaia_compact') === 'true');
  const initial = nombre.charAt(0).toUpperCase();

  useEffect(() => {
    document.body.classList.toggle('compact-mode', compact);
    localStorage.setItem('planificaia_compact', String(compact));
  }, [compact]);

  return (
    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
        {initial}
      </div>
      <span className="flex-1 text-sm font-medium text-gray-700 truncate" title={nombre}>{nombre}</span>
      <button onClick={() => setCompact((c) => !c)} className="p-1.5 rounded text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors" title={compact ? 'Modo normal' : 'Modo compacto'}>
        <Minimize2 size={14} />
      </button>
      <button onClick={logout} className="p-1.5 rounded text-gray-500 hover:bg-gray-200 hover:text-red-600 transition-colors" title="Cerrar sesión">
        <LogOut size={14} />
      </button>
    </div>
  );
}