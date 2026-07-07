import { useState, useEffect } from 'react';
import type { PlanFormData, MaterialSaved, CurriculumItem } from '../types';
import { useConfigOptions } from '../hooks/useConfigOptions';
import { generatePlan } from '../services/localGenerator';
import { generarConIA } from '../services/aiService';
import { getMaterials, saveMaterial, deleteMaterial, generateId, saveDriveItem } from '../services/storageService';
import { buildOAContext, buildCurriculumHeaderFromItem } from '../utils/curriculum';
import { StatusBar } from './shared/StatusBar';
import { OutputEditor } from './shared/OutputEditor';
import { ResultActions } from './shared/ResultActions';
import { MaterialList } from './shared/MaterialList';
import { AdaptarPanel } from './AdaptarPanel';
import { WorkspaceView } from './WorkspaceView';
import { Sparkles, Loader2, Clipboard } from 'lucide-react';
import { getSelectedCurriculumItem } from '../services/curriculumService';
import { getCourses, getSubjectsByCourse, getObjectives } from '../services/curriculumD1Service';

interface PlanificadorViewProps {
  onNavigate?: (view: string) => void;
}

export function PlanificadorView({ onNavigate }: PlanificadorViewProps = {}) {
  const { getOptions } = useConfigOptions();
  const [currentKind, setCurrentKind] = useState<'plan' | 'secuencia'>('plan');

  const [selectedItem, setSelectedItem] = useState<CurriculumItem | null>(null);
  const [tema, setTema] = useState('');
  const [form, setForm] = useState<PlanFormData>(() => {
    const selected = getSelectedCurriculumItem();
    if (selected) {
      return {
        nivel: selected.curso,
        asignatura: selected.asignatura,
        duracion: '90 minutos',
        enfoque: 'Comprensión lectora',
        oa: selected.oa,
        contexto: '',
        extra: '',
      };
    }
    return {
      nivel: '',
      asignatura: '',
      duracion: '90 minutos',
      enfoque: 'Comprensión lectora',
      oa: '',
      contexto: '',
      extra: '',
    };
  });

  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Completa los campos y presiona generar.');
  const [statusType, setStatusType] = useState('');
  const [savedMaterials, setSavedMaterials] = useState<MaterialSaved[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const [d1Courses, setD1Courses] = useState<any[]>([]);
  const [d1Subjects, setD1Subjects] = useState<any[]>([]);
  const [d1Objectives, setD1Objectives] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<Set<string>>(new Set());
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingObjectives, setLoadingObjectives] = useState(false);

  useEffect(() => {
    getCourses().then(courses => {
      setD1Courses(courses);
      if (courses.length > 0 && !selectedCourseId) {
        const first = courses[0];
        setSelectedCourseId(first.id);
        setForm(prev => ({ ...prev, nivel: first.name }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourseId) { setD1Subjects([]); return; }
    setLoadingSubjects(true);
    setSelectedSubjectId('');
    setSelectedObjectiveIds(new Set());
    getSubjectsByCourse(selectedCourseId).then(subs => {
      setD1Subjects(subs);
      if (subs.length > 0) {
        const first = subs[0];
        setSelectedSubjectId(first.id);
        setForm(prev => ({ ...prev, asignatura: first.name }));
      }
    }).catch(() => setD1Subjects([])).finally(() => setLoadingSubjects(false));
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId || !selectedSubjectId) { setD1Objectives([]); return; }
    setLoadingObjectives(true);
    setSelectedObjectiveIds(new Set());
    getObjectives(selectedCourseId, selectedSubjectId)
      .then(setD1Objectives)
      .catch(() => setD1Objectives([]))
      .finally(() => setLoadingObjectives(false));
  }, [selectedCourseId, selectedSubjectId]);

  useEffect(() => {
    setSavedMaterials(getMaterials().filter((m) => m.tipo === 'planificacion'));
    const item = getSelectedCurriculumItem();
    if (item) setSelectedItem(item);
  }, []);

  useEffect(() => {
    const selected = d1Objectives.filter(o => selectedObjectiveIds.has(o.id));
    const oaText = selected.map(o => `${o.code} — ${o.official_text || ''}`).join('\n');
    setForm(prev => ({ ...prev, oa: oaText }));
  }, [selectedObjectiveIds, d1Objectives]);

  const updateField = (field: keyof PlanFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleObjective = (id: string) => {
    setSelectedObjectiveIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const withHeader = (texto: string): string => {
    if (!selectedItem) return texto;
    return buildCurriculumHeaderFromItem(selectedItem) + '\n' + texto;
  };

  const canGenerate = tema.trim() && form.nivel && form.asignatura && selectedObjectiveIds.size > 0;

  const handleGenerar = async (kind: 'plan' | 'secuencia') => {
    if (!canGenerate) {
      setStatus('Completa tema, nivel, asignatura y selecciona al menos un OA.');
      setStatusType('warn');
      return;
    }
    setCurrentKind(kind);
    setStatus('Generando...');
    setStatusType('');
    setOutput('');

    const prompt = buildPrompt(kind, { ...form, oa: form.oa });

    try {
      const result = await generarConIA({
        tipo: kind === 'plan' ? 'planificacion' : 'secuencia',
        nivel: form.nivel,
        asignatura: form.asignatura,
        oa: form.oa,
        promptExt: prompt,
        onStatus: (msg, type) => { setStatus(msg); setStatusType(type || ''); },
      });

      if (result.ok && result.texto) {
        setOutput(withHeader(result.texto));
      } else {
        setOutput(withHeader(generatePlan(kind, form)));
        setStatus('Generado en modo local.');
        setStatusType('ok');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      const local = generatePlan(kind, form);
      setOutput(withHeader(local));
      setStatus('Error de IA: ' + msg + '. Generado en modo local.');
      setStatusType('warn');
    }
  };

  const handleGuardar = () => {
    if (!output) return;
    const material: MaterialSaved = {
      id: generateId(),
      tipo: 'planificacion',
      titulo: `Planificación - ${form.nivel} ${form.asignatura}`,
      contenido: output,
      nivel: form.nivel,
      asignatura: form.asignatura,
      oa: form.oa,
      fecha: new Date().toISOString(),
      etiquetas: [],
    };
    saveMaterial(material);
    setSavedMaterials(getMaterials().filter((m) => m.tipo === 'planificacion'));
    setStatus('Planificación guardada en Mis materiales.');
    setStatusType('ok');
  };

  const handleEliminar = (id: string) => {
    if (!confirm('¿Eliminar esta planificación?')) return;
    deleteMaterial(id);
    setSavedMaterials(getMaterials().filter((m) => m.tipo === 'planificacion'));
  };

  const cargarMaterial = (m: MaterialSaved) => {
    setOutput(m.contenido);
    setTema('');
    setForm(prev => ({
      ...prev,
      nivel: m.nivel,
      asignatura: m.asignatura,
      oa: m.oa,
    }));
    setShowSaved(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 p-6 text-white shadow-lg">
        <p className="text-sm font-bold uppercase tracking-widest text-white/75">PROJECT COPILOT</p>
        <h1 className="mt-2 text-3xl font-black">Generador de Planificación</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          Ingresa tema, nivel, asignatura y objetivo para generar una planificación completa con IA.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/30 transition"
            onClick={() => setShowSaved(!showSaved)}
          >
            {showSaved ? 'Ocultar materiales' : `Mis materiales (${savedMaterials.length})`}
          </button>
        </div>
      </div>

      {showSaved && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800">Materiales guardados</h3>
          <MaterialList items={savedMaterials} onCargar={cargarMaterial} onEliminar={handleEliminar} />
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">TEMA</label>
          <input
            type="text"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Ej: La célula o Los cuentos populares"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">NIVEL</label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                const c = d1Courses.find((c: any) => c.id === e.target.value);
                if (c) setForm(prev => ({ ...prev, nivel: c.name }));
              }}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            >
              <option value="">Seleccionar nivel</option>
              {d1Courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">ASIGNATURA</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                const s = d1Subjects.find((s: any) => s.id === e.target.value);
                if (s) setForm(prev => ({ ...prev, asignatura: s.name }));
              }}
              disabled={!selectedCourseId}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-50"
            >
              <option value="">{loadingSubjects ? 'Cargando...' : selectedCourseId ? 'Seleccionar asignatura' : 'Primero selecciona nivel'}</option>
              {d1Subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            OBJETIVOS DE APRENDIZAJE <span className="text-red-400">*</span>
          </label>
          {loadingObjectives && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-400">
              <Loader2 size={14} className="animate-spin" />
              Cargando objetivos...
            </div>
          )}
          {!loadingObjectives && d1Objectives.length === 0 && selectedCourseId && selectedSubjectId && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              No hay objetivos para esta combinación.
            </div>
          )}
          {!loadingObjectives && d1Objectives.length === 0 && (!selectedCourseId || !selectedSubjectId) && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              Selecciona un nivel y asignatura para ver los objetivos de aprendizaje...
            </div>
          )}
          {d1Objectives.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
              {d1Objectives.map((obj: any) => (
                <label
                  key={obj.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition ${
                    selectedObjectiveIds.has(obj.id)
                      ? 'bg-violet-50 border-l-2 border-l-violet-500'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedObjectiveIds.has(obj.id)}
                    onChange={() => toggleObjective(obj.id)}
                    className="mt-0.5 accent-violet-600"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs font-bold text-violet-600">{obj.code}</span>
                    <span className="ml-2 text-sm text-slate-700">{obj.official_text || ''}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
          {selectedObjectiveIds.size > 0 && (
            <p className="mt-1.5 text-xs text-slate-400">{selectedObjectiveIds.size} objetivo(s) seleccionado(s)</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">CONTEXTO DEL CURSO</label>
            <textarea
              value={form.contexto}
              onChange={(e) => updateField('contexto', e.target.value)}
              placeholder="Ej.: curso heterogéneo, algunos estudiantes con dificultades de lectura..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">INSTRUCCIONES ESPECIALES</label>
            <textarea
              value={form.extra}
              onChange={(e) => updateField('extra', e.target.value)}
              placeholder="Ej.: incorporar lectura guiada, trabajo en parejas, material imprimible..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => handleGenerar('plan')}
            disabled={!canGenerate}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Clipboard size={16} />
            Generar planificación
          </button>
        </div>
      </div>

      {status && (
        <StatusBar message={status} type={statusType} />
      )}

      {output && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Planificación generada</h3>
            <div className="flex gap-2">
              <button
                onClick={handleGuardar}
                className="rounded-xl bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-200 transition"
              >
                Guardar
              </button>
            </div>
          </div>
          <OutputEditor contenido={output} onChange={setOutput} />
          <ResultActions
            contenido={output}
            titulo={`Planificación - ${form.nivel} ${form.asignatura}`}
            nivel={form.nivel}
            asignatura={form.asignatura}
            oa={form.oa}
            tipo="planificacion"
            onGuardar={handleGuardar}
          />
        </div>
      )}

      <AdaptarPanel
        item={selectedItem}
        contenidoOriginal={output}
        onStatus={(msg, type) => { setStatus(msg); setStatusType(type || ''); }}
      />
    </div>
  );
}

function buildPrompt(kind: string, d: PlanFormData): string {
  const nivel = d.nivel;
  const esParvularia = nivel === 'Prekinder' || nivel === 'Kinder';
  const oaContext = buildOAContext(nivel, d.asignatura, d.oa);
  const formato = esParvularia
    ? 'Debe incluir: objetivo de aprendizaje, ámbito/s, experiencia de aprendizaje en tres momentos (inicio, desarrollo, cierre), estrategias de juego, DUA con apoyos concretos, evaluación formativa mediante observación y registro, y sugerencias para el hogar.'
    : 'Debe incluir: objetivo claro, habilidades, inicio-desarrollo-cierre con tiempos sugeridos, actividad colaborativa, DUA con apoyos explícitos, evaluación formativa con indicador y retroalimentación, recursos y adecuaciones curriculares.';
  const tipo = kind === 'plan' ? 'planificación de clase' : 'secuencia de unidad';
  const partes = [
    `Eres un docente experto del currículum chileno. Crea una ${tipo} completa y contextualizada.`,
    `Nivel: ${nivel}`,
    `Asignatura/Ámbito: ${d.asignatura}`,
    `Duración: ${d.duracion}`,
    `Enfoque pedagógico: ${d.enfoque}`,
    `Objetivo de Aprendizaje (OA): ${d.oa}`,
    `Contexto del curso: ${d.contexto || 'No especificado. Usa un contexto genérico realista.'}`,
    `Instrucciones adicionales: ${d.extra || 'Ninguna.'}`,
    formato,
    'Estructura la respuesta en secciones claras con encabezados (##). Usa **negritas** para énfasis. Sé específico, práctico y aplicable al aula chilena actual.',
  ];
  if (oaContext) {
    partes.unshift('', oaContext, '', '---', '');
  }
  return partes.join('\n');
}
