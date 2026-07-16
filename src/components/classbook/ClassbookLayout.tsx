import type { ReactNode } from 'react';
import type { ClassbookSession, ClassbookAcademicYear } from '../../types/classbook';
import { ClassbookSidebar } from './ClassbookSidebar';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  academicYears: ClassbookAcademicYear[];
  selectedYear: ClassbookAcademicYear | null;
  onYearChange: (year: ClassbookAcademicYear) => void;
  sessions: ClassbookSession[];
  children: ReactNode;
}

export function ClassbookLayout({ activeTab, onTabChange, academicYears, selectedYear, onYearChange, sessions, children }: Props) {
  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      <aside className="hidden lg:block w-56 flex-shrink-0">
        <ClassbookSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          academicYears={academicYears}
          selectedYear={selectedYear}
          onYearChange={onYearChange}
          sessionCount={sessions.length}
        />
      </aside>
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
