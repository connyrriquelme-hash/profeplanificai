import { useState, useCallback } from 'react';
import { Upload, Download, Play, Pause, Edit3, Plus, Trash2, Loader, ChevronDown, FileText } from 'lucide-react';
import { Button } from './ui/Button';
import type { ParentReportBatch, ParentReportSheet, ParentStudentReport } from '../services/reportImportService';
import { importParentReportExcel } from '../services/reportImportService';
import { exportParentReportIndividualPDF, exportParentReportMassivePDF } from '../utils/exportParentReportPdf';

function generateStudentId(): string {
  return `std-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

export function ParentReportPanel() {
  const [batch, setBatch] = useState<ParentReportBatch | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, batch: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');
  const [newStudentName, setNewStudentName] = useState('');

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const imported = await importParentReportExcel(file);
      setBatch(imported);
      setActiveSheet(0);
    } catch (err: any) {
      setError(err.message);
    }
    e.target.value = '';
  }, []);

  const addStudent = useCallback(() => {
    if (!batch || !newStudentName.trim()) return;
    const sheets: ParentReportSheet[] = batch.sheets.map(s => ({ ...s, students: [...s.students] }));
    let targetIndex = activeSheet;

    if (sheets[targetIndex].students.length >= batch.maxStudentsPerSheet) {
      sheets.push({ sheetNumber: sheets.length + 1, students: [] });
      targetIndex = sheets.length - 1;
      setActiveSheet(targetIndex);
    }

    sheets[targetIndex].students.push({
      id: generateStudentId(),
      studentName: newStudentName.trim(),
      score: 0,
      maxScore: batch.maxScore,
      achievementPercent: 0,
      grade: 0,
      achievementLevel: 'No evaluado',
      objectives: [],
      achievedIndicators: [],
      needsSupportIndicators: [],
      strengths: [],
      needsSupport: [],
      familySuggestions: [],
      aiFeedbackForParents: '',
      teacherObservation: '',
      finalParentReport: '',
      status: 'pendiente',
    });

    setBatch({ ...batch, sheets });
    setNewStudentName('');
  }, [batch, activeSheet, newStudentName]);

  const removeStudent = useCallback((studentId: string) => {
    if (!batch) return;
    const newSheets: ParentReportSheet[] = batch.sheets.map((sheet, idx) => {
      if (idx !== activeSheet) return sheet;
      return { ...sheet, students: sheet.students.filter(s => s.id !== studentId) };
    }).filter(s => s.students.length > 0 || batch.sheets.length === 1);
    const renumbered = newSheets.map((s, i) => ({ ...s, sheetNumber: i + 1 }));
    setBatch({ ...batch, sheets: renumbered });
    if (activeSheet >= renumbered.length) setActiveSheet(Math.max(0, renumbered.length - 1));
  }, [batch, activeSheet]);

  const generateFeedback = useCallback(async (student: ParentStudentReport): Promise<Partial<ParentStudentReport>> => {
    try {
      const resp = await fetch('/api/reports/generate-parent-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.studentName,
          course: batch?.course || '',
          subject: batch?.subject || '',
          evaluationName: batch?.evaluationName || '',
          score: student.score,
          maxScore: student.maxScore,
          achievementPercent: student.achievementPercent,
          grade: student.grade,
          achievementLevel: student.achievementLevel,
          objectives: student.objectives,
          achievedIndicators: student.achievedIndicators,
          needsSupportIndicators: student.needsSupportIndicators,
        }),
      });
      const data = await resp.json();
      if (data.ok) {
        return {
          aiFeedbackForParents: data.parentFeedback || '',
          strengths: data.strengths || [],
          needsSupport: data.needsSupport || [],
          familySuggestions: data.familySuggestions || [],
          finalParentReport: data.parentFeedback || '',
          status: 'generado',
        };
      }
      return { status: 'error' };
    } catch {
      return { status: 'error' };
    }
  }, [batch]);

  const handleGenerateAll = useCallback(async () => {
    if (!batch) return;
    setGenerating(true);
    setPaused(false);

    const allStudents = batch.sheets.flatMap(s => s.students);
    const pending = allStudents.filter(s => s.status === 'pendiente' || s.status === 'error');
    setProgress({ current: 0, total: pending.length, batch: 'Procesando...' });

    const BATCH_SIZE = 5;
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      if (paused) break;
      const batchChunk = pending.slice(i, i + BATCH_SIZE);
      setProgress({ current: i + batchChunk.length, total: pending.length, batch: `Lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(pending.length / BATCH_SIZE)}` });

      // Process batch in parallel
      const results = await Promise.all(batchChunk.map(s => generateFeedback(s)));

      setBatch(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sheets: prev.sheets.map(sheet => ({
            ...sheet,
            students: sheet.students.map(s => {
              const idx = batchChunk.findIndex(bc => bc.id === s.id);
              if (idx >= 0) return { ...s, ...results[idx] };
              return s;
            }),
          })),
        };
      });
    }
    setGenerating(false);
  }, [batch, paused, generateFeedback]);

  const handleStartEdit = useCallback((student: ParentStudentReport) => {
    setEditingId(student.id);
    setEditText(student.finalParentReport || student.aiFeedbackForParents || '');
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!batch || !editingId) return;
    setBatch(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sheets: prev.sheets.map(sheet => ({
          ...sheet,
          students: sheet.students.map(s =>
            s.id === editingId ? { ...s, finalParentReport: editText, teacherObservation: editText, status: 'editado' as const } : s
          ),
        })),
      };
    });
    setEditingId(null);
    setEditText('');
  }, [batch, editingId, editText]);

  const allStudents = batch?.sheets.flatMap(s => s.students) || [];
  const currentSheetStudents = batch?.sheets[activeSheet]?.students || [];
  const generated = allStudents.filter(s => s.status === 'generado' || s.status === 'editado').length;
  const currentSheetFull = currentSheetStudents.length >= (batch?.maxStudentsPerSheet || 40);

  if (!batch) {
    return (
      <div className="rounded-xl border p-6 text-center" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
        <Upload size={32} className="mx-auto mb-3" style={{ color: 'var(--muted2)' }} />
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>Importar planilla de evaluación</p>
        <p className="text-xs mb-4" style={{ color: 'var(--muted2)' }}>Sube un archivo Excel (.xlsx) con los resultados de evaluación. Máximo 40 estudiantes por planilla.</p>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium cursor-pointer hover:bg-indigo-700 transition-colors">
          <Upload size={14} />
          Seleccionar archivo
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
        </label>
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{batch.subject} — {batch.course}</p>
            <p className="text-xs" style={{ color: 'var(--muted2)' }}>
              {batch.evaluationName} • {allStudents.length} estudiantes total • {generated}/{allStudents.length} informes generados
            </p>
          </div>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer" style={{ borderColor: 'var(--line)', color: 'var(--ink2)' }}>
            <Upload size={12} />
            Nueva planilla
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </label>
        </div>
        {batch.school && <p className="text-xs mt-1" style={{ color: 'var(--muted2)' }}>Colegio: {batch.school} • Docente: {batch.teacher}</p>}
      </div>

      {/* Sheet selector */}
      {batch.sheets.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {batch.sheets.map((sheet, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSheet(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeSheet === idx ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Planilla {sheet.sheetNumber} ({sheet.students.length}/{batch.maxStudentsPerSheet})
            </button>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {generating && (
        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--ink2)' }}>
              {progress.batch} — {progress.current}/{progress.total}
            </span>
            <button onClick={() => setPaused(!paused)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--line)' }}>
              {paused ? 'Reanudar' : 'Pausar'}
            </button>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Add student */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-[10px] font-semibold uppercase" style={{ color: 'var(--muted2)' }}>Agregar estudiante</label>
          <input
            type="text"
            value={newStudentName}
            onChange={e => setNewStudentName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStudent()}
            placeholder={currentSheetFull ? 'Se creará nueva planilla...' : `Planilla ${activeSheet + 1}: ${currentSheetStudents.length}/${batch.maxStudentsPerSheet}`}
            className="w-full text-xs p-2 rounded border mt-1"
            style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
          />
        </div>
        <Button onClick={addStudent} disabled={!newStudentName.trim()} variant="secondary" className="!text-xs !px-3 !py-2">
          <Plus size={12} />
          Agregar
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleGenerateAll} disabled={generating || allStudents.every(s => s.status === 'generado' || s.status === 'editado')}>
          {generating ? <Loader size={14} className="spin" /> : <Play size={14} />}
          {generating ? 'Generando...' : `Generar informes (${currentSheetStudents.length})`}
        </Button>
        <Button onClick={() => batch && exportParentReportMassivePDF(batch)} variant="secondary" disabled={allStudents.length === 0}>
          <Download size={14} />
          PDF masivo ({allStudents.length})
        </Button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Student list */}
      <div className="space-y-2">
        {currentSheetStudents.map((student) => (
          <div key={student.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{student.studentName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  student.status === 'generado' ? 'bg-emerald-100 text-emerald-700' :
                  student.status === 'editado' ? 'bg-blue-100 text-blue-700' :
                  student.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {student.status === 'generado' ? 'Generado' : student.status === 'editado' ? 'Editado' : student.status === 'error' ? 'Error' : 'Pendiente'}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--muted2)' }}>
                  {student.score}/{student.maxScore} • {student.achievementPercent}% • Nota {student.grade} • {student.achievementLevel}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleStartEdit(student)} className="p-1 rounded hover:bg-gray-100" title="Editar">
                  <Edit3 size={12} style={{ color: 'var(--muted2)' }} />
                </button>
                <button onClick={() => batch && exportParentReportIndividualPDF(batch, student)} className="p-1 rounded hover:bg-gray-100" title="PDF individual">
                  <Download size={12} style={{ color: 'var(--muted2)' }} />
                </button>
                <button onClick={() => removeStudent(student.id)} className="p-1 rounded hover:bg-red-50" title="Eliminar">
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            </div>

            {(student.finalParentReport || student.aiFeedbackForParents) && editingId !== student.id && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--ink2)' }}>
                {(student.finalParentReport || student.aiFeedbackForParents).substring(0, 150)}...
              </p>
            )}

            {editingId === student.id && (
              <div className="mt-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full text-xs p-2 rounded border resize-none"
                  style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                  rows={4}
                />
                <div className="flex gap-1 mt-1">
                  <button onClick={handleSaveEdit} className="text-[10px] px-2 py-1 rounded bg-emerald-500 text-white">Guardar</button>
                  <button onClick={() => setEditingId(null)} className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: 'var(--line)' }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
