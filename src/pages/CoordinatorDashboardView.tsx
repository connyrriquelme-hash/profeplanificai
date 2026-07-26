import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { classbookService } from '../services/classbookService';
import { canViewCoordinatorDashboard } from '../utils/classbookPermissions';
import type {
  CoordinatorDashboardSummary,
  CoordinatorTeacherSummary,
  CoordinatorCourseSummary,
  CoordinatorSessionSummary,
  CoordinatorPlanningSummary,
  CoordinatorSignatureSummary,
  CoordinatorCoverageSummary,
  CoordinatorAlert,
  CoordinatorDashboardFilters,
} from '../types/classbookCoordinator';
import CoordinatorDashboardHeader from '../components/classbook/coordinator/CoordinatorDashboardHeader';
import CoordinatorSummaryCards from '../components/classbook/coordinator/CoordinatorSummaryCards';
import CoordinatorFilters from '../components/classbook/coordinator/CoordinatorFilters';
import TeacherComplianceTable from '../components/classbook/coordinator/TeacherComplianceTable';
import CourseCoverageTable from '../components/classbook/coordinator/CourseCoverageTable';
import PendingReviewsPanel from '../components/classbook/coordinator/PendingReviewsPanel';
import PendingSignaturesPanel from '../components/classbook/coordinator/PendingSignaturesPanel';
import CoordinatorAlertsPanel from '../components/classbook/coordinator/CoordinatorAlertsPanel';
import CurriculumCoverageChart from '../components/classbook/coordinator/CurriculumCoverageChart';
import SessionStatusChart from '../components/classbook/coordinator/SessionStatusChart';

type CoordinatorTab = 'overview' | 'teachers' | 'courses' | 'sessions' | 'reviews' | 'signatures' | 'coverage' | 'alerts';

interface Props {
  onNavigate: (view: string, state?: Record<string, unknown>) => void;
}

export function CoordinatorDashboardView({ onNavigate }: Props) {
  const { user, activeInstitutionId } = useAuth();
  const [activeTab, setActiveTab] = useState<CoordinatorTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CoordinatorDashboardFilters>({});

  const effectiveInstitutionId =
    user?.institutionalRole === 'super_admin'
      ? activeInstitutionId ?? undefined
      : user?.institutionId;

  const [summary, setSummary] = useState<CoordinatorDashboardSummary | null>(null);
  const [teachers, setTeachers] = useState<CoordinatorTeacherSummary[]>([]);
  const [courses, setCourses] = useState<CoordinatorCourseSummary[]>([]);
  const [sessions, setSessions] = useState<CoordinatorSessionSummary[]>([]);
  const [reviews, setReviews] = useState<CoordinatorPlanningSummary[]>([]);
  const [signatures, setSignatures] = useState<CoordinatorSignatureSummary[]>([]);
  const [coverage, setCoverage] = useState<CoordinatorCoverageSummary[]>([]);
  const [alerts, setAlerts] = useState<CoordinatorAlert[]>([]);

  // Filter options
  const [filterOptions, setFilterOptions] = useState<{
    academicYears: { id: string; name: string }[];
    terms: { id: string; name: string }[];
    courses: { id: string; name: string }[];
    subjects: { id: string; name: string }[];
    teachers: { id: string; name: string }[];
  }>({
    academicYears: [],
    terms: [],
    courses: [],
    subjects: [],
    teachers: [],
  });

  const fetchData = useCallback(async (filtersToUse: CoordinatorDashboardFilters) => {
    setLoading(true);
    setError(null);
    try {
      const [s, t, c, se, r, si, co, a] = await Promise.all([
        classbookService.getCoordinatorDashboard(filtersToUse, effectiveInstitutionId),
        classbookService.getCoordinatorTeachers(filtersToUse, effectiveInstitutionId),
        classbookService.getCoordinatorCourses(filtersToUse, effectiveInstitutionId),
        classbookService.getCoordinatorSessions(filtersToUse, effectiveInstitutionId),
        classbookService.getCoordinatorPlanningReviews(filtersToUse, effectiveInstitutionId),
        classbookService.getCoordinatorPendingSignatures(filtersToUse, effectiveInstitutionId),
        classbookService.getCoordinatorCoverage(filtersToUse, effectiveInstitutionId),
        classbookService.getCoordinatorAlerts(filtersToUse, effectiveInstitutionId),
      ]);
      setSummary(s);
      setTeachers(t);
      setCourses(c);
      setSessions(se);
      setReviews(r);
      setSignatures(si);
      setCoverage(co);
      setAlerts(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [effectiveInstitutionId]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const options = await classbookService.getCoordinatorFilterOptions(effectiveInstitutionId);
      setFilterOptions(options);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  }, [effectiveInstitutionId]);

  useEffect(() => {
    fetchData(filters);
  }, [fetchData, filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const handleFilterChange = useCallback((newFilters: CoordinatorDashboardFilters) => {
    setFilters(newFilters);
  }, []);

  // Derived state for header
  const academicYearName = useMemo(() => {
    return filterOptions.academicYears.find(y => y.id === filters.academicYearId)?.name ?? 'No seleccionado';
  }, [filterOptions.academicYears, filters.academicYearId]);

  const termName = useMemo(() => {
    return filterOptions.terms.find(t => t.id === filters.termId)?.name ?? 'No seleccionado';
  }, [filterOptions.terms, filters.termId]);

  // Handler for review actions
  const handleReviewAction = useCallback(async (
    reviewId: string,
    action: 'approve' | 'observe' | 'return',
    comment?: string
  ) => {
    try {
      // Map frontend action names to backend status values
      const statusMap = {
        approve: 'approved',
        observe: 'observed',
        return: 'returned',
      } as const;
      await classbookService.updatePlanningReview(reviewId, { status: statusMap[action], comments: comment });
      fetchData(filters);
    } catch (err) {
      console.error('Error updating review:', err);
    }
  }, [fetchData, filters]);

  // Navigation handlers
  const handleAlertNavigate = useCallback((resourceType: string, resourceId: string) => {
    switch (resourceType) {
      case 'class_session':
        onNavigate('libro-clases', { sessionId: resourceId });
        break;
      case 'planning_review':
        setActiveTab('reviews');
        break;
      case 'student_observation':
        setActiveTab('reviews');
        break;
      case 'attendance':
        onNavigate('libro-clases', { sessionId: resourceId });
        break;
      case 'coverage':
        setActiveTab('coverage');
        break;
      default:
        console.warn('Unknown resource type for navigation:', resourceType);
    }
  }, [onNavigate]);

  const handleSignatureNavigate = useCallback((sessionId: string) => {
    onNavigate('libro-clases', { sessionId });
  }, [onNavigate]);

  if (!user || !canViewCoordinatorDashboard(user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Acceso restringido</h2>
          <p className="text-slate-500">No tienes permisos para ver el panel de coordinación.</p>
        </div>
      </div>
    );
  }

  if (user.institutionalRole === 'super_admin' && !activeInstitutionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Seleccionar institución</h2>
          <p className="text-slate-500">Selecciona una institución activa para ver el panel de coordinación.</p>
        </div>
      </div>
    );
  }

  const tabs: { id: CoordinatorTab; label: string }[] = [
    { id: 'overview', label: 'Resumen' },
    { id: 'teachers', label: 'Docentes' },
    { id: 'courses', label: 'Cursos' },
    { id: 'sessions', label: 'Sesiones' },
    { id: 'reviews', label: 'Revisiones' },
    { id: 'signatures', label: 'Firmas' },
    { id: 'coverage', label: 'Cobertura' },
    { id: 'alerts', label: 'Alertas' },
  ];

  return (
    <div className="space-y-6">
      <CoordinatorDashboardHeader academicYearName={academicYearName} termName={termName} />

      <CoordinatorFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        academicYears={filterOptions.academicYears}
        terms={filterOptions.terms}
        courses={filterOptions.courses}
        subjects={filterOptions.subjects}
        teachers={filterOptions.teachers}
      />

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.id === 'alerts' && alerts.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-rose-500 rounded-full">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
            {tab.id === 'reviews' && reviews.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-amber-500 rounded-full">
                {reviews.length > 9 ? '9+' : reviews.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
          <span className="ml-3 text-slate-500">Cargando datos...</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && summary && (
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              <CoordinatorSummaryCards summary={summary} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SessionStatusChart summary={summary} />
                <CurriculumCoverageChart coverage={coverage} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PendingReviewsPanel
                  reviews={reviews}
                  onAction={handleReviewAction}
                />
                <PendingSignaturesPanel
                  signatures={signatures}
                  onOpenSession={handleSignatureNavigate}
                />
              </div>
              {alerts.length > 0 && (
                <CoordinatorAlertsPanel alerts={alerts} onNavigate={handleAlertNavigate} />
              )}
            </>
          )}

          {activeTab === 'teachers' && (
            <TeacherComplianceTable teachers={teachers} />
          )}

          {activeTab === 'courses' && (
            <CourseCoverageTable courses={courses} />
          )}

          {activeTab === 'sessions' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Sesiones de Clase</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left p-3 font-medium text-slate-600">Fecha</th>
                      <th className="text-left p-3 font-medium text-slate-600">Curso</th>
                      <th className="text-left p-3 font-medium text-slate-600">Asignatura</th>
                      <th className="text-left p-3 font-medium text-slate-600">Docente</th>
                      <th className="text-left p-3 font-medium text-slate-600">Estado</th>
                      <th className="text-left p-3 font-medium text-slate-600">Asistencia</th>
                      <th className="text-left p-3 font-medium text-slate-600">Firma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.sessionId} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="p-3 text-slate-700">{s.date}</td>
                        <td className="p-3 text-slate-700">{s.courseName}</td>
                        <td className="p-3 text-slate-700">{s.subjectName}</td>
                        <td className="p-3 text-slate-700">{s.teacherName}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            s.status === 'signed' ? 'bg-violet-50 text-violet-700' :
                            s.status === 'pending_signature' ? 'bg-amber-50 text-amber-700' :
                            s.status === 'cancelled' ? 'bg-slate-100 text-slate-500' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {s.hasAttendance ? (
                            <span className="text-emerald-600" aria-label="Con asistencia">✓</span>
                          ) : (
                            <span className="text-slate-400" aria-label="Sin asistencia">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          {s.hasSignature ? (
                            <span className="text-emerald-600" aria-label="Firmada">✓</span>
                          ) : (
                            <span className="text-slate-400" aria-label="Sin firma">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {sessions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No hay sesiones que mostrar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <PendingReviewsPanel
              reviews={reviews}
              onAction={handleReviewAction}
            />
          )}

          {activeTab === 'signatures' && (
            <PendingSignaturesPanel
              signatures={signatures}
              onOpenSession={handleSignatureNavigate}
            />
          )}

          {activeTab === 'coverage' && (
            <>
              <CurriculumCoverageChart coverage={coverage} />
              <CourseCoverageTable courses={courses} />
            </>
          )}

          {activeTab === 'alerts' && (
            <CoordinatorAlertsPanel alerts={alerts} onNavigate={handleAlertNavigate} />
          )}
        </div>
      )}
    </div>
  );
}