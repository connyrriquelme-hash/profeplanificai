/**
 * SuggestedResourcesPanel — external evaluation-resource search + manual link saving.
 *
 * Portado de EvaluacionesView.tsx ("Recursos sugeridos") a un componente
 * standalone para poder mostrarlo también en Flujo Docente (Paso 5) al
 * elegir un producto de tipo evaluación, sin duplicar la lógica de fetch.
 */
import { useEffect, useState } from 'react';
import { BookOpen, Loader } from 'lucide-react';
import { api } from '../../services/apiClient';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SectionHeader } from '../ui/SectionHeader';

interface ResourceSource {
  id: string;
  name: string;
  source_type: string;
}

interface ResourceLink {
  id: string;
  title: string;
  description?: string;
  url?: string;
  access_type: 'open' | 'login_required' | 'paid' | 'manual_upload';
  source_name?: string;
  source_source_type?: string;
  validation_status?: string;
  license_note?: string;
}

interface SuggestedResourcesPanelProps {
  course?: string;
  subject: string;
  objectiveCode?: string;
  evaluationType?: string;
  skill?: string;
}

export function SuggestedResourcesPanel({ course, subject, objectiveCode, evaluationType, skill }: SuggestedResourcesPanelProps) {
  const [sources, setSources] = useState<ResourceSource[]>([]);
  const [links, setLinks] = useState<ResourceLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [newLink, setNewLink] = useState({ sourceId: '', title: '', url: '', description: '', tags: '' });

  useEffect(() => {
    api.get('/api/evaluation-resources/sources').then((res: any) => {
      if (res?.data) setSources(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!course && !subject) return;
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (course) params.set('course', course);
    if (subject) params.set('subject', subject);
    if (objectiveCode) params.set('objectiveCode', objectiveCode);
    api.get(`/api/evaluation-resources/search?${params.toString()}`).then((res: any) => {
      if (res?.data) setLinks(res.data);
      setLoading(false);
    }).catch(() => {
      setLinks([]);
      setLoading(false);
      setError('No se pudieron cargar recursos sugeridos.');
    });
  }, [course, subject, objectiveCode]);

  const handleAddLink = async () => {
    if (!newLink.sourceId || !newLink.title) return;
    try {
      await api.post('/api/evaluation-resources/link', {
        sourceId: newLink.sourceId,
        title: newLink.title,
        url: newLink.url,
        description: newLink.description,
        tags: newLink.tags.split(',').map(t => t.trim()).filter(Boolean),
        subject,
        course: course || '',
        objectiveCode: objectiveCode || '',
        evaluationType,
        skill,
      });
      setNewLink({ sourceId: '', title: '', url: '', description: '', tags: '' });
      setShowAddLink(false);
      setStatus('Enlace guardado. Pendiente de validación.');
    } catch {
      setStatus('No se pudo guardar el enlace.');
    }
  };

  if (!subject) return null;

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <SectionHeader icon={BookOpen} iconColor="#B5471F" title="Recursos sugeridos" description="Fuentes externas relacionadas con evaluación" />
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] px-3 py-1.5 rounded-lg hover:bg-[var(--primary-tint)] transition-all"
        >
          {expanded ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      {expanded && (
        <>
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          {status && <p className="text-xs text-[var(--primary)] mb-3">{status}</p>}

          {loading ? (
            <div className="text-xs flex items-center gap-1.5 py-4 justify-center text-gray-400">
              <Loader size={12} className="animate-spin" /> Cargando recursos...
            </div>
          ) : (
            <>
              {links.length === 0 && !showAddLink && (
                <p className="text-xs text-gray-400 italic py-3 text-center">
                  No hay recursos sugeridos para esta combinación. Puedes agregar enlaces manualmente.
                </p>
              )}

              {links.filter(l => l.access_type === 'open').length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[var(--ink-mid)] mb-2">
                    <Badge color="violet" size="sm">Oficiales / Públicos</Badge>
                  </p>
                  <div className="space-y-2">
                    {links.filter(l => l.access_type === 'open').map(link => (
                      <div key={link.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-xs font-semibold text-[var(--ink)]">{link.title}</span>
                            {link.source_source_type === 'official' && <Badge color="violet" size="sm">Oficial</Badge>}
                            {link.validation_status === 'validated' && <Badge color="green" size="sm">Validado</Badge>}
                          </div>
                          {link.description && <p className="text-xs text-[var(--ink-soft)] mb-1">{link.description}</p>}
                          <div className="flex items-center gap-2 flex-wrap">
                            {link.url && (
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline">
                                {link.source_name || 'Visitar sitio'}
                              </a>
                            )}
                            <span className="text-[10px] text-gray-400">{link.source_name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {links.filter(l => l.access_type === 'login_required').length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[var(--ink-mid)] mb-2">
                    <Badge color="amber" size="sm">Requiere inicio de sesión</Badge>
                  </p>
                  <div className="space-y-2">
                    {links.filter(l => l.access_type === 'login_required').map(link => (
                      <div key={link.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-xs font-semibold text-[var(--ink)]">{link.title}</span>
                            <Badge color="amber" size="sm">Cuenta privada</Badge>
                          </div>
                          {link.description && <p className="text-xs text-[var(--ink-soft)] mb-1">{link.description}</p>}
                          {link.url && (
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline">
                              {link.source_name || 'Visitar sitio'}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {links.filter(l => l.access_type === 'paid' || l.access_type === 'manual_upload').length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[var(--ink-mid)] mb-2">
                    <Badge color="slate" size="sm">Pago / Carga manual</Badge>
                  </p>
                  <div className="space-y-2">
                    {links.filter(l => l.access_type === 'paid' || l.access_type === 'manual_upload').map(link => (
                      <div key={link.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-xs font-semibold text-[var(--ink)]">{link.title}</span>
                            <Badge color="slate" size="sm">{link.access_type === 'paid' ? 'Pago' : 'Manual'}</Badge>
                          </div>
                          {link.description && <p className="text-xs text-[var(--ink-soft)] mb-1">{link.description}</p>}
                          <p className="text-[10px] text-gray-400">{link.license_note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 mt-3">
                <button type="button" onClick={() => setShowAddLink(!showAddLink)} className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]">
                  {showAddLink ? 'Cancelar' : 'Agregar enlace manual'}
                </button>

                {showAddLink && (
                  <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2.5">
                    <p className="text-xs font-semibold text-[var(--ink)] mb-1">Guardar enlace de recurso externo</p>
                    <select
                      value={newLink.sourceId}
                      onChange={e => setNewLink(p => ({ ...p, sourceId: e.target.value }))}
                      className="w-full h-9 px-2.5 rounded-lg bg-white border border-[var(--border)] text-xs text-[var(--ink)]"
                    >
                      <option value="">Seleccionar fuente</option>
                      {sources.filter(s => s.source_type === 'user_saved' || s.source_type === 'private_account').map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <input
                      type="text" placeholder="Título del recurso" value={newLink.title}
                      onChange={e => setNewLink(p => ({ ...p, title: e.target.value }))}
                      className="w-full h-9 px-2.5 rounded-lg bg-white border border-[var(--border)] text-xs text-[var(--ink)]"
                    />
                    <input
                      type="url" placeholder="URL (opcional)" value={newLink.url}
                      onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))}
                      className="w-full h-9 px-2.5 rounded-lg bg-white border border-[var(--border)] text-xs text-[var(--ink)]"
                    />
                    <textarea
                      placeholder="Descripción o nota personal" value={newLink.description}
                      onChange={e => setNewLink(p => ({ ...p, description: e.target.value }))}
                      className="w-full min-h-[50px] px-2.5 py-2 rounded-lg bg-white border border-[var(--border)] text-xs text-[var(--ink)] resize-y"
                    />
                    <input
                      type="text" placeholder="Tags separados por coma (inspiracion, OA, material)" value={newLink.tags}
                      onChange={e => setNewLink(p => ({ ...p, tags: e.target.value }))}
                      className="w-full h-9 px-2.5 rounded-lg bg-white border border-[var(--border)] text-xs text-[var(--ink)]"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <Button variant="secondary" size="sm" onClick={handleAddLink} disabled={!newLink.sourceId || !newLink.title}>Guardar enlace</Button>
                      <span className="text-[10px] text-gray-400">No se descarga contenido automáticamente</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}
