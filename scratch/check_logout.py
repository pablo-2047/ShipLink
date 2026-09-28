from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1366, 'height': 768})
    page.goto('http://localhost:5173')
    page.wait_for_timeout(1500)
    
    # Sign In
    page.locator("button:has-text('Sign In')").first.click()
    page.wait_for_timeout(500)
    page.locator("button:has-text('Fill Demo Credentials')").first.click()
    page.wait_for_timeout(500)
    page.locator("button:has-text('Sign In to Platform')").first.click()
    page.wait_for_timeout(2500)
    
    logout_btn = page.locator("button:has-text('Logout')").first
    print(f"Viewport 1366x768: Logout button is_visible: {logout_btn.is_visible()}")
    box = logout_btn.bounding_box()
    print(f"Bounding box: {box}")
    
    try:
        # Standard user click at screen coordinates
        logout_btn.click(timeout=3000)
        print("Click succeeded!")
    except Exception as e:
        print(f"Click FAILED as expected: {e}")
        
    browser.close()
