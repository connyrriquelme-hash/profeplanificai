import { useState, useEffect, useRef } from 'react';
import type { PlanFormData, MaterialSaved } from '../types';
import { useConfigOptions } from '../hooks/useConfigOptions';
import { generatePlan } from '../services/localGenerator';
import { generarConIA } from '../services/aiService';
import { getMaterials, saveMaterial, deleteMaterial, generateId } from '../services/storageService';
import { buildOAContext, buildCurriculumHeaderFromItem } from '../utils/curriculum';
import { exportarDocumento } from '../utils/exportUtils';
import { StatusBar } from './shared/StatusBar';
import { MaterialList } from './shared/MaterialList';
import { Sparkles, Loader2, Clipboard, Download, FileText } from 'lucide-react';
import { getSelectedCurriculumItem } from '../services/curriculumService';
import { getCourses, getSubjectsByCourse, getObjectives } from '../services/curriculumD1Service';
import ReactMarkdown from 'react-markdown';

interface PlanificadorViewProps {
  onNavigate?: (view: string) => void;
}

export function PlanificadorView({ onNavigate }: PlanificadorViewProps = {}) {
  const { getOptions } = useConfigOptions();

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('Completa los campos y presiona generar.');
  const [statusType, setStatusType] = useState('');
  const [savedMaterials, setSavedMaterials] = useState<MaterialSaved[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const [d1Courses, setD1Courses] = useState<any[]>([]);
  const [d1Subjects, setD1Subjects] = useState<any[]>([]);
  const [d1Objectives, setD1Objectives] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedOas, setSelectedOas] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingObjectives, setLoadingObjectives] = useState(false);

  const paperRef = useRef<HTMLDivElement>(null);

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
    setSelectedOas([]);
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
    setSelectedOas([]);
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
    const selected = d1Objectives.filter(o => selectedOas.includes(o.id));
    const oaText = selected.map(o => `${o.code} — ${o.official_text || ''}`).join('\n');
    setForm(prev => ({ ...prev, oa: oaText }));
  }, [selectedOas, d1Objectives]);

  const updateField = (field: keyof PlanFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleObjective = (id: string) => {
    setSelectedOas((prev) =>
      prev.includes(id)
        ? prev.filter((oaId) => oaId !== id)
        : [...prev, id]
    );
  };

  const canGenerate = tema.trim() && form.nivel && form.asignatura && selectedOas.length > 0;

  const buildDUAPrompt = (): string => {
    const oasSeleccionados = d1Objectives
      .filter(o => selectedOas.includes(o.id))
      .map(o => `${o.code} — ${o.official_text || ''}`)
      .join('\n');

    const isFirstGrade = /1[°º]\s*b[aá]sico/i.test(form.nivel);
    const isPreschool = /prekinder|kinder|parvularia/i.test(form.nivel);

    return `Eres una educadora diferencial y especialista en Diseño Universal para el Aprendizaje (DUA), neurodiversidad, adecuaciones de acceso, evaluación formativa y currículum chileno MINEDUC. Redactas como una profesional con experiencia real en aulas chilenas: lenguaje docente concreto, aplicable, sin tecnicismos clínicos innecesarios y sin frases vacías.

REGLAS OBLIGATORIAS:
1. Usa el OA seleccionado como eje central. No inventes OA ni cambies su sentido.
2. Transforma el OA en una meta comprensible para estudiantes y una interpretación pedagógica experta.
3. Considera diversidad real: rezago lector, TDAH, TEA, dificultades de lenguaje, NEE transitorias, alta motivación visual, barreras de participación y distintos ritmos.
4. Si las habilidades son vacías, nulas, "a", "-" o texto inválido, genera habilidades sugeridas desde el OA y márcalas como sugeridas.
5. Si los criterios son genéricos (ej. "escribir", "leer"), conviértelos en criterios observables y medibles.
${isFirstGrade || isPreschool ? '6. Para este nivel usa actividades breves, visuales, orales, manipulativas y lúdicas. No exijas escritura extensa. Usa pictogramas, tarjetas visuales, modelaje con objetos, elección entre alternativas, respuesta oral, dibujo, señalamiento.' : '6. Adapta las actividades al nivel de complejidad esperado para este curso.'}
7. Cada nivel debe ser DISTINTO y específico: apoyo muy guiado, estándar como actividad central, desafío como profundización sin adelantar curso.
8. NO uses frases genéricas como "actividad colaborativa en situación real" sin explicar concretamente qué hace el docente y qué hacen los estudiantes.
9. NO repitas el OA en todas las secciones.
10. NO generes secciones con una sola palabra o letra.

DATOS DEL CONTEXTO:
Nivel: ${form.nivel}
Asignatura: ${form.asignatura}
Tema: ${tema}
OA seleccionado: ${oasSeleccionados}
${form.contexto ? `Contexto del curso: ${form.contexto}` : ''}
${form.extra ? `Instrucciones especiales: ${form.extra}` : ''}

ESTRUCTURA OBLIGATORIA DE LA GUÍA (formato Markdown limpio con # y ##):

# Contexto pedagógico inclusivo
- Explica brevemente el sentido del OA.
- Traduce el OA a una meta comprensible para estudiantes.
- Indica posibles barreras de aprendizaje y participación.

## OA a trabajar
- Muestra el OA seleccionado sin deformarlo.
- Agrega una interpretación pedagógica experta del OA.

## Habilidades
- Si hay habilidades reales, muéstralas.
- Si no hay habilidades, NO muestres letras sueltas ni basura.
- En caso de ausencia, infiere habilidades pedagógicas razonables desde el OA y márcalas como "habilidades sugeridas".
- Ejemplo: observar, expresar preferencias, argumentar oralmente, comparar, describir, justificar, crear.

## Criterios de aprendizaje
- Si la docente ingresó criterios, intégralos.
- Si escribió algo muy simple como "escribir", conviértelo en criterios evaluables.
- Ejemplo: Expresa una preferencia personal frente a una obra. Justifica su opinión usando al menos un elemento visual.

## Barreras posibles
- Incluye barreras concretas: comprensión del vocabulario, dificultad para expresar preferencias, baja confianza, dificultades de escritura, atención sostenida, acceso visual o sensorial, participación oral.

## Nivel de Apoyo
- Propón actividades muy guiadas y accesibles: modelaje docente, pictogramas, tarjetas visuales, ejemplos concretos, elección entre alternativas, respuesta oral/dibujo/señalamiento, trabajo en pareja, frases iniciadoras.
- Debe ser específico para el OA, no genérico.

## Nivel Estándar
- Propón una actividad central de clase: exploración de obras o producciones propias, conversación guiada, registro simple, justificación de preferencias, comparación respetuosa con pares.

## Nivel Desafío
- Profundiza sin adelantar contenidos de cursos superiores: argumentar con más detalle, vocabulario visual, comparar dos trabajos, mini galería, explicar decisiones artísticas, conectar con identidad, cultura local o entorno.

## Principios DUA aplicados
- Representación: cómo se presenta la información.
- Acción y expresión: formas diversas para responder.
- Implicación: motivación, elección, sentido personal y pertenencia.
- Cada principio debe incluir estrategias concretas, no frases genéricas.

## Evaluación formativa inclusiva
- Incluye: evidencia observable, preguntas de retroalimentación, lista de cotejo breve, opciones de respuesta oral/visual/escrita/corporal, retroalimentación positiva y específica.

## Adecuaciones y apoyos
- Incluye sugerencias para: dificultades lectoras, TEA, TDAH, dificultades de lenguaje y mayor avance.
- Las adecuaciones deben ser de acceso y participación, no bajar la expectativa del OA.

## Cierre de clase inclusivo
- Propón una rutina breve: "Hoy descubrí...", "Mi favorito fue... porque...", "Una idea de mi compañero/a que valoré fue...", con opción de responder dibujando, hablando, escribiendo o señalando.

Devuelve SOLO formato Markdown limpio, estructurado con títulos (# y ##), sin saludos ni texto introductorio.`;
  };

  const handleGenerar = async () => {
    if (!canGenerate) {
      setStatus('Completa tema, nivel, asignatura y selecciona al menos un OA.');
      setStatusType('warn');
      return;
    }
    setIsGenerating(true);
    setStatus('Generando guía DUA...');
    setStatusType('');
    setOutput('');

    const prompt = buildDUAPrompt();

    try {
      const result = await generarConIA({
        tipo: 'planificacion',
        nivel: form.nivel,
        asignatura: form.asignatura,
        oa: form.oa,
        promptExt: prompt,
        onStatus: (msg, type) => { setStatus(msg); setStatusType(type || ''); },
      });

      if (result.ok && result.texto) {
        setOutput(result.texto);
      } else {
        const local = generatePlan('plan', form);
        setOutput(local);
        setStatus('Generado en modo local.');
        setStatusType('ok');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      const local = generatePlan('plan', form);
      setOutput(local);
      setStatus('Error de IA: ' + msg + '. Generado en modo local.');
      setStatusType('warn');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGuardar = () => {
    if (!output) return;
    const material: MaterialSaved = {
      id: generateId(),
      tipo: 'planificacion',
      titulo: `Guía DUA - ${form.nivel} ${form.asignatura} - ${tema}`,
      contenido: output,
      nivel: form.nivel,
      asignatura: form.asignatura,
      oa: form.oa,
      fecha: new Date().toISOString(),
      etiquetas: [],
    };
    saveMaterial(material);
    setSavedMaterials(getMaterials().filter((m) => m.tipo === 'planificacion'));
    setStatus('Guía DUA guardada en Mis materiales.');
    setStatusType('ok');
  };

  const handleEliminar = (id: string) => {
    if (!confirm('¿Eliminar esta guía DUA?')) return;
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

  const handleDescargarPDF = () => {
    if (!output) return;
    exportarDocumento({
      contenido: output,
      action: 'print',
      titulo: `Guía DUA - ${form.nivel} ${form.asignatura} - ${tema}`,
      nivel: form.nivel,
      asignatura: form.asignatura,
      oa: form.oa,
      tipo: 'guia-dua',
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 p-6 text-white shadow-lg">
        <p className="text-sm font-bold uppercase tracking-widest text-white/75">PROJECT COPILOT</p>
        <h1 className="mt-2 text-3xl font-black">Generador de Guía DUA Multinivel</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          Ingresa tema, nivel, asignatura y objetivos para generar una guía DUA completa con 3 niveles de complejidad.
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
                    selectedOas.includes(obj.id)
                      ? 'bg-violet-50 border-l-2 border-l-violet-500'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOas.includes(obj.id)}
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
          {selectedOas.length > 0 && (
            <p className="mt-1.5 text-xs text-slate-400">{selectedOas.length} objetivo(s) seleccionado(s)</p>
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

        <div className="flex justify-end gap-3 pt-2 no-print">
          <button
            onClick={handleGenerar}
            disabled={!canGenerate || isGenerating}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generando guía DUA...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generar guía DUA
              </>
            )}
          </button>
        </div>
      </div>

      {status && (
        <StatusBar message={status} type={statusType} />
      )}

      {output && (
        <div className="space-y-4">
          <div className="flex items-center justify-between no-print">
            <h3 className="text-sm font-bold text-slate-800">Guía DUA generada</h3>
            <div className="flex gap-2">
              <button
                onClick={handleGuardar}
                className="rounded-xl bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-200 transition"
              >
                Guardar
              </button>
              <button
                onClick={handleDescargarPDF}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 transition"
              >
                <FileText size={14} />
                Descargar Guía DUA en PDF
              </button>
            </div>
          </div>

          <div
            ref={paperRef}
            className="rounded-2xl border border-slate-200 bg-white px-12 py-10 shadow-lg"
            style={{ maxWidth: '816px', margin: '0 auto' }}
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 mb-4 border-b-2 border-violet-500 pb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3 text-violet-700">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-700 mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="text-sm text-slate-700 leading-relaxed mb-3">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside text-sm text-slate-700 mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside text-sm text-slate-700 mb-3 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm text-slate-700">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-violet-300 pl-4 italic text-slate-600 my-3">{children}</blockquote>
                ),
                table: ({ children }) => (
                  <table className="w-full text-sm border-collapse my-3">{children}</table>
                ),
                th: ({ children }) => (
                  <th className="border border-slate-300 bg-violet-50 px-3 py-2 text-left font-bold text-slate-700">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border border-slate-200 px-3 py-2 text-slate-700">{children}</td>
                ),
              }}
            >
              {output}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
