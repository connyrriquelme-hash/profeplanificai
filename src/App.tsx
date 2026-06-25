import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import type { ViewType } from './types';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { WorkspaceView } from './components/WorkspaceView';
import { AIAssistant } from './components/AIAssistant';
import { CurriculumCloudView } from './components/CurriculumCloudView';
import { BibliotecaView } from './components/BibliotecaView';
import { BancoRecursosView } from './components/BancoRecursosView';
import AdminView from './components/AdminView';
import LoginView from './components/LoginView';
import { ErrorBoundary } from './components/ErrorBoundary';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

export default function App() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const handleViewChange = useCallback((view: string) => {
    setActiveView(view as ViewType);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleViewChange} />;
      case 'workspace':
        return <WorkspaceView />;
      case 'banco':
        return <CurriculumCloudView />;
      case 'agente':
        return <BibliotecaView />;
      case 'banco-recursos':
        return <BancoRecursosView />;
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} />
      <main className="flex-1 min-w-0" style={{ display: 'flex', gap: 16, padding: '24px 32px', maxWidth: 1400 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </div>
        <aside style={{ width: 300, flexShrink: 0, display: activeView === 'workspace' ? 'block' : 'none' }}>
          <AIAssistant />
        </aside>
      </main>
    </div>
  );
}