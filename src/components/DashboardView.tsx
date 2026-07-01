import { ClipboardCheck, LibraryBig, Boxes, NotebookPen, ArrowRight, Target } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { IconBadge } from './ui/IconBadge';
import { Card } from './ui/Card';
import { SectionHeader } from './ui/SectionHeader';

interface DashboardViewProps {
  onNavigate: (view: string, state?: { tab?: string }) => void;
}

const QUICK_ACTIONS = [
  { view: 'mis-clases', icon: NotebookPen, color: '#213885', title: 'Mis Clases', desc: 'Organiza tu semana, planifica por OA y guarda recursos automáticamente.' },
  { view: 'evaluaciones', icon: ClipboardCheck, color: '#893172', title: 'Crear evaluación', desc: 'Crea evaluaciones formativas, sumativas o tipo SIMCE.' },
  { view: 'banco', icon: LibraryBig, color: '#5F3475', title: 'Explorar OA', desc: 'Navega los Objetivos de Aprendizaje del Currículum Nacional.' },
  { view: 'banco-recursos', icon: Boxes, color: '#213885', title: 'Banco de Recursos', desc: 'Revisa y gestiona todos tus materiales generados.' },
];

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { newProject } = useProject();

  const handleClick = (view: string) => {
    if (view === 'workspace') newProject();
    onNavigate(view, view === 'banco-recursos' ? { tab: 'planificaciones' } : undefined);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <section>
        <SectionHeader
          icon={Target}
          iconColor="#213885"
          title="Acciones rápidas"
          description="Accede a las herramientas principales de ProfePlanificAI."
        />
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Card key={a.view} variant="interactive" onClick={() => handleClick(a.view)} className="flex items-start gap-4 p-5">
                <IconBadge icon={Icon} size="md" color={a.color} variant="gradient" className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-theme-text mb-0.5">{a.title}</h3>
                  <p className="text-xs text-theme-secondary leading-relaxed line-clamp-2">{a.desc}</p>
                </div>
                <ArrowRight size={16} className="text-theme-gray flex-shrink-0 mt-1 transition-colors group-hover:text-theme-primary" />
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
