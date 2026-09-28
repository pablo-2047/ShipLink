import os
import time
from playwright.sync_api import sync_playwright

output_dir = r"C:\Users\Pablo\.gemini\antigravity\brain\0ada25e9-fa8f-44eb-bf13-7e4f615e35b6"
os.makedirs(output_dir, exist_ok=True)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("Navigating to http://localhost:5173 ...")
        page.goto("http://localhost:5173", wait_until="networkidle")
        time.sleep(1)

        # 1. Login via modal
        page.locator("text='Sign In'").first.click()
        page.wait_for_selector("text='Sign In to ShipLink'")
        page.locator("text='Fill Demo Credentials'").click()
        page.locator("button[type='submit']").click()
        
        # Wait for dashboard to load
        page.wait_for_selector("text='Command Suites'", timeout=10000)
        print("Logged in successfully! Sidebar visible.")

        # Screenshot 1: Dashboard with Left Sidebar (Active Dashboard Tile in Blue)
        path_dash_sidebar = os.path.join(output_dir, "sidebar_dashboard_blue.png")
        page.screenshot(path=path_dash_sidebar)
        print(f"Captured: {path_dash_sidebar}")

        # Hover over Tour button to verify hover animation
        tour_btn = page.locator(".id-tour-btn").first
        if tour_btn.is_visible():
            tour_btn.hover()
            time.sleep(0.4)
            path_tour_hover = os.path.join(output_dir, "header_tour_hover.png")
            page.screenshot(path=path_tour_hover)
            print(f"Captured: {path_tour_hover}")

        # Screenshot 2: Click Historical BDI Trend & Disruptions tile
        hist_tile = page.locator("button[id='sidebar-tab-historical']").first
        hist_tile.click()
        time.sleep(1)
        page.wait_for_selector("text='Historical BDI Trend & Disruption Explorer'", timeout=8000)
        print("Navigated to Historical BDI Trend & Disruption Explorer!")
        
        path_historical = os.path.join(output_dir, "historical_disruptions_page.png")
        page.screenshot(path=path_historical)
        print(f"Captured: {path_historical}")

        # Screenshot 3: Click Freight Forecast tile
        forecast_tile = page.locator("button[id='sidebar-tab-forecaster']").first
        forecast_tile.click()
        time.sleep(1)
        page.wait_for_selector("text='Deep ML Explainability Suite'", timeout=8000)
        print("Navigated to Freight Forecast (SHAP & Model Benchmarks)!")

        path_forecast = os.path.join(output_dir, "freight_forecast_split_page.png")
        page.screenshot(path=path_forecast)
        print(f"Captured: {path_forecast}")

        # Screenshot 4: Collapse the sidebar
        toggle_collapse_btn = page.locator("button[title='Collapse Sidebar']").first
        if toggle_collapse_btn.is_visible():
            toggle_collapse_btn.click()
            time.sleep(0.5)
            path_collapsed = os.path.join(output_dir, "sidebar_collapsed_mode.png")
            page.screenshot(path=path_collapsed)
            print(f"Captured: {path_collapsed}")

        # Screenshot 5: Toggle to Dark Mode
        theme_btn = page.locator("button[aria-label='Toggle theme']").first
        if theme_btn.is_visible():
            theme_btn.click()
            time.sleep(0.6)
            path_dark_sidebar = os.path.join(output_dir, "sidebar_dark_mode.png")
            page.screenshot(path=path_dark_sidebar)
            print(f"Captured: {path_dark_sidebar}")

        browser.close()
        print("All sidebar and multi-page visual checks completed successfully!")

if __name__ == "__main__":
    run()
