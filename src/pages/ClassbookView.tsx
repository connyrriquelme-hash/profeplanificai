import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { classbookService } from '../services/classbookService';
import { canViewClassbook } from '../utils/classbookPermissions';
import type { ClassbookSession, ClassbookAcademicYear } from '../types/classbook';
import { ClassbookLayout } from '../components/classbook/ClassbookLayout';
import { ClassbookOverview } from '../components/classbook/ClassbookOverview';
import { ClassSessionList } from '../components/classbook/ClassSessionList';
import { ClassSessionDetailView } from '../components/classbook/ClassSessionDetailView';
import { AttendancePanel } from '../components/classbook/AttendancePanel';
import { ObservationsPanel } from '../components/classbook/ObservationsPanel';
import { PlanningReviewsPanel } from '../components/classbook/PlanningReviewsPanel';

type ClassbookTab = 'overview' | 'sessions' | 'attendance' | 'observations' | 'reviews' | 'signatures';

interface Props {
  onNavigate: (view: string, state?: Record<string, unknown>) => void;
  sessionId?: string;
}

export function ClassbookView({ onNavigate, sessionId }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ClassbookTab>(sessionId ? 'sessions' : 'overview');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessionId ?? null);
  const [academicYears, setAcademicYears] = useState<ClassbookAcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<ClassbookAcademicYear | null>(null);
  const [sessions, setSessions] = useState<ClassbookSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      setSelectedSessionId(sessionId);
      setActiveTab('sessions');
    }
  }, [sessionId]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as ClassbookTab);
    setSelectedSessionId(null);
  }, []);

  const institutionId = (user as unknown as { institution_id?: string })?.institution_id ?? '';

  useEffect(() => {
    if (!user || !canViewClassbook(user)) return;
    const ctrl = new AbortController();
    setLoading(true);
    classbookService.getAcademicYears(institutionId, ctrl.signal)
      .then((years: ClassbookAcademicYear[]) => {
        setAcademicYears(years);
        const active = years.find((y: ClassbookAcademicYear) => y.status === 'active') ?? years[0] ?? null;
        setSelectedYear(active);
        if (active) {
          return classbookService.getClassSessions(active.id, {}, ctrl.signal);
        }
        return [];
      })
      .then((sessionsData: ClassbookSession[]) => {
        setSessions(sessionsData);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setError(err.message ?? 'Error al cargar datos');
          setLoading(false);
        }
      });
    return () => ctrl.abort();
  }, [user, institutionId]);

  const handleYearChange = useCallback(async (year: ClassbookAcademicYear) => {
    setSelectedYear(year);
    setLoading(true);
    try {
      const s = await classbookService.getClassSessions(year.id);
      setSessions(s);
    } catch {
      setError('Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const s = await classbookService.getClassSessions(selectedYear.id);
      setSessions(s);
    } catch {
      setError('Error al recargar');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  if (!user || !canViewClassbook(user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Acceso restringido</h2>
          <p className="text-sm text-slate-500">No tienes acceso al Libro de Clases Digital.</p>
          <button onClick={() => onNavigate('dashboard')} className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (loading && !sessions.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md w-full space-y-4">
          <h2 className="text-lg font-bold text-red-700">Error</h2>
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={handleRefresh} className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ClassbookLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      academicYears={academicYears}
      selectedYear={selectedYear}
      onYearChange={handleYearChange}
      sessions={sessions}
    >
      {selectedSessionId ? (
        <ClassSessionDetailView
          sessionId={selectedSessionId}
          onBack={() => setSelectedSessionId(null)}
          onRefresh={handleRefresh}
        />
      ) : (
        <>
          {activeTab === 'overview' && (
            <ClassbookOverview sessions={sessions} onNavigate={onNavigate} onRefresh={handleRefresh} />
          )}
          {activeTab === 'sessions' && (
            <ClassSessionList
              sessions={sessions}
              onRefresh={handleRefresh}
              onOpenSession={(id: string) => setSelectedSessionId(id)}
            />
          )}
          {activeTab === 'attendance' && selectedYear && (
            <AttendancePanel
              sessions={sessions}
              institutionId={institutionId}
              onRefresh={handleRefresh}
            />
          )}
          {activeTab === 'observations' && selectedYear && (
            <ObservationsPanel
              institutionId={institutionId}
              yearId={selectedYear.id}
              sessions={sessions}
            />
          )}
          {activeTab === 'reviews' && selectedYear && (
            <PlanningReviewsPanel institutionId={institutionId} />
          )}
          {activeTab === 'signatures' && (
            <div className="text-center py-16 text-slate-500">
              <p className="text-sm">Firmas digitales — Próximamente</p>
            </div>
          )}
        </>
      )}
    </ClassbookLayout>
  );
}
