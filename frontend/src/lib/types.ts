export interface ForecastDataPoint {
  date: string;
  predicted_bdi: number;
  confidence_lower: number;
  confidence_upper: number;
}

export interface ShapFeature {
  feature: string;
  display_name: string;
  impact: number;
  base_value: number;
}

export interface SingleModelMetrics {
  mae: number;
  std_dev: number;
  directional_accuracy: number;
}

export interface MarketEntrySignal {
  signal: 'ENTER_NOW' | 'WAIT' | 'NEUTRAL';
  reason: string;
  estimated_savings_usd?: number;
  optimal_window?: string;
  slope?: number;
}

export interface ForecastResponse {
  current_bdi: number;
  forecast: ForecastDataPoint[];
  model_performance: SingleModelMetrics;
  shap_explanations: ShapFeature[];
  trend_summary: string;
  market_entry: MarketEntrySignal;
  horizon_days?: number;
}

export interface LatestBDI {
  current_bdi: number;
  change_24h: number;
  change_pct: number;
}

export interface PortCongestion {
  port_id: string;
  port_name: string;
  latitude?: number;
  longitude?: number;
  max_draft_m?: number;
  max_loa_m?: number;
  max_vessel_class?: string;
  vessels_waiting: number;
  avg_wait_days: number;
  avg_wait_hours: number;
  congestion_level: 'GREEN' | 'AMBER' | 'RED';
  weather_severity: string;
  operational_impact: string;
  estimated_demurrage_risk_usd: number;
}

export interface VesselTypeSpec {
  id: string;
  name: string;
  dwt_min: number;
  dwt_max: number;
  typical_dwt: number;
  loa_m: number;
  beam_m: number;
  laden_draft_m: number;
  speed_knots: number;
  fuel_consumption_mt_day: number;
  has_gear: boolean;
  typical_charter_rate_usd_day: number;
  description: string;
}

export interface CargoInput {
  cargo_type: string;
  tonnage_mt: number;
  origin_port: string;
  destination_port: string;
  laycan_start: string;
  laycan_end: string;
  contract_type: 'SPOT' | 'SHORT_TERM' | 'MID_TERM';
}

export interface VesselRecommendation {
  vessel_class: string;
  suitability_score: number;
  fits_origin?: boolean;
  fits_destination?: boolean;
  voyages_needed: number;
  estimated_voyage_days: number;
  estimated_fuel_cost_usd: number;
  estimated_charter_cost_usd: number;
  cargo_utilization_pct: number;
  draft_clearance_m: number;
  recommendation_reason?: string;
}

export interface AlternativePort {
  port_name: string;
  reason: string;
  max_vessel_class: string;
}

export interface VesselOptimizationResponse {
  recommended: VesselRecommendation;
  alternatives: VesselRecommendation[];
  warnings: string[];
  alternative_ports: AlternativePort[];
}

export interface ContractComparison {
  spot: { rate_per_day: number; cost_per_voyage: number; total_cost_3_voyages: number };
  short_term: { rate_per_day: number; cost_per_voyage: number; total_cost: number; savings_vs_spot: number };
  mid_term: { rate_per_day: number; cost_per_voyage: number; total_cost: number; savings_vs_spot: number };
  recommendation: 'WAIT_AND_SPOT' | 'LOCK_SHORT_TERM' | 'LOCK_MID_TERM' | string;
  reason: string;
  forecast_trend_slope: number;
}

export interface DisruptionPreset {
  id: string;
  name: string;
  description: string;
  icon?: string;
  adjustments: {
    brent_price_change_pct?: number;
    usd_inr_change_pct?: number;
    bunker_fuel_change_pct?: number;
    iron_ore_demand_change_pct?: number;
    coal_demand_change_pct?: number;
    port_congestion_extra_days?: number;
    tonne_mile_shock_pct?: number;
  };
}

export interface ScenarioResponse {
  base_forecast?: (ForecastDataPoint | number)[];
  adjusted_forecast?: (ForecastDataPoint | number)[];
  base_avg_bdi?: number;
  scenario_avg_bdi?: number;
  delta_bdi: number;
  delta_pct: number;
  shap_explanations?: ShapFeature[];
  cost_impact_usd?: number;
  cost_impact_inr?: number;
  cost_impact_usd_per_day?: number;
  cost_impact_inr_per_day?: number;
  dates?: string[];
}

export interface DisruptionEvent {
  date: string;
  end_date?: string;
  event: string;
  type: string;
  impact: string;
  icon: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  affected_regions?: string[];
  affected_ports?: string[];
  market_consequences?: string;
  bdi_impact_estimate?: string;
  mitigation_strategy?: string;
}

export interface RiskAlert {
  id: string;
  type: string;
  severity: 'High' | 'Medium' | 'Low' | 'CRITICAL' | 'WARNING' | 'INFO';
  title?: string;
  message?: string;
  affected_ports?: string[];
  actionable_recommendation?: string;
}

export interface BenchmarkModelRow {
  name: string;
  architecture: string;
  mae: number;
  residualStdDev: number;
  directionalAccuracy: number;
  isProduction?: boolean;
  notes?: string;
}

export interface HorizonBenchmarkData {
  horizon: '1d' | '7d' | '14d' | '30d';
  label: string;
  description: string;
  models: BenchmarkModelRow[];
}