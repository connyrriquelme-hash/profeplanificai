import { useState, useEffect, useMemo } from 'react';
import { Archive, Search, Plus, BookOpen, Clock, Trash2, FileText, ClipboardCheck, Copy, FileDown, X, AlertCircle, Loader2, Sparkles, FolderOpen, BookMarked, GraduationCap, Presentation, FileSpreadsheet, Eye, Check } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useResources, type Resource } from '../hooks/useResources';
import { exportToPDF } from '../utils/exportPdf';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { IconBadge } from './ui/IconBadge';
import { SearchInput } from './ui/SearchInput';
import { EmptyState } from './ui/EmptyState';
import { SectionHeader } from './ui/SectionHeader';
import { SlideLessonPreview } from './SlideLessonPreview';
import { deserializeSlidesFromSave, getLocalSlideDecks } from '../services/slideSaveService';
import type { SlideLesson } from '../types/slideLesson';

type Tab = 'planificaciones' | 'recursos' | 'evaluaciones';

interface BancoRecursosViewProps {
  initialTab?: Tab;
  onNavigate?: (view: string) => void;
}

const QUICK_CATEGORIES = [
  { icon: FileText, label: 'Fichas de actividades', color: '#0d9488' },
  { icon: ClipboardCheck, label: 'Evaluaciones', color: '#7c3aed' },
  { icon: Presentation, label: 'Presentaciones', color: '#ea580c' },
  { icon: BookMarked, label: 'Recursos DUA', color: '#2563eb' },
  { icon: BookOpen, label: 'Lectura y comprensión', color: '#16a34a' },
  { icon: GraduationCap, label: 'Matemática', color: '#4f46e5' },
  { icon: FileSpreadsheet, label: 'SIMCE', color: '#d97706' },
  { icon: FolderOpen, label: 'Plantillas docentes', color: '#0891b2' },
];

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'planificaciones', label: 'Mis Planificaciones', icon: <BookOpen size={16} /> },
  { id: 'recursos', label: 'Mis Recursos', icon: <FileText size={16} /> },
  { id: 'evaluaciones', label: 'Mis Evaluaciones', icon: <ClipboardCheck size={16} /> },
];

export function BancoRecursosView({ initialTab, onNavigate }: BancoRecursosViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'planificaciones');
  const { library, removeFromLibrary, newProject } = useProject();
  const { resources, isLoading, error, fetchResources } = useResources();
  const [query, setQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [detail, setDetail] = useState<Resource | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === 'recursos' || activeTab === 'planificaciones') fetchResources();
  }, [activeTab, fetchResources]);

  const allPlans = useMemo(() => {
    const cloudPlans = resources
      .filter(r => r.type === 'planificacion' || (r.type === '' && r.content))
      .map(r => ({
        id: r.id,
        titulo: r.title || 'Planificación sin título',
        fecha: r.created_at,
        objetivos: r.objective_text || r.objective_code || '',
        nivel: r.level || '',
        inicio: r.content || '',
        desarrollo: '',
        cierre: '',
        source: 'cloud' as const,
      }));
    const localPlans = library.map(p => ({ ...p, source: 'local' as const }));
    return [...localPlans, ...cloudPlans].sort((a, b) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [library, resources]);

  const filteredPlans = query
    ? allPlans.filter(i =>
        i.titulo.toLowerCase().includes(query.toLowerCase()) ||
        (i.objetivos || '').toLowerCase().includes(query.toLowerCase())
      )
    : allPlans;

  const mergedResources: Resource[] = useMemo(() => {
    const localDecks = getLocalSlideDecks().map(d => ({
      id: d.id,
      user_id: '',
      title: d.title,
      type: d.type,
      source: d.source,
      content: d.content,
      level: d.level,
      subject: d.subject,
      objective_code: d.objective_code,
      objective_text: '',
      skill: '',
      metadata_json: '',
      created_at: d.created_at,
      updated_at: d.created_at,
    }));
    const existingIds = new Set(resources.map(r => r.id));
    return [...resources, ...localDecks.filter(ld => !existingIds.has(ld.id))];
  }, [resources]);

  const uniqueSubjects = useMemo(() => {
    if (activeTab !== 'recursos') return [];
    return [...new Set(mergedResources.map(r => r.subject).filter(Boolean))].sort();
  }, [mergedResources, activeTab]);

  const uniqueLevels = useMemo(() => {
    if (activeTab !== 'recursos') return [];
    return [...new Set(mergedResources.map(r => r.level).filter(Boolean))].sort();
  }, [mergedResources, activeTab]);

  const filteredResources = mergedResources.filter(r => {
    const matchesQuery = !query || 
      r.title?.toLowerCase().includes(query.toLowerCase()) ||
      r.subject?.toLowerCase().includes(query.toLowerCase()) ||
      r.level?.toLowerCase().includes(query.toLowerCase());
    const matchesSubject = !filterSubject || r.subject === filterSubject;
    const matchesLevel = !filterLevel || r.level === filterLevel;
    return matchesQuery && matchesSubject && matchesLevel;
  });

  const recommendedResource = filteredResources.length > 0 ? filteredResources[0] : null;

  const clearFilters = () => {
    setQuery('');
    setFilterSubject('');
    setFilterLevel('');
  };

  const handleNewClick = () => {
    newProject();
    onNavigate?.('workspace');
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('es-CL');

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="view">
      <Card className="bg-gradient-to-br from-teal-50 to-blue-50/50 border-teal-100/80 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <IconBadge icon={Archive} size="xl" color="#0d9488" variant="gradient" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Banco de Recursos</h1>
                <Badge color="teal" size="md">Recursos docentes</Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
                Explora, organiza y reutiliza materiales pedagógicos para tus clases.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={activeTab === 'recursos' ? 'lg:col-span-1' : 'lg:col-span-2'}>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
              <Search size={13} strokeWidth={2.25} />
              {activeTab === 'planificaciones' ? 'Buscar planificaciones' : activeTab === 'recursos' ? 'Buscar recursos' : 'Buscar evaluaciones'}
            </label>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={activeTab === 'planificaciones' ? 'Buscar planificaciones…' : 'Buscar por título, asignatura o nivel…'}
            />
          </div>
          {activeTab === 'recursos' && (
            <>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                  <BookOpen size={13} strokeWidth={2.25} />
                  Asignatura
                </label>
                <select
                  value={filterSubject}
                  onChange={e => setFilterSubject(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all shadow-sm appearance-none cursor-pointer"
                >
                  <option value="">Todas las asignaturas</option>
                  {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                  <GraduationCap size={13} strokeWidth={2.25} />
                  Nivel
                </label>
                <select
                  value={filterLevel}
                  onChange={e => setFilterLevel(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all shadow-sm appearance-none cursor-pointer"
                >
                  <option value="">Todos los niveles</option>
                  {uniqueLevels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </>
          )}
          {(query || filterSubject || filterLevel) && (
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </Card>

      <SectionHeader
        icon={FolderOpen}
        iconColor="#0d9488"
        title="Explorar categorías"
        description="Accede rápidamente a tipos de recursos pedagógicos."
        className="mb-4"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {QUICK_CATEGORIES.map(cat => (
          <Card key={cat.label} variant="interactive" className="p-3.5 flex items-center gap-3">
            <IconBadge icon={cat.icon} size="md" color={cat.color} variant="soft" />
            <span className="text-sm font-medium text-gray-700">{cat.label}</span>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap" role="tablist">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 ${
              activeTab === id
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-200/40'
                : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {activeTab === 'planificaciones' && (
        <>
          {filteredPlans.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={query ? 'No se encontraron planificaciones' : 'Aún no tienes planificaciones guardadas'}
              description={query ? undefined : 'Crea tu primera planificación desde el Espacio de Trabajo.'}
              action={
                query ? undefined : (
                  <Button variant="primary" iconLeft={Plus} onClick={handleNewClick}>
                    Crear Planificación
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map(item => {
                const isCloud = (item as any).source === 'cloud';
                const hasContent = item.inicio || item.desarrollo || item.cierre;
                return (
                  <Card key={item.id} className="p-5 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{item.titulo}</h3>
                          <Badge color="teal" size="sm">Planificación</Badge>
                          {isCloud && <Badge color="indigo" size="sm">Nube</Badge>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                          <Clock size={11} strokeWidth={2.25} />
                          {formatDate(item.fecha)}
                        </div>
                      </div>
                      {!isCloud && (
                        <button
                          onClick={() => removeFromLibrary(item.id)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                          aria-label="Eliminar planificación"
                        >
                          <Trash2 size={14} strokeWidth={2.25} />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {item.objetivos && <Badge color="indigo" size="sm">OA</Badge>}
                      {item.inicio && <Badge color="teal" size="sm">Inicio</Badge>}
                      {item.desarrollo && <Badge color="indigo" size="sm">Desarrollo</Badge>}
                      {item.cierre && <Badge color="amber" size="sm">Cierre</Badge>}
                      {item.nivel && <Badge color="slate" size="sm">{item.nivel}</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1">
                      {hasContent ? item.objetivos || item.inicio || 'Sin contenido' : 'Sin contenido'}
                    </p>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); onNavigate?.('workspace'); }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-all"
                      >
                        Ver
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onNavigate?.('panel-compartido'); }}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-800 px-2.5 py-1 rounded-lg hover:bg-teal-50 transition-all ml-auto"
                      >
                        Compartir
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'recursos' && (
        <>
          {error && (
            <Card className="mb-4 border-red-200 bg-red-50/50">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle size={16} strokeWidth={2.25} />
                {error}
              </div>
            </Card>
          )}

          {isLoading && resources.length === 0 && (
            <EmptyState
              icon={Loader2}
              title="Cargando recursos…"
              size="lg"
            />
          )}

          {!isLoading && !filteredResources.length && !error && (
            <EmptyState
              icon={FileText}
              title={query || filterSubject || filterLevel ? 'No hay recursos que coincidan con tu búsqueda' : 'Aún no hay recursos guardados'}
              description={query || filterSubject || filterLevel ? 'Prueba con otros filtros o palabras clave.' : 'Guarda materiales generados para reutilizarlos aquí.'}
            />
          )}

          {recommendedResource && filteredResources.length > 0 && (
            <Card className="mb-6 bg-gradient-to-br from-teal-50 to-blue-50/50 border-teal-100/80">
              <div className="flex items-start gap-4">
                <IconBadge icon={Sparkles} size="lg" color="#0d9488" variant="gradient" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge color="teal" size="sm">Recomendado</Badge>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{recommendedResource.title || 'Sin título'}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{recommendedResource.content}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="secondary" size="sm" iconLeft={Eye} onClick={() => setDetail(recommendedResource)}>
                      Ver recurso
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {filteredResources.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map(r => (
                <Card
                  key={r.id}
                  variant="interactive"
                  className="p-5"
                  onClick={() => setDetail(r)}
                >
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 leading-snug line-clamp-2">{r.title || 'Sin título'}</h3>
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {r.type === 'presentacion_clase_visual' && <Badge color="orange" size="sm">Presentación</Badge>}
                    {r.type === 'planificacion' && <Badge color="teal" size="sm">Planificación</Badge>}
                    {r.type === 'parent_report' && <Badge color="violet" size="sm">Informe Apoderados</Badge>}
                    {r.subject && <Badge color="teal" size="sm">{r.subject}</Badge>}
                    {r.level && <Badge color="indigo" size="sm">{r.level}</Badge>}
                    {r.objective_code && <Badge color="amber" size="sm">{r.objective_code}</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">{r.content || (() => { try { const m = JSON.parse(r.metadata_json || '{}'); return m.course ? `${m.subject} — ${m.course} • ${m.studentCount || 0} estudiantes` : ''; } catch { return ''; } })()}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock size={11} strokeWidth={2.25} className="mr-1" />
                      {formatDate(r.created_at)}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigate?.('workspace'); }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-all"
                    >
                      Ver
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'evaluaciones' && (
        <Card className="py-12">
          <EmptyState
            icon={ClipboardCheck}
            title="Próximamente: gestión de evaluaciones"
            description="Aquí podrás crear y gestionar rúbricas, listas de cotejo y pautas de evaluación."
          />
        </Card>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center z-50 p-4 sm:p-8 overflow-y-auto" onClick={() => setDetail(null)}>
          <div className={detail.type === 'presentacion_clase_visual' ? 'max-w-5xl w-full animate-fade-in' : 'max-w-2xl w-full animate-fade-in'} onClick={e => e.stopPropagation()}>
          <Card
            variant="elevated"
            className="p-0 overflow-hidden"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4 z-10">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900 leading-snug">{detail.title}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {detail.type === 'presentacion_clase_visual' && <Badge color="orange" size="sm">Presentación</Badge>}
                  {detail.subject && <Badge color="teal" size="sm">{detail.subject}</Badge>}
                  {detail.level && <Badge color="indigo" size="sm">{detail.level}</Badge>}
                  <span className="text-xs text-gray-400">{formatDate(detail.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {detail.type !== 'presentacion_clase_visual' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={copiedId === detail.id ? Check : Copy}
                    onClick={() => handleCopy(detail.content, detail.id)}
                  >
                    {copiedId === detail.id ? '¡Copiado!' : 'Copiar'}
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={FileDown}
                  onClick={() => exportToPDF(detail.title, detail.content)}
                >
                  PDF
                </Button>
                <button
                  onClick={() => setDetail(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  aria-label="Cerrar"
                >
                  <X size={16} strokeWidth={2.25} />
                </button>
              </div>
            </div>
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              {detail.type === 'presentacion_clase_visual' ? (() => {
                const slides = deserializeSlidesFromSave(detail.content);
                if (!slides) {
                  return <p className="text-sm text-gray-500">No se pudieron cargar las diapositivas.</p>;
                }
                return (
                  <SlideLessonPreview
                    lesson={slides}
                    onExportPDF={() => exportToPDF(detail.title, detail.content)}
                  />
                );
              })() : (
                <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{color:'#000000'}}>
                  {detail.content}
                </div>
              )}
            </div>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}
