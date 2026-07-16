import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, BookOpenCheck, BookMarked, CalendarDays, ChevronLeft, ChevronRight,
  Clock, FileDown, GraduationCap, ListChecks, Loader2, Plus, Printer,
  Save, Sparkles, Trash2, X,
} from 'lucide-react';
import { getCourses, getIndicatorsByObjective, getObjectives, getSkillsByObjective, getSubjectsByCourse } from '../services/curriculumD1Service';
import { useConfigOptions } from '../hooks/useConfigOptions';
import {
  autosaveLesson, createLesson, createNonTeachingBlock, createSchedule, createTeacherClass,
  deleteNonTeachingBlock, deleteTeacherClass, generateActividadesClase,
  generateLessonEvaluation, generateLessonResource, getCalendar, getLesson,
  getNonTeachingBlocks, listTeacherClasses, updateLesson, updateNonTeachingBlock,
  type GenerateActividadesResult, type LessonBundle, type LessonInstance, type NonTeachingBlock, type TeacherClass,
} from '../services/misClasesService';
import { saveToBank, resourceTypeLabel, isEvaluationType, type SourceTab } from '../services/bankService';
import { api } from '../services/apiClient';
import { normalizeProductContent } from '../utils/productNormalizer';
import { Card } from './ui/Card';
import { SectionHeader } from './ui/SectionHeader';
import { useActiveLesson } from '../contexts/ActiveLessonContext';
import { useAuth } from '../contexts/AuthContext';
import { classbookService } from '../services/classbookService';
import { canCreateSession } from '../utils/classbookPermissions';

type RightTab = 'semana' | 'clase' | 'curriculum' | 'recursos' | 'evaluacion' | 'ntb';

const RIGHT_TABS: { id: RightTab; label: string }[] = [
  { id: 'semana', label: 'Semana' },
  { id: 'clase', label: 'Clase' },
  { id: 'curriculum', label: 'Curriculo' },
  { id: 'recursos', label: 'Recursos IA' },
  { id: 'evaluacion', label: 'Evaluacion' },
  { id: 'ntb', label: 'Bloques no lectivos' },
];

type DetailTab = 'oa' | 'indicadores' | 'metodologia' | 'pregunta' | 'abp' | 'inicio' | 'desarrollo' | 'cierre' | 'recursos' | 'evaluacion' | 'adjuntos' | 'comentarios';

const FIELD_BY_TAB: Partial<Record<DetailTab, keyof LessonBundle['plan']>> = {
  pregunta: 'challenge_question', abp: 'abp_project_text', inicio: 'beginning_text',
  desarrollo: 'development_text', cierre: 'closure_text', recursos: 'resources_text',
  evaluacion: 'evaluation_text', comentarios: 'teacher_observations',
};

const WEEKDAYS = [{ n: 1, label: 'Lunes' }, { n: 2, label: 'Martes' }, { n: 3, label: 'Miercoles' }, { n: 4, label: 'Jueves' }, { n: 5, label: 'Viernes' }];
const NON_TEACHING_TYPES = [
  { value: 'planificacion', label: 'Planificacion' }, { value: 'preparacion', label: 'Preparacion de material' },
  { value: 'evaluacion', label: 'Revision de evaluaciones' }, { value: 'reunion', label: 'Reunion de departamento' },
  { value: 'consejo', label: 'Consejo de profesores' }, { value: 'pie', label: 'Reunion PIE / Convivencia' },
  { value: 'apoderados', label: 'Atencion de apoderados' }, { value: 'entrevista', label: 'Entrevista con estudiantes' },
  { value: 'capacitacion', label: 'Capacitacion' }, { value: 'colaboracion', label: 'Trabajo colaborativo' },
  { value: 'administrativo', label: 'Tareas administrativas' },
  { value: 'reemplazo', label: 'Reemplazo / Coordinacion especial' }, { value: 'otro', label: 'Otro' },
];
const PRIORITY_OPTIONS = [{ value: 'baja', label: 'Baja' }, { value: 'media', label: 'Media' }, { value: 'alta', label: 'Alta' }];
const METHODOLOGY_OPTIONS = [
  { value: '', label: 'Selecciona metodologia' },
  { value: 'abp', label: 'Aprendizaje basado en proyectos' },
  { value: 'cooperativo', label: 'Aprendizaje cooperativo' },
  { value: 'indagacion', label: 'Indagacion' },
  { value: 'explicita', label: 'Clase explicita' },
  { value: 'aula_invertida', label: 'Aula invertida' },
  { value: 'dua', label: 'Diseno universal para el aprendizaje' },
  { value: 'formativa', label: 'Evaluacion formativa' },
  { value: 'estaciones', label: 'Estaciones de aprendizaje' },
  { value: 'semilleros', label: 'Semilleros de investigacion' },
  { value: 'otro', label: 'Otra metodologia' },
];
const AI_PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Gemini',
  'workers-ai': 'Workers AI',
  openrouter: 'OpenRouter',
  huggingface: 'Hugging Face',
  local: 'modo local',
};
const NTB_FORM_DEFAULT = {
  non_teaching_type: 'planificacion', title: '', description: '', block_date: todayDate(),
  start_time: '08:00', end_time: '09:00', location: '', priority: 'media',
  reminder_enabled: false, reminder_minutes_before: 30, reminder_email: '', follow_up_notes: '',
};

function todayDate() { return new Date().toISOString().slice(0, 10); }
function mondayOf(dateText = todayDate()) {
  const d = new Date(`${dateText}T12:00:00`); const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); return d.toISOString().slice(0, 10);
}
function addDays(dateText: string, days: number) {
  const d = new Date(`${dateText}T12:00:00`); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
}
function parseJsonList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string' || !value.trim()) return [];
  try { const p = JSON.parse(value); return Array.isArray(p) ? p.map(String) : []; } catch { return []; }
}
function displayText(value: unknown) { return typeof value === 'string' ? value : value == null ? '' : String(value); }
function providerLabel(value: unknown) { return AI_PROVIDER_LABELS[displayText(value)] || displayText(value) || 'IA'; }
function hoursBetween(s: string, e: string) { const [sh, sm] = s.split(':').map(Number); const [eh, em] = e.split(':').map(Number); return (eh * 60 + em) - (sh * 60 + sm); }
function fmtH(total: number) { const h = Math.floor(total / 60); const m = total % 60; return total > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : '0h'; }

const LC = 'block text-[11px] font-black tracking-wide uppercase text-slate-500 mb-1';
const IC = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all';

export function MisClases() {
  const { user } = useAuth();
  const { getOptions } = useConfigOptions();
  const cfgMethodologies = getOptions('methodologies');
  const cfgNtbTypes = getOptions('non_teaching_types');
  const cfgPriorities = getOptions('priorities');
  const cfgWeekdays = getOptions('weekdays');
  const [schoolYear, setSchoolYear] = useState(String(new Date().getFullYear()));
  const [levelId, setLevelId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [week, setWeek] = useState(mondayOf());
  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [calendar, setCalendar] = useState<LessonInstance[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [selectedBundle, setSelectedBundle] = useState<LessonBundle | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>('semana');
  const [detailTab, setDetailTab] = useState<DetailTab>('oa');
  const [selectedObjective, setSelectedObjective] = useState<any | null>(null);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [attitudes, setAttitudes] = useState<string[]>([]);
  const [methodologyId, setMethodologyId] = useState('');
  const [lessonCurriculum, setLessonCurriculum] = useState<{
    levelId: string; subjectId: string; objectiveId: string;
    indicatorIds: string[]; skillIds: string[]; attitudeIds: string[]; methodologyId: string;
  }>({ levelId: '', subjectId: '', objectiveId: '', indicatorIds: [], skillIds: [], attitudeIds: [], methodologyId: '' });
  const [lcSubjects, setLcSubjects] = useState<any[]>([]);
  const [lcSubjectsLoading, setLcSubjectsLoading] = useState(false);
  const [lcObjectives, setLcObjectives] = useState<any[]>([]);
  const [lcObjectivesLoading, setLcObjectivesLoading] = useState(false);
  const [lcContext, setLcContext] = useState<any>(null);
  const [lcContextLoading, setLcContextLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [ntbBlocks, setNtbBlocks] = useState<NonTeachingBlock[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showNtbForm, setShowNtbForm] = useState(false);
  const [ntbForm, setNtbForm] = useState(NTB_FORM_DEFAULT);
  const [editingNtb, setEditingNtb] = useState<NonTeachingBlock | null>(null);
  const [blockType, setBlockType] = useState<'lectivo' | 'no_lectivo' | 'reemplazo'>('lectivo');
  const [instructions, setInstructions] = useState('');
  const [replacementDoc, setReplacementDoc] = useState('');
  const [replacementObs, setReplacementObs] = useState('');
  const [draftLesson, setDraftLesson] = useState({ title: '', lesson_date: todayDate(), start_time: '08:00', end_time: '09:00', notes: '' });
  const [scheduleForm, setScheduleForm] = useState({ class_id: '', weekday: '1', start_time: '08:30', end_time: '10:00', room: '', starts_on: mondayOf(), ends_on: '', repeats_weekly: true });
  const autosaveTimer = useRef<number | null>(null);
  const lastAutosave = useRef('');
  const [bankResources, setBankResources] = useState<any[]>([]);
  const [bankRefreshKey, setBankRefreshKey] = useState(0);
  const [sendingToClassbook, setSendingToClassbook] = useState(false);
  const { setCurriculum } = useActiveLesson();

  const selectedClass = useMemo(() => classes.find((c) => c.id === scheduleForm.class_id) || classes[0], [classes, scheduleForm.class_id]);

  const loadFilters = useCallback(async () => {
    const loadedCourses = await getCourses(); setCourses(loadedCourses);
  }, []);

  const loadMain = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { school_year: schoolYear, level_id: levelId, subject_id: subjectId };
      const [classRes, calRes, ntbRes] = await Promise.all([listTeacherClasses(params), getCalendar(week), getNonTeachingBlocks(week).catch(() => ({ data: [] }))]);
      setClasses(classRes.data || []); setCalendar(calRes.data || []); setNtbBlocks(ntbRes.data || []);
      if (!scheduleForm.class_id && classRes.data?.[0]?.id) setScheduleForm((prev) => ({ ...prev, class_id: classRes.data[0].id }));
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar Mis Clases.'); }
    finally { setLoading(false); }
  }, [schoolYear, levelId, subjectId, week]);

  useEffect(() => { void loadFilters(); }, [loadFilters]);
  useEffect(() => { void loadMain(); }, [loadMain]);
  useEffect(() => {
    if (!selectedLessonId) return;
    getLesson(selectedLessonId).then((r) => {
      setSelectedBundle(r.data);
      const cur = r.data.curriculum || {};
      const meth = String(cur.methodology_id || '');
      setMethodologyId(METHODOLOGY_OPTIONS.some((m) => m.value === meth) ? meth : '');
    }).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo abrir la clase.'));
  }, [selectedLessonId]);
  useEffect(() => {
    if (!selectedBundle) return; const cur = selectedBundle.curriculum || {};
    setLessonCurriculum({
      levelId: String(cur.level_id || selectedBundle.lesson?.level_id || ''),
      subjectId: String(cur.subject_id || selectedBundle.lesson?.subject_id || ''),
      objectiveId: String(cur.objective_id || ''),
      indicatorIds: parseJsonList(cur.indicator_ids_json || cur.indicatorIds),
      skillIds: parseJsonList(cur.skill_ids_json || cur.skillIds),
      attitudeIds: parseJsonList(cur.attitude_ids_json || cur.attitudeIds),
      methodologyId: String(cur.methodology_id || ''),
    });
    if (cur.objectiveInfo) {
      setSelectedObjective(cur.objectiveInfo);
    } else if (cur.objective_id) {
      setSelectedObjective({ id: cur.objective_id, code: cur.objective_id, official_text: '' });
    } else {
      setSelectedObjective(null);
    }
  }, [selectedLessonId]);
  useEffect(() => {
    if (!lessonCurriculum.levelId) { setLcSubjects([]); return; }
    setLcSubjectsLoading(true);
    getSubjectsByCourse(lessonCurriculum.levelId).then(setLcSubjects).catch(() => setLcSubjects([])).finally(() => setLcSubjectsLoading(false));
  }, [lessonCurriculum.levelId]);
  useEffect(() => {
    if (!lessonCurriculum.levelId || !lessonCurriculum.subjectId) { setLcObjectives([]); return; }
    setLcObjectivesLoading(true);
    getObjectives(lessonCurriculum.levelId, lessonCurriculum.subjectId).then(setLcObjectives).catch(() => setLcObjectives([])).finally(() => setLcObjectivesLoading(false));
  }, [lessonCurriculum.levelId, lessonCurriculum.subjectId]);
  useEffect(() => {
    if (!lessonCurriculum.objectiveId) { setLcContext(null); return; }
    setLcContextLoading(true);
    fetch(`/api/curriculum/context?objective_id=${encodeURIComponent(lessonCurriculum.objectiveId)}`).then((r) => r.json()).then((d) => setLcContext(d?.data || null)).catch(() => setLcContext(null)).finally(() => setLcContextLoading(false));
  }, [lessonCurriculum.objectiveId]);
  useEffect(() => {
    if (!lessonCurriculum.objectiveId || !selectedObjective) return;
    if (indicators.length > 0 && skills.length > 0) return;
    const oaCode = selectedObjective.code || lessonCurriculum.objectiveId;
    const objId = selectedObjective.id || lessonCurriculum.objectiveId;
    Promise.all([
      getIndicatorsByObjective(oaCode).catch(() => []),
      getSkillsByObjective(objId).catch(() => []),
    ]).then(([loadedInd, loadedSk]) => {
      if (loadedInd.length > 0 && indicators.length === 0) setIndicators(loadedInd);
      if (loadedSk.length > 0 && skills.length === 0) setSkills(loadedSk);
    });
  }, [lessonCurriculum.objectiveId, selectedObjective?.id]);

  // Sync curriculum to ActiveLessonContext so Copilot/DUA can read it
  useEffect(() => {
    if (!lessonCurriculum.levelId) return;
    const levelName = courses.find(c => c.id === lessonCurriculum.levelId)?.name || '';
    const subjectName = lcSubjects.find(s => s.id === lessonCurriculum.subjectId)?.name || '';
    const obj = selectedObjective;
    setCurriculum({
      level: levelName,
      levelId: lessonCurriculum.levelId,
      subject: subjectName,
      subjectId: lessonCurriculum.subjectId,
      objectiveId: obj?.id || lessonCurriculum.objectiveId || '',
      objectiveCode: obj?.code || obj?.codigo_oa || lessonCurriculum.objectiveId || '',
      objectiveText: obj?.official_text || obj?.descripcion || '',
      indicators: indicators.map(i => typeof i === 'string' ? i : i.description || i.indicator_text || ''),
      skills: skills.map(s => typeof s === 'string' ? s : s.official_text || s.description || ''),
      criteria: [],
      curricularSkills: [],
    });
  }, [lessonCurriculum.levelId, lessonCurriculum.subjectId, lessonCurriculum.objectiveId, selectedObjective, indicators, skills, courses, lcSubjects, setCurriculum]);

  useEffect(() => {
    if (!selectedLessonId) { setBankResources([]); return; }
    api.get<{ data: any[] }>('/api/resources').then((res) => {
      const all = res.data || [];
      const filtered = all.filter((r: any) => {
        try {
          const meta = JSON.parse(r.metadata_json || '{}');
          return meta.lessonId === selectedLessonId;
        } catch { return false; }
      });
      setBankResources(filtered);
    }).catch(() => setBankResources([]));
  }, [selectedLessonId, bankRefreshKey]);

  const openLesson = async (lesson: LessonInstance) => {
    if (lesson.is_virtual) {
      const created = await createLesson({ class_id: lesson.class_id, schedule_slot_id: lesson.schedule_slot_id, lesson_date: lesson.lesson_date, start_time: lesson.start_time, end_time: lesson.end_time, title: lesson.title, status: lesson.status, notes: lesson.notes || '' });
      setSelectedLessonId(created.data.id); setRightTab('clase'); await loadMain(); return;
    }
    setSelectedLessonId(lesson.id); setRightTab('clase');
  };

  const handleNewClass = () => {
    setSelectedLessonId(''); setSelectedBundle(null); setSelectedObjective(null);
    setLessonCurriculum({ levelId: '', subjectId: '', objectiveId: '', indicatorIds: [], skillIds: [], attitudeIds: [], methodologyId: '' });
    setMethodologyId(''); setInstructions(''); setReplacementDoc(''); setReplacementObs('');
    setBlockType('lectivo'); setDetailTab('oa');
    setDraftLesson({ title: '', lesson_date: todayDate(), start_time: '08:00', end_time: '09:00', notes: '' });
  };

  const handleSaveClass = async () => {
    if (blockType === 'no_lectivo') {
      if (!ntbForm.title.trim()) { setError('Ingresa un titulo para el bloque no lectivo.'); return; }
      setSavingState('saving'); setError('');
      try {
        await createNonTeachingBlock(ntbForm);
        setToast('Bloque no lectivo creado y agregado al calendario.');
        setSavingState('saved'); setNtbForm(NTB_FORM_DEFAULT); await loadMain();
        setTimeout(() => setToast(''), 3000);
      } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar el bloque.'); setSavingState('error'); }
      return;
    }

    const title = selectedBundle?.plan?.title || selectedBundle?.lesson?.title || draftLesson.title;
    const lessonDate = selectedBundle?.lesson?.lesson_date || draftLesson.lesson_date;
    const startTime = selectedBundle?.lesson?.start_time || draftLesson.start_time;
    const endTime = selectedBundle?.lesson?.end_time || draftLesson.end_time;

    if (!title.trim()) { setError('Ingresa un nombre para la clase.'); return; }
    if (!lessonDate) { setError('Selecciona fecha.'); return; }
    if (!startTime || !endTime) { setError('Selecciona hora de inicio y termino.'); return; }
    if (blockType === 'lectivo' && (!lessonCurriculum.levelId || !lessonCurriculum.subjectId)) { setError('Selecciona nivel y asignatura para bloque lectivo.'); return; }

    setSavingState('saving'); setError('');
    try {
      let classId = scheduleForm.class_id || selectedClass?.id || '';

      if (!classId) {
        const teacherClassPayload = {
          school_year: Number(schoolYear), level_id: lessonCurriculum.levelId || levelId || '',
          subject_id: lessonCurriculum.subjectId || subjectId || '',
          course_name: title, class_name: title, color: '#6d28d9',
        };
        const createdClass = await createTeacherClass(teacherClassPayload);
        classId = createdClass.data?.id || (createdClass as any).id;
        if (!classId) throw new Error('No se recibio id de teacher_class');
        setScheduleForm((prev) => ({ ...prev, class_id: classId }));
      }

      const notes = blockType === 'reemplazo' ? `Reemplazo: ${replacementDoc}. ${replacementObs}` : draftLesson.notes || instructions;
      const lessonPayload = {
        class_id: classId, lesson_date: lessonDate, start_time: startTime, end_time: endTime,
        title, status: 'planificada', notes,
      };
      const createdLesson = await createLesson(lessonPayload);
      const lessonId = createdLesson.data?.id || (createdLesson as any).id;
      if (!lessonId) throw new Error('No se recibio id de lesson');

      if (lessonCurriculum.objectiveId) {
        try {
          await autosaveLesson(lessonId, { curriculum: { levelId: lessonCurriculum.levelId, subjectId: lessonCurriculum.subjectId, objectiveId: lessonCurriculum.objectiveId, indicatorIds: lessonCurriculum.indicatorIds, skillIds: lessonCurriculum.skillIds, attitudeIds: lessonCurriculum.attitudeIds, methodologyId: lessonCurriculum.methodologyId } });
        } catch (curErr) { console.error('[handleSaveClass] curriculum save failed:', curErr); }
      }

      const loaded = await getLesson(lessonId);
      setSelectedLessonId(lessonId);
      setSelectedBundle(loaded.data);
      setRightTab('clase');
      setWeek(mondayOf(lessonDate));
      setToast('Clase guardada y agregada al calendario semanal.');
      setSavingState('saved');
      setDraftLesson({ title: '', lesson_date: todayDate(), start_time: '08:00', end_time: '09:00', notes: '' });
      await loadMain();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error('[handleSaveClass] ERROR:', err);
      setError(err instanceof Error ? err.message : 'No se pudo guardar la clase.');
      setSavingState('error');
    }
  };

  const handleCreateSchedule = async () => {
    setSavingState('saving'); setError('');
    try {
      let classId = scheduleForm.class_id || selectedClass?.id || '';
      if (!classId) {
        const title = lessonCurriculum.levelId ? `${courses.find((c) => c.id === lessonCurriculum.levelId)?.name || 'Curso'} - Clase recurrente` : 'Clase recurrente';
        const created = await createTeacherClass({
          school_year: Number(schoolYear), level_id: lessonCurriculum.levelId || '',
          subject_id: lessonCurriculum.subjectId || '',
          course_name: title, class_name: title, color: '#2563eb',
        });
        classId = created.data.id;
        setScheduleForm((prev) => ({ ...prev, class_id: classId }));
      }
      await createSchedule({ ...scheduleForm, class_id: classId, weekday: Number(scheduleForm.weekday) });
      setToast('Horario semanal creado y agregado al calendario.');
      setSavingState('saved'); setShowScheduleForm(false); await loadMain();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el horario.');
      setSavingState('error');
    }
  };

  const handleCreateNtb = async () => {
    if (!ntbForm.title.trim()) { setError('El titulo es requerido.'); return; }
    try {
      if (editingNtb) { await updateNonTeachingBlock(editingNtb.id, ntbForm); setToast('Bloque no lectivo actualizado.'); }
      else { await createNonTeachingBlock(ntbForm); setToast('Bloque no lectivo creado y agregado al calendario.'); }
      setShowNtbForm(false); setEditingNtb(null); setNtbForm(NTB_FORM_DEFAULT); await loadMain();
      setTimeout(() => setToast(''), 3000);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar el bloque.'); }
  };

  const handleEditNtb = (block: NonTeachingBlock) => {
    setEditingNtb(block);
    setNtbForm({ non_teaching_type: block.non_teaching_type || 'otro', title: block.title, description: block.description || '', block_date: block.block_date, start_time: block.start_time, end_time: block.end_time, location: block.location || '', priority: block.priority || 'media', reminder_enabled: !!block.reminder_enabled, reminder_minutes_before: block.reminder_minutes_before || 30, reminder_email: block.reminder_email || '', follow_up_notes: block.follow_up_notes || '' });
    setShowNtbForm(true);
  };

  const handleDeleteNtb = async (id: string) => { if (!confirm('Eliminar este bloque no lectivo?')) return; await deleteNonTeachingBlock(id); setToast('Bloque eliminado.'); await loadMain(); };
  const handleToggleNtbDone = async (block: NonTeachingBlock) => { await updateNonTeachingBlock(block.id, { status: block.status === 'realizado' ? 'pendiente' : 'realizado' }); await loadMain(); };

  const handleSendToClassbook = async () => {
    if (!selectedBundle?.lesson?.id) return;
    if (!canCreateSession(user)) { setError('No tienes permiso para crear sesiones en el Libro de Clases.'); return; }
    setSendingToClassbook(true); setError('');
    try {
      await classbookService.createClassSessionFromLesson(selectedBundle.lesson.id);
      setToast('Clase enviada al Libro de Clases exitosamente.');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo enviar al Libro de Clases.';
      if (msg.includes('409') || msg.includes('ya existe') || msg.includes('already')) {
        setToast('Esta clase ya fue enviada al Libro de Clases.');
      } else {
        setError(msg);
      }
    } finally { setSendingToClassbook(false); }
  };

  const saveFields = useCallback((fields: Record<string, unknown>, curriculum?: Record<string, unknown>) => {
    if (!selectedLessonId) return;
    const sig = JSON.stringify({ fields, curriculum }); if (sig === lastAutosave.current) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); setSavingState('saving');
    autosaveTimer.current = window.setTimeout(async () => {
      try { await autosaveLesson(selectedLessonId, curriculum ? { fields, curriculum } : { fields }); lastAutosave.current = sig; setSavingState('saved'); }
      catch { setSavingState('error'); }
    }, 1000);
  }, [selectedLessonId]);

  const updatePlanField = (field: keyof LessonBundle['plan'], value: string) => { setSelectedBundle((p) => p ? { ...p, plan: { ...p.plan, [field]: value } } : p); saveFields({ [field]: value }); };

  const updateLessonCurriculum = (patch: Partial<typeof lessonCurriculum>) => {
    setLessonCurriculum((prev) => {
      const next = { ...prev, ...patch };
      if (patch.levelId !== undefined && patch.levelId !== prev.levelId) { next.subjectId = ''; next.objectiveId = ''; next.indicatorIds = []; next.skillIds = []; next.attitudeIds = []; }
      if (patch.subjectId !== undefined && patch.subjectId !== prev.subjectId) { next.objectiveId = ''; next.indicatorIds = []; next.skillIds = []; next.attitudeIds = []; }
      if (!selectedLessonId) return next; saveFields({}, { curriculum: next }); return next;
    });
  };

  const updateLessonField = (fields: Record<string, string>) => {
    setSelectedBundle((p) => p ? { ...p, lesson: { ...p.lesson, ...fields } } : p);
    if (!selectedLessonId) return; setSavingState('saving');
    updateLesson(selectedLessonId, fields).then(() => setSavingState('saved')).catch(() => setSavingState('error'));
  };

  const handleObjectiveSelect = async (objectiveId: string) => {
    const objective = lcObjectives.find((oa) => oa.id === objectiveId); if (!objective || !selectedBundle?.plan?.id) return;
    setSelectedObjective(objective);
    const [loadedIndicators, loadedSkills] = await Promise.all([getIndicatorsByObjective(objective.code), getSkillsByObjective(objective.id)]);
    const loadedAttitudes = parseJsonList(objective.attitude_tags_json);
    setIndicators(loadedIndicators); setSkills(loadedSkills); setAttitudes(loadedAttitudes);
    setLessonCurriculum((prev) => { const next = { ...prev, objectiveId: objective.id, indicatorIds: loadedIndicators.map((i) => i.id), skillIds: loadedSkills.map((s) => s.id), attitudeIds: loadedAttitudes }; if (!selectedLessonId) return next; saveFields({ objective_text: objective.official_text || objective.normalized_text || objective.code }, { curriculum: next }); return next; });
    setToast('OA conectado a la clase');
  };

  const generate = async (action: string, kind: 'resource' | 'evaluation' | 'presentation' = 'resource') => {
    const ok = Boolean(selectedLessonId && lessonCurriculum.levelId && lessonCurriculum.subjectId);
    if (!ok) { setError('Selecciona nivel y asignatura antes de generar con IA'); setRightTab('clase'); setDetailTab('oa'); return; }
    setLoading(true); setError('');
    try {
      const result = kind === 'evaluation' ? await generateLessonEvaluation(selectedLessonId, action) : await generateLessonResource(selectedLessonId, action);
      const provider = providerLabel(result?.provider);
      const warnings = result?.warnings || [];
      const resourceData = result?.data;
      const rawContent = resourceData?.content
        ? (typeof resourceData.content === 'string' ? resourceData.content : JSON.stringify(resourceData.content, null, 2))
        : '';
      const content = rawContent ? normalizeProductContent(rawContent, action).rawMarkdown : '';

      if (content && selectedLessonId) {
        const sourceTab: SourceTab = kind === 'evaluation' ? 'evaluacion' : 'recursos_ia';
        const title = `${resourceTypeLabel(action)} — ${selectedObjective?.code || 'OA'} — ${lessonCurriculum.levelId} ${lessonCurriculum.subjectId}`;
        const bankResult = await saveToBank({
          title,
          type: action,
          content,
          source: 'mis_clases',
          sourceTab,
          lessonId: selectedLessonId,
          classId: selectedClass?.id,
          classTitle: selectedClass?.class_name || '',
          level: lessonCurriculum.levelId,
          subject: lessonCurriculum.subjectId,
          objectiveCode: selectedObjective?.code || '',
          objectiveText: selectedObjective?.official_text || '',
          generatedWith: result?.provider || 'local',
          warnings,
        });
        if (bankResult) setBankRefreshKey((k) => k + 1);
        const bankMsg = bankResult ? ' y guardado en Banco de Recursos' : ' (no se pudo guardar en Banco de Recursos)';
        let msg = '';
        if (provider === 'modo local') {
          msg = hasOA ? `${resourceTypeLabel(action)} generado con modo local${bankMsg}.` : `${resourceTypeLabel(action)} generado con modo local. Selecciona un OA para mayor precision.`;
        } else {
          msg = `${resourceTypeLabel(action)} generado con ${provider}${bankMsg}.`;
        }
        if (warnings.length) msg += ` Advertencias: ${warnings.slice(0, 2).join('; ')}`;
        setToast(msg);
      } else {
        let msg = '';
        if (provider === 'modo local') {
          msg = hasOA ? `Recurso generado con modo local (contexto D1: ${selectedObjective?.code || 'OA'}).` : 'Recurso generado con modo local. Selecciona un OA para mayor precision.';
        } else {
          msg = `Recurso guardado con ${provider}.`;
        }
        if (warnings.length) msg += ` Advertencias: ${warnings.slice(0, 2).join('; ')}`;
        setToast(msg);
      }
      const r = await getLesson(selectedLessonId); setSelectedBundle(r.data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo generar el recurso.';
      if (msg.includes('HTML') || msg.includes('Worker')) {
        setError('No se pudo generar el recurso. Verifica que la clase tenga nivel y asignatura configurados.');
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  const hasOA = Boolean(lessonCurriculum.objectiveId);

  const handleGenerateActividades = async (force = false) => {
    if (!selectedLessonId) return;
    setLoading(true); setError('');
    try {
      const res = await generateActividadesClase(selectedLessonId, { force, instructions });
      if (!res.ok && res.error === 'replace_required') {
        if (!confirm(res.message || 'Esta clase ya tiene actividades generadas. Deseas reemplazarlas?')) { setLoading(false); return; }
        const res2 = await generateActividadesClase(selectedLessonId, { force: true, instructions });
        if (!res2.ok) throw new Error(res2.message || 'No se pudieron generar las actividades.');
        refreshBundle(res2);
        saveActividadesToBank(res2);
      } else if (!res.ok) {
        throw new Error(res.message || 'No se pudieron generar las actividades.');
      } else {
        refreshBundle(res);
        saveActividadesToBank(res);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron generar las actividades.'); }
    finally { setLoading(false); }
  };

  const saveActividadesToBank = async (result: GenerateActividadesResult) => {
    if (!selectedLessonId || !result.ok) return;
    try {
      const d = result.data as Record<string, unknown>;
      const plan = d.plan as Record<string, unknown> | undefined;
      const sections: string[] = [];
      if (plan?.beginning_text) sections.push(`## Inicio\n${plan.beginning_text}`);
      if (plan?.development_text) sections.push(`## Desarrollo\n${plan.development_text}`);
      if (plan?.closure_text) sections.push(`## Cierre\n${plan.closure_text}`);
      if (plan?.evaluation_text) sections.push(`## Evaluación\n${plan.evaluation_text}`);
      if (plan?.instruments_text) sections.push(`## Instrumentos\n${plan.instruments_text}`);
      if (plan?.dua_adjustments_text) sections.push(`## Adecuaciones DUA\n${plan.dua_adjustments_text}`);
      const content = sections.join('\n\n') || JSON.stringify(d, null, 2);
      if (!content.trim()) return;
      const title = `Planificación de clase — ${selectedObjective?.code || 'OA'} — ${lessonCurriculum.levelId} ${lessonCurriculum.subjectId}`;
      await saveToBank({
        title,
        type: 'planificacion_clase',
        content,
        source: 'mis_clases',
        sourceTab: 'actividades',
        lessonId: selectedLessonId,
        classId: selectedClass?.id,
        classTitle: selectedClass?.class_name || '',
        level: lessonCurriculum.levelId,
        subject: lessonCurriculum.subjectId,
        objectiveCode: selectedObjective?.code || '',
        objectiveText: selectedObjective?.official_text || '',
        generatedWith: result.provider || 'local',
        warnings: result.warnings,
      });
      setBankRefreshKey((k) => k + 1);
      setToast('Planificación generada y guardada en Banco de Recursos.');
    } catch (err) {
      console.error('[saveActividadesToBank] error:', err);
    }
  };

  const refreshBundle = async (result?: GenerateActividadesResult) => {
    try {
      const r = await getLesson(selectedLessonId!);
      setSelectedBundle(r.data);
      let msg = 'Actividades de clase generadas.';
      if (result?.provider && result.provider !== 'local') {
        const providerLabel: Record<string, string> = { gemini: 'Gemini', 'workers-ai': 'Workers AI', openrouter: 'OpenRouter', huggingface: 'Hugging Face' };
        msg = `Generado con ${providerLabel[result.provider] || result.provider}.`;
      } else if (result?.usedFallback || result?.provider === 'local') {
        msg = hasOA ? `Modo local activo (contexto D1: ${selectedObjective?.code || 'OA'}).` : 'Modo local activo. Conecta una API IA para mejorar la calidad.';
      }
      if (hasOA) msg += ` Alineado al ${selectedObjective?.code || 'OA'}.`;
      setToast(msg);
      setTimeout(() => setToast(''), 5000);
    } catch { /* ignore */ }
  };
  const lessonsByDay = useMemo(() => WEEKDAYS.map((day, i) => { const date = addDays(week, i); return { ...day, date, lessons: calendar.filter((l) => l.lesson_date === date), nteaching: ntbBlocks.filter((b) => b.block_date === date) }; }), [calendar, ntbBlocks, week]);
  const totalTeachingMin = useMemo(() => calendar.reduce((s, l) => s + hoursBetween(l.start_time, l.end_time), 0), [calendar]);
  const totalNonTeachingMin = useMemo(() => ntbBlocks.reduce((s, b) => s + hoursBetween(b.start_time, b.end_time), 0), [ntbBlocks]);
  const totalMin = totalTeachingMin + totalNonTeachingMin;
  const teachPct = totalMin > 0 ? Math.round((totalTeachingMin / totalMin) * 100) : 0;
  const fieldForTab = FIELD_BY_TAB[detailTab];

  return (<div className="max-w-[1440px] mx-auto animate-fade-in pb-10">
    <SectionHeader icon={BookOpen} iconColor="#5F3475" title="Mis Clases" description="Organiza tu horario docente, planifica clases y conecta recursos al curriculo chileno." />

    {(toast || error || savingState !== 'idle') && (<div className={`mb-4 rounded-2xl border px-4 py-3 text-sm flex items-center justify-between ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
      <span>{error || toast || (savingState === 'saving' ? 'Guardando...' : savingState === 'saved' ? 'Guardado automaticamente' : savingState === 'error' ? 'No se pudo guardar; se reintentara al editar.' : '')}</span>
      <button onClick={() => { setError(''); setToast(''); }} className="ml-2 p-1 rounded-lg hover:bg-white/50"><X size={14} /></button>
    </div>)}

    <div className="flex flex-col xl:flex-row gap-5">
      <aside className="w-full xl:w-[380px] xl:min-w-[380px] shrink-0">
        <Card className="space-y-4 xl:sticky xl:top-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Sparkles size={16} className="text-violet-600" /> Configurar Clase</div>
            <button onClick={handleNewClass} className="inline-flex items-center gap-1 rounded-xl bg-violet-100 text-violet-700 px-3 py-1.5 text-xs font-bold hover:bg-violet-200 transition-all"><Plus size={12} /> Nueva</button>
          </div>

          <div><label className={LC}>Tipo de bloque</label><div className="flex gap-2">{(['lectivo', 'no_lectivo', 'reemplazo'] as const).map((t) => (<button key={t} onClick={() => setBlockType(t)} className={`flex-1 rounded-2xl px-3 py-2 text-xs font-bold transition-all ${blockType === t ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t === 'lectivo' ? 'Lectivo' : t === 'no_lectivo' ? 'No lectivo' : 'Reemplazo'}</button>))}</div></div>

          <div className="space-y-3">
            <label className={LC}>Nombre de la clase<input value={selectedBundle?.plan?.title || selectedBundle?.lesson?.title || draftLesson.title} onChange={(e) => { if (selectedBundle) updatePlanField('title', e.target.value); else setDraftLesson((p) => ({ ...p, title: e.target.value })); }} placeholder="Ej: Lenguaje 4A - Taller de lectura" className={IC} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className={LC}>Fecha<input type="date" value={selectedBundle?.lesson?.lesson_date || draftLesson.lesson_date} onChange={(e) => { if (selectedBundle) updateLessonField({ lesson_date: e.target.value }); else setDraftLesson((p) => ({ ...p, lesson_date: e.target.value })); }} className={IC} /></label>
              <div />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={LC}>Inicio<input type="time" value={selectedBundle?.lesson?.start_time || draftLesson.start_time} onChange={(e) => { if (selectedBundle) updateLessonField({ start_time: e.target.value }); else setDraftLesson((p) => ({ ...p, start_time: e.target.value })); }} className={IC} /></label>
              <label className={LC}>Termino<input type="time" value={selectedBundle?.lesson?.end_time || draftLesson.end_time} onChange={(e) => { if (selectedBundle) updateLessonField({ end_time: e.target.value }); else setDraftLesson((p) => ({ ...p, end_time: e.target.value })); }} className={IC} /></label>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-[11px] font-black tracking-wide uppercase text-violet-600">Curriculo</p>
            <label className={LC}>Nivel educativo<select value={lessonCurriculum.levelId} onChange={(e) => updateLessonCurriculum({ levelId: e.target.value })} className={IC}><option value="">Selecciona nivel</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className={LC}>Asignatura<select value={lessonCurriculum.subjectId} onChange={(e) => updateLessonCurriculum({ subjectId: e.target.value })} disabled={!lessonCurriculum.levelId || lcSubjectsLoading} className={`${IC} disabled:bg-slate-100 disabled:text-slate-400`}><option value="">{lcSubjectsLoading ? 'Cargando...' : 'Selecciona asignatura'}</option>{lcSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label className={LC}>Objetivo Curricular OA (opcional)<select value={lessonCurriculum.objectiveId} onChange={(e) => updateLessonCurriculum({ objectiveId: e.target.value })} disabled={!lessonCurriculum.subjectId || lcObjectivesLoading} className={`${IC} disabled:bg-slate-100 disabled:text-slate-400`}><option value="">{lcObjectivesLoading ? 'Cargando...' : 'Selecciona OA (opcional)'}</option>{lcObjectives.map((oa) => <option key={oa.id} value={oa.id}>{oa.code} - {oa.official_text}</option>)}</select></label>
            <label className={LC}>Metodologia<select value={methodologyId} onChange={(e) => { setMethodologyId(e.target.value); updateLessonCurriculum({ methodologyId: e.target.value }); }} className={IC}>{(cfgMethodologies.length > 0 ? cfgMethodologies : METHODOLOGY_OPTIONS).map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
          </div>

          {blockType === 'no_lectivo' && (<div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-[11px] font-black tracking-wide uppercase text-amber-600">Bloque no lectivo</p>
            <label className={LC}>Tipo de actividad<select value={ntbForm.non_teaching_type} onChange={(e) => setNtbForm((p) => ({ ...p, non_teaching_type: e.target.value }))} className={IC}>{(cfgNtbTypes.length > 0 ? cfgNtbTypes : NON_TEACHING_TYPES).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
            <label className={LC}>Prioridad<select value={ntbForm.priority} onChange={(e) => setNtbForm((p) => ({ ...p, priority: e.target.value }))} className={IC}>{(cfgPriorities.length > 0 ? cfgPriorities : PRIORITY_OPTIONS).map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={ntbForm.reminder_enabled} onChange={(e) => setNtbForm((p) => ({ ...p, reminder_enabled: e.target.checked }))} className="rounded" /> Activar recordatorio futuro</label>
            {ntbForm.reminder_enabled && (<><label className={LC}>Minutos antes<input type="number" min={5} max={1440} value={ntbForm.reminder_minutes_before} onChange={(e) => setNtbForm((p) => ({ ...p, reminder_minutes_before: Number(e.target.value) }))} className={IC} /></label><label className={LC}>Correo destinatario<input type="email" value={ntbForm.reminder_email} onChange={(e) => setNtbForm((p) => ({ ...p, reminder_email: e.target.value }))} placeholder="profesor@correo.cl" className={IC} /></label></>)}
            <label className={LC}>Notas<textarea value={ntbForm.follow_up_notes} onChange={(e) => setNtbForm((p) => ({ ...p, follow_up_notes: e.target.value }))} rows={2} className={IC} /></label>
            <p className="text-[11px] text-amber-600 italic">Los recordatorios por correo quedan preparados para una proxima fase.</p>
          </div>)}

          {blockType === 'reemplazo' && (<div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-[11px] font-black tracking-wide uppercase text-blue-600">Reemplazo</p>
            <label className={LC}>Docente reemplazado<input value={replacementDoc} onChange={(e) => setReplacementDoc(e.target.value)} placeholder="Nombre del docente" className={IC} /></label>
            <label className={LC}>Observacion<textarea value={replacementObs} onChange={(e) => setReplacementObs(e.target.value)} rows={2} placeholder="Indicaciones para el reemplazo" className={IC} /></label>
          </div>)}

          <div className="border-t border-slate-100 pt-4">
            <label className={LC}>Instrucciones adicionales<textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder="Ej: Enfatizar problemas cotidianos, trabajo colaborativo, evaluacion formativa..." className={IC} /></label>
          </div>

          <div className="space-y-2 pt-2">
            <button onClick={handleSaveClass} disabled={savingState === 'saving'} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-white font-bold shadow-md shadow-violet-900/10 hover:shadow-lg transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {savingState === 'saving' ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><Save size={14} /> {selectedLessonId ? 'Actualizar clase' : 'Guardar clase'}</>}
            </button>
            <button onClick={() => setShowScheduleForm(true)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><CalendarDays size={14} /> Horario semanal</button>
          </div>
        </Card>
      </aside>

      <div className="flex-1 min-w-0"><Card className="min-h-[600px]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex gap-1 overflow-x-auto pb-1">{RIGHT_TABS.map((tab) => (<button key={tab.id} onClick={() => setRightTab(tab.id)} className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-bold transition-all ${rightTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{tab.label}</button>))}</div>
          <div className="flex gap-2"><button onClick={() => window.print()} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1"><Printer size={12} /> Imprimir</button><button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1"><FileDown size={12} /> Exportar</button></div>
        </div>

        {/* TAB: Semana */}
        {rightTab === 'semana' && (<div>
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="font-black text-slate-900">Calendario semanal</h2><p className="text-xs text-slate-500">{week} al {addDays(week, 4)}</p></div>
            <div className="flex gap-2"><button onClick={() => setWeek(addDays(week, -7))} className="rounded-xl border px-3 py-2"><ChevronLeft size={16} /></button><button onClick={() => setWeek(mondayOf())} className="rounded-xl border px-3 py-2 text-sm font-bold">Hoy</button><button onClick={() => setWeek(addDays(week, 7))} className="rounded-xl border px-3 py-2"><ChevronRight size={16} /></button></div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-2 mb-4 text-xs font-bold text-slate-600">
            {fmtH(totalTeachingMin + totalNonTeachingMin)} totales &middot; {fmtH(totalTeachingMin)} lectivas &middot; {fmtH(totalNonTeachingMin)} no lectivas &middot; {teachPct}% lectivo
          </div>
          {calendar.length === 0 && ntbBlocks.length === 0 && !loading && (
            <div className="rounded-2xl bg-violet-50 border border-violet-100 p-8 text-center mb-4">
              <CalendarDays size={32} className="mx-auto text-violet-400 mb-3" />
              <h3 className="font-black text-slate-900">Sin bloques programados</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">Crea una clase, horario semanal o bloque no lectivo desde el panel izquierdo para comenzar.</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {lessonsByDay.map((day) => (<div key={day.date} className="min-h-[220px] rounded-2xl bg-slate-50 border border-slate-100 p-3">
              <p className="font-black text-slate-800">{day.label}</p><p className="text-xs text-slate-400 mb-3">{day.date}</p>
              <div className="space-y-2">
                {day.lessons.map((lesson) => (<button key={lesson.id} onClick={() => void openLesson(lesson)} className="w-full text-left rounded-2xl p-3 text-white shadow-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: lesson.color || '#2563eb' }}>
                  <p className="text-xs font-bold flex items-center gap-1"><Clock size={12} /> {lesson.start_time}-{lesson.end_time}</p>
                  <p className="mt-1 font-black text-sm">{lesson.class_name || lesson.title}</p>
                  <p className="text-xs opacity-85">{lesson.course_name} &middot; {lesson.status}</p>
                </button>))}
                {day.nteaching.map((block) => (<div key={block.id} className={`w-full text-left rounded-2xl p-3 border-2 ${block.status === 'realizado' ? 'border-emerald-300 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold flex items-center gap-1 text-amber-700"><Clock size={12} /> {block.start_time}-{block.end_time}</p>
                    <div className="flex gap-1">
                      <button onClick={() => handleToggleNtbDone(block)} title={block.status === 'realizado' ? 'Marcar pendiente' : 'Marcar realizado'} className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${block.status === 'realizado' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>{block.status === 'realizado' ? 'OK' : 'Pend'}</button>
                      <button onClick={() => handleEditNtb(block)} className="rounded-lg bg-white border px-1.5 py-0.5 text-[10px] font-bold text-slate-600">Edit</button>
                      <button onClick={() => void handleDeleteNtb(block.id)} className="rounded-lg bg-white border px-1.5 py-0.5 text-[10px] font-bold text-red-600">x</button>
                    </div>
                  </div>
                  <p className="mt-1 font-black text-sm text-slate-800">{block.title}</p>
                  <p className="text-[11px] text-slate-500">{NON_TEACHING_TYPES.find((t) => t.value === block.non_teaching_type)?.label || block.non_teaching_type}{block.location ? ` - ${block.location}` : ''}</p>
                  {block.reminder_enabled === 1 && <p className="text-[10px] text-amber-600 mt-0.5">Recordatorio preparado</p>}
                </div>))}
                {day.lessons.length === 0 && day.nteaching.length === 0 && <p className="text-xs text-slate-400">Sin bloques.</p>}
              </div>
            </div>))}
          </div>
        </div>)}

        {/* TAB: Clase */}
        {rightTab === 'clase' && (<div>
          {!selectedBundle ? (<div className="flex flex-col items-center justify-center min-h-[400px] text-center text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-3 text-violet-600"><BookOpenCheck size={24} /></div>
            <h3 className="font-black text-slate-900">Selecciona o crea una clase para planificar.</h3>
            <p className="mt-1 max-w-sm text-sm">Haz clic en un bloque del calendario o crea una nueva clase desde el panel izquierdo.</p>
          </div>) : (<div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div><p className="text-xs font-bold text-violet-600">Detalle de clase</p><h3 className="font-black text-slate-900 text-lg">{selectedBundle.plan?.title || selectedBundle.lesson.title}</h3><p className="text-sm text-slate-500">{selectedBundle.lesson.lesson_date} &middot; {selectedBundle.lesson.start_time}-{selectedBundle.lesson.end_time}</p></div>
              <div className="flex items-center gap-2 text-sm text-slate-500">{savingState === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{savingState === 'saving' ? 'Guardando...' : savingState === 'saved' ? 'Guardado automaticamente' : 'Borrador'}</div>
            </div>

            {canCreateSession(user) && selectedBundle?.lesson?.id && (
              <div className="mb-4">
                <button onClick={() => void handleSendToClassbook()} disabled={sendingToClassbook} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-50">
                  {sendingToClassbook ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={14} />}
                  {sendingToClassbook ? 'Enviando...' : 'Enviar al Libro de Clases'}
                </button>
              </div>
            )}

            {/* RESUMEN: Datos de clase */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-5">
              <h4 className="text-xs font-black tracking-wide uppercase text-slate-500 mb-3">Datos de clase</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-[11px] font-bold text-slate-400 uppercase">Curso</span><p className="font-semibold text-slate-800">{courses.find((c) => c.id === lessonCurriculum.levelId)?.name || lessonCurriculum.levelId || '-'}</p></div>
                <div><span className="text-[11px] font-bold text-slate-400 uppercase">Asignatura</span><p className="font-semibold text-slate-800">{lcSubjects.find((s) => s.id === lessonCurriculum.subjectId)?.name || lessonCurriculum.subjectId || '-'}</p></div>
                <div><span className="text-[11px] font-bold text-slate-400 uppercase">OA</span><p className="font-semibold text-slate-800">{lessonCurriculum.objectiveId ? lcObjectives.find((o) => o.id === lessonCurriculum.objectiveId)?.code || 'Seleccionado' : <span className="text-slate-400 italic">Opcional</span>}</p></div>
                <div><span className="text-[11px] font-bold text-slate-400 uppercase">Metodologia</span><p className="font-semibold text-slate-800">{METHODOLOGY_OPTIONS.find((m) => m.value === methodologyId)?.label || '-'}</p></div>
              </div>
            </div>

            {/* SECCION: Actividades de clase */}
            <div className="rounded-2xl border border-violet-200 bg-violet-50/30 p-5 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-lg flex items-center gap-2"><BookOpen size={18} className="text-violet-600" /> Actividades de clase</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Momentos pedagogicos: Inicio, Desarrollo, Cierre y componentes complementarios.</p>
                </div>
                <button disabled={loading} onClick={() => void handleGenerateActividades()} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-white text-sm font-bold shadow-md shadow-violet-900/10 hover:shadow-lg transition-all disabled:opacity-50">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Generar actividades de clase
                </button>
              </div>

              {/* Sub-tabs de actividades */}
              <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
                {(['oa', 'inicio', 'desarrollo', 'cierre', 'metodologia', 'comentarios'] as DetailTab[]).map((t) => (<button key={t} onClick={() => setDetailTab(t)} className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${detailTab === t ? 'bg-violet-100 text-violet-700' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>{t === 'oa' ? 'OA' : t === 'inicio' ? 'Inicio' : t === 'desarrollo' ? 'Desarrollo' : t === 'cierre' ? 'Cierre' : t === 'metodologia' ? 'Metodologia' : 'Comentarios'}</button>))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
                <div className="rounded-2xl bg-white p-4 min-h-[280px] border border-slate-100">
                  {detailTab === 'oa' && (<div className="space-y-4">
                    <h3 className="font-black text-slate-900">Objetivo Curricular (opcional)</h3>
                    <select value={lessonCurriculum.objectiveId} onChange={(e) => { updateLessonCurriculum({ objectiveId: e.target.value }); const oa = lcObjectives.find((o) => o.id === e.target.value); if (oa) { setSelectedObjective(oa); void handleObjectiveSelect(e.target.value); } }} className={IC}>
                      <option value="">Selecciona un OA</option>
                      {lcObjectives.map((oa) => <option key={oa.id} value={oa.id}>{oa.code} - {oa.official_text}</option>)}
                    </select>
                    <textarea value={selectedBundle.plan?.objective_text || ''} onChange={(e) => updatePlanField('objective_text', e.target.value)} placeholder="Objetivo especifico de la clase" className="w-full min-h-[110px] rounded-2xl border border-slate-200 p-3 text-sm" />
                    <textarea value={selectedBundle.plan?.purpose_text || ''} onChange={(e) => updatePlanField('purpose_text', e.target.value)} placeholder="Proposito de la clase" className="w-full min-h-[90px] rounded-2xl border border-slate-200 p-3 text-sm" />
                  </div>)}
                  {detailTab === 'metodologia' && (<div className="space-y-3"><h3 className="font-black text-slate-900">Metodologia sugerida</h3>
                    <select value={methodologyId} onChange={(e) => { setMethodologyId(e.target.value); updateLessonCurriculum({ methodologyId: e.target.value }); }} className={IC}>{(cfgMethodologies.length > 0 ? cfgMethodologies : METHODOLOGY_OPTIONS).map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
                    <p className="text-xs text-slate-500">Selecciona una metodologia del curriculo chileno.</p></div>)}
                  {fieldForTab && detailTab !== 'oa' && detailTab !== 'metodologia' && (<textarea value={displayText(selectedBundle.plan?.[fieldForTab])} onChange={(e) => updatePlanField(fieldForTab, e.target.value)} className="w-full min-h-[260px] rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed shadow-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100" placeholder={`Escribe o genera contenido para ${detailTab}`} />)}
                </div>
                <aside className="rounded-2xl border border-violet-100 p-4 bg-violet-50/50">
                  <h3 className="font-black text-slate-900 flex items-center gap-2"><Sparkles size={18} /> IA integrada</h3>
                  <p className="mt-1 text-xs text-slate-500">Genera actividades completas o por separado. Seleccionar OA mejora la alineacion curricular.</p>
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <button disabled={loading} onClick={() => void handleGenerateActividades()} className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 text-left text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                      <Sparkles size={12} /> Generar actividades de clase
                    </button>
                    <div className="border-t border-violet-100 my-1" />
                    {[['Generar inicio', 'inicio', 'resource'], ['Generar desarrollo', 'desarrollo', 'resource'], ['Generar cierre', 'cierre', 'resource']].map(([label, action, kind]) => (
                      <button key={action} disabled={loading} onClick={() => void generate(String(action), kind as any)} className="rounded-xl bg-white border border-violet-100 px-3 py-2 text-left text-xs font-bold text-violet-700 hover:bg-violet-600 hover:text-white transition-colors disabled:opacity-50">{label}</button>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => { const plan = selectedBundle?.plan; if (!plan) return; const text = [plan.objective_text, plan.purpose_text, plan.beginning_text, plan.development_text, plan.closure_text, plan.evaluation_text, plan.instruments_text].filter(Boolean).join('\n\n'); navigator.clipboard.writeText(text); setToast('Actividades copiadas al portapapeles.'); setTimeout(() => setToast(''), 3000); }} className="flex-1 rounded-xl bg-white border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all">Copiar</button>
                    <button onClick={() => window.print()} className="flex-1 rounded-xl bg-white border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all">Imprimir</button>
                  </div>
                  <div className="mt-5 space-y-2"><h4 className="text-xs font-black text-slate-500 uppercase">Generados</h4>
                    {[...(selectedBundle.resources || []), ...(selectedBundle.evaluations || [])].slice(0, 6).map((item) => (<div key={String(item.id)} className="rounded-xl bg-white p-3 text-xs border border-slate-100"><p className="font-bold text-slate-800">{displayText(item.title)}</p><p className="text-emerald-600">Guardado con {providerLabel(item.ai_provider || item.provider)}</p></div>))}
                  </div>
                </aside>
              </div>
            </div>
          </div>)}
        </div>)}

        {/* TAB: Curriculo */}
        {rightTab === 'curriculum' && (<div>
          <div className="space-y-4">
            <h3 className="font-black text-slate-900 text-lg">Clase conectada al curriculo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[['Nivel', lessonCurriculum.levelId ? courses.find((c) => c.id === lessonCurriculum.levelId)?.name || lessonCurriculum.levelId : '-'], ['Asignatura', lessonCurriculum.subjectId ? lcSubjects.find((s) => s.id === lessonCurriculum.subjectId)?.name || lessonCurriculum.subjectId : '-'], ['OA', lessonCurriculum.objectiveId ? lcObjectives.find((o) => o.id === lessonCurriculum.objectiveId)?.official_text || lessonCurriculum.objectiveId : 'OA opcional'], ['Metodologia', METHODOLOGY_OPTIONS.find((m) => m.value === methodologyId)?.label || '-']].map(([label, value]) => (<div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-3"><p className="text-xs font-black text-slate-400 uppercase">{label}</p><p className="text-sm font-semibold text-slate-700 mt-1">{value}</p></div>))}
            </div>
            {!lessonCurriculum.objectiveId && lessonCurriculum.levelId && lessonCurriculum.subjectId && (
              <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 text-center">
                <p className="text-sm text-violet-700">Selecciona un OA en el panel izquierdo para enriquecer el contexto curricular.</p>
              </div>
            )}
            {lcContext && (<div className="space-y-3">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3"><p className="text-xs font-black text-slate-400 uppercase">Eje</p><p className="text-sm text-slate-700 mt-1">{lcContext.axis_name || '-'}</p></div>
              {lcContext.indicators?.length > 0 && (<div><p className="text-xs font-black text-slate-400 uppercase mb-2">Indicadores ({lcContext.indicators.length})</p><div className="flex flex-wrap gap-1">{lcContext.indicators.map((i: any, idx: number) => (<span key={idx} className="rounded-lg bg-violet-100 text-violet-700 px-2 py-1 text-[11px] font-bold">{i.description}</span>))}</div></div>)}
              {lcContext.skills?.length > 0 && (<div><p className="text-xs font-black text-slate-400 uppercase mb-2">Habilidades ({lcContext.skills.length})</p><div className="flex flex-wrap gap-1">{lcContext.skills.map((s: any, idx: number) => (<span key={idx} className="rounded-lg bg-emerald-100 text-emerald-700 px-2 py-1 text-[11px] font-bold">{s.description}</span>))}</div></div>)}
              {attitudes.length > 0 && (<div><p className="text-xs font-black text-slate-400 uppercase mb-2">Actitudes</p><div className="flex flex-wrap gap-1">{attitudes.map((a, idx) => (<span key={idx} className="rounded-lg bg-amber-100 text-amber-700 px-2 py-1 text-[11px] font-bold">{a}</span>))}</div></div>)}
            </div>)}
            {lcContextLoading && <p className="text-xs text-violet-500">Cargando contexto curricular...</p>}
          </div>
        </div>)}

        {/* TAB: Recursos IA */}
        {rightTab === 'recursos' && (<div>
          <div className="space-y-4">
            <h3 className="font-black text-slate-900 text-lg">Recursos con IA</h3>
            <p className="text-sm text-slate-500">{hasOA ? 'Cada recurso usa el contexto curricular guardado: nivel, asignatura y OA seleccionados.' : 'Genera recursos usando nivel y asignatura. Seleccionar OA mejora la alineacion curricular.'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[['Guia de aprendizaje', 'guia', 'resource'], ['Ficha de trabajo', 'ficha_trabajo', 'resource'], ['Actividad pedagogica', 'actividad_pedagogica', 'resource'], ['Recurso DUA', 'recurso_dua', 'resource'], ['Reforzamiento', 'reforzamiento', 'resource'], ['Extension para avanzados', 'extension_avanzados', 'resource'], ['Material para apoderados', 'material_apoderados', 'resource'], ['Banco de preguntas', 'banco_preguntas', 'resource'], ['Crear presentacion', 'presentation', 'presentation'], ['Crear ticket de salida', 'ticket', 'evaluation']].map(([label, action, kind]) => (
                <button key={action} disabled={loading} onClick={() => void generate(String(action), kind as any)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-violet-300 hover:bg-violet-50 transition-all disabled:opacity-50"><p className="text-sm font-bold text-slate-800">{label}</p><p className="text-xs text-slate-500 mt-1">{hasOA ? 'Genera con contexto D1' : 'Genera con curso y asignatura'}</p></button>
              ))}
            </div>

            {bankResources.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookMarked size={16} className="text-emerald-600" />
                  <h4 className="font-black text-slate-900 text-sm">Recursos guardados de esta clase ({bankResources.length})</h4>
                </div>
                <div className="space-y-2">
                  {bankResources.slice(0, 8).map((r: any) => {
                    let meta: Record<string, string> = {};
                    try { meta = JSON.parse(r.metadata_json || '{}'); } catch {}
                    return (
                      <div key={r.id} className="rounded-xl bg-white border border-emerald-100 p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{r.title}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {meta.sourceTab && <span className="rounded-md bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[10px] font-bold">{meta.sourceTab === 'recursos_ia' ? 'Recursos IA' : meta.sourceTab === 'evaluacion' ? 'Evaluacion' : meta.sourceTab === 'actividades' ? 'Actividades' : meta.sourceTab}</span>}
                            {r.type && <span className="rounded-md bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[10px] font-bold">{r.type}</span>}
                            {meta.generatedWith && <span className="rounded-md bg-violet-100 text-violet-700 px-1.5 py-0.5 text-[10px] font-bold">{meta.generatedWith}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => { navigator.clipboard.writeText(r.content); setToast('Copiado al portapapeles.'); setTimeout(() => setToast(''), 2000); }} className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50">Copiar</button>
                          <button onClick={() => setToast('Abre Banco de Recursos desde el menú lateral para ver todos los recursos.')} className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700">Banco</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>)}

        {/* TAB: Evaluacion */}
        {rightTab === 'evaluacion' && (<div>
          <div className="space-y-4">
            <h3 className="font-black text-slate-900 text-lg">Evaluaciones con IA</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[['Crear evaluacion', 'evaluacion', 'evaluation'], ['Crear rubrica', 'rubrica', 'evaluation'], ['Crear pauta', 'pauta', 'evaluation'], ['Crear evaluacion tipo SIMCE', 'simce', 'evaluation'], ['Crear retroalimentacion', 'retroalimentacion', 'evaluation']].map(([label, action, kind]) => (
                <button key={action} disabled={loading} onClick={() => void generate(String(action), kind as any)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-violet-300 hover:bg-violet-50 transition-all disabled:opacity-50"><p className="text-sm font-bold text-slate-800">{label}</p><p className="text-xs text-slate-500 mt-1">{hasOA ? 'Basado en el OA seleccionado' : 'Genera con curso y asignatura'}</p></button>
              ))}
            </div>
          </div>
        </div>)}

        {/* TAB: Bloques no lectivos */}
        {rightTab === 'ntb' && (<div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-900 text-lg">Bloques no lectivos</h3>
            <button onClick={() => { setEditingNtb(null); setNtbForm(NTB_FORM_DEFAULT); setShowNtbForm(true); }} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 text-white px-4 py-2 text-xs font-bold"><Plus size={14} /> Nuevo bloque</button>
          </div>
          <p className="text-xs text-slate-500 mb-4">Los recordatorios por correo quedan preparados para una proxima fase.</p>
          {ntbBlocks.length === 0 ? (<div className="flex flex-col items-center justify-center min-h-[300px] text-center text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-3 text-amber-500"><Clock size={24} /></div>
            <h3 className="font-black text-slate-900">No hay bloques no lectivos esta semana.</h3>
            <p className="text-sm text-slate-500 mt-1">Crea uno desde el panel izquierdo o este boton.</p>
          </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ntbBlocks.map((block) => (<div key={block.id} className={`rounded-2xl border p-4 ${block.status === 'realizado' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-white border">{NON_TEACHING_TYPES.find((t) => t.value === block.non_teaching_type)?.label || block.non_teaching_type}</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${block.priority === 'alta' ? 'bg-red-100 text-red-700' : block.priority === 'media' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{block.priority}</span>
              </div>
              <h4 className="font-black text-slate-900 text-sm">{block.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{block.block_date} &middot; {block.start_time}-{block.end_time}</p>
              {block.location && <p className="text-xs text-slate-400 mt-0.5">{block.location}</p>}
              {block.reminder_enabled === 1 && <p className="text-[10px] text-amber-600 mt-1 font-bold">Recordatorio preparado ({block.reminder_minutes_before} min antes)</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleToggleNtbDone(block)} className={`rounded-xl px-3 py-1 text-[11px] font-bold ${block.status === 'realizado' ? 'bg-emerald-200 text-emerald-800' : 'bg-white border text-slate-600'}`}>{block.status === 'realizado' ? 'Desmarcar' : 'Hecho'}</button>
                <button onClick={() => handleEditNtb(block)} className="rounded-xl bg-white border px-3 py-1 text-[11px] font-bold text-slate-600">Editar</button>
                <button onClick={() => void handleDeleteNtb(block.id)} className="rounded-xl bg-white border px-3 py-1 text-[11px] font-bold text-red-600">Eliminar</button>
              </div>
            </div>))}
          </div>)}
        </div>)}
      </Card></div>
    </div>

    {/* MODAL: Horario semanal */}
    {showScheduleForm && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-900 text-lg">Crear horario semanal</h3>
          <button onClick={() => setShowScheduleForm(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={LC}>Dia de la semana<select value={scheduleForm.weekday} onChange={(e) => setScheduleForm((p) => ({ ...p, weekday: e.target.value }))} className={IC}>{(cfgWeekdays.length > 0 ? cfgWeekdays : WEEKDAYS.map(d => ({ id: String(d.n), value: String(d.n), label: d.label }))).map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></label>
          <label className={LC}>Sala / Lugar<input value={scheduleForm.room} onChange={(e) => setScheduleForm((p) => ({ ...p, room: e.target.value }))} placeholder="Sala opcional" className={IC} /></label>
          <label className={LC}>Hora inicio<input type="time" value={scheduleForm.start_time} onChange={(e) => setScheduleForm((p) => ({ ...p, start_time: e.target.value }))} className={IC} /></label>
          <label className={LC}>Hora termino<input type="time" value={scheduleForm.end_time} onChange={(e) => setScheduleForm((p) => ({ ...p, end_time: e.target.value }))} className={IC} /></label>
          <label className={LC}>Desde<input type="date" value={scheduleForm.starts_on} onChange={(e) => setScheduleForm((p) => ({ ...p, starts_on: e.target.value }))} className={IC} /></label>
          <label className={LC}>Hasta (opcional)<input type="date" value={scheduleForm.ends_on} onChange={(e) => setScheduleForm((p) => ({ ...p, ends_on: e.target.value }))} className={IC} /></label>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm font-bold text-slate-600"><input type="checkbox" checked={scheduleForm.repeats_weekly} onChange={(e) => setScheduleForm((p) => ({ ...p, repeats_weekly: e.target.checked }))} /> Repetir semanalmente</label>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => void handleCreateSchedule()} className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-white font-bold text-sm">Guardar horario</button>
          <button onClick={() => setShowScheduleForm(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancelar</button>
        </div>
      </Card>
    </div>)}

    {/* MODAL: Bloque no lectivo */}
    {showNtbForm && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border-amber-200 bg-amber-50/50">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-black text-slate-900 text-lg">{editingNtb ? 'Editar bloque no lectivo' : 'Nuevo bloque no lectivo'}</h3><p className="text-xs text-slate-500 mt-0.5">Actividades del trabajo docente que no son clases lectivas.</p></div>
          <button onClick={() => { setShowNtbForm(false); setEditingNtb(null); }} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className={LC}>Tipo de actividad<select value={ntbForm.non_teaching_type} onChange={(e) => setNtbForm((p) => ({ ...p, non_teaching_type: e.target.value }))} className={IC}>{(cfgNtbTypes.length > 0 ? cfgNtbTypes : NON_TEACHING_TYPES).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
          <label className={LC}>Titulo<input value={ntbForm.title} onChange={(e) => setNtbForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ej: Reunion de departamento" className={IC} /></label>
          <label className={LC}>Lugar<input value={ntbForm.location} onChange={(e) => setNtbForm((p) => ({ ...p, location: e.target.value }))} placeholder="Sala, online, etc." className={IC} /></label>
          <label className={`${LC} sm:col-span-2 lg:col-span-3`}>Descripcion<textarea value={ntbForm.description} onChange={(e) => setNtbForm((p) => ({ ...p, description: e.target.value }))} rows={2} className={IC} /></label>
          <label className={LC}>Fecha<input type="date" value={ntbForm.block_date} onChange={(e) => setNtbForm((p) => ({ ...p, block_date: e.target.value }))} className={IC} /></label>
          <div className="grid grid-cols-2 gap-2"><label className={LC}>Inicio<input type="time" value={ntbForm.start_time} onChange={(e) => setNtbForm((p) => ({ ...p, start_time: e.target.value }))} className={IC} /></label><label className={LC}>Termino<input type="time" value={ntbForm.end_time} onChange={(e) => setNtbForm((p) => ({ ...p, end_time: e.target.value }))} className={IC} /></label></div>
          <label className={LC}>Prioridad<select value={ntbForm.priority} onChange={(e) => setNtbForm((p) => ({ ...p, priority: e.target.value }))} className={IC}>{(cfgPriorities.length > 0 ? cfgPriorities : PRIORITY_OPTIONS).map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mt-5"><input type="checkbox" checked={ntbForm.reminder_enabled} onChange={(e) => setNtbForm((p) => ({ ...p, reminder_enabled: e.target.checked }))} /> Activar recordatorio</label>
          {ntbForm.reminder_enabled && (<><label className={LC}>Minutos antes<input type="number" min={5} max={1440} value={ntbForm.reminder_minutes_before} onChange={(e) => setNtbForm((p) => ({ ...p, reminder_minutes_before: Number(e.target.value) }))} className={IC} /></label><label className={LC}>Correo destinatario<input type="email" value={ntbForm.reminder_email} onChange={(e) => setNtbForm((p) => ({ ...p, reminder_email: e.target.value }))} placeholder="profesor@correo.cl" className={IC} /></label></>)}
          <label className={`${LC} sm:col-span-2 lg:col-span-3`}>Notas de seguimiento<textarea value={ntbForm.follow_up_notes} onChange={(e) => setNtbForm((p) => ({ ...p, follow_up_notes: e.target.value }))} rows={2} className={IC} /></label>
        </div>
        <p className="mt-2 text-[11px] text-amber-700 italic">Los recordatorios por correo quedan preparados para una proxima fase.</p>
        <div className="mt-4 flex gap-3">
          <button onClick={handleCreateNtb} className="rounded-2xl bg-amber-600 px-5 py-2.5 text-white font-bold text-sm">{editingNtb ? 'Actualizar' : 'Crear bloque'}</button>
          <button onClick={() => { setShowNtbForm(false); setEditingNtb(null); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-bold text-sm text-slate-700">Cancelar</button>
        </div>
      </Card>
    </div>)}

    {classes.length > 0 && (<div className="mt-5"><Card><h3 className="font-black text-slate-900">Cursos</h3><div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">{classes.map((item) => (<div key={item.id} className="rounded-2xl border border-slate-100 p-4"><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><h4 className="mt-2 font-black text-slate-900">{item.class_name}</h4><p className="text-sm text-slate-500">{item.course_name}</p><button onClick={() => void deleteTeacherClass(item.id).then(loadMain)} className="mt-3 text-xs font-bold text-red-600 inline-flex gap-1 items-center"><Trash2 size={12} /> Quitar</button></div>))}</div></Card></div>)}
  </div>);
}
