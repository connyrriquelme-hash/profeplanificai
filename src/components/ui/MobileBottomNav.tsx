import { LayoutDashboard, Sparkles, FolderKanban, ClipboardCheck, LibraryBig, BookOpen, BarChart2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminUser, ADMIN_ONLY_VIEW_IDS } from '../../utils/roles';

interface MobileBottomNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const allBottomNavItems = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'mis-clases', label: 'Clases', icon: Sparkles },
  { id: 'unidades-didacticas', label: 'Unidades', icon: BookOpen },
  { id: 'evaluaciones', label: 'Evaluar', icon: ClipboardCheck },
  { id: 'reportes', label: 'Reportes', icon: BarChart2 },
];

export function MobileBottomNav({ activeView, onViewChange }: MobileBottomNavProps) {
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);
  const bottomNavItems = allBottomNavItems.filter(item => !ADMIN_ONLY_VIEW_IDS.has(item.id) || isAdmin);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/60 safe-area-bottom no-print">
      <div className="flex items-center justify-around px-1 py-1">
        {bottomNavItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] py-2 px-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-theme-primary'
                  : 'text-gray-400 active:text-theme-primary/70'
              }`}
              aria-label={item.label}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-theme-primary/10' : ''
              }`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] mt-0.5 font-medium leading-none ${
                isActive ? 'font-bold' : ''
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-theme-primary mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
