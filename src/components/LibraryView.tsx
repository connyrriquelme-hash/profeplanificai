import { useState, useMemo, useCallback } from 'react';
import { WandSparkles, Layers3, NotebookPen, ClipboardCheck, BookOpenCheck, HeartHandshake, Users, ArrowRight, Target, GraduationCap, Layout, BookText, GitBranch, ClipboardList, Sun, FlaskConical, Calculator, FileText, Palette, Moon, Sparkles, Loader2, Search, X, Check, ArrowLeft, BrainCircuit } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { getLevels, getSubjectsByLevel, getObjectives, type LearningObjective } from '../data/libraryMockData';
import { generateResource, type GenerateResourceRequest } from '../services/libraryGenerationService';
import { GeneratedResourcePanel } from './GeneratedResourcePanel';
import { IconBadge } from './ui/IconBadge';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SectionHeader } from './ui/SectionHeader';
import { SearchInput } from './ui/SearchInput';

type LibraryStep = 'hub' | 'curriculum' | 'topic' | 'refine' | 'design' | 'generating' | 'result';

const STEPS = [
  { key: 'curriculum', label: 'Currículum', short: 'Currículum' },
  { key: 'topic', label: 'Tema', short: 'Tema' },
  { key: 'refine', label: 'Refinar', short: 'Refinar' },
  { key: 'design', label: 'Diseño', short: 'Diseño' },
  { key: 'generating', label: 'Generar', short: 'Generar' },
] as const;

const HUB_CARDS = [
  { tipo: 'Clase', label: 'Lección individual', desc: 'Una clase puntual lista para aplicar en tu aula.', icon: WandSparkles, color: '#4f46e5', badge: undefined },
  { tipo: 'Unidad', label: 'Serie de lecciones', desc: 'Secuencia de clases conectadas por un objetivo común.', icon: Layers3, color: '#0d9488', badge: undefined },
  { tipo: 'Ficha', label: 'Fichas de actividades', desc: 'Material imprimible o digital para trabajar en aula.', icon: NotebookPen, color: '#ea580c', badge: undefined },
  { tipo: 'Evaluacion', label: 'Evaluación formativa', desc: 'Instrumento para monitorear el aprendizaje en el proceso.', icon: ClipboardCheck, color: '#db2777', badge: 'Popular' },
  { tipo: 'Simce', label: 'Evaluación tipo SIMCE', desc: 'Formato estandarizado con alternativas tipo SIMCE.', icon: GraduationCap, color: '#7c3aed', badge: undefined },
  { tipo: 'Dua', label: 'Recurso inclusivo DUA', desc: 'Material accesible con Diseño Universal para el Aprendizaje.', icon: HeartHandshake, color: '#14b8a6', badge: 'Nuevo' },
];

const DESIGN_STYLES = [
  { id: 'claro', name: 'Claro', desc: 'Minimalista y limpio, ideal para lectura', icon: Sun, bg: '#fffbeb', swatch: '#fef3c7', border: '#fde68a' },
  { id: 'ciencias', name: 'Ciencias', desc: 'Verde fresco, profesional y natural', icon: FlaskConical, bg: '#ecfdf5', swatch: '#a7f3d0', border: '#6ee7b7' },
  { id: 'matematicas', name: 'Matemáticas', desc: 'Azul estructurado, analítico y claro', icon: Calculator, bg: '#eff6ff', swatch: '#bfdbfe', border: '#93c5fd' },
  { id: 'simple', name: 'Simple', desc: 'Alta legibilidad sin distracciones', icon: FileText, bg: '#f8fafc', swatch: '#e2e8f0', border: '#cbd5e1' },
  { id: 'profundo', name: 'Profundo', desc: 'Visualmente rico y envolvente', icon: Palette, bg: '#f0f9ff', swatch: '#bae6fd', border: '#7dd3fc' },
  { id: 'primeros-lectores', name: 'Primeros lectores', desc: 'Amigable, colores suaves y alegres', icon: BookOpenCheck, bg: '#fff7ed', swatch: '#fed7aa', border: '#fdba74' },
  { id: 'baja-estimulacion', name: 'Baja estimulación', desc: 'Neutral, ideal para estudiantes con NEE', icon: Moon, bg: '#f5f5f4', swatch: '#d6d3d1', border: '#a8a29e' },
  { id: 'colorido-aula', name: 'Colorido aula chilena', desc: 'Vibrante, motiva la participación activa', icon: Sparkles, bg: '#fdf2f8', swatch: '#fbcfe8', border: '#f9a8d4' },
];

const REFINE_OPTIONS = [
  { id: 'lessonFramework', icon: Layout, label: 'Marco de la lección', desc: 'Estructura completa inicio-desarrollo-cierre' },
  { id: 'curriculumAlignment', icon: BookOpenCheck, label: 'Alinear con currículum', desc: 'Conexión explícita con bases curriculares' },
  { id: 'learningObjectives', icon: Target, label: 'Objetivos de aprendizaje', desc: 'Objetivos medibles y observables' },
  { id: 'keyVocabulary', icon: BookText, label: 'Vocabulario clave', desc: 'Términos esenciales para la unidad' },
  { id: 'differentiation', icon: GitBranch, label: 'Actividades diferenciadas', desc: 'Variedad de niveles y estilos de aprendizaje' },
  { id: 'dua', icon: HeartHandshake, label: 'DUA', desc: 'Diseño Universal para el Aprendizaje' },
  { id: 'rubric', icon: ClipboardList, label: 'Rúbrica', desc: 'Criterios de evaluación detallados' },
  { id: 'simce', icon: GraduationCap, label: 'Evaluación tipo SIMCE', desc: 'Formato y preguntas estilo SIMCE' },
];

const STEP_ICONS: Record<string, typeof BookOpenCheck> = {
  curriculum: BookOpenCheck,
  topic: NotebookPen,
  refine: Layout,
  design: Palette,
  generating: Sparkles,
};

interface LibraryViewProps {
  onNavigate?: (view: string) => void;
}

export function LibraryView({ onNavigate }: LibraryViewProps) {
  const { newProject, addToLibrary, updateProjectField } = useProject();
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [step, setStep] = useState<LibraryStep>('hub');
  const [creationType, setCreationType] = useState('');
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

  const typeLabel = creationType === 'Clase' ? 'Lección individual' : creationType === 'Unidad' ? 'Serie de lecciones' : creationType === 'Ficha' ? 'Fichas de actividades' : creationType === 'Evaluacion' ? 'Evaluación formativa' : creationType === 'Simce' ? 'Evaluación tipo SIMCE' : 'Recurso inclusivo DUA';

  const handleSaveGenerated = (text: string) => {
    newProject();
    updateProjectField('titulo', `Recurso - ${new Date().toLocaleDateString('es-CL')}`);
    updateProjectField('inicio', text);
    addToLibrary();
    setStep('hub');
    setCreationType('');
  };

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

  const handleHubSelect = (tipo: string) => {
    setCreationType(tipo);
    setStep('curriculum');
  };

  const stepIndex = STEPS.findIndex(s => s.key === step);
  const currentStepLabel = STEPS.find(s => s.key === step)?.label;

  const renderStepper = () => (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const Icon = STEP_ICONS[s.key];
        const isActive = step === s.key;
        const isPast = stepIndex > i;
        return (
          <div key={s.key} className="flex items-center flex-shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-all duration-200 ${
              isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : isPast ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                isActive ? 'bg-indigo-600 text-white shadow-sm' : isPast ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-300'
              }`}>
                {isPast ? <Check size={14} strokeWidth={3} /> : <Icon size={14} strokeWidth={2.25} />}
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap hidden sm:inline ${isActive ? 'text-indigo-700' : ''}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-px mx-1 ${isPast || isActive ? 'bg-indigo-200' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Hub ──

  const renderHub = () => (
    <div className="max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-7 sm:p-10 mb-10 shadow-xl shadow-indigo-200/30">
        <div className="absolute inset-0 bg-noise opacity-[0.06]" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.04] rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10 flex items-start gap-5">
          <IconBadge icon={WandSparkles} size="xl" color="#ffffff" variant="glass" className="hidden sm:flex mt-1" />
          <div className="flex-1">
            <Badge color="violet" size="md" className="mb-3">IA curricular</Badge>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-3">
              Biblioteca Creativa
            </h1>
            <p className="text-indigo-200 text-sm sm:text-base max-w-xl leading-relaxed mb-6">
              Crea clases, fichas, evaluaciones y recursos inclusivos alineados al currículum chileno.
            </p>
            <Button
              variant="ghost"
              size="md"
              iconRight={ArrowRight}
              onClick={() => onNavigate?.('banco')}
              className="text-white/90 hover:text-white hover:bg-white/15 border border-white/20"
            >
              Explorar objetivos
            </Button>
          </div>
        </div>
      </div>

      <SectionHeader
        icon={BrainCircuit}
        iconColor="#4f46e5"
        title="¿Qué creamos hoy?"
        description="Selecciona el tipo de recurso que quieres generar"
      />

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {HUB_CARDS.map(({ tipo, label, desc, icon: Icon, color, badge }) => (
          <Card key={tipo} variant="interactive" onClick={() => handleHubSelect(tipo)} className="relative p-5">
            {badge && <Badge color={badge === 'Popular' ? 'indigo' : 'teal'} size="sm" className="absolute top-3 right-3">{badge}</Badge>}
            <IconBadge icon={Icon} size="lg" color={color} variant="gradient" className="mb-4" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{label}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </Card>
        ))}
      </div>

      {isBannerVisible && (
        <Card variant="elevated" className="relative p-5 sm:p-6">
          <button className="absolute top-3 right-3 p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all" onClick={() => setIsBannerVisible(false)} aria-label="Cerrar">
            <X size={16} />
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Users size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-orange-900 mb-0.5">ProfePlanificAI es mejor en equipo</h3>
              <p className="text-sm text-orange-700 leading-relaxed">Comparte y remixea lecciones con tus colegas para crear mejores planificaciones juntos.</p>
            </div>
            <Button variant="premium" size="sm">Crear un equipo</Button>
          </div>
        </Card>
      )}
    </div>
  );

  // ── Curriculum ──

  const renderCurriculum = () => (
    <div className="max-w-6xl mx-auto">
      {renderStepper()}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <Card variant="default" className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nivel</label>
                <select value={level} onChange={e => { setLevel(e.target.value); setSubject(''); setSelectedOA(null); }} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                  <option value="">Seleccionar nivel...</option>
                  {levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              {level && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Asignatura</label>
                  <select value={subject} onChange={e => { setSubject(e.target.value); setSelectedOA(null); }} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                    <option value="">Seleccionar asignatura...</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
            {level && subject && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Buscar OA</label>
                <SearchInput value={oaSearch} onChange={setOaSearch} placeholder="Buscar por código o texto..." />
              </div>
            )}
          </Card>

          {level && subject && (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {objectives.length === 0 ? (
                <Card variant="default" className="p-8 text-center">
                  <p className="text-sm text-gray-400">No se encontraron objetivos para esta búsqueda.</p>
                </Card>
              ) : objectives.map(oa => (
                <Card
                  key={oa.id}
                  variant={selectedOA?.id === oa.id ? 'interactive' : 'default'}
                  onClick={() => handleSelectOA(oa)}
                  className={`p-4 ${selectedOA?.id === oa.id ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Target size={14} className="text-indigo-500 flex-shrink-0" strokeWidth={2.25} />
                        <span className="inline-block text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-lg">{oa.code}</span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">{oa.text}</p>
                      {oa.axis && <span className="inline-block text-xs text-gray-500 mt-1">Eje: {oa.axis}</span>}
                    </div>
                    {selectedOA?.id === oa.id && (
                      <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={14} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedOA ? (
            <div className="space-y-4 sticky top-4">
              <Card variant="elevated" className="p-5 bg-gradient-to-br from-indigo-50/50 to-white">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpenCheck size={18} className="text-indigo-600" strokeWidth={2.25} />
                  <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider">Articulación curricular</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 font-medium">OA seleccionado</span>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{selectedOA.code} — {selectedOA.text}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Indicador de evaluación</label>
                    <select value={selectedIndicator} onChange={e => setSelectedIndicator(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
                      <option value="">Seleccionar indicador...</option>
                      {selectedOA.indicators.map((ind, i) => <option key={i} value={ind}>{ind}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Habilidad</label>
                    <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
                      <option value="">Seleccionar habilidad...</option>
                      {selectedOA.skills.map((sk, i) => <option key={i} value={sk}>{sk}</option>)}
                    </select>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Resumen curricular</h4>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge color="indigo" size="sm">{level}</Badge>
                      <Badge color="teal" size="sm">{subject}</Badge>
                      <Badge color="amber" size="sm">{selectedOA.code}</Badge>
                      {selectedIndicator && <Badge color="slate" size="sm">{selectedIndicator.slice(0, 28)}...</Badge>}
                    </div>
                  </div>
                  <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={() => setStep('topic')} className="w-full">
                    Continuar al tema
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <Card variant="default" className="p-8 border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <BookOpenCheck size={28} className="text-gray-300" strokeWidth={2.25} />
              </div>
              <p className="text-sm text-gray-500 max-w-xs">Selecciona un nivel, asignatura y OA para ver la articulación curricular.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  // ── Topic ──

  const renderTopic = () => (
    <div className="max-w-4xl mx-auto">
      {renderStepper()}
      <div className="space-y-5">
        <Card variant="default" className="p-5 sm:p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tema del recurso</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ej: La fotosíntesis en plantas nativas chilenas" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Contexto adicional (opcional)</label>
            <textarea value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} rows={4} placeholder="Ej: Curso de 32 estudiantes, 5 con NEE, 2 descendidos. Interés por actividades al aire libre." className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none" />
          </div>
        </Card>

        <Card variant="default" className="p-5">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumen de tu selección</h4>
          <div className="flex flex-wrap gap-2">
            {level && <Badge color="indigo" size="md">{level}</Badge>}
            {subject && <Badge color="teal" size="md">{subject}</Badge>}
            {selectedOA && <Badge color="amber" size="md">{selectedOA.code}</Badge>}
            <Badge color="violet" size="md">{typeLabel}</Badge>
          </div>
        </Card>

        <Card variant="default" className="p-6 border-2 border-dashed border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-center gap-8 mb-4">
            {[
              { icon: FileText, label: 'Subir archivo' },
              { icon: Search, label: 'Pegar enlace' },
              { icon: BookOpenCheck, label: 'Recurso existente' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <Icon size={20} strokeWidth={2.25} />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center">Próximamente podrás adjuntar recursos directamente.</p>
        </Card>

        <div className="flex items-center gap-3">
          <Button variant="secondary" iconLeft={ArrowLeft} onClick={() => setStep('curriculum')}>Atrás</Button>
          <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={() => setStep('refine')} disabled={!topic.trim()}>
            Continuar a refinar
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Refine ──

  const renderRefine = () => (
    <div className="max-w-4xl mx-auto">
      {renderStepper()}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {REFINE_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const isSelected = refineOptions[opt.id];
          return (
            <Card
              key={opt.id}
              variant="interactive"
              onClick={() => setRefineOptions(prev => ({ ...prev, [opt.id]: !prev[opt.id] }))}
              className={`p-4 flex items-start gap-3 ${isSelected ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : ''}`}
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${isSelected ? 'bg-indigo-600 border-indigo-600 shadow-sm' : 'border-gray-300'}`}>
                {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
              </div>
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Icon size={16} strokeWidth={2.25} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-800">{opt.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" iconLeft={ArrowLeft} onClick={() => setStep('topic')}>Atrás</Button>
        <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={() => setStep('design')}>
          Continuar al diseño
        </Button>
      </div>
    </div>
  );

  // ── Design ──

  const renderDesign = () => (
    <div className="max-w-5xl mx-auto">
      {renderStepper()}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {DESIGN_STYLES.map(st => {
          const Icon = st.icon;
          const isSelected = designStyle === st.id;
          return (
            <Card
              key={st.id}
              variant="interactive"
              onClick={() => setDesignStyle(st.id)}
              className={`p-0 overflow-hidden ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
            >
              <div className="h-20 flex items-center justify-center gap-2" style={{ backgroundColor: st.bg }}>
                <div className="w-10 h-10 rounded-xl shadow-sm flex items-center justify-center" style={{ backgroundColor: st.swatch, border: `1px solid ${st.border}` }}>
                  <Icon size={18} style={{ color: st.border.replace('7d', '5b').replace('6e', '4a').replace('93', '7c') }} strokeWidth={2.25} />
                </div>
              </div>
              <div className="p-3 bg-white">
                <h4 className="text-xs font-semibold text-gray-800">{st.name}</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{st.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" iconLeft={ArrowLeft} onClick={() => setStep('refine')}>Atrás</Button>
        <Button variant="premium" size="lg" iconLeft={WandSparkles} onClick={handleGenerate}>
          Generar recurso
        </Button>
      </div>
    </div>
  );

  // ── Generating ──

  const renderGenerating = () => (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-20">
      <Card variant="elevated" className="p-10 text-center w-full">
        <div className="w-16 h-16 rounded-3xl bg-indigo-100 flex items-center justify-center mx-auto mb-6">
          <Loader2 size={32} className="text-indigo-600 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Generando recurso pedagógico...</h3>
        <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
          Estamos alineando tu recurso al currículum chileno y preparando una propuesta lista para usar.
        </p>
        <div className="mt-6 flex justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />
          ))}
        </div>
      </Card>
    </div>
  );

  // ── Result ──

  const renderResult = () => {
    if (!resultText) return null;
    return (
      <GeneratedResourcePanel
        resultText={resultText}
        error={error}
        onBack={() => setStep('design')}
        onSave={() => handleSaveGenerated(resultText)}
        onRegenerate={handleGenerate}
      />
    );
  };

  return (
    <div className="view biblioteca animate-fade-in">
      {step === 'hub' && renderHub()}
      {step === 'curriculum' && renderCurriculum()}
      {step === 'topic' && renderTopic()}
      {step === 'refine' && renderRefine()}
      {step === 'design' && renderDesign()}
      {step === 'generating' && renderGenerating()}
      {step === 'result' && renderResult()}
    </div>
  );
}
