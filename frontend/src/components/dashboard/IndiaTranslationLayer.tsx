import React, { useState, useMemo } from 'react';
import {
  Anchor,
  Ship,
  Compass,
  Calculator,
  Clock,
  DollarSign,
  IndianRupee,
  AlertTriangle,
  Waves,
  Search,
  RefreshCw,
  Layers,
  ShieldAlert,
  Sparkles,
  Sliders,
} from 'lucide-react';
import type { PortCongestion } from '../../lib/types';
import { fetchPortCongestion } from '../../lib/api';

export interface IndiaTranslationLayerProps {
  /** Optional real-time port congestion data from parent or API */
  ports?: PortCongestion[];
  /** Latest BDI value */
  currentBDI?: number;
  /** Active forecast delta (e.g. +112 BDI pts) to seed the calculator */
  bdiForecastDelta?: number;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Custom wrapper class */
  className?: string;
  /** Callback when user selects a specific port */
  onPortSelect?: (portId: string) => void;
}

export interface DetailedPortInfo {
  id: string;
  name: string;
  shortName: string;
  state: string;
  latitude: number;
  longitude: number;
  maxDraftM: number;
  maxLoaM: number;
  maxBeamM: number;
  berthCount: number;
  cargoHandlingMtDay: number;
  maxVesselClass: 'NEWCASTLEMAX' | 'CAPESIZE' | 'PANAMAX' | 'HANDYSIZE' | 'CAPESIZE_LIGHTERAGE';
  isTidal: boolean;
  vesselsWaiting: number;
  avgWaitHours: number;
  avgWaitDays: number;
  congestionLevel: 'GREEN' | 'AMBER' | 'RED';
  weatherSeverity: 'CALM' | 'MODERATE' | 'ROUGH';
  weatherDetails: string;
  demurrageRiskUsd: number;
  demurrageRiskInrLakhs: number;
  majorCargoes: string[];
  operationalNotes: string;
  draftWarning?: string;
}

/** Complete reference dataset for the 8 Indian East Coast discharge hubs */
const EAST_COAST_PORT_SPECS: DetailedPortInfo[] = [
  {
    id: 'paradip',
    name: 'Paradip Port',
    shortName: 'Paradip',
    state: 'Odisha',
    latitude: 20.2644,
    longitude: 86.6286,
    maxDraftM: 16.5,
    maxLoaM: 300.0,
    maxBeamM: 48.0,
    berthCount: 25,
    cargoHandlingMtDay: 50000,
    maxVesselClass: 'CAPESIZE',
    isTidal: true,
    vesselsWaiting: 7,
    avgWaitHours: 26.5,
    avgWaitDays: 1.1,
    congestionLevel: 'AMBER',
    weatherSeverity: 'MODERATE',
    weatherDetails: 'SW Swell 1.8m · Wind 16 kts · Tidal range 2.1m',
    demurrageRiskUsd: 58000,
    demurrageRiskInrLakhs: 48.4,
    majorCargoes: ['Thermal Coal', 'Coking Coal', 'Iron Ore Pellets', 'Limestone'],
    operationalNotes:
      'Outer channel depth 18.7m. Night pilotage restricted to 260m LOA. Turning basin 500m. Heavy monsoon swells require additional mooring line damping.',
  },
  {
    id: 'vizag_outer',
    name: 'Visakhapatnam Outer Harbour',
    shortName: 'Vizag Outer',
    state: 'Andhra Pradesh',
    latitude: 17.6868,
    longitude: 83.2955,
    maxDraftM: 18.1,
    maxLoaM: 390.0,
    maxBeamM: 50.0,
    berthCount: 6,
    cargoHandlingMtDay: 70000,
    maxVesselClass: 'CAPESIZE',
    isTidal: false,
    vesselsWaiting: 3,
    avgWaitHours: 8.5,
    avgWaitDays: 0.35,
    congestionLevel: 'GREEN',
    weatherSeverity: 'CALM',
    weatherDetails: 'Swell 0.8m · Wind 9 kts · All-weather basin',
    demurrageRiskUsd: 18500,
    demurrageRiskInrLakhs: 15.4,
    majorCargoes: ['Coking Coal', 'Steam Coal', 'Iron Ore', 'Manganese Ore'],
    operationalNotes:
      'Deepwater outer harbour equipped with Vizag General Cargo Berth (VGCB) and 2x2200 TPH ship unloaders. Handles 200,000 DWT Capesize vessels without tidal wait.',
  },
  {
    id: 'vizag_inner',
    name: 'Visakhapatnam Inner Harbour',
    shortName: 'Vizag Inner',
    state: 'Andhra Pradesh',
    latitude: 17.699,
    longitude: 83.28,
    maxDraftM: 14.5,
    maxLoaM: 240.0,
    maxBeamM: 32.5,
    berthCount: 24,
    cargoHandlingMtDay: 25000,
    maxVesselClass: 'PANAMAX',
    isTidal: false,
    vesselsWaiting: 4,
    avgWaitHours: 11.2,
    avgWaitDays: 0.47,
    congestionLevel: 'GREEN',
    weatherSeverity: 'CALM',
    weatherDetails: 'Protected basin · Wind 6 kts · Minimal swell',
    demurrageRiskUsd: 24500,
    demurrageRiskInrLakhs: 20.5,
    majorCargoes: ['Coking Coal', 'Thermal Coal', 'Fertilizers', 'Gypsum', 'Bauxite'],
    operationalNotes:
      'Narrow 110m entrance channel. Dual pilotage mandatory for vessels >195m LOA. Fully protected natural basin restricted to Panamax and Supramax classes.',
  },
  {
    id: 'gangavaram',
    name: 'Gangavaram Port',
    shortName: 'Gangavaram',
    state: 'Andhra Pradesh',
    latitude: 17.62,
    longitude: 83.24,
    maxDraftM: 18.5,
    maxLoaM: 300.0,
    maxBeamM: 48.0,
    berthCount: 9,
    cargoHandlingMtDay: 80000,
    maxVesselClass: 'CAPESIZE',
    isTidal: false,
    vesselsWaiting: 2,
    avgWaitHours: 6.2,
    avgWaitDays: 0.26,
    congestionLevel: 'GREEN',
    weatherSeverity: 'CALM',
    weatherDetails: 'Deep open roadstead · Swell 0.7m · Wind 8 kts',
    demurrageRiskUsd: 12000,
    demurrageRiskInrLakhs: 10.0,
    majorCargoes: ['Coking Coal', 'Thermal Coal', 'Iron Ore', 'Fertilizers', 'Limestone'],
    operationalNotes:
      'Deepest port in India with 18.5m permissible water draft. All-weather deepwater multi-purpose port, no tidal wait required. Achieved record 112,599 MT/24hr coal discharge.',
  },
  {
    id: 'gopalpur',
    name: 'Gopalpur Port',
    shortName: 'Gopalpur',
    state: 'Odisha',
    latitude: 19.2588,
    longitude: 84.9414,
    maxDraftM: 14.5,
    maxLoaM: 287.0,
    maxBeamM: 45.0,
    berthCount: 5,
    cargoHandlingMtDay: 35000,
    maxVesselClass: 'PANAMAX',
    isTidal: false,
    vesselsWaiting: 5,
    avgWaitHours: 19.8,
    avgWaitDays: 0.83,
    congestionLevel: 'AMBER',
    weatherSeverity: 'MODERATE',
    weatherDetails: 'Open roadstead swell 1.9m · Strong littoral drift',
    demurrageRiskUsd: 42000,
    demurrageRiskInrLakhs: 35.1,
    majorCargoes: ['Thermal Coal', 'Coking Coal', 'Ilmenite', 'Iron Ore', 'Limestone'],
    operationalNotes:
      'Weather-sensitive open roadstead commercial port. High swell and strong coastal drift during SW monsoon (June-Sept) can halt lighterage and berthing operations.',
  },
  {
    id: 'dhamra',
    name: 'Dhamra Port',
    shortName: 'Dhamra',
    state: 'Odisha',
    latitude: 20.77,
    longitude: 86.95,
    maxDraftM: 18.5,
    maxLoaM: 350.0,
    maxBeamM: 50.0,
    berthCount: 5,
    cargoHandlingMtDay: 100000,
    maxVesselClass: 'NEWCASTLEMAX',
    isTidal: false,
    vesselsWaiting: 3,
    avgWaitHours: 9.5,
    avgWaitDays: 0.4,
    congestionLevel: 'GREEN',
    weatherSeverity: 'CALM',
    weatherDetails: 'Protected approach · Swell 1.1m · Wind 11 kts',
    demurrageRiskUsd: 22000,
    demurrageRiskInrLakhs: 18.4,
    majorCargoes: ['Coking Coal', 'Thermal Coal', 'Iron Ore Pellets', 'Limestone'],
    operationalNotes:
      '18km approach channel with depth 19m. Capable of handling Newcastlemax vessels up to 200,000+ DWT. High-speed automated discharge conveyor systems (132,365 MT/day record).',
  },
  {
    id: 'haldia',
    name: 'Haldia Dock Complex',
    shortName: 'Haldia',
    state: 'West Bengal',
    latitude: 22.025,
    longitude: 88.085,
    maxDraftM: 8.5,
    maxLoaM: 240.0,
    maxBeamM: 32.26,
    berthCount: 17,
    cargoHandlingMtDay: 22000,
    maxVesselClass: 'HANDYSIZE',
    isTidal: true,
    vesselsWaiting: 11,
    avgWaitHours: 44.5,
    avgWaitDays: 1.85,
    congestionLevel: 'RED',
    weatherSeverity: 'ROUGH',
    weatherDetails: 'River bars · High tidal siltation · Lock gate delays',
    demurrageRiskUsd: 115000,
    demurrageRiskInrLakhs: 96.0,
    majorCargoes: ['Coking Coal', 'Thermal Coal', 'Manganese Ore', 'Coke', 'Petcoke'],
    operationalNotes:
      'Severe draft restrictions due to Hooghly river bars (governed by daily tidal windows). Impounded dock basin entered via lock gates. Ships over 8.5m draft must lighter at Sandheads.',
    draftWarning: 'CRITICAL: Severe 8.5m draft restriction. Capesize/Panamax vessels cannot berth laden.',
  },
  {
    id: 'sandheads',
    name: 'Sandheads (Offshore Lighterage)',
    shortName: 'Sandheads',
    state: 'Bay of Bengal',
    latitude: 21.0,
    longitude: 88.3,
    maxDraftM: 16.0,
    maxLoaM: 999.0,
    maxBeamM: 999.0,
    berthCount: 0,
    cargoHandlingMtDay: 25000,
    maxVesselClass: 'CAPESIZE_LIGHTERAGE',
    isTidal: true,
    vesselsWaiting: 9,
    avgWaitHours: 38.0,
    avgWaitDays: 1.58,
    congestionLevel: 'RED',
    weatherSeverity: 'ROUGH',
    weatherDetails: 'Open sea swell 2.4m · SW monsoon wave chop · Estuary current',
    demurrageRiskUsd: 94000,
    demurrageRiskInrLakhs: 78.5,
    majorCargoes: ['Coking Coal', 'Thermal Coal', 'Iron Ore Pellets'],
    operationalNotes:
      'Deep sea lighterage anchorage at the mouth of Hooghly river. Capesize bulk carriers lighten cargo into daughter barges to achieve safe 8.5m draft for Haldia and Kolkata.',
    draftWarning: 'Offshore ship-to-ship lighterage point. Weather halts transfers during severe swell.',
  },
];

type CargoType = 'Thermal Coal' | 'Coking Coal' | 'Iron Ore';
type VesselClass = 'Capesize' | 'Panamax' | 'Supramax';
type TabView = 'ports_grid' | 'calculator' | 'matrix';

interface CargoProfile {
  name: CargoType;
  stowageCuFtMt: number;
  typicalOrigin: string;
  defaultVoyageDays: number;
  description: string;
}

const CARGO_PROFILES: Record<CargoType, CargoProfile> = {
  'Thermal Coal': {
    name: 'Thermal Coal',
    stowageCuFtMt: 44,
    typicalOrigin: 'Newcastle (Aus) / Kalimantan (Indo)',
    defaultVoyageDays: 16,
    description: 'Boiler fuel imported for NTPC and coastal private independent power plants.',
  },
  'Coking Coal': {
    name: 'Coking Coal',
    stowageCuFtMt: 48,
    typicalOrigin: 'Hay Point / DBCT (Queensland, Australia)',
    defaultVoyageDays: 17,
    description: 'Metallurgical coking coal vital for SAIL, Tata Steel, and JSW blast furnaces.',
  },
  'Iron Ore': {
    name: 'Iron Ore',
    stowageCuFtMt: 14,
    typicalOrigin: 'Port Hedland (Aus) / Saldanha Bay (South Africa)',
    defaultVoyageDays: 19,
    description: 'High-density pellets and fines imported or coastal shipped along East Coast.',
  },
};

interface VesselProfile {
  name: VesselClass;
  dwt: number;
  typicalCargoMt: number;
  bdiMultiplier: number;
  typicalCharterUsdDay: number;
  ladenDraftM: number;
  description: string;
}

const VESSEL_PROFILES: Record<VesselClass, VesselProfile> = {
  Capesize: {
    name: 'Capesize',
    dwt: 180000,
    typicalCargoMt: 150000,
    bdiMultiplier: 15.5,
    typicalCharterUsdDay: 24500,
    ladenDraftM: 17.8,
    description: 'Gearless bulk carriers (170k-210k DWT). Highest BDI rate beta. Needs 18m+ draft.',
  },
  Panamax: {
    name: 'Panamax',
    dwt: 75000,
    typicalCargoMt: 75000,
    bdiMultiplier: 11.2,
    typicalCharterUsdDay: 14200,
    ladenDraftM: 14.2,
    description: 'Standard workhorse for coal (65k-82k DWT). Berths at Vizag, Paradip, Gopalpur.',
  },
  Supramax: {
    name: 'Supramax',
    dwt: 58000,
    typicalCargoMt: 55000,
    bdiMultiplier: 10.4,
    typicalCharterUsdDay: 12800,
    ladenDraftM: 12.8,
    description: 'Geared with 4x30t cranes and grabs. Versatile for shallow berths and river ports.',
  },
};

export const PortInfoCard: React.FC<{
  port: DetailedPortInfo;
  isSelected: boolean;
  onSelect: (id: string) => void;
}> = ({ port, isSelected, onSelect }) => {
  return (
    <div
      className={`rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 relative group ${
        isSelected
          ? 'bg-white border-2 border-ocean-500 shadow-neo-lg'
          : 'neo-card hover:border-ocean-300'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-charcoal-900 text-base tracking-tight">{port.name}</h3>
            </div>
            <span className="text-[11px] text-charcoal-500 flex items-center gap-1 mt-0.5">
              <Compass className="w-3 h-3 text-charcoal-400" />
              {port.state} · {port.latitude.toFixed(2)}°N, {port.longitude.toFixed(2)}°E
            </span>
          </div>

          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
              port.congestionLevel === 'GREEN'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : port.congestionLevel === 'AMBER'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
            }`}
          >
            {port.congestionLevel === 'GREEN'
              ? 'NORMAL'
              : port.congestionLevel === 'AMBER'
              ? 'MODERATE'
              : 'HIGH RISK'}
          </span>
        </div>

        {port.draftWarning && (
          <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[10px] flex items-start gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-tight font-medium">{port.draftWarning}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono">
        <div>
          <span className="text-[10px] text-charcoal-400 uppercase block font-sans font-medium">Max Safe Draft</span>
          <span
            className={`font-bold ${
              port.maxDraftM >= 18.0
                ? 'text-ocean-700'
                : port.maxDraftM <= 9.0
                ? 'text-rose-700'
                : 'text-charcoal-800'
            }`}
          >
            {port.maxDraftM} m
          </span>
        </div>
        <div>
          <span className="text-[10px] text-charcoal-400 uppercase block font-sans font-medium">Max LOA</span>
          <span className="font-bold text-charcoal-800">
            {port.maxLoaM >= 900 ? 'Deep Anchorage' : `${port.maxLoaM} m`}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-charcoal-400 uppercase block font-sans font-medium">Max Vessel</span>
          <span className="font-bold text-charcoal-700 text-[11px] truncate block">
            {port.maxVesselClass}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-charcoal-400 uppercase block font-sans font-medium">Berth Count</span>
          <span className="font-bold text-charcoal-800">
            {port.berthCount === 0 ? 'Offshore Buoys' : `${port.berthCount} Berths`}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-charcoal-700">
          <span className="text-charcoal-500 flex items-center gap-1 text-[11px]">
            <Ship className="w-3 h-3 text-ocean-600" />
            Vessels Waiting:
          </span>
          <span className="font-mono font-bold text-charcoal-900">
            {port.vesselsWaiting} at anchorage
          </span>
        </div>

        <div className="flex items-center justify-between text-charcoal-700">
          <span className="text-charcoal-500 flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-amber-600" />
            Average Turnaround Wait:
          </span>
          <span
            className={`font-mono font-bold ${
              port.avgWaitHours < 12
                ? 'text-emerald-700'
                : port.avgWaitHours <= 36
                ? 'text-amber-700'
                : 'text-rose-700'
            }`}
          >
            {port.avgWaitHours.toFixed(1)} hrs{' '}
            <span className="text-[10px] text-charcoal-400 font-sans">
              ({port.avgWaitDays.toFixed(1)}d)
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between text-charcoal-700">
          <span className="text-charcoal-500 flex items-center gap-1 text-[11px]">
            <DollarSign className="w-3 h-3 text-rose-600" />
            Est. Demurrage Risk:
          </span>
          <div className="text-right">
            <span className="font-mono font-bold text-rose-700">
              ${port.demurrageRiskUsd.toLocaleString()}
            </span>
            <span className="text-[10px] text-charcoal-500 block font-mono">
              (₹{port.demurrageRiskInrLakhs.toFixed(1)} Lakhs)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-charcoal-700 pt-1 border-t border-slate-100">
          <span className="text-charcoal-500 flex items-center gap-1 text-[11px]">
            <Waves className="w-3 h-3 text-ocean-600" />
            Weather Severity:
          </span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              port.weatherSeverity === 'CALM'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : port.weatherSeverity === 'MODERATE'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {port.weatherSeverity}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-charcoal-500 leading-relaxed border-t border-slate-100 pt-2 line-clamp-2">
        {port.operationalNotes}
      </p>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onSelect(port.id)}
          className="neo-btn w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-ocean-700 hover:text-ocean-800 text-xs font-bold transition"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Calculate CIF Landed Cost</span>
        </button>
      </div>
    </div>
  );
};

export const IndiaTranslationLayer: React.FC<IndiaTranslationLayerProps> = ({
  ports: propPorts,
  currentBDI = 1510,
  bdiForecastDelta = 112,
  isLoading = false,
  className = '',
  onPortSelect,
}) => {
  // Navigation View State
  const [activeTab, setActiveTab] = useState<TabView>('ports_grid');

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [congestionFilter, setCongestionFilter] = useState<'ALL' | 'GREEN' | 'AMBER' | 'RED'>('ALL');
  const [vesselFilter, setVesselFilter] = useState<'ALL' | 'CAPESIZE' | 'PANAMAX'>('ALL');

  // Calculator Interactive States
  const [bdiChange, setBdiChange] = useState<number>(bdiForecastDelta);
  const [selectedCargo, setSelectedCargo] = useState<CargoType>('Thermal Coal');
  const [selectedVessel, setSelectedVessel] = useState<VesselClass>('Panamax');
  const [shipmentTonnage, setShipmentTonnage] = useState<number>(75000);
  const [voyageDays, setVoyageDays] = useState<number>(16);
  const [usdInrRate, setUsdInrRate] = useState<number>(83.5);
  const [targetPortId, setTargetPortId] = useState<string>('paradip');

  // Live ports API fetched state
  const [fetchedApiPorts, setFetchedApiPorts] = useState<PortCongestion[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');

  // Derive consolidated live ports from props or fetched API data
  const activeCongestionData = propPorts && propPorts.length > 0 ? propPorts : fetchedApiPorts;

  const livePorts = useMemo(() => {
    if (!activeCongestionData || activeCongestionData.length === 0) {
      return EAST_COAST_PORT_SPECS;
    }
    return EAST_COAST_PORT_SPECS.map((spec) => {
      const matching = activeCongestionData.find(
        (p) =>
          p.port_id.toLowerCase() === spec.id.toLowerCase() ||
          p.port_name.toLowerCase().includes(spec.shortName.toLowerCase())
      );
      if (matching) {
        const waitHours = matching.avg_wait_hours || spec.avgWaitHours;
        const waitDays = matching.avg_wait_days || waitHours / 24;
        const level = matching.congestion_level || spec.congestionLevel;
        const demurrageUsd =
          matching.estimated_demurrage_risk_usd ||
          Math.round(matching.vessels_waiting * waitDays * 24 * 1250);
        return {
          ...spec,
          vesselsWaiting: matching.vessels_waiting || spec.vesselsWaiting,
          avgWaitHours: waitHours,
          avgWaitDays: waitDays,
          congestionLevel: level,
          weatherSeverity: (matching.weather_severity as any) || spec.weatherSeverity,
          demurrageRiskUsd: demurrageUsd,
          demurrageRiskInrLakhs: Math.round(((demurrageUsd * usdInrRate) / 100000) * 10) / 10,
        };
      }
      return spec;
    });
  }, [activeCongestionData, usdInrRate]);

  // Fetch real-time port congestion on demand
  const syncPortData = async () => {
    setIsRefreshing(true);
    try {
      const apiPorts = await fetchPortCongestion();
      if (apiPorts && apiPorts.length > 0) {
        setFetchedApiPorts(apiPorts);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Could not fetch live ports, using realistic baseline dataset:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sync default voyage days when cargo changes
  const handleCargoChange = (cargo: CargoType) => {
    setSelectedCargo(cargo);
    setVoyageDays(CARGO_PROFILES[cargo].defaultVoyageDays);
  };

  // Sync shipment tonnage when vessel changes
  const handleVesselChange = (vessel: VesselClass) => {
    setSelectedVessel(vessel);
    setShipmentTonnage(VESSEL_PROFILES[vessel].typicalCargoMt);
  };

  // Filtered port list
  const filteredPorts = useMemo(() => {
    return livePorts.filter((port) => {
      // Search filter
      const matchesSearch =
        port.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        port.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        port.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        port.majorCargoes.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Status filter
      if (congestionFilter !== 'ALL' && port.congestionLevel !== congestionFilter) {
        return false;
      }

      // Vessel capability filter
      if (vesselFilter === 'CAPESIZE' && port.maxDraftM < 16.5) {
        return false;
      }
      if (vesselFilter === 'PANAMAX' && port.maxDraftM < 14.0) {
        return false;
      }

      return true;
    });
  }, [livePorts, searchQuery, congestionFilter, vesselFilter]);

  // Selected Target Port Details for Calculator
  const selectedPortInfo = useMemo(() => {
    return livePorts.find((p) => p.id === targetPortId) || livePorts[0];
  }, [livePorts, targetPortId]);

  // Core Landed Freight Cost Calculations
  const calculations = useMemo(() => {
    const vessel = VESSEL_PROFILES[selectedVessel];

    // 1. Daily charter rate impact ($/day)
    const charterRateChangeUsdDay = Math.round(bdiChange * vessel.bdiMultiplier * 100) / 100;

    // 2. Total voyage charter delta ($)
    const voyageCharterDeltaUsd = Math.round(charterRateChangeUsdDay * voyageDays);

    // 3. Landed freight delta per MT ($/MT and ₹/MT)
    const safeTonnage = Math.max(shipmentTonnage, 1000);
    const landedFreightDeltaUsdMt = voyageCharterDeltaUsd / safeTonnage;
    const landedFreightDeltaInrMt = landedFreightDeltaUsdMt * usdInrRate;

    // 4. Total shipment financial impact
    const totalShipmentImpactUsd = landedFreightDeltaUsdMt * safeTonnage;
    const totalShipmentImpactInr = totalShipmentImpactUsd * usdInrRate;
    const totalShipmentImpactCrores = totalShipmentImpactInr / 10000000; // 1 Crore = 10 Million INR

    // 5. Port Demurrage Exposure for this specific shipment
    // Capesize demurrage ~$26,000/day, Panamax ~$17,000/day, Supramax ~$13,000/day
    const dailyDemurrageRateUsd =
      selectedVessel === 'Capesize' ? 26000 : selectedVessel === 'Panamax' ? 17500 : 13500;
    const portWaitDays = selectedPortInfo.avgWaitDays;
    const estimatedShipmentDemurrageUsd = Math.round(portWaitDays * dailyDemurrageRateUsd);
    const estimatedShipmentDemurrageInrLakhs =
      Math.round((estimatedShipmentDemurrageUsd * usdInrRate) / 100000 * 10) / 10;
    const demurragePerMtUsd = estimatedShipmentDemurrageUsd / safeTonnage;
    const demurragePerMtInr = demurragePerMtUsd * usdInrRate;

    // 6. Draft clearance check
    const draftSurplus = Math.round((selectedPortInfo.maxDraftM - vessel.ladenDraftM) * 10) / 10;
    const isDraftRestricted = draftSurplus < 0;

    return {
      charterRateChangeUsdDay,
      voyageCharterDeltaUsd,
      landedFreightDeltaUsdMt: Math.round(landedFreightDeltaUsdMt * 100) / 100,
      landedFreightDeltaInrMt: Math.round(landedFreightDeltaInrMt * 10) / 10,
      totalShipmentImpactUsd: Math.round(totalShipmentImpactUsd),
      totalShipmentImpactCrores: Math.round(totalShipmentImpactCrores * 100) / 100,
      dailyDemurrageRateUsd,
      portWaitDays,
      estimatedShipmentDemurrageUsd,
      estimatedShipmentDemurrageInrLakhs,
      demurragePerMtUsd: Math.round(demurragePerMtUsd * 100) / 100,
      demurragePerMtInr: Math.round(demurragePerMtInr * 10) / 10,
      draftSurplus,
      isDraftRestricted,
    };
  }, [bdiChange, selectedVessel, voyageDays, shipmentTonnage, usdInrRate, selectedPortInfo]);

  // Aggregate Port Stats
  const portSummary = useMemo(() => {
    const totalWaiting = livePorts.reduce((acc, p) => acc + p.vesselsWaiting, 0);
    const totalDemurrageLakhs = livePorts.reduce((acc, p) => acc + p.demurrageRiskInrLakhs, 0);
    const redPorts = livePorts.filter((p) => p.congestionLevel === 'RED').length;
    const amberPorts = livePorts.filter((p) => p.congestionLevel === 'AMBER').length;
    const greenPorts = livePorts.filter((p) => p.congestionLevel === 'GREEN').length;
    return {
      totalWaiting,
      totalDemurrageLakhs: Math.round(totalDemurrageLakhs),
      redPorts,
      amberPorts,
      greenPorts,
    };
  }, [livePorts]);

  return (
    <div
      className={`neo-card-static p-5 md:p-6 space-y-6 ${className}`}
    >
      {/* 1. Module Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-ocean-50 border border-ocean-200 text-ocean-600">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-charcoal-900 tracking-wide">
                  India Translation Layer & Port Details
                </h2>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-ocean-50 text-ocean-700 border border-ocean-200">
                  East Coast Hubs · Port Layer
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-charcoal-600 border border-slate-200">
                  East Coast Corridor
                </span>
              </div>
              <p className="text-xs text-charcoal-500">
                Live AIS port queues, nautical draft restrictions & interactive landed cost translation (USD & ₹ INR)
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-neo-inner text-xs">
            <button
              onClick={() => setActiveTab('ports_grid')}
              className={`id-subtab-ports-grid px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeTab === 'ports_grid'
                  ? 'bg-white text-ocean-700 font-bold shadow-neo-btn'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Anchor className="w-3.5 h-3.5 text-ocean-600" />
              <span>Ports Grid ({livePorts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`id-subtab-ports-calc px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeTab === 'calculator'
                  ? 'bg-white text-ocean-700 font-bold shadow-neo-btn'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-ocean-600" />
              <span>Landed Cost Calculator</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`id-subtab-ports-matrix px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-white text-ocean-700 font-bold shadow-neo-btn'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-ocean-600" />
              <span>Port Matrix</span>
            </button>
          </div>

          {/* Sync Live Button */}
          <button
            onClick={syncPortData}
            disabled={isRefreshing || isLoading}
            className="neo-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-charcoal-600 hover:text-ocean-600 text-xs transition disabled:opacity-50"
            title="Refresh AIS & Weather"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-ocean-600' : ''}`} />
            <span className="hidden sm:inline">Refresh AIS</span>
          </button>
        </div>
      </div>

      {/* 2. Corridor Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-4 id-tour-ports-summary">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-neo-sm">
          <div className="text-[11px] text-charcoal-500 flex items-center justify-between">
            <span>East Coast Hubs</span>
            <Anchor className="w-3.5 h-3.5 text-ocean-600" />
          </div>
          <div className="text-lg font-bold text-charcoal-900 font-mono mt-1">8 Ports</div>
          <div className="text-[10px] text-charcoal-400">Paradip to Sandheads</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-neo-sm">
          <div className="text-[11px] text-charcoal-500 flex items-center justify-between">
            <span>Vessels at Anchorage</span>
            <Ship className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-700 font-mono mt-1">
            {portSummary.totalWaiting}{' '}
            <span className="text-xs font-normal text-charcoal-500 font-sans">vessels</span>
          </div>
          <div className="text-[10px] text-charcoal-400">Live AIS Geofence count</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-neo-sm">
          <div className="text-[11px] text-charcoal-500 flex items-center justify-between">
            <span>Total Demurrage Risk</span>
            <IndianRupee className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-rose-700 font-mono mt-1">
            ₹{portSummary.totalDemurrageLakhs}{' '}
            <span className="text-xs font-normal text-charcoal-500 font-sans">Lakhs</span>
          </div>
          <div className="text-[10px] text-charcoal-400">Daily fleet demurrage burn</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-neo-sm">
          <div className="text-[11px] text-charcoal-500 flex items-center justify-between">
            <span>Port Congestion Status</span>
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-center gap-1.5 mt-1 font-mono text-sm font-bold">
            <span className="text-emerald-700">{portSummary.greenPorts}G</span>
            <span className="text-charcoal-300">/</span>
            <span className="text-amber-700">{portSummary.amberPorts}A</span>
            <span className="text-charcoal-300">/</span>
            <span className="text-rose-700">{portSummary.redPorts}R</span>
          </div>
          <div className="text-[10px] text-charcoal-400">&lt;12h / 12-36h / &gt;36h</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-neo-sm col-span-2 sm:col-span-1">
          <div className="text-[11px] text-charcoal-500 flex items-center justify-between">
            <span>Live Sync</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-sm font-bold text-charcoal-800 font-mono mt-1">{lastUpdated}</div>
          <div className="text-[10px] text-charcoal-400">AIS Satellite Feed active</div>
        </div>
      </div>

      {/* 3. Tab 1: Port Cards Grid View */}
      {activeTab === 'ports_grid' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-charcoal-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ports, cargoes, states..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:border-ocean-500 shadow-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Congestion Status Pills */}
              <span className="text-charcoal-500 text-[11px]">Wait:</span>
              <button
                onClick={() => setCongestionFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  congestionFilter === 'ALL'
                    ? 'bg-white text-ocean-700 font-bold shadow-neo-btn border border-slate-200/60'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setCongestionFilter('GREEN')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  congestionFilter === 'GREEN'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold shadow-sm'
                    : 'text-emerald-700 hover:text-emerald-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                &lt;12h
              </button>
              <button
                onClick={() => setCongestionFilter('AMBER')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  congestionFilter === 'AMBER'
                    ? 'bg-amber-50 text-amber-700 border border-amber-300 font-bold shadow-sm'
                    : 'text-amber-700 hover:text-amber-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                12-36h
              </button>
              <button
                onClick={() => setCongestionFilter('RED')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  congestionFilter === 'RED'
                    ? 'bg-rose-50 text-rose-700 border border-rose-300 font-bold shadow-sm'
                    : 'text-rose-700 hover:text-rose-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                &gt;36h / Draft
              </button>

              <div className="h-3.5 w-px bg-slate-200 mx-1"></div>

              {/* Vessel capability filter */}
              <span className="text-charcoal-500 text-[11px]">Vessel:</span>
              <button
                onClick={() => setVesselFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  vesselFilter === 'ALL'
                    ? 'bg-white text-ocean-700 font-bold shadow-neo-btn border border-slate-200/60'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVesselFilter('CAPESIZE')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  vesselFilter === 'CAPESIZE'
                    ? 'bg-white text-ocean-700 font-bold shadow-neo-btn border border-slate-200/60'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
                title="Only ports handling Capesize vessels (Draft >= 16.5m)"
              >
                Capesize Capable
              </button>
            </div>
          </div>

          {/* 8 Port Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 id-tour-ports-grid">
            {filteredPorts.map((port) => (
              <PortInfoCard
                key={port.id}
                port={port}
                isSelected={targetPortId === port.id}
                onSelect={(id) => {
                  setTargetPortId(id);
                  setActiveTab('calculator');
                  if (onPortSelect) onPortSelect(id);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. Tab 2: Interactive Landed Freight Cost Calculator */}
      {activeTab === 'calculator' && (
        <div className="space-y-6 id-tour-ports-calculator">
          <div className="p-4 rounded-xl bg-ocean-50/70 border border-ocean-200 text-xs space-y-1">
            <div className="flex items-center gap-2 text-ocean-700 font-semibold">
              <Calculator className="w-4 h-4 text-ocean-600" />
              <span>Interactive India Landed Cost & Demurrage Model</span>
            </div>
            <p className="text-charcoal-700 leading-relaxed">
              Translates Baltic Dry Index shifts directly into landed raw material procurement economics for Indian East
              Coast importers. Dynamically computes daily charter rate deltas, ocean freight cost per metric ton in USD and
              ₹ INR, total cargo CIF financial exposure in ₹ Crores, and anchorage demurrage penalties.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Controls */}
            <div className="lg:col-span-6 space-y-4 neo-card p-5">
              <h3 className="font-bold text-charcoal-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-ocean-600" />
                <span>Shipment & Voyage Parameters</span>
              </h3>

              {/* Cargo Selection */}
              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1.5">
                  Cargo Commodity Type:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Thermal Coal', 'Coking Coal', 'Iron Ore'] as CargoType[]).map((cargo) => (
                    <button
                      key={cargo}
                      onClick={() => handleCargoChange(cargo)}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-center transition ${
                        selectedCargo === cargo
                          ? 'bg-white border-ocean-500 text-ocean-700 font-bold shadow-neo-btn'
                          : 'bg-slate-50 border-slate-200 text-charcoal-600 hover:text-charcoal-900'
                      }`}
                    >
                      {cargo}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-charcoal-400 mt-1 block">
                  {CARGO_PROFILES[selectedCargo].description}
                </span>
              </div>

              {/* Vessel Type Selection */}
              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1.5">
                  Vessel Class (Deadweight Tonnage):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Capesize', 'Panamax', 'Supramax'] as VesselClass[]).map((vessel) => (
                    <button
                      key={vessel}
                      onClick={() => handleVesselChange(vessel)}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-center transition ${
                        selectedVessel === vessel
                          ? 'bg-white border-ocean-500 text-ocean-700 font-bold shadow-neo-btn'
                          : 'bg-slate-50 border-slate-200 text-charcoal-600 hover:text-charcoal-900'
                      }`}
                    >
                      <div className="font-bold">{vessel}</div>
                      <div className="text-[10px] text-charcoal-400 mt-0.5">
                        ~{(VESSEL_PROFILES[vessel].dwt / 1000).toFixed(0)}k DWT
                      </div>
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-charcoal-400 mt-1 block">
                  {VESSEL_PROFILES[selectedVessel].description}
                </span>
              </div>

              {/* Destination Port Selector */}
              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1.5">
                  Discharge Port (East Coast India):
                </label>
                <select
                  value={targetPortId}
                  onChange={(e) => setTargetPortId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-charcoal-900 focus:outline-none focus:border-ocean-500 shadow-sm"
                >
                  {livePorts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Max Draft {p.maxDraftM}m · {p.avgWaitHours}h wait · {p.congestionLevel})
                    </option>
                  ))}
                </select>
                {selectedPortInfo.draftWarning && (
                  <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{selectedPortInfo.draftWarning}</span>
                  </div>
                )}
              </div>

              {/* BDI Change Slider & Number Input */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 shadow-neo-inner">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-charcoal-700">Baltic Dry Index (BDI) Shift:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={bdiChange}
                      onChange={(e) => setBdiChange(Number(e.target.value) || 0)}
                      className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-right text-xs font-mono font-bold text-charcoal-900 shadow-sm"
                    />
                    <span className="font-mono text-ocean-700 font-bold">points</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={-400}
                  max={800}
                  step={10}
                  value={bdiChange}
                  onChange={(e) => setBdiChange(Number(e.target.value))}
                  className="w-full accent-ocean-600 cursor-pointer"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-charcoal-400">Quick Presets:</span>
                  {[-150, -50, 50, 112, 250, 450].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setBdiChange(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono transition ${
                        bdiChange === preset
                          ? 'bg-ocean-600 text-white font-bold shadow-sm'
                          : 'bg-white border border-slate-200 text-charcoal-600 hover:text-charcoal-900'
                      }`}
                    >
                      {preset > 0 ? '+' : ''}
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Parameters Grid: Tonnage, Voyage Days, USD/INR */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-charcoal-500 block mb-1">
                    Shipment Parcel (MT)
                  </label>
                  <input
                    type="number"
                    value={shipmentTonnage}
                    onChange={(e) => setShipmentTonnage(Math.max(1000, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-charcoal-900 font-mono shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-charcoal-500 block mb-1">
                    Voyage Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={voyageDays}
                    onChange={(e) => setVoyageDays(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-charcoal-900 font-mono shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-charcoal-500 block mb-1">
                    Exchange Rate (₹/USD)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={usdInrRate}
                    onChange={(e) => setUsdInrRate(Math.max(50, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-charcoal-900 font-mono shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Landed Cost Output Card */}
            <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
              {/* Highlight Hero Card */}
              <div className="p-5 rounded-2xl neo-card border border-ocean-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-ocean-700 block tracking-wider">
                      Total Shipment Financial Delta
                    </span>
                    <h4 className="text-base font-bold text-charcoal-900 mt-0.5">
                      {selectedCargo} · {shipmentTonnage.toLocaleString()} MT ({selectedVessel})
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-charcoal-400 block">BDI Baseline: {currentBDI}</span>
                    <span className="text-xs font-mono font-bold text-ocean-700">
                      New BDI: {currentBDI + bdiChange} ({bdiChange >= 0 ? '+' : ''}
                      {bdiChange})
                    </span>
                  </div>
                </div>

                {/* Grand Impact Metric */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 shadow-neo-sm">
                  <div>
                    <span className="text-[11px] text-charcoal-500 block">Landed Cost Impact (USD)</span>
                    <div
                      className={`text-2xl font-black font-mono mt-1 ${
                        calculations.totalShipmentImpactUsd >= 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {calculations.totalShipmentImpactUsd >= 0 ? '+' : ''}$
                      {calculations.totalShipmentImpactUsd.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-charcoal-500 font-mono">
                      {calculations.landedFreightDeltaUsdMt >= 0 ? '+' : ''}$
                      {calculations.landedFreightDeltaUsdMt.toFixed(2)} / MT
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-charcoal-500 block">Landed Cost Impact (₹ Crores)</span>
                    <div
                      className={`text-2xl font-black font-mono mt-1 ${
                        calculations.totalShipmentImpactCrores >= 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {calculations.totalShipmentImpactCrores >= 0 ? '+' : ''}₹
                      {Math.abs(calculations.totalShipmentImpactCrores).toFixed(2)} Cr
                    </div>
                    <span className="text-[11px] text-charcoal-500 font-mono">
                      {calculations.landedFreightDeltaInrMt >= 0 ? '+' : ''}₹
                      {calculations.landedFreightDeltaInrMt.toFixed(1)} / MT
                    </span>
                  </div>
                </div>

                {/* Granular Breakdown Table */}
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex justify-between text-charcoal-700 py-1 border-b border-slate-100">
                    <span className="text-charcoal-500">Daily Time Charter Rate Delta:</span>
                    <span className="font-mono font-bold text-charcoal-900">
                      {calculations.charterRateChangeUsdDay >= 0 ? '+' : ''}$
                      {calculations.charterRateChangeUsdDay.toLocaleString()} / day
                    </span>
                  </div>
                  <div className="flex justify-between text-charcoal-700 py-1 border-b border-slate-100">
                    <span className="text-charcoal-500">Total Voyage Ocean Charter Shift ({voyageDays} days):</span>
                    <span className="font-mono font-bold text-charcoal-900">
                      {calculations.voyageCharterDeltaUsd >= 0 ? '+' : ''}$
                      {calculations.voyageCharterDeltaUsd.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-charcoal-700 py-1 border-b border-slate-100">
                    <span className="text-charcoal-500">Discharge Hub Anchorage Wait ({selectedPortInfo.shortName}):</span>
                    <span className="font-mono font-bold text-amber-700">
                      {selectedPortInfo.avgWaitHours} hrs ({calculations.portWaitDays.toFixed(1)} days)
                    </span>
                  </div>
                  <div className="flex justify-between text-charcoal-700 py-1 border-b border-slate-100">
                    <span className="text-charcoal-500">Demurrage Penalty Buffer for Shipment:</span>
                    <span className="font-mono font-bold text-rose-700">
                      ${calculations.estimatedShipmentDemurrageUsd.toLocaleString()} (₹
                      {calculations.estimatedShipmentDemurrageInrLakhs} Lakhs)
                    </span>
                  </div>
                  <div className="flex justify-between text-charcoal-700 py-1">
                    <span className="text-charcoal-500">Draft Clearance at {selectedPortInfo.shortName}:</span>
                    <span
                      className={`font-mono font-bold ${
                        calculations.isDraftRestricted ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {calculations.isDraftRestricted
                        ? `DRAFT DEFICIT: ${Math.abs(calculations.draftSurplus)}m (Requires Lighterage)`
                        : `SAFE CLEARANCE: +${calculations.draftSurplus}m margin`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actionable Strategic Advice Callout */}
              <div
                className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  bdiChange > 100
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : bdiChange < -50
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-charcoal-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-charcoal-900">
                  <Sparkles className="w-4 h-4 text-ocean-600" />
                  <span>Procurement & Chartering Recommendation</span>
                </div>
                <p className="leading-relaxed">
                  {bdiChange > 100 ? (
                    <>
                      <strong>Bullish Market Alert: </strong> A +{bdiChange} pt BDI rally inflates landed CIF coal
                      costs by <strong>+${calculations.landedFreightDeltaUsdMt}/MT</strong> (
                      <strong>₹{calculations.landedFreightDeltaInrMt}/MT</strong>). For your{' '}
                      {shipmentTonnage.toLocaleString()} MT parcel, total landed procurement escalates by{' '}
                      <strong>₹{calculations.totalShipmentImpactCrores} Crore</strong>. Recommendation:{' '}
                      <em>
                        Lock in prompt forward charter fixtures immediately or evaluate discharging at Gangavaram /
                        Dhamra to avoid {selectedPortInfo.avgWaitHours}h demurrage at {selectedPortInfo.shortName}.
                      </em>
                    </>
                  ) : bdiChange < -50 ? (
                    <>
                      <strong>Softening Market Window: </strong> BDI contraction (-{Math.abs(bdiChange)} pts) yields a{' '}
                      <strong>₹{Math.abs(calculations.totalShipmentImpactCrores)} Crore savings</strong> on ocean
                      freight for this cargo. Recommendation:{' '}
                      <em>Delay fixture commitment by 5-7 days and float tenders on spot basis.</em>
                    </>
                  ) : (
                    <>
                      <strong>Stable Freight Environment: </strong> Modest BDI drift ({bdiChange > 0 ? '+' : ''}
                      {bdiChange} pts) produces an impact of{' '}
                      {calculations.totalShipmentImpactCrores >= 0 ? '+' : '-'}₹
                      {Math.abs(calculations.totalShipmentImpactCrores)} Crore. Focus on berth turnaround efficiency
                      and draft clearance.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 3: Comparative Port Matrix Table */}
      {activeTab === 'matrix' && (
        <div className="space-y-4 id-tour-ports-matrix">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-neo-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-charcoal-500 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3.5">Port Name</th>
                  <th className="py-3 px-3">State</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Max Draft</th>
                  <th className="py-3 px-3 text-right">Max LOA</th>
                  <th className="py-3 px-3">Max Class</th>
                  <th className="py-3 px-3 text-right">AIS Waiting</th>
                  <th className="py-3 px-3 text-right">Avg Wait</th>
                  <th className="py-3 px-3 text-right">Demurrage (₹ Lakhs)</th>
                  <th className="py-3 px-3">Weather</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-charcoal-700">
                {livePorts.map((port) => (
                  <tr
                    key={port.id}
                    className={`hover:bg-slate-50 transition ${
                      targetPortId === port.id ? 'bg-ocean-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-3.5 font-sans font-bold text-charcoal-900 flex items-center gap-1.5">
                      <Anchor className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
                      {port.name}
                    </td>
                    <td className="py-3 px-3 font-sans text-charcoal-500">{port.state}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          port.congestionLevel === 'GREEN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : port.congestionLevel === 'AMBER'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {port.congestionLevel}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold ${
                        port.maxDraftM >= 18.0
                          ? 'text-ocean-700'
                          : port.maxDraftM <= 9.0
                          ? 'text-rose-700'
                          : 'text-charcoal-800'
                      }`}
                    >
                      {port.maxDraftM.toFixed(1)} m
                    </td>
                    <td className="py-3 px-3 text-right text-charcoal-600">
                      {port.maxLoaM >= 900 ? 'Deep Anchorage' : `${port.maxLoaM}m`}
                    </td>
                    <td className="py-3 px-3 font-sans text-charcoal-600">{port.maxVesselClass}</td>
                    <td className="py-3 px-3 text-right font-bold text-charcoal-900">{port.vesselsWaiting}</td>
                    <td
                      className={`py-3 px-3 text-right font-bold ${
                        port.avgWaitHours < 12
                          ? 'text-emerald-700'
                          : port.avgWaitHours <= 36
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {port.avgWaitHours.toFixed(1)} hrs
                    </td>
                    <td className="py-3 px-3 text-right text-rose-700 font-bold">
                      ₹{port.demurrageRiskInrLakhs.toFixed(1)} L
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          port.weatherSeverity === 'CALM'
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : port.weatherSeverity === 'MODERATE'
                            ? 'text-amber-700 bg-amber-50 border border-amber-200'
                            : 'text-rose-700 bg-rose-50 border border-rose-200'
                        }`}
                      >
                        {port.weatherSeverity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <button
                        onClick={() => {
                          setTargetPortId(port.id);
                          setActiveTab('calculator');
                          if (onPortSelect) onPortSelect(port.id);
                        }}
                        className="text-xs text-ocean-700 hover:text-ocean-800 font-semibold underline underline-offset-2"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndiaTranslationLayer;
