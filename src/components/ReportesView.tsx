import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart2, Plus, Trash2, Printer, Download, ChevronDown, ChevronUp,
  Users, FileText, Settings, Edit3, CheckCircle, AlertTriangle,
  XCircle, Minus, BookOpen, FileDown
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SectionHeader } from './ui/SectionHeader';
import {
  SUBJECTS, COURSES, getIndicatorsForSubjectCourse, getMaxScore
} from '../data/oaDatabase';
import { exportStudentReportPDF, exportClassSummaryPDF } from '../utils/exportReportPdf';
import { ParentReportPanel } from './ParentReportPanel';
import type { ReportConfig, ReportIndicator, StudentData, StudentScore, NivelLogro, StudentReportResult } from '../types';

const DEFAULT_STUDENTS: StudentData[] = [
  { id: 's1', name: 'Alvarez Jaque Joaquin Omar', run: '', observations: '' },
  { id: 's2', name: 'Astorga Haro Joaquin Alonso', run: '', observations: '' },
  { id: 's3', name: 'Avila Aguayo Emiliano Ignacio', run: '', observations: '' },
  { id: 's4', name: 'Bustamante Jimenez Lucas Ignacio', run: '', observations: '' },
  { id: 's5', name: 'Carreño Arce Mhmo Antonio', run: '', observations: '' },
  { id: 's6', name: 'Cartes Leon Renatta Antonella', run: '', observations: '' },
  { id: 's7', name: 'Castillo Hidalgo Sebastian Ignacio', run: '', observations: '' },
  { id: 's8', name: 'Catalan Torres Emilia Antonia', run: '', observations: '' },
  { id: 's9', name: 'Del Pino Ubilla Matias Alfonso', run: '', observations: '' },
  { id: 's10', name: 'Devera Manrique Sebastian Mathias', run: '', observations: '' },
];

function calculateGrade(totalScore: number, maxScore: number, minGrade: number): { grade: number; nivel: NivelLogro; percentage: number } {
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const grade = maxScore > 0 ? Math.round((totalScore / maxScore) * 7 * 10) / 10 : minGrade;

  let nivel: NivelLogro;
  if (percentage === 0 && totalScore === 0) nivel = 'No evaluado';
  else if (grade < minGrade) nivel = 'Insuficiente';
  else if (percentage >= 90) nivel = 'Adecuado';
  else if (percentage >= 60) nivel = 'Elemental';
  else nivel = 'Insuficiente';

  return { grade: Math.max(grade, minGrade), nivel, percentage };
}

function getNivelColor(nivel: NivelLogro) {
  switch (nivel) {
    case 'Adecuado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Elemental': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Insuficiente': return 'bg-red-100 text-red-700 border-red-200';
    case 'No evaluado': return 'bg-gray-100 text-gray-500 border-gray-200';
  }
}

function getNivelIcon(nivel: NivelLogro) {
  switch (nivel) {
    case 'Adecuado': return <CheckCircle size={12} />;
    case 'Elemental': return <AlertTriangle size={12} />;
    case 'Insuficiente': return <XCircle size={12} />;
    case 'No evaluado': return <Minus size={12} />;
  }
}

export function ReportesView() {
  const [subject, setSubject] = useState('');
  const [course, setCourse] = useState('2° Basico');

  // D1 dynamic data
  const [d1Courses, setD1Courses] = useState<any[]>([]);
  const [d1Subjects, setD1Subjects] = useState<any[]>([]);
  const [d1Objectives, setD1Objectives] = useState<any[]>([]);
  const [d1Indicators, setD1Indicators] = useState<any[]>([]);
  const [selectedD1Course, setSelectedD1Course] = useState('');
  const [selectedD1Subject, setSelectedD1Subject] = useState('');
  const [loadingD1, setLoadingD1] = useState(false);
  const [config, setConfig] = useState<Omit<ReportConfig, 'subject' | 'course'>>({
    schoolName: 'LICEO NACIONAL DE LLOLLEO',
    teacher: 'Conny Rubio Riquelme',
    reportDate: new Date().toISOString().split('T')[0],
    maxScore: 24,
    minGrade: 1.0,
    requiredPercentage: 60,
  });

  const indicators = useMemo<ReportIndicator[]>(() => {
    return getIndicatorsForSubjectCourse(subject, course).map(i => ({
      id: i.id,
      oaCode: i.oaCode,
      description: i.description,
      maxPoints: i.maxPoints,
    }));
  }, [subject, course]);

  const computedMaxScore = useMemo(() => getMaxScore(subject, course), [subject, course]);

  useEffect(() => {
    setConfig(prev => ({ ...prev, maxScore: computedMaxScore }));
  }, [computedMaxScore]);

  // Load D1 courses on mount and select default subject
  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(d => setD1Courses(d.data || [])).catch(() => {});
    // Load all subjects to select default
    fetch('/api/subjects').then(r => r.json()).then(d => {
      const subs = (d.data || []).filter((s: any) => Number(s.objective_count || 0) > 0);
      if (subs.length > 0 && !subject) {
        const preferred = subs.find((s: any) => s.name === 'Lenguaje y Comunicación')
          || subs[0];
        if (preferred) setSubject(preferred.name);
      }
    }).catch(() => {});
  }, []);

  // Load D1 subjects when course changes
  useEffect(() => {
    if (!selectedD1Course) { setD1Subjects([]); return; }
    fetch(`/api/subjects?course=${selectedD1Course}`).then(r => r.json()).then(d => {
      const subs = d.data || [];
      setD1Subjects(subs);
      // Auto-select default subject if empty
      if (!subject && subs.length > 0) {
        const preferred = subs.find((s: any) => s.name === 'Lenguaje y Comunicación')
          || subs.find((s: any) => Number(s.objective_count || 0) > 0);
        if (preferred) setSubject(preferred.name);
      }
    }).catch(() => {});
  }, [selectedD1Course]);

  // Load D1 objectives when course+subject change
  useEffect(() => {
    if (!selectedD1Course || !selectedD1Subject) { setD1Objectives([]); setD1Indicators([]); return; }
    setLoadingD1(true);
    fetch(`/api/objectives?course=${selectedD1Course}&subject=${selectedD1Subject}&limit=100`)
      .then(r => r.json()).then(d => setD1Objectives(d.data || [])).catch(() => {})
      .finally(() => setLoadingD1(false));
  }, [selectedD1Course, selectedD1Subject]);

  const [students, setStudents] = useState<StudentData[]>(DEFAULT_STUDENTS);
  const [scores, setScores] = useState<StudentScore[]>(() =>
    DEFAULT_STUDENTS.map(s => ({ studentId: s.id, indicatorScores: {} }))
  );
  const [activeTab, setActiveTab] = useState<'config' | 'grades' | 'summary' | 'individual'>('grades');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [exportingPdf, setExportingPdf] = useState<string | null>(null);

  const fullConfig = useMemo<ReportConfig>(() => ({
    ...config,
    subject,
    course,
  }), [config, subject, course]);

  const results = useMemo<StudentReportResult[]>(() => {
    return students.map(student => {
      const studentScore = scores.find(s => s.studentId === student.id);
      const totalScore = studentScore
        ? Object.values(studentScore.indicatorScores).reduce((a, b) => a + b, 0)
        : 0;
      const { grade, nivel, percentage } = calculateGrade(totalScore, fullConfig.maxScore, fullConfig.minGrade);
      return { studentId: student.id, totalScore, percentage, grade, nivelLogro: nivel };
    });
  }, [students, scores, fullConfig]);

  const summaryStats = useMemo(() => {
    const total = results.length;
    const adecuados = results.filter(r => r.nivelLogro === 'Adecuado').length;
    const elementales = results.filter(r => r.nivelLogro === 'Elemental').length;
    const insuficientes = results.filter(r => r.nivelLogro === 'Insuficiente').length;
    const noEvaluados = results.filter(r => r.nivelLogro === 'No evaluado').length;
    return { total, adecuados, elementales, insuficientes, noEvaluados };
  }, [results]);

  const updateScore = useCallback((studentId: string, indicatorId: string, value: number) => {
    setScores(prev => {
      const existing = prev.find(s => s.studentId === studentId);
      if (existing) {
        return prev.map(s =>
          s.studentId === studentId
            ? { ...s, indicatorScores: { ...s.indicatorScores, [indicatorId]: value } }
            : s
        );
      }
      return [...prev, { studentId, indicatorScores: { [indicatorId]: value } }];
    });
  }, []);

  const addStudent = () => {
    if (!newStudentName.trim()) return;
    const newId = `s${Date.now()}`;
    setStudents(prev => [...prev, { id: newId, name: newStudentName.trim(), run: '', observations: '' }]);
    setScores(prev => [...prev, { studentId: newId, indicatorScores: {} }]);
    setNewStudentName('');
  };

  const removeStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setScores(prev => prev.filter(s => s.studentId !== id));
  };

  const getScore = (studentId: string, indicatorId: string): number => {
    const studentScore = scores.find(s => s.studentId === studentId);
    return studentScore?.indicatorScores[indicatorId] ?? 0;
  };

  const getResult = (studentId: string) => results.find(r => r.studentId === studentId);

  const handleExportStudentPDF = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    const result = results.find(r => r.studentId === studentId);
    const studentScore = scores.find(s => s.studentId === studentId);
    if (!student || !result || !studentScore) return;

    setExportingPdf(studentId);
    try {
      await exportStudentReportPDF(fullConfig, student, indicators, studentScore, result);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setExportingPdf(null);
    }
  };

  const handleExportAllPDF = async () => {
    setExportingPdf('all');
    try {
      await exportClassSummaryPDF(fullConfig, indicators, students, scores, results);
    } catch (err) {
      console.error('Error exporting summary PDF:', err);
    } finally {
      setExportingPdf(null);
    }
  };

  const handlePrint = () => window.print();

  const tabs = [
    { id: 'config' as const, label: 'Configuracion', icon: Settings },
    { id: 'grades' as const, label: 'Calificaciones', icon: Edit3 },
    { id: 'summary' as const, label: 'Resumen', icon: BarChart2 },
    { id: 'individual' as const, label: 'Informes Individuales', icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <SectionHeader
        icon={BarChart2}
        iconColor="#213885"
        title="Informe Final Formativo"
        description="Evalua a tus estudiantes con indicadores alineados al MINEDUC."
      />

      {/* Subject / Course Selector */}
      <div className="flex flex-col sm:flex-row gap-3 mt-5">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Asignatura</label>
          <select
            value={subject}
            onChange={e => { setSubject(e.target.value); setSelectedD1Subject(''); }}
            className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          >
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            {d1Subjects.length > 0 && <option disabled>─── Asignaturas D1 ───</option>}
            {d1Subjects.filter(s => s.objective_count > 0).map(s => (
              <option key={s.id} value={s.name}>[D1] {s.name} ({s.objective_count} OA)</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Curso</label>
          <select
            value={course}
            onChange={e => { setCourse(e.target.value); setSelectedD1Course(''); }}
            className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          >
            {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
            {d1Courses.length > 0 && <option disabled>─── Cursos D1 ───</option>}
            {d1Courses.filter(c => c.objective_count > 0).map(c => (
              <option key={c.id} value={c.name}>[D1] {c.name} ({c.objective_count} OA)</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-200/60 rounded-xl text-center">
            <p className="text-[10px] font-bold text-indigo-500 uppercase">Indicadores</p>
            <p className="text-lg font-bold text-indigo-700">{indicators.length + d1Indicators.length}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200/60 overflow-x-auto gap-1 mt-5 -mb-px">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════ CONFIG TAB ═══════════════════ */}
      {activeTab === 'config' && (
        <div className="mt-5 space-y-5">
          <Card>
            <h3 className="text-sm font-bold text-theme-text mb-4 flex items-center gap-2">
              <Settings size={16} className="text-indigo-500" />
              Datos del Informe
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre del Colegio</label>
                <input type="text" value={config.schoolName} onChange={e => setConfig(prev => ({ ...prev, schoolName: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Profesor(a)</label>
                <input type="text" value={config.teacher} onChange={e => setConfig(prev => ({ ...prev, teacher: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Fecha de Reporte</label>
                <input type="date" value={config.reportDate} onChange={e => setConfig(prev => ({ ...prev, reportDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Nota Minima</label>
                <input type="number" step="0.1" value={config.minGrade} onChange={e => setConfig(prev => ({ ...prev, minGrade: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">% Exigencia</label>
                <input type="number" value={config.requiredPercentage} onChange={e => setConfig(prev => ({ ...prev, requiredPercentage: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all" />
              </div>
            </div>
          </Card>

          {/* Indicators (read-only from database) */}
          <Card>
            <h3 className="text-sm font-bold text-theme-text mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" />
              Indicadores de Evaluacion - {subject} ({course})
            </h3>
            <div className="space-y-2">
              {indicators.map((ind, idx) => (
                <div key={ind.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                  <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-indigo-600">{ind.oaCode}</span>
                    <p className="text-xs text-gray-700 leading-relaxed mt-0.5">{ind.description}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-lg shrink-0">{ind.maxPoints} pts</span>
                </div>
              ))}
              {indicators.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No hay indicadores para esta asignatura y curso. Selecciona otra combinacion.</p>
              )}
            </div>
          </Card>

          {/* Students */}
          <Card>
            <h3 className="text-sm font-bold text-theme-text mb-4 flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              Estudiantes ({students.length})
            </h3>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStudent()} placeholder="Nombre completo del estudiante..." className="flex-1 px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              <Button variant="primary" size="sm" iconLeft={Plus} onClick={addStudent}>Agregar</Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {students.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg group">
                  <span className="text-xs font-bold text-gray-400 w-6">{idx + 1}</span>
                  <span className="flex-1 text-sm text-theme-text truncate">{student.name}</span>
                  <button onClick={() => removeStudent(student.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════ GRADES TAB ═══════════════════ */}
      {activeTab === 'grades' && (
        <div className="mt-5">
          <Card className="overflow-hidden !p-0">
            <div className="p-4 border-b border-gray-200/60 bg-gray-50/50 flex justify-between items-center flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-theme-text">{config.schoolName}</h3>
                <p className="text-xs text-gray-500">{subject} · {course} · {config.teacher}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" iconLeft={Printer} onClick={handlePrint}>Imprimir</Button>
                <Button variant="ghost" size="sm" iconLeft={FileDown} onClick={handleExportAllPDF} loading={exportingPdf === 'all'}>Exportar PDF</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200/60 bg-gray-50/80">
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50/80 z-10 min-w-[40px]">#</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky left-10 bg-gray-50/80 z-10 min-w-[180px]">Nombre</th>
                    {indicators.map((ind) => (
                      <th key={ind.id} className="p-2 text-[9px] font-bold text-gray-500 uppercase tracking-wider text-center min-w-[70px]">
                        <div className="text-indigo-600">{ind.oaCode}</div>
                        <div className="text-[8px] font-normal normal-case tracking-normal text-gray-400 max-w-[80px] truncate" title={ind.description}>{ind.description.slice(0, 25)}...</div>
                      </th>
                    ))}
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center bg-indigo-50/80 min-w-[50px]">Total</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center bg-indigo-50/80 min-w-[45px]">%</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center bg-indigo-50/80 min-w-[40px]">Nota</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center bg-indigo-50/80 min-w-[80px]">Nivel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student, idx) => {
                    const result = getResult(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-2 text-xs text-gray-400 sticky left-0 bg-white z-10">{idx + 1}</td>
                        <td className="p-2 text-xs font-medium text-theme-text sticky left-10 bg-white z-10 truncate max-w-[180px]">{student.name}</td>
                        {indicators.map(ind => (
                          <td key={ind.id} className="p-1 text-center">
                            <input type="number" min={0} max={ind.maxPoints} value={getScore(student.id, ind.id)} onChange={e => updateScore(student.id, ind.id, Math.min(ind.maxPoints, Math.max(0, Number(e.target.value))))} className="w-11 h-7 text-center text-xs font-semibold rounded-lg border border-gray-200/80 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all" />
                          </td>
                        ))}
                        <td className="p-2 text-center text-xs font-bold text-theme-text bg-indigo-50/30">{result?.totalScore ?? 0}</td>
                        <td className="p-2 text-center text-xs font-semibold text-gray-600 bg-indigo-50/30">{result?.percentage ?? 0}%</td>
                        <td className="p-2 text-center text-sm font-bold text-theme-text bg-indigo-50/30">{result?.grade.toFixed(1) ?? '-'}</td>
                        <td className="p-2 text-center bg-indigo-50/30">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getNivelColor(result?.nivelLogro || 'No evaluado')}`}>
                            {getNivelIcon(result?.nivelLogro || 'No evaluado')}
                            {result?.nivelLogro || '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-gray-200/60 bg-gray-50/50 flex items-center gap-4 text-xs flex-wrap">
              <span className="font-semibold text-gray-500">Puntaje Maximo: <span className="font-bold text-theme-text">{fullConfig.maxScore}</span></span>
              <span className="text-gray-300">|</span>
              <span className="font-semibold text-gray-500">% Exigencia: <span className="font-bold text-theme-text">{config.requiredPercentage}%</span></span>
              <span className="text-gray-300">|</span>
              <span className="font-semibold text-gray-500">Nota Minima: <span className="font-bold text-theme-text">{config.minGrade}</span></span>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════ SUMMARY TAB ═══════════════════ */}
      {activeTab === 'summary' && (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: summaryStats.total, color: 'text-gray-700 bg-gray-50 border-gray-200' },
              { label: 'Adecuado', value: summaryStats.adecuados, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              { label: 'Elemental', value: summaryStats.elementales, color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { label: 'Insuficiente', value: summaryStats.insuficientes, color: 'text-red-700 bg-red-50 border-red-200' },
              { label: 'No evaluado', value: summaryStats.noEvaluados, color: 'text-gray-500 bg-gray-50 border-gray-200' },
            ].map(stat => (
              <Card key={stat.label} className={`text-center border ${stat.color}`}>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-1">{stat.label}</p>
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="text-sm font-bold text-theme-text mb-4">Distribucion de Niveles de Logro</h3>
            <div className="space-y-4">
              {[
                { label: 'Adecuado', count: summaryStats.adecuados, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
                { label: 'Elemental', count: summaryStats.elementales, color: 'bg-amber-500', textColor: 'text-amber-600' },
                { label: 'Insuficiente', count: summaryStats.insuficientes, color: 'bg-red-500', textColor: 'text-red-600' },
                { label: 'No evaluado', count: summaryStats.noEvaluados, color: 'bg-gray-400', textColor: 'text-gray-500' },
              ].map(item => {
                const pct = summaryStats.total > 0 ? Math.round((item.count / summaryStats.total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-gray-600">{item.label}</span>
                      <span className={`font-bold ${item.textColor}`}>{item.count} ({pct}%)</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`${item.color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-theme-text">Tabla Resumen</h3>
              <Button variant="outline" size="sm" iconLeft={FileDown} onClick={handleExportAllPDF} loading={exportingPdf === 'all'}>Exportar PDF</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-3">#</th><th className="p-3">Nombre</th><th className="p-3 text-center">Puntaje</th><th className="p-3 text-center">% Logro</th><th className="p-3 text-center">Nota</th><th className="p-3 text-center">Nivel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student, idx) => {
                    const result = getResult(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50/50">
                        <td className="p-3 text-xs text-gray-400">{idx + 1}</td>
                        <td className="p-3 text-xs font-medium text-theme-text">{student.name}</td>
                        <td className="p-3 text-center text-xs font-bold text-theme-text">{result?.totalScore ?? 0}</td>
                        <td className="p-3 text-center text-xs font-semibold text-gray-600">{result?.percentage ?? 0}%</td>
                        <td className="p-3 text-center text-sm font-bold text-theme-text">{result?.grade.toFixed(1) ?? '-'}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getNivelColor(result?.nivelLogro || 'No evaluado')}`}>
                            {getNivelIcon(result?.nivelLogro || 'No evaluado')}{result?.nivelLogro || '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════ INDIVIDUAL TAB ═══════════════════ */}
      {activeTab === 'individual' && (
        <div className="mt-5 space-y-4">
          {students.map((student, idx) => {
            const result = getResult(student.id);
            const isExpanded = expandedStudent === student.id;
            return (
              <Card key={student.id} className="overflow-hidden">
                <button onClick={() => setExpandedStudent(isExpanded ? null : student.id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-6">{idx + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-theme-text">{student.name}</p>
                      <p className="text-[10px] text-gray-500">Puntaje: {result?.totalScore ?? 0} | {result?.percentage ?? 0}% | Nota: {result?.grade.toFixed(1) ?? '-'} | {result?.nivelLogro ?? '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getNivelColor(result?.nivelLogro || 'No evaluado')}`}>
                      {getNivelIcon(result?.nivelLogro || 'No evaluado')}{result?.nivelLogro || '-'}
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-200/60 bg-gray-50/30 space-y-4">
                    {/* Individual scores */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {indicators.map(ind => {
                        const score = getScore(student.id, ind.id);
                        const pct = ind.maxPoints > 0 ? Math.round((score / ind.maxPoints) * 100) : 0;
                        return (
                          <div key={ind.id} className="p-3 bg-white rounded-xl border border-gray-200/60">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold text-indigo-600">{ind.oaCode}</span>
                              <span className="text-xs font-bold text-theme-text">{score}/{ind.maxPoints}</span>
                            </div>
                            <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-2">{ind.description}</p>
                            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 90 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Observations */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Observaciones</label>
                      <textarea value={student.observations} onChange={e => setStudents(prev => prev.map(s => s.id === student.id ? { ...s, observations: e.target.value } : s))} rows={4} placeholder="Escribe las observaciones del estudiante..." className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all" />
                    </div>

                    {/* Export PDF button per student */}
                    <div className="flex gap-2">
                      <Button variant="premium" size="sm" iconLeft={FileDown} onClick={() => handleExportStudentPDF(student.id)} loading={exportingPdf === student.id}>
                        Descargar Informe PDF
                      </Button>
                      <Button variant="outline" size="sm" iconLeft={Printer} onClick={handlePrint}>
                        Imprimir
                      </Button>
                    </div>

                    {/* Individual report preview */}
                    <div className="p-4 bg-white rounded-xl border border-gray-200/60">
                      <div className="text-center mb-3">
                        <p className="text-xs font-bold text-gray-800">{config.schoolName}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Informe Final Formativo</p>
                        <p className="text-[10px] text-gray-500 mt-1">{subject} · {course}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div><strong className="text-gray-600">Nombre:</strong> <span className="text-theme-text">{student.name}</span></div>
                        <div><strong className="text-gray-600">Profesor(a):</strong> <span className="text-theme-text">{config.teacher}</span></div>
                        <div><strong className="text-gray-600">Puntaje:</strong> <span className="text-theme-text font-bold">{result?.totalScore ?? 0}/{fullConfig.maxScore}</span></div>
                        <div><strong className="text-gray-600">% Logro:</strong> <span className="text-theme-text font-bold">{result?.percentage ?? 0}%</span></div>
                        <div><strong className="text-gray-600">Nota:</strong> <span className="text-theme-text font-bold">{result?.grade.toFixed(1) ?? '-'}</span></div>
                        <div><strong className="text-gray-600">Nivel:</strong> <span className={`ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${getNivelColor(result?.nivelLogro || 'No evaluado')}`}>{result?.nivelLogro || '-'}</span></div>
                      </div>
                      {student.observations && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200/60">
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Observaciones:</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{student.observations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {/* Parent Report Module */}
          <div className="mt-8">
            <SectionHeader icon={Users} iconColor="#7c3aed" title="Informe Final Formativo para Apoderados" description="Genera informes individuales para estudiantes y apoderados, con observaciones automáticas según objetivos, indicadores y nivel de logro." />
            <div className="mt-4">
              <ParentReportPanel />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
