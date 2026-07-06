import { FormEvent, useEffect, useState } from 'react';
import { Bot, Loader2, AlertCircle, Clock, CheckCircle2, Printer, Save } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import type { CopilotProjectResult } from '../types/copilot';
import { saveToBank } from '../services/bankService';
import { CurriculumSelector, type CurriculumSelection } from './CurriculumSelector';

interface CurriculumNivel {
  nivel: string;
  asignaturas: string[];
}

const TOAST_ID = 'project-copilot-save';

interface ProjectCopilotProps {
  onNavigate?: (view: string) => void;
}

export function ProjectCopilot({ onNavigate }: ProjectCopilotProps) {
  const [tema, setTema] = useState('La célula');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CopilotProjectResult | null>(null);
  const [curriculumSelection, setCurriculumSelection] = useState<CurriculumSelection>({
    level: '',
    subject: '',
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchFirstLevel() {
      try {
        const res = await fetch('/api/curriculum');
        const json = await res.json() as { ok: boolean; data: CurriculumNivel[] };
        if (!cancelled && json.ok && json.data.length > 0) {
          const first = json.data[0];
          setCurriculumSelection(prev => ({
            ...prev,
            level: first.nivel,
            subject: first.asignaturas[0] || '',
          }));
        }
      } catch {
        // silent — fallback
      }
    }
    fetchFirstLevel();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTema = tema.trim();
    const trimmedLevel = (curriculumSelection.level || '').trim();
    const trimmedAsignatura = (curriculumSelection.subject || '').trim();

    if (!trimmedTema || !trimmedLevel || !trimmedAsignatura) {
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
        body: JSON.stringify({
          tema: trimmedTema,
          nivel: trimmedLevel,
          asignatura: trimmedAsignatura,
          objectiveCode: curriculumSelection.objectiveCode || '',
          objectiveText: curriculumSelection.objectiveText || '',
          indicators: curriculumSelection.indicators || [],
          skills: curriculumSelection.skills || [],
          criteria: curriculumSelection.criteria || [],
          curricularSkills: (curriculumSelection.curricularSkills || []).map((s: any) => s.title || s.name || s),
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        const msg = json.error || 'Error desconocido al generar.';
        if (res.status === 404) {
          setError(`No se encontró OA para ${trimmedLevel} / ${trimmedAsignatura}.`);
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

  const handleSaveToBank = async () => {
    if (!result || !result.plan) return;
    toast.loading('Guardando en Banco de Recursos...', { id: TOAST_ID });
    try {
      const content = JSON.stringify({
        title: `Planificación: ${result.plan.tema}`,
        action: 'project_copilot',
        kind: 'resource',
        generatedAt: new Date().toISOString(),
        plan: result.plan,
        duaGuide: result.duaGuide || null,
        curriculumSelection,
      });
      await saveToBank({
        title: `Planificación: ${result.plan.tema}`,
        type: 'planificacion_clase',
        content,
        source: 'project_copilot',
        level: result.plan.curso,
        subject: result.plan.asignatura,
        objectiveCode: curriculumSelection.objectiveCode || result.plan.objetivo_aprendizaje,
        objectiveText: curriculumSelection.objectiveText || result.plan.objetivo_aprendizaje,
        skill: curriculumSelection.skills?.join(', ') || result.plan.habilidades,
        indicators: curriculumSelection.indicators,
        criteria: curriculumSelection.criteria,
        curricularSkills: (curriculumSelection.curricularSkills || []).map((s: any) => s.title || s.name || s),
      });
      toast.dismiss(TOAST_ID);
      toast.success('Guardado en Banco de Recursos');
    } catch {
      toast.dismiss(TOAST_ID);
      toast.error('No se pudo guardar. Intenta de nuevo.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <header className="no-print text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
          <Bot size={14} /> Project Copilot
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Generador de Planificación</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Ingresa tema, nivel, asignatura y objetivo para generar una planificación completa con IA.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="no-print bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
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

        <CurriculumSelector
          value={curriculumSelection}
          onChange={setCurriculumSelection}
          required
        />

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
          <div className="no-print flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveToBank}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition cursor-pointer"
            >
              <Save size={16} />
              Guardar en Banco
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition cursor-pointer"
            >
              <Printer size={16} />
              Exportar a PDF
            </button>
          </div>

          <div className="print-area">
            <div className="print-header">
              <h1 className="print-title">Planificación Docente</h1>
              <p className="print-subtitle">{result.plan.curso} — {result.plan.asignatura}</p>
            </div>

            <div className="print-section">
              <h2 className="print-section-title">Tema</h2>
              <p className="print-body">{result.plan.tema}</p>
            </div>

            <div className="print-meta-grid">
              <div className="print-meta-item">
                <span className="print-meta-label">Objetivo de Aprendizaje</span>
                <span className="print-meta-value">{result.plan.objetivo_aprendizaje}</span>
              </div>
              <div className="print-meta-item">
                <span className="print-meta-label">Habilidades</span>
                <span className="print-meta-value">{result.plan.habilidades}</span>
              </div>
              <div className="print-meta-item">
                <span className="print-meta-label">Taxonomía Bloom</span>
                <span className="print-meta-value">{result.plan.taxonomia_bloom_sugerida}</span>
              </div>
            </div>

            <div className="print-section">
              <h2 className="print-section-title">Estructura de la Clase</h2>
              <div className="print-stage">
                <div className="print-stage-header print-stage-inicio">
                  <span className="print-stage-name">Inicio</span>
                  <span className="print-stage-time">{result.plan.estructura_clase.inicio.tiempo_minutos} min</span>
                </div>
                <p className="print-body">{result.plan.estructura_clase.inicio.descripcion}</p>
              </div>
              <div className="print-stage">
                <div className="print-stage-header print-stage-desarrollo">
                  <span className="print-stage-name">Desarrollo</span>
                  <span className="print-stage-time">{result.plan.estructura_clase.desarrollo.tiempo_minutos} min</span>
                </div>
                <p className="print-body">{result.plan.estructura_clase.desarrollo.descripcion}</p>
              </div>
              <div className="print-stage">
                <div className="print-stage-header print-stage-cierre">
                  <span className="print-stage-name">Cierre</span>
                  <span className="print-stage-time">{result.plan.estructura_clase.cierre.tiempo_minutos} min</span>
                </div>
                <p className="print-body">{result.plan.estructura_clase.cierre.descripcion}</p>
              </div>
            </div>

            {result.duaGuide && (
              <div className="print-section print-break-before">
                <h2 className="print-section-title">{result.duaGuide.titulo_guia}</h2>
                {result.duaGuide.contexto_motivacional && (
                  <p className="print-italic">{result.duaGuide.contexto_motivacional}</p>
                )}
                <div className="print-dua-grid">
                  <div className="print-dua-column">
                    <h3 className="print-dua-level">Nivel de Apoyo</h3>
                    <ul className="print-list">
                      {result.duaGuide.nivel_apoyo.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="print-dua-column">
                    <h3 className="print-dua-level">Nivel Estándar</h3>
                    <ul className="print-list">
                      {result.duaGuide.nivel_estandar.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="print-dua-column">
                    <h3 className="print-dua-level">Nivel Desafío</h3>
                    <ul className="print-list">
                      {result.duaGuide.nivel_desafio.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="screen-only space-y-6">
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
        </div>
      )}

      {loading && !result && (
        <div className="no-print space-y-4">
          <SkeletonCard />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '16px',
            background: '#1e1b4b',
            color: '#f1f5f9',
            fontSize: '14px',
            fontWeight: 600,
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#f1f5f9' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
        }}
        containerStyle={{ marginTop: 80 }}
      />
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
