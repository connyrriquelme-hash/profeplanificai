import { ClipboardCheck, LibraryBig, Sparkles, Boxes, BookOpenCheck, NotebookPen, ArrowRight, Target } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { IconBadge } from './ui/IconBadge';
import { Card } from './ui/Card';
import { SectionHeader } from './ui/SectionHeader';

interface DashboardViewProps {
  onNavigate: (view: string, state?: { tab?: string }) => void;
}

const QUICK_ACTIONS = [
  { view: 'workspace', icon: NotebookPen, color: '#213885', title: 'Crear clase', desc: 'Diseña una planificación completa con inicio, desarrollo y cierre.' },
  { view: 'evaluaciones', icon: ClipboardCheck, color: '#893172', title: 'Crear evaluación', desc: 'Crea evaluaciones formativas, sumativas o tipo SIMCE.' },
  { view: 'banco', icon: LibraryBig, color: '#5F3475', title: 'Explorar OA', desc: 'Navega los Objetivos de Aprendizaje del Currículum Nacional.' },
  { view: 'biblioteca-creativa', icon: Sparkles, color: '#893172', title: 'Biblioteca Creativa', desc: 'Genera recursos educativos con IA alineados al currículo.' },
  { view: 'banco-recursos', icon: Boxes, color: '#213885', title: 'Banco de Recursos', desc: 'Revisa y gestiona todos tus materiales generados.' },
  { view: 'banco', icon: BookOpenCheck, color: '#5F3475', title: 'Ver biblioteca', desc: 'Accede a toda la base curricular chilena organizada.' },
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
