import React, { useState, useEffect } from 'react';
import ChetakWarRoom from './views/ChetakWarRoom';
import ChetakLandingPage from './views/ChetakLandingPage';

export default function App() {
  const [selectedScenario, setSelectedScenario] = useState<string>('SCENARIO_DB_COLLAPSE');
  const [view, setView] = useState<'landing' | 'warroom'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash.startsWith('#war-room') || window.location.search.includes('view=warroom')) {
        return 'warroom';
      }
    }
    return 'landing';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.startsWith('#war-room')) {
        setView('warroom');
      } else if (!window.location.hash) {
        setView('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToWarRoom = (scenarioId?: string) => {
    if (scenarioId) {
      setSelectedScenario(scenarioId);
    }
    window.location.hash = '#war-room';
    setView('warroom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToLanding = () => {
    history.pushState(null, '', window.location.pathname);
    setView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full min-h-screen bg-[#07090e] text-slate-100 font-sans">
      {view === 'landing' ? (
        <ChetakLandingPage onEnterWarRoom={navigateToWarRoom} />
      ) : (
        <ChetakWarRoom onBackToLanding={navigateToLanding} initialScenarioId={selectedScenario} />
      )}
    </div>
  );
}