import React from 'react';
import {
  LayoutDashboard,
  Calculator,
  TrendingUp,
  History,
  Anchor,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Activity,
} from 'lucide-react';
import type { PageTabId } from '../../lib/guidedTour';
import { useApiHealth } from '../../context/ApiHealthContext';

export interface NavItem {
  id: PageTabId;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'cockpit',
    label: 'Dashboard',
    shortLabel: 'Dashboard',
    subtitle: 'Executive Cockpit',
    icon: LayoutDashboard,
  },
  {
    id: 'optimizer',
    label: 'Charter Planner',
    shortLabel: 'Planner',
    subtitle: 'Voyage Optimizer',
    icon: Calculator,
  },
  {
    id: 'historical',
    label: 'Historical BDI & Disruptions',
    shortLabel: 'Disruptions',
    subtitle: 'Crisis Regimes & Trends',
    icon: History,
  },
  {
    id: 'ports',
    label: 'Port Details',
    shortLabel: 'Ports',
    subtitle: '8-Port Queue Radar',
    icon: Anchor,
  },
  {
    id: 'simulator',
    label: 'Scenario Lab',
    shortLabel: 'Scenarios',
    subtitle: 'Crisis Shock Sandbox',
    icon: Sliders,
  },
  {
    id: 'forecaster',
    label: 'Model Benchmarks',
    shortLabel: 'Benchmarks',
    subtitle: 'AI/ML Model & SHAP',
    icon: TrendingUp,
  },
];

export interface SidebarProps {
  activeTab: PageTabId | string;
  setActiveTab: (tabId: PageTabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  onToggleCollapse: _onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { apis, allHealthy, failingApis, countdown, isSyncing, refreshAll } = useApiHealth();
  const apiList = Object.values(apis);
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 lg:top-18 z-40 h-[calc(100vh-4rem)] lg:h-[calc(100vh-4.5rem)] bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col shrink-0 select-none shadow-[2px_0_8px_rgba(0,0,0,0.02)] ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Platform Sidebar Navigation"
      >


        {/* Navigation Tiles List */}
        <nav
          role="tablist"
          aria-label="Navigation Tiles"
          className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 id-sidebar-nav"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                id={`sidebar-tab-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl transition-all duration-200 cursor-pointer group text-left relative ${
                  isCollapsed
                    ? 'justify-center p-3'
                    : 'justify-between px-3.5 py-2.5'
                } ${
                  /* Active tile is prominently covered in vibrant ocean BLUE */
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-ocean-600 dark:from-sky-500 dark:to-ocean-600 text-white font-bold shadow-md shadow-sky-600/30 border border-sky-400/40 ring-1 ring-sky-300/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-white hover:bg-sky-50/70 dark:hover:bg-slate-800/80 border border-transparent hover:border-sky-200/50 dark:hover:border-slate-700/60'
                }`}
              >
                {/* Left: Icon & Label */}
                <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white shadow-xs scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-sky-100 dark:group-hover:bg-sky-950/80 group-hover:text-sky-600 dark:group-hover:text-sky-300 group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {!isCollapsed && (
                    <div className="truncate">
                      <div
                        className={`text-xs font-bold tracking-tight truncate leading-tight ${
                          isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200 group-hover:text-sky-700 dark:group-hover:text-sky-300'
                        }`}
                      >
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate leading-tight mt-0.5 ${
                          isActive ? 'text-sky-100/90' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Badge (when expanded) */}
                {!isCollapsed && item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide uppercase shrink-0 ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300/60 dark:border-sky-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-slate-700">
                    <div>{item.label}</div>
                    <div className="text-[9px] text-sky-300 font-normal">{item.subtitle}</div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Operational Status Card: Live 30-Second API Health Sentinel */}
        {!isCollapsed ? (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
            <div
              className={`p-3 rounded-2xl border transition-all ${
                allHealthy
                  ? 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 shadow-xs'
                  : 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-sm'
              }`}
            >
              {/* Header: Status title + Countdown loop */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5">
                  {allHealthy ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" />
                  )}
                  <span
                    className={`text-[11px] font-bold ${
                      allHealthy
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {allHealthy
                      ? 'All 5 APIs Healthy'
                      : `${failingApis.length} API${failingApis.length > 1 ? 's' : ''} Failing`}
                  </span>
                </div>

                {/* 30s Countdown timer pill + Manual refresh */}
                <button
                  type="button"
                  onClick={() => refreshAll()}
                  disabled={isSyncing}
                  className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer"
                  title="30-second automated sync timer. Click to sync now."
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{countdown}s</span>
                </button>
              </div>

              {/* List of 5 Monitored APIs with green checkmarks or red X */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/50">
                {apiList.map((api) => {
                  const isOk = api.status === 'healthy';
                  return (
                    <div
                      key={api.id}
                      className="flex items-center justify-between text-[10px] font-mono"
                      title={`${api.name}: ${
                        isOk ? `Operational (${api.latencyMs}ms)` : api.errorMessage || 'Failing'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isOk ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
                            <X className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400 stroke-[3]" />
                          </div>
                        )}
                        <span
                          className={`truncate ${
                            isOk
                              ? 'text-slate-600 dark:text-slate-300'
                              : 'text-rose-700 dark:text-rose-300 font-bold'
                          }`}
                        >
                          {api.shortName}
                        </span>
                      </div>

                      <span
                        className={`shrink-0 ml-1.5 ${
                          isOk
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-rose-600 dark:text-rose-400 font-bold'
                        }`}
                      >
                        {isOk ? `${api.latencyMs}ms` : 'FAIL'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Warning note if any API failing */}
              {!allHealthy && (
                <div className="mt-2 pt-1.5 border-t border-rose-200 dark:border-rose-800/60 text-[9px] text-rose-700 dark:text-rose-300 font-sans leading-tight">
                  ⚠️ Affected views using cached data from last successful sync.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed Mini Status Indicator */
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                allHealthy
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 animate-pulse'
              }`}
              onClick={() => refreshAll()}
              title="Live 30-Second API Health Sentinel"
            >
              {allHealthy ? (
                <Activity className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {/* Tooltip on hover */}
              <div className="absolute left-full ml-2.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-[11px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-slate-700">
                <div className="font-bold flex items-center gap-1.5 font-sans mb-1">
                  <span>API Health: {allHealthy ? '5/5 Online' : `${failingApis.length} Failing`}</span>
                </div>
                <div className="text-[10px] text-sky-300">Sync cycle: {countdown}s remaining</div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
