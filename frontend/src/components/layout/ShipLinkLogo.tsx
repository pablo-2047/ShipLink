import React from 'react';

interface ShipLinkLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  darkTheme?: boolean;
}

export const ShipLinkLogo: React.FC<ShipLinkLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  darkTheme = false,
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-12 h-12',
  }[size];

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-2xl sm:text-3xl',
  }[size];

  const badgeSizes = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
    xl: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Bespoke Geometric Maritime Emblem */}
      <div className={`relative ${iconDimensions} shrink-0`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
        >
          <defs>
            {/* Deep Oceanic Navy to Cobalt Gradient */}
            <linearGradient id="hullPrimary" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Radiant Azure to Cyan Gradient */}
            <linearGradient id="linkCyan" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Glowing Accent Gradient */}
            <linearGradient id="accentGlow" x1="20" y1="4" x2="28" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.3" />
            </linearGradient>

            {/* Hull facets for 3D nautical depth */}
            <linearGradient id="hullPort" x1="14" y1="16" x2="24" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <linearGradient id="hullStarboard" x1="24" y1="16" x2="34" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Background Rounded Shield Frame */}
          <rect width="48" height="48" rx="14" fill="url(#hullPrimary)" />
          
          {/* Subtle Hydrodynamic Background Contour Waves */}
          <path
            d="M6 34C12 32 18 36 24 34C30 32 36 36 42 34"
            stroke="white"
            strokeOpacity="0.15"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M6 39C12 37 18 41 24 39C30 37 36 41 42 39"
            stroke="white"
            strokeOpacity="0.09"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Outer Radar Telemetry Pulse Ring */}
          <circle
            cx="24"
            cy="24"
            r="17"
            stroke="url(#accentGlow)"
            strokeWidth="1.2"
            strokeDasharray="2 3"
            strokeOpacity="0.45"
          />

          {/* Angular Ship Bow / Cutting Keel Structure (Port side facet) */}
          <path
            d="M24 10L14 26C14 26 19 28 24 34V10Z"
            fill="url(#hullPort)"
          />

          {/* Angular Ship Bow / Cutting Keel Structure (Starboard side facet) */}
          <path
            d="M24 10L34 26C34 26 29 28 24 34V10Z"
            fill="url(#hullStarboard)"
          />

          {/* Central Anchor & Interlocking Link Node */}
          <path
            d="M24 18V33M20 27C20 29.2 21.8 31 24 31C26.2 31 28 29.2 28 27"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Golden/Cyan Beacon Star at Bow Peak */}
          <circle cx="24" cy="11" r="2.5" fill="#38bdf8" />
          <circle cx="24" cy="11" r="1.3" fill="#ffffff" />
        </svg>
      </div>

      {/* Brand Typography & Operational Subtitle */}
      <div>
        <div className="flex items-center gap-2.5">
          <span className={`${titleSizes} font-black tracking-tight ${darkTheme ? 'text-white' : 'text-slate-900 dark:text-white'} leading-tight`}>
            Ship<span className="text-sky-500">Link</span>
          </span>
          <span className={`inline-flex items-center gap-1.5 uppercase font-black rounded-full ${
            darkTheme 
              ? 'bg-sky-950 text-sky-300 border border-sky-700/60' 
              : 'bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200/90 dark:border-sky-700/60'
          } tracking-wide ${badgeSizes}`}>
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            SIH 2026
          </span>
        </div>
        {showSubtitle && (
          <p className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'} font-medium leading-none mt-1 whitespace-nowrap hidden sm:block`}>
            India East Coast Maritime Intelligence
          </p>
        )}
      </div>
    </div>
  );
};
