import type { AIConfig, BankEntry, CollaborationPost, DriveItem, DriveFolder, Comentario, PlanData, RecursoData, EvalData, CursoData, EstudianteData, SharedDocument } from '../types';

const KEYS = {
  CONFIG: 'planificaia_cfg',
  BANK: 'planificaia_bank',
  PLANS: 'planificaia_plans',
  RECURSOS: 'planificaia_recursos',
  EVALS: 'planificaia_evals',
  COLLAB: 'planificaia_collab',
  DRIVE: 'planificaia_drive',
  DRIVE_FOLDERS: 'planificaia_drive_folders',
  CURSOS: 'planificaia_cursos',
  ESTUDIANTES: 'planificaia_estudiantes',
  FAV_OA: 'planificaia_fav_oa',
  FAV_COLAB: 'planificaia_fav_colab',
  COMPACT: 'planificaia_compact',
  MATERIALS: 'planificaia_materials',
  SHARED_DOCS: 'planificaia_shared_docs',
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getConfig(): AIConfig {
  return getItem<AIConfig>(KEYS.CONFIG, { provider: 'local', model: '', apiKey: '' });
}

export function saveConfig(cfg: AIConfig): void {
  setItem(KEYS.CONFIG, cfg);
}

export function resetConfig(): void {
  localStorage.removeItem(KEYS.CONFIG);
}

export function getBank(): BankEntry[] {
  return getItem<BankEntry[]>(KEYS.BANK, []);
}

export function saveBankItem(entry: BankEntry): BankEntry[] {
  const arr = getBank();
  arr.unshift(entry);
  setItem(KEYS.BANK, arr);
  return arr;
}

export function deleteBankItem(id: string): BankEntry[] {
  const arr = getBank().filter((x) => x.id !== id);
  setItem(KEYS.BANK, arr);
  return arr;
}

export function clearBank(): void {
  localStorage.removeItem(KEYS.BANK);
}

// Module-specific storage (portable v2 style)
export function getPlans(): PlanData[] {
  return getItem<PlanData[]>(KEYS.PLANS, []);
}

export function savePlan(d: PlanData): void {
  const a = getPlans();
  const i = a.findIndex((x) => x.id === d.id);
  if (i >= 0) a[i] = d;
  else a.unshift(d);
  setItem(KEYS.PLANS, a);
}

export function delPlan(id: string): PlanData[] {
  const a = getPlans().filter((x) => x.id !== id);
  setItem(KEYS.PLANS, a);
  return a;
}

export function getRecursosGuardados(): RecursoData[] {
  return getItem<RecursoData[]>(KEYS.RECURSOS, []);
}

export function saveRecurso(d: RecursoData): void {
  const a = getRecursosGuardados();
  a.unshift(d);
  setItem(KEYS.RECURSOS, a);
}

export function delRecurso(id: string): RecursoData[] {
  const a = getRecursosGuardados().filter((x) => x.id !== id);
  setItem(KEYS.RECURSOS, a);
  return a;
}

export function getEvalsGuardadas(): EvalData[] {
  return getItem<EvalData[]>(KEYS.EVALS, []);
}

export function saveEval(d: EvalData): void {
  const a = getEvalsGuardadas();
  a.unshift(d);
  setItem(KEYS.EVALS, a);
}

export function delEval(id: string): EvalData[] {
  const a = getEvalsGuardadas().filter((x) => x.id !== id);
  setItem(KEYS.EVALS, a);
  return a;
}

// Collaboration
export function getCollabPosts(): CollaborationPost[] {
  return getItem<CollaborationPost[]>(KEYS.COLLAB, []);
}

export function saveCollabPost(p: CollaborationPost): CollaborationPost[] {
  const arr = getCollabPosts();
  arr.unshift(p);
  setItem(KEYS.COLLAB, arr);
  return arr;
}

export function likeCollabPost(id: string): CollaborationPost[] {
  const arr = getCollabPosts();
  const post = arr.find((x) => x.id === id);
  if (post) post.likes += 1;
  setItem(KEYS.COLLAB, arr);
  return arr;
}

export function addComment(postId: string, comment: Comentario): CollaborationPost[] {
  const arr = getCollabPosts();
  const post = arr.find((x) => x.id === postId);
  if (post) {
    post.comentarios = post.comentarios || [];
    post.comentarios.push(comment);
  }
  setItem(KEYS.COLLAB, arr);
  return arr;
}

export function deleteCollabPost(id: string): CollaborationPost[] {
  const arr = getCollabPosts().filter((x) => x.id !== id);
  setItem(KEYS.COLLAB, arr);
  return arr;
}

// Drive
export function getDriveItems(): DriveItem[] {
  return getItem<DriveItem[]>(KEYS.DRIVE, []);
}

export function saveDriveItem(d: DriveItem): DriveItem[] {
  const arr = getDriveItems();
  arr.unshift(d);
  setItem(KEYS.DRIVE, arr);
  return arr;
}

export function deleteDriveItem(id: string): DriveItem[] {
  const arr = getDriveItems().filter((x) => x.id !== id);
  setItem(KEYS.DRIVE, arr);
  return arr;
}

export function getDriveFolders(): DriveFolder[] {
  return getItem<DriveFolder[]>(KEYS.DRIVE_FOLDERS, []);
}

export function saveDriveFolders(d: DriveFolder[]): void {
  setItem(KEYS.DRIVE_FOLDERS, d);
}

// Docente (cursos + estudiantes)
export function getCursos(): CursoData[] {
  return getItem<CursoData[]>(KEYS.CURSOS, []);
}

export function saveCursos(d: CursoData[]): void {
  setItem(KEYS.CURSOS, d);
}

export function getEstudiantes(): EstudianteData[] {
  return getItem<EstudianteData[]>(KEYS.ESTUDIANTES, []);
}

export function saveEstudiantes(d: EstudianteData[]): void {
  setItem(KEYS.ESTUDIANTES, d);
}

// Legacy support (backward compat)
export function getMaterials() {
  return getItem<any[]>(KEYS.MATERIALS, []);
}

export function saveMaterial(m: any) {
  const arr = getMaterials();
  const idx = arr.findIndex((x) => x.id === m.id);
  if (idx >= 0) arr[idx] = m;
  else arr.unshift(m);
  setItem(KEYS.MATERIALS, arr);
  return arr;
}

export function deleteMaterial(id: string) {
  const arr = getMaterials().filter((x) => x.id !== id);
  setItem(KEYS.MATERIALS, arr);
  return arr;
}

export function getFavsOA(): string[] {
  return getItem<string[]>(KEYS.FAV_OA, []);
}

export function toggleFavOA(id: string): string[] {
  let f = getFavsOA();
  f = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
  setItem(KEYS.FAV_OA, f);
  return f;
}

// Shared documents
export function getSharedDocuments(): SharedDocument[] {
  return getItem<SharedDocument[]>(KEYS.SHARED_DOCS, []);
}

export function saveSharedDocument(d: SharedDocument): SharedDocument[] {
  const arr = getSharedDocuments();
  const i = arr.findIndex((x) => x.id === d.id);
  if (i >= 0) arr[i] = d;
  else arr.unshift(d);
  setItem(KEYS.SHARED_DOCS, arr);
  return arr;
}

export function deleteSharedDocument(id: string): SharedDocument[] {
  const arr = getSharedDocuments().filter((x) => x.id !== id);
  setItem(KEYS.SHARED_DOCS, arr);
  return arr;
}

export function getSharedDocumentByToken(token: string): SharedDocument | undefined {
  return getSharedDocuments().find((x) => x.shareToken === token);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
