import { FormEvent, useState } from 'react';
import type { CopilotProjectResult } from '../types/copilot';

const DEFAULT_FORM = {
  nivel: '5° Básico',
  asignatura: 'Ciencias Naturales',
  tema: 'La célula',
};

function ActivityCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm print:break-inside-avoid print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
      <h3 className="text-lg font-black text-slate-900 print:text-black">{title}</h3>
      <ol className="mt-3 space-y-2 list-decimal list-inside text-sm text-slate-700 print:text-black">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="leading-relaxed">{item}</li>
        ))}
      </ol>
    </section>
  );
}

export function CopilotTest() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CopilotProjectResult | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json() as CopilotProjectResult & { error?: string; details?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.details || payload.error || 'No se pudo generar el proyecto.');
      }

      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setLoading(false);
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
        <h1 className="mt-2 text-3xl font-black">Generador de proyecto de clase</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/85">
          Prueba la orquestación CORE_DB → PedagogicalEngine → Workers AI → planificación estructurada.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:grid-cols-4 print:hidden">
        {(['nivel', 'asignatura', 'tema'] as const).map((field) => (
          <label key={field} className="space-y-2 md:col-span-1">
            <span className="text-xs font-black uppercase text-slate-500">{field}</span>
            <input
              value={form[field]}
              onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              placeholder={field}
            />
          </label>
        ))}
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Generando...' : 'Generar Proyecto'}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 print:hidden">
          {error}
        </div>
      )}

      {result && (
        <div id="copilot-print-area" className="space-y-5 print:w-full print:max-w-none print:space-y-4 print:bg-white print:text-black">
          <div className="hidden print:block print:break-inside-avoid print:border-b print:border-black print:pb-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-black">
              Planificación Curricular - Generado por ProfePlanificAI
            </p>
            <p className="mt-1 text-sm text-black">Documento de apoyo docente para revisión, ajuste y uso profesional.</p>
          </div>

          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm print:break-inside-avoid print:rounded-none print:border-slate-300 print:p-0 print:pb-4 print:shadow-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-500 print:text-black">Resultado IA</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 print:text-2xl print:text-black">
                  {result.contenido.titulo_clase}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-violet-700 print:hidden"
              >
                Exportar a PDF / Imprimir
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3 print:grid-cols-1">
              <div className="rounded-2xl bg-violet-50 p-4 print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-violet-500 print:text-black">OA a trabajar</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 print:text-black">{result.plan.objetivo_aprendizaje}</p>
              </div>
              <div className="rounded-2xl bg-fuchsia-50 p-4 print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-fuchsia-500 print:text-black">Habilidades</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 print:text-black">{result.plan.habilidades}</p>
              </div>
              <div className="rounded-2xl bg-pink-50 p-4 print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-pink-500 print:text-black">Bloom sugerido</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 print:text-black">{result.plan.taxonomia_bloom_sugerida}</p>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3 print:block print:space-y-4">
            <ActivityCard title={`Inicio (${result.plan.estructura_clase.inicio.tiempo_minutos} min)`} items={result.contenido.actividades_inicio} />
            <ActivityCard title={`Desarrollo (${result.plan.estructura_clase.desarrollo.tiempo_minutos} min)`} items={result.contenido.actividades_desarrollo} />
            <ActivityCard title={`Cierre (${result.plan.estructura_clase.cierre.tiempo_minutos} min)`} items={result.contenido.actividades_cierre} />
          </div>

          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm print:break-before-page print:break-inside-avoid print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
            <h3 className="text-lg font-black text-slate-900 print:text-black">Materiales sugeridos</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.contenido.materiales_sugeridos.map((material) => (
                <span key={material} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 print:rounded-none print:border print:border-slate-300 print:bg-white print:text-black">
                  {material}
                </span>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
