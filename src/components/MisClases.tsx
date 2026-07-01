import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BookOpenCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  GraduationCap,
  ListChecks,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getCourses, getIndicatorsByObjective, getObjectives, getSkillsByObjective, getSubjectsByCourse } from '../services/curriculumD1Service';
import {
  autosaveLesson,
  createLesson,
  createSchedule,
  createTeacherClass,
  deleteLesson,
  deleteTeacherClass,
  generateLessonEvaluation,
  generateLessonResource,
  getCalendar,
  getLesson,
  listTeacherClasses,
  updateLesson,
  type LessonBundle,
  type LessonInstance,
  type TeacherClass,
} from '../services/misClasesService';

type TabKey =
  | 'oa'
  | 'indicadores'
  | 'metodologia'
  | 'pregunta'
  | 'abp'
  | 'inicio'
  | 'desarrollo'
  | 'cierre'
  | 'recursos'
  | 'evaluacion'
  | 'adjuntos'
  | 'comentarios';

const TABS: { id: TabKey; label: string }[] = [
  { id: 'oa', label: 'OA' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'metodologia', label: 'MetodologÃ­a' },
  { id: 'pregunta', label: 'Pregunta desafÃ­o' },
  { id: 'abp', label: 'ABP / Proyecto' },
  { id: 'inicio', label: 'Inicio' },
  { id: 'desarrollo', label: 'Desarrollo' },
  { id: 'cierre', label: 'Cierre' },
  { id: 'recursos', label: 'Recursos' },
  { id: 'evaluacion', label: 'EvaluaciÃ³n' },
  { id: 'adjuntos', label: 'Adjuntos' },
  { id: 'comentarios', label: 'Comentarios' },
];

const WEEKDAYS = [
  { n: 1, label: 'Lunes' },
  { n: 2, label: 'Martes' },
  { n: 3, label: 'MiÃ©rcoles' },
  { n: 4, label: 'Jueves' },
  { n: 5, label: 'Viernes' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'planificada', label: 'Planificada' },
  { value: 'en_preparacion', label: 'En preparaciÃ³n' },
  { value: 'realizada', label: 'Realizada' },
  { value: 'pendiente', label: 'Pendiente' },
];

const SUMMARY_CARDS: { label: string; value: (classes: TeacherClass[], calendar: LessonInstance[], bundle: LessonBundle | null, week: string) => string | number; icon: LucideIcon }[] = [
  { label: 'Cursos', value: (classes) => classes.length, icon: GraduationCap },
  { label: 'Calendario', value: (_classes, _calendar, _bundle, week) => `${week} / ${addDays(week, 4)}`, icon: CalendarDays },
  { label: 'Mis Clases', value: (_classes, calendar) => calendar.length, icon: BookOpenCheck },
  { label: 'Recursos generados', value: (_classes, _calendar, bundle) => (bundle?.resources?.length || 0) + (bundle?.evaluations?.length || 0), icon: Sparkles },
];

const FIELD_BY_TAB: Partial<Record<TabKey, keyof LessonBundle['plan']>> = {
  pregunta: 'challenge_question',
  abp: 'abp_project_text',
  inicio: 'beginning_text',
  desarrollo: 'development_text',
  cierre: 'closure_text',
  recursos: 'resources_text',
  evaluacion: 'evaluation_text',
  comentarios: 'teacher_observations',
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function mondayOf(dateText = todayDate()) {
  const date = new Date(`${dateText}T12:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return date.toISOString().slice(0, 10);
}

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseJsonList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function displayText(value: unknown) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

export function MisClases() {
  const [schoolYear, setSchoolYear] = useState(String(new Date().getFullYear()));
  const [levelId, setLevelId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [school, setSchool] = useState('');
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
  const [activeTab, setActiveTab] = useState<TabKey>('oa');
  const [objectives, setObjectives] = useState<any[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<any | null>(null);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [attitudes, setAttitudes] = useState<string[]>([]);
  const [methodologyNotes, setMethodologyNotes] = useState('');
  const [lessonCurriculum, setLessonCurriculum] = useState<{
    levelId: string; subjectId: string; objectiveId: string;
    indicatorIds: string[]; skillIds: string[]; attitudeIds: string[];
    methodologyId: string;
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
  const autosaveTimer = useRef<number | null>(null);
  const lastAutosave = useRef('');

  const selectedClass = useMemo(() => classes.find((c) => c.id === scheduleForm.class_id) || classes[0], [classes, scheduleForm.class_id]);

  const loadFilters = useCallback(async () => {
    const loadedCourses = await getCourses();
    setCourses(loadedCourses);
    const nextLevel = levelId || loadedCourses[0]?.id || '';
    if (!levelId && nextLevel) setLevelId(nextLevel);
  }, [levelId]);

  const loadMain = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { school_year: schoolYear, level_id: levelId, subject_id: subjectId, status };
      const [classRes, calRes] = await Promise.all([listTeacherClasses(params), getCalendar(week)]);
      setClasses(classRes.data || []);
      setCalendar(calRes.data || []);
      if (!scheduleForm.class_id && classRes.data?.[0]?.id) {
        setScheduleForm((prev) => ({ ...prev, class_id: classRes.data[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar Mis Clases.');
    } finally {
      setLoading(false);
    }
  }, [schoolYear, levelId, subjectId, status, week, scheduleForm.class_id]);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    void loadMain();
  }, [loadMain]);

  useEffect(() => {
    if (!selectedLessonId) return;
    getLesson(selectedLessonId)
      .then((res) => {
        setSelectedBundle(res.data);
        setMethodologyNotes('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo abrir la clase.'));
  }, [selectedLessonId]);

  useEffect(() => {
    if (!selectedBundle) return;
    const cur = selectedBundle.curriculum || {};
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
    getSubjectsByCourse(lessonCurriculum.levelId)
      .then((items) => setLcSubjects(items))
      .catch(() => setLcSubjects([]))
      .finally(() => setLcSubjectsLoading(false));
  }, [lessonCurriculum.levelId]);

  useEffect(() => {
    if (!lessonCurriculum.levelId || !lessonCurriculum.subjectId) { setLcObjectives([]); return; }
    setLcObjectivesLoading(true);
    getObjectives(lessonCurriculum.levelId, lessonCurriculum.subjectId)
      .then((items) => setLcObjectives(items))
      .catch(() => setLcObjectives([]))
      .finally(() => setLcObjectivesLoading(false));
  }, [lessonCurriculum.levelId, lessonCurriculum.subjectId]);

  useEffect(() => {
    if (!lessonCurriculum.objectiveId) { setLcContext(null); return; }
    setLcContextLoading(true);
    fetch(`/api/curriculum/context?objective_id=${encodeURIComponent(lessonCurriculum.objectiveId)}`)
      .then((r) => r.json())
      .then((d) => setLcContext(d?.data || null))
      .catch(() => setLcContext(null))
      .finally(() => setLcContextLoading(false));
  }, [lessonCurriculum.objectiveId]);

  useEffect(() => {
    if (!levelId) {
      setSubjects([]);
      setSubjectId('');
      return;
    }
    setSubjectsLoading(true);
    setSubjectsError('');
    getSubjectsByCourse(levelId).then((items) => {
      setSubjects(items);
      setSubjectId((prev) => items.some((s) => s.id === prev) ? prev : (items[0]?.id || ''));
    }).catch(() => {
      setSubjects([]);
      setSubjectId('');
      setSubjectsError('Error al cargar asignaturas');
    }).finally(() => setSubjectsLoading(false));
  }, [levelId]);

  useEffect(() => {
    if (!selectedBundle?.lesson?.level_id || !selectedBundle?.lesson?.subject_id) return;
    getObjectives(String(selectedBundle.lesson.level_id), String(selectedBundle.lesson.subject_id))
      .then(setObjectives)
      .catch(() => setObjectives([]));
  }, [selectedBundle?.lesson?.level_id, selectedBundle?.lesson?.subject_id]);

  const openLesson = async (lesson: LessonInstance) => {
    if (lesson.is_virtual) {
      const created = await createLesson({
        class_id: lesson.class_id,
        schedule_slot_id: lesson.schedule_slot_id,
        lesson_date: lesson.lesson_date,
        start_time: lesson.start_time,
        end_time: lesson.end_time,
        title: lesson.title,
        status: lesson.status,
        notes: lesson.notes || '',
      });
      setSelectedLessonId(created.data.id);
      await loadMain();
      return;
    }
    setSelectedLessonId(lesson.id);
  };

  const handleCreateClass = async () => {
    if (!levelId || !subjectId || !classForm.course_name || !classForm.class_name) {
      setError('Completa nivel, asignatura, curso y nombre de clase.');
      return;
    }
    const created = await createTeacherClass({
      school_year: Number(schoolYear),
      level_id: levelId,
      subject_id: subjectId,
      course_name: classForm.course_name,
      class_name: classForm.class_name,
      color: classForm.color,
    });
    setToast('Clase creada');
    setClassForm({ course_name: '', class_name: '', color: '#2563eb' });
    setShowClassForm(false);
    setScheduleForm((prev) => ({ ...prev, class_id: created.data.id }));
    await loadMain();
  };

  const handleCreateSchedule = async () => {
    const classId = scheduleForm.class_id || selectedClass?.id || '';
    if (!classId) {
      setError('Crea o selecciona una clase antes de crear horario semanal.');
      return;
    }
    if (!scheduleForm.repeats_weekly) {
      await createLesson({
        class_id: classId,
        lesson_date: scheduleForm.starts_on,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        status: 'planificada',
        title: selectedClass?.class_name || 'Clase puntual',
        notes: scheduleForm.room ? `Sala: ${scheduleForm.room}` : '',
      });
      setToast('Clase puntual creada');
    } else {
      await createSchedule({ ...scheduleForm, class_id: classId, weekday: Number(scheduleForm.weekday) });
      setToast('Horario semanal creado');
    }
    setShowScheduleForm(false);
    await loadMain();
  };

  const saveFields = useCallback((fields: Record<string, unknown>, curriculum?: Record<string, unknown>) => {
    if (!selectedLessonId) return;
    const signature = JSON.stringify({ fields, curriculum });
    if (signature === lastAutosave.current) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    setSavingState('saving');
    autosaveTimer.current = window.setTimeout(async () => {
      try {
        await autosaveLesson(selectedLessonId, curriculum ? { fields, curriculum } : { fields });
        lastAutosave.current = signature;
        setSavingState('saved');
      } catch {
        setSavingState('error');
      }
    }, 1000);
  }, [selectedLessonId]);

  const updatePlanField = (field: keyof LessonBundle['plan'], value: string) => {
    setSelectedBundle((prev) => prev ? { ...prev, plan: { ...prev.plan, [field]: value } } : prev);
    saveFields({ [field]: value });
  };

  const updateLessonCurriculum = (patch: Partial<typeof lessonCurriculum>) => {
    setLessonCurriculum((prev) => {
      const next = { ...prev, ...patch };
      if (patch.levelId !== undefined && patch.levelId !== prev.levelId) {
        next.subjectId = ''; next.objectiveId = '';
        next.indicatorIds = []; next.skillIds = []; next.attitudeIds = [];
      }
      if (patch.subjectId !== undefined && patch.subjectId !== prev.subjectId) {
        next.objectiveId = '';
        next.indicatorIds = []; next.skillIds = []; next.attitudeIds = [];
      }
      if (!selectedLessonId) return next;
      saveFields({}, { curriculum: next });
      return next;
    });
  };

  const updateLessonField = (fields: Record<string, string>) => {
    setSelectedBundle((prev) => prev ? { ...prev, lesson: { ...prev.lesson, ...fields } } : prev);
    if (!selectedLessonId) return;
    setSavingState('saving');
    updateLesson(selectedLessonId, fields)
      .then(() => setSavingState('saved'))
      .catch(() => setSavingState('error'));
  };

  const handleObjectiveSelect = async (objectiveId: string) => {
    const objective = objectives.find((oa) => oa.id === objectiveId);
    if (!objective || !selectedBundle?.plan?.id) return;
    setSelectedObjective(objective);
    const [loadedIndicators, loadedSkills] = await Promise.all([
      getIndicatorsByObjective(objective.code),
      getSkillsByObjective(objective.id),
    ]);
    const loadedAttitudes = parseJsonList(objective.attitude_tags_json);
    setIndicators(loadedIndicators);
    setSkills(loadedSkills);
    setAttitudes(loadedAttitudes);
    setLessonCurriculum((prev) => {
      const next = { ...prev, objectiveId: objective.id, indicatorIds: loadedIndicators.map((i) => i.id), skillIds: loadedSkills.map((s) => s.id), attitudeIds: loadedAttitudes };
      if (!selectedLessonId) return next;
      saveFields({}, { curriculum: next });
      return next;
    });
    saveFields(
      { objective_text: objective.official_text || objective.normalized_text || objective.code },
      {
        level_id: selectedBundle.lesson.level_id || levelId,
        subject_id: selectedBundle.lesson.subject_id || subjectId,
        axis_id: objective.axis_id,
        objective_id: objective.id,
        indicatorIds: loadedIndicators.map((i) => i.id),
        skillIds: loadedSkills.map((s) => s.id),
        attitudeIds: loadedAttitudes,
      },
    );
    setToast('OA conectado a la clase');
  };

  const generate = async (action: string, kind: 'resource' | 'evaluation' | 'presentation' = 'resource') => {
    const hasAiRequirements = Boolean(
      selectedLessonId
      && lessonCurriculum.levelId
      && lessonCurriculum.subjectId
      && lessonCurriculum.objectiveId,
    );
    if (!hasAiRequirements) {
      setError('Selecciona nivel, asignatura y OA antes de generar con IA');
      setActiveTab('oa');
      return;
    }
    setLoading(true);
    try {
      if (kind === 'evaluation') await generateLessonEvaluation(selectedLessonId, action);
      else await generateLessonResource(selectedLessonId, action);
      setToast('Recurso guardado automÃ¡ticamente');
      const refreshed = await getLesson(selectedLessonId);
      setSelectedBundle(refreshed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el recurso.');
    } finally {
      setLoading(false);
    }
  };

  const lessonsByDay = useMemo(() => {
    return WEEKDAYS.map((day, index) => {
      const date = addDays(week, index);
      return { ...day, date, lessons: calendar.filter((lesson) => lesson.lesson_date === date) };
    });
  }, [calendar, week]);

  const upcoming = useMemo(() => calendar.slice().sort((a, b) => `${a.lesson_date} ${a.start_time}`.localeCompare(`${b.lesson_date} ${b.start_time}`)).slice(0, 8), [calendar]);
  const fieldForTab = FIELD_BY_TAB[activeTab];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
      <section className="rounded-3xl bg-gradient-to-br from-violet-700 via-fuchsia-700 to-pink-600 text-white p-6 shadow-xl shadow-fuchsia-900/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-white/75">Panel docente</p>
            <h1 className="text-3xl font-black tracking-tight">Mis Clases</h1>
            <p className="mt-1 text-white/80">Organiza tu semana, planifica clases y genera recursos con IA.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowClassForm(true)} className="inline-flex items-center gap-2 rounded-2xl bg-white text-indigo-700 px-4 py-2.5 text-sm font-bold shadow">
              <Plus size={16} /> Nueva clase
            </button>
            <button onClick={() => setShowScheduleForm(true)} className="inline-flex items-center gap-2 rounded-2xl bg-white/15 border border-white/25 px-4 py-2.5 text-sm font-bold">
              <CalendarDays size={16} /> Crear horario semanal
            </button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SUMMARY_CARDS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-white/12 border border-white/15 p-4">
              <Icon className="mb-2 text-white/85" size={20} />
              <p className="text-xs text-white/70">{label}</p>
              <p className="font-black text-lg">{String(value(classes, calendar, selectedBundle, week))}</p>
            </div>
          ))}
        </div>
      </section>

      {(toast || error || savingState !== 'idle') && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || toast || (savingState === 'saving' ? 'Guardandoâ€¦' : savingState === 'saved' ? 'Guardado automÃ¡ticamente' : savingState === 'error' ? 'No se pudo guardar; se reintentarÃ¡ al editar.' : '')}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <label className="text-xs font-bold text-slate-500">AÃ±o escolar
            <input value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-bold text-slate-500">Curso o nivel
            <select value={levelId} onChange={(e) => setLevelId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Selecciona un nivel primero</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-500">Asignatura
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!levelId || subjectsLoading || subjects.length === 0} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400">
              {!levelId && <option value="">Selecciona un nivel primero</option>}
              {levelId && subjectsLoading && <option value="">Cargando asignaturas...</option>}
              {levelId && !subjectsLoading && subjects.length === 0 && <option value="">{subjectsError || 'No hay asignaturas disponibles'}</option>}
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {subjectsError && <p className="mt-1 text-[11px] text-red-600">{subjectsError}</p>}
          </label>
          <label className="text-xs font-bold text-slate-500">Colegio
            <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-bold text-slate-500">Estado
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {(showClassForm || showScheduleForm) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {showClassForm && (
            <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
              <h2 className="font-black text-slate-900">Nueva clase</h2>
              <div className="mt-4 grid gap-3">
                <input value={classForm.course_name} onChange={(e) => setClassForm((p) => ({ ...p, course_name: e.target.value }))} placeholder="Curso, por ejemplo 4Â° BÃ¡sico A" className="rounded-xl border px-3 py-2 text-sm" />
                <input value={classForm.class_name} onChange={(e) => setClassForm((p) => ({ ...p, class_name: e.target.value }))} placeholder="Nombre, por ejemplo Lenguaje 4A" className="rounded-xl border px-3 py-2 text-sm" />
                <input type="color" value={classForm.color} onChange={(e) => setClassForm((p) => ({ ...p, color: e.target.value }))} className="h-10 w-20 rounded-xl" />
                <button onClick={handleCreateClass} className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-bold">Guardar clase</button>
              </div>
            </div>
          )}
          {showScheduleForm && (
            <div className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm">
              <h2 className="font-black text-slate-900">Crear horario semanal</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <select value={scheduleForm.class_id || selectedClass?.id || ''} onChange={(e) => setScheduleForm((p) => ({ ...p, class_id: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm md:col-span-2">
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name} Â· {c.course_name}</option>)}
                </select>
                <select value={scheduleForm.weekday} onChange={(e) => setScheduleForm((p) => ({ ...p, weekday: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm">
                  {WEEKDAYS.map((d) => <option key={d.n} value={d.n}>{d.label}</option>)}
                </select>
                <input value={scheduleForm.room} onChange={(e) => setScheduleForm((p) => ({ ...p, room: e.target.value }))} placeholder="Sala opcional" className="rounded-xl border px-3 py-2 text-sm" />
                <input type="time" value={scheduleForm.start_time} onChange={(e) => setScheduleForm((p) => ({ ...p, start_time: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
                <input type="time" value={scheduleForm.end_time} onChange={(e) => setScheduleForm((p) => ({ ...p, end_time: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
                <input type="date" value={scheduleForm.starts_on} onChange={(e) => setScheduleForm((p) => ({ ...p, starts_on: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
                <input type="date" value={scheduleForm.ends_on} onChange={(e) => setScheduleForm((p) => ({ ...p, ends_on: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
                <label className="md:col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={scheduleForm.repeats_weekly} onChange={(e) => setScheduleForm((p) => ({ ...p, repeats_weekly: e.target.checked }))} /> Repetir semanalmente</label>
                <button onClick={handleCreateSchedule} className="md:col-span-2 rounded-xl bg-violet-600 px-4 py-2 text-white font-bold">Guardar horario</button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_.7fr] gap-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-black text-slate-900">Calendario semanal</h2>
              <p className="text-xs text-slate-500">{week} al {addDays(week, 4)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setWeek(addDays(week, -7))} className="rounded-xl border px-3 py-2"><ChevronLeft size={16} /></button>
              <button onClick={() => setWeek(mondayOf())} className="rounded-xl border px-3 py-2 text-sm font-bold">Hoy</button>
              <button onClick={() => setWeek(addDays(week, 7))} className="rounded-xl border px-3 py-2"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {lessonsByDay.map((day) => (
              <div key={day.date} className="min-h-[220px] rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <p className="font-black text-slate-800">{day.label}</p>
                <p className="text-xs text-slate-400 mb-3">{day.date}</p>
                <div className="space-y-2">
                  {day.lessons.map((lesson) => (
                    <button key={lesson.id} onClick={() => void openLesson(lesson)} className="w-full text-left rounded-2xl p-3 text-white shadow-sm" style={{ backgroundColor: lesson.color || '#2563eb' }}>
                      <p className="text-xs font-bold flex items-center gap-1"><Clock size={12} /> {lesson.start_time}-{lesson.end_time}</p>
                      <p className="mt-1 font-black text-sm">{lesson.class_name || lesson.title}</p>
                      <p className="text-xs opacity-85">{lesson.course_name} Â· {lesson.status}</p>
                    </button>
                  ))}
                  {day.lessons.length === 0 && <p className="text-xs text-slate-400">Sin clases programadas.</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-black text-slate-900">PrÃ³ximas clases</h2>
          <div className="mt-4 space-y-3">
            {upcoming.map((lesson) => (
              <div key={lesson.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-xs text-slate-500">{lesson.lesson_date} Â· {lesson.start_time}</p>
                <h3 className="font-black text-slate-900">{lesson.title}</h3>
                <p className="text-sm text-slate-500">{lesson.course_name} Â· {lesson.class_name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => void openLesson(lesson)} className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">Abrir clase</button>
                  <button onClick={() => setToast('Duplicar queda preparado para la siguiente iteraciÃ³n.')} className="rounded-xl border px-3 py-1.5 text-xs font-bold"><Copy size={12} className="inline" /> Duplicar</button>
                  {!lesson.is_virtual && <button onClick={() => void deleteLesson(lesson.id).then(loadMain)} className="rounded-xl border px-3 py-1.5 text-xs font-bold text-red-600"><Trash2 size={12} className="inline" /> Eliminar</button>}
                </div>
              </div>
            ))}
            {upcoming.length === 0 && <p className="text-sm text-slate-500">Crea una clase o un horario semanal para empezar.</p>}
          </div>
        </div>
      </section>

      {selectedBundle && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-indigo-600">Detalle de clase</p>
              <input value={selectedBundle.plan?.title || selectedBundle.lesson.title || ''} onChange={(e) => updatePlanField('title', e.target.value)} className="mt-1 w-full text-2xl font-black text-slate-900 border-b border-transparent focus:border-indigo-200 outline-none" />
              <p className="text-sm text-slate-500">{selectedBundle.lesson.lesson_date} Â· {selectedBundle.lesson.start_time}-{selectedBundle.lesson.end_time}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {savingState === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {savingState === 'saving' ? 'Guardandoâ€¦' : savingState === 'saved' ? 'Guardado automÃ¡ticamente' : 'Borrador recuperado'}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <label className="text-xs font-bold text-slate-500">Fecha
              <input type="date" value={selectedBundle.lesson.lesson_date || ''} onChange={(e) => updateLessonField({ lesson_date: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white" />
            </label>
            <label className="text-xs font-bold text-slate-500">Inicio
              <input type="time" value={selectedBundle.lesson.start_time || ''} onChange={(e) => updateLessonField({ start_time: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white" />
            </label>
            <label className="text-xs font-bold text-slate-500">Termino
              <input type="time" value={selectedBundle.lesson.end_time || ''} onChange={(e) => updateLessonField({ end_time: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white" />
            </label>
            <label className="text-xs font-bold text-slate-500">Estado
              <select value={selectedBundle.lesson.status || 'pendiente'} onChange={(e) => updateLessonField({ status: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                {STATUS_OPTIONS.filter((item) => item.value).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <div className="md:col-span-2 rounded-xl bg-white border border-slate-100 p-3 text-sm">
              <p className="text-xs font-bold text-slate-400">Nivel / curso</p>
              <p className="font-semibold text-slate-700">{selectedBundle.lesson.course_name || 'Sin curso'}</p>
            </div>
            <div className="md:col-span-2 rounded-xl bg-white border border-slate-100 p-3 text-sm">
              <p className="text-xs font-bold text-slate-400">Asignatura</p>
              <p className="font-semibold text-slate-700">{subjects.find((s) => s.id === selectedBundle.lesson.subject_id)?.name || selectedBundle.lesson.subject_id || 'Sin asignatura'}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4">
            <h3 className="font-black text-slate-900 text-sm">Curriculum de la clase</h3>
            <p className="text-xs text-slate-500 mb-3">Selecciona nivel, asignatura y OA. La IA usara este contexto obligatoriamente.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="text-xs font-bold text-slate-500">Nivel / curso
                <select value={lessonCurriculum.levelId} onChange={(e) => updateLessonCurriculum({ levelId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                  <option value="">Selecciona nivel</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">Asignatura
                <select value={lessonCurriculum.subjectId} onChange={(e) => updateLessonCurriculum({ subjectId: e.target.value })} disabled={!lessonCurriculum.levelId || lcSubjectsLoading} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white disabled:bg-slate-50">
                  <option value="">{lcSubjectsLoading ? 'Cargando...' : 'Selecciona asignatura'}</option>
                  {lcSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">OA
                <select value={lessonCurriculum.objectiveId} onChange={(e) => updateLessonCurriculum({ objectiveId: e.target.value })} disabled={!lessonCurriculum.subjectId || lcObjectivesLoading} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white disabled:bg-slate-50">
                  <option value="">{lcObjectivesLoading ? 'Cargando...' : 'Selecciona OA'}</option>
                  {lcObjectives.map((oa) => <option key={oa.id} value={oa.id}>{oa.code} · {oa.official_text}</option>)}
                </select>
              </label>
            </div>
            {lcContext && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-white border border-slate-100 p-3">
                  <p className="font-bold text-slate-400">Eje</p>
                  <p className="text-slate-700">{lcContext.axis_name || '—'}</p>
                </div>
                <div className="rounded-xl bg-white border border-slate-100 p-3">
                  <p className="font-bold text-slate-400">Indicadores ({lcContext.indicators?.length || 0})</p>
                  <p className="text-slate-700 line-clamp-2">{lcContext.indicators?.map((i: any) => i.description).join('; ') || '—'}</p>
                </div>
                <div className="rounded-xl bg-white border border-slate-100 p-3">
                  <p className="font-bold text-slate-400">Habilidades ({lcContext.skills?.length || 0})</p>
                  <p className="text-slate-700 line-clamp-2">{lcContext.skills?.map((s: any) => s.description).join('; ') || '—'}</p>
                </div>
              </div>
            )}
            {lcContextLoading && <p className="mt-2 text-xs text-indigo-500">Cargando contexto curricular...</p>}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 pb-2">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap rounded-2xl px-3 py-2 text-xs font-bold ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <div className="rounded-2xl bg-slate-50 p-4 min-h-[280px]">
              {activeTab === 'oa' && (
                <div className="space-y-4">
                  <h3 className="font-black text-slate-900">Selecciona OA desde D1</h3>
                  <select value={selectedObjective?.id || String(selectedBundle.curriculum?.objective_id || '')} onChange={(e) => void handleObjectiveSelect(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                    <option value="">Selecciona un OA</option>
                    {objectives.map((oa) => <option key={oa.id} value={oa.id}>{oa.code} Â· {oa.official_text}</option>)}
                  </select>
                  <textarea value={selectedBundle.plan?.objective_text || ''} onChange={(e) => updatePlanField('objective_text', e.target.value)} placeholder="Objetivo especÃ­fico de la clase" className="w-full min-h-[110px] rounded-2xl border border-slate-200 p-3 text-sm" />
                  <textarea value={selectedBundle.plan?.purpose_text || ''} onChange={(e) => updatePlanField('purpose_text', e.target.value)} placeholder="PropÃ³sito de la clase" className="w-full min-h-[90px] rounded-2xl border border-slate-200 p-3 text-sm" />
                </div>
              )}

              {activeTab === 'indicadores' && (
                <PanelList title="Indicadores, habilidades y actitudes" icon={<ListChecks size={18} />} groups={[
                  ['Indicadores', indicators.map((i) => displayText(i.indicator_text || i.description))],
                  ['Habilidades', skills.map((s) => displayText(s.official_text || s.description))],
                  ['Actitudes', attitudes.length ? attitudes : ['Sin actitudes explÃ­citas en el OA; puedes registrar foco actitudinal en observaciones.']],
                ]} />
              )}

              {activeTab === 'metodologia' && (
                <div className="space-y-3">
                  <h3 className="font-black text-slate-900">MetodologÃ­a sugerida</h3>
                  <p className="text-sm text-slate-500">Selecciona o describe la estrategia que usarÃ¡s. Se guarda con autosave.</p>
                  <textarea value={methodologyNotes} onChange={(e) => { setMethodologyNotes(e.target.value); updatePlanField('teacher_observations', e.target.value); }} className="w-full min-h-[180px] rounded-2xl border border-slate-200 p-3 text-sm" placeholder="ABP, trabajo colaborativo, estaciones, aprendizaje basado en problemas..." />
                </div>
              )}

              {fieldForTab && (
                <textarea
                  value={displayText(selectedBundle.plan?.[fieldForTab])}
                  onChange={(e) => updatePlanField(fieldForTab, e.target.value)}
                  className="w-full min-h-[260px] rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed shadow-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  placeholder={activeTab === 'comentarios' ? 'Observaciones docentes, acuerdos, alertas para la siguiente clase o notas de seguimiento.' : `Escribe o genera contenido para ${TABS.find((t) => t.id === activeTab)?.label}`}
                />
              )}

              {activeTab === 'adjuntos' && <EmptyPanel icon={<Paperclip />} title="Adjuntos" text="La estructura D1 ya estÃ¡ lista para guardar enlaces y archivos asociados a esta clase." />}
            </div>

            <aside className="rounded-2xl border border-indigo-100 p-4 bg-indigo-50/50">
              <h3 className="font-black text-slate-900 flex items-center gap-2"><Sparkles size={18} /> IA integrada</h3>
              <p className="mt-1 text-xs text-slate-500">La IA se bloquea si no hay OA seleccionado y guarda todo automÃ¡ticamente en D1.</p>
              <div className="mt-4 grid grid-cols-1 gap-2">
                {[
                  ['Generar inicio', 'inicio', 'resource'],
                  ['Generar desarrollo', 'desarrollo', 'resource'],
                  ['Generar cierre', 'cierre', 'resource'],
                  ['Crear guÃ­a', 'guia', 'resource'],
                  ['Crear evaluaciÃ³n', 'evaluacion', 'evaluation'],
                  ['Crear rÃºbrica', 'rubrica', 'evaluation'],
                  ['Crear ticket de salida', 'ticket', 'evaluation'],
                  ['Crear presentaciÃ³n PPT', 'presentation', 'presentation'],
                  ['Crear recurso DUA', 'dua', 'resource'],
                  ['Mejorar esta clase', 'mejora', 'resource'],
                  ['Adaptar para estudiantes descendidos', 'descendidos', 'resource'],
                  ['Adaptar para alta exigencia', 'alta_exigencia', 'resource'],
                  ['Crear actividad colaborativa', 'colaborativa', 'resource'],
                ].filter(([, action]) => ['inicio', 'desarrollo', 'cierre', 'guia', 'evaluacion'].includes(String(action))).map(([label, action, kind]) => (
                  <button key={action} disabled={loading} onClick={() => void generate(String(action), kind as any)} className="rounded-xl bg-white border border-indigo-100 px-3 py-2 text-left text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50">
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase">Generados</h4>
                {[...(selectedBundle.resources || []), ...(selectedBundle.evaluations || [])].slice(0, 6).map((item) => (
                  <div key={String(item.id)} className="rounded-xl bg-white p-3 text-xs border border-slate-100">
                    <p className="font-bold text-slate-800">{displayText(item.title)}</p>
                    <p className="text-emerald-600">Guardado automÃ¡ticamente</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      )}

      {classes.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-black text-slate-900">Cursos</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {classes.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <h3 className="mt-2 font-black text-slate-900">{item.class_name}</h3>
                <p className="text-sm text-slate-500">{item.course_name}</p>
                <button onClick={() => void deleteTeacherClass(item.id).then(loadMain)} className="mt-3 text-xs font-bold text-red-600 inline-flex gap-1 items-center"><Trash2 size={12} /> Quitar</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PanelList({ title, icon, groups }: { title: string; icon: ReactNode; groups: [string, string[]][] }) {
  return (
    <div>
      <h3 className="font-black text-slate-900 flex items-center gap-2">{icon}{title}</h3>
      <div className="mt-4 space-y-4">
        {groups.map(([group, items]) => (
          <div key={group}>
            <p className="text-xs font-black text-slate-500 uppercase">{group}</p>
            <div className="mt-2 space-y-2">
              {items.map((item, idx) => <div key={`${group}-${idx}`} className="rounded-xl bg-white border border-slate-100 p-3 text-sm text-slate-700">{item}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyPanel({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-3 text-indigo-600">{icon}</div>
      <h3 className="font-black text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm">{text}</p>
    </div>
  );
}

