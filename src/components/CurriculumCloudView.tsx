import { useEffect, useState } from 'react';
import { LibraryBig, BookOpenCheck, Copy, ExternalLink, RotateCw, Search, GraduationCap, Sparkles, Loader2, Check, FileText, AlertCircle } from 'lucide-react';
import { api } from '../services/apiClient';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { IconBadge } from './ui/IconBadge';
import { SearchInput } from './ui/SearchInput';
import { EmptyState } from './ui/EmptyState';

interface Course { id: string; code: string; name: string; cycle: string; objective_count: number }
interface Subject { id: string; name: string; normalized_name: string; objective_count: number }
interface Objective { code: string; official_text: string; course_code: string; course_name: string; subject_id: string; subject_name: string; axis_name?: string; source_url: string }
interface ObjectiveDetail extends Objective { source_name: string; license_note: string; skills: unknown[]; attitudes: unknown[]; resources: unknown[]; questions: unknown[] }

interface CurriculumCloudViewProps {
  onNavigate?: (view: string) => void;
}

export function CurriculumCloudView({ onNavigate }: CurriculumCloudViewProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ObjectiveDetail | null>(null);
  const [status, setStatus] = useState('Cargando base curricular...');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasError = status.startsWith('Error');
  const isLoadingCourses = status === 'Cargando base curricular...' || status === 'Cargando cursos...';

  const loadCourses = () => {
    setStatus('Cargando cursos...');
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (hasError && !courses.length) {
    return (
      <div className="view">
        <EmptyState
          icon={AlertCircle}
          title="No pudimos cargar la base curricular"
          description={status}
          action={<Button variant="danger" iconLeft={RotateCw} onClick={loadCourses}>Reintentar</Button>}
        />
      </div>
    );
  }

  if (isLoadingCourses && !courses.length) {
    return (
      <div className="view">
        <EmptyState
          icon={Loader2}
          title="Cargando base curricular..."
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="view">
      <Card className="bg-gradient-to-br from-blue-50 to-slate-50/50 border-blue-100/80 mb-6">
        <div className="flex items-start gap-4">
          <IconBadge icon={LibraryBig} size="xl" color="#2563eb" variant="gradient" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Base Curricular Oficial</h1>
              <Badge color="indigo" size="md">Currículum Nacional</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
              Explora, filtra y revisa Objetivos de Aprendizaje del Currículum Nacional — Ministerio de Educación de Chile.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
              <GraduationCap size={13} className="text-blue-600" strokeWidth={2.25} />
              Curso
            </label>
            <select
              value={course}
              onChange={e => { setCourse(e.target.value); setSubject(''); setSelected(null); }}
              className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="">Todos los cursos</option>
              {courses.map(c => (
                <option key={c.id} value={c.code}>{c.name} ({c.objective_count || 0})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
              <BookOpenCheck size={13} className="text-teal-600" strokeWidth={2.25} />
              Asignatura
            </label>
            <select
              value={subject}
              onChange={e => { setSubject(e.target.value); setSelected(null); }}
              className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="">Todas las asignaturas</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.objective_count || 0})</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
              <Search size={13} strokeWidth={2.25} />
              Buscar OA
            </label>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Código o texto oficial..."
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">{status}</span>
          <Button variant="ghost" size="sm" iconLeft={RotateCw} onClick={loadCourses}>
            Recargar
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 items-start">
        <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1 scrollbar-thin">
          {objectives.map(oa => (
            <button
              key={oa.code}
              onClick={() => openObjective(oa.code)}
              disabled={busy}
              className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 ${
                selected?.code === oa.code
                  ? 'border-blue-400 bg-blue-50/50 shadow-sm shadow-blue-100/50'
                  : 'border-gray-200/80 bg-white hover:border-gray-300/80 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color="indigo" size="sm">{oa.code}</Badge>
                  {selected?.code === oa.code && (
                    <Check size={14} className="text-blue-600" strokeWidth={2.5} />
                  )}
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap mt-0.5">
                  {oa.course_name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1.5">
                <span>{oa.subject_name}</span>
                {oa.axis_name && <><span className="text-gray-300">·</span><span>{oa.axis_name}</span></>}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                {oa.official_text}
              </p>
            </button>
          ))}

          {!objectives.length && (
            <EmptyState
              icon={BookOpenCheck}
              title="Selecciona un curso y asignatura"
              description="Los Objetivos de Aprendizaje aparecerán aquí una vez que elijas los filtros."
              size="sm"
              className="py-12"
            />
          )}
        </div>

        <div className="lg:sticky lg:top-4">
          {!selected ? (
            <EmptyState
              icon={FileText}
              title="Selecciona un objetivo"
              description="Haz clic en un OA de la lista para ver su detalle completo."
              action={objectives.length > 0 && !course && !subject ? undefined : undefined}
            />
          ) : (
            <Card variant="elevated">
              <div className="flex items-start justify-between gap-3 mb-5">
                <code className="inline-flex items-center px-3 py-1.5 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-base tracking-tight">
                  {selected.code}
                </code>
                {selected.source_url && (
                  <a
                    href={selected.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
                  >
                    <ExternalLink size={12} strokeWidth={2.25} />
                    Fuente oficial
                  </a>
                )}
              </div>

              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {selected.subject_name}
                <span className="text-gray-400 font-normal mx-1.5">·</span>
                <span className="font-normal text-gray-600">{selected.course_name}</span>
              </h3>

              {selected.axis_name && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                  <GraduationCap size={12} strokeWidth={2.25} className="text-blue-500" />
                  <span>Eje: {selected.axis_name}</span>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-base leading-relaxed" style={{color:'#000000'}}>
                  {selected.official_text}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
                <BookOpenCheck size={12} strokeWidth={2.25} />
                <span>
                  Fuente: Currículum Nacional — MINEDUC Chile
                  {selected.source_name ? ` · ${selected.source_name}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={copied ? Check : Copy}
                  onClick={handleCopyOA}
                >
                  {copied ? '¡Copiado!' : 'Copiar OA'}
                </Button>
                {selected.source_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={ExternalLink}
                    onClick={() => window.open(selected.source_url, '_blank')}
                  >
                    Ver fuente oficial
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
