import { useState, useEffect, useMemo } from 'react';
import type { MaterialSaved } from '../types';
import { EVAL_TIPOS, DIFICULTADES, HABILIDADES } from '../types';
import { useConfigOptions } from '../hooks/useConfigOptions';
import { getMaterials, saveMaterial, deleteMaterial, saveDriveItem, generateId } from '../services/storageService';
import type { CurriculumItem } from '../data/curriculumData';
import { fetchObjectives, fetchCourses, fetchSubjects, type CourseRow, type SubjectRow } from '../services/objectiveService';
import { getCurricularContext, generateIndicators, type CurricularContext } from '../services/curricularPlanningService';
import { niveles, getOAs } from '../data/curriculumData';
import { extractShortObjectiveCode, resolveObjectiveRealPayload, resolveObjectiveRealCode, type RichCurriculumItem } from '../services/curriculumMappingService';
import { buildEvaluationPrompt, cleanEvaluationText, generateEvaluation } from '../services/evaluationGeneratorService';
import { saveRecurso } from '../services/storageService';
import { shareFromWorkspace } from '../services/sharedDocumentService';
import { api } from '../services/apiClient';
import { StatusBar } from './shared/StatusBar';
import { MaterialList } from './shared/MaterialList';
import { Stepper } from './shared/Stepper';
import { ClipboardCheck, Sparkles, Send, Printer, Download, Copy, Check, CopyPlus, Edit3, FileText, ClipboardEdit, ArrowRight, ArrowLeft, BookOpen, GraduationCap, FileCheck2, Search, Loader, Eye, ClipboardList, Plus, Share2, Link, X } from 'lucide-react';
import { AdaptarPanel } from './AdaptarPanel';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { IconBadge } from './ui/IconBadge';
import { SectionHeader } from './ui/SectionHeader';
import { FORMATIVE_EVALUATION_OPTIONS, FormativeEvaluationType } from '../utils/formativeEvaluationTypes';
import { downloadEvaluationHtml, exportEvaluationToWord } from '../utils/exportEvaluationWord';

interface EvaluacionesViewProps {
  onNavigate: (view: string) => void;
}

const STEPS = ['Configuración', 'Contenido', 'Personalización'];

const selectClass =
  'w-full h-10 px-3 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm appearance-none cursor-pointer';

export function EvaluacionesView({ onNavigate }: EvaluacionesViewProps) {
  const { getOptions } = useConfigOptions();
  const cfgEvalTypes = getOptions('evaluation_types');
  const cfgDifficulty = getOptions('difficulty_levels');
  const cfgSkills = getOptions('cognitive_skills');
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState('formativa');
  const [selectedNivel, setSelectedNivel] = useState('');
  const [selectedCurso, setSelectedCurso] = useState<CourseRow | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [selectedAsignatura, setSelectedAsignatura] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedOA, setSelectedOA] = useState<CurriculumItem | null>(null);
  const [habilidad, setHabilidad] = useState('Inferir');
  const [dificultad, setDificultad] = useState('Progresiva');
  const [texto, setTexto] = useState('');
  const [nPreguntas, setNPreguntas] = useState(5);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Selecciona un OA desde el paso 2, elige indicadores y genera.');
  const [statusType, setStatusType] = useState('');
  const [savedMaterials, setSavedMaterials] = useState<MaterialSaved[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editando, setEditando] = useState(false);

  const [fetchedOAs, setFetchedOAs] = useState<CurriculumItem[]>([]);
  const [loadingOAs, setLoadingOAs] = useState(false);
  const [oaError, setOaError] = useState('');
  const [oaSearch, setOaSearch] = useState('');
  const [curricularContext, setCurricularContext] = useState<CurricularContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [selectedInds, setSelectedInds] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingInds, setIsGeneratingInds] = useState(false);
  const [shareResult, setShareResult] = useState<{ shareUrl: string; copied: boolean } | null>(null);

  const [extSources, setExtSources] = useState<any[]>([]);
  const [extLinks, setExtLinks] = useState<any[]>([]);
  const [loadingExt, setLoadingExt] = useState(false);
  const [showExtPanel, setShowExtPanel] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ sourceId: '', title: '', url: '', description: '', tags: '' });
  const [extError, setExtError] = useState('');

  const lessonTitle = useMemo(() => {
    const parts = [
      selectedCurso?.name || selectedNivel,
      selectedAsignatura,
      selectedOA?.oa_id,
      EVAL_TIPOS.find(t => t.v === tipo)?.l || tipo,
    ].filter(Boolean);
    return parts.join(' - ') || 'Evaluacion';
  }, [selectedCurso, selectedNivel, selectedAsignatura, selectedOA, tipo]);

  useEffect(() => {
    setSavedMaterials(
      getMaterials().filter((m) =>
        ['evaluacion', 'rubrica', 'ticket', 'simce'].includes(m.tipo)
      )
    );
  }, []);

  useEffect(() => {
    fetchCourses().then(setCourses);
  }, []);

  useEffect(() => {
    if (!selectedCurso) { setSubjects([]); return; }
    fetchSubjects(selectedCurso.code).then(setSubjects);
  }, [selectedCurso]);

  useEffect(() => {
    if (!selectedCurso || !selectedSubjectId) {
      setFetchedOAs([]);
      setOaError('');
      return;
    }
    let cancelled = false;
    setLoadingOAs(true);
    setOaError('');
    (async () => {
      const results = await fetchObjectives({ course: selectedCurso.code, subject: selectedSubjectId });
      if (cancelled) return;
      if (results.length === 0) {
        setOaError('No hay objetivos cargados para esta combinación en la base curricular.');
      }
      setFetchedOAs(results);
      setLoadingOAs(false);
    })();
    return () => { cancelled = true; };
  }, [selectedCurso, selectedSubjectId]);

  useEffect(() => {
    if (!selectedOA || !selectedNivel || !selectedAsignatura) {
      setCurricularContext(null);
      setSelectedInds(new Set());
      return;
    }
    let cancelled = false;
    setLoadingContext(true);
    (async () => {
      try {
        const realCode = resolveObjectiveRealCode(selectedOA);
        const realId = resolveObjectiveRealPayload(selectedOA).objectiveId;
        const ctx = await getCurricularContext(selectedNivel, selectedAsignatura, realCode, realId || undefined);
        if (cancelled) return;
        setCurricularContext(ctx);
        if (ctx?.indicators?.length) {
          setSelectedInds(new Set(ctx.indicators.map((_, i) => i)));
        } else {
          setSelectedInds(new Set());
        }
      } catch {
        if (cancelled) return;
        setCurricularContext(null);
        setSelectedInds(new Set());
      } finally {
        if (!cancelled) setLoadingContext(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedOA, selectedNivel, selectedAsignatura]);

  useEffect(() => {
    api.get('/api/evaluation-resources/sources').then((res: any) => {
      if (res?.data) setExtSources(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCurso && !selectedAsignatura) return;
    setLoadingExt(true);
    setExtError('');
    const params = new URLSearchParams();
    if (selectedCurso?.code) params.set('course', selectedCurso.code);
    if (selectedAsignatura) params.set('subject', selectedAsignatura);
    const realCode = resolveObjectiveRealCode(selectedOA);
    if (realCode) params.set('objectiveCode', realCode);
    api.get(`/api/evaluation-resources/search?${params.toString()}`).then((res: any) => {
      if (res?.data) setExtLinks(res.data);
      setLoadingExt(false);
    }).catch(() => {
      setExtLinks([]);
      setLoadingExt(false);
      setExtError('No se pudieron cargar recursos sugeridos.');
    });
  }, [selectedCurso, selectedAsignatura, selectedOA]);

  const indicadores: string[] = useMemo(() => {
    if (curricularContext?.indicators?.length) {
      return curricularContext.indicators.map(i => i.text);
    }
    if (selectedOA?.indicadores?.length) {
      return selectedOA.indicadores;
    }
    return [];
  }, [curricularContext, selectedOA]);

  const handleNivelChange = (value: string) => {
    setSelectedNivel(value);
    setSelectedCurso(null);
    setSelectedAsignatura('');
    setSelectedSubjectId('');
    setSelectedOA(null);
    setOaSearch('');
    setFetchedOAs([]);
    setCurricularContext(null);
    setSelectedInds(new Set());
  };

  const handleCursoChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId) || null;
    setSelectedCurso(course);
    setSelectedAsignatura('');
    setSelectedSubjectId('');
    setSelectedOA(null);
    setOaSearch('');
    setCurricularContext(null);
    setSelectedInds(new Set());
  };

  const handleAsignaturaChange = (value: string) => {
    setSelectedAsignatura(value);
    const sub = subjects.find(s => s.name === value);
    setSelectedSubjectId(sub?.id || value);
    setSelectedOA(null);
    setOaSearch('');
    setCurricularContext(null);
    setSelectedInds(new Set());
  };

  const toggleIndicador = (idx: number) => {
    setSelectedInds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAllInds = () => {
    setSelectedInds(new Set(indicadores.map((_, i) => i)));
  };

  const deselectAllInds = () => {
    setSelectedInds(new Set());
  };

  const handleQuickAction = (actionTipo: string) => {
    setTipo(actionTipo);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPrompt = () => {
    const selectedIndsArray = Array.from(selectedInds).sort().map((i) => indicadores[i]);
    return buildEvaluationPrompt({
      evaluationType: tipo,
      course: selectedCurso?.name || selectedNivel,
      subject: selectedAsignatura,
      objectiveCode: resolveObjectiveRealCode(selectedOA),
      objectiveText: selectedOA?.oa_texto || '',
      selectedIndicators: selectedIndsArray,
      skill: habilidad,
      difficulty: dificultad,
      numberOfQuestions: isSIMCE ? nPreguntas : undefined,
      baseText: isSIMCE ? texto : undefined,
    });
  };

  const withHeader = (texto: string): string => {
    if (!selectedOA) return texto;
    const header = [
      `Nivel: ${selectedNivel}`,
      `Curso: ${selectedCurso?.name || ''}`,
      `Asignatura: ${selectedAsignatura}`,
      `OA: ${extractShortObjectiveCode(selectedOA.oa_id)} — ${selectedOA.oa_texto}`,
      '',
    ].join('\n');
    return header + texto;
  };

  const handleGenerar = async () => {
    if (!selectedOA) {
      setStatus('Primero selecciona un OA en el paso 2.');
      setStatusType('bad');
      return;
    }

    setStatus('Generando...');
    setStatusType('');
    setOutput('');

    const selectedIndsArray = Array.from(selectedInds).sort().map((i) => indicadores[i]);

    const raw = await generateEvaluation({
      evaluationType: tipo,
      course: selectedCurso?.name || selectedNivel,
      subject: selectedAsignatura,
      objectiveCode: resolveObjectiveRealCode(selectedOA),
      objectiveText: selectedOA.oa_texto,
      selectedIndicators: selectedIndsArray,
      skill: habilidad,
      difficulty: dificultad,
      numberOfQuestions: isSIMCE ? nPreguntas : undefined,
      baseText: isSIMCE ? texto : undefined,
      onStatus: (msg, type) => { setStatus(msg); setStatusType(type || ''); },
    });

    const cleaned = cleanEvaluationText(raw);
    setOutput(withHeader(cleaned));
    setStatus('Evaluacion generada.');
    setStatusType('ok');
  };

  const handleGenerateIndicators = async () => {
    if (!selectedOA) return;
    setIsGeneratingInds(true);
    try {
      const payload = resolveObjectiveRealPayload(selectedOA);
      const newIndicators = await generateIndicators({
        objectiveId: payload.objectiveId,
        objectiveCode: payload.objectiveCode,
        objectiveText: payload.objectiveText,
        course: selectedCurso?.name || selectedNivel,
        subject: selectedAsignatura,
        skill: habilidad,
      });
      if (newIndicators.length > 0) {
        setCurricularContext(prev => {
          if (prev) {
            return { ...prev, indicators: newIndicators };
          }
          return {
            objective: {
              code: selectedOA.oa_id,
              text: selectedOA.oa_texto,
              normalizedText: '',
              bloomLevel: '',
              courseCode: '',
              courseName: selectedCurso?.name || '',
              subjectName: selectedAsignatura,
              axisName: '',
              sourceUrl: '',
            },
            indicators: newIndicators,
            skills: [],
            attitudes: [],
            textbookReferences: [],
            teacherGuideReferences: [],
            resourceLinks: [],
            recommendedLessons: null,
            complexity: null,
            rationale: null,
            dataStatus: {
              hasIndicators: true,
              hasTextbookReferences: false,
              hasTeacherGuideReferences: false,
              hasResourceLinks: false,
              hasSequenceRecommendation: false,
            },
          };
        });
        setSelectedInds(new Set(newIndicators.map((_, i) => i)));
        setStatus('Indicadores sugeridos generados y asociados al OA.');
        setStatusType('ok');
      } else {
        setStatus('No se pudieron generar indicadores. Intenta nuevamente.');
        setStatusType('bad');
      }
    } catch {
      setStatus('Error al generar indicadores.');
      setStatusType('bad');
    } finally {
      setIsGeneratingInds(false);
    }
  };

  const handleGuardar = () => {
    if (!output) return;
    const tipoKey = tipo === 'simce' || tipo === 'simce_breve' ? 'simce'
      : tipo === 'rubrica' || tipo === 'holistica' ? 'rubrica'
      : tipo === 'ticket' ? 'ticket'
      : 'evaluacion';
    const material: MaterialSaved = {
      id: generateId(),
      tipo: tipoKey as MaterialSaved['tipo'],
      titulo: `${EVAL_TIPOS.find(t => t.v === tipo)?.l || tipo} - ${selectedCurso?.name || selectedNivel} ${selectedAsignatura}`,
      contenido: output,
      nivel: selectedNivel,
      asignatura: selectedAsignatura,
      oa: selectedOA?.oa_id || '',
      fecha: new Date().toISOString(),
      etiquetas: [dificultad, habilidad],
    };
    saveMaterial(material);
    setSavedMaterials(getMaterials().filter((m) =>
      ['evaluacion', 'rubrica', 'ticket', 'simce'].includes(m.tipo)
    ));
    setStatus('Instrumento guardado en Mis materiales.');
    setStatusType('ok');
  };

  const handleEnviarDrive = () => {
    if (!output) return;
    saveDriveItem({
      id: generateId(),
      nombre: `${EVAL_TIPOS.find(t => t.v === tipo)?.l || tipo} - ${selectedCurso?.name || selectedNivel} ${selectedAsignatura}`,
      contenido: output,
      tipo: 'texto',
      nivel: selectedNivel,
      asignatura: selectedAsignatura,
      oa: selectedOA?.oa_id || '',
      fecha: new Date().toISOString(),
    });
    setStatus('Evaluación enviada a Drive personal.');
    setStatusType('ok');
  };

  const handleImprimir = () => {
    if (!output) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<pre style="font-family: sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: auto;">${output}</pre>`);
    win.document.close();
    win.print();
  };

  const handleExportar = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluacion-${selectedCurso?.name || selectedNivel}-${selectedAsignatura}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopiar = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleDuplicar = () => {
    if (!output) return;
    const dupKey = tipo === 'simce' || tipo === 'simce_breve' ? 'simce'
      : tipo === 'rubrica' || tipo === 'holistica' ? 'rubrica'
      : tipo === 'ticket' ? 'ticket'
      : 'evaluacion';
    const material: MaterialSaved = {
      id: generateId(),
      tipo: dupKey as MaterialSaved['tipo'],
      titulo: `${EVAL_TIPOS.find(t => t.v === tipo)?.l || tipo} (copia) - ${selectedCurso?.name || selectedNivel} ${selectedAsignatura}`,
      contenido: output,
      nivel: selectedNivel,
      asignatura: selectedAsignatura,
      oa: selectedOA?.oa_id || '',
      fecha: new Date().toISOString(),
      etiquetas: [dificultad, habilidad],
    };
    saveMaterial(material);
    setSavedMaterials(getMaterials().filter((m) =>
      ['evaluacion', 'rubrica', 'ticket', 'simce'].includes(m.tipo)
    ));
    setStatus('Instrumento duplicado en Mis materiales.');
    setStatusType('ok');
  };

  const handleEditar = () => {
    setEditando(!editando);
  };

  const handleSaveToBancoRecursos = async () => {
    if (!output || !selectedOA) return;
    setIsSaving(true);
    const cleaned = cleanEvaluationText(output);
    const selectedIndsArray = Array.from(selectedInds).sort().map((i) => indicadores[i]);
    try {
      saveRecurso({
        id: generateId(),
        tipoRecurso: 'evaluacion',
        titulo: lessonTitle,
        nivel: selectedNivel,
        asignatura: selectedAsignatura,
        oa: `${selectedOA.oa_id} — ${selectedOA.oa_texto}`,
        contenido: cleaned,
        texto: cleaned,
        timestamp: Date.now(),
      });
      await api.post('/api/resources', {
        title: lessonTitle,
        type: 'evaluacion',
        source: 'evaluaciones',
        content: cleaned,
        level: selectedNivel,
        subject: selectedAsignatura,
        objectiveCode: resolveObjectiveRealCode(selectedOA),
        objectiveText: selectedOA.oa_texto,
        skill: habilidad,
        metadata: {
          evaluationType: tipo,
          selectedIndicators: selectedIndsArray,
          difficulty: dificultad,
          course: selectedCurso?.name || '',
          createdAt: new Date().toISOString(),
        },
      });
      setStatus('Evaluacion guardada en Banco de Recursos.');
      setStatusType('ok');
    } catch {
      setStatus('No se pudo guardar la evaluacion. Intenta nuevamente.');
      setStatusType('bad');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareEvaluacion = async () => {
    if (!output) return;
    const cleaned = cleanEvaluationText(output);
    const { doc, shareUrl } = shareFromWorkspace({
      title: lessonTitle,
      content: cleaned,
      nivel: selectedNivel,
      asignatura: selectedAsignatura,
      oa: selectedOA?.oa_texto,
      habilidad,
    });
    try {
      await api.post('/api/data/shared-documents', {
        id: doc.id,
        shareToken: doc.shareToken,
        ownerName: 'Docente',
        title: doc.title,
        content: doc.content,
        sourceType: doc.sourceType,
        sourceId: doc.sourceId,
        visibility: 'shared',
        permission: doc.permission,
      });
    } catch {
      // Cloud sync failed
    }
    setShareResult({ shareUrl, copied: false });
  };

  const handleCopyShareUrl = async () => {
    if (!shareResult) return;
    try {
      await navigator.clipboard.writeText(shareResult.shareUrl);
      setShareResult({ ...shareResult, copied: true });
      setTimeout(() => setShareResult({ ...shareResult, copied: false }), 2000);
    } catch { /* silent */ }
  };

  const handleAddLink = async () => {
    if (!newLink.sourceId || !newLink.title) return;
    try {
      await api.post('/api/evaluation-resources/link', {
        sourceId: newLink.sourceId,
        title: newLink.title,
        url: newLink.url,
        description: newLink.description,
        tags: newLink.tags.split(',').map(t => t.trim()).filter(Boolean),
        subject: selectedAsignatura,
        course: selectedCurso?.code || '',
        objectiveCode: resolveObjectiveRealCode(selectedOA),
        evaluationType: tipo,
        skill: habilidad,
      });
      setNewLink({ sourceId: '', title: '', url: '', description: '', tags: '' });
      setShowAddLink(false);
      setStatus('Enlace guardado. Pendiente de validacion.');
      setStatusType('ok');
    } catch {
      setStatus('No se pudo guardar el enlace.');
      setStatusType('bad');
    }
  };

  const handleEliminar = (id: string) => {
    if (!confirm('¿Eliminar este instrumento?')) return;
    deleteMaterial(id);
    setSavedMaterials(getMaterials().filter((m) =>
      ['evaluacion', 'rubrica', 'ticket', 'simce'].includes(m.tipo)
    ));
  };

  const cargarMaterial = (m: MaterialSaved) => {
    setOutput(m.contenido);
    setSelectedNivel(m.nivel);
    setSelectedAsignatura(m.asignatura);
    setShowSaved(false);
  };

  const isSIMCE = tipo === 'simce' || tipo === 'simce_breve';

  return (
    <div className="view" id="evaluaciones">
      <Card className="bg-gradient-to-br from-violet-50 to-pink-50/50 border-violet-100/80 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <IconBadge icon={ClipboardCheck} size="xl" color="#7c3aed" variant="gradient" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Evaluaciones</h1>
                <Badge color="violet" size="md">Evaluación inteligente</Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
                Crea, organiza y adapta instrumentos evaluativos alineados al currículum chileno.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" iconLeft={Eye} onClick={() => setShowSaved(!showSaved)}>
              {showSaved ? 'Ocultar' : `Mis instrumentos`}
            </Button>
            {savedMaterials.length > 0 && (
              <Badge color="violet" size="sm">{savedMaterials.length}</Badge>
            )}
          </div>
        </div>
      </Card>

      {showSaved && (
        <Card className="mb-6">
          <SectionHeader
            icon={Eye}
            iconColor="#7c3aed"
            title="Instrumentos guardados"
            description={`${savedMaterials.length} instrumento(s) en tu biblioteca personal.`}
          />
          <div className="mt-3">
            <MaterialList items={savedMaterials} onCargar={cargarMaterial} onEliminar={handleEliminar} />
          </div>
        </Card>
      )}

      <Stepper steps={STEPS} current={step} />

      {step === 1 && (
        <Card className="mb-6">
          <SectionHeader icon={FileText} iconColor="#7c3aed" title="Paso 1: Configuración" description="Define el tipo, nivel y asignatura de la evaluación." className="mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <FileCheck2 size={13} className="text-violet-600" strokeWidth={2.25} />
                Tipo de evaluación
              </label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={selectClass}>
                {(cfgEvalTypes.length > 0 ? cfgEvalTypes : EVAL_TIPOS.map(t => ({ id: t.v, value: t.v, label: t.l }))).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <GraduationCap size={13} className="text-violet-600" strokeWidth={2.25} />
                Nivel educativo
              </label>
              <select
                value={selectedNivel}
                onChange={e => handleNivelChange(e.target.value)}
                className={selectClass}
              >
                <option value="">Seleccionar nivel</option>
                {niveles.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <GraduationCap size={13} className="text-violet-600" strokeWidth={2.25} />
                Curso
              </label>
              <select
                value={selectedCurso?.id || ''}
                onChange={e => handleCursoChange(e.target.value)}
                className={selectClass}
                disabled={!selectedNivel}
              >
                <option value="">{selectedNivel ? 'Seleccionar curso' : 'Primero elige nivel'}</option>
                {selectedNivel && courses
                  .filter(c => {
                    if (c.id === 'course-otro') return false;
                    if (selectedNivel === 'Prebásica') return c.cycle === 'Educación Parvularia';
                    if (selectedNivel === 'Básica') return c.cycle === 'Educación Básica';
                    if (selectedNivel === 'Media') return c.cycle === 'Educación Media' && !c.code.endsWith('-TP') && !c.code.endsWith('-FG') && !c.code.endsWith('-HC');
                    if (selectedNivel === 'Técnico Profesional') return c.code.endsWith('-TP');
                    return false;
                  })
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <BookOpen size={13} className="text-violet-600" strokeWidth={2.25} />
                Asignatura
              </label>
              <select
                value={selectedAsignatura}
                onChange={e => handleAsignaturaChange(e.target.value)}
                className={selectClass}
                disabled={!selectedCurso}
              >
                <option value="">{selectedCurso ? 'Seleccionar asignatura' : 'Primero elige curso'}</option>
                {subjects
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <ClipboardCheck size={13} className="text-violet-600" strokeWidth={2.25} />
                Habilidad principal
              </label>
              <select value={habilidad} onChange={(e) => setHabilidad(e.target.value)} className={selectClass}>
                {curricularContext?.skills && curricularContext.skills.length > 0
                  ? curricularContext.skills.map((s: any) => <option key={s.code || s.text} value={s.text}>{s.text}</option>)
                  : (cfgSkills.length > 0 ? cfgSkills : HABILIDADES.map(h => ({ id: h, value: h, label: h }))).map((h) => <option key={h.value} value={h.value}>{h.label}</option>)
                }
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
            <Button variant="primary" iconRight={ArrowRight} onClick={() => setStep(2)}>Siguiente</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <Card>
            <SectionHeader icon={BookOpen} iconColor="#7c3aed" title="Paso 2: Contenido (OA)" description="Selecciona un OA cargado desde la base curricular D1." className="mb-4" />
            {selectedAsignatura ? (
              <>
                <div style={{ position: 'relative', marginBottom: 6 }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--muted2)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={oaSearch}
                    onChange={e => setOaSearch(e.target.value)}
                    placeholder="Buscar OA por código o texto…"
                    style={{
                      width: '100%', padding: '8px 10px 8px 30px', border: '1px solid var(--line)',
                      borderRadius: 'var(--radius)', background: 'var(--card)', color: 'var(--ink)',
                      fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <select
                  value={selectedOA?.oa_id || ''}
                  onChange={e => {
                    const localOAs = getOAs(selectedNivel, selectedAsignatura);
                    const merged = [...localOAs, ...fetchedOAs];
                    const seen = new Set<string>();
                    const unique = merged.filter(o => { if (seen.has(o.oa_id)) return false; seen.add(o.oa_id); return true; });
                    setSelectedOA(unique.find(o => o.oa_id === e.target.value) || null);
                  }}
                  className={selectClass}
                  disabled={loadingOAs}
                >
                  <option value="">
                    {loadingOAs ? 'Cargando objetivos…' : 'Seleccionar OA'}
                  </option>
                    {(() => {
                      const localOAs = getOAs(selectedNivel, selectedAsignatura);
                      const merged = [...localOAs, ...fetchedOAs];
                      const seen = new Set<string>();
                      return merged.filter(o => {
                        if (seen.has(o.oa_id)) return false;
                        seen.add(o.oa_id);
                        return !oaSearch || o.oa_id.toLowerCase().includes(oaSearch.toLowerCase()) || o.oa_texto.toLowerCase().includes(oaSearch.toLowerCase());
                      }).map(o => (
                        <option key={o.oa_id} value={o.oa_id}>{extractShortObjectiveCode(o.oa_id)} — {o.oa_texto.slice(0, 60)}…</option>
                      ));
                    })()}
                </select>
              </>
            ) : (
              <p className="text-xs text-gray-400 italic py-6 text-center">
                Primero selecciona nivel, curso y asignatura en el paso 1.
              </p>
            )}
            {loadingOAs && <div className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--muted2)' }}><Loader size={10} className="spin" /> Cargando objetivos desde la base curricular…</div>}
            {fetchedOAs.length > 0 && !loadingOAs && (
              <div className="text-xs mt-1" style={{ color: 'var(--muted2)' }}>Objetivos encontrados: {fetchedOAs.length}</div>
            )}
            {oaError && !loadingOAs && <div className="text-xs mt-1" style={{ color: 'var(--muted2)' }}>{oaError}</div>}
            {selectedOA && (
              <div className="mt-3 px-3 py-2 rounded-xl bg-violet-50 border border-violet-100 text-xs text-gray-600">
                <code className="font-bold text-violet-700">{extractShortObjectiveCode(selectedOA.oa_id)}</code>
                {resolveObjectiveRealCode(selectedOA) !== extractShortObjectiveCode(selectedOA.oa_id) && (
                  <span className="ml-2 text-gray-400">({resolveObjectiveRealCode(selectedOA)})</span>
                )}
                <p className="mt-1 text-gray-500">{selectedOA.oa_texto}</p>
              </div>
            )}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
              <Button variant="ghost" iconLeft={ArrowLeft} onClick={() => setStep(1)}>Atrás</Button>
              <Button variant="primary" iconRight={ArrowRight} onClick={() => setStep(3)}>Siguiente</Button>
            </div>
          </Card>

          <Card>
            <SectionHeader icon={ClipboardList} iconColor="#7c3aed" title="Indicadores de evaluación" className="mb-3" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{selectedInds.size} de {indicadores.length} seleccionados</span>
              {indicadores.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button onClick={selectAllInds} className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors px-2 py-1 rounded-lg hover:bg-violet-50">Todo</button>
                  <button onClick={deselectAllInds} className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">Ninguno</button>
                </div>
              )}
            </div>
            {loadingContext ? (
              <div className="text-xs flex items-center gap-1 py-6 justify-center" style={{ color: 'var(--muted2)' }}>
                <Loader size={10} className="spin" /> Cargando indicadores…
              </div>
            ) : indicadores.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400 italic mb-3">
                  {selectedOA
                    ? 'Este OA aún no tiene indicadores cargados. Puedes generar indicadores pedagógicos sugeridos.'
                    : 'Selecciona un OA para ver sus indicadores.'}
                </p>
                {selectedOA && (
                  <Button variant="secondary" size="sm" iconLeft={Sparkles} onClick={handleGenerateIndicators} disabled={isGeneratingInds}>
                    {isGeneratingInds ? 'Generando...' : 'Generar indicadores sugeridos'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {indicadores.map((ind, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                      selectedInds.has(i) ? 'bg-violet-50 border border-violet-200' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedInds.has(i)}
                      onChange={() => toggleIndicador(i)}
                      className="mt-0.5 accent-violet-600"
                    />
                    <span className={`text-xs leading-relaxed ${selectedInds.has(i) ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                      {ind}
                    </span>
                    {curricularContext?.indicators?.[i]?.sourceType === 'derived' && (
                      <Badge color="amber" size="sm">Derivado por IA</Badge>
                    )}
                  </label>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card className="mb-6">
          <SectionHeader icon={Sparkles} iconColor="#7c3aed" title="Paso 3: Personalización y DUA" description="Configura dificultad, preguntas SIMCE (si aplica) y genera la evaluación." className="mb-5" />
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <FileText size={13} className="text-violet-600" strokeWidth={2.25} />
                Dificultad
              </label>
              <select value={dificultad} onChange={(e) => setDificultad(e.target.value)} className={selectClass}>
                {(cfgDifficulty.length > 0 ? cfgDifficulty : DIFICULTADES.map(d => ({ id: d, value: d, label: d }))).map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            {isSIMCE && (
              <>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <Badge color="amber" size="sm" className="mb-2">Evaluación tipo SIMCE</Badge>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Número de preguntas</label>
                      <input
                        type="number"
                        min={3}
                        max={20}
                        value={nPreguntas}
                        onChange={(e) => setNPreguntas(parseInt(e.target.value) || 5)}
                        className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Texto base o tema</label>
                      <textarea
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder="Texto breve, situación o tema..."
                        className="w-full min-h-[60px] px-3 py-2 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all shadow-sm resize-y"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
            {selectedOA && selectedInds.size > 0 && (
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Resumen:</span> {EVAL_TIPOS.find(t => t.v === tipo)?.l || tipo} · {selectedCurso?.name || selectedNivel} · {selectedAsignatura} · {extractShortObjectiveCode(selectedOA.oa_id)} · {selectedInds.size} indicador(es)
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
            <Button variant="ghost" iconLeft={ArrowLeft} onClick={() => setStep(2)}>Atrás</Button>
            <Button variant="premium" iconLeft={Sparkles} onClick={handleGenerar} disabled={!selectedOA}>
              Generar {isSIMCE ? 'SIMCE' : 'evaluación'}
            </Button>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900">Resultado</h2>
          {output && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button variant="secondary" size="sm" iconLeft={Sparkles} onClick={handleGuardar}>Guardar</Button>
              <Button variant="secondary" size="sm" iconLeft={Plus} onClick={handleSaveToBancoRecursos} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Banco de Recursos'}
              </Button>
              <Button variant="ghost" size="sm" iconLeft={Share2} onClick={handleShareEvaluacion}>Compartir</Button>
              <Button variant="ghost" size="sm" iconLeft={Send} onClick={handleEnviarDrive}>Drive</Button>
              <Button variant="ghost" size="sm" iconLeft={Printer} onClick={handleImprimir}>Imprimir</Button>
              <Button variant="ghost" size="sm" iconLeft={Download} onClick={handleExportar}>Exportar</Button>
              <Button variant="ghost" size="sm" iconLeft={CopyPlus} onClick={handleDuplicar}>Duplicar</Button>
              <Button variant="ghost" size="sm" iconLeft={Edit3} onClick={handleEditar}>{editando ? 'Listo' : 'Editar'}</Button>
              <Button variant="ghost" size="sm" iconLeft={copied ? Check : Copy} onClick={handleCopiar}>
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          )}
        </div>
        <StatusBar message={status} type={statusType} />
        {editando && output ? (
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            className="w-full min-h-[400px] font-mono text-sm p-3 rounded-xl bg-white border border-gray-200/80 text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm resize-y mt-3"
          />
        ) : (
          <div className="mt-3 bg-gray-50 rounded-xl p-4 max-h-[500px] overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap font-sans" style={{color:'#000000'}}>
            {output || <p className="text-gray-400 italic">La evaluación generada aparecerá aquí...</p>}
          </div>
        )}
      </Card>

      {shareResult && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShareResult(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Share2 size={18} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Evaluacion compartida</h3>
                  <p className="text-xs text-gray-400">Copia el enlace para compartir</p>
                </div>
              </div>
              <button onClick={() => setShareResult(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 mb-4">
              <Link size={14} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={shareResult.shareUrl}
                readOnly
                className="flex-1 bg-transparent text-xs text-gray-600 outline-none border-none p-0"
              />
              <button
                onClick={handleCopyShareUrl}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${shareResult.copied ? 'bg-green-100 text-green-700' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}
              >
                {shareResult.copied ? <><Check size={12} className="inline mr-1" />Copiado</> : 'Copiar'}
              </button>
            </div>
            <button onClick={() => setShareResult(null)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all">
              Cerrar
            </button>
          </div>
        </div>
      )}

      <AdaptarPanel
        item={selectedOA ? {
          id: selectedOA.oa_id,
          fuente: 'oficial',
          nivel: selectedNivel as any,
          curso: selectedCurso?.name || selectedNivel,
          asignatura: selectedAsignatura,
          eje: '',
          oa: selectedOA.oa_texto,
          habilidad: habilidad,
          indicadores: indicadores,
          conocimientos: [],
          actitudes: [],
          palabrasClave: [],
          actividadesSugeridas: [],
          evaluacionesSugeridas: [],
          recursos: [],
        } : null}
        contenidoOriginal={output}
        onStatus={(msg, type) => { setStatus(msg); setStatusType(type || ''); }}
      />

      {selectedAsignatura && selectedOA && extSources.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader icon={BookOpen} iconColor="#7c3aed" title="Recursos sugeridos" description="Fuentes externas relacionadas con evaluacion" />
            <button onClick={() => setShowExtPanel(!showExtPanel)} className="text-xs font-medium text-violet-600 hover:text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-all">
              {showExtPanel ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showExtPanel && (
            <>
              {extError && <p className="text-xs text-red-500 mb-3">{extError}</p>}

              {loadingExt ? (
                <div className="text-xs flex items-center gap-1 py-4 justify-center text-gray-400">
                  <Loader size={10} className="spin" /> Cargando recursos...
                </div>
              ) : (
                <>
                  {extLinks.filter(l => l.access_type === 'open' || l.access_type === 'login_required').length === 0 && !showAddLink && (
                    <p className="text-xs text-gray-400 italic py-3 text-center">
                      No hay recursos sugeridos para esta combinacion. Puedes agregar enlaces manualmente.
                    </p>
                  )}

                  {extLinks.filter(l => l.access_type === 'open').length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                        <Badge color="violet" size="sm">Oficiales / Publicos</Badge>
                      </p>
                      <div className="space-y-2">
                        {extLinks.filter(l => l.access_type === 'open').map(link => (
                          <div key={link.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <span className="text-xs font-semibold text-gray-800">{link.title}</span>
                                {link.source_source_type === 'official' && <Badge color="violet" size="sm">Oficial</Badge>}
                                {link.validation_status === 'validated' && <Badge color="green" size="sm">Validado</Badge>}
                              </div>
                              {link.description && <p className="text-xs text-gray-500 mb-1">{link.description}</p>}
                              <div className="flex items-center gap-2 flex-wrap">
                                {link.url && (
                                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                                     className="text-xs font-medium text-violet-600 hover:text-violet-700 hover:underline">
                                    {link.source_name || 'Visitar sitio'}
                                  </a>
                                )}
                                <span className="text-[10px] text-gray-400">{link.source_name}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {extLinks.filter(l => l.access_type === 'login_required').length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                        <Badge color="amber" size="sm">Requiere inicio de sesion</Badge>
                      </p>
                      <div className="space-y-2">
                        {extLinks.filter(l => l.access_type === 'login_required').map(link => (
                          <div key={link.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <span className="text-xs font-semibold text-gray-800">{link.title}</span>
                                <Badge color="amber" size="sm">Cuenta privada</Badge>
                              </div>
                              {link.description && <p className="text-xs text-gray-500 mb-1">{link.description}</p>}
                              {link.url && (
                                <a href={link.url} target="_blank" rel="noopener noreferrer"
                                   className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline">
                                  {link.source_name || 'Visitar sitio'}
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {extLinks.filter(l => l.access_type === 'paid' || l.access_type === 'manual_upload').length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                        <Badge color="slate" size="sm">Pago / Carga manual</Badge>
                      </p>
                      <div className="space-y-2">
                        {extLinks.filter(l => l.access_type === 'paid' || l.access_type === 'manual_upload').map(link => (
                          <div key={link.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <span className="text-xs font-semibold text-gray-800">{link.title}</span>
                                <Badge color="slate" size="sm">{link.access_type === 'paid' ? 'Pago' : 'Manual'}</Badge>
                              </div>
                              {link.description && <p className="text-xs text-gray-500 mb-1">{link.description}</p>}
                              <p className="text-[10px] text-gray-400">{link.license_note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <button onClick={() => setShowAddLink(!showAddLink)} className="text-xs font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1">
                      {showAddLink ? 'Cancelar' : 'Agregar enlace manual'}
                    </button>

                    {showAddLink && (
                      <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2.5">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Guardar enlace de recurso externo</p>
                        <select value={newLink.sourceId} onChange={e => setNewLink(p => ({ ...p, sourceId: e.target.value }))}
                                className="w-full h-9 px-2.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700">
                          <option value="">Seleccionar fuente</option>
                          {extSources.filter(s => s.source_type === 'user_saved' || s.source_type === 'private_account').map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <input type="text" placeholder="Titulo del recurso" value={newLink.title}
                               onChange={e => setNewLink(p => ({ ...p, title: e.target.value }))}
                               className="w-full h-9 px-2.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700" />
                        <input type="url" placeholder="URL (opcional)" value={newLink.url}
                               onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))}
                               className="w-full h-9 px-2.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700" />
                        <textarea placeholder="Descripcion o nota personal" value={newLink.description}
                                  onChange={e => setNewLink(p => ({ ...p, description: e.target.value }))}
                                  className="w-full min-h-[50px] px-2.5 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 resize-y" />
                        <input type="text" placeholder="Tags separados por coma (inspiracion, OA, material)" value={newLink.tags}
                               onChange={e => setNewLink(p => ({ ...p, tags: e.target.value }))}
                               className="w-full h-9 px-2.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700" />
                        <div className="flex items-center gap-2 pt-1">
                          <Button variant="secondary" size="sm" onClick={handleAddLink} disabled={!newLink.sourceId || !newLink.title}>Guardar enlace</Button>
                          <span className="text-[10px] text-gray-400">No se descarga contenido automaticamente</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </Card>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
