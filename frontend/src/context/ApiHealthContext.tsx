import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

export type ApiId = 'bdi' | 'forecast' | 'ports' | 'vessels' | 'scenarios';

export interface ApiEndpointConfig {
  id: ApiId;
  name: string;
  shortName: string;
  endpoint: string;
  method: 'GET' | 'POST';
  usedInPages: string[];
}

export const API_REGISTRY: Record<ApiId, ApiEndpointConfig> = {
  bdi: {
    id: 'bdi',
    name: 'Baltic Dry Index (BDI) Telemetry',
    shortName: 'BDI Feed',
    endpoint: '/api/v1/forecast/latest',
    method: 'GET',
    usedInPages: ['Dashboard', 'Historical BDI', 'Header Ticker'],
  },
  forecast: {
    id: 'forecast',
    name: '14-30 Day ML Freight Forecaster',
    shortName: 'ML Forecast',
    endpoint: '/api/v1/forecast/predict?horizon_days=30',
    method: 'POST',
    usedInPages: ['Dashboard', 'Freight Forecast & SHAP', 'Historical Disruption'],
  },
  ports: {
    id: 'ports',
    name: 'East Coast Coastal Port Queue Radar',
    shortName: 'Port Radar',
    endpoint: '/api/v1/ports/congestion-flags',
    method: 'GET',
    usedInPages: ['Dashboard', 'Port Congestion Radar', 'Charter Planner'],
  },
  vessels: {
    id: 'vessels',
    name: 'Naval Vessel Hydrodynamics & Types',
    shortName: 'Vessel Engine',
    endpoint: '/api/v1/vessels/types',
    method: 'GET',
    usedInPages: ['Charter Planner', 'Vessel Optimizer'],
  },
  scenarios: {
    id: 'scenarios',
    name: 'Macroeconomic Crisis Simulation Sandbox',
    shortName: 'Scenario Lab',
    endpoint: '/api/v1/scenarios/presets',
    method: 'GET',
    usedInPages: ['Scenario Lab'],
  },
};

export interface ApiStatusDetail {
  id: ApiId;
  name: string;
  shortName: string;
  status: 'healthy' | 'error' | 'syncing';
  lastSuccessTime: Date | null;
  lastCheckedTime: Date | null;
  latencyMs: number;
  errorMessage?: string;
  httpCode?: number;
}

interface ApiHealthContextType {
  apis: Record<ApiId, ApiStatusDetail>;
  allHealthy: boolean;
  failingApis: ApiStatusDetail[];
  isSyncing: boolean;
  countdown: number;
  lastSyncTime: Date | null;
  refreshAll: () => Promise<void>;
  simulateFailure: (apiId: ApiId, shouldFail: boolean) => void;
  mockFailures: Record<ApiId, boolean>;
}

const ApiHealthContext = createContext<ApiHealthContextType | undefined>(undefined);

export const formatTimeAgo = (date: Date | null): string => {
  if (!date) return '2 hours ago';
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
};

export const ApiHealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize APIs state with healthy defaults
  const [apis, setApis] = useState<Record<ApiId, ApiStatusDetail>>(() => {
    const initial: Partial<Record<ApiId, ApiStatusDetail>> = {};
    const initTime = new Date();
    (Object.keys(API_REGISTRY) as ApiId[]).forEach((id) => {
      initial[id] = {
        id,
        name: API_REGISTRY[id].name,
        shortName: API_REGISTRY[id].shortName,
        status: 'healthy',
        lastSuccessTime: initTime,
        lastCheckedTime: initTime,
        latencyMs: 45,
      };
    });
    return initial as Record<ApiId, ApiStatusDetail>;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [mockFailures, setMockFailures] = useState<Record<ApiId, boolean>>({
    bdi: false,
    forecast: false,
    ports: false,
    vessels: false,
    scenarios: false,
  });

  const simulateFailure = (apiId: ApiId, shouldFail: boolean) => {
    setMockFailures((prev) => ({ ...prev, [apiId]: shouldFail }));
  };

  const checkSingleApi = async (config: ApiEndpointConfig): Promise<ApiStatusDetail> => {
    const startTime = performance.now();
    const id = config.id;

    // Check if simulation failure is toggled for this API
    if (mockFailures[id]) {
      return {
        id,
        name: config.name,
        shortName: config.shortName,
        status: 'error',
        lastSuccessTime: apis[id]?.lastSuccessTime || new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
        lastCheckedTime: new Date(),
        latencyMs: Math.round(performance.now() - startTime),
        errorMessage: 'Connection Refused / Gateway Timeout (504)',
        httpCode: 504,
      };
    }

    try {
      const response = await axios({
        url: config.endpoint,
        method: config.method,
        timeout: 8000,
      });

      const latency = Math.round(performance.now() - startTime);

      if (response.status >= 200 && response.status < 300) {
        return {
          id,
          name: config.name,
          shortName: config.shortName,
          status: 'healthy',
          lastSuccessTime: new Date(),
          lastCheckedTime: new Date(),
          latencyMs: latency,
          httpCode: response.status,
        };
      } else {
        return {
          id,
          name: config.name,
          shortName: config.shortName,
          status: 'error',
          lastSuccessTime: apis[id]?.lastSuccessTime || new Date(Date.now() - 2 * 3600 * 1000),
          lastCheckedTime: new Date(),
          latencyMs: latency,
          errorMessage: `Unexpected HTTP ${response.status}`,
          httpCode: response.status,
        };
      }
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      const code = err.response?.status || 500;
      const msg = err.message || 'Network Timeout';
      return {
        id,
        name: config.name,
        shortName: config.shortName,
        status: 'error',
        lastSuccessTime: apis[id]?.lastSuccessTime || new Date(Date.now() - 2 * 3600 * 1000),
        lastCheckedTime: new Date(),
        latencyMs: latency,
        errorMessage: `${msg} (${code})`,
        httpCode: code,
      };
    }
  };

  const refreshAll = useCallback(async () => {
    setIsSyncing(true);
    const entries = Object.values(API_REGISTRY);

    const results = await Promise.all(entries.map((cfg) => checkSingleApi(cfg)));

    const updatedApis: Record<ApiId, ApiStatusDetail> = { ...apis };
    results.forEach((res) => {
      updatedApis[res.id] = res;
    });

    setApis(updatedApis);
    setLastSyncTime(new Date());
    setCountdown(30);
    setIsSyncing(false);
  }, [apis, mockFailures]);

  // Initial check on mount
  useEffect(() => {
    refreshAll();
  }, []);

  // 1-second countdown clock for the 30-second interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshAll();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshAll]);

  const apiList = Object.values(apis);
  const failingApis = apiList.filter((a) => a.status === 'error');
  const allHealthy = failingApis.length === 0;

  return (
    <ApiHealthContext.Provider
      value={{
        apis,
        allHealthy,
        failingApis,
        isSyncing,
        countdown,
        lastSyncTime,
        refreshAll,
        simulateFailure,
        mockFailures,
      }}
    >
      {children}
    </ApiHealthContext.Provider>
  );
};

export const useApiHealth = () => {
  const context = useContext(ApiHealthContext);
  if (!context) {
    throw new Error('useApiHealth must be used within an ApiHealthProvider');
  }
  return context;
};

/**
 * Reusable Warning Banner that appears when any required API for that component is failing.
 */
export const ApiWarningBanner: React.FC<{
  requiredApis: ApiId[];
  componentName?: string;
  className?: string;
}> = ({ requiredApis, componentName, className = '' }) => {
  const { apis, countdown, refreshAll, isSyncing } = useApiHealth();

  const failingList = requiredApis
    .map((id) => apis[id])
    .filter((a) => a && a.status === 'error');

  if (failingList.length === 0) return null;

  const primaryFailing = failingList[0];
  const lastSuccess = primaryFailing?.lastSuccessTime;
  const timeAgoStr = formatTimeAgo(lastSuccess);

  return (
    <div
      role="alert"
      className={`p-4 mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-300 dark:border-amber-700/90 text-amber-950 dark:text-amber-100 shadow-md shadow-amber-500/10 animate-fadeIn ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 shrink-0 border border-amber-300 dark:border-amber-700">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm text-amber-900 dark:text-amber-100">
                Live Data Feed Warning: {failingList.map((f) => f.shortName).join(' & ')} Failing
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200/90 dark:bg-amber-900 text-amber-900 dark:text-amber-200 uppercase tracking-wider border border-amber-400/50">
                Cached Data Active ({timeAgoStr})
              </span>
            </div>

            <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-medium">
              The live {failingList.map((f) => f.name).join(' & ')} endpoint is currently unreachable or experiencing connection delays.
              {componentName ? ` In this ${componentName}, ` : ' '}
              the metrics and figures displayed are cached from <strong>{timeAgoStr}</strong> to guarantee uninterrupted operations.
              Automated 30-second sync loop retrying in <strong className="font-mono text-amber-950 dark:text-amber-100">{countdown}s</strong>.
            </p>

            <div className="mt-2.5 flex items-center gap-3 text-[11px] text-amber-800 dark:text-amber-300 flex-wrap">
              {failingList.map((f) => (
                <span key={f.id} className="inline-flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>{f.shortName}: {f.errorMessage || 'Timeout'}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => refreshAll()}
          disabled={isSyncing}
          className="shrink-0 p-2 rounded-xl bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-slate-800 border border-amber-300 dark:border-amber-700 transition cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-xs"
          title="Retry all API connections immediately"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Retry Sync</span>
        </button>
      </div>
    </div>
  );
};
