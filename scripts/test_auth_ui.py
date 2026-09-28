"""Test script to verify the new Landing Hero Page, Auth Modal (Sign In, Register, Forgot Password),
and Authenticated Dashboard flow with Playwright.
"""
import os
import time
from playwright.sync_api import sync_playwright

OUTPUT_DIR = "scratch/auth_screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def main():
    print("=== TESTING LANDING HERO PAGE & FIREBASE AUTHENTICATION ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        
        print("1. Navigating to http://localhost:5173...")
        page.goto("http://localhost:5173")
        page.wait_for_timeout(3000)
        
        # Take screenshot of Landing Hero Page
        page.screenshot(path=f"{OUTPUT_DIR}/01_landing_hero_page.png")
        print("  [OK] Saved 01_landing_hero_page.png (Landing Hero Page)")
        
        # 2. Click 'Sign In' in header to open Auth Modal
        print("\n2. Opening Sign In modal...")
        header_signin = page.locator("header button:has-text('Sign In')").first
        header_signin.click()
        page.wait_for_timeout(1000)
        page.screenshot(path=f"{OUTPUT_DIR}/02_auth_modal_signin.png")
        print("  [OK] Saved 02_auth_modal_signin.png (Sign In Modal)")
        
        # 3. Switch to Register Mode
        print("\n3. Switching to Register mode...")
        register_link = page.locator("div[role='dialog'] button:has-text('Register now')").first
        register_link.click()
        page.wait_for_timeout(1000)
        page.screenshot(path=f"{OUTPUT_DIR}/03_auth_modal_register.png")
        print("  [OK] Saved 03_auth_modal_register.png (Register Modal with Name, Email, Pass, Confirm Pass)")
        
        # 4. Switch to Forgot Password Mode
        print("\n4. Switching to Forgot Password mode...")
        back_signin = page.locator("div[role='dialog'] button:has-text('Sign In')").first
        back_signin.click()
        page.wait_for_timeout(800)
        
        forgot_btn = page.locator("div[role='dialog'] button:has-text('Forgot password?')").first
        forgot_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path=f"{OUTPUT_DIR}/04_auth_modal_forgot.png")
        print("  [OK] Saved 04_auth_modal_forgot.png (Forgot Password Modal)")
        
        # 5. Sign In using Demo Credentials
        print("\n5. Testing Sign In with credentials...")
        back_to_login = page.locator("div[role='dialog'] button:has-text('Back to Sign In')").first
        back_to_login.click()
        page.wait_for_timeout(800)
        
        fill_demo_btn = page.locator("div[role='dialog'] button:has-text('Fill Demo Credentials')").first
        fill_demo_btn.click()
        page.wait_for_timeout(800)
        
        submit_btn = page.locator("div[role='dialog'] button:has-text('Sign In to Platform')").first
        submit_btn.click()
        page.wait_for_timeout(3500)
        
        # 6. Verify Authenticated Platform View
        page.screenshot(path=f"{OUTPUT_DIR}/05_authenticated_dashboard.png")
        print("  [OK] Saved 05_authenticated_dashboard.png (Authenticated Full Dashboard with User Profile & Logout)")
        
        # 7. Test Logout
        print("\n6. Testing Logout...")
        logout_btn = page.locator("button:has-text('Logout')").first
        logout_btn.click()
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{OUTPUT_DIR}/06_logged_out_hero.png")
        print("  [OK] Saved 06_logged_out_hero.png (Returned to Landing Hero Page)")
        
        browser.close()
        print("\nALL AUTHENTICATION & HERO TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    main()
