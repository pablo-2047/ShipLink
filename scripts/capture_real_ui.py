"""Script to capture real high-resolution screenshots and element crops
from the live ShipLink application running at http://localhost:5173.
"""

import os
import time
from playwright.sync_api import sync_playwright

OUTPUT_DIR = "scratch/real_ui_captures"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def main():
    print("=== CAPTURING REAL SHIPLINK APPLICATION UI ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1920x1080 viewport with 1.25 device scale factor for crisp Retina rendering
        page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1.25)
        
        print("Navigating to http://localhost:5173...")
        page.goto("http://localhost:5173")
        page.wait_for_timeout(3000)

        # ----------------------------------------------------
        # 1. TAB 1: COCKPIT (DASHBOARD)
        # ----------------------------------------------------
        print("\n--- 1. Capturing Cockpit (Dashboard) ---")
        page.locator("#tab-cockpit").click()
        page.wait_for_timeout(2000)
        
        # Full page
        page.screenshot(path=f"{OUTPUT_DIR}/01_cockpit_full.png", full_page=True)
        print("  [OK] Captured 01_cockpit_full.png")

        # Element crops
        hero = page.locator(".id-tour-hero-card")
        if hero.count() > 0:
            hero.first.screenshot(path=f"{OUTPUT_DIR}/01_cockpit_hero.png")
            print("  [OK] Captured 01_cockpit_hero.png")

        metrics_grid = page.locator(".id-tour-metrics-grid")
        if metrics_grid.count() > 0:
            metrics_grid.first.screenshot(path=f"{OUTPUT_DIR}/01_cockpit_kpis.png")
            print("  [OK] Captured 01_cockpit_kpis.png")

        forecast_chart = page.locator(".id-tour-forecast-chart")
        if forecast_chart.count() > 0:
            forecast_chart.first.screenshot(path=f"{OUTPUT_DIR}/01_cockpit_chart.png")
            print("  [OK] Captured 01_cockpit_chart.png")

        risk_alerts = page.locator(".id-tour-risk-alerts")
        if risk_alerts.count() > 0:
            risk_alerts.first.screenshot(path=f"{OUTPUT_DIR}/01_cockpit_alerts.png")
            print("  [OK] Captured 01_cockpit_alerts.png")

        # ----------------------------------------------------
        # 2. TAB 2: OPTIMIZER (CHARTER PLANNER)
        # ----------------------------------------------------
        print("\n--- 2. Capturing Charter Planner (Optimizer) ---")
        page.locator("#tab-optimizer").click()
        page.wait_for_timeout(1500)

        # Step 1: Cargo inputs
        page.screenshot(path=f"{OUTPUT_DIR}/02_optimizer_step1.png", full_page=True)
        print("  [OK] Captured 02_optimizer_step1.png")

        # Step 2: Physical draft feasibility & Hydrodynamic Hull Gauge
        step2_btn = page.locator(".id-step-btn-2")
        if step2_btn.count() > 0:
            step2_btn.first.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=f"{OUTPUT_DIR}/02_optimizer_step2.png", full_page=True)
            print("  [OK] Captured 02_optimizer_step2.png")

            # Crop Hull Gauge
            hull_gauge = page.locator(".id-tour-hull-gauge")
            if hull_gauge.count() > 0:
                hull_gauge.first.screenshot(path=f"{OUTPUT_DIR}/02_optimizer_hull_gauge.png")
                print("  [OK] Captured 02_optimizer_hull_gauge.png")

        # Step 3: Contract Comparator Matrix
        step3_btn = page.locator(".id-step-btn-3")
        if step3_btn.count() > 0:
            step3_btn.first.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=f"{OUTPUT_DIR}/02_optimizer_step3.png", full_page=True)
            print("  [OK] Captured 02_optimizer_step3.png")

            contracts = page.locator(".id-tour-contract-comparison")
            if contracts.count() > 0:
                contracts.first.screenshot(path=f"{OUTPUT_DIR}/02_optimizer_contracts.png")
                print("  [OK] Captured 02_optimizer_contracts.png")

        # ----------------------------------------------------
        # 3. TAB 3: FORECASTER (MARKET INTELLIGENCE)
        # ----------------------------------------------------
        print("\n--- 3. Capturing Freight Forecast (Explainable ML) ---")
        page.locator("#tab-forecaster").click()
        page.wait_for_timeout(2000)

        # Full page
        page.screenshot(path=f"{OUTPUT_DIR}/03_forecaster_full.png", full_page=True)
        print("  [OK] Captured 03_forecaster_full.png")

        # SHAP TreeExplainer
        shap = page.locator(".id-tour-shap-importance")
        if shap.count() > 0:
            shap.first.screenshot(path=f"{OUTPUT_DIR}/03_forecaster_shap.png")
            print("  [OK] Captured 03_forecaster_shap.png")

        # Model Performance Benchmarks
        benchmarks = page.locator(".id-tour-model-performance")
        if benchmarks.count() > 0:
            benchmarks.first.screenshot(path=f"{OUTPUT_DIR}/03_forecaster_benchmarks.png")
            print("  [OK] Captured 03_forecaster_benchmarks.png")

        # Historical Trend Explorer
        trend = page.locator(".id-tour-trend-explorer")
        if trend.count() > 0:
            trend.first.screenshot(path=f"{OUTPUT_DIR}/03_forecaster_trend.png")
            print("  [OK] Captured 03_forecaster_trend.png")

        # ----------------------------------------------------
        # 4. TAB 4: PORTS (COASTAL INTELLIGENCE)
        # ----------------------------------------------------
        print("\n--- 4. Capturing Port Congestion ---")
        page.locator("#tab-ports").click()
        page.wait_for_timeout(2000)

        # Subtab 1: Ports Grid
        page.screenshot(path=f"{OUTPUT_DIR}/04_ports_grid.png", full_page=True)
        print("  [OK] Captured 04_ports_grid.png")

        summary_bar = page.locator(".id-tour-ports-summary")
        if summary_bar.count() > 0:
            summary_bar.first.screenshot(path=f"{OUTPUT_DIR}/04_ports_summary.png")
            print("  [OK] Captured 04_ports_summary.png")

        # Subtab 2: Demurrage & Landed Cost Calculator
        calc_btn = page.locator(".id-subtab-ports-calc")
        if calc_btn.count() > 0:
            calc_btn.first.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=f"{OUTPUT_DIR}/04_ports_calc.png", full_page=True)
            print("  [OK] Captured 04_ports_calc.png")

        # Subtab 3: Port Matrix Table
        matrix_btn = page.locator(".id-subtab-ports-matrix")
        if matrix_btn.count() > 0:
            matrix_btn.first.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=f"{OUTPUT_DIR}/04_ports_matrix.png", full_page=True)
            print("  [OK] Captured 04_ports_matrix.png")

        # ----------------------------------------------------
        # 5. TAB 5: SIMULATOR (SCENARIO LAB)
        # ----------------------------------------------------
        print("\n--- 5. Capturing Scenario Lab (Stress-Testing Engine) ---")
        page.locator("#tab-simulator").click()
        page.wait_for_timeout(2000)

        # Click Red Sea / Cape Diversion preset
        preset_btn = page.locator("button:has-text('Red Sea')")
        if preset_btn.count() > 0:
            print("  -> Activating Red Sea / Cape Diversion preset shock...")
            preset_btn.first.click()
            page.wait_for_timeout(2500)

        # Full page under crisis shock
        page.screenshot(path=f"{OUTPUT_DIR}/05_simulator_full.png", full_page=True)
        print("  [OK] Captured 05_simulator_full.png")

        # Chart crop
        chart = page.locator(".id-tour-scenario-chart")
        if chart.count() > 0:
            chart.first.screenshot(path=f"{OUTPUT_DIR}/05_simulator_chart.png")
            print("  [OK] Captured 05_simulator_chart.png")

        # SOP Playbook crop
        sop = page.locator(".id-tour-contingency-playbook")
        if sop.count() > 0:
            sop.first.screenshot(path=f"{OUTPUT_DIR}/05_simulator_sop.png")
            print("  [OK] Captured 05_simulator_sop.png")

        browser.close()
        print("\nSUCCESS! All real UI pages and elements captured cleanly.")

if __name__ == "__main__":
    main()
