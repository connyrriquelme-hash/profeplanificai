import { FormEvent, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import type { CopilotProjectResult, DuaGuide, FichaDiferenciada, FichasDua, PedagogicalPlan } from '../types/copilot';
import { saveToBank } from '../services/bankService';
import { api } from '../services/apiClient';
import { CurriculumSelector, type CurriculumSelection } from '../components/CurriculumSelector';
import { useActiveLesson } from '../contexts/ActiveLessonContext';

const TOAST_ID = 'dua-guide-generate';
const FICHAS_TOAST_ID = 'dua-fichas-generate';

const NIVEL_LABELS: Record<FichaDiferenciada['nivel'], string> = {
  apoyo: 'Apoyo',
  estandar: 'Estándar',
  desafio: 'Desafío',
};

const NIVEL_STYLES: Record<FichaDiferenciada['nivel'], { border: string; bg: string; text: string }> = {
  apoyo: { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-700' },
  estandar: { border: 'border-[var(--primary)]', bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary-ink)]' },
  desafio: { border: 'border-orange-300', bg: 'bg-orange-50', text: 'text-orange-700' },
};

const TOAST_STYLE = {
  style: {
    borderRadius: '16px',
    background: '#33261C',
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

function DetailCard({ title, text, items }: { title: string; text?: string; items?: string[] }) {
  const safeItems = (items || []).filter(Boolean);
  if (!text && safeItems.length === 0) return null;

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm print:break-inside-avoid print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
      <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[var(--primary)] print:text-black">{title}</h3>
      {text && <p className="mt-2 text-sm leading-relaxed text-slate-700 print:text-black">{text}</p>}
      {safeItems.length > 0 && (
        <ul className="mt-3 space-y-2 list-disc pl-5 text-sm leading-relaxed text-slate-700 print:text-black">
          {safeItems.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
        </ul>
      )}
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
        <div className="mt-4 rounded-2xl bg-gray-50 border border-[var(--border)] p-5">
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

// EMOJI_MARKERS es un cue visual de "marca uno con el lápiz" para la
// versión impresa (círculo alrededor de cada emoji) — nunca son elementos
// clicables reales: #fichas-print-area está oculto en pantalla (solo se
// muestra vía la clase body.printing-fichas-only durante window.print()),
// así que no hay ningún contexto interactivo donde un onClick tendría efecto.
const EMOJI_MARKERS = ['😊', '😐', '😟'];
const RESPUESTA_LINEAS = 3;

// printMode diferencia SOLO lo que la tarea pidió exclusivo del área de
// impresión (encabezado con nombre/fecha, autoevaluación con emojis
// marcables) — el word bank y las líneas de respuesta se ven mejorados en
// ambos contextos porque el punto 3 de la tarea pide previsualizarlos
// igual en pantalla antes de imprimir.
function FichaCard({ ficha, printMode = false }: { ficha: FichaDiferenciada; printMode?: boolean }) {
  const style = NIVEL_STYLES[ficha.nivel];

  return (
    <section className={`ficha-card rounded-3xl border-2 ${style.border} ${style.bg} p-5 shadow-sm print:break-after-page print:break-inside-avoid print:rounded-none print:border-2 print:border-black print:bg-white print:p-6`}>
      {printMode && (
        <div className="mb-4 flex flex-wrap gap-6 border-b-2 border-slate-800 pb-3 text-sm text-slate-800">
          <p className="min-w-[200px] flex-1">Nombre: <span className="inline-block w-full border-b border-slate-800">&nbsp;</span></p>
          <p className="w-40">Fecha: <span className="inline-block w-full border-b border-slate-800">&nbsp;</span></p>
        </div>
      )}

      <p className={`inline-block rounded-full border-2 ${style.border} px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${style.text} print:border-black print:text-black`}>
        {NIVEL_LABELS[ficha.nivel]}
      </p>
      <h3 className="mt-2 text-xl font-black text-slate-900 print:text-black">{ficha.titulo}</h3>

      <div className="mt-3 rounded-2xl border-2 border-slate-300 bg-white/80 p-4 print:rounded-none print:border-black print:bg-white">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 print:text-black">🎯 Objetivo</p>
        <p className="mt-1 text-sm font-bold text-slate-800 print:text-black">{ficha.objetivo}</p>
      </div>

      <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-400 bg-amber-50 p-4 print:rounded-none print:border-solid print:border-black print:bg-white">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-700 print:text-black">🔑 Palabras clave</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 print:grid-cols-2">
          {ficha.vocabularioClave.map((item, index) => (
            <div key={`${ficha.nivel}-vocab-${index}`} className="rounded-xl border border-slate-300 bg-white px-3 py-2 print:rounded-none print:border-black">
              <p className="text-sm font-black text-slate-900 print:text-black">{item.termino}</p>
              <p className="text-xs text-slate-600 print:text-black">{item.definicion}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600 print:text-black">✏️ Actividades</p>
        <ol className="mt-2 space-y-4 list-decimal list-inside text-sm text-slate-800 print:text-black">
          {ficha.actividades.map((actividad, index) => (
            <li key={`${ficha.nivel}-act-${index}`} className="leading-relaxed">
              <span className="font-black">{actividad.instruccion}</span>
              {actividad.espacioRespuesta && (
                <div className="mt-2 ml-5 space-y-4" aria-hidden="true">
                  {Array.from({ length: RESPUESTA_LINEAS }).map((_, lineIndex) => (
                    <div key={lineIndex} className="border-b border-dotted border-slate-400 print:border-black" />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 rounded-2xl border-2 border-slate-300 bg-white/80 p-4 print:rounded-none print:border-black print:bg-white">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-700 print:text-black">
          {printMode ? '¿Cómo me fue?' : 'Autoevaluación'}
        </p>
        {printMode ? (
          <ul className="mt-3 space-y-3 text-sm text-slate-800">
            {ficha.autoevaluacion.map((pregunta, index) => (
              <li key={`${ficha.nivel}-auto-${index}`} className="flex flex-wrap items-center justify-between gap-3">
                <span>{pregunta}</span>
                <span className="flex shrink-0 gap-2 text-lg" aria-hidden="true">
                  {EMOJI_MARKERS.map((emoji) => (
                    <span key={emoji} className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-400 print:border-black">
                      {emoji}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-2 space-y-1 list-disc pl-4 text-sm text-slate-700">
            {ficha.autoevaluacion.map((pregunta, index) => (
              <li key={`${ficha.nivel}-auto-${index}`}>{pregunta}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
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
  const [fichas, setFichas] = useState<FichasDua | null>(null);
  const [fichasLoading, setFichasLoading] = useState(false);
  const [fichasError, setFichasError] = useState('');
  const [activeFichaTab, setActiveFichaTab] = useState<FichaDiferenciada['nivel']>('apoyo');
  const [printingFichas, setPrintingFichas] = useState(false);

  console.debug('[DUA-DBG] RENDER', {
    level: curriculumSelection.level,
    levelId: curriculumSelection.levelId,
    subject: curriculumSelection.subject,
    subjectId: curriculumSelection.subjectId,
    objectiveCode: curriculumSelection.objectiveCode,
    hasCurriculum,
  });

  // Pre-populate only level/subject from ActiveLessonContext.
  // OA must be selected manually before generating.
  useEffect(() => {
    if (hasCurriculum && activeLesson.level && activeLesson.subject) {
      setCurriculumSelection({
        level: activeLesson.level,
        levelId: activeLesson.levelId,
        subject: activeLesson.subject,
        subjectId: activeLesson.subjectId,
        objectiveId: '',
        objectiveCode: '',
        objectiveText: '',
        indicators: [],
        skills: [],
        criteria: [],
        curricularSkills: [],
        tema: '',
      });
      return;
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedObjectiveCode = (curriculumSelection.objectiveCode || '').trim();

    if (!selectedObjectiveCode) {
      setError('Selecciona un objetivo de aprendizaje antes de generar');
      toast.error('Selecciona un objetivo de aprendizaje antes de generar');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setFichas(null);
    setFichasError('');

    toast.loading('Generando tu planificación...', { id: TOAST_ID });

    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nivel: curriculumSelection.level,
          asignatura: curriculumSelection.subject,
          tema: curriculumSelection.tema || '',
          objectiveId: curriculumSelection.objectiveId || '',
          objectiveCode: selectedObjectiveCode,
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
        objectiveCode: curriculumSelection.objectiveCode || '',
        objectiveText: curriculumSelection.objectiveText || '',
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

  const handleGenerateFichas = async () => {
    if (!result || !duaGuide) return;
    setFichasLoading(true);
    setFichasError('');
    toast.loading('Generando fichas para estudiantes...', { id: FICHAS_TOAST_ID });

    try {
      // Usa result.plan (lo efectivamente generado) en vez de curriculumSelection
      // (el formulario, que sigue siendo editable mientras el resultado está en
      // pantalla) para que las fichas nunca queden desalineadas con el duaGuide
      // que se les pasa — mismo criterio que handleSaveToBank ya aplica arriba.
      const response = await api.post<{ fichas: FichasDua }>('/api/generate-fichas-dua', {
        duaGuide,
        level: result.plan.curso,
        subject: result.plan.asignatura,
        topic: result.plan.tema || '',
      });

      setFichas(response.fichas);
      setActiveFichaTab('apoyo');
      toast.dismiss(FICHAS_TOAST_ID);
      toast.success('Fichas generadas con éxito');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido.';
      setFichasError(message);
      toast.dismiss(FICHAS_TOAST_ID);
      toast.error('No se pudieron generar las fichas. Inténtalo de nuevo.');
    } finally {
      setFichasLoading(false);
    }
  };

  const handlePrintFichas = () => {
    setPrintingFichas(true);
    document.body.classList.add('printing-fichas-only');
    const cleanup = () => {
      document.body.classList.remove('printing-fichas-only');
      setPrintingFichas(false);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  return (
    <div className="w-full space-y-6 print:m-0 print:w-full print:max-w-none print:bg-white print:p-0 print:text-black">
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

          /* Modo "Imprimir fichas": oculta el documento DUA completo y
             muestra solo #fichas-print-area, en vez del árbol normal. */
          body.printing-fichas-only #copilot-print-area,
          body.printing-fichas-only #copilot-print-area * {
            visibility: hidden !important;
          }
          body.printing-fichas-only #fichas-print-area {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          body.printing-fichas-only #fichas-print-area,
          body.printing-fichas-only #fichas-print-area * {
            visibility: visible;
          }

          /* Cada ficha en su propia hoja, con tamaño e interlineado legibles
             para un estudiante leyendo en papel — las utilidades de Tailwind
             (text-xs/text-sm) quedan más chicas que 12pt, así que se
             sobre-escriben acá con !important solo dentro del área de
             fichas, sin tocar el resto del documento DUA. */
          body.printing-fichas-only .ficha-card {
            page-break-after: always;
            break-after: page;
          }
          body.printing-fichas-only #fichas-print-area,
          body.printing-fichas-only #fichas-print-area p,
          body.printing-fichas-only #fichas-print-area li,
          body.printing-fichas-only #fichas-print-area span,
          body.printing-fichas-only #fichas-print-area dt,
          body.printing-fichas-only #fichas-print-area dd {
            font-size: 12pt !important;
            line-height: 1.5 !important;
          }
          body.printing-fichas-only #fichas-print-area h3 {
            font-size: 16pt !important;
            line-height: 1.4 !important;
          }
        }
      `}</style>

      {printingFichas && (
        <style>{`
          @media print {
            /* Fichas piden 15mm (vs. los 14mm del documento DUA completo);
               este bloque solo existe en el DOM mientras se imprime fichas,
               así que gana por orden de aparición y no afecta el otro flujo. */
            @page { margin: 15mm; }
          }
        `}</style>
      )}

      <div className="rounded-[2rem] bg-[var(--primary)] p-6 text-white shadow-lg print:hidden">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">Copilot pedagógico</p>
        <h1 className="mt-2 text-3xl font-black">Generador de Guía DUA</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/85">
          Selecciona nivel, asignatura y OA para generar una guía DUA multinivel completa con IA.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 print:hidden">
        <CurriculumSelector
          value={curriculumSelection}
          onChange={(s) => {
            console.debug('[DUA-DBG] CurriculumSelector.onChange', { level: s.level, levelId: s.levelId, subject: s.subject, subjectId: s.subjectId, objectiveCode: s.objectiveCode });
            setCurriculumSelection(s);
          }}
          required
        />

        {curriculumSelection.level && curriculumSelection.subject && !curriculumSelection.objectiveCode && (
          <p className="text-xs font-semibold text-amber-600">
            Selecciona un objetivo de aprendizaje antes de generar
          </p>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tema</label>
          <input
            value={curriculumSelection.tema || ''}
            onChange={(event) => setCurriculumSelection(prev => ({ ...prev, tema: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-tint)]"
            placeholder="Ej: La célula"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !curriculumSelection.level || !curriculumSelection.subject || !curriculumSelection.objectiveCode || !curriculumSelection.tema}
            className="rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-5 py-3 text-sm font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
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

          {result.usedFallback && (
            <div className="print:hidden flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              <span aria-hidden="true">⚠️</span>
              <span>La IA no respondió a tiempo, así que esta guía se generó en modo de respaldo (contenido más genérico). Puedes intentar generar de nuevo.</span>
            </div>
          )}

          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm print:break-inside-avoid print:rounded-none print:border-slate-300 print:p-0 print:pb-4 print:shadow-none">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)] print:text-black">Guía DUA Generada</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 print:text-2xl print:text-black">
                  {duaGuide?.titulo_guia || 'Guía DUA Multinivel'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleSaveToBank}
                className="rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[var(--primary-hover)] print:hidden shrink-0"
              >
                Guardar en Banco
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[var(--primary-hover)] print:hidden shrink-0"
              >
                Exportar a PDF / Imprimir
              </button>
            </div>

            {duaGuide?.contexto_motivacional && (
              <div className="mt-4 rounded-2xl bg-gray-50 border border-[var(--border)] p-5 print:break-inside-avoid print:bg-white print:border-slate-200 print:p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ink-mid)] print:text-black">Contexto Motivacional</p>
                <p className="mt-2 text-base italic text-[var(--ink)] leading-relaxed print:text-black">{duaGuide.contexto_motivacional}</p>
              </div>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-3 print:grid-cols-1">
              <div className="rounded-2xl bg-green-50 p-4 border border-green-200 print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-green-600 print:text-black">OA a trabajar</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 print:text-black">{result.plan.objetivo_aprendizaje}</p>
              </div>
              <div className="rounded-2xl bg-[var(--primary-tint)] p-4 border border-[var(--primary)] print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-[var(--primary-ink)] print:text-black">Habilidades</p>
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
              borderColor="border-[var(--primary)]"
              bgColor="bg-[var(--primary-tint)]"
              iconColor="text-[var(--primary-ink)]"
            />
            <LevelCard
              title="Nivel Desafío"
              items={duaGuide?.nivel_desafio || []}
              borderColor="border-orange-300"
              bgColor="bg-orange-50"
              iconColor="text-orange-600"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 print:grid-cols-1">
            <DetailCard title="Contexto pedagógico inclusivo" text={duaGuide?.contexto_pedagogico_inclusivo} />
            <DetailCard title="Interpretación pedagógica del OA" text={duaGuide?.interpretacion_pedagogica} />
            <DetailCard title="Habilidades" items={[...(duaGuide?.habilidades || []).filter(s => s && s.trim().length > 1), ...(duaGuide?.habilidades_sugeridas || []).map((item) => `${item} (sugerida)`)]} />
            <DetailCard title="Criterios de aprendizaje" items={duaGuide?.criterios_aprendizaje} />
            <DetailCard title="Barreras posibles" items={duaGuide?.barreras_posibles} />
            <DetailCard title="Adecuaciones y apoyos" items={duaGuide?.adecuaciones_apoyos} />
          </div>

          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm print:break-before-page print:break-inside-avoid print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
            <h3 className="text-lg font-black text-slate-900 print:text-black">Principios DUA aplicados</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <div className="rounded-xl bg-[var(--primary-tint)] p-3 border border-[var(--primary)] print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-[var(--primary-ink)] print:text-black">Representación</p>
                <ul className="mt-1 list-disc pl-4 text-xs text-slate-700 print:text-black">
                  {(duaGuide?.principios_dua?.representacion || ['Múltiples medios: texto, imágenes, esquemas visuales y organizadores gráficos']).map((item, index) => <li key={`representacion-${index}`}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-xl bg-green-50 p-3 border border-green-200 print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-green-600 print:text-black">Acción y Expresión</p>
                <ul className="mt-1 list-disc pl-4 text-xs text-slate-700 print:text-black">
                  {(duaGuide?.principios_dua?.accion_expresion || ['Diversas formas: escritura, oralidad, esquemas, modelos y debate']).map((item, index) => <li key={`accion-${index}`}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-xl bg-orange-50 p-3 border border-orange-200 print:break-inside-avoid print:rounded-none print:border print:border-slate-300 print:bg-white">
                <p className="text-xs font-black uppercase text-orange-600 print:text-black">Implicación</p>
                <ul className="mt-1 list-disc pl-4 text-xs text-slate-700 print:text-black">
                  {(duaGuide?.principios_dua?.implicacion || ['Intereses reales, autonomía, desafío progresivo y retroalimentación formativa']).map((item, index) => <li key={`implicacion-${index}`}>{item}</li>)}
                </ul>
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 print:grid-cols-1">
            <DetailCard
              title="Evaluación formativa inclusiva"
              items={[
                ...(duaGuide?.evaluacion_formativa_inclusiva?.evidencias || []),
                ...(duaGuide?.evaluacion_formativa_inclusiva?.preguntas_retroalimentacion || []),
                ...(duaGuide?.evaluacion_formativa_inclusiva?.lista_cotejo || []),
                ...(duaGuide?.evaluacion_formativa_inclusiva?.opciones_respuesta || []).map((item) => `Opción de respuesta: ${item}`),
                ...(duaGuide?.evaluacion_formativa_inclusiva?.retroalimentacion_docente || []),
              ]}
            />
            <DetailCard title="Cierre de clase inclusivo" items={duaGuide?.cierre_inclusivo} />
          </div>

          {duaGuide && (
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm print:hidden">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Fichas diferenciadas para estudiantes</h3>
                  <p className="mt-1 text-sm text-slate-600">Genera una ficha imprimible por nivel (Apoyo, Estándar, Desafío) a partir de esta guía DUA.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleGenerateFichas}
                    disabled={fichasLoading}
                    className="rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-sm font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {fichasLoading ? 'Generando fichas...' : fichas ? 'Regenerar fichas' : 'Generar fichas para estudiantes'}
                  </button>
                  {fichas && (
                    <button
                      type="button"
                      onClick={handlePrintFichas}
                      className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[var(--primary-hover)]"
                    >
                      Imprimir fichas
                    </button>
                  )}
                </div>
              </div>

              {fichasError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {fichasError}
                </div>
              )}

              {fichasLoading && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <SkeletonCard lines={4} />
                  <SkeletonCard lines={4} />
                  <SkeletonCard lines={4} />
                </div>
              )}

              {fichas && (
                <div className="mt-4">
                  <div className="flex gap-2 border-b border-slate-200">
                    {(['apoyo', 'estandar', 'desafio'] as const).map((nivel) => (
                      <button
                        key={nivel}
                        type="button"
                        onClick={() => setActiveFichaTab(nivel)}
                        className={`px-4 py-2 text-sm font-black rounded-t-xl transition ${
                          activeFichaTab === nivel
                            ? `${NIVEL_STYLES[nivel].bg} ${NIVEL_STYLES[nivel].text} border border-b-0 ${NIVEL_STYLES[nivel].border}`
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {NIVEL_LABELS[nivel]}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <FichaCard ficha={fichas[activeFichaTab]} />
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {fichas && (
        <div id="fichas-print-area" className="hidden space-y-6">
          <div className="print:break-inside-avoid print:border-b print:border-black print:pb-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-black">
              Fichas Diferenciadas DUA - Generado por ProfePlanificAI
            </p>
            <p className="mt-1 text-sm text-black">{duaGuide?.titulo_guia || 'Guía DUA Multinivel'}</p>
          </div>
          <FichaCard ficha={fichas.apoyo} printMode />
          <FichaCard ficha={fichas.estandar} printMode />
          <FichaCard ficha={fichas.desafio} printMode />
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
