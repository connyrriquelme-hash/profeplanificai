import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/apiClient';
import { getPlans, getRecursosGuardados, getEvalsGuardadas, getCursos, getEstudiantes, getCollabPosts } from '../services/storageService';
import { BarChart3, Users, Database, Wifi, WifiOff, UserCog, RefreshCw, Save, Monitor, Trash2, ShieldOff } from 'lucide-react';

interface DashboardStats {
  planes: number; recursos: number; evaluaciones: number;
  cursos: number; estudiantes: number; postsColaboracion: number;
}

interface Usuario {
  id: string; email: string; nombre: string;
  rol: string; created_at: string; updated_at: string;
}

export default function AdminView() {
  const { user, online, sessions, loadSessions, revokeSession, revokeOtherSessions } = useAuth();
  const [tab, setTab] = useState<'dashboard' | 'usuarios' | 'sesiones'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editRol, setEditRol] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [resetPwd, setResetPwd] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (tab === 'usuarios') loadUsuarios();
    if (tab === 'sesiones') loadSessions();
  }, [tab]);

  const loadStats = async () => {
    setBusy(true); setError('');
    try {
      if (online) {
        const data = await api.get<{ stats: DashboardStats }>('/api/admin/dashboard');
        setStats(data.stats);
      } else {
        setStats({
          planes: getPlans().length, recursos: getRecursosGuardados().length,
          evaluaciones: getEvalsGuardadas().length, cursos: getCursos().length,
          estudiantes: getEstudiantes().length, postsColaboracion: getCollabPosts().length,
        });
      }
    } catch {
      setStats({
        planes: getPlans().length, recursos: getRecursosGuardados().length,
        evaluaciones: getEvalsGuardadas().length, cursos: getCursos().length,
        estudiantes: getEstudiantes().length, postsColaboracion: getCollabPosts().length,
      });
      setError('API no disponible, mostrando datos locales.');
    } finally { setBusy(false); }
  };

  const loadUsuarios = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.get<{ usuarios: Usuario[] }>('/api/admin/usuarios');
      setUsuarios(data.usuarios);
    } catch (e) {
      setError('Error al cargar usuarios: ' + (e instanceof Error ? e.message : 'desconocido'));
    } finally { setLoadingUsers(false); }
  };

  const startEdit = (u: Usuario) => {
    setEditUserId(u.id);
    setEditRol(u.rol);
    setEditNombre(u.nombre);
    setResetPwd('');
    setMsg('');
  };

  const saveUser = async () => {
    if (!editUserId) return;
    setSaving(true); setMsg('');
    try {
      const body: Record<string, string> = { userId: editUserId, rol: editRol, nombre: editNombre };
      if (resetPwd) (body as any).password = resetPwd;
      await api.patch('/api/admin/usuarios', body);
      setMsg('Usuario actualizado correctamente');
      setEditUserId(null);
      loadUsuarios();
    } catch (e) {
      setMsg('Error: ' + (e instanceof Error ? e.message : 'desconocido'));
    } finally { setSaving(false); }
  };

  const items = stats ? [
    { label: 'Planificaciones', value: stats.planes, icon: BarChart3, color: '#6d5dfc' },
    { label: 'Recursos', value: stats.recursos, icon: Database, color: '#00a7a7' },
    { label: 'Evaluaciones', value: stats.evaluaciones, icon: Database, color: '#f59e0b' },
    { label: 'Cursos', value: stats.cursos, icon: Database, color: '#3b82f6' },
    { label: 'Estudiantes', value: stats.estudiantes, icon: Users, color: '#22c55e' },
    { label: 'Colaboraciones', value: stats.postsColaboracion, icon: Database, color: '#a78bfa' },
  ] : [];

  return (
    <div className="view" id="admin">
      <div className="module-header">
        <h2 className="module-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={22} />
          Panel de Administración
        </h2>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: online ? 'var(--success)' : 'var(--muted)' }}>
          {online ? <Wifi size={14} /> : <WifiOff size={14} />}
          {online ? 'Conectado al servidor' : 'Modo local'}
        </span>
      </div>

      {error && <div className="status warn" style={{ marginBottom: 14 }}>{error}</div>}
      {msg && <div className={`status ${msg.startsWith('Error') ? 'warn' : 'info'}`} style={{ marginBottom: 14 }}>{msg}</div>}

      <div className="btnrow" style={{ marginBottom: 16 }}>
        <button className={`tab-btn${tab === 'dashboard' ? ' active' : ''}`} onClick={() => setTab('dashboard')}>
          <BarChart3 size={14} /> Dashboard
        </button>
        <button className={`tab-btn${tab === 'usuarios' ? ' active' : ''}`} onClick={() => setTab('usuarios')}>
          <Users size={14} /> Usuarios
        </button>
        <button className={`tab-btn${tab === 'sesiones' ? ' active' : ''}`} onClick={() => setTab('sesiones')}>
          <Monitor size={14} /> Sesiones
        </button>
      </div>

      {tab === 'dashboard' && (
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={18} /> Resumen del sistema
          </h3>
          {busy ? (
            <p className="muted">Cargando estadísticas...</p>
          ) : (
            <div className="metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="metric" style={{ textAlign: 'center', padding: 16 }}>
                    <Icon size={24} style={{ color: item.color, marginBottom: 8 }} />
                    <b style={{ display: 'block', fontSize: 28, color: item.color }}>{item.value}</b>
                    <span className="muted">{item.label}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="btnrow">
            <button className="secondary" onClick={loadStats} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} /> Refrescar
            </button>
          </div>
        </div>
      )}

      {tab === 'usuarios' && (
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} /> Gestión de Usuarios
          </h3>
          {loadingUsers ? (
            <p className="muted">Cargando usuarios...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Nombre</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Email</th>
                    <th style={{ textAlign: 'center', padding: '8px 6px' }}>Rol</th>
                    <th style={{ textAlign: 'center', padding: '8px 6px' }}>Creado</th>
                    <th style={{ textAlign: 'center', padding: '8px 6px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      {editUserId === u.id ? (
                        <>
                          <td style={{ padding: '6px' }}>
                            <input value={editNombre} onChange={e => setEditNombre(e.target.value)}
                              style={{ width: '100%', padding: '4px 6px', fontSize: 12 }} />
                          </td>
                          <td style={{ padding: '6px' }}>{u.email}</td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            <select value={editRol} onChange={e => setEditRol(e.target.value)}
                              style={{ padding: '4px 6px', fontSize: 12 }}>
                              <option value="docente">docente</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center', fontSize: 11, color: 'var(--muted)' }}>
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button className="secondary" onClick={saveUser} disabled={saving}
                                style={{ padding: '3px 8px', fontSize: 11 }}>
                                <Save size={11} /> Guardar
                              </button>
                              <button className="secondary" onClick={() => setEditUserId(null)}
                                style={{ padding: '3px 8px', fontSize: 11 }}>Cancelar</button>
                            </div>
                            {editUserId === u.id && (
                              <div style={{ marginTop: 4 }}>
                                <input type="password" placeholder="Nueva contraseña (opcional)"
                                  value={resetPwd} onChange={e => setResetPwd(e.target.value)}
                                  style={{ width: '100%', padding: '3px 6px', fontSize: 11 }} />
                              </div>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '8px 6px' }}>{u.nombre}</td>
                          <td style={{ padding: '8px 6px', color: 'var(--muted)' }}>{u.email}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block', padding: '1px 8px', borderRadius: 8,
                              fontSize: 11, fontWeight: 600,
                              background: u.rol === 'admin' ? '#ede9fe' : '#e0f2fe',
                              color: u.rol === 'admin' ? '#6d28d9' : '#0369a1',
                            }}>{u.rol}</span>
                          </td>
                          <td style={{ padding: '8px 6px', textAlign: 'center', fontSize: 11, color: 'var(--muted)' }}>
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                            <button className="secondary" onClick={() => startEdit(u)}
                              style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <UserCog size={11} /> Editar
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'sesiones' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Monitor size={18} /> Sesiones Activas
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="secondary" onClick={loadSessions} style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={12} /> Refrescar
              </button>
              {sessions.filter(s => !s.isCurrent).length > 0 && (
                <button className="secondary" onClick={async () => { await revokeOtherSessions(); }} style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--danger, #dc2626)' }}>
                  <ShieldOff size={12} /> Cerrar otras
                </button>
              )}
            </div>
          </div>
          {sessions.length === 0 ? (
            <p className="muted">No hay sesiones activas.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map(s => (
                <div key={s.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${s.isCurrent ? 'var(--success, #22c55e)' : 'var(--border)'}`,
                  background: s.isCurrent ? 'rgba(34,197,94,0.05)' : 'transparent',
                }}>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 500 }}>
                      {s.isCurrent ? 'Sesión actual' : 'Otra sesión'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      Creada: {new Date(s.createdAt).toLocaleString('es-CL')}
                      {s.lastSeenAt && ` · Último uso: ${new Date(s.lastSeenAt).toLocaleString('es-CL')}`}
                    </div>
                    {s.userAgent && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                        {s.userAgent.slice(0, 80)}
                      </div>
                    )}
                  </div>
                  {!s.isCurrent && (
                    <button className="secondary" onClick={async () => { await revokeSession(s.id); }}
                      style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--danger, #dc2626)' }}>
                      <Trash2 size={11} /> Cerrar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3>Información del usuario</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label>Nombre</label>
            <p style={{ color: 'var(--ink)' }}>{user?.nombre || '—'}</p>
          </div>
          <div>
            <label>Email</label>
            <p style={{ color: 'var(--ink)' }}>{user?.email || '—'}</p>
          </div>
          <div>
            <label>Rol</label>
            <p style={{ color: 'var(--ink)', textTransform: 'capitalize' }}>{user?.rol || '—'}</p>
          </div>
          <div>
            <label>ID de usuario</label>
            <p style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'monospace' }}>{user?.id || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
