import { LayoutDashboard, BookOpen, Database, Sparkles } from 'lucide-react';

export function Sidebar({ activeView, onViewChange }: { activeView: string, onViewChange: (view: string) => void }) {
  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'workspace', label: 'Espacio de Trabajo', icon: BookOpen },
    { id: 'banco', label: 'Biblioteca', icon: Database },
    { id: 'agente', label: 'Agente IA', icon: Sparkles },
  ];

  return (
    <nav className="sidebar">
      <div className="logo">GuaridaEduca</div>
      {menuItems.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={activeView === item.id ? 'active' : ''}
            onClick={() => onViewChange(item.id)}
          >
            <Icon size={20} />
            <span>{item.label}</span >
          </button>
        );
      })}
    </nav>
  );
}