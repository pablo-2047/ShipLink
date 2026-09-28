from playwright.sync_api import sync_playwright

def test_full_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        # 1. Load landing page
        page.goto("http://localhost:5173", wait_until="networkidle")
        print("Page title:", page.title())
        assert page.locator("text=Predict Freight Volatility.").is_visible()
        print("Landing Hero verified!")

        # 2. Open auth modal
        page.locator("text=Sign In").first.click()
        page.wait_for_selector("text=Sign In to ShipLink")
        print("Auth modal opened!")

        # 3. Fill demo credentials
        page.locator("text=Fill Demo Credentials").click()

        # 4. Submit login
        page.locator("button[type='submit']").click()
        print("Clicked login submit button")

        # 5. Check dashboard is loaded
        logout_btn = page.wait_for_selector("button:has-text('Logout')", timeout=8000)
        print("Dashboard loaded successfully! Logout button found.")

        # 6. Click Logout button
        logout_btn.click()

        # 7. Check we are back to Hero Landing page
        page.wait_for_selector("text=Predict Freight Volatility.", timeout=8000)
        print("Logout successfully returned to Landing Hero Page!")

        browser.close()
        print("ALL TESTS PASSED!")

if __name__ == "__main__":
    test_full_flow()
