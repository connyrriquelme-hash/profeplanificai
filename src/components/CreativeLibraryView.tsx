import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Search, Check, FileUp, Link2, FolderOpen, Loader2, Download, Save, Eye, ClipboardList, RotateCcw } from 'lucide-react';
import { getLevels, getSubjectsByLevel, getObjectives, searchObjectives, type LearningObjective } from '../data/libraryMockData';
import { generateResource, type GenerateResourceRequest } from '../services/libraryGenerationService';

type WizardStep = 'curriculum' | 'topic' | 'refine' | 'design' | 'generating' | 'result';

const DESIGN_STYLES = [
  { id: 'claro', name: 'Claro', desc: 'Diseño minimalista y limpio', color: '#ffffff', bg: '#f8fafc' },
  { id: 'ciencias', name: 'Ciencias', desc: 'Verde fresco y profesional', color: '#ecfdf5', bg: '#d1fae5' },
  { id: 'matematicas', name: 'Matemáticas', desc: 'Azul estructurado y analítico', color: '#eff6ff', bg: '#bfdbfe' },
  { id: 'simple', name: 'Simple', desc: 'Alta legibilidad, sin distracciones', color: '#f3f4f6', bg: '#e5e7eb' },
  { id: 'profundo', name: 'Profundo', desc: 'Visualmente rico y envolvente', color: '#f0f9ff', bg: '#bae6fd' },
  { id: 'primeros-lectores', name: 'Primeros lectores', desc: 'Amigable, colores suaves y alegres', color: '#fff7ed', bg: '#fed7aa' },
  { id: 'baja-estimulacion', name: 'Baja estimulación', desc: 'Neutral, ideal para NEE', color: '#f5f5f4', bg: '#d6d3d1' },
  { id: 'colorido-aula', name: 'Colorido aula chilena', desc: 'Vibrante, motiva la participación', color: '#fdf2f8', bg: '#fbcfe8' },
];

const REFINE_OPTIONS = [
  { id: 'lessonFramework', label: 'Marco de la lección', desc: 'Estructura completa inicio-desarrollo-cierre' },
  { id: 'curriculumAlignment', label: 'Alinear con currículum', desc: 'Conexión explícita con bases curriculares' },
  { id: 'learningObjectives', label: 'Objetivos de aprendizaje', desc: 'Objetivos medibles y observables' },
  { id: 'keyVocabulary', label: 'Vocabulario clave', desc: 'Términos esenciales para la unidad' },
  { id: 'differentiation', label: 'Actividades diferenciadas', desc: 'Variedad de niveles y estilos de aprendizaje' },
  { id: 'dua', label: 'DUA', desc: 'Diseño Universal para el Aprendizaje' },
  { id: 'rubric', label: 'Rúbrica', desc: 'Criterios de evaluación detallados' },
  { id: 'simce', label: 'Evaluación tipo SIMCE', desc: 'Formato y preguntas estilo SIMCE' },
];

interface CreativeLibraryViewProps {
  creationType: string;
  onBack: () => void;
  onSave: (text: string) => void;
}

export function CreativeLibraryView({ creationType, onBack, onSave }: CreativeLibraryViewProps) {
  const [step, setStep] = useState<WizardStep>('curriculum');
  const [level, setLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [oaSearch, setOaSearch] = useState('');
  const [selectedOA, setSelectedOA] = useState<LearningObjective | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [topic, setTopic] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [refineOptions, setRefineOptions] = useState<Record<string, boolean>>({
    lessonFramework: true, curriculumAlignment: true, learningObjectives: true,
    keyVocabulary: true, differentiation: false, dua: true, rubric: false, simce: false,
  });
  const [designStyle, setDesignStyle] = useState('claro');
  const [resultText, setResultText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const levels = useMemo(() => getLevels(), []);
  const subjects = useMemo(() => level ? getSubjectsByLevel(level) : [], [level]);
  const objectives = useMemo(() => {
    if (!level || !subject) return [];
    const items = getObjectives(level, subject);
    if (!oaSearch) return items;
    const q = oaSearch.toLowerCase();
    return items.filter(o => o.code.toLowerCase().includes(q) || o.text.toLowerCase().includes(q));
  }, [level, subject, oaSearch]);

  const handleSelectOA = useCallback((oa: LearningObjective) => {
    setSelectedOA(oa);
    setSelectedIndicator('');
    setSelectedSkill('');
    setOaSearch('');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedOA) return;
    setGenerating(true);
    setError('');
    setStep('generating');

    const req: GenerateResourceRequest = {
      resourceType: creationType,
      level,
      subject,
      objectiveCode: selectedOA.code,
      objectiveText: selectedOA.text,
      indicator: selectedIndicator,
      skill: selectedSkill,
      topic,
      additionalContext,
      designStyle,
      options: {
        lessonFramework: refineOptions.lessonFramework,
        curriculumAlignment: refineOptions.curriculumAlignment,
        learningObjectives: refineOptions.learningObjectives,
        keyVocabulary: refineOptions.keyVocabulary,
        dua: refineOptions.dua,
        rubric: refineOptions.rubric,
        simce: refineOptions.simce,
        differentiation: refineOptions.differentiation,
      },
    };

    const res = await generateResource(req);
    if (res.ok && res.text) {
      setResultText(res.text);
      setStep('result');
    } else {
      setError(res.error || 'Error al generar');
      if (res.text) {
        setResultText(res.text);
        setStep('result');
      } else {
        setStep('design');
      }
    }
    setGenerating(false);
  }, [creationType, level, subject, selectedOA, selectedIndicator, selectedSkill, topic, additionalContext, designStyle, refineOptions]);

  const renderCurriculumStep = () => (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h2 className="text-xl font-bold">Base Curricular Oficial 📚</h2>
          <p className="text-sm text-[var(--muted)]">Selecciona el nivel, asignatura, Objetivo de Aprendizaje, indicador y habilidad.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nivel</label>
            <select value={level} onChange={e => { setLevel(e.target.value); setSubject(''); setSelectedOA(null); }} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
              <option value="">Seleccionar nivel…</option>
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          {level && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Asignatura</label>
              <select value={subject} onChange={e => { setSubject(e.target.value); setSelectedOA(null); }} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                <option value="">Seleccionar asignatura…</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {level && subject && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Buscar OA</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={oaSearch} onChange={e => setOaSearch(e.target.value)} placeholder="Buscar por código o texto…" className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
              </div>
            </div>
          )}
          {level && subject && (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {objectives.length === 0 ? (
                <p className="text-sm text-[var(--muted)] text-center py-8">No se encontraron objetivos para esta búsqueda.</p>
              ) : objectives.map(oa => (
                <div key={oa.id} onClick={() => handleSelectOA(oa)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedOA?.id === oa.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="inline-block text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md mb-1.5">{oa.code}</span>
                      <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">{oa.text}</p>
                      {oa.axis && <span className="inline-block text-xs text-gray-500 mt-1">Eje: {oa.axis}</span>}
                    </div>
                    {selectedOA?.id === oa.id && <Check size={18} className="text-indigo-600 flex-shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          {selectedOA ? (
            <div className="sticky top-4 space-y-4">
              <div className="p-5 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
                <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider mb-3">Articulación curricular</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500">OA seleccionado</span>
                    <p className="text-sm font-medium text-gray-800">{selectedOA.code} — {selectedOA.text}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Indicador de evaluación</label>
                    <select value={selectedIndicator} onChange={e => setSelectedIndicator(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
                      <option value="">Seleccionar indicador…</option>
                      {selectedOA.indicators.map((ind, i) => <option key={i} value={ind}>{ind}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Habilidad</label>
                    <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
                      <option value="">Seleccionar habilidad…</option>
                      {selectedOA.skills.map((sk, i) => <option key={i} value={sk}>{sk}</option>)}
                    </select>
                  </div>
                  <div className="pt-3 border-t border-indigo-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Resumen curricular</h4>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-lg">{level}</span>
                      <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-lg">{subject}</span>
                      <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-lg">{selectedOA.code}</span>
                      {selectedIndicator && <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-lg">{selectedIndicator.slice(0, 30)}…</span>}
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setStep('topic')} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
                Continuar al tema <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center min-h-[300px]">
              <FolderOpen size={40} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">Selecciona un nivel, asignatura y OA para ver la articulación curricular.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTopicStep = () => (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep('curriculum')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h2 className="text-xl font-bold">Define el tema de tu recurso</h2>
          <p className="text-sm text-[var(--muted)]">Describe brevemente el contenido que quieres desarrollar.</p>
        </div>
      </div>
      <div className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tema del recurso</label>
          <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ej: La fotosíntesis en plantas nativas chilenas" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Contexto adicional (opcional)</label>
          <textarea value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} rows={4} placeholder="Ej: Curso de 32 estudiantes, 5 con NEE, 2 descendidos. Interés por actividades al aire libre." className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Resumen de tu selección</p>
          <div className="flex flex-wrap gap-2">
            {level && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl font-medium">{level}</span>}
            {subject && <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-xl font-medium">{subject}</span>}
            {selectedOA && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl font-medium">{selectedOA.code}</span>}
            <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl font-medium">{creationType === 'leccion' ? 'Lección individual' : creationType === 'serie' ? 'Serie de lecciones' : 'Fichas de actividades'}</span>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm"><FileUp size={20} /></div>
              <span className="text-xs font-medium">Subir archivo</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm"><Link2 size={20} /></div>
              <span className="text-xs font-medium">Pegar enlace</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm"><FolderOpen size={20} /></div>
              <span className="text-xs font-medium">Recurso existente</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">Próximamente podrás adjuntar recursos directamente.</p>
        </div>
        <button onClick={() => setStep('refine')} disabled={!topic.trim()} className={`w-full sm:w-auto py-3 px-8 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${topic.trim() ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white hover:scale-[1.02]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          Continuar a refinar <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderRefineStep = () => (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep('topic')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h2 className="text-xl font-bold">Refina el recurso</h2>
          <p className="text-sm text-[var(--muted)]">Selecciona los elementos que quieres incluir en tu recurso.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {REFINE_OPTIONS.map(opt => (
          <div key={opt.id} onClick={() => setRefineOptions(prev => ({ ...prev, [opt.id]: !prev[opt.id] }))} className={`p-5 rounded-2xl border cursor-pointer transition-all ${refineOptions[opt.id] ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${refineOptions[opt.id] ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                {refineOptions[opt.id] && <Check size={12} className="text-white" />}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">{opt.label}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setStep('design')} className="w-full sm:w-auto py-3 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
        Continuar al diseño <ArrowRight size={16} />
      </button>
    </div>
  );

  const renderDesignStep = () => (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep('refine')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h2 className="text-xl font-bold">Elige un estilo visual</h2>
          <p className="text-sm text-[var(--muted)]">Selecciona la apariencia que tendrá tu recurso generado.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {DESIGN_STYLES.map(st => (
          <div key={st.id} onClick={() => setDesignStyle(st.id)} className={`rounded-2xl border-2 cursor-pointer overflow-hidden transition-all ${designStyle === st.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="h-24 flex items-center justify-center" style={{ backgroundColor: st.bg }}>
              <div className="w-16 h-16 rounded-xl shadow-md" style={{ backgroundColor: st.color, border: '1px solid rgba(0,0,0,0.06)' }} />
            </div>
            <div className="p-3 bg-white">
              <h4 className="text-sm font-semibold text-gray-800">{st.name}</h4>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{st.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleGenerate} className="w-full sm:w-auto py-3 px-10 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
        Generar recurso ✨
      </button>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className="flex flex-col items-center justify-center py-24">
      <Loader2 size={48} className="text-indigo-600 animate-spin mb-6" />
      <h3 className="text-lg font-bold text-gray-800 mb-2">Generando con IA…</h3>
      <p className="text-sm text-[var(--muted)]">Estamos creando una propuesta pedagógica alineada al currículum chileno.</p>
    </div>
  );

  const renderResultStep = () => {
    if (!resultText) return null;
    const sections = resultText.split(/(?=^## )/m);
    const title = sections[0] || '';
    const body = sections.slice(1).join('');

    return (
      <div className="print-mode">
        <div className="flex items-center gap-3 mb-6 no-print">
          <button onClick={() => setStep('design')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Recurso generado ✨</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm"><Download size={16} /> Exportar PDF</button>
            <button onClick={() => onSave(resultText)} className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm"><Save size={16} /> Guardar en biblioteca</button>
            <button className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm"><Eye size={16} /> Presentación</button>
            <button className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm"><ClipboardList size={16} /> Crear evaluación</button>
            <button onClick={() => setStep('design')} className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm"><RotateCcw size={16} /> Volver a editar</button>
          </div>
        </div>
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error} — Se ha usado una versión preliminar.
            <button onClick={handleGenerate} className="ml-3 underline font-medium">Reintentar</button>
          </div>
        )}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 lg:p-10 shadow-sm">
          <div className="text-sm leading-relaxed text-gray-800 space-y-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-gray-200 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-gray-50 [&_th]:text-left [&_th]:p-2.5 [&_th]:text-xs [&_th]:font-semibold [&_th]:text-gray-600 [&_th]:border [&_th]:border-gray-200 [&_td]:p-2.5 [&_td]:text-sm [&_td]:border [&_td]:border-gray-200 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-sm">
            {resultText.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h1 key={i}>{line.replace(/^# /, '')}</h1>;
              if (line.startsWith('## ')) return <h2 key={i}>{line.replace(/^## /, '')}</h2>;
              if (line.startsWith('- ')) return <li key={i} className="text-sm">{line.replace(/^- /, '')}</li>;
              if (line.startsWith('| ')) return null; // skip raw table lines (rendered as text is fine)
              if (line.trim() === '') return <div key={i} className="h-2" />;
              return <p key={i} className="text-sm">{line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>;
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="view creative-library">
      {step === 'curriculum' && renderCurriculumStep()}
      {step === 'topic' && renderTopicStep()}
      {step === 'refine' && renderRefineStep()}
      {step === 'design' && renderDesignStep()}
      {step === 'generating' && renderGeneratingStep()}
      {step === 'result' && renderResultStep()}
    </div>
  );
}
