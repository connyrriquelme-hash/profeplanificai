import { useState } from 'react';
import { Share2, Users, Link, Copy, Check, Eye, Pencil, MessageSquare, Trash2, Plus, Clock, ArrowLeft, Mail, Loader } from 'lucide-react';
import type { SharedDocument } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { IconBadge } from './ui/IconBadge';
import { EmptyState } from './ui/EmptyState';
import { SectionHeader } from './ui/SectionHeader';
import { PageHeader } from './ui/PageHeader';
import {
  getMySharedDocuments, createLocalSharedDocument,
  deleteSharedDoc, addCommentToDocument, updateDocumentContent, updateDocumentTitle,
} from '../services/sharedDocumentService';
import { sendSharedDocumentEmail, buildMailtoUrl, validateEmail } from '../services/shareEmailService';

interface SharedPanelViewProps {
  onNavigate?: (view: string) => void;
}

const ROLE_LABELS: Record<string, { label: string; color: 'indigo' | 'violet' | 'green' | 'orange' }> = {
  owner: { label: 'Propietario', color: 'indigo' },
  editor: { label: 'Editor', color: 'violet' },
  viewer: { label: 'Lector', color: 'green' },
  commenter: { label: 'Comentador', color: 'orange' },
};

export function SharedPanelView({ onNavigate }: SharedPanelViewProps) {
  const [docs, setDocs] = useState<SharedDocument[]>(() => getMySharedDocuments());
  const [selectedDoc, setSelectedDoc] = useState<SharedDocument | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [editingContent, setEditingContent] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const refresh = () => setDocs(getMySharedDocuments());

  const handleCopy = async (shareToken: string) => {
    const url = `${window.location.origin}?shared=${shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(shareToken);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* silent */ }
  };

  const handleSendEmail = async () => {
    if (!selectedDoc || !emailTo.trim()) return;
    if (!validateEmail(emailTo.trim())) {
      setEmailStatus({ type: 'error', text: 'Ingresa un correo valido.' });
      return;
    }
    const shareUrl = `${window.location.origin}?shared=${selectedDoc.shareToken}`;
    setIsSendingEmail(true);
    setEmailStatus(null);

    const result = await sendSharedDocumentEmail({
      to: emailTo.trim(),
      documentTitle: selectedDoc.title,
      shareUrl,
      message: emailMessage.trim() || undefined,
      documentType: selectedDoc.sourceType === 'evaluacion' ? 'evaluacion' : 'planificacion',
    });

    if (result.ok) {
      setEmailStatus({ type: 'ok', text: 'Correo enviado correctamente.' });
      setEmailMessage('');
      setEmailTo('');
    } else if (result.code === 'provider_not_configured') {
      setEmailStatus({ type: 'info', text: 'No hay envio automatico configurado. Se abrira tu cliente de correo.' });
      const mailtoUrl = buildMailtoUrl({
        to: emailTo.trim(),
        documentTitle: selectedDoc.title,
        shareUrl,
        message: emailMessage.trim() || undefined,
        documentType: selectedDoc.sourceType === 'evaluacion' ? 'evaluacion' : 'planificacion',
      });
      window.location.href = mailtoUrl;
    } else {
      setEmailStatus({ type: 'error', text: result.message || 'No se pudo enviar el correo.' });
    }
    setIsSendingEmail(false);
  };

  const handleCreate = () => {
    const doc = createLocalSharedDocument(
      'Nueva planificación compartida',
      '',
      'manual',
      '',
      'Docente',
    );
    refresh();
    setSelectedDoc(doc);
  };

  const handleDelete = (id: string) => {
    deleteSharedDoc(id);
    refresh();
    if (selectedDoc?.id === id) setSelectedDoc(null);
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedDoc) return;
    const updated = addCommentToDocument(selectedDoc.id, 'Docente', commentText.trim());
    if (updated) {
      setSelectedDoc(updated);
      setCommentText('');
    }
  };

  const handleSaveContent = () => {
    if (!selectedDoc) return;
    const updated = updateDocumentContent(selectedDoc.id, editContent);
    if (updated) {
      setSelectedDoc(updated);
      setEditingContent(false);
    }
  };

  const handleStartEdit = () => {
    if (!selectedDoc) return;
    setEditContent(selectedDoc.content);
    setEditingContent(true);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (selectedDoc) {
    const role = ROLE_LABELS[selectedDoc.permission === 'edit' ? 'editor' : 'viewer'] || ROLE_LABELS.viewer;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedDoc(null); setEditingContent(false); }}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <input
              type="text"
              value={selectedDoc.title}
              onChange={(e) => {
                const updated = updateDocumentTitle(selectedDoc.id, e.target.value);
                if (updated) setSelectedDoc(updated);
              }}
              className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none w-full focus:ring-0 p-0"
              placeholder="Título del documento"
            />
          </div>
          <Badge color={role.color}>{role.label}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <SectionHeader title="Contenido" />
                {!editingContent ? (
                  <Button variant="outline" size="sm" iconLeft={Pencil} onClick={handleStartEdit}>Editar</Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingContent(false)}>Cancelar</Button>
                    <Button size="sm" iconLeft={Check} onClick={handleSaveContent}>Guardar</Button>
                  </div>
                )}
              </div>
              {editingContent ? (
                <textarea
                  className="w-full min-h-[300px] p-4 rounded-xl border border-gray-200 text-sm font-sans resize-y outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Escribe el contenido de la planificación..."
                />
              ) : (
                <div className="min-h-[300px] p-4 bg-gray-50/50 rounded-xl text-sm whitespace-pre-wrap leading-relaxed" style={{color:'#000000'}}>
                  {selectedDoc.content || 'Sin contenido aún.'}
                </div>
              )}
            </Card>

            <Card>
              <SectionHeader title="Comentarios" />
              <div className="space-y-4 mt-3">
                {(selectedDoc.comments || []).length === 0 && (
                  <p className="text-sm text-gray-400">Sin comentarios aún.</p>
                )}
                {(selectedDoc.comments || []).map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">{c.authorName || 'Usuario'}</span>
                      <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{c.comment}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="Escribe un comentario..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                  />
                  <Button size="sm" iconLeft={MessageSquare} onClick={handleAddComment}>Enviar</Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <SectionHeader title="Compartir" />
              <div className="space-y-3 mt-3">
                <Button
                  variant="premium"
                  className="w-full"
                  iconLeft={copiedId === selectedDoc.shareToken ? Check : Link}
                  onClick={() => handleCopy(selectedDoc.shareToken)}
                >
                  {copiedId === selectedDoc.shareToken ? 'Copiado' : 'Copiar enlace'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-xs text-gray-400">o</span>
                  </div>
                </div>

                <button
                  onClick={() => { setShowEmailForm(!showEmailForm); setEmailStatus(null); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <Mail size={15} />
                  Enviar por correo
                </button>

                {showEmailForm && (
                  <div className="space-y-2.5 pt-1">
                    <input
                      type="email"
                      value={emailTo}
                      onChange={e => setEmailTo(e.target.value)}
                      placeholder="Correo del destinatario"
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                    <textarea
                      value={emailMessage}
                      onChange={e => setEmailMessage(e.target.value)}
                      placeholder="Mensaje opcional"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all resize-y"
                    />
                    <Button
                      variant="premium"
                      className="w-full"
                      iconLeft={isSendingEmail ? Loader : Mail}
                      onClick={handleSendEmail}
                      disabled={isSendingEmail || !emailTo.trim()}
                    >
                      {isSendingEmail ? 'Enviando...' : 'Enviar por correo'}
                    </Button>
                    {emailStatus && (
                      <p className={`text-xs text-center ${emailStatus.type === 'ok' ? 'text-green-600' : emailStatus.type === 'error' ? 'text-red-500' : 'text-amber-600'}`}>
                        {emailStatus.text}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 text-center">
                      Solo se envia el enlace. El contenido completo no se incluye en el correo.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <SectionHeader title="Detalles" />
              <div className="space-y-2 mt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Creado</span>
                  <span className="text-gray-700">{formatDate(selectedDoc.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Actualizado</span>
                  <span className="text-gray-700">{formatDate(selectedDoc.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Origen</span>
                  <span className="text-gray-700">{selectedDoc.sourceType || 'Manual'}</span>
                </div>
              </div>
            </Card>

            <Button
              variant="danger"
              className="w-full"
              iconLeft={Trash2}
              onClick={() => handleDelete(selectedDoc.id)}
            >
              Eliminar documento
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Share2}
        iconColor="#0891b2"
        title="Panel Compartido"
        description="Comparte planificaciones con colegas para revisar, comentar o adaptar."
        badge="Colaboración"
        badgeColor="teal"
        actions={
          <Button variant="premium" iconLeft={Plus} onClick={handleCreate}>
            Compartir planificación
          </Button>
        }
        variant="hero"
      />

      {docs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay documentos compartidos"
          description="Crea una planificación desde Espacio de Trabajo y compártela con colegas, o presiona el botón de arriba para comenzar."
          action={
            <div className="flex items-center gap-3 mt-2">
              <Button variant="primary" iconLeft={Plus} onClick={handleCreate}>
                Crear documento compartido
              </Button>
              {onNavigate && (
                <Button variant="outline" iconLeft={Pencil} onClick={() => onNavigate('workspace')}>
                  Ir a Espacio de Trabajo
                </Button>
              )}
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {docs.map((doc) => {
            const roleInfo = ROLE_LABELS.owner;
            return (
              <Card key={doc.id} variant="interactive" onClick={() => setSelectedDoc(doc)}>
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <IconBadge icon={Share2} size="sm" color="#0891b2" variant="soft" />
                    <Badge color={roleInfo.color} size="sm">{roleInfo.label}</Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{doc.title}</h3>
                  <p className="text-xs text-gray-400 flex-1 line-clamp-2">{doc.content || 'Sin contenido'}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock size={12} />
                      {formatDate(doc.updatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(doc.shareToken); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                        title="Copiar enlace"
                      >
                        {copiedId === doc.shareToken ? <Check size={14} /> : <Link size={14} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
