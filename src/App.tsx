import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import type { ViewType, AIConfig } from './types';
import { getConfig } from './services/storageService';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PlanificadorView } from './components/PlanificadorView';
import { RecursosView } from './components/RecursosView';
import { EvaluacionesView } from './components/EvaluacionesView';
import { CurriculumCloudView } from './components/CurriculumCloudView';
import { ConfigView } from './components/ConfigView';
import { ColaboracionView } from './components/ColaboracionView';
import { DriveView } from './components/DriveView';
import { DocenteView } from './components/DocenteView';
import AdminView from './components/AdminView';
import LoginView from './components/LoginView';
import { AgenteView } from './components/AgenteView';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

export default function App() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('inicio');
  const [config, setConfig] = useState<AIConfig>(getConfig());
  const handleNavigate = useCallback((view: string) => {
    setActiveView(view as ViewType);
  }, []);

  const handleConfigChange = useCallback((cfg: AIConfig) => {
    setConfig(cfg);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'inicio':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'planificador':
        return <PlanificadorView onNavigate={handleNavigate} />;
      case 'recursos':
        return <RecursosView onNavigate={handleNavigate} />;
      case 'evaluaciones':
        return <EvaluacionesView onNavigate={handleNavigate} />;
      case 'banco':
        return <CurriculumCloudView />;
      case 'colaboracion':
        return <ColaboracionView />;
      case 'drive':
        return <DriveView />;
      case 'docente':
        return <DocenteView />;
      case 'agente':
        return <AgenteView />;
      case 'admin':
        return <AdminView />;
      case 'config':
        return <ConfigView onConfigChange={handleConfigChange} />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} onNavigate={handleNavigate} config={config} user={user} />
      <main className="main-content">
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
      </main>
    </div>
  );
}
