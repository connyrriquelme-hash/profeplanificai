import { FormEvent, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import type { CopilotProjectResult, DuaGuide, PedagogicalPlan } from '../types/copilot';
import { saveToBank } from '../services/bankService';
import { CurriculumSelector, type CurriculumSelection } from '../components/CurriculumSelector';
import { useActiveLesson } from '../contexts/ActiveLessonContext';

const TOAST_ID = 'dua-guide-generate';

const TOAST_STYLE = {
  style: {
    borderRadius: '16px',
    background: '#1e1b4b',
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: 600,
    padding: '12px 16px',
  },
  success: {
    iconTheme: { primary: '#22c55e', secondary: '#f1f5f9' },
  },
  error: {
    iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' },
  },
};

function LevelCard({ 
  title, 
  items, 
  borderColor, 
  bgColor, 
  iconColor 
}: { 
  title: string; 
  items: string[]; 
  borderColor: string;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <section className={`rounded-3xl border-2 ${borderColor} ${bgColor} p-5 shadow-sm print:break-inside-avoid print:border-slate-300 print:bg-white print:p-4 print:shadow-none`}>
      <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 print:text-black">
        <span className={`text-xl ${iconColor}`} aria-hidden="true"></span>
        {title}
      </h3>
      <ol className="mt-3 space-y-2 list-decimal list-inside text-sm text-slate-700 print:text-black">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="leading-relaxed">{item}</li>
        ))}
      </ol>
    </section>
  );
}

function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="h-5 w-40 rounded-lg bg-slate-200 animate-pulse" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-slate-200 animate-pulse" style={{ width: `${85 - i * 10}%` }} />
        ))}
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Generando guía DUA...">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="h-3 w-32 rounded bg-slate-200 animate-pulse" />
            <div className="mt-2 h-7 w-72 rounded-lg bg-slate-200 animate-pulse" />
          </div>
          <div className="h-9 w-40 rounded-2xl bg-slate-200 animate-pulse" />
        </div>
        <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-200 p-5">
          <div className="h-3 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="mt-2 h-4 w-full rounded bg-slate-200 animate-pulse" />
          <div className="mt-1 h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="mt-2 h-4 w-full rounded bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="h-5 w-48 rounded-lg bg-slate-200 animate-pulse" />
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="h-3 w-28 rounded bg-slate-200 animate-pulse" />
              <div className="mt-2 h-3 w-full rounded bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DuaGuideGenerator() {
  const { curriculum: activeLesson, hasCurriculum } = useActiveLesson();
  const [curriculumSelection, setCurriculumSelection] = useState<CurriculumSelection>({
    level: '',
    subject: '',
    tema: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CopilotProjectResult | null>(null);

  // Pre-populate from ActiveLessonContext when navigating from MisClases
  useEffect(() => {
    if (hasCurriculum && activeLesson.level && activeLesson.subject) {
      setCurriculumSelection({
        level: activeLesson.level,
        levelId: activeLesson.levelId,
        subject: activeLesson.subject,
        subjectId: activeLesson.subjectId,
        objectiveId: activeLesson.objectiveId,
        objectiveCode: activeLesson.objectiveCode,
        objectiveText: activeLesson.objectiveText,
        indicators: activeLesson.indicators,
        skills: activeLesson.skills,
        criteria: activeLesson.criteria,
        curricularSkills: activeLesson.curricularSkills,
        tema: '',
      });
      return;
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    toast.loading('Generando tu planificación...', { id: TOAST_ID });

    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nivel: curriculumSelection.level,
          asignatura: curriculumSelection.subject,
          tema: curriculumSelection.tema || '',
          objectiveCode: curriculumSelection.objectiveCode || '',
          objectiveText: curriculumSelection.objectiveText || '',
          indicators: curriculumSelection.indicators || [],
          skills: curriculumSelection.skills || [],
          criteria: curriculumSelection.criteria || [],
          curricularSkills: (curriculumSelection.curricularSkills || []).map((s: any) => s.title || s.name || s),
        }),
      });

      const payload = await response.json() as CopilotProjectResult & { error?: string; details?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.details || payload.error || 'No se pudo generar el proyecto.');
      }

      setResult(payload);
      toast.dismiss(TOAST_ID);
      toast.success('Planificación generada con éxito');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido.');
      toast.dismiss(TOAST_ID);
      toast.error('Ocurrió un error al generar la planificación. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const duaGuide = result?.duaGuide;

  const handleSaveToBank = async () => {
    if (!result || !duaGuide) return;
    toast.loading('Guardando en Banco de Recursos...', { id: TOAST_ID });
    try {
      const content = JSON.stringify({
        title: duaGuide.titulo_guia,
        action: 'guia_dua',
        kind: 'resource',
        generatedAt: new Date().toISOString(),
        plan: result.plan,
        duaGuide,
        curriculumSelection,
      });
      await saveToBank({
        title: duaGuide.titulo_guia || 'Guía DUA Multinivel',
        type: 'recurso_dua',
        content,
        source: 'guia_dua',
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
    <div className="mx-auto max-w-6xl space-y-6 print:m-0 print:w-full print:max-w-none print:bg-white print:p-0 print:text-black">
      <style>{`
        @media print {
          @page { margin: 14mm; }
          body { background: #ffffff !important; }
          body * { visibility: hidden; }
          #copilot-print-area, #copilot-print-area * { visibility: visible; }
          #copilot-print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      <div className="rounded-[2rem] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 p-6 text-white shadow-lg print:hidden">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">Copilot pedagógico</p>
        <h1 className="mt-2 text-3xl font-black">Generador de Guía DUA</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/85">
          Selecciona nivel, asignatura y OA para generar una guía DUA multinivel completa con IA.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 print:hidden">
        <CurriculumSelector
          value={curriculumSelection}
          onChange={setCurriculumSelection}
          required
        />

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tema</label>
          <input
            value={curriculumSelection.tema || ''}
            onChange={(event) => setCurriculumSelection(prev => ({ ...prev, tema: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            placeholder="Ej: La célula"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !curriculumSelection.level || !curriculumSelection.subject || !curriculumSelection.objectiveCode || !curriculumSelection.tema}
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Generando...' : 'Generar Guía DUA'}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 print:hidden">
          {error}
        </div>
      )}

      {loading && <SkeletonLoader />}

      {result && (
        <div id="copilot-print-area" className="space-y-5 print:w-full print:max-w-none print:space-y-4 print:bg-white print:text-black">
          <div className="hidden print:block print:break-inside-avoid print:border-b print:border-black print:pb-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-black">
              Guía DUA Multinivel - Generado por ProfePlanificAI
            </p>
            <p className="mt-1 text-sm text-black">Documento de apoyo docente para revisión, ajuste y uso profesional.</p>
          </div>

          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm print:break-inside-avoid print:rounded-none print:border-slate-300 print:p-0 print:pb-4 print:shadow-none">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-500 print:text-black">Guía DUA Generada</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 print:text-2xl print:text-black">
                  {duaGuide?.titulo_guia || 'Guía DUA Multinivel'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleSaveToBank}
                className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-violet-700 print:hidden shrink-0"
              >
                Guardar en Banco
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-violet-700 print:hidden shrink-0"
              >
                Exportar a PDF / Imprimir
              </button>
            </div>

            {duaGuide?.contexto_motivacional && (
              <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-200 p-5 print:break-inside-avoid print:bg-white print:border-slate-200 print:p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-600 print:text-black">Contexto Motivacional</p>
                <p className="mt-2 text-base italic text-gray-800 leading-relaxed print:text-black">{duaGuide.contexto_motivacional}</p>
              </div>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-3 print:grid-cols-1">
              <div className="rounded-2xl bg-green-50 p-4 border border-green-200 print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-green-600 print:text-black">OA a trabajar</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 print:text-black">{result.plan.objetivo_aprendizaje}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200 print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-blue-600 print:text-black">Habilidades</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 print:text-black">{result.plan.habilidades}</p>
              </div>
              <div className="rounded-2xl bg-orange-50 p-4 border border-orange-200 print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-orange-600 print:text-black">Bloom sugerido</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 print:text-black">{result.plan.taxonomia_bloom_sugerida}</p>
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
            <LevelCard
              title="Nivel de Apoyo"
              items={duaGuide?.nivel_apoyo || []}
              borderColor="border-green-300"
              bgColor="bg-green-50"
              iconColor="text-green-600"
            />
            <LevelCard
              title="Nivel Estándar"
              items={duaGuide?.nivel_estandar || []}
              borderColor="border-blue-300"
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <LevelCard
              title="Nivel Desafío"
              items={duaGuide?.nivel_desafio || []}
              borderColor="border-orange-300"
              bgColor="bg-orange-50"
              iconColor="text-orange-600"
            />
          </div>

          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm print:break-before-page print:break-inside-avoid print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
            <h3 className="text-lg font-black text-slate-900 print:text-black">Principios DUA aplicados</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <div className="rounded-xl bg-blue-50 p-3 border border-blue-200 print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-blue-600 print:text-black">Representación</p>
                <p className="mt-1 text-xs text-slate-700 print:text-black">Múltiples medios: texto, imágenes, esquemas visuales, organizadores gráficos</p>
              </div>
              <div className="rounded-xl bg-green-50 p-3 border border-green-200 print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-green-600 print:text-black">Acción y Expresión</p>
                <p className="mt-1 text-xs text-slate-700 print:text-black">Diversas formas: escritura, oralidad, esquemas, modelos, debate</p>
              </div>
              <div className="rounded-xl bg-orange-50 p-3 border border-orange-200 print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-orange-600 print:text-black">Implicación</p>
                <p className="mt-1 text-xs text-slate-700 print:text-black">Intereses reales, autonomía, desafío progresivo, retroalimentación formativa</p>
              </div>
            </div>
          </section>
        </div>
      )}

      <Toaster
        position="top-center"
        toastOptions={TOAST_STYLE}
        containerStyle={{ marginTop: 80 }}
      />
    </div>
  );
}
