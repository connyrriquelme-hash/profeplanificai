import type { ClassbookAcademicYear } from '../../types/classbook';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  academicYears: ClassbookAcademicYear[];
  selectedYear: ClassbookAcademicYear | null;
  onYearChange: (year: ClassbookAcademicYear) => void;
  sessionCount: number;
}

const tabs = [
  { id: 'overview', label: 'Resumen', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
  { id: 'sessions', label: 'Sesiones', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'attendance', label: 'Asistencia', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { id: 'observations', label: 'Observaciones', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { id: 'reviews', label: 'Revisiones', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'signatures', label: 'Firmas', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
];

export function ClassbookSidebar({ activeTab, onTabChange, academicYears, selectedYear, onYearChange, sessionCount }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-24 space-y-4">
      <div>
        <label htmlFor="classbook-year-select" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Periodo</label>
        <select
          id="classbook-year-select"
          value={selectedYear?.id ?? ''}
          onChange={(e) => {
            const year = academicYears.find(y => y.id === e.target.value);
            if (year) onYearChange(year);
          }}
          className="mt-1 w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {academicYears.map(y => (
            <option key={y.id} value={y.id}>{y.name}</option>
          ))}
        </select>
      </div>

      <nav className="space-y-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-violet-50 text-violet-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            {tab.label}
            {tab.id === 'sessions' && sessionCount > 0 && (
              <span aria-label={`${sessionCount} sesiones`} className="ml-auto text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {sessionCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
