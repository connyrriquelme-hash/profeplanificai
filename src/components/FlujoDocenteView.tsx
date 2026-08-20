import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  BookOpenCheck, Target, Layers3, WandSparkles, FileText,
  ClipboardCheck, ClipboardList, Presentation, Loader2, Check,
  ArrowRight, ArrowLeft, Sparkles, GraduationCap, Lightbulb,
  Save, Download, RefreshCw, AlertTriangle, Microscope, BookOpen,
  Link2, Upload
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { generateGuide, generateEvaluation, generateFormativeEvaluation, generateBitacoraCientifica, generateRubric, generatePresentation, generateMaterial, generateUnidadDidactica, type MaterialRequest, type MaterialResult, type FormativeEvaluationType } from '../services/materialGeneratorService';
import { api } from '../services/apiClient';
import PremiumRubricPreview from './PremiumRubricPreview';
import type { PremiumRubric } from '../utils/premiumRubricModel';
import ProductRenderer from './products/ProductRenderer';
import { WorkspaceLayout } from './workspace/WorkspaceLayout';
import type { PedagogicalProduct } from './products/types';
import { normalizeProduct } from './products/normalizers';
import type { PptDeck } from '../../schemas/PptDeckSchema';
import type { UnidadDidactica } from '../../schemas/UnidadDidacticaSchema';
import { defaultClassroomConfiguration, groupingLabel, recommendLessonCount, type ClassroomConfiguration } from '../utils/pedagogicalHeuristics';

type FlujoStep = 'nivel' | 'asignatura' | 'oa' | 'contexto' | 'producto' | 'generando' | 'resultado';

const GENERATION_TIMEOUT_MS = 60_000;

// Paleta cálida educativa: tonos tomados directo de los tokens del tema
// (.theme-calida en index.css) en vez de un arcoíris genérico de Tailwind —
// mantiene distinción visual entre productos sin salir de la identidad de marca.
const PRODUCTOS = [
  { id: 'guia_estudiante', label: 'Guía Estudiante', icon: FileText, color: '#B5471F' }, // --primary
  { id: 'guia_docente', label: 'Guía Docente', icon: BookOpenCheck, color: '#7C2F13' }, // --primary-ink
  { id: 'planificacion', label: 'Planificación', icon: Layers3, color: '#E9A13B' }, // --accent-honey
  { id: 'evaluation_exit_ticket', label: 'Ticket de Salida', icon: ClipboardCheck, color: '#9A3A17' }, // --primary-hover
  { id: 'evaluation_321', label: 'Formato 3-2-1', icon: ClipboardCheck, color: '#8A5A00' }, // --warn-ink
  { id: 'evaluation_checklist', label: 'Lista de Cotejo', icon: ClipboardList, color: '#5B7B5E' }, // --success
  { id: 'evaluation_formative_rubric', label: 'Rúbrica Analítica', icon: ClipboardList, color: '#2E4630' }, // --success-ink
  { id: 'evaluation_traffic_light', label: 'Semáforo', icon: ClipboardCheck, color: '#6B5B4E' }, // --ink-soft
  { id: 'bitacora_cientifica', label: 'Bitácora Científica IA', icon: Microscope, color: '#5A483A' }, // --ink-mid
  { id: 'rubrica', label: 'Rúbrica Premium', icon: ClipboardList, color: '#B5471F' }, // --primary
  { id: 'presentacion', label: 'Presentación PPT', icon: Presentation, color: '#E9A13B' }, // --accent-honey
  { id: 'serie_lecciones', label: 'Serie de Lecciones', icon: BookOpen, color: '#33261C' }, // --ink
];

// Etiquetas del preview de PPT: antes se derivaban de slide.layout con un
// simple replace(/_/g, ' ') + CSS capitalize, mostrando el nombre del layout
// en inglés (Title, Bullets, Image Text...) tal cual viene del schema.
const PPT_LAYOUT_LABELS: Record<string, string> = {
  title: 'Portada',
  bullets: 'Contenido',
  image_text: 'Imagen + texto',
  comparison: 'Comparación',
  quote: 'Cita',
  vocabulario: 'Vocabulario',
  ciclo_proceso: 'Ciclo / Proceso',
  quiz_opcion_multiple: 'Quiz',
  verdadero_falso: 'Verdadero o Falso',
};

interface D1Course { id: string; code: string; name: string; objective_count: number }
interface D1Subject { id: string; name: string; objective_count: number }
interface D1Objective { id: string; code: string; official_text: string; course_name: string; subject_name: string; axis_name?: string }

function isPedagogicalProduct(product: unknown): product is PedagogicalProduct {
  return (
    typeof product === 'object' &&
    product !== null &&
    'type' in product &&
    typeof (product as PedagogicalProduct).type === 'string' &&
    'metadata' in product &&
    'data' in product
  );
}

// Preview simple para "Serie de Lecciones" — solo lectura, sin edición ni
// exportación propia (eso ya lo dan los botones genéricos de abajo:
// Guardar en Biblioteca / Descargar JSON). Primera versión: si esto crece
// (editar clases, reordenar fases), se separa a su propio archivo bajo
// components/products/, igual que ProductRenderer.
function UnidadDidacticaPreview({ unidad }: { unidad: UnidadDidactica }) {
  return (
    <div className="not-prose space-y-3">
      <div>
        <h3 className="text-base font-bold text-gray-900">{unidad.titulo}</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {unidad.nivel} · {unidad.asignatura} · Metodología: {unidad.metodologiaActiva} · {unidad.clases.length} clase{unidad.clases.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="space-y-2">
        {unidad.clases.map((clase) => (
          <div key={clase.numero} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--primary-tint)] text-[var(--primary-ink)] text-xs font-bold flex items-center justify-center flex-shrink-0">
                {clase.numero}
              </span>
              <p className="text-sm font-medium text-gray-900 truncate">{clase.tema}</p>
            </div>
            <p className="text-xs text-gray-600 mt-1">{clase.objetivoEspecifico}</p>
            <div className="mt-2 grid gap-1 text-xs text-gray-600">
              <p><span className="font-semibold text-gray-700">Inicio:</span> {clase.estructuraClase.inicio.descripcion}</p>
              <p><span className="font-semibold text-gray-700">Desarrollo:</span> {clase.estructuraClase.desarrollo.descripcion}</p>
              <p><span className="font-semibold text-gray-700">Cierre:</span> {clase.estructuraClase.cierre.descripcion}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FlujoDocenteView() {
  const [step, setStep] = useState<FlujoStep>('nivel');
  const [courses, setCourses] = useState<D1Course[]>([]);
  const [subjects, setSubjects] = useState<D1Subject[]>([]);
  const [objectives, setObjectives] = useState<D1Objective[]>([]);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [methodologies, setMethodologies] = useState<Array<{ id?: string; name: string; subject_fits?: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedCourse, setSelectedCourse] = useState<D1Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<D1Subject | null>(null);
  const [selectedOA, setSelectedOA] = useState<D1Objective | null>(null);
  const [selectedMethodology, setSelectedMethodology] = useState('');
  const [selectedProducto, setSelectedProducto] = useState('');
  const [topic, setTopic] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [classroomConfig, setClassroomConfig] = useState<ClassroomConfiguration>(defaultClassroomConfiguration);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractedSource, setExtractedSource] = useState<{ fuente: 'url' | 'docx'; titulo?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<unknown>(null);
  const [resourceId, setResourceId] = useState('');
  const [pptxLoading, setPptxLoading] = useState(false);
  const [pptDeck, setPptDeck] = useState<PptDeck | null>(null);
  const [renderError, setRenderError] = useState('');
  const [premiumRubric, setPremiumRubric] = useState<PremiumRubric | null>(null);
  const [unidadDidactica, setUnidadDidactica] = useState<UnidadDidactica | null>(null);
  const [qualityReport, setQualityReport] = useState<MaterialResult['quality']>(undefined);

  const recommendedLessons = useMemo(() => recommendLessonCount({
    objectiveText: selectedOA?.official_text || '',
    methodology: selectedMethodology,
    productType: selectedProducto,
    classDurationMinutes: classroomConfig.classDurationMinutes,
  }), [selectedOA?.official_text, selectedMethodology, selectedProducto, classroomConfig.classDurationMinutes]);

  // Load courses
  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(d => setCourses(d.data || []))
      .catch(() => {});
  }, []);

  // Load subjects when course selected
  useEffect(() => {
    if (!selectedCourse) { setSubjects([]); return; }
    fetch(`/api/subjects?course=${selectedCourse.id}`)
      .then(r => r.json())
      .then(d => setSubjects((d.data || []).filter((s: any) => (s.objective_count || 0) > 0)))
      .catch(() => {});
  }, [selectedCourse]);

  // Load objectives when course+subject selected
  useEffect(() => {
    if (!selectedCourse || !selectedSubject) { setObjectives([]); return; }
    setLoading(true);
    fetch(`/api/objectives?course=${selectedCourse.id}&subject=${selectedSubject.id}&limit=100`)
      .then(r => r.json())
      .then(d => {
        setObjectives(d.data || []);
        // Load indicators for first objective
        if ((d.data || []).length > 0) {
          fetch(`/api/curriculum/indicators?oa_code=${encodeURIComponent((d.data[0] as D1Objective).code)}&limit=10`)
            .then(r => r.json())
            .then(id => setIndicators((id.indicators || id.data || []).map((i: Record<string, unknown>) => (typeof i.indicator_text === 'string' ? i.indicator_text : typeof i.text === 'string' ? i.text : ''))))
            .catch(() => {});
          fetch(`/api/curriculum/skills?objective_id=${encodeURIComponent(d.data[0].id)}`)
            .then(r => r.json())
            .then(sk => setSkills((sk.data || []).map((s: Record<string, unknown>) => (typeof s.official_text === 'string' ? s.official_text : typeof s.text === 'string' ? s.text : ''))))
            .catch(() => {});
        }
      })
      .catch(() => setObjectives([]))
      .finally(() => setLoading(false));
  }, [selectedCourse, selectedSubject]);

  // Load methodologies
  useEffect(() => {
    fetch('/api/methodologies')
      .then(r => r.json())
      .then(d => setMethodologies(d.data || []))
      .catch(() => {});
  }, []);

  const handleSelectOA = useCallback((oa: D1Objective) => {
    setSelectedOA(oa);
    // Load indicators and skills for this OA
    fetch(`/api/curriculum/indicators?oa_code=${encodeURIComponent(oa.code)}&limit=10`)
      .then(r => r.json())
      .then(id => setIndicators((id.indicators || id.data || []).map((i: Record<string, unknown>) => (typeof i.indicator_text === 'string' ? i.indicator_text : typeof i.text === 'string' ? i.text : ''))))
      .catch(() => {});
    fetch(`/api/curriculum/skills?objective_id=${encodeURIComponent(oa.id)}`)
      .then(r => r.json())
      .then(sk => setSkills((sk.data || []).map((s: Record<string, unknown>) => (typeof s.official_text === 'string' ? s.official_text : typeof s.text === 'string' ? s.text : ''))))
      .catch(() => {});
  }, []);

  // Agrega al final de additionalContext en vez de reemplazarlo — el
  // docente puede haber escrito contexto propio antes de pegar la URL o
  // subir el Word, y no debe perderlo.
  const appendToAdditionalContext = useCallback((texto: string) => {
    setAdditionalContext(prev => (prev.trim() ? `${prev}\n\n${texto}` : texto));
  }, []);

  const handleExtractFromUrl = useCallback(async () => {
    const url = referenceUrl.trim();
    if (!url) return;
    setExtracting(true);
    setExtractError('');
    setExtractedSource(null);
    try {
      const res = await api.post<{ ok: true; texto: string; fuente: 'url' | 'docx'; titulo?: string }>(
        '/api/extract-content',
        { url },
      );
      appendToAdditionalContext(res.texto);
      setExtractedSource({ fuente: res.fuente, titulo: res.titulo });
      setReferenceUrl('');
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'No se pudo extraer el contenido de la URL.');
    } finally {
      setExtracting(false);
    }
  }, [referenceUrl, appendToAdditionalContext]);

  // No usa api.post: ese helper siempre serializa el body a JSON, y un
  // archivo .docx va como FormData/multipart. El token se lee igual que en
  // la descarga de PPTX más abajo (única otra llamada de este archivo que
  // necesita adjuntar Authorization a mano).
  const handleExtractFromFile = useCallback(async (file: File) => {
    setExtracting(true);
    setExtractError('');
    setExtractedSource(null);
    try {
      const tokenRaw = localStorage.getItem('planificaia_token');
      const token = tokenRaw ? JSON.parse(tokenRaw).token : '';
      const formData = new FormData();
      formData.set('file', file);
      const resp = await fetch('/api/extract-content', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo extraer el contenido del archivo.');
      }
      appendToAdditionalContext(data.texto);
      setExtractedSource({ fuente: data.fuente, titulo: data.titulo });
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'No se pudo extraer el contenido del archivo.');
    } finally {
      setExtracting(false);
    }
  }, [appendToAdditionalContext]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) handleExtractFromFile(file);
  }, [handleExtractFromFile]);

  const generationAbortRef = useRef<AbortController | null>(null);

  const handleCancelGeneration = useCallback(() => {
    generationAbortRef.current?.abort();
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedOA || !selectedProducto) return;
      setLoading(true);
      setError('');
      setResult(null);
      setPptxLoading(false);
      setPptDeck(null);
      setRenderError('');
      setPremiumRubric(null);
      setUnidadDidactica(null);
      setQualityReport(undefined);
      setStep('generando');

    const controller = new AbortController();
    generationAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);
    const { signal } = controller;

    const classroomInstructions = [
      `Configuración escolar: bloque de ${classroomConfig.classDurationMinutes} minutos; ${classroomConfig.studentCount} estudiantes; ${groupingLabel(classroomConfig.grouping)}.`,
      `Recursos disponibles: ${classroomConfig.availableResources}.`,
      `La salida debe quedar preparada para edición posterior en Word.`,
      `La heurística recomienda ${recommendedLessons} clases para desarrollar este OA; si el producto es de clase única, úsalo como una sesión dentro de esa secuencia.`,
    ].join('\n');
    const effectiveContext = [additionalContext.trim(), classroomInstructions].filter(Boolean).join('\n\n');

    const req: MaterialRequest = {
      level: selectedOA.course_name,
      subject: selectedOA.subject_name,
      objectiveCode: selectedOA.code,
      objectiveText: selectedOA.official_text,
      indicators,
      skills,
      topic: topic || selectedOA.official_text.substring(0, 60),
      additionalContext: effectiveContext,
      methodology: selectedMethodology,
      classDurationMinutes: classroomConfig.classDurationMinutes,
      studentCount: classroomConfig.studentCount,
      grouping: groupingLabel(classroomConfig.grouping),
      availableResources: classroomConfig.availableResources,
      recommendedLessons,
      outputFormat: classroomConfig.outputFormat,
    };

    try {
      let res: MaterialResult;
      const isFormativeEvaluation = [
        'evaluation_exit_ticket',
        'evaluation_321',
        'evaluation_checklist',
        'evaluation_formative_rubric',
        'evaluation_traffic_light'
      ].includes(selectedProducto);

      const isBitacoraCientifica = selectedProducto === 'bitacora_cientifica';
      const isSerieLecciones = selectedProducto === 'serie_lecciones';

      if (isFormativeEvaluation) {
        res = await generateFormativeEvaluation(req, selectedProducto as FormativeEvaluationType, signal);
      } else if (isBitacoraCientifica) {
        res = await generateBitacoraCientifica(req, signal);
      } else if (isSerieLecciones) {
        // Contrato real de /api/materials/unidad-didactica (distinto al de
        // MaterialRequest): nivel + metodologiaActiva + oas[] + titulo?.
        // No hay parámetro de "número de sesiones" — el engine decide entre
        // 2 y 12 clases (UnidadDidacticaSchema.ts) según el OA y la
        // metodología, no algo que el caller pueda fijar sin tocar el engine.
        res = await generateUnidadDidactica({
          titulo: topic || 'Serie de lecciones',
          nivel: selectedOA.course_name,
          metodologiaActiva: (selectedMethodology || 'Tradicional') as 'Tradicional' | 'ABP' | 'Gamificacion' | 'Aula Invertida' | 'Design Thinking',
          oas: [{ code: selectedOA.code, subject: selectedOA.subject_name, objective: selectedOA.official_text }],
          instructions: effectiveContext || undefined,
          classDurationMinutes: classroomConfig.classDurationMinutes,
          recommendedLessons,
          studentCount: classroomConfig.studentCount,
          grouping: groupingLabel(classroomConfig.grouping),
          availableResources: classroomConfig.availableResources,
          outputFormat: classroomConfig.outputFormat,
        }, signal);
      } else {
        switch (selectedProducto) {
          case 'guia_estudiante':
          case 'guia_docente':
            res = await generateGuide(req, selectedProducto as 'guia_estudiante' | 'guia_docente', signal);
            break;
          case 'evaluacion':
            res = await generateEvaluation(req, signal);
            break;
          case 'rubrica':
            res = await generateRubric(req, signal);
            break;
          case 'presentacion':
            res = await generatePresentation(req, signal);
            break;
          default:
            res = await generateMaterial(req, selectedProducto, signal);
        }
      }

      if (res?.ok) {
        // For bitacora_cientifica, the response contains evaluation which needs to be normalized
        if (selectedProducto === 'bitacora_cientifica' && res.evaluation) {
          // The evaluation from the endpoint is the raw bitacora, we need to ensure it's properly structured
          // The ProductRenderer expects the full ClassroomScientificNotebook structure
          // For now, we pass the evaluation directly - it should match ClassroomScientificNotebook
          setResult(res.evaluation);
        } else if (selectedProducto === 'serie_lecciones' && res.unidad) {
          setResult(res.unidad);
        } else if (selectedProducto === 'presentacion' && res.pptDeck) {
          setResult(res.pptDeck);
        } else {
          setResult(res.guide || res.evaluation || res.rubric || res.slides || res);
        }
        setResourceId(res.resourceId || '');
        setQualityReport(res.quality);
        if (selectedProducto === 'rubrica' && res.rubric) {
          setPremiumRubric(res.rubric as PremiumRubric);
        }
        if (selectedProducto === 'presentacion' && res.pptDeck) {
          setPptDeck(res.pptDeck as PptDeck);
        }
        if (selectedProducto === 'serie_lecciones' && res.unidad) {
          setUnidadDidactica(res.unidad);
        }
        setStep('resultado');
      } else {
        setError(signal.aborted
          ? 'La generación tardó demasiado o fue cancelada. Intenta de nuevo.'
          : (res?.error || 'Error al generar'));
        setStep('producto');
      }
    } catch (err: unknown) {
      setError(signal.aborted
        ? 'La generación tardó demasiado o fue cancelada. Intenta de nuevo.'
        : (err instanceof Error ? err.message : 'Error inesperado'));
      setStep('producto');
    } finally {
      clearTimeout(timeoutId);
      generationAbortRef.current = null;
      setLoading(false);
    }
  }, [selectedOA, selectedProducto, indicators, skills, topic, additionalContext, selectedMethodology, classroomConfig, recommendedLessons]);

  const handleSave = useCallback(async () => {
    if (!resourceId) return;
    const TOAST_ID = 'flujo-docente-save';
    toast.loading('Guardando...', { id: TOAST_ID });
    try {
      await api.post('/api/resources', {
          title: `${selectedProducto} — ${selectedOA?.code}`,
          type: selectedProducto,
          content: JSON.stringify(result),
          level: selectedOA?.course_name,
          subject: selectedOA?.subject_name,
          objectiveCode: selectedOA?.code,
        });
      toast.dismiss(TOAST_ID);
      toast.success('Guardado');
    } catch {
      toast.dismiss(TOAST_ID);
      toast.error('No se pudo guardar. Intenta de nuevo.');
    }
  }, [resourceId, result, selectedProducto, selectedOA]);

  const suggestedMethodologies = useMemo(() => {
    if (!selectedSubject) return [];
    return methodologies.filter(m => {
      if (!m.subject_fits) return true;
      return true; // Show all for now
    }).slice(0, 5);
  }, [methodologies, selectedSubject]);

  const stepIndex = ['nivel', 'asignatura', 'oa', 'contexto', 'producto', 'generando', 'resultado'].indexOf(step);

  const renderStepper = () => (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Background connecting line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-[var(--border)]" />
        {/* Active connecting line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-[var(--primary)] transition-all duration-500"
          style={{ width: `${(stepIndex / 4) * 100}%` }}
        />
        {['nivel', 'asignatura', 'oa', 'contexto', 'producto'].map((s, i) => {
          const labels: Record<string, string> = { nivel: 'Nivel', asignatura: 'Asignatura', oa: 'OA', contexto: 'Contexto', producto: 'Producto' };
          const isActive = step === s;
          const isPast = stepIndex > i;
          return (
            <div key={s} className="flex flex-col items-center relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/30 scale-110'
                  : isPast
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--bg2)] text-[var(--muted)] border-2 border-[var(--border)]'
              }`}>
                {isPast ? <Check size={14} strokeWidth={3} /> : <span>{i + 1}</span>}
              </div>
              <span className={`mt-2 text-[11px] font-semibold hidden sm:block ${
                isActive ? 'text-[var(--primary)]' : isPast ? 'text-[var(--ink)]' : 'text-[var(--muted)]'
              }`}>
                {labels[s]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Step 1: Nivel
  if (step === 'nivel') {
    return (
      <div className="w-full">
        {renderStepper()}
        <Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-tint)] flex items-center justify-center">
              <GraduationCap size={20} className="text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 1: Selecciona el nivel</h2>
              <p className="text-sm text-gray-500">¿A qué nivel pertenece tu clase?</p>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {courses.filter(c => (c.objective_count || 0) > 0).map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedCourse(c); setStep('asignatura'); }}
                className="p-3 rounded-xl border-2 border-gray-200 hover:border-[var(--primary)] hover:bg-[var(--primary-tint)] transition-all text-left"
              >
                <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.objective_count} OA</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Step 2: Asignatura
  if (step === 'asignatura') {
    return (
      <div className="w-full">
        {renderStepper()}
        <Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-tint)] flex items-center justify-center">
              <BookOpenCheck size={20} className="text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 2: Selecciona la asignatura</h2>
              <p className="text-sm text-gray-500">{selectedCourse?.name} — ¿Qué asignatura?</p>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedSubject(s); setStep('oa'); }}
                className="p-3 rounded-xl border-2 border-gray-200 hover:border-[var(--primary)] hover:bg-[var(--primary-tint)] transition-all text-left"
              >
                <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.objective_count} OA</p>
              </button>
            ))}
          </div>
          {subjects.length === 0 && loading && (
            <p className="text-sm text-gray-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Cargando asignaturas...</p>
          )}
          <div className="mt-4">
            <Button variant="secondary" size="sm" iconLeft={ArrowLeft} onClick={() => setStep('nivel')}>Atrás</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Step 3: OA
  if (step === 'oa') {
    return (
      <div className="w-full">
        {renderStepper()}
        <Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Target size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 3: Selecciona el OA</h2>
              <p className="text-sm text-gray-500">{selectedCourse?.name} — {selectedSubject?.name}</p>
            </div>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {objectives.map(oa => (
              <button
                key={oa.id}
                onClick={() => handleSelectOA(oa)}
                className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                  selectedOA?.id === oa.id
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg flex-shrink-0">{oa.code}</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{oa.official_text.substring(0, 120)}...</p>
                </div>
              </button>
            ))}
          </div>
          {objectives.length === 0 && loading && (
            <p className="text-sm text-gray-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Cargando OA...</p>
          )}
          {selectedOA && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Articulación curricular</h4>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge color="indigo" size="sm">{selectedOA.course_name}</Badge>
                <Badge color="teal" size="sm">{selectedOA.subject_name}</Badge>
                <Badge color="amber" size="sm">{selectedOA.code}</Badge>
                {selectedOA.axis_name && <Badge color="slate" size="sm">{selectedOA.axis_name}</Badge>}
              </div>
              {indicators.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">Indicadores:</p>
                  {indicators.slice(0, 3).map((ind, i) => (
                    <p key={i} className="text-xs text-gray-500">• {ind.substring(0, 80)}...</p>
                  ))}
                </div>
              )}
              {skills.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-600 mb-1">Habilidades:</p>
                  <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 3).map((sk, i) => (
                      <Badge key={i} color="teal" size="sm">{sk.substring(0, 30)}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <Button variant="primary" size="sm" iconRight={ArrowRight} onClick={() => setStep('contexto')}>Continuar</Button>
            </div>
          )}
          <div className="mt-4">
            <Button variant="secondary" size="sm" iconLeft={ArrowLeft} onClick={() => setStep('asignatura')}>Atrás</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Step 4: Contexto
  if (step === 'contexto') {
    return (
      <div className="w-full">
        {renderStepper()}
        <Card variant="elevated" className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Paso 4: Contexto y tema</h2>
            <p className="text-sm text-gray-500">Personaliza tu recurso (opcional)</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tema específico</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ej: Animales vertebrados de Chile"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contexto adicional</label>
            <textarea
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              rows={3}
              placeholder="Ej: Curso de 32 estudiantes, 5 con NEE..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none"
            />
          </div>

          <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary-tint)] p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Configuración de tu realidad escolar</p>
              <p className="text-xs text-gray-500 mt-0.5">Estos datos ajustan tiempos, instrucciones, materiales y formato de salida.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="text-xs font-semibold text-gray-600">Duración del bloque
                <select value={classroomConfig.classDurationMinutes} onChange={e => setClassroomConfig(prev => ({ ...prev, classDurationMinutes: Number(e.target.value) as 45 | 90 | 135 }))} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal">
                  <option value={45}>45 minutos</option><option value={90}>90 minutos</option><option value={135}>135 minutos</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-600">Estudiantes
                <input type="number" min={1} max={60} value={classroomConfig.studentCount} onChange={e => setClassroomConfig(prev => ({ ...prev, studentCount: Math.min(60, Math.max(1, Number(e.target.value) || 1)) }))} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal" />
              </label>
              <label className="text-xs font-semibold text-gray-600">Organización
                <select value={classroomConfig.grouping} onChange={e => setClassroomConfig(prev => ({ ...prev, grouping: e.target.value as ClassroomConfiguration['grouping'] }))} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal">
                  <option value="individual">Individual</option><option value="pairs">Parejas</option><option value="small_groups">Grupos pequeños</option><option value="whole_class">Curso completo</option><option value="stations">Estaciones</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-600">Formato de salida
                <select value={classroomConfig.outputFormat} onChange={() => setClassroomConfig(prev => ({ ...prev, outputFormat: 'word_editable' }))} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal"><option value="word_editable">Word editable</option></select>
              </label>
            </div>
            <label className="block text-xs font-semibold text-gray-600">Recursos disponibles
              <input value={classroomConfig.availableResources} onChange={e => setClassroomConfig(prev => ({ ...prev, availableResources: e.target.value }))} placeholder="Ej.: pizarra, textos impresos, material concreto..." className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal" />
            </label>
            <div className="flex flex-col gap-1 text-xs text-[var(--primary-ink)] sm:flex-row sm:items-center sm:justify-between"><span><strong>Recomendación para este OA:</strong> {recommendedLessons} clases de {classroomConfig.classDurationMinutes} minutos.</span><span>{groupingLabel(classroomConfig.grouping)} · {classroomConfig.studentCount} estudiantes</span></div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Material de referencia (opcional)</p>
              <p className="text-xs text-gray-500 mt-0.5">Pega una URL o sube un Word — el texto se agrega al contexto adicional de arriba.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={referenceUrl}
                onChange={e => setReferenceUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleExtractFromUrl(); } }}
                placeholder="Pega una URL: página web, recurso MINEDUC, YouTube..."
                disabled={extracting}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none disabled:opacity-60"
              />
              <Button
                variant="secondary"
                size="sm"
                iconLeft={Link2}
                loading={extracting}
                disabled={extracting || !referenceUrl.trim()}
                onClick={handleExtractFromUrl}
              >
                Extraer contenido
              </Button>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                iconLeft={Upload}
                disabled={extracting}
                onClick={() => fileInputRef.current?.click()}
              >
                Subir archivo Word
              </Button>
            </div>

            {extracting && (
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin" /> Extrayendo contenido...
              </p>
            )}

            {extractError && !extracting && (
              <p className="text-xs text-red-600 flex items-start gap-1.5">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                {extractError}
              </p>
            )}

            {extractedSource && !extracting && !extractError && (
              <p className="text-xs text-green-700 flex items-center gap-1.5">
                <Check size={14} className="flex-shrink-0" />
                Contenido agregado desde {extractedSource.fuente === 'docx' ? 'archivo Word' : 'URL'}
                {extractedSource.titulo ? `: "${extractedSource.titulo}"` : ''}
              </p>
            )}
          </div>

          {suggestedMethodologies.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Metodología sugerida</label>
              <div className="flex flex-wrap gap-2">
                {suggestedMethodologies.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethodology(m.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                      selectedMethodology === m.name
                        ? 'border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary-ink)]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button variant="secondary" iconLeft={ArrowLeft} onClick={() => setStep('oa')}>Atrás</Button>
            <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={() => setStep('producto')}>Elegir producto</Button>
          </div>
        </Card>
      </div>
    );
  }

// Step 5: Producto
  if (step === 'producto') {
    const categorias = [
      {
        label: 'Planificación',
        items: PRODUCTOS.filter(p => ['planificacion', 'serie_lecciones', 'guia_docente'].includes(p.id)),
      },
      {
        label: 'Aula',
        items: PRODUCTOS.filter(p => ['guia_estudiante', 'presentacion', 'bitacora_cientifica'].includes(p.id)),
      },
      {
        label: 'Evaluación',
        items: PRODUCTOS.filter(p => ['evaluation_exit_ticket', 'evaluation_321', 'evaluation_checklist', 'evaluation_formative_rubric', 'evaluation_traffic_light', 'rubrica'].includes(p.id)),
      },
    ];

    return (
      <div className="w-full">
        {renderStepper()}
        <Card variant="elevated" className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-tint)] flex items-center justify-center">
              <WandSparkles size={20} className="text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--ink)]">Paso 5: ¿Qué necesitas?</h2>
              <p className="text-sm text-[var(--muted)]">Selecciona el tipo de recurso a generar</p>
            </div>
          </div>

          <div className="space-y-8">
            {categorias.map(cat => (
              <div key={cat.label}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-4 col-span-full">
                  {cat.label}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                  {cat.items.map(p => {
                    const Icon = p.icon;
                    const isSelected = selectedProducto === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProducto(p.id)}
                        className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all group w-full ${
                          isSelected
                            ? 'border-[var(--primary)] bg-[var(--primary-tint)] shadow-md shadow-[var(--primary)]/10'
                            : 'border-[var(--border)] bg-white hover:border-[var(--primary)] hover:shadow-md'
                        }`}
                      >
                        <div className={`p-3 rounded-full mb-3 transition-transform group-hover:scale-110 ${
                          isSelected ? 'bg-[var(--primary)]/15' : 'bg-[var(--primary-tint)]'
                        }`}>
                          <Icon size={24} className={isSelected ? 'text-[var(--primary)]' : 'text-[var(--primary)]/70'} />
                        </div>
                        <span className={`text-sm font-semibold ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--ink)]'}`}>
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {selectedProducto && (
            <div className="mt-8 p-5 bg-[var(--primary-tint)] rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-[var(--primary)]" />
                <span className="text-sm font-medium text-[var(--primary-ink)]">Resumen</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                <Badge color="indigo" size="sm">{selectedOA?.course_name}</Badge>
                <Badge color="teal" size="sm">{selectedOA?.subject_name}</Badge>
                <Badge color="amber" size="sm">{selectedOA?.code}</Badge>
                <Badge color="violet" size="sm">
                  {PRODUCTOS.find(p => p.id === selectedProducto)?.label}
                </Badge>
              </div>
              <Button
                variant="premium"
                size="lg"
                iconLeft={Sparkles}
                onClick={handleGenerate}
                disabled={loading}
                className="w-full"
              >
                {loading ? <><Loader2 className="animate-spin" size={18} /> Generando...</> : 'Generar recurso'}
              </Button>
            </div>
          )}
          <div className="mt-4">
            <Button variant="secondary" size="sm" iconLeft={ArrowLeft} onClick={() => setStep('contexto')}>Atrás</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Generating
  if (step === 'generando') {
    return (
      <div className="w-full flex flex-col items-center justify-center py-32">
        <Card variant="elevated" className="p-10 text-center w-full">
          <div className="w-16 h-16 rounded-3xl bg-[var(--primary-tint)] flex items-center justify-center mx-auto mb-6">
            <Loader2 size={32} className="text-[var(--primary)] animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Generando recurso pedagógico...</h3>
          <p className="text-sm text-gray-500">
            Estamos creando tu {PRODUCTOS.find(p => p.id === selectedProducto)?.label?.toLowerCase()} alineado al OA {selectedOA?.code}.
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-[var(--primary)]/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <button
            type="button"
            onClick={handleCancelGeneration}
            className="mt-8 text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2"
          >
            Cancelar
          </button>
        </Card>
      </div>
    );
  }

  // Result
  if (step === 'resultado' && result) {
    const normalizedProduct = isPedagogicalProduct(result)
      ? result
      : normalizeProduct(result as Record<string, unknown>, selectedProducto);

    // Workspace mode for all products (Tiptap editor + AI copilot)
    if (normalizedProduct) {
      // Determine if this is a PPT presentation
      const isPPT = normalizedProduct.type === 'presentacion' || selectedProducto === 'presentacion';

      return (
        <div className="w-full h-full flex flex-col">
          {qualityReport && qualityReport.status !== 'ready' && (
            <div className={`px-4 py-3 text-sm ${qualityReport.status === 'blocked' ? 'bg-red-50 text-red-800 border-b border-red-200' : 'bg-amber-50 text-amber-900 border-b border-amber-200'}`}>
              <div className="max-w-7xl mx-auto flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <strong>{qualityReport.status === 'blocked' ? 'Revisión necesaria antes de aplicar' : 'Borrador pedagógico: revisa antes de aplicar'}</strong>
                  <p className="text-xs mt-1">Puntaje de control: {qualityReport.score}/100. {qualityReport.issues.map((issue) => issue.message).join(' ')}</p>
                </div>
                <span className="text-xs font-semibold whitespace-nowrap">{qualityReport.issues.length} observación{qualityReport.issues.length === 1 ? '' : 'es'}</span>
              </div>
            </div>
          )}
          <WorkspaceLayout
            product={normalizedProduct}
            resourceId={resourceId}
            onBack={() => setStep('producto')}
            onExport={handleSave}
            onProductChange={(updated) => setResult(updated)}
            mode={isPPT ? 'ppt' : 'document'}
          />
          <Toaster position="top-center" />
        </div>
      );
    }

    // Fallback for non-normalizable products (e.g., raw rubrica)
    return (
      <div className="w-full max-w-7xl mx-auto px-4">
        <Card variant="elevated" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Check size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recurso generado</h2>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <Badge color="indigo" size="sm">{selectedOA?.course_name}</Badge>
                  <Badge color="teal" size="sm">{selectedOA?.subject_name}</Badge>
                  <Badge color="amber" size="sm">{selectedOA?.code}</Badge>
                  <Badge color="violet" size="sm">{PRODUCTOS.find(p => p.id === selectedProducto)?.label}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-sm max-w-none" id="flujo-product-content">
            <ProductRenderer
              product={result}
              selectedProducto={selectedProducto}
              resourceId={resourceId}
              enableAIEdit={true}
              defaultMode="document"
              onSave={handleSave}
            />
          </div>

          <div className="mt-6 print:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" iconLeft={RefreshCw} onClick={() => setStep('producto')}>Generar otro</Button>
              <Button variant="ghost" iconLeft={ArrowLeft} onClick={() => setStep('nivel')}>Nuevo recurso</Button>
            </div>
          </div>
        </Card>
        <Toaster position="top-center" />
      </div>
    );
  }

  return null;
}
