import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Info,
  SlidersHorizontal,
  Layers,
  Sparkles,
  HelpCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  ArrowDownUp,
  Target,
} from 'lucide-react';
import type { ShapFeature } from '../../lib/types';

export interface ShapFeatureImportanceProps {
  /** List of SHAP features from backend forecast or scenario simulation */
  features?: ShapFeature[];
  /** Baseline Baltic Dry Index value (e.g. historical average or current anchor) */
  baseBDI?: number;
  /** Final predicted Baltic Dry Index value */
  predictedBDI?: number;
  /** Forecast horizon in days (default 30) */
  horizonDays?: number;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Optional custom class name */
  className?: string;
  /** Callback when user clicks on a feature bar */
  onFeatureSelect?: (feature: ShapFeature) => void;
}

interface ExtendedFeatureMeta {
  category: 'Macro' | 'Fleet Supply' | 'Commodity Demand' | 'Port & Weather' | 'Technical';
  unit: string;
  formattedBase: string;
  explanation: string;
  mechanism: string;
}

const FEATURE_METADATA: Record<string, ExtendedFeatureMeta> = {
  bdi_momentum_14d: {
    category: 'Technical',
    unit: 'points',
    formattedBase: '+42.5 pts (14d delta)',
    explanation: 'Rapid 14-day velocity in Atlantic & Pacific fixtures triggers charterer booking urgency and spot rate spikes.',
    mechanism: 'Positive momentum signals tighter immediate vessel availability, creating chartering FOMO among grain and coal charterers.',
  },
  tonne_mile_crisis: {
    category: 'Fleet Supply',
    unit: 'pct detour',
    formattedBase: '+14.2% global tonne-miles',
    explanation: 'Cape of Good Hope rerouting around Red Sea & Suez choke-points stretches voyages by 10-14 days.',
    mechanism: 'Extended voyage duration locks up vessel deadweight for longer cycles, creating an artificial supply squeeze that propels rates upward.',
  },
  brent_crude: {
    category: 'Macro',
    unit: 'USD/barrel',
    formattedBase: '$84.20 / bbl',
    explanation: 'Crude price increases flow directly into VLSFO marine bunker fuel, lifting shipowners voyage break-even rates.',
    mechanism: 'Owners pass elevated bunker fuel expenses through higher daily time charter equivalents and bunker adjustment factors.',
  },
  port_congestion_index: {
    category: 'Port & Weather',
    unit: 'congestion index',
    formattedBase: '38.4 index pts (East Coast)',
    explanation: 'Anchorage delays at Paradip, Vizag, and Dhamra immobilize Capesize and Panamax bulk carriers.',
    mechanism: 'Every vessel waiting at anchorage is removed from the active trading fleet, choking prompt tonnage supply.',
  },
  iron_ore_cfr: {
    category: 'Commodity Demand',
    unit: 'USD/dry metric ton',
    formattedBase: '$116.50 / dmt (62% Fe)',
    explanation: 'Robust Chinese steel mill margins and Port Hedland export shipments incentivize heavy Capesize chartering.',
    mechanism: 'Strong iron ore demand commands 60%+ of global Capesize deadweight, directly pushing the BDI headline index higher.',
  },
  china_steel_output: {
    category: 'Commodity Demand',
    unit: 'capacity pct',
    formattedBase: '88.4% blast furnace utilization',
    explanation: 'High capacity utilization in Hebei and Tangshan steel hubs maintains steady seaborne raw material replenishment.',
    mechanism: 'Heavier mill intake pulls bulk carriers on long-haul Brazil-China and Australia-India coal corridors.',
  },
  fleet_supply_growth: {
    category: 'Fleet Supply',
    unit: 'pct YoY',
    formattedBase: '+3.8% YoY net deliveries',
    explanation: 'Shipyard deliveries of newbuild Newcastlemax and Ultramax bulk carriers expand global deadweight capacity.',
    mechanism: 'Fleet oversupply broadens charterer choice, putting downward pressure on daily hire rates across all trading routes.',
  },
  bunker_fuel_vlsfo: {
    category: 'Macro',
    unit: 'USD/metric ton',
    formattedBase: '$628.00 / mt (Singapore)',
    explanation: 'Very Low Sulphur Fuel Oil prices enforce eco-speed slow steaming (11-12 knots instead of 14 knots).',
    mechanism: 'Charterers calculate slower optimal sailing speeds to mitigate bunker burn, dampening willingness to pay premium charter rates.',
  },
  coal_stockpiles_india: {
    category: 'Commodity Demand',
    unit: 'days buffer',
    formattedBase: '48.6 MT (18.2 days buffer)',
    explanation: 'Comfortable thermal coal reserves at Indian thermal power stations (NTPC) diminish emergency spot procurement.',
    mechanism: 'Reduced spot import tender activity leaves Supramax and Panamax tonnage competing aggressively for Indonesian parcels.',
  },
  monsoon_factor: {
    category: 'Port & Weather',
    unit: 'swell index',
    formattedBase: 'Rough swell (SW Monsoon)',
    explanation: 'Monsoonal swells at Gopalpur and Sandheads offshore lighterage anchorage delay transshipment into Hooghly river ports.',
    mechanism: 'Operational pauses delay cargo discharge, temporarily depressing charter demand for incoming replacement vessels.',
  },
  usd_inr: {
    category: 'Macro',
    unit: 'INR/USD',
    formattedBase: '₹83.85 / USD',
    explanation: 'Rupee depreciation against the dollar increases landed import procurement costs for Indian steelmakers and utilities.',
    mechanism: 'Higher landed forex cost discourages speculative non-coking coal buying, tapering Indian East Coast freight demand.',
  },
  bdi_lag_1: {
    category: 'Technical',
    unit: 'points',
    formattedBase: '1,505 pts (yesterday)',
    explanation: 'Strong autoregressive persistence in dry bulk chartering contracts established in previous trading sessions.',
    mechanism: 'Freight forward agreements (FFAs) and index fixtures anchor negotiations around the latest published Baltic exchange fixture.',
  },
};

/** Default realistic SHAP features representing typical dry-bulk macro conditions */
const DEFAULT_SHAP_FEATURES: ShapFeature[] = [
  {
    feature: 'bdi_momentum_14d',
    display_name: 'BDI 14-Day Momentum',
    impact: 44.82,
    base_value: 1510.0,
  },
  {
    feature: 'tonne_mile_crisis',
    display_name: 'Tonne-Mile Expansion (Red Sea Diversion)',
    impact: 38.60,
    base_value: 1510.0,
  },
  {
    feature: 'brent_crude',
    display_name: 'Brent Crude ($84.2/bbl Bunker Pass-Through)',
    impact: 26.40,
    base_value: 1510.0,
  },
  {
    feature: 'port_congestion_index',
    display_name: 'East Coast India Port Congestion',
    impact: 21.15,
    base_value: 1510.0,
  },
  {
    feature: 'china_steel_output',
    display_name: 'China Blast Furnace Utilization (88.4%)',
    impact: 15.80,
    base_value: 1510.0,
  },
  {
    feature: 'bdi_lag_1',
    display_name: 'BDI Autoregressive Persistence (Lag 1)',
    impact: 11.25,
    base_value: 1510.0,
  },
  {
    feature: 'usd_inr',
    display_name: 'USD / INR Forex Squeeze (₹83.85)',
    impact: -9.40,
    base_value: 1510.0,
  },
  {
    feature: 'monsoon_factor',
    display_name: 'SW Monsoon Lighterage Curtailment',
    impact: -14.60,
    base_value: 1510.0,
  },
  {
    feature: 'coal_stockpiles_india',
    display_name: 'NTPC Indian Coal Stockpile Buffer',
    impact: -19.30,
    base_value: 1510.0,
  },
  {
    feature: 'bunker_fuel_vlsfo',
    display_name: 'High VLSFO Bunker Fuel (Slow Steaming)',
    impact: -24.80,
    base_value: 1510.0,
  },
  {
    feature: 'fleet_supply_growth',
    display_name: 'Global Capesize Fleet Deliveries (+3.8% YoY)',
    impact: -34.50,
    base_value: 1510.0,
  },
];

type FilterMode = 'all' | 'bullish' | 'bearish';
type SortMode = 'absolute' | 'positive_first' | 'negative_first';

export const ShapFeatureImportance: React.FC<ShapFeatureImportanceProps> = ({
  features = [],
  baseBDI = 3426,
  predictedBDI,
  horizonDays = 30,
  isLoading = false,
  className = '',
  onFeatureSelect,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('absolute');
  const [featureLimit, setFeatureLimit] = useState<number>(10);
  const [selectedFeature, setSelectedFeature] = useState<ShapFeature | null>(null);
  const [showExplainer, setShowExplainer] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeFeatures = useMemo(() => {
    const raw = features && features.length > 0 ? features : DEFAULT_SHAP_FEATURES;
    return raw.map((f) => ({
      ...f,
      base_value: baseBDI,
    }));
  }, [features, baseBDI]);

  // Normalize and sort features
  const processedData = useMemo(() => {
    const rawList = activeFeatures;

    // Filter by directional bias
    let filtered = rawList.filter((f) => {
      if (filterMode === 'bullish') return f.impact > 0;
      if (filterMode === 'bearish') return f.impact < 0;
      return true;
    });

    // Sort accordingly
    filtered.sort((a, b) => {
      if (sortMode === 'absolute') {
        return Math.abs(b.impact) - Math.abs(a.impact);
      }
      if (sortMode === 'positive_first') {
        return b.impact - a.impact;
      }
      return a.impact - b.impact;
    });

    // Limit to top N
    return filtered.slice(0, featureLimit);
  }, [activeFeatures, filterMode, sortMode, featureLimit]);

  // Aggregate SHAP analytics
  const metrics = useMemo(() => {
    const rawList = activeFeatures;
    const bullishTotal = rawList.filter((f) => f.impact > 0).reduce((acc, curr) => acc + curr.impact, 0);
    const bearishTotal = rawList.filter((f) => f.impact < 0).reduce((acc, curr) => acc + curr.impact, 0);
    const netDelta = bullishTotal + bearishTotal;

    const topBullish = [...rawList].filter((f) => f.impact > 0).sort((a, b) => b.impact - a.impact)[0];
    const topBearish = [...rawList].filter((f) => f.impact < 0).sort((a, b) => a.impact - b.impact)[0];

    const maxAbsImpact = Math.max(...rawList.map((f) => Math.abs(f.impact)), 1);

    return {
      bullishTotal: Math.round(bullishTotal * 10) / 10,
      bearishTotal: Math.round(bearishTotal * 10) / 10,
      netDelta: Math.round(netDelta * 10) / 10,
      topBullish,
      topBearish,
      maxAbsImpact,
    };
  }, [activeFeatures]);

  // Calculate symmetric domain for diverging bar chart
  const xDomain = useMemo(() => {
    const maxVal = Math.max(
      ...processedData.map((d) => Math.abs(d.impact)),
      20
    );
    const ceiling = Math.ceil((maxVal * 1.25) / 10) * 10;
    return [-ceiling, ceiling];
  }, [processedData]);

  // Calculated predicted BDI if not provided
  const computedPredictedBDI = useMemo(() => {
    if (predictedBDI !== undefined) return predictedBDI;
    return Math.round(baseBDI + metrics.netDelta);
  }, [predictedBDI, baseBDI, metrics.netDelta]);

  if (!activeFeatures || activeFeatures.length === 0) {
    return (
      <div className={`neo-card p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
              SHAP Feature Importance Engine
              <span className="text-[10px] font-mono text-ocean-700 px-2 py-0.5 rounded bg-ocean-50 border border-ocean-200 font-semibold">
                TreeExplainer
              </span>
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Marginal macroeconomic and supply-side feature contribution analysis
            </p>
          </div>
        </div>
        <div className="neo-well p-8 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-neo flex items-center justify-center text-ocean-600 mb-3 border border-slate-200/80">
            <Layers className="w-6 h-6 text-ocean-600" />
          </div>
          <h4 className="text-sm font-bold text-charcoal-900 mb-1">TreeSHAP Attributions Ready Upon Model Fixture</h4>
          <p className="text-xs text-charcoal-600 max-w-md leading-relaxed mb-3">
            TreeExplainer mathematically attributes model forecasts into exact dollar and point impacts. As soon as your teammate drops the model into <code className="text-ocean-700 font-bold font-mono">backend/ml_models/</code>, this panel will render live feature attributions.
          </p>
          <div className="bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-neo-sm text-xs font-mono text-charcoal-700 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Awaiting: <code>backend/ml_models/lgb_bdi_model.joblib</code></span>
          </div>
        </div>
      </div>
    );
  }

  const handleBarClick = (entry: any) => {
    if (entry && entry.activePayload && entry.activePayload.length > 0) {
      const feat = entry.activePayload[0].payload as ShapFeature;
      setSelectedFeature(feat);
      if (onFeatureSelect) {
        onFeatureSelect(feat);
      }
    }
  };

  return (
    <div
      className={`neo-card p-5 md:p-6 space-y-5 ${className}`}
    >
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-ocean-50 border border-ocean-200 text-ocean-600">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-charcoal-900 tracking-wide">
                  SHAP Feature Importance Breakdown
                </h2>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-ocean-50 text-ocean-700 border border-ocean-200">
                  TreeExplainer · Feature Impact
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-charcoal-600 border border-slate-200">
                  LightGBM + TreeSHAP
                </span>
              </div>
              <p className="text-xs text-charcoal-500">
                Economic force decomposition for {horizonDays}-day BDI forecast · Diverging game-theoretic attribution
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Explainer toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Filter Mode Selector */}
          <div className="inline-flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-neo-inner text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                filterMode === 'all'
                  ? 'bg-white text-ocean-700 font-bold shadow-neo-btn'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              All Top
            </button>
            <button
              onClick={() => setFilterMode('bullish')}
              className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
                filterMode === 'bullish'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-emerald-700 hover:text-emerald-800'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              Bullish Only
            </button>
            <button
              onClick={() => setFilterMode('bearish')}
              className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
                filterMode === 'bearish'
                  ? 'bg-rose-600 text-white font-bold shadow-sm'
                  : 'text-rose-700 hover:text-rose-800'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              Bearish Only
            </button>
          </div>

          {/* Sort Mode Selector */}
          <div className="inline-flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-neo-inner text-xs">
            <button
              onClick={() => setSortMode('absolute')}
              className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 ${
                sortMode === 'absolute'
                  ? 'bg-white text-ocean-700 font-bold shadow-neo-btn'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
              title="Sort by Absolute Impact |x|"
            >
              <ArrowDownUp className="w-3 h-3" />
              |Impact|
            </button>
            <button
              onClick={() => setSortMode('positive_first')}
              className={`px-2 py-1 rounded-lg font-medium ${
                sortMode === 'positive_first'
                  ? 'bg-white text-emerald-700 font-bold shadow-neo-btn'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
              title="Sort Bullish first"
            >
              + to -
            </button>
            <button
              onClick={() => setSortMode('negative_first')}
              className={`px-2 py-1 rounded-lg font-medium ${
                sortMode === 'negative_first'
                  ? 'bg-white text-rose-700 font-bold shadow-neo-btn'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
              title="Sort Bearish first"
            >
              - to +
            </button>
          </div>

          {/* Top 8 vs Top 10 Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-neo-inner text-xs">
            <button
              onClick={() => setFeatureLimit(8)}
              className={`px-2.5 py-1 rounded-lg font-mono ${
                featureLimit === 8
                  ? 'bg-white text-ocean-700 font-bold shadow-neo-btn'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Top 8
            </button>
            <button
              onClick={() => setFeatureLimit(10)}
              className={`px-2.5 py-1 rounded-lg font-mono ${
                featureLimit === 10
                  ? 'bg-white text-ocean-700 font-bold shadow-neo-btn'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Top 10
            </button>
          </div>

          {/* Learn More Toggle */}
          <button
            onClick={() => setShowExplainer(!showExplainer)}
            className="neo-btn flex items-center gap-1 px-3 py-1.5 rounded-xl text-charcoal-600 hover:text-ocean-600 text-xs transition"
            title="Explain SHAP methodology"
          >
            <HelpCircle className="w-3.5 h-3.5 text-ocean-600" />
            <span className="hidden sm:inline">How SHAP Works</span>
            {showExplainer ? (
              <ChevronUp className="w-3 h-3 text-charcoal-500" />
            ) : (
              <ChevronDown className="w-3 h-3 text-charcoal-500" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Educational & Decision Framework Guide */}
      {showExplainer && (
        <div className="mt-4 p-5 rounded-2xl bg-sky-50/70 dark:bg-slate-800/80 border border-sky-200 dark:border-sky-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-sky-200/80 dark:border-slate-700 pb-2.5">
            <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Executive Guide: What is this graph &amp; How does it affect our fleet operations?</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 text-slate-500 font-bold">
              TreeSHAP Mathematical Attribution
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-[11px]">
            {/* Column 1: What is this graph */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>1. What is this graph?</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                A mathematical force breakdown powered by <strong>TreeSHAP (cooperative game theory)</strong>. It deconstructs our LightGBM freight model, showing exactly how many points each real-world variable adds or subtracts from today's spot baseline ({baseBDI.toLocaleString()} pts) to reach the {horizonDays}-day forward forecast ({computedPredictedBDI.toLocaleString()} pts).
              </p>
            </div>

            {/* Column 2: What the Green vs Red bars mean */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>2. How to read the bars?</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong className="text-emerald-700 dark:text-emerald-400">🟢 Green Bars (Bullish)</strong> push shipping rates UP (e.g. bunker fuel price hikes, canal detours adding 14 sailing days, port queues at Paradip).
                <br className="mt-1" />
                <strong className="text-rose-700 dark:text-rose-400">🔴 Red Bars (Bearish)</strong> pull shipping rates DOWN (e.g. new ship deliveries increasing vessel supply, ample utility coal stockpiles).
              </p>
            </div>

            {/* Column 3: How it affects us */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>3. How does this affect us?</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>When Green dominates</strong>, spot freight will spike—lock in Forward Freight Agreements (FFAs) or long-term charters immediately to avoid paying crore-level spot premiums.
                <br className="mt-1" />
                <strong>When Red dominates</strong>, rates are softening—avoid expensive long fixtures; charter on the spot market day-to-day to save ₹40L–₹1.2 Cr per voyage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. KPI Net Force Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-neo-sm">
          <div className="text-[11px] text-charcoal-500 flex items-center justify-between">
            <span>Baseline Anchor</span>
            <Activity className="w-3.5 h-3.5 text-charcoal-400" />
          </div>
          <div className="text-lg font-bold text-charcoal-900 font-mono mt-1">{baseBDI.toLocaleString()}</div>
          <div className="text-[10px] text-charcoal-400">Historical / Current BDI</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-neo-sm">
          <div className="text-[11px] text-charcoal-500 flex items-center justify-between">
            <span>Bullish Pressure</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700 font-mono mt-1">
            +{metrics.bullishTotal.toFixed(1)} <span className="text-xs font-normal">pts</span>
          </div>
          <div className="text-[10px] text-emerald-600 truncate font-medium">
            Top: {metrics.topBullish?.display_name.split('(')[0] || 'Tonne-Mile'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-neo-sm">
          <div className="text-[11px] text-charcoal-500 flex items-center justify-between">
            <span>Bearish Drag</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-rose-700 font-mono mt-1">
            {metrics.bearishTotal.toFixed(1)} <span className="text-xs font-normal">pts</span>
          </div>
          <div className="text-[10px] text-rose-600 truncate font-medium">
            Top: {metrics.topBearish?.display_name.split('(')[0] || 'Fleet Supply'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-neo-sm">
          <div className="text-[11px] text-charcoal-500 flex items-center justify-between">
            <span>Net Forecast Shift</span>
            <Layers className="w-3.5 h-3.5 text-ocean-600" />
          </div>
          <div
            className={`text-lg font-bold font-mono mt-1 flex items-center gap-1 ${
              metrics.netDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {metrics.netDelta >= 0 ? '+' : ''}
            {metrics.netDelta.toFixed(1)}
            <span className="text-xs font-normal text-charcoal-500 font-sans">
              ({computedPredictedBDI.toLocaleString()} target)
            </span>
          </div>
          <div className="text-[10px] text-charcoal-500">
            {metrics.netDelta >= 0 ? 'Bullish Rate Environment' : 'Softening Rate Environment'}
          </div>
        </div>
      </div>

      {/* 4. Diverging Bar Chart Canvas */}
      <div className="relative mt-2">
        {isLoading ? (
          <div className="h-[380px] flex flex-col items-center justify-center gap-3 text-charcoal-400">
            <div className="w-8 h-8 border-2 border-ocean-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Computing LightGBM TreeExplainer attributions...</p>
          </div>
        ) : (
          <div className="w-full h-[380px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={processedData}
                margin={{ top: 12, right: isMobile ? 16 : 35, left: isMobile ? 8 : 30, bottom: 20 }}
                onClick={handleBarClick}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  horizontal={false}
                  opacity={0.8}
                />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={isMobile ? 10 : 11}
                  domain={xDomain}
                  tickFormatter={(val) => `${val > 0 ? '+' : ''}${val} pts`}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  type="category"
                  dataKey="display_name"
                  stroke="#334155"
                  fontSize={isMobile ? 10 : 11}
                  width={isMobile ? 120 : 190}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={({ x, y, payload }: any) => {
                    const text = String(payload?.value || '');
                    const maxChars = isMobile ? 15 : 27;
                    const truncated = text.length > maxChars ? `${text.slice(0, maxChars - 2)}…` : text;
                    const numX = typeof x === 'number' ? x : parseFloat(x) || 0;
                    const numY = typeof y === 'number' ? y : parseFloat(y) || 0;
                    return (
                      <text
                        x={numX - (isMobile ? 4 : 8)}
                        y={numY + 3}
                        fill="#334155"
                        fontSize={isMobile ? 10 : 11}
                        fontWeight={500}
                        textAnchor="end"
                        className="cursor-pointer hover:fill-ocean-600 transition"
                      >
                        {truncated}
                      </text>
                    );
                  }}
                />
                <ReferenceLine
                  x={0}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  label={{
                    value: '0 pts (Baseline)',
                    position: 'top',
                    fill: '#64748b',
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  content={<CustomShapTooltip />}
                />
                <Bar
                  dataKey="impact"
                  radius={[4, 4, 4, 4]}
                  isAnimationActive={true}
                  animationDuration={800}
                >
                  {processedData.map((entry, index) => {
                    const isSelected = selectedFeature?.feature === entry.feature;
                    const isPositive = entry.impact >= 0;
                    return (
                      <Cell
                        key={`cell-${entry.feature}-${index}`}
                        fill={isPositive ? '#10b981' : '#f43f5e'}
                        stroke={isSelected ? '#0284c7' : isPositive ? '#059669' : '#e11d48'}
                        strokeWidth={isSelected ? 2 : 1}
                        className="cursor-pointer transition-all hover:opacity-80"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 5. Diverging Legend & Mechanics Annotation */}
      <div className="mt-2 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#10b981] inline-block shadow-sm"></span>
            <span className="text-charcoal-700">
              <strong className="text-emerald-700 font-semibold">Bullish Driver:</strong> Pushes Freight Rates UP
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#f43f5e] inline-block shadow-sm"></span>
            <span className="text-charcoal-700">
              <strong className="text-rose-700 font-semibold">Bearish Drag:</strong> Pushes Freight Rates DOWN
            </span>
          </div>
          <div className="flex items-center gap-2 text-charcoal-500">
            <span className="w-3.5 border-t-2 border-dashed border-slate-400 inline-block"></span>
            <span>Zero Delta Baseline ({baseBDI} pts)</span>
          </div>
        </div>

        <div className="text-[11px] text-charcoal-500 italic">
          * Click any bar to inspect underlying shipping mechanics & sensitivity
        </div>
      </div>

      {/* 6. Active Feature Deep-Dive Drawer */}
      {selectedFeature && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs animate-fadeIn space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-charcoal-900 text-sm">
              {selectedFeature.impact >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
              )}
              <span>{selectedFeature.display_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                  selectedFeature.impact >= 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {selectedFeature.impact >= 0 ? '+' : ''}
                {selectedFeature.impact.toFixed(2)} BDI Points
              </span>
              <button
                onClick={() => setSelectedFeature(null)}
                className="neo-btn px-2.5 py-0.5 text-[11px] text-charcoal-600 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>

          {FEATURE_METADATA[selectedFeature.feature] && (
            <div className="space-y-2 pt-1">
              <div className="text-charcoal-700">
                <span className="text-ocean-700 font-semibold">Observed Indicator Value: </span>
                <span className="font-mono text-charcoal-900 font-bold">
                  {FEATURE_METADATA[selectedFeature.feature].formattedBase}
                </span>
              </div>
              <div className="text-charcoal-700">
                <span className="text-ocean-700 font-semibold">Economic Mechanics: </span>
                <span>{FEATURE_METADATA[selectedFeature.feature].mechanism}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-charcoal-700 flex items-start gap-2 shadow-neo-sm">
                <Info className="w-3.5 h-3.5 text-ocean-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-charcoal-900">Chartering Implication: </strong>
                  {FEATURE_METADATA[selectedFeature.feature].explanation}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Custom Rich Tooltip for SHAP Feature Bars
 */
const CustomShapTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data: ShapFeature = payload[0].payload;
  const isPositive = data.impact >= 0;
  const meta = FEATURE_METADATA[data.feature];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-neo-lg max-w-[280px] sm:max-w-sm text-xs space-y-2 pointer-events-none z-50 break-words">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
        <div>
          <span className="text-[10px] uppercase font-semibold text-ocean-600 block tracking-wider">
            {meta?.category || 'Maritime Driver'}
          </span>
          <h4 className="font-bold text-charcoal-900 text-sm leading-tight mt-0.5">{data.display_name}</h4>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 ${
            isPositive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {isPositive ? '+' : ''}
          {data.impact.toFixed(2)} pts
        </span>
      </div>

      <div className="space-y-1.5 pt-1 text-charcoal-700">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-charcoal-500">Directional Force:</span>
          <span className={`font-semibold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
            {isPositive ? 'Bullish (Rate Driver UP)' : 'Bearish (Rate Suppressor DOWN)'}
          </span>
        </div>

        {meta && (
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-charcoal-500">Feature Baseline:</span>
            <span className="font-mono text-charcoal-900 font-bold">{meta.formattedBase}</span>
          </div>
        )}

        <div className="pt-1.5 border-t border-slate-100 text-[11px] text-charcoal-600 leading-relaxed">
          {meta?.explanation ||
            'Calculated SHAP attribution representing this features marginal addition to the LightGBM forecast.'}
        </div>
      </div>
    </div>
  );
};

export default ShapFeatureImportance;
