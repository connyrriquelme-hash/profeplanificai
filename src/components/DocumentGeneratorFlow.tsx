import { useReducer, useCallback, useEffect, type ReactNode } from 'react';
import {
  BookOpen, FileText, ClipboardCheck, Presentation,
  ChevronRight, ChevronLeft, Loader2, Sparkles,
  GraduationCap, Layers, MessageSquare, CheckCircle2,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { SearchInput } from './ui/SearchInput';
import { EmptyState } from './ui/EmptyState';
import { Stepper } from './shared/Stepper';
import { useCurriculum } from '../contexts/CurriculumContext';
import { generarConIA } from '../services/aiService';
import type { SlideLesson } from '../types/slideLesson';

// ── Types ──────────────────────────────────────────────────────────────────

type WizardStep = 'curriculum' | 'resource-type' | 'context' | 'loading' | 'workspace';

type ResourceType = 'planificacion' | 'ficha' | 'evaluacion' | 'presentacion' | null;

interface WizardState {
  step: WizardStep;
  stepIndex: number;
  nivel: string;
  asignatura: string;
  objectiveCode: string;
  objectiveText: string;
  resourceType: ResourceType;
  topic: string;
  duaInclusion: boolean;
  differentiation: boolean;
  rubric: boolean;
  resultText: string;
  slideLesson: SlideLesson | null;
  error: string | null;
  loadingMessage: string;
}

type WizardAction =
  | { type: 'SET_NIVEL'; nivel: string }
  | { type: 'SET_ASIGNATURA'; asignatura: string }
  | { type: 'SET_OBJECTIVE'; code: string; text: string }
  | { type: 'SET_RESOURCE_TYPE'; resourceType: ResourceType }
  | { type: 'SET_TOPIC'; topic: string }
  | { type: 'TOGGLE_DUA' }
  | { type: 'TOGGLE_DIFFERENTIATION' }
  | { type: 'TOGGLE_RUBRIC' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: WizardStep; stepIndex: number }
  | { type: 'SET_LOADING'; message: string }
  | { type: 'SET_RESULT'; text: string; slideLesson?: SlideLesson }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' };

const STEP_ORDER: WizardStep[] = ['curriculum', 'resource-type', 'context', 'loading', 'workspace'];
const STEP_LABELS = ['Curriculum', 'Tipo de recurso', 'Contexto', 'Generando', 'Resultado'];

const RESOURCE_TYPES = [
  { id: 'planificacion' as const, label: 'Planificacion', icon: Layers, description: 'Guia de clase completa con inicio, desarrollo y cierre' },
  { id: 'ficha' as const, label: 'Ficha de actividades', icon: FileText, description: 'Actividades puntuales para una sesion especifica' },
  { id: 'evaluacion' as const, label: 'Evaluacion', icon: ClipboardCheck, description: 'Prueba o rúbrica alineada al OA seleccionado' },
  { id: 'presentacion' as const, label: 'Presentacion visual', icon: Presentation, description: 'Slides con imagenes y diagramas SmartArt' },
];

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_NIVEL':
      return { ...state, nivel: action.nivel, asignatura: '', objectiveCode: '', objectiveText: '' };
    case 'SET_ASIGNATURA':
      return { ...state, asignatura: action.asignatura, objectiveCode: '', objectiveText: '' };
    case 'SET_OBJECTIVE':
      return { ...state, objectiveCode: action.code, objectiveText: action.text };
    case 'SET_RESOURCE_TYPE':
      return { ...state, resourceType: action.resourceType };
    case 'SET_TOPIC':
      return { ...state, topic: action.topic };
    case 'TOGGLE_DUA':
      return { ...state, duaInclusion: !state.duaInclusion };
    case 'TOGGLE_DIFFERENTIATION':
      return { ...state, differentiation: !state.differentiation };
    case 'TOGGLE_RUBRIC':
      return { ...state, rubric: !state.rubric };
    case 'NEXT_STEP': {
      const currentIdx = STEP_ORDER.indexOf(state.step);
      if (currentIdx < STEP_ORDER.length - 1) {
        return { ...state, step: STEP_ORDER[currentIdx + 1], stepIndex: currentIdx + 1 };
      }
      return state;
    }
    case 'PREV_STEP': {
      const currentIdx = STEP_ORDER.indexOf(state.step);
      if (currentIdx > 0) {
        const targetStep = STEP_ORDER[currentIdx - 1];
        if (targetStep === 'loading') {
          return { ...state, step: STEP_ORDER[currentIdx - 2], stepIndex: currentIdx - 2 };
        }
        return { ...state, step: targetStep, stepIndex: currentIdx - 1 };
      }
      return state;
    }
    case 'GO_TO_STEP':
      return { ...state, step: action.step, stepIndex: action.stepIndex };
    case 'SET_LOADING':
      return { ...state, loadingMessage: action.message };
    case 'SET_RESULT':
      return {
        ...state,
        step: 'workspace',
        stepIndex: 4,
        resultText: action.text,
        slideLesson: action.slideLesson || null,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, step: 'workspace', stepIndex: 4, error: action.error };
    case 'RESET':
      return INITIAL_STATE;
    default:
      return state;
  }
}

const INITIAL_STATE: WizardState = {
  step: 'curriculum',
  stepIndex: 0,
  nivel: '',
  asignatura: '',
  objectiveCode: '',
  objectiveText: '',
  resourceType: null,
  topic: '',
  duaInclusion: false,
  differentiation: false,
  rubric: false,
  resultText: '',
  slideLesson: null,
  error: null,
  loadingMessage: 'Preparando generacion...',
};

// ── Sub-Components ─────────────────────────────────────────────────────────

function CurriculumStep({ state, dispatch }: { state: WizardState; dispatch: React.Dispatch<WizardAction> }) {
  const { levels, getSubjects, getObjectives } = useCurriculum();
  const subjects = state.nivel ? getSubjects(state.nivel) : [];
  const objectives = state.nivel && state.asignatura ? getObjectives(state.nivel, state.asignatura) : [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <GraduationCap size={20} className="text-indigo-600" />
          Configuracion Curricular
        </h3>
        <p className="text-sm text-gray-500">Selecciona el nivel, asignatura y objetivo de aprendizaje.</p>
      </div>

      {/* Nivel */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Nivel educativo</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => dispatch({ type: 'SET_NIVEL', nivel: lvl })}
              className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                state.nivel === lvl
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Asignatura */}
      {state.nivel && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Asignatura</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {subjects.map((asig) => (
              <button
                key={asig}
                onClick={() => dispatch({ type: 'SET_ASIGNATURA', asignatura: asig })}
                className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                  state.asignatura === asig
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {asig}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Objetivo de Aprendizaje */}
      {state.asignatura && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Objetivo de Aprendizaje</label>
          <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-3 bg-white">
            {objectives.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No se encontraron OA para esta combinacion.</p>
            )}
            {objectives.map((oa) => (
              <button
                key={oa.code}
                onClick={() => dispatch({ type: 'SET_OBJECTIVE', code: oa.code, text: oa.text })}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm border-2 transition-all ${
                  state.objectiveCode === oa.code
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="font-mono text-xs text-indigo-600 font-bold">{oa.code}</span>
                <p className="text-gray-700 mt-1 leading-relaxed">{oa.text}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Selected summary */}
      {state.objectiveCode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-indigo-50 border border-indigo-200"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-indigo-800">Objetivo seleccionado</p>
              <p className="text-xs text-indigo-600 mt-1">{state.objectiveCode} — {state.objectiveText}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function ResourceTypeStep({ state, dispatch }: { state: WizardState; dispatch: React.Dispatch<WizardAction> }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Layers size={20} className="text-indigo-600" />
          Tipo de recurso
        </h3>
        <p className="text-sm text-gray-500">Elige que tipo de documento educativo generar.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RESOURCE_TYPES.map((rt) => {
          const Icon = rt.icon;
          const isSelected = state.resourceType === rt.id;
          return (
            <button
              key={rt.id}
              onClick={() => dispatch({ type: 'SET_RESOURCE_TYPE', resourceType: rt.id })}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${isSelected ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                  <Icon size={24} className={isSelected ? 'text-indigo-600' : 'text-gray-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>{rt.label}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rt.description}</p>
                </div>
                {isSelected && (
                  <CheckCircle2 size={20} className="text-indigo-600 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function ContextStep({ state, dispatch }: { state: WizardState; dispatch: React.Dispatch<WizardAction> }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <MessageSquare size={20} className="text-indigo-600" />
          Contexto y personalizacion
        </h3>
        <p className="text-sm text-gray-500">Define el tema especifico y las opciones de inclusion.</p>
      </div>

      {/* Topic */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tema especifico</label>
        <textarea
          value={state.topic}
          onChange={(e) => dispatch({ type: 'SET_TOPIC', topic: e.target.value })}
          placeholder="Ej: Fotosintesis en plantas, Fracciones equivalentes, La Guerra del Pacifico..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
        />
      </div>

      {/* DUA Options */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">Principios de inclusion</label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={state.duaInclusion}
              onChange={() => dispatch({ type: 'TOGGLE_DUA' })}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Inclusion DUA</p>
              <p className="text-xs text-gray-500">Adecuaciones para Diversidad, Universalidad y Accesibilidad</p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={state.differentiation}
              onChange={() => dispatch({ type: 'TOGGLE_DIFFERENTIATION' })}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Diferenciacion de actividades</p>
              <p className="text-xs text-gray-500">Niveles de dificultad adaptados para distintos ritmos</p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={state.rubric}
              onChange={() => dispatch({ type: 'TOGGLE_RUBRIC' })}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Incluir rubrica de evaluacion</p>
              <p className="text-xs text-gray-500">Tabla de criterios con niveles de logro</p>
            </div>
          </label>
        </div>
      </div>
    </motion.div>
  );
}

function LoadingStep({ state }: { state: WizardState }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
          <Loader2 size={36} className="text-indigo-600 animate-spin" />
        </div>
        <Sparkles size={20} className="absolute -top-1 -right-1 text-amber-500 animate-pulse" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Generando tu recurso</h3>
      <p className="text-sm text-gray-500 text-center max-w-md">{state.loadingMessage}</p>
      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
        <AlertCircle size={14} />
        <span>Esto puede tomar 15-30 segundos</span>
      </div>
    </motion.div>
  );
}

function WorkspaceStep({ state, onReset }: { state: WizardState; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full"
    >
      {/* Main content - 70% */}
      <div className="flex-[7] overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-green-600" />
                Recurso generado
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {state.resourceType === 'presentacion' ? 'Presentacion visual' : 'Documento'} — {state.nivel} / {state.asignatura}
              </p>
            </div>
            <Button variant="outline" size="sm" iconLeft={RefreshCw} onClick={onReset}>
              Nuevo recurso
            </Button>
          </div>

          {/* Error display */}
          {state.error && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-start gap-3">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Error:</span> {state.error}
              </div>
            </div>
          )}

          {/* Document preview */}
          <Card variant="elevated" className="p-6 sm:p-8">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="max-w-none text-gray-900 leading-relaxed space-y-4">
                {state.resultText.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">{line.replace(/^# /, '')}</h1>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b border-gray-100">{line.replace(/^## /, '')}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-base font-semibold text-gray-900 mt-5 mb-2">{line.replace(/^### /, '')}</h3>;
                  }
                  if (line.startsWith('| ')) {
                    return null;
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <ul key={i} className="list-disc ml-6 text-sm text-gray-900 leading-relaxed mb-1">
                        <li>{line.replace(/^- /, '')}</li>
                      </ul>
                    );
                  }
                  if (/^\d+\.\s/.test(line)) {
                    return (
                      <ol key={i} className="list-decimal ml-6 text-sm text-gray-900 leading-relaxed mb-1">
                        <li>{line.replace(/^\d+\.\s/, '')}</li>
                      </ol>
                    );
                  }
                  if (line.trim() === '---') {
                    return <hr key={i} className="my-6 border-gray-200" />;
                  }
                  if (line.trim() === '') {
                    return <div key={i} className="h-2" />;
                  }
                  const html = line
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em class="text-gray-700 italic">$1</em>');
                  return <p key={i} className="text-sm text-gray-900 leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: html }} />;
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Assistant sidebar - 30% */}
      <div className="flex-[3] border-l border-gray-200 bg-gray-50/50 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-600" />
            Asistente IA
          </h3>
          <p className="text-xs text-gray-500 mt-1">Pide ajustes o mejoras al documento generado.</p>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Sparkles size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-xs">Chat del asistente disponible proximamente</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function DocumentGeneratorFlow() {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);

  const canAdvance = (() => {
    switch (state.step) {
      case 'curriculum':
        return state.objectiveCode !== '';
      case 'resource-type':
        return state.resourceType !== null;
      case 'context':
        return true;
      default:
        return false;
    }
  })();

  const handleGenerate = useCallback(async () => {
    dispatch({ type: 'NEXT_STEP' });
    dispatch({ type: 'SET_LOADING', message: 'Analizando objetivo de aprendizaje...' });

    await new Promise((r) => setTimeout(r, 800));
    dispatch({ type: 'SET_LOADING', message: 'Construyendo prompt pedagogico...' });

    await new Promise((r) => setTimeout(r, 600));
    dispatch({ type: 'SET_LOADING', message: 'Generando contenido con IA...' });

    try {
      const isPresentation = state.resourceType === 'presentacion';

      let prompt = `Genera una ${state.resourceType} completa para la siguiente asignatura:\n\n`;
      prompt += `- Nivel: ${state.nivel}\n`;
      prompt += `- Asignatura: ${state.asignatura}\n`;
      prompt += `- OA: ${state.objectiveCode} - ${state.objectiveText}\n`;
      if (state.topic) prompt += `- Tema: ${state.topic}\n`;
      if (state.duaInclusion) prompt += `- Incluir adaptaciones DUA\n`;
      if (state.differentiation) prompt += `- Incluir actividades diferenciadas\n`;
      if (state.rubric) prompt += `- Incluir rubrica de evaluacion\n`;
      prompt += `\nGenera el contenido en Markdown limpio con secciones ##, listas, y tablas cuando corresponda.`;

      const result = await generarConIA({
        tipo: state.resourceType || 'planificacion',
        nivel: state.nivel,
        asignatura: state.asignatura,
        oa: `${state.objectiveCode} - ${state.objectiveText}`,
        tema: state.topic,
        promptExt: prompt,
      });

      if (result.ok && result.texto) {
        dispatch({ type: 'SET_RESULT', text: result.texto });
      } else {
        dispatch({ type: 'SET_ERROR', error: result.error || 'Error al generar el contenido.' });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      dispatch({ type: 'SET_ERROR', error: msg });
    }
  }, [state]);

  const handleBack = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const handleNext = useCallback(() => {
    if (state.step === 'context') {
      handleGenerate();
    } else {
      dispatch({ type: 'NEXT_STEP' });
    }
  }, [state.step, handleGenerate]);

  const renderStep = () => {
    switch (state.step) {
      case 'curriculum':
        return <CurriculumStep state={state} dispatch={dispatch} />;
      case 'resource-type':
        return <ResourceTypeStep state={state} dispatch={dispatch} />;
      case 'context':
        return <ContextStep state={state} dispatch={dispatch} />;
      case 'loading':
        return <LoadingStep state={state} />;
      case 'workspace':
        return <WorkspaceStep state={state} onReset={() => dispatch({ type: 'RESET' })} />;
      default:
        return null;
    }
  };

  const isNavigable = state.step !== 'loading' && state.step !== 'workspace';

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100">
                <BookOpen size={20} className="text-indigo-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Generador de Recursos</h1>
                <p className="text-xs text-gray-500">Crea materiales educativos alineados al curriculum chileno</p>
              </div>
            </div>
            <Badge color="indigo" size="sm">IA Curriculum</Badge>
          </div>

          {/* Stepper */}
          {isNavigable && (
            <Stepper
              steps={STEP_LABELS.slice(0, 4)}
              current={state.stepIndex + 1}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation footer */}
      {isNavigable && (
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="md"
              iconLeft={ChevronLeft}
              onClick={handleBack}
              disabled={state.step === 'curriculum'}
            >
              Anterior
            </Button>
            <Button
              variant={state.step === 'context' ? 'premium' : 'primary'}
              size="md"
              iconRight={state.step === 'context' ? Sparkles : ChevronRight}
              onClick={handleNext}
              disabled={!canAdvance}
              loading={false}
            >
              {state.step === 'context' ? 'Generar con IA' : 'Siguiente'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
