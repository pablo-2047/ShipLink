import React from 'react';
import { ScenarioExplorer } from './ScenarioExplorer';
import {
  ShieldAlert,
  Ship,
  Anchor,
  Navigation,
  Wind,
  CheckCircle2,
} from 'lucide-react';
import { ApiWarningBanner } from '../../context/ApiHealthContext';

export const ScenarioLabView: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Live API Health Warning Banner if Scenario Presets are degraded */}
      <ApiWarningBanner
        requiredApis={['scenarios']}
        componentName="Scenario Lab Sandbox"
      />

      {/* 1. Macroeconomic & Geopolitical Shock Simulator */}
      <div>
        <ScenarioExplorer />
      </div>

      {/* 2. Tactical Contingency Protocol Matrix (Full-Width Responsive SOP Playbook) */}
      <div className="neo-card p-6 space-y-4 id-tour-contingency-playbook">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ocean-50 flex items-center justify-center text-ocean-700 border border-ocean-200 shadow-neo-sm">
              <Navigation className="w-5 h-5 text-ocean-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-charcoal-900 tracking-wider uppercase font-mono">
                  CRISIS CONTINGENCY SOP PLAYBOOK
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-ocean-50 text-ocean-800 border border-ocean-200">
                  SOP-MARITIME
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated standard operational procedures for vessel rerouting and demurrage mitigation under simulated stress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              SOP Aligned with BIMCO &amp; DG Shipping
            </span>
            <span>·</span>
            <span>Ref: SIH-2026-EC</span>
          </div>
        </div>

        {/* 4 Standard Operating Procedures in Responsive 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Rule 1 */}
          <div className="p-4 rounded-xl neo-card bg-slate-50/70 border border-slate-200/80 space-y-2 hover:bg-white hover:border-amber-300 transition-all shadow-neo-sm flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-charcoal-900">
                <span className="flex items-center gap-1.5 text-xs">
                  <Wind className="w-4 h-4 text-amber-600" />
                  Cyclone &amp; Swell &gt;2.5m
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                  SANDHEADS
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Immediately suspend open-sea Ship-to-Ship (STS) lighterage at Sandheads anchorage. Divert inbound Capesize bulkers to Visakhapatnam Outer Harbor sheltered breakwater basin.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/70 text-[10px] font-mono text-amber-700 font-bold">
              Protocol: IMD Red Swell Alert
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-4 rounded-xl neo-card bg-slate-50/70 border border-slate-200/80 space-y-2 hover:bg-white hover:border-rose-300 transition-all shadow-neo-sm flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-charcoal-900">
                <span className="flex items-center gap-1.5 text-xs">
                  <Anchor className="w-4 h-4 text-rose-600" />
                  Draft Limit (Haldia &lt;8.5m)
                </span>
                <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-300">
                  RIVER BYPASS
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Capesize and Panamax fixtures exceeding 8.5m draft automatically reroute discharge to Dhamra (18.5m draft) or Gangavaram. River daughter barges handle onward transit to avoid tidal lock demurrage.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/70 text-[10px] font-mono text-rose-700 font-bold">
              Protocol: Hooghly River Divert
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-4 rounded-xl neo-card bg-slate-50/70 border border-slate-200/80 space-y-2 hover:bg-white hover:border-ocean-300 transition-all shadow-neo-sm flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-charcoal-900">
                <span className="flex items-center gap-1.5 text-xs">
                  <Ship className="w-4 h-4 text-ocean-600" />
                  Paradip Queue Surge (&gt;12)
                </span>
                <span className="text-[10px] font-mono font-bold text-ocean-800 bg-ocean-50 px-2 py-0.5 rounded border border-ocean-300">
                  RAPID DIVERT
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Pivot prompt Newcastle/Mozambique thermal coal cargoes to Gangavaram high-speed conveyor berths (112,000 MT/day record discharge) to mitigate daily demurrage burn (~₹23.5 Lakhs/day · ~$28,000 USD/day).
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/70 text-[10px] font-mono text-ocean-700 font-bold">
              Mitigation: ₹23.5 L/day (~$28k USD)
            </div>
          </div>

          {/* Rule 4 */}
          <div className="p-4 rounded-xl neo-card bg-slate-50/70 border border-slate-200/80 space-y-2 hover:bg-white hover:border-indigo-300 transition-all shadow-neo-sm flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-charcoal-900">
                <span className="flex items-center gap-1.5 text-xs">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  Bunker Spike (+30%)
                </span>
                <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-300">
                  ECO-SPEED
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Enforce eco-steaming (11.0–11.5 knots vs 13.5 knots design speed) across Bay of Bengal transit legs, saving heavy fuel oil consumption (~₹5.2 Lakhs/day · ~$6,200 USD/day per voyage).
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/70 text-[10px] font-mono text-indigo-700 font-bold">
              Fuel OPEX Save: ₹5.2 L/day (~$6.2k USD)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioLabView;
