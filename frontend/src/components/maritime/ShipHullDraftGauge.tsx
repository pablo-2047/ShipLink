import { AlertTriangle, CheckCircle, ShieldAlert, Waves, Anchor } from 'lucide-react';

interface ShipHullDraftGaugeProps {
  vesselClass: string;
  vesselDraft: number;
  portName: string;
  portMaxDraft: number;
  dwt: number;
}

export function ShipHullDraftGauge({
  vesselClass,
  vesselDraft,
  portName,
  portMaxDraft,
  dwt,
}: ShipHullDraftGaugeProps) {
  const ukc = Number((portMaxDraft - vesselDraft).toFixed(2));
  const isViolation = ukc < 0;
  const isTight = ukc >= 0 && ukc < 1.0;

  const maxScale = 22.0;
  const vesselDraftPct = Math.min(100, (vesselDraft / maxScale) * 100);
  const portDraftPct = Math.min(100, (portMaxDraft / maxScale) * 100);

  return (
    <div className="neo-card p-5 space-y-4">
      {/* Header & Status */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Anchor className="w-4 h-4 text-ocean-600" />
          <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider font-mono">
            HYDRODYNAMIC DRAFT & KEEL CLEARANCE INSPECTOR
          </h4>
        </div>
        <span
          className={`px-3 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm ${
            isViolation
              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
              : isTight
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}
        >
          {isViolation ? (
            <>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>DRAFT BREACH (GROUNDING RISK)</span>
            </>
          ) : isTight ? (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>MARGINAL UNDER-KEEL CLEARANCE</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>SAFE BERTHING PASS</span>
            </>
          )}
        </span>
      </div>

      {/* Visual Cross-Section Diagram in Daylight Coastal Style */}
      <div className="relative h-48 bg-gradient-to-b from-sky-50/50 via-sky-100/40 to-blue-100/60 rounded-xl border border-sky-200/80 overflow-hidden flex flex-col justify-between p-3 font-mono shadow-inner">
        {/* Air Draft Freeboard */}
        <div className="h-8 flex items-center justify-between text-[11px] text-slate-500 z-10 font-sans font-medium">
          <span>AIR DRAFT / FREEBOARD</span>
          <span>{vesselClass} ({dwt.toLocaleString()} DWT)</span>
        </div>

        {/* Sea Surface Waterline */}
        <div className="absolute top-9 left-0 right-0 h-0.5 bg-ocean-500/80 flex items-center justify-between px-3 text-[10px] text-ocean-800 font-bold z-20">
          <div className="flex items-center gap-1">
            <Waves className="w-3.5 h-3.5 text-ocean-600 animate-pulse" />
            <span>0.0m MEAN SEA WATERLINE</span>
          </div>
          <span>CHART DATUM (CD)</span>
        </div>

        {/* Ship Hull Silhouette floating in water */}
        <div
          className={`absolute top-9 left-1/4 right-1/4 border-2 rounded-b-3xl transition-all duration-500 flex flex-col items-center justify-end pb-2 z-10 ${
            isViolation
              ? 'bg-rose-100 border-rose-500 shadow-md'
              : 'bg-white border-ocean-600 shadow-md'
          }`}
          style={{ height: `${vesselDraftPct * 1.4}px` }}
        >
          <span className="text-[10px] text-charcoal-700 font-bold">{vesselClass} Midship</span>
          <span className={`text-xs font-bold ${isViolation ? 'text-rose-700' : 'text-ocean-700'}`}>
            Keel Depth: {vesselDraft}m
          </span>
        </div>

        {/* Port Maximum Permissible Draft Depth Line */}
        <div
          className={`absolute left-0 right-0 border-t-2 border-dashed z-20 flex items-center justify-between px-3 text-[10px] font-bold ${
            isViolation ? 'border-rose-500 text-rose-800' : 'border-emerald-600 text-emerald-800'
          }`}
          style={{ top: `${36 + portDraftPct * 1.4}px` }}
        >
          <span>PORT SILL LIMIT: {portName} ({portMaxDraft}m)</span>
          <span>{portName.toLowerCase().includes('haldia') ? '8.5m RIVER CAPPED' : 'SAFE BASIN'}</span>
        </div>

        {/* Under Keel Clearance (UKC) Callout */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs z-10 pt-2 border-t border-sky-200/80">
          <span className="text-slate-600 font-sans font-medium">Under-Keel Clearance (UKC):</span>
          <span
            className={`font-bold font-mono px-2.5 py-0.5 rounded shadow-sm ${
              isViolation
                ? 'bg-rose-600 text-white'
                : isTight
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {ukc >= 0 ? `+${ukc}m SAFE CLEARANCE` : `${ukc}m GROUNDING BREACH`}
          </span>
        </div>
      </div>

      {/* Actionable Advice Banner */}
      {isViolation ? (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-rose-800">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>CRITICAL DRAFT INCOMPATIBILITY DETECTED</span>
          </div>
          <p className="text-[11px] leading-relaxed text-rose-800">
            {vesselClass} draft ({vesselDraft}m) exceeds {portName} permissible depth ({portMaxDraft}m) by {Math.abs(ukc)}m.
            Direct berthing will cause bottom grounding or severe demurrage penalties. <strong>Required playbooks:</strong>
          </p>
          <ul className="list-disc list-inside text-[11px] text-rose-800 pt-1 space-y-0.5 font-medium">
            <li>Lighter cargo at <strong>Sandheads Anchorage</strong> onto daughter barges.</li>
            <li>Divert directly to deepwater berths at <strong>Dhamra Port (18.5m draft)</strong> or <strong>Gangavaram (18.5m draft)</strong>.</li>
            <li>Parcel cargo into 2× shallow-draft <strong>Supramax (13.0m draft)</strong> vessels.</li>
          </ul>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {vesselClass} draft ({vesselDraft}m) provides {ukc}m of safe under-keel clearance at {portName}. Tidal window compliant.
          </span>
        </div>
      )}
    </div>
  );
}
