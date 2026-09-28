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

        # 1. Capture updated landing page in Light mode
        landing_light_path = os.path.join(output_dir, "landing_updated_light.png")
        page.screenshot(path=landing_light_path)
        print(f"Captured: {landing_light_path}")

        # 2. Toggle to Dark mode
        theme_btn = page.locator("button[aria-label='Toggle theme']").first
        if theme_btn.is_visible():
            theme_btn.click()
            time.sleep(0.8)
            landing_dark_path = os.path.join(output_dir, "landing_updated_dark.png")
            page.screenshot(path=landing_dark_path)
            print(f"Captured: {landing_dark_path}")

        browser.close()
        print("Landing visual verification completed successfully!")

if __name__ == "__main__":
    run()
