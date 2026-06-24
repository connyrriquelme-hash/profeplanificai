import { useState, useEffect } from 'react';
import { LayoutDashboard, ClipboardEdit, Package, FileText, BookOpen, Users, Folder, GraduationCap, Settings, LogOut, Minimize2, BarChart3, Bot } from 'lucide-react';
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
  { view: 'config', label: 'Conectar IA', icon: <Settings size={18} /> },
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
    <nav className="sidebar no-print">
      <div className="sidebar-logo">
        <div className="sidebar-logo-badge">P</div>
        <div>
          <h2>PlanificaIA Chile</h2>
          <div className="subtitle">Gestión docente</div>
        </div>
      </div>
      <div className="nav-list">
        {NAV_ITEMS.filter((item) => !item.adminOnly || user?.rol === 'admin').map((item) => {
          const count = badges[item.view];
          return (
            <motion.button
              key={item.view}
              className={`nav-btn${activeView === item.view ? ' active' : ''}`}
              onClick={() => onNavigate(item.view)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{ position: 'relative' }}
            >
              <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>{item.icon}</span>
              {item.label}
              {count !== undefined && count > 0 && (
                <span style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'linear-gradient(135deg, var(--brand), var(--brand2))',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '1px 7px', borderRadius: 10, minWidth: 18, textAlign: 'center',
                }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      <div className="sidebar-pill">{modeLabel}</div>
      {user && <UserBar nombre={user.nombre} />}
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
    <div className="sidebar-user">
      <div className="sidebar-user-avatar">{initial}</div>
      <span className="sidebar-user-name" title={nombre}>{nombre}</span>
      <button onClick={() => setCompact((c) => !c)} className="sidebar-logout" title={compact ? 'Modo normal' : 'Modo compacto'}>
        <Minimize2 size={14} />
      </button>
      <button onClick={logout} className="sidebar-logout" title="Cerrar sesión">
        <LogOut size={14} />
      </button>
    </div>
  );
}
