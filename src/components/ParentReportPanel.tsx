import { useState, useCallback, useEffect } from 'react';
import {
  Upload, Download, Play, Pause, Edit3, Plus, Trash2, Loader, ChevronRight,
  Settings, BookOpen, Users, MessageSquare, FileText, Check, AlertTriangle
} from 'lucide-react';
import { Button } from './ui/Button';
import type { ParentReportBatch, ParentReportSheet, ParentStudentReport } from '../services/reportImportService';
import { importParentReportExcel } from '../services/reportImportService';
import {
  generateChileanCurriculumIndicators,
  generateChileanCurriculumSkills,
  isSuggestedSource,
} from '../utils/chileanCurriculumFallback';

function generateId(prefix = 'rpt'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

function generateFallbackIndicators(oaText: string, subject: string, objectiveCode?: string): any[] {
  return generateChileanCurriculumIndicators({
    course: '', subject, objectiveCode: objectiveCode || 'SUGERIDO', objectiveText: oaText || '',
  });
}

function generateFallbackSkills(oaText: string, subject: string): string[] {
  return generateChileanCurriculumSkills({
    course: '', subject, objectiveCode: 'SUGERIDO', objectiveText: oaText || '',
  });
}

interface SelectedObjective {
  id: string;
  code: string;
  text: string;
  subject: string;
  level: string;
}

interface SelectedIndicator {
  id: string;
  oaCode: string;
  text: string;
  source: string;
}

const STEPS = [
  { id: 'config', label: 'Configuración', icon: Settings },
  { id: 'asignatura', label: 'Asignatura y Objetivos', icon: BookOpen },
  { id: 'estudiantes', label: 'Estudiantes', icon: Users },
  { id: 'observaciones', label: 'Observaciones IA', icon: MessageSquare },
  { id: 'exportar', label: 'Exportar y Guardar', icon: FileText },
];

export function ParentReportPanel() {
  // Step management
  const [step, setStep] = useState(0);

  // Step 1: Configuration
  const [school, setSchool] = useState('');
  const [teacher, setTeacher] = useState('');
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [evaluationName, setEvaluationName] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentCount, setStudentCount] = useState(10);
  const [maxScore, setMaxScore] = useState(24);

  // Step 2: D1 data
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [d1Indicators, setD1Indicators] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedObjectives, setSelectedObjectives] = useState<SelectedObjective[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<SelectedIndicator[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<{ id: string; text: string; source: string }[]>([]);
  const [d1Skills, setD1Skills] = useState<any[]>([]);
  const [fallbackSkills, setFallbackSkills] = useState<string[]>([]);
  const [loadingD1, setLoadingD1] = useState(false);
  const [manualObjective, setManualObjective] = useState('');

  // Step 3: Students
  const [students, setStudents] = useState<ParentStudentReport[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [newStudentName, setNewStudentName] = useState('');

  // Step 4: AI generation
  const [generating, setGenerating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, batch: '' });

  // Step 5: Export
  const [exporting, setExporting] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');

  // Load D1 data
  useEffect(() => {
    (async () => {
      try {
        const [coursesRes, subjectsRes] = await Promise.all([
          fetch('/api/courses').then(r => r.json()),
          fetch('/api/subjects').then(r => r.json()),
        ]);
        setCourses(coursesRes.data || []);
        setSubjects(subjectsRes.data || []);
      } catch {}
    })();
  }, []);

  // Load objectives when course+subject change
  useEffect(() => {
    if (!selectedCourseId || !selectedSubjectId) { setObjectives([]); return; }
    setLoadingD1(true);
    (async () => {
      try {
        const res = await fetch(`/api/objectives?course=${selectedCourseId}&subject=${selectedSubjectId}&limit=100`);
        const data = await res.json();
        setObjectives(data.data || []);
      } catch {} finally { setLoadingD1(false); }
    })();
  }, [selectedCourseId, selectedSubjectId]);

  // Load indicators for ALL selected objectives
  const [indicatorsByObjective, setIndicatorsByObjective] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (selectedObjectives.length === 0) { setIndicatorsByObjective({}); setD1Indicators([]); return; }
    (async () => {
      const map: Record<string, any[]> = {};
      for (const obj of selectedObjectives) {
        if (!obj.code || obj.code === 'MANUAL') {
          map[obj.id] = generateFallbackIndicators(obj.text, obj.subject || subject);
          continue;
        }
        try {
          const res = await fetch(`/api/curriculum/indicators?oa_code=${encodeURIComponent(obj.code)}&limit=50`);
          const data = await res.json();
          const inds = data.indicators || [];
          map[obj.id] = inds.length > 0 ? inds : generateFallbackIndicators(obj.text, obj.subject || subject);
        } catch {
          map[obj.id] = generateFallbackIndicators(obj.text, obj.subject || subject);
        }
      }
      setIndicatorsByObjective(map);
      setD1Indicators(Object.values(map).flat());

      // Load skills for each objective
      const allSkills: any[] = [];
      const fbSkills: string[] = [];
      for (const obj of selectedObjectives) {
        try {
          const res = await fetch(`/api/curriculum/skills?objective_id=${obj.id}`);
          const data = await res.json();
          if (data.ok && data.data && data.data.length > 0) {
            allSkills.push(...data.data.map((s: any) => ({ id: s.id, text: s.official_text, source: 'D1' })));
          } else {
            fbSkills.push(...generateFallbackSkills(obj.text, obj.subject || subject));
          }
        } catch {
          fbSkills.push(...generateFallbackSkills(obj.text, obj.subject || subject));
        }
      }
      setD1Skills(allSkills);
      setFallbackSkills(fbSkills);
    })();
  }, [selectedObjectives]);

  // Initialize students when count changes
  useEffect(() => {
    setStudents(prev => {
      const current = [...prev];
      while (current.length < studentCount) {
        current.push({
          id: generateId('std'), studentName: `Estudiante ${current.length + 1}`,
          score: 0, maxScore, achievementPercent: 0, grade: 0,
          achievementLevel: 'No evaluado', objectives: [], achievedIndicators: [],
          needsSupportIndicators: [], strengths: [], needsSupport: [],
          familySuggestions: [], aiFeedbackForParents: '', teacherObservation: '',
          finalParentReport: '', status: 'pendiente',
        });
      }
      return current.slice(0, studentCount);
    });
  }, [studentCount, maxScore]);

  const sheets: ParentReportSheet[] = (() => {
    const maxPerSheet = 40;
    const result: ParentReportSheet[] = [];
    for (let i = 0; i < students.length; i += maxPerSheet) {
      result.push({ sheetNumber: result.length + 1, students: students.slice(i, i + maxPerSheet) });
    }
    return result.length > 0 ? result : [{ sheetNumber: 1, students: [] }];
  })();

  const batch: ParentReportBatch = {
    id: generateId(), school, teacher, course, subject, evaluationName,
    reportDate, maxScore, maxStudentsPerSheet: 40, sheets,
  };

  const currentSheetStudents = sheets[activeSheet]?.students || [];
  const totalGenerated = students.filter(s => s.status === 'generado' || s.status === 'editado').length;

  // Student management
  const updateStudent = useCallback((id: string, field: string, value: any) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const addStudent = useCallback(() => {
    if (!newStudentName.trim()) return;
    setStudents(prev => [...prev, {
      id: generateId('std'), studentName: newStudentName.trim(),
      score: 0, maxScore, achievementPercent: 0, grade: 0,
      achievementLevel: 'No evaluado', objectives: [], achievedIndicators: [],
      needsSupportIndicators: [], strengths: [], needsSupport: [],
      familySuggestions: [], aiFeedbackForParents: '', teacherObservation: '',
      finalParentReport: '', status: 'pendiente',
    }]);
    setNewStudentName('');
  }, [newStudentName, maxScore]);

  const removeStudent = useCallback((id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  }, []);

  // AI Generation
  const generateFeedback = useCallback(async (student: ParentStudentReport): Promise<Partial<ParentStudentReport>> => {
    try {
      const resp = await fetch('/api/reports/generate-parent-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.studentName, course, subject, evaluationName,
          score: student.score, maxScore: student.maxScore,
          achievementPercent: student.achievementPercent, grade: student.grade,
          achievementLevel: student.achievementLevel,
          objectives: selectedObjectives.map(o => o.text),
          selectedIndicators: selectedIndicators.map(i => ({ text: i.text, source: i.source })),
          selectedSkills: selectedSkills.map(s => ({ text: s.text, source: s.source })),
          achievedIndicators: student.achievedIndicators,
          needsSupportIndicators: student.needsSupportIndicators,
          audience: 'apoderados',
          country: 'Chile',
        }),
      });
      const data = await resp.json();
      if (data.ok) return {
        aiFeedbackForParents: data.parentFeedback || '',
        strengths: data.strengths || [], needsSupport: data.needsSupport || [],
        familySuggestions: data.familySuggestions || [],
        finalParentReport: data.parentFeedback || '', status: 'generado',
      };
      return { status: 'error' };
    } catch { return { status: 'error' }; }
  }, [course, subject, evaluationName, selectedObjectives, selectedIndicators, selectedSkills]);

  const handleGenerateAll = useCallback(async () => {
    setGenerating(true); setPaused(false);
    const pending = students.filter(s => s.status === 'pendiente' || s.status === 'error');
    setProgress({ current: 0, total: pending.length, batch: 'Procesando...' });
    const BATCH_SIZE = 5;
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      if (paused) break;
      const chunk = pending.slice(i, i + BATCH_SIZE);
      setProgress({ current: i + chunk.length, total: pending.length, batch: `Lote ${Math.floor(i / BATCH_SIZE) + 1}` });
      const results = await Promise.all(chunk.map(s => generateFeedback(s)));
      setStudents(prev => prev.map(s => {
        const idx = chunk.findIndex(c => c.id === s.id);
        return idx >= 0 ? { ...s, ...results[idx] } : s;
      }));
    }
    setGenerating(false);
  }, [students, paused, generateFeedback]);

  // Save to library
  const handleSaveToLibrary = useCallback(async () => {
    try {
      await fetch('/api/library/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, course, evaluationName, school, teacher, reportDate,
          studentCount: students.length,
          objectives: selectedObjectives.map(o => ({ code: o.code, text: o.text })),
          indicators: selectedIndicators.map(i => ({ code: i.oaCode, text: i.text })),
          studentNames: students.map(s => s.studentName),
        }),
      });
      setSavedToLibrary(true);
    } catch { setError('Error al guardar en Biblioteca.'); }
  }, [subject, course, evaluationName, school, teacher, reportDate, students, selectedObjectives, selectedIndicators]);

  // Export PDF
  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const { exportParentReportMassivePDF } = await import('../utils/exportParentReportPdf');
      await exportParentReportMassivePDF(batch);
      await handleSaveToLibrary();
    } catch { setError('Error al exportar PDF.'); }
    finally { setExporting(false); }
  }, [batch, handleSaveToLibrary]);

  const canProceed = [
    true, // Step 1 always proceed
    selectedObjectives.length > 0, // Step 2
    students.length > 0, // Step 3
    totalGenerated > 0, // Step 4
    true, // Step 5 always proceed
  ];

  return (
    <div className="space-y-5">
      {/* Step progress */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step || (i === step && canProceed[i]);
          return (
            <button key={s.id} onClick={() => i <= step && setStep(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25'
                  : done
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-white text-slate-400 border border-slate-200'
              }`}>
              {done && !active ? <Check size={14} /> : <Icon size={14} />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

      {/* Step 1: Configuration */}
      {step === 0 && (
        <div className="rounded-2xl border p-6 space-y-4 bg-white shadow-sm" style={{ borderColor: 'var(--line)' }}>
          <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>Configurar informe para apoderados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>Colegio</label>
              <input value={school} onChange={e => setSchool(e.target.value)} className="w-full text-sm p-2.5 rounded-xl border mt-1" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} /></div>
            <div><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>Docente</label>
              <input value={teacher} onChange={e => setTeacher(e.target.value)} className="w-full text-sm p-2.5 rounded-xl border mt-1" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} /></div>
            <div><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>Curso</label>
              <input value={course} onChange={e => setCourse(e.target.value)} className="w-full text-sm p-2.5 rounded-xl border mt-1" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} /></div>
            <div><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>Asignatura</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full text-sm p-2.5 rounded-xl border mt-1" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} /></div>
            <div><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>Evaluación</label>
              <input value={evaluationName} onChange={e => setEvaluationName(e.target.value)} className="w-full text-sm p-2.5 rounded-xl border mt-1" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} /></div>
            <div><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>Fecha</label>
              <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full text-sm p-2.5 rounded-xl border mt-1" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} /></div>
            <div><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>Cantidad estudiantes</label>
              <input type="number" min={1} max={200} value={studentCount} onChange={e => setStudentCount(Math.max(1, parseInt(e.target.value) || 1))} className="w-full text-sm p-2.5 rounded-xl border mt-1" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} />
              <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--muted2)' }}>{Math.ceil(studentCount / 40)} planilla(s) de {Math.min(studentCount, 40)}+</p></div>
            <div><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>Puntaje ideal</label>
              <input type="number" min={1} value={maxScore} onChange={e => setMaxScore(Math.max(1, parseInt(e.target.value) || 24))} className="w-full text-sm p-2.5 rounded-xl border mt-1" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} /></div>
          </div>
          <Button onClick={() => setStep(1)} disabled={!course || !subject}>Siguiente <ChevronRight size={14} /></Button>
        </div>
      )}

      {/* Step 2: D1 Objectives & Indicators */}
      {step === 1 && (
        <div className="rounded-2xl border p-6 space-y-4 bg-white shadow-sm" style={{ borderColor: 'var(--line)' }}>
          <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>Currículum, objetivos e indicadores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-[10px] font-semibold uppercase" style={{ color: 'var(--muted2)' }}>Curso (D1)</label>
              <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="w-full text-xs p-2 rounded border mt-1" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}>
                <option value="">Seleccionar curso</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.objective_count} OA)</option>)}
              </select></div>
            <div><label className="text-[10px] font-semibold uppercase" style={{ color: 'var(--muted2)' }}>Asignatura (D1)</label>
              <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="w-full text-xs p-2 rounded border mt-1" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}>
                <option value="">Seleccionar asignatura</option>
                {subjects.filter(s => s.objective_count > 0).map(s => <option key={s.id} value={s.id}>{s.name} ({s.objective_count})</option>)}
              </select></div>
          </div>
          {loadingD1 && <p className="text-xs" style={{ color: 'var(--muted2)' }}><Loader size={12} className="spin inline" /> Cargando objetivos...</p>}
          {objectives.length > 0 && (
            <div>
              <label className="text-[10px] font-semibold uppercase" style={{ color: 'var(--muted2)' }}>Objetivos disponibles ({objectives.length})</label>
              <div className="max-h-40 overflow-y-auto border rounded mt-1 space-y-1 p-2" style={{ borderColor: 'var(--line)' }}>
                {objectives.map(o => (
                  <label key={o.id} className="flex items-start gap-2 cursor-pointer text-[11px]" style={{ color: 'var(--ink2)' }}>
                    <input type="checkbox" checked={selectedObjectives.some(s => s.id === o.id)} onChange={() => {
                      setSelectedObjectives(prev => prev.some(s => s.id === o.id) ? prev.filter(s => s.id !== o.id) : [...prev, { id: o.id, code: o.code, text: o.official_text, subject: o.subject_name, level: o.course_name }]);
                    }} className="mt-0.5" />
                    <span><strong>{o.code}</strong> — {o.official_text?.slice(0, 80)}...</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {selectedObjectives.length > 0 && (
            <div>
              <label className="text-[10px] font-semibold uppercase" style={{ color: 'var(--muted2)' }}>Objetivos seleccionados ({selectedObjectives.length})</label>
              <div className="space-y-1 mt-1">
                {selectedObjectives.map(o => (
                  <div key={o.id} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-indigo-50" style={{ color: 'var(--ink2)' }}>
                    <span><strong>{o.code}</strong> — {o.text?.slice(0, 60)}...</span>
                    <button onClick={() => setSelectedObjectives(prev => prev.filter(s => s.id !== o.id))} className="text-red-400 hover:text-red-600"><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedObjectives.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase" style={{ color: 'var(--muted2)' }}>
                  Indicadores por objetivo ({selectedIndicators.length} seleccionados)
                </label>
                <div className="flex gap-1">
                  <button onClick={() => {
                    const all = Object.values(indicatorsByObjective).flat();
                    setSelectedIndicators(all.map(i => ({ id: i.id, oaCode: i.oa_code, text: i.indicator_text, source: i.source || 'D1' })));
                  }} className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--line)', color: 'var(--muted2)' }}>Todos</button>
                  <button onClick={() => setSelectedIndicators([])} className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--line)', color: 'var(--muted2)' }}>Ninguno</button>
                </div>
              </div>
              {selectedObjectives.map(obj => {
                const inds = indicatorsByObjective[obj.id] || [];
                return (
                  <div key={obj.id} className="rounded border p-2" style={{ borderColor: 'var(--line)' }}>
                    <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--ink)' }}>{obj.code} — {obj.text?.substring(0, 60)}...</p>
                    {inds.length > 0 ? (
                      <div className="space-y-0.5">
                        {inds.map(ind => (
                          <label key={ind.id} className="flex items-start gap-2 cursor-pointer text-[10px]" style={{ color: 'var(--ink2)' }}>
                            <input type="checkbox" checked={selectedIndicators.some(s => s.id === ind.id)} onChange={() => {
                              setSelectedIndicators(prev => prev.some(s => s.id === ind.id) ? prev.filter(s => s.id !== ind.id) : [...prev, { id: ind.id, oaCode: ind.oa_code, text: ind.indicator_text, source: ind.source || 'D1' }]);
                            }} className="mt-0.5" />
                            <span>{ind.indicator_text?.slice(0, 80)}{isSuggestedSource(ind.source) && <span className="text-[8px] ml-1 px-1 rounded bg-amber-100 text-amber-700">Sugerido desde OA</span>}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] italic" style={{ color: 'var(--muted2)' }}>Sin indicadores disponibles</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* Skills section */}
          {(d1Skills.length > 0 || fallbackSkills.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase" style={{ color: 'var(--muted2)' }}>
                  Habilidades ({selectedSkills.length} seleccionadas)
                </label>
                <div className="flex gap-1">
                  <button onClick={() => {
                    const all = [...d1Skills.map(s => ({ ...s, source: 'D1' })), ...fallbackSkills.map((t, i) => ({ id: `fb-skill-${i}`, text: t, source: 'curriculum_chileno_sugerido' }))];
                    setSelectedSkills(all);
                  }} className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--line)', color: 'var(--muted2)' }}>Todas</button>
                  <button onClick={() => setSelectedSkills([])} className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--line)', color: 'var(--muted2)' }}>Ninguna</button>
                </div>
              </div>
              {d1Skills.length > 0 && (
                <div className="rounded border p-2" style={{ borderColor: 'var(--line)' }}>
                  <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--ink)' }}>Habilidades oficiales D1</p>
                  <div className="space-y-0.5">
                    {d1Skills.map(sk => (
                      <label key={sk.id} className="flex items-start gap-2 cursor-pointer text-[10px]" style={{ color: 'var(--ink2)' }}>
                        <input type="checkbox" checked={selectedSkills.some(s => s.id === sk.id)} onChange={() => {
                          setSelectedSkills(prev => prev.some(s => s.id === sk.id) ? prev.filter(s => s.id !== sk.id) : [...prev, sk]);
                        }} className="mt-0.5" />
                        <span>{sk.text}</span>
                        <span className="text-[8px] px-1 rounded bg-blue-100 text-blue-700">D1</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {fallbackSkills.length > 0 && (
                <div className="rounded border p-2" style={{ borderColor: 'var(--line)' }}>
                  <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--ink)' }}>Habilidades sugeridas</p>
                  <div className="space-y-0.5">
                    {fallbackSkills.map((text, i) => (
                      <label key={i} className="flex items-start gap-2 cursor-pointer text-[10px]" style={{ color: 'var(--ink2)' }}>
                        <input type="checkbox" checked={selectedSkills.some(s => s.text === text)} onChange={() => {
                          setSelectedSkills(prev => prev.some(s => s.text === text) ? prev.filter(s => s.text !== text) : [...prev, { id: `fb-skill-${i}`, text, source: 'curriculum_chileno_sugerido' }]);
                        }} className="mt-0.5" />
                        <span>{text}</span>
                        <span className="text-[8px] px-1 rounded bg-amber-100 text-amber-700">Sugerido desde OA</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-semibold uppercase" style={{ color: 'var(--muted2)' }}>Agregar objetivo manual</label>
            <div className="flex gap-2 mt-1">
              <input value={manualObjective} onChange={e => setManualObjective(e.target.value)} placeholder="Escriba un objetivo manual..." className="flex-1 text-xs p-2 rounded border" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} />
              <Button onClick={() => { if (manualObjective.trim()) { setSelectedObjectives(prev => [...prev, { id: generateId('obj'), code: 'MANUAL', text: manualObjective.trim(), subject, level: course }]); setManualObjective(''); } }} variant="secondary" className="!text-xs"><Plus size={12} /></Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setStep(0)} variant="secondary">Atrás</Button>
            <Button onClick={() => setStep(2)} disabled={selectedObjectives.length === 0}>Siguiente <ChevronRight size={14} /></Button>
          </div>
        </div>
      )}

      {/* Step 3: Students */}
      {step === 2 && (
        <div className="rounded-2xl border p-6 space-y-4 bg-white shadow-sm" style={{ borderColor: 'var(--line)' }}>
          <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>Estudiantes ({students.length}) — Planilla {activeSheet + 1}/{sheets.length}</h3>
          {sheets.length > 1 && (
            <div className="flex gap-1">
              {sheets.map((s, i) => (
                <button key={i} onClick={() => setActiveSheet(i)} className={`px-2 py-1 rounded text-[10px] font-medium border ${activeSheet === i ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600'}`}>
                  Planilla {s.sheetNumber} ({s.students.length})
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStudent()} placeholder="Nombre del estudiante" className="flex-1 text-xs p-2 rounded border" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} />
            <Button onClick={addStudent} disabled={!newStudentName.trim()} variant="secondary" className="!text-xs !px-3"><Plus size={12} /> Agregar</Button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {currentSheetStudents.map((student) => (
              <div key={student.id} className="rounded border p-2 space-y-1" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2">
                  <input value={student.studentName} onChange={e => updateStudent(student.id, 'studentName', e.target.value)} className="flex-1 text-xs p-1 rounded border" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} />
                  <select value={student.achievementLevel} onChange={e => updateStudent(student.id, 'achievementLevel', e.target.value)} className="text-[10px] p-1 rounded border" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}>
                    <option>No evaluado</option><option>Adecuado</option><option>Elemental</option><option>Insuficiente</option>
                  </select>
                  <button onClick={() => removeStudent(student.id)} className="text-red-400 hover:text-red-600"><Trash2 size={10} /></button>
                </div>
                <div className="flex gap-2">
                  <input type="number" placeholder="Puntaje" value={student.score || ''} onChange={e => updateStudent(student.id, 'score', Number(e.target.value))} className="w-16 text-[10px] p-1 rounded border" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} />
                  <input type="number" placeholder="%" value={student.achievementPercent || ''} onChange={e => updateStudent(student.id, 'achievementPercent', Number(e.target.value))} className="w-16 text-[10px] p-1 rounded border" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} />
                  <input type="number" placeholder="Nota" value={student.grade || ''} onChange={e => updateStudent(student.id, 'grade', Number(e.target.value))} className="w-16 text-[10px] p-1 rounded border" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setStep(1)} variant="secondary">Atrás</Button>
            <Button onClick={() => setStep(3)} disabled={students.length === 0}>Siguiente <ChevronRight size={14} /></Button>
          </div>
        </div>
      )}

      {/* Step 4: AI Observations */}
      {step === 3 && (
        <div className="rounded-2xl border p-6 space-y-4 bg-white shadow-sm" style={{ borderColor: 'var(--line)' }}>
          <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>Observaciones IA ({totalGenerated}/{students.length} generadas)</h3>
          {generating && (
            <div className="rounded p-2 bg-indigo-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-indigo-700">{progress.batch} — {progress.current}/{progress.total}</span>
                <button onClick={() => setPaused(!paused)} className="text-[10px] px-2 py-0.5 rounded border border-indigo-300 text-indigo-600">{paused ? 'Reanudar' : 'Pausar'}</button>
              </div>
              <div className="w-full h-1.5 rounded-full bg-indigo-200 overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }} />
              </div>
            </div>
          )}
          <Button onClick={handleGenerateAll} disabled={generating || students.every(s => s.status === 'generado' || s.status === 'editado')} variant="primary">
            {generating ? <Loader size={14} className="spin" /> : <Play size={14} />}
            {generating ? 'Generando...' : `Generar observaciones para todos (${students.filter(s => s.status === 'pendiente' || s.status === 'error').length} pendientes)`}
          </Button>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <div key={student.id} className="rounded border p-2" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{student.studentName} — {student.achievementLevel}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${student.status === 'generado' ? 'bg-emerald-100 text-emerald-700' : student.status === 'editado' ? 'bg-blue-100 text-blue-700' : student.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    {student.status === 'generado' ? 'Generado' : student.status === 'editado' ? 'Editado' : student.status === 'error' ? 'Error' : 'Pendiente'}
                  </span>
                </div>
                {(student.finalParentReport || student.aiFeedbackForParents) && editingId !== student.id && (
                  <p className="text-[10px] mt-1 leading-relaxed" style={{ color: 'var(--ink2)' }}>{(student.finalParentReport || student.aiFeedbackForParents).substring(0, 120)}...</p>
                )}
                {editingId === student.id && (
                  <div className="mt-1">
                    <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full text-[10px] p-1.5 rounded border resize-none" style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }} rows={3} />
                    <div className="flex gap-1 mt-1">
                      <button onClick={() => { setStudents(prev => prev.map(s => s.id === editingId ? { ...s, finalParentReport: editText, teacherObservation: editText, status: 'editado' } : s)); setEditingId(null); }} className="text-[9px] px-2 py-0.5 rounded bg-emerald-500 text-white">Guardar</button>
                      <button onClick={() => setEditingId(null)} className="text-[9px] px-2 py-0.5 rounded border" style={{ borderColor: 'var(--line)' }}>Cancelar</button>
                    </div>
                  </div>
                )}
                <button onClick={() => { setEditingId(student.id); setEditText(student.finalParentReport || student.aiFeedbackForParents || ''); }} className="text-[9px] text-indigo-500 hover:underline mt-1"><Edit3 size={9} className="inline" /> Editar</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setStep(2)} variant="secondary">Atrás</Button>
            <Button onClick={() => setStep(4)} disabled={totalGenerated === 0}>Siguiente <ChevronRight size={14} /></Button>
          </div>
        </div>
      )}

      {/* Step 5: Export & Save */}
      {step === 4 && (
        <div className="rounded-2xl border p-6 space-y-4 bg-white shadow-sm" style={{ borderColor: 'var(--line)' }}>
          <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>Exportar informe final y guardar en Biblioteca</h3>
          <p className="text-xs" style={{ color: 'var(--muted2)' }}>
            {students.length} estudiantes • {totalGenerated} observaciones generadas • {sheets.length} planilla(s)
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleExportPDF} disabled={exporting}>
              {exporting ? <Loader size={14} className="spin" /> : <Download size={14} />}
              {exporting ? 'Exportando...' : 'Exportar informe final (PDF)'}
            </Button>
            <Button onClick={handleSaveToLibrary} variant="secondary" disabled={savedToLibrary}>
              {savedToLibrary ? <Check size={14} /> : <BookOpen size={14} />}
              {savedToLibrary ? 'Guardado en Biblioteca' : 'Guardar en Biblioteca'}
            </Button>
          </div>
          {savedToLibrary && <p className="text-xs text-emerald-600">Informe guardado exitosamente en la Biblioteca.</p>}
          <div className="flex gap-2">
            <Button onClick={() => setStep(3)} variant="secondary">Atrás</Button>
          </div>
        </div>
      )}
    </div>
  );
}
