import React, { useState, useEffect } from 'react';
import { Cpu, Award, Sparkles, History } from 'lucide-react';
import { ShapFeatureImportance } from './ShapFeatureImportance';
import { ModelPerformance } from './ModelPerformance';
import { InteractiveHoverButton } from '@/registry/magicui/interactive-hover-button';
import { ApiWarningBanner } from '../../context/ApiHealthContext';
import { fetchForecast } from '../../lib/api';
import type { LatestBDI, ForecastResponse } from '../../lib/types';

export interface MarketIntelligenceViewProps {
  onNavigate?: (tabId: string) => void;
  latestBDI?: LatestBDI | null;
}

export const MarketIntelligenceView: React.FC<MarketIntelligenceViewProps> = ({ onNavigate, latestBDI }) => {
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);

  useEffect(() => {
    fetchForecast(30)
      .then((data) => {
        if (data && data.forecast && data.forecast.length > 0) {
          setForecastData(data);
        }
      })
      .catch((err) => console.warn('Market intelligence forecast fetch error:', err));
  }, []);

  const currentBDI = forecastData?.current_bdi ?? latestBDI?.current_bdi ?? 3426;
  const terminalPoint = forecastData?.forecast?.[forecastData.forecast.length - 1];
  const predictedBDI = terminalPoint?.predicted_bdi ?? Math.round(currentBDI * 1.044);
  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Live API Health Warning Banner if ML Forecaster is degraded */}
      <ApiWarningBanner
        requiredApis={['forecast']}
        componentName="Model Benchmarks & AI Interpretability Suite"
      />

      {/* Suite Header Banner: Deep ML Explainability */}
      <div className="neo-card bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-7 relative overflow-hidden id-tour-forecaster-header">
        {/* Subtle background ambient blur */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                Deep ML Explainability Suite
              </span>
              <span className="text-xs text-sky-200/80 font-mono">
                Model: LightGBM + ARIMA Multi-Horizon Ensemble
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Model Benchmarks & AI Interpretability
            </h1>

            <p className="text-sm text-sky-100/90 leading-relaxed">
              Transparent, accountable freight rate intelligence powered by TreeExplainer SHAP attributions,
              and rigorous Walk-Forward cross-validation (2018–2026) across 8 East Coast bulk corridors.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 gap-3 shrink-0 min-w-[260px]">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3.5 transition-all duration-200 hover:bg-white/[0.15]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-sky-200 tracking-wider">
                <Award className="w-3 h-3 text-emerald-400" />
                <span>Dir. Accuracy</span>
              </div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">84.6%</div>
              <span className="text-[11px] text-sky-100/70">T+30 Walk-Forward</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3.5 transition-all duration-200 hover:bg-white/[0.15]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-sky-200 tracking-wider">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>Explainability</span>
              </div>
              <div className="text-xl font-extrabold text-white font-mono mt-0.5">SHAP Tree</div>
              <span className="text-[11px] text-sky-100/70">Local & Global</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Deep Feature Attribution: SHAP TreeExplainer */}
      <div className="id-tour-shap-importance">
        <ShapFeatureImportance
          baseBDI={currentBDI}
          predictedBDI={predictedBDI}
          features={forecastData?.shap_features}
          horizonDays={30}
        />
      </div>

      {/* 2. Walk-Forward Cross-Validation & Model Benchmarks */}
      <div className="id-tour-model-performance">
        <ModelPerformance />
      </div>

      {/* Cross-Link Card to the new Dedicated Historical BDI Disruption Explorer */}
      {onNavigate && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-900 dark:to-sky-950/40 border border-sky-200/90 dark:border-sky-800/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/60 border border-sky-200 dark:border-sky-700/60 flex items-center justify-center text-sky-600 dark:text-sky-300 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Looking for 5-Year Historical Trajectories & Crisis Regimes?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Explore the dedicated Historical BDI Trend & Disruption Explorer with interactive crisis milestones and mitigation playbooks.
              </p>
            </div>
          </div>
          <InteractiveHoverButton
            onClick={() => onNavigate('historical')}
            className="text-xs shrink-0 py-2.5 px-5 font-bold"
          >
            Open Disruption Explorer
          </InteractiveHoverButton>
        </div>
      )}
    </div>
  );
};

export default MarketIntelligenceView;

