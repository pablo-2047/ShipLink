import os
from playwright.sync_api import sync_playwright

os.makedirs("scratch/header_tests_fixed", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in [1024, 1280, 1366, 1440, 1536, 1920]:
        page = browser.new_page(viewport={'width': width, 'height': 800})
        page.goto('http://localhost:5173')
        page.wait_for_timeout(1500)
        
        # Click Sign in
        page.locator("button:has-text('Sign In')").first.click()
        page.wait_for_timeout(500)
        page.locator("button:has-text('Fill Demo Credentials')").first.click()
        page.wait_for_timeout(500)
        page.locator("button:has-text('Sign In to Platform')").first.click()
        page.wait_for_timeout(2500)
        
        logout_btn = page.locator("button:has-text('Logout')").first
        box = logout_btn.bounding_box()
        inner_w = page.evaluate("window.innerWidth")
        header_w = page.evaluate("document.querySelector('header').scrollWidth")
        header_div_w = page.evaluate("document.querySelector('header > div').scrollWidth")
        body_scroll_w = page.evaluate("document.body.scrollWidth")
        
        is_in_viewport = box and (box['x'] + box['width'] <= width)
        print(f"Viewport {width}px: inner={inner_w} | header_scroll={header_w} | body_scroll={body_scroll_w} | Logout box={box} | In viewport: {is_in_viewport}")
        
        page.screenshot(path=f"scratch/header_tests_fixed/header_{width}.png")
        
        # Click Logout to verify functionality in each viewport!
        logout_btn.click()
        page.wait_for_timeout(1000)
        is_logged_out = page.locator("h1:has-text('Predict Freight Volatility')").count() > 0
        print(f"  -> Logout clicked! Successfully returned to Landing Hero: {is_logged_out}")
            
    browser.close()
