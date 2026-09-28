import { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { CharterPlannerView } from './components/dashboard/CharterPlannerView';
import { MarketIntelligenceView } from './components/dashboard/MarketIntelligenceView';
import { HistoricalDisruptionView } from './components/dashboard/HistoricalDisruptionView';
import { IndiaTranslationLayer } from './components/dashboard/IndiaTranslationLayer';
import { ScenarioLabView } from './components/dashboard/ScenarioLabView';
import { LandingHeroPage } from './components/landing/LandingHeroPage';
import { AuthModal } from './components/auth/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ApiHealthProvider, useApiHealth } from './context/ApiHealthContext';
import { ShipLinkLogo } from './components/layout/ShipLinkLogo';

import { startGuidedTour, type PageTabId } from './lib/guidedTour';
import { fetchLatestBDI } from './lib/api';
import type { LatestBDI } from './lib/types';

function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<PageTabId>('cockpit');
  const [loading, setLoading] = useState<boolean>(true);
  const [latestBDI, setLatestBDI] = useState<LatestBDI | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Sidebar collapsible state with persistent local preference
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('shiplink_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Fetch live BDI telemetry on mount & 30-second automated interval
  useEffect(() => {
    let mounted = true;

    const syncData = () => {
      fetchLatestBDI()
        .then((val) => {
          if (mounted) {
            setLatestBDI(val);
            setLastSynced(new Date());
          }
        })
        .catch((err) => console.error('Data sync error:', err))
        .finally(() => {
          if (mounted) setLoading(false);
        });
    };

    syncData();

    // Automatic background polling every 30 seconds
    const interval = setInterval(syncData, 30 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const { refreshAll: refreshApiHealth } = useApiHealth();

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const [val] = await Promise.allSettled([
        fetchLatestBDI(),
        refreshApiHealth(),
      ]);
      if (val.status === 'fulfilled') {
        setLatestBDI(val.value);
      }
      setLastSynced(new Date());
    } catch (err) {
      console.error('Data sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTour = () => {
    startGuidedTour({
      activeTab: activeTab || 'cockpit',
      onNavigateTab: (tab) => setActiveTab(tab),
    });
  };

  const handleToggleSidebar = () => {
    // If mobile viewport, toggle mobile drawer; otherwise toggle collapse
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      const next = !isSidebarCollapsed;
      setIsSidebarCollapsed(next);
      try {
        localStorage.setItem('shiplink_sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
    }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="h-screen w-full bg-[#f8fafc] dark:bg-slate-950 flex flex-col items-center justify-center text-slate-800 dark:text-slate-100 transition-colors">
        <ShipLinkLogo size="md" darkTheme={false} className="mb-4 animate-bounce" />
        <div className="flex items-center gap-2 text-xs font-mono text-sky-700 dark:text-sky-400">
          <span className="w-2 h-2 rounded-full bg-sky-600 animate-ping" />
          <span>Initializing Secure Maritime Session...</span>
        </div>
      </div>
    );
  }

  // Gated Hero Page: Shown when unauthenticated
  if (!isAuthenticated) {
    return (
      <>
        <LandingHeroPage latestBDI={latestBDI} />
        <AuthModal />
      </>
    );
  }

  // Full Operational Platform: Shown once authenticated
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900 dark:selection:bg-sky-950 dark:selection:text-sky-200 overflow-x-hidden w-full max-w-full transition-colors duration-300">
      {/* Sleek Top Navigation Header */}
      <Header
        latestBDI={latestBDI}
        loading={loading}
        onRefresh={handleRefresh}
        onStartTour={handleStartTour}
        lastSynced={lastSynced}
        onToggleSidebar={handleToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Layout: Left Collapsible Sidebar Navigation + Main Canvas */}
      <div className="flex-1 flex w-full relative">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => {
            const next = !isSidebarCollapsed;
            setIsSidebarCollapsed(next);
            try {
              localStorage.setItem('shiplink_sidebar_collapsed', String(next));
            } catch {
              // ignore storage errors
            }
          }}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Canvas Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <main
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`sidebar-tab-${activeTab}`}
            className="flex-1 max-w-[1720px] mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 space-y-6 id-main-canvas animate-fadeIn overflow-x-hidden"
          >
            {activeTab === 'cockpit' && (
              <DashboardView
                onNavigate={(tab) => setActiveTab(tab as PageTabId)}
                latestBDI={latestBDI}
              />
            )}
            {activeTab === 'optimizer' && <CharterPlannerView />}
            {activeTab === 'forecaster' && (
              <MarketIntelligenceView
                onNavigate={(tab) => setActiveTab(tab as PageTabId)}
                latestBDI={latestBDI}
              />
            )}
            {activeTab === 'historical' && <HistoricalDisruptionView />}
            {activeTab === 'ports' && (
              <div className="space-y-6">
                <IndiaTranslationLayer currentBDI={latestBDI?.current_bdi} />
              </div>
            )}
            {activeTab === 'simulator' && <ScenarioLabView />}
          </main>

          {/* Clean Modern Footer */}
          <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 mt-auto transition-colors">
            <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-200">ShipLink</span>
                <span>·</span>
                <span>Smart India Hackathon 2026</span>
                <span>·</span>
                <span>Ministry of Ports, Shipping & Waterways</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>Model: LightGBM + ARIMA Multi-Horizon</span>
                <span>·</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">84.6% Dir. Accuracy</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Auth Modal for mode switching or re-auth */}
      <AuthModal />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ApiHealthProvider>
        <AppContent />
      </ApiHealthProvider>
    </AuthProvider>
  );
}

export default App;
