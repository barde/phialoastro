from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:4322/classes")
    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()
