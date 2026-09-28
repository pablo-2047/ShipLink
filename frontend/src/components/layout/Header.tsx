import React from 'react';
import {
  Sparkles,
  RefreshCw,
  User as UserIcon,
  LogOut,
  PanelLeft,
} from 'lucide-react';
import { ShipLinkLogo } from './ShipLinkLogo';
import { useAuth } from '../../context/AuthContext';
import type { LatestBDI } from '../../lib/types';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';
import { InteractiveHoverButton } from '@/registry/magicui/interactive-hover-button';

export interface HeaderProps {
  latestBDI: LatestBDI | null;
  loading: boolean;
  onRefresh: () => void;
  onStartTour?: () => void;
  lastSynced?: Date | null;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  latestBDI,
  loading,
  onRefresh,
  onStartTour,
  lastSynced,
  onToggleSidebar,
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300 shadow-[0_2px_4px_0_rgba(0,0,0,0.03)] w-full">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-16 lg:h-18 gap-2 sm:gap-4">
          {/* Left: Sidebar Toggle + Creative Bespoke Maritime Logo */}
          <div className="flex items-center gap-2 shrink-0">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-sky-200 dark:hover:border-slate-700"
                title="Toggle Sidebar (Expand / Collapse)"
                aria-label="Toggle navigation sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <ShipLinkLogo size="sm" showSubtitle={false} className="cursor-pointer" />
          </div>

          {/* Right: Live Telemetry & Control Actions with Magic UI Hover Animations */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Live Baltic Dry Index (BDI) Ticker */}
            <div
              className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs id-bdi-ticker shadow-xs"
              title="Baltic Dry Index: Global benchmark for raw dry bulk ocean shipping rates"
            >
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                BDI
              </span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                {latestBDI ? latestBDI.current_bdi.toLocaleString() : '1,838.8'}
              </span>
              {latestBDI ? (
                <span
                  title={`24-Hour BDI Market Delta: ${
                    latestBDI.change_24h >= 0 ? '+' : ''
                  }${latestBDI.change_24h} pts (${latestBDI.change_pct.toFixed(1)}%) compared to the previous trading day close on the Baltic Exchange.`}
                  className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded cursor-help transition-all ${
                    latestBDI.change_24h >= 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800'
                  }`}
                >
                  {latestBDI.change_24h >= 0 ? '+' : ''}
                  {latestBDI.change_pct.toFixed(1)}%
                </span>
              ) : (
                <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                  Live
                </span>
              )}
            </div>

            {/* AIS Live Indicator (Vessel Transponder Radar) */}
            <div
              className="hidden xl:flex items-center gap-1 bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs cursor-default"
              title="Automatic Identification System: Real-time satellite & coastal transponder tracking of commercial bulk carriers"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>AIS Live</span>
            </div>

            {/* Guided System Tour Button with Interactive Hover Animation */}
            {onStartTour && (
              <InteractiveHoverButton
                onClick={onStartTour}
                icon={<Sparkles className="w-3.5 h-3.5" />}
                text="Tour"
                className="py-1 px-3 text-xs id-tour-btn font-bold"
                title="Launch Interactive Platform Guide"
              />
            )}

            {/* Live Data Sync Button with Interactive Hover Animation */}
            <InteractiveHoverButton
              onClick={onRefresh}
              disabled={loading}
              icon={
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                />
              }
              text="Sync"
              className="py-1 px-3 text-xs font-bold"
              title={
                lastSynced
                  ? `Live auto-sync active (30s) · Last updated: ${lastSynced.toLocaleTimeString()}`
                  : 'Manual Sync & Live Auto-Refresh'
              }
            />

            {/* Magic UI AnimatedThemeToggler */}
            <div className="hover:scale-105 transition-transform duration-200" title="Toggle Theme (Light / Dark)">
              <AnimatedThemeToggler />
            </div>

            {/* User Profile & Sign Out with Hover Animation */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-700 shrink-0">
                {/* Full name badge on lg+ screens */}
                <div
                  className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[130px]"
                  title={`Authenticated as: ${user.email}`}
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="truncate">{user.displayName || user.email?.split('@')[0]}</span>
                </div>
                {/* Compact icon badge on smaller viewports */}
                <div
                  className="flex lg:hidden items-center justify-center w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold shrink-0"
                  title={`Authenticated as: ${user.email}`}
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                </div>

                {/* Logout Button with interactive hover animation */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="group relative overflow-hidden px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs flex items-center gap-1 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/90 dark:border-rose-800/80 rounded-xl transition-all duration-300 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:shadow-md hover:shadow-rose-600/20 active:scale-95 cursor-pointer font-bold shrink-0 select-none"
                  title="Sign out of ShipLink (Leave session)"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-0.5 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
