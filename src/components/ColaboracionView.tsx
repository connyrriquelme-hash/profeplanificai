import { useState, useEffect } from 'react';
import { ThumbsUp, X } from 'lucide-react';
import type { CollaborationPost, Comentario } from '../types';
import {
  getCollabPosts,
  saveCollabPost,
  deleteCollabPost,
  likeCollabPost,
  addComment,
  generateId,
} from '../services/storageService';
import { NIVELES, ASIGNATURAS } from '../types';
import { mdToHtml } from '../utils/htmlUtils';

const TIPOS_PUBLICACION = [
  'Planificación', 'Guía', 'Evaluación', 'Rúbrica', 'Actividad', 'Recurso DUA', 'Otro',
];

export function ColaboracionView() {
  const [posts, setPosts] = useState<CollaborationPost[]>([]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({
    usuario: '',
    titulo: '',
    contenido: '',
    tipo: 'Planificación' as string,
    nivel: '',
    asignatura: '',
  });
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    setPosts(getCollabPosts());
  }, []);

  const handlePublish = () => {
    if (!newPost.titulo.trim() || !newPost.contenido.trim()) return;
    const post: CollaborationPost = {
      id: generateId(),
      usuario: newPost.usuario || 'Docente anónimo',
      titulo: newPost.titulo,
      contenido: newPost.contenido,
      tipo: newPost.tipo as CollaborationPost['tipo'],
      nivel: newPost.nivel,
      asignatura: newPost.asignatura,
      fecha: new Date().toLocaleString('es-CL'),
      likes: 0,
      comentarios: [],
    };
    const updated = saveCollabPost(post);
    setPosts(updated);
    setShowForm(false);
    setNewPost({ usuario: '', titulo: '', contenido: '', tipo: 'Planificación', nivel: '', asignatura: '' });
  };

  const handleLike = (id: string) => {
    setPosts(likeCollabPost(id));
  };

  const handleComment = (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    const comment: Comentario = {
      id: generateId(),
      usuario: 'Docente',
      texto: text,
      fecha: new Date().toLocaleString('es-CL'),
    };
    setPosts(addComment(postId, comment));
    setCommentTexts((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta publicación?')) {
      setPosts(deleteCollabPost(id));
    }
  };

  const filteredPosts = filter
    ? posts.filter(
        (p) =>
          p.titulo.toLowerCase().includes(filter.toLowerCase()) ||
          p.contenido.toLowerCase().includes(filter.toLowerCase()) ||
          p.nivel?.toLowerCase().includes(filter.toLowerCase()) ||
          p.asignatura?.toLowerCase().includes(filter.toLowerCase())
      )
    : posts;

  return (
    <div className="view" id="colaboracion">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 20 }}>Colaboración docente</h2>
        <button className="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Publicar recurso'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>Nueva publicación</h3>
          <div className="grid">
            <div>
              <label>Tu nombre (opcional)</label>
              <input
                value={newPost.usuario}
                onChange={(e) => setNewPost((p) => ({ ...p, usuario: e.target.value }))}
                placeholder="Docente"
              />
            </div>
            <div>
              <label>Tipo</label>
              <select
                value={newPost.tipo}
                onChange={(e) => setNewPost((p) => ({ ...p, tipo: e.target.value }))}
              >
                {TIPOS_PUBLICACION.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Nivel</label>
              <select
                value={newPost.nivel}
                onChange={(e) => setNewPost((p) => ({ ...p, nivel: e.target.value }))}
              >
                <option value="">Seleccionar</option>
                {NIVELES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label>Asignatura</label>
              <select
                value={newPost.asignatura}
                onChange={(e) => setNewPost((p) => ({ ...p, asignatura: e.target.value }))}
              >
                <option value="">Seleccionar</option>
                {ASIGNATURAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <label>Título</label>
          <input
            value={newPost.titulo}
            onChange={(e) => setNewPost((p) => ({ ...p, titulo: e.target.value }))}
            placeholder="Título del recurso"
          />
          <label>Contenido</label>
          <textarea
            value={newPost.contenido}
            onChange={(e) => setNewPost((p) => ({ ...p, contenido: e.target.value }))}
            placeholder="Comparte tu material, experiencia o recurso..."
            style={{ minHeight: 120 }}
          />
          <div className="btnrow">
            <button className="primary" onClick={handlePublish}>Publicar</button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <input
              placeholder="Buscar publicaciones..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <span className="muted">{filteredPosts.length} publicaciones</span>
        </div>

        {filteredPosts.length === 0 ? (
          <p className="muted">
            {posts.length === 0
              ? 'Aún no hay publicaciones. ¡Sé el primero en compartir un recurso!'
              : 'No se encontraron publicaciones con ese filtro.'}
          </p>
        ) : (
          <div className="resource-list">
            {filteredPosts.map((post) => (
              <div key={post.id} className="resource-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <b>{post.titulo}</b>
                    <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                      {post.usuario} · {post.tipo}
                      {post.nivel ? ` · ${post.nivel}` : ''}
                      {post.asignatura ? ` · ${post.asignatura}` : ''}
                      {' · '}
                      {post.fecha}
                    </span>
                  </div>
                    <button className="small danger" onClick={() => handleDelete(post.id)}>
                    <X size={14} />
                  </button>
                </div>
                <div
                  style={{ fontSize: 13, margin: '8px 0', lineHeight: 1.5, color: 'var(--muted)' }}
                  dangerouslySetInnerHTML={{ __html: mdToHtml(post.contenido) }}
                />
                <div className="btnrow" style={{ marginTop: 8 }}>
                    <button className="small secondary" onClick={() => handleLike(post.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <ThumbsUp size={14} /> {post.likes}
                    </button>
                </div>

                {/* Comentarios */}
                <div style={{ marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  {(post.comentarios || []).map((c) => (
                    <div key={c.id} style={{ fontSize: 12, marginBottom: 6, color: 'var(--muted)' }}>
                      <b>{c.usuario}</b>: {c.texto}{' '}
                      <span style={{ fontSize: 11 }}>{c.fecha}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <input
                      placeholder="Añadir comentario..."
                      value={commentTexts[post.id] || ''}
                      onChange={(e) =>
                        setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      style={{ flex: 1, fontSize: 12, padding: '6px 10px' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleComment(post.id);
                      }}
                    />
                    <button className="small primary" onClick={() => handleComment(post.id)}>
                      Comentar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
