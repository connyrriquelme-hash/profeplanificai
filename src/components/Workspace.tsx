import { useState, useEffect, useCallback, useRef } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { Play, Sparkles, Plus, Search, CheckCircle, Loader, Share2, Link, Check, X } from 'lucide-react';
import { useProject, type ProjectData } from '../contexts/ProjectContext';
import { niveles, getAsignaturas, getOAs, type CurriculumItem } from '../data/curriculumData';
import { AIAssistant, type PedagogicalContext } from './AIAssistant';
import { generarConIA } from '../services/aiService';
import { saveRecurso, generateId } from '../services/storageService';
import { shareFromWorkspace } from '../services/sharedDocumentService';
import { api } from '../services/apiClient';
import { getCurricularContext, analyzeObjectiveComplexity, buildPedagogicalPrompt } from '../services/curricularPlanningService';
import type { CurricularContext, ComplexityAnalysis } from '../services/curricularPlanningService';
import { fetchObjectives, fetchCourses, fetchSubjects } from '../services/objectiveService';
import type { D1ObjectiveRow, CourseRow, SubjectRow } from '../services/objectiveService';
import { cleanGeneratedPlanText } from '../services/curricularPlanningService';
import { extractShortObjectiveCode, resolveObjectiveRealPayload, resolveObjectiveRealCode, type RichCurriculumItem } from '../services/curriculumMappingService';

interface WorkspaceProps {
  onNavigate?: (view: string) => void;
}

const selectClass =
  'w-full px-3 py-[10px] text-[13px] sm:text-sm border border-[var(--line)] rounded-[var(--radius)] bg-[var(--card)] text-[var(--ink)] font-[Inter,system-ui,sans-serif] cursor-pointer outline-none transition-[border-color] duration-150';



function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: 'var(--success)', color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500, animation: 'fadeIn .2s ease' }}>
      <CheckCircle size={18} />
      {message}
    </div>
  );
}

export function Workspace({ onNavigate }: WorkspaceProps) {
  const { currentProject, updateProjectField, addToLibrary } = useProject();

  const [indicadores, setIndicadores] = useState(currentProject?.indicadores || '');
  const [estructuraClase, setEstructuraClase] = useState(currentProject?.inicio || '');
  const [recursos, setRecursos] = useState(currentProject?.recursos || '');
  const [evaluacion, setEvaluacion] = useState(currentProject?.evaluacion || '');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNivel, setSelectedNivel] = useState('');
  const [selectedCurso, setSelectedCurso] = useState<CourseRow | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedAsignatura, setSelectedAsignatura] = useState('');
  const [selectedOA, setSelectedOA] = useState<CurriculumItem | null>(null);
  const [selectedHabilidad, setSelectedHabilidad] = useState('');
  const [selectedInds, setSelectedInds] = useState<Set<number>>(new Set());
  const [oaSearch, setOaSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [shareResult, setShareResult] = useState<{ shareUrl: string; copied: boolean } | null>(null);
  const [curricularContext, setCurricularContext] = useState<CurricularContext | null>(null);
  const [numberOfLessons, setNumberOfLessons] = useState(1);
  const [complexityAnalysis, setComplexityAnalysis] = useState<ComplexityAnalysis | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [fetchedOAs, setFetchedOAs] = useState<CurriculumItem[]>([]);
  const [loadingOAs, setLoadingOAs] = useState(false);
  const [oaError, setOaError] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonTheme, setLessonTheme] = useState(currentProject?.lessonTheme || '');
  const isInitialTitleLoad = useRef(true);

  const buildLessonTitle = useCallback(() => {
    const theme = lessonTheme ? lessonTheme.slice(0, 60) : '';
    const parts = [
      selectedCurso?.name || selectedNivel,
      selectedAsignatura,
      selectedOA?.oa_id,
      theme,
      numberOfLessons === 1 ? 'Clase única' : `Secuencia de ${numberOfLessons} clases`,
    ].filter(Boolean);
    return parts.join(' - ') || `Planificación - ${new Date().toLocaleDateString('es-CL')}`;
  }, [selectedCurso, selectedNivel, selectedAsignatura, selectedOA, numberOfLessons, lessonTheme]);

  useEffect(() => {
    if (isInitialTitleLoad.current) return;
    setLessonTitle(buildLessonTitle());
  }, [buildLessonTitle]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => setToastVisible(false), 3000);
    return () => clearTimeout(t);
  }, [toastVisible]);

  // Rehydrate all fields when a saved project is loaded
  useEffect(() => {
    if (!currentProject) return;
    setIndicadores(currentProject.indicadores || '');
    setEstructuraClase(currentProject.inicio || '');
    setRecursos(currentProject.recursos || '');
    setEvaluacion(currentProject.evaluacion || '');
    setSelectedNivel(currentProject.nivel || '');
    const savedCurso = currentProject.curso ? courses.find(c => c.id === currentProject.curso) : null;
    if (savedCurso) setSelectedCurso(savedCurso);
    setSelectedAsignatura(currentProject.asignatura || '');
    setSelectedHabilidad(currentProject.habilidad || '');
    setNumberOfLessons(currentProject.numberOfLessons || 1);
    setOaSearch('');
    if (currentProject.oa_id && currentProject.nivel && currentProject.asignatura) {
      const oas = getOAs(currentProject.nivel, currentProject.asignatura);
      const found = oas.find(o => o.oa_id === currentProject.oa_id);
      setSelectedOA(found || null);
    } else {
      setSelectedOA(null);
    }
    setLessonTitle(currentProject.titulo || '');
    isInitialTitleLoad.current = false;
  }, [currentProject, courses]);

  // Build pedagogical context for the AI agent
  const pedagogicalContext: PedagogicalContext | null = selectedOA ? {
    nivel: selectedNivel,
    asignatura: selectedAsignatura,
    oa_id: resolveObjectiveRealCode(selectedOA),
    oa_texto: selectedOA.oa_texto,
    habilidades: selectedOA.habilidades,
    indicadores: selectedOA.indicadores,
  } : null;

  // Auto-fill OA text, indicadores, habilidades and persist curriculum context
  useEffect(() => {
    if (!selectedOA) return;
    updateProjectField('objetivos', selectedOA.oa_texto);
    setIndicadores(selectedOA.indicadores.map(i => `• ${i}`).join('\n'));
    updateProjectField('indicadores', selectedOA.indicadores.map(i => `• ${i}`).join('\n'));
    setSelectedHabilidad(selectedOA.habilidades[0] || '');
    setSelectedInds(new Set(selectedOA.indicadores.map((_, i) => i)));
    updateProjectField('oa_id', resolveObjectiveRealCode(selectedOA));
    updateProjectField('indicadores_raw', JSON.stringify(selectedOA.indicadores));
    updateProjectField('nivel', selectedNivel);
    updateProjectField('asignatura', selectedAsignatura);
  }, [selectedOA]);

  // Load curricular context from D1 when OA changes
  useEffect(() => {
    if (!selectedOA || !selectedNivel || !selectedAsignatura) {
      setCurricularContext(null);
      setComplexityAnalysis(null);
      return;
    }
    let cancelled = false;
    setLoadingContext(true);
    (async () => {
      try {
        const realCode = resolveObjectiveRealCode(selectedOA);
        const realPayload = resolveObjectiveRealPayload(selectedOA);
        const ctx = await getCurricularContext(selectedNivel, selectedAsignatura, realCode, realPayload.objectiveId || undefined);
        if (cancelled) return;
        setCurricularContext(ctx);
        const complexityResult = await analyzeObjectiveComplexity({
          level: selectedNivel,
          subject: selectedAsignatura,
          objectiveCode: realCode,
          objectiveText: selectedOA.oa_texto,
          indicators: selectedOA.indicadores || [],
          skills: selectedOA.habilidades || [selectedHabilidad].filter(Boolean),
        });
        if (cancelled) return;
        setComplexityAnalysis(complexityResult);
        if (complexityResult?.recommendedLessons) setNumberOfLessons(Math.min(complexityResult.recommendedLessons, 5));
      } catch {
        if (cancelled) return;
        setCurricularContext(null);
        setComplexityAnalysis(null);
      } finally {
        if (!cancelled) setLoadingContext(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedOA, selectedNivel, selectedAsignatura]);

  // Fetch courses from D1 on mount
  useEffect(() => {
    fetchCourses().then(setCourses);
  }, []);

  // Fetch subjects when curso changes
  useEffect(() => {
    if (!selectedCurso) { setSubjects([]); return; }
    fetchSubjects(selectedCurso.code).then(setSubjects);
  }, [selectedCurso]);

  // Fetch OAs from D1 when curso + asignatura changes
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

  // Persist curso whenever it changes
  useEffect(() => {
    updateProjectField('curso', selectedCurso?.id || '');
  }, [selectedCurso]);

  // Persist habilidad whenever it changes
  useEffect(() => {
    updateProjectField('habilidad', selectedHabilidad);
  }, [selectedHabilidad]);

  // Persist numberOfLessons and complexity
  useEffect(() => {
    updateProjectField('numberOfLessons', numberOfLessons);
  }, [numberOfLessons]);

  useEffect(() => {
    updateProjectField('complexity', complexityAnalysis?.complexity || '');
  }, [complexityAnalysis?.complexity]);

  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>, field?: keyof ProjectData) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setter(e.target.value);
    if (field) updateProjectField(field, e.target.value);
  };

  const handleNivelChange = (value: string) => {
    setSelectedNivel(value);
    setSelectedCurso(null);
    setSelectedAsignatura('');
    setSelectedSubjectId('');
    setSelectedOA(null);
    setSelectedHabilidad('');
    setOaSearch('');
    updateProjectField('nivel', value);
    updateProjectField('asignatura', '');
    updateProjectField('oa_id', '');
    updateProjectField('habilidad', '');
    updateProjectField('indicadores_raw', '[]');
  };

  const handleCursoChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId) || null;
    setSelectedCurso(course);
    setSelectedAsignatura('');
    setSelectedSubjectId('');
    setSelectedOA(null);
    setSelectedHabilidad('');
    setOaSearch('');
    updateProjectField('asignatura', '');
    updateProjectField('oa_id', '');
    updateProjectField('habilidad', '');
    updateProjectField('indicadores_raw', '[]');
  };

  const handleAsignaturaChange = (value: string) => {
    setSelectedAsignatura(value);
    const sub = subjects.find(s => s.name === value);
    setSelectedSubjectId(sub?.id || value);
    setSelectedOA(null);
    setSelectedHabilidad('');
    setOaSearch('');
    updateProjectField('asignatura', value);
    updateProjectField('oa_id', '');
    updateProjectField('habilidad', '');
    updateProjectField('indicadores_raw', '[]');
  };

  const handleGenerate = async () => {
    if (!selectedOA) {
      showToast('Selecciona un OA primero.');
      return;
    }
    setIsGenerating(true);
    try {
      const pedagogicalPrompt = buildPedagogicalPrompt({
        level: selectedNivel,
        subject: selectedAsignatura,
        objectiveCode: resolveObjectiveRealCode(selectedOA),
        objectiveText: selectedOA.oa_texto,
        indicators: selectedOA.indicadores.filter((_, i) => selectedInds.has(i)),
        skills: curricularContext?.skills?.map(s => s.text) || [selectedHabilidad || selectedOA.habilidades[0] || ''],
        attitudes: curricularContext?.attitudes?.map(a => a.text) || [],
        textbookRefs: (curricularContext?.textbookReferences || []).map(ref => ({
          title: ref.title,
          unit: ref.unit,
          summary: ref.summary,
        })),
        teacherGuideRefs: (curricularContext?.teacherGuideReferences || []).map(ref => ({
          title: ref.title,
          suggestedActivity: (ref as any).suggestedActivity || '',
          didacticOrientation: (ref as any).didacticOrientation || '',
          assessmentSuggestion: (ref as any).assessmentSuggestion || '',
        })),
        numberOfLessons,
        theme: lessonTheme || undefined,
      });
      const result = await generarConIA({
        tipo: 'planificacion',
        nivel: selectedNivel,
        asignatura: selectedAsignatura,
        oa: selectedOA.oa_texto,
        habilidad: selectedHabilidad,
        promptExt: pedagogicalPrompt,
        estilo: 'completo',
        duracion: '90 min',
        onStatus: () => {},
      });
      const raw = result.texto || generarFallbackEstructura(numberOfLessons);
      const cleaned = cleanGeneratedPlanText(raw);
      setEstructuraClase(cleaned);
      updateProjectField('inicio', cleaned);
      showToast(`Secuencia de ${numberOfLessons} clase(s) generada con IA.`);
    } catch {
      const fallback = cleanGeneratedPlanText(generarFallbackEstructura(numberOfLessons));
      setEstructuraClase(fallback);
      updateProjectField('inicio', fallback);
      showToast('Generado en modo local (fallback).');
    } finally {
      setIsGenerating(false);
    }
  };

  const generarFallbackEstructura = (clases: number) => {
    let out = '';
    for (let i = 1; i <= clases; i++) {
      out += `CLASE ${i}\n\nInicio (10-15 min):\nActivación de conocimientos previos mediante lluvia de ideas…\n\nDesarrollo (25-30 min):\nTrabajo colaborativo en grupos…\n\nCierre (5-10 min):\nTicket de salida con pregunta de metacognición…\n\n`;
    }
    return out.trim();
  };

  const handleSaveToLibrary = async () => {
    const content = cleanGeneratedPlanText(estructuraClase.trim());
    if (!content) {
      showToast('Primero genera o escribe una planificación para guardarla.');
      return;
    }
    if (!currentProject) return;
    setIsSaving(true);
    try {
      updateProjectField('titulo', lessonTitle);
      addToLibrary();
      saveRecurso({
        id: generateId(),
        tipoRecurso: 'planificación',
        titulo: lessonTitle,
        nivel: selectedNivel || currentProject.nivel || '',
        asignatura: selectedAsignatura || currentProject.asignatura || '',
        oa: selectedOA?.oa_texto || currentProject.objetivos || '',
        contenido: content,
        texto: content,
        tema: lessonTheme || undefined,
        timestamp: Date.now(),
      });
      await api.post('/api/resources', {
        title: lessonTitle,
        type: 'planificacion',
        source: 'workspace',
        content,
        level: selectedNivel || currentProject.nivel || '',
        subject: selectedAsignatura || currentProject.asignatura || '',
        objectiveCode: resolveObjectiveRealCode(selectedOA) || currentProject.oa_id || '',
        objectiveText: selectedOA?.oa_texto || currentProject.objetivos || '',
        skill: selectedHabilidad || currentProject.habilidad || '',
        theme: lessonTheme || undefined,
        metadata: {
          level: selectedNivel || currentProject.nivel || '',
          course: selectedCurso?.name || currentProject.curso || '',
          subject: selectedAsignatura || currentProject.asignatura || '',
          objectiveCode: resolveObjectiveRealCode(selectedOA) || currentProject.oa_id || '',
          objectiveText: selectedOA?.oa_texto || currentProject.objetivos || '',
          skill: selectedHabilidad || currentProject.habilidad || '',
          lessonTheme: lessonTheme || undefined,
          numberOfLessons,
          complexity: complexityAnalysis?.complexity || null,
          complexityRationale: complexityAnalysis?.rationale || null,
          indicators: selectedOA?.indicadores || [],
          textbookReferences: (curricularContext?.textbookReferences || []).map(ref => ({
            title: ref.title,
            summary: ref.summary,
            sourceType: ref.sourceType || 'metadata',
          })),
          teacherGuideReferences: (curricularContext?.teacherGuideReferences || []).map(ref => ({
            title: ref.title,
            lessonTitle: ref.lessonTitle,
            sourceType: ref.sourceType || 'derived',
          })),
          resourceLinks: (curricularContext?.resourceLinks || []).map(r => ({
            title: r.title,
            type: r.type,
            sourceType: r.sourceType || 'derived',
          })),
          sequenceRecommendation: complexityAnalysis?.suggestedSequence || null,
          dataStatus: curricularContext?.dataStatus || null,
        },
      });
      showToast('Planificación guardada en Banco de Recursos.');
    } catch {
      showToast('No se pudo guardar la planificación. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSharePlan = async () => {
    const content = cleanGeneratedPlanText(estructuraClase.trim());
    if (!content) {
      showToast('Primero genera o escribe una planificación para compartirla.');
      return;
    }
    const title = lessonTitle || currentProject?.titulo || `Planificación - ${new Date().toLocaleDateString('es-CL')}`;
    const { doc, shareUrl } = shareFromWorkspace({
      title,
      content,
      nivel: selectedNivel,
      asignatura: selectedAsignatura,
      oa: selectedOA?.oa_texto,
      habilidad: selectedHabilidad,
      lessonTheme: lessonTheme || undefined,
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
      // Cloud sync failed — local copy still works on this device
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

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <Toast message={toastMessage} visible={toastVisible} />

      {/* ── Left panel: configuration ── */}
      <div className="lg:col-span-4 space-y-5">
        {/* ── Cascading selectors ── */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }} className="text-[10px] sm:text-[11px] lg:text-xs">Nivel educativo</label>
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
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }} className="text-[10px] sm:text-[11px] lg:text-xs">Curso</label>
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
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }} className="text-[10px] sm:text-[11px] lg:text-xs">Asignatura</label>
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
        </div>

        {/* ── OA search and selector ── */}
        <div className="space-y-3">
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }} className="text-[10px] sm:text-[11px] lg:text-xs">Objetivo (OA)</label>
            {selectedAsignatura && (
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
            )}
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
              disabled={!selectedAsignatura || loadingOAs}
            >
              <option value="">
                {loadingOAs ? 'Cargando objetivos…' : !selectedAsignatura ? 'Primero elige asignatura' : 'Seleccionar OA'}
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
            {loadingOAs && <div className="text-[10px] flex items-center gap-1" style={{ color: 'var(--muted2)' }}><Loader size={10} className="spin" /> Cargando objetivos desde la base curricular…</div>}
            {fetchedOAs.length > 0 && !loadingOAs && (
              <div className="text-[10px]" style={{ color: 'var(--muted2)' }}>Objetivos encontrados: {fetchedOAs.length}</div>
            )}
            {oaError && !loadingOAs && <div className="text-[10px]" style={{ color: 'var(--muted2)' }}>{oaError}</div>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }} className="text-[10px] sm:text-[11px] lg:text-xs">Habilidad</label>
            <select
              value={selectedHabilidad}
              onChange={e => setSelectedHabilidad(e.target.value)}
              className={selectClass}
              disabled={!selectedOA}
            >
              <option value="">{selectedOA ? 'Seleccionar habilidad' : 'Primero elige OA'}</option>
              {selectedOA?.habilidades.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }} className="text-[10px] sm:text-[11px] lg:text-xs">TEMA DE LA CLASE</label>
            <input
              type="text"
              value={lessonTheme}
              onChange={e => setLessonTheme(e.target.value)}
              placeholder="Ej: El cuerpo humano, el agua, Minecraft educativo, fiestas patrias..."
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
                borderRadius: 'var(--radius)', background: 'var(--card)', color: 'var(--ink)',
                fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif', outline: 'none',
                boxSizing: 'border-box',
              }}
              className="text-[13px] sm:text-sm"
            />
            <p style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 4 }}>
              Opcional. Ayuda a contextualizar la clase sin cambiar el OA.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {['Vida cotidiana', 'Juego y desafios', 'Naturaleza', 'Tecnologia', 'Arte y creatividad', 'Comunidad', 'Cuento o historia', 'Experimento', 'Proyecto practico', 'SIMCE / practica guiada'].map(tema => (
                <button
                  key={tema}
                  onClick={() => setLessonTheme(tema)}
                  style={{
                    padding: '4px 10px', borderRadius: 999, border: '1px solid var(--line)',
                    background: lessonTheme === tema ? '#eef2ff' : 'var(--card)',
                    color: lessonTheme === tema ? '#4f46e5' : 'var(--muted2)',
                    fontSize: 10, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                  className="hover:border-indigo-300 hover:text-indigo-600"
                >
                  {tema}
                </button>
              ))}
            </div>
            {selectedAsignatura && (
              <details style={{ marginTop: 4 }}>
                <summary style={{ fontSize: 10, color: 'var(--muted2)', cursor: 'pointer' }}>Temas sugeridos para {selectedAsignatura}</summary>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                  {(() => {
                    const sugeridos: Record<string, string[]> = {
                      'Ciencias Naturales': ['Cuerpo humano', 'Seres vivos', 'Agua', 'Energia', 'Plantas', 'Animales', 'Ecosistemas', 'Clima'],
                      'Lenguaje y Comunicación': ['Cuentos', 'Personajes', 'Noticias', 'Poemas', 'Leyendas', 'Fabulas', 'Biografias'],
                      'Matemática': ['Compras', 'Juegos', 'Problemas cotidianos', 'Construccion', 'Deportes', 'Recetas'],
                      'Tecnología': ['Diseno', 'Objetos utiles', 'Robotica simple', 'Materiales', 'Solucion de problemas'],
                      'Artes Visuales': ['Emociones', 'Colores', 'Naturaleza', 'Identidad', 'Cultura local'],
                      'Historia, Geografía y Cs Sociales': ['Comunidad', 'Familia', 'Tradiciones', 'Mapas', 'Patrimonio'],
                      'Inglés': ['Rutina diaria', 'Animales', 'Colores y numeros', 'Familia', 'Comida'],
                      'Música': ['Ritmo', 'Canciones', 'Instrumentos', 'Sonidos de la naturaleza'],
                      'Educación Física': ['Juegos tradicionales', 'Coordinacion', 'Vida saludable', 'Trabajo en equipo'],
                    };
                    return (sugeridos[selectedAsignatura] || []).map(t => (
                      <button key={t} onClick={() => setLessonTheme(t)}
                        style={{
                          padding: '4px 10px', borderRadius: 999, border: '1px solid var(--line)',
                          background: lessonTheme === t ? '#eef2ff' : 'var(--card)',
                          color: lessonTheme === t ? '#4f46e5' : 'var(--muted2)',
                          fontSize: 10, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                          transition: 'all 0.15s',
                        }}
                        className="hover:border-indigo-300 hover:text-indigo-600"
                      >
                        {t}
                      </button>
                    ));
                  })()}
                </div>
              </details>
            )}
          </div>
        </div>

        {selectedOA && (
          <div className="rounded-xl border" style={{ borderColor: 'var(--line)', background: 'var(--card)', overflow: 'hidden' }}>
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--muted2)', borderBottom: '1px solid var(--line)', background: 'var(--surface)' }}>
              <span>Contexto Curricular</span>
              {loadingContext && <Loader size={12} className="spin" />}
            </div>
            <div className="px-3 py-2 space-y-2 text-xs" style={{ color: 'var(--ink2)' }}>
              <div><span className="font-semibold">{extractShortObjectiveCode(selectedOA.oa_id)}</span><br/>{selectedOA.oa_texto}</div>

              {/* Indicadores */}
              {selectedOA.indicadores.length > 0 ? (
                <div>
                  <div className="font-semibold mb-0.5 flex items-center gap-1.5" style={{ color: 'var(--muted2)' }}>
                    Indicadores
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">{selectedInds.size}/{selectedOA.indicadores.length}</span>
                  </div>
                  <div className="flex gap-1 mb-1">
                    <button onClick={() => setSelectedInds(new Set(selectedOA.indicadores.map((_, i) => i)))} className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--line)', color: 'var(--muted2)' }}>Todo</button>
                    <button onClick={() => setSelectedInds(new Set())} className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--line)', color: 'var(--muted2)' }}>Ninguno</button>
                  </div>
                  <div className="space-y-0.5 max-h-32 overflow-y-auto">
                    {selectedOA.indicadores.map((ind, i) => (
                      <label key={i} className="flex items-start gap-1.5 cursor-pointer text-[11px]" style={{ color: 'var(--ink2)' }}>
                        <input type="checkbox" checked={selectedInds.has(i)} onChange={() => {
                          const next = new Set(selectedInds);
                          next.has(i) ? next.delete(i) : next.add(i);
                          setSelectedInds(next);
                        }} className="mt-0.5" />
                        <span>{ind}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] italic" style={{ color: 'var(--muted2)' }}>Indicadores aún no cargados para este OA</div>
              )}

              {/* Textos escolares */}
              {curricularContext?.textbookReferences && curricularContext.textbookReferences.length > 0 ? (
                <div>
                  <div className="font-semibold mb-0.5 flex items-center gap-1.5" style={{ color: 'var(--muted2)' }}>
                    Textos escolares
                    {curricularContext.textbookReferences[0]?.sourceType === 'metadata' ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-600">Pendiente de validación oficial</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700">Fuente oficial</span>
                    )}
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {curricularContext.textbookReferences.slice(0, 2).map((ref, i) => (
                      <li key={i}>
                        {ref.title}{ref.pageStart > 0 ? ` (pág. ${ref.pageStart}–${ref.pageEnd})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-[11px] italic" style={{ color: 'var(--muted2)' }}>Sin referencias de texto escolar cargadas</div>
              )}

              {/* Guías docentes */}
              {curricularContext?.teacherGuideReferences && curricularContext.teacherGuideReferences.length > 0 ? (
                <div>
                  <div className="font-semibold mb-0.5 flex items-center gap-1.5" style={{ color: 'var(--muted2)' }}>
                    Guías docentes
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">Derivado por IA</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {curricularContext.teacherGuideReferences.slice(0, 2).map((ref, i) => (
                      <li key={i}>{ref.lessonTitle}: {(ref.suggestedActivity || '').slice(0, 80)}…</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-[11px] italic" style={{ color: 'var(--muted2)' }}>Sin guías docentes asociadas cargadas</div>
              )}

              {/* Complejidad */}
              {complexityAnalysis && (
                <div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted2)' }}>Complejidad:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      complexityAnalysis.complexity === 'baja' ? 'bg-green-100 text-green-700' :
                      complexityAnalysis.complexity === 'media' ? 'bg-yellow-100 text-yellow-700' :
                      complexityAnalysis.complexity === 'alta' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {complexityAnalysis.complexity === 'baja' ? 'Baja' :
                       complexityAnalysis.complexity === 'media' ? 'Media' :
                       complexityAnalysis.complexity === 'alta' ? 'Alta' : 'Muy alta'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-600">Recomendación generada por heurística pedagógica</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedOA && (
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-semibold" style={{ color: 'var(--muted2)' }}>Duración de la secuencia:</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setNumberOfLessons(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    numberOfLessons === n
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className="text-[10px]" style={{ color: 'var(--muted2)' }}>
              {numberOfLessons === 1 ? 'clase' : 'clases'}{complexityAnalysis?.recommendedLessons ? ` (recomendado: ${complexityAnalysis.recommendedLessons})` : ''}
            </span>
          </div>
        )}

        <aside>
          <AIAssistant context={pedagogicalContext} />
        </aside>

        {/* ── Debug diagnostics ── */}
        <details className="text-[10px]" style={{ color: 'var(--muted2)' }}>
          <summary className="cursor-pointer select-none">Diagnóstico (click para ver)</summary>
          <pre className="mt-1 p-2 rounded" style={{ background: 'var(--surface)', overflow: 'auto', maxHeight: 200, fontSize: 9, lineHeight: 1.4 }}>
{`nivelEducativo: ${selectedNivel}
cursoSeleccionado: ${selectedCurso?.name || '(ninguno)'}
courseCode: ${selectedCurso?.code || ''}
courseId: ${selectedCurso?.id || ''}
asignaturaSeleccionada: ${selectedAsignatura || '(ninguna)'}
subjectId: ${selectedSubjectId || ''}
OA cargados (D1): ${fetchedOAs.length}
endpoint OA: /api/objectives?course=${selectedCurso?.code || ''}&subject=${selectedSubjectId || ''}&limit=200`}
          </pre>
        </details>
      </div>

      {/* ── Right panel: content ── */}
      <div className="lg:col-span-8 space-y-5">

        <div style={{ marginBottom: 4 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Título de la planificación</label>
          <input
            type="text"
            value={lessonTitle}
            onChange={e => { setLessonTitle(e.target.value); updateProjectField('titulo', e.target.value); }}
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid var(--line)',
              borderRadius: 'var(--radius)', background: 'var(--card)', color: 'var(--ink)',
              fontSize: 14, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif', outline: 'none',
              boxSizing: 'border-box',
            }}
            placeholder="Título de la planificación"
          />
        </div>

        <CollapsibleSection title="ESTRUCTURA DE LA CLASE" icon={<Play size={20} />} defaultExpanded>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label className="text-xs sm:text-sm" style={{ fontWeight: 600, color: 'var(--ink2)' }}>Secuencia didáctica completa</label>
            <button
              className="small secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader size={12} className="spin" /> : <Sparkles size={12} />} Generar con IA
            </button>
          </div>
          <textarea
            className="output p-3 sm:p-4 lg:p-5"
            value={estructuraClase}
            onChange={handleChange(setEstructuraClase, 'inicio')}
            style={{ minHeight: 460, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff', color: '#000000', border: 'none', borderRadius: 0 }}
            placeholder={`### INICIO (10-15 min)\nActivación de conocimientos previos…\n\n### DESARROLLO (25-30 min)\nEstrategias de enseñanza…\n\n### CIERRE (5-10 min)\nTicket de salida…`}
          />
        </CollapsibleSection>

        <div className="flex items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl bg-gray-50/80 border border-gray-100 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">¿Necesitas complementar este plan?</span>
          <div className="flex items-center gap-2">
            <button className="small secondary" onClick={() => onNavigate?.('banco-recursos')}>
              Ir a Banco de Recursos
            </button>
            <button className="small secondary" onClick={() => onNavigate?.('evaluaciones')}>
              Crear evaluación
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1 flex-wrap">
          <button className="secondary" onClick={handleSaveToLibrary} disabled={isSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600 }}>
            {isSaving ? <Loader size={14} className="spin" /> : <Plus size={14} />} {isSaving ? 'Guardando planificación…' : 'Guardar en Banco de Recursos'}
          </button>
          <button className="secondary" onClick={handleSharePlan} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600 }}>
            <Share2 size={14} /> Compartir planificación
          </button>
        </div>

        {shareResult && (
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShareResult(null)}>
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 animate-fadeIn" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Share2 size={18} className="text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Planificación compartida</h3>
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
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${shareResult.copied ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                >
                  {shareResult.copied ? <><Check size={12} className="inline mr-1" />Copiado</> : 'Copiar'}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShareResult(null); onNavigate?.('panel-compartido'); }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all"
                >
                  Abrir Panel Compartido
                </button>
                <button
                  onClick={() => setShareResult(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
