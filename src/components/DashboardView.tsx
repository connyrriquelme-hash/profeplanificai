import { Route, LibraryBig, Boxes, NotebookPen } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';

interface DashboardViewProps {
  onNavigate: (view: string, state?: { tab?: string }) => void;
}

const QUICK_ACTIONS = [
  { view: 'mis-clases', icon: NotebookPen, tint: 'var(--primary-tint)', iconColor: 'var(--primary-ink)', title: 'Mis Clases', desc: 'Organiza tu semana, planifica por OA y guarda recursos automáticamente.' },
  { view: 'flujo-docente', icon: Route, tint: 'var(--warn-bg)', iconColor: 'var(--warn-ink)', title: 'Flujo Docente', desc: 'Genera evaluaciones, guías, rúbricas y más, paso a paso.' },
  { view: 'banco', icon: LibraryBig, tint: '#E6EEE3', iconColor: 'var(--success-ink)', title: 'Explorar OA', desc: 'Navega los Objetivos de Aprendizaje del Currículum Nacional.' },
  { view: 'banco-recursos', icon: Boxes, tint: 'var(--primary-tint)', iconColor: 'var(--primary-ink)', title: 'Banco de Recursos', desc: 'Revisa y gestiona todos tus materiales generados.' },
];

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { newProject } = useProject();
  const { user } = useAuth();

  const handleClick = (view: string) => {
    if (view === 'workspace') newProject();
    onNavigate(view, view === 'banco-recursos' ? { tab: 'planificaciones' } : undefined);
  };

  const firstName = user?.nombre?.split(' ')[0] || 'Profe';

  return (
    <div className="w-full animate-fade-in flex flex-col gap-7">
      <div className="flex flex-col gap-1">
        <h1 className="text-[32px] font-bold text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>
          ¡Hola, profe {firstName}!
        </h1>
        <p className="text-base text-[var(--ink-soft)]">¿Qué preparamos hoy? Te acompañamos paso a paso.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[19px] font-semibold text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.view}
                type="button"
                onClick={() => handleClick(a.view)}
                className="group flex flex-col items-start gap-2.5 rounded-xl bg-[var(--surface)] p-4 text-left shadow-[0_2px_10px_rgba(51,38,28,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(181,71,31,0.18)]"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{ backgroundColor: a.tint }}
                >
                  <Icon size={22} style={{ color: a.iconColor }} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold text-[var(--ink)]">{a.title}</h3>
                  <p className="text-[12.5px] leading-relaxed text-[var(--ink-soft)] line-clamp-2">{a.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
