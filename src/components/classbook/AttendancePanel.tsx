import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { classbookService } from '../../services/classbookService';
import { canManageAttendance } from '../../utils/classbookPermissions';
import type { ClassbookSession, ClassbookAttendanceRecord, ClassbookStudent, ClassbookEnrollment } from '../../types/classbook';

interface Props {
  sessions: ClassbookSession[];
  institutionId: string;
  onRefresh: () => void;
}

export function AttendancePanel({ sessions, institutionId, onRefresh }: Props) {
  const { user } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [records, setRecords] = useState<ClassbookAttendanceRecord[]>([]);
  const [students, setStudents] = useState<ClassbookStudent[]>([]);
  const [enrollments, setEnrollments] = useState<ClassbookEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canEdit = canManageAttendance(user);
  const completedSessions = sessions.filter(s => s.status === 'completed' || s.status === 'pending_signature' || s.status === 'signed');

  useEffect(() => {
    if (!selectedSessionId) {
      setRecords([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    classbookService.getAttendance(selectedSessionId, ctrl.signal)
      .then(r => { setRecords(r); setLoading(false); })
      .catch(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [selectedSessionId]);

  const handleStatusChange = useCallback((studentId: string, status: string) => {
    setRecords(prev => {
      const existing = prev.find(r => r.student_id === studentId);
      if (existing) {
        return prev.map(r => r.student_id === studentId ? { ...r, status: status as ClassbookAttendanceRecord['status'] } : r);
      }
      return [...prev, { id: `new-${studentId}`, institution_id: institutionId, class_session_id: selectedSessionId, student_id: studentId, status: status as ClassbookAttendanceRecord['status'], recorded_by: user?.id ?? '', created_at: '', updated_at: '' }];
    });
  }, [institutionId, selectedSessionId, user]);

  const handleSave = useCallback(async () => {
    if (!selectedSessionId || !user) return;
    setSaving(true);
    try {
      await classbookService.saveAttendance(
        selectedSessionId,
        records.map(r => ({ student_id: r.student_id, status: r.status })),
        user.id
      );
      setMessage('Asistencia guardada');
      setTimeout(() => setMessage(null), 3000);
      onRefresh();
    } catch {
      setMessage('Error al guardar');
    } finally {
      setSaving(false);
    }
  }, [selectedSessionId, records, user, onRefresh]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Asistencia</h1>

      <select
        aria-label="Seleccionar sesión"
        value={selectedSessionId}
        onChange={(e) => setSelectedSessionId(e.target.value)}
        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        <option value="">Seleccionar sesión...</option>
        {completedSessions.map(s => (
          <option key={s.id} value={s.id}>{s.date} — {s.planned_content ?? 'Sin título'}</option>
        ))}
      </select>

      {message && (
        <div role="status" aria-live="polite" className={`text-sm px-4 py-2 rounded-xl ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {selectedSessionId && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div role="status" aria-label="Cargando asistencia" className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">No hay registros de asistencia</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {records.map(record => (
                <div key={record.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-slate-700">{record.student_id}</span>
                  <select
                    aria-label={`Asistencia de ${record.student_id}`}
                    value={record.status}
                    onChange={(e) => handleStatusChange(record.student_id, e.target.value)}
                    disabled={!canEdit}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                  >
                    <option value="present">Presente</option>
                    <option value="absent">Ausente</option>
                    <option value="late">Atraso</option>
                    <option value="justified">Justificado</option>
                    <option value="early_departure">Salida anticipada</option>
                    <option value="external_activity">Actividad externa</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {canEdit && records.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
              >
                {saving ? 'Guardando...' : 'Guardar asistencia'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
