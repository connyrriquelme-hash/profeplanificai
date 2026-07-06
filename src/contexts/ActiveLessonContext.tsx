import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface ActiveLessonCurriculum {
  level: string;
  levelId: string;
  subject: string;
  subjectId: string;
  objectiveId: string;
  objectiveCode: string;
  objectiveText: string;
  indicators: string[];
  skills: string[];
  criteria: string[];
  curricularSkills: { id: string; title: string; source: string; unidadId?: string; unidadNombre?: string }[];
}

interface ActiveLessonContextValue {
  curriculum: ActiveLessonCurriculum;
  setCurriculum: (patch: Partial<ActiveLessonCurriculum>) => void;
  hasCurriculum: boolean;
}

const EMPTY_CURRICULUM: ActiveLessonCurriculum = {
  level: '',
  levelId: '',
  subject: '',
  subjectId: '',
  objectiveId: '',
  objectiveCode: '',
  objectiveText: '',
  indicators: [],
  skills: [],
  criteria: [],
  curricularSkills: [],
};

const ActiveLessonContext = createContext<ActiveLessonContextValue>({
  curriculum: EMPTY_CURRICULUM,
  setCurriculum: () => {},
  hasCurriculum: false,
});

export function ActiveLessonProvider({ children }: { children: ReactNode }) {
  const [curriculum, setCurriculumState] = useState<ActiveLessonCurriculum>(EMPTY_CURRICULUM);

  const setCurriculum = useCallback((patch: Partial<ActiveLessonCurriculum>) => {
    setCurriculumState((prev) => ({ ...prev, ...patch }));
  }, []);

  const hasCurriculum = Boolean(curriculum.level && curriculum.subject);

  return (
    <ActiveLessonContext.Provider value={{ curriculum, setCurriculum, hasCurriculum }}>
      {children}
    </ActiveLessonContext.Provider>
  );
}

export function useActiveLesson() {
  return useContext(ActiveLessonContext);
}
