import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { CurriculumProvider } from './contexts/CurriculumContext';
import type { ViewType } from './types';
import { isAdminUser, ADMIN_ONLY_VIEW_IDS } from './utils/roles';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { AppShell } from './components/ui/AppShell';
import { MobileBottomNav } from './components/ui/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { WorkspaceView } from './components/WorkspaceView';
import { CurriculumCloudView } from './components/CurriculumCloudView';
import { LibraryView } from './components/LibraryView';
import { BancoRecursosView } from './components/BancoRecursosView';
import { EvaluacionesView } from './components/EvaluacionesView';
import { SharedPanelView } from './components/SharedPanelView';
import { SharedDocumentPublicView } from './components/SharedDocumentPublicView';
import { DocumentGeneratorFlow } from './components/DocumentGeneratorFlow';
import { UnidadesDidacticasView } from './components/UnidadesDidacticasView';
import { FlujoDocenteView } from './components/FlujoDocenteView';
import { MisClases } from './components/MisClases';
import { ReportesView } from './components/ReportesView';
import AdminView from './components/AdminView';
import AdminPanelView from './components/AdminPanelView';
import LoginView from './components/LoginView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DuaGuideGenerator } from './pages/DuaGuideGenerator';
import { ProjectCopilot } from './components/ProjectCopilot';
import { ActiveLessonProvider } from './contexts/ActiveLessonContext';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

interface ViewState {
  tab?: string;
}

function AppContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const initialView = (() => {
    const path = window.location.pathname.replace(/\/+$/, '');
    if (path === '/mis-clases' || path === '/generador-rapido') return 'mis-clases';
    if (path === '/dua-guide') return 'dua-guide';
    if (path === '/admin-panel') return 'admin-panel';
    if (path === '/admin') return 'admin';
    return 'dashboard';
  })() as ViewType;
  const [activeView, setActiveView] = useState<ViewType>(initialView);
  const [viewState, setViewState] = useState<ViewState | null>(null);
  const sharedToken = new URLSearchParams(window.location.search).get('shared');

  if (sharedToken) {
    return <SharedDocumentPublicView token={sharedToken} />;
  }

  const handleViewChange = useCallback((view: string, state?: ViewState) => {
    const nextView = view === 'generador' || view === 'generador-rapido' ? 'mis-clases' : view;
    setActiveView(nextView as ViewType);
    setViewState(state ?? null);
    if (nextView === 'mis-clases' && window.location.pathname !== '/mis-clases') {
      window.history.pushState(null, '', '/mis-clases');
    } else if (nextView === 'dua-guide' && window.location.pathname !== '/dua-guide') {
      window.history.pushState(null, '', '/dua-guide');
    } else if (nextView === 'admin-panel' && window.location.pathname !== '/admin-panel') {
      window.history.pushState(null, '', '/admin-panel');
    } else if (nextView === 'admin' && window.location.pathname !== '/admin') {
      window.history.pushState(null, '', '/admin');
    }
  }, []);

  const isAdmin = isAdminUser(user);
  const blockedView = ADMIN_ONLY_VIEW_IDS.has(activeView) && !isAdmin;

  const renderView = () => {
    if (blockedView) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Acceso restringido</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              No tienes acceso a esta sección. Esta herramienta está disponible solo para administradores.
            </p>
            <button
              onClick={() => handleViewChange('dashboard')}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleViewChange} />;
      case 'workspace':
        return <WorkspaceView onNavigate={handleViewChange} />;
      case 'mis-clases':
        return <MisClases />;
      case 'generador':
        return <MisClases />;
      case 'banco':
        return <CurriculumCloudView />;
      case 'agente':
      case 'biblioteca-creativa':
        return <BancoRecursosView onNavigate={handleViewChange} />;
      case 'evaluaciones':
        return <EvaluacionesView onNavigate={handleViewChange} />;
      case 'banco-recursos':
        return <BancoRecursosView initialTab={viewState?.tab as any} onNavigate={handleViewChange} />;
      case 'panel-compartido':
        return <SharedPanelView onNavigate={handleViewChange} />;
      case 'unidades-didacticas':
        return <UnidadesDidacticasView />;
      case 'flujo-docente':
        return <FlujoDocenteView />;
      case 'reportes':
        return <ReportesView />;
      case 'dua-guide':
        return <DuaGuideGenerator />;
      case 'project-copilot':
        return <ProjectCopilot onNavigate={handleViewChange} />;
      case 'admin':
        return <AdminView onNavigate={handleViewChange} />;
      case 'admin-panel':
        return <AdminPanelView />;
      default:
        return <DashboardView onNavigate={handleViewChange} />;
    }
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ErrorBoundary>
    );
  }

  if (!isAuthenticated) {
    return <ErrorBoundary><LoginView /></ErrorBoundary>;
  }

  return (
    <AppShell
      sidebar={<Sidebar activeView={activeView} onViewChange={handleViewChange} />}
      topbar={<Topbar onNavigate={handleViewChange} />}
      bottomNav={<MobileBottomNav activeView={activeView} onViewChange={handleViewChange} />}
    >
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView + (viewState?.tab || '')}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </ErrorBoundary>
    </AppShell>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <CurriculumProvider>
        <ActiveLessonProvider>
          <AppContent />
        </ActiveLessonProvider>
      </CurriculumProvider>
    </ProjectProvider>
  );
}
