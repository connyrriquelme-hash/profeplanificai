import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpenCheck, Target, Layers3, WandSparkles, FileText,
  ClipboardCheck, ClipboardList, Presentation, Loader2, Check,
  ArrowRight, ArrowLeft, Sparkles, GraduationCap, Lightbulb,
  Eye, Save, Download, RefreshCw, AlertTriangle
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { generateGuide, generateEvaluation, generateRubric, generatePresentation, generateMaterial, type MaterialRequest } from '../services/materialGeneratorService';
import { buildPremiumPptModel } from '../utils/premiumPptModel';
import { generatePremiumPptx, downloadPremiumPptx } from '../utils/premiumPptGenerator';

type FlujoStep = 'nivel' | 'asignatura' | 'oa' | 'contexto' | 'producto' | 'generando' | 'resultado';

const PRODUCTOS = [
  { id: 'guia_estudiante', label: 'Guía Estudiante', icon: FileText, color: '#4f46e5' },
  { id: 'guia_docente', label: 'Guía Docente', icon: BookOpenCheck, color: '#0d9488' },
  { id: 'planificacion', label: 'Planificación', icon: Layers3, color: '#ea580c' },
  { id: 'evaluacion', label: 'Evaluación', icon: ClipboardCheck, color: '#db2777' },
  { id: 'rubrica', label: 'Rúbrica', icon: ClipboardList, color: '#7c3aed' },
  { id: 'presentacion', label: 'Presentación PPT', icon: Presentation, color: '#059669' },
];

interface D1Course { id: string; code: string; name: string; objective_count: number }
interface D1Subject { id: string; name: string; objective_count: number }
interface D1Objective { id: string; code: string; official_text: string; course_name: string; subject_name: string; axis_name?: string }

export function FlujoDocenteView() {
  const [step, setStep] = useState<FlujoStep>('nivel');
  const [courses, setCourses] = useState<D1Course[]>([]);
  const [subjects, setSubjects] = useState<D1Subject[]>([]);
  const [objectives, setObjectives] = useState<D1Objective[]>([]);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [methodologies, setMethodologies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedCourse, setSelectedCourse] = useState<D1Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<D1Subject | null>(null);
  const [selectedOA, setSelectedOA] = useState<D1Objective | null>(null);
  const [selectedMethodology, setSelectedMethodology] = useState('');
  const [selectedProducto, setSelectedProducto] = useState('');
  const [topic, setTopic] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [result, setResult] = useState<any>(null);
  const [resourceId, setResourceId] = useState('');
  const [pptxBlob, setPptxBlob] = useState<Blob | null>(null);
  const [pptxLoading, setPptxLoading] = useState(false);

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
            .then(id => setIndicators((id.indicators || id.data || []).map((i: any) => i.indicator_text || i.text)))
            .catch(() => {});
          fetch(`/api/curriculum/skills?objective_id=${encodeURIComponent(d.data[0].id)}`)
            .then(r => r.json())
            .then(sk => setSkills((sk.data || []).map((s: any) => s.official_text || s.text)))
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
      .then(id => setIndicators((id.indicators || id.data || []).map((i: any) => i.indicator_text || i.text)))
      .catch(() => {});
    fetch(`/api/curriculum/skills?objective_id=${encodeURIComponent(oa.id)}`)
      .then(r => r.json())
      .then(sk => setSkills((sk.data || []).map((s: any) => s.official_text || s.text)))
      .catch(() => {});
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedOA || !selectedProducto) return;
      setLoading(true);
      setError('');
      setResult(null);
      setPptxBlob(null);
      setPptxLoading(false);
      setStep('generando');

    const req: MaterialRequest = {
      level: selectedOA.course_name,
      subject: selectedOA.subject_name,
      objectiveCode: selectedOA.code,
      objectiveText: selectedOA.official_text,
      indicators,
      skills,
      topic: topic || selectedOA.official_text.substring(0, 60),
      additionalContext,
      methodology: selectedMethodology,
    };

    try {
      let res: any;
      switch (selectedProducto) {
        case 'guia_estudiante':
        case 'guia_docente':
          res = await generateGuide(req, selectedProducto as any);
          break;
        case 'evaluacion':
          res = await generateEvaluation(req);
          break;
        case 'rubrica':
          res = await generateRubric(req);
          break;
        case 'presentacion':
          res = await generatePresentation(req);
          break;
        default:
          res = await generateMaterial(req, selectedProducto);
      }

      if (res?.ok) {
        setResult(res.guide || res.evaluation || res.rubric || res.slides || res);
        setResourceId(res.resourceId || '');
        if (selectedProducto === 'presentacion') {
          try {
            setPptxLoading(true);
            const model = buildPremiumPptModel({
              level: selectedOA?.course_name || '',
              subject: selectedOA?.subject_name || '',
              objectiveCode: selectedOA?.code || '',
              objectiveText: selectedOA?.official_text || '',
              topic,
              indicators,
              skills,
              additionalContext,
            });
            const blob = await generatePremiumPptx(model);
            setPptxBlob(blob);
          } catch {
            setPptxBlob(null);
          } finally {
            setPptxLoading(false);
          }
        }
        setStep('resultado');
      } else {
        setError(res?.error || 'Error al generar');
        setStep('producto');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
      setStep('producto');
    } finally {
      setLoading(false);
    }
  }, [selectedOA, selectedProducto, indicators, skills, topic, additionalContext, selectedMethodology]);

  const handleSave = useCallback(async () => {
    if (!resourceId) return;
    try {
      await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${selectedProducto} — ${selectedOA?.code}`,
          type: selectedProducto,
          content: JSON.stringify(result),
          level: selectedOA?.course_name,
          subject: selectedOA?.subject_name,
          objectiveCode: selectedOA?.code,
        }),
      });
    } catch {}
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
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
      {['nivel', 'asignatura', 'oa', 'contexto', 'producto'].map((s, i) => {
        const labels: Record<string, string> = { nivel: 'Nivel', asignatura: 'Asignatura', oa: 'OA', contexto: 'Contexto', producto: 'Producto' };
        const isActive = step === s;
        const isPast = stepIndex > i;
        return (
          <div key={s} className="flex items-center flex-shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isActive ? 'bg-indigo-50 text-indigo-700' : isPast ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                isActive ? 'bg-indigo-600 text-white' : isPast ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-300'
              }`}>
                {isPast ? <Check size={12} /> : <span>{i + 1}</span>}
              </div>
              <span className="hidden sm:inline">{labels[s]}</span>
            </div>
            {i < 4 && <div className={`w-4 h-px mx-0.5 ${isPast || isActive ? 'bg-indigo-200' : 'bg-gray-200'}`} />}
          </div>
        );
      })}
    </div>
  );

  // Step 1: Nivel
  if (step === 'nivel') {
    return (
      <div className="max-w-3xl mx-auto">
        {renderStepper()}
        <Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <GraduationCap size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 1: Selecciona el nivel</h2>
              <p className="text-sm text-gray-500">¿A qué nivel pertenece tu clase?</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {courses.filter(c => (c.objective_count || 0) > 0).map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedCourse(c); setStep('asignatura'); }}
                className="p-3 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
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
      <div className="max-w-3xl mx-auto">
        {renderStepper()}
        <Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <BookOpenCheck size={20} className="text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 2: Selecciona la asignatura</h2>
              <p className="text-sm text-gray-500">{selectedCourse?.name} — ¿Qué asignatura?</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedSubject(s); setStep('oa'); }}
                className="p-3 rounded-xl border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-left"
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
      <div className="max-w-3xl mx-auto">
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
      <div className="max-w-3xl mx-auto">
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
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contexto adicional</label>
            <textarea
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              rows={3}
              placeholder="Ej: Curso de 32 estudiantes, 5 con NEE..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
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
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
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
    return (
      <div className="max-w-3xl mx-auto">
        {renderStepper()}
        <Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <WandSparkles size={20} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 5: ¿Qué necesitas?</h2>
              <p className="text-sm text-gray-500">Selecciona el tipo de recurso a generar</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRODUCTOS.map(p => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProducto(p.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedProducto === p.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: p.color + '20' }}>
                    <Icon size={20} style={{ color: p.color }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{p.label}</p>
                </button>
              );
            })}
          </div>
          {selectedProducto && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">Resumen</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge color="indigo" size="sm">{selectedOA?.course_name}</Badge>
                <Badge color="teal" size="sm">{selectedOA?.subject_name}</Badge>
                <Badge color="amber" size="sm">{selectedOA?.code}</Badge>
                <Badge color="violet" size="sm">{PRODUCTOS.find(p => p.id === selectedProducto)?.label}</Badge>
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
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-20">
        <Card variant="elevated" className="p-10 text-center w-full">
          <div className="w-16 h-16 rounded-3xl bg-indigo-100 flex items-center justify-center mx-auto mb-6">
            <Loader2 size={32} className="text-indigo-600 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Generando recurso pedagógico...</h3>
          <p className="text-sm text-gray-500">
            Estamos creando tu {PRODUCTOS.find(p => p.id === selectedProducto)?.label?.toLowerCase()} alineado al OA {selectedOA?.code}.
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Result
  if (step === 'resultado' && result) {
    return (
      <div className="max-w-4xl mx-auto">
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

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-xl overflow-auto max-h-[500px]">
              {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
            </pre>
          </div>

          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <Button variant="primary" iconLeft={Save} onClick={handleSave}>Guardar en Biblioteca</Button>
            {selectedProducto === 'presentacion' && (
              <Button
                variant="primary"
                iconLeft={Download}
                disabled={pptxLoading || !pptxBlob}
                onClick={() => {
                  if (pptxBlob && selectedOA) {
                    const model = buildPremiumPptModel({
                      level: selectedOA.course_name,
                      subject: selectedOA.subject_name,
                      objectiveCode: selectedOA.code,
                      objectiveText: selectedOA.official_text,
                      topic,
                      indicators,
                      skills,
                      additionalContext,
                    });
                    downloadPremiumPptx(model, pptxBlob);
                  }
                }}
              >
                {pptxLoading ? 'Generando PPTX...' : 'Descargar PPTX'}
              </Button>
            )}
            <Button variant="secondary" iconLeft={Download} onClick={() => {
              const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${selectedProducto}-${selectedOA?.code}.json`;
              a.click();
            }}>Descargar JSON</Button>
            <Button variant="outline" iconLeft={RefreshCw} onClick={() => setStep('producto')}>Generar otro</Button>
            <Button variant="ghost" iconLeft={ArrowLeft} onClick={() => setStep('nivel')}>Nuevo recurso</Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
