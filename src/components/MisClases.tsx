import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BookOpen, BookOpenCheck, CalendarDays, CheckCircle, ChevronLeft, ChevronRight,
  Clock, FileDown, GraduationCap, ListChecks, Loader2, Paperclip, Plus, Printer,
  Save, Sparkles, Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getCourses, getIndicatorsByObjective, getObjectives, getSkillsByObjective, getSubjectsByCourse } from '../services/curriculumD1Service';
import {
  autosaveLesson, createLesson, createNonTeachingBlock, createSchedule, createTeacherClass,
  deleteLesson, deleteNonTeachingBlock, deleteTeacherClass, generateLessonEvaluation,
  generateLessonResource, getCalendar, getLesson, getNonTeachingBlocks, listTeacherClasses,
  updateLesson, updateNonTeachingBlock, type LessonBundle, type LessonInstance,
  type NonTeachingBlock, type TeacherClass,
} from '../services/misClasesService';
import { Card } from './ui/Card';
import { SectionHeader } from './ui/SectionHeader';

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
const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' }, { value: 'planificada', label: 'Planificada' },
  { value: 'en_preparacion', label: 'En preparacion' }, { value: 'realizada', label: 'Realizada' },
  { value: 'pendiente', label: 'Pendiente' },
];
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
function hoursBetween(s: string, e: string) { const [sh, sm] = s.split(':').map(Number); const [eh, em] = e.split(':').map(Number); return (eh * 60 + em) - (sh * 60 + sm); }
function fmtH(total: number) { const h = Math.floor(total / 60); const m = total % 60; return total > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : '0h'; }

const LC = 'block text-[11px] font-black tracking-wide uppercase text-slate-500 mb-1';
const IC = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all';

export function MisClases() {
  const [schoolYear, setSchoolYear] = useState(String(new Date().getFullYear()));
  const [levelId, setLevelId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [status, setStatus] = useState('');
  const [week, setWeek] = useState(mondayOf());
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [calendar, setCalendar] = useState<LessonInstance[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [selectedBundle, setSelectedBundle] = useState<LessonBundle | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>('semana');
  const [detailTab, setDetailTab] = useState<DetailTab>('oa');
  const [objectives, setObjectives] = useState<any[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<any | null>(null);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [attitudes, setAttitudes] = useState<string[]>([]);
  const [methodologyNotes, setMethodologyNotes] = useState('');
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
  const [showClassForm, setShowClassForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [classForm, setClassForm] = useState({ course_name: '', class_name: '', color: '#2563eb' });
  const [scheduleForm, setScheduleForm] = useState({ class_id: '', weekday: '1', start_time: '08:30', end_time: '10:00', room: '', starts_on: mondayOf(), ends_on: '', repeats_weekly: true });
  const [ntbBlocks, setNtbBlocks] = useState<NonTeachingBlock[]>([]);
  const [showNtbForm, setShowNtbForm] = useState(false);
  const [ntbForm, setNtbForm] = useState(NTB_FORM_DEFAULT);
  const [editingNtb, setEditingNtb] = useState<NonTeachingBlock | null>(null);
  const [blockType, setBlockType] = useState<'lectivo' | 'no_lectivo' | 'reemplazo'>('lectivo');
  const [instructions, setInstructions] = useState('');
  const [replacementDoc, setReplacementDoc] = useState('');
  const [replacementObs, setReplacementObs] = useState('');
  const autosaveTimer = useRef<number | null>(null);
  const lastAutosave = useRef('');

  const selectedClass = useMemo(() => classes.find((c) => c.id === scheduleForm.class_id) || classes[0], [classes, scheduleForm.class_id]);

  const loadFilters = useCallback(async () => {
    const loadedCourses = await getCourses(); setCourses(loadedCourses);
    const nextLevel = levelId || loadedCourses[0]?.id || '';
    if (!levelId && nextLevel) setLevelId(nextLevel);
  }, [levelId]);

  const loadMain = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { school_year: schoolYear, level_id: levelId, subject_id: subjectId, status };
      const [classRes, calRes, ntbRes] = await Promise.all([listTeacherClasses(params), getCalendar(week), getNonTeachingBlocks(week).catch(() => ({ data: [] }))]);
      setClasses(classRes.data || []); setCalendar(calRes.data || []); setNtbBlocks(ntbRes.data || []);
      if (!scheduleForm.class_id && classRes.data?.[0]?.id) setScheduleForm((prev) => ({ ...prev, class_id: classRes.data[0].id }));
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar Mis Clases.'); }
    finally { setLoading(false); }
  }, [schoolYear, levelId, subjectId, status, week, scheduleForm.class_id]);

  useEffect(() => { void loadFilters(); }, [loadFilters]);
  useEffect(() => { void loadMain(); }, [loadMain]);
  useEffect(() => {
    if (!selectedLessonId) return;
    getLesson(selectedLessonId).then((r) => { setSelectedBundle(r.data); setMethodologyNotes(''); })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo abrir la clase.'));
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
    if (!levelId) { setSubjects([]); setSubjectId(''); return; }
    setSubjectsLoading(true); setSubjectsError('');
    getSubjectsByCourse(levelId).then((items) => { setSubjects(items); setSubjectId((p) => items.some((s) => s.id === p) ? p : (items[0]?.id || '')); })
      .catch(() => { setSubjects([]); setSubjectId(''); setSubjectsError('Error al cargar asignaturas'); }).finally(() => setSubjectsLoading(false));
  }, [levelId]);
  useEffect(() => {
    if (!selectedBundle?.lesson?.level_id || !selectedBundle?.lesson?.subject_id) return;
    getObjectives(String(selectedBundle.lesson.level_id), String(selectedBundle.lesson.subject_id)).then(setObjectives).catch(() => setObjectives([]));
  }, [selectedBundle?.lesson?.level_id, selectedBundle?.lesson?.subject_id]);

  const openLesson = async (lesson: LessonInstance) => {
    if (lesson.is_virtual) {
      const created = await createLesson({ class_id: lesson.class_id, schedule_slot_id: lesson.schedule_slot_id, lesson_date: lesson.lesson_date, start_time: lesson.start_time, end_time: lesson.end_time, title: lesson.title, status: lesson.status, notes: lesson.notes || '' });
      setSelectedLessonId(created.data.id); setRightTab('clase'); await loadMain(); return;
    }
    setSelectedLessonId(lesson.id); setRightTab('clase');
  };

  const handleCreateClass = async () => {
    if (!levelId || !subjectId || !classForm.course_name || !classForm.class_name) { setError('Completa nivel, asignatura, curso y nombre de clase.'); return; }
    const created = await createTeacherClass({ school_year: Number(schoolYear), level_id: levelId, subject_id: subjectId, course_name: classForm.course_name, class_name: classForm.class_name, color: classForm.color });
    setToast('Clase creada'); setClassForm({ course_name: '', class_name: '', color: '#2563eb' }); setShowClassForm(false);
    setScheduleForm((prev) => ({ ...prev, class_id: created.data.id })); await loadMain();
  };

  const handleCreateSchedule = async () => {
    const classId = scheduleForm.class_id || selectedClass?.id || '';
    if (!classId) { setError('Crea o selecciona una clase antes de crear horario semanal.'); return; }
    if (!scheduleForm.repeats_weekly) {
      await createLesson({ class_id: classId, lesson_date: scheduleForm.starts_on, start_time: scheduleForm.start_time, end_time: scheduleForm.end_time, status: 'planificada', title: selectedClass?.class_name || 'Clase puntual', notes: scheduleForm.room ? `Sala: ${scheduleForm.room}` : '' });
      setToast('Clase puntual creada');
    } else { await createSchedule({ ...scheduleForm, class_id: classId, weekday: Number(scheduleForm.weekday) }); setToast('Horario semanal creado'); }
    setShowScheduleForm(false); await loadMain();
  };

  const handleCreateNtb = async () => {
    if (!ntbForm.title.trim()) { setError('El titulo es requerido.'); return; }
    try {
      if (editingNtb) { await updateNonTeachingBlock(editingNtb.id, ntbForm); setToast('Bloque no lectivo actualizado.'); }
      else { await createNonTeachingBlock(ntbForm); setToast('Bloque no lectivo creado.'); }
      setShowNtbForm(false); setEditingNtb(null); setNtbForm(NTB_FORM_DEFAULT); await loadMain();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar el bloque.'); }
  };

  const handleEditNtb = (block: NonTeachingBlock) => {
    setEditingNtb(block);
    setNtbForm({ non_teaching_type: block.non_teaching_type || 'otro', title: block.title, description: block.description || '', block_date: block.block_date, start_time: block.start_time, end_time: block.end_time, location: block.location || '', priority: block.priority || 'media', reminder_enabled: !!block.reminder_enabled, reminder_minutes_before: block.reminder_minutes_before || 30, reminder_email: block.reminder_email || '', follow_up_notes: block.follow_up_notes || '' });
    setShowNtbForm(true);
  };

  const handleDeleteNtb = async (id: string) => { if (!confirm('Eliminar este bloque no lectivo?')) return; await deleteNonTeachingBlock(id); setToast('Bloque eliminado.'); await loadMain(); };
  const handleToggleNtbDone = async (block: NonTeachingBlock) => { await updateNonTeachingBlock(block.id, { status: block.status === 'realizado' ? 'pendiente' : 'realizado' }); await loadMain(); };

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
    const objective = objectives.find((oa) => oa.id === objectiveId); if (!objective || !selectedBundle?.plan?.id) return;
    setSelectedObjective(objective);
    const [loadedIndicators, loadedSkills] = await Promise.all([getIndicatorsByObjective(objective.code), getSkillsByObjective(objective.id)]);
    const loadedAttitudes = parseJsonList(objective.attitude_tags_json);
    setIndicators(loadedIndicators); setSkills(loadedSkills); setAttitudes(loadedAttitudes);
    setLessonCurriculum((prev) => { const next = { ...prev, objectiveId: objective.id, indicatorIds: loadedIndicators.map((i) => i.id), skillIds: loadedSkills.map((s) => s.id), attitudeIds: loadedAttitudes }; if (!selectedLessonId) return next; saveFields({}, { curriculum: next }); return next; });
    saveFields({ objective_text: objective.official_text || objective.normalized_text || objective.code }, { level_id: selectedBundle.lesson.level_id || levelId, subject_id: selectedBundle.lesson.subject_id || subjectId, axis_id: objective.axis_id, objective_id: objective.id, indicatorIds: loadedIndicators.map((i) => i.id), skillIds: loadedSkills.map((s) => s.id), attitudeIds: loadedAttitudes });
    setToast('OA conectado a la clase');
  };

  const generate = async (action: string, kind: 'resource' | 'evaluation' | 'presentation' = 'resource') => {
    const ok = Boolean(selectedLessonId && lessonCurriculum.levelId && lessonCurriculum.subjectId && lessonCurriculum.objectiveId);
    if (!ok) { setError('Selecciona nivel, asignatura y OA antes de generar con IA'); setRightTab('clase'); setDetailTab('oa'); return; }
    setLoading(true);
    try {
      if (kind === 'evaluation') await generateLessonEvaluation(selectedLessonId, action); else await generateLessonResource(selectedLessonId, action);
      setToast('Recurso guardado automaticamente'); const r = await getLesson(selectedLessonId); setSelectedBundle(r.data);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo generar el recurso.'); } finally { setLoading(false); }
  };

  const hasOA = Boolean(lessonCurriculum.objectiveId);
  const lessonsByDay = useMemo(() => WEEKDAYS.map((day, i) => { const date = addDays(week, i); return { ...day, date, lessons: calendar.filter((l) => l.lesson_date === date), nteaching: ntbBlocks.filter((b) => b.block_date === date) }; }), [calendar, ntbBlocks, week]);
  const totalTeachingMin = useMemo(() => calendar.reduce((s, l) => s + hoursBetween(l.start_time, l.end_time), 0), [calendar]);
  const totalNonTeachingMin = useMemo(() => ntbBlocks.reduce((s, b) => s + hoursBetween(b.start_time, b.end_time), 0), [ntbBlocks]);
  const totalMin = totalTeachingMin + totalNonTeachingMin;
  const teachPct = totalMin > 0 ? Math.round((totalTeachingMin / totalMin) * 100) : 0;
  const fieldForTab = FIELD_BY_TAB[detailTab];

  return (<div className="max-w-[1440px] mx-auto animate-fade-in pb-10">
    <SectionHeader icon={BookOpen} iconColor="#5F3475" title="Mis Clases" description="Organiza tu horario docente, planifica clases y conecta recursos al curriculo chileno."
      action={<div className="flex gap-2">
        <button onClick={() => setShowClassForm(true)} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-2.5 text-sm font-bold shadow-md shadow-violet-900/10 hover:shadow-lg transition-all"><Plus size={16} /> Nueva clase</button>
        <button onClick={() => setShowScheduleForm(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"><CalendarDays size={16} /> Horario semanal</button>
        <button onClick={() => { setEditingNtb(null); setNtbForm(NTB_FORM_DEFAULT); setShowNtbForm(true); }} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"><Clock size={16} /> Bloque no lectivo</button>
      </div>} />

    {(toast || error || savingState !== 'idle') && (<div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
      {error || toast || (savingState === 'saving' ? 'Guardando...' : savingState === 'saved' ? 'Guardado automaticamente' : savingState === 'error' ? 'No se pudo guardar; se reintentara al editar.' : '')}
    </div>)}

    {(showClassForm || showScheduleForm) && (<div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {showClassForm && (<Card><h3 className="font-black text-slate-900">Nueva clase</h3><div className="mt-4 grid gap-3">
        <input value={classForm.course_name} onChange={(e) => setClassForm((p) => ({ ...p, course_name: e.target.value }))} placeholder="Curso, por ejemplo 4 Basico A" className={IC} />
        <input value={classForm.class_name} onChange={(e) => setClassForm((p) => ({ ...p, class_name: e.target.value }))} placeholder="Nombre, por ejemplo Lenguaje 4A" className={IC} />
        <input type="color" value={classForm.color} onChange={(e) => setClassForm((p) => ({ ...p, color: e.target.value }))} className="h-10 w-20 rounded-xl" />
        <button onClick={handleCreateClass} className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-white font-bold text-sm">Guardar clase</button>
      </div></Card>)}
      {showScheduleForm && (<Card><h3 className="font-black text-slate-900">Crear horario semanal</h3><div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={scheduleForm.class_id || selectedClass?.id || ''} onChange={(e) => setScheduleForm((p) => ({ ...p, class_id: e.target.value }))} className={`${IC} md:col-span-2`}>{classes.map((c) => <option key={c.id} value={c.id}>{c.class_name} - {c.course_name}</option>)}</select>
        <select value={scheduleForm.weekday} onChange={(e) => setScheduleForm((p) => ({ ...p, weekday: e.target.value }))} className={IC}>{WEEKDAYS.map((d) => <option key={d.n} value={d.n}>{d.label}</option>)}</select>
        <input value={scheduleForm.room} onChange={(e) => setScheduleForm((p) => ({ ...p, room: e.target.value }))} placeholder="Sala opcional" className={IC} />
        <input type="time" value={scheduleForm.start_time} onChange={(e) => setScheduleForm((p) => ({ ...p, start_time: e.target.value }))} className={IC} />
        <input type="time" value={scheduleForm.end_time} onChange={(e) => setScheduleForm((p) => ({ ...p, end_time: e.target.value }))} className={IC} />
        <input type="date" value={scheduleForm.starts_on} onChange={(e) => setScheduleForm((p) => ({ ...p, starts_on: e.target.value }))} className={IC} />
        <input type="date" value={scheduleForm.ends_on} onChange={(e) => setScheduleForm((p) => ({ ...p, ends_on: e.target.value }))} className={IC} />
        <label className="md:col-span-2 flex items-center gap-2 text-sm font-bold text-slate-600"><input type="checkbox" checked={scheduleForm.repeats_weekly} onChange={(e) => setScheduleForm((p) => ({ ...p, repeats_weekly: e.target.checked }))} /> Repetir semanalmente</label>
        <button onClick={handleCreateSchedule} className="md:col-span-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-white font-bold text-sm">Guardar horario</button>
      </div></Card>)}
    </div>)}

    {showNtbForm && (<div className="mt-4"><Card className="border-amber-200 bg-amber-50/50">
      <h3 className="font-black text-slate-900">{editingNtb ? 'Editar bloque no lectivo' : 'Nuevo bloque no lectivo'}</h3>
      <p className="text-xs text-slate-500 mt-1">Actividades del trabajo docente que no son clases lectivas.</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className={LC}>Tipo de actividad<select value={ntbForm.non_teaching_type} onChange={(e) => setNtbForm((p) => ({ ...p, non_teaching_type: e.target.value }))} className={IC}>{NON_TEACHING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
        <label className={LC}>Titulo<input value={ntbForm.title} onChange={(e) => setNtbForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ej: Reunion de departamento" className={IC} /></label>
        <label className={LC}>Lugar<input value={ntbForm.location} onChange={(e) => setNtbForm((p) => ({ ...p, location: e.target.value }))} placeholder="Sala, online, etc." className={IC} /></label>
        <label className={LC}>Descripcion<textarea value={ntbForm.description} onChange={(e) => setNtbForm((p) => ({ ...p, description: e.target.value }))} rows={2} className={IC} /></label>
        <label className={LC}>Fecha<input type="date" value={ntbForm.block_date} onChange={(e) => setNtbForm((p) => ({ ...p, block_date: e.target.value }))} className={IC} /></label>
        <div className="grid grid-cols-2 gap-2"><label className={LC}>Inicio<input type="time" value={ntbForm.start_time} onChange={(e) => setNtbForm((p) => ({ ...p, start_time: e.target.value }))} className={IC} /></label><label className={LC}>Termino<input type="time" value={ntbForm.end_time} onChange={(e) => setNtbForm((p) => ({ ...p, end_time: e.target.value }))} className={IC} /></label></div>
        <label className={LC}>Prioridad<select value={ntbForm.priority} onChange={(e) => setNtbForm((p) => ({ ...p, priority: e.target.value }))} className={IC}>{PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mt-5"><input type="checkbox" checked={ntbForm.reminder_enabled} onChange={(e) => setNtbForm((p) => ({ ...p, reminder_enabled: e.target.checked }))} /> Activar recordatorio</label>
        {ntbForm.reminder_enabled && (<><label className={LC}>Minutos antes<input type="number" min={5} max={1440} value={ntbForm.reminder_minutes_before} onChange={(e) => setNtbForm((p) => ({ ...p, reminder_minutes_before: Number(e.target.value) }))} className={IC} /></label><label className={LC}>Correo destinatario<input type="email" value={ntbForm.reminder_email} onChange={(e) => setNtbForm((p) => ({ ...p, reminder_email: e.target.value }))} placeholder="profesor@correo.cl" className={IC} /></label></>)}
        <label className={`${LC} md:col-span-3`}>Notas de seguimiento<textarea value={ntbForm.follow_up_notes} onChange={(e) => setNtbForm((p) => ({ ...p, follow_up_notes: e.target.value }))} rows={2} className={IC} /></label>
      </div>
      <p className="mt-2 text-[11px] text-amber-700 italic">Los recordatorios por correo quedan preparados para una proxima fase.</p>
      <div className="mt-4 flex gap-3"><button onClick={handleCreateNtb} className="rounded-2xl bg-amber-600 px-4 py-2 text-white font-bold text-sm">{editingNtb ? 'Actualizar' : 'Crear bloque'}</button><button onClick={() => { setShowNtbForm(false); setEditingNtb(null); }} className="rounded-2xl border px-4 py-2 font-bold text-sm">Cancelar</button></div>
    </Card></div>)}

    <div className="mt-5 flex flex-col xl:flex-row gap-5">
      <aside className="w-full xl:w-[380px] shrink-0">
        <Card className="space-y-5 xl:sticky xl:top-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Sparkles size={16} className="text-violet-600" /> Configurar Clase</div>
          <div><label className={LC}>Tipo de bloque</label><div className="flex gap-2">{(['lectivo', 'no_lectivo', 'reemplazo'] as const).map((t) => (<button key={t} onClick={() => setBlockType(t)} className={`flex-1 rounded-2xl px-3 py-2 text-xs font-bold transition-all ${blockType === t ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t === 'lectivo' ? 'Lectivo' : t === 'no_lectivo' ? 'No lectivo' : 'Reemplazo'}</button>))}</div></div>
          <div className="space-y-3">
            <label className={LC}>Nombre de la clase<input value={selectedBundle?.plan?.title || selectedBundle?.lesson?.title || ''} onChange={(e) => updatePlanField('title', e.target.value)} placeholder="Ej: Lenguaje 4A - Taller de lectura" className={IC} /></label>
            <div className="grid grid-cols-2 gap-3"><label className={LC}>Fecha<input type="date" value={selectedBundle?.lesson?.lesson_date || todayDate()} onChange={(e) => updateLessonField({ lesson_date: e.target.value })} className={IC} /></label>
            <div className="grid grid-cols-2 gap-2"><label className={LC}>Inicio<input type="time" value={selectedBundle?.lesson?.start_time || '08:00'} onChange={(e) => updateLessonField({ start_time: e.target.value })} className={IC} /></label><label className={LC}>Termino<input type="time" value={selectedBundle?.lesson?.end_time || '09:00'} onChange={(e) => updateLessonField({ end_time: e.target.value })} className={IC} /></label></div></div>
          </div>
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-[11px] font-black tracking-wide uppercase text-violet-600">Curriculo</p>
            <label className={LC}>Nivel educativo<select value={lessonCurriculum.levelId} onChange={(e) => updateLessonCurriculum({ levelId: e.target.value })} className={IC}><option value="">Selecciona nivel</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className={LC}>Asignatura<select value={lessonCurriculum.subjectId} onChange={(e) => updateLessonCurriculum({ subjectId: e.target.value })} disabled={!lessonCurriculum.levelId || lcSubjectsLoading} className={`${IC} disabled:bg-slate-100 disabled:text-slate-400`}><option value="">{lcSubjectsLoading ? 'Cargando...' : 'Selecciona asignatura'}</option>{lcSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label className={LC}>Objetivo Curricular OA<select value={lessonCurriculum.objectiveId} onChange={(e) => updateLessonCurriculum({ objectiveId: e.target.value })} disabled={!lessonCurriculum.subjectId || lcObjectivesLoading} className={`${IC} disabled:bg-slate-100 disabled:text-slate-400`}><option value="">{lcObjectivesLoading ? 'Cargando...' : 'Selecciona OA'}</option>{lcObjectives.map((oa) => <option key={oa.id} value={oa.id}>{oa.code} - {oa.official_text}</option>)}</select></label>
            <label className={LC}>Metodologia<input value={methodologyNotes} onChange={(e) => { setMethodologyNotes(e.target.value); updatePlanField('teacher_observations', e.target.value); }} placeholder="ABP, trabajo colaborativo, estaciones..." className={IC} /></label>
          </div>
          {blockType === 'no_lectivo' && (<div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-[11px] font-black tracking-wide uppercase text-amber-600">Bloque no lectivo</p>
            <label className={LC}>Tipo de actividad<select value={ntbForm.non_teaching_type} onChange={(e) => setNtbForm((p) => ({ ...p, non_teaching_type: e.target.value }))} className={IC}>{NON_TEACHING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
            <label className={LC}>Prioridad<select value={ntbForm.priority} onChange={(e) => setNtbForm((p) => ({ ...p, priority: e.target.value }))} className={IC}>{PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
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
          <div className="border-t border-slate-100 pt-4"><label className={LC}>Instrucciones adicionales<textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder="Ej: Enfatizar problemas cotidianos, trabajo colaborativo, evaluacion formativa..." className={IC} /></label></div>
          <div className="space-y-2 pt-2">
            <button onClick={() => { if (blockType === 'no_lectivo') { handleCreateNtb(); } else { handleCreateSchedule(); } }} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-white font-bold shadow-md shadow-violet-900/10 hover:shadow-lg transition-all text-sm">{selectedLessonId ? 'Actualizar clase' : 'Guardar clase'}</button>
            <button onClick={() => setShowClassForm(true)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">Crear clase extraordinaria</button>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {lessonsByDay.map((day) => (<div key={day.date} className="min-h-[220px] rounded-2xl bg-slate-50 border border-slate-100 p-3">
              <p className="font-black text-slate-800">{day.label}</p><p className="text-xs text-slate-400 mb-3">{day.date}</p>
              <div className="space-y-2">
                {day.lessons.map((lesson) => (<button key={lesson.id} onClick={() => void openLesson(lesson)} className="w-full text-left rounded-2xl p-3 text-white shadow-sm" style={{ backgroundColor: lesson.color || '#2563eb' }}>
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
                {day.lessons.length === 0 && day.nteaching.length === 0 && <p className="text-xs text-slate-400">Sin bloques programados.</p>}
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
            <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
              {(['oa', 'inicio', 'desarrollo', 'cierre', 'metodologia', 'comentarios'] as DetailTab[]).map((t) => (<button key={t} onClick={() => setDetailTab(t)} className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${detailTab === t ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{t === 'oa' ? 'OA' : t === 'inicio' ? 'Inicio' : t === 'desarrollo' ? 'Desarrollo' : t === 'cierre' ? 'Cierre' : t === 'metodologia' ? 'Metodologia' : 'Comentarios'}</button>))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
              <div className="rounded-2xl bg-slate-50 p-4 min-h-[280px]">
                {detailTab === 'oa' && (<div className="space-y-4">
                  <h3 className="font-black text-slate-900">Selecciona OA desde D1</h3>
                  <select value={selectedObjective?.id || String(selectedBundle.curriculum?.objective_id || '')} onChange={(e) => void handleObjectiveSelect(e.target.value)} className={IC}>
                    <option value="">Selecciona un OA</option>
                    {objectives.map((oa) => <option key={oa.id} value={oa.id}>{oa.code} - {oa.official_text}</option>)}
                  </select>
                  <textarea value={selectedBundle.plan?.objective_text || ''} onChange={(e) => updatePlanField('objective_text', e.target.value)} placeholder="Objetivo especifico de la clase" className="w-full min-h-[110px] rounded-2xl border border-slate-200 p-3 text-sm" />
                  <textarea value={selectedBundle.plan?.purpose_text || ''} onChange={(e) => updatePlanField('purpose_text', e.target.value)} placeholder="Proposito de la clase" className="w-full min-h-[90px] rounded-2xl border border-slate-200 p-3 text-sm" />
                </div>)}
                {detailTab === 'metodologia' && (<div className="space-y-3"><h3 className="font-black text-slate-900">Metodologia sugerida</h3><textarea value={methodologyNotes} onChange={(e) => { setMethodologyNotes(e.target.value); updatePlanField('teacher_observations', e.target.value); }} className="w-full min-h-[180px] rounded-2xl border border-slate-200 p-3 text-sm" placeholder="ABP, trabajo colaborativo, estaciones, aprendizaje basado en problemas..." /></div>)}
                {fieldForTab && detailTab !== 'oa' && detailTab !== 'metodologia' && (<textarea value={displayText(selectedBundle.plan?.[fieldForTab])} onChange={(e) => updatePlanField(fieldForTab, e.target.value)} className="w-full min-h-[260px] rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed shadow-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100" placeholder={`Escribe o genera contenido para ${RIGHT_TABS.find((t) => t.id === rightTab)?.label || detailTab}`} />)}
              </div>
              <aside className="rounded-2xl border border-violet-100 p-4 bg-violet-50/50">
                <h3 className="font-black text-slate-900 flex items-center gap-2"><Sparkles size={18} /> IA integrada</h3>
                <p className="mt-1 text-xs text-slate-500">La IA se bloquea si no hay OA seleccionado y guarda todo automaticamente en D1.</p>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  {[['Generar inicio', 'inicio', 'resource'], ['Generar desarrollo', 'desarrollo', 'resource'], ['Generar cierre', 'cierre', 'resource']].map(([label, action, kind]) => (
                    <button key={action} disabled={loading} onClick={() => void generate(String(action), kind as any)} className="rounded-xl bg-white border border-violet-100 px-3 py-2 text-left text-xs font-bold text-violet-700 hover:bg-violet-600 hover:text-white transition-colors disabled:opacity-50">{label}</button>
                  ))}
                </div>
                <div className="mt-5 space-y-2"><h4 className="text-xs font-black text-slate-500 uppercase">Generados</h4>
                  {[...(selectedBundle.resources || []), ...(selectedBundle.evaluations || [])].slice(0, 6).map((item) => (<div key={String(item.id)} className="rounded-xl bg-white p-3 text-xs border border-slate-100"><p className="font-bold text-slate-800">{displayText(item.title)}</p><p className="text-emerald-600">Guardado automaticamente</p></div>))}
                </div>
              </aside>
            </div>
          </div>)}
        </div>)}

        {/* TAB: Curriculo */}
        {rightTab === 'curriculum' && (<div>
          {!hasOA ? (<div className="flex flex-col items-center justify-center min-h-[400px] text-center text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-3 text-violet-600"><GraduationCap size={24} /></div>
            <h3 className="font-black text-slate-900">Selecciona un OA en el panel izquierdo para habilitar recursos con IA.</h3>
          </div>) : (<div className="space-y-4">
            <h3 className="font-black text-slate-900 text-lg">Clase conectada al curriculo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[['Nivel', lessonCurriculum.levelId ? courses.find((c) => c.id === lessonCurriculum.levelId)?.name || lessonCurriculum.levelId : '-'], ['Asignatura', lessonCurriculum.subjectId ? lcSubjects.find((s) => s.id === lessonCurriculum.subjectId)?.name || lessonCurriculum.subjectId : '-'], ['OA', lessonCurriculum.objectiveId ? lcObjectives.find((o) => o.id === lessonCurriculum.objectiveId)?.official_text || lessonCurriculum.objectiveId : '-'], ['Metodologia', methodologyNotes || '-']].map(([label, value]) => (<div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-3"><p className="text-xs font-black text-slate-400 uppercase">{label}</p><p className="text-sm font-semibold text-slate-700 mt-1">{value}</p></div>))}
            </div>
            {lcContext && (<div className="space-y-3">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3"><p className="text-xs font-black text-slate-400 uppercase">Eje</p><p className="text-sm text-slate-700 mt-1">{lcContext.axis_name || '-'}</p></div>
              {lcContext.indicators?.length > 0 && (<div><p className="text-xs font-black text-slate-400 uppercase mb-2">Indicadores ({lcContext.indicators.length})</p><div className="flex flex-wrap gap-1">{lcContext.indicators.map((i: any, idx: number) => (<span key={idx} className="rounded-lg bg-violet-100 text-violet-700 px-2 py-1 text-[11px] font-bold">{i.description}</span>))}</div></div>)}
              {lcContext.skills?.length > 0 && (<div><p className="text-xs font-black text-slate-400 uppercase mb-2">Habilidades ({lcContext.skills.length})</p><div className="flex flex-wrap gap-1">{lcContext.skills.map((s: any, idx: number) => (<span key={idx} className="rounded-lg bg-emerald-100 text-emerald-700 px-2 py-1 text-[11px] font-bold">{s.description}</span>))}</div></div>)}
              {attitudes.length > 0 && (<div><p className="text-xs font-black text-slate-400 uppercase mb-2">Actitudes</p><div className="flex flex-wrap gap-1">{attitudes.map((a, idx) => (<span key={idx} className="rounded-lg bg-amber-100 text-amber-700 px-2 py-1 text-[11px] font-bold">{a}</span>))}</div></div>)}
            </div>)}
            {lcContextLoading && <p className="text-xs text-violet-500">Cargando contexto curricular...</p>}
          </div>)}
        </div>)}

        {/* TAB: Recursos IA */}
        {rightTab === 'recursos' && (<div>
          {!hasOA ? (<div className="flex flex-col items-center justify-center min-h-[400px] text-center text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-3 text-violet-600"><Sparkles size={24} /></div>
            <h3 className="font-black text-slate-900">Selecciona nivel, asignatura y OA antes de generar recursos.</h3>
          </div>) : (<div className="space-y-4">
            <h3 className="font-black text-slate-900 text-lg">Recursos con IA</h3>
            <p className="text-sm text-slate-500">Cada recurso usa el contexto curricular guardado: nivel, asignatura y OA seleccionados.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[['Crear guia', 'guia', 'resource'], ['Crear presentacion', 'presentation', 'presentation'], ['Crear actividad', 'colaborativa', 'resource'], ['Crear ticket de salida', 'ticket', 'evaluation'], ['Crear recurso DUA', 'dua', 'resource'], ['Mejorar esta clase', 'mejora', 'resource']].map(([label, action, kind]) => (
                <button key={action} disabled={loading} onClick={() => void generate(String(action), kind as any)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-violet-300 hover:bg-violet-50 transition-all disabled:opacity-50"><p className="text-sm font-bold text-slate-800">{label}</p><p className="text-xs text-slate-500 mt-1">Genera con contexto D1</p></button>
              ))}
            </div>
          </div>)}
        </div>)}

        {/* TAB: Evaluacion */}
        {rightTab === 'evaluacion' && (<div>
          {!hasOA ? (<div className="flex flex-col items-center justify-center min-h-[400px] text-center text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-3 text-violet-600"><ListChecks size={24} /></div>
            <h3 className="font-black text-slate-900">Selecciona nivel, asignatura y OA antes de generar evaluaciones.</h3>
          </div>) : (<div className="space-y-4">
            <h3 className="font-black text-slate-900 text-lg">Evaluaciones con IA</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[['Crear evaluacion', 'evaluacion', 'evaluation'], ['Crear rubrica', 'rubrica', 'evaluation'], ['Crear pauta', 'pauta', 'evaluation'], ['Crear evaluacion tipo SIMCE', 'simce', 'evaluation'], ['Crear retroalimentacion', 'retroalimentacion', 'evaluation']].map(([label, action, kind]) => (
                <button key={action} disabled={loading} onClick={() => void generate(String(action), kind as any)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-violet-300 hover:bg-violet-50 transition-all disabled:opacity-50"><p className="text-sm font-bold text-slate-800">{label}</p><p className="text-xs text-slate-500 mt-1">Basado en el OA seleccionado</p></button>
              ))}
            </div>
          </div>)}
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

    {classes.length > 0 && (<div className="mt-5"><Card><h3 className="font-black text-slate-900">Cursos</h3><div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">{classes.map((item) => (<div key={item.id} className="rounded-2xl border border-slate-100 p-4"><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><h4 className="mt-2 font-black text-slate-900">{item.class_name}</h4><p className="text-sm text-slate-500">{item.course_name}</p><button onClick={() => void deleteTeacherClass(item.id).then(loadMain)} className="mt-3 text-xs font-bold text-red-600 inline-flex gap-1 items-center"><Trash2 size={12} /> Quitar</button></div>))}</div></Card></div>)}
  </div>);
}
