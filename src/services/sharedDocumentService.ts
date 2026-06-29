import type { SharedDocument, SharedDocumentComment, SharedDocumentCollaborator, SharedDocumentPermission, SharedDocumentRole } from '../types';
import {
  getSharedDocuments, saveSharedDocument, deleteSharedDocument, getSharedDocumentByToken, generateId
} from './storageService';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiCall<T>(path: string, options?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const token = localStorage.getItem('planificaia_token');
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers },
    });
    return await res.json();
  } catch {
    return { error: 'OFFLINE' };
  }
}

function generateShareToken(): string {
  return crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
}

export function createLocalSharedDocument(
  title: string,
  content: string,
  sourceType: string,
  sourceId: string,
  ownerName: string,
): SharedDocument {
  const now = new Date().toISOString();
  const doc: SharedDocument = {
    id: generateId(),
    ownerUserId: 'local',
    ownerName,
    title,
    content,
    sourceType,
    sourceId,
    shareToken: generateShareToken(),
    visibility: 'private',
    permission: 'view',
    collaborators: [],
    comments: [],
    createdAt: now,
    updatedAt: now,
  };
  saveSharedDocument(doc);
  return doc;
}

export function getMySharedDocuments(): SharedDocument[] {
  return getSharedDocuments();
}

export function getDocumentByToken(token: string): SharedDocument | undefined {
  return getSharedDocumentByToken(token);
}

export function deleteSharedDoc(id: string): void {
  deleteSharedDocument(id);
}

export function addCommentToDocument(docId: string, authorName: string, comment: string): SharedDocument | undefined {
  const docs = getSharedDocuments();
  const doc = docs.find((x) => x.id === docId);
  if (!doc) return;
  const newComment: SharedDocumentComment = {
    id: generateId(),
    documentId: docId,
    userId: 'local',
    authorName,
    comment,
    createdAt: new Date().toISOString(),
  };
  doc.comments = [...(doc.comments || []), newComment];
  doc.updatedAt = new Date().toISOString();
  saveSharedDocument(doc);
  return doc;
}

export function updateDocumentContent(docId: string, content: string): SharedDocument | undefined {
  const docs = getSharedDocuments();
  const doc = docs.find((x) => x.id === docId);
  if (!doc) return;
  doc.content = content;
  doc.updatedAt = new Date().toISOString();
  saveSharedDocument(doc);
  return doc;
}

export function updateDocumentTitle(docId: string, title: string): SharedDocument | undefined {
  const docs = getSharedDocuments();
  const doc = docs.find((x) => x.id === docId);
  if (!doc) return;
  doc.title = title;
  doc.updatedAt = new Date().toISOString();
  saveSharedDocument(doc);
  return doc;
}

export async function shareWithCloud(docId: string): Promise<{ shareUrl?: string; error?: string }> {
  const docs = getSharedDocuments();
  const doc = docs.find((x) => x.id === docId);
  if (!doc) return { error: 'Documento no encontrado' };

  const result = await apiCall<{ data: SharedDocument }>('/api/data/shared-documents', {
    method: 'POST',
    body: JSON.stringify(doc),
  });

  if (result.error === 'OFFLINE') {
    const baseUrl = window.location.origin;
    return { shareUrl: `${baseUrl}?shared=${doc.shareToken}` };
  }

  if (result.error) return { error: result.error };
  return { shareUrl: `${window.location.origin}?shared=${doc.shareToken}` };
}

export function shareFromWorkspace(params: {
  title: string;
  content: string;
  nivel?: string;
  asignatura?: string;
  oa?: string;
  habilidad?: string;
  lessonTheme?: string;
}): { doc: SharedDocument; shareUrl: string } {
  const now = new Date().toISOString();
  const shareToken = generateShareToken();
  const doc: SharedDocument = {
    id: generateId(),
    ownerUserId: 'local',
    ownerName: 'Docente',
    title: params.title,
    content: params.content,
    sourceType: 'workspace_plan',
    sourceId: '',
    shareToken,
    visibility: 'shared',
    permission: 'edit',
    collaborators: [],
    comments: [],
    createdAt: now,
    updatedAt: now,
  };
  saveSharedDocument(doc);

  const shareUrl = `${window.location.origin}?shared=${shareToken}`;
  return { doc, shareUrl };
}
