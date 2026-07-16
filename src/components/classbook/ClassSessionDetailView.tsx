import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { classbookService } from '../../services/classbookService';
import { canEditSession, canCompleteSession, canManageAttendance, canCreateObservation, canSignSession } from '../../utils/classbookPermissions';
import type { ClassbookSession, ClassbookAttendanceRecord, ClassbookSignatureStatus, ClassbookObservation } from '../../types/classbook';
import { SignaturePinSetup } from './SignaturePinSetup';
import { SignaturePinChange } from './SignaturePinChange';
import { SessionSignatureModal } from './SessionSignatureModal';

interface Props {
  sessionId: string;
  onBack: () => void;
  onRefresh: () => void;
}

type DetailTab = 'desarrollo' | 'asistencia' | 'observaciones' | 'plan' | 'recursos' | 'historial';

const STATUS_FLOW: { value: string; label: string; color: string }[] = [
  { value: 'scheduled', label: 'Programada', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_progress', label: 'En desarrollo', color: 'bg-amber-100 text-amber-700' },
  { value: 'completed', label: 'Completada', color: 'bg-green-100 text-green-700' },
  { value: 'pending_signature', label: 'En revisión', color: 'bg-orange-100 text-orange-700' },
  { value: 'signed', label: 'Firmada', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled', label: 'Archivada', color: 'bg-slate-100 text-slate-600' },
];

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string' || !value.trim()) return [];
  try { const p = JSON.parse(value); return Array.isArray(p) ? p.map(String) : []; } catch { return []; }
}

function parseJsonObject(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (typeof value !== 'string' || !value.trim()) return [];
  try { const p = JSON.parse(value); return Array.isArray(p) ? p : []; } catch { return []; }
}

export function ClassSessionDetailView({ sessionId, onBack, onRefresh }: Props) {
  const { user } = useAuth();
  const [session, setSession] = useState<ClassbookSession | null>(null);
  const [attendance, setAttendance] = useState<ClassbookAttendanceRecord[]>([]);
  const [observations, setObservations] = useState<ClassbookObservation[]>([]);
  const [signature, setSignature] = useState<ClassbookSignatureStatus | null>(null);
  const [versions, setVersions] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('desarrollo');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const editedContentRef = useRef('');
  const [editedContent, setEditedContent] = useState('');
  const editedNotesRef = useRef('');
  const [editedNotes, setEditedNotes] = useState('');
  const autosaveTimer = useRef<number | null>(null);
  const lastAutosave = useRef('');

  const [newObsStudent, setNewObsStudent] = useState('');
  const [newObsContent, setNewObsContent] = useState('');
  const [newObsCategory, setNewObsCategory] = useState('academic');

  const [showSignModal, setShowSignModal] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<import('../../types/classbook').SignatureCredentialStatus | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    Promise.all([
      classbookService.getClassSessionById(sessionId, ctrl.signal),
      classbookService.getAttendance(sessionId, ctrl.signal).catch(() => []),
      classbookService.getSignatureStatus(sessionId, ctrl.signal).catch(() => ({ signed: false })),
      classbookService.getSessionVersions(sessionId, ctrl.signal).catch(() => []),
      classbookService.getObservations('', { class_session_id: sessionId }, ctrl.signal).catch(() => []),
      classbookService.getSignatureCredentialStatus(ctrl.signal).catch(() => null),
    ])
      .then(([s, att, sig, vers, obs, cred]) => {
        setSession(s);
        setAttendance(att);
        setSignature(sig);
        setVersions(vers);
        setObservations(obs);
        setCredentialStatus(cred);
        const tc = s?.taught_content ?? '';
        const tn = s?.teacher_notes ?? '';
        editedContentRef.current = tc;
        editedNotesRef.current = tn;
        setEditedContent(tc);
        setEditedNotes(tn);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') setLoading(false);
      });
    return () => ctrl.abort();
  }, [sessionId]);

  const canEdit = session ? canEditSession(user, session.teacher_id, user?.id ?? '') : false;
  const canComplete = canCompleteSession(user);
  const canAttend = canManageAttendance(user);
  const canObserve = canCreateObservation(user);
  const canSign = canSignSession(user);

  const doAutosave = useCallback(async (content: string, notes: string) => {
    if (!session) return;
    const sig = JSON.stringify({ content, notes });
    if (sig === lastAutosave.current) return;
    setSaving(true);
    try {
      await classbookService.updateClassSession(session.id, {
        taught_content: content,
        teacher_notes: notes,
      });
      lastAutosave.current = sig;
      setSaving(false);
    } catch {
      setSaving(false);
    }
  }, [session]);

  const handleContentChange = useCallback((value: string) => {
    editedContentRef.current = value;
    setEditedContent(value);
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      doAutosave(editedContentRef.current, editedNotesRef.current);
    }, 1500);
  }, [doAutosave]);

  const handleNotesChange = useCallback((value: string) => {
    editedNotesRef.current = value;
    setEditedNotes(value);
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      doAutosave(editedContentRef.current, editedNotesRef.current);
    }, 1500);
  }, [doAutosave]);

  const handleSave = useCallback(async () => {
    if (!session) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    await doAutosave(editedContentRef.current, editedNotesRef.current);
    setMessage('Guardado correctamente');
    setTimeout(() => setMessage(null), 3000);
  }, [session, doAutosave]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!session) return;
    setSaving(true);
    try {
      if (newStatus === 'completed' && session.status === 'scheduled') {
        const updated = await classbookService.completeClassSession(session.id, false);
        setSession(updated);
      } else if (newStatus === 'pending_signature' && session.status === 'completed') {
        const updated = await classbookService.completeClassSession(session.id, true);
        setSession(updated);
      } else {
        const updated = await classbookService.updateClassSession(session.id, { status: newStatus as ClassbookSession['status'] });
        setSession(updated);
      }
      setMessage(`Estado cambiado a ${STATUS_FLOW.find(s => s.value === newStatus)?.label ?? newStatus}`);
      setTimeout(() => setMessage(null), 3000);
      onRefresh();
    } catch {
      setMessage('Error al cambiar estado');
    } finally {
      setSaving(false);
    }
  }, [session, onRefresh]);

  const handleAttendanceChange = useCallback((studentId: string, status: string) => {
    setAttendance(prev => {
      const existing = prev.find(r => r.student_id === studentId);
      if (existing) return prev.map(r => r.student_id === studentId ? { ...r, status: status as ClassbookAttendanceRecord['status'] } : r);
      return [...prev, { id: `new-${studentId}`, institution_id: session?.institution_id ?? '', class_session_id: sessionId, student_id: studentId, status: status as ClassbookAttendanceRecord['status'], recorded_by: user?.id ?? '', created_at: '', updated_at: '' }];
    });
  }, [sessionId, session, user]);

  const handleSaveAttendance = useCallback(async () => {
    if (!session || !user) return;
    setSaving(true);
    try {
      await classbookService.saveAttendance(
        session.id,
        attendance.map(r => ({ student_id: r.student_id, status: r.status })),
        user.id
      );
      setMessage('Asistencia guardada');
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage('Error al guardar asistencia');
    } finally {
      setSaving(false);
    }
  }, [session, attendance, user]);

  const handleCreateObservation = useCallback(async () => {
    if (!session || !newObsStudent.trim() || !newObsContent.trim()) return;
    setSaving(true);
    try {
      const obs = await classbookService.createObservation({
        academic_year_id: session.academic_year_id,
        course_id: session.course_id,
        student_id: newObsStudent.trim(),
        category: newObsCategory,
        content: newObsContent.trim(),
        class_session_id: session.id,
      });
      setObservations(prev => [obs, ...prev]);
      setNewObsStudent('');
      setNewObsContent('');
      setMessage('Observación creada');
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage('Error al crear observación');
    } finally {
      setSaving(false);
    }
  }, [session, newObsStudent, newObsContent, newObsCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div role="status" aria-label="Cargando sesión" className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Sesión no encontrada</p>
        <button onClick={onBack} className="mt-4 text-sm text-violet-600 hover:text-violet-700 font-medium">Volver</button>
      </div>
    );
  }

  const parsedObjectives = parseJsonArray(session.objective_ids_json);
  const parsedIndicators = parseJsonArray(session.indicators_json);
  const parsedSkills = parseJsonArray(session.skills_json);
  const parsedAttitudes = parseJsonArray(session.attitudes_json);
  const parsedDua = parseJsonArray(session.dua_supports_json);
  const parsedResources = parseJsonObject(session.resources_json);
  const parsedAssessment = parseJsonObject(session.formative_assessment_json);
  const parsedResourcesContent = parsedResources.map(r => ({
    ...r,
    _title: String(r.title ?? r.type ?? ''),
    _content: typeof r.content === 'string' ? r.content : '',
  }));
  const parsedAssessmentContent = parsedAssessment.map(e => ({
    ...e,
    _title: String(e.title ?? e.type ?? ''),
    _content: typeof e.content === 'string' ? e.content : '',
  }));

  const currentStatus = STATUS_FLOW.find(s => s.value === session.status);
  const statusIndex = STATUS_FLOW.findIndex(s => s.value === session.status);

  const DETAIL_TABS: { id: DetailTab; label: string }[] = [
    { id: 'desarrollo', label: 'Desarrollo' },
    { id: 'asistencia', label: 'Asistencia' },
    { id: 'observaciones', label: 'Observaciones' },
    { id: 'plan', label: 'Planificación' },
    { id: 'recursos', label: 'Recursos' },
    { id: 'historial', label: 'Historial' },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={onBack} aria-label="Volver a la lista" className="text-slate-400 hover:text-slate-600 transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 truncate">{session.planned_content ?? 'Sesión'} — {session.date}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {currentStatus && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${currentStatus.color}`}>{currentStatus.label}</span>}
            <span className="text-xs text-slate-400">v{session.version}</span>
            {signature?.signed && <span className="text-xs text-emerald-600 font-medium">✓ Firmada</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-slate-400 flex items-center gap-1"><span className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" /> Guardando...</span>}
        </div>
      </div>

      {message && (
        <div role="status" aria-live="polite" className={`text-sm px-4 py-2 rounded-xl ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {canSign && !signature?.signed && session.status !== 'cancelled' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Firma digital</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {credentialStatus?.configured
                  ? credentialStatus.locked
                    ? 'Cuenta bloqueada — contacte al administrador'
                    : credentialStatus.must_change_pin
                      ? 'Debe cambiar su PIN antes de firmar'
                      : 'Listo para firmar'
                  : 'Configure su PIN de firma para poder firmar sesiones'}
              </p>
            </div>
            <div className="flex gap-2">
              {!credentialStatus?.configured ? (
                <button
                  onClick={() => setShowPinSetup(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
                >
                  Configurar PIN
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowPinChange(true)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
                  >
                    Cambiar PIN
                  </button>
                  {(session.status === 'completed' || session.status === 'pending_signature') && !credentialStatus.locked && !credentialStatus.must_change_pin && (
                    <button
                      onClick={() => setShowSignModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
                    >
                      Firmar sesión
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FLOW.map((s, i) => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              disabled={saving || i > statusIndex + 1 || s.value === session.status}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                s.value === session.status ? s.color : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {DETAIL_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2 ${
              activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {tab.label}
            {tab.id === 'asistencia' && attendance.length > 0 && <span className="ml-1 text-[10px] opacity-70">({attendance.length})</span>}
            {tab.id === 'observaciones' && observations.length > 0 && <span className="ml-1 text-[10px] opacity-70">({observations.length})</span>}
          </button>
        ))}
      </div>

      {activeTab === 'desarrollo' && (
        <div className="space-y-4">
          <Section title="Contenido planificado">
            <p className="text-sm text-slate-700">{session.planned_content ?? 'No definido'}</p>
          </Section>
          <Section title="Contenido realizado">
            {canEdit ? (
              <textarea
                aria-label="Contenido realizado"
                value={editedContent}
                onChange={(e) => handleContentChange(e.target.value)}
                rows={4}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                placeholder="Describe lo realizado en clase..."
              />
            ) : (
              <p className="text-sm text-slate-700">{session.taught_content ?? 'No registrado'}</p>
            )}
          </Section>
          <Section title="Notas del docente">
            {canEdit ? (
              <textarea
                aria-label="Notas del docente"
                value={editedNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={2}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                placeholder="Notas privadas..."
              />
            ) : (
              <p className="text-sm text-slate-700">{session.teacher_notes ?? 'Sin notas'}</p>
            )}
          </Section>
          {canEdit && (
            <button onClick={handleSave} disabled={saving} aria-busy={saving}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}
        </div>
      )}

      {activeTab === 'asistencia' && (
        <div className="space-y-4">
          <Section title={`Asistencia (${attendance.length} registros)`}>
            {!canAttend ? (
              <p className="text-sm text-slate-500">No tienes permiso para gestionar asistencia.</p>
            ) : attendance.length === 0 ? (
              <p className="text-sm text-slate-500">No hay registros de asistencia para esta sesión.</p>
            ) : (
              <div className="space-y-2">
                {attendance.map(record => (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm font-medium text-slate-700">{record.student_id}</span>
                    <select
                      aria-label={`Asistencia de ${record.student_id}`}
                      value={record.status}
                      onChange={(e) => handleAttendanceChange(record.student_id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                <button onClick={handleSaveAttendance} disabled={saving}
                  className="mt-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2">
                  {saving ? 'Guardando...' : 'Guardar asistencia'}
                </button>
              </div>
            )}
          </Section>
        </div>
      )}

      {activeTab === 'observaciones' && (
        <div className="space-y-4">
          {canObserve && (
            <Section title="Nueva observación">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input aria-label="ID del estudiante" value={newObsStudent} onChange={(e) => setNewObsStudent(e.target.value)}
                    placeholder="ID del estudiante" className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  <select aria-label="Categoría" value={newObsCategory} onChange={(e) => setNewObsCategory(e.target.value)}
                    className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="academic">Académica</option>
                    <option value="behavioral">Conducta</option>
                    <option value="social">Social</option>
                    <option value="emotional">Emocional</option>
                    <option value="attendance">Asistencia</option>
                    <option value="other">Otra</option>
                  </select>
                </div>
                <textarea aria-label="Contenido de la observación" value={newObsContent} onChange={(e) => setNewObsContent(e.target.value)}
                  rows={3} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  placeholder="Describe la observación..." />
                <button onClick={handleCreateObservation} disabled={saving || !newObsStudent.trim() || !newObsContent.trim()}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2">
                  {saving ? 'Guardando...' : 'Crear observación'}
                </button>
              </div>
            </Section>
          )}
          <Section title={`Observaciones (${observations.length})`}>
            {observations.length === 0 ? (
              <p className="text-sm text-slate-500">No hay observaciones para esta sesión.</p>
            ) : (
              <div className="space-y-2">
                {observations.map(obs => (
                  <div key={obs.id} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">{obs.category}</span>
                      <span className="text-xs text-slate-400">{obs.student_id}</span>
                      <span className="text-xs text-slate-400">{obs.created_at?.slice(0, 10)}</span>
                    </div>
                    <p className="text-sm text-slate-700">{obs.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="space-y-4">
          {parsedObjectives.length > 0 && (
            <Section title="Objetivos de aprendizaje">
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {parsedObjectives.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </Section>
          )}
          {parsedIndicators.length > 0 && (
            <Section title="Indicadores">
              <div className="flex flex-wrap gap-1.5">
                {parsedIndicators.map((ind, i) => (
                  <span key={i} className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-lg">{ind}</span>
                ))}
              </div>
            </Section>
          )}
          {parsedSkills.length > 0 && (
            <Section title="Habilidades">
              <div className="flex flex-wrap gap-1.5">
                {parsedSkills.map((sk, i) => (
                  <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">{sk}</span>
                ))}
              </div>
            </Section>
          )}
          {parsedAttitudes.length > 0 && (
            <Section title="Actitudes">
              <div className="flex flex-wrap gap-1.5">
                {parsedAttitudes.map((at, i) => (
                  <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">{at}</span>
                ))}
              </div>
            </Section>
          )}
          {parsedDua.length > 0 && (
            <Section title="Adecuaciones DUA">
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {parsedDua.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </Section>
          )}
          {parsedObjectives.length === 0 && parsedIndicators.length === 0 && parsedSkills.length === 0 && (
            <p className="text-sm text-slate-500">No hay datos de planificación disponibles. Crea la sesión desde Mis Clases para vincular la planificación.</p>
          )}
        </div>
      )}

      {activeTab === 'recursos' && (
        <div className="space-y-4">
          <Section title="Recursos generados">
            {parsedResourcesContent.length === 0 ? (
              <p className="text-sm text-slate-500">No hay recursos generados para esta sesión.</p>
            ) : (
              <div className="space-y-2">
                {parsedResourcesContent.map((r, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm font-medium text-slate-800">{r._title || `Recurso ${i + 1}`}</p>
                    {r._content && <p className="text-xs text-slate-600 mt-1 line-clamp-3">{r._content.slice(0, 200)}...</p>}
                  </div>
                ))}
              </div>
            )}
          </Section>
          <Section title="Evaluaciones">
            {parsedAssessmentContent.length === 0 ? (
              <p className="text-sm text-slate-500">No hay evaluaciones registradas.</p>
            ) : (
              <div className="space-y-2">
                {parsedAssessmentContent.map((e, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm font-medium text-slate-800">{e._title || `Evaluación ${i + 1}`}</p>
                    {e._content && <p className="text-xs text-slate-600 mt-1 line-clamp-3">{e._content.slice(0, 200)}...</p>}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="space-y-4">
          <Section title={`Historial de versiones (${versions.length})`}>
            {versions.length === 0 ? (
              <p className="text-sm text-slate-500">No hay versiones registradas.</p>
            ) : (
              <div className="space-y-2">
                {versions.map((v: unknown, i: number) => {
                  const ver = v as Record<string, unknown>;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Versión {String(ver.version ?? i + 1)}</p>
                        <p className="text-xs text-slate-400">{String(ver.created_at ?? '')} — {String(ver.change_reason ?? 'Guardado automático')}</p>
                      </div>
                      {signature?.signed_version === ver.version && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Firmada</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      )}
      {showSignModal && session && (
        <SessionSignatureModal
          session={session}
          onSuccess={() => {
            setShowSignModal(false);
            setMessage('Sesión firmada correctamente');
            setTimeout(() => setMessage(null), 3000);
            classbookService.getSignatureStatus(sessionId).then(setSignature);
            onRefresh();
          }}
          onCancel={() => setShowSignModal(false)}
        />
      )}

      {showPinSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPinSetup(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <SignaturePinSetup
              onComplete={() => {
                setShowPinSetup(false);
                setMessage('PIN configurado correctamente');
                setTimeout(() => setMessage(null), 3000);
                classbookService.getSignatureCredentialStatus().then(setCredentialStatus);
              }}
              onCancel={() => setShowPinSetup(false)}
            />
          </div>
        </div>
      )}

      {showPinChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPinChange(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <SignaturePinChange
              onComplete={() => {
                setShowPinChange(false);
                setMessage('PIN cambiado correctamente');
                setTimeout(() => setMessage(null), 3000);
              }}
              onCancel={() => setShowPinChange(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}
