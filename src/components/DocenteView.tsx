import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, BarChart3, Sparkles } from 'lucide-react';
import type { CursoData, EstudianteData } from '../types';
import { getCursos, saveCursos, getEstudiantes, saveEstudiantes, generateId } from '../services/storageService';
import { mdToHtml } from '../utils/htmlUtils';
import { exportarDocumento } from '../utils/exportUtils';
import { generarConIA } from '../services/aiService';
import { NIVELES, ASIGNATURAS } from '../types';

export function DocenteView() {
  const [cursos, setCursos] = useState<CursoData[]>([]);
  const [estudiantes, setEstudiantes] = useState<EstudianteData[]>([]);
  const [activeCurso, setActiveCurso] = useState<string | null>(null);
  const [showCursoForm, setShowCursoForm] = useState(false);
  const [editCurso, setEditCurso] = useState<CursoData>({ id: '', nombre: '', nivel: '', asignatura: '', estudiantes: 0, timestamp: 0 });
  const [showEstForm, setShowEstForm] = useState(false);
  const [newEstNombre, setNewEstNombre] = useState('');
  const [reporteOutput, setReporteOutput] = useState('');
  const [recomendacionOutput, setRecomendacionOutput] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setCursos(getCursos());
    setEstudiantes(getEstudiantes());
  }, []);

  const saveCurso = () => {
    if (!editCurso.nombre.trim() || !editCurso.nivel.trim()) return;
    const list = editCurso.id
      ? cursos.map((c) => c.id === editCurso.id ? editCurso : c)
      : [...cursos, { ...editCurso, id: generateId(), timestamp: Date.now() }];
    setCursos(list);
    saveCursos(list);
    setShowCursoForm(false);
    setEditCurso({ id: '', nombre: '', nivel: '', asignatura: '', estudiantes: 0, timestamp: 0 });
  };

  const delCurso = (id: string) => {
    if (!confirm('¿Eliminar este curso?')) return;
    const list = cursos.filter((c) => c.id !== id);
    setCursos(list);
    saveCursos(list);
    if (activeCurso === id) setActiveCurso(null);
  };

  const addEstudiante = () => {
    if (!newEstNombre.trim() || !activeCurso) return;
    const list: EstudianteData[] = [...estudiantes, { id: generateId(), nombre: newEstNombre.trim(), cursoId: activeCurso, observaciones: '', timestamp: Date.now() }];
    setEstudiantes(list);
    saveEstudiantes(list);
    setNewEstNombre('');
    setShowEstForm(false);
  };

  const delEstudiante = (id: string) => {
    const list = estudiantes.filter((e) => e.id !== id);
    setEstudiantes(list);
    saveEstudiantes(list);
  };

  const estDelCurso = estudiantes.filter((e) => e.cursoId === activeCurso);

  const generarReporte = async () => {
    if (!activeCurso) return;
    const c = cursos.find((x) => x.id === activeCurso);
    if (!c) return;
    setGenerating(true);
    setReporteOutput('');
    const np = Math.max(5, Math.min(30, Math.round(estDelCurso.length * 2) || 10));
    const pts = np;
    const sim = [];
    for (let i = 0; i < estDelCurso.length; i++) {
      const pct = Math.round(Math.random() * 60 + 20);
      const log = pct >= 80 ? 'Logrado' : pct >= 60 ? 'Esperado' : pct >= 40 ? 'En desarrollo' : 'Insuficiente';
      sim.push({ est: estDelCurso[i].nombre, pct, log, puntaje: Math.round(pct * pts / 100) });
    }
    sim.sort((a, b) => b.pct - a.pct);
    const prom = Math.round(sim.reduce((s, x) => s + x.pct, 0) / sim.length);
    const niveles: Record<string, number> = { Logrado: 0, Esperado: 0, 'En desarrollo': 0, Insuficiente: 0 };
    sim.forEach((s) => niveles[s.log]++);

    let r = `## Reporte de curso: ${c.nombre}\n**Nivel:** ${c.nivel} · **Asignatura:** ${c.asignatura} · **Estudiantes:** ${estDelCurso.length}\n\n`;
    r += `**Promedio curso:** ${prom}%\n`;
    r += `**Puntaje máximo:** ${pts} pts · **Puntaje promedio:** ${Math.round(prom * pts / 100)} pts\n\n`;
    r += '### Distribución de logros\n';
    r += Object.entries(niveles).filter(([, v]) => v > 0).map(([k, v]) => `- ${k}: ${v} est. (${Math.round(v / estDelCurso.length * 100)}%)`).join('\n');
    r += '\n\n### Detalle por estudiante\n';
    r += '| # | Estudiante | Puntaje | % | Nivel |\n';
    r += '|---|------------|---------|---|-------|\n';
    sim.forEach((s, i) => { r += `| ${i + 1} | ${s.est} | ${s.puntaje}/${pts} | ${s.pct}% | ${s.log} |\n`; });
    setReporteOutput(r);
    setGenerating(false);
  };

  const generarRecomendacion = async () => {
    if (!activeCurso) return;
    const c = cursos.find((x) => x.id === activeCurso);
    if (!c) return;
    const prompt = `Eres un docente experto chileno. Genera recomendaciones pedagógicas breves para el curso "${c.nombre}" de ${c.nivel} en ${c.asignatura}. Considera que tiene ${estDelCurso.length} estudiantes. Incluye: 1) estrategias generales, 2) sugerencias DUA, 3) recomendaciones para evaluación formativa. Sé práctico y directo.`;
    const r = await generarConIA({
      tipo: 'planificacion',
      nivel: c.nivel,
      asignatura: c.asignatura,
      oa: 'Recomendaciones pedagógicas',
      promptExt: prompt,
      duracion: '',
      tema: 'Recomendaciones para el curso',
      estilo: 'resumido',
      dificultad: '',
      contexto: '',
      onStatus: () => {},
      onOutput: () => {},
    });
    if (r.ok && r.texto) {
      setRecomendacionOutput(r.texto);
    } else {
      setRecomendacionOutput('*No se pudo generar la recomendación. Intenta de nuevo.*');
    }
  };

  const exportarReporte = (action: 'html' | 'txt' | 'print') => {
    if (!activeCurso) return;
    const c = cursos.find((x) => x.id === activeCurso);
    exportarDocumento({
      titulo: `Reporte ${c?.nombre || 'Curso'}`,
      nivel: c?.nivel,
      asignatura: c?.asignatura,
      oa: '',
      tipo: 'Reporte de curso',
      contenido: reporteOutput + (recomendacionOutput ? '\n\n## Recomendaciones pedagógicas\n\n' + recomendacionOutput : ''),
      action,
    });
  };

  const cursoActual = activeCurso ? cursos.find((c) => c.id === activeCurso) : null;

  return (
    <div className="view" id="docente">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="module-header">
          <h2 className="module-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} /> Gestión de cursos
          </h2>
        </div>
        <button className="primary" onClick={() => { setShowCursoForm(true); setEditCurso({ id: '', nombre: '', nivel: '', asignatura: '', estudiantes: 0, timestamp: 0 }); }}>
          <Plus size={14} /> Nuevo curso
        </button>
      </div>

      {showCursoForm && (
        <div className="card">
          <h3>{editCurso.id ? 'Editar curso' : 'Nuevo curso'}</h3>
          <div className="grid">
            <div>
              <label>Nombre del curso</label>
              <input value={editCurso.nombre} onChange={(e) => setEditCurso({ ...editCurso, nombre: e.target.value })} placeholder="Ej.: 2° básico A" />
            </div>
            <div>
              <label>Nivel</label>
              <select value={editCurso.nivel} onChange={(e) => setEditCurso({ ...editCurso, nivel: e.target.value })}>
                <option value="">Seleccionar</option>
                {NIVELES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label>Asignatura</label>
              <select value={editCurso.asignatura} onChange={(e) => setEditCurso({ ...editCurso, asignatura: e.target.value })}>
                <option value="">Seleccionar</option>
                {ASIGNATURAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label>Estudiantes</label>
              <input type="number" min={1} max={50} value={editCurso.estudiantes || ''} onChange={(e) => setEditCurso({ ...editCurso, estudiantes: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="btnrow">
            <button className="primary" onClick={saveCurso}>Guardar curso</button>
            <button className="ghost" onClick={() => setShowCursoForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="two-col">
        <div>
          <div className="card">
            <h3>Mis cursos ({cursos.length})</h3>
            {cursos.length === 0 ? (
              <div className="empty-state">
                <p className="muted">Crea tu primer curso para comenzar.</p>
              </div>
            ) : (
              <div className="resource-list">
                {cursos.map((c) => (
                  <div key={c.id} className="resource-item" style={{ cursor: 'pointer', borderColor: activeCurso === c.id ? 'var(--brand)' : undefined }}
                    onClick={() => setActiveCurso(c.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <b>{c.nombre}</b>
                      <button className="small danger" onClick={(e) => { e.stopPropagation(); delCurso(c.id); }}><Trash2 size={12} /></button>
                    </div>
                    <span className="muted">{c.nivel} · {c.asignatura} · {c.estudiantes || estudiantes.filter((e) => e.cursoId === c.id).length} est.</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeCurso && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>Estudiantes</h3>
                <button className="small secondary" onClick={() => setShowEstForm(true)}><Plus size={12} /> Agregar</button>
              </div>
              {showEstForm && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input value={newEstNombre} onChange={(e) => setNewEstNombre(e.target.value)} placeholder="Nombre del estudiante"
                    onKeyDown={(e) => { if (e.key === 'Enter') addEstudiante(); }} />
                  <button className="primary small" onClick={addEstudiante}>Agregar</button>
                  <button className="ghost small" onClick={() => setShowEstForm(false)}>×</button>
                </div>
              )}
              {estDelCurso.length === 0 ? (
                <p className="muted">Agrega estudiantes a este curso.</p>
              ) : (
                <div className="resource-list">
                  {estDelCurso.map((e) => (
                    <div key={e.id} className="resource-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
                      <span>{e.nombre}</span>
                      <button className="small danger" onClick={() => delEstudiante(e.id)}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {activeCurso && (
          <div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <BarChart3 size={18} />
                <h3 style={{ margin: 0 }}>Reportes</h3>
              </div>
              <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                Genera un reporte simulado para {cursoActual?.nombre} ({estDelCurso.length} estudiantes).
              </p>
              <div className="btnrow">
                <button className="primary small" onClick={generarReporte} disabled={generating}>
                  <BarChart3 size={14} /> {generating ? 'Generando...' : 'Generar reporte simulado'}
                </button>
                <button className="secondary small" onClick={generarRecomendacion}>
                  <Sparkles size={14} /> Recomendaciones IA
                </button>
              </div>

              {reporteOutput && (
                <>
                  <div className="output output-light" style={{ marginTop: 12, fontSize: 13 }}
                    dangerouslySetInnerHTML={{ __html: mdToHtml(reporteOutput) }} />
                  <div className="btnrow">
                    <button className="small secondary" onClick={() => exportarReporte('html')}>HTML</button>
                    <button className="small ghost" onClick={() => exportarReporte('txt')}>TXT</button>
                    <button className="small primary" onClick={() => exportarReporte('print')}>Imprimir / PDF</button>
                  </div>
                </>
              )}

              {recomendacionOutput && (
                <>
                  <div className="output output-light" style={{ marginTop: 12, fontSize: 13 }}
                    dangerouslySetInnerHTML={{ __html: mdToHtml(recomendacionOutput) }} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
