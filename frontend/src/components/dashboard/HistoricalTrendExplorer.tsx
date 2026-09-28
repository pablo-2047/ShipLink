import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  History,
  Calendar,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Anchor,
  ShieldAlert,
  Activity,
  MapPin,
  Info,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { fetchHistoricalBDI, fetchHistoricalEvents } from '../../lib/api';
import { HISTORICAL_EVENTS, type EnrichedDisruptionEvent } from '../../lib/historicalEventsData';

type CategoryFilter = 'all' | 'cyclone' | 'geopolitical' | 'pandemic' | 'congestion' | 'market';
type TimeRange = '5y' | '3y' | '1y';

interface BDIPoint {
  date: string;
  bdi: number;
  value?: number;
}

export const HistoricalTrendExplorer: React.FC = () => {
  const [bdiData, setBdiData] = useState<BDIPoint[]>([]);
  const [events, setEvents] = useState<EnrichedDisruptionEvent[]>(HISTORICAL_EVENTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('5y');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<EnrichedDisruptionEvent | null>(null);

  // Load Historical BDI and Disruption Events
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [bdiRes, eventsRes] = await Promise.allSettled([
          fetchHistoricalBDI(2000),
          fetchHistoricalEvents(),
        ]);

        if (isMounted) {
          if (bdiRes.status === 'fulfilled' && Array.isArray(bdiRes.value) && bdiRes.value.length > 0) {
            const formatted = bdiRes.value.map((item: any) => ({
              date: item.date,
              bdi: Math.round(Number(item.bdi || item.value || item.bdi_index || 1500)),
            }));
            setBdiData(formatted);
          } else {
            // Generate fallback 5-year data matching 2020-2026 calibrated milestones
            setBdiData(generateCalibratedHistoricalSeries());
          }

          if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value) && eventsRes.value.length > 0) {
            // Merge backend events with enriched local metadata
            const merged = HISTORICAL_EVENTS.map((localEvt) => {
              const fromBackend = eventsRes.value.find((b: any) => b.id === localEvt.id);
              if (fromBackend) {
                return {
                  ...localEvt,
                  ...fromBackend,
                  affected_ports: localEvt.affected_ports,
                  market_consequences: localEvt.market_consequences,
                  mitigation_strategy: localEvt.mitigation_strategy,
                };
              }
              return localEvt;
            });
            setEvents(merged);
          }
        }
      } catch {
        if (isMounted) {
          setBdiData(generateCalibratedHistoricalSeries());
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter BDI Data by Time Range (5y: from 2020, 3y: from 2023, 1y: from 2025)
  const filteredBdiData = useMemo(() => {
    if (!bdiData.length) return [];
    const now = new Date('2026-09-08');
    let cutoffDate = new Date('2020-01-01');

    if (timeRange === '3y') {
      cutoffDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
    } else if (timeRange === '1y') {
      cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    const cutoffStr = cutoffDate.toISOString().slice(0, 10);
    const subset = bdiData.filter((d) => d.date >= cutoffStr);

    // If sampling large datasets for smooth chart rendering
    if (subset.length > 400) {
      const step = Math.ceil(subset.length / 300);
      return subset.filter((_, idx) => idx % step === 0 || idx === subset.length - 1);
    }
    return subset;
  }, [bdiData, timeRange]);

  // Statistics for the chosen time slice
  const stats = useMemo(() => {
    if (!filteredBdiData.length) {
      return { min: 393, max: 5650, avg: 1845, current: 1520, peakDate: '2021-10-07', lowDate: '2020-05-14' };
    }
    let minVal = Infinity;
    let maxVal = -Infinity;
    let sum = 0;
    let peakDt = '';
    let lowDt = '';

    for (const d of filteredBdiData) {
      if (d.bdi < minVal) {
        minVal = d.bdi;
        lowDt = d.date;
      }
      if (d.bdi > maxVal) {
        maxVal = d.bdi;
        peakDt = d.date;
      }
      sum += d.bdi;
    }

    const avg = Math.round(sum / filteredBdiData.length);
    const curr = filteredBdiData[filteredBdiData.length - 1]?.bdi ?? 1520;

    return {
      min: minVal,
      max: maxVal,
      avg,
      current: curr,
      peakDate: peakDt,
      lowDate: lowDt,
    };
  }, [filteredBdiData]);

  // Filter Disruption Events by category, time range, and search query
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Category check
      if (selectedCategory !== 'all' && ev.category !== selectedCategory) {
        return false;
      }

      // Time range check
      if (timeRange === '3y' && ev.date < '2023-01-01') return false;
      if (timeRange === '1y' && ev.date < '2025-01-01') return false;

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.event.toLowerCase().includes(q);
        const matchImpact = ev.impact.toLowerCase().includes(q);
        const matchPorts = ev.affected_ports.some((p) => p.toLowerCase().includes(q));
        const matchDate = ev.date.includes(q);
        return matchTitle || matchImpact || matchPorts || matchDate;
      }

      return true;
    });
  }, [events, selectedCategory, timeRange, searchQuery]);

  // Key Milestones for Chart Reference Pins
  const chartMilestones = useMemo(() => {
    const keyEventDates = [
      '2020-01-23', // COVID
      '2021-03-23', // Ever Given
      '2021-10-07', // Peak 5650
      '2022-02-24', // Russia-Ukraine
      '2023-06-01', // Panama Drought
      '2023-11-19', // Red Sea Crisis
      '2024-05-24', // Cyclone Remal
      '2024-10-01', // ILA Strike
      '2024-10-23', // Cyclone Dana
    ];

    return keyEventDates
      .map((dateStr) => {
        const evt = events.find((e) => e.date === dateStr);
        const bdiEntry = filteredBdiData.find((b) => b.date >= dateStr);
        if (evt && bdiEntry) {
          return {
            ...evt,
            chartBdi: bdiEntry.bdi,
            chartDate: bdiEntry.date,
          };
        }
        return null;
      })
      .filter(Boolean) as (EnrichedDisruptionEvent & { chartBdi: number; chartDate: string })[];
  }, [events, filteredBdiData]);

  // Categories metadata
  const categories: { id: CategoryFilter; label: string; icon: string; count: number }[] = [
    { id: 'all', label: 'All Events', icon: '🌐', count: events.length },
    { id: 'cyclone', label: 'Cyclones', icon: '🌊', count: events.filter((e) => e.category === 'cyclone').length },
    { id: 'geopolitical', label: 'Geopolitical', icon: '⚔️', count: events.filter((e) => e.category === 'geopolitical').length },
    { id: 'pandemic', label: 'Pandemic', icon: '🦠', count: events.filter((e) => e.category === 'pandemic').length },
    { id: 'congestion', label: 'Congestion', icon: '🚢', count: events.filter((e) => e.category === 'congestion').length },
    { id: 'market', label: 'Market Extremes', icon: '📈', count: events.filter((e) => e.category === 'market').length },
  ];

  // In-place event selection with smooth scroll to consequence inspector
  const handleSelectEvent = useCallback((evt: EnrichedDisruptionEvent | null) => {
    setSelectedEvent(evt);
    if (evt && typeof document !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById('disruption-consequence-inspector');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }, []);

  const handleSelectNextEvent = useCallback(() => {
    if (!selectedEvent) return;
    const currIdx = filteredEvents.findIndex((e) => e.id === selectedEvent.id);
    if (currIdx !== -1 && currIdx < filteredEvents.length - 1) {
      handleSelectEvent(filteredEvents[currIdx + 1]);
    } else {
      handleSelectEvent(filteredEvents[0]);
    }
  }, [selectedEvent, filteredEvents, handleSelectEvent]);

  const handleSelectPrevEvent = useCallback(() => {
    if (!selectedEvent) return;
    const currIdx = filteredEvents.findIndex((e) => e.id === selectedEvent.id);
    if (currIdx > 0) {
      handleSelectEvent(filteredEvents[currIdx - 1]);
    } else {
      handleSelectEvent(filteredEvents[filteredEvents.length - 1]);
    }
  }, [selectedEvent, filteredEvents, handleSelectEvent]);

  // Keyboard navigation for selected event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedEvent) return;
      if (e.key === 'Escape') setSelectedEvent(null);
      if (e.key === 'ArrowRight') handleSelectNextEvent();
      if (e.key === 'ArrowLeft') handleSelectPrevEvent();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEvent, handleSelectNextEvent, handleSelectPrevEvent]);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner Card */}
      <div className="neo-card bg-white border border-slate-200/80 rounded-2xl p-6 shadow-neo relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-ocean-600 text-white flex items-center justify-center shadow-neo-sm">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
                  Historical BDI Trend & Disruption Explorer
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-ocean-50 text-ocean-700 border border-ocean-200 uppercase tracking-wider">
                    Crisis Timeline · Historical Regimes
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  5-Year macro freight rate trajectory (2020–2026) correlated with 30+ annotated cyclones, wars, canal bottlenecks, and labor strikes
                </p>
              </div>
            </div>
          </div>

          {/* Time Range Selector & Sync Status */}
          <div className="flex items-center gap-3">
            {loading ? (
              <span className="text-xs text-ocean-600 font-mono font-bold animate-pulse flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ocean-600 animate-ping" />
                Syncing BDI...
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-mono font-semibold hidden sm:inline">
                5-Yr Data Active
              </span>
            )}

            <div className="flex items-center gap-1.5 neo-well bg-slate-100/80 border border-slate-200/80 p-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-ocean-600 ml-1.5" />
              <span className="text-xs text-slate-600 font-bold mr-1">Horizon:</span>
            {(['5y', '3y', '1y'] as TimeRange[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  timeRange === t
                    ? 'neo-card bg-white text-ocean-700 shadow-neo-sm'
                    : 'text-slate-600 hover:text-charcoal-900 hover:bg-white/50'
                }`}
              >
                {t === '5y' ? '5 Years' : t === '3y' ? '3 Years' : '1 Year'}
              </button>
            ))}
          </div>
        </div>
      </div>

        {/* Macro Statistics Strip */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="neo-card bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-neo-sm">
            <span className="text-[11px] text-slate-500 font-bold uppercase block">5-Yr Peak BDI</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-rose-600 font-mono">{stats.max.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-mono font-medium">({stats.peakDate})</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">13-Yr High Global Supply Squeeze</span>
          </div>

          <div className="neo-card bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-neo-sm">
            <span className="text-[11px] text-slate-500 font-bold uppercase block">5-Yr Low BDI</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-ocean-600 font-mono">{stats.min.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-mono font-medium">({stats.lowDate})</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Initial COVID Lockdowns Bottom</span>
          </div>

          <div className="neo-card bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-neo-sm">
            <span className="text-[11px] text-slate-500 font-bold uppercase block">Period Mean BDI</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-charcoal-900 font-mono">{stats.avg.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 font-mono">pts</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Calibrated Historical Baseline</span>
          </div>

          <div className="neo-card bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-neo-sm">
            <span className="text-[11px] text-slate-500 font-bold uppercase block">Annotated Disruption Events</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-600 font-mono">{events.length}</span>
              <span className="text-[10px] text-slate-500 font-medium">Catalogs Active</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Indian East Coast Correlated</span>
          </div>
        </div>
      </div>

      {/* 5-Year Interactive Chart */}
      <div className="neo-card bg-white border border-slate-200/80 rounded-2xl p-6 shadow-neo">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-ocean-600" />
              Baltic Dry Index (BDI) Trajectory with Highlighted Crisis Events
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click on any annotated pin or event card below to open deep operational impact playbooks
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-charcoal-700 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-ocean-500" />
              <span>BDI Trend</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-rose-700 font-semibold">Severe Disruption</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-amber-700 font-semibold">Weather / Port Strike</span>
            </span>
          </div>
        </div>

        {/* Chart View */}
        <div className="mt-5 h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredBdiData} margin={{ top: 15, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="historicalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.toLocaleDateString('en-US', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`;
                }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                domain={[0, 'auto']}
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
                formatter={(val: any) => [`${Number(val).toLocaleString()} pts`, 'BDI Index'] as [string, string]}
                labelFormatter={(label) => {
                  const matchingEvt = events.find((e) => e.date === label);
                  return matchingEvt ? `${label} — ${matchingEvt.icon} ${matchingEvt.event}` : `Date: ${label}`;
                }}
              />

              <Area
                type="monotone"
                dataKey="bdi"
                name="BDI Index"
                stroke="#0284c7"
                strokeWidth={2}
                fill="url(#historicalAreaGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#0284c7' }}
              />

              {/* Major Disruption Event Dots */}
              {chartMilestones.map((m) => (
                <ReferenceDot
                  key={m.id}
                  x={m.chartDate}
                  y={m.chartBdi}
                  r={5}
                  fill={m.severity === 'CRITICAL' ? '#e11d48' : '#d97706'}
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="cursor-pointer"
                  onClick={() => handleSelectEvent(m)}
                />
              ))}

              <ReferenceLine
                y={stats.avg}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: `5-Yr Avg: ${stats.avg}`,
                  fill: '#64748b',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Milestone Quick Jump Tags */}
        <div className="mt-4 pt-4 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-500 font-bold uppercase shrink-0">Quick Pin Jumps:</span>
          {chartMilestones.slice(0, 7).map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelectEvent(m)}
              className="neo-card flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-charcoal-800 border border-slate-200/80 text-[11px] shrink-0 transition shadow-neo-sm hover:border-ocean-300 cursor-pointer"
            >
              <span>{m.icon}</span>
              <span className="font-bold">{m.event.split('(')[0]}</span>
              <span className="text-[10px] text-slate-500 font-mono">({m.date.slice(0, 4)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Filters & Search Toolbar */}
      <div className="neo-card bg-white border border-slate-200/80 p-4 rounded-2xl shadow-neo flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((c) => {
            const isSelected = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'neo-card bg-ocean-50 text-ocean-800 border-2 border-ocean-500 shadow-neo-sm'
                    : 'bg-slate-100/80 text-slate-600 hover:text-charcoal-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-ocean-200/60 text-ocean-900' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative shrink-0 sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search port, cyclone, canal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-charcoal-900 placeholder-slate-400 focus:outline-none focus:border-ocean-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-charcoal-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* IN-PLACE CONSEQUENCE DETAIL INSPECTOR (OPENS DIRECTLY ON PAGE, ZERO BLURRY MODAL) */}
      <div id="disruption-consequence-inspector" className="scroll-mt-24 transition-all duration-300">
        {selectedEvent ? (
          <div className="neo-card bg-white dark:bg-slate-900 border-2 border-ocean-500 rounded-2xl p-6 sm:p-7 shadow-lg relative text-charcoal-900 dark:text-slate-100 animate-fadeIn">
            {/* Header: Title, Icon, Severity, Close */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/90 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-neo-sm shrink-0">
                  {selectedEvent.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-ocean-700 dark:text-sky-400 font-bold">
                      {selectedEvent.date} {selectedEvent.end_date ? `→ ${selectedEvent.end_date}` : ''}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedEvent.severity === 'CRITICAL'
                          ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          : selectedEvent.severity === 'HIGH'
                          ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-ocean-50 dark:bg-sky-950/80 text-ocean-700 dark:text-sky-300 border-ocean-300 dark:border-sky-800'
                      }`}
                    >
                      {selectedEvent.severity || 'HIGH'} SEVERITY
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 font-mono">
                      Category: {selectedEvent.categoryLabel}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-charcoal-900 dark:text-white mt-1">
                    {selectedEvent.event}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-charcoal-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                  title="Close Consequence Box"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* In-Place Content Sections */}
            <div className="mt-5 space-y-4 text-xs">
              {/* Affected Ports & Corridors */}
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-ocean-600 dark:text-sky-400" />
                  Affected Ports & Critical Corridors
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.affected_ports.map((p) => (
                    <span
                      key={p}
                      className="px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-charcoal-900 dark:text-slate-200 font-bold flex items-center gap-1.5 shadow-neo-sm"
                    >
                      <Anchor className="w-3 h-3 text-ocean-600 dark:text-sky-400" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* 2-Column Side-by-Side: Operational Impact & Shipping Market Consequences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Operational Impact */}
                <div className="p-4 rounded-xl neo-well bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Operational Impact Assessment
                  </span>
                  <p className="text-charcoal-800 dark:text-slate-300 leading-relaxed font-medium">
                    {selectedEvent.impact}
                  </p>
                </div>

                {/* Shipping Market Consequences */}
                <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Shipping Market & Freight Consequences
                  </span>
                  <p className="text-rose-950 dark:text-rose-200 leading-relaxed font-medium">
                    {selectedEvent.market_consequences}
                  </p>
                </div>
              </div>

              {/* Full-Width Tactical Mitigation Protocol */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-1.5">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Standard Charterer Playbook & Mitigation Protocol
                </span>
                <p className="text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium">
                  {selectedEvent.mitigation_strategy}
                </p>
              </div>
            </div>

            {/* Navigation Footer: Prev / Next */}
            <div className="mt-5 pt-4 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSelectPrevEvent}
                className="neo-btn flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-charcoal-800 dark:text-slate-200 transition cursor-pointer border border-slate-200 dark:border-slate-700 shadow-neo-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Crisis
              </button>

              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Historical Record {filteredEvents.findIndex((e) => e.id === selectedEvent.id) + 1} of {filteredEvents.length}
              </span>

              <button
                type="button"
                onClick={handleSelectNextEvent}
                className="neo-btn flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-charcoal-800 dark:text-slate-200 transition cursor-pointer border border-slate-200 dark:border-slate-700 shadow-neo-sm"
              >
                Next Crisis <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-ocean-50/50 dark:bg-slate-900/60 border border-ocean-200/60 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Info className="w-4 h-4 text-ocean-600 dark:text-sky-400 shrink-0" />
              <span>
                Click <strong>"View Consequences"</strong> on any of the 32 historical records below or pins on the chart to inspect consequence analysis & mitigations directly here.
              </span>
            </div>
            {filteredEvents.length > 0 && (
              <button
                type="button"
                onClick={() => handleSelectEvent(filteredEvents[0])}
                className="shrink-0 text-ocean-700 dark:text-sky-400 hover:underline font-bold text-xs cursor-pointer"
              >
                Inspect Latest Crisis ➔
              </button>
            )}
          </div>
        )}
      </div>

      {/* Disruption Events Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {filteredEvents.length} Historical Disruption Records
          </span>
          <span className="text-xs text-slate-500 font-medium">Click any card to inspect consequence analysis & mitigations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((evt) => {
            const isSelected = selectedEvent?.id === evt.id;

            return (
              <div
                key={evt.id}
                onClick={() => handleSelectEvent(evt)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                  isSelected
                    ? 'neo-card bg-ocean-50/30 border-2 border-ocean-500 shadow-neo ring-1 ring-ocean-500'
                    : 'neo-card bg-white border-slate-200/80 hover:border-ocean-300 hover:bg-slate-50/50 shadow-neo-sm'
                }`}
              >
                <div>
                  {/* Card Header: Icon, Date, Severity */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{evt.icon}</span>
                      <div>
                        <span className="text-[11px] font-mono text-ocean-700 font-bold block">
                          {evt.date} {evt.end_date ? `→ ${evt.end_date}` : ''}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          {evt.categoryLabel}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        evt.severity === 'CRITICAL'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : evt.severity === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-ocean-50 text-ocean-700 border-ocean-300'
                      }`}
                    >
                      {evt.severity || 'HIGH'}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-extrabold text-charcoal-900 mt-3 group-hover:text-ocean-700 transition">
                    {evt.event}
                  </h4>

                  {/* Impact preview */}
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed font-medium">
                    {evt.impact}
                  </p>

                  {/* Affected Ports tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {evt.affected_ports.slice(0, 3).map((port) => (
                      <span
                        key={port}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-charcoal-800 border border-slate-200 font-medium flex items-center gap-1"
                      >
                        <Anchor className="w-2.5 h-2.5 text-ocean-600" />
                        {port}
                      </span>
                    ))}
                    {evt.affected_ports.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                        +{evt.affected_ports.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] font-medium">
                    {evt.voyage_delay_days ? `+${evt.voyage_delay_days}d delay` : 'Macro shock'}
                  </span>
                  <span className="font-bold text-ocean-700 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                    View Consequences <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <div className="neo-card bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-neo-sm">
            <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-charcoal-900">No Disruption Events Match Filter</h4>
            <p className="text-xs text-slate-500 mt-1 font-medium">Try resetting the category filter or clearing the search box.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="neo-btn mt-4 px-4 py-1.5 rounded-xl bg-white text-xs font-bold text-charcoal-900 border border-slate-200 hover:bg-slate-50 shadow-neo-sm cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

// Calibrated 5-Year BDI Generator for Fallback Matching 2020-2026 Historical Milestones
function generateCalibratedHistoricalSeries(): BDIPoint[] {
  const points: BDIPoint[] = [];
  const start = new Date('2020-01-02');
  const end = new Date('2026-09-08');
  let curr = new Date(start);
  let bdi = 1380;

  while (curr <= end) {
    // Only weekdays
    const day = curr.getDay();
    if (day !== 0 && day !== 6) {
      const dtStr = curr.toISOString().slice(0, 10);

      // COVID Crash (Feb - May 2020)
      if (dtStr >= '2020-02-01' && dtStr <= '2020-05-14') {
        bdi = Math.max(393, bdi - 18 + Math.sin(curr.getTime()) * 8);
      }
      // Rebound to 2021 Peak (5650 on Oct 2021)
      else if (dtStr >= '2021-03-01' && dtStr <= '2021-10-07') {
        bdi = Math.min(5650, bdi + 26 + Math.cos(curr.getTime()) * 12);
      }
      // 2022 normalization and war volatility
      else if (dtStr >= '2022-02-24' && dtStr <= '2022-08-01') {
        bdi = 2200 + Math.sin(curr.getTime() * 0.00000005) * 450;
      }
      // 2023 Red Sea crisis escalation
      else if (dtStr >= '2023-11-19' && dtStr <= '2024-04-01') {
        bdi = Math.min(3150, Math.max(1600, bdi + 12 + Math.sin(curr.getTime()) * 15));
      }
      // Mean reversion
      else {
        const drift = 0.015 * (1520 - bdi);
        bdi = Math.max(700, Math.min(4500, bdi + drift + Math.sin(curr.getTime()) * 14));
      }

      points.push({
        date: dtStr,
        bdi: Math.round(bdi),
      });
    }

    curr.setDate(curr.getDate() + 1);
  }

  return points;
}

export default HistoricalTrendExplorer;
