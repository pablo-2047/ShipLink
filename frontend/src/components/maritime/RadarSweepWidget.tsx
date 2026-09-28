import { useState } from 'react';
import { Compass, Anchor, Navigation, Info } from 'lucide-react';
import type { PortCongestion } from '../../lib/types';

interface RadarPortNode {
  id: string;
  name: string;
  shortName: string;
  x: number;
  y: number;
  maxDraft: number;
  vesselsWaiting: number;
  status: 'GREEN' | 'AMBER' | 'RED';
  waveHeight: number;
}

const EAST_COAST_PORTS: RadarPortNode[] = [
  { id: 'haldia', name: 'Haldia Dock Complex', shortName: 'HAL', x: 74, y: 16, maxDraft: 8.5, vesselsWaiting: 12, status: 'RED', waveHeight: 1.2 },
  { id: 'sandheads', name: 'Sandheads Anchorage', shortName: 'SDH', x: 76, y: 32, maxDraft: 15.0, vesselsWaiting: 8, status: 'AMBER', waveHeight: 1.8 },
  { id: 'dhamra', name: 'Dhamra Port', shortName: 'DHM', x: 62, y: 35, maxDraft: 18.5, vesselsWaiting: 4, status: 'GREEN', waveHeight: 1.3 },
  { id: 'paradip', name: 'Paradip Port', shortName: 'PRD', x: 55, y: 46, maxDraft: 16.5, vesselsWaiting: 14, status: 'AMBER', waveHeight: 1.4 },
  { id: 'gopalpur', name: 'Gopalpur Port', shortName: 'GPL', x: 42, y: 62, maxDraft: 14.5, vesselsWaiting: 3, status: 'GREEN', waveHeight: 1.1 },
  { id: 'vizag', name: 'Visakhapatnam Port', shortName: 'VZG', x: 30, y: 78, maxDraft: 18.1, vesselsWaiting: 7, status: 'GREEN', waveHeight: 1.0 },
  { id: 'gangavaram', name: 'Gangavaram Port', shortName: 'GGV', x: 27, y: 83, maxDraft: 18.5, vesselsWaiting: 2, status: 'GREEN', waveHeight: 1.0 },
];

interface RadarSweepWidgetProps {
  portsData?: PortCongestion[];
  onSelectPort?: (portId: string) => void;
}

export function RadarSweepWidget({ portsData, onSelectPort }: RadarSweepWidgetProps) {
  const [selectedPort, setSelectedPort] = useState<RadarPortNode>(EAST_COAST_PORTS[3]);
  const [rangeNm, setRangeNm] = useState<number>(200);

  const ports = EAST_COAST_PORTS.map((p) => {
    const live = portsData?.find((lp) => lp.port_id.toLowerCase().includes(p.id));
    if (live) {
      return {
        ...p,
        vesselsWaiting: live.vessels_waiting,
        status: live.congestion_level,
        maxDraft: live.max_draft_m || p.maxDraft,
      };
    }
    return p;
  });

  return (
    <div className="neo-card p-5 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-ocean-600 border border-sky-100">
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '24s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-charcoal-900 tracking-wider uppercase font-mono">
                COASTAL RADAR & AIS STREAM
              </h3>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-charcoal-500">Bay of Bengal Coastal Roadsteads · 7 Monitored Hubs</p>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-mono shadow-inner">
          {[100, 200, 350].map((r) => (
            <button
              key={r}
              onClick={() => setRangeNm(r)}
              className={`px-2 py-1 rounded-lg transition-all ${
                rangeNm === r ? 'bg-white text-ocean-700 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {r}NM
            </button>
          ))}
        </div>
      </div>

      {/* Circular Radar Canvas */}
      <div className="relative aspect-square max-w-[320px] mx-auto rounded-full bg-[#f0f7ff] border-2 border-sky-200 overflow-hidden shadow-inner">
        {/* Concentric Range Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[85%] h-[85%] rounded-full border border-sky-300/40 border-dashed" />
          <div className="w-[60%] h-[60%] rounded-full border border-sky-300/40" />
          <div className="w-[35%] h-[35%] rounded-full border border-sky-300/40 border-dashed" />
          <div className="w-[12%] h-[12%] rounded-full border border-sky-400/40 bg-sky-100/50" />
          
          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-sky-200" />
          <div className="absolute h-full w-[1px] bg-sky-200" />
          <div className="absolute w-full h-[1px] bg-sky-100 rotate-45" />
          <div className="absolute w-full h-[1px] bg-sky-100 -rotate-45" />
        </div>

        {/* 360° Rotating Radar Sweep Beam */}
        <div className="absolute inset-0 origin-center animate-radar-sweep pointer-events-none gpu-accelerated">
          <div
            className="w-1/2 h-1/2 origin-bottom-right"
            style={{
              background: 'conic-gradient(from 180deg at 100% 100%, rgba(14, 165, 233, 0.35) 0deg, rgba(14, 165, 233, 0.05) 45deg, transparent 70deg)',
            }}
          />
        </div>

        {/* Compass Cardinal Points */}
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-ocean-700 font-bold">000° N</span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-ocean-700 font-bold">180° S</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-ocean-700 font-bold">090° E</span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-ocean-700 font-bold">270° W</span>

        {/* Port Blips on Radar */}
        {ports.map((port) => {
          const isSelected = selectedPort.id === port.id;
          const statusColor =
            port.status === 'RED'
              ? 'bg-rose-500 text-white border-rose-400'
              : port.status === 'AMBER'
              ? 'bg-amber-500 text-white border-amber-400'
              : 'bg-emerald-500 text-white border-emerald-400';

          return (
            <button
              key={port.id}
              onClick={() => {
                setSelectedPort(port);
                if (onSelectPort) onSelectPort(port.id);
              }}
              style={{ left: `${port.x}%`, top: `${port.y}%` }}
              aria-label={`${port.name}: ${port.vesselsWaiting} waiting vessels`}
              className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 focus:outline-none touch-action-manipulation p-2 -m-2 cursor-pointer"
              title={`${port.name} (${port.vesselsWaiting} waiting bulkers)`}
            >
              <div
                className={`absolute -inset-1.5 rounded-full opacity-60 animate-sonar-ping gpu-accelerated pointer-events-none ${
                  port.status === 'RED' ? 'bg-rose-400' : port.status === 'AMBER' ? 'bg-amber-400' : 'bg-ocean-400'
                }`}
              />

              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-125 shadow-sm ${
                  isSelected ? 'ring-2 ring-ocean-600 scale-125' : ''
                } ${statusColor}`}
              >
                <span className="text-[7px] font-bold font-mono">{port.vesselsWaiting}</span>
              </div>

              <span
                className={`absolute left-6 -top-1 text-[9px] font-mono font-bold whitespace-nowrap px-1 rounded shadow-sm transition pointer-events-none ${
                  isSelected
                    ? 'bg-ocean-600 text-white'
                    : 'bg-white text-charcoal-700 border border-slate-200'
                }`}
              >
                {port.shortName}
              </span>
            </button>
          );
        })}

        {/* Ownship Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Navigation className="w-3.5 h-3.5 text-ocean-600 rotate-45" />
        </div>
      </div>

      {/* Selected Port Telemetry Card */}
      <div className="neo-well p-3 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-charcoal-900">
            <Anchor className="w-3.5 h-3.5 text-ocean-600" />
            <span>{selectedPort.name}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              selectedPort.status === 'RED'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : selectedPort.status === 'AMBER'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {selectedPort.status === 'RED' ? 'CRITICAL DRAFT / QUEUE' : selectedPort.status === 'AMBER' ? 'MODERATE DELAY' : 'CLEAR BASIN'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-500 block font-sans">Anchored Bulkers</span>
            <span className="font-bold text-charcoal-900">{selectedPort.vesselsWaiting} Vessels</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-500 block font-sans">Max Safe Draft</span>
            <span className={`font-bold ${selectedPort.maxDraft < 10 ? 'text-rose-600' : 'text-ocean-600'}`}>
              {selectedPort.maxDraft}m
            </span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-500 block font-sans">Wave Swell</span>
            <span className="font-bold text-charcoal-700">{selectedPort.waveHeight}m</span>
          </div>
        </div>

        {selectedPort.id === 'haldia' && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-2 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <span>
              <strong>Draft Restriction (8.5m):</strong> River lock sill prohibits laden Capesize and Panamax. Divert to Dhamra (18.5m) or lighter offshore at Sandheads.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
