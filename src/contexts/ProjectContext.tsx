import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface ProjectData {
  id: string;
  titulo: string;
  fecha: string;
  objetivos: string;
  oat: string;
  indicadores: string;
  nivel: string;
  asignatura: string;
  oa_id: string;
  habilidad: string;
  indicadores_raw: string;
  inicio: string;
  desarrollo: string;
  cierre: string;
  recursos: string;
  evaluacion: string;
}

interface ProjectContextType {
  currentProject: ProjectData | null;
  library: ProjectData[];
  setCurrentProject: (p: ProjectData | null) => void;
  updateProjectField: <K extends keyof ProjectData>(field: K, value: ProjectData[K]) => void;
  addToLibrary: () => void;
  removeFromLibrary: (id: string) => void;
  clearCurrentProject: () => void;
  newProject: () => void;
}

const STORAGE_KEY = 'planificaciones_guardadas';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function emptyProject(): ProjectData {
  return {
    id: generateId(),
    titulo: `Planificación - ${new Date().toLocaleDateString('es-CL')}`,
    fecha: new Date().toISOString(),
    objetivos: '',
    oat: '',
    indicadores: '',
    nivel: '',
    asignatura: '',
    oa_id: '',
    habilidad: '',
    indicadores_raw: '[]',
    inicio: '',
    desarrollo: '',
    cierre: '',
    recursos: '',
    evaluacion: '',
  };
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [library, setLibrary] = useState<ProjectData[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  const updateProjectField = useCallback(<K extends keyof ProjectData>(field: K, value: ProjectData[K]) => {
    setCurrentProject(prev => prev ? { ...prev, [field]: value } : prev);
  }, []);

  const addToLibrary = useCallback(() => {
    setCurrentProject(prev => {
      if (!prev) return prev;
      const now = new Date().toISOString();
      const entry = { ...prev, fecha: now };
      setLibrary(existing => {
        const updated = [entry, ...existing.filter(e => e.id !== entry.id)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      return prev;
    });
  }, []);

  const removeFromLibrary = useCallback((id: string) => {
    setLibrary(prev => {
      const updated = prev.filter(e => e.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearCurrentProject = useCallback(() => {
    setCurrentProject(null);
  }, []);

  const newProject = useCallback(() => {
    setCurrentProject(emptyProject());
  }, []);

  return (
    <ProjectContext.Provider value={{
      currentProject,
      library,
      setCurrentProject,
      updateProjectField,
      addToLibrary,
      removeFromLibrary,
      clearCurrentProject,
      newProject,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
