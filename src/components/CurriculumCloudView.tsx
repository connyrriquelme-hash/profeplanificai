import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Copy, Database, ExternalLink, FileDown, RotateCw, Save, Search, Sparkles } from 'lucide-react';
import { api } from '../services/apiClient';
import { saveDriveItem, generateId } from '../services/storageService';
import { exportToPDF } from '../utils/exportPdf';

interface Course { id: string; code: string; name: string; cycle: string; objective_count: number }
interface Subject { id: string; name: string; normalized_name: string; objective_count: number }
interface Objective { code: string; official_text: string; course_code: string; course_name: string; subject_id: string; subject_name: string; axis_name?: string; source_url: string }
interface ObjectiveDetail extends Objective { source_name: string; license_note: string; skills: unknown[]; attitudes: unknown[]; resources: unknown[]; questions: unknown[] }
interface ActivityResult { titulo: string; objetivo: string; inicio: string; desarrollo: string; cierre: string; materiales: string[]; evaluacion: string[]; rubrica: Array<{ criterio: string; niveles: string[] }>; adecuaciones_dua: string[]; indicadores: string[]; preguntas: Array<{ enunciado: string; alternativas?: string[]; respuesta?: string }> }

function activityToMarkdown(value: ActivityResult): string {
  const list = (items: string[]) => items.map(item => `- ${item}`).join('\n') || '- Sin elementos';
  return `# ${value.titulo}\n\n**Objetivo:** ${value.objetivo}\n\n## Inicio\n${value.inicio}\n\n## Desarrollo\n${value.desarrollo}\n\n## Cierre\n${value.cierre}\n\n## Materiales\n${list(value.materiales)}\n\n## Indicadores\n${list(value.indicadores)}\n\n## Evaluación\n${list(value.evaluacion)}\n\n## Adecuaciones DUA\n${list(value.adecuaciones_dua)}\n\n## Preguntas\n${value.preguntas.map((q, i) => `${i + 1}. ${q.enunciado}${q.alternativas?.length ? `\n${q.alternativas.map((a, n) => `   ${String.fromCharCode(65 + n)}) ${a}`).join('\n')}` : ''}${q.respuesta ? `\n   **Respuesta:** ${q.respuesta}` : ''}`).join('\n\n')}\n\n## Rúbrica\n${value.rubrica.map(r => `- **${r.criterio}:** ${r.niveles.join(' · ')}`).join('\n') || '- No solicitada'}`;
}

export function CurriculumCloudView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ObjectiveDetail | null>(null);
  const [type, setType] = useState('clase');
  const [duration, setDuration] = useState(45);
  const [difficulty, setDifficulty] = useState('medio');
  const [dua, setDua] = useState(true);
  const [rubric, setRubric] = useState(true);
  const [context, setContext] = useState('');
  const [result, setResult] = useState<ActivityResult | null>(null);
  const [editable, setEditable] = useState('');
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

  const parsedEditable = useMemo(() => { try { return JSON.parse(editable) as ActivityResult; } catch { return null; } }, [editable]);

  const openObjective = async (code: string) => {
    setBusy(true); setResult(null); setEditable('');
    try { const response = await api.get<{ data: ObjectiveDetail }>(`/api/objectives/${encodeURIComponent(code)}`); setSelected(response.data); }
    catch (e) { setStatus(e instanceof Error ? e.message : 'No se pudo abrir el OA'); }
    finally { setBusy(false); }
  };

  const generate = async () => {
    if (!selected) return;
    setBusy(true); setStatus('Generando actividad alineada…');
    try {
      const response = await api.post<{ data: ActivityResult; meta: { provider: string; warning?: string } }>('/api/generate-activity', { objective_code: selected.code, activity_type: type, duration_minutes: duration, difficulty, include_rubric: rubric, include_dua: dua, include_simce_style: type === 'simce', context });
      setResult(response.data); setEditable(JSON.stringify(response.data, null, 2)); setStatus(response.meta.warning || `Actividad generada con ${response.meta.provider} y guardada en D1.`);
    } catch (e) { setStatus(e instanceof Error ? e.message : 'Error al generar'); }
    finally { setBusy(false); }
  };

  const save = () => {
    if (!parsedEditable || !selected) return;
    saveDriveItem({ id: generateId(), nombre: parsedEditable.titulo, tipo: 'actividad-curricular', contenido: activityToMarkdown(parsedEditable), nivel: selected.course_name, asignatura: selected.subject_name, oa: selected.code, fecha: new Date().toISOString(), tamano: editable.length });
    setStatus('Actividad guardada en tu Drive de PlanificaIA; la versión generada también quedó registrada en D1.');
  };

  return <div className="view curriculum-cloud">
    <div className="module-header"><div><h2 className="module-title"><Database size={22} /> Base Curricular Oficial</h2><p className="muted">OA importados desde Currículum Nacional — Ministerio de Educación de Chile.</p></div></div>
    <div className="card curriculum-toolbar">
      <div className="grid3">
        <div><label>Curso</label><select value={course} onChange={e => { setCourse(e.target.value); setSubject(''); }}><option value="">Todos los cursos</option>{courses.map(c => <option key={c.id} value={c.code}>{c.name} ({c.objective_count || 0})</option>)}</select></div>
        <div><label>Asignatura</label><select value={subject} onChange={e => setSubject(e.target.value)}><option value="">Todas las asignaturas</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.objective_count || 0})</option>)}</select></div>
        <div><label>Buscar OA</label><div className="search-bar"><Search className="search-icon" size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Código o texto oficial…" /></div></div>
      </div>
      <div className="status">{status} <button className="secondary" onClick={loadCourses} title="Recargar datos" style={{ padding: '2px 8px', fontSize: 12 }}><RotateCw size={14} /></button></div>
    </div>
    <div className="curriculum-layout">
      <div className="curriculum-results">
        {objectives.map(oa => <button key={oa.code} className={`curriculum-oa-card${selected?.code === oa.code ? ' selected' : ''}`} onClick={() => openObjective(oa.code)}>
          <div><code>{oa.code}</code><span>{oa.course_name} · {oa.subject_name}{oa.axis_name ? ` · ${oa.axis_name}` : ''}</span></div><p>{oa.official_text}</p>
        </button>)}
        {!objectives.length && <div className="empty-state"><BookOpen size={34} /><p>Selecciona un curso y asignatura para ver los OA disponibles.</p></div>}
      </div>
      <div className="curriculum-detail">
        {!selected ? <div className="card empty-state"><BookOpen size={38} /><p>Selecciona un Objetivo de Aprendizaje.</p></div> : <>
          <div className="card oa-sheet"><div className="oa-sheet-head"><code>{selected.code}</code><a href={selected.source_url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Fuente oficial</a></div><h3>{selected.subject_name} · {selected.course_name}</h3><p className="oa-official">{selected.official_text}</p><p className="muted">Eje: {selected.axis_name || 'No informado'} · Fuente: Currículum Nacional — MINEDUC Chile</p></div>
          <div className="card"><h3><Sparkles size={18} /> Generar actividad</h3><div className="grid3"><div><label>Tipo</label><select value={type} onChange={e => setType(e.target.value)}><option value="clase">Clase</option><option value="guia">Guía</option><option value="evaluacion">Evaluación</option><option value="simce">SIMCE</option><option value="proyecto">Proyecto</option><option value="ticket_salida">Ticket de salida</option></select></div><div><label>Duración</label><input type="number" min={5} max={300} value={duration} onChange={e => setDuration(Number(e.target.value))} /></div><div><label>Dificultad</label><select value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="inicial">Inicial</option><option value="medio">Medio</option><option value="avanzado">Avanzado</option></select></div></div><div className="btnrow"><label className="check-row"><input type="checkbox" checked={dua} onChange={e => setDua(e.target.checked)} /> DUA</label><label className="check-row"><input type="checkbox" checked={rubric} onChange={e => setRubric(e.target.checked)} /> Rúbrica</label></div><label>Contexto opcional</label><textarea rows={2} value={context} onChange={e => setContext(e.target.value)} placeholder="Características del curso, necesidades o materiales disponibles…" /><button className="primary" onClick={generate} disabled={busy}>{busy ? 'Procesando…' : 'Generar actividad'}</button></div>
          {result && <div className="card"><h3>Resultado editable</h3><textarea className="activity-json-editor" value={editable} onChange={e => setEditable(e.target.value)} rows={20} /><div className="btnrow"><button className="secondary" disabled={!parsedEditable} onClick={() => navigator.clipboard.writeText(parsedEditable ? activityToMarkdown(parsedEditable) : editable)}><Copy size={14} /> Copiar</button><button className="secondary" disabled={!parsedEditable} onClick={() => parsedEditable && exportToPDF(parsedEditable.titulo, activityToMarkdown(parsedEditable))}><FileDown size={14} /> Exportar PDF</button><button className="primary" disabled={!parsedEditable} onClick={save}><Save size={14} /> Guardar actividad</button></div>{!parsedEditable && <div className="status bad">El JSON editado no es válido.</div>}</div>}
        </>}
      </div>
    </div>
  </div>;
}
