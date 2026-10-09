import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { HowPage } from './pages/HowPage';
import { AgentsPage } from './pages/AgentsPage';
import { TrustPage } from './pages/TrustPage';
import { IndustriesPage } from './pages/IndustriesPage';
import { WorkspacePage } from './pages/WorkspacePage';

// Helper to scroll to top on hash route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how" element={<HowPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/trust" element={<TrustPage />} />
        <Route path="/industries" element={<IndustriesPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        {/* Redirect /contact directly to workspace studio */}
        <Route path="/contact" element={<WorkspacePage />} />
        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
