# Implementer 1 Dispatch

<original_task>
This is a single self-contained fix; keep it small and focused.

Working directory: c:/Users/Pablo/Desktop/SIH/frontend

Execute the following comprehensive UI/UX audit, content deduplication across all 5 suites, interactive hover micro-animations, prominent top-navigation styling, and UX report for the ShipLink maritime intelligence platform.

Requirements:
1. R1. UI Architecture Audit & Content Deduplication across DashboardView.tsx, CharterPlannerView.tsx, MarketIntelligenceView.tsx, IndiaTranslationLayer.tsx, ScenarioLabView.tsx:
   - Command Cockpit (DashboardView.tsx): Executive overview with Hero Strategy Banner, 4 KPI tiles, rate forecast preview, East Coast risk sentinel.
   - Charter Optimizer (CharterPlannerView.tsx): Dedicated solely to 3-step cargo chartering wizard (Cargo & Route -> Draft -> Contract options).
   - Rate Forecast & AI (MarketIntelligenceView.tsx): Dedicated strictly to deep ML explainability (SHAP feature attribution, Walk-Forward model performance metrics, and historical crisis trends). Remove duplicate HeadlineForecast card from this page so it doesn't collide with Cockpit.
   - East Coast Ports (IndiaTranslationLayer.tsx): Port-specific physical constraints, live vessel anchor queues, demurrage ₹ loss tracker, landed cargo cost calculator for the 8 major East Coast hubs.
   - Crisis Simulator (ScenarioLabView.tsx): Geopolitical and macroeconomic shock simulations with radar sweep. Remove duplicate RiskAlertPanel currently placed under the radar so it doesn't duplicate Cockpit.
2. R2. Navigation & Header Prominence:
   - Revamp Header.tsx tabs: larger text (text-sm font-bold), larger icons, more padding, distinctive active pill styling with high-contrast active state and subtle glow/border.
3. R3. Hover Animations & Micro-Interactions:
   - Add fluid card hover elevations (translate-y-[-2px], soft shadows), button press feedback, smooth badge/pill hover transitions across components and styles (index.css / App.css / Tailwind).
4. R4. Comprehensive UX Audit Report:
   - Write UX_AUDIT_REPORT.md at c:/Users/Pablo/Desktop/SIH/UX_AUDIT_REPORT.md assessing UX hierarchy, cognitive load, user journeys, alignment with SIH 2026 problem statement, and actionable suggestions.
5. Quality & Verification:
   - Ensure `npm run build` in `c:/Users/Pablo/Desktop/SIH/frontend` succeeds with 0 errors.
</original_task>

<additional_context>
Working directory for this agent: c:/Users/Pablo/Desktop/SIH/.agents/implementer_1
Frontend workspace: c:/Users/Pablo/Desktop/SIH/frontend
Project root: c:/Users/Pablo/Desktop/SIH

Context from prior attempt:
A previous attempt was interrupted by a network glitch. The prior run made progress:
- UX_AUDIT_REPORT.md exists at c:/Users/Pablo/Desktop/SIH/UX_AUDIT_REPORT.md.
- Several components in frontend/src/components/dashboard/ were updated.
Inspect the current code and git status/diff, complete all remaining requirements according to the task, run `npm run build` in frontend/ with 0 errors, and provide a full handoff report with verification details.
</additional_context>
