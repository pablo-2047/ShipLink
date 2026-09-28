import axios from 'axios';
import type {
  ForecastResponse,
  LatestBDI,
  PortCongestion,
  VesselTypeSpec,
  CargoInput,
  VesselOptimizationResponse,
  ContractComparison,
  DisruptionPreset,
  ScenarioResponse,
  RiskAlert,
  DisruptionEvent,
} from './types';
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const fetchLatestBDI = async (): Promise<LatestBDI> => {
  const res = await api.get<LatestBDI>('/forecast/latest');
  return res.data;
};

export const fetchForecast = async (horizonDays: number = 30): Promise<ForecastResponse> => {
  const res = await api.post<ForecastResponse>(`/forecast/predict?horizon_days=${horizonDays}`);
  return res.data;
};

export const fetchHistoricalBDI = async (limit: number = 2000) => {
  const res = await api.get(`/forecast/historical?limit=${limit}`);
  return res.data;
};

export const fetchHistoricalEvents = async (): Promise<DisruptionEvent[]> => {
  const res = await api.get<DisruptionEvent[]>('/forecast/events');
  return res.data;
};

export const fetchPortCongestion = async (): Promise<PortCongestion[]> => {
  const res = await api.get<PortCongestion[]>('/ports/congestion-flags');
  return res.data;
};

export const fetchAllPorts = async () => {
  const res = await api.get('/ports/');
  return res.data;
};

export const fetchVesselTypes = async (): Promise<VesselTypeSpec[] | Record<string, VesselTypeSpec>> => {
  const res = await api.get('/vessels/types');
  return res.data;
};

export const optimizeVessel = async (cargo: CargoInput): Promise<VesselOptimizationResponse> => {
  const res = await api.post<VesselOptimizationResponse>('/vessels/optimize', cargo);
  return res.data;
};

export const compareContracts = async (payload: {
  current_rate: number;
  forecast_values: number[];
  voyage_days: number;
  usd_inr_rate?: number;
}): Promise<ContractComparison> => {
  const res = await api.post<ContractComparison>('/vessels/contract-compare', payload);
  return res.data;
};

export const fetchScenarioPresets = async (): Promise<DisruptionPreset[]> => {
  const res = await api.get<DisruptionPreset[]>('/scenarios/presets');
  return res.data;
};

export const simulateScenario = async (payload: any): Promise<ScenarioResponse> => {
  const res = await api.post<ScenarioResponse>('/scenarios/simulate', payload);
  return res.data;
};

export const applyDisruptionPreset = async (presetId: string): Promise<ScenarioResponse> => {
  const res = await api.post<ScenarioResponse>('/scenarios/disruption', { preset_id: presetId });
  return res.data;
};

export const fetchModelPerformance = async (horizon: string = '30d') => {
  const res = await api.get(`/model/performance/${horizon}`);
  return res.data;
};

export const fetchOverallModelPerformance = async () => {
  const res = await api.get('/model/performance');
  return res.data;
};

export const fetchAlerts = async (): Promise<RiskAlert[]> => {
  const res = await api.get<RiskAlert[]>('/alerts/');
  return res.data;
};

export default api;