import { ClipboardCheck, LibraryBig, Sparkles, Boxes, BookOpenCheck, NotebookPen, FileText, Notebook, ClipboardList, HeartHandshake, GraduationCap, Layers, ArrowRight, Target, BrainCircuit } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { IconBadge } from './ui/IconBadge';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SectionHeader } from './ui/SectionHeader';

interface DashboardViewProps {
  onNavigate: (view: string, state?: { tab?: string }) => void;
}

const QUICK_ACTIONS = [
  { view: 'workspace', icon: NotebookPen, color: '#4f46e5', title: 'Crear clase', desc: 'Diseña una planificación completa con inicio, desarrollo y cierre.' },
  { view: 'evaluaciones', icon: ClipboardCheck, color: '#db2777', title: 'Crear evaluación', desc: 'Crea evaluaciones formativas, sumativas o tipo SIMCE.' },
  { view: 'banco', icon: LibraryBig, color: '#7c3aed', title: 'Explorar OA', desc: 'Navega los Objetivos de Aprendizaje del Currículum Nacional.' },
  { view: 'biblioteca-creativa', icon: Sparkles, color: '#0d9488', title: 'Biblioteca Creativa', desc: 'Genera recursos educativos con IA alineados al currículo.' },
  { view: 'banco-recursos', icon: Boxes, color: '#ea580c', title: 'Banco de Recursos', desc: 'Revisa y gestiona todos tus materiales generados.' },
  { view: 'banco', icon: BookOpenCheck, color: '#16a34a', title: 'Ver biblioteca', desc: 'Accede a toda la base curricular chilena organizada.' },
];

const TOOLS = [
  { view: 'workspace', icon: FileText, color: '#4f46e5', title: 'Planificación con IA', desc: 'Genera planificaciones completas alineadas al currículo chileno en segundos.', badge: 'Popular' },
  { view: 'biblioteca-creativa', icon: Notebook, color: '#0d9488', title: 'Fichas de actividades', desc: 'Crea fichas imprimibles con ejercicios, rúbricas y guías para tus estudiantes.', badge: 'Nuevo' },
  { view: 'evaluaciones', icon: ClipboardList, color: '#db2777', title: 'Evaluación formativa', desc: 'Diseña evaluaciones para monitorear el progreso de tus estudiantes.', badge: undefined },
  { view: 'biblioteca-creativa', icon: HeartHandshake, color: '#7c3aed', title: 'Recurso inclusivo DUA', desc: 'Materiales adaptados con principios de Diseño Universal de Aprendizaje.', badge: undefined },
  { view: 'evaluaciones', icon: GraduationCap, color: '#ea580c', title: 'Evaluación tipo SIMCE', desc: 'Prepara a tus estudiantes con evaluaciones estilo SIMCE estandarizadas.', badge: undefined },
  { view: 'workspace', icon: Layers, color: '#14b8a6', title: 'Secuencia de clases', desc: 'Organiza unidades completas con múltiples clases y actividades progresivas.', badge: undefined },
];

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { newProject } = useProject();
  const { user } = useAuth();

  const handleClick = (view: string) => {
    if (view === 'workspace') newProject();
    onNavigate(view, view === 'banco-recursos' ? { tab: 'planificaciones' } : undefined);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-7 sm:p-10 lg:p-12 mb-10 shadow-xl shadow-indigo-200/30">
        <div className="absolute inset-0 bg-noise opacity-[0.06]" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.04] rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10">
          <Badge color="violet" size="md" className="mb-4">Suite docente IA</Badge>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-3">
            Bienvenida a ProfePlanificAI
          </h1>
          <p className="text-indigo-200 text-sm sm:text-base max-w-xl leading-relaxed mb-6">
            Crea, organiza y mejora tus recursos docentes con IA alineada al currículum chileno.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              iconLeft={Sparkles}
              onClick={() => onNavigate('biblioteca-creativa')}
              className="bg-white text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 shadow-lg shadow-indigo-900/20"
            >
              Crear recurso con IA
            </Button>
            <Button
              variant="ghost"
              size="lg"
              iconRight={ArrowRight}
              onClick={() => onNavigate('banco')}
              className="text-white/90 hover:text-white hover:bg-white/15 border border-white/20"
            >
              Explorar objetivos
            </Button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <section className="mb-10">
        <SectionHeader
          icon={Target}
          iconColor="#4f46e5"
          title="Acciones rápidas"
          description="Accede a las herramientas más usadas"
        />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Card key={a.view} variant="interactive" onClick={() => handleClick(a.view)} className="flex items-start gap-4 p-5">
                <IconBadge icon={Icon} size="md" color={a.color} variant="gradient" className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{a.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{a.desc}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 flex-shrink-0 mt-1 transition-colors group-hover:text-indigo-500" />
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recommended tools */}
      <section className="mb-10">
        <SectionHeader
          icon={BrainCircuit}
          iconColor="#7c3aed"
          title="Herramientas recomendadas"
          description="Potencia tu trabajo docente con estas herramientas IA"
        />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Card key={t.title} variant="default" onClick={() => handleClick(t.view)} className="relative p-5 cursor-pointer hover:shadow-md hover:border-gray-300/80 transition-all duration-200">
                {t.badge && (
                  <Badge color={t.badge === 'Popular' ? 'indigo' : 'teal'} size="sm" className="absolute top-3 right-3">
                    {t.badge}
                  </Badge>
                )}
                <IconBadge icon={Icon} size="md" color={t.color} variant="soft" className="mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{t.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* System status */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="text-green-600" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">IA curricular</p>
            <p className="text-sm font-semibold text-gray-900">Lista para crear</p>
          </div>
          <span className="ml-auto w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-200" />
        </Card>
        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <BookOpenCheck size={20} className="text-indigo-600" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Currículum</p>
            <p className="text-sm font-semibold text-gray-900">Base disponible</p>
          </div>
          <span className="ml-auto w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" />
        </Card>
        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="w-11 h-11 rounded-2xl bg-teal-100 flex items-center justify-center flex-shrink-0">
            <Boxes size={20} className="text-teal-600" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Recursos</p>
            <p className="text-sm font-semibold text-gray-900">Biblioteca activa</p>
          </div>
          <span className="ml-auto w-2.5 h-2.5 rounded-full bg-teal-500 shadow-sm shadow-teal-200" />
        </Card>
      </section>
    </div>
  );
}
