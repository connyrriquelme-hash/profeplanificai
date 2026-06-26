import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import type { ViewType } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { AppShell } from './components/ui/AppShell';
import { DashboardView } from './components/DashboardView';
import { WorkspaceView } from './components/WorkspaceView';
import { CurriculumCloudView } from './components/CurriculumCloudView';
import { LibraryView } from './components/LibraryView';
import { BancoRecursosView } from './components/BancoRecursosView';
import { EvaluacionesView } from './components/EvaluacionesView';
import AdminView from './components/AdminView';
import LoginView from './components/LoginView';
import { ErrorBoundary } from './components/ErrorBoundary';

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
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [viewState, setViewState] = useState<ViewState | null>(null);

  const handleViewChange = useCallback((view: string, state?: ViewState) => {
    setActiveView(view as ViewType);
    setViewState(state ?? null);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleViewChange} />;
      case 'workspace':
        return <WorkspaceView onNavigate={handleViewChange} />;
      case 'banco':
        return <CurriculumCloudView />;
      case 'agente':
      case 'biblioteca-creativa':
        return <LibraryView onNavigate={handleViewChange} />;
      case 'evaluaciones':
        return <EvaluacionesView onNavigate={handleViewChange} />;
      case 'banco-recursos':
        return <BancoRecursosView initialTab={viewState?.tab as any} onNavigate={handleViewChange} />;
      case 'admin':
        return <AdminView />;
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
      <AppContent />
    </ProjectProvider>
  );
}
