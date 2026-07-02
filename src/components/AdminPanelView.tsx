import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Users, Calendar, UserCog, LifeBuoy, Shield, RefreshCw, Plus, Trash2, ChevronRight, Check, AlertTriangle, Clock, BookOpen, GraduationCap } from 'lucide-react';
import {
  listInstitutions, createInstitution, updateInstitution,
  listInstitutionMembers, addInstitutionMember, updateInstitutionMember,
  listCalendarTemplates, createCalendarTemplate, deleteCalendarTemplate,
  getAdminAuditLog,
  type Institution, type InstitutionMember, type CalendarTemplate, type AuditLogEntry,
} from '../services/adminService';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const BLOCK_TYPES = ['lectivo', 'no_lectivo', 'reemplazo', 'reunión', 'planificación'];

const ONBOARDING_STEPS = [
  { key: 'institution', label: 'Crear institución', icon: Building2 },
  { key: 'members', label: 'Agregar docentes', icon: Users },
  { key: 'calendar', label: 'Configurar calendario semanal', icon: Calendar },
  { key: 'first-block', label: 'Crear primer bloque', icon: Clock },
  { key: 'first-class', label: 'Crear primera clase', icon: BookOpen },
  { key: 'first-resource', label: 'Generar primer recurso IA', icon: GraduationCap },
];

export default function AdminPanelView() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'resumen' | 'instituciones' | 'calendario' | 'usuarios' | 'soporte' | 'auditoria'>('resumen');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [members, setMembers] = useState<InstitutionMember[]>([]);
  const [templates, setTemplates] = useState<CalendarTemplate[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Form states
  const [newInst, setNewInst] = useState({ name: '', rbd: '', region: '', commune: '', contact_name: '', contact_email: '', contact_phone: '' });
  const [showNewInst, setShowNewInst] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('docente');
  const [newTemplate, setNewTemplate] = useState({
    name: '', description: '', school_year: new Date().getFullYear(), level_id: '', subject_id: '',
    weekday: 1, start_time: '08:00', end_time: '09:30', block_type: 'lectivo', room: '', starts_on: '', ends_on: '',
  });
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  const loadInstitutions = useCallback(async () => {
    try {
      const data = await listInstitutions();
      setInstitutions(data);
    } catch (e) {
      setError('Error al cargar instituciones: ' + (e instanceof Error ? e.message : 'desconocido'));
    }
  }, []);

  const loadMembers = useCallback(async (instId: string) => {
    try {
      const data = await listInstitutionMembers(instId);
      setMembers(data);
    } catch (e) {
      setError('Error al cargar miembros: ' + (e instanceof Error ? e.message : 'desconocido'));
    }
  }, []);

  const loadTemplates = useCallback(async (instId: string) => {
    try {
      const data = await listCalendarTemplates(instId);
      setTemplates(data);
    } catch (e) {
      setError('Error al cargar plantillas: ' + (e instanceof Error ? e.message : 'desconocido'));
    }
  }, []);

  const loadAuditLog = useCallback(async () => {
    try {
      const data = await getAdminAuditLog();
      setAuditLog(data);
    } catch (e) {
      setError('Error al cargar auditoría: ' + (e instanceof Error ? e.message : 'desconocido'));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadInstitutions(), loadAuditLog()])
      .finally(() => setLoading(false));
  }, [loadInstitutions, loadAuditLog]);

  useEffect(() => {
    if (selectedInst) {
      loadMembers(selectedInst.id);
      loadTemplates(selectedInst.id);
    }
  }, [selectedInst, loadMembers, loadTemplates]);

  const handleCreateInstitution = async () => {
    if (!newInst.name.trim()) { setError('Nombre requerido'); return; }
    try {
      const created = await createInstitution(newInst);
      setInstitutions(prev => [created, ...prev]);
      setNewInst({ name: '', rbd: '', region: '', commune: '', contact_name: '', contact_email: '', contact_phone: '' });
      setShowNewInst(false);
      setMsg('Institución creada correctamente');
    } catch (e) {
      setError('Error: ' + (e instanceof Error ? e.message : 'desconocido'));
    }
  };

  const handleAddMember = async () => {
    if (!selectedInst || !newMemberEmail.trim()) return;
    try {
      await addInstitutionMember(selectedInst.id, { email: newMemberEmail, role: newMemberRole });
      setNewMemberEmail('');
      loadMembers(selectedInst.id);
      setMsg('Miembro agregado correctamente');
    } catch (e) {
      setError('Error: ' + (e instanceof Error ? e.message : 'desconocido'));
    }
  };

  const handleCreateTemplate = async () => {
    if (!selectedInst) return;
    try {
      await createCalendarTemplate(selectedInst.id, {
        ...newTemplate,
        school_year: Number(newTemplate.school_year),
        weekday: Number(newTemplate.weekday),
        repeats_weekly: 1,
      });
      setShowNewTemplate(false);
      loadTemplates(selectedInst.id);
      setMsg('Plantilla creada correctamente');
    } catch (e) {
      setError('Error: ' + (e instanceof Error ? e.message : 'desconocido'));
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    try {
      await deleteCalendarTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      setMsg('Plantilla eliminada');
    } catch (e) {
      setError('Error: ' + (e instanceof Error ? e.message : 'desconocido'));
    }
  };

  const handleToggleMemberStatus = async (member: InstitutionMember) => {
    if (!selectedInst) return;
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    try {
      await updateInstitutionMember(selectedInst.id, member.id, { status: newStatus });
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: newStatus } : m));
    } catch (e) {
      setError('Error: ' + (e instanceof Error ? e.message : 'desconocido'));
    }
  };

  if (user?.rol !== 'admin') {
    return (
      <div className="view" style={{ padding: 40, textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: 'var(--warning, #f59e0b)', marginBottom: 16 }} />
        <h2>Acceso restringido</h2>
        <p className="muted">Solo los administradores pueden acceder a este panel.</p>
      </div>
    );
  }

  return (
    <div className="view" id="admin-panel">
      <div className="module-header">
        <h2 className="module-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Building2 size={22} />
          Panel Administrador Institucional
        </h2>
      </div>

      {error && <div className="status warn" style={{ marginBottom: 14 }}>{error}</div>}
      {msg && <div className="status info" style={{ marginBottom: 14 }}>{msg}</div>}

      <div className="btnrow" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {(['resumen', 'instituciones', 'calendario', 'usuarios', 'soporte', 'auditoria'] as const).map(t => {
          const icons: Record<string, any> = { resumen: RefreshCw, instituciones: Building2, calendario: Calendar, usuarios: UserCog, soporte: LifeBuoy, auditoria: Shield };
          const Icon = icons[t];
          return (
            <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              <Icon size={14} /> {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          );
        })}
      </div>

      {tab === 'resumen' && (
        <div className="card">
          <h3>Resumen del sistema</h3>
          <div className="metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <div className="metric" style={{ textAlign: 'center', padding: 16 }}>
              <Building2 size={24} style={{ color: '#6d5dfc', marginBottom: 8 }} />
              <b style={{ display: 'block', fontSize: 28, color: '#6d5dfc' }}>{institutions.length}</b>
              <span className="muted">Instituciones</span>
            </div>
            <div className="metric" style={{ textAlign: 'center', padding: 16 }}>
              <Users size={24} style={{ color: '#00a7a7', marginBottom: 8 }} />
              <b style={{ display: 'block', fontSize: 28, color: '#00a7a7' }}>{institutions.reduce((acc, i) => acc + (i.member_count || 0), 0)}</b>
              <span className="muted">Docentes</span>
            </div>
            <div className="metric" style={{ textAlign: 'center', padding: 16 }}>
              <Shield size={24} style={{ color: '#f59e0b', marginBottom: 8 }} />
              <b style={{ display: 'block', fontSize: 28, color: '#f59e0b' }}>{auditLog.length}</b>
              <span className="muted">Acciones admin</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'instituciones' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Instituciones</h3>
            <button className="primary" onClick={() => setShowNewInst(!showNewInst)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> Nueva institución
            </button>
          </div>

          {showNewInst && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <input placeholder="Nombre *" value={newInst.name} onChange={e => setNewInst(p => ({ ...p, name: e.target.value }))} style={{ padding: '6px 10px', fontSize: 13 }} />
              <input placeholder="RBD" value={newInst.rbd} onChange={e => setNewInst(p => ({ ...p, rbd: e.target.value }))} style={{ padding: '6px 10px', fontSize: 13 }} />
              <input placeholder="Región" value={newInst.region} onChange={e => setNewInst(p => ({ ...p, region: e.target.value }))} style={{ padding: '6px 10px', fontSize: 13 }} />
              <input placeholder="Comuna" value={newInst.commune} onChange={e => setNewInst(p => ({ ...p, commune: e.target.value }))} style={{ padding: '6px 10px', fontSize: 13 }} />
              <input placeholder="Contacto nombre" value={newInst.contact_name} onChange={e => setNewInst(p => ({ ...p, contact_name: e.target.value }))} style={{ padding: '6px 10px', fontSize: 13 }} />
              <input placeholder="Contacto email" value={newInst.contact_email} onChange={e => setNewInst(p => ({ ...p, contact_email: e.target.value }))} style={{ padding: '6px 10px', fontSize: 13 }} />
              <input placeholder="Contacto teléfono" value={newInst.contact_phone} onChange={e => setNewInst(p => ({ ...p, contact_phone: e.target.value }))} style={{ padding: '6px 10px', fontSize: 13 }} />
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 6 }}>
                <button className="primary" onClick={handleCreateInstitution} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Check size={14} /> Guardar
                </button>
                <button className="secondary" onClick={() => setShowNewInst(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {institutions.length === 0 ? (
            <p className="muted">No hay instituciones registradas.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Nombre</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>RBD</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Región/Comuna</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Contacto</th>
                    <th style={{ textAlign: 'center', padding: '8px 6px' }}>Plan</th>
                    <th style={{ textAlign: 'center', padding: '8px 6px' }}>Estado</th>
                    <th style={{ textAlign: 'center', padding: '8px 6px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map(inst => (
                    <tr key={inst.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 6px', fontWeight: 500 }}>{inst.name}</td>
                      <td style={{ padding: '8px 6px', color: 'var(--muted)' }}>{inst.rbd || '—'}</td>
                      <td style={{ padding: '8px 6px' }}>{[inst.region, inst.commune].filter(Boolean).join(', ') || '—'}</td>
                      <td style={{ padding: '8px 6px' }}>{inst.contact_name || inst.contact_email || '—'}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                        <span style={{ padding: '1px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: inst.plan === 'free' ? '#e0f2fe' : '#ede9fe', color: inst.plan === 'free' ? '#0369a1' : '#6d28d9' }}>
                          {inst.plan}
                        </span>
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                        <span style={{ padding: '1px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: inst.status === 'active' ? '#dcfce7' : '#fee2e2', color: inst.status === 'active' ? '#16a34a' : '#dc2626' }}>
                          {inst.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                        <button className="secondary" onClick={() => setSelectedInst(inst)} style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <ChevronRight size={11} /> Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedInst && (tab === 'instituciones' || tab === 'calendario' || tab === 'usuarios') && (
        <div className="card" style={{ marginTop: 14, borderLeft: '3px solid #6d5dfc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{selectedInst.name}</h3>
            <button className="secondary" onClick={() => setSelectedInst(null)} style={{ fontSize: 12 }}>Cerrar</button>
          </div>
          <p className="muted" style={{ fontSize: 12 }}>
            {[selectedInst.region, selectedInst.commune].filter(Boolean).join(', ')} · Plan: {selectedInst.plan} · Estado: {selectedInst.status}
          </p>
        </div>
      )}

      {tab === 'calendario' && selectedInst && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Calendario Semanal — {selectedInst.name}</h3>
            <button className="primary" onClick={() => setShowNewTemplate(!showNewTemplate)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> Nuevo bloque
            </button>
          </div>

          {showNewTemplate && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <input placeholder="Nombre del bloque" value={newTemplate.name} onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))} style={{ padding: '6px 10px', fontSize: 13 }} />
              <select value={newTemplate.weekday} onChange={e => setNewTemplate(p => ({ ...p, weekday: Number(e.target.value) }))} style={{ padding: '6px 10px', fontSize: 13 }}>
                {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
              <input type="time" value={newTemplate.start_time} onChange={e => setNewTemplate(p => ({ ...p, start_time: e.target.value }))} style={{ padding: '6px 10px', fontSize: 13 }} />
              <input type="time" value={newTemplate.end_time} onChange={e => setNewTemplate(p => ({ ...p, end_time: e.target.value }))} style={{ padding: '6px 10px', fontSize: 13 }} />
              <select value={newTemplate.block_type} onChange={e => setNewTemplate(p => ({ ...p, block_type: e.target.value }))} style={{ padding: '6px 10px', fontSize: 13 }}>
                {BLOCK_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
              <input placeholder="Sala" value={newTemplate.room} onChange={e => setNewTemplate(p => ({ ...p, room: e.target.value }))} style={{ padding: '6px 10px', fontSize: 13 }} />
              <input type="number" placeholder="Año escolar" value={newTemplate.school_year} onChange={e => setNewTemplate(p => ({ ...p, school_year: Number(e.target.value) }))} style={{ padding: '6px 10px', fontSize: 13 }} />
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 6 }}>
                <button className="primary" onClick={handleCreateTemplate} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Check size={14} /> Guardar
                </button>
                <button className="secondary" onClick={() => setShowNewTemplate(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {templates.length === 0 ? (
            <p className="muted">No hay bloques configurados para esta institución.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {templates.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{t.name || DIAS[t.weekday]}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {DIAS[t.weekday]} · {t.start_time}–{t.end_time} · {t.block_type}
                      {t.room && ` · Sala: ${t.room}`}
                    </div>
                  </div>
                  <button className="secondary" onClick={() => handleDeleteTemplate(t.id)} style={{ padding: '3px 8px', fontSize: 11, color: 'var(--danger, #dc2626)' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'usuarios' && selectedInst && (
        <div className="card">
          <h3>Usuarios — {selectedInst.name}</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <input placeholder="Email del docente" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 13, flex: 1 }} />
            <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }}>
              <option value="docente">Docente</option>
              <option value="institution_admin">Admin Institución</option>
            </select>
            <button className="primary" onClick={handleAddMember} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> Agregar
            </button>
          </div>

          {members.length === 0 ? (
            <p className="muted">No hay miembros en esta institución.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Nombre</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Email</th>
                    <th style={{ textAlign: 'center', padding: '8px 6px' }}>Rol</th>
                    <th style={{ textAlign: 'center', padding: '8px 6px' }}>Estado</th>
                    <th style={{ textAlign: 'center', padding: '8px 6px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 6px' }}>{m.nombre || '—'}</td>
                      <td style={{ padding: '8px 6px', color: 'var(--muted)' }}>{m.email || '—'}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                        <span style={{ padding: '1px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: m.role === 'institution_admin' ? '#ede9fe' : '#e0f2fe', color: m.role === 'institution_admin' ? '#6d28d9' : '#0369a1' }}>
                          {m.role}
                        </span>
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                        <span style={{ padding: '1px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: m.status === 'active' ? '#dcfce7' : '#fee2e2', color: m.status === 'active' ? '#16a34a' : '#dc2626' }}>
                          {m.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                        <button className="secondary" onClick={() => handleToggleMemberStatus(m)} style={{ padding: '3px 8px', fontSize: 11 }}>
                          {m.status === 'active' ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'usuarios' && !selectedInst && (
        <div className="card">
          <p className="muted">Selecciona una institución para gestionar sus usuarios.</p>
        </div>
      )}

      {tab === 'calendario' && !selectedInst && (
        <div className="card">
          <p className="muted">Selecciona una institución para configurar su calendario semanal.</p>
        </div>
      )}

      {tab === 'soporte' && (
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LifeBuoy size={18} /> Asistente de Onboarding
          </h3>
          <p className="muted" style={{ marginBottom: 16 }}>Checklist para configurar una nueva institución en la plataforma.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ONBOARDING_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#6d5dfc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <Icon size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13 }}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'auditoria' && (
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} /> Registro de Auditoría
          </h3>
          {auditLog.length === 0 ? (
            <p className="muted">No hay acciones registradas.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Fecha</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Admin</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Acción</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Tipo</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>ID Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map(entry => (
                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 6px', whiteSpace: 'nowrap' }}>{new Date(entry.created_at).toLocaleString('es-CL')}</td>
                      <td style={{ padding: '8px 6px' }}>{entry.admin_email || entry.admin_user_id.slice(0, 8)}</td>
                      <td style={{ padding: '8px 6px' }}>{entry.action}</td>
                      <td style={{ padding: '8px 6px' }}>{entry.target_type || '—'}</td>
                      <td style={{ padding: '8px 6px', fontFamily: 'monospace', fontSize: 11 }}>{entry.target_id?.slice(0, 8) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
