import json
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\Pablo\.gemini\antigravity\brain\0ada25e9-fa8f-44eb-bf13-7e4f615e35b6"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. Initialize session in localStorage
        page.goto("http://localhost:5173")
        page.evaluate("""() => {
            localStorage.setItem('shiplink_active_session', JSON.stringify({
                uid: 'sih-evaluator',
                email: 'evaluator@shipping.gov.in',
                displayName: 'Capt. R. Sharma'
            }));
            localStorage.setItem('shiplink_sidebar_collapsed', 'false');
        }""")
        page.reload()
        page.wait_for_timeout(3000)

        # Screenshot 1: Dashboard with updated Sidebar (API Health Sentinel)
        page.screenshot(path=f"{ARTIFACT_DIR}/sidebar_api_health_sentinel.png")
        print("Captured sidebar_api_health_sentinel.png")

        # Screenshot 2: Historical BDI Trend & Disruption Explorer (click event and verify in-place consequence box)
        page.click("#sidebar-tab-historical")
        page.wait_for_timeout(2000)
        
        # Click on "View Consequences" or card for Red Sea or Remal
        card = page.locator("text=View Consequences").first
        if card.is_visible():
            card.click()
            page.wait_for_timeout(1000)

        page.screenshot(path=f"{ARTIFACT_DIR}/historical_inplace_consequence_box.png")
        print("Captured historical_inplace_consequence_box.png")

        # Screenshot 3: Freight Forecast & SHAP 3-Pillar Executive Guide
        page.click("#sidebar-tab-forecaster")
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{ARTIFACT_DIR}/freight_forecast_shap_guide.png")
        print("Captured freight_forecast_shap_guide.png")

        browser.close()

if __name__ == "__main__":
    run()
