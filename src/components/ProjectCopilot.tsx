import { FormEvent, useState } from 'react';
import { Bot, Loader2, AlertCircle, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import type { CopilotProjectResult } from '../types/copilot';

interface ProjectCopilotProps {
  onNavigate?: (view: string) => void;
}

const CURSOS = [
  '1° Básico', '2° Básico', '3° Básico', '4° Básico',
  '5° Básico', '6° Básico', '7° Básico', '8° Básico',
  '1° Medio', '2° Medio', '3° Medio', '4° Medio',
];

const ASIGNATURAS = [
  'Lenguaje y Comunicación', 'Lengua y Literatura', 'Matemática',
  'Ciencias Naturales', 'Historia, Geografía y Ciencias Sociales',
  'Educación Ciudadana', 'Inglés', 'Filosofía',
  'Física', 'Química', 'Biología',
];

export function ProjectCopilot({ onNavigate }: ProjectCopilotProps) {
  const [tema, setTema] = useState('La célula');
  const [curso, setCurso] = useState('5° Básico');
  const [asignatura, setAsignatura] = useState('Ciencias Naturales');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CopilotProjectResult | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTema = tema.trim();
    const trimmedCurso = curso.trim();
    const trimmedAsignatura = asignatura.trim();

    if (!trimmedTema || !trimmedCurso || !trimmedAsignatura) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: trimmedTema, curso: trimmedCurso, asignatura: trimmedAsignatura }),
      });

      const json = await res.json();

      if (!json.ok) {
        const msg = json.error || 'Error desconocido al generar.';
        if (res.status === 404) {
          setError(`No se encontró OA para ${trimmedCurso} / ${trimmedAsignatura}.`);
        } else if (res.status === 400) {
          setError(msg);
        } else {
          setError(msg);
        }
        return;
      }

      setResult(json as CopilotProjectResult);
    } catch {
      setError('Error de conexión. Verifica tu red y vuelve a intentar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <header className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
          <Bot size={14} /> Project Copilot
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Generador de Planificación</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Ingresa tema, curso y asignatura para generar una planificación completa con IA.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tema</label>
            <input
              type="text"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ej: La célula"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Curso</label>
            <select
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition"
            >
              {CURSOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Asignatura</label>
            <select
              value={asignatura}
              onChange={(e) => setAsignatura(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition"
            >
              {ASIGNATURAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generando planificación…
            </>
          ) : (
            <>
              <Bot size={16} />
              Generar planificación
            </>
          )}
        </button>
      </form>

      {result && result.plan && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">{result.plan.tema}</h2>
            <p className="text-sm text-slate-500">{result.plan.curso} — {result.plan.asignatura}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard label="Objetivo de Aprendizaje" value={result.plan.objetivo_aprendizaje} />
            <InfoCard label="Habilidades" value={result.plan.habilidades} />
            <InfoCard label="Taxonomía Bloom" value={result.plan.taxonomia_bloom_sugerida} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StageCard
              title="Inicio"
              time={result.plan.estructura_clase.inicio.tiempo_minutos}
              description={result.plan.estructura_clase.inicio.descripcion}
              color="emerald"
            />
            <StageCard
              title="Desarrollo"
              time={result.plan.estructura_clase.desarrollo.tiempo_minutos}
              description={result.plan.estructura_clase.desarrollo.descripcion}
              color="blue"
            />
            <StageCard
              title="Cierre"
              time={result.plan.estructura_clase.cierre.tiempo_minutos}
              description={result.plan.estructura_clase.cierre.descripcion}
              color="amber"
            />
          </div>

          {result.duaGuide && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">{result.duaGuide.titulo_guia}</h3>
              {result.duaGuide.contexto_motivacional && (
                <p className="text-sm text-slate-600 italic">{result.duaGuide.contexto_motivacional}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DuaLevelCard title="Nivel de Apoyo" items={result.duaGuide.nivel_apoyo} color="rose" />
                <DuaLevelCard title="Nivel Estándar" items={result.duaGuide.nivel_estandar} color="sky" />
                <DuaLevelCard title="Nivel Desafío" items={result.duaGuide.nivel_desafio} color="violet" />
              </div>
            </div>
          )}
        </div>
      )}

      {loading && !result && (
        <div className="space-y-4">
          <SkeletonCard />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">{label}</p>
      <p className="text-sm text-slate-800 leading-relaxed">{value}</p>
    </div>
  );
}

function StageCard({ title, time, description, color }: { title: string; time: number; description: string; color: 'emerald' | 'blue' | 'amber' }) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  const headerColors = {
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
  };

  return (
    <div className={`rounded-2xl border ${colors[color]} p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} className={headerColors[color]} />
        <span className="text-xs font-bold tracking-wide uppercase">{title}</span>
        <span className="ml-auto text-xs font-mono opacity-70">{time} min</span>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{description}</p>
    </div>
  );
}

function DuaLevelCard({ title, items, color }: { title: string; items: string[]; color: 'rose' | 'sky' | 'violet' }) {
  const colors = {
    rose: 'bg-rose-50 border-rose-200',
    sky: 'bg-sky-50 border-sky-200',
    violet: 'bg-violet-50 border-violet-200',
  };

  return (
    <div className={`rounded-xl border ${colors[color]} p-4`}>
      <p className="text-xs font-bold text-slate-700 mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
            <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0 text-slate-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="h-4 w-32 rounded-lg bg-slate-200 animate-pulse" />
      <div className="mt-4 space-y-2">
        <div className="h-3 rounded bg-slate-200 animate-pulse w-full" />
        <div className="h-3 rounded bg-slate-200 animate-pulse w-4/5" />
        <div className="h-3 rounded bg-slate-200 animate-pulse w-3/5" />
      </div>
    </div>
  );
}
