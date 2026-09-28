import React from 'react';
import { 
  Ship, 
  TrendingUp, 
  Lock, 
  Anchor, 
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ShipLinkLogo } from '../layout/ShipLinkLogo';
import type { LatestBDI } from '../../lib/types';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';
import { InteractiveHoverButton } from '@/registry/magicui/interactive-hover-button';
import { ShinyButton } from '@/registry/magicui/shiny-button';
import { KineticText } from '@/registry/magicui/kinetic-text';

interface LandingHeroPageProps {
  latestBDI: LatestBDI | null;
}

export const LandingHeroPage: React.FC<LandingHeroPageProps> = ({ latestBDI }) => {
  const { openAuthModal } = useAuth();

  const currentBdiValue = latestBDI?.current_bdi ?? 3370;
  const bdiChange = latestBDI?.change_24h ?? 34;
  const bdiChangePct = latestBDI?.change_pct ?? 1.02;

  return (
    <div className="h-screen max-h-screen w-full bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 relative overflow-hidden flex flex-col justify-between selection:bg-sky-100 selection:text-sky-900 font-sans transition-colors duration-300">
      {/* ------------------------------------------------------------- */}
      {/* 1. ANIMATED MARITIME SHIP & OCEAN BACKGROUND                  */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Ambient Radial Meshes */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-sky-200/40 dark:bg-sky-600/10 blur-[100px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-cyan-100/50 dark:bg-cyan-600/10 blur-[130px]" />
        <div className="absolute -bottom-20 left-1/3 w-[600px] h-96 rounded-full bg-emerald-100/40 dark:bg-emerald-600/10 blur-[120px]" />

        {/* Ambient Nautical Subtle Dot Grid */}
        <div 
          className="absolute inset-0 opacity-[0.035]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0284c7 1px, transparent 0)`,
            backgroundSize: '36px 36px'
          }}
        />

        {/* Dynamic Ocean Wave Vectors with Bobbing Cargo Bulker */}
        <div className="absolute bottom-0 left-0 right-0 h-44 overflow-hidden opacity-70">
          {/* Back Wave */}
          <svg className="absolute bottom-0 left-0 w-[200%] h-24 animate-wave-flow text-sky-200/40" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,40 C150,90 350,10 500,50 C650,90 850,20 1000,60 C1150,90 1350,20 1500,50 L1500,120 L0,120 Z" fill="currentColor" />
          </svg>
          
          {/* Mid Wave with Animated Freight Ship */}
          <div className="absolute bottom-6 right-24 sm:right-40 animate-waterline-bob">
            {/* Capesize Bulker Silhouette */}
            <svg width="280" height="90" viewBox="0 0 280 90" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Water displacement trail */}
              <path d="M10 75 C40 73 80 82 140 77 C200 72 240 80 275 75" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="5 4" opacity="0.4" />
              {/* Vessel Hull */}
              <path d="M20 54 L46 76 L240 76 L264 54 L256 42 L40 42 Z" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
              {/* Antifouling Red Keel */}
              <path d="M34 66 L46 76 L240 76 L254 66 Z" fill="#e11d48" opacity="0.9" />
              {/* Cargo Holds */}
              <rect x="56" y="38" width="30" height="6" rx="1.5" fill="#334155" />
              <rect x="94" y="38" width="30" height="6" rx="1.5" fill="#334155" />
              <rect x="132" y="38" width="30" height="6" rx="1.5" fill="#334155" />
              <rect x="170" y="38" width="30" height="6" rx="1.5" fill="#334155" />
              {/* Superstructure / Bridge */}
              <rect x="210" y="20" width="32" height="24" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              <rect x="214" y="24" width="24" height="5" rx="0.5" fill="#0284c7" opacity="0.8" />
              {/* Radar Mast & Funnel */}
              <rect x="222" y="10" width="8" height="10" rx="1" fill="#0369a1" />
              <line x1="226" y1="10" x2="226" y2="4" stroke="#0f172a" strokeWidth="1.5" />
              {/* Radar pulse light */}
              <circle cx="226" cy="4" r="2.5" fill="#10b981" className="animate-ping" />
            </svg>
          </div>
          
          {/* Fore Wave */}
          <svg className="absolute bottom-0 left-0 w-[200%] h-16 animate-wave-flow-slow text-sky-300/30" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0,30 C200,70 400,10 600,45 C800,75 1000,15 1200,40 L1200,100 L0,100 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. TOP BRANDING & NAVIGATION BAR                              */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-20 px-6 sm:px-10 py-4 flex items-center justify-between border-b border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs transition-colors duration-300">
        <div className="flex items-center gap-3">
          <ShipLinkLogo size="lg" showSubtitle={true} />
        </div>

        {/* Theme Toggler + Auth Action Buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Magic UI AnimatedThemeToggler */}
          <AnimatedThemeToggler />

          <div className="flex items-center gap-2.5">
            {/* Magic UI ShinyButton for Login */}
            <ShinyButton
              onClick={() => openAuthModal('login')}
              className="px-4 py-2 text-xs font-bold"
            >
              Sign In
            </ShinyButton>

            {/* Magic UI InteractiveHoverButton for Get Started */}
            <InteractiveHoverButton
              onClick={() => openAuthModal('register')}
              className="py-2 px-5 text-xs font-bold"
            >
              Get Started
            </InteractiveHoverButton>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. CENTER HERO GRID (NO-SCROLL SINGLE SCREEN)                 */}
      {/* ------------------------------------------------------------- */}
      <main className="relative z-10 flex-1 px-6 sm:px-10 lg:px-12 flex items-center">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-2">
          
          {/* Left Column (Brand, Pitch & 3 Core Highlights) - 7 cols */}
          <div className="lg:col-span-7 space-y-4">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 border border-sky-200/90 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Next-Gen Autonomous Maritime Freight Suite</span>
            </div>

            {/* Main Headline with Magic UI KineticText in One Single Comprehensive Line */}
            <div className="space-y-2">
              <KineticText
                text="AI-Powered Freight Forecasting & Autonomous Vessel Chartering."
                className="flex-nowrap whitespace-nowrap text-base sm:text-lg lg:text-[1.32rem] xl:text-[1.46rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight"
              />
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
                Physics-informed machine learning synthesizing global Baltic Dry Index momentum with naval hydrodynamics to protect Indian steel & power PSUs from multi-crore spot freight spikes.
              </p>
            </div>

            {/* The 3 Core Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Highlight 1: Simple AI/ML explanation */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md transition-all group">
                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-2 border border-sky-200/60 dark:border-sky-800 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Explainable AI & ML</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Trained on AI & Machine Learning models to accurately predict freight rates and explain market trends.
                </p>
              </div>

              {/* Highlight 2 */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-all group">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 border border-emerald-200/60 dark:border-emerald-800 group-hover:scale-105 transition-transform">
                  <Anchor className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Naval Hydrodynamics</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Real-time Under-Keel Clearance (UKC) against East Coast port tidal limits.
                </p>
              </div>

              {/* Highlight 3 */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md transition-all group">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2 border border-amber-200/60 dark:border-amber-800 group-hover:scale-105 transition-transform">
                  <Ship className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Coastal Port Radar</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  8-port queue tracker mitigating ₹45+ Cr in annual demurrage idling fees.
                </p>
              </div>
            </div>

            {/* CTAs with Magic UI InteractiveHoverButton */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <InteractiveHoverButton
                onClick={() => openAuthModal('login')}
                className="py-3 px-6 text-xs sm:text-sm shadow-md"
              >
                Launch Operational Suite
              </InteractiveHoverButton>

              <InteractiveHoverButton
                onClick={() => openAuthModal('register')}
                className="py-3 px-6 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              >
                Register Free
              </InteractiveHoverButton>
            </div>
          </div>

          {/* Right Column (The 2 Core BDI Boxes) - 5 cols */}
          <div className="lg:col-span-5 space-y-4">
            {/* -------------------------------------------------- */}
            {/* BOX 1: CURRENT BALTIC DRY INDEX (LIVE)              */}
            {/* -------------------------------------------------- */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-colors duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                    Current Baltic Dry Index (BDI)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-bold">
                  PHYSICAL SPOT
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                    {currentBdiValue.toLocaleString()}{' '}
                    <span className="text-lg font-normal text-slate-400">pts</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      +{bdiChange} pts (+{bdiChangePct}%)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">24h Baltic Exchange</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-mono font-medium">Spot TCE Hire</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">₹16.5 L/day</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">~$19,800/d</div>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------- */}
            {/* BOX 2: PREDICTED 14-DAY BDI (LOCKED / GATED)        */}
            {/* -------------------------------------------------- */}
            <div className="relative p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group transition-colors duration-300">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                    14-Day Predicted BDI Index
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  RESTRICTED
                </span>
              </div>

              {/* Blurred Silhouette Content Behind */}
              <div className="filter blur-md select-none opacity-30 transition-all pointer-events-none">
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-sky-700 dark:text-sky-400">
                  3,485 <span className="text-lg font-normal text-slate-400">pts</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    +115 pts (+3.4%)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">P10–P90 Confidence Envelope</span>
                </div>
              </div>

              {/* Locked Glassmorphism Overlay */}
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl text-center transition-colors duration-300">
                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-2 shadow-xs">
                  <Lock className="w-5 h-5 text-sky-700 dark:text-sky-300" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Log In to View 14-Day ML Forecast
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 max-w-xs mb-3 leading-tight font-medium">
                  Proprietary LightGBM forward curve, P10–P90 risk intervals, and fixture hedge recommendations.
                </p>
                
                {/* Magic UI ShinyButton for Unlock with clearly visible text */}
                <ShinyButton
                  onClick={() => openAuthModal('login')}
                  className="px-6 py-2.5 shadow-md shadow-sky-600/30"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>Sign In to Unlock Forecast</span>
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                </ShinyButton>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 4. BOTTOM COMPACT MARITIME FOOTER                             */}
      {/* ------------------------------------------------------------- */}
      <footer className="relative z-10 px-6 sm:px-10 py-3.5 border-t border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2 shadow-xs transition-colors duration-300">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">ShipLink Maritime Suite</span>
          <span>·</span>
          <span>Smart India Hackathon 2026</span>
          <span>·</span>
          <span>Ministry of Ports, Shipping & Waterways</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-slate-400 dark:text-slate-500">
          <span>Autonomous Coastal Freight Intelligence</span>
        </div>
      </footer>
    </div>
  );
};
