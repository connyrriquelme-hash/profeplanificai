import { useEffect, useState } from 'react';
import { BookOpen, Copy, Database, ExternalLink, RotateCw, Search } from 'lucide-react';
import { api } from '../services/apiClient';

interface Course { id: string; code: string; name: string; cycle: string; objective_count: number }
interface Subject { id: string; name: string; normalized_name: string; objective_count: number }
interface Objective { code: string; official_text: string; course_code: string; course_name: string; subject_id: string; subject_name: string; axis_name?: string; source_url: string }
interface ObjectiveDetail extends Objective { source_name: string; license_note: string; skills: unknown[]; attitudes: unknown[]; resources: unknown[]; questions: unknown[] }

export function CurriculumCloudView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ObjectiveDetail | null>(null);
  const [status, setStatus] = useState('Cargando base curricular…');
  const [busy, setBusy] = useState(false);

  const loadCourses = () => {
    setStatus('Cargando cursos…');
    api.get<{ data: Course[] }>('/api/courses')
      .then(r => {
        setCourses(r.data);
        if (r.data.length && !course) setCourse(r.data[0].code);
        setStatus(r.data.some(c => Number(c.objective_count)) ? `${r.data.length} cursos disponibles.` : 'Base preparada. Selecciona un curso.');
      })
      .catch(e => setStatus('Error al cargar cursos: ' + e.message));
  };

  useEffect(() => { loadCourses(); }, []);

  useEffect(() => {
    const c = course;
    api.get<{ data: Subject[] }>(`/api/subjects${c ? `?course=${encodeURIComponent(c)}` : ''}`)
      .then(r => setSubjects(r.data))
      .catch(() => setSubjects([]));
  }, [course]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (course) params.set('course', course);
      if (subject) params.set('subject', subject);
      if (query.trim()) params.set('q', query.trim());
      params.set('limit', '120');
      const qs = params.toString();
      if (!qs) { setObjectives([]); return; }
      api.get<{ data: Objective[] }>(`/api/objectives?${qs}`)
        .then(r => { setObjectives(r.data); setStatus(`${r.data.length} OA encontrados.`); })
        .catch(e => setStatus('Error: ' + e.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [course, subject, query]);

  const openObjective = async (code: string) => {
    setBusy(true);
    try { const response = await api.get<{ data: ObjectiveDetail }>(`/api/objectives/${encodeURIComponent(code)}`); setSelected(response.data); }
    catch (e) { setStatus(e instanceof Error ? e.message : 'No se pudo abrir el OA'); }
    finally { setBusy(false); }
  };

  const handleCopyOA = () => {
    if (!selected) return;
    navigator.clipboard.writeText(`${selected.code} — ${selected.official_text}`);
  };

  return (
    <div className="view curriculum-cloud">
      <div className="module-header">
        <div>
          <h2 className="module-title"><Database size={22} /> Base Curricular Oficial</h2>
          <p className="muted">Explora, filtra y revisa Objetivos de Aprendizaje importados desde el Currículum Nacional — Ministerio de Educación de Chile.</p>
        </div>
      </div>

      <div className="card curriculum-toolbar">
        <div className="grid3">
          <div>
            <label>Curso</label>
            <select value={course} onChange={e => { setCourse(e.target.value); setSubject(''); setSelected(null); }}>
              <option value="">Todos los cursos</option>
              {courses.map(c => <option key={c.id} value={c.code}>{c.name} ({c.objective_count || 0})</option>)}
            </select>
          </div>
          <div>
            <label>Asignatura</label>
            <select value={subject} onChange={e => { setSubject(e.target.value); setSelected(null); }}>
              <option value="">Todas las asignaturas</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.objective_count || 0})</option>)}
            </select>
          </div>
          <div>
            <label>Buscar OA</label>
            <div className="search-bar">
              <Search className="search-icon" size={16} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Código o texto oficial…" />
            </div>
          </div>
        </div>
        <div className="status">
          {status}
          <button className="secondary" onClick={loadCourses} title="Recargar datos" style={{ padding: '2px 8px', fontSize: 12 }}><RotateCw size={14} /></button>
        </div>
      </div>

      <div className="curriculum-layout">
        <div className="curriculum-results">
          {objectives.map(oa => (
            <button
              key={oa.code}
              className={`curriculum-oa-card${selected?.code === oa.code ? ' selected' : ''}`}
              onClick={() => openObjective(oa.code)}
            >
              <div>
                <code>{oa.code}</code>
                <span>{oa.course_name} · {oa.subject_name}{oa.axis_name ? ` · ${oa.axis_name}` : ''}</span>
              </div>
              <p>{oa.official_text}</p>
            </button>
          ))}
          {!objectives.length && (
            <div className="empty-state">
              <BookOpen size={34} />
              <p>Selecciona un curso y asignatura para ver los OA disponibles.</p>
            </div>
          )}
        </div>

        <div className="curriculum-detail">
          {!selected ? (
            <div className="card empty-state">
              <BookOpen size={38} />
              <p>Selecciona un Objetivo de Aprendizaje para ver su detalle.</p>
            </div>
          ) : (
            <div className="card oa-sheet">
              <div className="oa-sheet-head">
                <code>{selected.code}</code>
                <a href={selected.source_url} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} /> Fuente oficial
                </a>
              </div>
              <h3>{selected.subject_name} · {selected.course_name}</h3>
              <p className="oa-official">{selected.official_text}</p>
              <p className="muted">Eje: {selected.axis_name || 'No informado'} · Fuente: Currículum Nacional — MINEDUC Chile</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="secondary" onClick={handleCopyOA}>
                  <Copy size={14} /> Copiar OA
                </button>
                <a href={selected.source_url} target="_blank" rel="noreferrer" className="secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>
                  <ExternalLink size={14} /> Ver fuente oficial
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
