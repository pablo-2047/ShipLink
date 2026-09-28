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

        # 1. Landing Light
        landing_light_path = os.path.join(output_dir, "landing_light.png")
        page.screenshot(path=landing_light_path)
        print(f"Captured: {landing_light_path}")

        # Hover over interactive hover button
        get_started_btn = page.locator("text='Get Started'").first
        if get_started_btn.is_visible():
            get_started_btn.hover()
            time.sleep(0.5)
            hover_path = os.path.join(output_dir, "landing_button_hover.png")
            page.screenshot(path=hover_path)
            print(f"Captured: {hover_path}")

        # 2. Toggle Theme to Dark
        theme_toggle_btn = page.locator("button[aria-label='Toggle theme']").first
        if theme_toggle_btn.is_visible():
            theme_toggle_btn.click()
            time.sleep(0.8)
            landing_dark_path = os.path.join(output_dir, "landing_dark.png")
            page.screenshot(path=landing_dark_path)
            print(f"Captured: {landing_dark_path}")

        # 3. Open Auth Modal
        sign_in_nav = page.locator("text='Sign In'").first
        if sign_in_nav.is_visible():
            sign_in_nav.click()
            time.sleep(0.5)
            auth_dark_path = os.path.join(output_dir, "auth_modal_dark.png")
            page.screenshot(path=auth_dark_path)
            print(f"Captured: {auth_dark_path}")

            # Fill Demo Credentials and Login
            fill_demo_btn = page.locator("text='Fill Demo Credentials'").first
            if fill_demo_btn.is_visible():
                fill_demo_btn.click()
                time.sleep(0.3)

            # Click Sign in submit
            submit_btn = page.locator("button[type='submit']").first
            submit_btn.click()
            time.sleep(1.5)

        # 4. In Cockpit Dashboard (Dark)
        dashboard_dark_path = os.path.join(output_dir, "dashboard_dark.png")
        page.screenshot(path=dashboard_dark_path)
        print(f"Captured: {dashboard_dark_path}")

        # 5. Toggle Dashboard to Light
        dash_toggle_btn = page.locator("button[aria-label='Toggle theme']").first
        if dash_toggle_btn.is_visible():
            dash_toggle_btn.click()
            time.sleep(0.8)
            dashboard_light_path = os.path.join(output_dir, "dashboard_light.png")
            page.screenshot(path=dashboard_light_path)
            print(f"Captured: {dashboard_light_path}")

        browser.close()
        print("Visual verification completed successfully!")

if __name__ == "__main__":
    run()
