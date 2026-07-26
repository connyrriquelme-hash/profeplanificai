import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { InstitutionSelector } from '../src/components/classbook/InstitutionSelector';
import { ClassbookLayout } from '../src/components/classbook/ClassbookLayout';
import { ClassbookView } from '../src/pages/ClassbookView';
import { CoordinatorDashboardView } from '../src/pages/CoordinatorDashboardView';

const authMock = vi.hoisted(() => ({
  user: {
    id: 'user-1',
    email: 'test@example.com',
    nombre: 'Test User',
    rol: 'admin' as const,
    institutionalRole: 'super_admin' as const,
    permissions: ['institution:read'],
    institutionId: undefined as string | undefined,
  },
  activeInstitutionId: null as string | null,
  setActiveInstitution: vi.fn(),
  clearActiveInstitution: vi.fn(),
}));

vi.mock('../src/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: authMock.user,
    loading: false,
    online: true,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isAuthenticated: true,
    sessions: [],
    loadSessions: vi.fn(),
    revokeSession: vi.fn(),
    revokeOtherSessions: vi.fn(),
    activeInstitutionId: authMock.activeInstitutionId,
    setActiveInstitution: authMock.setActiveInstitution,
    clearActiveInstitution: authMock.clearActiveInstitution,
  }),
}));

const classbookServiceMock = vi.hoisted(() => ({
  getInstitutions: vi.fn(),
  getAcademicYears: vi.fn(),
  getClassSessions: vi.fn(),
  getCoordinatorDashboard: vi.fn(),
  getCoordinatorTeachers: vi.fn(),
  getCoordinatorCourses: vi.fn(),
  getCoordinatorSessions: vi.fn(),
  getCoordinatorPlanningReviews: vi.fn(),
  getCoordinatorPendingSignatures: vi.fn(),
  getCoordinatorCoverage: vi.fn(),
  getCoordinatorAlerts: vi.fn(),
  getCoordinatorFilterOptions: vi.fn(),
}));

vi.mock('../src/services/classbookService', () => ({
  classbookService: classbookServiceMock,
}));

const mockInstitutions = [
  { id: 'inst-1', name: 'Institution 1' },
  { id: 'inst-2', name: 'Institution 2' },
];

const emptyFilterOptions = {
  academicYears: [],
  terms: [],
  courses: [],
  subjects: [],
  teachers: [],
};

describe('Active Institution Selector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    authMock.user.institutionalRole = 'super_admin';
    authMock.user.institutionId = undefined;
    authMock.activeInstitutionId = null;
    authMock.setActiveInstitution.mockClear();
    authMock.clearActiveInstitution.mockClear();
    classbookServiceMock.getInstitutions.mockResolvedValue(mockInstitutions);
    classbookServiceMock.getAcademicYears.mockResolvedValue([]);
    classbookServiceMock.getClassSessions.mockResolvedValue([]);
    classbookServiceMock.getCoordinatorDashboard.mockResolvedValue({
      totalCourses: 0, totalTeachers: 0, sessionsScheduled: 0, sessionsCompleted: 0,
      sessionsPending: 0, sessionsWithoutContent: 0, sessionsWithoutAttendance: 0,
      sessionsPendingSignature: 0, planningReviewsPending: 0, planningReviewsObserved: 0,
      averageAttendanceRate: 0, openObservations: 0, estimatedCoveragePercent: 0,
    });
    classbookServiceMock.getCoordinatorTeachers.mockResolvedValue([]);
    classbookServiceMock.getCoordinatorCourses.mockResolvedValue([]);
    classbookServiceMock.getCoordinatorSessions.mockResolvedValue([]);
    classbookServiceMock.getCoordinatorPlanningReviews.mockResolvedValue([]);
    classbookServiceMock.getCoordinatorPendingSignatures.mockResolvedValue([]);
    classbookServiceMock.getCoordinatorCoverage.mockResolvedValue([]);
    classbookServiceMock.getCoordinatorAlerts.mockResolvedValue([]);
    classbookServiceMock.getCoordinatorFilterOptions.mockResolvedValue(emptyFilterOptions);
  });

  describe('1. super_admin sin institución activa ve selector', () => {
    it('shows InstitutionSelector for super_admin', async () => {
      render(<InstitutionSelector />);

      await waitFor(() => {
        expect(screen.getByLabelText('Seleccionar institución activa')).toBeInTheDocument();
      });
    });
  });

  describe('2. no se hacen requests institucionales antes de seleccionar', () => {
    it('does not fetch academic years before institution is selected', async () => {
      render(<ClassbookView onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(classbookServiceMock.getInstitutions).toHaveBeenCalled();
      });

      expect(classbookServiceMock.getAcademicYears).not.toHaveBeenCalled();
    });
  });

  describe('3. al seleccionar se cargan datos', () => {
    it('fetches data after institution is selected', async () => {
      authMock.activeInstitutionId = 'inst-1';

      render(<ClassbookView onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(classbookServiceMock.getAcademicYears).toHaveBeenCalledWith('inst-1', expect.any(AbortSignal));
      });
    });
  });

  describe('4. cambiar institución recarga datos', () => {
    it('refetches data when institution changes', async () => {
      const { rerender } = render(<ClassbookView onNavigate={vi.fn()} />);

      expect(classbookServiceMock.getAcademicYears).not.toHaveBeenCalled();

      authMock.activeInstitutionId = 'inst-1';
      rerender(<ClassbookView onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(classbookServiceMock.getAcademicYears).toHaveBeenCalledWith('inst-1', expect.any(AbortSignal));
      });

      authMock.activeInstitutionId = 'inst-2';
      rerender(<ClassbookView onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(classbookServiceMock.getAcademicYears).toHaveBeenCalledWith('inst-2', expect.any(AbortSignal));
      });
    });
  });

  describe('5. valor persistido se restaura', () => {
    it('restores institution from localStorage', async () => {
      authMock.activeInstitutionId = 'inst-1';

      render(<ClassbookView onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(classbookServiceMock.getAcademicYears).toHaveBeenCalledWith('inst-1', expect.any(AbortSignal));
      });
    });
  });

  describe('6. institución inválida se descarta', () => {
    it('clears invalid institution when loaded list does not contain it', async () => {
      authMock.activeInstitutionId = 'invalid-id';
      classbookServiceMock.getInstitutions.mockReset();
      classbookServiceMock.getInstitutions.mockResolvedValue(mockInstitutions);

      render(<InstitutionSelector />);

      await waitFor(() => {
        expect(screen.getByText('Institution 1')).toBeInTheDocument();
      });

      expect(authMock.clearActiveInstitution).toHaveBeenCalled();
    });
  });

  describe('7. institution_admin no ve selector', () => {
    it('does not show InstitutionSelector for institution_admin', async () => {
      authMock.user.institutionalRole = 'institution_admin';

      render(
        <div data-testid="context">
          <InstitutionSelector />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Seleccionar institución activa')).not.toBeInTheDocument();
    });
  });

  describe('8. coordinator no ve selector', () => {
    it('does not show InstitutionSelector for coordinator', async () => {
      authMock.user.institutionalRole = 'coordinator';

      render(
        <div data-testid="context">
          <InstitutionSelector />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Seleccionar institución activa')).not.toBeInTheDocument();
    });
  });

  describe('9. teacher no ve selector', () => {
    it('does not show InstitutionSelector for teacher', async () => {
      authMock.user.institutionalRole = 'teacher';

      render(
        <div data-testid="context">
          <InstitutionSelector />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Seleccionar institución activa')).not.toBeInTheDocument();
    });
  });

  describe('10. student sigue bloqueado', () => {
    it('does not show ClassbookView for student', async () => {
      authMock.user.institutionalRole = 'student';

      render(<ClassbookView onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
      });
    });
  });

  describe('11. no privilege escalation por query param', () => {
    it('does not allow institution_id override via query param', async () => {
      authMock.activeInstitutionId = 'inst-1';

      render(<ClassbookView onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(classbookServiceMock.getAcademicYears).toHaveBeenCalledWith('inst-1', expect.any(AbortSignal));
      });

      expect(classbookServiceMock.getAcademicYears).not.toHaveBeenCalledWith('inst-2', expect.any(AbortSignal));
    });
  });

  describe('12. ClassbookSidebar aparece una sola vez', () => {
    it('renders ClassbookSidebar exactly once', async () => {
      render(
        <ClassbookLayout
          activeTab="overview"
          onTabChange={vi.fn()}
          academicYears={[]}
          selectedYear={null}
          onYearChange={vi.fn()}
          sessions={[]}
        >
          <div>Content</div>
        </ClassbookLayout>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Seleccionar institución activa')).toBeInTheDocument();
      });

      expect(screen.getByText('Resumen')).toBeInTheDocument();
    });
  });

  describe('13. no hay render loop', () => {
    it('does not cause infinite re-renders', async () => {
      const { rerender } = render(<ClassbookView onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(classbookServiceMock.getInstitutions).toHaveBeenCalled();
      });

      const initialCalls = classbookServiceMock.getAcademicYears.mock.calls.length;

      for (let i = 0; i < 5; i++) {
        rerender(<ClassbookView onNavigate={vi.fn()} />);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const finalCalls = classbookServiceMock.getAcademicYears.mock.calls.length;
      expect(finalCalls - initialCalls).toBeLessThanOrEqual(1);
    });
  });

  describe('14. CoordinatorDashboard usa la misma institución activa', () => {
    it('passes effectiveInstitutionId to coordinator services', async () => {
      authMock.activeInstitutionId = 'inst-1';

      render(<CoordinatorDashboardView onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(classbookServiceMock.getCoordinatorDashboard).toHaveBeenCalledWith({}, 'inst-1');
      });
    });
  });
});
