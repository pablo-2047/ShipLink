import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export type PageTabId = 'cockpit' | 'optimizer' | 'forecaster' | 'historical' | 'ports' | 'simulator';

export interface TourConfig {
  activeTab: PageTabId;
  onNavigateTab: (tab: PageTabId) => void;
  onComplete?: () => void;
}

/**
 * Detailed step definitions for every card across each page of ShipLink.
 */
export const PAGE_TOUR_STEPS: Record<PageTabId, { pageTitle: string; steps: DriveStep[] }> = {
  cockpit: {
    pageTitle: 'Executive Dashboard (Cockpit)',
    steps: [
      {
        element: '.id-bdi-ticker',
        popover: {
          title: '⚓ Live Baltic Dry Index (BDI) Telemetry',
          description:
            'The global thermometer for dry bulk shipping rates. Tracks real-time physical index points and 24-hour market movements. High BDI means elevated charter costs; low BDI indicates cheaper tonnage.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '.id-tour-hero-card',
        popover: {
          title: '🎯 Strategic Recommendation Banner',
          description:
            'Synthesizes multi-horizon machine learning forecasts and live port queues to deliver high-impact executive fixtures. Shows net projected savings in ₹ Crores (~$ USD) by locking forward charters now and rerouting to optimal deepwater berths.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '.id-tour-metrics-grid',
        popover: {
          title: '📊 Executive KPI Metric Tiles',
          description:
            'Four vital operational pulses: (1) Current Spot BDI, (2) 30-Day Forward Target with P10–P90 volatility boundaries, (3) Live 7-second rotating East Coast port waiting queue, and (4) Demurrage loss risk per voyage.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '.id-tour-market-signal',
        popover: {
          title: '💡 Optimal Market Entry Signal',
          description:
            'Clear operational action: ENTER NOW vs WAIT / DEFER. Displays rate velocity (pts/day), optimal charter booking window (e.g. 1–3 days), and estimated cost advantage in ₹ Lakhs.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '.id-tour-forecast-chart',
        popover: {
          title: '📈 Multi-Horizon BDI Trajectory & Volatility Cone',
          description:
            'Interactive forward curve powered by LightGBM and ARIMA. Select 7, 14, 30, or 60-day horizons. The shaded violet envelope represents the 80% empirical Gaussian confidence band (10th–90th percentile).',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '.id-tour-forecast-metrics',
        popover: {
          title: '🔬 Terminal Machine Learning Metrics',
          description:
            'Key quantitative outputs: (1) Target Forecast BDI points, (2) 10th–90th Percentile Volatility Band span, (3) Trend Slope velocity, and (4) Cross-validated Directional Accuracy % hit-rate.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '.id-tour-risk-alerts',
        popover: {
          title: '🚨 Live Port & Coastal Risk Alerts',
          description:
            'Real-time sentinel integrating GDACS satellite cyclone monitoring, Open-Meteo hourly wave heights, and Port Trust operational bulletins. Weather shocks automatically recalculate berth waiting times and demurrage penalties.',
          side: 'left',
          align: 'start',
        },
      },
    ],
  },

  optimizer: {
    pageTitle: 'Charter Planner & Route Optimizer',
    steps: [
      {
        element: '.id-tour-cargo-inputs',
        popover: {
          title: '📦 Cargo & Route Specification',
          description:
            'Define your consignment parameters: commodity type (Thermal Coal, Coking Coal, Iron Ore, Limestone), total parcel tonnage (MT), loading origin port, and Indian East Coast discharge berth.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '.id-tour-hull-gauge',
        popover: {
          title: '📐 Hydrodynamic Ship Hull & Draft Clearance Gauge',
          description:
            'Interactive cross-section comparing vessel laden draft against the destination port berth depth. Dynamically computes Under Keel Clearance (UKC) to prevent vessel groundings.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '.id-tour-vessel-selection',
        popover: {
          title: '🚢 Vessel Class Feasibility & Selection',
          description:
            'Evaluates Capesize (180k DWT), Newcastlemax (205k DWT), Panamax (75k DWT), and Supramax (58k DWT). Automatically flags draft restrictions, required voyages, and crane gear requirements.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '.id-tour-port-feasibility',
        popover: {
          title: '🏗️ Port Infrastructure & Draft Analysis',
          description:
            'Checks navigation channel limits, maximum LOA (Length Overall), beam restrictions, and tidal locks. Warns if offshore lighterage (Ship-to-Ship transfer at Sandheads) is required.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '.id-tour-contract-comparison',
        popover: {
          title: '💰 Contract Strategy & Landed Cost Comparison',
          description:
            'Side-by-side financial matrix comparing Spot Market Voyage Charter vs Forward Freight Agreement (FFA) vs Period Time Charter. Computes total landed cost per metric ton (₹/MT) including fuel and demurrage.',
          side: 'top',
          align: 'center',
        },
      },
    ],
  },

  forecaster: {
    pageTitle: 'Rate Forecast & AI Interpretability',
    steps: [
      {
        element: '.id-tour-forecaster-header',
        popover: {
          title: '🧠 Deep ML Explainability Suite',
          description:
            'Transparent, accountable AI forecasting combining LightGBM gradient boosted trees with time-series ARIMA and residual quantile regression across 7, 14, 30, and 60-day horizons.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '.id-tour-shap-importance',
        popover: {
          title: '🔍 SHAP TreeExplainer Feature Attributions',
          description:
            'Quantifies exact mathematical drivers behind the rate forecast. Uncovers how much bunker fuel prices ($/MT), 14-day BDI lags, USD/INR forex rates, and port queue delays influence forward pricing.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '.id-tour-model-performance',
        popover: {
          title: '🏆 Walk-Forward Cross-Validation Benchmarks',
          description:
            'Comprehensive backtesting validation (2018–2026). Tracks Mean Absolute Error (MAE), Directional Accuracy % (market movement sign hit rate), and Weighted Absolute Percentage Error (WAPE).',
          side: 'top',
          align: 'center',
        },
      },
    ],
  },

  historical: {
    pageTitle: 'Historical BDI Trend & Disruption Explorer',
    steps: [
      {
        element: '.id-tour-historical-header',
        popover: {
          title: '📜 Macro Volatility & Disruption Intelligence',
          description:
            'Analyzes 5 years of Baltic Dry Index cyclicality across 32 major geopolitical shocks, canal chokepoints, and coastal cyclones.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '.id-tour-trend-explorer',
        popover: {
          title: '📈 Interactive BDI Trajectory & Crisis Regimes',
          description:
            'Interactive chart with milestone markers. Click any crisis event to review real-time freight consequences, demurrage spikes, and tactical mitigation playbooks.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '#disruption-consequence-inspector',
        popover: {
          title: '🚨 In-Place Consequence & Mitigation Inspector',
          description:
            'Click any crisis milestone on the chart or cards below to inspect operational impacts, shipping market rate consequences, and standard charterer mitigation playbooks directly on the page.',
          side: 'bottom',
          align: 'center',
        },
      },
    ],
  },

  ports: {
    pageTitle: 'Port Congestion & Coastal Intelligence',
    steps: [
      {
        element: '.id-tour-ports-summary',
        popover: {
          title: '🌐 East Coast Maritime Corridor Summary',
          description:
            'Aggregated operational intelligence across all 8 monitored terminals: total waiting bulkers, weighted average turnaround delay, and cumulative demurrage loss exposure across the corridor.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '.id-tour-ports-grid',
        popover: {
          title: '⚓ 8 Bulk Terminal Queue Cards',
          description:
            'Live AIS anchorage counts, average waiting hours, max safe drafts, and berth capacities for Paradip, Visakhapatnam Outer/Inner, Gangavaram, Dhamra, Gopalpur, Haldia, and Sandheads.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '.id-tour-ports-calculator',
        popover: {
          title: '🧮 Demurrage Risk & Rate Sensitivity Calculator',
          description:
            'Interactive calculator translating Baltic Dry Index point movements and port waiting delays into approximate daily charter hire changes (USD/day and ₹ Lakhs/day) for Capesize and Panamax ships.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '.id-tour-ports-matrix',
        popover: {
          title: '📋 Comprehensive East Coast Port Matrix',
          description:
            'Comparative operational table across all 8 hubs: maximum drafts, LOA limits, AIS anchorage queues, demurrage risk exposure, and local maritime weather warnings.',
          side: 'top',
          align: 'center',
        },
      },
    ],
  },

  simulator: {
    pageTitle: 'Scenario Lab & Crisis Stress-Testing',
    steps: [
      {
        element: '.id-tour-scenario-presets',
        popover: {
          title: '🌪️ Crisis Stress-Testing Presets',
          description:
            'One-click macro crisis simulations: Bay of Bengal Severe Cyclone, Red Sea / Suez Canal Detour (+14 days sailing via Cape of Good Hope), and Global Bunker Fuel Price Spikes.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '.id-tour-scenario-sliders',
        popover: {
          title: '🎛️ Interactive Macro Parameter Sliders',
          description:
            'Fine-tune economic variables: adjust crude oil ($/bbl), VLSFO bunker fuel ($/MT), USD/INR currency exchange rates, and port throughput disruption percentages to observe custom freight impacts.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '.id-tour-scenario-chart',
        popover: {
          title: '📈 30-Day Simulated Trajectory vs Baseline',
          description:
            'Interactive forward projection curve modeling market rate divergence over 30 days. Dynamically updates Baltic Dry Index curves, daily charter variances, and cumulative voyage financial impacts in ₹ INR and $ USD.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '.id-tour-contingency-playbook',
        popover: {
          title: '🛡️ Crisis Contingency SOP Playbook',
          description:
            'Automated Standard Operating Procedures for emergency rerouting: tidal suspension protocols at Haldia, STS shutdown at Sandheads during swell >2.5m, and deepwater diversions to Gangavaram.',
          side: 'left',
          align: 'start',
        },
      },
    ],
  },
};

/**
 * Launch the guided tour for the specified page tab.
 */
export function startGuidedTour(config: TourConfig): void {
  const { activeTab, onNavigateTab, onComplete } = config;
  const pageData = PAGE_TOUR_STEPS[activeTab];
  if (!pageData) return;

  const validSteps: DriveStep[] = [...pageData.steps];

  // Add next-page transition step across all 6 operational suites
  const tabsOrder: PageTabId[] = ['cockpit', 'optimizer', 'historical', 'ports', 'simulator', 'forecaster'];
  const currentIdx = tabsOrder.indexOf(activeTab);
  const nextTab = currentIdx !== -1 && currentIdx < tabsOrder.length - 1 ? tabsOrder[currentIdx + 1] : null;

  if (nextTab) {
    const nextTitle = PAGE_TOUR_STEPS[nextTab].pageTitle;
    validSteps.push({
      element: `#sidebar-tab-${nextTab}`,
      popover: {
        title: '➡️ Next Operational Suite Available',
        description: `You have completed the walkthrough for <strong>${pageData.pageTitle}</strong>! Ready to explore <strong>${nextTitle}</strong>? Click below to proceed to the next module.`,
        side: 'right',
        align: 'center',
      },
    });
  }

  let refreshTimer: number | null = null;
  const handleResize = () => {
    if (!driverObj.isActive()) return;
    if (refreshTimer && typeof window !== 'undefined') window.clearTimeout(refreshTimer);
    if (typeof window !== 'undefined') {
      refreshTimer = window.setTimeout(() => {
        if (driverObj.isActive()) driverObj.refresh();
      }, 150);
    }
  };

  const driverObj = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    waitForElement: 1200,
    nextBtnText: 'Next Card ➔',
    prevBtnText: '⬅ Previous',
    doneBtnText: nextTab ? 'Next Page ➔' : 'Finish Tour 🎉',
    onHighlightStarted: (_element, step, { driver }) => {
      const elSelector = typeof step.element === 'string' ? step.element : '';

      // Auto-switch steps in Vessel Optimizer
      if (elSelector.includes('hull-gauge') || elSelector.includes('port-feasibility')) {
        const step2Btn = document.querySelector<HTMLButtonElement>('.id-step-btn-2');
        if (step2Btn) {
          step2Btn.click();
          setTimeout(() => driver.refresh(), 100);
        }
      } else if (elSelector.includes('contract-comparison')) {
        const step3Btn = document.querySelector<HTMLButtonElement>('.id-step-btn-3');
        if (step3Btn) {
          step3Btn.click();
          setTimeout(() => driver.refresh(), 100);
        }
      } else if (elSelector.includes('cargo-inputs') || elSelector.includes('vessel-selection')) {
        const step1Btn = document.querySelector<HTMLButtonElement>('.id-step-btn-1');
        if (step1Btn) {
          step1Btn.click();
          setTimeout(() => driver.refresh(), 100);
        }
      }

      // Auto-switch sub-tabs in Port Congestion
      if (elSelector.includes('ports-calculator')) {
        const calcTab = document.querySelector<HTMLButtonElement>('.id-subtab-ports-calc');
        if (calcTab) {
          calcTab.click();
          setTimeout(() => driver.refresh(), 100);
        }
      } else if (elSelector.includes('ports-matrix')) {
        const matrixTab = document.querySelector<HTMLButtonElement>('.id-subtab-ports-matrix');
        if (matrixTab) {
          matrixTab.click();
          setTimeout(() => driver.refresh(), 100);
        }
      } else if (elSelector.includes('ports-grid') || elSelector.includes('ports-summary')) {
        const gridTab = document.querySelector<HTMLButtonElement>('.id-subtab-ports-grid');
        if (gridTab) {
          gridTab.click();
          setTimeout(() => driver.refresh(), 100);
        }
      }
    },
    onDestroyed: () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        if (refreshTimer) window.clearTimeout(refreshTimer);
      }
      // If user finished last step and nextTab exists, switch tab and start next tour
      if (driverObj.isLastStep() && nextTab) {
        onNavigateTab(nextTab);
        setTimeout(() => {
          startGuidedTour({
            activeTab: nextTab,
            onNavigateTab,
            onComplete,
          });
        }, 400);
      } else if (onComplete) {
        onComplete();
      }
    },
    steps: validSteps,
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
  }

  driverObj.drive();
}