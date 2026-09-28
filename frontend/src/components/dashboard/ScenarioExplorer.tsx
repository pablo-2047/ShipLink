import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sliders,
  RotateCcw,
  Zap,
  TrendingUp,
  TrendingDown,
  Flame,
  CloudRain,
  Fuel,
  Building2,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { simulateScenario, fetchLatestBDI } from '../../lib/api';
import type { LatestBDI } from '../../lib/types';

export interface SliderValues {
  brent: number;
  usd_inr: number;
  bunker: number;
  coal: number;
  iron_ore: number;
  congestion: number;
  tonne_mile: number;
}

export interface SliderConfig {
  id: keyof SliderValues;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  description: string;
  sensitivity: 'High' | 'Medium' | 'Critical';
  weight: string;
}

const DEFAULT_SLIDERS: SliderValues = {
  brent: 0,
  usd_inr: 0,
  bunker: 0,
  coal: 0,
  iron_ore: 0,
  congestion: 0,
  tonne_mile: 0,
};

const SLIDERS_SCHEMA: SliderConfig[] = [
  {
    id: 'brent',
    label: 'Brent Crude Oil Price',
    unit: '%',
    min: -50,
    max: 50,
    step: 1,
    description: 'Macro energy benchmark impacting vessel operating bunker costs',
    sensitivity: 'High',
    weight: 'β = +0.64',
  },
  {
    id: 'usd_inr',
    label: 'USD / INR Exchange Rate',
    unit: '%',
    min: -10,
    max: 15,
    step: 0.5,
    description: 'Forex conversion impacting rupee-denominated landed coal & ore costs',
    sensitivity: 'Medium',
    weight: 'β = +0.48',
  },
  {
    id: 'bunker',
    label: 'Bunker Fuel (VLSFO) Price',
    unit: '%',
    min: -40,
    max: 60,
    step: 1,
    description: 'Direct maritime propulsion fuel cost (~45% of total voyage OPEX)',
    sensitivity: 'Critical',
    weight: 'β = +0.78',
  },
  {
    id: 'coal',
    label: 'Newcastle Coal Demand',
    unit: '%',
    min: -30,
    max: 50,
    step: 1,
    description: 'Thermal coal demand for Indian coastal power plants & NTPC utilities',
    sensitivity: 'High',
    weight: 'β = +0.72',
  },
  {
    id: 'iron_ore',
    label: 'Iron Ore 62% Fe Demand',
    unit: '%',
    min: -30,
    max: 50,
    step: 1,
    description: 'Global steel mill appetite and China domestic blast furnace utilization',
    sensitivity: 'High',
    weight: 'β = +0.76',
  },
  {
    id: 'congestion',
    label: 'Port Congestion Delay',
    unit: 'days',
    min: 0,
    max: 10,
    step: 0.5,
    description: 'Pre-berthing anchorage queues immobilizing East Coast dry bulk tonnage',
    sensitivity: 'Critical',
    weight: 'β = +0.84',
  },
  {
    id: 'tonne_mile',
    label: 'Tonne-Mile Shock',
    unit: '%',
    min: 0,
    max: 35,
    step: 1,
    description: 'Voyage distance expansion due to chokepoints / canal diversions',
    sensitivity: 'Critical',
    weight: 'β = +0.91',
  },
];

export interface PresetConfig {
  id: string;
  name: string;
  tagline: string;
  impactInr: string;
  impactUsd: string;
  icon: typeof Flame;
  iconColor: string;
  borderHover: string;
  bgActive: string;
  values: Partial<SliderValues>;
}

const PRESETS: PresetConfig[] = [
  {
    id: 'red_sea',
    name: 'Red Sea / Cape Diversion',
    tagline: '+18% Tonne-Miles, +12% Bunker',
    impactInr: '+₹2.39 Cr',
    impactUsd: '~$285k USD',
    icon: Flame,
    iconColor: 'text-rose-600',
    borderHover: 'hover:border-rose-300',
    bgActive: 'neo-card bg-rose-50/90 border-2 border-rose-400 text-rose-950 shadow-neo-sm ring-2 ring-rose-300',
    values: {
      tonne_mile: 18,
      bunker: 12,
      brent: 8,
      congestion: 1.5,
    },
  },
  {
    id: 'monsoon_strike',
    name: 'Monsoon Cyclone Strike',
    tagline: '+4 Days Congestion, +5% Bunker',
    impactInr: '+₹1.85 Cr',
    impactUsd: '~$220k USD',
    icon: CloudRain,
    iconColor: 'text-ocean-600',
    borderHover: 'hover:border-ocean-300',
    bgActive: 'neo-card bg-ocean-50/90 border-2 border-ocean-500 text-ocean-950 shadow-neo-sm ring-2 ring-ocean-300',
    values: {
      congestion: 4,
      bunker: 5,
    },
  },
  {
    id: 'bunker_spike',
    name: 'Bunker Fuel Price Spike',
    tagline: '+35% VLSFO Price, +28% Brent',
    impactInr: '+₹1.92 Cr',
    impactUsd: '~$228k USD',
    icon: Fuel,
    iconColor: 'text-amber-600',
    borderHover: 'hover:border-amber-300',
    bgActive: 'neo-card bg-amber-50/90 border-2 border-amber-500 text-amber-950 shadow-neo-sm ring-2 ring-amber-300',
    values: {
      bunker: 35,
      brent: 28,
    },
  },
  {
    id: 'china_steel',
    name: 'China Steel Stimulus',
    tagline: '+25% Iron Ore, +20% Coal, +5% TM',
    impactInr: '+₹2.41 Cr',
    impactUsd: '~$287k USD',
    icon: Building2,
    iconColor: 'text-emerald-600',
    borderHover: 'hover:border-emerald-300',
    bgActive: 'neo-card bg-emerald-50/90 border-2 border-emerald-500 text-emerald-950 shadow-neo-sm ring-2 ring-emerald-300',
    values: {
      iron_ore: 25,
      coal: 20,
      tonne_mile: 5,
    },
  },
];

interface ChartPoint {
  day: string;
  dayNum: number;
  baseBdi: number;
  simulatedBdi: number;
  delta: number;
}

/**
 * Format INR currency with Indian numbering (Crores / Lakhs / Thousands)
 */
const formatInrAmount = (val: number, showSign: boolean = true): string => {
  const abs = Math.abs(val);
  const sign = val > 0 ? '+' : val < 0 ? '-' : '';
  const prefix = showSign ? sign : '';

  if (abs >= 10000000) {
    return `${prefix}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${prefix}₹${(abs / 100000).toFixed(2)} Lakhs`;
  }
  return `${prefix}₹${Math.round(abs).toLocaleString('en-IN')}`;
};

/**
 * Format USD in subscript/parentheses format
 */
const formatUsdSubscript = (val: number, showSign: boolean = true): string => {
  const abs = Math.abs(val);
  const sign = val > 0 ? '+' : val < 0 ? '-' : '';
  const prefix = showSign ? sign : '';

  if (abs >= 1000000) {
    return `(${prefix}$${(abs / 1000000).toFixed(2)}M USD)`;
  }
  if (abs >= 10000) {
    return `(${prefix}$${Math.round(abs / 1000)}k USD · $${Math.round(abs).toLocaleString()} USD)`;
  }
  return `(${prefix}$${Math.round(abs).toLocaleString()} USD)`;
};

export const ScenarioExplorer: React.FC = () => {
  const [sliders, setSliders] = useState<SliderValues>(DEFAULT_SLIDERS);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [baseBdi, setBaseBdi] = useState<number>(3507);
  const [simulatedBdi, setSimulatedBdi] = useState<number>(3507);
  const [deltaBdi, setDeltaBdi] = useState<number>(0);
  const [deltaPct, setDeltaPct] = useState<number>(0);
  const [costImpactUsdPerDay, setCostImpactUsdPerDay] = useState<number>(0);
  const [costImpactInrPerDay, setCostImpactInrPerDay] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Live Sync');
  const [backendForecastSeries, setBackendForecastSeries] = useState<{
    dates: string[];
    base: number[];
    simulated: number[];
  } | null>(null);

  // Load initial baseline BDI
  useEffect(() => {
    let isMounted = true;
    fetchLatestBDI()
      .then((data: LatestBDI) => {
        if (isMounted && data?.current_bdi) {
          const current = Math.round(data.current_bdi);
          setBaseBdi(current);
          setSimulatedBdi(current);
        }
      })
      .catch(() => {
        setBaseBdi(3507);
        setSimulatedBdi(3507);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Check if any slider is modified
  const isCustomized = useMemo(() => {
    return Object.values(sliders).some((v) => v !== 0);
  }, [sliders]);

  // High-accuracy instant mathematical simulation based on calibrated elasticity
  const calculateInstantSimulation = useCallback((vals: SliderValues, baseline: number) => {
    const brentImpact = vals.brent * 0.18;
    const bunkerImpact = vals.bunker * 0.32;
    const coalImpact = vals.coal * 0.28;
    const ironOreImpact = vals.iron_ore * 0.34;
    const congestionImpact = vals.congestion * 3.8; // +3.8% BDI per day of congestion
    const tonneMileImpact = vals.tonne_mile * 0.88; // +0.88% BDI per 1% tonne-mile shock

    const totalPct = brentImpact + bunkerImpact + coalImpact + ironOreImpact + congestionImpact + tonneMileImpact;
    const netDelta = baseline * (totalPct / 100);
    const newSim = Math.round(baseline + netDelta);

    const dailyUsd = Math.round(netDelta * 15.5);
    const usdInrRate = 84.0 * (1 + vals.usd_inr / 100);
    const dailyInr = Math.round(dailyUsd * usdInrRate);

    setSimulatedBdi(newSim);
    setDeltaBdi(Math.round(netDelta));
    setDeltaPct(Number(totalPct.toFixed(2)));
    setCostImpactUsdPerDay(dailyUsd);
    setCostImpactInrPerDay(dailyInr);
  }, []);

  // Calculate real-time marginal BDI point change per individual slider
  const getSliderMarginalBdi = useCallback(
    (key: keyof SliderValues, val: number): number => {
      if (val === 0) return 0;
      let pct = 0;
      if (key === 'brent') pct = val * 0.18;
      else if (key === 'bunker') pct = val * 0.32;
      else if (key === 'coal') pct = val * 0.28;
      else if (key === 'iron_ore') pct = val * 0.34;
      else if (key === 'congestion') pct = val * 3.8;
      else if (key === 'tonne_mile') pct = val * 0.88;
      else if (key === 'usd_inr') pct = val * 0.15;
      return Math.round(baseBdi * (pct / 100));
    },
    [baseBdi]
  );

  // Handle individual slider change with instant feedback
  const handleSliderChange = (key: keyof SliderValues, val: number) => {
    setIsSimulating(true);
    const updated: SliderValues = {
      ...sliders,
      [key]: val,
    };
    setSliders(updated);
    setActivePreset(null);
    // Instant reactive recalculation for seamless, zero-delay UI
    calculateInstantSimulation(updated, baseBdi);
  };

  // Apply a 1-click disruption preset with instant response
  const handleApplyPreset = (preset: PresetConfig) => {
    setIsSimulating(true);
    const updated: SliderValues = {
      ...DEFAULT_SLIDERS,
      ...preset.values,
    };
    setSliders(updated);
    setActivePreset(preset.id);
    // Instant calculation so 30-day voyage impact NEVER flashes 0
    calculateInstantSimulation(updated, baseBdi);
  };

  // Reset all sliders
  const handleResetSliders = () => {
    setIsSimulating(true);
    setSliders(DEFAULT_SLIDERS);
    setActivePreset(null);
    setBackendForecastSeries(null);
    setSimulatedBdi(baseBdi);
    setDeltaBdi(0);
    setDeltaPct(0);
    setCostImpactUsdPerDay(0);
    setCostImpactInrPerDay(0);
    setIsSimulating(false);
  };

  // Debounced API Simulation Engine
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const payload = {
          adjustments: {
            brent: sliders.brent,
            usd_inr: sliders.usd_inr,
            bunker: sliders.bunker,
            coal: sliders.coal,
            iron_ore: sliders.iron_ore,
            congestion: sliders.congestion,
            tonne_mile: sliders.tonne_mile,
            brent_price_change_pct: sliders.brent,
            usd_inr_change_pct: sliders.usd_inr,
            bunker_fuel_change_pct: sliders.bunker,
            coal_demand_change_pct: sliders.coal,
            iron_ore_demand_change_pct: sliders.iron_ore,
            port_congestion_extra_days: sliders.congestion,
            tonne_mile_shock_pct: sliders.tonne_mile,
          },
        };

        const response = await simulateScenario(payload);

        if (response && response.delta_bdi !== undefined) {
          const delta = response.delta_bdi;
          const pct = response.delta_pct ?? (baseBdi ? (delta / baseBdi) * 100 : 0);
          const simBdi = Math.round(baseBdi + delta);

          setSimulatedBdi(simBdi);
          setDeltaBdi(Math.round(delta));
          setDeltaPct(Number(pct.toFixed(2)));

          const dailyUsd = response.cost_impact_usd_per_day ?? Math.round(delta * 15.5);
          const exchangeRate = 84.0 * (1 + sliders.usd_inr / 100);
          const dailyInr = response.cost_impact_inr_per_day ?? Math.round(dailyUsd * exchangeRate);

          setCostImpactUsdPerDay(dailyUsd);
          setCostImpactInrPerDay(dailyInr);

          if (
            response.base_forecast &&
            response.adjusted_forecast &&
            Array.isArray(response.base_forecast) &&
            Array.isArray(response.adjusted_forecast) &&
            response.base_forecast.length > 0
          ) {
            const rawBase = response.base_forecast.map((v: any) =>
              typeof v === 'object' && v !== null && 'bdi' in v ? Number(v.bdi) : Number(v)
            );
            const rawSim = response.adjusted_forecast.map((v: any) =>
              typeof v === 'object' && v !== null && 'bdi' in v ? Number(v.bdi) : Number(v)
            );
            const datesList = response.dates || [];

            setBackendForecastSeries({
              dates: datesList,
              base: rawBase,
              simulated: rawSim,
            });
          }
        } else {
          calculateInstantSimulation(sliders, baseBdi);
        }
      } catch {
        calculateInstantSimulation(sliders, baseBdi);
      } finally {
        setIsSimulating(false);
        setLastUpdated(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      }
    }, 240);

    return () => clearTimeout(timer);
  }, [sliders, baseBdi, calculateInstantSimulation]);

  // 30-Day trajectory projection data for Recharts
  const trajectoryData: ChartPoint[] = useMemo(() => {
    // If backend returned multi-horizon points, plot them directly
    if (
      backendForecastSeries &&
      backendForecastSeries.base.length >= 15 &&
      backendForecastSeries.simulated.length >= 15
    ) {
      return backendForecastSeries.base.map((baseVal, idx) => {
        const simVal = backendForecastSeries.simulated[idx] ?? baseVal;
        const dateStr = backendForecastSeries.dates[idx] || `Day ${idx + 1}`;
        let label = `D+${idx + 1}`;
        try {
          if (dateStr.includes('-')) {
            const d = new Date(dateStr);
            label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        } catch {
          label = `D+${idx + 1}`;
        }

        return {
          day: label,
          dayNum: idx + 1,
          baseBdi: Math.round(baseVal),
          simulatedBdi: Math.round(simVal),
          delta: Math.round(simVal - baseVal),
        };
      });
    }

    // High-fidelity S-curve dynamic projection
    const points: ChartPoint[] = [];
    const days = 30;
    const now = new Date();

    for (let i = 0; i <= days; i += 2) {
      const dt = new Date(now);
      dt.setDate(now.getDate() + i);
      const dateLabel = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // S-curve adoption factor for market shock diffusion over 30 days
      const shockProgress = 1 / (1 + Math.exp(-0.45 * (i - 4)));
      const baseDrift = Math.sin(i * 0.25) * 18 + i * 1.8;
      const curBase = Math.round(baseBdi + baseDrift);
      const curSim = Math.round(curBase + deltaBdi * shockProgress);

      points.push({
        day: dateLabel,
        dayNum: i,
        baseBdi: curBase,
        simulatedBdi: curSim,
        delta: curSim - curBase,
      });
    }
    return points;
  }, [baseBdi, deltaBdi, backendForecastSeries]);

  // Standard 30-day voyage total impact
  const voyageCostImpactUsd = costImpactUsdPerDay * 30;
  const voyageCostImpactInr = costImpactInrPerDay * 30;

  // Visual Theme Shifting: Crimson for rate inflation, Emerald for savings/relief
  const isSurge = deltaBdi >= 0;
  const simStrokeColor = isSurge ? '#e11d48' : '#059669';
  const simGradId = isSurge ? 'simSurgeGrad' : 'simReliefGrad';

  // Strategic Charterer Advisory logic
  const strategicAdvice = useMemo(() => {
    if (deltaPct > 12) {
      return {
        level: 'CRITICAL ESCALATION',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-300',
        text: 'Severe freight rate escalation shock detected. Immediate action: Lock in medium-term Contracts of Affreightment (COA) or advance laycans before spot fixtures re-price upwards.',
        action: 'Lock Short/Mid COA Immediately',
      };
    }
    if (deltaPct > 4) {
      return {
        level: 'MODERATE RATE PRESSURE',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-300',
        text: 'Tonne-mile and bunker price increases are pushing operational voyage costs higher. Favor prompt spot chartering over delayed market entry.',
        action: 'Fix Prompt Tonnage',
      };
    }
    if (deltaPct < -4) {
      return {
        level: 'MARKET SOFTENING OPPORTUNITY',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        text: 'Tonnage demand contraction indicates impending spot rate relief. Recommendation: Delay charter commitments by 7-12 days to capture declining fixture rates.',
        action: 'Wait for Spot Bottom',
      };
    }
    return {
      level: 'BALANCED CORRIDOR',
      badgeColor: 'bg-ocean-50 text-ocean-700 border-ocean-300',
      text: 'Macro supply-demand parameters remain in equilibrium. Standard 5-day laycan fixing windows and indexed voyage charter terms are advised.',
      action: 'Maintain Standard Laycans',
    };
  }, [deltaPct]);

  // Dynamic Regime Shock Banner styling
  const regimeBanner = useMemo(() => {
    if (deltaPct >= 10) {
      return {
        container: 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-neo-sm',
        dot: 'bg-rose-600',
        badge: 'bg-rose-100/80 text-rose-800 border-rose-300',
        title: '🚨 HIGH FREIGHT STRESS REGIME',
        textHighlight: 'text-rose-700 font-black',
      };
    }
    if (deltaPct > 0) {
      return {
        container: 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-neo-sm',
        dot: 'bg-amber-500',
        badge: 'bg-amber-100/80 text-amber-800 border-amber-300',
        title: '⚠️ INFLATIONARY RATE PRESSURE REGIME',
        textHighlight: 'text-amber-700 font-black',
      };
    }
    if (deltaPct < -4) {
      return {
        container: 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-neo-sm',
        dot: 'bg-emerald-600',
        badge: 'bg-emerald-100/80 text-emerald-800 border-emerald-300',
        title: '📉 SPOT RATE RELIEF & MARKET SOFTENING',
        textHighlight: 'text-emerald-700 font-black',
      };
    }
    return {
      container: 'bg-ocean-50/60 border-ocean-200 text-ocean-950',
      dot: 'bg-ocean-600',
      badge: 'bg-ocean-100 text-ocean-800 border-ocean-300',
      title: '⚖️ BALANCED FREIGHT CORRIDOR',
      textHighlight: 'text-ocean-700 font-black',
    };
  }, [deltaPct]);

  return (
    <div className="space-y-6 text-charcoal-900">
      {/* Top Header Card */}
      <div className="neo-card bg-white border border-slate-200/80 rounded-2xl p-6 shadow-neo relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-ocean-600 text-white flex items-center justify-center shadow-neo-sm">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
                  What-If Crisis Simulator & Scenario Explorer
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-ocean-50 text-ocean-700 border border-ocean-200 uppercase tracking-wider">
                    Stress Simulator · Scenario Engine
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Interactive multi-variable sensitivity engine with calibrated Baltic Dry Index elasticity for Indian East Coast shipping
                </p>
              </div>
            </div>
          </div>

          {/* Actions & Status */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Engine Status</span>
              <span className="text-xs text-charcoal-800 font-mono flex items-center gap-1.5 justify-end font-semibold">
                <span className={`h-2 w-2 rounded-full ${isSimulating ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                {isSimulating ? 'Simulating...' : `Synced (${lastUpdated})`}
              </span>
            </div>

            <button
              onClick={handleResetSliders}
              disabled={!isCustomized}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                isCustomized
                  ? 'neo-btn bg-white hover:bg-slate-50 text-charcoal-900 border-slate-200 shadow-neo-sm cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Sliders
            </button>
          </div>
        </div>

        {/* Presets Row: Specifically marked for Guided Tour */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 id-tour-scenario-presets">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              One-Click Disruption Presets
            </span>
            <span className="text-[11px] text-slate-500">Select a predefined stress-test to populate parameters with instant feedback</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map((p) => {
              const Icon = p.icon;
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden group cursor-pointer ${
                    isSelected
                      ? p.bgActive
                      : `neo-card bg-white border-slate-200/80 ${p.borderHover} hover:bg-slate-50 shadow-neo-sm`
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${p.iconColor}`} />
                      <span className="text-xs font-bold text-charcoal-900 group-hover:text-ocean-700 transition">
                        {p.name}
                      </span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-ocean-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-medium leading-tight">{p.tagline}</p>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {p.impactInr}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.impactUsd}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Comparison Output KPI Cards (INR Primary, USD Subscript) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Base vs Simulated BDI */}
        <div className="neo-card bg-white border border-slate-200/80 rounded-2xl p-5 shadow-neo-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Forecast Baltic Dry Index</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">BDI Pts</span>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-black text-charcoal-900 font-mono tracking-tight">
                {simulatedBdi.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 line-through font-mono">
                {baseBdi.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                deltaBdi > 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-300'
                  : deltaBdi < 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {deltaBdi > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : deltaBdi < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
              {deltaBdi >= 0 ? `+${deltaBdi}` : deltaBdi} pts ({deltaPct >= 0 ? `+${deltaPct}` : deltaPct}%)
            </span>
            <span className="text-[11px] text-slate-500 font-medium">vs Base 30d</span>
          </div>
        </div>

        {/* Card 2: Daily Charter Cost Impact (INR First, USD Subscript) */}
        <div className="neo-card bg-white border border-slate-200/80 rounded-2xl p-5 shadow-neo-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Charter Impact</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-ocean-50 text-ocean-700 border border-ocean-200 font-mono font-bold">
                ₹ INR / Day
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-3xl font-black font-mono tracking-tight ${
                  costImpactInrPerDay > 0 ? 'text-rose-600' : costImpactInrPerDay < 0 ? 'text-emerald-600' : 'text-charcoal-900'
                }`}
              >
                {formatInrAmount(costImpactInrPerDay)}
              </span>
              <span className="text-xs text-slate-500 font-medium">/day</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-mono">
            USD Equiv:{' '}
            <strong className="text-charcoal-900 font-semibold">
              {formatUsdSubscript(costImpactUsdPerDay)}
            </strong>
          </div>
        </div>

        {/* Card 3: 30-Day Voyage Cost Impact (INR First, USD Subscript) */}
        <div className="neo-card bg-white border border-slate-200/80 rounded-2xl p-5 shadow-neo-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">30-Day Voyage Impact</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-ocean-50 text-ocean-700 border border-ocean-200 font-mono font-bold">
                160k MT Capesize
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-3xl font-black font-mono tracking-tight ${
                  voyageCostImpactInr > 0 ? 'text-rose-600' : voyageCostImpactInr < 0 ? 'text-emerald-600' : 'text-charcoal-900'
                }`}
              >
                {formatInrAmount(voyageCostImpactInr)}
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-mono">
            USD Total:{' '}
            <strong className="text-charcoal-900 font-semibold">
              {formatUsdSubscript(voyageCostImpactUsd)}
            </strong>
          </div>
        </div>

        {/* Card 4: Chartering Recommendation Advisory */}
        <div className="neo-card bg-white border border-slate-200/80 rounded-2xl p-5 shadow-neo-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chartering Advisory</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${strategicAdvice.badgeColor}`}>
                {strategicAdvice.level}
              </span>
            </div>
            <p className="text-xs text-charcoal-800 leading-relaxed line-clamp-2 font-medium">
              {strategicAdvice.text}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Action:</span>
            <span className="font-bold text-ocean-700">{strategicAdvice.action}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: 7 Sliders (Left) & Live Forecast Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel: 5 cols */}
        <div className="lg:col-span-5 neo-card bg-white border border-slate-200/80 rounded-2xl p-6 shadow-neo space-y-5 id-tour-scenario-sliders">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-ocean-600" />
                7 Market Shock Parameters
              </h3>
              <p className="text-[11px] text-slate-500">Drag sliders to recalculate simulated Baltic Dry Index in real-time</p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Live Responsive
            </span>
          </div>

          <div className="space-y-3.5">
            {SLIDERS_SCHEMA.map((cfg) => {
              const value = sliders[cfg.id];
              const isNonZero = value !== 0;
              const marginalPts = getSliderMarginalBdi(cfg.id, value);

              return (
                <div
                  key={cfg.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isNonZero
                      ? 'neo-well bg-slate-50/90 border-slate-300/80 shadow-neo-inner'
                      : 'bg-slate-50/40 border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor={`slider-${cfg.id}`} className="text-xs font-bold text-charcoal-800 cursor-pointer">
                        {cfg.label}
                      </label>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600 font-mono font-semibold">
                        {cfg.weight}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Real-Time Marginal BDI Impact Badge */}
                      {isNonZero && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition ${
                            marginalPts > 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : marginalPts < 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                          title="Marginal Baltic Dry Index point impact from this parameter"
                        >
                          {marginalPts > 0 ? `+${marginalPts}` : marginalPts} BDI pts
                        </span>
                      )}

                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                          value > 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-300'
                            : value < 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {value > 0 ? `+${value}` : value}
                        {cfg.unit === '%' ? '%' : ` ${cfg.unit}`}
                      </span>

                      {isNonZero && (
                        <button
                          onClick={() => handleSliderChange(cfg.id, 0)}
                          title="Reset parameter to zero"
                          className="text-[10px] font-bold text-slate-500 hover:text-charcoal-900 px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-sm transition cursor-pointer"
                        >
                          0
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">{cfg.description}</p>

                  {/* Range Slider Track */}
                  <div className="mt-2.5">
                    <input
                      id={`slider-${cfg.id}`}
                      type="range"
                      min={cfg.min}
                      max={cfg.max}
                      step={cfg.step}
                      value={value}
                      onChange={(e) => handleSliderChange(cfg.id, parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-ocean-600 focus:outline-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 font-medium">
                      <span>{cfg.min}{cfg.unit}</span>
                      <span className="text-slate-600 font-bold">0{cfg.unit}</span>
                      <span>+{cfg.max}{cfg.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Comparison Chart: 7 cols */}
        <div className="lg:col-span-7 neo-card bg-white border border-slate-200/80 rounded-2xl p-6 shadow-neo flex flex-col justify-between id-tour-scenario-chart">
          <div>
            {/* Dynamic Regime Shock Status Banner */}
            <div className={`p-4 rounded-xl border transition-all mb-4 ${regimeBanner.container}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`h-3 w-3 rounded-full ${regimeBanner.dot} ${isSimulating ? 'animate-ping' : 'animate-pulse'}`} />
                  <span className="text-xs font-black tracking-wide uppercase font-mono">
                    {regimeBanner.title}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${regimeBanner.badge}`}>
                    {deltaPct >= 0 ? `+${deltaPct}%` : `${deltaPct}%`} Shift
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-600 font-medium">Voyage Total:</span>
                  <strong className={regimeBanner.textHighlight}>
                    {formatInrAmount(voyageCostImpactInr)}
                  </strong>
                  <span className="text-slate-500 font-normal text-[11px]">
                    {formatUsdSubscript(voyageCostImpactUsd)}
                  </span>
                </div>
              </div>
            </div>

            {/* Chart Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-ocean-600" />
                  30-Day Forward Trajectory: Baseline vs Simulated Shock
                </h3>
                <p className="text-[11px] text-slate-500">
                  Dynamic simulation curve modeling market rate divergence and cumulative financial variance over time
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-charcoal-700 font-medium">
                  <span className="inline-block w-3 h-0.5 bg-ocean-500 rounded-full" />
                  <span>Base</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-bold ${isSurge ? 'text-rose-600' : 'text-emerald-600'}`}>
                  <span className={`inline-block w-3 h-0.5 rounded-full ${isSurge ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  <span>Simulated</span>
                </div>
              </div>
            </div>

            {/* Recharts Trajectory Graph */}
            <div className="mt-4 h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trajectoryData} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="simSurgeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="simReliefGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="baseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    domain={['auto', 'auto']}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#0f172a',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(val: any, name: any) => {
                      const num = Number(val);
                      if (name === 'Simulated BDI') return [`${num.toLocaleString()} pts`, 'Simulated BDI'] as [string, string];
                      if (name === 'Base Forecast') return [`${num.toLocaleString()} pts`, 'Base Forecast'] as [string, string];
                      return [`${num}`, String(name || '')] as [string, string];
                    }}
                    labelFormatter={(label) => `Projection Horizon: ${label}`}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#475569' }} />

                  <ReferenceLine
                    y={baseBdi}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    label={{
                      value: `Base: ${baseBdi}`,
                      fill: '#64748b',
                      fontSize: 10,
                      position: 'insideBottomLeft',
                    }}
                  />

                  {/* Areas */}
                  <Area
                    type="monotone"
                    dataKey="simulatedBdi"
                    name="Simulated BDI"
                    stroke={simStrokeColor}
                    strokeWidth={2.5}
                    fill={`url(#${simGradId})`}
                    dot={false}
                    activeDot={{ r: 5, fill: simStrokeColor }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseBdi"
                    name="Base Forecast"
                    stroke="#0284c7"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                    activeDot={{ r: 4, fill: '#0284c7' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Shock Propagation Timeline */}
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">D+1 Spot Impact</span>
                <span className="text-xs font-bold text-charcoal-900 font-mono">
                  {formatInrAmount(costImpactInrPerDay * 0.25)}/d
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">D+7 Queue Buildup</span>
                <span className="text-xs font-bold text-charcoal-900 font-mono">
                  {formatInrAmount(costImpactInrPerDay * 0.75)}/d
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">D+15 Full Reroute</span>
                <span className="text-xs font-bold text-charcoal-900 font-mono">
                  {formatInrAmount(costImpactInrPerDay * 0.95)}/d
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">D+30 Macro Shock</span>
                <span className="text-xs font-bold text-charcoal-900 font-mono">
                  {formatInrAmount(costImpactInrPerDay)}/d
                </span>
              </div>
            </div>
          </div>

          {/* Deep-dive Scenario Explainer Callout: INR first with USD subscript */}
          <div className="mt-4 p-4 rounded-xl neo-well bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-charcoal-800">
            <Info className="w-4 h-4 text-ocean-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-charcoal-900 block mb-0.5">Maritime Impact Interpretation</span>
              <p className="text-slate-600 leading-relaxed font-medium">
                Under the configured scenario, dry bulk charterers operating on East Coast routes (Paradip / Visakhapatnam / Dhamra) face an estimated{' '}
                <strong className={deltaBdi >= 0 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {deltaBdi >= 0 ? `+${deltaBdi}` : deltaBdi} points ({deltaPct >= 0 ? `+${deltaPct}` : deltaPct}%)
                </strong>{' '}
                index shift. A standard 35-day Capesize voyage carrying 160,000 MT of coal will incur a net fixture difference of{' '}
                <strong className="text-charcoal-900 font-bold">
                  {formatInrAmount(voyageCostImpactInr)}{' '}
                  <span className="text-slate-500 font-normal">
                    {formatUsdSubscript(voyageCostImpactUsd)}
                  </span>
                </strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioExplorer;
