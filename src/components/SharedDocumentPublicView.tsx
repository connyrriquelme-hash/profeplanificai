import { useState, useEffect } from 'react';
import { Eye, Pencil, MessageSquare, Link, Check, ArrowLeft, Clock, AlertCircle, Loader, Save } from 'lucide-react';
import type { SharedDocument, SharedDocumentPermission, SharedDocumentComment } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { getDocumentByToken } from '../services/sharedDocumentService';

const API_BASE = import.meta.env.VITE_API_URL || '';

function mapApiDoc(raw: Record<string, any>): SharedDocument {
  return {
    id: raw.id || '',
    ownerUserId: raw.owner_user_id || '',
    ownerName: raw.owner_name || '',
    title: raw.title || '',
    content: raw.content || '',
    sourceType: raw.source_type || '',
    sourceId: raw.source_id || '',
    shareToken: raw.share_token || '',
    visibility: raw.visibility || 'shared',
    permission: (raw.permission || 'view') as SharedDocumentPermission,
    collaborators: [],
    comments: (raw.comments || []).map((c: Record<string, any>) => ({
      id: c.id || '',
      documentId: c.document_id || '',
      userId: c.user_id || '',
      authorName: c.author_name || '',
      comment: c.comment || '',
      createdAt: c.created_at || '',
    })),
    createdAt: raw.created_at || '',
    updatedAt: raw.updated_at || '',
  };
}

interface SharedDocumentPublicViewProps {
  token: string;
}

export function SharedDocumentPublicView({ token }: SharedDocumentPublicViewProps) {
  const [doc, setDoc] = useState<SharedDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchDoc = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/data/shared-documents?token=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error('NOT_FOUND');
        const json = await res.json();
        if (!cancelled && json?.data) {
          setDoc(mapApiDoc(json.data));
        } else if (!cancelled) {
          throw new Error('NOT_FOUND');
        }
      } catch {
        const local = getDocumentByToken(token);
        if (!cancelled) {
          if (local) {
            setDoc(local);
          } else {
            setError('Enlace no válido o documento no disponible.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDoc();
    return () => { cancelled = true; };
  }, [token]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  const handleSaveContent = async () => {
    if (!doc) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/data/shared-documents?token=${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error('SAVE_FAILED');
      setDoc({ ...doc, content: editContent, updatedAt: new Date().toISOString() });
      setEditing(false);
      setSaveMsg('Cambios guardados');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('No se pudieron guardar los cambios');
      setTimeout(() => setSaveMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !doc) return;
    setPostingComment(true);
    try {
      const res = await fetch(`${API_BASE}/api/data/shared-documents?id=${doc.id}&action=comment&token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentText.trim(), authorName: 'Colega' }),
      });
      if (!res.ok) throw new Error('COMMENT_FAILED');
      const json = await res.json();
      if (json?.success) {
        const newComment: SharedDocumentComment = {
          id: json.id,
          documentId: doc.id,
          userId: '',
          authorName: 'Colega',
          comment: commentText.trim(),
          createdAt: new Date().toISOString(),
        };
        setDoc({ ...doc, comments: [...(doc.comments || []), newComment] });
        setCommentText('');
      }
    } catch {
      // Placeholder – fallback comment
      const newComment: SharedDocumentComment = {
        id: Date.now().toString(),
        documentId: doc.id,
        userId: '',
        authorName: 'Colega',
        comment: commentText.trim(),
        createdAt: new Date().toISOString(),
      };
      setDoc({ ...doc, comments: [...(doc.comments || []), newComment] });
      setCommentText('');
    } finally {
      setPostingComment(false);
    }
  };

  const permissionLabel = (p: string): { label: string; color: 'green' | 'violet' | 'orange' } => {
    if (p === 'edit') return { label: 'Puedes editar', color: 'violet' };
    if (p === 'comment') return { label: 'Puedes comentar', color: 'orange' };
    return { label: 'Solo lectura', color: 'green' };
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader size={32} className="animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Cargando planificación compartida…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Enlace no válido</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Button onClick={() => { window.location.href = window.location.origin; }}>
            Volver al inicio
          </Button>
        </Card>
      </div>
    );
  }

  if (!doc) return null;

  const perm = permissionLabel(doc.permission);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200/60">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => { window.location.href = window.location.origin; }}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 truncate">{doc.title || 'Planificación'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={perm.color} size="sm">{perm.label}</Badge>
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-all"
              title="Copiar enlace"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Link size={16} />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {saveMsg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${saveMsg === 'Cambios guardados' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {saveMsg === 'Cambios guardados' ? <><Check size={16} className="inline mr-1.5" />{saveMsg}</> : <><AlertCircle size={16} className="inline mr-1.5" />{saveMsg}</>}
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{doc.title || 'Planificación'}</h2>
          <div className="flex flex-wrap gap-2">
            {doc.sourceType && (
              <Badge color="teal" size="sm">{doc.sourceType.replace(/_/g, ' ')}</Badge>
            )}
            {doc.ownerName && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                Por {doc.ownerName}
              </span>
            )}
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={14} />
              {doc.updatedAt && `Actualizado ${formatDate(doc.updatedAt)}`}
            </div>
            {doc.permission === 'edit' && !editing && (
              <Button variant="outline" size="sm" iconLeft={Pencil} onClick={() => { setEditContent(doc.content); setEditing(true); }}>
                Editar
              </Button>
            )}
            {editing && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button size="sm" iconLeft={saving ? Loader : Save} onClick={handleSaveContent} disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </div>
            )}
          </div>
          {editing ? (
            <textarea
              className="w-full min-h-[400px] p-5 text-sm font-sans resize-y outline-none focus:ring-0 border-none"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Escribe el contenido de la planificación…"
            />
          ) : (
            <div className="p-5 text-sm whitespace-pre-wrap leading-relaxed" style={{color:'#000000'}}>
              {doc.content || 'Sin contenido.'}
            </div>
          )}
        </Card>

        {doc.permission === 'comment' || doc.permission === 'edit' ? (
          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={16} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Comentarios</h3>
              </div>
              <div className="space-y-3 mb-4">
                {(!doc.comments || doc.comments.length === 0) && (
                  <p className="text-sm text-gray-400">Sin comentarios aún.</p>
                )}
                {(doc.comments || []).map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">{c.authorName || 'Usuario'}</span>
                      <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{c.comment}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Escribe un comentario…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                />
                <Button size="sm" iconLeft={MessageSquare} onClick={handleAddComment} disabled={postingComment || !commentText.trim()}>
                  {postingComment ? 'Enviando…' : 'Comentar'}
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        <div className="flex items-center justify-center gap-2 pt-4 pb-8">
          <Button variant="outline" size="sm" iconLeft={copied ? Check : Link} onClick={handleCopy}>
            {copied ? '¡Copiado!' : 'Copiar enlace compartido'}
          </Button>
          <Button variant="ghost" size="sm" iconLeft={ArrowLeft} onClick={() => { window.location.href = window.location.origin; }}>
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
