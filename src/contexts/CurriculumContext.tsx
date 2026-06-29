import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getLevels, getSubjectsByLevel, getObjectives, searchObjectives, type LearningObjective } from '../data/libraryMockData';

export type { LearningObjective };

interface CurriculumState {
  levels: string[];
  getSubjects: (level: string) => string[];
  getObjectives: (level: string, subject: string) => LearningObjective[];
  searchObjectives: (query: string, level?: string, subject?: string) => LearningObjective[];
  isLoading: boolean;
}

const CurriculumContext = createContext<CurriculumState | undefined>(undefined);

export const CurriculumProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate async load from D1 in production
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const value: CurriculumState = {
    levels: getLevels(),
    getSubjects: getSubjectsByLevel,
    getObjectives,
    searchObjectives,
    isLoading,
  };

  return (
    <CurriculumContext.Provider value={value}>
      {children}
    </CurriculumContext.Provider>
  );
};

export const useCurriculum = () => {
  const context = useContext(CurriculumContext);
  if (context === undefined) {
    throw new Error('useCurriculum debe ser usado dentro de un CurriculumProvider');
  }
  return context;
};
