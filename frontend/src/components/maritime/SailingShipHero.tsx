import React from 'react';
import { Ship, ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';

interface SailingShipHeroProps {
  onLaunchWizard: () => void;
  onExploreScenarios: () => void;
}

export const SailingShipHero: React.FC<SailingShipHeroProps> = ({
  onLaunchWizard,
  onExploreScenarios,
}) => {
  return (
    <div className="neo-card p-4 relative overflow-hidden flex items-center justify-between h-[120px]">
      {/* Background Animated Sailing Vessel Horizon (Compact) */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 overflow-hidden pointer-events-none opacity-90 hidden sm:block">
        <div className="absolute inset-0 bg-gradient-to-l from-sky-50/80 via-sky-50/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden">
          <svg className="w-[200%] h-full animate-wave-flow opacity-30 text-ocean-500" viewBox="0 0 1200 60" preserveAspectRatio="none">
            <path d="M0,20 C150,40 350,0 500,20 C650,40 850,0 1000,20 C1150,40 1350,0 1500,20 L1500,60 L0,60 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute bottom-2 right-12 animate-waterline-bob scale-50 origin-bottom-right">
          <svg width="210" height="70" viewBox="0 0 210 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 58 C30 57 50 63 90 60 C130 57 170 63 205 60" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="4 3" opacity="0.6" />
            <path d="M15 42 L35 58 L180 58 L198 42 L192 34 L30 34 Z" fill="#0f172a" />
            <path d="M25 50 L35 58 L180 58 L190 50 Z" fill="#e11d48" />
            <rect x="42" y="30" width="22" height="4" rx="1" fill="#475569" />
            <rect x="70" y="30" width="22" height="4" rx="1" fill="#475569" />
            <rect x="98" y="30" width="22" height="4" rx="1" fill="#475569" />
            <rect x="126" y="30" width="22" height="4" rx="1" fill="#475569" />
            <rect x="156" y="16" width="24" height="18" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="160" y="20" width="16" height="4" rx="0.5" fill="#38bdf8" />
            <rect x="162" y="8" width="6" height="8" rx="1" fill="#0284c7" />
          </svg>
        </div>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col justify-center max-w-2xl">
        <div className="inline-flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-ocean-600" />
          <span className="text-xs font-semibold text-ocean-700">MoPSW · Dry Bulk Directive</span>
        </div>
        <h2 className="text-xl font-bold text-charcoal-900 tracking-tight mb-2">
          Freight Forecasting & Vessel Chartering
        </h2>
        <div className="flex gap-3">
          <button onClick={onLaunchWizard} className="neo-btn-primary px-4 py-1.5 text-xs inline-flex items-center gap-2">
            <Ship className="w-3.5 h-3.5" />
            <span>Launch Wizard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={onExploreScenarios} className="neo-btn px-3 py-1.5 text-xs inline-flex items-center gap-2">
            <span>Crisis Simulator</span>
          </button>
        </div>
      </div>

      <div className="relative z-10 hidden md:flex p-3 rounded-xl bg-emerald-50 border border-emerald-100 items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div className="max-w-[200px]">
          <div className="text-xs font-bold uppercase text-emerald-800">
            Lock Mid-Term
          </div>
          <div className="text-[10px] text-emerald-700 leading-tight">
            Market slope upward. Hedge ~₹1.54 Cr in projected spot escalation.
          </div>
        </div>
      </div>
    </div>
  );
};
