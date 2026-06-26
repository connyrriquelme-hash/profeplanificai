import { WandSparkles, FolderKanban, ClipboardCheck, LibraryBig, Boxes, Sparkles, ArrowRight, Users, BookOpenCheck } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { IconBadge } from './ui/IconBadge';

interface DashboardViewProps {
  onNavigate: (view: string, state?: { tab?: string }) => void;
}

const QUICK_ACTIONS = [
  { view: 'workspace', icon: WandSparkles, color: '#6d5dfc', title: 'Crear Planificacion', desc: 'Disena clases y unidades completas con inicio, desarrollo y cierre.' },
  { view: 'biblioteca-creativa', icon: Sparkles, color: '#00a7a7', title: 'Biblioteca Creativa', desc: 'Genera recursos con IA alineados al curriculo chileno.' },
  { view: 'evaluaciones', icon: ClipboardCheck, color: '#ec4899', title: 'Evaluaciones', desc: 'Crea evaluaciones formativas, sumativas y tipo SIMCE.' },
  { view: 'banco', icon: LibraryBig, color: '#8b5cf6', title: 'Base Curricular', desc: 'Explora los Objetivos de Aprendizaje del Curriculo Nacional.' },
];

const TOOL_CARDS = [
  { view: 'banco-recursos', icon: Boxes, color: '#f59e0b', title: 'Banco de Recursos', desc: 'Revisa, descarga y gestiona todo tu material generado.' },
  { view: 'workspace', icon: FolderKanban, color: '#14b8a6', title: 'Espacio de Trabajo', desc: 'Accede a tus proyectos y planificaciones en curso.' },
];

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { newProject } = useProject();
  const { user } = useAuth();

  const handleClick = (view: string) => {
    if (view === 'workspace') newProject();
    onNavigate(view, view === 'banco-recursos' ? { tab: 'planificaciones' } : undefined);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-teal-700 p-8 sm:p-10 mb-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-indigo-200 bg-white/15 px-3 py-1 rounded-full">Suite docente IA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Bienvenido, {user?.nombre?.split(' ')[0] || 'Profe'}
          </h1>
          <p className="text-indigo-200 text-sm sm:text-base max-w-xl mb-6">
            Crea materiales educativos alineados al Curriculo Nacional de Chile en minutos con la ayuda de IA.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { newProject(); onNavigate('workspace'); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <WandSparkles size={18} strokeWidth={2.25} /> Nueva planificacion <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('biblioteca-creativa')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 text-white border border-white/20 text-sm font-medium hover:bg-white/25 transition-all backdrop-blur-sm"
            >
              <Sparkles size={18} strokeWidth={2.25} /> Biblioteca Creativa
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Accesos rapidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map(a => {
            const Icon = a.icon;
            return (
              <div
                key={a.view}
                onClick={() => handleClick(a.view)}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <IconBadge icon={Icon} size={20} color={a.color} variant="gradient" className="mb-3 transition-transform group-hover:scale-110" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{a.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{a.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tools & Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Herramientas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TOOL_CARDS.map(t => {
              const Icon = t.icon;
              return (
                <div
                  key={t.view}
                  onClick={() => handleClick(t.view)}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                  <IconBadge icon={Icon} size={18} color={t.color} variant="soft" className="mb-3" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{t.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side info card */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Curriculo Nacional</h2>
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-white p-5 h-full">
            <IconBadge icon={BookOpenCheck} size={20} color="#4f46e5" variant="soft" className="mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Bases Curriculares</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">Accede a todos los Objetivos de Aprendizaje del Curriculo Nacional MINEDUC organizados por nivel y asignatura.</p>
            <button
              onClick={() => onNavigate('banco')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Explorar OA <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Team banner */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Users size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-orange-900 mb-0.5">ProfePlanificAI es mejor en equipo</h3>
          <p className="text-sm text-orange-700 leading-relaxed">Comparte y remixea lecciones con tus colegas para crear mejores planificaciones juntos.</p>
        </div>
        <button className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200">
          Crear un equipo
        </button>
      </div>
    </div>
  );
}
